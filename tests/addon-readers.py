"""Synthetic OCR observations: no personal images, game input, network or OCR dependency."""
import copy
import json
from pathlib import Path
import subprocess
import sys
import unittest

ROOT=Path(__file__).resolve().parents[1]
sys.path.insert(0,str(ROOT/'addon/windows'))
import readers
from traversal import page_plan,Coverage


def line(text,x,y,score=1):
    return {'text':text,'confidence':score,'box':[[x,y],[x+10,y],[x+10,y+10],[x,y+10]]}


def observation(lines):
    return {'width':1724,'height':1080,'lines':lines}


class Readers(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        node=sys.argv[1] if len(sys.argv)>1 else 'node'
        result=subprocess.run([node,'-e',"process.stdout.write(JSON.stringify(require('./scripts/build-addon-references.cjs').build()))"],
                              cwd=ROOT,check=True,capture_output=True,text=True,encoding='utf-8')
        cls.ref=readers.Reference(json.loads(result.stdout))

    def echo(self):
        return observation([line('Sabot-de-fer',1200,95),line('+25',1200,190),line('COST 3',1590,190),
          line('Bonus: Dégâts Glacio',1200,235),line('30.0%',1640,235),
          line('ATQ',1200,269),line('100',1640,269),
          line('Bonus: Dégâts Attaque normale 8.6%',1200,310),
          line('PV 510',1200,350),line('Bonus: Dégâts Attaque lourde 9.4%',1200,390),
          line('Recharge résonante 9.2%',1200,430),line('Taux critique 6.9%',1200,470)])

    def test_aliases_keep_variants_distinct(self):
        with self.assertRaises(readers.Unreadable):self.ref.match('echoes',[line('Sabot-de-fer',0,0)])
        parsed=readers.echo(self.echo(),self.ref)
        self.assertEqual(parsed['gameId'],'6000183')
        self.assertEqual(parsed['quality'],5)
        self.assertEqual([s['value'] for s in parsed['substats']],[8.6,510,9.4,9.2,6.9])

    def test_ambiguous_low_level_is_not_guessed(self):
        o=self.echo();o['lines'][1]['text']='+0'
        with self.assertRaises(readers.Unreadable):readers.echo(o,self.ref)

    def test_unread_stat_cannot_disappear(self):
        for mutation in ['missing-percent','missing-value','low-confidence','unknown-label','wrong-cost']:
            with self.subTest(mutation=mutation):
                o=self.echo()
                if mutation=='missing-percent':o['lines'][-1]['text']='Taux critique 6.9'
                if mutation=='missing-value':o['lines'][-1]['text']='Taux critique'
                if mutation=='low-confidence':o['lines'][-1]['confidence']=.80
                if mutation=='unknown-label':o['lines'][-1]['text']='Statistique inconnue 6.9%'
                if mutation=='wrong-cost':o['lines'][2]['text']='COST 1'
                with self.assertRaises(readers.Unreadable):readers.echo(o,self.ref)

    def test_duplicate_substat_refused(self):
        o=self.echo();o['lines'][-1]['text']='PV 520'
        with self.assertRaises(readers.Unreadable):readers.echo(o,self.ref)

    def test_decimal_comma_and_stat_kinds(self):
        self.assertEqual(readers.stat_row('Bonus: Dégâts Glacio 30,0%'),{'type':'glacio','value':30})
        self.assertEqual(readers.stat_row('PV 510'),{'type':'hp','value':510})
        self.assertEqual(readers.stat_row('PV 10,5%'),{'type':'hpPct','value':10.5})

    def test_levels_require_cap_and_valid_ascension(self):
        for label,expected in [('Nv. 20/20',(20,0)),('Nv. 20/40',(20,1)),('Lv. 90/90',(90,6))]:
            self.assertEqual(readers.level_pair([line(label,0,0)]),dict(zip(['level','ascension'],expected)))
        for text in ['Nv. 20','Nv. 21/20','Nv. 0/20','Nv. 30/50','Nv. 90/99']:
            with self.subTest(text=text),self.assertRaises(readers.Unreadable):readers.level_pair([line(text,0,0)])
        with self.assertRaises(readers.Unreadable):readers.level_pair([line('Nv. 20/20',0,0),line('Nv. 40/40',0,0)])

    def test_weapon_preview_never_imports_target_rank(self):
        for text in ['Rang 1 → 2','Rang 1 -> 2','Rang 1 > 2']:
            o=observation([line('Gelure',1200,110),line('Nv. 90/90',1200,230),line(text,1200,310)])
            with self.subTest(text=text),self.assertRaises(readers.Unreadable):readers.weapon(o,self.ref)

    def test_all_five_skills_and_actual_store_keys(self):
        lines=[line('Nv. '+str(n)+'/10',x,y) for n,x,y in [(6,480,850),(7,660,750),(8,860,690),(9,1070,750),(10,1250,850)]]
        expected=dict(zip(self.ref.data['skillTypes'],[6,7,8,9,10]))
        self.assertEqual(readers.skills(observation(list(reversed(lines))),self.ref),expected)
        for changed in [lines[:-1],lines+[copy.deepcopy(lines[-1])]]:
            with self.assertRaises(readers.Unreadable):readers.skills(observation(changed),self.ref)

    def test_character_requires_page_name_and_level(self):
        o=observation([line('Détails des attributs',100,35),line('Hiyuki',230,170),line('Nv. 90/90',230,270)])
        self.assertEqual(readers.character(o,self.ref),{'gameId':'1108','level':90,'ascension':6})
        o['lines'][0]['text']='Amélioration'
        with self.assertRaises(readers.Unreadable):readers.character(o,self.ref)

    def test_synthetic_account_id_must_be_labelled(self):
        self.assertEqual(readers.account_id(observation([line('Identifiant : 123456789',1400,1040)])),'123456789')
        with self.assertRaises(readers.Unreadable):readers.account_id(observation([line('123456789',1400,1040)]))


class Traversal(unittest.TestCase):
    def test_exact_coverage_at_page_boundaries(self):
        for columns,rows in [(6,4),(3,5)]:
            for total in range(146):
                with self.subTest(total=total,columns=columns,rows=rows):
                    pages=list(page_plan(total,columns,rows))
                    self.assertEqual([i for page in pages for i in page.unread_indices],list(range(total)))
                    for page in pages:self.assertTrue(set(page.unread_indices)<=set(page.visible_indices))

    def test_last_viewport_overlap_and_identical_copies(self):
        coverage=Coverage(25,6,4)
        self.assertEqual([p.first_row for p in coverage.pages],[0,1])
        for page in coverage.pages:
            coverage.accept(page,page.first_row,25,{i:{'same':'visible values'} for i in page.unread_indices})
        self.assertEqual(len(coverage.finish(25)),25)

    def test_incomplete_changed_and_repeated_pages_refused(self):
        for mutation in ['incomplete','missing-row','wrong-row','wrong-total','repeated','final-total']:
            with self.subTest(mutation=mutation):
                c=Coverage(25,6,4);page=c.pages[0];data={i:{} for i in page.unread_indices}
                if mutation=='incomplete':
                    with self.assertRaises(ValueError):c.finish(25)
                elif mutation=='final-total':
                    for p in c.pages:c.accept(p,p.first_row,25,{i:{} for i in p.unread_indices})
                    with self.assertRaises(ValueError):c.finish(24)
                elif mutation=='repeated':
                    c.accept(page,0,25,data)
                    with self.assertRaises(ValueError):c.accept(page,0,25,data)
                else:
                    if mutation=='missing-row':del data[0]
                    with self.assertRaises(ValueError):c.accept(page,1 if mutation=='wrong-row' else 0,24 if mutation=='wrong-total' else 25,data)

    def test_invalid_count_never_defaults_to_one_page(self):
        for value in [None,True,'24',-1,20001]:
            with self.subTest(value=value),self.assertRaises(ValueError):list(page_plan(value,6,4))


if __name__=='__main__':
    unittest.main(argv=[sys.argv[0]],verbosity=2)
