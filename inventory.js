'use strict';
let inventoryQuery='',inventoryEdit=null,inventoryOriginal=null;
const extendedCatalog={echo:[],item:[],loading:{},errors:{}};
function normalizeExtended(kind,payload){
 const rows=kind==='echo'?payload?.Echo:payload?.itemList;
 if(!Array.isArray(rows)||!rows.length)throw Error('Empty catalogue');
 const seen=new Set();
 const normalized=rows.map(row=>{
  if(!Number.isInteger(row.Id)||row.Id<=0||!content(row.Name).trim()||seen.has(row.Id))throw Error('Invalid catalogue ID/name');
  seen.add(row.Id);
  return {id:String(row.Id),name:content(row.Name),image:assetUrl(row.IconSmall||row.Icon),type:content(row.TypeName||row.Type),sets:(row.FetterGroups||[]).map(set=>({id:String(set.Id),name:content(set.Name)}))};
 });
 if(kind==='echo'){const names=new Map();for(const row of normalized)names.set(row.name,(names.get(row.name)||0)+1);for(const row of normalized)row.label=names.get(row.name)>1?row.name+' · '+row.sets.map(s=>s.name).join(' / ')+' · #'+row.id:row.name;}
 return normalized;
}
async function loadExtended(kind,{refresh=false}={}){
 if((extendedCatalog[kind].length&&!refresh)||extendedCatalog.loading[kind])return;
 extendedCatalog.loading[kind]=true;extendedCatalog.errors[kind]=null;
 const key='wwc_extra_catalog_v1:'+kind;
 try{
  let cached=null;try{cached=JSON.parse(localStorage.getItem(key)||'null');}catch{/* A corrupt optional cache must not prevent a fresh request. */}
  if(!refresh&&cached?.gameVersion===catalogState.gameVersion){try{extendedCatalog[kind]=normalizeExtended(kind,cached.payload);return;}catch{/* Fetch a valid replacement. */}}
  const payload=await fetchJSON(`${ENCORE_BASE}/en/${kind}`);
  const rows=normalizeExtended(kind,payload);extendedCatalog[kind]=rows;
  // Keep only a compact projection in the cache; no descriptions or raw assets.
  const slim=kind==='echo'?{Echo:rows.map(r=>({Id:Number(r.id),Name:r.name,Icon:r.image,Type:r.type,FetterGroups:r.sets.map(s=>({Id:s.id,Name:s.name}))}))}:{itemList:rows.map(r=>({Id:Number(r.id),Name:r.name,Icon:r.image,TypeName:r.type}))};
  try{localStorage.setItem(key,JSON.stringify({gameVersion:catalogState.gameVersion,payload:slim}));}catch(e){console.warn('Optional catalogue cache unavailable',e);}
 }catch(error){
  extendedCatalog.errors[kind]=true;
  try{const old=JSON.parse(localStorage.getItem(key)||'null');if(old?.payload)extendedCatalog[kind]=normalizeExtended(kind,old.payload);}catch(e){/* Preserve invalid cache for diagnosis. */}
 }finally{extendedCatalog.loading[kind]=false;document.dispatchEvent(new CustomEvent('catalogue-ready',{detail:kind}));if(kind==='item'&&currentView==='account'&&accountTab==='resources'&&!document.querySelector('#resourcesForm input'))render();}
}
function catalogOptions(rows,id){return `<datalist id="${id}">${rows.map(row=>`<option value="${esc(row.name)}"></option>`).join('')}</datalist>`;}
function inventorySearch(){return `<form id="inventorySearch" class="companion-form"><label>${tr('Rechercher','Search')}<input name="query" value="${esc(inventoryQuery)}" type="search"></label><button class="companion-button">${tr('Filtrer','Filter')}</button></form>`;}
function inventoryCard(row,body,buttons=''){return `<article class="companion-card"><img src="${esc(row?.image||'./assets/icon-192.png')}" alt="" loading="lazy"><div>${body}</div>${buttons?`<div class="companion-actions">${buttons}</div>`:''}</article>`;}
function personalInventory(){
 const data=CompanionStore.get();
 if(accountTab==='weap'){
  const edit=data.weapons.find(w=>w.id===inventoryEdit),source=WEAPONS.find(w=>w.id===edit?.catalogId);
  const filtered=data.weapons.filter(w=>(WEAPONS.find(x=>x.id===w.catalogId)?.name||w.name||w.catalogId).toLowerCase().includes(inventoryQuery.toLowerCase()));
  return companionPanel(t('weap'),`<p>${tr('Un enregistrement par exemplaire : deux armes R1 restent deux armes distinctes.','One record per copy: two R1 weapons remain two separate weapons.')}</p>
  <form id="weaponInventoryForm" class="companion-form"><label>${tr('Arme','Weapon')}<input name="weapon" list="weaponCatalogue" required value="${esc(source?.name||edit?.name||edit?.catalogId||'')}" autocomplete="off"></label>${catalogOptions(WEAPONS,'weaponCatalogue')}
  <label>${tr('Niveau','Level')}<input name="level" type="number" min="1" max="90" step="1" placeholder="?" value="${edit?edit.level??'':1}"></label><label>${tr('Syntonisation','Rank')}<select name="rank"><option value="" ${edit?.rank===null?'selected':''}>?</option>${[1,2,3,4,5].map(n=>`<option ${(edit?edit.rank:1)===n?'selected':''} value="${n}">R${n}</option>`).join('')}</select></label><button class="companion-button">${edit?tr('Enregistrer','Save'):tr('Ajouter cet exemplaire','Add this copy')}</button></form>
  ${edit?companionButton('cancel-inventory',tr('Annuler','Cancel')):''}${inventorySearch()}<div class="companion-list">${filtered.map(w=>{const row=WEAPONS.find(x=>x.id===w.catalogId),owner=CompanionStore.weaponOwner(data,w.id);return inventoryCard(row,`<b>${esc(row?.name||w.name||w.catalogId)} · #${data.weapons.indexOf(w)+1}</b><small>${tr('Niveau','Level')} ${w.level??'?'} · R${w.rank??'?'} · ${esc(row?weaponLabel(row.type):'?')}<br>${owner?esc(DATA.find(c=>c.id===owner)?.name||owner):tr('Non équipée','Unequipped')}</small>`,companionButton('edit-weapon',tr('Modifier','Edit'),w.id)+companionButton('remove-weapon',tr('Retirer','Remove'),w.id)+(owner&&DATA.some(c=>c.id===owner)?companionButton('edit-weapon-owner',tr('Voir le Résonateur','View Resonator'),owner):''));}).join('')||`<p>${tr('Aucun exemplaire enregistré.','No copies recorded.')}</p>`}</div>`);
 }
 if(accountTab==='echo')return echoInventory();
 const kind='item';
 if(!extendedCatalog[kind].length&&!extendedCatalog.loading[kind]&&!extendedCatalog.errors[kind])queueMicrotask(()=>loadExtended(kind));
 const rows=extendedCatalog[kind],filtered=rows.filter(r=>r.name.toLowerCase().includes(inventoryQuery.toLowerCase()));
 const notice=extendedCatalog.errors[kind]?`<p class="companion-note">${tr('Catalogue distant indisponible. Les données personnelles sont conservées.','Remote catalogue unavailable. Personal data is preserved.')}</p>${companionButton('reload-catalogue',tr('Réessayer','Retry'),kind)}`:rows.length?'':`<p>${tr('Chargement du catalogue…','Loading catalogue…')}</p>`;
 return companionPanel(t('resources'),`${notice}<p>${tr('Laisse la quantité vide si elle est inconnue. Zéro signifie un stock confirmé vide.','Leave quantity blank when unknown. Zero means confirmed empty stock.')}</p>${inventorySearch()}
 <form id="resourcesForm"><div class="companion-list">${filtered.slice(0,40).map(row=>inventoryCard(row,`<b>${esc(row.name)}</b><small>${esc(row.type)}</small><label class="companion-form"><input aria-label="${esc(row.name)}" name="item:${row.id}" type="number" min="0" max="1000000000000" step="1" placeholder="?" value="${data.resources[row.id]??''}"></label>`)).join('')}</div><p>${Math.min(40,filtered.length)} / ${filtered.length} · ${tr('Affiner la recherche pour accéder aux autres matériaux.','Refine search to access other materials.')}</p><button class="companion-button">${tr('Enregistrer les quantités affichées','Save displayed quantities')}</button></form>`);
}

Object.assign(companionActions,{
 'cancel-inventory':()=>{inventoryEdit=null;render();},
 'edit-weapon':id=>{inventoryEdit=id;inventoryOriginal=CompanionStore.get().weapons.find(w=>w.id===id)||null;render();},
 'edit-weapon-owner':id=>{const row=DATA.find(c=>c.id===id);if(row)openAccountEditor(row.name);},
 'remove-weapon':id=>{
  const data=CompanionStore.get(),copy=data.weapons.find(w=>w.id===id),owner=CompanionStore.weaponOwner(data,id);
  const name=DATA.find(c=>c.id===owner)?.name||owner;
  if(confirm(owner?tr('Retirer cet exemplaire et le déséquiper de '+name+' ?','Remove this copy and unequip it from '+name+'?'):tr('Retirer cet exemplaire ?','Remove this copy?'))){CompanionStore.removeWeapon(id,copy,owner,tr('Arme retirée','Weapon removed'));inventoryEdit=null;render();}
 },
 'reload-catalogue':kind=>loadExtended(kind,{refresh:true})
});
document.querySelector('#view').addEventListener('submit',event=>{
 const form=event.target;if(!['weaponInventoryForm','resourcesForm','inventorySearch'].includes(form.id))return;
 event.preventDefault();const values=new FormData(form);
 try{
  if(form.id==='inventorySearch'){inventoryQuery=String(values.get('query')||'');render();return;}
  if(form.id==='weaponInventoryForm'){
   const row=WEAPONS.find(w=>w.name===values.get('weapon'));const original=inventoryEdit?inventoryOriginal:null;
   const catalogId=row?.id||(original&&(values.get('weapon')===(original.name||original.catalogId))?original.catalogId:null);if(!catalogId)throw Error('Select a catalogue weapon');
   const record={id:inventoryEdit||crypto.randomUUID(),catalogId,level:values.get('level')===''?null:Number(values.get('level')),rank:values.get('rank')===''?null:Number(values.get('rank'))};
   CompanionStore.saveWeapon(record,original,{characters:DATA,weapons:WEAPONS},tr('Exemplaire d’arme enregistré','Weapon copy saved'));
  }else if(form.id==='resourcesForm'){
   CompanionStore.update(s=>{for(const [key,value] of values)if(key.startsWith('item:'))s.resources[key.slice(5)]=value===''?null:Number(value);},tr('Inventaire de ressources mis à jour','Resource inventory updated'));
  }
  inventoryEdit=null;render();companionMessage(tr('Enregistré sur cet appareil.','Saved on this device.'));
 }catch(error){console.error(error);companionMessage(tr('Non enregistré : vérifie la sélection et les valeurs.','Not saved: check the selection and values.'),true);}
});
