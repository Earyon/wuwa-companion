'use strict';
const pwaState={registration:null,waiting:false,error:false};
function reportPwaState(){pwaState.waiting=!!pwaState.registration?.waiting;document.dispatchEvent(new Event('pwa-state'));}
async function checkPwaUpdate(){try{if(!pwaState.registration)throw Error('Unavailable');await pwaState.registration.update();pwaState.error=false;}catch{pwaState.error=true;}reportPwaState();}
if ('serviceWorker' in navigator && window.isSecureContext) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./sw.js', {scope:'./', updateViaCache:'none'})
      .then(registration=>{pwaState.registration=registration;reportPwaState();const observe=()=>registration.installing?.addEventListener('statechange',reportPwaState);registration.addEventListener('updatefound',observe);observe();})
      .catch(()=>{pwaState.error=true;reportPwaState();});
  });
}
