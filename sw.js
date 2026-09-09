'use strict';
const CACHE_PREFIX='wuwa-companion-shell-';
const CACHE_NAME=CACHE_PREFIX+'057-pwa-6';
const SHELL=['./','./index.html','./manifest.webmanifest','./pwa.js','./assets/icon-192.png','./assets/icon-512.png'];
const shellURLs=new Set(SHELL.map(p=>new URL(p,self.registration.scope).href));
self.addEventListener('install',event=>{
  event.waitUntil(caches.open(CACHE_NAME).then(cache=>cache.addAll(SHELL)));
  // Waiting worker activates after all old app windows close: no interrupted edits.
});
self.addEventListener('activate',event=>{
  event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(key=>key.startsWith(CACHE_PREFIX)&&key!==CACHE_NAME).map(key=>caches.delete(key)))).then(()=>self.clients.claim()));
});
self.addEventListener('fetch',event=>{
  const request=event.request;
  if(request.method!=='GET'||!shellURLs.has(request.url))return;
  event.respondWith(caches.open(CACHE_NAME).then(async cache=>{
    const cached=await cache.match(request);
    return cached||fetch(request);
  }));
  // Remote game data and images remain under the original application's control.
});
