const fs=require('node:fs'),path=require('node:path'),http=require('node:http');
const root=path.resolve(__dirname,'..');
const chars=Array.from({length:55},(_,i)=>({id:`resonator:${i||1413}`,gameId:String(i||1413),name:i?'Test '+i:'Qingxiao',rarity:5,weapon:'Sword',element:'Aero',image:''}));
const weapons=Array.from({length:120},(_,i)=>({id:`weapon:${i||21010016}`,gameId:String(i||21010016),name:i?'Weapon '+i:'Test Sword',rarity:5,type:'Sword',image:''}));
async function startServer({handle}={}){const server=http.createServer((req,res)=>{if(handle?.(req,res))return;const file=path.resolve(root,'.'+(new URL(req.url,'http://local').pathname==='/'?'/index.html':new URL(req.url,'http://local').pathname));if(!file.startsWith(root+path.sep)){res.writeHead(403).end();return;}fs.readFile(file,(e,b)=>{if(e){res.writeHead(404).end();return;}res.setHeader('Content-Type',({'.js':'application/javascript','.css':'text/css','.json':'application/json','.png':'image/png','.webp':'image/webp','.svg':'image/svg+xml'})[path.extname(file)]||'text/html');res.end(b);});});await new Promise(r=>server.listen(0,'127.0.0.1',r));return {server,base:`http://127.0.0.1:${server.address().port}`};}
async function seedPage(page,language='fr'){
 await page.route('https://**/*',route=>{const url=route.request().url();const data=url.includes('/character/')?{...require('./fixtures/qingxiao-costs.json'),Id:Number(url.split('/').pop())}:url.includes('/weapon/')?require('./fixtures/sword-costs.json'):{GameVer:'test',ResVer:'test'};return route.fulfill({contentType:'application/json',body:JSON.stringify(data)});});
 // Retained phase-two modules are enabled only inside these isolated legacy tests.
 await page.addInitScript(()=>document.addEventListener('DOMContentLoaded',()=>{guidesVisible=true;},{once:true}));
 await page.addInitScript(({chars,weapons,language})=>{if(localStorage.getItem('test-seeded'))return;localStorage.setItem('test-seeded','1');localStorage.setItem('wwc_tutorial_v1','seen');localStorage.setItem('wwc_lang',language);localStorage.setItem('wwc_owned_ids',JSON.stringify(chars.slice(0,4).map(c=>c.id)));localStorage.setItem('wwc_catalog_canonical_v050',JSON.stringify({characters:chars,weapons,state:{gameVersion:'test',resourceVersion:'test'}}));},{chars,weapons,language});
}
module.exports={startServer,seedPage,root,chars,weapons};
