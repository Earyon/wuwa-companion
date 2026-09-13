'use strict';
let achievementData=null,achievementError=false,achievementLoading=false;
let achievementQuery='',achievementGroup='',achievementFilter='all',achievementPage=0,showHiddenAchievements=false;
let eventData=null,eventError=false,eventLoading=false,activityFilter='open';
let activityDraft={name:'',period:'once',end:''};
const localText=value=>typeof value==='string'?value:(value?.[lang]||value?.en||'');
const statusLabel=value=>({unknown:tr('Inconnu','Unknown'),todo:tr('À faire','To do'),done:tr('Terminé','Done')})[value];
function statusSelect(action,id,status){return `<label class="status-control"><span class="visually-hidden">${tr('État','Status')}</span><select data-status-action="${action}" data-id="${esc(id)}">${['unknown','todo','done'].map(s=>`<option value="${s}" ${s===status?'selected':''}>${statusLabel(s)}</option>`).join('')}</select></label>`;}
async function loadActivityData(kind){
 if(kind==='achievements'){if(achievementLoading)return;achievementLoading=true;}else{if(eventLoading)return;eventLoading=true;}
 try{
  const data=await fetchJSON('./data/'+kind+'.json');if(data.schema!==1||!Array.isArray(data[kind]))throw Error('Invalid catalogue');
  if(kind==='achievements'){achievementData=data;achievementError=false;}else{eventData=data;eventError=false;}
 }catch{if(kind==='achievements')achievementError=true;else eventError=true;}
 finally{if(kind==='achievements')achievementLoading=false;else eventLoading=false;}
 if(currentView==='more'&&moreTab===kind)render();
 if(currentView==='daily'){const panel=document.getElementById('dailyActivities');if(panel)panel.innerHTML=dailyActivityContent();}
}
function achievementsPage(){
 if(!achievementData){if(!achievementError&&!achievementLoading)queueMicrotask(()=>loadActivityData('achievements'));return companionPanel(tr('Succès','Achievements'),`<p>${achievementError?tr('Catalogue indisponible.','Catalogue unavailable.'):tr('Chargement du catalogue…','Loading catalogue…')}</p>${companionButton('load-activity-data',tr('Réessayer','Retry'),'achievements')}`);}
 const state=CompanionStore.get(),all=achievementData.achievements;
 const filtered=all.filter(a=>(!achievementGroup||a.group===achievementGroup)&&(achievementFilter==='all'||(state.achievements[a.id]||'unknown')===achievementFilter)&&(localText(a.name)+' '+localText(a.description)+' '+a.id).toLocaleLowerCase().includes(achievementQuery.toLocaleLowerCase()));
 const pages=Math.max(1,Math.ceil(filtered.length/30));achievementPage=Math.min(achievementPage,pages-1);
 const done=all.filter(a=>state.achievements[a.id]==='done');
 return companionPanel(tr('Succès','Achievements'),`<p>${done.length} / ${all.length} ${tr('marqués terminés','marked done')} · ${done.reduce((sum,a)=>sum+(a.astrite||0),0)} Astrites ${tr('associées, sans ajout au stock','associated, not added to stock')}</p>
 <form id="achievementSearch" class="companion-form"><label>${tr('Rechercher un nom ou une condition','Search name or condition')}<input name="query" type="search" value="${esc(achievementQuery)}"></label><label>${tr('Catégorie','Category')}<select name="group"><option value="">${tr('Toutes','All')}</option>${achievementData.groups.sort((a,b)=>a.category-b.category||a.sort-b.sort).map(g=>`<option value="${g.id}" ${g.id===achievementGroup?'selected':''}>${esc(localText(g.name))}</option>`).join('')}</select></label><label>${tr('État','Status')}<select name="status">${['all','unknown','todo','done'].map(s=>`<option value="${s}" ${s===achievementFilter?'selected':''}>${s==='all'?tr('Tous','All'):statusLabel(s)}</option>`).join('')}</select></label><button class="companion-button">${tr('Rechercher','Search')}</button><label class="check-label"><input name="hidden" type="checkbox" ${showHiddenAchievements?'checked':''}>${tr('Révéler les succès cachés','Reveal hidden achievements')}</label></form>
 <div class="companion-list">${filtered.slice(achievementPage*30,(achievementPage+1)*30).map(a=>{const concealed=a.hidden&&!showHiddenAchievements&&state.achievements[a.id]!=='done';return `<article class="activity-card"><div><h3>${concealed?tr('Succès caché','Hidden achievement'):esc(localText(a.name))}</h3><p>${concealed?tr('Active « Révéler les succès cachés » pour lire sa condition.','Enable “Reveal hidden achievements” to read the condition.'):esc(localText(a.description))}</p><small>${a.astrite??'?'} Astrites · ${esc(localText(achievementData.groups.find(g=>g.id===a.group)?.name))}</small></div>${statusSelect('achievement',a.id,state.achievements[a.id]||'unknown')}</article>`;}).join('')||`<p>${tr('Aucun résultat.','No results.')}</p>`}</div>
 <div class="companion-actions">${companionButton('achievement-page',tr('Précédent','Previous'),Math.max(0,achievementPage-1))}<span>${achievementPage+1} / ${pages} · ${filtered.length}</span>${companionButton('achievement-page',tr('Suivant','Next'),Math.min(pages-1,achievementPage+1))}</div><p class="companion-note"><a href="${achievementData.source}" target="_blank" rel="noopener">WW_Data ${achievementData.gameVersion}</a> · ${achievementData.checkedAt} · ${tr('Les états sont tes déclarations. Les conditions proviennent des textes du jeu.','Statuses are your records. Conditions come from game text.')}</p>`);
}
function activityDefinitions(){
 const builtins=[{id:'daily-activity',name:tr('Activités quotidiennes','Daily activities'),period:'daily'},{id:'weekly-boss',name:tr('Défis de boss hebdomadaires','Weekly boss challenges'),period:'weekly'}];
 const events=(eventData?.events||[]).map(e=>({...e,id:'event:'+e.id,name:localText(e.name),period:'once',source:eventData.source,reward:localText(e.reward)}));
 const extras=CompanionStore.get().activities.filter(a=>a.id.startsWith('custom:'));
 return [...builtins,...events,...extras];
}
function activityState(definition,state=CompanionStore.get(),now=Date.now()){
 return ActivityRules.status(state.activities.find(a=>a.id===definition.id),definition,state.settings.server,now);
}
function serverSelector(){const server=CompanionStore.get().settings.server;return `<label>${tr('Serveur du compte','Account server')}<select id="activityServer"><option value="">${tr('À renseigner','Choose a server')}</option>${[['europe','Europe'],['america',tr('Amérique','America')],['asia',tr('Asie','Asia')],['sea','SEA'],['hmt','HMT']].map(([id,n])=>`<option value="${id}" ${server===id?'selected':''}>${n}</option>`).join('')}</select></label>`;}
function activityTiming(def,server,now=Date.now()){
 const start=ActivityRules.serverDate(def.start,server),end=ActivityRules.serverDate(def.end,server);
 const next=ActivityRules.nextReset(def.period||'once',server,now);
 if(end!==null&&now>end)return {closed:true,label:tr('Événement terminé','Event ended')};
 if(start!==null&&now<start)return {upcoming:true,label:tr('Début : ','Starts: ')+new Date(start).toLocaleString(lang,{dateStyle:'short',timeStyle:'short'})};
 const deadline=end??next;
 if(deadline!==null)return {deadline,urgent:deadline-now<=48*3600000,label:(end!==null?tr('Fin : ','Ends: '):tr('Réinitialisation : ','Resets: '))+new Date(deadline).toLocaleString(lang,{dateStyle:'short',timeStyle:'short'})};
 return {label:def.end?tr('Fin à l’heure du serveur : ','Ends in server time: ')+def.end:tr('Serveur nécessaire pour les horaires','Choose a server for reset times')};
}
function activitiesPage(){
 if(!eventData&&!eventLoading&&!eventError)queueMicrotask(()=>loadActivityData('events'));
 const state=CompanionStore.get(),server=state.settings.server,all=activityDefinitions();
 const rows=all.filter(a=>activityFilter==='all'||activityState(a,state)!=='done'&&!activityTiming(a,server).closed);
 return companionPanel(tr('Activités & événements','Activities & events'),`<div class="companion-form">${serverSelector()}<label>${tr('Afficher','Show')}<select id="activityFilter"><option value="open" ${activityFilter==='open'?'selected':''}>${tr('À suivre','To follow')}</option><option value="all" ${activityFilter==='all'?'selected':''}>${tr('Tout l’historique','All records')}</option></select></label></div><p class="companion-note">${tr('Les horaires ci-dessous sont affichés dans le fuseau de cet appareil. Un nouveau cycle revient à « Inconnu » sans supprimer ton historique.','Times below use this device’s time zone. A new cycle returns to “Unknown” without deleting your history.')}</p>
 ${eventError?`<p>${tr('Calendrier indisponible. Tes activités personnelles restent accessibles.','Calendar unavailable. Your personal activities remain accessible.')}</p>${companionButton('load-activity-data',tr('Réessayer','Retry'),'events')}`:''}
 <div class="companion-list">${rows.map(a=>{const timing=activityTiming(a,server);return `<article class="activity-card ${timing.urgent?'urgent':''}"><div><h3>${esc(a.name)}</h3><p>${esc(timing.label)}</p>${a.reward?`<small>${esc(a.reward)}</small>`:''}${a.source?`<a href="${esc(a.source)}" target="_blank" rel="noopener">${tr('Annonce source','Source announcement')}</a>`:''}</div>${statusSelect('activity',a.id,activityState(a,state))}${a.id.startsWith('custom:')?companionButton('remove-activity',tr('Retirer','Remove'),a.id):''}</article>`;}).join('')||`<p>${tr('Aucune activité restante dans cette sélection.','No remaining activity in this selection.')}</p>`}</div>
 <p class="companion-note">${tr('Calendrier 3.6 vérifié le 13/09/2026. Les événements expirés ne sont plus proposés ; consulte les annonces du jeu pour les ajouts ultérieurs. Les titres français des événements sont des traductions Companion.','3.6 calendar checked on 2026-09-13. Expired events are no longer suggested; check game announcements for later additions. French event titles are Companion translations.')}</p>`)+
 companionPanel(tr('Ajouter une activité personnelle','Add a personal activity'),`<form id="activityForm" class="companion-form"><label>${tr('Nom','Name')}<input name="name" required maxlength="160" value="${esc(activityDraft.name)}"></label><label>${tr('Répétition','Repeat')}<select name="period"><option value="once" ${activityDraft.period==='once'?'selected':''}>${tr('Une fois','Once')}</option><option value="daily" ${activityDraft.period==='daily'?'selected':''}>${tr('Chaque jour','Daily')}</option><option value="weekly" ${activityDraft.period==='weekly'?'selected':''}>${tr('Chaque semaine','Weekly')}</option></select></label><label>${tr('Fin facultative (heure serveur)','Optional end (server time)')}<input name="end" type="datetime-local" value="${esc(activityDraft.end)}"></label><button class="companion-button">${tr('Ajouter','Add')}</button></form>`);
}
function dailyActivityContent(){
 if(!eventData&&!eventLoading&&!eventError)queueMicrotask(()=>loadActivityData('events'));
 const state=CompanionStore.get(),rows=activityDefinitions().map(a=>({a,t:activityTiming(a,state.settings.server)})).filter(({a,t})=>activityState(a,state)!=='done'&&!t.closed&&!t.upcoming).sort((a,b)=>(a.t.deadline??Infinity)-(b.t.deadline??Infinity)).slice(0,4);
 return `<ul class="daily-activities">${rows.map(({a,t})=>`<li><div><b>${esc(a.name)}</b><small>${esc(t.label)}</small></div>${statusSelect('activity',a.id,activityState(a,state))}</li>`).join('')}</ul>${!state.settings.server?`<p>${tr('Renseigne ton serveur dans Activités pour afficher les échéances.','Choose your server in Activities to show deadlines.')}</p>`:''}${companionButton('more-tab',tr('Toutes les activités','All activities'),'events')}`;
}
function dailyActivities(){return companionPanel(tr('À suivre aujourd’hui','To follow today'),`<div id="dailyActivities">${dailyActivityContent()}</div>`);}
Object.assign(companionActions,{
 'load-activity-data':kind=>{if(['events','achievements'].includes(kind))return loadActivityData(kind);},
 'achievement-page':page=>{achievementPage=Number(page);render();},
 'remove-activity':id=>{if(!confirm(tr('Retirer cette activité personnelle ?','Remove this personal activity?')))return;CompanionStore.update(s=>{s.activities=s.activities.filter(a=>a.id!==id);},tr('Activité retirée','Activity removed'));render();}
});
document.getElementById('view').addEventListener('change',event=>{
 const input=event.target;
 try{
  if(input.id==='activityServer'){CompanionStore.update(s=>{s.settings.server=input.value||null;},tr('Serveur actualisé','Server updated'));render();}
  if(input.id==='activityFilter'){activityFilter=input.value;render();}
  if(input.dataset.statusAction==='achievement'){const id=input.dataset.id;if(!achievementData?.achievements.some(a=>a.id===id))throw Error('Unknown achievement');CompanionStore.update(s=>{s.achievements[id]=input.value;},tr('Succès actualisé','Achievement updated')+' · '+id);render();}
  if(input.dataset.statusAction==='activity'){
   const def=activityDefinitions().find(a=>a.id===input.dataset.id);if(!def)return;const server=CompanionStore.get().settings.server,cycle=ActivityRules.cycle(def.period||'once',server);
   if(cycle===null){companionMessage(tr('Choisis ton serveur avant de cocher une activité récurrente.','Choose your server before marking a recurring activity.'),true);input.value='unknown';return;}
   CompanionStore.update(s=>{const current=s.activities.find(a=>a.id===def.id),record={...current,id:def.id,name:def.name,status:input.value,period:def.period||'once',cycle};if(current)s.activities[s.activities.indexOf(current)]=record;else s.activities.push(record);},def.name+' · '+statusLabel(input.value));render();
  }
 }catch{companionMessage(tr('Modification non enregistrée. Vérifie le stockage.','Change not saved. Check storage.'),true);}
});
document.getElementById('view').addEventListener('submit',event=>{
 if(event.target.id==='achievementSearch'){event.preventDefault();const f=new FormData(event.target);achievementQuery=f.get('query');achievementGroup=f.get('group');achievementFilter=f.get('status');showHiddenAchievements=f.get('hidden')==='on';achievementPage=0;render();}
 if(event.target.id==='activityForm'){
  event.preventDefault();const f=new FormData(event.target),state=CompanionStore.get();if(!f.get('name').trim())return;
  if(f.get('end')&&!state.settings.server){companionMessage(tr('Choisis ton serveur pour enregistrer cette échéance.','Choose your server to save this deadline.'),true);return;}
  try{CompanionStore.update(s=>s.activities.push({id:'custom:'+crypto.randomUUID(),name:f.get('name').trim(),period:f.get('period'),end:f.get('end')||null,status:'todo',cycle:ActivityRules.cycle(f.get('period'),state.settings.server)}),tr('Activité ajoutée','Activity added'));activityDraft={name:'',period:'once',end:''};render();}catch{companionMessage(tr('Activité non enregistrée.','Activity not saved.'),true);}
 }
});

document.getElementById('view').addEventListener('input',event=>{if(event.target.form?.id==='activityForm')activityDraft=Object.fromEntries(new FormData(event.target.form));});
let activityClockStamp='';
function refreshActivityClock(){
 if(document.hidden)return;
 const server=CompanionStore.get().settings.server,stamp=JSON.stringify(activityDefinitions().map(a=>[a.id,ActivityRules.cycle(a.period||'once',server),activityTiming(a,server).closed,activityTiming(a,server).upcoming]));
 if(stamp===activityClockStamp)return;if(currentView==='more'&&moreTab==='events'&&document.activeElement?.closest('form'))return;activityClockStamp=stamp;
 if(currentView==='daily'){const panel=document.getElementById('dailyActivities');if(panel)panel.innerHTML=dailyActivityContent();}
 if(currentView==='more'&&moreTab==='events'&&!document.activeElement?.closest('form'))render();
}
setInterval(refreshActivityClock,30000);document.addEventListener('visibilitychange',refreshActivityClock);
