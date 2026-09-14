'use strict';
let profileSelection=null,profileTab='overview',encyKind='character',libraryQuery='',libraryDraft='',libraryType='all';
const profileSources=new Map(),profilePending=new Map();
function sourceText(value){const raw=content(value).replace(/<br\s*\/?\s*>/gi,'\n').replace(/<[^>]*>/g,'');const text=document.createElement('textarea');text.innerHTML=raw;return text.value.trim();}
function profileRow(){return profileSelection?.kind==='character'?DATA.find(c=>c.id===profileSelection.id):profileSelection?.kind==='weapon'?WEAPONS.find(w=>w.id===profileSelection.id):extendedCatalog.echo.find(e=>e.id===profileSelection?.id);}
const profileKey=(selection,language=lang)=>language+':'+selection.kind+':'+selection.id;
function validProfileShape(kind,data){
 if(!data||typeof data!=='object'||Array.isArray(data))return false;
 const fields=kind==='character'?['Properties','Skills','ResonantChain']:kind==='weapon'?['Properties']:[];
 return fields.every(key=>data[key]===undefined||Array.isArray(data[key])&&data[key].every(value=>value&&typeof value==='object'&&!Array.isArray(value)));
}
function projectProfileDetail(kind,data){
 if(!validProfileShape(kind,data))throw Error('Invalid detail shape');
 if(kind==='character')return {Id:data.Id,Introduction:data.Introduction,Properties:(data.Properties||[]).map(p=>({Name:p.Name,BaseValue:p.BaseValue})),Skills:(data.Skills||[]).map(s=>({SkillId:s.SkillId,SkillType:s.SkillType,TypeLabel:s.TypeLabel,SkillName:s.SkillName,SkillDescribe:s.SkillDescribe,Icon:s.Icon,SkillAttributes:s.SkillAttributes,SkillDetailNum:s.SkillDetailNum})),ResonantChain:data.ResonantChain||[]};
 if(kind==='weapon')return {ItemId:data.ItemId,Desc:data.Desc,ResonName:data.ResonName,Properties:(data.Properties||[]).map(p=>({Name:p.Name,BaseValue:p.BaseValue}))};
 return {Id:data.MonsterId,Name:data.MonsterName,Description:data.Skill?.SimplyDescription||data.AttributesDescription};
}
async function loadProfileSource(selection,{refresh=false}={}){
 const language=lang,key=profileKey(selection,language),row=(selection.kind==='character'?DATA:selection.kind==='weapon'?WEAPONS:extendedCatalog.echo).find(r=>r.id===selection.id);if(!row)return;
 const version=[catalogState.gameVersion,catalogState.resourceVersion,frenchGameText?.localSource?.patchVersion||'remote'].join(':');
 if(profilePending.has(key))return profilePending.get(key);if(profileSources.get(key)?.version===version&&!refresh)return;
 const promise=(async()=>{
  const cacheKey='wwc_profile_detail_v3:'+key;let cached=null;try{cached=JSON.parse(localStorage.getItem(cacheKey)||'null');}catch{}
  if(cached?.data&&(!validProfileShape(selection.kind,cached.data)||String(selection.kind==='weapon'?cached.data.ItemId:cached.data.Id)!==String(row.gameId||row.id)))cached=null;
  if(cached?.data&&cached.version===version&&!refresh){profileSources.set(key,{data:cached.data,version});return;}
  try{
   let raw;const reference=selection.kind==='character'?await loadResonatorReference(row.gameId):selection.kind==='weapon'?await loadWeaponReference(row.gameId):null;
   if(reference)raw=reference.locales[language];
   else if(language==='en'&&selection.kind==='character')raw=(await getCharacterDetail(row.gameId,{background:refresh})).detail;
   else if(language==='en'&&selection.kind==='weapon')raw=await getWeaponDetail(row.gameId,{refresh});
   else raw=await fetchJSON(`${ENCORE_BASE}/${language}/${selection.kind}/${encodeURIComponent(row.gameId||row.id)}`);
   const id=selection.kind==='weapon'?raw.ItemId:selection.kind==='echo'?raw.MonsterId:raw.Id;if(String(id)!==String(row.gameId||row.id))throw Error('Invalid detail identity');
   const data=projectProfileDetail(selection.kind,raw);profileSources.set(key,{data,version});try{localStorage.setItem(cacheKey,JSON.stringify({data,at:new Date().toISOString(),version}));}catch{}
  }catch{profileSources.set(key,{data:cached?.data||null,error:true,version});}
 })();profilePending.set(key,promise);
 try{await promise;}finally{profilePending.delete(key);if(profileSelection&&profileKey(profileSelection)===key&&['overview','skills','sequence'].includes(profileTab))renderProfileSection();}
}
function openDetail(name){const row=DATA.find(c=>c.name===name);if(row)openProfile('character',row.id);}
function openProfile(kind,id){
 profileSelection={kind,id};profileTab='overview';const row=profileRow();if(!row)return;
 document.getElementById('detailContent').innerHTML=`<div class="profile-header"><div class="profile-art">${row.image?`<img src="${esc(kind==='character'?characterArtwork(row):equipmentArtwork(row,kind==='weapon'?'weapons':'echoes'))}" alt="">`:'<span aria-hidden="true">◇</span>'}</div><div><p class="profile-kicker">${kind==='character'?esc(row.element+' · '+weaponLabel(row.weapon)):kind==='weapon'?esc(weaponLabel(row.type)):tr('Écho','Echo')}</p><h1 id="profileName">${esc(gameLabel(row))}</h1><p>${kind==='character'?(CompanionStore.get().roster?.includes(id)?tr('Possédé','Owned'):tr('Non possédé','Not owned')):kind==='weapon'?'★'.repeat(row.rarity):esc(row.sets.map(s=>gameText(s.name)).join(' · '))}</p><div class="companion-actions">${kind==='character'&&guidesVisible?companionButton('profile-wish',tr('Souhait','Wishlist'),id)+companionButton('profile-improve',tr('Améliorer','Improve'),id):''}</div></div></div><nav id="profileTabs" class="section-tabs" aria-label="${tr('Rubriques de la fiche','Profile sections')}"></nav><div id="profileSection"></div>`;
 renderProfileSection();openDialog('detail');document.getElementById('detail').scrollTop=0;loadProfileSource({...profileSelection});
}
function renderProfileSection(){
 const row=profileRow(),box=document.getElementById('profileSection');if(!row||!box)return;
 const kinds=profileSelection.kind==='character'?(guidesVisible?['overview','build','skills','sequence','teams']:['overview','skills','sequence']):['overview'];
 document.getElementById('profileTabs').innerHTML=kinds.map(tab=>`<button type="button" data-action="profile-tab" data-value="${tab}" aria-current="${tab===profileTab?'page':'false'}">${({overview:tr('Aperçu','Overview'),build:tr('Configuration','Build'),skills:tr('Forte','Forte'),sequence:tr('Séquence','Sequence'),teams:tr('Équipes','Teams')})[tab]}</button>`).join('');
 if(!kinds.includes(profileTab))profileTab='overview';
 if(profileTab==='build'){box.innerHTML=recommendationHTML(row)+buildProfilesHTML(row);return;}
 if(profileTab==='teams'){box.innerHTML=profileTeamsHTML(row);return;}
 const source=profileSources.get(profileKey(profileSelection)),data=source?.data;
 let html='';
 if(data){
  if(profileTab==='overview')html=`<p class="source-description">${esc(sourceText(data.Introduction||data.Desc||data.Description))||tr('Aucune description fournie par la source.','No description supplied by the source.')}</p>${data.Properties?.length?`<h3>${tr('Statistiques de base (niveau 1)','Base stats (level 1)')}</h3><dl class="profile-stats">${data.Properties.map(p=>`<div><dt>${esc(content(p.Name))}</dt><dd>${esc(p.BaseValue??'?')}</dd></div>`).join('')}</dl><p class="companion-note">${tr('Valeurs de base de la source ; aucun équipement ni bonus de compte inclus.','Base values from the source; no equipment or account bonuses included.')}</p>`:''}`;
  if(profileTab==='skills')html=(data.Skills||[]).filter(s=>s.SkillName||s.SkillDescribe).map(s=>`<details class="kit-skill"><summary>${s.Icon?`<img class="kit-icon" src="${esc(assetUrl(s.Icon))}" alt="" width="40" height="40" loading="lazy">`:''}<span>${esc(s.TypeLabel||gameText(s.SkillType))}</span><b>${esc(content(s.SkillName))}</b></summary><p class="source-description">${esc(sourceText(s.SkillDescribe))}</p>${skillMultipliersHTML(s)}</details>`).join('')||`<p>${tr('Compétences non disponibles dans la source.','Skills unavailable from the source.')}</p>`;
  if(profileTab==='sequence')html=(data.ResonantChain||[]).map(s=>`<details class="kit-skill"><summary>${s.NodeIcon?`<img class="kit-icon" src="${esc(assetUrl(s.NodeIcon))}" alt="" width="40" height="40" loading="lazy">`:''}<span>S${esc(s.GroupIndex)}</span><b>${esc(content(s.NodeName))}</b></summary><p class="source-description">${esc(sourceText(s.AttributesDescription))}</p></details>`).join('')||`<p>${tr('Séquence indisponible dans la source.','Sequence unavailable from the source.')}</p>`;
 }
 if(profileSelection.kind==='weapon'&&data)html='<h3>'+esc(content(data.ResonName))+'</h3><p class="companion-note">'+tr('Les valeurs séparées par / correspondent aux rangs R1 à R5, dans cet ordre.','Values separated by / correspond to ranks R1 through R5, in that order.')+'</p>'+html;
 box.innerHTML=html+(profileSelection.kind==='echo'?sonataReferencesHTML(row.sets.map(s=>s.id)):'')+`<p class="companion-note">${data?tr('Données Kuro Games · Références locales / Encore · ','Kuro Games data · Local references / Encore · ')+lang.toUpperCase():source?.error?tr('Détail indisponible pour le moment.','Detail unavailable at this time.'):tr('Chargement du détail…','Loading detail…')}</p>${source?.error?`<p>${tr('Les données déjà disponibles restent affichées.','Previously available data remains visible.')}</p>`:''}${companionButton('profile-refresh',tr('Actualiser','Refresh'))}`;
}
function skillMultipliersHTML(skill){
 // Tables are displayed only when the source supplies explicit labelled rows.
 if(!Array.isArray(skill.SkillAttributes))return '';
 return skill.SkillAttributes.map(a=>{const name=content(a.attributeName||a.Name||a.name),values=a.Values||a.values;if(!name||!Array.isArray(values)||!values.every(v=>typeof v==='string'||typeof v==='number'))return '';return `<div class="skill-multiplier"><b>${esc(name)}</b><span>${tr('Niv. 1','Lv. 1')} : ${esc(values[0]??'?')}</span><span>${tr('Niv. 10','Lv. 10')} : ${esc(values[9]??'?')}</span></div>`;}).join('');
}
function profileTeamsHTML(row){const s=CompanionStore.get();return `<h3>${tr('Équipes contenant ce Résonateur','Teams containing this Resonator')}</h3><ul>${s.teams.filter(t=>t.members.includes(row.id)).map(t=>`<li>${esc(t.name)} : ${t.members.map(characterName).map(esc).join(' · ')}</li>`).join('')||`<li>${tr('Aucune équipe enregistrée.','No team saved.')}</li>`}</ul>${guidesVisible?recommendationTeamsHTML(row):''}${companionButton('profile-open-teams',tr('Gérer mes équipes','Manage my teams'))}`;}
function encyclopediaTabs(){return `<nav class="section-tabs" aria-label="${tr('Catalogues','Catalogues')}">${[['character',tr('Résonateurs','Resonators')],['weapon',tr('Armes','Weapons')],['echo',tr('Échos','Echoes')]].map(([kind,name])=>`<button type="button" data-action="ency-kind" data-value="${kind}" aria-current="${encyKind===kind?'page':'false'}">${name}</button>`).join('')}</nav>`;}
function libraryResultsHTML(){
 const rows=(encyKind==='weapon'?WEAPONS:extendedCatalog.echo).filter(r=>gameSearch(r,libraryQuery)&&(libraryType==='all'||r.type===libraryType)).sort((a,b)=>(b.rarity||0)-(a.rarity||0)||gameLabel(a).localeCompare(gameLabel(b),lang));
 return '<p class="companion-note" role="status">'+rows.length+' '+tr('résultats','results')+'</p><div class="library-grid">'+rows.map(r=>'<button type="button" class="library-item" data-action="profile" data-value="'+encyKind+'|'+r.id+'">'+(r.image?'<img src="'+esc(r.image)+'" alt="" loading="lazy" decoding="async">':'<span aria-hidden="true">◇</span>')+'<b>'+esc(gameLabel(r))+'</b><small>'+(encyKind==='weapon'?'★'.repeat(r.rarity):esc(r.sets.map(s=>gameText(s.name)).join(' · ')))+'</small></button>').join('')+(rows.length?'':'<p>'+(extendedCatalog.loading.echo?tr('Chargement…','Loading…'):tr('Aucun résultat disponible.','No results available.'))+'</p>')+'</div>';
}
function refreshLibraryResults(){const box=document.getElementById('libraryResults');if(box)box.innerHTML=libraryResultsHTML();}
function libraryPage(){
 if(encyKind==='echo'&&!extendedCatalog.echo.length&&!extendedCatalog.loading.echo&&!extendedCatalog.errors.echo)queueMicrotask(()=>loadExtended('echo'));
 return companionPanel(encyKind==='weapon'?tr('Armes','Weapons'):tr('Échos','Echoes'),'<form id="librarySearch" class="companion-form"><label>'+tr('Rechercher','Search')+'<input name="query" type="search" value="'+esc(libraryDraft)+'"></label>'+(encyKind==='weapon'?buildField(tr('Type','Type'),'type',[['all',tr('Tous','All')],...['Sword','Broadblade','Pistols','Gauntlets','Rectifier'].map(t=>[t,weaponLabel(t)])],libraryType):'')+'<button class="companion-button">'+tr('Rechercher','Search')+'</button></form><div id="libraryResults">'+libraryResultsHTML()+'</div>'+(encyKind==='echo'&&extendedCatalog.errors.echo?companionButton('reload-catalogue',tr('Réessayer','Retry'),'echo'):''));
}
Object.assign(companionActions,{
 'profile':value=>{const [kind,id]=value.split('|');if(['character','weapon','echo'].includes(kind))openProfile(kind,id);},
 'profile-tab':tab=>{profileTab=tab;renderProfileSection();document.querySelector(`#profileTabs [data-value="${tab}"]`)?.focus();},
 'profile-refresh':()=>loadProfileSource({...profileSelection},{refresh:true}),
 'profile-wish':id=>{CompanionStore.update(s=>{s.wishlist=s.wishlist.includes(id)?s.wishlist.filter(x=>x!==id):[...s.wishlist,id];},tr('Souhait actualisé','Wishlist updated'));companionMessage(CompanionStore.get().wishlist.includes(id)?tr('Ajouté aux souhaits.','Added to wishlist.'):tr('Retiré des souhaits.','Removed from wishlist.'));},
 'profile-improve':id=>{if(!CompanionStore.get().roster?.includes(id)){companionMessage(tr('Ajoute ce Résonateur à ton compte, ou prépare son pré-farm depuis les Souhaits.','Add this Resonator to your account, or prepare pre-farming from Wishlist.'));return;}closeDialog('detail');planningCharacter=id;currentView='planner';render();},
 'profile-open-teams':()=>{closeDialog('detail');moreTab='teams';currentView='more';render();},
 'ency-kind':kind=>{if(!['character','weapon','echo'].includes(kind))return;encyKind=kind;libraryQuery='';libraryDraft='';libraryType='all';render();}
});
document.getElementById('view').addEventListener('submit',event=>{if(event.target.id==='librarySearch'){event.preventDefault();const f=new FormData(event.target);libraryQuery=f.get('query');libraryDraft=libraryQuery;libraryType=f.get('type')||'all';refreshLibraryResults();}});
document.addEventListener('catalogue-ready',event=>{if(event.detail==='echo'&&currentView==='ency'&&encyKind==='echo')refreshLibraryResults();});

document.getElementById('view').addEventListener('input',event=>{if(event.target.form?.id==='librarySearch'&&event.target.name==='query')libraryDraft=event.target.value;});
document.getElementById('view').addEventListener('change',event=>{if(event.target.form?.id==='librarySearch'&&event.target.name==='type'){libraryType=event.target.value||'all';refreshLibraryResults();}});
