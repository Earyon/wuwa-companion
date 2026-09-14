// Reproducible before/after bench: actual application at 947c7f8 and current code.
// Same real catalogue identities, synthetic account, deterministic 150-ms API/image
// latency. This measures the client, not Internet throughput or a physical tablet.
const {chromium}=require('playwright'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const {execFileSync}=require('node:child_process'),{startServer,root}=require('./support.cjs');
const catalogue=require('../data/catalogue.json'),artwork=require('../data/game-assets.json');
const previous='947c7f8',oldIndex=execFileSync('git',['show',previous+':index.html'],{cwd:root}).toString();
const files=new Set(['index.html',...[...oldIndex.matchAll(/(?:src|href)="\.\/([^"?]+\.(?:js|css))"/g)].map(m=>m[1])]);
const oldFiles=Object.fromEntries([...files].map(f=>[f,execFileSync('git',['show',previous+':'+f],{cwd:root})]));
const version=[{GameVer:'3.6.0',ResVer:'3.6.6',Changelist:'8499915'},{character:[1212,1413]}];
const payloads={character:{roleList:catalogue.characters.map(c=>({Id:Number(c.gameId),Name:c.name,QualityId:c.rarity,WeaponType:{Name:c.weapon},Element:{Name:c.element},RoleHeadIconCircle:c.image}))},weapon:{weapons:catalogue.weapons.map(w=>({Id:Number(w.gameId),Name:w.name,QualityId:w.rarity,WeaponType:{Name:w.type},Icon:w.image}))}};
(async()=>{
 let phase='before';const {server,base}=await startServer({handle(req,res){const file=new URL(req.url,'http://local').pathname.slice(1)||'index.html';if(phase!=='before'||!oldFiles[file])return false;res.setHeader('Content-Type',file.endsWith('.js')?'application/javascript':file.endsWith('.css')?'text/css':'text/html');res.end(oldFiles[file]);return true;}});
 const browser=await chromium.launch({headless:true,channel:'msedge'}),results=[];
 try{for(phase of ['before','after'])for(let trial=0;trial<3;trial++){
  const context=await browser.newContext({viewport:{width:720,height:1122},hasTouch:true,serviceWorkers:'block'}),page=await context.newPage(),errors=[];
  page.on('pageerror',e=>errors.push(e.message));let apiRequests=0,imageRequests=0;
  await page.route('https://**/*',async route=>{
   const url=route.request().url();let body,contentType='application/json';
   if(url.includes('/api/en/')){apiRequests++;const kind=url.split('/').pop();body=Buffer.from(JSON.stringify(kind==='new'?version:payloads[kind]||{}));}
   else if(url.includes('/resource/')){imageRequests++;const key='Game/'+url.split('/Game/')[1]?.replace(/\.[^/.]+$/,''),file=artwork.assets[key];if(!file)return route.abort();body=fs.readFileSync(path.join(root,file));contentType='image/webp';}
   else return route.abort();
   await new Promise(r=>setTimeout(r,150));await route.fulfill({contentType,body});
  });
  await page.addInitScript(()=>{if(localStorage.getItem('bench'))return;localStorage.setItem('bench','1');localStorage.setItem('wwc_tutorial_v1','seen');localStorage.setItem('wwc_owned_ids','["resonator:1108","resonator:1102","resonator:1203"]');localStorage.setItem('wwc_account_data','{"Hiyuki":{"level":90,"sequence":2}}');});
  for(const launch of ['cold','warm']){
   apiRequests=0;imageRequests=0;await page.goto(base);await page.locator('.res-row').first().waitFor();const collectionMs=await page.evaluate(()=>Math.round(performance.now()));
   await page.waitForFunction(()=>[...document.querySelectorAll('.res-row>img')].length===3&&[...document.querySelectorAll('.res-row>img')].every(i=>i.complete&&i.naturalWidth>0));
   const portraitsMs=await page.evaluate(()=>Math.round(performance.now()));await page.waitForLoadState('networkidle');
   results.push({phase,launch,trial:trial+1,collectionMs,portraitsMs,apiRequests,externalImageRequests:imageRequests});
   if(phase==='after'){assert.equal(apiRequests,1,'Only one background version check');assert.equal(imageRequests,0,'Visible portraits are served locally');assert.equal(await page.evaluate(()=>catalogState.gameVersion),'3.6.0');}
   if(trial===0&&launch==='cold')await page.screenshot({path:path.join(root,'test-results/performance-'+phase+'.png')});
  }
  assert.deepEqual(errors,[]);await context.close();
 }
 const report={baseline:previous,conditions:'Edge headless, 720 × 1122 CSS px, isolated profiles, service worker disabled, actual source identities and synthetic account, external API/image responses delayed by 150 ms, no throughput or CPU throttling.',results};
 fs.writeFileSync(path.join(root,'test-results/performance-comparison.json'),JSON.stringify(report,null,2));console.log('PASS: before/after cold and warm measurements; one freshness request, local portraits and correct game version.',results);
 }finally{await browser.close();server.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
