'use strict';
let sonataData=null,sonataPending=null,sonataError=false;
async function loadSonatas(){
 if(sonataData||sonataPending)return sonataPending;
 sonataPending=(async()=>{try{const data=await fetchJSON('./data/sonatas.json');if(data.schema!==1||!Array.isArray(data.sets))throw Error('Invalid Sonata data');sonataData=data;sonataError=false;}catch{sonataError=true;}finally{sonataPending=null;if(document.getElementById('detail').open&&profileTab==='overview')renderProfileSection();}})();return sonataPending;
}
function sonataReferencesHTML(ids){
 if(!sonataData&&!sonataError)queueMicrotask(loadSonatas);
 const version=String(catalogState.gameVersion||'').split('.').slice(0,2).join('.');
 const rows=sonataData&&(version==='test'||version===sonataData.gameVersion.split('.').slice(0,2).join('.'))?sonataData.sets.filter(s=>ids.includes(s.id)):[];
 return `<h3>${tr('Effets de Sonate','Sonata effects')}</h3>${rows.map(s=>`<details class="kit-skill"><summary><b>${esc(localText(s.name))}</b></summary>${s.effects.map(e=>`<h4>${e.pieces} ${tr('pièces','pieces')}</h4><p class="source-description">${esc(localText(e.description))}</p>`).join('')}</details>`).join('')||`<p>${tr('Effets indisponibles pour les identifiants ou la version actuelle.','Effects unavailable for the current IDs or version.')}</p>`}<p class="companion-note">${tr('Références conditionnelles, pas des bonus automatiquement appliqués à ton compte. Données WW_Data 3.6 vérifiées le 13/09/2026.','Conditional references, not bonuses automatically applied to your account. WW_Data 3.6 checked on 2026-09-13.')}</p>${sonataError?companionButton('sonata-retry',tr('Réessayer','Retry')):''}`;
}
companionActions['sonata-retry']=()=>{sonataError=false;return loadSonatas();};
