'use strict';
let planningCharacter=null;
const goalDrafts=new Map(),goalOriginals=new Map();
function planCharacter(){const s=CompanionStore.get();return DATA.find(r=>r.id===(planningCharacter||s.active)&&(s.roster?.includes(r.id)||s.wishlist.includes(r.id)&&(s.goals[r.id]?.prefarm||goalDrafts.get(r.id)?.prefarm)))||DATA.find(r=>s.roster?.includes(r.id));}
function planningTasks(character,goal){
 if(!character||!goal)return [];
 const state=CompanionStore.get(),actual=planningActual(character,goal),tasks=[];
 const step=(key,label,now,target,priority)=>{if(target==null||now>=target)return;tasks.push({key,text:label+' : '+(now==null?tr('à renseigner','unknown'):now)+' → '+target,priority});};
 step('level',tr('Niveau du Résonateur','Resonator level'),actual.level,goal.level,5);
 step('ascension',tr('Ascension du Résonateur','Resonator ascension'),actual.ascension,goal.ascension,5);
 const weapon=state.weapons.find(w=>w.id===actual.weaponCopyId);
 step('weapon',tr('Niveau de l’arme','Weapon level'),weapon?.level,goal.weaponLevel,4);
 step('weaponAscension',tr('Ascension de l’arme','Weapon ascension'),weapon?.ascension,goal.weaponAscension,4);
 for(const type of SKILL_ORDER)step('skill:'+type,SKILL_LABELS[lang][type],actual.skills?.[type],goal.skills?.[type],goal.priorities?.[type]??0);
 const defs=normalizeForteDefs(readCharacterDetailCache(character.gameId));
 for(const [id,wanted]of Object.entries(goal.forteNodes||{}))if(wanted&&actual.forteNodes?.[id]!==true)tasks.push({key:id,text:(defs.find(d=>d.key===id)?.name||id)+' · '+(actual.forteNodes?.[id]===false?tr('à débloquer','unlock'):tr('état actuel à renseigner','record current state')),priority:3});
 return tasks.sort((a,b)=>b.priority-a.priority);
}
function goalPassiveHTML(character,goal){
 const defs=normalizeForteDefs(readCharacterDetailCache(character.gameId));
 return defs.length?defs.map(d=>`<label class="plan-passive"><input type="checkbox" name="passive:${d.key}" ${goal.forteNodes?.[d.key]?'checked':''}><span>${esc(d.name)}</span></label>`).join(''):`<p class="companion-note">${tr('Les déblocages s’affichent lorsque les données du personnage sont disponibles.','Unlocks appear when character data is available.')}</p>`;
}
function personalPlanner(){
 const state=CompanionStore.get(),character=planCharacter();
 if(!character)return companionPanel(tr('Objectif actif','Active goal'),`<p>${tr('Ajoute un Résonateur possédé dans Mon compte pour préparer son amélioration.','Add an owned Resonator in My Account to plan improvements.')}</p>`);
 const saved=state.goals[character.id]||null,prefarm=!state.roster?.includes(character.id),actual=planningActual(character,goalDrafts.get(character.id)||saved);
 if(!goalOriginals.has(character.id))goalOriginals.set(character.id,structuredClone(saved));
 const goal=goalDrafts.get(character.id)||saved||{level:actual.level??null,skills:{...actual.skills},priorities:{},forteNodes:{}};
 queueMicrotask(()=>loadProgressSources(character));
 return companionPanel(prefarm?tr('Pré-farm explicite','Explicit pre-farming'):tr('Objectif personnel','Personal goal'),`${prefarm?'<p>'+tr('Simulation depuis le niveau 1 et les compétences au niveau 1. Elle reste séparée de ton objectif actif possédé.','Simulation from level 1 and skills at level 1. It stays separate from your owned active goal.')+'</p>':''}<p>${tr('Choisis ce que tu souhaites améliorer. Un objectif vide exclut cette amélioration. Un seul Résonateur possédé est actif à la fois.','Choose what to improve. An empty target excludes that upgrade. Only one owned Resonator is active at a time.')}</p>
 <form id="goalForm" class="companion-form"><label class="wide">${tr('Résonateur','Resonator')}<select id="planningCharacter" name="character">${DATA.filter(r=>state.roster?.includes(r.id)||state.wishlist.includes(r.id)&&(state.goals[r.id]?.prefarm||goalDrafts.get(r.id)?.prefarm)).map(r=>`<option value="${r.id}" ${r.id===character.id?'selected':''}>${esc(r.name)}</option>`).join('')}</select></label>
 <label>${tr('Niveau actuel','Current level')}<output>${actual.level??'?'}</output></label><label>${tr('Niveau visé','Target level')}<input name="level" type="number" min="1" max="90" step="1" value="${goal.level??''}" placeholder="—"></label>
 ${ascensionField('ascension',goal.ascension,tr('Ascension visée','Target ascension'))}<label>${tr('Niveau d’arme visé','Target weapon level')}<input name="weaponLevel" type="number" min="1" max="90" step="1" value="${goal.weaponLevel??''}" placeholder="—"></label>${ascensionField('weaponAscension',goal.weaponAscension,tr('Ascension d’arme visée','Target weapon ascension'))}
 <div class="wide"><h3>${tr('Compétences : actuel → objectif','Skills: current → target')}</h3></div>
 ${SKILL_ORDER.map((type,index)=>`<div class="goal-skill"><label>${esc(SKILL_LABELS[lang][type])} · ${actual.skills?.[type]??'?'} →<input aria-label="${esc(SKILL_LABELS[lang][type])}" name="skill:${index}" type="number" min="1" max="10" step="1" value="${goal.skills?.[type]??''}" placeholder="—"></label><label>${tr('Priorité','Priority')}<select name="priority:${index}">${[0,1,2,3].map(n=>`<option value="${n}" ${(goal.priorities?.[type]||0)===n?'selected':''}>${[tr('Non définie','Unspecified'),tr('Faible','Low'),tr('Normale','Normal'),tr('Haute','High')][n]}</option>`).join('')}</select></label></div>`).join('')}
 <fieldset class="wide plan-passives"><legend>${tr('Passifs à débloquer','Passive unlock targets')}</legend><div id="goalPassives">${goalPassiveHTML(character,goal)}</div></fieldset>
 <div class="companion-actions wide"><button type="submit" name="mode" value="activate" class="companion-button">${prefarm?tr('Enregistrer le pré-farm','Save pre-farming'):tr('Enregistrer et activer','Save and activate')}</button><button type="submit" name="mode" value="keep" class="companion-button">${tr('Enregistrer sans activer','Save without activating')}</button>${companionButton('cancel-goal',tr('Annuler mes changements','Cancel my changes'),character.id)}${state.active?companionButton('pause-plan',tr('Mettre en pause','Pause')):''}${prefarm?'':companionButton('edit-plan-progress',tr('Renseigner ma progression','Record my progress'),character.id)}</div></form>`)+
 companionPanel(tr('À améliorer','To improve'),saved?`<ul>${planningTasks(character,saved).map(task=>`<li>${esc(task.text)}</li>`).join('')||`<li>${tr('Les objectifs renseignés sont atteints.','The recorded targets are reached.')}</li>`}</ul><div id="planCosts">${planCostsHTML(character,saved)}</div>`:`<p>${tr('Enregistre un objectif pour calculer les besoins.','Save a target to calculate costs.')}</p>`);
}
function personalDaily(){
 const state=CompanionStore.get(),character=DATA.find(r=>r.id===state.active&&state.roster?.includes(r.id)),goal=character?state.goals[character.id]:null;
 return companionPanel(tr('Objectif actif','Active goal'),character&&goal?`<h3>${esc(character.name)}</h3><ul>${planningTasks(character,goal).slice(0,5).map(task=>`<li>${esc(task.text)}</li>`).join('')||`<li>${tr('Objectifs atteints : conserve tes ressources.','Targets reached: save your resources.')}</li>`}</ul>${companionButton('open-plan',tr('Voir mon objectif','View my goal'))}${companionButton('waveplate-advice',tr('Que faire avec mes Waveplates ?','How should I use my Waveplates?'))}<div id="waveplateAdvice"></div>`:`<p>${tr('Aucun objectif actif. Tes souhaits ne déclenchent pas de farming automatique.','No active goal. Wishlist entries do not automatically start farming.')}</p>${companionButton('open-plan',tr('Choisir un objectif','Choose a goal'))}`);
}
function readGoalForm(form){
 const v=new FormData(form),id=v.get('character'),base=goalDrafts.get(id)||CompanionStore.get().goals[id]||{};
 const nullable=k=>v.get(k)===''?null:Number(v.get(k));
 const goal={...base,level:nullable('level'),ascension:nullable('ascension'),weaponLevel:nullable('weaponLevel'),weaponAscension:nullable('weaponAscension'),skills:{},priorities:{},forteNodes:{...base.forteNodes}};
 SKILL_ORDER.forEach((type,i)=>{if(v.get('skill:'+i)!=='')goal.skills[type]=Number(v.get('skill:'+i));goal.priorities[type]=Number(v.get('priority:'+i));});
 for(const input of form.querySelectorAll('[name^="passive:"]'))goal.forteNodes[input.name.slice(8)]=input.checked;
 return {id,goal};
}
function refreshPlanDisplay(){
 const character=planCharacter();if(!character)return;const state=CompanionStore.get(),goal=state.goals[character.id];
 const costs=document.getElementById('planCosts');if(costs&&goal)costs.innerHTML=planCostsHTML(character,goal);
 const passives=document.getElementById('goalPassives');if(passives&&!passives.querySelector('input'))passives.innerHTML=goalPassiveHTML(character,goalDrafts.get(character.id)||goal||{});
}
Object.assign(companionActions,{
 'cancel-goal':id=>{goalDrafts.delete(id);goalOriginals.delete(id);render();},
 'open-plan':()=>{currentView='planner';render();},
 'pause-plan':()=>{CompanionStore.update(s=>{s.active=null;},tr('Objectif mis en pause','Goal paused'));render();},
 'refresh-plan':id=>{const c=DATA.find(c=>c.id===id);if(c)return loadProgressSources(c,{refresh:true});},
 'plan-resources':()=>{currentView='account';accountTab='resources';resourceFilter='needed';resourcePage=0;render();},
 'edit-plan-progress':id=>{const c=DATA.find(c=>c.id===id);if(c)openAccountEditor(c.name);},
 'waveplate-advice':async()=>{
  const state=CompanionStore.get(),c=DATA.find(r=>r.id===state.active);if(!c)return;await loadProgressSources(c);const plan=currentCostPlan(c,state.goals[c.id]);
  const missing=plan.rows.filter(r=>r.remaining>0).slice(0,3),box=document.getElementById('waveplateAdvice');if(!box)return;
  box.innerHTML=missing.length?`<p>${tr('Priorité aux manques confirmés de ton objectif :','Prioritize confirmed shortages for your target:')}</p><ul>${missing.map(r=>`<li>${esc(materialName(r.id))} : ${r.remaining.toLocaleString(lang)}</li>`).join('')}</ul><p class="companion-note">${tr('Vérifie les récompenses de l’activité avant de dépenser. Aucun rendement ni nombre de runs n’est inventé.','Check the activity rewards before spending. No yield or run count is assumed.')}</p>`:`<p>${tr('Aucune dépense justifiée par les données connues. Complète les stocks inconnus ou conserve tes Waveplates.','No spending justified by known data. Complete unknown stock or save your Waveplates.')}</p>`;
 }
});
document.getElementById('view').addEventListener('input',event=>{if(event.target.form?.id==='goalForm'&&event.target.id!=='planningCharacter'){const {id,goal}=readGoalForm(event.target.form);goalDrafts.set(id,goal);}});
document.getElementById('view').addEventListener('change',event=>{if(event.target.id==='planningCharacter'){planningCharacter=event.target.value;render();}});
document.getElementById('view').addEventListener('submit',event=>{
 if(event.target.id!=='goalForm')return;event.preventDefault();
 try{const {id,goal}=readGoalForm(event.target);CompanionStore.saveGoal(id,goal,goalOriginals.get(id)??null,event.submitter?.value!=='keep',tr('Objectif personnel enregistré','Personal goal saved'));goalDrafts.delete(id);goalOriginals.delete(id);render();companionMessage(tr('Objectif enregistré.','Goal saved.'));}
 catch{companionMessage(tr('Objectif non enregistré : vérifie les niveaux et ascensions, le stockage ou une modification dans un autre onglet.','Goal not saved: check levels and ascensions, storage or a change in another tab.'),true);}
});
document.addEventListener('progression-ready',refreshPlanDisplay);
document.addEventListener('catalogue-ready',event=>{if(event.detail==='item')refreshPlanDisplay();});
