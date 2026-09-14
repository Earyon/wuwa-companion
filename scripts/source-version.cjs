'use strict';
// A live catalogue must not silently drift from the pinned text/skill tables.
module.exports=async function requireSourceVersion(expected,{local=false}={}){
 if(local){
  const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
  const manifest=JSON.parse(fs.readFileSync(path.join(__dirname,'../data/game-source.json'),'utf8'));
  if(manifest.gameVersion!==expected)throw Error('Local game reference version mismatch');
  if(!process.env.WUWA_SOURCE_CACHE)throw Error('This projection uses verified local game resources. Set WUWA_SOURCE_CACHE to the reviewed source snapshot; do not replace it with older remote texts.');
  for(const [name,hash]of Object.entries(manifest.files)){
   const bytes=fs.readFileSync(path.join(process.env.WUWA_SOURCE_CACHE,name));
   if(crypto.createHash('sha256').update(bytes).digest('hex')!==hash)throw Error(`Source snapshot changed: ${name}. Review the new game version and its manifest before regeneration.`);
  }
  return {patchVersion:manifest.patchVersion,checkedAt:manifest.checkedAt,manifest:'game-source.json'};
 }
 if(process.env.WUWA_SOURCE_CACHE)return;
 const response=await fetch('https://api-v2.encore.moe/api/en/new');
 if(!response.ok)throw Error('Cannot verify live source version');
 const data=require('../catalogue-version.js').read(await response.json());
 if(data.gameVersion!==expected)throw Error(`Source version ${data.gameVersion} differs from pinned ${expected}; update and review all related sources together.`);
};
