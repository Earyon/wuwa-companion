'use strict';
// Display-only translations from the same pinned game tables as progression.
// Never replace canonical names, IDs, saved values or user-written labels.
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const revision='353f2eaed119bc9f680eab92807d20ac75a79b40';
async function read(file){
 if(process.env.WUWA_SOURCE_CACHE){const name=file.startsWith('Textmaps/')?file.split('/')[1]+'-multitext.json':file.replaceAll('/','_');return JSON.parse(fs.readFileSync(path.join(process.env.WUWA_SOURCE_CACHE,name),'utf8'));}
 const r=await fetch(`https://raw.githubusercontent.com/Arikatsu/WutheringWaves_Data/${revision}/${file}`);if(!r.ok)throw Error(`${r.status}: ${file}`);return r.json();
}
(async()=>{
 const localSource=await require('./source-version.cjs')('3.6.0',{local:true});
 const files=['Textmaps/en/multi_text/MultiText.json','Textmaps/fr/multi_text/MultiText.json','BinData/skill/skill.json','BinData/skillTree/skilltree.json'];
 const [english,french,skills,nodes]=await Promise.all(files.map(read));
 const en=new Map(english.map(x=>[x.Id,x.Content])),fr=new Map(french.map(x=>[x.Id,x.Content]));
 const clean=s=>String(s||'').replace(/<br\s*\/?\s*>/gi,'\n').replace(/<[^>]*>/g,'').replace(/[ \t]+/g,' ').trim();
 const candidates=new Map(),terms={};
 for(const [id,text]of en){
  if(!/^(WeaponConf_.*_WeaponName|ItemInfo_.*_Name|MonsterInfo_.*_Name|RoleInfo_.*_Name|PhantomFetterGroup_.*_FetterGroupName|SkillType_.*_TypeName|PropertyIndex_.*_Name|ItemShowType_.*_Name)$/.test(id))continue;
  const value=clean(fr.get(id)),key=clean(text);if(!key||!value)continue;
  if(!candidates.has(key))candidates.set(key,new Set());candidates.get(key).add(value);
 }
 const names={};
 const [roles,weapons,items,echoes]=await Promise.all(['BinData/role/roleinfo.json','BinData/weapon/weaponconf.json','BinData/item/iteminfo.json','BinData/phantom/phantomitem.json'].map(read));
 const byId=rows=>new Map(rows.map(r=>[String(r.Id??r.ItemId),r]));
 const sourceRows={character:byId(roles),weapon:byId(weapons),item:byId(items)};
 const iconKey=value=>String(value||'').replace(/^.*\/Game\//,'Game/').replace(/\.[^/.]+$/,'');
 const echoNames=new Map();
 for(const row of echoes){const key=iconKey(row.Icon);if(!echoNames.has(key))echoNames.set(key,new Set());echoNames.get(key).add(row.MonsterName);}
 const coverage={};
 const listKeys={character:'roleList',weapon:'weapons',echo:'Echo',item:'itemList'};
 for(const [kind,key]of Object.entries(listKeys)){
  const data=process.env.WUWA_SOURCE_CACHE?JSON.parse(fs.readFileSync(path.join(process.env.WUWA_SOURCE_CACHE,'fr-'+kind+'-list.json'),'utf8')):await (await fetch('https://api-v2.encore.moe/api/fr/'+kind)).json();
  assert.ok(Array.isArray(data[key])&&data[key].length);let resolved=0;
  names[kind]=Object.fromEntries(data[key].map(r=>{
   const row=sourceRows[kind]?.get(String(r.Id)),echoKeys=echoNames.get(iconKey(r.Icon));
   const textId=kind==='weapon'?row?.WeaponName:kind==='echo'?(echoKeys?.size===1?[...echoKeys][0]:null):row?.Name;
   const value=clean(fr.get(textId));if(value)resolved++;
   return [String(r.Id),value||clean(r.Name)];
  }));coverage[kind]={local:resolved,total:data[key].length};
 }
 const sonatas=JSON.parse(fs.readFileSync(path.resolve(__dirname,'../data/sonatas.json'),'utf8'));
 names.sonata=Object.fromEntries(sonatas.sets.map(s=>[s.id,s.name.fr]));
 for(const s of sonatas.sets)candidates.set(s.name.en,new Set([s.name.fr]));
 const ambiguous=[];for(const [key,values]of candidates){if(values.size===1)terms[key]=[...values][0];else ambiguous.push(key);}
 const forte={};
 const formatted=(id,params)=>clean(fr.get(id)).replace(/\{(\d+)\}/g,(match,n)=>params[n]??match);
 for(const skill of skills.filter(s=>[4,7,8,9,10].includes(s.SkillType))){
  const name=clean(fr.get(skill.SkillName)),description=formatted(skill.SkillDescribe,(skill.SkillDetailNum||[]).map(x=>x.ArrayString?.join(' / ')??String(x)));
  if(name&&description&&!/\{\d+\}/.test(description))forte['skill:'+skill.Id]={name,description};
 }
 for(const node of nodes){
  const name=clean(fr.get(node.PropertyNodeTitle)),description=formatted(node.PropertyNodeDescribe,node.PropertyNodeParam||[]);
  if(name&&description&&!/\{\d+\}/.test(description))forte['node:'+node.Id]={name,description};
 }
 const data={schema:1,gameVersion:'3.6.0',sourceRevision:revision,localSource,coverage,names,terms:Object.fromEntries(Object.entries(terms).sort(([a],[b])=>a.localeCompare(b,'en'))),forte};
 const file=path.resolve(__dirname,'../data/localization-fr.json');if(process.argv.includes('--check'))assert.deepEqual(data,JSON.parse(fs.readFileSync(file,'utf8')));else fs.writeFileSync(file,JSON.stringify(data)+'\n');
 console.log(`${Object.keys(terms).length} source terms, ${Object.keys(forte).length} Forte texts. Ambiguous terms excluded: ${ambiguous.join(', ')}`);
})().catch(e=>{console.error(e);process.exitCode=1;});
