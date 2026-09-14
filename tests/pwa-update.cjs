// Verifies an actual update from the last published shell with two open tabs.
const {chromium}=require('playwright');
const fs=require('node:fs'),path=require('node:path'),http=require('node:http');
const {execFileSync}=require('node:child_process');
const assert=require('node:assert/strict');
const root=path.resolve(__dirname,'..');
const previous='12beb21';
let latest=false;
const readPrevious=file=>execFileSync('git',['show',`${previous}:${file}`],{cwd:root,maxBuffer:8*1024*1024});
const oldWorker=readPrevious('sw.js');
const oldShell=require('node:vm').runInNewContext(oldWorker.toString().match(/const SHELL=(\[[^;]+\]);/)[1]);
const oldFiles=Object.fromEntries([...new Set(['sw.js',...oldShell.filter(f=>f!=='./').map(f=>f.replace(/^\.\//,''))])].map(f=>[f,readPrevious(f)]));
const server=http.createServer((req,res)=>{
 let file=new URL(req.url,'http://localhost').pathname.slice(1)||'index.html';
 if(file==='blank'){res.setHeader('Content-Type','text/html');res.end('<title>Test origin</title>');return;}
 const target=path.resolve(root,file);if(!target.startsWith(root+path.sep)){res.writeHead(403).end();return;}
 const data=!latest&&oldFiles[file]?oldFiles[file]:fs.existsSync(target)?fs.readFileSync(target):null;
 if(!data){res.writeHead(404).end();return;}
 res.setHeader('Cache-Control','no-store');
 res.setHeader('Content-Type',({'.js':'application/javascript','.css':'text/css','.html':'text/html','.json':'application/json','.webmanifest':'application/manifest+json','.svg':'image/svg+xml','.webp':'image/webp','.png':'image/png'})[path.extname(file)]||'application/octet-stream');res.end(data);
});
(async()=>{
 await new Promise(r=>server.listen(0,'127.0.0.1',r));const base=`http://127.0.0.1:${server.address().port}`;
 const browser=await chromium.launch({headless:true,channel:process.env.BROWSER_CHANNEL||'msedge'});
 try{
  const context=await browser.newContext();await context.addInitScript(()=>localStorage.setItem('wwc_tutorial_v1','seen'));
  await context.route('https://**/*',r=>r.abort());
  const p=await context.newPage();await p.goto(base);
  await p.evaluate(()=>navigator.serviceWorker.ready);await p.reload();
  assert.ok(await p.evaluate(()=>!!navigator.serviceWorker.controller));
  await p.evaluate(()=>{localStorage.setItem('wwc_account_data','{"Qingxiao":{"level":90}}');return caches.open('unrelated-cache').then(c=>c.put('/keep',new Response('keep')))});
  await p.evaluate(()=>CompanionStore.update(s=>{s.echoes=[{id:'migration-echo',catalogId:'6000039',name:'Test Echo',owner:'resonator:1',slot:1,level:10,cost:null,quality:null,setId:null,main:null,secondary:null,substats:[],legacyStats:{mainStat:'ATK',mainValue:'12%',substats:['Old text']}}];}));
  const second=await context.newPage();await second.goto(base);
  latest=true;
  await p.evaluate(async()=>{const r=await navigator.serviceWorker.getRegistration();await r.update();});
  await p.waitForFunction(()=>pwaState.waiting);
  await p.reload();
  assert.equal(await p.evaluate(()=>fetch('./pwa.js').then(r=>r.text())),oldFiles['pwa.js'].toString(),'An ordinary reload still uses the old shell while another tab is open');
  const workers=context.serviceWorkers();
  let replacement;
  for(const worker of workers)if(await worker.evaluate(()=>CACHE_NAME).catch(()=>null)==='wuwa-companion-shell-057-pwa-24')replacement=worker;
  assert.ok(replacement,'Replacement worker available');
  await p.waitForFunction(()=>pwaState.waiting);
  await p.close();await second.close();
  // Observe from the worker: opening a scoped probe too early keeps the old
  // worker alive. Explicitly await the async result outside page polling.
  let activated=false;
  for(let attempt=0;attempt<100&&!activated;attempt++){
   activated=await replacement.evaluate(async()=>{
    const keys=(await caches.keys()).filter(k=>k.startsWith('wuwa-companion-shell-'));
    return !self.registration.waiting&&self.registration.active?.state==='activated'&&keys.length===1&&keys[0]==='wuwa-companion-shell-057-pwa-24';
   });
   if(!activated)await new Promise(r=>setTimeout(r,100));
  }
  assert.ok(activated,'Replacement activated after all old clients closed');
  const probe=await context.newPage();await probe.goto(base);
  await probe.waitForFunction(()=>pwaState.registration?.active);
  assert.match(await probe.evaluate(()=>pwaStatusHTML()),/installée|installed/);
  assert.equal(await probe.evaluate(()=>localStorage.getItem('wwc_account_data')),'{"Qingxiao":{"level":90}}');
  assert.ok(await probe.evaluate(()=>caches.has('unrelated-cache')));
  assert.equal(await probe.evaluate(()=>CompanionStore.get().echoes[0].legacyStats.substats[0]),'Old text','Old Echo entries survive shell migration');
  const keys=await probe.evaluate(()=>caches.keys());
  assert.deepEqual(keys.filter(k=>k.startsWith('wuwa-companion-shell-')),['wuwa-companion-shell-057-pwa-24']);
  await probe.evaluate(()=>loadResonatorReference('1108'));
  await context.setOffline(true);await probe.reload();
  await probe.waitForFunction(()=>DATA.length>0);
  assert.equal(await probe.evaluate(async()=>!!(await loadResonatorReference('1108'))),true,'Viewed character reference works offline');
  assert.equal(await probe.evaluate(()=>typeof showTutorial),'function');
  assert.equal(await probe.evaluate(()=>guidesVisible),false);
  assert.equal(await probe.evaluate(async()=>{await loadExtended('echo');return extendedCatalog.echo.length;}),311);
  assert.equal(await probe.evaluate(()=>document.styleSheets.length),3);
  assert.equal(await probe.evaluate(()=>typeof normalizeForteDefs),'function','New feature script works offline');
  assert.equal(await probe.evaluate(()=>typeof openDialog),'function','Native dialogs work offline');
  assert.equal(await probe.evaluate(()=>typeof echoInventory),'function','Echo inventory cached');
  assert.equal(await probe.evaluate(()=>typeof EchoRules.validate),'function','Echo rules cached');
  assert.equal(await probe.evaluate(()=>typeof personalInventory),'function','Inventory script cached');
  assert.equal(await probe.evaluate(()=>typeof CostEngine.calculate),'function','Cost calculation cached');
  assert.equal(await probe.evaluate(()=>typeof resourcesInventory),'function','Resource inventory cached');
  assert.equal(await probe.evaluate(()=>typeof ActivityRules.cycle),'function');
  assert.equal(await probe.evaluate(()=>typeof TrackerImport.parse),'function');
  assert.equal(await probe.evaluate(()=>typeof optimizationPage),'function');
  assert.equal(await probe.evaluate(async()=>{const r=await fetch('./data/sonatas.json');return (await r.json()).sets.length;}),34);
  assert.equal(await probe.evaluate(async()=>{await PullStore.merge([{owner:'OFFLINE TEST',rows:[]}]);return (await PullStore.all()).length;}),1);
  assert.equal(await probe.evaluate(()=>typeof teamsPage),'function');
  assert.equal(await probe.evaluate(()=>typeof openProfile),'function');
  assert.equal(await probe.evaluate(async()=>{const r=await fetch('./data/achievements.json');return (await r.json()).achievements.length;}),1207);
  assert.equal(await probe.evaluate(()=>typeof personalPlanner),'function','Planner script cached');
  assert.equal(await probe.evaluate(()=>getComputedStyle(document.querySelector('.main')).paddingTop),'30px');
  assert.equal(await probe.evaluate(()=>localStorage.getItem('wwc_account_data')),'{"Qingxiao":{"level":90}}');
  console.log('PASS: old shell → waiting with two tabs → activate after close → new HTML and CSS offline; account storage and unrelated cache preserved.');
 }finally{await browser.close();server.close()}
})().catch(e=>{console.error(e);server.close();process.exitCode=1});
