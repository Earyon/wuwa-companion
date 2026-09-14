'use strict';
const referenceRequests=new Map(),referenceFiles=new Map();
async function loadResonatorReference(id){
 const key=String(id);
 if(catalogState.gameVersion!==frenchGameText?.gameVersion||!frenchGameText?.names?.character?.[key])return null;
 if(referenceFiles.has(key))return referenceFiles.get(key);
 if(referenceRequests.has(key))return referenceRequests.get(key);
 const pending=(async()=>{
  try{
   const data=await fetchJSON('./data/resonators/'+encodeURIComponent(key)+'.json');
   if(data.schema!==1||String(data.Id)!==key||data.gameVersion!==catalogState.gameVersion||!Array.isArray(data.layout)||!data.locales?.fr?.Skills||!data.locales?.en?.Skills)throw Error('Invalid character reference');
   referenceFiles.set(key,data);return data;
  }catch{return null;}finally{referenceRequests.delete(key);}
 })();referenceRequests.set(key,pending);return pending;
}
function currentResonatorReference(){return referenceFiles.get(String(DATA.find(c=>c.name===editingName)?.gameId))||null;}
let weaponReferences=null,weaponReferenceRequest=null;
async function loadWeaponReference(id){
 if(!weaponReferences&&!weaponReferenceRequest)weaponReferenceRequest=(async()=>{try{const data=await fetchJSON('./data/weapons.json');if(data.schema===1&&data.gameVersion===catalogState.gameVersion&&Array.isArray(data.weapons))weaponReferences=new Map(data.weapons.map(w=>[String(w.ItemId),w]));}catch{}finally{weaponReferenceRequest=null;}})();
 if(weaponReferenceRequest)await weaponReferenceRequest;
 return weaponReferences?.get(String(id))||null;
}
