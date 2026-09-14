"""Interpret visible fields conservatively. Unknown is never silently converted to zero."""
import re
import unicodedata


class Unreadable(ValueError):
    pass


def normal(text):
    return ''.join(c for c in unicodedata.normalize('NFKD', str(text)).casefold()
                   if c.isalnum() and not unicodedata.combining(c))


def center(line):
    box = line['box']
    return (sum(p[0] for p in box)/len(box), sum(p[1] for p in box)/len(box))


def within(observation, region, confidence=.94):
    x1, y1, x2, y2 = region
    return [line for line in observation['lines'] if line['confidence'] >= confidence and
            x1 <= center(line)[0] <= x2 and y1 <= center(line)[1] <= y2]


def joined_rows(lines, tolerance):
    rows = []
    for line in sorted(lines, key=lambda l:center(l)[1]):
        x, y = center(line)
        row = next((r for r in rows if abs(r['y']-y) < tolerance), None)
        if row is None:
            row = {'y': y, 'parts': []}
            rows.append(row)
        row['parts'].append(line)
    return [{'text': ' '.join(l['text'] for l in sorted(r['parts'],key=lambda l:center(l)[0])),
             'y': r['y'], 'parts': r['parts']} for r in rows]


class Reference:
    def __init__(self, data):
        self.data = data
        self.indexes = {}
        for kind in ['characters','weapons','echoes','items','sets']:
            aliases = {}
            for row in data[kind]:
                for name in row['names']:
                    aliases.setdefault(normal(name), {})[row['gameId']] = row
            self.indexes[kind] = aliases

    def match(self, kind, lines, predicate=lambda row: True):
        candidates = {}
        for line in lines:
            candidates.update({key:row for key,row in self.indexes[kind].get(normal(line['text']), {}).items() if predicate(row)})
        if len(candidates) != 1:
            raise Unreadable('Identité absente ou ambiguë : ' + kind)
        return next(iter(candidates.values()))


def scale(observation):
    w, h = observation['width'], observation['height']
    if h < 600 or not 1.5 <= w/h <= 2.5:
        raise Unreadable('Format d’écran non pris en charge')
    return h/1080


def level_pair(lines):
    matches = []
    for line in lines:
        found = re.fullmatch(r'(?:N[vV]\.?|L[vV]\.?)?\s*(\d{1,2})\s*/\s*(\d{2})', line['text'].strip())
        if found:
            level, cap = map(int, found.groups())
            caps, minima = [20,40,50,60,70,80,90], [1,20,40,50,60,70,80]
            if cap in caps and minima[caps.index(cap)] <= level <= cap:
                matches.append((level,caps.index(cap)))
    if len(set(matches)) != 1:
        raise Unreadable('Niveau ou palier illisible')
    level, ascension = matches[0]
    return {'level':level,'ascension':ascension}


def account_id(observation):
    w,h=observation['width'],observation['height']
    for line in within(observation,(w*.6,h*.95,w,h)):
        match=re.fullmatch(r'(?:Identifiant|UID)\s*[:：.]?\s*(\d{8,12})',line['text'].strip(),re.I)
        if match:
            return match[1]
    raise Unreadable('Identifiant du compte illisible')


def character(observation, references):
    s=scale(observation)
    header=within(observation,(0,0,650*s,110*s))
    if not any(normal(l['text']) in ['detailsdesattributs','attributes','attributedetails'] for l in header):
        raise Unreadable('La page des attributs n’est pas ouverte')
    record=references.match('characters',within(observation,(170*s,120*s,610*s,245*s)))
    return {'gameId':record['gameId'],**level_pair(within(observation,(175*s,245*s,620*s,302*s)))}


def weapon(observation, references, side='right'):
    s=scale(observation);w=observation['width']
    x1,x2=(w-585*s,w) if side=='right' else (150*s,670*s)
    lines=within(observation,(x1,75*s,x2,390*s))
    record=references.match('weapons',lines)
    progress=level_pair(lines)
    ranks=[]
    for line in lines:
        if re.search(r'(?:Rang|Rank)\s*[1-5]\s*(?:→|->|[›>])',line['text'],re.I):
            raise Unreadable('Prévisualisation de syntonisation ouverte')
        match=re.match(r'(?:Rang|Rank)\s*([1-5])(?:\s|$)',line['text'].strip(),re.I)
        if match:ranks.append(int(match[1]))
    if len(set(ranks))!=1:
        raise Unreadable('Rang d’arme illisible')
    return {'gameId':record['gameId'],**progress,'rank':ranks[0]}


def skills(observation, references):
    s=scale(observation);w,h=observation['width'],observation['height']
    lines=within(observation,(w*.27,h*.60,w,h*.93))
    levels=[]
    for line in lines:
        match=re.fullmatch(r'(?:Nv|Lv)\.?\s*(10|[1-9])\s*/\s*10',line['text'].strip(),re.I)
        if match:levels.append((center(line)[0],int(match[1])))
    levels.sort()
    if len(levels)!=5 or any(b[0]-a[0]<60*s for a,b in zip(levels,levels[1:])):
        raise Unreadable('Les cinq compétences ne sont pas lisibles')
    return dict(zip(references.data['skillTypes'],(level for x,level in levels)))


STAT_LABELS={
    'PV':('hp','hpPct'),'HP':('hp','hpPct'),'ATQ':('atk','atkPct'),'ATK':('atk','atkPct'),
    'DEF':('def','defPct'),'Taux critique':('critRate','critRate'),'Crit. Rate':('critRate','critRate'),
    'Dégât critique':('critDmg','critDmg'),'Dégâts critiques':('critDmg','critDmg'),'Crit. DMG':('critDmg','critDmg'),
    'Recharge resonante':('energy','energy'),'Recharge résonante':('energy','energy'),'Energy Regen':('energy','energy'),
    'Bonus de soins':('healing','healing'),'Healing Bonus':('healing','healing'),
    'Dégâts Attaque normale':('basic','basic'),'Basic Attack DMG Bonus':('basic','basic'),
    'Dégâts Attaque lourde':('heavy','heavy'),'Heavy Attack DMG Bonus':('heavy','heavy'),
    'Dégâts Compétence résonatrice':('skill','skill'),'Resonance Skill DMG Bonus':('skill','skill'),
    'Dégâts Libération résonatrice':('liberation','liberation'),'Resonance Liberation DMG Bonus':('liberation','liberation')}
for label,kind in [('Glacio','glacio'),('Fusion','fusion'),('Electro','electro'),('Aero','aero'),('Spectro','spectro'),('Havoc','havoc')]:
    STAT_LABELS['Dégâts '+label]=(kind,kind)
    STAT_LABELS[label+' DMG Bonus']=(kind,kind)
STAT_LABELS={normal(key):value for key,value in STAT_LABELS.items()}


def stat_row(text):
    match=re.fullmatch(r'(.+?)\s+([0-9]+(?:[.,][0-9]+)?)\s*(%)?',text.strip())
    if not match:
        raise Unreadable('Statistique incomplète')
    label=normal(re.sub(r'^(?:[+*X×]|Bonus\s*:)\s*','',match[1],flags=re.I))
    label=re.sub(r'^bonus','',label)
    if label not in STAT_LABELS:
        raise Unreadable('Statistique inconnue')
    choices=STAT_LABELS[label];percent=bool(match[3]);kind=choices[1 if percent else 0]
    if kind not in ['hp','atk','def'] and not percent:
        raise Unreadable('Pourcentage absent')
    return {'type':kind,'value':float(match[2].replace(',','.'))}


def echo(observation, references, quality=None):
    s=scale(observation);w,h=observation['width'],observation['height']
    right=within(observation,(w-530*s,75*s,w,550*s))
    costs=[int(m[1]) for l in right if (m:=re.fullmatch(r'COST\s*([134])',l['text'].strip(),re.I))]
    levels=[int(m[1]) for l in right if center(l)[1]<215*s and (m:=re.fullmatch(r'\+(\d{1,2})',l['text'].strip()))]
    if len(set(costs))!=1 or len(set(levels))!=1 or levels[0]>25:
        raise Unreadable('Niveau ou coût d’Écho illisible')
    limits=references.data['echoRules']['maxLevels']
    if quality is not None and str(quality) not in limits:
        raise Unreadable('Qualité d’Écho inconnue')
    def possible_qualities(row):
        return [q for q in row['qualities'] if levels[0]<=limits[str(q)] and (quality is None or quality==q)]
    # Homonymous event variants can have different IDs and supported qualities.
    # Never select the first alias or collapse them by their shared artwork.
    record=references.match('echoes',right,lambda row: bool(possible_qualities(row)))
    stat_lines=within(observation,(w-530*s,219*s,w,495*s),confidence=0)
    if any(l['confidence']<.94 for l in stat_lines):
        raise Unreadable('Relecture nécessaire des statistiques d’Écho')
    rows=joined_rows(stat_lines,13*s)
    stats=[]
    for row in rows:
        try:stats.append(stat_row(row['text']))
        except Unreadable:
            # The name/value area contains only stat rows; never shift subsequent rows over a missing one.
            raise Unreadable('Relecture nécessaire des statistiques d’Écho')
    if not 2<=len(stats)<=7 or stats[1]['type'] not in ['hp','atk']:
        raise Unreadable('Statistiques principales d’Écho incomplètes')
    if len({r['type'] for r in stats[2:]})!=len(stats[2:]):raise Unreadable('Statistique secondaire répétée')
    rules=references.data['echoRules']
    if stats[0]['type'] not in rules['mainTypes'][str(costs[0])] or stats[1]['type']!=('hp' if costs[0]==1 else 'atk'):
        raise Unreadable('Statistiques incompatibles avec le coût')
    if any(row['type'] not in rules['subTypes'] for row in stats[2:]):
        raise Unreadable('Sous-statistique incompatible')
    qualities=possible_qualities(record)
    return {'gameId':record['gameId'],'level':levels[0],'cost':costs[0],
            **({'quality':qualities[0]} if len(qualities)==1 else {}),
            'main':stats[0],'secondary':stats[1],'substats':stats[2:]}
