'use strict';
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
(async()=>{
 const localSource=await require('./source-version.cjs')('3.6.0',{local:true});
 const read=name=>JSON.parse(fs.readFileSync(path.join(process.env.WUWA_SOURCE_CACHE,name),'utf8'));
 const properties=read('BinData_property_propertyindex.json'),rows=read('BinData_weapon_weaponconf.json');
 const texts=Object.fromEntries(['en','fr'].map(lang=>[lang,new Map(read(lang+'-multitext.json').map(r=>[r.Id,r.Content]))]));
 const weapons=rows.map(row=>({ItemId:row.ItemId,locales:Object.fromEntries(['en','fr'].map(lang=>{
  const text=(id,params=[])=>String(texts[lang].get(id)||'').replace(/\{(\d+)\}/g,(_,n)=>{assert.ok(params[n]);return [...new Set(params[n].ArrayString)].join(' / ');}).replace(/<br\s*\/?\s*>/gi,'\n').replace(/<[^>]*>/g,'');
  return [lang,{ItemId:row.ItemId,Desc:text(row.Desc,row.DescParams),ResonName:'',Properties:[row.FirstPropId,row.SecondPropId].filter(r=>r.Id).map(r=>{const prop=properties.find(p=>p.Id===r.Id);assert.ok(prop);return {Name:text(prop.Name),BaseValue:prop.IsPercent?r.Value/100+'%':r.Value};})}];
 }))}));
 const data={schema:1,gameVersion:'3.6.0',localSource,weapons},target=path.join(__dirname,'../data/weapons.json');
 assert.equal(weapons.length,122);assert.ok(weapons.every(w=>w.locales.fr.Desc&&w.locales.en.Desc));
 if(process.argv.includes('--check'))assert.deepEqual(data,JSON.parse(fs.readFileSync(target,'utf8')));else fs.writeFileSync(target,JSON.stringify(data)+'\n');
 console.log('PASS: 122 bilingual weapons, source parameters and base properties.');
})().catch(e=>{console.error(e);process.exitCode=1;});
