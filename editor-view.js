'use strict';
const EDITOR_SECTIONS=[
 {id:'overview',fr:'Aperçu',en:'Overview',icon:'◈'},
 {id:'weapon',fr:'Arme',en:'Weapon',icon:'◇'},
 {id:'forte',fr:'Forte',en:'Forte',icon:'✦'},
 {id:'sequence',fr:'Séquence',en:'Sequence',icon:'◎'}
];
const editorWide=matchMedia('(min-width: 820px)');
function editorOrientation(){document.getElementById('editorTabs').setAttribute('aria-orientation',editorWide.matches?'vertical':'horizontal');}
editorWide.addEventListener('change',editorOrientation);
function selectEditorSection(id,{focus=false}={}){
 if(!EDITOR_SECTIONS.some(section=>section.id===id))return;
 for(const tab of document.querySelectorAll('#editorTabs [role="tab"]')){
  const selected=tab.dataset.editorSection===id;
  tab.setAttribute('aria-selected',String(selected));tab.tabIndex=selected?0:-1;
  if(selected&&focus)tab.focus();
 }
 for(const panel of document.querySelectorAll('.editor-panel'))panel.hidden=panel.id!=='editor-'+id;
 document.getElementById('editorStage').scrollTop=0;
 updateEditorSummary();
}
function prepareEditorView(character,section){
 const fr=lang==='fr',set=(id,text)=>document.getElementById(id).textContent=text;
 set('editorEyebrow',fr?'Mon compte / Résonateur':'My account / Resonator');
 set('overviewLabel',fr?'Aperçu':'Overview');set('overviewName',character.name);
 set('overviewElement',`${character.element} · ${'★'.repeat(character.rarity)}`);
 set('weaponEyebrow',fr?'Équipement':'Equipment');set('sequenceEyebrow',fr?'Résonance':'Resonance');
 set('overviewHint',fr?'Renseigne ta progression actuelle. Les objectifs se définissent dans le Planner.':'Record your current progress. Set targets in the Planner.');
 set('weaponHint',fr?'Sélectionne un exemplaire de ton inventaire ou ajoute l’arme que tu possèdes.':'Select an inventory copy or add a weapon you own.');
 set('sequenceHint',fr?'Sélectionne la séquence débloquée en jeu. S0 correspond à aucun déblocage supplémentaire.':'Select your in-game sequence. S0 means no additional unlocks.');
 set('editorSaveHint',fr?'Fermer annule les changements en cours.':'Closing cancels unsaved changes.');
 document.getElementById('editorClose').setAttribute('aria-label',fr?'Fermer sans enregistrer':'Close without saving');
 const portrait=document.getElementById('editorPortrait'),fallback=document.getElementById('editorPortraitFallback');
 fallback.textContent=character.name.split(/\s+/).map(s=>s[0]).slice(0,2).join('');
 portrait.hidden=!character.image;fallback.hidden=!!character.image;
 portrait.onload=()=>{portrait.hidden=false;fallback.hidden=true;};
 portrait.onerror=()=>{portrait.hidden=true;fallback.hidden=false;};
 if(character.image)portrait.src=character.image;else portrait.removeAttribute('src');
 const tabs=document.getElementById('editorTabs');tabs.setAttribute('aria-label',fr?'Rubriques du Résonateur':'Resonator sections');
 tabs.innerHTML=EDITOR_SECTIONS.map(s=>`<button id="editor-tab-${s.id}" role="tab" aria-controls="editor-${s.id}" aria-selected="false" tabindex="-1" data-editor-section="${s.id}"><span aria-hidden="true">${s.icon}</span><b>${fr?s.fr:s.en}</b></button>`).join('');
 editorOrientation();selectEditorSection(section);
}
function updateEditorSummary(){
 document.getElementById('sequenceValue').textContent='S'+editingSeq;
 const fr=lang==='fr';
 document.getElementById('editorSummary').innerHTML=`<div><dt>${fr?'Arme':'Weapon'}</dt><dd>${esc(editingWeapon||(fr?'Non renseignée':'Not recorded'))}</dd></div><div><dt>${fr?'Séquence':'Sequence'}</dt><dd>S${editingSeq}</dd></div>`;
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
 document.querySelector(`#seqRow [data-sequence="${editingSeq}"]`).focus();
});
document.getElementById('weaponSettings').addEventListener('click',event=>{
 const button=event.target.closest('[data-weapon-rank]');if(!button)return;
 editingWeaponRank=Number(button.dataset.weaponRank);updateEditorControls();
});
