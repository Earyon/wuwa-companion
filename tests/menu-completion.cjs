// Real source projections; synthetic account in isolated browser contexts.
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const {chromium}=require('playwright'),{startServer,root}=require('./support.cjs');
const Stats=require('../menu-stats.js'),rules=require('../data/menu-rules.json'),catalogue=require('../data/catalogue.json'),weapons=require('../data/weapons.json').weapons;
const hiyuki=require('../data/resonators/1108.json');
assert.deepEqual(hiyuki.showProperties,[2,7,10,11,8,9],'Current UI uses CommonParam RoleAttributeDisplay6, not obsolete RoleInfo.ShowProperty');
assert.equal(Stats.character(hiyuki,rules,90,null).find(p=>p.id===11).value,100);
assert.equal(Stats.character(hiyuki,rules,90,6)[0].value,10300);
assert.equal(Stats.character(hiyuki,rules,20,null)[0].value,null,'Ambiguous ascension remains unknown');
assert.notEqual(Stats.character(hiyuki,rules,20,0)[0].value,Stats.character(hiyuki,rules,20,1)[0].value);
assert.equal(Stats.character(hiyuki,rules,null,null)[0].value,null);
for(const c of catalogue.characters){const r=require('../data/resonators/'+c.gameId+'.json');for(const [level,asc]of [[1,0],[20,0],[20,1],[90,6]])assert.ok(Stats.character(r,rules,level,asc).every(p=>Number.isFinite(p.value)));for(const language of ['fr','en'])for(const skill of r.locales[language].Skills)for(const attr of skill.SkillAttributes){assert.ok(attr.Name);assert.equal(attr.Values.length,10);assert.ok(attr.Values.every(v=>v&&!/\{\d+\}|undefined|NaN/.test(v)));}}
for(const weapon of weapons){assert.ok(Stats.weapon(weapon,rules,90,6).every(p=>Number.isFinite(p.value)));for(const l of ['fr','en'])assert.ok(weapon.locales[l].ranks.every(r=>r.description&&!/\{\d+\}/.test(r.description)));}
assert.deepEqual(Stats.echoes([{level:25,main:{type:'critRate',value:22},secondary:{type:'atk',value:150},substats:[{type:'critRate',value:8.1}]},{level:25,main:{type:'atkPct',value:null},secondary:{type:'atk',value:100},substats:[]}]).values,[{type:'critRate',value:30.1},{type:'atk',value:250},{type:'atkPct',value:null}]);
(async()=>{
 const {server,base}=await startServer(),browser=await chromium.launch({headless:true,channel:'msedge'});let layouts=0;
 try{
  for(const language of ['fr','en']){
   const context=await browser.newContext({viewport:{width:1724,height:1080},serviceWorkers:'block'}),page=await context.newPage(),errors=[];
   page.on('pageerror',e=>errors.push(e.message));await page.route('https://**/*',r=>r.abort());
   await page.addInitScript(({catalogue,language})=>{if(localStorage.getItem('completion-seed'))return;localStorage.setItem('completion-seed','1');localStorage.setItem('wwc_tutorial_v1','seen');localStorage.setItem('wwc_lang',language);localStorage.setItem('wwc_owned_ids',JSON.stringify(['resonator:1108','resonator:1402']));localStorage.setItem('wwc_catalog_canonical_v050',JSON.stringify({...catalogue,state:{gameVersion:catalogue.gameVersion,resourceVersion:'3.6.6'}}));localStorage.setItem('wwc_account_data',JSON.stringify({Hiyuki:{level:90,sequence:3,skills:{'Normal Attack':6}}}));},{catalogue,language});
   await page.goto(base);await page.locator('.res-row').first().waitFor();await page.evaluate(()=>openAccountEditor('Hiyuki'));await page.waitForFunction(()=>menuRules&&currentResonatorReference()?.tags&&document.querySelectorAll('#attributeStats dd').length===6);
   await page.waitForFunction(()=>[...document.querySelectorAll('#editor-overview img')].every(i=>i.complete&&i.naturalWidth>0));
   assert.equal(await page.locator('#attributeStats').innerText().then(s=>s.includes('10000')),false);
   assert.equal(await page.evaluate(()=>menuNumber(587.5)),'587','Source AttributeModel floors whole attributes');
   assert.equal(await page.evaluate(()=>menuNumber(24.39,true)),language==='fr'?'24,3 %':'24.3 %');
   await page.locator('#attributeMore').click();await page.locator('#attributeDetail').waitFor();assert.ok(await page.locator('#attributeDetailContent').innerText());await page.keyboard.press('Escape');assert.equal(await page.locator('#accountEditor').getAttribute('open'),'');
   const record=await page.evaluate(()=>CompanionStore.exportData().records);
   await page.locator('#editor-tab-weapon').click();await page.locator('#weaponCurrent').click();await page.locator('#weaponOrder').selectOption('rarity');await page.locator('#weaponGrid button').first().click();await page.waitForFunction(()=>weaponMenuReference);
   await page.evaluate(()=>{setEditorLevel(90,true);editingWeaponAscension=6;updateEditorControls();});
   const ranks=[];for(const rank of [1,3,5]){await page.locator(`[data-weapon-rank="${rank}"]`).click();ranks.push(await page.locator('#weaponDescription>.source-description').innerText());}
   assert.notEqual(ranks[0],ranks[2]);assert.equal(await page.locator('#weaponDescription .game-stat-list dd').count(),2);
   await page.locator('#editor-tab-echo').click();await page.waitForFunction(()=>extendedCatalog.echo.length===311);
   await page.evaluate(()=>{const row=extendedCatalog.echo.find(e=>e.sets.length);for(let slot=1;slot<=2;slot++)editingEchoes.after.push({id:'MENU_TEST_'+slot,catalogId:row.id,name:row.name,owner:editingEchoes.owner,slot,quality:5,cost:1,level:25,setId:row.sets[0].id,main:{type:'atkPct',value:18},secondary:{type:'hp',value:2280},substats:[{type:'critRate',value:8.1}]});drawEditorEchoes();});
   await page.locator('[data-echo-action="tab"][data-value="attributes"]').click();assert.match(await page.locator('.echo-selected').innerText(),language==='fr'?/16,2 %/:/16\.2 %/);
   await page.locator('[data-echo-action="tab"][data-value="sonata"]').click();await page.waitForFunction(()=>sonataData&&document.querySelector('.equipped-sonata'));
   assert.equal(await page.locator('.equipped-sonata h4>span').innerText(),'1','Duplicate species does not count twice for a Sonata');assert.equal(await page.locator('.equipped-sonata .is-active').count(),0);
   await page.locator('[data-echo-action="slot"][data-value="1"]').click();await page.locator('[data-echo-action="pick"]').click();await page.locator('[data-echo-picker-cost="4"]').click();assert.equal(await page.locator('.echo-choice').count(),0);await page.locator('[data-echo-picker-cost="1"]').click();assert.equal(await page.locator('.echo-choice').count(),2);await page.keyboard.press('Escape');
   for(const [width,height]of [[1724,1080],[1152,800],[720,1122],[720,450],[360,640]]){
    await page.setViewportSize({width,height});
    for(const section of ['overview','weapon','echo','forte','sequence']){
     await page.evaluate(section=>selectEditorSection(section),section);await page.evaluate(()=>new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r))));
     const geometry=await page.evaluate(()=>{const stage=document.getElementById('editorStage'),panel=document.querySelector('.editor-panel:not([hidden])');return {stage:stage.scrollWidth<=stage.clientWidth+1,panel:panel.scrollWidth<=panel.clientWidth+1};});assert.deepEqual(geometry,{stage:true,panel:true},`${language} ${section} ${width}x${height}`);
     if(section==='echo'&&width>=680){assert.equal(await page.locator('#editor-echo .echo-slot').evaluateAll(nodes=>{const stage=document.getElementById('editorStage').getBoundingClientRect();return nodes.every(e=>{const r=e.getBoundingClientRect();return r.top>=stage.top&&r.bottom<=stage.bottom+1&&r.width>=44&&r.height>=44;});}),true,'All five touch targets visible in the equipped rail');}
     if(section==='echo'&&width===720&&height===450)assert.equal(await page.locator('.echo-slot-copy .companion-button').evaluateAll(nodes=>{const stage=document.getElementById('editorStage').getBoundingClientRect();return nodes.every(e=>{const r=e.getBoundingClientRect();return r.bottom<=stage.bottom+1&&r.top>=stage.top&&r.height>=44;});}),true,'Echo actions remain visible and touch-sized in compact landscape');
     if(language==='fr'&&[1724,720].includes(width))await page.screenshot({path:path.join(root,`test-results/menu-${section}-${width}x${height}.png`)});layouts++;
    }
    await page.evaluate(()=>selectEditorSection('forte'));await page.locator('[data-talent="core:Normal Attack"]').click();await page.locator('[data-talent-tab="details"]').click();await page.locator('[data-skill-level]').selectOption('10');
    assert.equal(await page.locator('[data-detail-level]').getAttribute('data-detail-level'),'10');assert.match(await page.locator('.talent-multipliers').innerText(),/37\.72%\+37\.72%/);
    const stable=await page.evaluate(()=>{const before=document.getElementById('talentDetail').getBoundingClientRect().height;drawTalentEditor();const after=document.getElementById('talentDetail').getBoundingClientRect().height;return Math.abs(before-after)<=1;});assert.ok(stable,'Detail height remains stable during a synchronous redraw');
    if(width>=680){await page.evaluate(()=>new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r))));const visible=await page.locator('.talent-multipliers dl>div').first().evaluate(e=>{const r=e.getBoundingClientRect(),parent=e.closest('.source-description').getBoundingClientRect();return {top:r.top,bottom:r.bottom,parentTop:parent.top,parentBottom:parent.bottom};});if(visible.bottom>visible.parentBottom)await page.screenshot({path:path.join(root,'test-results/menu-failed-detail.png')});assert.ok(visible.top>=visible.parentTop&&visible.bottom<=visible.parentBottom,`${width}x${height} first multiplier readable: ${JSON.stringify(visible)}`);}
    if(language==='fr')await page.screenshot({path:path.join(root,`test-results/menu-skill-detail-${width}x${height}.png`)});
    await page.locator('[data-talent-back]').click();
   }
   assert.deepEqual(await page.evaluate(()=>CompanionStore.exportData().records),record,'Unsaved equipment and skill changes do not touch stored data');
   await page.locator('#editorSave').click();await page.reload();await page.locator('.res-row').first().waitFor();assert.equal(await page.evaluate(()=>CompanionStore.get().characters['resonator:1108'].skills['Normal Attack']),10);
   assert.deepEqual(errors,[]);await context.close();
  }
  console.log(`PASS: ${layouts} menu layouts, 58 character and 122 weapon projections, exact per-level skill values, rank effects, unknown boundaries, Echo sums/duplicate species, filters, draft/save/reload, FR/EN.`);
 }finally{await browser.close();server.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
