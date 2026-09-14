'use strict';
const assert=require('node:assert/strict');
const {create}=require('../addon/account-context.cjs');
const {prepare,parse,apply}=require('../addon/import-plan.cjs');
const refs={gameVersion:'3.6.0',characters:[{id:'resonator:1',gameId:'1',name:'SYNTHETIC A',weapon:'Sword'},
 {id:'resonator:2',gameId:'2',name:'SYNTHETIC B',weapon:'Sword'}],
 weapons:[{id:'weapon:3',gameId:'3',name:'SYNTHETIC sword',type:'Sword'},{id:'weapon:4',gameId:'4',name:'SYNTHETIC gun',type:'Pistols'}],
 echoes:[{id:'5',name:'SYNTHETIC Echo',setIds:['7']}],resources:['6'],sets:['7','9'],nodes:{'1':['node:8']}};
const store=create();store.migrate(()=>null);store.update(s=>{
 s.characters['resonator:1']={level:80,ascension:5,sequence:2,skills:{Intro:7}};
 s.roster=['resonator:1'];s.resources={'6':12,'manual':8};s.settings.langPreference='untouched';
 s.weapons=[{id:'manual',catalogId:'weapon:3',name:'Manual',level:30,rank:1}];
});
const base=store.get(),original=JSON.stringify(base);
const source={provider:'local-export',account:'SYNTHETIC_ACCOUNT',server:'europe',capturedAt:'2026-01-02T10:00:00Z',gameVersion:'3.6.13',identity:'stable'};
const snapshot={format:'wuwa-companion-snapshot',version:1,source,
 characters:[{gameId:'1',level:90,ascension:6,skills:{'Normal Attack':6},weaponSourceId:'W1',forteNodes:{'node:8':true}}],
 weapons:[{sourceId:'W1',gameId:'3',level:90,ascension:6,rank:1},{sourceId:'W2',gameId:'3',level:90,ascension:6,rank:1}],
 echoes:[{sourceId:'E1',gameId:'5',level:25,quality:5,cost:3,setId:'7',ownerGameId:'1',slot:1,
 main:{type:'glacio',value:30},secondary:{type:'atk',value:100},substats:[{type:'critRate',value:6.9}]},
 {sourceId:'E2',gameId:'5',level:0,ownerGameId:null,slot:null}],resources:[{gameId:'6',quantity:0}]};
const run=(data=snapshot,current=base)=>prepare(current,JSON.stringify(data),refs);
const result=run();assert.equal(JSON.stringify(base),original,'Preparing never mutates input');
assert.equal(JSON.stringify(store.get()),original,'Preparing never changes the application store');
assert.equal(result.after.weapons.length,3,'Identical copies remain distinct and manual copy is preserved');
assert.equal(result.after.echoes.length,2);assert.equal(result.after.characters['resonator:1'].sequence,2);
assert.equal(result.after.characters['resonator:1'].skills.Intro,7,'Unread fields survive');
assert.equal(result.after.resources['6'],0,'Known zero is not missing');assert.equal(result.after.resources.manual,8);
assert.equal(result.after.settings.langPreference,'untouched');
const target=create(base);assert.equal(apply(target,result),true);assert.equal(target.get().echoes.length,2);
assert.throws(()=>apply(target,result),/changed after/);
const concurrent=create(base);concurrent.update(s=>s.resources.manual=99);
assert.throws(()=>apply(concurrent,result),/changed after/);assert.equal(concurrent.get().resources.manual,99);
assert.equal(run(snapshot,result.after).changed,false,'Same snapshot is idempotent');
assert.equal(apply(target,run(snapshot,result.after)),false);
const later=structuredClone(snapshot);later.source.capturedAt='2026-01-03T10:00:00Z';later.weapons[0].rank=2;
const refreshed=run(later,result.after);assert.equal(refreshed.after.weapons.length,3);
assert.equal(refreshed.after.weapons[1].id,result.after.weapons[1].id,'Stable IDs survive rescans');
assert.equal(refreshed.after.weapons[1].rank,2);
let rejected=0;
function rejects(change,current=base){const data=structuredClone(snapshot);change(data);assert.throws(()=>run(data,current));rejected++;assert.equal(JSON.stringify(base),original);}
rejects(x=>x.source.account='OTHER',result.after);
rejects(x=>x.source.provider='kuro-api',result.after);
rejects(x=>x.source.capturedAt='2026-01-01T10:00:00Z',result.after);
rejects(x=>x.resources[0].quantity=1,result.after);
rejects(x=>x.source.gameVersion='3.7.0');
rejects(x=>x.source.capturedAt='2026-02-30T10:00:00Z');
rejects(x=>x.source.capturedAt='3026-01-02T10:00:00Z');
rejects(x=>x.source.token='PRIVATE');
rejects(x=>x.source.identity='observation');
rejects(x=>x.weapons[1].sourceId='W1');
rejects(x=>x.echoes[1].sourceId='E1');
rejects(x=>x.weapons[0].gameId='UNKNOWN');
rejects(x=>x.characters[0].gameId='UNKNOWN');
rejects(x=>x.weapons[0].gameId='4');
rejects(x=>x.characters[0].weaponSourceId='MISSING');
rejects(x=>x.characters.push({gameId:'2',weaponSourceId:'W1'}));
rejects(x=>{x.echoes[1].ownerGameId='1';x.echoes[1].slot=1;});
rejects(x=>x.echoes[0].ownerGameId='2');
rejects(x=>delete x.echoes[1].ownerGameId);
rejects(x=>x.echoes[0].level=26);
rejects(x=>x.echoes[0].setId='UNKNOWN');
rejects(x=>x.echoes[0].setId='9');
rejects(x=>x.echoes[0].main.type='hp');
rejects(x=>x.echoes[0].substats.push({type:'critRate',value:9}));
rejects(x=>x.echoes[0].main.token='PRIVATE');
rejects(x=>{x.echoes=Array.from({length:4},(_,i)=>({...x.echoes[0],sourceId:'C'+i,cost:4,slot:i+1,main:{type:'critRate',value:22}}));});
rejects(x=>x.characters[0].level=20);
rejects(x=>x.characters[0].level=null);
rejects(x=>x.characters[0].skills['Normal Attack']=11);
rejects(x=>x.characters[0].skills.typo=3);
rejects(x=>x.characters[0].forteNodes['node:9']=true);
rejects(x=>x.resources[0].quantity=-1);
rejects(x=>x.resources[0].quantity=null);
rejects(x=>x.resources[0].quantity='120');
rejects(x=>x.resources[0].gameId='UNKNOWN');
const encoded=JSON.stringify(snapshot).replace('"version":1','"version":1,"__proto__":{}');assert.throws(()=>parse(encoded));
assert.throws(()=>parse('x'.repeat(8*1024*1024+1)));
// Real account-store backup validation and restoration of the staged result.
const memory=create(result.after),backup=memory.exportData(),restore=create();
restore.restore(backup);assert.deepEqual(JSON.parse(JSON.stringify(restore.exportData().records)),JSON.parse(JSON.stringify(backup.records)));
memory.validateBackup(JSON.stringify(backup));
// Real reference adapter and compatible downloadable backup, still using a synthetic account.
const {stage,references}=require('../addon/prepare-backup.cjs');
const actual=references();assert.equal(actual.characters.length,58);assert.equal(actual.echoes.length,311);
const fresh=create();fresh.migrate(()=>null);
const videoExample={format:snapshot.format,version:1,source:{...source,provider:'windows-ocr',identity:'observation'},characters:[{gameId:'1108',level:90}]};
const staged=stage(JSON.stringify(videoExample),JSON.stringify(fresh.exportData()));
assert.equal(JSON.parse(staged.backup.records.wwc_companion_v1).characters['resonator:1108'].level,90);
assert.equal(fresh.get().roster.length,0);fresh.validateBackup(JSON.stringify(staged.backup));
// The command writes only a fresh output and refuses overwriting it on a repeated run.
const fs=require('node:fs'),path=require('node:path'),{spawnSync}=require('node:child_process');
const root=path.resolve(__dirname,'..');fs.mkdirSync(path.join(root,'test-results'),{recursive:true});
const directory=fs.mkdtempSync(path.join(root,'test-results/addon-cli-'));
const input=path.join(directory,'snapshot.json'),existing=path.join(directory,'existing.json'),output=path.join(directory,'proposed.json');
fs.writeFileSync(input,JSON.stringify(videoExample));fs.writeFileSync(existing,JSON.stringify(fresh.exportData()));
const originalBackup=fs.readFileSync(existing,'utf8');
const command=()=>spawnSync(process.execPath,[path.join(root,'addon/prepare-backup.cjs'),input,existing,output],{encoding:'utf8'});
const first=command();assert.equal(first.status,0,first.stderr);fresh.validateBackup(fs.readFileSync(output,'utf8'));
const proposed=fs.readFileSync(output,'utf8');assert.notEqual(command().status,0);
assert.equal(fs.readFileSync(output,'utf8'),proposed);assert.equal(fs.readFileSync(existing,'utf8'),originalBackup);
console.log(`PASS: isolated real-store staging, backup validation, unknown preservation, distinct copies, repeat import and ${rejected+2} invalid inputs rejected.`);
