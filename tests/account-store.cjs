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
assert.equal(f.store.get().version,2);assert.equal(f.store.get().roster.length,0);
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
