"""Developer entry point for local OCR. Writes a new observation; never applies an import."""
import argparse
import json
from pathlib import Path
from PIL import Image
from recognition import Reader
import readers


def read(image_path,references_path,kind):
    references=readers.Reference(json.loads(Path(references_path).read_text(encoding='utf-8')))
    with Image.open(image_path) as source:
        image=source.convert('RGB')
    engine=Reader()
    observation=engine.read_echo(image) if kind=='echo' else engine.read(image)
    parser={'character':readers.character,'weapon':readers.weapon,'skills':readers.skills,'echo':readers.echo}[kind]
    data=parser(observation,references)
    return {'gameVersion':references.data['gameVersion'],'kind':kind,'data':data,'elapsedMs':observation['elapsedMs']}


if __name__=='__main__':
    parser=argparse.ArgumentParser(description='Lire une image locale sans modifier le compte')
    parser.add_argument('image');parser.add_argument('references');parser.add_argument('output')
    parser.add_argument('--kind',choices=['character','weapon','skills','echo'],required=True)
    args=parser.parse_args()
    output=Path(args.output)
    if output.exists():parser.error('Le fichier de sortie existe déjà')
    result=read(args.image,args.references,args.kind)
    with output.open('x',encoding='utf-8') as file:json.dump(result,file,ensure_ascii=False,indent=2)
    print('Lecture préparée localement. Aucun changement appliqué au compte.')
