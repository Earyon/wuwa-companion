'use strict';
// Project only public game configuration from the reviewed, read-only source snapshot.
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
async function build(){
 const localSource=await require('./source-version.cjs')('3.6.0',{local:true});
 const rows=JSON.parse(fs.readFileSync(path.join(process.env.WUWA_SOURCE_CACHE,'BinData_phantom_phantomitem.json'),'utf8'));
 const catalog=JSON.parse(fs.readFileSync(path.join(__dirname,'../data/echo-catalogue.json'),'utf8'));
 const echoes={};
 for(const echo of catalog.payload.Echo){
  const variants=rows.filter(r=>String(r.MonsterId)===String(echo.Id));
  assert.ok(variants.length,'Missing local Echo '+echo.Id);
  echoes[echo.Id]={qualities:[...new Set(variants.map(r=>r.QualityId))].sort(),phantomTypes:[...new Set(variants.map(r=>r.PhantomType))].sort()};
 }
 return {schema:1,gameVersion:catalog.gameVersion,localSource,echoes};
}
if(require.main===module)build().then(data=>{
 const file=path.join(__dirname,'../addon/windows/echo-metadata.json');
 if(process.argv.includes('--check'))assert.deepEqual(data,JSON.parse(fs.readFileSync(file,'utf8')));
 else fs.writeFileSync(file,JSON.stringify(data)+'\n');
 console.log('PASS: '+Object.keys(data.echoes).length+' Echo identities checked against local game configuration.');
}).catch(error=>{console.error(error);process.exitCode=1;});
module.exports={build};
