'use strict';
// Regular featured banners only. No unverified soft-pity curve or banner dates.
const ConveneRules=(()=>{
 const integer=(n,min,max)=>Number.isInteger(n)&&n>=min&&n<=max;
 function budget(copies,pity,guaranteed,weapon=false){
  if(!integer(copies,0,7)||pity!==null&&!integer(pity,0,79)||guaranteed!==null&&typeof guaranteed!=='boolean')throw Error('Invalid budget');
  if(!copies)return {min:0,max:0,median:0};
  const start=pity??0,guarantee=weapon||guaranteed===true;
  const max=weapon?80*copies-start:80*(copies*2-(guarantee?1:0))-start;
  // Explicit conservative model: flat 0.8%, hard pity at 80, no soft pity.
  let states=new Map([[`${copies}:${start}:${guarantee?1:0}`,1]]),completed=0,median=null;
  for(let draw=1;draw<=max&&median===null;draw++){
   const next=new Map(),put=(left,p,g,value)=>{if(value<=0)return;if(left===0)completed+=value;else{const k=`${left}:${p}:${g}`;next.set(k,(next.get(k)||0)+value);}};
   for(const [key,mass]of states){const [left,p,g]=key.split(':').map(Number),chance=p===79?1:.008;put(left,p+1,g,mass*(1-chance));if(g||weapon)put(left-1,0,weapon?1:0,mass*chance);else{put(left-1,0,0,mass*chance*.5);put(left,0,1,mass*chance*.5);}}
   states=next;if(completed>=.5)median=draw;
  }
  return {min:copies,max,median};
 }
 function astrites(character,weapon,radiant,forging){return radiant===null||forging===null?null:160*(Math.max(0,character-radiant)+Math.max(0,weapon-forging));}
 function pity(rows,pool){
  const list=rows.filter(r=>r.pool===pool),lastFive=list.filter(r=>r.quality===5).reduce((last,r)=>r.time>last?r.time:last,'');
  if(!lastFive)return {min:list.length,max:null};
  const after=list.filter(r=>r.time>lastFive).length,together=list.filter(r=>r.time===lastFive&&r.quality!==5).length;
  return {min:after,max:after+together};
 }
 return {budget,astrites,pity};
})();
