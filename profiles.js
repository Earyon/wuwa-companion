'use strict';
let profileSelection=null,profileTab='overview',encyKind='character',libraryQuery='',libraryType='all';
const profileSources=new Map(),profilePending=new Map();
function sourceText(value){const raw=content(value).replace(/<br\s*\/?\s*>/gi,'\n').replace(/<[^>]*>/g,'');const text=document.createElement('textarea');text.innerHTML=raw;return text.value.trim();}
function profileRow(){return profileSelection?.kind==='character'?DATA.find(c=>c.id===profileSelection.id):profileSelection?.kind==='weapon'?WEAPONS.find(w=>w.id===profileSelection.id):extendedCatalog.echo.find(e=>e.id===profileSelection?.id);}
const profileKey=(selection,language=lang)=>language+':'+selection.kind+':'+selection.id;
function projectProfileDetail(kind,data){
 if(kind==='character')return {Id:data.Id,Introduction:data.Introduction,Properties:(data.Properties||[]).map(p=>({Name:p.Name,BaseValue:p.BaseValue})),Skills:(data.Skills||[]).map(s=>({SkillId:s.SkillId,SkillType:s.SkillType,SkillName:s.SkillName,SkillDescribe:s.SkillDescribe,SkillAttributes:s.SkillAttributes,SkillDetailNum:s.SkillDetailNum})),ResonantChain:data.ResonantChain||[]};
 if(kind==='weapon')return {ItemId:data.ItemId,Desc:data.Desc,ResonName:data.ResonName,Properties:(data.Properties||[]).map(p=>({Name:p.Name,BaseValue:p.BaseValue}))};
 return {Id:data.MonsterId,Name:data.MonsterName,Description:data.Skill?.SimplyDescription||data.AttributesDescription};
}
async function loadProfileSource(selection,{refresh=false}={}){
 const language=lang,key=profileKey(selection,language),row=(selection.kind==='character'?DATA:selection.kind==='weapon'?WEAPONS:extendedCatalog.echo).find(r=>r.id===selection.id);if(!row)return;
 if(profilePending.has(key))return profilePending.get(key);if(profileSources.has(key)&&!refresh)return;
 const promise=(async()=>{
  const cacheKey='wwc_profile_detail_v1:'+key;let cached=null;try{cached=JSON.parse(localStorage.getItem(cacheKey)||'null');}catch{}
  if(cached?.data&&String(selection.kind==='weapon'?cached.data.ItemId:cached.data.Id)!==String(row.gameId||row.id))cached=null;
  if(cached?.data&&cached.version===catalogState.gameVersion&&!refresh){profileSources.set(key,{data:cached.data});return;}
  try{
   let raw;if(language==='en'&&selection.kind==='character')raw=(await getCharacterDetail(row.gameId,{background:refresh})).detail;
   else if(language==='en'&&selection.kind==='weapon')raw=await getWeaponDetail(row.gameId,{refresh});
   else raw=await fetchJSON(`${ENCORE_BASE}/${language}/${selection.kind}/${encodeURIComponent(row.gameId||row.id)}`);
   const id=selection.kind==='weapon'?raw.ItemId:selection.kind==='echo'?raw.MonsterId:raw.Id;if(String(id)!==String(row.gameId||row.id))throw Error('Invalid detail identity');
   const data=projectProfileDetail(selection.kind,raw);profileSources.set(key,{data});try{localStorage.setItem(cacheKey,JSON.stringify({data,at:new Date().toISOString(),version:catalogState.gameVersion}));}catch{}
  }catch{profileSources.set(key,{data:cached?.data||null,error:true});}
 })();profilePending.set(key,promise);
 try{await promise;}finally{profilePending.delete(key);if(profileSelection&&profileKey(profileSelection)===key&&['overview','skills','sequence'].includes(profileTab))renderProfileSection();}
}
function openDetail(name){const row=DATA.find(c=>c.name===name);if(row)openProfile('character',row.id);}
function openProfile(kind,id){
 profileSelection={kind,id};profileTab='overview';const row=profileRow();if(!row)return;
 document.getElementById('detailContent').innerHTML=`<div class="profile-header"><div class="profile-art">${row.image?`<img src="${esc(row.image)}" alt="">`:'<span aria-hidden="true">◇</span>'}</div><div><p class="profile-kicker">${kind==='character'?esc(row.element+' · '+weaponLabel(row.weapon)):kind==='weapon'?esc(weaponLabel(row.type)):tr('Écho','Echo')}</p><h1 id="profileName">${esc(row.name)}</h1><p>${kind==='character'?(CompanionStore.get().roster?.includes(id)?tr('Possédé','Owned'):tr('Non possédé','Not owned')):kind==='weapon'?'★'.repeat(row.rarity):esc(row.sets.map(s=>s.name).join(' · '))}</p><div class="companion-actions">${kind==='character'?companionButton('profile-wish',tr('Souhait','Wishlist'),id)+companionButton('profile-improve',tr('Améliorer','Improve'),id):''}</div></div></div><nav id="profileTabs" class="section-tabs" aria-label="${tr('Rubriques de la fiche','Profile sections')}"></nav><div id="profileSection"></div>`;
 renderProfileSection();openDialog('detail');document.getElementById('detail').scrollTop=0;loadProfileSource({...profileSelection});
}
function renderProfileSection(){
 const row=profileRow(),box=document.getElementById('profileSection');if(!row||!box)return;
 const kinds=profileSelection.kind==='character'?['overview','build','skills','sequence','teams']:['overview'];
 document.getElementById('profileTabs').innerHTML=kinds.map(tab=>`<button type="button" data-action="profile-tab" data-value="${tab}" aria-current="${tab===profileTab?'page':'false'}">${({overview:tr('Aperçu','Overview'),build:'Build',skills:tr('Forte','Forte'),sequence:tr('Séquence','Sequence'),teams:tr('Équipes','Teams')})[tab]}</button>`).join('');
 if(profileTab==='build'){box.innerHTML=recommendationHTML(row)+buildProfilesHTML(row);return;}
 if(profileTab==='teams'){box.innerHTML=profileTeamsHTML(row);return;}
 const source=profileSources.get(profileKey(profileSelection)),data=source?.data;
 let html='';
 if(data){
  if(profileTab==='overview')html=`<p class="source-description">${esc(sourceText(data.Introduction||data.Desc||data.Description))||tr('Aucune description fournie par la source.','No description supplied by the source.')}</p>${data.Properties?.length?`<h3>${tr('Statistiques de base (niveau 1)','Base stats (level 1)')}</h3><dl class="profile-stats">${data.Properties.map(p=>`<div><dt>${esc(content(p.Name))}</dt><dd>${esc(p.BaseValue??'?')}</dd></div>`).join('')}</dl><p class="companion-note">${tr('Valeurs de base de la source ; aucun équipement ni bonus de compte inclus.','Base values from the source; no equipment or account bonuses included.')}</p>`:''}`;
  if(profileTab==='skills')html=(data.Skills||[]).map(s=>`<details class="kit-skill"><summary><span>${esc(content(s.SkillType))}</span><b>${esc(content(s.SkillName))}</b></summary><p class="source-description">${esc(sourceText(s.SkillDescribe))}</p>${skillMultipliersHTML(s)}</details>`).join('')||`<p>${tr('Compétences non disponibles dans la source.','Skills unavailable from the source.')}</p>`;
  if(profileTab==='sequence')html=(data.ResonantChain||[]).map(s=>`<details class="kit-skill"><summary><span>S${esc(s.GroupIndex)}</span><b>${esc(content(s.NodeName))}</b></summary><p class="source-description">${esc(sourceText(s.AttributesDescription))}</p></details>`).join('')||`<p>${tr('Séquence indisponible dans la source.','Sequence unavailable from the source.')}</p>`;
 }
 if(profileSelection.kind==='weapon'&&data)html='<h3>'+esc(content(data.ResonName))+'</h3><p class="companion-note">'+tr('Les valeurs séparées par / correspondent aux rangs R1 à R5, dans cet ordre.','Values separated by / correspond to ranks R1 through R5, in that order.')+'</p>'+html;
 box.innerHTML=html+(profileSelection.kind==='echo'?sonataReferencesHTML(row.sets.map(s=>s.id)):'')+`<p class="companion-note">${data?tr('Données de jeu · Encore · ','Game data · Encore · ')+lang.toUpperCase():source?.error?tr('Détail indisponible pour le moment.','Detail unavailable at this time.'):tr('Chargement du détail…','Loading detail…')}</p>${source?.error?`<p>${tr('Les données déjà disponibles restent affichées.','Previously available data remains visible.')}</p>`:''}${companionButton('profile-refresh',tr('Actualiser','Refresh'))}`;
}
function skillMultipliersHTML(skill){
 // Tables are displayed only when the source supplies explicit labelled rows.
 if(!Array.isArray(skill.SkillAttributes))return '';
 return skill.SkillAttributes.map(a=>{const name=content(a.attributeName||a.Name||a.name),values=a.Values||a.values;if(!name||!Array.isArray(values)||!values.every(v=>typeof v==='string'||typeof v==='number'))return '';return `<div class="skill-multiplier"><b>${esc(name)}</b><span>${tr('Niv. 1','Lv. 1')} : ${esc(values[0]??'?')}</span><span>${tr('Niv. 10','Lv. 10')} : ${esc(values[9]??'?')}</span></div>`;}).join('');
}
function profileTeamsHTML(row){const s=CompanionStore.get();return `<h3>${tr('Équipes contenant ce Résonateur','Teams containing this Resonator')}</h3><ul>${s.teams.filter(t=>t.members.includes(row.id)).map(t=>`<li>${esc(t.name)} : ${t.members.map(characterName).map(esc).join(' · ')}</li>`).join('')||`<li>${tr('Aucune équipe enregistrée.','No team saved.')}</li>`}</ul>${recommendationTeamsHTML(row)}${companionButton('profile-open-teams',tr('Gérer mes équipes','Manage my teams'))}`;}
function encyclopediaTabs(){return `<nav class="section-tabs" aria-label="${tr('Catalogues','Catalogues')}">${[['character',tr('Résonateurs','Resonators')],['weapon',tr('Armes','Weapons')],['echo',tr('Échos','Echoes')]].map(([kind,name])=>`<button type="button" data-action="ency-kind" data-value="${kind}" aria-current="${encyKind===kind?'page':'false'}">${name}</button>`).join('')}</nav>`;}
function libraryPage(){
 if(encyKind==='echo'&&!extendedCatalog.echo.length&&!extendedCatalog.loading.echo&&!extendedCatalog.errors.echo)queueMicrotask(()=>loadExtended('echo'));
 const rows=(encyKind==='weapon'?WEAPONS:extendedCatalog.echo).filter(r=>(r.name+' '+(r.label||'')).toLocaleLowerCase().includes(libraryQuery.toLocaleLowerCase())&&(libraryType==='all'||r.type===libraryType)).sort((a,b)=>(b.rarity||0)-(a.rarity||0)||a.name.localeCompare(b.name,lang));
 return companionPanel(encyKind==='weapon'?tr('Armes','Weapons'):tr('Échos','Echoes'),`<form id="librarySearch" class="companion-form"><label>${tr('Rechercher','Search')}<input name="query" type="search" value="${esc(libraryQuery)}"></label>${encyKind==='weapon'?buildField(tr('Type','Type'),'type',[['all',tr('Tous','All')],...['Sword','Broadblade','Pistols','Gauntlets','Rectifier'].map(t=>[t,weaponLabel(t)])],libraryType):''}<button class="companion-button">${tr('Rechercher','Search')}</button></form><div class="library-grid">${rows.map(r=>`<button type="button" class="library-item" data-action="profile" data-value="${encyKind}|${r.id}">${r.image?`<img src="${esc(r.image)}" alt="" loading="lazy">`:'<span aria-hidden="true">◇</span>'}<b>${esc(r.label||r.name)}</b><small>${encyKind==='weapon'?'★'.repeat(r.rarity):esc(r.sets.map(s=>s.name).join(' · '))}</small></button>`).join('')||`<p>${extendedCatalog.loading.echo?tr('Chargement…','Loading…'):tr('Aucun résultat disponible.','No results available.')}</p>`}</div>${encyKind==='echo'&&extendedCatalog.errors.echo?companionButton('reload-catalogue',tr('Réessayer','Retry'),'echo'):''}`);
}
Object.assign(companionActions,{
 'profile':value=>{const [kind,id]=value.split('|');if(['character','weapon','echo'].includes(kind))openProfile(kind,id);},
 'profile-tab':tab=>{profileTab=tab;renderProfileSection();document.querySelector(`#profileTabs [data-value="${tab}"]`)?.focus();},
 'profile-refresh':()=>loadProfileSource({...profileSelection},{refresh:true}),
 'profile-wish':id=>{CompanionStore.update(s=>{s.wishlist=s.wishlist.includes(id)?s.wishlist.filter(x=>x!==id):[...s.wishlist,id];},tr('Souhait actualisé','Wishlist updated'));companionMessage(CompanionStore.get().wishlist.includes(id)?tr('Ajouté aux souhaits.','Added to wishlist.'):tr('Retiré des souhaits.','Removed from wishlist.'));},
 'profile-improve':id=>{if(!CompanionStore.get().roster?.includes(id)){companionMessage(tr('Ajoute ce Résonateur à ton compte, ou prépare son pré-farm depuis les Souhaits.','Add this Resonator to your account, or prepare pre-farming from Wishlist.'));return;}closeDialog('detail');planningCharacter=id;currentView='planner';render();},
 'profile-open-teams':()=>{closeDialog('detail');moreTab='teams';currentView='more';render();},
 'ency-kind':kind=>{if(!['character','weapon','echo'].includes(kind))return;encyKind=kind;libraryQuery='';libraryType='all';render();}
});
document.getElementById('view').addEventListener('submit',event=>{if(event.target.id==='librarySearch'){event.preventDefault();const f=new FormData(event.target);libraryQuery=f.get('query');libraryType=f.get('type')||'all';render();}});
document.addEventListener('catalogue-ready',event=>{if(event.detail==='echo'&&currentView==='ency'&&encyKind==='echo')render();});
