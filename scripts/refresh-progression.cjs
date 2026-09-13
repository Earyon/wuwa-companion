'use strict';
// Reproducible projection from a pinned upstream revision. --check never writes.
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const revision='353f2eaed119bc9f680eab92807d20ac75a79b40';
const files=['BinData/role_level/rolelevelconsume.json','BinData/weapon/weaponlevel.json','BinData/role/roleexpitem.json','BinData/weapon/weaponexpitem.json'];
async function read(file){
 const dir=process.env.WUWA_SOURCE_CACHE;
 if(dir)return JSON.parse(fs.readFileSync(path.join(dir,file.replaceAll('/','_')),'utf8'));
 const response=await fetch(`https://raw.githubusercontent.com/Arikatsu/WutheringWaves_Data/${revision}/${file}`);
 if(!response.ok)throw Error(`${response.status}: ${file}`);
 return response.json();
}
function curves(rows,group,level,exp){
 const result={};for(const row of rows){assert.ok(Number.isSafeInteger(row[group])&&Number.isInteger(row[level])&&Number.isSafeInteger(row[exp])&&row[exp]>=0);const curve=result[row[group]]??={};assert.equal(curve[row[level]],undefined);curve[row[level]]=row[exp];}return result;
}
(async()=>{
 const [roles,weapons,roleItems,weaponItems]=await Promise.all(files.map(read));
 const target=path.resolve(__dirname,'../data/progression.json'),previous=JSON.parse(fs.readFileSync(target,'utf8'));
 const data={schema:1,gameVersion:'3.6.0',resourceVersion:'3.6.6',checkedAt:'2026-09-13',source:`https://github.com/Arikatsu/WutheringWaves_Data/tree/${revision}`,roleLevels:curves(roles,'ConsumeGroupId','Level','ExpCount'),weaponLevels:curves(weapons,'LevelId','Level','Exp'),roleExpItems:roleItems.map(({Id,BasicExp})=>({Id,BasicExp})),weaponExpItems:weaponItems.map(({Id,Cost,BasicExp})=>({Id,Cost,BasicExp})),creditPerExp:{role:.35,weapon:.4}};
 for(const item of [...data.roleExpItems,...data.weaponExpItems])assert.ok(Number.isSafeInteger(item.Id)&&Number.isSafeInteger(item.BasicExp)&&item.BasicExp>0);
 for(const curve of Object.values(data.roleLevels))assert.equal(Object.entries(curve).filter(([n])=>n<=90).reduce((s,[,v])=>s+v,0),2438000);
 if(process.argv.includes('--check'))assert.deepEqual(data,previous);else fs.writeFileSync(target,JSON.stringify(data)+'\n');
 console.log('PASS: pinned progression projection '+(process.argv.includes('--check')?'matches':'written'));
})().catch(e=>{console.error(e);process.exitCode=1;});
