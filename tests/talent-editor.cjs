// Actual local references for every character; isolated synthetic account.
const {chromium}=require('playwright'),assert=require('node:assert/strict'),path=require('node:path');
const {startServer,root}=require('./support.cjs'),catalogue=require('../data/catalogue.json');
(async()=>{
 const {server,base}=await startServer(),browser=await chromium.launch({headless:true,channel:'msedge'});let references=0,layouts=0;
 try{for(const language of ['fr','en']){
  const context=await browser.newContext({viewport:{width:720,height:1122},hasTouch:true,serviceWorkers:'block'}),page=await context.newPage(),errors=[];
  page.on('pageerror',e=>errors.push(e.message));await page.route('https://**/*',r=>r.abort());
  await page.addInitScript(({language,catalogue})=>{localStorage.setItem('wwc_lang',language);localStorage.setItem('wwc_tutorial_v1','seen');localStorage.setItem('wwc_owned_ids',JSON.stringify(catalogue.characters.map(c=>c.id)));}, {language,catalogue});
  await page.goto(base);await page.locator('.res-row').first().waitFor();
  for(const character of catalogue.characters){
   await page.evaluate(name=>openAccountEditor(name,'forte'),character.name);
   await page.waitForFunction(id=>String(editingCharacterDetail?.Id)===id,character.gameId);
   const source=await page.evaluate(()=>({nodes:talentEntries().length,keys:new Set(talentEntries().map(e=>e.key)).size,linked:document.querySelectorAll('.talent-branch.is-linked').length,unplaced:talentEntries().filter(e=>e.branch<0).length,cores:editingSkillDefs.length}));
   assert.deepEqual(source,{nodes:15,keys:15,linked:5,unplaced:0,cores:5},language+' '+character.name);references++;
  }
  await page.evaluate(()=>openAccountEditor('Hiyuki','forte'));await page.waitForFunction(()=>editingCharacterDetail?.Id===1108);
  // Independent visual reference: approximate centers measured on frame 112 s
  // of the user's 1724 × 1080 recording, not calculated from our layout object.
  await page.setViewportSize({width:1724,height:1080});
  await page.evaluate(()=>new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r))));
  const referenceCenters=[[418,854],[623,732],[866,688],[1106,732],[1307,854]];
  const centers=await page.locator('.talent-core').evaluateAll(nodes=>nodes.map(e=>{const r=e.getBoundingClientRect();return[r.x+r.width/2,r.y+r.height/2];}));
  centers.forEach((p,i)=>p.forEach((n,j)=>assert.ok(Math.abs(n-referenceCenters[i][j])<7,`Recorded game center ${i}, axis ${j}: ${n}`)));
  await page.evaluate(()=>{for(const type of SKILL_ORDER)editingSkills[type]=6;for(const node of editingForteDefs)editingForteNodes[node.key]=true;drawTalentEditor();});
  await page.waitForFunction(()=>[...document.querySelectorAll('[data-official-icon]')].every(i=>i.complete&&i.naturalWidth>0));
  if(language==='fr')await page.screenshot({path:path.join(root,'test-results/game-reference-tree-fr.png')});
  await page.locator('[data-talent="core:Normal Attack"]').click();
  assert.equal(await page.locator('#editorTabs').isVisible(),false,'Source detail mode hides both rails');
  assert.equal(await page.locator('#editorRoster').isVisible(),false);
  assert.ok(await page.locator('#talentDetail .game-text-title').count()>0,'Official title formatting retained');
  assert.ok(await page.locator('#talentDetail .game-text-glacio').count()>0,'Official element formatting retained');
  if(language==='fr')await page.screenshot({path:path.join(root,'test-results/game-reference-detail-fr.png')});
  const safe=await page.evaluate(()=>{const holder=document.createElement('div');holder.innerHTML=gameRichText('<color=Title>A</color><img src=x onerror=alert(1)><script>alert(1)</script><te href=javascript:alert(1)>term</te>');return{unsafe:holder.querySelectorAll('script,img,a,[onerror]').length,text:holder.textContent};});
  assert.equal(safe.unsafe,0);assert.equal(safe.text,'Aalert(1)term');
  await page.locator('[data-talent-back]').click();
  for(const [width,height]of [[320,700],[360,640],[679,800],[680,800],[720,1122],[720,450],[1152,800]]){
   await page.setViewportSize({width,height});
   for(const selection of ['core:Normal Attack','skill:1005204','node:876','extra:1005210']){
    await page.evaluate(key=>{talentSelection=key;drawTalentEditor();},selection);await page.evaluate(()=>new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r))));
    const geometry=await page.evaluate(()=>{
     const stage=document.getElementById('editorStage'),board=document.querySelector('.talent-board'),detail=document.getElementById('talentDetail'),r=stage.getBoundingClientRect();
     const nodes=[...document.querySelectorAll('.talent-node,.talent-extras button')].filter(e=>e.getClientRects().length),overflow=[stage,board,detail].filter(e=>e.getClientRects().length&&e.scrollWidth>e.clientWidth+1).map(e=>e.className);
     const overlap=nodes.flatMap((a,i)=>nodes.slice(i+1).flatMap(b=>{const x=a.getBoundingClientRect(),y=b.getBoundingClientRect();return Math.min(x.right,y.right)-Math.max(x.left,y.left)>1&&Math.min(x.bottom,y.bottom)-Math.max(x.top,y.top)>1?[a.dataset.talent+' / '+b.dataset.talent]:[];}));
     return {overflow,overlap,detailVisible:!!detail.getClientRects().length,allNodesFit:nodes.every(e=>{const n=e.getBoundingClientRect(),top=document.elementFromPoint(n.x+n.width/2,n.y+n.height/2);return e.contains(top)&&n.left>=r.left&&n.right<=r.right&&n.top>=r.top&&n.bottom<=r.bottom+1;})};
    });
    if(geometry.overflow.length||geometry.overlap.length||!geometry.allNodesFit){await page.screenshot({path:path.join(root,'test-results/talent-selection-failure.png')});console.log({language,width,height,selection,geometry});}
    assert.deepEqual(geometry,{overflow:[],overlap:[],detailVisible:true,allNodesFit:true},`${language} ${width}x${height} ${selection}`);layouts++;
    if(language==='fr'&&selection==='core:Normal Attack'&&(width===360||width===720))await page.screenshot({path:path.join(root,`test-results/talent-detail-${width}x${height}.png`)});
   }
  }
  await page.setViewportSize({width:720,height:450});await page.evaluate(()=>{talentSelection='skill:1005204';drawTalentEditor();});await page.evaluate(()=>new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r))));
  const positions=()=>page.locator('.talent-node').evaluateAll(nodes=>nodes.map(e=>e.getBoundingClientRect().top));
  const before=await positions();await page.locator('#talentDetail .source-description').hover();await page.mouse.wheel(0,1800);await page.waitForFunction(()=>document.querySelector('#talentDetail .source-description').scrollTop>0);
  assert.deepEqual(await positions(),before,'Reading a long description leaves the tree in place');assert.equal(await page.locator('#editorStage').evaluate(e=>e.scrollTop),0);
  await page.locator('[data-talent-back]').click();assert.equal(await page.evaluate(()=>document.activeElement.dataset.talent),'skill:1005204','Back restores focus to the source node');
  await page.setViewportSize({width:360,height:640});await page.locator('[data-talent="core:Normal Attack"]').tap();
  assert.equal(await page.evaluate(()=>document.activeElement.matches('#talentDetail h3')),true,'Phone selection focuses the visible detail');
  await page.locator('[data-skill-level]').selectOption('4');await page.evaluate(()=>new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r))));
  const scroll=await page.locator('#talentDetail').evaluate(e=>{e.scrollTop=100;return e.scrollTop;});
  await page.locator('[data-skill-level]').selectOption('8');await page.evaluate(()=>new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r))));
  assert.equal(await page.locator('[data-skill-level]').inputValue(),'8');assert.equal(await page.locator('#talentDetail').evaluate(e=>e.scrollTop),scroll,'Editing a level preserves detail scroll');
  await page.locator('[data-talent-back]').click();assert.equal(await page.evaluate(()=>document.activeElement.dataset.talent),'core:Normal Attack');
  await page.locator('#editor-tab-sequence').click();
  for(const [width,height]of [[1724,1080],[720,450],[720,1122],[360,640],[1152,800]]){
   await page.setViewportSize({width,height});await page.evaluate(()=>new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r))));
   await page.locator('[data-sequence="4"]').click();
   await page.evaluate(()=>new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r))));
   assert.match(await page.locator('#sequenceDetail').innerText(),/IV/);
   if(width>=680){
    assert.equal(await page.locator('#editorTabs').isVisible(),false);
    const covered=await page.locator('.seq-btn').evaluateAll(nodes=>nodes.flatMap(e=>{const r=e.getBoundingClientRect(),top=document.elementFromPoint(r.x+r.width/2,r.y+r.height/2);return e.contains(top)?[]:[{sequence:e.dataset.sequence,by:top?.outerHTML.slice(0,160),x:r.x,y:r.y}];}));
    if(covered.length)await page.screenshot({path:path.join(root,'test-results/chain-selection-failure.png')});
    assert.deepEqual(covered,[],`Chain controls remain uncovered ${language} ${width}x${height}`);
   }
   if(language==='fr'&&width===1724)await page.screenshot({path:path.join(root,'test-results/game-reference-chain-fr.png')});
   await page.locator('#sequenceBack').click();assert.equal(await page.evaluate(()=>document.activeElement.dataset.sequence),'4');
  }
  await page.locator('#editorClose').click();assert.deepEqual(await page.evaluate(()=>CompanionStore.get().characters),{},'Review and unsaved edits do not change the account');
  assert.deepEqual(errors,[]);await context.close();
 }console.log(`PASS: ${references} real character/language trees, ${layouts} selected-detail layouts; independent scrolling, keyboard focus, preserved edits and cancellation.`);
 }finally{await browser.close();server.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
