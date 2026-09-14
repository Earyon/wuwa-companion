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
// Game rich text is data, never executable HTML. Only these named styles
// are rendered; source links, arbitrary attributes and sizes are discarded.
function gameRichText(value){
 const colors={Title:'title',Highlight:'highlight',Ice:'glacio',Fire:'fusion',Thunder:'electro',Wind:'aero',Light:'spectro',Dark:'havoc'};
 const stack=[];let html='';
 for(const token of String(value||'').split(/(<[^>]*>)/g)){
  const color=/^<color=([A-Za-z]+)>$/.exec(token);
  if(color){const style=colors[color[1]];html+='<span'+(style?' class="game-text-'+style+'"':'')+'>';stack.push('color');}
  else if(/^<te\s[^>]*>$/.test(token)){html+='<span class="game-text-term">';stack.push('te');}
  else if(/^<\/(color|te)>$/.test(token)){if(stack.at(-1)===token.slice(2,-1)){stack.pop();html+='</span>';}}
  else if(/^<br\s*\/?>$/i.test(token))html+='\n';
  else if(!/^<[^>]*>$/.test(token))html+=esc(token);
 }
 return html+'</span>'.repeat(stack.length);
}
