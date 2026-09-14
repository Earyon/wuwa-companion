'use strict';
// Reuse the application's real validator in an isolated, in-memory store.
// No browser profile or personal localStorage is opened by the prototype.
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const root=path.resolve(__dirname,'..'),key='wwc_companion_v1';
const source=['echo-rules.js','account-store.js'].map(file=>fs.readFileSync(path.join(root,file),'utf8')).join('\n');
const skillTypes=JSON.parse(fs.readFileSync(path.join(root,'skills.js'),'utf8').match(/const SKILL_ORDER=(\[[^;]+\]);/)[1]);
function create(account){
 const values=new Map(account?[[key,JSON.stringify(account)]]:[]);
 const context=vm.createContext({structuredClone,crypto:require('node:crypto').webcrypto,
  localStorage:{getItem:k=>values.get(k)??null,setItem:(k,v)=>values.set(k,String(v)),removeItem:k=>values.delete(k)},
  window:{addEventListener(){}}});
 vm.runInContext(source+'\nglobalThis.store=CompanionStore;',context,{timeout:5000});
 if(context.store.error())throw Error('Invalid existing account: '+context.store.error().message);
 return context.store;
}
module.exports={create,key,skillTypes};
