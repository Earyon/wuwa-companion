'use strict';
let planningCharacter=null;
function planCharacter(){const s=CompanionStore.get();return DATA.find(r=>r.id===(planningCharacter||s.active))||DATA.find(r=>ownedIds.includes(r.id));}
function planningTasks(character,goal){
 if(!character||!goal)return [];
 const actual=accountData[character.name]||{},tasks=[];
 if(actual.level==null)tasks.push({text:tr('Renseigner le niveau actuel','Enter current level'),priority:4});
 else if(actual.level<goal.level)tasks.push({text:`${tr('Niveau du Résonateur','Resonator level')} : ${actual.level} → ${goal.level}`,priority:4});
 for(const type of SKILL_ORDER){
  const now=actual.skills?.[type],target=goal.skills[type];if(!target)continue;
  if(now==null)tasks.push({text:`${SKILL_LABELS[lang][type]} : ${tr('niveau actuel à renseigner','current level unknown')}`,priority:goal.priorities[type]||0});
  else if(now<target)tasks.push({text:`${SKILL_LABELS[lang][type]} : ${now} → ${target}`,priority:goal.priorities[type]||0});
 }
 return tasks.sort((a,b)=>b.priority-a.priority);
}
function personalPlanner(){
 const state=CompanionStore.get(),character=planCharacter();
 if(!character)return companionPanel(tr('Objectif actif','Active goal'),`<p>${tr('Ajoute un Résonateur possédé dans Mon compte pour préparer son amélioration.','Add an owned Resonator in My Account to plan improvements.')}</p>`);
 const goal=state.goals[character.id],actual=accountData[character.name]||{};
 return companionPanel(tr('Objectif personnel','Personal goal'),`
 <p>${tr('Un seul Résonateur actif. Les objectifs saisis ici sont tes choix ; ils ne modifient pas tes niveaux actuels.','One active Resonator. Targets here are your choices; they do not change current levels.')}</p>
 <form id="goalForm" class="companion-form"><label class="wide">${tr('Résonateur','Resonator')}<select id="planningCharacter" name="character">${DATA.filter(r=>ownedIds.includes(r.id)).map(r=>`<option value="${r.id}" ${r.id===character.id?'selected':''}>${esc(r.name)}</option>`).join('')}</select></label>
 <label>${tr('Niveau actuel','Current level')}<output>${actual.level??'?'}</output></label><label>${tr('Niveau visé','Target level')}<input name="level" type="number" required min="1" max="90" step="1" value="${goal?.level||actual.level||1}"></label>
 <div class="wide"><h3>${tr('Compétences : actuel → objectif','Skills: current → target')}</h3><p class="companion-note">${tr('Les priorités sont personnelles. Aucune recommandation automatique n’est supposée.','Priorities are personal. No automatic recommendation is assumed.')}</p></div>
 ${SKILL_ORDER.map((type,index)=>`<label>${esc(SKILL_LABELS[lang][type])} · ${actual.skills?.[type]??'?'} →<input aria-label="${esc(SKILL_LABELS[lang][type])}" name="skill:${index}" type="number" required min="1" max="10" step="1" value="${goal?.skills[type]||actual.skills?.[type]||1}"></label><label>${tr('Priorité','Priority')}<select name="priority:${index}">${[0,1,2,3].map(n=>`<option value="${n}" ${(goal?.priorities[type]||0)===n?'selected':''}>${[tr('Non définie','Unspecified'),tr('Faible','Low'),tr('Normale','Normal'),tr('Haute','High')][n]}</option>`).join('')}</select></label>`).join('')}
 <div class="companion-actions wide"><button class="companion-button">${tr('Enregistrer et activer cet objectif','Save and activate this goal')}</button>${state.active?companionButton('pause-plan',tr('Mettre en pause','Pause')):''}</div></form>`)+
 companionPanel(tr('À améliorer','To improve'),goal?`<ul>${planningTasks(character,goal).map(task=>`<li>${esc(task.text)}</li>`).join('')||`<li>${tr('Les objectifs renseignés sont atteints.','The recorded targets are reached.')}</li>`}</ul>`:`<p>${tr('Enregistre un objectif pour générer les prochaines actions.','Save a goal to generate next actions.')}</p>`);
}
function personalDaily(){
 const state=CompanionStore.get(),character=DATA.find(r=>r.id===state.active&&ownedIds.includes(r.id));
 const goal=character?state.goals[character.id]:null;
 return companionPanel(tr('Objectif actif','Active goal'),character&&goal?`<h3>${esc(character.name)}</h3><ul>${planningTasks(character,goal).slice(0,5).map(task=>`<li>${esc(task.text)}</li>`).join('')||`<li>${tr('Les objectifs renseignés sont atteints. Tu peux conserver tes ressources.','Your recorded targets are reached. You can save your resources.')}</li>`}</ul>${companionButton('open-plan',tr('Voir mon objectif','View my goal'))}`:`<p>${tr('Aucun objectif actif. Tes souhaits ne déclenchent pas de farming automatique.','No active goal. Wishlist entries do not automatically start farming.')}</p>${companionButton('open-plan',tr('Choisir un objectif','Choose a goal'))}`);
}
Object.assign(companionActions,{
 'open-plan':()=>{currentView='planner';render();},
 'pause-plan':()=>{CompanionStore.update(s=>{s.active=null;},tr('Objectif mis en pause','Goal paused'));render();}
});
document.querySelector('#view').addEventListener('change',event=>{if(event.target.id==='planningCharacter'){planningCharacter=event.target.value;render();}});
document.querySelector('#view').addEventListener('submit',event=>{
 if(event.target.id!=='goalForm')return;event.preventDefault();const values=new FormData(event.target);
 try{
  const id=String(values.get('character'));if(!ownedIds.includes(id))throw Error('Character is not owned');
  const goal={level:Number(values.get('level')),skills:{},priorities:{}};
  SKILL_ORDER.forEach((type,index)=>{goal.skills[type]=Number(values.get('skill:'+index));goal.priorities[type]=Number(values.get('priority:'+index));});
  CompanionStore.update(s=>{s.goals[id]=goal;s.active=id;},tr('Objectif personnel enregistré','Personal goal saved'));render();companionMessage(tr('Objectif activé.','Goal activated.'));
 }catch(error){console.error(error);companionMessage(tr('Objectif non enregistré. Vérifie les valeurs.','Goal was not saved. Check the values.'),true);}
});
