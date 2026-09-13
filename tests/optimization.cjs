const {chromium}=require('playwright'),assert=require('node:assert/strict'),path=require('node:path');
const {startServer,seedPage,root}=require('./support.cjs');
(async()=>{const {server,base}=await startServer(),browser=await chromium.launch({headless:true,channel:'msedge'});
try{for(const lang of ['fr','en']){
 const ctx=await browser.newContext({viewport:{width:720,height:1000},serviceWorkers:'block'}),page=await ctx.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));await seedPage(page,lang);await page.goto(base);await page.locator('.res-row').first().waitFor();
 await page.evaluate(()=>CompanionStore.update(s=>{s.active='resonator:2';s.teams=[{id:'t',name:'Favorite',favorite:true,members:['resonator:1413','resonator:1','resonator:3']}];s.goals['resonator:1413']={level:20,skills:{},priorities:{}};s.characters['resonator:1413']={level:1,ascension:0};s.resources['2']=10000;}));
 const result=await page.evaluate(()=>{
  const order=accountPriorities(CompanionStore.get(),DATA).map(r=>r.character.id),allocation=allocatePlanCosts([{id:'a',costs:{2:60,3:2}},{id:'b',costs:{2:60,3:3}}],{'2':100},null);
  return {order,allocation};
 });assert.equal(result.order[0],'resonator:2');assert.equal(result.allocation.plans[0].allocation[0].reserved,60);assert.equal(result.allocation.plans[1].allocation[0].reserved,40);assert.equal(result.allocation.plans[1].allocation[0].missing,20);assert.equal(result.allocation.rows.find(r=>r.id==='3').remaining,null);
 await page.locator('[data-view="more"]:visible').click();await page.locator('[data-action="more-tab"][data-value="optimize"]').click();assert.equal(await page.locator('.optimization-card h3').first().innerText(),'Test 2');
 await page.locator('[data-action="analyze-account"]').click();await page.waitForFunction(()=>!optimizationBusy);assert.ok(await page.locator('.optimization-card details').count()>0);assert.equal(await page.evaluate(()=>CompanionStore.get().resources['2']),10000,'Proposal never spends resources');
 await page.locator('#optimizationSearch input').fill('Qingxiao');await page.locator('#optimizationSearch button').click();assert.equal(await page.locator('.optimization-card').count(),1);
 for(const width of [320,720,1152]){await page.setViewportSize({width,height:1000});assert.equal(await page.locator('#view').evaluate(e=>e.scrollWidth>e.clientWidth+1),false);if(lang==='fr')await page.screenshot({path:path.join(root,`test-results/optimization-${width}.png`)});}
 await page.locator('[data-action="wish-plan"]').click();assert.equal(await page.locator('#planningCharacter').inputValue(),'resonator:1413');
 // A failed second history write aborts the entire transaction, including the first.
 assert.equal(await page.evaluate(async()=>{const original=IDBObjectStore.prototype.put;IDBObjectStore.prototype.put=function(value){if(value.owner==='FAIL')throw Error('Test quota failure');return original.call(this,value);};try{await PullStore.merge([{owner:'ROLLBACK TEST',rows:[]},{owner:'FAIL',rows:[]}]);return false;}catch{return (await PullStore.all()).length===0;}finally{IDBObjectStore.prototype.put=original;}}),true);
 assert.deepEqual(errors,[]);await ctx.close();
}console.log('PASS: explicit team/active priority, shared resource allocation, unknown stocks, bilingual account analysis, no spending, search/navigation, responsive layouts and atomic history rollback.');}
finally{await browser.close();server.close();}})().catch(e=>{console.error(e);process.exitCode=1;});
