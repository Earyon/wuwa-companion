// Verifies an actual update from the last published shell with two open tabs.
const {chromium}=require('playwright');
const fs=require('node:fs'),path=require('node:path'),http=require('node:http');
const {execFileSync}=require('node:child_process');
const assert=require('node:assert/strict');
const root=path.resolve(__dirname,'..');
const previous='9d62571';
let latest=false;
const oldFiles=Object.fromEntries(['index.html','styles.css','layout.css','pwa.js','sw.js'].map(f=>[f,execFileSync('git',['show',`${previous}:${f}`],{cwd:root})]));
const server=http.createServer((req,res)=>{
 let file=new URL(req.url,'http://localhost').pathname.slice(1)||'index.html';
 if(file==='blank'){res.setHeader('Content-Type','text/html');res.end('<title>Test origin</title>');return;}
 const target=path.resolve(root,file);if(!target.startsWith(root+path.sep)){res.writeHead(403).end();return;}
 const data=!latest&&oldFiles[file]?oldFiles[file]:fs.existsSync(target)?fs.readFileSync(target):null;
 if(!data){res.writeHead(404).end();return;}
 res.setHeader('Cache-Control','no-store');
 res.setHeader('Content-Type',file.endsWith('.js')?'application/javascript':file.endsWith('.css')?'text/css':file.endsWith('.html')?'text/html':file.endsWith('.webmanifest')?'application/manifest+json':'image/png');res.end(data);
});
(async()=>{
 await new Promise(r=>server.listen(0,'127.0.0.1',r));const base=`http://127.0.0.1:${server.address().port}`;
 const browser=await chromium.launch({headless:true,channel:process.env.BROWSER_CHANNEL||'msedge'});
 try{
  const context=await browser.newContext();
  await context.route('https://**/*',r=>r.abort());
  const p=await context.newPage();await p.goto(base);
  await p.evaluate(()=>navigator.serviceWorker.ready);await p.reload();
  assert.ok(await p.evaluate(()=>!!navigator.serviceWorker.controller));
  await p.evaluate(()=>{localStorage.setItem('wwc_account_data','{"Qingxiao":{"level":90}}');return caches.open('unrelated-cache').then(c=>c.put('/keep',new Response('keep')))});
  const second=await context.newPage();await second.goto(base);
  latest=true;
  await p.evaluate(async()=>{const r=await navigator.serviceWorker.getRegistration();await r.update();});
  await p.waitForFunction(async()=>!!(await navigator.serviceWorker.getRegistration()).waiting);
  assert.equal(await p.locator('script[src="./forte.js"]').count(),0,'Old open tab must remain on old shell');
  await p.close();await second.close();
  const probe=await context.newPage();await probe.goto(base+'/blank');
  await probe.waitForFunction(async()=>!(await navigator.serviceWorker.getRegistration()).waiting);
  await probe.goto(base);await probe.locator('script[src="./forte.js"]').waitFor({state:'attached'});
  assert.equal(await probe.evaluate(()=>localStorage.getItem('wwc_account_data')),'{"Qingxiao":{"level":90}}');
  assert.ok(await probe.evaluate(()=>caches.has('unrelated-cache')));
  const keys=await probe.evaluate(()=>caches.keys());
  assert.deepEqual(keys.filter(k=>k.startsWith('wuwa-companion-shell-')),['wuwa-companion-shell-057-pwa-8']);
  await context.setOffline(true);await probe.reload();
  assert.equal(await probe.evaluate(()=>document.styleSheets.length),2);
  assert.equal(await probe.evaluate(()=>typeof normalizeForteDefs),'function','New feature script works offline');
  assert.equal(await probe.evaluate(()=>getComputedStyle(document.querySelector('.main')).paddingTop),'30px');
  assert.equal(await probe.evaluate(()=>localStorage.getItem('wwc_account_data')),'{"Qingxiao":{"level":90}}');
  console.log('PASS: old shell → waiting with two tabs → activate after close → new HTML and CSS offline; account storage and unrelated cache preserved.');
 }finally{await browser.close();server.close()}
})().catch(e=>{console.error(e);server.close();process.exitCode=1});
