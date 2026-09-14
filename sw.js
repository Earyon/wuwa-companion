'use strict';
const CACHE_PREFIX='wuwa-companion-shell-';
const CACHE_NAME=CACHE_PREFIX+'057-pwa-22';
const IMAGE_CACHE='wuwa-companion-images-v2',IMAGE_LIMIT=160,IMAGE_AGE=7*24*60*60*1000,IMAGE_BYTES=24*1024*1024;
let imageWrites=Promise.resolve();
const imageRequests=new Map();
const IMAGE_INDEX=new URL('./__artwork_index',self.registration.scope).href;
async function imageIndex(cache){
 const response=await cache.match(IMAGE_INDEX),rows=response?await response.json().catch(()=>null):null;
 return Array.isArray(rows)&&rows.every(r=>Array.isArray(r)&&typeof r[0]==='string'&&Number.isFinite(r[1]?.at)&&Number.isFinite(r[1]?.size)&&r[1].size>=0)?rows:null;
}
async function storedImage(request){
 const cache=await caches.open(IMAGE_CACHE),rows=await imageIndex(cache),record=rows?.find(r=>r[0]===request.url)?.[1];
 if(!record||Date.now()-record.at>IMAGE_AGE)return null;
 return cache.match(request);
}
function saveImage(request,response){
 // One small metadata index per write, instead of rereading every cached image.
 // Serialization prevents concurrent downloads from exceeding either bound.
 imageWrites=imageWrites.catch(()=>{}).then(async()=>{
  if(!response.ok||!response.headers.get('Content-Type')?.startsWith('image/'))return;
  const size=(await response.clone().blob()).size;if(size>1024*1024)return;
  const cache=await caches.open(IMAGE_CACHE);let rows=await imageIndex(cache);
  if(!rows){for(const old of await cache.keys())await cache.delete(old);rows=[];}
  rows=rows.filter(r=>r[0]!==request.url);rows.push([request.url,{at:Date.now(),size}]);
  let total=rows.reduce((sum,r)=>sum+r[1].size,0);
  while(rows.length>IMAGE_LIMIT||total>IMAGE_BYTES){const [url,record]=rows.shift();total-=record.size;await cache.delete(url);}
  try{await cache.put(request,response);await cache.put(IMAGE_INDEX,new Response(JSON.stringify(rows)));}
  catch{await cache.delete(request).catch(()=>{});}
 });return imageWrites.catch(()=>{});
}
async function fetchImage(request,event){
 try{const stored=await storedImage(request);if(stored)return stored;}catch{/* Storage failure must not block the image. */}
 if(imageRequests.has(request.url))return (await imageRequests.get(request.url)).clone();
 const work=(async()=>{const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),12000);
  try{let response;try{response=await fetch(request.url,{mode:'cors',credentials:'omit',signal:controller.signal});}catch{response=await fetch(request,{signal:controller.signal});}
   if(response.ok)event.waitUntil(saveImage(request,response.clone()));return response;}
  catch{const cached=await caches.open(IMAGE_CACHE).then(c=>c.match(request)).catch(()=>null);if(cached)return cached;return (await caches.open(CACHE_NAME)).match('./assets/portrait-placeholder.svg');}
  finally{clearTimeout(timer);}
 })();imageRequests.set(request.url,work);
 try{return (await work).clone();}finally{imageRequests.delete(request.url);}
}
const SHELL=['./assets/game-ui/SP_RoleSkillTreeNotActive0.webp','./assets/game-ui/SP_RoleSkillTreeNotActive1.webp','./assets/game-ui/SP_SkillCircleArrow.webp','./assets/game-ui/SP_SkillCircleBHold.webp','./assets/game-ui/SP_SkillCircleBNor.webp','./assets/game-ui/SP_SkillCircleSNor.webp','./assets/game-ui/SP_SkillCircleSSele.webp','./assets/game-ui/SP_SkillFrmArrow.webp','./assets/game-ui/SP_SkillFrmSNor.webp','./assets/game-ui/SP_SkillFrmSSele.webp','./assets/game-ui/SP_SkillNameBg.webp','./assets/game-ui/SP_SkillFrmBActivateNor.webp','./assets/game-ui/SP_SkillFrmSActivateNor.webp','./assets/game-ui/SP_SkillCircleSActivateNor.webp','./assets/game-ui/SP_SkillFrmBActivateSele.webp','./assets/game-ui/SP_SkillFrmSActivateSele.webp','./assets/game-ui/SP_SkillCircleSActivateSele.webp','./assets/game-ui/SP_DeviceItemBg.webp','./assets/game-ui/SP_DeviceItemIconBg.webp','./assets/game-ui/SP_DeviceItemChoose1.webp','./assets/game-ui/SP_DeviceItemActiveDesc1.webp','./catalogue-version.js','./data/game-assets.json','./data/weapons.json','./assets/game-ui/SP_RoleTabiconshuxing.webp','./assets/game-ui/SP_RoleTabiconwuqi.webp','./assets/game-ui/SP_RoleTabiconyiyin.webp','./assets/game-ui/SP_RoleTabiconzhanji.webp','./assets/game-ui/SP_RoleTabicongongminglian.webp','./localization.js','./resonator-data.js','./resonator-tree.js','./features.js','./tutorial.js','./data/catalogue.json','./data/localization-fr.json','./data/echo-catalogue.json','./data/item-catalogue.json','./','./index.html','./styles.css','./layout.css','./companion.css','./catalog.js','./dialogs.js','./editor-view.js','./app.js','./skills.js','./account-editor.js','./bootstrap.js','./echo-rules.js', './echoes.js','./menu-stats.js','./resonator-menu.js','./data/menu-rules.json', './account-store.js','./companion-ui.js','./inventory.js','./planning.js','./cost-engine.js','./progression-data.js','./resources.js','./data/progression.json','./activity-rules.js','./activities.js','./data/achievements.json','./data/events.json','./teams.js','./profiles.js','./sonatas.js','./data/sonatas.json','./recommendations.js','./data/recommendations.json','./convene-rules.js','./tracker-import.js','./pull-store.js','./convenes.js','./wishlist.js','./optimization.js','./forte.js','./manifest.webmanifest','./pwa.js','./assets/portrait-placeholder.svg','./assets/icon-192.png','./assets/icon-512.png'];
const shellURLs=new Set(SHELL.map(p=>new URL(p,self.registration.scope).href));
const artworkPath=new URL('./assets/game/',self.registration.scope).pathname;
const referencePath=new URL('./data/resonators/',self.registration.scope).pathname;
self.addEventListener('install',event=>{
  event.waitUntil(caches.open(CACHE_NAME).then(cache=>cache.addAll(SHELL)));
  // Waiting worker activates after all old app windows close: no interrupted edits.
});
self.addEventListener('activate',event=>{
  event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(key=>key.startsWith(CACHE_PREFIX)&&key!==CACHE_NAME||key==='wuwa-companion-images-v1').map(key=>caches.delete(key)))).then(()=>self.clients.claim()));
});
self.addEventListener('fetch',event=>{
  const request=event.request;
  if(request.method!=='GET')return;
  const url=new URL(request.url);
  if(url.origin===self.location.origin&&url.pathname.startsWith(referencePath)&&/^\d+\.json$/.test(url.pathname.slice(referencePath.length))&&!url.search){
   event.respondWith(caches.open(CACHE_NAME).then(async cache=>{
    const stored=await cache.match(request);if(stored)return stored;
    const response=await fetch(request);if(response.ok){const data=await response.clone().json();if(data.schema===1&&String(data.Id)+'.json'===url.pathname.slice(referencePath.length))event.waitUntil(cache.put(request,response.clone()).catch(()=>{}));}return response;
   }));return;
  }
  if(request.destination==='image'&&(url.origin===self.location.origin&&url.pathname.startsWith(artworkPath)&&/\/[a-f0-9]{20}\.webp$/.test(url.pathname)||url.protocol==='https:'&&url.hostname==='api.encore.moe'&&url.pathname.startsWith('/resource/')&&/\.(webp|png)$/i.test(url.pathname))){event.respondWith(fetchImage(request,event));return;}
  if(!shellURLs.has(request.url))return;
  event.respondWith(caches.open(CACHE_NAME).then(async cache=>{
    const cached=await cache.match(request);
    return cached||fetch(request);
  }));
  // Personal data and remote JSON are never stored in the artwork cache.
});
