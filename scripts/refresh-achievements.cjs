'use strict';
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const revision='353f2eaed119bc9f680eab92807d20ac75a79b40';
const paths=['BinData/achievement/achievement.json','BinData/achievement/achievementgroup.json','BinData/achievement/achievementstarlevel.json','BinData/drop/droppackage.json','Textmaps/en/multi_text/MultiText.json','Textmaps/fr/multi_text/MultiText.json'];
async function read(file){
 if(process.env.WUWA_SOURCE_CACHE){const name=file.startsWith('Textmaps/')?file.split('/')[1]+'-multitext.json':file.replaceAll('/','_');return JSON.parse(fs.readFileSync(path.join(process.env.WUWA_SOURCE_CACHE,name),'utf8'));}
 const response=await fetch(`https://raw.githubusercontent.com/Arikatsu/WutheringWaves_Data/${revision}/${file}`);if(!response.ok)throw Error(`${response.status}: ${file}`);return response.json();
}
(async()=>{
 const [achievements,groups,levels,drops,en,fr]=await Promise.all(paths.map(read));
 const texts={en:new Map(en.map(r=>[String(r.Id),r.Content])),fr:new Map(fr.map(r=>[String(r.Id),r.Content]))};
 const translate=key=>Object.fromEntries(['en','fr'].map(lang=>[lang,(texts[lang].get(key)||'').replace(/<[^>]*>/g,'').trim()]));
 const enabled=new Map(groups.filter(g=>g.Enable).map(g=>[g.Id,g]));const excluded=[];
 const rows=achievements.flatMap(row=>{
  const name=translate(row.Name),description=translate(row.Desc);
  if(!enabled.has(row.GroupId)||!name.en||!description.en){excluded.push(row.Id);return [];}
  const dropId=row.OverrideDropId||levels.find(l=>l.Level===row.Level)?.DropId,drop=drops.find(d=>d.Id===dropId);
  const astrite=drop?.DropPreview.find(r=>r.Key===3)?.Value??null;
  assert.ok(Number.isSafeInteger(row.Id)&&row.Id>0&&(astrite===null||Number.isSafeInteger(astrite)&&astrite>=0));
  return [{id:String(row.Id),group:String(row.GroupId),name,description,astrite,hidden:!!row.Hidden}];
 });
 assert.equal(new Set(rows.map(r=>r.id)).size,rows.length);assert.ok(rows.length>1000);
 const used=new Set(rows.map(r=>r.group));
 const data={schema:1,gameVersion:'3.6.0',checkedAt:'2026-09-13',source:`https://github.com/Arikatsu/WutheringWaves_Data/tree/${revision}`,excluded,groups:[...enabled.values()].filter(g=>used.has(String(g.Id))).map(g=>({id:String(g.Id),category:g.Category,sort:g.Sort,name:translate(g.Name)})),achievements:rows};
 const target=path.resolve(__dirname,'../data/achievements.json');
 if(process.argv.includes('--check'))assert.deepEqual(data,JSON.parse(fs.readFileSync(target,'utf8')));else fs.writeFileSync(target,JSON.stringify(data)+'\n');
 console.log(`PASS: ${rows.length} achievements, ${data.groups.length} groups, ${excluded.length} excluded; ${rows.filter(r=>!r.name.fr||!r.description.fr).length} missing French translations.`);
})().catch(e=>{console.error(e);process.exitCode=1;});
