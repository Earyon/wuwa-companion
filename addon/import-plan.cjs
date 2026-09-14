'use strict';
// Method-independent staging only. This module neither contacts Kuro nor writes a browser store.
const {create,skillTypes}=require('./account-context.cjs');
const {createHash}=require('node:crypto');
const hash=x=>createHash('sha256').update(JSON.stringify(x)).digest('hex');
const object=x=>x!==null&&typeof x==='object'&&!Array.isArray(x);
const own=(o,k)=>Object.hasOwn(o,k);
const id=x=>typeof x==='string'&&/^[A-Za-z0-9_-]{1,100}$/.test(x);
function fields(value,allowed){
 if(!object(value)||Object.keys(value).some(k=>!allowed.includes(k)))throw Error('Unexpected field');
}
function parse(raw){
 if(typeof raw!=='string'||Buffer.byteLength(raw,'utf8')>8*1024*1024)throw Error('Snapshot too large');
 const data=JSON.parse(raw,(key,value)=>{if(['__proto__','prototype','constructor'].includes(key))throw Error('Unsafe key');return value;});
 fields(data,['format','version','source','characters','weapons','echoes','resources']);
 if(data.format!=='wuwa-companion-snapshot'||data.version!==1)throw Error('Unsupported snapshot');
 fields(data.source,['provider','account','server','capturedAt','gameVersion','identity']);
 const s=data.source;
 if(!['windows-ocr','local-export','kuro-api'].includes(s.provider)||!id(s.account)||
    !['europe','america','asia','sea','hmt'].includes(s.server)||!['stable','observation'].includes(s.identity)||
    typeof s.gameVersion!=='string'||!/^\d+\.\d+\.\d+$/.test(s.gameVersion)||
    typeof s.capturedAt!=='string'||!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{3})?Z$/.test(s.capturedAt)||
    !Number.isFinite(Date.parse(s.capturedAt)))throw Error('Invalid source metadata');
 if(new Date(s.capturedAt).toISOString().replace('.000Z','Z')!==s.capturedAt.replace('.000Z','Z')||
    Date.parse(s.capturedAt)>Date.now()+300000)throw Error('Invalid capture time');
 for(const kind of ['characters','weapons','echoes','resources']){
  if(!own(data,kind))continue;
  if(!Array.isArray(data[kind])||data[kind].length>20000)throw Error('Invalid collection');
  const ids=new Set();
  for(const row of data[kind]){
   if(!object(row))throw Error('Invalid record');
   const key=kind==='weapons'||kind==='echoes'?row.sourceId:row.gameId;
   if(!id(key)||ids.has(key))throw Error('Missing or duplicate identity');ids.add(key);
  }
 }
 if(s.identity!=='stable'&&((data.weapons?.length||0)+(data.echoes?.length||0)>0))throw Error('Copy identity is not stable; reconciliation required');
 if(!['characters','weapons','echoes','resources'].some(kind=>data[kind]?.length))throw Error('Empty snapshot');
 return data;
}
function prepare(current,raw,references){
 const snapshot=parse(raw),s=snapshot.source;
 const store=create(current),before=store.get();
 if(before.roster===null)throw Error('Migrate the existing account first');
 if(s.gameVersion.split('.').slice(0,2).join('.')!==references.gameVersion.split('.').slice(0,2).join('.'))throw Error('Game version differs from references');
 const binding=hash([s.account,s.server]);
 const old=before.settings.importState;
 if(old&&(!object(old)||old.binding!==binding||old.provider!==s.provider))throw Error('Another account or provider is already bound');
 if(old&&(!Number.isFinite(Date.parse(old.capturedAt))||typeof old.digest!=='string'))throw Error('Invalid previous import metadata');
 if(before.settings.server&&before.settings.server!==s.server)throw Error('Server differs from existing account');
 const digest=hash(snapshot);
 if(old?.digest===digest)return {changed:false,before,after:before,counts:{characters:0,weapons:0,echoes:0,resources:0}};
 if(old&&Date.parse(s.capturedAt)<=Date.parse(old.capturedAt))throw Error('Snapshot is stale or has a conflicting timestamp');
 const byGame=rows=>new Map(rows.map(row=>[String(row.gameId??row.id),row]));
 const characters=byGame(references.characters),weapons=byGame(references.weapons),echoes=byGame(references.echoes);
 const resources=new Set(references.resources.map(String));
 const copyId=(kind,sourceId)=>'import:'+hash([binding,s.provider,kind,sourceId]);
 const counts={characters:0,weapons:0,echoes:0,resources:0};
 const resolve=(map,gameId)=>{if(!id(gameId)||!map.has(gameId))throw Error('Unknown game identity');return map.get(gameId);};
 const copyFields=(target,row,keys)=>{for(const key of keys)if(own(row,key))target[key]=structuredClone(row[key]);};
 // The real account-store validator makes this an all-or-nothing operation in memory.
 store.update(next=>{
  for(const row of snapshot.characters||[]){
   fields(row,['gameId','level','ascension','sequence','skills','forteNodes','weaponSourceId']);
   for(const field of ['level','ascension','sequence','skills','forteNodes'])if(own(row,field)&&row[field]===null)throw Error('Omit unread character fields');
   const ref=resolve(characters,row.gameId),key=ref.id;
   if(!next.roster.includes(key))next.roster.push(key);
   const progress=next.characters[key]??={};
   if(row.skills){fields(row.skills,skillTypes);progress.skills={...progress.skills,...row.skills};}
   if(row.forteNodes){
    if(!object(row.forteNodes)||Object.keys(row.forteNodes).some(n=>!references.nodes?.[row.gameId]?.includes(n)))throw Error('Unverified Forte node');
    progress.forteNodes={...progress.forteNodes,...row.forteNodes};
   }
   copyFields(progress,row,['level','ascension','sequence']);counts.characters++;
  }
  for(const row of snapshot.weapons||[]){
   fields(row,['sourceId','gameId','level','ascension','rank']);
   for(const field of ['level','ascension','rank'])if(own(row,field)&&row[field]===null)throw Error('Omit unread weapon fields');
   const ref=resolve(weapons,row.gameId),key=copyId('weapon',row.sourceId);
   let copy=next.weapons.find(w=>w.id===key);
   if(copy&&copy.catalogId!==ref.id)throw Error('Copy identity changed weapon');
   if(!copy){copy={id:key,catalogId:ref.id,name:ref.name,level:null,rank:null};next.weapons.push(copy);}
   copyFields(copy,row,['level','ascension','rank']);counts.weapons++;
  }
  for(const row of snapshot.characters||[]){
   if(!own(row,'weaponSourceId'))continue;
   const ref=characters.get(row.gameId),progress=next.characters[ref.id];
   if(row.weaponSourceId===null){delete progress.weaponCopyId;progress.weapon=null;continue;}
   if(!id(row.weaponSourceId))throw Error('Invalid weapon source identity');
   const key=copyId('weapon',row.weaponSourceId),copy=next.weapons.find(w=>w.id===key);
   if(!copy)throw Error('Missing equipped weapon');
   const weapon=references.weapons.find(w=>w.id===copy.catalogId);
   if(!weapon||ref.weapon==='Unknown'||ref.weapon!==weapon.type)throw Error('Incompatible equipped weapon');
   progress.weaponCopyId=key;progress.weapon=null;
  }
  for(const row of snapshot.echoes||[]){
   fields(row,['sourceId','gameId','level','quality','cost','setId','main','secondary','substats','ownerGameId','slot']);
   for(const field of ['level','quality','cost','setId','main','secondary','substats'])if(own(row,field)&&row[field]===null)throw Error('Omit unread Echo fields');
   const ref=resolve(echoes,row.gameId),key=copyId('echo',row.sourceId);
   let copy=next.echoes.find(e=>e.id===key);
   if(copy&&copy.catalogId!==String(ref.id))throw Error('Copy identity changed Echo');
   if(!copy){
    if(!own(row,'ownerGameId')||!own(row,'slot'))throw Error('Unknown new Echo equipment');
    copy={id:key,catalogId:String(ref.id),name:ref.name,level:null,quality:null,cost:null,setId:null,main:null,secondary:null,substats:[],owner:null,slot:null};
    next.echoes.push(copy);
   }
   if(own(row,'ownerGameId')!==own(row,'slot'))throw Error('Incomplete Echo equipment');
   if(own(row,'ownerGameId')){
    copy.owner=row.ownerGameId===null?null:resolve(characters,row.ownerGameId).id;
    copy.slot=row.slot;
    if(copy.owner&&!next.roster.includes(copy.owner))throw Error('Echo owner is not owned');
   }
   if(row.setId!=null&&(!references.sets.includes(row.setId)||!ref.setIds?.includes(row.setId)))throw Error('Unknown or incompatible Sonata');
   for(const stat of [row.main,row.secondary,...(Array.isArray(row.substats)?row.substats:[])])if(stat!=null)fields(stat,['type','value']);
   copyFields(copy,row,['level','quality','cost','setId','main','secondary','substats']);counts.echoes++;
  }
  for(const row of snapshot.resources||[]){
   fields(row,['gameId','quantity']);
   if(!resources.has(row.gameId)||!own(row,'quantity')||row.quantity===null)throw Error('Unknown resource or quantity');
   next.resources[row.gameId]=row.quantity;counts.resources++;
  }
  const costs=new Map();
  for(const echo of next.echoes)if(echo.owner!==null){
   const total=(costs.get(echo.owner)||0)+(echo.cost??0);
   if(total>12)throw Error('Equipped Echo cost exceeds 12');costs.set(echo.owner,total);
  }
  next.settings.importState={binding,provider:s.provider,capturedAt:s.capturedAt,digest};
 });
 return {changed:true,before,after:store.get(),counts};
}
function apply(store,plan){
 if(!plan.changed)return false;
 store.update(next=>{
  if(JSON.stringify(next)!==JSON.stringify(plan.before))throw Error('Account changed after import preparation');
  for(const key of Object.keys(next))delete next[key];
  Object.assign(next,structuredClone(plan.after));
 });
 return true;
}
module.exports={parse,prepare,apply};
