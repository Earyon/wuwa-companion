'use strict';
// Personal records only. Game catalogues are cached independently.
const CompanionStore=(()=>{
 const KEY='wwc_companion_v1';
 const PERSONAL=[KEY,'wwc_owned_ids','wwc_owned','wwc_account_data','wwc_lang'];
 const blank=()=>({version:1,weapons:[],echoes:[],resources:{},goals:{},active:null,wishlist:[],teams:[],activities:[],journal:[]});
 const object=x=>!!x&&typeof x==='object'&&!Array.isArray(x);
 const number=(x,min,max)=>Number.isFinite(x)&&x>=min&&x<=max;
 function parse(raw){return JSON.parse(raw,(key,value)=>{if(['__proto__','prototype','constructor'].includes(key))throw Error('Invalid key');return value;});}
 function validate(data){
  if(!object(data)||data.version!==1)throw Error('Unsupported account format');
  for(const key of ['weapons','echoes','wishlist','teams','activities','journal'])if(!Array.isArray(data[key]))throw Error('Invalid '+key);
  for(const key of ['resources','goals'])if(!object(data[key]))throw Error('Invalid '+key);
  if(data.active!==null&&typeof data.active!=='string')throw Error('Invalid active goal');
  const ids=new Set();
  for(const w of data.weapons){
   if(!object(w)||typeof w.id!=='string'||ids.has(w.id)||typeof w.catalogId!=='string'||!number(w.level,1,90)||!number(w.rank,1,5)||!Number.isInteger(w.level)||!Number.isInteger(w.rank))throw Error('Invalid weapon');
   ids.add(w.id);
  }
  for(const value of Object.values(data.resources))if(value!==null&&(!Number.isInteger(value)||!number(value,0,1e12)))throw Error('Invalid quantity');
  for(const goal of Object.values(data.goals)){
   if(!object(goal)||!Number.isInteger(goal.level)||!number(goal.level,1,90)||!object(goal.skills)||!object(goal.priorities))throw Error('Invalid goal');
   for(const value of Object.values(goal.skills))if(!Number.isInteger(value)||!number(value,1,10))throw Error('Invalid skill target');
   for(const value of Object.values(goal.priorities))if(!Number.isInteger(value)||!number(value,0,3))throw Error('Invalid priority');
  }
  for(const team of data.teams)if(!object(team)||typeof team.id!=='string'||typeof team.name!=='string'||!Array.isArray(team.members)||team.members.length!==3||new Set(team.members).size!==3||!team.members.every(x=>typeof x==='string'))throw Error('Invalid team');
  const echoSlots=new Set();
  const echoIds=new Set();
  for(const echo of data.echoes){
   if(!object(echo)||typeof echo.id!=='string'||echoIds.has(echo.id)||typeof echo.catalogId!=='string'||typeof echo.owner!=='string'||!Number.isInteger(echo.level)||!number(echo.level,0,25)||!Number.isInteger(echo.slot)||!number(echo.slot,1,5)||typeof echo.mainStat!=='string'||typeof echo.mainValue!=='string'||!Array.isArray(echo.substats)||echo.substats.length>5||echo.substats.some(x=>typeof x!=='string')||echoSlots.has(echo.owner+':'+echo.slot))throw Error('Invalid Echo');
   echoSlots.add(echo.owner+':'+echo.slot);
   echoIds.add(echo.id);
  }
  for(const activity of data.activities)if(!object(activity)||typeof activity.id!=='string'||typeof activity.name!=='string'||!['unknown','todo','done'].includes(activity.status))throw Error('Invalid activity');
  if(!data.wishlist.every(id=>typeof id==='string'))throw Error('Invalid wishlist');
  for(const entry of data.journal)if(!object(entry)||typeof entry.id!=='string'||typeof entry.label!=='string'||typeof entry.at!=='string'||!Number.isFinite(Date.parse(entry.at)))throw Error('Invalid journal');
  return data;
 }
 let error=null,state;
 try{state=localStorage.getItem(KEY)?validate(parse(localStorage.getItem(KEY))):blank();}catch(e){error=e;state=blank();}
 function commit(next,label){
  if(error)throw Error('Saved account cannot be read. Export it before restoring a backup.');
  const value=validate(structuredClone(next));
  if(label)value.journal=[{id:crypto.randomUUID(),at:new Date().toISOString(),label,source:'manual'},...value.journal].slice(0,500);
  localStorage.setItem(KEY,JSON.stringify(value));state=value;
 }
 function update(change,label){
  // Read the latest committed record before each change, including other tabs.
  const raw=localStorage.getItem(KEY);const next=raw?validate(parse(raw)):blank();
  change(next);
  if(localStorage.getItem(KEY)!==raw)throw Error('Account changed in another window');
  commit(next,label);return next;
 }
 window.addEventListener('storage',event=>{
  if(event.key!==KEY)return;
  try{state=event.newValue?validate(parse(event.newValue)):blank();error=null;}catch(e){error=e;}
 });
 function exportData(){return {format:'wuwa-companion-backup',version:1,createdAt:new Date().toISOString(),records:Object.fromEntries(PERSONAL.map(key=>[key,localStorage.getItem(key)]))};}
 function validateBackup(raw){
  if(typeof raw!=='string'||raw.length>8*1024*1024)throw Error('Backup is too large');
  const backup=parse(raw);
  if(backup.format!=='wuwa-companion-backup'||backup.version!==1||!object(backup.records))throw Error('Not a WuWa Companion backup');
  if(Object.keys(backup.records).length!==PERSONAL.length||!PERSONAL.every(k=>Object.hasOwn(backup.records,k)))throw Error('Incomplete backup');
  for(const [key,value] of Object.entries(backup.records)){
   if(!PERSONAL.includes(key)||(value!==null&&typeof value!=='string'))throw Error('Unexpected backup field');
   if(value===null)continue;
   if(key==='wwc_lang'){if(!['fr','en'].includes(value))throw Error('Invalid language');continue;}
   const parsed=parse(value);
   if(key===KEY)validate(parsed);
   else if(key==='wwc_account_data'){
    if(!object(parsed))throw Error('Invalid progress');
    for(const p of Object.values(parsed)){
     if(!object(p)||(p.level!=null&&(!Number.isInteger(p.level)||!number(p.level,1,90)))||(p.sequence!=null&&(!Number.isInteger(p.sequence)||!number(p.sequence,0,6))))throw Error('Invalid character progress');
     if(p.skills){if(!object(p.skills))throw Error('Invalid skills');for(const v of Object.values(p.skills))if(!Number.isInteger(v)||!number(v,1,10))throw Error('Invalid skill level');}
     if(p.forteNodes&&(!object(p.forteNodes)||Object.values(p.forteNodes).some(v=>typeof v!=='boolean')))throw Error('Invalid passive');
     if(p.weapon!=null&&(!object(p.weapon)||typeof p.weapon.name!=='string'||(p.weapon.level!=null&&(!Number.isInteger(p.weapon.level)||!number(p.weapon.level,1,90)))||(p.weapon.rank!=null&&(!Number.isInteger(p.weapon.rank)||!number(p.weapon.rank,1,5)))))throw Error('Invalid equipped weapon');
    }
   }else if(!Array.isArray(parsed)||!parsed.every(x=>typeof x==='string'))throw Error('Invalid roster');
  }
  return backup;
 }
 function restore(backup){
  backup=validateBackup(JSON.stringify(backup));
  const before=exportData();
  // Preserve the previous personal state. Never clear the entire origin.
  localStorage.setItem('wwc_before_restore',JSON.stringify(before));
  try{for(const [key,value] of Object.entries(backup.records)){if(value===null)localStorage.removeItem(key);else localStorage.setItem(key,value);}}
  catch(e){
   // Release space occupied by partially imported records before rollback.
   for(const key of PERSONAL)localStorage.removeItem(key);
   for(const [key,value] of Object.entries(before.records))if(value!==null)localStorage.setItem(key,value);
   throw e;
  }
 }
 return {get:()=>structuredClone(state),update,exportData,validateBackup,restore,error:()=>error,parse};
})();
