"""Read-only Windows preflight. No elevation, input injection or game-memory access."""
import ctypes
from ctypes import wintypes
import os


def process_permissions(pid):
    if os.name!='nt':
        raise OSError('Le module demande Windows')
    kernel=ctypes.WinDLL('kernel32',use_last_error=True)
    advapi=ctypes.WinDLL('advapi32',use_last_error=True)
    kernel.OpenProcess.argtypes=[wintypes.DWORD,wintypes.BOOL,wintypes.DWORD]
    kernel.OpenProcess.restype=wintypes.HANDLE
    kernel.CloseHandle.argtypes=[wintypes.HANDLE]
    advapi.OpenProcessToken.argtypes=[wintypes.HANDLE,wintypes.DWORD,ctypes.POINTER(wintypes.HANDLE)]
    advapi.GetTokenInformation.argtypes=[wintypes.HANDLE,ctypes.c_int,wintypes.LPVOID,wintypes.DWORD,ctypes.POINTER(wintypes.DWORD)]
    advapi.GetSidSubAuthorityCount.argtypes=[wintypes.LPVOID]
    advapi.GetSidSubAuthorityCount.restype=ctypes.POINTER(ctypes.c_ubyte)
    advapi.GetSidSubAuthority.argtypes=[wintypes.LPVOID,wintypes.DWORD]
    advapi.GetSidSubAuthority.restype=ctypes.POINTER(wintypes.DWORD)
    process=kernel.OpenProcess(0x1000,False,pid)  # PROCESS_QUERY_LIMITED_INFORMATION
    if not process:
        raise ctypes.WinError(ctypes.get_last_error())
    token=wintypes.HANDLE()
    try:
        if not advapi.OpenProcessToken(process,0x0008,ctypes.byref(token)):  # TOKEN_QUERY
            raise ctypes.WinError(ctypes.get_last_error())
        elevated=wintypes.DWORD();size=wintypes.DWORD()
        if not advapi.GetTokenInformation(token,20,ctypes.byref(elevated),ctypes.sizeof(elevated),ctypes.byref(size)):
            raise ctypes.WinError(ctypes.get_last_error())
        size=wintypes.DWORD()
        advapi.GetTokenInformation(token,25,None,0,ctypes.byref(size))  # TokenIntegrityLevel
        if not size.value:
            raise ctypes.WinError(ctypes.get_last_error())
        buffer=ctypes.create_string_buffer(size.value)
        if not advapi.GetTokenInformation(token,25,buffer,size.value,ctypes.byref(size)):
            raise ctypes.WinError(ctypes.get_last_error())
        sid=ctypes.cast(buffer,ctypes.POINTER(wintypes.LPVOID))[0]
        count=advapi.GetSidSubAuthorityCount(sid)[0]
        if not count:raise OSError('Niveau d’intégrité Windows absent')
        integrity=advapi.GetSidSubAuthority(sid,count-1)[0]
        return {'elevated':bool(elevated.value),'integrityLevel':integrity}
    finally:
        if token:kernel.CloseHandle(token)
        kernel.CloseHandle(process)


def preflight(game_pid):
    scanner=process_permissions(os.getpid())
    game=process_permissions(game_pid)
    # Passing this single prerequisite does not attest that game input works.
    return {'scanner':scanner,'game':game,
            'blockedByIntegrity':scanner['integrityLevel']<game['integrityLevel']}


if __name__=='__main__':
    import json,sys
    print(json.dumps(preflight(int(sys.argv[1]))))
