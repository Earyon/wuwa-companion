'use strict';
const assert=require('node:assert/strict'),{chromium}=require('playwright');
const {startServer}=require('./support.cjs'),{stage}=require('../addon/prepare-backup.cjs');
(async()=>{
 const {server,base}=await startServer(),browser=await chromium.launch({headless:true,channel:'msedge'});
 try{
  const context=await browser.newContext({serviceWorkers:'block'}),page=await context.newPage(),errors=[];
  page.on('pageerror',e=>errors.push(e.message));await page.route('https://**/*',r=>r.abort());
  await page.addInitScript(()=>{if(localStorage.getItem('addon-test'))return;localStorage.setItem('addon-test','SYNTHETIC');
   localStorage.setItem('wwc_tutorial_v1','seen');localStorage.setItem('wwc_owned_ids','[]');localStorage.setItem('wwc_lang','fr');});
  await page.goto(base);await page.waitForFunction(()=>typeof CompanionStore!=='undefined'&&CompanionStore.get().roster!==null);
  const snapshot={format:'wuwa-companion-snapshot',version:1,source:{provider:'local-export',account:'SYNTHETIC_BROWSER',server:'europe',identity:'stable',gameVersion:'3.6.0',capturedAt:'2026-01-02T10:00:00Z'},
   characters:[{gameId:'1108',level:90,ascension:6,sequence:2,weaponSourceId:'test-weapon',skills:{'Normal Attack':6,Skill:7,'Forte Circuit':8,Liberation:9,Intro:10}}],
   weapons:[{sourceId:'test-weapon',gameId:'21020086',level:90,ascension:6,rank:1}],
   echoes:[{sourceId:'test-echo',gameId:'6000038',ownerGameId:'1108',slot:1,level:0,quality:5,cost:1}]};
  const backup=await page.evaluate(()=>JSON.stringify(CompanionStore.exportData()));
  const result=stage(JSON.stringify(snapshot),backup);
  await page.evaluate(backup=>CompanionStore.restore(backup),result.backup);await page.reload();
  const row=page.locator('.res-row').filter({hasText:'Hiyuki'});await row.waitFor();
  await row.locator('.edit-chevron').click();
  const saved=await page.evaluate(()=>CompanionStore.get());assert.equal(saved.characters['resonator:1108'].level,90);
  assert.equal(saved.characters['resonator:1108'].weaponCopyId,saved.weapons[0].id);
  await page.locator('#editor-tab-forte').click();await page.waitForFunction(()=>document.querySelectorAll('.talent-node').length===15);
  for(const [type,level]of Object.entries(snapshot.characters[0].skills)){
   const node=page.locator('[data-talent="core:'+type+'"]');assert.match(await node.innerText(),new RegExp('(?:Nv\\.|Lv\\.)\\s*'+level+'\\s*/10'));
  }
  await page.locator('#editor-tab-echo').click();await page.locator('[data-echo-action="pick"]').first().click();
  assert.equal(await page.locator('.echo-choice').count(),1,'Only the one imported owned copy appears');
  assert.equal(saved.echoes[0].owner,'resonator:1108');assert.equal(saved.echoes[0].slot,1);
  assert.deepEqual(errors,[]);await context.close();
  console.log('PASS: staged backup restored in isolated real app; character, all five displayed skills, weapon link, owned Echo and reload verified, external network blocked.');
 }finally{await browser.close();server.close();}
})().catch(error=>{console.error(error);process.exitCode=1;});
