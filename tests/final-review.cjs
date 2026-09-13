// Actual UI, isolated synthetic account. No requests to a user's browser or profile.
const {chromium}=require('playwright'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const {startServer,seedPage,root}=require('./support.cjs');
(async()=>{
 const {server,base}=await startServer(),browser=await chromium.launch({headless:true,channel:'msedge'}),metrics=[];
 try{
  for(const language of ['fr','en']){
   const ctx=await browser.newContext({viewport:{width:720,height:1100},serviceWorkers:'block',hasTouch:true}),p=await ctx.newPage(),errors=[];
   p.on('pageerror',e=>errors.push(e.message));await seedPage(p,language);await p.goto(base);await p.locator('.res-row').first().waitFor();
   const nav=async view=>p.locator(`[data-view="${view}"]:visible`).click();
   assert.equal(await p.locator('html').getAttribute('lang'),language);
   assert.equal(await p.locator('#ownedSearch').getAttribute('aria-label'),language==='fr'?'Rechercher un Résonateur…':'Search a Resonator…');
   for(const width of [320,720,1152]){
    await p.setViewportSize({width,height:1000});await p.evaluate(()=>new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r))));
    assert.ok(await p.locator('.trash-btn').first().evaluate(e=>e.clientWidth>=42&&e.clientHeight>=42));
    assert.equal(await p.locator('.main').evaluate(e=>e.scrollWidth>e.clientWidth+1),false);
    if(language==='fr')await p.screenshot({path:path.join(root,`test-results/final-account-${width}.png`)});
   }
   await p.setViewportSize({width:720,height:1100});await nav('ency');const card=p.locator('.char-card').first();assert.equal(await card.evaluate(e=>e.tagName),'BUTTON');await card.focus();await p.keyboard.press('Enter');await p.locator('#detail[open]').waitFor();await p.keyboard.press('Escape');assert.equal(await card.evaluate(e=>e===document.activeElement),true);
   await p.evaluate(()=>{profileSources.clear();localStorage.setItem('wwc_profile_detail_v1:en:character:resonator:1413',JSON.stringify({version:'test',data:{Id:1413,Skills:{broken:true},Properties:[]}}));});
   await p.evaluate(async()=>{const old=lang;lang='en';await loadProfileSource({kind:'character',id:'resonator:1413'});lang=old;});
   assert.equal(await p.evaluate(()=>Array.isArray(profileSources.get('en:character:resonator:1413').data.Skills)),true,'Malformed optional cache must be replaced');
   await nav('more');await p.locator('#preferencesForm select').selectOption('daily');await p.locator('#preferencesForm button').click();await p.reload();await p.waitForFunction(()=>currentView==='daily'&&document.getElementById('pageTitle').textContent===t('daily'));
   await nav('more');await p.locator('[data-action="language"][data-value="'+(language==='fr'?'en':'fr')+'"]').click();assert.equal(await p.locator('html').getAttribute('lang'),language==='fr'?'en':'fr');await p.locator('[data-action="language"][data-value="'+language+'"]').click();
   await p.locator('[data-action="more-tab"][data-value="tracker"]').click();await p.waitForFunction(()=>trackerAccounts!==null);await p.locator('summary').first().click();
   const target=p.locator('#pullTargetForm'),budget=p.locator('#pullBudgetForm');
   await target.locator('[name="targetSequence"]').selectOption('6');await target.locator('button').click();assert.equal(await budget.locator('[name="characters"]').inputValue(),'1','Unknown sequence cannot be interpreted as S0');
   await target.locator('[name="currentSequence"]').selectOption('-1');await target.locator('[name="currentRank"]').selectOption('1');await target.locator('[name="targetRank"]').selectOption('5');await target.locator('button').click();assert.equal(await budget.locator('[name="characters"]').inputValue(),'7');assert.equal(await budget.locator('[name="weapons"]').inputValue(),'4');
   await target.locator('[name="currentSequence"]').selectOption('3');await target.locator('button').click();assert.equal(await budget.locator('[name="characters"]').inputValue(),'3');assert.equal(await p.evaluate(()=>CompanionStore.get().settings.pullBudget),undefined,'Target helper prepares without saving');
   // A slow first file must never replace the latest chosen file's preview.
   await p.evaluate(()=>{const original=File.prototype.text;File.prototype.text=async function(){if(this.name==='slow.json')await new Promise(r=>setTimeout(r,250));return original.call(this);};});
   const profile=value=>Buffer.from(JSON.stringify({id:'TEST',items:[{id:3,value}],achievements:[],todos:[]}));
   await p.locator('#trackerFile').setInputFiles({name:'slow.json',mimeType:'application/json',buffer:profile(10)});await p.locator('#trackerFile').setInputFiles({name:'fast.json',mimeType:'application/json',buffer:profile(20)});await p.waitForFunction(()=>trackerPending?.data.resources['3']===20);await p.waitForTimeout(350);assert.equal(await p.evaluate(()=>trackerPending.data.resources['3']),20);
   await p.locator('[data-action="cancel-tracker"]').click();
   // Delayed import completing after navigation has no visible or stored effect.
   await p.locator('#trackerFile').setInputFiles({name:'slow.json',mimeType:'application/json',buffer:profile(30)});await nav('account');await p.waitForTimeout(350);assert.equal(await p.evaluate(()=>trackerPending),null);assert.equal(await p.evaluate(()=>CompanionStore.get().resources['3']),undefined);
   // Shared catalogue searches preserve the selected entry and every other field.
   await p.evaluate(()=>{extendedCatalog.echo=[{id:'e1',name:'Echo One',label:'Echo One',sets:[{id:'s1',name:'First Sonata'}]},{id:'e2',name:'Echo Two',label:'Echo Two',sets:[{id:'s2',name:'Second Sonata'}]}];extendedCatalog.errors.echo=false;openProfile('character','resonator:1413');profileTab='build';renderProfileSection();companionActions['new-build']('resonator:1413');});
   const build=p.locator('#buildForm');await build.locator('[name="name"]').fill('TEST ONLY');await build.locator('[name="echoId"]').selectOption('e1');await build.locator('[name="catalogueQuery"]').fill('Two');assert.equal(await build.locator('[name="echoId"]').inputValue(),'e1');assert.equal(await build.locator('[name="name"]').inputValue(),'TEST ONLY');await build.locator('[name="echoId"]').selectOption('e2');await build.locator('[name="catalogueQuery"]').fill('no result');assert.equal(await build.locator('[name="echoId"]').inputValue(),'e2');
   await p.keyboard.press('Escape');
   // Read-only navigation has bounded game requests; it never reloads detail per tab.
   let requests=0;p.on('request',r=>{if(r.url().includes('/character/'))requests++;});
   await p.evaluate(()=>openProfile('character','resonator:1413'));await p.waitForFunction(()=>profileSources.has(profileKey(profileSelection)));const before=requests;
   for(const key of ['skills','sequence','overview'])await p.locator(`[data-action="profile-tab"][data-value="${key}"]`).click();assert.equal(requests,before);
   await p.keyboard.press('Escape');await nav('more');await p.locator('[data-action="more-tab"][data-value="settings"]').click();
   for(const width of [320,720,1152]){await p.setViewportSize({width,height:1000});assert.equal(await p.locator('#view').evaluate(e=>e.scrollWidth>e.clientWidth+1),false);if(language==='fr')await p.screenshot({path:path.join(root,`test-results/final-settings-${width}.png`)});}
   assert.deepEqual(errors,[]);await ctx.close();
  }
  const securityContext=await browser.newContext({serviceWorkers:'block'}),securityPage=await securityContext.newPage();await seedPage(securityPage);await securityPage.goto(base);await securityPage.locator('.res-row').first().waitFor();
  await securityPage.evaluate(()=>{DATA[0].image='missing" onerror="window.__injected=1';render();});
  assert.equal(await securityPage.locator('.res-row img').first().getAttribute('onerror'),null,'Remote image attributes are escaped');assert.equal(await securityPage.evaluate(()=>window.__injected),undefined);
  // Refresh finishing during an edit preserves the actual input element and text.
  await securityPage.evaluate(()=>{window.__refresh=refreshCanonicalCatalog;refreshCanonicalCatalog=()=>new Promise(resolve=>{window.__finishRefresh=resolve;});bootstrapCanonicalCatalog();});
  await securityPage.locator('#ownedSearch').fill('Qingxiao');await securityPage.evaluate(()=>{window.__input=document.getElementById('ownedSearch');window.__finishRefresh({changed:true});});
  assert.equal(await securityPage.evaluate(()=>window.__input===document.getElementById('ownedSearch')&&document.getElementById('ownedSearch').value==='Qingxiao'),true);
  await securityPage.evaluate(()=>{refreshCanonicalCatalog=window.__refresh;delete window.__refresh;});
  // A hanging response is aborted instead of leaving an indefinite loader.
  await securityPage.clock.install();await securityPage.evaluate(()=>{window.__fetch=fetch;window.fetch=(url,options)=>url==='/never'?new Promise((resolve,reject)=>options.signal.addEventListener('abort',()=>reject(new DOMException('Aborted','AbortError')))):window.__fetch(url,options);window.__timeoutResult=fetchJSON('/never').then(()=>false,e=>e.name==='AbortError');});
  await securityPage.clock.fastForward(15001);assert.equal(await securityPage.evaluate(()=>window.__timeoutResult),true);await securityContext.close();
  // Cold offline startup: settings and personal export stay accessible.
  const ctx=await browser.newContext({serviceWorkers:'block'}),p=await ctx.newPage();await p.route('https://**/*',r=>r.abort());await p.goto(base);await p.locator('[data-action="retry-start"]').waitFor();await p.locator('[data-action="more-tab"]').click();assert.equal(await p.locator('[data-action="export"]').count(),1);await p.locator('[data-action="check-update"]').click();assert.match(await p.locator('#pwaStatus').innerText(),/indisponible/);await ctx.close();
  // Repeatable local cached-catalogue launch timings; not physical-device/network claims.
  for(let i=0;i<5;i++){
   const c=await browser.newContext({serviceWorkers:'block'}),p=await c.newPage();await seedPage(p);let external=0;p.on('request',r=>{if(r.url().startsWith('https://'))external++;});await p.goto(base);await p.locator('.res-row').first().waitFor();await p.waitForFunction(()=>catalogState.lastChecked);
   metrics.push(await p.evaluate(()=>({domReady:Math.round(performance.getEntriesByType('navigation')[0].domContentLoadedEventEnd),scripts:performance.getEntriesByType('resource').filter(r=>r.initiatorType==='script').length})));assert.equal(external,1,'Cached startup only checks the catalogue version');await c.close();
  }
  fs.writeFileSync(path.join(root,'test-results/final-metrics.json'),JSON.stringify(metrics,null,2));console.log('PASS: final FR/EN keyboard/touch/settings, target copies, malformed cache, import races, source search, offline first launch and bounded requests.',metrics);
 }finally{await browser.close();server.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
