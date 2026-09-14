'use strict';
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'..');
(async()=>{
 const catalogue=JSON.parse(fs.readFileSync(path.join(root,'data/catalogue.json'),'utf8'));
 await require('./source-version.cjs')(catalogue.gameVersion);
 // Execute existing production normalizers. Event listeners are registered but
 // never invoked; no browser state or personal records are accessed.
 const context=vm.createContext({document:{getElementById:()=>({addEventListener(){}}),querySelector:()=>({addEventListener(){}}),addEventListener(){}},companionActions:{}});
 vm.runInContext(fs.readFileSync(path.join(root,'catalog.js'),'utf8')+'\n'+fs.readFileSync(path.join(root,'inventory.js'),'utf8'),context);
 for(const kind of ['echo','item']){
  const payload=process.env.WUWA_SOURCE_CACHE?JSON.parse(fs.readFileSync(path.join(process.env.WUWA_SOURCE_CACHE,kind+'.json'),'utf8')):await(await fetch('https://api-v2.encore.moe/api/en/'+kind)).json();
  context.payload=payload;context.kind=kind;const rows=vm.runInContext('normalizeExtended(kind,payload)',context);
  const slim=kind==='echo'?{Echo:rows.map(r=>({Id:Number(r.id),Name:r.name,Icon:r.image,Type:r.type,FetterGroups:r.sets.map(s=>({Id:s.id,Name:s.name}))}))}:{itemList:rows.map(r=>({Id:Number(r.id),Name:r.name,Icon:r.image,TypeName:r.type}))};
  const data=JSON.parse(JSON.stringify({schema:1,gameVersion:catalogue.gameVersion,source:catalogue.source,checkedAt:catalogue.checkedAt,payload:slim})),file=path.join(root,'data',kind+'-catalogue.json');
  if(process.argv.includes('--check'))assert.deepEqual(data,JSON.parse(fs.readFileSync(file,'utf8')));else fs.writeFileSync(file,JSON.stringify(data)+'\n');
  console.log(`PASS: ${kind}: ${rows.length} source records; production normalization reused.`);
 }
})().catch(error=>{console.error(error);process.exitCode=1;});
