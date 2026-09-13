'use strict';
// Pure arithmetic over validated source rows; missing data never becomes free progress.
const CostEngine=(()=>{
 const caps=[20,40,50,60,70,80,90];
 const requiredAscension=level=>level==null?null:caps.findIndex(cap=>level<=cap);
 function calculate(actual,goal,detail,weapon,weaponDetail,tables){
  const costs={},missing=[],steps=[];
  const add=(id,n)=>{if(!Number.isSafeInteger(n)||n<0)throw Error('Invalid cost');costs[id]=(costs[id]||0)+n;};
  const consume=rows=>{if(!Array.isArray(rows))throw Error('Missing consume rows');const total={};for(const r of rows){if(!Number.isInteger(r.Key)||r.Key<=0||!Number.isSafeInteger(r.Value)||r.Value<0)throw Error('Invalid consume row');total[r.Key]=(total[r.Key]||0)+r.Value;}return total;};
  const attempt=(key,fn)=>{try{const result=fn();for(const [id,n]of Object.entries(result))add(id,n);steps.push(key);}catch{missing.push(key);}};
  const levelCost=(kind,now,target,source)=>{
   if(target==null||now===target||now>target)return;
   attempt(kind+'-level',()=>{
    if(now==null||!source||!tables)throw Error('Unknown level/source');
    const curve=(kind==='role'?tables.roleLevels[source.LevelConsumeId]:tables.weaponLevels[source.LevelId]);if(!curve)throw Error('Unknown curve');
    let exp=0;for(let l=now;l<target;l++){const n=curve[kind==='role'?l+1:l];if(!Number.isSafeInteger(n)||n<=0)throw Error('Incomplete curve');exp+=n;}
    return {['exp:'+kind]:exp,2:Math.ceil(exp*tables.creditPerExp[kind])};
   });
  };
  const ascend=(kind,now,asc,targetLevel,targetAsc,source)=>{
   const target=targetAsc??requiredAscension(targetLevel);if(target==null)return;
   const inferred=requiredAscension(now),atBoundary=caps.slice(0,-1).includes(now);
   if(asc==null&&!atBoundary)asc=inferred;
   if(asc!=null&&asc>=target)return;
   attempt(kind+'-ascension',()=>{
    if(asc==null||!Array.isArray(source?.Breaches))throw Error('Unknown ascension');
    const sum={};for(let a=asc+1;a<=target;a++){
     const row=source.Breaches.find(b=>(kind==='role'?b.BreachLevel:b.Level+1)===a);if(!row)throw Error('Missing ascension');
     const values=consume(kind==='role'?row.BreachConsume:row.Consume);
     if(kind==='weapon'){if(!Number.isSafeInteger(row.GoldConsume)||row.GoldConsume<0)throw Error('Unknown credits');values['2']=(values['2']||0)+row.GoldConsume;}
     for(const [id,n]of Object.entries(values))sum[id]=(sum[id]||0)+n;
    }return sum;
   });
  };
  levelCost('role',actual.level,goal.level,detail);
  ascend('role',actual.level,actual.ascension,goal.level,goal.ascension,detail);
  if(goal.weaponLevel!=null||goal.weaponAscension!=null){
   levelCost('weapon',weapon?.level,goal.weaponLevel,weaponDetail);
   ascend('weapon',weapon?.level,weapon?.ascension,goal.weaponLevel,goal.weaponAscension,weaponDetail);
  }
  for(const [type,target]of Object.entries(goal.skills||{})){
   const now=actual.skills?.[type];if(now>=target)continue;
   attempt('skill:'+type,()=>{
    if(now==null)throw Error('Unknown skill level');const rows=detail?.Skills?.find(s=>s.SkillType===type)?.Consumes;if(!Array.isArray(rows))throw Error('Missing skill costs');
    const sum={};for(let l=now+1;l<=target;l++){const row=rows.find(r=>r.SkillId===l);const values=consume(row?.Consume);for(const [id,n]of Object.entries(values))sum[id]=(sum[id]||0)+n;}return sum;
   });
  }
  for(const [id,wanted]of Object.entries(goal.forteNodes||{}))if(wanted&&actual.forteNodes?.[id]!==true){
   attempt('forte:'+id,()=>{if(actual.forteNodes?.[id]!==false)throw Error('Unknown passive');const node=detail?.SkillTree?.find(n=>'node:'+n.Id===id)||detail?.Skills?.find(n=>'skill:'+n.SkillId===id);return consume(node?.Consume||node?.Consumes?.find(r=>r.SkillId===1)?.Consume);});
  }
  return {costs,missing,steps,complete:missing.length===0};
 }
 function stock(id,resources,tables){
  if(!id.startsWith('exp:'))return {value:resources[id]??null,known:resources[id]??0};
  const items=id==='exp:role'?tables?.roleExpItems:tables?.weaponExpItems;if(!items)return {value:null,known:0};
  let sum=0,unknown=false;for(const item of items){const qty=resources[String(item.Id)];if(qty==null)unknown=true;else sum+=qty*item.BasicExp;}return {value:unknown?null:sum,known:sum};
 }
 function net(costs,resources,tables){return Object.entries(costs).filter(([,n])=>n>0).map(([id,need])=>{const s=stock(id,resources,tables);return {id,need,stock:s.value,known:s.known,remaining:s.known>=need?0:s.value===null?null:need-s.value};});}
 return {calculate,net,stock,requiredAscension,caps};
})();
