// First launch and help replay in isolated profiles, without real account login.
const {chromium}=require('playwright'),assert=require('node:assert/strict');
const {startServer}=require('./support.cjs');
(async()=>{
 const {server,base}=await startServer(),browser=await chromium.launch({headless:true,channel:'msedge'});
 try{for(const language of ['fr','en']){
  const context=await browser.newContext({viewport:{width:320,height:700},serviceWorkers:'block'}),page=await context.newPage();
  await page.route('https://**/*',r=>r.abort());await page.addInitScript(lang=>localStorage.setItem('wwc_lang',lang),language);
  await page.goto(base);await page.locator('#tutorial[open]').waitFor();
  assert.equal(await page.locator('#tutorial').evaluate(e=>e.scrollWidth>e.clientWidth+1),false);
  await page.locator('[data-action="tutorial-skip"]').click();assert.equal(await page.evaluate(()=>localStorage.getItem('wwc_tutorial_v1')),'seen');
  await page.reload();await page.locator('[onclick="openSelector()"]').waitFor();assert.equal(await page.locator('#tutorial[open]').count(),0);
  await page.locator('[data-view="more"]:visible').click();await page.locator('[data-action="tutorial-replay"]').click();
  for(let i=0;i<4;i++){assert.match(await page.locator('#tutorial .editor-eyebrow').innerText(),new RegExp((i+1)+' / 5'));await page.locator('[data-action="tutorial-next"]').click();}
  await page.locator('[data-action="tutorial-previous"]').click();assert.match(await page.locator('#tutorial .editor-eyebrow').innerText(),/4 \/ 5/);
  await page.locator('[data-action="tutorial-next"]').click();await page.locator('[data-action="tutorial-next"]').click();assert.equal(await page.locator('#tutorial[open]').count(),0);
  await page.locator('[data-action="tutorial-replay"]').click();await page.keyboard.press('Escape');assert.equal(await page.locator('#tutorial[open]').count(),0);
  await context.close();
 }console.log('PASS: first-launch tutorial FR/EN, skip, no repeat, settings replay, previous/next/finish and Escape. Import launch is covered by features.');}
 finally{await browser.close();server.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
