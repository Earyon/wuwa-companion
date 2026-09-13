'use strict';
const TrackerImport=(()=>{
 const object=x=>!!x&&typeof x==='object'&&!Array.isArray(x);
 const int=(n,min,max)=>Number.isSafeInteger(n)&&n>=min&&n<=max;
 const text=(x,n)=>typeof x==='string'&&x.length>0&&x.length<=n;
 const nameKey=s=>s.normalize('NFKC').trim().toLocaleLowerCase('en');
 function parse(raw){
  if(typeof raw!=='string'||raw.length>20*1024*1024)throw Error('size');
  const data=JSON.parse(raw,(key,value)=>{if(['__proto__','prototype','constructor'].includes(key)||/token|recordid|queryargs|auth|password|url/i.test(key)&&value!=null)throw Error('sensitive');return value;});
  if(!object(data))throw Error('format');
  if(data.format==='wuwa-companion-pulls'&&data.version===1){
   if(!Array.isArray(data.accounts)||data.accounts.length>20||new Set(data.accounts.map(a=>a?.owner)).size!==data.accounts.length)throw Error('format');
   return {kind:'history',accounts:data.accounts.map(a=>normalizeHistory(a.owner,a.rows,true))};
  }
  if(Array.isArray(data.pulls)&&text(data.playerId,100)&&text(data.version,30)&&text(data.siteVersion,30))return {kind:'history',accounts:[normalizeHistory(data.playerId,data.pulls,false)]};
  // Public current ExportProfile and older single-profile exports. Only fields
  // whose meaning is established are projected; Tracker todos are not ownership.
  if((text(data.id,100)||text(data.playerId,100))&&Array.isArray(data.items)&&Array.isArray(data.achievements)&&Array.isArray(data.todos)){
   if(data.items.length>20000||data.achievements.length>10000||data.todos.length>1000)throw Error('size');
   const resources={},achievements={};
   for(const item of data.items){if(!object(item)||!int(item.id,1,1e10)||!int(item.value,0,1e12)||Object.hasOwn(resources,item.id))throw Error('items');resources[item.id]=item.value;}
   for(const id of data.achievements){if(!int(id,1,1e10))throw Error('achievements');achievements[id]='done';}
   return {kind:'profile',resources,achievements,ignoredPlans:data.todos.length};
  }
  throw Error('format');
 }
 function normalizeHistory(owner,rows,native){
  if(!text(owner,100)||!Array.isArray(rows)||rows.length>100000)throw Error('history');
  return {owner,rows:rows.map(row=>{
   if(!object(row))throw Error('row');
   const pool=native?row.pool:row.cardPoolType,quality=native?row.quality:row.qualityLevel,id=native?row.id:row.resourceId;
   if(!int(pool,1,999)||![3,4,5].includes(quality)||id!==null&&!int(id,1,1e10)||!text(row.name,240)||!text(row.time,60)||!/(Z|[+-]\d{2}:\d{2})$/.test(row.time)||!Number.isFinite(Date.parse(row.time)))throw Error('row');
   return {pool,quality,id,name:row.name,time:new Date(row.time).toISOString()};
  })};
 }
 function merge(before,incoming){
  // A snapshot is a multiset: keep the largest observed count of each pull,
  // including identical weapons in a ten-pull. Resolve absent IDs only when unique.
  const known=new Map();for(const r of [...before,...incoming])if(r.id!==null){const k=nameKey(r.name);if(!known.has(k))known.set(k,new Set());known.get(k).add(r.id);}
  const normalize=r=>{const ids=known.get(nameKey(r.name));return r.id===null&&ids?.size===1?{...r,id:[...ids][0]}:{...r};};
  const key=r=>JSON.stringify([r.pool,r.time,r.quality,r.id===null?'name:'+nameKey(r.name):r.id]);
  const existing=before.map(normalize),counts=new Map();for(const r of existing){const k=key(r);counts.set(k,(counts.get(k)||0)+1);}
  const seen=new Map();for(const raw of incoming){const r=normalize(raw),k=key(r),n=(seen.get(k)||0)+1;seen.set(k,n);if(n>(counts.get(k)||0))existing.push(r);}
  if(existing.length>100000)throw Error('size');
  return existing.sort((a,b)=>b.time.localeCompare(a.time)||a.pool-b.pool);
 }
 return {parse,merge,normalizeHistory};
})();
