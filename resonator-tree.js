'use strict';
let talentSelection=null;
function fitTalentBoard(){
 const board=document.querySelector('.talent-board'),stage=document.getElementById('editorStage');if(!board||editorSection!=='forte')return;
 const available=stage.getBoundingClientRect().bottom-board.getBoundingClientRect().top-12;
 board.style.setProperty('--node-size',Math.min(110,Math.max(44,board.clientWidth/5.6),Math.max(44,(available-85)*.28))+'px');
 const cores=[...board.querySelectorAll('.talent-core')],extras=board.querySelector('.talent-extras');
 // Reserve translated labels and the two additional skills below the inner
 // branches. Their hit targets must never overlap, even on short viewports.
 for(let pass=0;pass<2;pass++){
  const tail=Math.max(...cores.map(e=>e.getBoundingClientRect().height),0);
  const height=Math.max(150,Math.min(530,(available-tail-12)/.86,(available-tail-(extras?.offsetHeight||0)-20)/.665));
  board.style.setProperty('--tree-height',height+'px');
  board.style.setProperty('--node-size',Math.max(44,Math.min(parseFloat(board.style.getPropertyValue('--node-size')),height*.3-4))+'px');
 }
 if(extras){
  const innerBottom=Math.max(...cores.slice(1,4).map(e=>e.getBoundingClientRect().bottom));
  const extraRects=[...extras.children].map(e=>e.getBoundingClientRect());
  const sharedColumns=[...board.querySelectorAll('.talent-node')].map(e=>e.getBoundingClientRect()).filter(r=>extraRects.some(x=>Math.min(x.right,r.right)>Math.max(x.left,r.left)));
  const minimum=Math.max(...sharedColumns.map(r=>r.bottom+8),board.getBoundingClientRect().top);
  const top=Math.max(minimum,Math.min(innerBottom+8,stage.getBoundingClientRect().bottom-extras.offsetHeight-12));
  board.style.setProperty('--extras-top',(top-board.getBoundingClientRect().top)+'px');
 }
}
new ResizeObserver(fitTalentBoard).observe(document.getElementById('editorStage'));
function talentEntries(){
 const reference=currentResonatorReference();if(!reference)return null;
 const detail=reference.locales[lang],byIndex=new Map(reference.layout.map(n=>[n.index,n]));
 const entries=[];
 for(const node of reference.layout){
  const skill=detail.Skills.find(s=>s.SkillId===node.skillId),type=skill?normalizeSkillType(skill.SkillType):null;
  const passive=editingForteDefs.find(d=>d.key===(node.skillId?'skill:'+node.skillId:'node:'+node.id));
  if(!SKILL_ORDER.includes(type)&&!passive)continue;
  const key=SKILL_ORDER.includes(type)?'core:'+type:passive.key;
  const source=skill?{name:skill.SkillName,description:skill.SkillDescribe}:passive;
  const icon=assetUrl(skill?.Icon||detail.SkillTree.find(n=>n.Id===node.id)?.Icon);
  let ancestor=node,depth=0;const visited=new Set();
  while(ancestor.parents.length===1&&!visited.has(ancestor.index)){
   visited.add(ancestor.index);ancestor=byIndex.get(ancestor.parents[0]);if(!ancestor)break;depth++;
  }
  const rootSkill=ancestor&&detail.Skills.find(s=>s.SkillId===ancestor.skillId),branch=SKILL_ORDER.indexOf(rootSkill&&normalizeSkillType(rootSkill.SkillType));
  entries.push({key,type:SKILL_ORDER.includes(type)?type:null,kind:passive?.kind||'core',name:source.name,description:source.description,icon,branch,depth,parent:node.parents.length===1?node.parents[0]:null,index:node.index});
 }
 return entries;
}
function talentState(entry){
 if(entry.type)return editingSkills[entry.type]===undefined?tr('Non renseigné','Not recorded'):`${editingSkills[entry.type]} / 10`;
 return editingForteNodes[entry.key]===true?tr('Débloqué','Unlocked'):editingForteNodes[entry.key]===false?tr('Non débloqué','Locked'):tr('Non renseigné','Not recorded');
}
function talentButton(entry){
 const known=entry.type?editingSkills[entry.type]!==undefined:Object.hasOwn(editingForteNodes,entry.key),active=!entry.type&&editingForteNodes[entry.key]===true;
 const label=entry.type?(editingSkillDefs.find(d=>d.type===entry.type)?.label||SKILL_LABELS[lang][entry.type]):entry.name;
 const short=({'Normal Attack':tr('Attaque','Attack'),Skill:tr('Compét.','Skill'),'Forte Circuit':'Forte',Liberation:tr('Libér.','Liberation'),Intro:'Intro'})[entry.type];
 const symbol=entry.icon?`<img src="${esc(entry.icon)}" alt="" width="32" height="32" decoding="async" data-official-icon>`:'<span class="missing-miniature">—</span>';
 return `<button type="button" class="talent-node ${entry.type?'talent-core':entry.kind==='skill'?'talent-passive':'talent-bonus'} ${active?'is-unlocked':known&&!entry.type?'is-locked':''} ${known?'':'is-unknown'}" data-talent="${esc(entry.key)}" aria-pressed="${talentSelection===entry.key}" aria-label="${esc(label+' · '+talentState(entry))}"><span class="talent-symbol" aria-hidden="true">${symbol}</span>${entry.type?`<b><span class="talent-label-full">${esc(label)}</span><span class="talent-label-short">${short}</span></b>`:''}<small>${esc(entry.type&&!known?'—':talentState(entry))}</small></button>`;
}
function drawTalentEditor(state){
 const entries=talentEntries();if(!entries?.length||!editingSkillDefs.length)return false;
 const box=document.getElementById('skillsEditor'),focused=box.contains(document.activeElement)?document.activeElement.dataset.talent:null;
 if(talentSelection&&!entries.some(e=>e.key===talentSelection)&&!String(talentSelection).startsWith('extra:'))talentSelection=null;
 const extras=editingCharacterDetail.Skills.filter(s=>['Outro','Tune Break'].includes(normalizeSkillType(s.SkillType)));
 document.getElementById('forteEditor').innerHTML='';
 document.getElementById('skillsLabel').textContent=tr('Compétences','Skills');
 document.getElementById('skillsSource').textContent=tr('Progression actuelle','Current progress');
 box.innerHTML=`<div class="talent-layout ${talentSelection?'has-selection':''}"><div class="talent-board" role="group" aria-label="${tr('Arbre de compétences','Skill tree')}">${SKILL_ORDER.map((type,branch)=>{
  const group=entries.filter(e=>e.branch===branch).sort((a,b)=>b.depth-a.depth),linked=group.length===3&&group[0].parent===group[1].index&&group[1].parent===group[2].index;
  return `<div class="talent-branch ${linked?'is-linked':''}" style="--branch-offset:${[.26,.065,0,.065,.26][branch]}">${group.map(talentButton).join('')}</div>`;
 }).join('')}<div class="talent-extras">${extras.map(s=>`<button type="button" data-talent="extra:${s.SkillId}" aria-label="${esc(s.TypeLabel||s.SkillType)}" aria-pressed="${talentSelection==='extra:'+s.SkillId}"><span class="talent-symbol"><img src="${esc(assetUrl(s.Icon))}" alt="" width="32" height="32" data-official-icon></span><span><span class="talent-label-full">${esc(s.TypeLabel||s.SkillType)}</span><span class="talent-label-short">${normalizeSkillType(s.SkillType)==='Outro'?'Outro':tr('Tonalité','Tune Break')}</span></span></button>`).join('')}</div>${entries.some(e=>e.branch<0)?`<div class="talent-unplaced">${entries.filter(e=>e.branch<0).map(talentButton).join('')}</div>`:''}</div><aside class="talent-detail" id="talentDetail" ${talentSelection?'':'hidden'} aria-label="${tr('Détail de la sélection','Selection details')}"></aside></div>`;
 drawTalentDetail(entries,extras);
 requestAnimationFrame(fitTalentBoard);
 if(focused)box.querySelector(`[data-talent="${CSS.escape(focused)}"]`)?.focus({preventScroll:true});
 return true;
}
function drawTalentDetail(entries=talentEntries(),extras=editingCharacterDetail?.Skills||[]){
 const box=document.getElementById('talentDetail');if(!box)return;
 const extra=String(talentSelection).startsWith('extra:')?extras.find(s=>String(s.SkillId)===talentSelection.slice(6)):null;
 const entry=entries?.find(e=>e.key===talentSelection);if(!entry&&!extra)return;
 const name=extra?.SkillName||entry.name,description=extra?.SkillDescribe||entry.description;
 let control='';
 if(entry?.type){const level=editingSkills[entry.type];control=`<label class="talent-level">${tr('Niveau actuel','Current level')}<select aria-label="${tr('Niveau actuel','Current level')}" data-skill-level="${esc(entry.type)}"><option value="">${tr('Non renseigné','Not recorded')}</option>${Array.from({length:10},(_,i)=>i+1).map(n=>`<option value="${n}" ${level===n?'selected':''}>${n} / 10</option>`).join('')}</select></label><div class="talent-adjust"><button type="button" data-skill-step="-1" aria-label="${tr('Diminuer le niveau','Decrease level')}" ${!level||level===1?'disabled':''}>−</button><input type="range" min="1" max="10" step="1" value="${level||1}" data-skill-slider="${esc(entry.type)}" aria-label="${tr('Ajuster le niveau actuel','Adjust current level')}" ${!level?'disabled':''}><button type="button" data-skill-step="1" aria-label="${tr('Augmenter le niveau','Increase level')}" ${level===10?'disabled':''}>+</button></div>`;}
 else if(entry)control=`<fieldset class="talent-state"><legend>${tr('État dans ton jeu','In-game state')}</legend>${[['yes',tr('Débloqué','Unlocked')],['no',tr('Non débloqué','Locked')],['unknown',tr('Non renseigné','Not recorded')]].map(([value,label])=>`<button type="button" data-talent-state="${value}" aria-pressed="${value===(editingForteNodes[entry.key]===true?'yes':editingForteNodes[entry.key]===false?'no':'unknown')}">${label}</button>`).join('')}</fieldset>`;
 box.innerHTML=`<button type="button" class="companion-button" data-talent-back>${tr('Retour à l’arbre','Back to the tree')}</button><p class="editor-eyebrow">${tr('Sélection','Selection')}</p><h3>${esc(name||tr('Compétence','Skill'))}</h3>${control}<p class="source-description">${esc(description||tr('Description indisponible.','Description unavailable.'))}</p><p class="editor-hint">${extra?tr('Consultation uniquement ; aucun niveau à renseigner.','Reference only; no level to record.'):tr('Renseigne ce qui est déjà acquis dans le jeu, puis enregistre la fiche.','Record what you already unlocked in the game, then save the sheet.')}</p>`;
}
document.getElementById('skillsEditor').addEventListener('click',event=>{
 const step=event.target.closest('[data-skill-step]');if(step){const entry=talentEntries()?.find(e=>e.key===talentSelection);if(!entry?.type)return;setEditingSkillLevel(entry.type,Math.min(10,Math.max(1,(editingSkills[entry.type]||0)+Number(step.dataset.skillStep))));drawTalentEditor();document.querySelector(`[data-skill-step="${step.dataset.skillStep}"]:not(:disabled)`)?.focus({preventScroll:true});return;}
 const node=event.target.closest('[data-talent]');
 if(event.target.closest('[data-talent-back]')){talentSelection=null;drawTalentEditor();return;}
 if(node){talentSelection=node.dataset.talent;drawTalentEditor();return;}
 const state=event.target.closest('[data-talent-state]');if(!state)return;
 if(!editingForteDefs.some(d=>d.key===talentSelection))return;
 if(state.dataset.talentState==='unknown')delete editingForteNodes[talentSelection];else editingForteNodes[talentSelection]=state.dataset.talentState==='yes';
 editingForteChanged=true;const selected=state.dataset.talentState;drawTalentEditor();document.querySelector(`[data-talent-state="${selected}"]`)?.focus({preventScroll:true});
});
document.getElementById('skillsEditor').addEventListener('change',event=>{
 if(event.target.matches('[data-skill-slider]')){const type=event.target.dataset.skillSlider;setEditingSkillLevel(type,Number(event.target.value));drawTalentEditor();document.querySelector('[data-skill-slider]')?.focus({preventScroll:true});return;}
 if(!event.target.matches('[data-skill-level]')||!document.getElementById('talentDetail'))return;
 const type=event.target.dataset.skillLevel;drawTalentEditor();document.querySelector(`[data-skill-level="${CSS.escape(type)}"]`)?.focus({preventScroll:true});
});
