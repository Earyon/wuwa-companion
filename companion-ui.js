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
let pendingBackup=null;
function companionMore(){
 const state=CompanionStore.get();
 return companionPanel(tr('Paramètres','Settings'),`<div class="companion-actions">${companionButton('language','Français','fr')}${companionButton('language','English','en')}</div>`)+
 companionPanel(tr('Import & sauvegarde','Import & backup'),`
 <p>${tr('Sauvegarde personnelle au format JSON, pour restaurer ou transférer ton compte. Les catalogues du jeu ne sont pas inclus.','Personal JSON backup to restore or transfer your account. Game catalogues are not included.')}</p>
 ${CompanionStore.error()||personalReadErrors.length?`<p class="companion-error">${tr('Certaines données locales sont illisibles. Exporte-les avant toute restauration.','Some local records cannot be read. Export them before restoring.')}</p>`:''}
 <div class="companion-actions">${companionButton('export',tr('Exporter ma sauvegarde','Export my backup'))}<label class="companion-button companion-file">${tr('Choisir une sauvegarde','Choose a backup')}<input type="file" id="backupFile" accept="application/json,.json"></label>${localStorage.getItem('wwc_before_restore')?companionButton('undo-import',tr('Restaurer avant le dernier import','Restore before last import')):''}</div>
 <div id="backupPreview" aria-live="polite"></div>
 <p class="companion-note">${tr('La restauration remplace les données personnelles sur cet appareil après confirmation. Une copie de l’état précédent reste disponible. Aucun envoi vers un serveur.','Restoring replaces personal data on this device after confirmation. A copy of the previous state remains available. Nothing is sent to a server.')}</p>`)+
 companionPanel(tr('Historique','History'),state.journal.length?`<ol class="companion-history">${state.journal.slice(0,60).map(entry=>`<li><time>${esc(new Date(entry.at).toLocaleString(lang))}</time><span>${esc(entry.label)}</span></li>`).join('')}</ol>`:`<p>${tr('Les prochaines modifications importantes apparaîtront ici.','Future significant changes will appear here.')}</p>`)+
 companionPanel(tr('Sources & mises à jour','Sources & updates'),`<p>${esc(catalogState.source||'Encore')} · ${esc(catalogState.gameVersion||'?')}<br>${DATA.length} ${tr('Résonateurs','Resonators')} · ${WEAPONS.length} ${tr('armes','weapons')}</p><p><a href="https://www.encore.moe/about" target="_blank" rel="noopener">Encore / WW_Data</a> · <a href="https://www.prydwen.gg/wuthering-waves/" target="_blank" rel="noopener">Prydwen</a> · <a href="https://game8.co/games/Wuthering-Waves" target="_blank" rel="noopener">Game8</a></p><p class="companion-note">${tr('Outil communautaire non officiel. Les noms et visuels du jeu appartiennent à leurs détenteurs. Les recommandations ne sont pas encore intégrées.','Unofficial community tool. Game names and artwork belong to their owners. Recommendations are not yet integrated.')}</p>`);
}
const companionActions={
 language:value=>setLang(value),
 export:()=>companionDownload(CompanionStore.exportData(),`wuwa-companion-${new Date().toISOString().slice(0,10)}.json`),
 'restore-backup':()=>{
  if(!pendingBackup)return;
  if(!confirm(tr('Remplacer les données personnelles de cet appareil par cette sauvegarde ?','Replace this device’s personal data with this backup?')))return;
  CompanionStore.restore(pendingBackup);location.reload();
 },
 'undo-import':()=>{
  const backup=CompanionStore.validateBackup(localStorage.getItem('wwc_before_restore')||'');
  if(!confirm(tr('Revenir aux données précédant le dernier import ?','Restore the data from before the last import?')))return;
  CompanionStore.restore(backup);location.reload();
 }
};
document.querySelector('#view').addEventListener('click',event=>{
 const button=event.target.closest('[data-action]');if(!button)return;
 const action=companionActions[button.dataset.action];if(!action)return;
 Promise.resolve().then(()=>action(button.dataset.value,button)).catch(error=>{console.error(error);companionMessage(tr('Action non enregistrée. Vérifie les valeurs ou l’espace disponible.','Action was not saved. Check the values or available storage.'),true);});
});
document.querySelector('#view').addEventListener('change',async event=>{
 if(event.target.id!=='backupFile')return;
 pendingBackup=null;
 const preview=document.querySelector('#backupPreview');preview.replaceChildren();
 try{
  const file=event.target.files[0];if(!file)return;if(file.size>8*1024*1024)throw Error('File too large');
  pendingBackup=CompanionStore.validateBackup(await file.text());
  const canonical=JSON.parse(pendingBackup.records.wwc_companion_v1||'null');
  const roster=canonical?.roster??JSON.parse(pendingBackup.records.wwc_owned_ids||'[]');
  preview.innerHTML=`<p>${tr('Sauvegarde valide','Valid backup')} · ${roster.length} ${tr('Résonateurs enregistrés','saved Resonators')}</p>${companionButton('restore-backup',tr('Restaurer cette sauvegarde','Restore this backup'))}`;
 }catch(error){preview.textContent=tr('Fichier incompatible ou invalide. Aucune donnée n’a été modifiée.','Incompatible or invalid file. No data was changed.');}
});
