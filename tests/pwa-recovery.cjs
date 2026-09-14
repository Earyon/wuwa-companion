// Real workers and published baseline, isolated profiles. Never clears user storage.
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),{execFileSync}=require('node:child_process');
const {chromium}=require('playwright'),{startServer,root}=require('./support.cjs');
const read=file=>execFileSync('git',['show',`79b8c78:${file}`],{cwd:root,maxBuffer:8*1024*1024});
const oldWorker=read('sw.js'),shell=vm.runInNewContext(oldWorker.toString().match(/const SHELL=(\[[^;]+\]);/)[1]);
const oldFiles=Object.fromEntries([...new Set(['sw.js',...shell.filter(p=>p!=='./').map(p=>p.replace(/^\.\//,''))])].map(p=>[p,read(p)]));
(async()=>{
 let latest=false,future=false,fail=false;
 const {server,base}=await startServer({handle(req,res){const file=new URL(req.url,'http://local').pathname.slice(1)||'index.html';
  if(file==='sw.js'&&fail){res.writeHead(503).end();return true;}
  const data=!latest&&oldFiles[file]?oldFiles[file]:file==='sw.js'&&future?fs.readFileSync(path.join(root,'sw.js'),'utf8').replace(/057-pwa-\d+/, '057-pwa-next-test'):null;
  if(data){res.setHeader('Cache-Control','no-store');res.setHeader('Content-Type',file.endsWith('.js')?'application/javascript':file.endsWith('.css')?'text/css':file.endsWith('.json')?'application/json':'text/html');res.end(data);return true;}
 }}),browser=await chromium.launch({headless:true,channel:'msedge'});
 try{
  const context=await browser.newContext(),page=await context.newPage();await context.route('https://**/*',r=>r.abort());
  await context.addInitScript(()=>localStorage.setItem('wwc_tutorial_v1','seen'));
  await page.goto(base);await page.evaluate(()=>navigator.serviceWorker.ready);await page.reload();await page.waitForFunction(()=>!!navigator.serviceWorker.controller);
  await page.evaluate(async()=>{localStorage.setItem('UPDATE_TEST','KEEP');await(await caches.open('unrelated-cache')).put('/keep',new Response('keep'));});
  const second=await context.newPage();await second.goto(base);await second.locator('#ownedSearch').fill('UNSAVED SEARCH');
  latest=true;const helper=await context.newPage();await helper.goto(base+'/mise-a-jour.html');await helper.locator('#status[data-state="blocked"]').waitFor();
  await page.reload();assert.equal(await page.evaluate(()=>fetch('./pwa.js').then(r=>r.text())),oldFiles['pwa.js'].toString());assert.equal(await second.locator('#ownedSearch').inputValue(),'UNSAVED SEARCH');
  assert.equal(await page.evaluate(async()=>{const r=await navigator.serviceWorker.getRegistration(),c=new MessageChannel();return new Promise(resolve=>{c.port1.onmessage=e=>{c.port1.close();resolve(e.data.status);};r.waiting.postMessage({type:'COMPANION_APPLY_UPDATE'},[c.port2]);});}),'refused','Ordinary application pages cannot trigger replacement');
  await page.close();await helper.locator('#retry').click();await helper.locator('#status[data-state="blocked"]').waitFor();
  await helper.screenshot({path:path.join(root,'test-results/update-blocked.png')});
  await second.close();await helper.locator('#retry').click();await helper.waitForURL(base+'/');await helper.waitForFunction(()=>!!pwaState.registration?.active);
  assert.equal(await helper.evaluate(()=>fetch('./pwa.js').then(r=>r.text())),fs.readFileSync(path.join(root,'pwa.js'),'utf8'));
  assert.equal(await helper.evaluate(()=>localStorage.getItem('UPDATE_TEST')),'KEEP');assert.ok(await helper.evaluate(()=>caches.has('unrelated-cache')));
  assert.equal(await helper.locator('#pwaNotice').isVisible(),false);
  // Future notification is visible in the app, localized, and does not navigate it.
  future=true;await helper.evaluate(()=>checkPwaUpdate());await helper.locator('#pwaNotice').waitFor();
  for(const lang of ['fr','en']){await helper.evaluate(l=>setLang(l),lang);await helper.waitForFunction(l=>document.querySelector('#pwaNotice a').textContent===(l==='fr'?'Mettre à jour':'Update the app'),lang);
   for(const width of [320,720,1152]){await helper.setViewportSize({width,height:700});assert.ok(await helper.locator('#pwaNotice').evaluate(e=>e.scrollWidth<=e.clientWidth+1));assert.ok(await helper.locator('#pwaNotice a').evaluate(e=>e.getBoundingClientRect().height>=44));}
  }
  await helper.screenshot({path:path.join(root,'test-results/update-notice.png')});
  await helper.evaluate(()=>localStorage.setItem('wwc_lang','en'));
  // A failed check cannot activate an already-waiting worker or delete data.
  fail=true;const errorPage=await context.newPage();await errorPage.goto(base+'/mise-a-jour.html');await errorPage.locator('#status[data-state="error"]').waitFor();assert.equal(await errorPage.locator('html').getAttribute('lang'),'en');assert.equal(await errorPage.evaluate(()=>localStorage.getItem('UPDATE_TEST')),'KEEP');await errorPage.close();
  await context.setOffline(true);const offline=await context.newPage();await offline.goto(base+'/mise-a-jour.html');await offline.locator('#status[data-state="error"]').waitFor();assert.equal(await offline.evaluate(()=>localStorage.getItem('UPDATE_TEST')),'KEEP');await context.close();
  fail=false;future=false;
  const fresh=await browser.newContext(),start=await fresh.newPage();await fresh.route('https://**/*',r=>r.abort());await start.goto(base+'/mise-a-jour.html');await start.waitForURL(base+'/');await start.waitForFunction(()=>!!navigator.serviceWorker.controller);await fresh.close();
  console.log('PASS: old reload reproduced; recovery blocks other tabs and unauthorized messages, preserves data, activates safely, works on first install; FR/EN notice, narrow screens, failed network and offline recovery.');
 }finally{await browser.close();server.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
