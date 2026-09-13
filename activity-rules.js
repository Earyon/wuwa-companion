'use strict';
const ActivityRules=(()=>{
 const offsets={america:-5,europe:1,asia:8,sea:8,hmt:8},day=86400000;
 function cycle(period,server,now=Date.now()){
  if(period==='once')return 'once';if(!Object.hasOwn(offsets,server))return null;
  const d=new Date(now+(offsets[server]-4)*3600000);d.setUTCHours(0,0,0,0);
  if(period==='weekly')d.setUTCDate(d.getUTCDate()-(d.getUTCDay()+6)%7);
  else if(period!=='daily')throw Error('Invalid recurrence');
  return server+':'+d.toISOString().slice(0,10);
 }
 function nextReset(period,server,now=Date.now()){
  const key=cycle(period,server,now);if(!key||period==='once')return null;
  return Date.parse(key.slice(key.indexOf(':')+1)+'T04:00:00Z')-offsets[server]*3600000+(period==='weekly'?7:1)*day;
 }
 function serverDate(value,server){
  if(!value)return null;if(/Z$/.test(value))return Date.parse(value);
  if(!Object.hasOwn(offsets,server))return null;
  const time=Date.parse(value+'Z');return Number.isFinite(time)?time-offsets[server]*3600000:null;
 }
 function status(record,definition,server,now=Date.now()){
  if(!record)return 'unknown';if((definition.period||'once')==='once')return record.status;
  const current=cycle(definition.period,server,now);return current&&record.cycle===current?record.status:'unknown';
 }
 return {offsets,cycle,nextReset,serverDate,status};
})();
