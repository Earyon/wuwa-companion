// Isolated, synthetic account and catalogue. Real application forms and rendering.
const {chromium}=require('playwright');
const fs=require('node:fs'),path=require('node:path'),http=require('node:http'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'..');
const chars=Array.from({length:55},(_,i)=>({id:`resonator:${i+1}`,gameId:String(i+1),name:i?'Test '+(i+1):'Qingxiao',rarity:5,weapon:'Sword',element:'Aero',image:''}));
const weapons=Array.from({length:120},(_,i)=>({id:`weapon:${i+1}`,gameId:String(i+1),name:'Weapon '+i,rarity:5,type:'Sword',image:''}));
const catalogue={Echo:[{Id:6001,Name:'Test Echo',FetterGroups:[{Id:1,Name:'Test Sonata'}]},{Id:6002,Name:'Shared name',FetterGroups:[{Id:2,Name:'Other Sonata'}]},{Id:6003,Name:'Shared name',FetterGroups:[{Id:3,Name:'Third Sonata'}]}]};
const server=http.createServer((req,res)=>{const name=new URL(req.url,'http://local').pathname;const file=path.resolve(root,'.'+(name==='/'?'/index.html':name));if(!file.startsWith(root+path.sep)){res.writeHead(403).end();return;}fs.readFile(file,(e,b)=>{if(e){res.writeHead(404).end();return;}res.setHeader('Content-Type',file.endsWith('.js')?'application/javascript':file.endsWith('.css')?'text/css':file.endsWith('.html')?'text/html':'image/png');res.end(b);});});
(async()=>{
 await new Promise(r=>server.listen(0,'127.0.0.1',r));const base=`http://127.0.0.1:${server.address().port}`;
 const browser=await chromium.launch({headless:true,channel:'msedge'});let geometryCount=0;
 try{
  for(const language of ['fr','en']){
   const context=await browser.newContext({viewport:{width:720,height:1122},serviceWorkers:'block'}),page=await context.newPage(),errors=[];
   let releaseCatalogue,requests=0;const gate=new Promise(r=>releaseCatalogue=r);
   page.on('pageerror',e=>errors.push(e.message));page.on('dialog',d=>d.accept());
   await page.route('https://**/*',async route=>{if(route.request().url().endsWith('/echo')){requests++;await gate;return route.fulfill({contentType:'application/json',body:JSON.stringify(catalogue)});}return route.fulfill({contentType:'application/json',body:'{"GameVer":"test","ResVer":"test","Skills":[]}'});});
   await page.addInitScript(({chars,weapons,language})=>{if(localStorage.getItem('test-seeded'))return;localStorage.setItem('test-seeded','1');localStorage.setItem('wwc_tutorial_v1','seen');localStorage.setItem('wwc_lang',language);localStorage.setItem('wwc_owned_ids','["resonator:1","resonator:2"]');localStorage.setItem('wwc_account_data','{}');localStorage.setItem('wwc_catalog_canonical_v050',JSON.stringify({characters:chars,weapons,state:{gameVersion:'test',resourceVersion:'test'}}));localStorage.setItem('wwc_extra_catalog_v1:echo','{corrupt');},{chars,weapons,language});
   await page.goto(base);await page.locator('.res-row').first().waitFor();
   const tab=async value=>{await page.locator('[data-view="account"]:visible').click();await page.locator(`#accountTabs button[onclick*="'${value}'"]`).click();};
   const form=page.locator('#echoInventoryForm'),submit=async()=>form.locator('[type="submit"]').click();
   const count=()=>page.evaluate(()=>CompanionStore.get().echoes.length);
   await tab('echo');await page.locator('[data-echo-action="add"]').click();
   await form.locator('[name="echo"]').fill('Test Echo');await form.locator('[name="quality"]').selectOption('5');await form.locator('[name="level"]').fill('25');
   releaseCatalogue();await page.locator('#echoCatalogue option').first().waitFor({state:'attached'});
   assert.equal(await form.locator('[name="level"]').inputValue(),'25','Late catalogue does not erase form');assert.equal(requests,1,'Corrupt optional cache still requests network once');
   await form.locator('[name="cost"]').selectOption('4');await form.locator('[name="setId"]').selectOption('1');await form.locator('[name="mainType"]').selectOption('critRate');await form.locator('[name="mainValue"]').fill('22');await form.locator('[name="secondaryType"]').selectOption('atk');await form.locator('[name="sub0Type"]').selectOption('critDmg');await form.locator('[name="sub0Value"]').fill('15');
   await submit();assert.equal(await count(),1);const first=await page.evaluate(()=>CompanionStore.get().echoes[0]);assert.equal(first.owner,null);assert.equal(first.secondary.value,null);
   await page.locator('[data-echo-action="add"]').click();await form.locator('[name="echo"]').fill('Shared name');await submit();assert.equal(await count(),1,'Ambiguous catalogue name rejected');
   const choice=await page.locator('#echoCatalogue option').evaluateAll(options=>options.find(o=>o.value.endsWith('#6003')).value);await form.locator('[name="echo"]').fill(choice);await form.locator('[name="echo"]').press('Tab');await form.locator('[name="setId"]').selectOption('3');await submit();assert.equal(await count(),2);const second=await page.evaluate(()=>CompanionStore.get().echoes[1]);assert.equal(second.catalogId,'6003');
   await page.locator(`[data-echo-action="edit"][data-value="${first.id}"]`).click();
   await form.locator('[name="quality"]').selectOption('2');await submit();assert.match(await page.locator('#echoFormError').innerText(),/niveau|Level/);
   await form.locator('[name="quality"]').selectOption('5');await form.locator('[name="sub1Type"]').selectOption('critDmg');await submit();assert.match(await page.locator('#echoFormError').innerText(),/fois|once/);
   await form.locator('[name="sub1Type"]').selectOption('');await form.locator('[name="cost"]').selectOption('1');await submit();assert.match(await page.locator('#echoFormError').innerText(),/principales|main stats/);await page.locator('#echoFormClose').click();
   const open=async(name='Qingxiao')=>{await tab('res');await page.locator('#ownedSearch').fill(name);await page.locator('.edit-chevron').first().click();await page.locator('#editor-tab-echo').click();};
   const pick=async(slot,id)=>{await page.locator(`#editor-echo [data-echo-action="slot"][data-value="${slot}"]`).click();await page.locator(`#editor-echo [data-echo-action="pick"][data-value="${slot}"]`).click();await page.locator(`#echoPicker [data-echo-action="choose"][data-value="${id}"]`).click();await page.locator("[data-echo-picker-apply]").click();await page.locator("#echoPickerClose").click();};
   await open();const before=await page.evaluate(()=>CompanionStore.exportData().records);await pick(1,first.id);await pick(2,second.id);
   assert.deepEqual(await page.evaluate(()=>CompanionStore.exportData().records),before,'Equipment edits remain a draft');await page.locator('#editorClose').click();await open();assert.equal(await page.locator('.echo-slot-copy').count(),0);
   await pick(1,first.id);await pick(1,second.id);await page.locator('#editorSave').click();assert.equal(await count(),2);assert.equal(await page.evaluate(id=>CompanionStore.get().echoes.find(e=>e.id===id).owner,first.id),null);
   await open('Test 2');await page.locator('[data-echo-action="pick"]').first().click();await page.locator(`#echoPicker [data-value="${second.id}"]`).click();assert.match(await page.locator("[data-echo-picker-apply]").innerText(),/depuis|from/);await page.keyboard.press('Escape');await page.locator('#editorClose').click();
   await open();await pick(3,second.id);await pick(1,first.id);await page.locator('#editorSave').click();assert.equal(await page.evaluate(id=>CompanionStore.get().echoes.find(e=>e.id===id).slot,second.id),3);
   await open();await page.locator('[data-echo-action="slot"][data-value="2"]').click();await page.locator('[data-echo-action="pick"][data-value="2"]').click();await page.locator('#echoPickerAdd').click();await page.locator('[data-echo-action="browse-catalogue"]').click();await page.locator('#echoPicker [data-value="6001"]').click();await page.locator('[data-echo-picker-apply]').click();await submit();await page.locator('#editorClose').click();assert.equal(await count(),2,'New draft copy is cancelled with character');
   await open();await page.locator('[data-echo-action="slot"][data-value="2"]').click();await page.locator('[data-echo-action="pick"][data-value="2"]').click();await page.locator('#echoPickerAdd').click();await page.locator('[data-echo-action="browse-catalogue"]').click();await page.locator('#echoPicker [data-value="6001"]').click();await page.locator('[data-echo-picker-apply]').click();await form.locator('[name="level"]').fill('0');await submit();await page.locator('#editorSave').click();assert.equal(await count(),3,'New draft copy commits with the character');
   const created=await page.evaluate(()=>CompanionStore.get().echoes.find(e=>e.slot===2));assert.equal(created.level,0);await tab('echo');await page.locator('[data-echo-action="delete"][data-value="'+created.id+'"]').click();assert.equal(await count(),2,'Removing an equipped copy releases its slot');
   // Concurrent copy change rejects the whole character save, retaining the draft.
   await open();await page.locator(`[data-echo-action="draft-edit"][data-value="${first.id}"]`).click();await form.locator('[name="mainValue"]').fill('20');await submit();
   await page.evaluate(id=>CompanionStore.update(s=>{s.echoes.find(e=>e.id===id).main.value=19;}),first.id);
   await page.locator('#editorSave').click();assert.equal(await page.locator('#accountEditor[open]').count(),1);assert.equal(await page.evaluate(id=>CompanionStore.get().echoes.find(e=>e.id===id).main.value,first.id),19);await page.locator('#editorClose').click();
   // Verify populated slots and actual form geometry in FR/EN, including short landscape.
   await open();
   for(const [width,height] of [[320,700],[720,1122],[1152,690],[720,450]]){
    await page.setViewportSize({width,height});await page.locator('#editorStage').evaluate(e=>e.scrollTop=0);
    const g=await page.locator('#editor-echo').evaluate(e=>({overflow:e.scrollWidth>e.clientWidth+1,touch:[...e.querySelectorAll('button')].every(b=>b.getBoundingClientRect().height>=44)}));assert.deepEqual(g,{overflow:false,touch:true});geometryCount++;
    if(language==='fr'&&height!==450)await page.screenshot({path:path.join(root,`test-results/echo-slots-${width}.png`)});
    await page.locator(`[data-echo-action="draft-edit"][data-value="${first.id}"]`).click();
    assert.equal(await page.locator('#echoFormContent').evaluate(e=>e.scrollTop),0,'Each form opens at its start');
    const fg=await form.evaluate(e=>({overflow:e.scrollWidth>e.clientWidth+1,controls:[...e.querySelectorAll('input,select,button')].every(b=>b.getBoundingClientRect().height>=44)}));assert.deepEqual(fg,{overflow:false,controls:true});geometryCount++;
    if(language==='fr'&&width===720&&height===1122)await page.screenshot({path:path.join(root,'test-results/echo-form-720.png')});await page.locator('#echoFormClose').click();
   }
   await page.locator('#editorClose').click();await page.setViewportSize({width:720,height:1122});await tab('echo');
   // Export/restore and offline cache reuse preserve structured values and stable IDs.
   const backup=await page.evaluate(()=>CompanionStore.exportData());await page.evaluate(b=>CompanionStore.restore(b),backup);await page.reload();await page.locator('.res-row').first().waitFor();await tab('echo');assert.equal(await count(),2);
   await page.locator('#echoSearch [name="filter"]').selectOption('equipped');await page.locator('#echoSearch button').click();assert.equal(await page.locator('#echoInventoryList .companion-card').count(),2);
   await context.setOffline(true);await page.locator(`[data-echo-action="edit"][data-value="${first.id}"]`).click();await form.locator('[name="mainValue"]').fill('21');await page.route('**/api/en/echo',r=>r.abort());await page.evaluate(()=>loadExtended('echo',{refresh:true}));assert.equal(await form.locator('[name="mainValue"]').inputValue(),'21','Failed refresh retains draft');assert.equal(await page.evaluate(()=>extendedCatalog.echo.length),3,'Failed refresh retains valid cached catalogue');await submit();assert.equal(await page.evaluate(id=>CompanionStore.get().echoes.find(e=>e.id===id).main.value,first.id),21);
   assert.deepEqual(errors,[]);await context.close();
  }
  console.log(`PASS: FR/EN Echo inventory and five-slot journeys, catalogue ambiguity/late loading, validation, cancel/save, copy moves and replacements, ownership, stale draft, restore/offline and ${geometryCount} populated layout cases.`);
 }finally{await browser.close();server.close();}
})().catch(e=>{console.error(e);server.close();process.exitCode=1;});
