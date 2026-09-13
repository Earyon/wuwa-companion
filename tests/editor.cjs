// Real editor, synthetic account, isolated browser. No production or user data.
const {chromium}=require('playwright');
const fs=require('node:fs'),path=require('node:path'),http=require('node:http'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'..'),out=path.join(root,'test-results');fs.mkdirSync(out,{recursive:true});
const fixture=require('./fixtures/sanhua-forte.json');
const characters=Array.from({length:55},(_,i)=>({id:`resonator:${i+1}`,gameId:String(i+1),name:i?'Test '+(i+1):'Qingxiao',rarity:5,weapon:'Sword',element:'Aero',image:''}));
const weapons=Array.from({length:120},(_,i)=>({id:`weapon:${i+1}`,gameId:String(i+1),name:i?'Test weapon '+(i+1):'Test Sword',rarity:5,type:'Sword',image:'/assets/icon-192.png'}));
const progress={level:80,sequence:2,weapon:{name:'Test Sword',level:50,rank:1},skills:{Intro:3},forteNodes:{'node:9':false}};
const server=http.createServer((req,res)=>{const name=new URL(req.url,'http://local').pathname;const file=path.resolve(root,'.'+(name==='/'?'/index.html':name));if(!file.startsWith(root+path.sep)){res.writeHead(403).end();return;}fs.readFile(file,(e,b)=>{if(e){res.writeHead(404).end();return;}res.setHeader('Content-Type',file.endsWith('.js')?'application/javascript':file.endsWith('.css')?'text/css':file.endsWith('.html')?'text/html':'image/png');res.end(b);});});
(async()=>{
 await new Promise(r=>server.listen(0,'127.0.0.1',r));const base=`http://127.0.0.1:${server.address().port}`;
 const browser=await chromium.launch({headless:true,channel:'msedge'});const metrics=[];let geometryCases=0;
 try{
  for(const language of ['fr','en']){
   const context=await browser.newContext({viewport:{width:720,height:1122},serviceWorkers:'block'}),page=await context.newPage(),errors=[];let detailRequests=0;
   page.on('pageerror',e=>errors.push(e.message));
   await page.route('https://**/*',route=>{if(route.request().url().includes('/character/'))detailRequests++;return route.fulfill({contentType:'application/json',body:JSON.stringify(route.request().url().includes('/character/')?fixture:{GameVer:'test',ResVer:'test'})});});
   await page.addInitScript(({characters,weapons,progress,fixture,language})=>{
    if(localStorage.getItem('test-seeded'))return;localStorage.setItem('test-seeded','1');localStorage.setItem('wwc_lang',language);
    localStorage.setItem('wwc_catalog_canonical_v050',JSON.stringify({characters,weapons,state:{gameVersion:'test',resourceVersion:'test'}}));
    localStorage.setItem('wwc_owned_ids','["resonator:1"]');localStorage.setItem('wwc_account_data',JSON.stringify({Qingxiao:progress}));
    localStorage.setItem('wwc_character_detail_v4:1',JSON.stringify({detail:fixture}));
   },{characters,weapons,progress,fixture,language});
   await page.goto(base);await page.locator('.res-row').waitFor();
   const open=async()=>{await page.locator('.edit-chevron').click();await page.locator('dialog#accountEditor[open]').waitFor();};
   const section=async name=>page.locator('#editor-tab-'+name).click();
   await open();const before=await page.evaluate(()=>CompanionStore.exportData().records);
   await page.evaluate(()=>document.querySelector('.edit-chevron').focus());
   assert.equal(await page.evaluate(()=>document.getElementById('accountEditor').contains(document.activeElement)),true,'Background cannot receive focus');
   await page.waitForFunction(()=>document.querySelectorAll('[data-skill-level]').length===5);
   const initialRequests=detailRequests;
   for(const [width,height] of [[320,700],[360,640],[720,1122],[819,650],[820,650],[1152,690],[1536,960],[720,450]]){
    await page.setViewportSize({width,height});
    for(const name of ['overview','weapon','echo','forte','sequence']){
     await section(name);
     const geometry=await page.evaluate(()=>{
      const dialog=document.getElementById('accountEditor'),sheet=dialog.querySelector('.account-editor-sheet'),stage=document.getElementById('editorStage'),footer=dialog.querySelector('.editor-actions'),panel=dialog.querySelector('.editor-panel:not([hidden])');
      const rect=e=>e.getBoundingClientRect(),r=rect(sheet),f=rect(footer),st=rect(stage);
      return {overflow:panel.scrollWidth>panel.clientWidth+1||sheet.scrollWidth>sheet.clientWidth+1,within:r.left>=-1&&r.right<=innerWidth+1&&r.top>=-1&&r.bottom<=innerHeight+1,footer:f.bottom<=innerHeight+1&&st.bottom<=f.top+1,touch:[...dialog.querySelectorAll('#editorTabs button,#editorClose,#editorSave')].every(b=>rect(b).height>=44),panels:dialog.querySelectorAll('.editor-panel:not([hidden])').length,selected:dialog.querySelectorAll('[role="tab"][aria-selected="true"]').length};
     });
     assert.deepEqual(geometry,{overflow:false,within:true,footer:true,touch:true,panels:1,selected:1},`${language} ${name} ${width}x${height}`);geometryCases++;
     if((width===720&&height===1122)||(width===1152&&name==='overview')||(width===320&&name==='forte'))await page.screenshot({path:path.join(out,`${language}-editor-${name}-${width}.png`)});
    }
    // Keyboard tab orientation follows the visible layout, including its boundary.
    await page.locator('#editor-tab-overview').focus();await page.keyboard.press(width>=820?'ArrowDown':'ArrowRight');
    assert.equal(await page.locator('#editor-tab-weapon').getAttribute('aria-selected'),'true');
    await page.keyboard.press('End');assert.equal(await page.locator('#editor-tab-sequence').getAttribute('aria-selected'),'true');
   }
   const tabCharacterRequests=detailRequests-initialRequests;
   assert.equal(tabCharacterRequests,0,'Tab navigation does not refetch character details');
   assert.deepEqual(await page.evaluate(()=>CompanionStore.exportData().records),before,'Tabs do not save');
   await page.setViewportSize({width:720,height:1122});await section('overview');await page.locator('#levelCurrent').click();
   await page.keyboard.press('Escape');assert.equal(await page.locator('dialog[open]').count(),1);assert.equal(await page.locator('#levelCurrent').evaluate(e=>e===document.activeElement),true);
   await page.locator('#levelCurrent').click();await page.locator('#levelQ').fill('60');await page.locator('#levelGrid button').filter({hasText:/^60$/}).click();
   await section('sequence');await page.locator('[data-sequence="4"]').click();
   await section('forte');await page.locator('[data-skill-level="Intro"]').selectOption('7');await page.locator('[data-forte-key="node:9"]').check();
   await section('weapon');await section('forte');assert.equal(await page.locator('[data-skill-level="Intro"]').inputValue(),'7');assert.equal(await page.locator('[data-forte-key="node:9"]').isChecked(),true);
   await page.locator('[data-skill-level="Intro"]').focus();await page.evaluate(()=>drawSkillsEditor());assert.equal(await page.evaluate(()=>document.activeElement.dataset.skillLevel),'Intro');
   await page.keyboard.press('Escape');assert.equal(await page.locator('dialog[open]').count(),0);assert.deepEqual(await page.evaluate(()=>CompanionStore.exportData().records),before,'Escape cancels every section');
   await open();await section('forte');assert.equal(await page.locator('[data-skill-level="Intro"]').inputValue(),'3');
   await page.locator('[data-skill-level="Intro"]').selectOption('7');await page.locator('[data-forte-key="node:9"]').check();
   await section('sequence');await page.locator('[data-sequence="4"]').click();await section('overview');await page.locator('#levelCurrent').click();await page.locator('#levelQ').fill('60');await page.locator('#levelGrid button').filter({hasText:/^60$/}).click();
   await section('weapon');await page.locator('#weaponCurrent').click();await page.locator('#weaponQ').fill('Test Sword');await page.locator('#weaponGrid button').click();
   await page.locator('[data-weapon-rank="2"]').click();assert.equal(await page.evaluate(()=>document.activeElement.dataset.weaponRank),'2');
   await page.locator('#weaponLevelCurrent').click();await page.locator('#weaponLevelQ').fill('50');await page.locator('#weaponLevelGrid button').filter({hasText:/^50$/}).click();
   assert.equal(await page.evaluate(()=>document.activeElement.id),'weaponLevelCurrent');await page.locator('#editorSave').click();
   await page.reload();await page.locator('.res-row').waitFor();const saved=await page.evaluate(()=>accountData.Qingxiao);
   assert.equal(saved.level,60);assert.equal(saved.sequence,4);assert.equal(saved.skills.Intro,7);assert.equal(saved.forteNodes['node:9'],true);assert.equal(saved.weapon.level,50);assert.equal(await page.evaluate(()=>CompanionStore.get().weapons.length),1);
   // Missing data stays unknown; changes in all sections still save together.
   await open();await section('forte');await page.locator('[data-skill-level="Intro"]').selectOption('');await page.locator('#editorSave').click();assert.equal(await page.evaluate(()=>accountData.Qingxiao.skills.Intro),undefined);
   const timings=[];for(let i=0;i<5;i++){timings.push(await page.evaluate(async()=>{const start=performance.now();openAccountEditor('Qingxiao');await new Promise(requestAnimationFrame);return performance.now()-start;}));await page.locator('#editorClose').click();}
   metrics.push({language,warmOpenUntilNextFrameMs:timings,tabCharacterRequests});
   assert.deepEqual(errors,[]);await context.close();
  }
  fs.writeFileSync(path.join(out,'editor-metrics.json'),JSON.stringify(metrics,null,2));
  console.log(`PASS: ${geometryCases} editor section/viewport/language cases; keyboard tabs, modal focus, nested Escape, cancel/save across sections, unknown skills, copy linkage and no repeated character-detail requests from tabs.`);
 }finally{await browser.close();server.close();}
})().catch(e=>{console.error(e);server.close();process.exitCode=1;});
