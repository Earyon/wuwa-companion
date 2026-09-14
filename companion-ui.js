'use strict';
const tr=(fr,en)=>lang==='fr'?fr:en;
const companionPanel=(title,body)=>`<section class="content-panel companion-panel"><h2>${esc(title)}</h2>${body}</section>`;
const companionButton=(action,label,value='')=>`<button type="button" class="companion-button" data-action="${action}" data-value="${esc(value)}">${esc(label)}</button>`;
function companionMessage(message,error=false){
 let box=document.querySelector('#companionMessage');
 if(!box){box=document.createElement('div');box.id='companionMessage';box.setAttribute('role','status');}
 const surface=[...document.querySelectorAll('dialog[open]')].at(-1)||document.body;
 surface.append(box);
 box.textContent=message;box.className=error?'companion-message error':'companion-message';
 clearTimeout(companionMessage.timer);companionMessage.timer=setTimeout(()=>box.remove(),7000);
}
function companionDownload(data,name){
 const url=URL.createObjectURL(new Blob([JSON.stringify(data,null,2)],{type:'application/json'}));
 const a=document.createElement('a');a.href=url;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
}
let pendingBackup=null,backupRead=0;
let moreTab='settings';
const moreViews={settings:()=>settingsPage(),achievements:()=>achievementsPage(),events:()=>activitiesPage()};
function companionMore(){if(!moreViewIsVisible(moreTab))moreTab='settings';return `<nav class="section-tabs" aria-label="${tr('Rubriques complémentaires','More sections')}">${Object.keys(moreViews).filter(moreViewIsVisible).map(key=>`<button type="button" data-action="more-tab" data-value="${key}" aria-current="${moreTab===key?'page':'false'}">${({settings:tr('Réglages','Settings'),achievements:tr('Succès','Achievements'),events:tr('Activités','Activities'),teams:tr('Équipes','Teams'),wishes:tr('Souhaits','Wishlist'),optimize:tr('Optimiser','Optimize'),tracker:tr('Invocations','Convenes')})[key]}</button>`).join('')}</nav>`+(moreViews[moreTab]||moreViews.settings)();}
function settingsPage(){
 const state=CompanionStore.get();
 return companionPanel(tr('Paramètres','Settings'),`<div class="companion-actions">${companionButton('language','Français','fr')}${companionButton('language','English','en')}</div><form id="preferencesForm" class="companion-form"><label>${tr('Écran au démarrage','Start screen')}<select name="startView">${['daily','account','ency','planner','more'].filter(viewIsVisible).map(view=>`<option value="${view}" ${(state.settings.startView||'account')===view?'selected':''}>${esc(t(view))}</option>`).join('')}</select></label><button class="companion-button">${tr('Enregistrer','Save')}</button></form><p class="companion-note">${tr('Tes données restent dans ce navigateur. La synchronisation entre appareils n’est pas automatique ; utilise les exports pour les transférer. Aucun abonnement ni compte externe nécessaire.','Your data stays in this browser. Devices do not sync automatically; use exports to transfer data. No subscription or external account required.')}</p>`)+
 companionPanel(tr('Prise en main','Getting started'),`<p>${tr('Découvre les fonctions principales à ton rythme.','Discover the main features at your own pace.')}</p>${companionButton('tutorial-replay',tr('Rejouer le tutoriel','Replay tutorial'))}`)+
 companionPanel(tr('Application & hors ligne','App & offline'),`<div id="pwaStatus" aria-live="polite">${pwaStatusHTML()}</div>${companionButton('check-update',tr('Rechercher une mise à jour','Check for updates'))}<p class="companion-note">${tr('Les écrans et références intégrées sont accessibles hors ligne après leur installation. Les catalogues, détails et images distants doivent avoir été chargés auparavant.','Screens and bundled references work offline after installation. Remote catalogues, details and images must have been loaded previously.')}</p>`)+
 companionPanel(tr('Import & sauvegarde','Import & backup'),`
 <p>${tr('Sauvegarde personnelle au format JSON, pour restaurer ou transférer ton compte. Les catalogues du jeu et les historiques d’invocations ne sont pas inclus. ','Personal JSON backup to restore or transfer your account. Game catalogues and pull histories are not included. ')}</p>
 ${CompanionStore.error()||personalReadErrors.length?`<p class="companion-error">${tr('Certaines données locales sont illisibles. Exporte-les avant toute restauration.','Some local records cannot be read. Export them before restoring.')}</p>`:''}
 <div class="companion-actions">${companionButton('export',tr('Exporter ma sauvegarde','Export my backup'))}<label class="companion-button companion-file">${tr('Choisir une sauvegarde','Choose a backup')}<input type="file" id="backupFile" accept="application/json,.json"></label>${localStorage.getItem('wwc_before_restore')?companionButton('undo-import',tr('Restaurer avant le dernier import','Restore before last import')):''}</div>
 <div id="backupPreview" aria-live="polite"></div>
 <p class="companion-note">${tr('La restauration remplace les données personnelles sur cet appareil après confirmation. Une copie de l’état précédent reste disponible. Aucun envoi vers un serveur.','Restoring replaces personal data on this device after confirmation. A copy of the previous state remains available. Nothing is sent to a server.')}</p>`)+
 companionPanel(tr('Historique','History'),state.journal.length?`<ol class="companion-history">${state.journal.slice(0,60).map(entry=>`<li><time>${esc(new Date(entry.at).toLocaleString(lang))}</time><span>${esc(entry.label)}</span></li>`).join('')}</ol>`:`<p>${tr('Les prochaines modifications importantes apparaîtront ici.','Future significant changes will appear here.')}</p>`)+
 companionPanel(tr('Sources & mises à jour','Sources & updates'),`<p>${esc(catalogState.source||'Encore')} · ${esc(catalogState.gameVersion||'?')}<br>${DATA.length} ${tr('Résonateurs','Resonators')} · ${WEAPONS.length} ${tr('armes','weapons')}</p><p><a href="https://wutheringwaves.kurogames.com/" target="_blank" rel="noopener">Wuthering Waves · Kuro Games</a> · <a href="https://www.encore.moe/about" target="_blank" rel="noopener">Encore / WW_Data</a> · <a href="https://www.prydwen.gg/wuthering-waves/" target="_blank" rel="noopener">Prydwen</a> · <a href="https://slyraf.com/wuthering-waves/personnages/" target="_blank" rel="noopener">Slyraf · FR</a></p><p class="companion-note">${tr('Outil communautaire non officiel. Les noms et visuels du jeu appartiennent à leurs détenteurs. Les textes et visuels proviennent en priorité des ressources du jeu 3.6.13. Encore / WW_Data et Slyraf complètent les références.','Unofficial community tool. Game names and artwork belong to their owners. Texts and artwork primarily use game resources 3.6.13. Encore / WW_Data and Slyraf provide additional references.')}</p>`);
}
const companionActions={
 'more-tab':value=>{if(!moreViews[value])return;moreTab=value;currentView='more';render();},
 language:value=>setLang(value),
 export:()=>companionDownload(CompanionStore.exportData(),`wuwa-companion-${new Date().toISOString().slice(0,10)}.json`),
 'restore-backup':()=>{
  if(!pendingBackup)return;
  if(!confirm(tr('Remplacer les données personnelles de cet appareil par cette sauvegarde ?','Replace this device’s personal data with this backup?')))return;
  CompanionStore.restore(pendingBackup);queueImportTutorial();location.reload();
 },
 'undo-import':()=>{
  const backup=CompanionStore.validateBackup(localStorage.getItem('wwc_before_restore')||'');
  if(!confirm(tr('Revenir aux données précédant le dernier import ?','Restore the data from before the last import?')))return;
  CompanionStore.restore(backup);location.reload();
 }
};
document.addEventListener('click',event=>{
 const button=event.target.closest('[data-action]');if(!button)return;
 const action=companionActions[button.dataset.action];if(!action)return;
 Promise.resolve().then(()=>action(button.dataset.value,button)).catch(error=>{console.error(error);companionMessage(tr('Action non enregistrée. Vérifie les valeurs ou l’espace disponible.','Action was not saved. Check the values or available storage.'),true);});
});
document.querySelector('#view').addEventListener('change',async event=>{
 if(event.target.id!=='backupFile')return;
 pendingBackup=null;const read=++backupRead;
 const preview=document.querySelector('#backupPreview');preview.replaceChildren();
 try{
  const file=event.target.files[0];if(!file)return;if(file.size>8*1024*1024)throw Error('File too large');
  const backup=CompanionStore.validateBackup(await file.text());
  if(read!==backupRead||!preview.isConnected)return;pendingBackup=backup;
  const canonical=JSON.parse(pendingBackup.records.wwc_companion_v1||'null');
  const roster=canonical?.roster??JSON.parse(pendingBackup.records.wwc_owned_ids||'[]');
  preview.innerHTML=`<p>${tr('Sauvegarde valide','Valid backup')} · ${roster.length} ${tr('Résonateurs enregistrés','saved Resonators')}</p>${companionButton('restore-backup',tr('Restaurer cette sauvegarde','Restore this backup'))}`;
 }catch(error){if(read===backupRead&&preview.isConnected)preview.textContent=tr('Fichier incompatible ou invalide. Aucune donnée n’a été modifiée.','Incompatible or invalid file. No data was changed.');}
});
document.querySelector('#view').addEventListener('submit',event=>{
 if(event.target.id!=='preferencesForm')return;event.preventDefault();
 try{const startView=new FormData(event.target).get('startView');CompanionStore.update(s=>{s.settings.startView=startView;});companionMessage(tr('Préférences enregistrées.','Preferences saved.'));}
 catch{companionMessage(tr('Préférences non enregistrées. Vérifie le stockage disponible.','Preferences not saved. Check available storage.'),true);}
});
function pwaStatusHTML(){return `<p>${pwaState.waiting?tr('Mise à jour prête. Enregistre tes modifications puis ferme toutes les fenêtres de Companion pour l’activer à la prochaine ouverture.','Update ready. Save your changes, then close every Companion window to activate it next time.'):pwaState.error?tr('Vérification indisponible. La version déjà installée reste utilisable.','Update check unavailable. The installed version remains usable.'):pwaState.registration?.active?tr('Application installée pour le hors ligne.','Application installed for offline use.'):tr('Installation du mode hors ligne en attente ou indisponible dans ce navigateur.','Offline installation is pending or unavailable in this browser.')}</p>`;}
companionActions['check-update']=async()=>{await checkPwaUpdate();const box=document.getElementById('pwaStatus');if(box)box.innerHTML=pwaStatusHTML();};
document.addEventListener('pwa-state',()=>{const box=document.getElementById('pwaStatus');if(box)box.innerHTML=pwaStatusHTML();});
