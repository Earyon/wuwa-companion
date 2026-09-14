'use strict';
let frenchGameText=null;
async function loadLocalization(){
 try{const data=await fetchJSON('./data/localization-fr.json');if(data.schema!==1||!data.terms||!data.forte)throw Error('Invalid translations');frenchGameText=data;}catch{/* Canonical names remain usable when the optional translation file is unavailable. */}
}
function gameText(value){
 const text=content(value);if(lang!=='fr'||!frenchGameText)return text;
 return frenchGameText.terms[text]||text;
}
function gameLabel(row){
 if(!row)return '';
 const id=String(row.gameId||row.id).split(':').at(-1),names=frenchGameText?.names;
 const kind=String(row.id).startsWith('resonator:')?'character':String(row.id).startsWith('weapon:')?'weapon':row.kind||(row.sets!==undefined||row.type!==undefined||row.image!==undefined?(names?.echo[id]?'echo':'item'):'sonata');
 const name=lang==='fr'?(names?.[kind]?.[id]||gameText(row.name)):row.name;
 return row.label&&row.label!==row.name?name+' · '+(row.sets||[]).map(s=>gameText(s.name)).join(' / ')+' · #'+row.id:name;
}
function gameSearch(row,query){return [row.name,row.label,gameLabel(row)].filter(Boolean).some(v=>v.toLocaleLowerCase().includes(query.toLocaleLowerCase().trim()));}
function forteLabel(def){return lang==='fr'&&frenchGameText?.forte[def.key]?{...def,...frenchGameText.forte[def.key]}:def;}
