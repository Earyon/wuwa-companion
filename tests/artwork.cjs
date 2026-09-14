// Real production service worker and browser cache; only synthetic test images.
const {chromium}=require('playwright'),assert=require('node:assert/strict');
const {startServer}=require('./support.cjs');
(async()=>{
 let bytes=0,requests=0;
 const {server,base}=await startServer({handle(req,res){if(!req.url.startsWith('/assets/game/ffffffffffff'))return false;requests++;res.setHeader('Content-Type','image/svg+xml');res.setHeader('Cache-Control','no-store');res.end('<svg xmlns="http://www.w3.org/2000/svg" width="1" height="1"><rect width="1" height="1"/></svg>'+' '.repeat(bytes));return true;}});
 const browser=await chromium.launch({headless:true,channel:'msedge'}),context=await browser.newContext(),page=await context.newPage();
 const cache='wuwa-companion-images-v2',url=id=>base+'/assets/game/ffffffffffff'+id.toString(16).padStart(8,'0')+'.webp';
 try{
  await context.addInitScript(()=>localStorage.setItem('wwc_tutorial_v1','seen'));await context.route('https://**/*',r=>r.abort());await page.goto(base);await page.evaluate(()=>navigator.serviceWorker.ready);await page.reload();await page.waitForFunction(()=>!!navigator.serviceWorker.controller);
  await page.evaluate(()=>{localStorage.setItem('artwork-test-sentinel','preserved');});
  const load=async ids=>page.evaluate(urls=>Promise.all(urls.map(src=>new Promise((resolve,reject)=>{const image=new Image();image.onload=()=>resolve(image.naturalWidth);image.onerror=()=>reject(Error('Image failed'));image.src=src;}))),ids.map(url));
  const settled=async(id,count)=>{for(let attempt=0;attempt<300;attempt++){if(await page.evaluate(async({cache,url,count})=>{const c=await caches.open(cache),response=await c.match('/__artwork_index'),rows=response?await response.json():[];return !!(await c.match(url))&&rows.length===count&&rows.some(r=>r[0]===url);},{cache,url:url(id),count}))return;await new Promise(r=>setTimeout(r,25));}assert.fail('Artwork writes did not settle');};
  await load([1,1,1]);await settled(1,1);assert.equal(requests,1,'Concurrent requests share an image response');
  for(let start=2;start<=170;start+=20)await load(Array.from({length:Math.min(20,171-start)},(_,i)=>start+i));
  await load([171]);await settled(171,160);assert.equal(await page.evaluate(async({cache,url})=>!!(await(await caches.open(cache)).match(url)),{cache,url:url(1)}),false,'Old entries are evicted');
  await page.evaluate(cache=>caches.delete(cache),cache);bytes=900*1024;
  for(let start=200;start<230;start+=5)await load(Array.from({length:5},(_,i)=>start+i));await load([230]);await settled(230,27);
  const total=await page.evaluate(async cache=>{const c=await caches.open(cache);return (await(await c.match('/__artwork_index')).json()).reduce((sum,r)=>sum+r[1].size,0);},cache);assert.ok(total<=24*1024*1024);
  bytes=1100*1024;await load([300]);bytes=0;await load([301]);await settled(301,28);assert.equal(await page.evaluate(async({cache,url})=>!!(await(await caches.open(cache)).match(url)),{cache,url:url(300)}),false,'Oversized responses stay outside the cache');
  // Expired artwork remains usable offline, without a reset of personal data.
  await page.evaluate(async({cache,url})=>{const c=await caches.open(cache),rows=await(await c.match('/__artwork_index')).json();rows.find(r=>r[0]===url)[1].at=0;await c.put('/__artwork_index',new Response(JSON.stringify(rows)));},{cache,url:url(301)});
  const cdp=await context.newCDPSession(page);await cdp.send('Network.clearBrowserCache');await context.setOffline(true);assert.deepEqual(await load([301]),[1]);assert.equal(await page.evaluate(()=>localStorage.getItem('artwork-test-sentinel')),'preserved');
  console.log('PASS: production artwork cache, duplicate requests, 160-image and 24-MiB bounds, >1-MiB exclusion, offline stale fallback and personal storage preserved.');
 }finally{await browser.close();server.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
