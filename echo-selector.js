'use strict';
// One visual selector for recorded copies and for choosing a catalogue identity.
let echoPickerState={mode:'copies',purpose:'equip',selected:null,cost:''};
function echoThumbnail(row,large=false){
 const src=(large?equipmentArtwork(row,'echoes'):row?.image)||'';
 return src?`<img src="${esc(src)}" alt="" ${large?'':'loading="lazy"'} decoding="async" width="120" height="120" onerror="this.hidden=true;this.nextElementSibling.hidden=false"><span class="echo-image-missing" hidden>${tr('Image indisponible','Image unavailable')}</span>`:`<span class="echo-image-missing">${tr('Image indisponible','Image unavailable')}</span>`;
}
function openEchoPicker(slot){
 echoPickerSlot=Number(slot);selectedEchoSlot=echoPickerSlot;
 const selected=editingEchoes.after.find(e=>e.owner===editingEchoes.owner&&e.slot===echoPickerSlot);
 echoPickerState={mode:editingEchoes.after.length?'copies':'catalogue',purpose:editingEchoes.after.length?'equip':'add',selected:selected?.id||null,cost:''};
 prepareEchoPicker();
}
function openEchoCatalogue(){
 echoPickerState={mode:'catalogue',purpose:'form',selected:selectedEchoRow(document.getElementById('echoInventoryForm').elements.echo.value)?.id||null,cost:''};
 prepareEchoPicker();
}
function refreshEchoPickerSets(reset=false){
 const select=document.getElementById('echoPickerSet'),value=reset?'':select.value;
 document.getElementById('echoPickerSet').innerHTML=`<option value="">${tr('Toutes les Sonates','All Sonatas')}</option>`+[...new Map(extendedCatalog.echo.flatMap(e=>e.sets).map(s=>[s.id,s])).values()].sort((a,b)=>gameText(a.name).localeCompare(gameText(b.name),lang)).map(s=>`<option value="${esc(s.id)}">${esc(gameText(s.name))}</option>`).join('');
 select.value=value;
}
function prepareEchoPicker(){
 ensureEchoCatalogue();
 document.getElementById('echoPickerQuery').value='';
 document.getElementById('echoPickerQuery').placeholder=tr('Rechercher un Écho…','Search Echoes…');
 refreshEchoPickerSets(true);
 document.getElementById('echoPickerOwner').innerHTML=[['all',tr('Tous','All')],['free',tr('Non équipés','Unequipped')],['equipped',tr('Équipés','Equipped')]].map(([id,label])=>`<option value="${id}">${label}</option>`).join('');
 document.getElementById('echoPickerOrder').innerHTML=[['level',tr('Niveau','Level')],['quality',tr('Qualité','Quality')],['name',tr('Nom','Name')]].map(([id,label])=>`<option value="${id}">${label}</option>`).join('');
 document.getElementById('echoPickerBack').textContent=tr('Retour à la grille','Back to the grid');
 document.getElementById('echoPickerFilters').textContent=tr('Filtres et tri','Filters and sort');
 document.getElementById('echoPicker').dataset.detail='false';
 drawEchoPicker();openDialog('echoPicker');
}
function echoPickerRows(){
 const s=echoPickerState,copies=s.mode==='copies',q=document.getElementById('echoPickerQuery').value.trim().toLocaleLowerCase(),set=document.getElementById('echoPickerSet').value,owner=document.getElementById('echoPickerOwner').value,order=document.getElementById('echoPickerOrder').value;
 return (copies?editingEchoes.after:extendedCatalog.echo).filter(e=>{
  const row=copies?echoRow(e):e,name=copies?echoName(e):gameLabel(e);
  return name.toLocaleLowerCase().includes(q)&&(!set||(copies?e.setId===set:row.sets.some(s=>s.id===set)))&&(!copies||(!s.cost||String(e.cost)===s.cost)&&(owner==='all'||(owner==='free'?!e.owner:!!e.owner)));
 }).slice().sort((a,b)=>(copies&&order!=='name'?(order==='quality'?(b.quality??-1)-(a.quality??-1):(b.level??-1)-(a.level??-1)):0)||(copies?echoName(a):gameLabel(a)).localeCompare(copies?echoName(b):gameLabel(b),lang)||a.id.localeCompare(b.id));
}
function drawEchoPicker(){
 const focusedCost=document.activeElement?.dataset.echoPickerCost;
 const s=echoPickerState,copies=s.mode==='copies',list=echoPickerRows(),dialog=document.getElementById('echoPicker');
 dialog.dataset.mode=s.mode;
 document.getElementById('echoPickerTitle').textContent=copies?tr('Changer d’Écho','Change Echo'):tr('Choisir un Écho','Choose an Echo');
 document.getElementById('echoPickerAdd').textContent=copies?tr('Ajouter depuis le catalogue','Add from catalogue'):tr('Mes Échos','My Echoes');
 document.getElementById('echoPickerAdd').hidden=s.purpose==='form';
 document.getElementById('echoPickerOwner').hidden=!copies;document.getElementById('echoPickerOrder').hidden=!copies;
 document.getElementById('echoPickerCostTabs').hidden=!copies;
 document.getElementById('echoPickerCostTabs').innerHTML=['','1','3','4'].map(c=>`<button type="button" data-echo-picker-cost="${c}" aria-pressed="${s.cost===c}">${c||tr('Tous','All')}</button>`).join('');
 if(!list.some(e=>e.id===s.selected))s.selected=list[0]?.id||null;
 document.getElementById('echoPickerList').innerHTML=list.map(e=>{
  const row=copies?echoRow(e):e,name=copies?echoName(e):gameLabel(e),owner=copies&&e.owner?DATA.find(c=>c.id===e.owner):null;
  return `<button type="button" class="echo-choice" data-echo-action="choose" data-value="${esc(e.id)}" data-quality="${copies?e.quality||'':''}" aria-pressed="${s.selected===e.id}" aria-label="${esc(name+(copies?' · '+tr('Niveau ','Level ')+(e.level??'?')+' · '+echoOwner(e):''))}" title="${esc(name)}">${echoThumbnail(row)}${copies?`<span class="echo-choice-cost">${e.cost??'?'}</span><span class="echo-choice-level">+${e.level??'?'}</span>${owner?.image?`<img class="echo-choice-owner" src="${esc(owner.image)}" alt="" loading="lazy" width="24" height="24">`:''}`:`<span class="echo-choice-name">${esc(name)}</span>`}</button>`;
 }).join('');
 document.getElementById('echoPickerCount').textContent=list.length+' '+tr('Échos','Echoes');
 document.getElementById('echoPickerEmpty').innerHTML=echoCatalogueStatus()+(list.length?'':`<p>${tr('Aucun Écho dans cette sélection.','No Echoes in this selection.')}</p>`);
 drawEchoPickerRail();drawEchoPickerDetail();
 if(focusedCost!==undefined)document.querySelector('[data-echo-picker-cost="'+CSS.escape(focusedCost)+'"]')?.focus({preventScroll:true});
}
function drawEchoPickerRail(){
 const rail=document.getElementById('echoPickerRail');rail.hidden=echoPickerState.purpose==='form';if(rail.hidden)return;
 const equipped=editingEchoes.after.filter(e=>e.owner===editingEchoes.owner),cost=equipped.reduce((n,e)=>n+(e.cost??0),0);
 rail.innerHTML=`<p>${tr('Coût','Cost')}<br><b>${cost}${equipped.some(e=>e.cost===null)?' + ?':''}/12</b></p>`+[1,2,3,4,5].map(slot=>{const e=equipped.find(e=>e.slot===slot);return `<button type="button" class="echo-slot" data-echo-picker-slot="${slot}" aria-pressed="${slot===echoPickerSlot}" aria-label="${esc(tr('Emplacement ','Slot ')+slot+' · '+(e?echoName(e):tr('Vide','Empty')))}">${e?echoThumbnail(echoRow(e)):'<span>+</span>'}<small>${slot===1?tr('Principal','Main'):slot}</small></button>`;}).join('');
}
function echoPickerSelection(){return echoPickerState.mode==='copies'?editingEchoes.after.find(e=>e.id===echoPickerState.selected):extendedCatalog.echo.find(e=>e.id===echoPickerState.selected);}
function drawEchoPickerDetail(){
 const s=echoPickerState,e=echoPickerSelection(),copies=s.mode==='copies',row=copies?echoRow(e||{}):e,detail=document.getElementById('echoPickerDetail'),art=document.getElementById('echoPickerArtwork'),actions=document.getElementById('echoPickerActions');
 art.innerHTML=e?echoThumbnail(row,true):'';actions.replaceChildren();
 if(!e){detail.innerHTML=`<p>${tr('Sélectionne une miniature pour voir son détail.','Select a thumbnail to see its details.')}</p>`;return;}
 const same=copies&&e.owner===editingEchoes.owner&&e.slot===echoPickerSlot;
 const otherOwner=copies&&e.owner&&e.owner!==editingEchoes.owner;
 const selectedCost=copies?editingEchoes.after.filter(x=>x.owner===editingEchoes.owner&&x.id!==e.id&&x.slot!==echoPickerSlot).reduce((n,x)=>n+(x.cost??0),0)+(e.cost??0):0;
 const label=copies?same?tr('Enlever','Remove'):e.owner&&e.owner!==editingEchoes.owner?tr('Équiper depuis ','Equip from ')+echoOwner(e):tr('Équiper','Equip'):tr('Choisir cet Écho','Choose this Echo');
 detail.innerHTML=`<div class="echo-detail-heading"><h3>${esc(copies?echoName(e):gameLabel(e))}</h3>${copies?`<b>+${e.level??'?'}</b>`:''}</div><div class="echo-detail-art">${echoThumbnail(row,true)}</div>${copies?`<p class="echo-detail-meta">${tr('Coût','Cost')} ${e.cost??'?'} · ${e.quality?'★'.repeat(e.quality):'? ★'}</p><dl class="game-stat-list">${[e.main,e.secondary,...e.substats].filter(Boolean).map(stat=>`<div><dt>${esc(statLabel(stat.type).replace(/ %$/,''))}</dt><dd>${menuNumber(stat.value,EchoRules.stats[stat.type]?.[2])}</dd></div>`).join('')}</dl>`:''}<h4>${tr('Compétence d’Écho','Echo Skill')}</h4><p id="echoPickerAbility" class="source-description"></p><div id="echoPickerSonata"></div>${copies?`<p class="echo-detail-owner">${esc(echoOwner(e))}</p>`:`<p class="companion-note">${tr('Les niveaux et attributs seront ceux de ton exemplaire.','Levels and attributes will describe your own copy.')}</p>`}${selectedCost>12&&!same?`<p class="companion-error">${tr('Cet équipement dépasserait le coût maximal de 12.','This equipment would exceed the maximum cost of 12.')}</p>`:''}`;
 actions.innerHTML=`<button class="goldbtn" type="button" data-echo-picker-apply ${selectedCost>12&&!same?'disabled':''}>${esc(label)}</button>${copies?`<button class="companion-button" type="button" data-echo-picker-edit ${otherOwner?'disabled':''}>${tr('Modifier','Edit')}</button>`:''}${otherOwner?`<small class="echo-transfer-note">${tr('Équipe cet exemplaire ici avant de modifier ses valeurs.','Equip this copy here before editing its values.')}</small>`:''}`;
 detail.scrollTop=0;
 const selection=row?{kind:'echo',id:row.id}:null,key=selection?profileKey(selection):null,selectedId=s.selected;
 const refresh=()=>{
  if(!document.getElementById('echoPicker').open||echoPickerState.selected!==selectedId||echoPickerState.mode!==(copies?'copies':'catalogue')||selection&&profileKey(selection)!==key)return;
  const source=key?profileSources.get(key):null;
  const ability=document.getElementById('echoPickerAbility');
  ability.textContent=source?.data?.Description?sourceText(source.data.Description):source?.error||!row?tr('Description indisponible pour le moment.','Description currently unavailable.'):tr('Chargement de la description…','Loading description…');
  if(source?.error&&selection){const retry=document.createElement('button');retry.type='button';retry.className='companion-button';retry.textContent=tr('Réessayer','Retry');retry.addEventListener('click',async()=>{retry.disabled=true;await loadProfileSource(selection,{refresh:true});refresh();});ability.append(document.createElement('br'),retry);}
  const ids=copies?[e.setId].filter(Boolean):(row?.sets||[]).map(s=>s.id);
  const equipped=s.purpose==='form'?[]:editingEchoes.after.filter(e=>e.owner===editingEchoes.owner);
  document.getElementById('echoPickerSonata').innerHTML=ids.length?`<h4>${tr('Effets de Sonate','Sonata effects')}</h4>`+equippedSonatasHTML(equipped,ids):'';
 };
 // The popup may be opening for the first time; initial labels must still render.
 document.getElementById('echoPickerAbility').textContent=tr('Chargement de la description…','Loading description…');
 queueMicrotask(refresh);
 if(selection)loadProfileSource(selection).then(refresh);
 if(!sonataData&&!sonataError)loadSonatas().then(refresh);
}
function selectEchoCandidate(id){
 if(!echoPickerRows().some(e=>e.id===id))return;echoPickerState.selected=id;
 for(const button of document.querySelectorAll('#echoPickerList .echo-choice'))button.setAttribute('aria-pressed',String(button.dataset.value===id));
 document.getElementById('echoPicker').dataset.detail='true';drawEchoPickerDetail();
}
function chooseEchoFormRow(row){
 const form=document.getElementById('echoInventoryForm');if(!form||!row)return;
 echoFormState.catalogueId=row.id;echoFormState.catalogueValue=echoCatalogueLabel(row);form.elements.echo.value=echoFormState.catalogueValue;
 refreshEchoFormCatalogue();form.elements.echo.focus({preventScroll:true});
}
function applyEchoCandidate(){
 const s=echoPickerState,e=echoPickerSelection();if(!e)return;
 if(s.mode==='catalogue'){
  closeDialog('echoPicker');if(s.purpose!=='form')openEchoForm(null,{draft:true,slot:echoPickerSlot});chooseEchoFormRow(e);return;
 }
 const same=e.owner===editingEchoes.owner&&e.slot===echoPickerSlot;
 const cost=editingEchoes.after.filter(x=>x.owner===editingEchoes.owner&&x.id!==e.id&&x.slot!==echoPickerSlot).reduce((n,x)=>n+(x.cost??0),0)+(e.cost??0);
 if(cost>12&&!same)return;
 assignDraftEcho({...e,owner:same?null:editingEchoes.owner,slot:same?null:echoPickerSlot},same?null:echoPickerSlot);
 drawEchoPicker();document.querySelector('[data-echo-picker-apply]')?.focus({preventScroll:true});
}
document.getElementById('echoPicker').addEventListener('click',event=>{
 const cost=event.target.closest('[data-echo-picker-cost]'),slot=event.target.closest('[data-echo-picker-slot]');
 if(cost){echoPickerState.cost=cost.dataset.echoPickerCost;drawEchoPicker();}
 if(slot){echoPickerSlot=Number(slot.dataset.echoPickerSlot);selectedEchoSlot=echoPickerSlot;echoPickerState.selected=editingEchoes.after.find(e=>e.owner===editingEchoes.owner&&e.slot===echoPickerSlot)?.id||null;drawEditorEchoes();drawEchoPicker();}
 if(event.target.closest('[data-echo-picker-apply]'))applyEchoCandidate();
 if(event.target.closest('[data-echo-picker-edit]')){const e=echoPickerSelection();if(!e||e.owner&&e.owner!==editingEchoes.owner)return;closeDialog('echoPicker');openEchoForm(e.id,{draft:true});}
});
document.getElementById('echoPickerQuery').addEventListener('input',drawEchoPicker);
for(const id of ['echoPickerSet','echoPickerOwner','echoPickerOrder'])document.getElementById(id).addEventListener('change',drawEchoPicker);
document.getElementById('echoPickerBack').addEventListener('click',()=>{document.getElementById('echoPicker').dataset.detail='false';document.querySelector('#echoPickerList [aria-pressed="true"]')?.focus({preventScroll:true});});
document.getElementById('echoPickerAdd').addEventListener('click',()=>{const catalogue=echoPickerState.mode==='copies';echoPickerState={...echoPickerState,mode:catalogue?'catalogue':'copies',purpose:catalogue?'add':'equip',selected:null,cost:''};prepareEchoPicker();});
document.addEventListener('catalogue-ready',event=>{
 if(event.detail!=='echo'||!document.getElementById('echoPicker').open)return;
 refreshEchoPickerSets();
});
