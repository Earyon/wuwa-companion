'use strict';
let progressionTables=null;
const progressSources=new Map(),progressPending=new Map();
async function loadProgressSources(character,{refresh=false}={}){
 const state=CompanionStore.get(),copy=state.weapons.find(w=>w.id===state.characters[character.id]?.weaponCopyId),weapon=WEAPONS.find(w=>w.id===copy?.catalogId);
 const key=character.id+':'+(weapon?.id||'');
 if(progressPending.has(key))return progressPending.get(key);
 if(progressSources.has(key)&&!refresh)return progressSources.get(key);
 const promise=(async()=>{
  if(!progressionTables)try{const tables=await fetchJSON('./data/progression.json');if(tables.schema!==1||!tables.roleLevels||!tables.weaponLevels)throw Error('Invalid progression tables');progressionTables=tables;}catch{/* Other verified costs remain usable. */}
  const result={detail:null,weaponDetail:null};
  const records=await Promise.allSettled([getCharacterDetail(character.gameId,{background:refresh}),weapon?getWeaponDetail(weapon.gameId,{refresh}):Promise.resolve(null)]);
  if(records[0].status==='fulfilled')result.detail=records[0].value.detail;
  if(records[1].status==='fulfilled')result.weaponDetail=records[1].value;
  if(!result.detail)result.detail=readCharacterDetailCache(character.gameId);
  if(result.detail?.Skills)result.detail={...result.detail,Skills:result.detail.Skills.map(s=>({...s,SkillType:normalizeSkillType(s.SkillType)}))};
  progressSources.set(key,result);document.dispatchEvent(new CustomEvent('progression-ready',{detail:character.id}));return result;
 })();progressPending.set(key,promise);
 try{return await promise;}finally{progressPending.delete(key);}
}
async function getWeaponDetail(gameId,{refresh=false}={}){
 const key='wwc_weapon_detail_v1:'+gameId;let cached;try{cached=JSON.parse(localStorage.getItem(key)||'null');}catch{}
 if(cached?.detail&&!refresh)return cached.detail;
 try{const detail=await fetchJSON(`${ENCORE_BASE}/en/weapon/${encodeURIComponent(gameId)}`);if(String(detail.ItemId)!==String(gameId))throw Error('Invalid weapon ID');try{localStorage.setItem(key,JSON.stringify({detail,savedAt:new Date().toISOString()}));}catch{}return detail;}catch(error){if(cached?.detail)return cached.detail;throw error;}
}
function planningActual(character,goal){
 const state=CompanionStore.get();if(!goal?.prefarm||state.roster?.includes(character.id))return state.characters[character.id]||{};
 return {level:1,ascension:0,skills:Object.fromEntries(SKILL_ORDER.map(k=>[k,1])),forteNodes:Object.fromEntries(Object.keys(goal.forteNodes||{}).map(k=>[k,false]))};
}
function currentCostPlan(character,goal,{load=true}={}){
 const state=CompanionStore.get(),actual=planningActual(character,goal),copy=state.weapons.find(w=>w.id===actual.weaponCopyId),weapon=WEAPONS.find(w=>w.id===copy?.catalogId);
 const source=progressSources.get(character.id+':'+(weapon?.id||''));
 if(load&&!source&&!progressPending.has(character.id+':'+(weapon?.id||'')))queueMicrotask(()=>loadProgressSources(character));
 const version=String(catalogState.gameVersion||'').split('.').slice(0,2).join('.');
 const tables=progressionTables&&(version==='test'||version===progressionTables.gameVersion.split('.').slice(0,2).join('.'))?progressionTables:null;
 const calculation=CostEngine.calculate(actual,goal,source?.detail,copy,source?.weaponDetail,tables);
 return {...calculation,rows:CostEngine.net(calculation.costs,state.resources,tables),source};
}
function materialName(id){return id==='exp:role'?tr('EXP de Résonateur','Resonator EXP'):id==='exp:weapon'?tr('EXP d’arme','Weapon EXP'):extendedCatalog.item.find(r=>r.id===id)?.name||id;}
function planCostsHTML(character,goal){
 if(!extendedCatalog.item.length&&!extendedCatalog.loading.item&&!extendedCatalog.errors.item)queueMicrotask(()=>loadExtended('item'));
 const plan=currentCostPlan(character,goal);
 return `<p class="companion-note">${tr('Les coûts de niveau partent du début du niveau actuel. L’EXP déjà gagnée dans ce niveau n’est pas déduite.','Level costs start at the beginning of the current level. EXP already earned within that level is not deducted.')}</p>${plan.missing.length?`<p class="companion-note">${tr('Calcul partiel : renseigne les niveaux, ascensions ou déblocages manquants. Certaines données source peuvent être indisponibles.','Partial calculation: record missing levels, ascensions or unlocks. Some source data may be unavailable.')}</p>${companionButton('refresh-plan',tr('Actualiser les données','Refresh data'),character.id)}`:''}
 <div class="companion-list">${plan.rows.map(row=>`<article class="companion-card"><div class="resource-symbol" aria-hidden="true">◇</div><div><b>${esc(materialName(row.id))}</b><small>${tr('Besoin','Required')} ${row.need.toLocaleString(lang)} · ${tr('Stock','Stock')} ${row.stock===null?'?':row.stock.toLocaleString(lang)}<br>${tr('À obtenir','To obtain')} : ${row.remaining===null?'?':row.remaining.toLocaleString(lang)}</small></div></article>`).join('')||`<p>${plan.complete?tr('Aucune ressource nécessaire pour les objectifs renseignés.','No resources needed for the recorded targets.'):tr('En attente des données nécessaires au calcul.','Waiting for the data needed to calculate costs.')}</p>`}</div>${companionButton('plan-resources',tr('Renseigner mes ressources','Record my resources'))}`;
}
