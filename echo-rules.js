'use strict';
// Stable stat IDs shared by persistence and forms. Sources and limits: DEVELOPMENT.md.
const EchoRules=(()=>{
 const stats={hp:['PV','HP',false],atk:['ATQ','ATK',false],def:['DÉF','DEF',false],hpPct:['PV','HP',true],atkPct:['ATQ','ATK',true],defPct:['DÉF','DEF',true],critRate:['Taux critique','Crit. Rate',true],critDmg:['Dégâts critiques','Crit. DMG',true],energy:['Recharge d’énergie','Energy Regen',true],healing:['Bonus de soins','Healing Bonus',true],glacio:['Dégâts Glacio','Glacio DMG',true],fusion:['Dégâts Fusion','Fusion DMG',true],electro:['Dégâts Electro','Electro DMG',true],aero:['Dégâts Aero','Aero DMG',true],spectro:['Dégâts Spectro','Spectro DMG',true],havoc:['Dégâts Havoc','Havoc DMG',true],basic:['Attaque normale','Basic Attack DMG',true],heavy:['Attaque lourde','Heavy Attack DMG',true],skill:['Compétence résonatrice','Resonance Skill DMG',true],liberation:['Libération résonatrice','Resonance Liberation DMG',true]};
 const base=['hpPct','atkPct','defPct'];
 const mainTypes=cost=>[...base,...(cost===1?[]:cost===3?['energy','glacio','fusion','electro','aero','spectro','havoc']:cost===4?['critRate','critDmg','healing']:['energy','glacio','fusion','electro','aero','spectro','havoc','critRate','critDmg','healing'])];
 const subTypes=['hp','atk','def',...base,'critRate','critDmg','energy','basic','heavy','skill','liberation'];
 const maxLevel=quality=>quality===null?25:quality*5;
 const subLimit=echo=>echo.quality===2?0:Math.min(echo.quality??5,echo.level===null?5:Math.floor(echo.level/5));
 function validate(e){
  const fail=()=>{throw Error('Invalid Echo');};
  if(!e||typeof e!=='object'||!e.id||typeof e.id!=='string'||!e.catalogId||typeof e.catalogId!=='string'||typeof e.name!=='string')fail();
  if(!(e.owner===null&&e.slot===null)&&!(typeof e.owner==='string'&&e.owner&&Number.isInteger(e.slot)&&e.slot>=1&&e.slot<=5))fail();
  if(![null,2,3,4,5].includes(e.quality)||![null,1,3,4].includes(e.cost)||(e.setId!==null&&(typeof e.setId!=='string'||!e.setId)))fail();
  if(e.level!==null&&(!Number.isInteger(e.level)||e.level<0||e.level>maxLevel(e.quality)))fail();
  const stat=(s,types)=>{if(!s||!types.includes(s.type)||(s.value!==null&&(!Number.isFinite(s.value)||s.value<0||s.value>1e7)))fail();};
  if(e.main!==null)stat(e.main,mainTypes(e.cost));
  if(e.secondary!==null)stat(e.secondary,e.cost===1?['hp']:e.cost===null?['hp','atk']:['atk']);
  if(!Array.isArray(e.substats)||e.substats.length>subLimit(e)||new Set(e.substats.map(s=>s?.type)).size!==e.substats.length)fail();
  e.substats.forEach(s=>stat(s,subTypes));
  if(e.legacyStats!==undefined&&(!e.legacyStats||typeof e.legacyStats.mainStat!=='string'||typeof e.legacyStats.mainValue!=='string'||!Array.isArray(e.legacyStats.substats)||e.legacyStats.substats.some(s=>typeof s!=='string')))fail();
 }
 return {stats,mainTypes,subTypes,maxLevel,subLimit,validate};
})();
