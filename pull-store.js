'use strict';
// Large histories are committed in a single IndexedDB transaction, separately
// from small account records. Never announce success before transaction completion.
const PullStore=(()=>{
 let opening=null;
 function open(){if(opening)return opening;opening=new Promise((resolve,reject)=>{
  const request=indexedDB.open('wuwa-companion-history',1);
  request.onupgradeneeded=()=>request.result.createObjectStore('accounts',{keyPath:'owner'});
  request.onerror=()=>reject(request.error);request.onblocked=()=>reject(Error('History open in another window'));
  request.onsuccess=()=>{const db=request.result;db.onversionchange=()=>{db.close();opening=null;};resolve(db);};
 }).catch(e=>{opening=null;throw e;});return opening;}
 async function all(){const db=await open();return new Promise((resolve,reject)=>{const tx=db.transaction('accounts','readonly'),req=tx.objectStore('accounts').getAll();tx.oncomplete=()=>resolve(req.result);tx.onabort=()=>reject(tx.error);});}
 async function merge(accounts){const db=await open();return new Promise((resolve,reject)=>{
  const tx=db.transaction('accounts','readwrite'),store=tx.objectStore('accounts');let failure=null,added=0;
  for(const a of accounts){const req=store.get(a.owner);req.onsuccess=()=>{try{const old=req.result?.rows||[],rows=TrackerImport.merge(old,a.rows);added+=rows.length-old.length;store.put({owner:a.owner,rows,updatedAt:new Date().toISOString()});}catch(e){failure=e;tx.abort();}};}
  tx.oncomplete=()=>resolve(added);tx.onabort=()=>reject(failure||tx.error||Error('History transaction aborted'));
 });}
 return {all,merge};
})();
