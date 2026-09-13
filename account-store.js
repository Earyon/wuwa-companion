'use strict';
// Personal records only. Game catalogues are cached independently.
const CompanionStore=(()=>{
 const KEY='wwc_companion_v1';
 const PERSONAL=[KEY,'wwc_owned_ids','wwc_owned','wwc_account_data','wwc_lang'];
 const blank=()=>({version:6,roster:null,characters:{},legacyProgress:{},weapons:[],echoes:[],resources:{},goals:{},active:null,wishlist:[],teams:[],activities:[],achievements:{},settings:{},builds:[],journal:[]});
 const object=x=>!!x&&typeof x==='object'&&!Array.isArray(x);
 const number=(x,min,max)=>Number.isFinite(x)&&x>=min&&x<=max;
 function parse(raw){return JSON.parse(raw,(key,value)=>{if(['__proto__','prototype','constructor'].includes(key))throw Error('Invalid key');return value;});}
 function validateAscension(level,ascension){if(ascension==null)return;const caps=[20,40,50,60,70,80,90],mins=[1,20,40,50,60,70,80];if(!Number.isInteger(ascension)||ascension<0||ascension>6||(level!=null&&(level>caps[ascension]||level<mins[ascension])))throw Error('Invalid ascension');}
 function validateProgress(records){
    for(const p of Object.values(records)){
     if(!object(p)||(p.level!=null&&(!Number.isInteger(p.level)||!number(p.level,1,90)))||(p.sequence!=null&&(!Number.isInteger(p.sequence)||!number(p.sequence,0,6))))throw Error('Invalid character progress');
     validateAscension(p.level,p.ascension);
     if(p.skills){if(!object(p.skills))throw Error('Invalid skills');for(const v of Object.values(p.skills))if(!Number.isInteger(v)||!number(v,1,10))throw Error('Invalid skill level');}
     if(p.forteNodes&&(!object(p.forteNodes)||Object.values(p.forteNodes).some(v=>typeof v!=='boolean')))throw Error('Invalid passive');
     if(p.weapon!=null&&(!object(p.weapon)||typeof p.weapon.name!=='string'||(p.weapon.level!=null&&(!Number.isInteger(p.weapon.level)||!number(p.weapon.level,1,90)))||(p.weapon.rank!=null&&(!Number.isInteger(p.weapon.rank)||!number(p.weapon.rank,1,5)))))throw Error('Invalid equipped weapon');
    }
 }
 function upgrade(data){
  validate(data);
  const next=data.version===1?{...data,roster:null,characters:{},legacyProgress:{}}:{...data};
  if(data.version<4)next.echoes=data.echoes.map(e=>({id:e.id,catalogId:e.catalogId,name:e.catalogId,owner:e.owner,slot:e.slot,level:e.level,quality:null,cost:null,setId:null,main:null,secondary:null,substats:[],legacyStats:{mainStat:e.mainStat,mainValue:e.mainValue,substats:e.substats}}));
  next.achievements??={};next.settings??={};next.builds??=[];next.version=6;validate(next);return next;
 }
 function validate(data){
  if(!object(data)||![1,2,3,4,5,6].includes(data.version))throw Error('Unsupported account format');
  if(data.version>=2){
   if(data.roster!==null&&(!Array.isArray(data.roster)||data.roster.some(id=>typeof id!=='string')||new Set(data.roster).size!==data.roster.length))throw Error('Invalid roster');
   if(!object(data.characters)||!object(data.legacyProgress))throw Error('Invalid progress');
   validateProgress(data.characters);validateProgress(data.legacyProgress);
  }
  for(const key of ['weapons','echoes','wishlist','teams','activities','journal'])if(!Array.isArray(data[key]))throw Error('Invalid '+key);
  for(const key of ['resources','goals'])if(!object(data[key]))throw Error('Invalid '+key);
  if(data.active!==null&&typeof data.active!=='string')throw Error('Invalid active goal');
  const ids=new Set();
  for(const w of data.weapons){
   if(!object(w)||typeof w.id!=='string'||!w.id||ids.has(w.id)||typeof w.catalogId!=='string'||!w.catalogId||(w.name!=null&&typeof w.name!=='string')||(w.level!==null&&(!number(w.level,1,90)||!Number.isInteger(w.level)))||(w.rank!==null&&(!number(w.rank,1,5)||!Number.isInteger(w.rank))))throw Error('Invalid weapon');
   validateAscension(w.level,w.ascension);
   ids.add(w.id);
  }
  const equipped=new Set();
  for(const p of Object.values(data.characters||{}))if(p.weaponCopyId!=null){
   if(typeof p.weaponCopyId!=='string'||!ids.has(p.weaponCopyId)||equipped.has(p.weaponCopyId)||p.weapon!=null)throw Error('Invalid equipment link');
   equipped.add(p.weaponCopyId);
  }
  for(const value of Object.values(data.resources))if(value!==null&&(!Number.isInteger(value)||!number(value,0,1e12)))throw Error('Invalid quantity');
  for(const goal of Object.values(data.goals)){
   if(!object(goal)||(goal.level!==null&&(!Number.isInteger(goal.level)||!number(goal.level,1,90)))||!object(goal.skills)||!object(goal.priorities))throw Error('Invalid goal');
   validateAscension(goal.level,goal.ascension);validateAscension(goal.weaponLevel,goal.weaponAscension);
   if(goal.weaponLevel!=null&&(!Number.isInteger(goal.weaponLevel)||!number(goal.weaponLevel,1,90)))throw Error('Invalid weapon goal');
   if(goal.forteNodes&&(!object(goal.forteNodes)||Object.values(goal.forteNodes).some(v=>typeof v!=='boolean')))throw Error('Invalid passive target');
   for(const value of Object.values(goal.skills))if(!Number.isInteger(value)||!number(value,1,10))throw Error('Invalid skill target');
   for(const value of Object.values(goal.priorities))if(!Number.isInteger(value)||!number(value,0,3))throw Error('Invalid priority');
  }
  for(const team of data.teams)if(!object(team)||typeof team.id!=='string'||typeof team.name!=='string'||!Array.isArray(team.members)||team.members.length!==3||new Set(team.members).size!==3||!team.members.every(x=>typeof x==='string'))throw Error('Invalid team');
  const echoSlots=new Set();
  const echoIds=new Set();
  for(const echo of data.echoes){
   if(data.version>=4){EchoRules.validate(echo);if(echoIds.has(echo.id)||(echo.owner!==null&&echoSlots.has(echo.owner+':'+echo.slot)))throw Error('Invalid Echo slot');}
   else {
   if(!object(echo)||typeof echo.id!=='string'||echoIds.has(echo.id)||typeof echo.catalogId!=='string'||typeof echo.owner!=='string'||!Number.isInteger(echo.level)||!number(echo.level,0,25)||!Number.isInteger(echo.slot)||!number(echo.slot,1,5)||typeof echo.mainStat!=='string'||typeof echo.mainValue!=='string'||!Array.isArray(echo.substats)||echo.substats.length>5||echo.substats.some(x=>typeof x!=='string')||echoSlots.has(echo.owner+':'+echo.slot))throw Error('Invalid Echo');
   }
   if(echo.owner!==null)echoSlots.add(echo.owner+':'+echo.slot);
   echoIds.add(echo.id);
  }
  for(const activity of data.activities)if(!object(activity)||typeof activity.id!=='string'||typeof activity.name!=='string'||!['unknown','todo','done'].includes(activity.status))throw Error('Invalid activity');
  if(!data.wishlist.every(id=>typeof id==='string'))throw Error('Invalid wishlist');
  if(data.achievements!==undefined&&(!object(data.achievements)||Object.values(data.achievements).some(v=>!['unknown','todo','done'].includes(v))))throw Error('Invalid achievements');
  if(data.settings!==undefined){if(!object(data.settings))throw Error('Invalid settings');if(data.settings.server!=null&&!['america','europe','asia','sea','hmt'].includes(data.settings.server))throw Error('Invalid server');}
  for(const a of data.activities){if(a.name.length>160||a.id.length>160||(a.period!=null&&!['once','daily','weekly'].includes(a.period))||(a.cycle!=null&&typeof a.cycle!=='string')||(a.end!=null&&(!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(:\d{2}Z)?$/.test(a.end)||!Number.isFinite(Date.parse(a.end.endsWith('Z')?a.end:a.end+'Z')))))throw Error('Invalid activity schedule');}
  if(new Set(data.activities.map(a=>a.id)).size!==data.activities.length)throw Error('Duplicate activity');
  if(data.builds!==undefined){
   if(!Array.isArray(data.builds)||new Set(data.builds.map(b=>b.id)).size!==data.builds.length)throw Error('Invalid builds');
   for(const b of data.builds){
    if(!object(b)||typeof b.id!=='string'||!b.id||typeof b.characterId!=='string'||typeof b.name!=='string'||!b.name.trim()||b.name.length>80||!['dps','hybrid','support'].includes(b.role)||typeof b.context!=='string'||b.context.length>200||typeof b.notes!=='string'||b.notes.length>2000)throw Error('Invalid build');
    for(const k of ['weaponId','echoId','setId'])if(b[k]!==null&&typeof b[k]!=='string')throw Error('Invalid build reference');
    if(!object(b.stats)||Object.entries(b.stats).some(([k,v])=>!['main4','main3','main3b','main1'].includes(k)||v!==null&&!EchoRules.mainTypes(k==='main4'?4:k==='main1'?1:3).includes(v)))throw Error('Invalid build stats');
    if(!Array.isArray(b.substats)||b.substats.length>5||new Set(b.substats).size!==b.substats.length||b.substats.some(k=>!EchoRules.subTypes.includes(k)))throw Error('Invalid build priorities');
   }
  }
  if(new Set(data.teams.map(t=>t.id)).size!==data.teams.length)throw Error('Duplicate team');
  for(const team of data.teams){if(team.favorite!==undefined&&typeof team.favorite!=='boolean')throw Error('Invalid favorite');if(team.builds!==undefined){if(!object(team.builds))throw Error('Invalid team builds');for(const [id,ref]of Object.entries(team.builds)){if(!team.members.includes(id)||ref!==null&&!data.builds?.some(b=>b.id===ref&&b.characterId===id))throw Error('Invalid team build reference');}}}
  for(const entry of data.journal)if(!object(entry)||typeof entry.id!=='string'||typeof entry.label!=='string'||typeof entry.at!=='string'||!Number.isFinite(Date.parse(entry.at)))throw Error('Invalid journal');
  return data;
 }
 let error=null,state;
 try{state=localStorage.getItem(KEY)?upgrade(parse(localStorage.getItem(KEY))):blank();}catch(e){error=e;state=blank();}
 function commit(next,label){
  if(error)throw Error('Saved account cannot be read. Export it before restoring a backup.');
  const value=validate(structuredClone(next));
  if(label)value.journal=[{id:crypto.randomUUID(),at:new Date().toISOString(),label,source:'manual'},...value.journal].slice(0,500);
  localStorage.setItem(KEY,JSON.stringify(value));state=value;
 }
 function update(change,label){
  // Read the latest committed record before each change, including other tabs.
  const raw=localStorage.getItem(KEY);const next=raw?upgrade(parse(raw)):blank();
  change(next);
  if(localStorage.getItem(KEY)!==raw)throw Error('Account changed in another window');
  commit(next,label);return next;
 }
 window.addEventListener('storage',event=>{
  if(event.key!==KEY)return;
  try{state=event.newValue?upgrade(parse(event.newValue)):blank();error=null;}catch(e){error=e;}
 });
 const same=(a,b)=>JSON.stringify(a)===JSON.stringify(b);
 const weaponOwner=(data,id)=>Object.keys(data.characters).find(key=>data.characters[key].weaponCopyId===id)||null;
 function compatible(catalog,characterId,catalogId){
  const character=catalog.characters.find(c=>c.id===characterId),weapon=catalog.weapons.find(w=>w.id===catalogId);
  if(!character||!weapon||character.weapon==='Unknown'||character.weapon!==weapon.type)throw Error('Incompatible weapon');
  return weapon;
 }
 function saveCharacter(id,progress,expected,label,equipment=null,catalog=null,echoDraft=null){
  if(typeof id!=='string'||!id)throw Error('Invalid character ID');
  return update(next=>{
   if(next.roster===null)throw Error('Migration required');
   if(!same(next.characters[id]||{},expected))throw Error('Character changed in another window');
   if(equipment){
    progress=structuredClone(progress);
    if(equipment.mode==='copy'||equipment.mode==='new'){
     if(!next.roster.includes(id))throw Error('Character is no longer owned');
     let copy;
     if(equipment.mode==='copy'){
      copy=next.weapons.find(w=>w.id===equipment.id);
      if(!copy||!same(copy,equipment.expected))throw Error('Weapon changed in another window');
      const owner=weaponOwner(next,copy.id);
      if(owner&&owner!==id)throw Error('Weapon is already equipped');
      // An existing link stays editable if its remote catalogue row disappears.
      if(expected.weaponCopyId!==copy.id)compatible(catalog,id,copy.catalogId);
     }else{
      const row=compatible(catalog,id,equipment.catalogId);
      copy={id:crypto.randomUUID(),catalogId:row.id,name:row.name,level:null,rank:null};
      next.weapons.push(copy);
     }
     copy.level=equipment.level;copy.rank=equipment.rank;if(Object.hasOwn(equipment,'ascension'))copy.ascension=equipment.ascension;
     progress.weapon=null;progress.weaponCopyId=copy.id;
    }else if(equipment.mode==='none'){
     progress.weapon=null;delete progress.weaponCopyId;
    }else if(equipment.mode==='keep')progress.weapon=expected.weapon??null;
    else throw Error('Invalid equipment choice');
   }
   if(echoDraft)applyEchoChanges(next,echoDraft.before,echoDraft.after,id);
   next.characters[id]=progress;
  },label);
 }
 function saveWeapon(record,expected,catalog,label){
  return update(next=>{
   const current=next.weapons.find(w=>w.id===record.id);
   if(!same(current||null,expected))throw Error('Weapon changed in another window');
   const row=catalog.weapons.find(w=>w.id===record.catalogId);
   if(!row&&current?.catalogId!==record.catalogId)throw Error('Unknown weapon');
   const owner=weaponOwner(next,record.id);
   if(owner&&current.catalogId!==record.catalogId)compatible(catalog,owner,record.catalogId);
   const value={...current,...record,name:row?.name||current?.name||record.catalogId};
   if(current)next.weapons[next.weapons.indexOf(current)]=value;else next.weapons.push(value);
  },label);
 }
 function removeWeapon(id,expected,expectedOwner,label){
  return update(next=>{
   const copy=next.weapons.find(w=>w.id===id),owner=weaponOwner(next,id);
   if(!same(copy,expected)||owner!==expectedOwner)throw Error('Equipment changed in another window');
   if(owner){delete next.characters[owner].weaponCopyId;next.characters[owner].weapon=null;}
   next.weapons=next.weapons.filter(w=>w.id!==id);
  },label);
 }
 // Patch only changed copies; reject stale drafts without overwriting another tab.
 function applyEchoChanges(next,before,after,characterId=null){
  const changed=[...new Set([...before,...after].map(e=>e.id))].filter(id=>!same(before.find(e=>e.id===id),after.find(e=>e.id===id)));
  const owners=new Set();
  for(const id of changed){
   const expected=before.find(e=>e.id===id),value=after.find(e=>e.id===id),current=next.echoes.find(e=>e.id===id);
   if(!same(current,expected))throw Error('Echo changed in another window');
   if(value){
    EchoRules.validate(value);
    if(value.owner!==null&&value.owner!==expected?.owner&&!next.roster?.includes(value.owner))throw Error('Character is no longer owned');
    if(characterId&&value.owner!==null&&value.owner!==characterId&&!same(value,expected))throw Error('Echo belongs to another character');
    if(value.owner)owners.add(value.owner);
   }
   const index=next.echoes.findIndex(e=>e.id===id);
   if(value){if(index<0)next.echoes.push(structuredClone(value));else next.echoes[index]=structuredClone(value);}
   else if(index>=0)next.echoes.splice(index,1);
  }
  // 12 is the game's absolute ceiling; unknown costs are never treated as confirmed zero.
  for(const owner of owners)if(next.echoes.filter(e=>e.owner===owner).reduce((n,e)=>n+(e.cost??0),0)>12)throw Error('Echo cost exceeds 12');
 }
 function saveEcho(record,expected,catalog,label){
  return update(next=>{
   const row=catalog.find(e=>e.id===record.catalogId);
   if(!row&&record.catalogId!==expected?.catalogId)throw Error('Unknown Echo');
   if(record.setId!==null&&(record.setId!==expected?.setId||record.catalogId!==expected?.catalogId)&&!row?.sets.some(s=>s.id===record.setId))throw Error('Unknown Sonata');
   applyEchoChanges(next,expected?[expected]:[],[{...record,name:row?.name||expected?.name||record.catalogId}]);
  },label);
 }
 function removeEcho(id,expected,label){return update(next=>{if(!expected||id!==expected.id)throw Error('Missing Echo');applyEchoChanges(next,[expected],[]);},label);}
 function saveGoal(id,goal,expected,activate,label){return update(next=>{if(!same(next.goals[id]||null,expected))throw Error('Goal changed in another window');if(!next.roster?.includes(id))throw Error('Character is not owned');next.goals[id]=goal;if(activate)next.active=id;},label);}
 function saveResources(changes,expected,label){return update(next=>{for(const [id,value] of Object.entries(changes)){if((next.resources[id]??null)!==(expected[id]??null))throw Error('Stock changed in another window');next.resources[id]=value;}},label);}
 function saveTeam(team,expected,label,catalog=[]){return update(s=>{const current=s.teams.find(t=>t.id===team.id)||null;if(!same(current,expected))throw Error('Team changed in another window');if(team.members.some(id=>!s.roster?.includes(id)))throw Error('Team members must be owned');const identities=team.members.map(id=>{const c=catalog.find(c=>c.id===id);return /^rover(?:\s*:|\s*$)/i.test(c?.name||'')?'rover':id;});if(new Set(identities).size!==3)throw Error('Only one Rover per team');if(current)s.teams[s.teams.indexOf(current)]=team;else s.teams.push(team);},label);}
 function saveBuild(build,expected,catalog,label){return update(s=>{const current=s.builds.find(b=>b.id===build.id)||null;if(!same(current,expected))throw Error('Build changed in another window');if(build.weaponId&&build.weaponId!==current?.weaponId)compatible(catalog,build.characterId,build.weaponId);if(current)s.builds[s.builds.indexOf(current)]=build;else s.builds.push(build);},label);}
 function migrate(resolve){
  if(error)throw error;
  if(state.roster!==null)return;
  const read=(key,fallback)=>{const raw=localStorage.getItem(key);return raw===null?fallback:parse(raw);};
  const progress=read('wwc_account_data',{}),names=read('wwc_owned',[]),ids=read('wwc_owned_ids',null);
  if(!object(progress))throw Error('Invalid legacy progress');
  validateProgress(progress);
  for(const list of [names,ids])if(list!==null&&(!Array.isArray(list)||list.some(x=>typeof x!=='string')))throw Error('Invalid legacy roster');
  update(next=>{
   if(next.roster!==null)return;
   // An explicit empty roster is authoritative. Preserve unknown IDs and names.
   next.roster=[...new Set(ids===null?[...names,...Object.keys(progress)].map(ref=>resolve(ref)?.id||ref):ids)];
   for(const [name,value] of Object.entries(progress)){
    const id=resolve(name)?.id;
    if(id&&!Object.hasOwn(next.characters,id))next.characters[id]=value;
    else next.legacyProgress[name]=value;
   }
  });
 }
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
    validateProgress(parsed);
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
 return {get:()=>structuredClone(state),update,migrate,saveCharacter,saveWeapon,removeWeapon,weaponOwner,saveEcho,removeEcho,saveGoal,saveResources,saveTeam,saveBuild,exportData,validateBackup,restore,error:()=>error,parse};
})();
