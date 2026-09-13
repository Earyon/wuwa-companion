'use strict';
let optimizationQuery='',optimizationBusy=false;
function accountPriorities(state,characters){
 return characters.filter(c=>state.roster?.includes(c.id)).map(c=>{
  const teams=state.teams.filter(t=>t.members.includes(c.id)),favorite=teams.filter(t=>t.favorite).length;
  return {character:c,active:state.active===c.id,favorite,teamCount:teams.length,teams,goal:state.goals[c.id]||null};
 }).sort((a,b)=>Number(b.active)-Number(a.active)||b.favorite-a.favorite||b.teamCount-a.teamCount||a.character.name.localeCompare(b.character.name));
}
function allocatePlanCosts(plans,resources,tables){
 const remaining=new Map(),totals={};
 const results=plans.map(plan=>({...plan,allocation:Object.entries(plan.costs).filter(([,need])=>need>0).map(([id,need])=>{
  if(!remaining.has(id)){const stock=CostEngine.stock(id,resources,tables);remaining.set(id,{known:stock.known,complete:stock.value!==null});}
  const stock=remaining.get(id),reserved=Math.min(stock.known,need);stock.known-=reserved;totals[id]=(totals[id]||0)+need;
  return {id,need,reserved,missing:reserved===need?0:stock.complete?need-reserved:null};
 })}));
 return {plans:results,totals,rows:CostEngine.net(totals,resources,tables)};
}
function optimizationPage(){
 const state=CompanionStore.get(),ranked=accountPriorities(state,DATA),plans=ranked.filter(r=>r.goal).map(r=>({...r,...currentCostPlan(r.character,r.goal,{load:false})}));
 const allocation=allocatePlanCosts(plans,state.resources,progressionTables),filtered=ranked.filter(r=>r.character.name.toLowerCase().includes(optimizationQuery.toLowerCase()));
 return companionPanel(tr('Priorités du compte','Account priorities'),`<p>${tr('Ordre explicite : objectif actif, présence dans les équipes favorites, puis nombre d’équipes utilisant le Résonateur. Les stocks connus sont répartis dans cet ordre sans être comptés deux fois. Il s’agit d’une proposition, sans réservation ni dépense automatique.','Explicit order: active goal, membership in favorite teams, then number of teams using the Resonator. Known stock is allocated in this order without double counting. This is a proposal, with no automatic reservation or spending.')}</p><form id="optimizationSearch" class="companion-form"><label>${tr('Rechercher un Résonateur','Search Resonators')}<input type="search" name="query" value="${esc(optimizationQuery)}"></label><button class="companion-button">${tr('Rechercher','Search')}</button></form><div class="companion-actions">${companionButton('analyze-account',optimizationBusy?tr('Analyse en cours…','Analyzing…'):tr('Actualiser les coûts du compte','Refresh account costs'))}${companionButton('optimize-teams',tr('Gérer les équipes favorites','Manage favorite teams'))}</div><p class="companion-note">${tr('Les objectifs absents, les données inconnues et les recommandations non vérifiées ne deviennent pas des besoins supposés. Les pré-farms non possédés restent exclus. Aucun score de dégâts ou rendement fictif n’est calculé.','Missing goals, unknown data and unverified recommendations do not become assumed needs. Unowned pre-farming is excluded. No fictional damage score or efficiency is calculated.')}</p>`)+
 companionPanel(tr('Améliorations proposées','Suggested improvements'),`<div class="companion-list">${filtered.map(r=>{
  const c=r.character,progress=state.characters[c.id]||{},plan=allocation.plans.find(p=>p.character.id===c.id),tasks=r.goal?planningTasks(c,r.goal):[],unknown=[];
  if(progress.level==null)unknown.push(tr('Niveau','Level'));if(!progress.weaponCopyId&&!progress.weapon)unknown.push(tr('Arme équipée','Equipped weapon'));if(state.echoes.filter(e=>e.owner===c.id).length<5)unknown.push(tr('Cinq Échos','Five Echoes'));
  return `<article class="optimization-card"><header><h3>${esc(c.name)}</h3><p>${r.active?tr('Objectif actif','Active goal'):r.favorite?tr('Équipe favorite','Favorite team'):r.teamCount?tr('Membre d’équipe','Team member'):tr('Réserve du compte','Account reserve')} · ${r.teamCount} ${tr('équipes','teams')}</p></header>${r.teams.length?`<p>${r.teams.map(t=>esc(t.name)).join(' · ')}</p>`:''}${unknown.length?`<p class="companion-note">${tr('À renseigner','To record')} : ${unknown.join(' · ')}</p>`:''}${tasks.length?`<ul>${tasks.slice(0,3).map(t=>`<li>${esc(t.text)}</li>`).join('')}</ul>`:`<p>${r.goal?tr('Les objectifs renseignés sont atteints.','Recorded targets are reached.'):tr('Aucun objectif : choisis les améliorations utiles à ton équipe.','No goal: choose upgrades useful to your team.')}</p>`}${plan?.missing.length?`<p class="companion-note">${tr('Coûts partiels : données à compléter.','Partial costs: data needs completing.')}</p>`:''}${plan?.allocation.length?`<details><summary>${tr('Répartition des ressources','Resource allocation')}</summary><div class="import-values">${plan.allocation.map(row=>`<p>${esc(materialName(row.id))} · ${tr('besoin','need')} ${row.need.toLocaleString(lang)} · ${tr('disponible après les priorités précédentes','available after earlier priorities')} ${row.reserved.toLocaleString(lang)} · ${tr('manque','missing')} ${row.missing??'?'}</p>`).join('')}</div></details>`:''}<div class="companion-actions">${companionButton('wish-plan',tr('Préparer l’objectif','Prepare goal'),c.id)}${companionButton('edit-plan-progress',tr('Renseigner la progression','Record progress'),c.id)}${companionButton('wish-profile',tr('Consulter le build','View build'),c.id)}</div></article>`;
 }).join('')||`<p>${tr('Ajoute tes Résonateurs possédés pour organiser les améliorations.','Add your owned Resonators to organize upgrades.')}</p>`}</div>`)+
 companionPanel(tr('Besoins cumulés des objectifs','Combined goal requirements'),`<p class="companion-note">${tr('Seuls les coûts calculables sont inclus. Les stocks inconnus restent inconnus. Ce total ne fixe pas de nombre de runs : les récompenses dépendent de l’activité et du monde.','Only calculable costs are included. Unknown stock remains unknown. This total does not prescribe run counts: rewards depend on the activity and world.')}</p><div class="companion-list">${allocation.rows.map(row=>`<article class="companion-card"><span class="resource-symbol">◇</span><div><b>${esc(materialName(row.id))}</b><small>${tr('Besoin total','Total needed')} ${row.need.toLocaleString(lang)} · ${tr('Stock','Stock')} ${row.stock??'?'} · ${tr('À obtenir','To obtain')} ${row.remaining??'?'}</small></div></article>`).join('')||`<p>${tr('Aucun coût calculable pour le moment.','No calculable cost at this time.')}</p>`}</div>`);
}
moreViews.optimize=optimizationPage;
Object.assign(companionActions,{
 'optimize-teams':()=>{moreTab='teams';render();},
 'analyze-account':async()=>{
  if(optimizationBusy)return;optimizationBusy=true;render();
  try{const state=CompanionStore.get(),rows=accountPriorities(state,DATA).filter(r=>r.goal);if(!extendedCatalog.item.length)await loadExtended('item');for(let i=0;i<rows.length;i+=3)await Promise.allSettled(rows.slice(i,i+3).map(r=>loadProgressSources(r.character,{refresh:true})));}
  finally{optimizationBusy=false;if(currentView==='more'&&moreTab==='optimize')render();}
 }
});
document.getElementById('view').addEventListener('submit',e=>{if(e.target.id!=='optimizationSearch')return;e.preventDefault();optimizationQuery=new FormData(e.target).get('query').trim();render();});
document.addEventListener('progression-ready',()=>{if(!optimizationBusy&&currentView==='more'&&moreTab==='optimize')render();});
