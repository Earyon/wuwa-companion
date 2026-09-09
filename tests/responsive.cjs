// Runs the real application over HTTP, with isolated, synthetic catalogue data.
// No replacement DOM, no changes to the user's browser or production storage.
const { chromium } = require('playwright');
const fs = require('node:fs');
const path = require('node:path');
const http = require('node:http');
const assert = require('node:assert/strict');
const root = path.resolve(__dirname, '..');
const forteFixture=require('./fixtures/sanhua-forte.json');
const out = path.join(root, 'test-results');
fs.mkdirSync(out, { recursive: true });
const characters = Array.from({length:55}, (_,i)=>({
 id:`resonator:${i+1}`,gameId:String(i+1),name:i===0?'Qingxiao':i===1?'Aalto':i===2?'Very long resonator name for layout verification':`Test ${i+1}`,
 rarity:i===1?4:5,weapon:'Sword',element:i===1?'Spectro':'Aero',image:'/assets/icon-192.png'
}));
const weapons = Array.from({length:120}, (_,i)=>({id:`weapon:${i+1}`,gameId:String(i+1),name:i===0?'Glint of Clouds':`Test weapon ${i+1}`,type:'Sword',rarity:5,image:'/assets/icon-192.png'}));
const account = {Qingxiao:{level:90,sequence:3,weapon:{name:'Glint of Clouds',level:90,rank:1},skills:{Intro:3}},Aalto:{},[characters[2].name]:{level:90,sequence:6,weapon:{name:'Very long weapon name without clipping or hiding actions',level:90,rank:5}}};
const server=http.createServer((req,res)=>{
 const pathname=new URL(req.url,'http://localhost').pathname;
 const file=path.resolve(root,'.'+(pathname==='/'?'/index.html':pathname));
 if(!file.startsWith(root+path.sep)){res.writeHead(403).end();return;}
 fs.readFile(file,(error,data)=>{if(error){res.writeHead(404).end();return;}
 res.setHeader('Content-Type',file.endsWith('.html')?'text/html':file.endsWith('.css')?'text/css':file.endsWith('.js')?'application/javascript':'image/png');res.end(data);});
});
async function inspect(page,label){
 const failures=await page.evaluate(()=>{
  const errors=[];const rect=e=>e.getBoundingClientRect();
  const within=(a,b)=>a.left>=b.left-1&&a.right<=b.right+1&&a.top>=b.top-1&&a.bottom<=b.bottom+1;
  const overlap=(a,b)=>Math.min(a.right,b.right)-Math.max(a.left,b.left)>1&&Math.min(a.bottom,b.bottom)-Math.max(a.top,b.top)>1;
  if(document.documentElement.scrollWidth>document.documentElement.clientWidth+1)errors.push('page horizontal overflow');
  for(const row of document.querySelectorAll('.res-row')){
   const boxes=[...row.children].map(rect);
   for(const box of boxes)if(!within(box,rect(row)))errors.push('card child outside card');
   for(let i=0;i<boxes.length;i++)for(let j=i+1;j<boxes.length;j++)if(overlap(boxes[i],boxes[j]))errors.push('card children overlap');
   const panel=row.closest('.content-panel'),cs=getComputedStyle(panel);
   const width=panel.clientWidth-parseFloat(cs.paddingLeft)-parseFloat(cs.paddingRight);
   const identity=rect(row.querySelector('.res-main')),status=rect(row.querySelector('.status'));
   if(width>=620&&CSS.supports('container-type','inline-size')){
    if(status.left<identity.right-1)errors.push('wide card: progress is not to right of identity');
    const centers=[...row.children].map(e=>{const r=rect(e);return (r.top+r.bottom)/2});
    if(Math.max(...centers)-Math.min(...centers)>1)errors.push('wide card: centers differ');
   }else if(status.top<identity.bottom-1)errors.push('compact card: progress is not below identity');
   const icon=row.querySelector('.status-weapon-icon img');if(icon&&icon.getClientRects().length&&(rect(icon).width!==30||rect(icon).height!==30))errors.push('weapon image inherits portrait size');
  }
  for(const bar of document.querySelectorAll('.filter-sort-row')){
   const controls=[...bar.querySelectorAll('.filters button,.sort-trigger')];
   for(const e of controls)if(!within(rect(e),rect(bar)))errors.push('filter/trigger clipped');
   for(let i=0;i<controls.length;i++)for(let j=i+1;j<controls.length;j++)if(overlap(rect(controls[i]),rect(controls[j])))errors.push('filter/trigger overlap');
  }
  for(const d of document.querySelectorAll('.sort-direction')){
   if(!d.getClientRects().length)continue;
   const [a,arrow,b]=[...d.children].map(rect);
   if(Math.abs((a.right+ b.left)/2-(arrow.left+arrow.right)/2)>1)errors.push('sort arrow horizontal center');
   if(Math.abs((a.top+a.bottom)/2-(arrow.top+arrow.bottom)/2)>1)errors.push('sort arrow vertical center');
  }
  return errors;
 });
 assert.deepEqual(failures,[],label);
}
(async()=>{
 await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
 const base=`http://127.0.0.1:${server.address().port}`;
 const browser=await chromium.launch({headless:true,channel:process.env.BROWSER_CHANNEL||'msedge'});
 let cases=0;
 try{
  for(const lang of ['fr','en']){
   const context=await browser.newContext({viewport:{width:720,height:1122},deviceScaleFactor:4/3,serviceWorkers:'block'});
   const page=await context.newPage(),errors=[];
   page.on('pageerror',e=>errors.push(e.message));
   await page.route('https://**/*',route=>route.fulfill({contentType:'application/json',body:JSON.stringify(route.request().url().endsWith('/character/1')?forteFixture:{GameVer:'test',ResVer:'test',Skills:[]})}));
   await page.addInitScript(({characters,weapons,account,lang})=>{
    if(localStorage.getItem('test-seeded'))return;
    localStorage.setItem('wwc_catalog_canonical_v050',JSON.stringify({characters,weapons,state:{gameVersion:'test',resourceVersion:'test'}}));
    localStorage.setItem('wwc_owned_ids',JSON.stringify(characters.slice(0,3).map(c=>c.id)));
    localStorage.setItem('wwc_account_data',JSON.stringify(account));
    localStorage.setItem('wwc_lang',lang);localStorage.setItem('test-seeded','1');
   },{characters,weapons,account,lang});
   await page.goto(base);await page.locator('.res-row').first().waitFor();
   const stored=await page.evaluate(()=>localStorage.getItem('wwc_account_data'));
   // Includes physical-capture estimate (720 CSS px at 4/3 DPR), both sides
   // of sidebar breakpoint, old failing widths, and repeated rotation.
   for(const [w,h] of [[320,700],[360,800],[640,960],[681,1000],[682,1000],[720,1122],[768,1024],[819,1100],[820,1100],[960,700],[979,700],[980,700],[987,700],[988,700],[1024,768],[1152,690],[1280,800],[1536,960],[720,1122],[1152,690],[720,1122]]){
    await page.setViewportSize({width:w,height:h});await page.evaluate(()=>new Promise(requestAnimationFrame));
    await inspect(page,`${lang} ${w}x${h}`);cases++;
    if(w===720||w===1152)await page.screenshot({path:path.join(out,`${lang}-${w}.png`),fullPage:true});
   }
   // Same viewport, narrower parent: guards against replacing container
   // queries with viewport/orientation guesses in future fixes.
   await page.locator('.content-panel').evaluate(e=>e.style.maxWidth='520px');
   await inspect(page,`${lang} constrained panel`);
   await page.locator('.content-panel').evaluate(e=>e.style.maxWidth='');
   // Every sort direction, the actual menus and actual rendering logic.
   for(const kind of ['alpha','alpha','rarity','rarity']){
    await page.locator('.sort-trigger').click();
    await inspect(page,`${lang} open sort menu`);
    await page.locator(`#sortMenu-owned button[onclick*="'${kind}'"]`).click();
    const state=await page.evaluate(()=>({kind:ownedSort,dir:ownedSortDir,names:[...document.querySelectorAll('.res-main>b')].map(e=>e.textContent)}));
    assert.equal(state.kind,kind);assert.equal(state.names.length,3);
    const expected=[...characters.slice(0,3)].sort((a,b)=>kind==='alpha'?state.dir*a.name.localeCompare(b.name,lang,{sensitivity:'base'}):(a.rarity-b.rarity)*state.dir||a.name.localeCompare(b.name,lang,{sensitivity:'base'})).map(c=>c.name);
    assert.deepEqual(state.names,expected);await inspect(page,`${lang} ${kind} ${state.dir}`);
   }
   await page.locator('.filters button').filter({hasText:/^Spectro$/}).click();assert.equal(await page.locator('.res-row').count(),1);
   await page.locator('.filters button').first().click();
   await page.locator('#ownedSearch').fill('Qingxiao');assert.equal(await page.locator('.res-row').count(),1);
   await page.locator('.res-main').click();assert.equal(await page.locator('#accountEditor.open').count(),0);
   await page.locator('.edit-chevron').click();await page.locator('#accountEditor.open').waitFor();
   await page.locator('#editorSave').click();assert.equal(await page.locator('#accountEditor.open').count(),0);
   assert.equal(await page.evaluate(()=>JSON.parse(localStorage.getItem('wwc_account_data')).Qingxiao.level),90);
   await page.locator('.bottom-nav [data-view="ency"]').click();
   await inspect(page,`${lang} encyclopaedia`);
   await page.locator('.sort-trigger').click();await page.locator('#sortMenu-ency button').first().click();
   assert.ok(await page.locator('.char-card').count()>0);
   await page.reload();await page.locator('.res-row').first().waitFor();
   const saved=JSON.parse(await page.evaluate(()=>localStorage.getItem('wwc_account_data')));
   const initial=JSON.parse(stored);
   assert.deepEqual(saved.Qingxiao,initial.Qingxiao);assert.deepEqual(saved.Aalto,initial.Aalto);
   // Real editor, observed source schema; never replace rendered components.
   const openQ=async()=>{await page.locator('#ownedSearch').fill('Qingxiao');await page.locator('.edit-chevron').click();await page.waitForFunction(()=>document.querySelectorAll('#forteEditor input').length===10);};
   await openQ();
   const normalized=await page.evaluate(fixture=>{
    const original=normalizeForteDefs(fixture);
    const duplicate=normalizeForteDefs({...fixture,SkillTree:[...fixture.SkillTree,...fixture.SkillTree,{Id:'invalid',PropertyNodeTitle:'Invalid'}]});
    const reversed=normalizeForteDefs({...fixture,SkillTree:[...fixture.SkillTree].reverse()});
    return {original,duplicate,reversed,empty:normalizeForteDefs(null)};
   },forteFixture);
   assert.deepEqual(normalized.original,normalized.duplicate,'Duplicate or malformed IDs cannot create extra controls');
   assert.deepEqual(normalized.original,normalized.reversed,'Source ordering does not change node identity or order');
   assert.deepEqual(normalized.empty,[]);
   const node=page.locator('[data-forte-key="node:9"]'),inherent=page.locator('[data-forte-key="skill:1000504"]');
   assert.equal(await page.locator('[data-forte-key="skill:1000508"]').count(),0,'Cooking passive is automatic');
   await node.check();await inherent.check();
   await page.locator('#editorClose').click();await openQ();
   assert.equal(await node.isChecked(),false,'Closing without saving cancels changes');
   await node.check();await inherent.check();
   for(const width of [320,720,1152,720]){
    await page.setViewportSize({width,height:1122});
    assert.equal(await page.evaluate(()=>{const e=document.querySelector('#accountEditor .modal');return e?e.scrollWidth<=e.clientWidth+1:document.documentElement.scrollWidth<=innerWidth+1;}),true);
    const overlap=await page.locator('.forte-node').evaluateAll(rows=>rows.some(row=>{const r=row.getBoundingClientRect(),input=row.querySelector('input').getBoundingClientRect(),copy=row.querySelector('.forte-node-copy').getBoundingClientRect();return input.right>copy.left||copy.right>r.right+1||copy.left<r.left;}));
    assert.equal(overlap,false,'Passive controls and text stay inside their row');
   }
   await page.locator('#forteEditor').screenshot({path:path.join(out,`${lang}-forte.png`)});
   await page.locator('#editorSave').click();await page.reload();await page.locator('.res-row').first().waitFor();await openQ();
   assert.equal(await node.isChecked(),true);assert.equal(await inherent.isChecked(),true);
   // A background refresh must preserve unsaved checkbox changes.
   await node.uncheck();await page.evaluate(()=>{editingForteDefs=normalizeForteDefs({...readCharacterDetailCache('1'),SkillTree:[...readCharacterDetailCache('1').SkillTree].reverse()});drawSkillsEditor();});
   assert.equal(await node.isChecked(),false);await page.locator('#editorSave').click();
   const after=await page.evaluate(()=>JSON.parse(localStorage.getItem('wwc_account_data')));
   assert.deepEqual(after.Qingxiao,{...initial.Qingxiao,forteNodes:{'node:9':false,'skill:1000504':true}});
   assert.deepEqual(after.Aalto,initial.Aalto);
   // Missing upstream nodes do not delete stored unlocks on the next save.
   await openQ();await page.evaluate(()=>{editingForteNodes['node:999']=true;editingForteDefs=editingForteDefs.filter(d=>d.key!=='skill:1000504');drawSkillsEditor();});
   await node.check();await page.locator('#editorSave').click();
   const preserved=await page.evaluate(()=>JSON.parse(localStorage.getItem('wwc_account_data')).Qingxiao.forteNodes);
   assert.equal(preserved['node:999'],true);assert.equal(preserved['skill:1000504'],true);
   await page.locator('#ownedSearch').fill('Aalto');await page.locator('.edit-chevron').click();
   await page.waitForFunction(()=>document.querySelector('#forteEditor').textContent.includes('unavailable')||document.querySelector('#forteEditor').textContent.includes('indisponibles'));
   assert.equal(await page.locator('#forteEditor input').count(),0,'Missing data must not reuse another character’s nodes');
   await page.locator('#editorSave').click();
   assert.deepEqual(await page.evaluate(()=>JSON.parse(localStorage.getItem('wwc_account_data')).Aalto),{level:null,sequence:0,weapon:null,skills:{}});
   assert.deepEqual(errors,[]);
   await context.close();
  }
  console.log(`PASS: ${cases} real-page viewport/language cases; list interactions; passive source normalization, cancel/save, reload, refresh, missing nodes, character isolation and geometry; no page errors.`);
 }finally{await browser.close();server.close();}
})().catch(e=>{console.error(e);server.close();process.exitCode=1});
