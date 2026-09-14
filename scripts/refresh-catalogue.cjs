'use strict';
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'..');
async function read(kind,file){
 if(process.env.WUWA_SOURCE_CACHE)return JSON.parse(fs.readFileSync(path.join(process.env.WUWA_SOURCE_CACHE,file),'utf8'));
 const r=await fetch('https://api-v2.encore.moe/api/en/'+kind);if(!r.ok)throw Error(r.status);return r.json();
}
(async()=>{
 await require('./source-version.cjs')('3.6.0');
 const [chars,weapons]=await Promise.all([read('character','character-list.json'),read('weapon','weapon-list.json')]);
 const version=require('../catalogue-version.js').read(await read('new','encore-version.json'));
 assert.equal(version.gameVersion,'3.6.0');
 // Reuse production normalization and validation, including canonical Rover IDs.
 const projection=vm.runInNewContext(fs.readFileSync(path.join(root,'catalog.js'),'utf8')+'\n(()=>{const characters=keepPlayableMaleRovers(inputChars.roleList.map(normalizeCharacter)),weapons=inputWeapons.weapons.map(normalizeWeapon);validateCanonical(characters,weapons);return {characters,weapons};})()', {inputChars:chars,inputWeapons:weapons});
 const data={schema:1,source:'Encore / WW_Data',checkedAt:'2026-09-14',...version,...JSON.parse(JSON.stringify(projection))};
 const target=path.join(root,'data/catalogue.json');if(process.argv.includes('--check'))assert.deepEqual(data,JSON.parse(fs.readFileSync(target,'utf8')));else fs.writeFileSync(target,JSON.stringify(data)+'\n');
 console.log(`PASS: bundled catalogue ${data.characters.length} characters / ${data.weapons.length} weapons, production validators reused.`);
})().catch(e=>{console.error(e);process.exitCode=1;});
