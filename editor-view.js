'use strict';
const EDITOR_SECTIONS=[
 {id:'overview',fr:'Attributs',en:'Attributes',icon:'shuxing'},
 {id:'weapon',fr:'Arme',en:'Weapon',icon:'wuqi'},
 {id:'echo',fr:'Échos',en:'Echoes',icon:'yiyin'},
 {id:'forte',fr:'Compétences',en:'Skills',icon:'zhanji'},
 {id:'sequence',fr:'Chaîne',en:'Chain',icon:'gongminglian'}
];
let editorSection='overview',editorOpeningState='',pendingEditorCharacter=null;
const editorWide=matchMedia('(min-width: 680px)');
function editorOrientation(){document.getElementById('editorTabs').setAttribute('aria-orientation',editorWide.matches?'vertical':'horizontal');}
editorWide.addEventListener('change',editorOrientation);
function selectEditorSection(id,{focus=false}={}){
 if(!EDITOR_SECTIONS.some(section=>section.id===id))return;
 editorSection=id;
 document.getElementById('editorStage').dataset.section=id;
 for(const tab of document.querySelectorAll('#editorTabs [role="tab"]')){
  const selected=tab.dataset.editorSection===id;
  tab.setAttribute('aria-selected',String(selected));tab.tabIndex=selected?0:-1;
  if(selected&&focus)tab.focus();
 }
 for(const panel of document.querySelectorAll('.editor-panel'))panel.hidden=panel.id!=='editor-'+id;
 document.getElementById('editorStage').scrollTop=0;
 updateEditorSummary();
 if(id==='echo'){ensureEchoCatalogue();drawEditorEchoes();}
 if(id==='forte')requestAnimationFrame(fitTalentBoard);
}
function prepareEditorView(character,section){
 const fr=lang==='fr',set=(id,text)=>document.getElementById(id).textContent=text;
 set('editorEyebrow',fr?'Mon compte / Résonateur':'My account / Resonator');
 set('overviewLabel',fr?'Aperçu':'Overview');set('overviewName',gameLabel(character));
 set('overviewElement',`${character.element} · ${'★'.repeat(character.rarity)}`);
 set('weaponEyebrow',fr?'Équipement':'Equipment');set('sequenceEyebrow',fr?'Résonance':'Resonance');
 set('overviewHint',fr?'Renseigne ce que tu possèdes actuellement dans le jeu. Tu peux compléter les informations plus tard.':'Record what you currently own in the game. You can complete missing details later.');
 set('weaponHint',fr?'Sélectionne un exemplaire de ton inventaire ou ajoute l’arme que tu possèdes.':'Select an inventory copy or add a weapon you own.');
 set('sequenceHint',fr?'Sélectionne la séquence débloquée en jeu. S0 correspond à aucun déblocage supplémentaire.':'Select your in-game sequence. S0 means no additional unlocks.');
 set('editorSaveHint',fr?'Fermer annule les changements en cours.':'Closing cancels unsaved changes.');
 document.getElementById('editorClose').setAttribute('aria-label',fr?'Fermer sans enregistrer':'Close without saving');
 const portrait=document.getElementById('editorPortrait'),fallback=document.getElementById('editorPortraitFallback');
 fallback.textContent=character.name.split(/\s+/).map(s=>s[0]).slice(0,2).join('');
 portrait.hidden=!character.image;fallback.hidden=!!character.image;
 portrait.onload=()=>{portrait.hidden=false;fallback.hidden=true;};
 portrait.onerror=()=>{portrait.hidden=true;fallback.hidden=false;};
 if(character.image)portrait.src=characterArtwork(character);else portrait.removeAttribute('src');
 const sequencePortrait=document.getElementById('sequencePortrait');sequencePortrait.hidden=!character.image;if(character.image)sequencePortrait.src=characterArtwork(character);else sequencePortrait.removeAttribute('src');
 const tabs=document.getElementById('editorTabs');tabs.setAttribute('aria-label',fr?'Rubriques du Résonateur':'Resonator sections');
 tabs.innerHTML=EDITOR_SECTIONS.map(s=>`<button id="editor-tab-${s.id}" role="tab" aria-controls="editor-${s.id}" aria-selected="false" tabindex="-1" data-editor-section="${s.id}"><img src="./assets/game-ui/SP_RoleTabicon${s.icon}.webp" alt="" width="40" height="40"><b>${fr&&s.id==='forte'?'<span class="talent-label-full">Compétences</span><span class="talent-label-short">Forte</span>':fr?s.fr:s.en}</b></button>`).join('');
 editorOrientation();selectEditorSection(section);
 drawEditorRoster();drawEditorSequence();
}
function editorDraftSnapshot(){return JSON.stringify([editingLevel,editingAscension,editingSeq,editingEquipment,editingWeaponLevel,editingWeaponRank,editingWeaponAscension,editingSkills,editingForteNodes,editingEchoes]);}
function drawEditorRoster(){
 document.getElementById('editorRoster').innerHTML=ownedIds.map(id=>DATA.find(c=>c.id===id)).filter(Boolean).map(c=>`<button type="button" data-editor-character="${esc(c.id)}" aria-label="${esc(gameLabel(c))}" aria-current="${c.name===editingName?'true':'false'}" title="${esc(gameLabel(c))}"><img src="${esc(c.image||'./assets/portrait-placeholder.svg')}" alt="" loading="lazy" width="48" height="48"><span>${esc(gameLabel(c))}</span></button>`).join('');
}
function requestEditorCharacter(id){
 const row=DATA.find(c=>c.id===id&&ownedIds.includes(id));if(!row||row.name===editingName)return;
 if(editorOpeningState!==editorDraftSnapshot()){
  pendingEditorCharacter=id;const box=document.getElementById('editorSwitchPrompt');box.hidden=false;box.innerHTML=`<p>${tr('Des modifications ne sont pas encore enregistrées.','Some changes have not been saved.')}</p><div class="companion-actions"><button type="button" class="companion-button" data-switch-choice="save">${tr('Enregistrer et continuer','Save and continue')}</button><button type="button" class="companion-button" data-switch-choice="discard">${tr('Annuler les modifications','Discard changes')}</button><button type="button" class="companion-button" data-switch-choice="stay">${tr('Rester sur cette fiche','Stay here')}</button></div>`;box.querySelector('button').focus();return;
 }
 openAccountEditor(row.name,editorSection);
}
function drawEditorSequence(){
 for(const button of document.querySelectorAll('[data-sequence]')){const number=Number(button.dataset.sequence),chain=editingCharacterDetail?.ResonantChain?.find(c=>c.GroupIndex===number),icon=assetUrl(chain?.NodeIcon);button.setAttribute('aria-label',number?`S${number} · ${content(chain?.NodeName)||tr('Séquence','Sequence')}`:tr('S0 · Aucune séquence','S0 · No sequence'));button.innerHTML=(icon?`<img class="sequence-icon" src="${esc(icon)}" alt="" data-official-icon>`:'')+'<span>S'+number+'</span>';}
 let box=document.getElementById('sequenceDetail');if(!box){box=document.createElement('div');box.id='sequenceDetail';document.getElementById('editor-sequence').append(box);}
 const chain=editingCharacterDetail?.ResonantChain?.find(c=>c.GroupIndex===editingSeq);
 box.innerHTML=chain?`<p class="editor-eyebrow">${tr('Séquence','Sequence')} ${editingSeq}</p><h3>${esc(content(chain.NodeName))}</h3><p class="source-description">${esc(content(chain.AttributesDescription))}</p>`:`<p class="editor-hint">${editingSeq===0?tr('Aucune séquence supplémentaire débloquée.','No additional sequence unlocked.'):tr('Description indisponible pour le moment. Le niveau renseigné est conservé.','Description unavailable at the moment. The recorded sequence is preserved.')}</p>`;
}
document.getElementById('editorRoster').addEventListener('click',event=>{const button=event.target.closest('[data-editor-character]');if(button)requestEditorCharacter(button.dataset.editorCharacter);});
document.getElementById('editorSwitchPrompt').addEventListener('click',event=>{
 const choice=event.target.dataset.switchChoice;if(!choice)return;
 const row=DATA.find(c=>c.id===pendingEditorCharacter),section=editorSection;
 if(choice==='stay'){document.getElementById('editorSwitchPrompt').hidden=true;pendingEditorCharacter=null;return;}
 if(choice==='save'&&!saveAccountEditor())return;
 if(row)openAccountEditor(row.name,section);
});
function updateEditorSummary(){
 const fr=lang==='fr';
 document.getElementById('editorSummary').innerHTML=`<div><dt>${fr?'Arme':'Weapon'}</dt><dd>${esc(gameText(editingWeapon)||(fr?'Non renseignée':'Not recorded'))}</dd></div><div><dt>${fr?'Séquence':'Sequence'}</dt><dd>S${editingSeq}</dd></div>`;
}
document.getElementById('editorTabs').addEventListener('click',event=>{
 const tab=event.target.closest('[data-editor-section]');if(tab)selectEditorSection(tab.dataset.editorSection);
});
document.getElementById('editorTabs').addEventListener('keydown',event=>{
 const tab=event.target.closest('[role="tab"]');if(!tab)return;
 const tabs=[...document.querySelectorAll('#editorTabs [role="tab"]')],index=tabs.indexOf(tab);
 const previous=editorWide.matches?'ArrowUp':'ArrowLeft',next=editorWide.matches?'ArrowDown':'ArrowRight';
 const target=event.key==='Home'?0:event.key==='End'?tabs.length-1:event.key===previous?(index+tabs.length-1)%tabs.length:event.key===next?(index+1)%tabs.length:null;
 if(target===null)return;event.preventDefault();selectEditorSection(tabs[target].dataset.editorSection,{focus:true});
});
document.getElementById('seqRow').addEventListener('click',event=>{
 const button=event.target.closest('[data-sequence]');if(!button)return;
 editingSeq=Number(button.dataset.sequence);updateEditorControls();
 drawEditorSequence();
 document.querySelector(`#seqRow [data-sequence="${editingSeq}"]`).focus();
});
document.getElementById('weaponSettings').addEventListener('click',event=>{
 const button=event.target.closest('[data-weapon-rank]');if(!button)return;
 editingWeaponRank=Number(button.dataset.weaponRank);updateEditorControls();
});
