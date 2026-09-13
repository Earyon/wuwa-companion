const {chromium}=require('playwright');
const fs=require('node:fs'),path=require('node:path'),http=require('node:http'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'..');
const chars=Array.from({length:55},(_,i)=>({id:`resonator:${i+1}`,gameId:String(i+1),name:i===0?'Qingxiao':`Test ${i+1}`,rarity:5,weapon:'Sword',element:'Aero',image:'/assets/icon-192.png'}));
const weapons=Array.from({length:120},(_,i)=>({id:`weapon:${i+1}`,gameId:String(i+1),name:i===0?"Firstlight's Test":`Weapon ${i+1}`,type:'Sword',rarity:5,image:'/assets/icon-192.png'}));
const seed={Qingxiao:{level:70,sequence:3,skills:{Intro:3},forteNodes:{'node:9':true}}};
const server=http.createServer((req,res)=>{const file=path.resolve(root,'.'+(new URL(req.url,'http://local').pathname==='/'?'/index.html':new URL(req.url,'http://local').pathname));if(!file.startsWith(root+path.sep)){res.writeHead(403).end();return;}fs.readFile(file,(e,b)=>{if(e){res.writeHead(404).end();return;}res.setHeader('Content-Type',file.endsWith('.js')?'application/javascript':file.endsWith('.css')?'text/css':file.endsWith('.html')?'text/html':'image/png');res.end(b);});});
(async()=>{
 await new Promise(r=>server.listen(0,'127.0.0.1',r));const base=`http://127.0.0.1:${server.address().port}`;
 const browser=await chromium.launch({headless:true,channel:'msedge'});
 try{
  for(const language of ['fr','en']){
   const context=await browser.newContext({viewport:{width:720,height:1122},serviceWorkers:'block'}),page=await context.newPage(),errors=[];
   page.on('pageerror',e=>errors.push(e.message));page.on('dialog',d=>d.accept());
   await page.route('https://**/*',route=>{const u=route.request().url();const payload=u.endsWith('/item')?{itemList:[{Id:2,Name:'Shell Credit',TypeName:'Currency'},{Id:3,Name:'Astrite',TypeName:'Currency'}]}:u.endsWith('/echo')?{Echo:[{Id:6001,Name:'Test Echo',Type:'Echo',FetterGroups:[]}]}:{GameVer:'test',ResVer:'test',Skills:[]};return route.fulfill({contentType:'application/json',body:JSON.stringify(payload)});});
   await page.addInitScript(({chars,weapons,seed,language})=>{if(localStorage.getItem('test-seeded'))return;localStorage.setItem('test-seeded','1');localStorage.setItem('wwc_lang',language);localStorage.setItem('wwc_catalog_canonical_v050',JSON.stringify({characters:chars,weapons,state:{gameVersion:'test',resourceVersion:'test'}}));localStorage.setItem('wwc_owned_ids',JSON.stringify(chars.slice(0,2).map(c=>c.id)));localStorage.setItem('wwc_account_data',JSON.stringify(seed));},{chars,weapons,seed,language});
   await page.goto(base);await page.locator('.res-row').first().waitFor();
   const initial=await page.evaluate(()=>CompanionStore.exportData());
   const nav=async view=>page.locator(`[data-view="${view}"]:visible`).click();
   const tab=async value=>{await nav('account');await page.locator(`#accountTabs button[onclick*="'${value}'"]`).click();};
   await tab('weap');
   for(let i=0;i<2;i++){await page.locator('[name="weapon"]').fill("Firstlight's Test");await page.locator('[name="level"]').fill('80');await page.locator('#weaponInventoryForm button').click();}
   assert.equal(await page.locator('.companion-card').count(),2);
   const copies=await page.evaluate(()=>CompanionStore.get().weapons);assert.equal(new Set(copies.map(w=>w.id)).size,2);assert.ok(copies.every(w=>w.rank===1));
   await page.locator('[data-action="edit-weapon"]').first().click();await page.locator('[name="rank"]').selectOption('2');await page.locator('#weaponInventoryForm button').click();
   assert.deepEqual((await page.evaluate(()=>CompanionStore.get().weapons.map(w=>w.rank))).sort(),[1,2]);
   const beforeEquipment=await page.evaluate(()=>CompanionStore.exportData());
   const openCharacter=async name=>{await tab('res');await page.locator('#ownedSearch').fill(name);await page.locator('.edit-chevron').click();await page.locator('#editor-tab-weapon').click();};
   const chooseCopy=async id=>{await page.locator('#weaponCurrent').click();await page.locator(`[data-copy="${id}"]`).click();};
   await openCharacter('Qingxiao');await chooseCopy(copies[0].id);await page.locator('#editorClose').click();
   assert.equal(await page.evaluate(()=>CompanionStore.get().characters['resonator:1'].weaponCopyId),undefined,'Cancel does not equip or create copies');
   await openCharacter('Qingxiao');await chooseCopy(copies[0].id);await page.locator('#editorSave').click();
   assert.equal(await page.evaluate(()=>CompanionStore.get().characters['resonator:1'].weaponCopyId),copies[0].id);
   assert.equal(await page.evaluate(()=>CompanionStore.get().weapons.length),2);
   await tab('weap');await page.locator(`[data-action="edit-weapon"][data-value="${copies[0].id}"]`).click();
   await page.locator('[name="level"]').fill('85');await page.locator('#weaponInventoryForm button').click();
   assert.equal(await page.evaluate(()=>accountData.Qingxiao.weapon.level),85,'Inventory and character share one record');
   await openCharacter('Test 2');await page.locator('#weaponCurrent').click();
   assert.equal(await page.locator(`[data-copy="${copies[0].id}"]`).isDisabled(),true,'One owner per copy');
   await page.locator(`[data-copy="${copies[1].id}"]`).click();await page.locator('#editorSave').click();
   await openCharacter('Qingxiao');await page.locator('#weaponCurrent').click();
   for(const width of [320,720,1152]){
    await page.setViewportSize({width,height:1122});
    const geometry=await page.locator('#weaponPicker .selector-sheet').evaluate(el=>({overflow:el.scrollWidth>el.clientWidth+1,buttons:[...el.querySelectorAll('#weaponSource button')].every(b=>b.getBoundingClientRect().height>=44)}));
    assert.equal(geometry.overflow,false);assert.equal(geometry.buttons,true);
   }
   await page.setViewportSize({width:720,height:1122});
   fs.mkdirSync(path.join(root,'test-results'),{recursive:true});await page.screenshot({path:path.join(root,'test-results',`${language}-equipment.png`)});
   await page.locator('#weaponPickerClose').click();
   await page.locator('.rank-btn').filter({hasText:'R3'}).click();await page.locator('#editorSave').click();
   assert.equal(await page.evaluate(id=>CompanionStore.get().weapons.find(w=>w.id===id).rank,copies[0].id),3,'Editor updates shared rank');
   await openCharacter('Qingxiao');
   await page.evaluate(id=>{const w=CompanionStore.get().weapons.find(w=>w.id===id);CompanionStore.saveWeapon({...w,level:86},w,{characters:DATA,weapons:WEAPONS});},copies[0].id);
   await page.locator('#editorSave').click();assert.equal(await page.locator('#accountEditor.open').count(),1,'Stale weapon edit is rejected');
   await page.locator('#editorClose').click();
   await tab('weap');await page.locator(`[data-action="remove-weapon"][data-value="${copies[0].id}"]`).click();
   assert.equal(await page.evaluate(()=>CompanionStore.get().characters['resonator:1'].weaponCopyId),undefined);
   assert.equal(await page.evaluate(()=>CompanionStore.get().weapons.length),1);
   await openCharacter('Qingxiao');await page.locator('#weaponCurrent').click();await page.locator('#weaponSource button').last().click();await page.locator('#weaponQ').fill('Weapon 3');await page.locator('#weaponGrid .weapon-card').first().click();
   await page.locator('#editorSave').click();assert.equal(await page.evaluate(()=>CompanionStore.get().weapons.length),2,'Explicit new copy added once');
   const linkedBackup=await page.evaluate(()=>CompanionStore.exportData());
   await page.evaluate(b=>CompanionStore.restore(b),linkedBackup);await page.reload();await page.locator('.res-row').first().waitFor();
   assert.ok(await page.evaluate(()=>accountData.Qingxiao.weapon?.name));
   await openCharacter('Qingxiao');await page.locator('#weaponSettings button').filter({hasText:language==='fr'?'Déséquiper':'Unequip'}).click();await page.locator('#editorSave').click();
   assert.equal(await page.evaluate(()=>CompanionStore.get().weapons.length),2,'Unequipping retains the inventory copy');
   await page.evaluate(b=>CompanionStore.restore(b),beforeEquipment);await page.reload();await page.locator('.res-row').first().waitFor();
   await tab('resources');await page.locator('[name="item:2"]').waitFor();await page.locator('[name="item:2"]').fill('0');await page.locator('#resourcesForm button:not([type="button"])').click();
   assert.deepEqual(await page.evaluate(()=>CompanionStore.get().resources),{'2':0});
   await tab('echo');await page.locator('[data-echo-action="add"]').click();await page.locator('#echoCatalogue option').waitFor({state:'attached'});await page.locator('[name="echo"]').fill('Test Echo');await page.locator('[name="mainType"]').selectOption('atkPct');await page.locator('[name="sub0Type"]').selectOption('critRate');await page.locator('[name="sub0Value"]').fill('8.1');await page.locator('#echoInventoryForm [type="submit"]').click();
   assert.equal(await page.evaluate(()=>CompanionStore.get().echoes.length),1);
   await nav('planner');await page.locator('[name="level"]').fill('80');await page.locator('[name="skill:4"]').fill('7');await page.locator('[name="priority:4"]').selectOption('3');await page.locator('#goalForm [value="activate"]').click();
   assert.equal(await page.evaluate(()=>CompanionStore.get().active),'resonator:1');assert.deepEqual(await page.evaluate(()=>JSON.parse(localStorage.getItem('wwc_account_data'))),seed);
   await nav('daily');assert.match(await page.locator('#view').innerText(),/3 → 7/);
   await nav('planner');await page.locator('#planningCharacter').selectOption('resonator:2');await page.locator('#goalForm [value="activate"]').click();assert.equal(await page.evaluate(()=>CompanionStore.get().active),'resonator:2');
   await page.locator('[data-action="pause-plan"]').click();assert.equal(await page.evaluate(()=>CompanionStore.get().active),null);
   await nav('more');
   const downloadPromise=page.waitForEvent('download');await page.locator('[data-action="export"]').click();const download=await downloadPromise;
   const backupText=fs.readFileSync(await download.path(),'utf8');const backup=JSON.parse(backupText);assert.equal(backup.format,'wuwa-companion-backup');
   await page.locator('#backupFile').setInputFiles({name:'invalid.json',mimeType:'application/json',buffer:Buffer.from('{"format":"other"}')});assert.equal(await page.locator('[data-action="restore-backup"]').count(),0);
   const before=await page.evaluate(()=>CompanionStore.exportData());
   const validation=await page.evaluate(()=>{const b=CompanionStore.exportData();b.records.wwc_account_data='{"Qingxiao":{"level":999}}';try{CompanionStore.validateBackup(JSON.stringify(b));return false;}catch{return true;}});assert.equal(validation,true);
   // Simulate a quota error mid-restore: every personal record must roll back.
   const rolledBack=await page.evaluate(()=>{const b=CompanionStore.exportData(),target=structuredClone(b);target.records.wwc_lang='en';const write=Storage.prototype.setItem;let n=0;Storage.prototype.setItem=function(k,v){if(++n===3)throw new DOMException('full','QuotaExceededError');return write.call(this,k,v)};try{CompanionStore.restore(target);}catch{}finally{Storage.prototype.setItem=write;}return CompanionStore.exportData().records;});assert.deepEqual(rolledBack,before.records);
   // Round-trip from actual downloaded file, after changing inventory.
   await page.evaluate(()=>CompanionStore.update(s=>{s.weapons=[];}));
   await page.locator('#backupFile').setInputFiles({name:'backup.json',mimeType:'application/json',buffer:Buffer.from(backupText)});await page.locator('[data-action="restore-backup"]').click();await page.waitForLoadState();await page.locator('.res-row').first().waitFor();
   assert.deepEqual(await page.evaluate(()=>CompanionStore.exportData().records),backup.records);
   await tab('res');await page.locator('#ownedSearch').fill('Qingxiao');await page.locator('.trash-btn').click();await page.reload();await page.locator('.res-row').first().waitFor();assert.equal(await page.evaluate(()=>ownedIds.includes('resonator:1')),false);assert.deepEqual(await page.evaluate(()=>accountData.Qingxiao),seed.Qingxiao);
   // Every new screen at phone, tablet and desktop widths.
   for(const width of [320,720,1152]){
    await page.setViewportSize({width,height:1122});
    for(const screen of ['weap','echo','resources','planner','daily','more']){
     if(['weap','echo','resources'].includes(screen))await page.evaluate(screen=>{currentView='account';accountTab=screen;render();},screen);else await page.evaluate(screen=>{currentView=screen;render();},screen);
     assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),true,`${language} ${screen} ${width}`);
    }
   }
   fs.mkdirSync(path.join(root,'test-results'),{recursive:true});await page.screenshot({path:path.join(root,'test-results',`${language}-features.png`),fullPage:true});
   // Malformed legacy JSON stays untouched and does not prevent backup access.
   await page.evaluate(()=>localStorage.setItem('wwc_account_data','{broken'));
   await page.reload();await nav('more');
   assert.equal(await page.locator('[data-action="export"]').count(),1);
   assert.equal(await page.evaluate(()=>localStorage.getItem('wwc_account_data')),'{broken');
   assert.deepEqual(errors,[]);await context.close();
  }
  console.log('PASS: FR/EN weapon copies/edit/equip/unequip, shared level/rank, stale-copy rejection, linked restore, picker geometry, resources unknown/zero, equipped Echo, goals/current separation, active switch/pause, real backup download/import, invalid backup, quota rollback, durable removal, 36 screen/width cases.');
 }finally{await browser.close();server.close();}
})().catch(e=>{console.error(e);server.close();process.exitCode=1;});
