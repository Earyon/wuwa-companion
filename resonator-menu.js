'use strict';
let menuRules=null,menuRulesRequest=null,weaponMenuReference=null,weaponMenuRequest=0;
// AttributeModel floors whole values and percentages to one decimal place.
function menuNumber(value,percent=false){const factor=percent?10:1;return value==null?'—':new Intl.NumberFormat(lang,{minimumFractionDigits:percent?1:0,maximumFractionDigits:percent?1:0}).format(Math.floor(value*factor)/factor)+(percent?' %':'');}
function menuStatsHTML(rows){return `<dl class="game-stat-list">${rows.map(p=>`<div><dt>${p.icon?`<img src="${esc(assetUrl(p.icon))}" alt="" width="26" height="26" loading="lazy">`:''}${esc(p.labels?.[lang]||'')}</dt><dd>${menuNumber(p.value,p.percent)}</dd></div>`).join('')}</dl>`;}
async function loadMenuRules(){
 if(menuRules||menuRulesRequest)return menuRulesRequest;
 menuRulesRequest=(async()=>{try{const data=await fetchJSON('./data/menu-rules.json');if(data.schema!==1||data.gameVersion!==catalogState.gameVersion||!Array.isArray(data.roleGrowth)||!Array.isArray(data.weaponGrowth))return;menuRules=data;}catch{}finally{menuRulesRequest=null;}})();return menuRulesRequest;
}
async function prepareMenuReference(character){
 await Promise.all([loadMenuRules(),loadResonatorReference(character.gameId)]);
 if(editingName!==character.name)return;
 drawAttributeMenu();refreshWeaponMenu();
}
function drawAttributeMenu(){
 const box=document.getElementById('attributeStats'),reference=currentResonatorReference();if(!box)return;
 const rows=MenuStats.character(reference,menuRules,editingLevel,editingAscension);
 box.innerHTML=rows.length?menuStatsHTML(rows):`<p class="editor-hint">${tr('Attributs de référence indisponibles.','Reference attributes unavailable.')}</p>`;
 document.getElementById('attributeScope').textContent=tr('Attributs de base au niveau indiqué, hors équipement et bonus. — : niveau ou ascension à compléter.','Base attributes at the recorded level, before equipment and bonuses. —: complete the level or ascension.');
 const tags=document.getElementById('roleTags');tags.innerHTML=(reference?.tags||[]).map(tag=>`<details class="game-role-tag"><summary>${tag.icon?`<img src="${esc(assetUrl(tag.icon))}" alt="" width="28" height="28">`:''}<span>${esc(tag.locales[lang].name)}</span></summary><p>${esc(tag.locales[lang].description)}</p></details>`).join('');
 document.getElementById('roleTagsTitle').textContent=tr('Style de combat','Combat roles');
 document.getElementById('attributeMore').textContent=tr('Détails des attributs','Attribute details');
 const ascension=editingAscension??(menuRules&&MenuStats.curve(menuRules.roleGrowth,editingLevel,null)?.[1]);
 const cap=ascension==null?'?':[20,40,50,60,70,80,90][ascension];
 document.getElementById('overviewProgress').innerHTML=`<span>${tr('Nv.','Lv.')} <b>${editingLevel??'—'}</b> / ${cap}</span><span>${editingLevel===90?'Max':''}</span>`;
 // Experience is not tracked. Only the known maximum-level state fills the bar.
 document.getElementById('overviewProgressBar').style.setProperty('--progress',editingLevel===90?'100%':'0%');
 document.getElementById('overviewStars').innerHTML=ascension==null?'':Array.from({length:6},(_,i)=>`<img src="${esc(assetUrl('/Game/Aki/UI/UIResources/Common/Atlas/SP_StarRoleAttri.SP_StarRoleAttri'))}" alt="" width="32" height="32" ${i>=ascension?'class="is-inactive"':''}>`).join('');
}
async function refreshWeaponMenu(){
 const request=++weaponMenuRequest,row=WEAPONS.find(w=>w.name===editingWeapon);
 weaponMenuReference=null;drawWeaponMenu();
 if(!row)return;
 const reference=await loadWeaponReference(row.gameId);if(request!==weaponMenuRequest)return;
 weaponMenuReference=reference;drawWeaponMenu();
}
function drawWeaponMenu(){
 const box=document.getElementById('weaponDescription');if(!box)return;
 const reference=weaponMenuReference,detail=reference?.locales?.[lang],rank=editingWeaponRank;
 if(!detail){box.innerHTML=editingWeapon?`<p class="editor-hint">${tr('Référence de l’arme en cours de chargement ou indisponible.','Weapon reference loading or unavailable.')}</p>`:'';return;}
 const current=rank?detail.ranks[rank-1]:null;
 box.innerHTML=menuStatsHTML(MenuStats.weapon(reference,menuRules,editingWeaponLevel,editingWeaponAscension))+`<p class="editor-hint">${tr('Valeurs de l’arme au niveau et à l’ascension indiqués.','Weapon values at the recorded level and ascension.')}</p><h4><span>${tr('Rang','Rank')} ${rank??'—'}</span> ${esc(current?.name||detail.ResonName)}</h4><p class="source-description">${esc(current?.description||detail.Desc)}</p><details class="weapon-syntony"><summary>${tr('Syntonisation · détails des rangs','Syntony · rank details')}</summary>${detail.ranks.map((r,i)=>`<section><h5>${tr('Rang','Rank')} ${i+1}${rank===i+1?' · '+tr('Actuel','Current'):''}</h5><p>${esc(r.description)}</p></section>`).join('')}</details><details><summary>${tr('Histoire de l’arme','Weapon background')}</summary><p class="source-description">${esc(detail.background)}</p></details>`;
}
document.getElementById('attributeMore').addEventListener('click',()=>{
 const reference=currentResonatorReference(),rows=MenuStats.character(reference,menuRules,editingLevel,editingAscension);
 const equipped=editingEchoes.after.filter(e=>e.owner===editingEchoes.owner),echo=MenuStats.echoes(equipped);
 document.getElementById('attributeDetailTitle').textContent=tr('Détails des attributs','Attribute details');
 document.getElementById('attributeDetailContent').innerHTML=`<h3>${tr('Résonateur · base','Resonator · base')}</h3>${menuStatsHTML(rows)}<p class="editor-hint">${esc(document.getElementById('attributeScope').textContent)}</p><h3>${tr('Arme équipée','Equipped weapon')}</h3>${weaponMenuReference?menuStatsHTML(MenuStats.weapon(weaponMenuReference,menuRules,editingWeaponLevel,editingWeaponAscension)):'<p>—</p>'}<h3>${tr('Échos · attributs cumulés','Echoes · combined attributes')}</h3>${echoTotalsHTML(echo)}<p class="editor-hint">${tr('Les bonus conditionnels des compétences, armes et Sonates ne sont pas simulés ici.','Conditional skill, weapon and Sonata effects are not simulated here.')}</p>`;
 openDialog('attributeDetail');
});
document.getElementById('attributeDetailClose').addEventListener('click',()=>closeDialog('attributeDetail'));
document.getElementById('weaponOrder').addEventListener('change',drawWeapons);
