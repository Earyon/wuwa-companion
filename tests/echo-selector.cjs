// Video-referenced layout, real catalogue/artwork, explicitly synthetic owned copies.
const assert=require('node:assert/strict'),path=require('node:path'),{chromium}=require('playwright'),{startServer,root}=require('./support.cjs');
(async()=>{
 const {server,base}=await startServer(),browser=await chromium.launch({headless:true,channel:'msedge'});let layouts=0;
 try{
  for(const language of ['fr','en']){
   const context=await browser.newContext({viewport:{width:1724,height:1080},serviceWorkers:'block'}),page=await context.newPage(),errors=[];
   page.on('pageerror',e=>errors.push(e.message));let descriptions=0,slowId=null,releaseDescription,slowFinished;
   await page.route('https://**/*',async r=>{const match=r.request().url().match(/\/echo\/(\d+)$/);if(match){descriptions++;if(match[1]===slowId)await new Promise(resolve=>releaseDescription=resolve);await r.fulfill({contentType:'application/json',body:JSON.stringify({MonsterId:Number(match[1]),Skill:{SimplyDescription:'TEST DESCRIPTION '+match[1]}})});if(match[1]===slowId)slowFinished=true;return;}return r.abort();});
   await page.addInitScript(language=>{if(localStorage.getItem('echo-selector-test'))return;localStorage.setItem('echo-selector-test','SYNTHETIC');localStorage.setItem('wwc_tutorial_v1','seen');localStorage.setItem('wwc_lang',language);localStorage.setItem('wwc_owned_ids','["resonator:1108","resonator:1102"]');},language);
   await page.goto(base);await page.locator('.res-row').first().waitFor();await page.evaluate(async()=>{await loadExtended('echo');await loadMenuRules();openAccountEditor('Hiyuki');selectEditorSection('echo');openEchoPicker(1);});
   assert.equal(await page.locator('.echo-choice').count(),0,'An empty inventory never falls back to the full catalogue');
   assert.match(await page.locator('#echoPickerEmpty').innerText(),language==='fr'?/Aucun Écho ajouté/:/No Echoes added/);
   await page.locator('#echoPickerAdd').click();assert.ok(await page.locator('#echoForm').isVisible());assert.equal(await page.locator('#echoPicker').isVisible(),false);
   await page.locator('[data-echo-action="browse-catalogue"]').click();assert.equal(await page.locator('.echo-choice').count(),311,'Catalogue requires the explicit image chooser in the add form');
   await page.locator('#echoPickerClose').click();await page.keyboard.press('Escape');await page.locator('#editorClose').click();
   await page.evaluate(()=>{
    CompanionStore.update(s=>{s.echoes=extendedCatalog.echo.slice(0,24).map((r,i)=>({id:'SELECTOR_TEST_'+i,catalogId:r.id,name:r.name,owner:i<5?'resonator:1108':i===5?'resonator:1102':null,slot:i<5?i+1:i===5?1:null,quality:5,level:25,cost:i===5?1:[4,3,3,1,1][i%5],setId:r.sets[0]?.id||null,main:{type:'atkPct',value:18},secondary:{type:i===5||i%5>=3?'hp':'atk',value:100},substats:[{type:'critRate',value:8.1}]}));});openAccountEditor('Hiyuki');selectEditorSection('echo');openEchoPicker(5);
   });
   assert.equal(await page.locator('.echo-choice').count(),24,'Equipment selection contains only recorded copies');
   await page.waitForFunction(()=>[...document.querySelectorAll('#echoPickerList>button')].slice(0,6).every(e=>{const i=e.querySelector('img');return i&&i.complete&&i.naturalWidth>0;}));
   const stored=await page.evaluate(()=>CompanionStore.exportData().records);
   await page.locator('[data-echo-action="choose"][data-value="SELECTOR_TEST_5"]').click();
   assert.deepEqual(await page.evaluate(()=>CompanionStore.exportData().records),stored,'Preview does not equip or modify copies');
   await page.waitForFunction(()=>document.getElementById('echoPickerAbility').textContent.startsWith('TEST DESCRIPTION'));
   const before=descriptions;await page.locator('[data-echo-action="choose"][data-value="SELECTOR_TEST_5"]').click();assert.equal(descriptions,before,'Preview reuses the shared detail cache');
   assert.match(await page.locator('[data-echo-picker-apply]').innerText(),language==='fr'?/depuis/:/from/);
   assert.ok(await page.locator('[data-echo-picker-edit]').isDisabled(),'Editing another owner requires the explicit transfer first');
   await page.locator('[data-echo-picker-apply]').click();assert.equal(await page.evaluate(()=>editingEchoes.after.find(e=>e.id==='SELECTOR_TEST_5').owner),'resonator:1108');assert.equal(await page.evaluate(()=>editingEchoes.after.find(e=>e.id==='SELECTOR_TEST_4').owner),null);
   await page.locator('#echoPickerClose').click();await page.locator('#editorClose').click();assert.deepEqual(await page.evaluate(()=>CompanionStore.exportData().records),stored,'Cancelling also cancels a transfer from another Resonator');
   await page.evaluate(()=>{openAccountEditor('Hiyuki');selectEditorSection('echo');openEchoPicker(5);});
   // Cost overflow is blocked before changing any draft.
   await page.locator('[data-echo-action="choose"][data-value="SELECTOR_TEST_10"]').click();assert.ok(await page.locator('[data-echo-picker-apply]').isDisabled());
   await page.locator('[data-echo-picker-cost="3"]').click();assert.equal(await page.locator('.echo-choice').count(),10);assert.ok(await page.locator('[data-echo-picker-cost="3"]').evaluate(e=>e===document.activeElement));
   await page.locator('[data-echo-picker-cost=""]').click();
   await page.locator('#echoPickerFilters').click();await page.locator('#echoPickerOwner').selectOption('free');assert.equal(await page.locator('.echo-choice').count(),18);await page.locator('#echoPickerOwner').selectOption('all');await page.locator('#echoPickerFilters').click();
   slowId=await page.evaluate(()=>editingEchoes.after.find(e=>e.id==='SELECTOR_TEST_20').catalogId);
   await page.locator('[data-value="SELECTOR_TEST_20"]').click();
   const stableId=await page.evaluate(()=>editingEchoes.after.find(e=>e.id==='SELECTOR_TEST_5').catalogId);
   await page.locator('[data-value="SELECTOR_TEST_5"]').click();await page.waitForFunction(id=>document.getElementById('echoPickerAbility').textContent==='TEST DESCRIPTION '+id,stableId);
   assert.equal(typeof releaseDescription,'function');releaseDescription();while(!slowFinished)await new Promise(r=>setTimeout(r,20));
   await page.waitForFunction(id=>!profilePending.has(profileKey({kind:'echo',id})),slowId);assert.equal(await page.locator('#echoPickerAbility').innerText(),'TEST DESCRIPTION '+stableId,'Late detail cannot overwrite the current preview');
   for(const [width,height]of [[1724,1080],[1152,800],[720,1122],[720,450],[360,640],[320,700]]){
    await page.setViewportSize({width,height});await page.locator('#echoPicker').evaluate(e=>e.dataset.detail='false');
    await page.evaluate(()=>new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r))));
    const rect=await page.locator('.echo-picker-sheet').evaluate(e=>({overflow:e.scrollWidth>e.clientWidth+1||e.scrollHeight>e.clientHeight+1}));assert.deepEqual(rect,{overflow:false},`Grid ${language} ${width}x${height}`);
    assert.ok(await page.locator('.echo-choice').first().evaluate(e=>{const r=e.getBoundingClientRect();return r.width>=44&&r.height>=44;}));
    assert.ok(await page.locator('#echoPickerList .echo-choice').evaluateAll(nodes=>{const rects=nodes.map(n=>n.getBoundingClientRect());return rects.every((a,i)=>rects.slice(i+1).every(b=>a.right<=b.left+.5||b.right<=a.left+.5||a.bottom<=b.top+.5||b.bottom<=a.top+.5));}),`Thumbnails never overlap ${width}x${height}`);
    assert.ok(await page.locator('#echoPickerRail .echo-slot').evaluateAll(nodes=>nodes.length===5&&nodes.every(n=>{const r=n.getBoundingClientRect();return r.left>=0&&r.right<=innerWidth&&r.width>=44&&r.height>=44;})),`All five slots visible ${width}x${height}`);
    if(language==='fr')await page.screenshot({path:path.join(root,`test-results/echo-selection-grid-${width}x${height}.png`)});
    await page.locator('[data-echo-action="choose"][data-value="SELECTOR_TEST_5"]').click();
    assert.ok(await page.locator('[data-echo-picker-apply]').evaluate(e=>{const r=e.getBoundingClientRect();return r.top>=0&&r.bottom<=innerHeight&&r.height>=44;}));
    if(width<680){await page.locator('#echoPickerBack').click();assert.ok(await page.locator('#echoPickerList').isVisible());}
    layouts++;
   }
   await page.setViewportSize({width:1152,height:800});await page.locator('[data-echo-action="choose"][data-value="SELECTOR_TEST_5"]').click();await page.locator('[data-echo-picker-apply]').click();await page.locator('#echoPickerClose').click();await page.locator('#editorSave').click();await page.reload();await page.locator('.res-row').first().waitFor();assert.equal(await page.evaluate(()=>CompanionStore.get().echoes.find(e=>e.id==='SELECTOR_TEST_5').owner),'resonator:1108');
   // Catalogue gallery retains form input and binds the choice to a stable ID.
   await page.evaluate(async()=>{await loadExtended('echo');openEchoForm(null);});const form=page.locator('#echoInventoryForm');await form.locator('[name="quality"]').selectOption('5');await form.locator('[name="level"]').fill('17');await page.locator('[data-echo-action="browse-catalogue"]').click();assert.equal(await page.locator('.echo-choice').count(),311);
   const id=await page.locator('.echo-choice').nth(4).getAttribute('data-value');await page.locator('.echo-choice').nth(4).click();await page.locator('[data-echo-picker-apply]').click();assert.equal(await form.locator('[name="level"]').inputValue(),'17');assert.ok(await page.locator('#echoFormImage img').count());await form.locator('[type="submit"]').click();assert.equal(await page.evaluate(()=>CompanionStore.get().echoes.at(-1).catalogId),id);
   assert.deepEqual(errors,[]);await context.close();
  }
  console.log(`PASS: ${layouts} video-based Echo selector layouts, official images, separate preview/equip, transfer/cancel/save, cost limits, filters, cached descriptions, gallery identity and preserved form values in FR/EN.`);
 }finally{await browser.close();server.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
