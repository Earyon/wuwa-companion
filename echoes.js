'use strict';
let editingEchoes=null,echoFormState=null,echoPickerSlot=1;
let echoQuery='',echoFilter='all';
const echoRow=e=>extendedCatalog.echo.find(r=>r.id===e.catalogId);
const echoName=e=>echoRow(e)?.name||e.name||e.catalogId;
const echoOwner=e=>e.owner?(DATA.find(c=>c.id===e.owner)?.name||e.owner):tr('Non équipé','Unequipped');
const statLabel=type=>{const s=EchoRules.stats[type];return s?(lang==='fr'?s[0]:s[1])+(s[2]?' %':''):type;};
const statText=s=>s?`${statLabel(s.type)} : ${s.value??'?'}`:'?';
const echoButton=(action,label,value='')=>`<button type="button" class="companion-button" data-echo-action="${action}" data-value="${esc(value)}">${label}</button>`;
function echoDescription(e){
 const set=echoRow(e)?.sets.find(s=>s.id===e.setId);
 return `<b>${esc(echoName(e))}</b><small>${e.quality?'★'.repeat(e.quality):'? ★'} · ${tr('Coût','Cost')} ${e.cost??'?'} · ${tr('Niveau','Level')} ${e.level??'?'}<br>${esc(set?.name||e.setId||tr('Sonate inconnue','Unknown Sonata'))}<br>${esc(statText(e.main))} · ${esc(statText(e.secondary))}${e.substats.length?'<br>'+e.substats.map(s=>esc(statText(s))).join(' · '):''}</small>`;
}
function ensureEchoCatalogue(){if(!extendedCatalog.echo.length&&!extendedCatalog.loading.echo&&!extendedCatalog.errors.echo)queueMicrotask(()=>loadExtended('echo'));}
function echoCatalogueStatus(){return extendedCatalog.errors.echo?`<p class="companion-note">${tr('Catalogue indisponible. Tes Échos enregistrés restent accessibles.','Catalogue unavailable. Your recorded Echoes remain accessible.')}</p>${echoButton('retry',tr('Réessayer','Retry'))}`:extendedCatalog.echo.length?'':`<p class="companion-note">${tr('Chargement du catalogue…','Loading catalogue…')}</p>`;}
function echoInventory(){
 ensureEchoCatalogue();
 return companionPanel(t('echo'),`<div class="echo-heading"><p>${tr('Chaque exemplaire garde ses statistiques, même lorsqu’il est déséquipé.','Each copy retains its stats, even when unequipped.')}</p>${echoButton('add',tr('Ajouter un Écho','Add an Echo'))}</div>
 <form id="echoSearch" class="companion-form"><label>${tr('Rechercher','Search')}<input name="query" type="search" value="${esc(echoQuery)}"></label><label>${tr('Afficher','Show')}<select name="filter"><option value="all" ${echoFilter==='all'?'selected':''}>${tr('Tous','All')}</option><option value="free" ${echoFilter==='free'?'selected':''}>${tr('Non équipés','Unequipped')}</option><option value="equipped" ${echoFilter==='equipped'?'selected':''}>${tr('Équipés','Equipped')}</option></select></label><button class="companion-button">${tr('Filtrer','Filter')}</button></form><div id="echoInventoryList">${echoInventoryCards()}</div>`);
}
function echoInventoryCards(){
 const data=CompanionStore.get(),query=echoQuery.trim().toLocaleLowerCase();
 const rows=data.echoes.filter(e=>(echoFilter==='all'||(echoFilter==='free'?e.owner===null:e.owner!==null))&&[echoName(e),echoOwner(e),echoRow(e)?.sets.find(s=>s.id===e.setId)?.name||e.setId||''].some(s=>s.toLocaleLowerCase().includes(query)));
 return echoCatalogueStatus()+`<p class="companion-note">${rows.length} / ${data.echoes.length}</p><div class="companion-list">${rows.map(e=>inventoryCard(echoRow(e),echoDescription(e)+`<small>${esc(echoOwner(e))}${e.owner?' · '+e.slot+(e.slot===1?' · '+tr('Principal','Main'):''):''}</small>`,echoButton('edit',tr('Modifier','Edit'),e.id)+echoButton('delete',tr('Retirer','Remove'),e.id)+(e.owner&&DATA.some(c=>c.id===e.owner)?echoButton('owner',tr('Voir le Résonateur','View Resonator'),e.owner):''))).join('')||`<p>${tr('Aucun Écho dans cette sélection.','No Echoes in this selection.')}</p>`}</div>`;
}
function prepareEditorEchoes(state,owner){editingEchoes={owner,before:structuredClone(state.echoes),after:structuredClone(state.echoes)};drawEditorEchoes();}
function drawEditorEchoes(){
 if(!editingEchoes)return;
 const active=document.activeElement,focus=active?.closest('#editor-echo')?{action:active.dataset.echoAction,value:active.dataset.value}:null;
 const equipped=editingEchoes.after.filter(e=>e.owner===editingEchoes.owner),known=equipped.reduce((n,e)=>n+(e.cost??0),0),unknown=equipped.some(e=>e.cost===null);
 document.getElementById('editor-echo').innerHTML=`<div class="editor-panel-heading"><p class="editor-eyebrow">${tr('Équipement','Equipment')}</p><h3>${tr('Échos','Echoes')}</h3><p class="editor-hint">${tr('Le premier emplacement définit l’Écho principal. Remplacer un Écho conserve l’ancien dans l’inventaire.','The first slot defines the main Echo. Replacing an Echo keeps the previous copy in your inventory.')}</p></div>
 <div class="echo-cost ${known>12?'companion-error':''}">${tr('Coût renseigné','Recorded cost')} <strong>${known}${unknown?' + ?':''}</strong> / 12 <small>${tr('Plafond maximal ; ta Banque de données peut limiter le coût à 10.','Maximum cap; your Data Bank may limit cost to 10.')}</small></div>
 <div class="echo-slots">${[1,2,3,4,5].map(slot=>{const e=equipped.find(e=>e.slot===slot);return `<article class="echo-slot ${slot===1?'echo-main':''}"><h4>${slot===1?tr('Écho principal','Main Echo'):tr('Emplacement','Slot')+' '+slot}</h4>${e?`<div class="echo-slot-copy"><img src="${esc(echoRow(e)?.image||'./assets/icon-192.png')}" alt="">${echoDescription(e)}</div>`:`<p>${tr('Aucun Écho équipé','No Echo equipped')}</p>`}<div class="companion-actions">${echoButton('pick',e?tr('Remplacer','Replace'):tr('Équiper','Equip'),slot)}${e?echoButton('draft-edit',tr('Détails','Details'),e.id)+echoButton('unequip',tr('Déséquiper','Unequip'),slot):''}</div></article>`;}).join('')}</div>`;
 if(focus)document.querySelector('#editor-echo [data-echo-action="'+CSS.escape(focus.action==='unequip'?'pick':focus.action||'pick')+'"][data-value="'+CSS.escape(focus.value||'')+'"]')?.focus({preventScroll:true});
}
function openEchoPicker(slot){
 echoPickerSlot=Number(slot);ensureEchoCatalogue();
 document.getElementById('echoPickerTitle').textContent=tr('Écho · emplacement ','Echo · slot ')+slot;
 const search=document.getElementById('echoPickerQuery');search.value='';search.placeholder=tr('Rechercher un exemplaire…','Search a copy…');
 document.getElementById('echoPickerAdd').textContent=tr('Ajouter un nouvel exemplaire','Add a new copy');
 drawEchoPicker();openDialog('echoPicker');document.querySelector('.echo-picker-sheet').scrollTop=0;
}
function drawEchoPicker(){
 const q=document.getElementById('echoPickerQuery').value.toLocaleLowerCase();
 const list=editingEchoes.after.filter(e=>echoName(e).toLocaleLowerCase().includes(q));
 document.getElementById('echoPickerList').innerHTML=echoCatalogueStatus()+list.map(e=>{
  const other=e.owner!==null&&e.owner!==editingEchoes.owner;
  return `<button type="button" class="echo-choice" data-echo-action="choose" data-value="${esc(e.id)}" ${other?'disabled':''}>${echoDescription(e)}<small>${esc(echoOwner(e))}${e.owner?' · '+e.slot:''}</small></button>`;
 }).join('')+(list.length?'':`<p>${tr('Ajoute ton premier exemplaire pour l’équiper.','Add your first copy to equip it.')}</p>`);
}
function assignDraftEcho(record,slot){
 const owner=editingEchoes.owner;
 // A move releases the previous slot. A replacement releases, never deletes, the old copy.
 editingEchoes.after=editingEchoes.after.map(e=>e.id===record.id?record:e.owner===owner&&e.slot===slot?{...e,owner:null,slot:null}:e);
 if(!editingEchoes.after.some(e=>e.id===record.id))editingEchoes.after.push(record);
 drawEditorEchoes();
}
function echoStatFields(prefix,title,value,types){
 // Keep an incompatible draft selection visible so it can be corrected explicitly.
 const options=[...new Set([...types,...(value?[value.type]:[])])];
 return `<div class="echo-stat-row"><label>${title}<select name="${prefix}Type"><option value="">?</option>${options.map(type=>`<option value="${type}" ${value?.type===type?'selected':''}>${esc(statLabel(type))}</option>`).join('')}</select></label><label>${tr('Valeur','Value')}<input name="${prefix}Value" type="number" min="0" max="10000000" step="any" placeholder="?" value="${value?.value??''}"></label></div>`;
}
function echoCatalogueLabel(row){return row.label||row.name;}
function selectedEchoRow(value){
 const original=echoFormState?.original;
 if(original&&value===echoFormState.inputValue)return echoRow(original);
 const matches=extendedCatalog.echo.filter(r=>echoCatalogueLabel(r)===value);
 return matches.length===1?matches[0]:null;
}
function openEchoForm(id,{draft=false,slot=null}={}){
 const source=draft?editingEchoes.after:CompanionStore.get().echoes,record=source.find(e=>e.id===id)||null;
 echoFormState={original:record?structuredClone(record):null,draft,slot,inputValue:record?(echoRow(record)?echoCatalogueLabel(echoRow(record)):echoName(record)):''};ensureEchoCatalogue();
 const e=record||{quality:null,cost:null,level:null,setId:null,main:null,secondary:null,substats:[]};
 document.getElementById('echoFormTitle').textContent=record?tr('Modifier l’Écho','Edit Echo'):tr('Ajouter un Écho','Add Echo');
 document.getElementById('echoFormContent').innerHTML=`<form id="echoInventoryForm" class="companion-form"><div class="wide" id="echoFormStatus">${echoCatalogueStatus()}</div>
 <label class="wide">${tr('Écho du catalogue','Catalogue Echo')}<input name="echo" list="echoCatalogue" autocomplete="off" required value="${esc(echoFormState.inputValue)}"></label>${catalogOptions(extendedCatalog.echo,'echoCatalogue')}
 <div class="wide echo-metadata"><label>${tr('Qualité','Quality')}<select name="quality"><option value="">?</option>${[2,3,4,5].map(q=>`<option value="${q}" ${e.quality===q?'selected':''}>${'★'.repeat(q)}</option>`).join('')}</select></label>
 <label>${tr('Coût','Cost')}<select name="cost"><option value="">?</option>${[1,3,4].map(c=>`<option value="${c}" ${e.cost===c?'selected':''}>${c}</option>`).join('')}</select></label>
 <label>${tr('Niveau','Level')}<input name="level" type="number" min="0" max="25" step="1" placeholder="?" value="${e.level??''}"></label><label>${tr('Sonate','Sonata')}<select name="setId"></select></label></div>
 <p class="wide companion-note">${tr('Laisse « ? » lorsque la donnée n’est pas connue. Les valeurs sont celles de ton exemplaire en jeu.','Leave “?” when a value is unknown. Enter the values of your in-game copy.')}</p>
 <fieldset class="wide echo-stats"><legend>${tr('Statistiques principales','Main stats')}</legend>${echoStatFields('main',tr('Principale','Primary'),e.main,EchoRules.mainTypes(e.cost))}${echoStatFields('secondary',tr('Secondaire','Secondary'),e.secondary,e.cost===1?['hp']:e.cost===null?['hp','atk']:['atk'])}</fieldset>
 <fieldset class="wide echo-stats"><legend>${tr('Sous-statistiques débloquées','Unlocked substats')}</legend>${[0,1,2,3,4].map(i=>echoStatFields('sub'+i,String(i+1),e.substats[i],EchoRules.subTypes)).join('')}</fieldset>
 ${e.legacyStats?`<details class="wide"><summary>${tr('Anciennes saisies conservées','Preserved previous entries')}</summary><p>${esc(e.legacyStats.mainStat)} ${esc(e.legacyStats.mainValue)}<br>${e.legacyStats.substats.map(esc).join('<br>')}</p></details>`:''}
 <p id="echoFormError" class="wide companion-error" role="alert"></p><button type="submit" class="companion-button wide">${draft?tr('Appliquer à la fiche','Apply to sheet'):tr('Enregistrer cet Écho','Save this Echo')}</button></form>`;
 refreshEchoFormCatalogue();openDialog('echoForm');document.getElementById('echoFormContent').scrollTop=0;
}
function refreshEchoFormCatalogue(){
 const form=document.getElementById('echoInventoryForm');if(!form)return;
 const input=form.elements.echo,original=echoFormState.original;
 const rows=extendedCatalog.echo;
 document.getElementById('echoCatalogue').innerHTML=rows.map(r=>`<option value="${esc(echoCatalogueLabel(r))}"></option>`).join('');
 const row=selectedEchoRow(input.value);
 const select=form.elements.setId;
 const selected=select.dataset.ready?select.value:original?.setId||'';select.dataset.ready='true';
 form.elements.setId.innerHTML='<option value="">?</option>'+(row?.sets||[]).map(s=>`<option value="${esc(s.id)}">${esc(s.name)}</option>`).join('')+(selected&&!row?.sets.some(s=>s.id===selected)?`<option value="${esc(selected)}">${esc(selected)}</option>`:'');
 form.elements.setId.value=selected;
 document.getElementById('echoFormStatus').innerHTML=echoCatalogueStatus();
}
function readEchoForm(form){
 const v=new FormData(form),original=echoFormState.original;
 const row=selectedEchoRow(v.get('echo'));
 const catalogId=row?.id||(original&&v.get('echo')===echoFormState.inputValue?original.catalogId:null);
 if(!catalogId)throw Error(tr('Choisis un Écho dans le catalogue.','Choose an Echo from the catalogue.'));
 const num=key=>v.get(key)===''?null:Number(v.get(key));
 const stat=prefix=>{const type=v.get(prefix+'Type'),value=num(prefix+'Value');if(!type&&value!==null)throw Error(tr('Choisis le nom de chaque statistique renseignée.','Choose a type for each entered stat.'));return type?{type,value}:null;};
 const record={...original,id:original?.id||crypto.randomUUID(),catalogId,name:row?.name||original.name,owner:original?.owner??(echoFormState.draft?editingEchoes.owner:null),slot:original?.slot??echoFormState.slot,quality:num('quality'),cost:num('cost'),level:num('level'),setId:v.get('setId')||null,main:stat('main'),secondary:stat('secondary'),substats:[0,1,2,3,4].map(i=>stat('sub'+i)).filter(Boolean)};
 if(record.owner===null)record.slot=null;
 if(record.level!==null&&record.level>EchoRules.maxLevel(record.quality))throw Error(tr('Le niveau dépasse la limite de cette qualité.','Level exceeds this quality’s limit.'));
 if(record.substats.length>EchoRules.subLimit(record))throw Error(tr('Trop de sous-statistiques pour ce niveau ou cette qualité.','Too many substats for this level or quality.'));
 if(new Set(record.substats.map(s=>s.type)).size!==record.substats.length)throw Error(tr('Une sous-statistique ne peut apparaître qu’une fois.','A substat can only appear once.'));
 if(record.setId!==null&&(record.setId!==original?.setId||record.catalogId!==original?.catalogId)&&!row?.sets.some(s=>s.id===record.setId))throw Error(tr('Choisis une Sonate disponible pour cet Écho.','Choose an available Sonata for this Echo.'));
 try{EchoRules.validate(record);}catch{throw Error(tr('Vérifie les statistiques principales : elles doivent correspondre au coût choisi.','Check the main stats: they must match the selected cost.'));}
 return record;
}
document.getElementById('echoFormContent').addEventListener('submit',event=>{
 event.preventDefault();
 try{
  const record=readEchoForm(event.target);
  if(echoFormState.draft)assignDraftEcho(record,record.slot);
  else CompanionStore.saveEcho(record,echoFormState.original,extendedCatalog.echo,tr('Écho enregistré','Echo saved'));
  closeDialog('echoForm');if(!echoFormState.draft)render();else document.querySelector('#editor-echo [data-echo-action="pick"][data-value="'+record.slot+'"]')?.focus({preventScroll:true});
 }catch(e){document.getElementById('echoFormError').textContent=e.message.includes('another window')?tr('Cet Écho a changé dans un autre onglet. Ferme puis rouvre sa fiche.','This Echo changed in another tab. Close and reopen its sheet.'):e.name==='QuotaExceededError'?tr('Stockage plein. Tes modifications restent ouvertes.','Storage full. Your edits remain open.'):e.message==='Echo cost exceeds 12'?tr('Le coût total des Échos équipés dépasse 12.','Total equipped Echo cost exceeds 12.'):e.message;}
});
document.getElementById('echoFormContent').addEventListener('change',event=>{
 if(event.target.name==='echo')refreshEchoFormCatalogue();
 if(event.target.name==='cost'){
  const form=event.target.form,cost=event.target.value===''?null:Number(event.target.value);
  for(const [prefix,types] of [['main',EchoRules.mainTypes(cost)],['secondary',cost===1?['hp']:cost===null?['hp','atk']:['atk']]]){
   const select=form.elements[prefix+'Type'],value=select.value;
   select.innerHTML='<option value="">?</option>'+[...new Set([...types,...(value?[value]:[])])].map(t=>`<option value="${t}">${esc(statLabel(t))}</option>`).join('');select.value=value;
  }
 }
});
document.getElementById('echoForm').addEventListener('close',()=>{if(!document.getElementById('echoForm').open)document.getElementById('echoFormContent').replaceChildren();});
document.getElementById('echoPickerQuery').addEventListener('input',drawEchoPicker);
document.getElementById('echoPickerAdd').addEventListener('click',()=>{closeDialog('echoPicker');openEchoForm(null,{draft:true,slot:echoPickerSlot});});
document.getElementById('echoPickerClose').addEventListener('click',()=>closeDialog('echoPicker'));
document.getElementById('echoFormClose').addEventListener('click',()=>closeDialog('echoForm'));
document.getElementById('view').addEventListener('submit',event=>{if(event.target.id!=='echoSearch')return;event.preventDefault();const data=new FormData(event.target);echoQuery=data.get('query');echoFilter=data.get('filter');document.getElementById('echoInventoryList').innerHTML=echoInventoryCards();});
function echoAction(event){
 const button=event.target.closest('[data-echo-action]');if(!button)return;
 const {echoAction:action,value}=button.dataset;
 try{
  if(action==='add')openEchoForm(null);
  if(action==='edit')openEchoForm(value);
  if(action==='draft-edit')openEchoForm(value,{draft:true});
  if(action==='owner'){const c=DATA.find(c=>c.id===value);if(c)openAccountEditor(c.name,'echo');}
  if(action==='pick')openEchoPicker(value);
  if(action==='choose'){
   const e=editingEchoes.after.find(e=>e.id===value);if(!e||(e.owner!==null&&e.owner!==editingEchoes.owner))return;
   assignDraftEcho({...e,owner:editingEchoes.owner,slot:echoPickerSlot},echoPickerSlot);closeDialog('echoPicker');document.querySelector('#editor-echo [data-echo-action="pick"][data-value="'+echoPickerSlot+'"]')?.focus({preventScroll:true});
  }
  if(action==='unequip'){
   const e=editingEchoes.after.find(e=>e.owner===editingEchoes.owner&&e.slot===Number(value));if(e)assignDraftEcho({...e,owner:null,slot:null},null);
  }
  if(action==='delete'){
   const e=CompanionStore.get().echoes.find(e=>e.id===value);if(e&&confirm(tr('Retirer cet exemplaire','Remove this copy')+(e.owner?' · '+echoOwner(e):'')+' ?')){CompanionStore.removeEcho(value,e,tr('Écho retiré','Echo removed'));render();}
  }
  if(action==='retry')companionActions['reload-catalogue']('echo');
 }catch{companionMessage(tr('Action non enregistrée. Vérifie le stockage ou une modification dans un autre onglet.','Action not saved. Check storage or a change in another tab.'),true);}
}
for(const id of ['view','editor-echo','echoPicker','echoForm'])document.getElementById(id).addEventListener('click',echoAction);
document.addEventListener('catalogue-ready',event=>{
 if(event.detail!=='echo')return;
 const list=document.getElementById('echoInventoryList');if(list)list.innerHTML=echoInventoryCards();
 if(document.getElementById('echoPicker').open)drawEchoPicker();
 if(document.getElementById('echoForm').open)refreshEchoFormCatalogue();
});
