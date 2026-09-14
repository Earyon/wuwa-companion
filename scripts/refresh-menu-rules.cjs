'use strict';
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
(async()=>{
 const localSource=await require('./source-version.cjs')('3.6.0',{local:true});
 const read=name=>JSON.parse(fs.readFileSync(path.join(process.env.WUWA_SOURCE_CACHE,name),'utf8'));
 const texts=Object.fromEntries(['en','fr'].map(lang=>[lang,new Map(read(lang+'-multitext.json').map(r=>[r.Id,r.Content]))]));
 const data={schema:1,gameVersion:'3.6.0',localSource,
  properties:read('BinData_property_propertyindex.json').map(p=>({id:p.Id,key:p.Key,percent:p.IsPercent,icon:p.Icon,labels:Object.fromEntries(['fr','en'].map(l=>[l,texts[l].get(p.Name)||'']))})),
  roleGrowth:read('BinData_property_rolepropertygrowth.json').map(r=>[r.Level,r.BreachLevel,r.LifeMaxRatio,r.AtkRatio,r.DefRatio]),
  weaponGrowth:read('BinData_property_weaponpropertygrowth.json').map(r=>[r.Level,r.BreachLevel,r.CurveId,r.CurveValue])};
 assert.equal(data.roleGrowth.length,96);assert.equal(data.weaponGrowth.length,192);
 const file=path.join(__dirname,'../data/menu-rules.json');
 if(process.argv.includes('--check'))assert.deepEqual(data,JSON.parse(fs.readFileSync(file,'utf8')));else fs.writeFileSync(file,JSON.stringify(data)+'\n');
 console.log('PASS: source growth curves and bilingual attribute metadata.');
})().catch(e=>{console.error(e);process.exitCode=1;});
