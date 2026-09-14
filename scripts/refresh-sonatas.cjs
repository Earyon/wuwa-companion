'use strict';
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const revision='353f2eaed119bc9f680eab92807d20ac75a79b40';
async function read(file){
 if(process.env.WUWA_SOURCE_CACHE){const name=file.startsWith('Textmaps/')?file.split('/')[1]+'-multitext.json':file.replaceAll('/','_');return JSON.parse(fs.readFileSync(path.join(process.env.WUWA_SOURCE_CACHE,name),'utf8'));}
 const r=await fetch(`https://raw.githubusercontent.com/Arikatsu/WutheringWaves_Data/${revision}/${file}`);if(!r.ok)throw Error(`${r.status}: ${file}`);return r.json();
}
(async()=>{
 const localSource=await require('./source-version.cjs')('3.6.0',{local:true});
 const [groups,effects,en,fr]=await Promise.all(['BinData/phantom/phantomfettergroup.json','BinData/phantom/phantomfetter.json','Textmaps/en/multi_text/MultiText.json','Textmaps/fr/multi_text/MultiText.json'].map(read));
 const text={en:new Map(en.map(t=>[t.Id,t.Content])),fr:new Map(fr.map(t=>[t.Id,t.Content]))};
 const translate=(id,params=[])=>Object.fromEntries(['en','fr'].map(lang=>{const value=text[lang].get(id);assert.ok(value,`Missing ${lang} ${id}`);const result=value.replace(/\{(\d+)\}/g,(_,n)=>{assert.notEqual(params[n],undefined);return params[n];}).replace(/<br\s*\/?\s*>/gi,'\n').replace(/<[^>]+>/g,'');assert.ok(!/\{\d+\}/.test(result));return [lang,result];}));
 const sets=groups.map(g=>({id:String(g.Id),name:translate(g.FetterGroupName),effects:g.FetterMap.map(link=>{const row=effects.find(e=>e.Id===link.Value);assert.ok(row&&row.Name===g.FetterGroupName,`Incorrect group ${g.Id}`);assert.ok([1,2,3,5].includes(link.Key));return {pieces:link.Key,description:translate(row.EffectDescription,row.EffectDescriptionParam)};})}));
 const data={schema:1,gameVersion:'3.6.0',checkedAt:'2026-09-13',source:`https://github.com/Arikatsu/WutheringWaves_Data/tree/${revision}`,sets};
 data.localSource=localSource;
 const file=path.resolve(__dirname,'../data/sonatas.json');if(process.argv.includes('--check'))assert.deepEqual(data,JSON.parse(fs.readFileSync(file,'utf8')));else fs.writeFileSync(file,JSON.stringify(data)+'\n');
 console.log(`PASS: ${sets.length} Sonatas joined by FetterMap, translated and parameterized; no unmatched effects.`);
})().catch(e=>{console.error(e);process.exitCode=1;});
