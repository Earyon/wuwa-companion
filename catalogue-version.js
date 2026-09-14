(function(root,factory){if(typeof module==='object'&&module.exports)module.exports=factory();else root.CatalogueVersion=factory();})(globalThis,function(){
 'use strict';
 return Object.freeze({read(payload){
  const candidates=Array.isArray(payload)?payload:[payload];
  const rows=candidates.filter(row=>row&&typeof row==='object'&&typeof (row.GameVer??row.gameVersion)==='string'&&typeof (row.ResVer??row.resourceVersion)==='string');
  if(rows.length!==1)throw Error('Invalid or ambiguous catalogue version');
  const row=rows[0],gameVersion=row.GameVer??row.gameVersion,resourceVersion=row.ResVer??row.resourceVersion;
  if(!gameVersion.trim()||!resourceVersion.trim())throw Error('Empty catalogue version');
  return {gameVersion,resourceVersion};
 }});
});
