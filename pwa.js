'use strict';
const pwaState={registration:null,waiting:false,error:false,checkedAt:0};
function drawPwaNotice(){
 const notice=document.getElementById('pwaNotice');if(!notice)return;
 notice.hidden=!pwaState.waiting;
 const english=document.documentElement.lang==='en';
 notice.querySelector('span').textContent=english?'A new version is ready. Save your changes before installing it.':'Une nouvelle version est prête. Enregistre tes modifications avant de l’installer.';
 notice.querySelector('a').textContent=english?'Update the app':'Mettre à jour';
}
function reportPwaState(){pwaState.waiting=!!pwaState.registration?.waiting;drawPwaNotice();document.dispatchEvent(new Event('pwa-state'));}
async function checkPwaUpdate(){pwaState.checkedAt=Date.now();try{if(!pwaState.registration)throw Error('Unavailable');await pwaState.registration.update();pwaState.error=false;}catch{pwaState.error=true;}reportPwaState();}
new MutationObserver(drawPwaNotice).observe(document.documentElement,{attributes:true,attributeFilter:['lang']});
if ('serviceWorker' in navigator && window.isSecureContext) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./sw.js', {scope:'./', updateViaCache:'none'})
      .then(registration=>{pwaState.registration=registration;pwaState.checkedAt=Date.now();reportPwaState();const observe=()=>registration.installing?.addEventListener('statechange',reportPwaState);registration.addEventListener('updatefound',observe);observe();})
      .catch(()=>{pwaState.error=true;reportPwaState();});
  });
  document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='visible'&&pwaState.registration&&Date.now()-pwaState.checkedAt>60000)checkPwaUpdate();});
}
