'use strict';
// Developer-only staging command. A provider and the final user flow remain to be selected.
const fs=require('node:fs'),path=require('node:path');
const {create,key}=require('./account-context.cjs'),{prepare}=require('./import-plan.cjs');
const root=path.resolve(__dirname,'..');
const readJSON=file=>JSON.parse(fs.readFileSync(path.join(root,file),'utf8'));
function references(){
 const catalogue=readJSON('data/catalogue.json');
 return {...catalogue,
  echoes:readJSON('data/echo-catalogue.json').payload.Echo.map(e=>({id:String(e.Id),name:e.Name,setIds:e.FetterGroups.map(s=>String(s.Id))})),
  resources:readJSON('data/item-catalogue.json').payload.itemList.map(i=>String(i.Id)),
  sets:readJSON('data/sonatas.json').sets.map(s=>String(s.id)),
  // Forte import is intentionally unavailable until the selected provider maps real unlock IDs.
  nodes:{}};
}
function stage(snapshotText,backupText){
 const validator=create();
 const backup=validator.validateBackup(backupText);
 if(!backup.records[key])throw Error('Open Companion once to initialize this backup');
 const account=JSON.parse(backup.records[key]),plan=prepare(account,snapshotText,references());
 const staged=structuredClone(backup);
 staged.records[key]=JSON.stringify(plan.after);staged.createdAt=new Date().toISOString();
 validator.validateBackup(JSON.stringify(staged));
 return {backup:staged,counts:plan.counts,changed:plan.changed};
}
if(require.main===module){
 try{
  const args=process.argv.slice(2);
  if(args.length!==3)throw Error('Usage: node addon/prepare-backup.cjs snapshot.json existing-backup.json proposed-backup.json');
  const [snapshot,backup,output]=args.map(p=>path.resolve(p));
  if(output===snapshot||output===backup)throw Error('Output must differ from input files');
  for(const input of [snapshot,backup])if(fs.statSync(input).size>8*1024*1024)throw Error('Input file exceeds 8 MiB');
  const staged=stage(fs.readFileSync(snapshot,'utf8'),fs.readFileSync(backup,'utf8'));
  fs.writeFileSync(output,JSON.stringify(staged.backup,null,2),{flag:'wx'});
  console.log(JSON.stringify({changed:staged.changed,counts:staged.counts,appliedToApplication:false}));
 }catch(error){console.error(error.message);process.exitCode=1;}
}
module.exports={stage,references};
