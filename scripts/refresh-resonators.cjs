'use strict';
// Compact, per-character reference files. Numeric IDs and parent indices come
// from the pinned game tables; translations never become persistence keys.
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const revision='353f2eaed119bc9f680eab92807d20ac75a79b40',root=path.resolve(__dirname,'..');
async function read(file){
 if(process.env.WUWA_SOURCE_CACHE){const name=file.startsWith('Textmaps/')?file.split('/')[1]+'-multitext.json':file.replaceAll('/','_');return JSON.parse(fs.readFileSync(path.join(process.env.WUWA_SOURCE_CACHE,name),'utf8'));}
 const response=await fetch(`https://raw.githubusercontent.com/Arikatsu/WutheringWaves_Data/${revision}/${file}`);if(!response.ok)throw Error(`${response.status}: ${file}`);return response.json();
}
const clean=value=>String(value||'').replace(/<br\s*\/?\s*>/gi,'\n').replace(/<[^>]*>/g,'').trim();
(async()=>{
 const localSource=await require('./source-version.cjs')('3.6.0',{local:true});
 const [roles,skills,nodes,chains,en,fr,properties,bases]=await Promise.all(['BinData/role/roleinfo.json','BinData/skill/skill.json','BinData/skillTree/skilltree.json','BinData/resonate_chain/resonantchain.json','Textmaps/en/multi_text/MultiText.json','Textmaps/fr/multi_text/MultiText.json','BinData/property/propertyindex.json','BinData/property/baseproperty.json'].map(read));
 const maps={en:new Map(en.map(x=>[x.Id,x.Content])),fr:new Map(fr.map(x=>[x.Id,x.Content]))};
 const catalogue=JSON.parse(fs.readFileSync(path.join(root,'data/catalogue.json'),'utf8'));
 const target=path.join(root,'data/resonators');if(!process.argv.includes('--check'))fs.mkdirSync(target,{recursive:true});
 let bytes=0,count=0;
 for(const character of catalogue.characters){
  const role=roles.find(r=>String(r.Id)===character.gameId);assert.ok(role,character.id);
  const tree=nodes.filter(n=>n.NodeGroup===role.SkillTreeGroupId),kit=skills.filter(s=>s.SkillGroupId===role.SkillId);
  const layout=tree.map(n=>({id:n.Id,index:n.NodeIndex,parents:n.ParentNodes,skillId:n.SkillId,kind:n.NodeType,coordinate:n.Coordinate}));
  assert.equal(new Set(layout.map(n=>n.index)).size,layout.length);
  for(const n of layout)assert.ok(n.parents.every(p=>layout.some(x=>x.index===p)),`${character.name}: missing parent`);
  const locales={};
  for(const language of ['en','fr']){
   const text=(id,parameters=[])=>clean(maps[language].get(id)).replace(/\{(\d+)\}/g,(match,index)=>parameters[index]??match);
   const base=bases.find(b=>b.Id===role.PropertyId);assert.ok(base);
   locales[language]={Id:role.Id,Introduction:text(role.Introduction),Properties:role.ShowProperty.map(id=>{const p=properties.find(p=>p.Id===id);assert.ok(p&&Number.isFinite(base[p.Key]));return {Name:text(p.Name),BaseValue:p.IsPercent?base[p.Key]/100+'%':base[p.Key]};}),Skills:kit.map(s=>{
    const node=tree.find(n=>n.SkillId===s.Id);
    return {SkillId:s.Id,SkillType:clean(maps.en.get(`SkillType_${s.SkillType}_TypeName`)),TypeLabel:text(`SkillType_${s.SkillType}_TypeName`),SkillName:text(s.SkillName),SkillDescribe:text(s.SkillDescribe,(s.SkillDetailNum||[]).map(x=>x.ArrayString?.join(' / ')??String(x))),Icon:s.Icon,Consumes:node?.Consume?.length?[{Consume:node.Consume}]:[]};
   }),SkillTree:tree.filter(n=>n.PropertyNodeTitle).map(n=>({Id:n.Id,PropertyNodeTitle:text(n.PropertyNodeTitle),PropertyNodeDescribe:text(n.PropertyNodeDescribe,n.PropertyNodeParam),Icon:n.PropertyNodeIcon})),ResonantChain:chains.filter(c=>c.GroupId===role.ResonantChainGroupId).map(c=>({Id:c.Id,GroupIndex:c.GroupIndex,NodeName:text(c.NodeName),NodeIcon:c.NodeIcon,AttributesDescription:text(c.AttributesDescription,c.AttributesDescriptionParams)}))};
   assert.ok(locales[language].Skills.length,`${character.name}: empty skills`);
   assert.equal(locales[language].ResonantChain.length,6,`${character.name}: incomplete chain`);
   assert.ok(!/\{\d+\}|\[object Object\]/.test(JSON.stringify(locales[language])),`${character.name}: unresolved source parameters`);
  }
  const data={schema:1,gameVersion:catalogue.gameVersion,sourceRevision:revision,localSource,Id:role.Id,layout,locales};
  const file=path.join(target,character.gameId+'.json'),json=JSON.stringify(data)+'\n';
  if(process.argv.includes('--check'))assert.deepEqual(JSON.parse(fs.readFileSync(file,'utf8')),data);else fs.writeFileSync(file,json);
  bytes+=Buffer.byteLength(json);count++;
 }
 console.log(`PASS: ${count} bilingual character files; verified parent references and six sequence entries per character; ${bytes} bytes total, loaded on demand.`);
})().catch(error=>{console.error(error);process.exitCode=1;});
