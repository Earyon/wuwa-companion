const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const rules=fs.readFileSync(require('node:path').join(__dirname,'../echo-rules.js'),'utf8');
const source=rules+'\n'+fs.readFileSync(require('node:path').join(__dirname,'../account-store.js'),'utf8');
const key='wwc_companion_v1';
function fixture(seed={}){
 const values=new Map(Object.entries(seed)),events={};let fail=false;
 const storage={getItem:k=>values.get(k)??null,setItem(k,v){if(fail)throw Error('Quota');values.set(k,String(v));},removeItem:k=>values.delete(k)};
 const context=vm.createContext({localStorage:storage,structuredClone,crypto:require('node:crypto').webcrypto,window:{addEventListener:(name,fn)=>events[name]=fn}});
 vm.runInContext(source+';globalThis.store=CompanionStore',context);
 return {store:context.store,values,fail:v=>fail=v,events};
}
const resolve=name=>['Old name','Alias','Renamed'].includes(name)?{id:'resonator:1'}:null;
const legacy={'wwc_owned_ids':'[]','wwc_owned':'["Old name"]','wwc_account_data':JSON.stringify({'Old name':{level:70,forteNodes:{'node:999':true}},Alias:{level:20},Missing:{level:50}})};
let f=fixture(legacy);f.store.migrate(resolve);
assert.equal(f.store.get().version,6);assert.equal(f.store.get().roster.length,0);
assert.equal(f.store.get().characters['resonator:1'].level,70);
assert.equal(f.store.get().legacyProgress.Alias.level,20);assert.equal(f.store.get().legacyProgress.Missing.level,50);
for(const [k,v] of Object.entries(legacy))assert.equal(f.values.get(k),v,'Migration never rewrites legacy records');
const migrated=f.values.get(key);f.store.migrate(()=>null);assert.equal(f.values.get(key),migrated,'Migration is idempotent');
const original=f.store.get().characters['resonator:1'];
f.fail(true);assert.throws(()=>f.store.saveCharacter('resonator:1',{...original,level:80},original));assert.equal(f.values.get(key),migrated);assert.equal(f.store.get().characters['resonator:1'].level,70);
f.fail(false);f.store.saveCharacter('resonator:1',{...original,level:80},original);
assert.throws(()=>f.store.saveCharacter('resonator:1',{level:90},original),/another window/);
assert.equal(f.store.get().characters['resonator:1'].level,80);
const reload=fixture(Object.fromEntries(f.values));reload.store.migrate(resolve);assert.equal(reload.store.get().characters['resonator:1'].level,80);
// Re-read the latest committed record so editing one character preserves others.
const external=JSON.parse(f.values.get(key));external.characters.other={level:30};f.values.set(key,JSON.stringify(external));
f.store.saveCharacter('resonator:1',{level:85},external.characters['resonator:1']);assert.equal(f.store.get().characters.other.level,30);
for(const progress of ['{broken','{"Old name":{"level":999}}']){
 const bad=fixture({...legacy,wwc_account_data:progress});assert.throws(()=>bad.store.migrate(resolve));assert.equal(bad.values.has(key),false);assert.equal(bad.values.get('wwc_account_data'),progress);
}
const quota=fixture(legacy);quota.fail(true);assert.throws(()=>quota.store.migrate(resolve));assert.equal(quota.values.has(key),false);assert.equal(quota.store.get().roster,null);quota.fail(false);quota.store.migrate(resolve);assert.equal(quota.store.get().roster.length,0);
const old=f.store.get();old.version=1;delete old.roster;delete old.characters;delete old.legacyProgress;
const upgrade=fixture({...legacy,[key]:JSON.stringify(old)});upgrade.store.migrate(resolve);assert.equal(upgrade.store.get().characters['resonator:1'].level,70);assert.equal(upgrade.store.get().weapons.length,old.weapons.length);
const unknown=fixture({...legacy,wwc_owned_ids:'["unknown-id"]'});unknown.store.migrate(resolve);assert.equal(unknown.store.get().roster[0],'unknown-id');
f.store.validateBackup(JSON.stringify(f.store.exportData()));
const invalid=f.store.exportData();const record=JSON.parse(invalid.records[key]);record.characters.other.level=999;invalid.records[key]=JSON.stringify(record);assert.throws(()=>f.store.validateBackup(JSON.stringify(invalid)));
console.log('PASS: v1 migration, empty/unknown roster, unknown/colliding names preserved, idempotence, quota failure/retry, stale editor rejection, latest-record merge, reload, backup validation.');

// Equipment references have one owner and one authoritative copy record.
const equipment=fixture();equipment.store.migrate(()=>null);
const catalog={characters:[{id:'a',weapon:'Sword'},{id:'b',weapon:'Sword'},{id:'c',weapon:'Pistols'}],weapons:[{id:'sword',type:'Sword',name:'Test sword'},{id:'pistol',type:'Pistols',name:'Test pistol'}]};
equipment.store.update(s=>{s.roster=['a','b','c'];});
const copy={id:'copy',catalogId:'sword',level:50,rank:1};
equipment.store.saveWeapon(copy,null,catalog);const first=equipment.store.get().weapons[0];
const equip=(id,expected,weapon=first)=>equipment.store.saveCharacter(id,expected,expected,'Equip',{mode:'copy',id:weapon.id,expected:weapon,level:weapon.level,rank:weapon.rank},catalog);
equip('a',{});assert.equal(equipment.store.get().characters.a.weaponCopyId,'copy');assert.equal(equipment.store.get().characters.a.weapon,null);
assert.throws(()=>equip('b',{}),/already equipped/);assert.throws(()=>equipment.store.saveWeapon({...first,catalogId:'pistol'},first,catalog),/Incompatible/);
const a=equipment.store.get().characters.a;
equipment.store.saveCharacter('a',a,a,'Unequip',{mode:'none'},catalog);assert.equal(equipment.store.get().weapons.length,1);assert.equal(equipment.store.weaponOwner(equipment.store.get(),'copy'),null);
assert.throws(()=>equip('c',{}),/Incompatible/);equip('b',{});
equipment.store.saveWeapon({...first,level:80},first,catalog);assert.equal(equipment.store.get().weapons[0].level,80);assert.equal(equipment.store.get().characters.b.weaponCopyId,'copy');
assert.throws(()=>equipment.store.saveCharacter('b',equipment.store.get().characters.b,equipment.store.get().characters.b,'Stale',{mode:'copy',id:'copy',expected:first,level:70,rank:1},catalog),/changed/);
const beforeEquipment=equipment.values.get(key),current=equipment.store.get().weapons[0];
equipment.fail(true);assert.throws(()=>equipment.store.removeWeapon('copy',current,'b'));assert.equal(equipment.values.get(key),beforeEquipment);equipment.fail(false);
equipment.store.removeWeapon('copy',current,'b');assert.equal(equipment.store.get().weapons.length,0);assert.equal(equipment.store.get().characters.b.weaponCopyId,undefined);
const b=equipment.store.get().characters.b;
equipment.store.saveCharacter('b',b,b,'New',{mode:'new',catalogId:'sword',level:null,rank:1},catalog);assert.equal(equipment.store.get().weapons.length,1);assert.equal(equipment.store.get().weapons[0].level,null);
equipment.store.validateBackup(JSON.stringify(equipment.store.exportData()));
assert.throws(()=>equipment.store.update(s=>{s.characters.a={weaponCopyId:s.characters.b.weaponCopyId};}),/equipment link/);
assert.throws(()=>equipment.store.update(s=>{s.weapons=[];}),/equipment link/);
const preservedLegacy=fixture(legacy);preservedLegacy.store.migrate(resolve);assert.equal(preservedLegacy.store.get().weapons.length,0,'Migration does not invent or merge weapon copies');
console.log('PASS: shared weapon copies, uniqueness, compatibility, stale-copy rejection, atomic delete/unequip, unknown level, legacy preservation and backup link integrity.');

// Echo copies: migration preserves unstructured entries, never guesses a stat ID.
const echoes=fixture();echoes.store.migrate(()=>null);echoes.store.update(s=>{s.roster=['a','b'];});
const echoCatalog=[{id:'echo:1',name:'Test Echo',sets:[{id:'set:1',name:'Test Sonata'}]}];
const makeEcho=id=>({id,catalogId:'echo:1',name:'Test Echo',owner:null,slot:null,quality:5,cost:4,level:25,setId:'set:1',main:{type:'critRate',value:22},secondary:{type:'atk',value:null},substats:[{type:'critDmg',value:15} ]});
const e1=makeEcho('e1'),e2=makeEcho('e2');echoes.store.saveEcho(e1,null,echoCatalog);echoes.store.saveEcho(e2,null,echoCatalog);
const draft=()=>{const before=echoes.store.get().echoes;return {before,after:structuredClone(before)};};
const saveDraft=(d,id='a')=>{const p=echoes.store.get().characters[id]||{};echoes.store.saveCharacter(id,{...p,level:70},p,'Echo equipment',null,null,d);};
let d=draft();Object.assign(d.after[0],{owner:'a',slot:1});saveDraft(d);assert.equal(echoes.store.get().echoes[0].owner,'a');
d=draft();Object.assign(d.after.find(e=>e.id==='e1'),{owner:null,slot:null});Object.assign(d.after.find(e=>e.id==='e2'),{owner:'a',slot:1});saveDraft(d);
assert.equal(echoes.store.get().echoes.length,2);assert.equal(echoes.store.get().echoes.find(e=>e.id==='e1').owner,null,'Replacement retains old copy');
const badBackup=echoes.store.exportData();const badEchoState=JSON.parse(badBackup.records[key]);badEchoState.echoes[0].owner='a';badEchoState.echoes[0].slot=1;badBackup.records[key]=JSON.stringify(badEchoState);assert.throws(()=>echoes.store.validateBackup(JSON.stringify(badBackup)),/Echo slot/);
d=draft();const stale=d.after.find(e=>e.id==='e2');stale.level=20;
const currentEcho=echoes.store.get().echoes.find(e=>e.id==='e2');echoes.store.saveEcho({...currentEcho,level:15},currentEcho,echoCatalog);
const unchanged=echoes.values.get(key);assert.throws(()=>saveDraft(d),/another window/);assert.equal(echoes.values.get(key),unchanged,'Character and Echo remain unchanged on conflict');
d=draft();d.after.find(e=>e.id==='e1').owner='b';d.after.find(e=>e.id==='e1').slot=1;assert.throws(()=>saveDraft(d),/another character/);
d=draft();Object.assign(d.after.find(e=>e.id==='e1'),{owner:'a',slot:2});echoes.store.saveEcho(makeEcho('unrelated'),null,echoCatalog);saveDraft(d);assert.ok(echoes.store.get().echoes.some(e=>e.id==='unrelated'),'Unrelated new copy is preserved');
d=draft();for(const [i,e] of d.after.entries())Object.assign(e,{owner:'a',slot:i+1});d.after.push({...makeEcho('fourth'),owner:'a',slot:4});assert.throws(()=>saveDraft(d),/cost exceeds/);
for(const patch of [{quality:2,level:25},{cost:1},{substats:[{type:'critRate',value:1},{type:'critRate',value:2}]},{level:0},{main:{type:'critRate',value:-1}},{main:{type:'invalid',value:null}}])assert.throws(()=>echoes.store.saveEcho({...e1,...patch,id:'invalid'},null,echoCatalog));
const unknownEcho={...makeEcho('unknown'),quality:null,cost:null,level:null,main:null,secondary:null,substats:[]};echoes.store.saveEcho(unknownEcho,null,echoCatalog);assert.equal(echoes.store.get().echoes.find(e=>e.id==='unknown').level,null);
const oldEchoState=echoes.store.get();oldEchoState.version=3;oldEchoState.echoes=[{id:'old',catalogId:'absent',owner:'missing-owner',slot:5,level:0,mainStat:'ATK',mainValue:'18%',substats:['Old ambiguous text']}];
const echoMigration=fixture({[key]:JSON.stringify(oldEchoState)});const migratedEcho=echoMigration.store.get().echoes[0];assert.equal(migratedEcho.main,null);assert.equal(migratedEcho.legacyStats.substats[0],'Old ambiguous text');assert.equal(migratedEcho.owner,'missing-owner');echoMigration.store.validateBackup(JSON.stringify(echoMigration.store.exportData()));
echoMigration.store.saveEcho({...migratedEcho,level:10},migratedEcho,[]);assert.equal(echoMigration.store.get().echoes[0].level,10,'Missing catalogue copy stays editable');
const beforeDelete=echoes.values.get(key);echoes.fail(true);assert.throws(()=>echoes.store.removeEcho('unknown',unknownEcho));assert.equal(echoes.values.get(key),beforeDelete);echoes.fail(false);
console.log('PASS: Echo copy migration, replacement without deletion, slot integrity, atomic stale-draft rejection, unrelated updates retained, cost/stat limits, unknown values and quota failure.');

const planning=fixture();planning.store.migrate(()=>null);planning.store.update(s=>{s.roster=['a','b','c','r1','r2'];});
const build={id:'build',characterId:'a',name:'Support',context:'Tower',notes:'',role:'support',weaponId:'sword',echoId:null,setId:null,stats:{main4:'healing',main1:'atkPct'},substats:['energy']};
planning.store.saveBuild(build,null,catalog);assert.throws(()=>planning.store.saveBuild({...build,stats:{main1:'energy'}},build,catalog),/build stats/);
assert.throws(()=>planning.store.saveBuild({...build,weaponId:'pistol'},build,catalog),/Incompatible/);
const team={id:'team',name:'Test',members:['a','b','c'],favorite:true,builds:{a:'build'}};planning.store.saveTeam(team,null);
assert.throws(()=>planning.store.saveTeam({...team,members:['a','b','missing']},team),/owned/);
assert.throws(()=>planning.store.saveTeam({...team,members:['a','a','c']},team));
assert.throws(()=>planning.store.saveTeam({...team,members:['a','r1','r2']},team,'',[{id:'r1',name:'Rover: Aero'},{id:'r2',name:'Rover: Havoc'}]),/one Rover/);
assert.throws(()=>planning.store.update(s=>{s.teams[0].builds={b:'build'};}),/build reference/);
planning.store.saveTeam({...team,name:'Newer'},team);assert.throws(()=>planning.store.saveTeam({...team,name:'Stale'},team),/changed/);
const beforePlan=planning.values.get(key);planning.fail(true);assert.throws(()=>planning.store.saveBuild({...build,name:'Lost'},build,catalog));assert.equal(planning.values.get(key),beforePlan);planning.fail(false);
planning.store.update(s=>{s.achievements['300101']='done';s.settings.server='europe';s.activities=[{id:'daily',name:'Daily',status:'done',period:'daily',cycle:'europe:2026-09-13'}];});
planning.store.validateBackup(JSON.stringify(planning.store.exportData()));assert.throws(()=>planning.store.update(s=>{s.settings.server='unknown';}));assert.throws(()=>planning.store.update(s=>{s.achievements.x=true;}));
console.log('PASS: owned/distinct teams, one Rover per team, profile ownership/weapon/stats constraints, conflicts/quota, regional activity and achievement backup validation.');
