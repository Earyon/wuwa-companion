"""Local CPU OCR. Models must be packaged; scanning never downloads anything."""
from pathlib import Path
import time
import numpy as np
import rapidocr
from rapidocr import RapidOCR


class Reader:
    def __init__(self, threads=2):
        if threads not in [1,2,3,4]:
            raise ValueError('Nombre de threads OCR invalide')
        models = Path(rapidocr.__file__).parent / 'models'
        names = {'Det': 'PP-OCRv6_det_small.onnx',
                 'Cls': 'ch_ppocr_mobile_v2.0_cls_mobile.onnx',
                 'Rec': 'PP-OCRv6_rec_small.onnx'}
        params = {'Global.log_level': 'warning',
                  'EngineConfig.onnxruntime.intra_op_num_threads': threads,
                  'EngineConfig.onnxruntime.inter_op_num_threads': 1}
        for kind, name in names.items():
            file = models / name
            if not file.is_file():
                raise RuntimeError('Modèle OCR absent du module : ' + name)
            params[kind + '.model_path'] = str(file)
        self.engine = RapidOCR(params=params)

    def read(self, image, region=None):
        width, height = image.size
        left, top, right, bottom = region or (0, 0, width, height)
        if not (0 <= left < right <= width and 0 <= top < bottom <= height):
            raise ValueError('Région de lecture hors image')
        start = time.monotonic()
        # RapidOCR accepts a PIL image and handles RGB/BGR conversion itself.
        result = self.engine(image.crop((left, top, right, bottom)), use_cls=False)
        lines = []
        if result.txts is not None:
            for text, score, box in zip(result.txts, result.scores, result.boxes):
                box = np.asarray(box) + np.array([left, top])
                lines.append({'text': text, 'confidence': float(score), 'box': box.tolist()})
        return {'width': width, 'height': height, 'elapsedMs': round((time.monotonic()-start)*1000), 'lines': lines}

    def read_echo(self, image):
        width,height=image.size
        scale=height/1080
        # Separate the item header from stat text. The decorative stat icons to
        # its left are not letters and must not reduce a label's OCR confidence.
        regions=[(width-544*scale,70*scale,width,219*scale),
                 (width-444*scale,219*scale,width,495*scale)]
        parts=[self.read(image,tuple(round(v) for v in region)) for region in regions]
        return {'width':width,'height':height,'elapsedMs':sum(p['elapsedMs'] for p in parts),
                'lines':[line for part in parts for line in part['lines']]}
