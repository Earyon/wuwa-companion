param(
    [Parameter(Mandatory=$true)][string]$ImagePath,
    [string]$Language='fr-FR',
    [Parameter(Mandatory=$true)][string]$OutputPath
)
# Offline feasibility probe. Reads an existing image; never captures or controls the game.
$ErrorActionPreference='Stop'
if ($PSVersionTable.PSEdition -eq 'Core') { throw 'This probe requires Windows PowerShell 5.1.' }
Add-Type -AssemblyName System.Runtime.WindowsRuntime
$null=[Windows.Storage.StorageFile,Windows.Storage,ContentType=WindowsRuntime]
$null=[Windows.Storage.Streams.IRandomAccessStream,Windows.Storage.Streams,ContentType=WindowsRuntime]
$null=[Windows.Graphics.Imaging.BitmapDecoder,Windows.Graphics.Imaging,ContentType=WindowsRuntime]
$null=[Windows.Graphics.Imaging.SoftwareBitmap,Windows.Graphics.Imaging,ContentType=WindowsRuntime]
$null=[Windows.Media.Ocr.OcrEngine,Windows.Foundation,ContentType=WindowsRuntime]
$null=[Windows.Media.Ocr.OcrResult,Windows.Foundation,ContentType=WindowsRuntime]
$null=[Windows.Globalization.Language,Windows.Globalization,ContentType=WindowsRuntime]
$taskAdapter=[System.WindowsRuntimeSystemExtensions].GetMethods() | Where-Object {
    $_.Name -eq 'AsTask' -and $_.IsGenericMethod -and $_.GetGenericArguments().Count -eq 1 -and
    $_.GetParameters().Count -eq 1 -and $_.GetParameters()[0].ParameterType.Name -eq 'IAsyncOperation`1'
} | Select-Object -First 1
function Wait-WinRt($Operation,[Type]$ResultType) {
    $pendingTask=$taskAdapter.MakeGenericMethod($ResultType).Invoke($null,@($Operation))
    if (-not $pendingTask.Wait(30000)) { $Operation.Cancel(); throw 'OCR operation timed out.' }
    return $pendingTask.Result
}
$inputFile=(Resolve-Path -LiteralPath $ImagePath).Path
$outputFile=[IO.Path]::GetFullPath($OutputPath)
if ($inputFile -eq $outputFile) { throw 'Output must differ from the source image.' }
if (Test-Path -LiteralPath $outputFile) { throw 'Output already exists; choose a new file.' }
$ocrLanguage=New-Object Windows.Globalization.Language -ArgumentList $Language
$engine=[Windows.Media.Ocr.OcrEngine]::TryCreateFromLanguage($ocrLanguage)
if ($null -eq $engine) { throw "OCR language is not installed: $Language" }
$file=Wait-WinRt ([Windows.Storage.StorageFile]::GetFileFromPathAsync($inputFile)) ([Windows.Storage.StorageFile])
$stream=$null
$bitmap=$null
try {
    $stream=Wait-WinRt ($file.OpenAsync([Windows.Storage.FileAccessMode]::Read)) ([Windows.Storage.Streams.IRandomAccessStream])
    $decoder=Wait-WinRt ([Windows.Graphics.Imaging.BitmapDecoder]::CreateAsync($stream)) ([Windows.Graphics.Imaging.BitmapDecoder])
    if ($decoder.PixelWidth -gt [Windows.Media.Ocr.OcrEngine]::MaxImageDimension -or
        $decoder.PixelHeight -gt [Windows.Media.Ocr.OcrEngine]::MaxImageDimension) { throw 'Image exceeds OCR size limit.' }
    $bitmap=Wait-WinRt ($decoder.GetSoftwareBitmapAsync()) ([Windows.Graphics.Imaging.SoftwareBitmap])
    $timer=[Diagnostics.Stopwatch]::StartNew()
    $result=Wait-WinRt ($engine.RecognizeAsync($bitmap)) ([Windows.Media.Ocr.OcrResult])
    $timer.Stop()
    $lines=@(foreach ($line in $result.Lines) {
        @{text=$line.Text;words=@(foreach ($word in $line.Words) {
            @{text=$word.Text;x=$word.BoundingRect.X;y=$word.BoundingRect.Y;width=$word.BoundingRect.Width;height=$word.BoundingRect.Height}
        })}
    })
    $report=@{format='wuwa-ocr-observation';version=1;engine='Windows.Media.Ocr';language=$engine.RecognizerLanguage.LanguageTag;
        image=[IO.Path]::GetFileName($inputFile);width=$decoder.PixelWidth;height=$decoder.PixelHeight;
        elapsedMs=$timer.ElapsedMilliseconds;lines=$lines}
    $json=$report | ConvertTo-Json -Depth 8
    $outputStream=[IO.File]::Open($outputFile,[IO.FileMode]::CreateNew,[IO.FileAccess]::Write)
    try {
        $bytes=(New-Object Text.UTF8Encoding($false)).GetBytes($json)
        $outputStream.Write($bytes,0,$bytes.Length)
    } finally { $outputStream.Dispose() }
    Write-Output ('OCR completed: {0} lines, {1} ms, {2}' -f $lines.Count,$timer.ElapsedMilliseconds,$engine.RecognizerLanguage.LanguageTag)
} finally {
    if ($null -ne $bitmap) { $bitmap.Dispose() }
    if ($null -ne $stream) { $stream.Dispose() }
}
