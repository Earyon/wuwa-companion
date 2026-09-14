// Collection-phase UI, real bundled game references, synthetic personal state.
// Remote services are blocked: screenshots do not certify artwork/network latency.
const {chromium}=require('playwright'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const {startServer,root}=require('./support.cjs'),catalogue=require('../data/catalogue.json');
(async()=>{
 const {server,base}=await startServer(),browser=await chromium.launch({headless:true,channel:'msedge'});
 const metrics=[];
 try{
  for(const language of ['fr','en']){
   const context=await browser.newContext({viewport:{width:1152,height:800},serviceWorkers:'block'}),page=await context.newPage(),errors=[];
   let catalogueRequests=0;page.on('pageerror',e=>errors.push(e.message));await page.route('https://**/*',route=>{if(route.request().url().endsWith('/en/new'))return route.fulfill({contentType:'application/json',body:JSON.stringify([{GameVer:'3.6.0',ResVer:'3.6.6'},{character:[1212,1413]}])});if(/\/en\/(character|weapon)$/.test(route.request().url()))catalogueRequests++;return route.abort();});
   await page.addInitScript(({catalogue,language})=>{
    if(localStorage.getItem('collection-test'))return;localStorage.setItem('collection-test','1');localStorage.setItem('wwc_tutorial_v1','seen');
    localStorage.setItem('wwc_lang',language);localStorage.setItem('wwc_owned_ids',JSON.stringify(['resonator:1108','resonator:1102','resonator:1203']));
    localStorage.setItem('wwc_catalog_canonical_v050',JSON.stringify({...catalogue,state:{gameVersion:catalogue.gameVersion,resourceVersion:'3.6.6'}}));
    localStorage.setItem('wwc_account_data',JSON.stringify({Hiyuki:{level:90,sequence:2,skills:{'Normal Attack':6},forteNodes:{'node:876':false}}}));
   },{catalogue,language});
   const start=Date.now();await page.goto(base);await page.locator('.res-row').first().waitFor();metrics.push({language,initialCollectionMs:Date.now()-start});
   assert.equal(await page.locator('[data-view="planner"]:visible,[data-view="daily"]:visible').count(),0);
   await page.waitForFunction(()=>catalogState.lastChecked);assert.equal(catalogueRequests,0,'Actual version response does not reload matching catalogues');
   const initialRoster=await page.evaluate(()=>[...CompanionStore.get().roster]),choices=await page.evaluate(()=>DATA.filter(c=>!ownedIds.includes(c.id)).slice(0,2).map(c=>({id:c.id,label:gameLabel(c)})));
   const selectBatch=async()=>{await page.locator('[onclick="openSelector()"]').click();for(const c of choices){await page.locator('#selectorQ').fill(c.label);await page.locator(`[data-select-resonator="${c.id}"]`).click();}assert.match(await page.locator('#selectorCount').innerText(),/^2 /);};
   await selectBatch();await page.locator('#selectorClose').click();assert.deepEqual(await page.evaluate(()=>CompanionStore.get().roster),initialRoster);
   await selectBatch();await page.locator('#selectorSave').click();assert.deepEqual(await page.evaluate(()=>CompanionStore.get().roster),[...initialRoster,...choices.map(c=>c.id)]);
   await page.evaluate(()=>{currentView='planner';render();});assert.equal(await page.evaluate(()=>currentView),'account');
   await page.locator('.res-row').filter({hasText:'Hiyuki'}).locator('.edit-chevron').click();await page.locator('#editor-tab-forte').click();
   await page.waitForFunction(()=>document.querySelectorAll('.talent-node').length===15);
   await page.waitForFunction(()=>[...document.querySelectorAll('.talent-symbol img')].every(i=>i.complete&&i.naturalWidth>0));
   assert.equal(await page.locator('.talent-branch.is-linked').count(),5,'All links derive from source parents');
   const record=await page.evaluate(()=>CompanionStore.exportData().records);
   for(const [width,height]of [[320,700],[720,1122],[720,450],[1152,800],[1536,960]]){
    await page.setViewportSize({width,height});
    await page.evaluate(()=>new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r))));
    const geometry=await page.evaluate(()=>{
     const selectors=['.account-editor-sheet','.editor-stage','.talent-board','.talent-detail'];
     const overflow=selectors.filter(s=>{const e=document.querySelector(s);return e.scrollWidth>e.clientWidth+1;});
     const footer=document.querySelector('.editor-actions').getBoundingClientRect();
     const stage=document.getElementById('editorStage').getBoundingClientRect(),nodes=[...document.querySelectorAll('.talent-node,.talent-extras button')];
     const overlap=nodes.flatMap((a,i)=>nodes.slice(i+1).flatMap(b=>{const x=a.getBoundingClientRect(),y=b.getBoundingClientRect();return Math.min(x.right,y.right)-Math.max(x.left,y.left)>1&&Math.min(x.bottom,y.bottom)-Math.max(x.top,y.top)>1?[a.dataset.talent+' / '+b.dataset.talent]:[];}));
     return {overlap,overflow,footerVisible:footer.bottom<=innerHeight+1,touch:[...document.querySelectorAll('.talent-symbol')].every(e=>e.getBoundingClientRect().width>=44),allVisible:nodes.every(e=>{const r=e.getBoundingClientRect();return r.top>=stage.top&&r.bottom<=stage.bottom+1&&r.left>=stage.left&&r.right<=stage.right;})};
    });if(geometry.overlap.length||!geometry.allVisible){console.log(await page.locator('.talent-node,.talent-extras button').evaluateAll(nodes=>nodes.map(e=>({key:e.dataset.talent,x:e.getBoundingClientRect().x,y:e.getBoundingClientRect().y,w:e.getBoundingClientRect().width,h:e.getBoundingClientRect().height}))));await page.screenshot({path:path.join(root,'test-results/collection-overlap.png')});}assert.deepEqual(geometry,{overlap:[],overflow:[],footerVisible:true,touch:true,allVisible:true},`${language} ${width}x${height}`);
    if(width===320||width===1152)await page.screenshot({path:path.join(root,'test-results',`collection-tree-${language}-${width}.png`)});
   }
   await page.setViewportSize({width:1152,height:800});
   await page.locator('#editor-tab-overview').click();await page.waitForFunction(()=>document.getElementById('editorPortrait').complete&&document.getElementById('editorPortrait').naturalWidth>0);
   if(language==='fr')await page.screenshot({path:path.join(root,'test-results/collection-attributes-fr.png')});
   await page.locator('#editor-tab-weapon').click();await page.locator('#weaponCurrent').click();await page.locator('#weaponGrid button').first().click();await page.waitForFunction(()=>document.querySelector('#weaponCurrent img')?.complete&&document.querySelector('#weaponCurrent img')?.naturalWidth>0);
   if(language==='fr')await page.screenshot({path:path.join(root,'test-results/collection-weapon-fr.png')});
   await page.locator('#editor-tab-sequence').click();await page.waitForFunction(()=>[...document.querySelectorAll('.sequence-icon')].every(i=>i.complete&&i.naturalWidth>0));
   const controlsVisible=selector=>page.locator(selector).evaluateAll(nodes=>{const s=document.getElementById('editorStage').getBoundingClientRect();return nodes.every(e=>{const r=e.getBoundingClientRect();return r.top>=s.top&&r.bottom<=s.bottom&&r.left>=s.left&&r.right<=s.right;});});
   assert.equal(await controlsVisible('.seq-btn'),true,'All chain choices fit the desktop panel');
   if(language==='fr')await page.screenshot({path:path.join(root,'test-results/collection-chain-fr.png')});
   await page.locator('#editor-tab-echo').click();await page.waitForFunction(()=>extendedCatalog.echo.length===311);
   assert.ok(await page.evaluate(()=>JSON.parse(localStorage.getItem('wwc_extra_catalog_v1:echo')).payload.Echo.every(e=>e.Icon.startsWith('https://'))),'Echo cache retains source URLs independently of local artwork');
   await page.evaluate(()=>{editingEchoes.after.push({id:'VISUAL_TEST_ECHO',catalogId:'6000038',name:'TEST',owner:'resonator:1108',slot:1,level:0,cost:1,quality:5,setId:null,main:null,secondary:null,substats:[]});drawEditorEchoes();});
   await page.waitForFunction(()=>document.querySelector('.echo-artwork')?.complete&&document.querySelector('.echo-artwork')?.naturalWidth>0);
   assert.equal(await controlsVisible('.echo-slot'),true,'Five equipped Echo slots fit the desktop panel');
   if(language==='fr')await page.screenshot({path:path.join(root,'test-results/collection-echo-fr.png')});
   await page.locator('#editor-tab-forte').click();
   await page.locator('[data-talent="core:Normal Attack"]').click();await page.locator('[data-skill-level]').selectOption('8');
   await page.locator('[data-skill-step="1"]').click();assert.equal(await page.locator('[data-skill-level]').inputValue(),'9');await page.locator('[data-skill-step="-1"]').click();assert.equal(await page.locator('[data-skill-level]').inputValue(),'8');
   await page.locator('[data-talent="node:876"]').click();await page.locator('[data-talent-state="yes"]').click();
   assert.deepEqual(await page.evaluate(()=>CompanionStore.exportData().records),record,'Draft does not write before Save');
   await page.locator('[data-talent-back]').click();
   await page.locator('[data-editor-character="resonator:1102"]').click();await page.locator('#editorSwitchPrompt').waitFor();await page.locator('[data-switch-choice="stay"]').click();
   assert.equal(await page.evaluate(()=>editingName),'Hiyuki');
   await page.locator('[data-editor-character="resonator:1102"]').click();await page.locator('[data-switch-choice="save"]').click();
   await page.waitForFunction(()=>editingName==='Sanhua'&&!!editingCharacterDetail);
   assert.equal(await page.locator('#editor-tab-forte').getAttribute('aria-selected'),'true');
   assert.equal(await page.evaluate(()=>CompanionStore.get().characters['resonator:1108'].skills['Normal Attack']),8);
   assert.equal(await page.evaluate(()=>CompanionStore.get().characters['resonator:1108'].forteNodes['node:876']),true);
   await page.locator('#editorClose').click();await page.reload();await page.locator('.res-row').first().waitFor();
   await page.locator('[data-view="ency"]:visible').click();await page.locator('#q').fill('Hiyuki');await page.locator('.char-card').click();
   await page.locator('[data-action="profile-tab"][data-value="skills"]').click();await page.waitForFunction(()=>document.querySelectorAll('.kit-skill').length>0);
   assert.equal(await page.locator('[data-value="build"],[data-value="teams"],[data-action="profile-wish"],[data-action="profile-improve"]').count(),0);
   if(language==='fr')assert.match(await page.locator('#profileSection').innerText(),/Art de la lame de sakura en flammes/);
   await page.keyboard.press('Escape');await page.locator('[data-action="ency-kind"][data-value="weapon"]').click();
   await page.locator('#librarySearch [name="query"]').fill('not-a-real-name');await page.locator('#librarySearch [name="type"]').selectOption('Pistols');
   assert.ok(await page.locator('.library-item').count()>0,'Type filter applies immediately without applying draft text');
   assert.equal(await page.evaluate(()=>libraryQuery),'');await page.locator('#librarySearch button').click();assert.equal(await page.locator('.library-item').count(),0);
   await page.locator('#librarySearch [name="query"]').fill('');await page.locator('#librarySearch button').click();await page.locator('.library-item').first().click();
   await page.waitForFunction(()=>!!profileSources.get(profileKey(profileSelection))?.data?.Desc);assert.equal(await page.locator('.profile-stats>div').count(),2);
   await page.keyboard.press('Escape');const preserved=await page.evaluate(()=>CompanionStore.exportData().records);
   await page.evaluate(catalogue=>localStorage.setItem(CATALOG_CACHE_KEY,JSON.stringify({...catalogue,state:{gameVersion:null,resourceVersion:null}})),catalogue);
   await page.reload();await page.locator('.res-row').first().waitFor();assert.equal(await page.evaluate(()=>catalogState.gameVersion),'3.6.0');assert.deepEqual(await page.evaluate(()=>CompanionStore.exportData().records),preserved,'Old unversioned optional cache is repaired without resetting the account');
   const images=await page.evaluate(()=>DATA.map(c=>c.image));await page.evaluate(()=>{useCatalogueAssets();useCatalogueAssets();});assert.deepEqual(await page.evaluate(()=>DATA.map(c=>c.image)),images,'Resolving local artwork is idempotent');
   await page.route('https://api-v2.encore.moe/api/en/character',r=>r.fulfill({json:{roleList:catalogue.characters.map(c=>({Id:Number(c.gameId),Name:c.name,QualityId:c.rarity,WeaponType:{Name:c.weapon},Element:{Name:c.element},RoleHeadIconCircle:c.image}))}}));
   await page.route('https://api-v2.encore.moe/api/en/weapon',r=>r.fulfill({json:{weapons:catalogue.weapons.map(w=>({Id:Number(w.gameId),Name:w.name,QualityId:w.rarity,WeaponType:{Name:w.type},Icon:w.image}))}}));
   await page.evaluate(()=>refreshCanonicalCatalog({force:true}));assert.ok(await page.evaluate(()=>JSON.parse(localStorage.getItem(CATALOG_CACHE_KEY)).characters.every(c=>c.image.startsWith('https://'))),'Persist canonical source paths before resolving display artwork');
   await page.reload();await page.locator('.res-row').first().waitFor();await page.waitForFunction(()=>[...document.querySelectorAll('.res-row>img')].every(i=>i.complete&&i.naturalWidth>0));assert.deepEqual(await page.evaluate(()=>CompanionStore.exportData().records),preserved,'Forced catalogue refresh and reload preserve the account');
   assert.deepEqual(errors,[]);await context.close();
  }
  fs.writeFileSync(path.join(root,'test-results/collection-metrics.json'),JSON.stringify(metrics,null,2));
  console.log('PASS: Collection phase FR/EN; real source tree mapping, tablet/small layouts, explicit draft/save/switch/reload, encyclopedia reference and hidden future features.');
 }finally{await browser.close();server.close();}
})().catch(error=>{console.error(error);process.exitCode=1;});
