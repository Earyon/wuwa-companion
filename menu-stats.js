'use strict';
// Source curves are indexed by both level and ascension: boundary levels can
// have two valid values. An unknown ascension must not silently choose one.
(function(root){
 function curve(rows,level,ascension,curveId){
  if(!Number.isInteger(level))return null;
  const matches=rows.filter(r=>r[0]===level&&(ascension==null||r[1]===ascension)&&(curveId==null||r[2]===curveId));
  return matches.length===1?matches[0]:null;
 }
 function character(reference,rules,level,ascension){
  if(!reference?.base||!rules)return [];
  const growth=curve(rules.roleGrowth,level,ascension);
  return reference.showProperties.map(id=>{const property=rules.properties.find(p=>p.id===id),index={2:2,7:3,10:4}[id];
   const raw=index?(growth?reference.base[id]*growth[index]/10000:null):reference.base[id];
   if(!property)return {id,value:null,percent:false};
   return {...property,value:raw==null?null:property.percent?raw/100:raw,percent:property.percent};
  });
 }
 function weapon(reference,rules,level,ascension){
  if(!reference?.stats||!rules)return [];
  return reference.stats.map(stat=>{const property=rules.properties.find(p=>p.id===stat.Id),growth=curve(rules.weaponGrowth,level,ascension,stat.curve);
   const raw=growth?stat.Value*growth[3]/10000:null;
   if(!property)return {id:stat.Id,value:null,percent:false};
   return {...property,value:raw==null?null:stat.IsRatio?raw*100:property.percent?raw/100:raw,percent:stat.IsRatio||property.percent};
  });
 }
 function echoes(records){
  const values=new Map();let incomplete=false;
  for(const e of records){if(!e.main||!e.secondary||e.level==null)incomplete=true;
   for(const stat of [e.main,e.secondary,...e.substats].filter(Boolean)){
    const previous=values.get(stat.type);if(stat.value==null)incomplete=true;if(stat.value==null||previous===null)values.set(stat.type,null);else values.set(stat.type,(previous||0)+stat.value);
   }
  }
  return {values:[...values].map(([type,value])=>({type,value})),incomplete};
 }
 const api={curve,character,weapon,echoes};if(typeof module!=='undefined'&&module.exports)module.exports=api;else root.MenuStats=api;
})(globalThis);
