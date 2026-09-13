'use strict';
let resourceQuery='',resourcePage=0,resourceFilter='all';
let resourceDraft={},resourceOriginal={};
function resourcesInventory(){
 const state=CompanionStore.get();
 if(!extendedCatalog.item.length&&!extendedCatalog.loading.item&&!extendedCatalog.errors.item)queueMicrotask(()=>loadExtended('item'));
 const catalog=new Map(extendedCatalog.item.map(r=>[r.id,r]));
 for(const id of Object.keys(state.resources))if(!catalog.has(id))catalog.set(id,{id,name:id,type:'',image:''});
 const character=DATA.find(c=>c.id===state.active),goal=state.goals[state.active];
 const needed=character&&goal?new Set(currentCostPlan(character,goal).rows.filter(r=>r.remaining!==0).map(r=>r.id)):new Set();
 for(const [id,items]of [['exp:role',progressionTables?.roleExpItems],['exp:weapon',progressionTables?.weaponExpItems]])if(needed.has(id))for(const item of items||[])needed.add(String(item.Id));
 const filtered=[...catalog.values()].filter(r=>(r.name+' '+r.type+' '+r.id).toLocaleLowerCase().includes(resourceQuery.toLocaleLowerCase())&&(resourceFilter==='all'||resourceFilter==='known'&&state.resources[r.id]!=null||resourceFilter==='needed'&&needed.has(r.id)));
 const pages=Math.max(1,Math.ceil(filtered.length/30));resourcePage=Math.min(resourcePage,pages-1);const rows=filtered.slice(resourcePage*30,(resourcePage+1)*30);
 for(const row of rows)if(!Object.hasOwn(resourceOriginal,row.id))resourceOriginal[row.id]=state.resources[row.id]??null;
 return companionPanel(t('resources'),`<p>${tr('Une case vide signifie « inconnu ». Zéro confirme que tu n’en possèdes aucun. Les saisies restent présentes pendant la recherche.','An empty field means unknown. Zero confirms an empty stock. Edits remain while searching.')}</p>
 ${extendedCatalog.errors.item?`<p class="companion-note">${tr('Catalogue indisponible ; les stocks enregistrés restent accessibles.','Catalogue unavailable; recorded stock remains accessible.')}</p>${companionButton('reload-catalogue',tr('Réessayer','Retry'),'item')}`:''}
 <form id="resourceSearch" class="companion-form"><label>${tr('Rechercher','Search')}<input name="query" type="search" value="${esc(resourceQuery)}"></label><label>${tr('Afficher','Show')}<select name="filter">${[['all',tr('Toutes les ressources','All resources')],['known',tr('Stocks renseignés','Recorded stock')],['needed',tr('Besoin de l’objectif actif','Active goal needs')]].map(([v,n])=>`<option value="${v}" ${resourceFilter===v?'selected':''}>${n}</option>`).join('')}</select></label><button class="companion-button">${tr('Rechercher','Search')}</button></form>
 <form id="resourcesForm"><div class="companion-list">${rows.map(row=>inventoryCard(row,`<b>${esc(row.name)}</b><small>${esc(row.type)}</small><label class="companion-form"><input aria-label="${esc(row.name)}" name="item:${row.id}" type="number" min="0" max="1000000000000" step="1" placeholder="?" value="${Object.hasOwn(resourceDraft,row.id)?resourceDraft[row.id]??'':state.resources[row.id]??''}"></label>`)).join('')||`<p>${extendedCatalog.loading.item?tr('Chargement…','Loading…'):tr('Aucune ressource dans cette sélection.','No resources in this selection.')}</p>`}</div>
 <div class="companion-actions"><button class="companion-button">${tr('Enregistrer mes modifications','Save my changes')}</button>${companionButton('cancel-resources',tr('Annuler les modifications','Cancel changes'))}</div></form>
 <div class="companion-actions">${companionButton('resource-page',tr('Précédent','Previous'),Math.max(0,resourcePage-1))}<span>${resourcePage+1} / ${pages} · ${filtered.length}</span>${companionButton('resource-page',tr('Suivant','Next'),Math.min(pages-1,resourcePage+1))}</div>`);
}
Object.assign(companionActions,{
 'resource-page':value=>{resourcePage=Number(value);render();},
 'cancel-resources':()=>{resourceDraft={};resourceOriginal={};render();}
});
document.getElementById('view').addEventListener('input',event=>{if(event.target.form?.id==='resourcesForm'){const input=event.target;resourceDraft[input.name.slice(5)]=input.value===''?null:Number(input.value);}});
document.getElementById('view').addEventListener('submit',event=>{
 if(event.target.id==='resourceSearch'){event.preventDefault();const v=new FormData(event.target);resourceQuery=v.get('query');resourceFilter=v.get('filter');resourcePage=0;render();}
 if(event.target.id==='resourcesForm'){
  event.preventDefault();if(!Object.keys(resourceDraft).length)return;try{CompanionStore.saveResources(resourceDraft,resourceOriginal,tr('Ressources enregistrées','Resources saved'));resourceDraft={};resourceOriginal={};render();companionMessage(tr('Stocks enregistrés.','Stock saved.'));}
  catch{companionMessage(tr('Stocks non enregistrés : vérifie le stockage ou une modification dans un autre onglet. Les saisies sont conservées.','Stock not saved: check storage or a change in another tab. Edits are preserved.'),true);}
 }
});
