'use strict';
let inventoryQuery='',inventoryEdit=null;
const extendedCatalog={echo:[],item:[],loading:{},errors:{}};
function normalizeExtended(kind,payload){
 const rows=kind==='echo'?payload?.Echo:payload?.itemList;
 if(!Array.isArray(rows)||!rows.length)throw Error('Empty catalogue');
 const seen=new Set();
 return rows.map(row=>{
  if(!Number.isInteger(row.Id)||row.Id<=0||!content(row.Name).trim()||seen.has(row.Id))throw Error('Invalid catalogue ID/name');
  seen.add(row.Id);
  return {id:String(row.Id),name:content(row.Name),image:assetUrl(row.IconSmall||row.Icon),type:content(row.TypeName||row.Type),sets:(row.FetterGroups||[]).map(set=>({id:String(set.Id),name:content(set.Name)}))};
 });
}
async function loadExtended(kind){
 if(extendedCatalog[kind].length||extendedCatalog.loading[kind])return;
 extendedCatalog.loading[kind]=true;extendedCatalog.errors[kind]=null;
 const key='wwc_extra_catalog_v1:'+kind;
 try{
  const cached=JSON.parse(localStorage.getItem(key)||'null');
  if(cached?.gameVersion===catalogState.gameVersion){extendedCatalog[kind]=normalizeExtended(kind,cached.payload);return;}
  const payload=await fetchJSON(`${ENCORE_BASE}/en/${kind}`);
  const rows=normalizeExtended(kind,payload);extendedCatalog[kind]=rows;
  // Keep only a compact projection in the cache; no descriptions or raw assets.
  const slim=kind==='echo'?{Echo:rows.map(r=>({Id:Number(r.id),Name:r.name,Icon:r.image,Type:r.type,FetterGroups:r.sets.map(s=>({Id:s.id,Name:s.name}))}))}:{itemList:rows.map(r=>({Id:Number(r.id),Name:r.name,Icon:r.image,TypeName:r.type}))};
  try{localStorage.setItem(key,JSON.stringify({gameVersion:catalogState.gameVersion,payload:slim}));}catch(e){console.warn('Optional catalogue cache unavailable',e);}
 }catch(error){
  extendedCatalog.errors[kind]=true;
  try{const old=JSON.parse(localStorage.getItem(key)||'null');if(old?.payload)extendedCatalog[kind]=normalizeExtended(kind,old.payload);}catch(e){/* Preserve invalid cache for diagnosis. */}
 }finally{extendedCatalog.loading[kind]=false;if(currentView==='account'&&((kind==='echo'&&accountTab==='echo')||(kind==='item'&&accountTab==='resources')))render();}
}
function catalogOptions(rows,id){return `<datalist id="${id}">${rows.map(row=>`<option value="${esc(row.name)}"></option>`).join('')}</datalist>`;}
function inventorySearch(){return `<form id="inventorySearch" class="companion-form"><label>${tr('Rechercher','Search')}<input name="query" value="${esc(inventoryQuery)}" type="search"></label><button class="companion-button">${tr('Filtrer','Filter')}</button></form>`;}
function inventoryCard(row,body,buttons=''){return `<article class="companion-card"><img src="${esc(row?.image||'./assets/icon-192.png')}" alt="" loading="lazy"><div>${body}</div>${buttons?`<div class="companion-actions">${buttons}</div>`:''}</article>`;}
function personalInventory(){
 const data=CompanionStore.get();
 if(accountTab==='weap'){
  const edit=data.weapons.find(w=>w.id===inventoryEdit),source=WEAPONS.find(w=>w.id===edit?.catalogId);
  const filtered=data.weapons.filter(w=>(WEAPONS.find(x=>x.id===w.catalogId)?.name||w.catalogId).toLowerCase().includes(inventoryQuery.toLowerCase()));
  return companionPanel(t('weap'),`<p>${tr('Un enregistrement par exemplaire : deux armes R1 restent deux armes distinctes.','One record per copy: two R1 weapons remain two separate weapons.')}</p>
  <form id="weaponInventoryForm" class="companion-form"><label>${tr('Arme','Weapon')}<input name="weapon" list="weaponCatalogue" required value="${esc(source?.name||'')}" autocomplete="off"></label>${catalogOptions(WEAPONS,'weaponCatalogue')}
  <label>${tr('Niveau','Level')}<input name="level" type="number" required min="1" max="90" step="1" value="${edit?.level||1}"></label><label>${tr('Syntonisation','Rank')}<select name="rank">${[1,2,3,4,5].map(n=>`<option ${edit?.rank===n?'selected':''} value="${n}">R${n}</option>`).join('')}</select></label><button class="companion-button">${edit?tr('Enregistrer','Save'):tr('Ajouter cet exemplaire','Add this copy')}</button></form>
  ${edit?companionButton('cancel-inventory',tr('Annuler','Cancel')):''}${inventorySearch()}<div class="companion-list">${filtered.map(w=>{const row=WEAPONS.find(x=>x.id===w.catalogId);return inventoryCard(row,`<b>${esc(row?.name||w.catalogId)}</b><small>${tr('Niveau','Level')} ${w.level} · R${w.rank} · ${esc(row?weaponLabel(row.type):'?')}</small>`,companionButton('edit-weapon',tr('Modifier','Edit'),w.id)+companionButton('remove-weapon',tr('Retirer','Remove'),w.id));}).join('')||`<p>${tr('Aucun exemplaire enregistré.','No copies recorded.')}</p>`}</div>`);
 }
 const kind=accountTab==='echo'?'echo':'item';
 if(!extendedCatalog[kind].length&&!extendedCatalog.loading[kind]&&!extendedCatalog.errors[kind])queueMicrotask(()=>loadExtended(kind));
 const rows=extendedCatalog[kind],filtered=rows.filter(r=>r.name.toLowerCase().includes(inventoryQuery.toLowerCase()));
 const notice=extendedCatalog.errors[kind]?`<p class="companion-note">${tr('Catalogue distant indisponible. Les données personnelles sont conservées.','Remote catalogue unavailable. Personal data is preserved.')}</p>${companionButton('reload-catalogue',tr('Réessayer','Retry'),kind)}`:rows.length?'':`<p>${tr('Chargement du catalogue…','Loading catalogue…')}</p>`;
 if(kind==='item')return companionPanel(t('resources'),`${notice}<p>${tr('Laisse la quantité vide si elle est inconnue. Zéro signifie un stock confirmé vide.','Leave quantity blank when unknown. Zero means confirmed empty stock.')}</p>${inventorySearch()}
 <form id="resourcesForm"><div class="companion-list">${filtered.slice(0,40).map(row=>inventoryCard(row,`<b>${esc(row.name)}</b><small>${esc(row.type)}</small><label class="companion-form"><input aria-label="${esc(row.name)}" name="item:${row.id}" type="number" min="0" max="1000000000000" step="1" placeholder="?" value="${data.resources[row.id]??''}"></label>`)).join('')}</div><p>${Math.min(40,filtered.length)} / ${filtered.length} · ${tr('Affiner la recherche pour accéder aux autres matériaux.','Refine search to access other materials.')}</p><button class="companion-button">${tr('Enregistrer les quantités affichées','Save displayed quantities')}</button></form>`);
 const edit=data.echoes.find(e=>e.id===inventoryEdit);
 const ownedRows=DATA.filter(r=>ownedIds.includes(r.id));
 return companionPanel(t('echo'),`${notice}<p>${tr('Enregistre les Échos équipés sur tes Résonateurs importants.','Record Echoes equipped on your important Resonators.')}</p>
 <form id="echoInventoryForm" class="companion-form"><label>${tr('Résonateur','Resonator')}<select name="owner" required>${ownedRows.map(r=>`<option value="${r.id}" ${edit?.owner===r.id?'selected':''}>${esc(r.name)}</option>`).join('')}</select></label>
 <label>Écho<input name="echo" list="echoCatalogue" required value="${esc(rows.find(e=>e.id===edit?.catalogId)?.name||'')}" autocomplete="off"></label>${catalogOptions(rows,'echoCatalogue')}
 <label>${tr('Emplacement','Slot')}<select name="slot">${[1,2,3,4,5].map(n=>`<option ${edit?.slot===n?'selected':''} value="${n}">${n}${n===1?' · Main Echo':''}</option>`).join('')}</select></label>
 <label>${tr('Niveau','Level')}<input name="level" type="number" min="0" max="25" required step="1" value="${edit?.level??0}"></label>
 <label>${tr('Statistique principale','Main stat')}<input name="mainStat" maxlength="80" value="${esc(edit?.mainStat||'')}" placeholder="?"></label>
 <label>${tr('Valeur principale','Main value')}<input name="mainValue" maxlength="30" value="${esc(edit?.mainValue||'')}" placeholder="?"></label>
 <label class="wide">${tr('Sous-statistiques (une par ligne : nom et valeur)','Substats (one per line: name and value)')}<textarea name="substats" rows="3" maxlength="500">${esc(edit?.substats?.join('\n')||'')}</textarea></label>
 <button class="companion-button">${tr('Enregistrer cet Écho','Save this Echo')}</button></form>${edit?companionButton('cancel-inventory',tr('Annuler','Cancel')):''}
 <div class="companion-list">${data.echoes.map(e=>inventoryCard(rows.find(x=>x.id===e.catalogId),`<b>${esc(rows.find(x=>x.id===e.catalogId)?.name||e.catalogId)}</b><small>${esc(DATA.find(r=>r.id===e.owner)?.name||e.owner)} · ${e.slot} · ${tr('Niveau','Level')} ${e.level}<br>${esc(e.mainStat||'?')} ${esc(e.mainValue||'')}<br>${esc(e.substats.join(' · '))}</small>`,companionButton('edit-echo',tr('Modifier','Edit'),e.id)+companionButton('remove-echo',tr('Retirer','Remove'),e.id))).join('')}</div>`);
}
Object.assign(companionActions,{
 'cancel-inventory':()=>{inventoryEdit=null;render();},
 'edit-weapon':id=>{inventoryEdit=id;render();},
 'edit-echo':id=>{inventoryEdit=id;render();},
 'remove-weapon':id=>{if(confirm(tr('Retirer cet exemplaire ?','Remove this copy?'))){CompanionStore.update(s=>{s.weapons=s.weapons.filter(w=>w.id!==id);},tr('Arme retirée','Weapon removed'));inventoryEdit=null;render();}},
 'remove-echo':id=>{if(confirm(tr('Retirer cet Écho équipé ?','Remove this equipped Echo?'))){CompanionStore.update(s=>{s.echoes=s.echoes.filter(e=>e.id!==id);},tr('Écho retiré','Echo removed'));inventoryEdit=null;render();}},
 'reload-catalogue':kind=>{extendedCatalog[kind]=[];return loadExtended(kind);}
});
document.querySelector('#view').addEventListener('submit',event=>{
 const form=event.target;if(!['weaponInventoryForm','echoInventoryForm','resourcesForm','inventorySearch'].includes(form.id))return;
 event.preventDefault();const values=new FormData(form);
 try{
  if(form.id==='inventorySearch'){inventoryQuery=String(values.get('query')||'');render();return;}
  if(form.id==='weaponInventoryForm'){
   const row=WEAPONS.find(w=>w.name===values.get('weapon'));if(!row)throw Error('Select a catalogue weapon');
   const record={id:inventoryEdit||crypto.randomUUID(),catalogId:row.id,level:Number(values.get('level')),rank:Number(values.get('rank'))};
   CompanionStore.update(s=>{s.weapons=s.weapons.filter(w=>w.id!==record.id);s.weapons.push(record);},tr('Exemplaire d’arme enregistré','Weapon copy saved'));
  }else if(form.id==='resourcesForm'){
   CompanionStore.update(s=>{for(const [key,value] of values)if(key.startsWith('item:'))s.resources[key.slice(5)]=value===''?null:Number(value);},tr('Inventaire de ressources mis à jour','Resource inventory updated'));
  }else{
   const row=extendedCatalog.echo.find(e=>e.name===values.get('echo'));if(!row||!ownedIds.includes(values.get('owner')))throw Error('Select an Echo and owned Resonator');
   const record={id:inventoryEdit||crypto.randomUUID(),catalogId:row.id,owner:String(values.get('owner')),slot:Number(values.get('slot')),level:Number(values.get('level')),mainStat:String(values.get('mainStat')),mainValue:String(values.get('mainValue')),substats:String(values.get('substats')).split('\n').map(s=>s.trim()).filter(Boolean)};
   if(record.substats.length>5)throw Error('At most five substats');
   const previous=CompanionStore.get().echoes.find(e=>e.owner===record.owner&&e.slot===record.slot&&e.id!==record.id);
   if(previous&&!confirm(tr('Remplacer l’Écho déjà enregistré à cet emplacement ?','Replace the Echo already recorded in this slot?')))return;
   CompanionStore.update(s=>{s.echoes=s.echoes.filter(e=>e.id!==record.id&&!(e.owner===record.owner&&e.slot===record.slot));s.echoes.push(record);},tr('Écho équipé enregistré','Equipped Echo saved'));
  }
  inventoryEdit=null;render();companionMessage(tr('Enregistré sur cet appareil.','Saved on this device.'));
 }catch(error){console.error(error);companionMessage(tr('Non enregistré : vérifie la sélection et les valeurs.','Not saved: check the selection and values.'),true);}
});
