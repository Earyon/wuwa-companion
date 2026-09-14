'use strict';
let talentSelection=null,talentDetailTab='skill';
// Local UiItem_RoleSkillTree prefab, 2560 × 1440. See DESIGN.md for
// the actor IDs and the comparison with the user's 1724 × 1080 video.
const TALENT_GEOMETRY={width:2560,height:1440,detailWidth:842,selectionShift:400,
 branches:[{x:623,y:[1180,837,540]},{x:923,y:[1000,657,360]},
 {x:1287,y:[937,596,300]},{x:1643,y:[1000,657,360]},{x:1940,y:[1180,837,540]}],
 extras:[{x:1126,y:1252},{x:1450,y:1252}]};
function fitTalentBoard(){
 const board=document.querySelector('.talent-board'),stage=document.getElementById('editorStage');if(!board||editorSection!=='forte')return;
 const layout=board.parentElement,available=stage.getBoundingClientRect().bottom-layout.getBoundingClientRect().top;
 const height=Math.max(180,available),width=layout.clientWidth,selected=!!talentSelection;
 layout.style.setProperty('--talent-panel-height',height+'px');
 board.style.height=height+'px';
 const faithful=width>=680&&width/height>=1.3;
 const scale=faithful?Math.min(width/TALENT_GEOMETRY.width,height/TALENT_GEOMETRY.height):
  Math.min((width-(selected&&width>=680?Math.max(210,width*.32):0)-24)/1577,(height-28)/1132);
 const detailWidth=faithful?TALENT_GEOMETRY.detailWidth*scale:Math.max(210,width*.32);
 layout.style.setProperty('--talent-detail-width',detailWidth+'px');
 if(!board.getClientRects().length)return;
 const left=selected&&width>=680?detailWidth:0;
 const offsetX=faithful?(width-2560*scale)/2+(selected?TALENT_GEOMETRY.selectionShift*scale:0):left+(width-left-1577*scale)/2-493*scale;
 const offsetY=faithful?(height-1440*scale)/2:(height-1132*scale)/2-200*scale;
 board.style.setProperty('--talent-unit',scale+'px');
 for(const element of board.querySelectorAll('[data-tree-x]')){
  element.style.left=(offsetX+Number(element.dataset.treeX)*scale)+'px';
  element.style.top=(offsetY+Number(element.dataset.treeY)*scale)+'px';
 }
 layout.dataset.referenceLayout=String(faithful);
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
  const source=skill?{name:skill.SkillName,description:skill.SkillDescribe,rich:skill.SkillDescribeRich}:passive;
  const icon=assetUrl(skill?.Icon||detail.SkillTree.find(n=>n.Id===node.id)?.Icon);
  let ancestor=node,depth=0;const visited=new Set();
  while(ancestor.parents.length===1&&!visited.has(ancestor.index)){
   visited.add(ancestor.index);ancestor=byIndex.get(ancestor.parents[0]);if(!ancestor)break;depth++;
  }
  const rootSkill=ancestor&&detail.Skills.find(s=>s.SkillId===ancestor.skillId),branch=SKILL_ORDER.indexOf(rootSkill&&normalizeSkillType(rootSkill.SkillType));
  entries.push({key,type:SKILL_ORDER.includes(type)?type:null,kind:passive?.kind||'core',name:source.name,description:source.description,rich:source.rich,icon,branch,depth,parent:node.parents.length===1?node.parents[0]:null,index:node.index});
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
 const point=TALENT_GEOMETRY.branches[entry.branch],position=point&&point.y[entry.depth]!==undefined?`data-tree-x="${point.x}" data-tree-y="${point.y[entry.depth]}"`:'';
 return `<button type="button" class="talent-node ${entry.type?'talent-core':entry.kind==='skill'?'talent-passive':'talent-bonus'} ${active?'is-unlocked':known&&!entry.type?'is-locked':''} ${known?'':'is-unknown'}" ${position} data-talent="${esc(entry.key)}" aria-pressed="${talentSelection===entry.key}" aria-label="${esc(label+' · '+talentState(entry))}"><span class="talent-symbol" aria-hidden="true">${symbol}</span>${entry.type?`<b><span class="talent-label-full">${esc(label)}</span><span class="talent-label-short">${short}</span></b><small class="talent-number"><span>${tr('Nv.','Lv.')}</span><strong>${known?editingSkills[entry.type]:'—'}</strong><span>/10</span></small>`:''}</button>`;
}
function drawTalentEditor(state){
 const entries=talentEntries();if(!entries?.length||!editingSkillDefs.length)return false;
 const box=document.getElementById('skillsEditor'),focused=box.contains(document.activeElement)?document.activeElement.dataset.talent:null;
 const previousDetail=document.getElementById('talentDetail'),sameSelection=previousDetail?.dataset.selection===talentSelection;
 const scrollTop=sameSelection?previousDetail.scrollTop:0,descriptionScroll=sameSelection?previousDetail.querySelector('.source-description')?.scrollTop||0:0;
 if(talentSelection&&!entries.some(e=>e.key===talentSelection)&&!String(talentSelection).startsWith('extra:'))talentSelection=null;
 const extras=editingCharacterDetail.Skills.filter(s=>['Outro','Tune Break'].includes(normalizeSkillType(s.SkillType)));
 document.getElementById('editorStage').dataset.talentSelection=String(!!talentSelection);
 document.getElementById('accountEditor').dataset.talentDetail=String(editorSection==='forte'&&!!talentSelection);
 document.getElementById('accountEditor').dataset.treeReady='true';
 document.getElementById('forteEditor').innerHTML='';
 document.getElementById('skillsLabel').textContent=tr('Compétences','Skills');
 document.getElementById('skillsSource').textContent=tr('Progression actuelle','Current progress');
 box.innerHTML=`<div class="talent-layout ${talentSelection?'has-selection':''}"><div class="talent-board" role="group" aria-label="${tr('Arbre de compétences','Skill tree')}">${SKILL_ORDER.map((type,branch)=>{
  const group=entries.filter(e=>e.branch===branch).sort((a,b)=>b.depth-a.depth),linked=group.length===3&&group[0].parent===group[1].index&&group[1].parent===group[2].index;
  const position=TALENT_GEOMETRY.branches[branch];
  return `<div class="talent-branch ${linked?'is-linked':''}">${linked?`<span class="talent-link" aria-hidden="true" data-tree-x="${position.x}" data-tree-y="${position.y[2]}" style="--link-length:${position.y[0]-position.y[2]}"></span>`:''}${group.map(talentButton).join('')}</div>`;
 }).join('')}<div class="talent-extras">${extras.map((s,i)=>`<button type="button" data-tree-x="${TALENT_GEOMETRY.extras[i].x}" data-tree-y="${TALENT_GEOMETRY.extras[i].y}" data-talent="extra:${s.SkillId}" aria-label="${esc(s.TypeLabel||s.SkillType)}" aria-pressed="${talentSelection==='extra:'+s.SkillId}"><span class="talent-symbol"><img src="${esc(assetUrl(s.Icon))}" alt="" width="32" height="32" data-official-icon></span><span><span class="talent-label-full">${esc(s.TypeLabel||s.SkillType)}</span><span class="talent-label-short">${normalizeSkillType(s.SkillType)==='Outro'?'Outro':tr('Tonalité','Tune Break')}</span></span></button>`).join('')}</div>${entries.some(e=>e.branch<0)?`<div class="talent-unplaced">${entries.filter(e=>e.branch<0).map(talentButton).join('')}</div>`:''}</div><aside class="talent-detail" id="talentDetail" ${talentSelection?'':'hidden'} aria-label="${tr('Détail de la sélection','Selection details')}"></aside>${talentSelection?`<button type="button" class="talent-return" data-talent-back aria-label="${tr('Retour à l’arbre','Back to the tree')}">»</button>`:''}</div>`;
 drawTalentDetail(entries,extras);
 // Keep the panel's geometry established in the same render, including when
 // changing a value. Deferring this left one frame with a collapsed detail.
 fitTalentBoard();
 const detail=document.getElementById('talentDetail');
 requestAnimationFrame(()=>{if(detail!==document.getElementById('talentDetail'))return;detail.scrollTop=scrollTop;const text=detail.querySelector('.source-description');if(text)text.scrollTop=descriptionScroll;});
 if(focused)box.querySelector(`[data-talent="${CSS.escape(focused)}"]`)?.focus({preventScroll:true});
 return true;
}
function drawTalentDetail(entries=talentEntries(),extras=editingCharacterDetail?.Skills||[]){
 const box=document.getElementById('talentDetail');if(!box)return;
 box.dataset.selection=talentSelection||'';
 const extra=String(talentSelection).startsWith('extra:')?extras.find(s=>String(s.SkillId)===talentSelection.slice(6)):null;
 const entry=entries?.find(e=>e.key===talentSelection);if(!entry&&!extra)return;
 const name=extra?.SkillName||entry.name,description=extra?.SkillDescribe||entry.description;
 let control='';
 if(entry?.type){const level=editingSkills[entry.type];control=`<label class="talent-level">${tr('Niveau actuel','Current level')}<select aria-label="${tr('Niveau actuel','Current level')}" data-skill-level="${esc(entry.type)}"><option value="">${tr('Non renseigné','Not recorded')}</option>${Array.from({length:10},(_,i)=>i+1).map(n=>`<option value="${n}" ${level===n?'selected':''}>${n} / 10</option>`).join('')}</select></label><div class="talent-adjust"><button type="button" data-skill-step="-1" aria-label="${tr('Diminuer le niveau','Decrease level')}" ${!level||level===1?'disabled':''}>−</button><input type="range" min="1" max="10" step="1" value="${level||1}" data-skill-slider="${esc(entry.type)}" aria-label="${tr('Ajuster le niveau actuel','Adjust current level')}" ${!level?'disabled':''}><button type="button" data-skill-step="1" aria-label="${tr('Augmenter le niveau','Increase level')}" ${level===10?'disabled':''}>+</button></div>`;}
 else if(entry)control=`<fieldset class="talent-state"><legend>${tr('État dans ton jeu','In-game state')}</legend>${[['yes',tr('Débloqué','Unlocked')],['no',tr('Non débloqué','Locked')],['unknown',tr('Non renseigné','Not recorded')]].map(([value,label])=>`<button type="button" data-talent-state="${value}" aria-pressed="${value===(editingForteNodes[entry.key]===true?'yes':editingForteNodes[entry.key]===false?'no':'unknown')}">${label}</button>`).join('')}</fieldset>`;
 const skill=extra||editingCharacterDetail.Skills.find(s=>normalizeSkillType(s.SkillType)===entry.type),icon=extra?assetUrl(extra.Icon):entry.icon;
 const attributes=skill?.SkillAttributes||[],hasDetails=attributes.length>0,level=entry?.type?editingSkills[entry.type]:1;
 const detailContent=talentDetailTab==='details'&&hasDetails?`<div class="talent-multipliers" data-detail-level="${level||1}"><p>${tr('Nv.','Lv.')} ${level||1}${!level?' · '+tr('aperçu, niveau actuel non renseigné','preview, current level not recorded'):''}</p><dl>${attributes.map(a=>`<div><dt>${esc(a.Name)}</dt><dd>${esc(a.Values[(level||1)-1]??'—')}</dd></div>`).join('')}</dl></div>`:gameRichText(extra?.SkillDescribeRich||entry?.rich||description||tr('Description indisponible.','Description unavailable.'));
 box.innerHTML=`<header class="talent-detail-heading">${icon?`<img src="${esc(icon)}" alt="" width="48" height="48">`:''}<div><p class="editor-eyebrow">${esc(skill?.TypeLabel||tr('Compétence','Skill'))}</p><h3 tabindex="-1">${esc(name||tr('Compétence','Skill'))}</h3></div></header><div class="talent-detail-caption game-detail-tabs" role="group" aria-label="${tr('Informations de la compétence','Skill information')}"><button type="button" data-talent-tab="skill" aria-pressed="${talentDetailTab!=='details'||!hasDetails}">${tr('Compétence','Skill')}</button>${hasDetails?`<button type="button" data-talent-tab="details" aria-pressed="${talentDetailTab==='details'}">${tr('Détails','Details')}</button>`:''}</div><div class="source-description">${detailContent}</div><div class="talent-detail-controls">${control}<p class="editor-hint">${extra?tr('Consultation uniquement ; aucun niveau à renseigner.','Reference only; no level to record.'):tr('Progression actuelle dans ton jeu. Enregistre la fiche pour conserver tes modifications.','Current in-game progress. Save the sheet to keep your changes.')}</p></div>`;
}
document.getElementById('skillsEditor').addEventListener('click',event=>{
 const tab=event.target.closest('[data-talent-tab]');if(tab){talentDetailTab=tab.dataset.talentTab;drawTalentDetail();document.querySelector(`[data-talent-tab="${talentDetailTab}"]`)?.focus({preventScroll:true});return;}
 const step=event.target.closest('[data-skill-step]');if(step){const entry=talentEntries()?.find(e=>e.key===talentSelection);if(!entry?.type)return;setEditingSkillLevel(entry.type,Math.min(10,Math.max(1,(editingSkills[entry.type]||0)+Number(step.dataset.skillStep))));drawTalentEditor();document.querySelector(`[data-skill-step="${step.dataset.skillStep}"]:not(:disabled)`)?.focus({preventScroll:true});return;}
 const node=event.target.closest('[data-talent]');
 if(event.target.closest('[data-talent-back]')){const previous=talentSelection;talentSelection=null;drawTalentEditor();document.querySelector(`[data-talent="${CSS.escape(previous)}"]`)?.focus({preventScroll:true});return;}
 if(node){if(talentSelection!==node.dataset.talent)talentDetailTab='skill';talentSelection=node.dataset.talent;drawTalentEditor();if(!document.querySelector('.talent-board').getClientRects().length)document.querySelector('#talentDetail h3').focus({preventScroll:true});return;}
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
