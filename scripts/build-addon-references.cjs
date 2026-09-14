'use strict';
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const {skillTypes}=require('../addon/account-context.cjs');
const root=path.resolve(__dirname,'..'),load=name=>JSON.parse(fs.readFileSync(path.join(root,'data',name+'.json'),'utf8'));
function build(){
 const catalog=load('catalogue'),fr=load('localization-fr').names,assets=load('game-assets');
 const meta=JSON.parse(fs.readFileSync(path.join(root,'addon/windows/echo-metadata.json'),'utf8'));
 if(meta.gameVersion!==catalog.gameVersion)throw Error('Echo metadata version mismatch');
 const echoCatalog=load('echo-catalogue').payload.Echo;
 if(echoCatalog.some(row=>!meta.echoes[row.Id]?.qualities?.length))throw Error('Echo metadata is incomplete');
 const rules=vm.runInNewContext(fs.readFileSync(path.join(root,'echo-rules.js'),'utf8')+'\nEchoRules');
 const rows=(values,kind)=>values.map(row=>({gameId:String(row.gameId??row.Id),
  names:[...new Set([row.name??row.Name,fr[kind][row.gameId??row.Id]].filter(Boolean))],
  ...(kind==='character'?{element:row.element,weapon:row.weapon}:{}),
  ...(kind==='echo'?{sets:row.FetterGroups.map(g=>String(g.Id)),...meta.echoes[row.Id]}:{}),
  image:(kind==='character'?assets.portraits:kind==='weapon'?assets.weapons:kind==='echo'?assets.echoes:{})[row.gameId??row.Id]??null}));
 return {version:1,gameVersion:catalog.gameVersion,skillTypes,
  echoRules:{maxLevels:Object.fromEntries([2,3,4,5].map(q=>[q,rules.maxLevel(q)])),
   mainTypes:Object.fromEntries([1,3,4].map(c=>[c,rules.mainTypes(c)])),subTypes:rules.subTypes},
  characters:rows(catalog.characters,'character'),weapons:rows(catalog.weapons,'weapon'),
  echoes:rows(echoCatalog,'echo'),items:rows(load('item-catalogue').payload.itemList,'item'),
  sets:load('sonatas').sets.map(s=>({gameId:s.id,names:[s.name.fr,s.name.en]}))};
}
if(require.main===module){const output=path.resolve(process.argv[2]||'test-results/addon-references.json');fs.writeFileSync(output,JSON.stringify(build()));console.log('Wrote verified local references.');}
module.exports={build};
