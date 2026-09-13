const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const source=fs.readFileSync(require('node:path').join(__dirname,'../account-store.js'),'utf8');
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
assert.equal(f.store.get().version,3);assert.equal(f.store.get().roster.length,0);
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
