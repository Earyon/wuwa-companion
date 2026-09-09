'use strict';
// Saved values use source IDs, never labels or array positions. Unknown saved
// IDs remain untouched if a source update temporarily omits a node.
let editingForteNodes={};
let editingForteDefs=[];
let editingForteChanged=false;
function normalizeForteDefs(detail){
 const result=[],seen=new Set();
 const add=(kind,id,name,description)=>{
  const sourceId=String(id??'');
  if(!/^\d+$/.test(sourceId)||!content(name).trim())return;
  const key=kind+':'+sourceId;
  if(seen.has(key))return;
  seen.add(key);
  result.push({key,kind,name:content(name),description:content(description).replace(/<[^>]*>/g,' ').replace(/\s+/g,' ').trim()});
 };
 const skills=Array.isArray(detail?.Skills)?detail.Skills:[];
 for(const skill of skills){
  // Automatic cooking/exploration passives have no unlock cost in Encore.
  if(normalizeSkillType(skill.SkillType)!=='Inherent Skill'||
     !Array.isArray(skill.Consumes)||!skill.Consumes.some(level=>Array.isArray(level.Consume)&&level.Consume.some(cost=>Number(cost.Value)>0)))continue;
  add('skill',skill.SkillId,skill.SkillName,skill.SkillDescribe);
 }
 const nodes=Array.isArray(detail?.SkillTree)?detail.SkillTree:[];
 for(const node of nodes)add('node',node.Id,node.PropertyNodeTitle,node.PropertyNodeDescribe);
 return result.sort((a,b)=>a.kind.localeCompare(b.kind)||Number(a.key.split(':')[1])-Number(b.key.split(':')[1]));
}
function forteCountLabel(){
 const count=editingForteDefs.filter(def=>editingForteNodes[def.key]===true).length;
 return `${count} / ${editingForteDefs.length} ${lang==='fr'?'débloqués':'unlocked'}`;
}
function drawForteEditor(state='ready'){
 const box=document.querySelector('#forteEditor');if(!box)return;
 if(!editingForteDefs.length){
  box.innerHTML=state==='loading'?'':`<p class="forte-note">${lang==='fr'?'Données des passifs indisponibles. Les déblocages déjà enregistrés sont conservés.':'Passive data unavailable. Saved unlocks are preserved.'}</p>`;
  return;
 }
 const fr=lang==='fr';
 box.innerHTML=`<div class="forte-heading"><b>${fr?'Nœuds passifs':'Passive nodes'}</b><span id="forteCount" aria-live="polite">${forteCountLabel()}</span></div>
 <p class="forte-note">${fr?'Coche les nœuds déjà débloqués en jeu, puis Enregistrer. Noms et descriptions de la source en anglais.':'Check the nodes already unlocked in game, then Save.'}</p>
 ${['skill','node'].map(kind=>{
  const defs=editingForteDefs.filter(def=>def.kind===kind);if(!defs.length)return '';
  return `<fieldset class="forte-group"><legend>${kind==='skill'?(fr?'Compétences inhérentes':'Inherent skills'):(fr?'Bonus de statistiques':'Stat bonuses')}</legend><div class="forte-nodes">${defs.map((def,index)=>`<label class="forte-node">
   <input type="checkbox" data-forte-key="${def.key}" ${editingForteNodes[def.key]===true?'checked':''}>
   <span class="forte-node-copy"><b>${esc(def.name)} <small>· ${fr?'Nœud':'Node'} ${index+1}</small></b><span>${esc(def.description)}</span></span>
  </label>`).join('')}</div></fieldset>`;
 }).join('')}`;
}
document.querySelector('#forteEditor').addEventListener('change',event=>{
 const input=event.target;
 if(!input.matches('input[data-forte-key]'))return;
 const key=input.dataset.forteKey;
 if(!editingForteDefs.some(def=>def.key===key))return;
 editingForteNodes[key]=input.checked;
 editingForteChanged=true;
 document.querySelector('#forteCount').textContent=forteCountLabel();
});
