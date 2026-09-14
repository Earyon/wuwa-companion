"""Optional private-video benchmark. Network is denied during model loading and inference."""
import json
from pathlib import Path
import socket
import sys
import time
from PIL import Image

ROOT=Path(__file__).resolve().parents[1]
sys.path.insert(0,str(ROOT/'addon/windows'))
from recognition import Reader
from readers import Reference,character,weapon,skills,echo


def deny_network(*args,**kwargs):
    raise AssertionError('Offline OCR attempted network access')


if __name__=='__main__':
    refs=Reference(json.loads((ROOT/'test-results/addon-references.json').read_text(encoding='utf-8')))
    socket.create_connection=deny_network
    socket.socket.connect=deny_network
    socket.socket.connect_ex=deny_network
    started=time.monotonic()
    engine=Reader()
    startup_ms=round((time.monotonic()-started)*1000)
    cases=[
      ('detail-0004.00.png',character,(0,0,650,340),{'gameId':'1108','level':90,'ascension':6}),
      ('detail-0021.00.png',weapon,(1100,70,1724,450),{'gameId':'21020086','level':90,'ascension':6,'rank':5}),
      ('detail-0116.00.png',skills,(450,630,1724,1010),dict(zip(refs.data['skillTypes'],[6,6,6,9,6]))),
      ('detail-0096.13.png',echo,(1180,70,1724,550),{'gameId':'6000183','level':25,'cost':3,'quality':5,
        'main':{'type':'glacio','value':30},'secondary':{'type':'atk','value':100},
        'substats':[{'type':k,'value':v} for k,v in [('basic',8.6),('hp',510),('heavy',9.4),('energy',9.2),('critRate',6.9)]]})]
    report={'startupMs':startup_ms,'networkDenied':True,'cases':[]}
    for filename,parse,region,expected in cases:
        image=Image.open(ROOT/'test-results/video-reference'/filename).convert('RGB')
        timings=[]
        for box in [None,region]:
            observed=engine.read_echo(image) if parse is echo and box else engine.read(image,box)
            try:actual=parse(observed,refs)
            except Exception:
                (ROOT/'test-results/rapidocr-failed-observation.json').write_text(json.dumps(observed,ensure_ascii=False),encoding='utf-8')
                print('Failed reference:',filename,'region:',box,flush=True)
                raise
            assert actual==expected,(filename,box,actual,expected)
            timings.append(observed['elapsedMs'])
            print(filename,'full' if box is None else 'region',observed['elapsedMs'],'ms',flush=True)
        report['cases'].append({'image':filename,'fullMs':timings[0],'regionMs':timings[1],'passed':True})
    (ROOT/'test-results/rapidocr-reference-report.json').write_text(json.dumps(report,indent=2),encoding='utf-8')
    print(json.dumps(report,indent=2))
