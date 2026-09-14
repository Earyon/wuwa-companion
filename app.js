const personalReadErrors=[];
function canWritePersonalData(){
 if(!personalReadErrors.length&&!CompanionStore.error()&&CompanionStore.get().roster!==null)return true;
 alert(lang==='fr'?'Les données ne peuvent pas être enregistrées. Exporte ta sauvegarde dans Plus avant toute restauration.':'Data cannot be saved. Export your backup in More before restoring.');return false;
}
// Compatibility projection for existing views; all writes use CompanionStore.
let owned=[],ownedIds=[],accountData={};
function syncPersonalViews(){
 const state=CompanionStore.get();
 ownedIds=state.roster||[];
 owned=ownedIds.map(id=>DATA.find(r=>r.id===id)?.name).filter(Boolean);
 accountData=Object.fromEntries(DATA.filter(r=>Object.hasOwn(state.characters,r.id)).map(r=>{
  const progress=state.characters[r.id],copy=state.weapons.find(w=>w.id===progress.weaponCopyId);
  if(!copy)return [r.name,progress];
  const row=WEAPONS.find(w=>w.id===copy.catalogId);
  return [r.name,{...progress,weapon:{name:row?.name||copy.name||copy.catalogId,level:copy.level,rank:copy.rank,catalogId:copy.catalogId}}];
 }));
}

function normalizedLookupName(v){
 return String(v||"")
   .normalize("NFD").replace(/[\u0300-\u036f]/g,"")
   .toLowerCase()
   .replace(/[’‘`]/g,"'")
   .replace(/\bthe\b/g,"")
   .replace(/[^a-z0-9]+/g,"")
   .trim();
}
function resolveResonatorRef(ref){
 if(ref==null)return null;
 const raw=String(ref);
 let r=DATA.find(x=>x.id===raw||String(x.gameId||"")===raw||x.name===raw);
 if(r)return r;
 const key=normalizedLookupName(raw);
 return DATA.find(x=>normalizedLookupName(x.name)===key)||null;
}
function migrateOwnershipToCanonical(){
 if(!DATA.length)return;
 try{CompanionStore.migrate(resolveResonatorRef);personalReadErrors.length=0;}
 catch(error){personalReadErrors.splice(0,personalReadErrors.length,'account');console.warn('Personal records preserved; migration unavailable',error);}
 syncPersonalViews();
}
function changeOwnership(id,add){
 try{
  CompanionStore.update(state=>{state.roster=add?[...new Set([...state.roster,id])]:state.roster.filter(value=>value!==id);});
  syncPersonalViews();return true;
 }catch(error){companionMessage(lang==='fr'?'Modification non enregistrée. Vérifie l’espace de stockage.':'Change not saved. Check available storage.',true);return false;}
}
let lang='fr';try{if(localStorage.getItem('wwc_lang')==='en')lang='en';}catch{}
let encySort="alpha";
let encySortDir=1;
let ownedSort="alpha";
let ownedSortDir=1;
let ownedElement="All";
let currentView=CompanionStore.get().settings.startView||"account", accountTab="res", element="All";

const I18N={
 fr:{daily:"Tâches quotidiennes",ency:"Encyclopédie",account:"Mon compte",planner:"Planification",more:"Plus",back:"Retour",res:"Mes Résonateurs",weap:"Mes Armes",echo:"Mes Échos",resources:"Mes Ressources"},
 en:{daily:"Daily Tasks",ency:"Encyclopedia",account:"My Account",planner:"Planner",more:"More",back:"Back",res:"My Resonators",weap:"My Weapons",echo:"My Echoes",resources:"My Resources"}
};
const WEAPON_LABELS={fr:{Sword:"Sabre",Broadblade:"Épée",Pistols:"Pistolets",Gauntlets:"Gantelets",Rectifier:"Amplificateur",Unknown:"Inconnu"},en:{Sword:"Sword",Broadblade:"Broadblade",Pistols:"Pistols",Gauntlets:"Gauntlets",Rectifier:"Rectifier",Unknown:"Unknown"}};
const t=k=>I18N[lang][k]||k;
const weaponLabel=w=>(WEAPON_LABELS[lang]&&WEAPON_LABELS[lang][w])||w;
const esc=s=>String(s).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));

function setHeader(title,sub){
 document.querySelector("#pageTitle").textContent=title;
 document.querySelector("#pageSub").textContent=sub;
}
function setActiveNav(){
 document.documentElement.lang=lang;
 document.getElementById('skipLink').textContent=lang==='fr'?'Aller au contenu':'Skip to content';
 document.querySelectorAll('.closebtn').forEach(b=>b.setAttribute('aria-label',lang==='fr'?'Fermer':'Close'));
 document.querySelectorAll('input[placeholder]').forEach(input=>{if(!input.labels?.length&&!input.hasAttribute('aria-label'))input.setAttribute('aria-label',input.placeholder);});
 document.querySelectorAll("[data-view]").forEach(b=>{const active=b.dataset.view===currentView;b.classList.toggle("active",active);if(active)b.setAttribute('aria-current','page');else b.removeAttribute('aria-current');});
 const labs=[t("daily"),t("ency"),t("account"),t("planner"),t("more")];
 document.querySelectorAll(".bottom-nav small").forEach((x,i)=>x.textContent=i===0?(lang==='fr'?'Accueil':'Home'):labs[i]);
 document.querySelectorAll(".side-nav button span:last-child").forEach((x,i)=>x.textContent=labs[i]);
}
function accountTabs(){
 if(currentView!=="account"){document.querySelector("#accountTabs").innerHTML="";return}
 const tabs=[["res",t("res")],["weap",t("weap")],["echo",t("echo")],["resources",t("resources")]];
 document.querySelector("#accountTabs").innerHTML=`<div class="account-tabs">${tabs.map(([k,l])=>`<button class="${accountTab===k?"active":""}" onclick="accountTab='${k}';render()">${l}</button>`).join("")}</div>`;
}

function updateFilterButtons(containerSelector,value){
 const box=document.querySelector(containerSelector); if(!box)return;
 [...box.querySelectorAll("button")].forEach(btn=>{
   const txt=(btn.textContent||"").trim();
   const normalized=txt==="Tous"||txt==="All"?"All":txt;
   btn.classList.toggle("active",normalized===value);
 });
}
function setEncyElement(value){
 element=value;
 updateFilterButtons(".filter-sort-row .filters",value);
 drawCards();
}
function setOwnedElement(value){
 ownedElement=value;
 updateFilterButtons(".owned-filters",value);
 renderOwnedList();
}

function sortLabel(scope){
 const kind=scope==="ency"?encySort:ownedSort;
 const dir=scope==="ency"?encySortDir:ownedSortDir;
 if(kind==="alpha")return dir===1?"A → Z":"Z → A";
 return dir===-1?"5★ → 4★":"4★ → 5★";
}
function sortOptionLabel(scope,kind){
 const activeKind=scope==="ency"?encySort:ownedSort;
 const activeDir=scope==="ency"?encySortDir:ownedSortDir;
 if(kind==="alpha"){
   const dir=activeKind==="alpha"?activeDir:1;
   return dir===1?"A → Z":"Z → A";
 }
 const dir=activeKind==="rarity"?activeDir:-1;
 return dir===-1?"5★ → 4★":"4★ → 5★";
}
function sortDirectionHTML(label){
 const [from,to]=label.split(" → ");
 return `<span class="sort-direction"><span>${from}</span><svg class="sort-flow-arrow" viewBox="0 0 16 16" aria-hidden="true"><path d="M2 8h12m-4-4 4 4-4 4" fill="none" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round"/></svg><span>${to}</span></span>`;
}
function sortDropdownHTML(scope){
 return `<div class="sort-dropdown">
   <button class="sort-trigger" aria-label="${sortLabel(scope)}" aria-haspopup="menu" aria-expanded="false" onclick="toggleSortMenu('${scope}',event)">
     ${sortDirectionHTML(sortLabel(scope))}<svg class="sort-caret" viewBox="0 0 16 16" aria-hidden="true"><path d="m4 6 4 4 4-4" fill="none" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round"/></svg>
   </button>
   <div class="sort-menu" id="sortMenu-${scope}" role="menu">
     <button role="menuitem" aria-label="${sortOptionLabel(scope,"alpha")}" onclick="chooseSort('${scope}','alpha',event)">${sortDirectionHTML(sortOptionLabel(scope,"alpha"))}</button>
     <button role="menuitem" aria-label="${sortOptionLabel(scope,"rarity")}" onclick="chooseSort('${scope}','rarity',event)">${sortDirectionHTML(sortOptionLabel(scope,"rarity"))}</button>
   </div>
 </div>`;
}
function closeSortMenus(){
 document.querySelectorAll(".sort-menu.open").forEach(m=>m.classList.remove("open"));
 document.querySelectorAll(".sort-trigger[aria-expanded='true']").forEach(b=>b.setAttribute("aria-expanded","false"));
}
function toggleSortMenu(scope,event){
 event?.stopPropagation();
 const menu=document.querySelector(`#sortMenu-${scope}`); if(!menu)return;
 const open=!menu.classList.contains("open");
 closeSortMenus();
 menu.classList.toggle("open",open);
 menu.previousElementSibling?.setAttribute("aria-expanded",open?"true":"false");
}
function chooseSort(scope,kind,event){
 event?.stopPropagation();
 if(scope==="ency"){
   if(encySort===kind)encySortDir*=-1;
   else{encySort=kind;encySortDir=kind==="alpha"?1:-1}
   const oldQ=document.querySelector("#q")?.value||"";
   closeSortMenus();
   document.querySelector("#view").innerHTML=encyclopedia();
   const q=document.querySelector("#q"); if(q)q.value=oldQ;
   drawCards();
 }else{
   if(ownedSort===kind)ownedSortDir*=-1;
   else{ownedSort=kind;ownedSortDir=kind==="alpha"?1:-1}
   const oldQ=document.querySelector("#ownedSearch")?.value||"";
   closeSortMenus();
   document.querySelector("#view").innerHTML=account();
   const q=document.querySelector("#ownedSearch"); if(q)q.value=oldQ;
   renderOwnedList();
 }
}
document.addEventListener("click",closeSortMenus);

function account(){
 setHeader(t("account"),lang==="fr"?"Gérez vos Résonateurs, armes et ressources.":"Manage your Resonators, weapons and resources.");
 accountTabs();
 if(personalReadErrors.length)return `<div class="content-panel"><p>${lang==='fr'?'Données personnelles illisibles : elles ont été conservées sans modification. Ouvre Plus pour exporter ou restaurer une sauvegarde.':'Personal data is unreadable and has been preserved without changes. Open More to export or restore a backup.'}</p></div>`;
 if(accountTab!=="res"){
   return personalInventory();
 }
 return `<div class="content-panel">
   <div class="panel-head"><div><h2>${lang==="fr"?`Mes Résonateurs (${ownedIds.length})`:`My Resonators (${ownedIds.length})`}</h2><p>${lang==="fr"?"Ajoutez les Résonateurs que vous possédez et suivez leur progression.":"Add the Resonators you own and track their progression."}</p></div>
   <div class="tools"><div class="searchbox"><input id="ownedSearch" placeholder="${lang==="fr"?"Rechercher un Résonateur…":"Search a Resonator…"}" oninput="filterOwned()"></div><button class="goldbtn" onclick="openSelector()"><b>＋</b>${lang==="fr"?"Ajouter":"Add"}</button></div></div>
   <div class="filter-sort-row"><div class="filters owned-filters">${["All","Aero","Electro","Fusion","Glacio","Havoc","Spectro"].map(x=>`<button class="${ownedElement===x?"active":""}" onclick="setOwnedElement('${x}')">${x==="All"?(lang==="fr"?"Tous":"All"):x}</button>`).join("")}</div>${sortDropdownHTML("owned")}</div>
   <div class="res-list" id="ownedList"></div>
   <div class="footer-row"><span>${lang==="fr"?`Affichage : ${ownedIds.length} sur ${ownedIds.length}`:`Showing: ${ownedIds.length} of ${ownedIds.length}`}</span></div>
 </div>`;
}
function encyclopedia(){
 setHeader(t("ency"),lang==="fr"?"Résonateurs, armes et Échos de Wuthering Waves.":"Resonators, weapons and Echoes from Wuthering Waves.");
 document.querySelector("#accountTabs").innerHTML="";
 if(encyKind!=="character")return encyclopediaTabs()+libraryPage();
 return encyclopediaTabs()+`<div class="content-panel">
   <div class="panel-head"><div><h2>${lang==="fr"?"Résonateurs":"Resonators"}</h2><p>${DATA.length} ${lang==="fr"?"entrées":"entries"}</p></div><div class="tools"><div class="searchbox"><input id="q" placeholder="${lang==="fr"?"Rechercher un Résonateur…":"Search a Resonator…"}" oninput="drawCards()"></div></div></div>
   <div class="filter-sort-row ency-filter-sort"><div class="filters">${["All","Aero","Electro","Fusion","Glacio","Havoc","Spectro"].map(x=>`<button class="${element===x?"active":""}" onclick="setEncyElement('${x}')">${x==="All"?(lang==="fr"?"Tous":"All"):x}</button>`).join("")}</div>${sortDropdownHTML("ency")}</div>
   <div class="card-grid" id="grid"></div>
 </div>`;
}
function toggleEncySort(kind){
 if(encySort===kind)encySortDir*=-1;
 else{
   encySort=kind;
   encySortDir=kind==="rarity"?-1:1;
 }
 drawCards();
}

function drawCards(){
 if(!document.getElementById("grid"))return;
 const q=(document.querySelector("#q")?.value||"").toLowerCase().trim();
 const a=DATA
   .filter(x=>(element==="All"||x.element===element)&&gameSearch(x,q))
   .sort((a,b)=>{
     const alpha=gameLabel(a).localeCompare(gameLabel(b),lang==="fr"?"fr":"en",{sensitivity:"base"});
     if(encySort==="alpha")return encySortDir*alpha;
     const rarity=(Number(a.rarity)-Number(b.rarity))*encySortDir;
     return rarity||alpha;
   });
 document.querySelectorAll(".filters button").forEach(b=>b.classList.toggle("active",(element==="All"&&(b.textContent==="Tous"||b.textContent==="All"))||b.textContent===element));
 document.querySelector("#grid").innerHTML=a.map(x=>`<button type="button" class="char-card" onclick='openDetail(${esc(JSON.stringify(x.name))})'><span class="pic">${x.image?`<img src="${esc(x.image)}" alt="${esc(gameLabel(x))}" loading="lazy" decoding="async" fetchpriority="low">`:""}</span><span class="info"><b>${esc(gameLabel(x))}</b><small>${x.element} · ${weaponLabel(x.weapon)} · ${"★".repeat(x.rarity)}</small></span></button>`).join("");
}
function daily(){
 setHeader(t("daily"),lang==="fr"?"Votre tableau de bord personnel.":"Your personal dashboard.");document.querySelector("#accountTabs").innerHTML="";
 return personalDaily()+dailyActivities();
}
function planner(){
 setHeader(t("planner"),lang==="fr"?"Préparez un seul objectif actif à la fois.":"Prepare one active goal at a time.");document.querySelector("#accountTabs").innerHTML="";
 return personalPlanner();
}
function more(){
 setHeader(t("more"),lang==="fr"?"Réglages, import, historique et autres fonctions.":"Settings, import, history and more.");document.querySelector("#accountTabs").innerHTML="";
 return companionMore();
}


function auditRoverUniqueness(){
 const problems=[];
 const byElement=new Map();
 for(const r of DATA.filter(x=>isRover(x))){
   byElement.set(r.element,(byElement.get(r.element)||0)+1);
 }
 for(const [el,count] of byElement)if(count!==1)problems.push(`Rover ${el}: ${count} variants visible`);
 window.__WWC_ROVER_AUDIT__={ok:problems.length===0,problems,visible:[...byElement.entries()]};
 return window.__WWC_ROVER_AUDIT__;
}

function auditOrderingAndOwnership(){
 const problems=[];
 const sorted=[...DATA].sort((a,b)=>(Number(b.rarity)-Number(a.rarity))||a.name.localeCompare(b.name,"en",{sensitivity:"base"}));
 for(let i=1;i<sorted.length;i++){
   if(Number(sorted[i-1].rarity)<Number(sorted[i].rarity))problems.push("rarity ordering regression");
 }
 for(const id of ownedIds){
   if(!DATA.some(r=>r.id===id))problems.push(`owned id missing from catalogue: ${id}`);
 }
 window.__WWC_MIGRATION_AUDIT__={
   ok:problems.length===0,
   problems,
   ownedCount:ownedIds.length,
   catalogueCount:DATA.length,
   ownershipStorage:"stable IDs",
   encyclopediaOrder:"rarity desc, then alphabetical"
 };
 return window.__WWC_MIGRATION_AUDIT__;
}

function render(){
 if(!viewIsVisible(currentView))currentView='account';
 document.querySelectorAll('[data-view]').forEach(button=>button.hidden=!viewIsVisible(button.dataset.view));
 syncPersonalViews();
 if(DATA.length){auditOrderingAndOwnership();auditRoverUniqueness();}
 const html=currentView==="account"?account():currentView==="ency"?encyclopedia():currentView==="daily"?daily():currentView==="planner"?planner():more();
 document.querySelector("#view").innerHTML=html;
 setActiveNav();
 if(currentView==="ency")drawCards();
 if(currentView==="account"&&accountTab==="res")renderOwnedList();
 const bl=document.querySelector("#backLabel");if(bl)bl.textContent=t("back");
}
// Broken remote artwork must keep its reserved space and a usable local fallback.
document.addEventListener('error',event=>{const img=event.target;if(img instanceof HTMLImageElement&&img.hasAttribute('data-official-icon')){img.hidden=true;img.parentElement.title=tr('Miniature indisponible','Thumbnail unavailable');return;}if(img instanceof HTMLImageElement&&!img.onerror&&!img.dataset.fallback){img.dataset.fallback='true';img.src='./assets/portrait-placeholder.svg';}},true);


function renderOwnedList(){
 const listEl=document.querySelector("#ownedList"); if(!listEl)return;
 const q=(document.querySelector("#ownedSearch")?.value||"").toLowerCase().trim();
 let rows=ownedIds.map(id=>DATA.find(v=>v.id===id)).filter(Boolean);
 if(q) rows=rows.filter(x=>gameSearch(x,q));
 if(ownedElement!=="All")rows=rows.filter(x=>x.element===ownedElement);
 rows.sort((a,b)=>{
   const alpha=gameLabel(a).localeCompare(gameLabel(b),lang==="fr"?"fr":"en",{sensitivity:"base"});
   if(ownedSort==="alpha")return ownedSortDir*alpha;
   const rarity=(Number(a.rarity)-Number(b.rarity))*ownedSortDir;
   return rarity||alpha;
 });
 listEl.innerHTML=rows.length?rows.map(x=>`<div class="res-row" style="--element:${x.element==="Fusion"?"#ff826d":x.element==="Aero"?"#6ce1d2":x.element==="Spectro"?"#ffe08a":x.element==="Glacio"?"#76d7ff":x.element==="Electro"?"#b99aff":"#d676ff"}">
   <img src="${esc(x.image||'./assets/portrait-placeholder.svg')}" alt="" loading="lazy" decoding="async" fetchpriority="low">
   <div class="res-main"><b>${esc(gameLabel(x))}</b><div class="res-meta"><span class="element">✦ ${x.element}</span><span>${weaponLabel(x.weapon)}</span></div><div class="rarity-stars">${"★".repeat(x.rarity)}</div></div>
   <div class="status">${accountStatus(x.name)}</div>
   <button class="remove-res trash-btn" title="${lang==="fr"?"Retirer":"Remove"}" aria-label="${lang==="fr"?"Retirer "+esc(gameLabel(x)):"Remove "+esc(gameLabel(x))}" onclick='event.stopPropagation();removeOwned(${esc(JSON.stringify(x.name))})'>
     <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 3h6l1 2h4v2H4V5h4l1-2Zm-2 6h10l-.8 11H7.8L7 9Zm3 2v7h2v-7h-2Zm4 0v7h2v-7h-2Z"/></svg>
   </button>
   <button class="chev edit-chevron" title="${lang==="fr"?"Modifier":"Edit"}" aria-label="${lang==="fr"?"Modifier "+esc(gameLabel(x)):"Edit "+esc(gameLabel(x))}" onclick='openAccountEditor(${esc(JSON.stringify(x.name))})'>${lang==='fr'?'Ouvrir la fiche':'Open sheet'} <span aria-hidden="true">›</span></button>
 </div>`).join(""):`<div class="empty">${q?(lang==="fr"?"Aucun Résonateur ne correspond à la recherche.":"No Resonator matches your search."):(lang==="fr"?"Aucun Résonateur confirmé.":"No confirmed Resonator yet.")}</div>`;
 const footer=document.querySelector(".footer-row span");
 if(footer) footer.textContent=lang==="fr"?`Affichage : ${rows.length} sur ${ownedIds.length}`:`Showing: ${rows.length} of ${ownedIds.length}`;
}
function removeOwned(name){
 if(!canWritePersonalData())return;
 const msg=lang==="fr"?`Retirer ${name} de Mes Résonateurs ?`:`Remove ${name} from My Resonators?`;
 if(!confirm(msg))return;
 const r=resolveResonatorRef(name);
 if(r&&!changeOwnership(r.id,false))return;
 render();
}
function filterOwned(){ renderOwnedList(); }
let selectedResonators=new Set();
function openSelector(){
 selectedResonators=new Set();
 document.querySelector("#selectorTitle").textContent=lang==="fr"?"Ajouter mes Résonateurs":"Add my Resonators";
 document.querySelector("#selectorQ").placeholder=lang==="fr"?"Rechercher un Résonateur…":"Search a Resonator…";
 document.querySelector("#selectorQ").value="";
 openDialog('selector');drawSelector();
}
function drawSelector(){
 const q=(document.querySelector("#selectorQ").value||"").toLowerCase();
 const list=DATA
   .filter(x=>!ownedIds.includes(x.id)&&gameSearch(x,q))
   .sort((a,b)=>(Number(b.rarity)-Number(a.rarity))||gameLabel(a).localeCompare(gameLabel(b),lang==="fr"?"fr":"en",{sensitivity:"base"}));
 document.querySelector("#selectorGrid").innerHTML=list.map(x=>`<button class="select-card" data-select-resonator="${esc(x.id)}" aria-pressed="${selectedResonators.has(x.id)}">${x.image?`<img src="${esc(x.image)}" alt="" loading="lazy" decoding="async">`:""}<span>${esc(gameLabel(x))}</span></button>`).join("")||`<p>${tr('Aucun Résonateur à ajouter dans cette sélection.','No Resonators to add in this selection.')}</p>`;
 updateSelectorCount();
}
function updateSelectorCount(){
 const count=selectedResonators.size,button=document.getElementById('selectorSave');
 button.textContent=tr('Ajouter à mon compte','Add to my account');button.disabled=!count;
 document.getElementById('selectorCount').textContent=count+' '+tr('sélectionné(s)','selected');
}
document.getElementById('selectorGrid').addEventListener('click',event=>{
 const button=event.target.closest('[data-select-resonator]');if(!button)return;
 const id=button.dataset.selectResonator;
 if(selectedResonators.has(id))selectedResonators.delete(id);else selectedResonators.add(id);
 button.setAttribute('aria-pressed',String(selectedResonators.has(id)));updateSelectorCount();
});
document.getElementById('selectorSave').addEventListener('click',()=>{
 if(!canWritePersonalData()||!selectedResonators.size)return;
 const ids=[...selectedResonators].filter(id=>DATA.some(x=>x.id===id));
 try{CompanionStore.update(state=>{state.roster=[...new Set([...state.roster,...ids])];},tr('Résonateurs ajoutés','Resonators added'));syncPersonalViews();closeDialog('selector');render();}
 catch{companionMessage(tr('Ajout non enregistré. Ta sélection reste ouverte.','Could not save. Your selection remains open.'),true);}
});
function setLang(v){if(!['fr','en'].includes(v))return;localStorage.setItem("wwc_lang",v);lang=v;render()}
document.querySelectorAll("[data-view]").forEach(b=>b.onclick=()=>{currentView=b.dataset.view;render()});
document.querySelector("#selectorClose").onclick=()=>closeDialog('selector');
document.querySelector("#editorClose").onclick=()=>closeDialog('accountEditor');
document.querySelector("#levelPickerClose").onclick=()=>closeDialog('levelPicker');
document.querySelector("#weaponPickerClose").onclick=()=>closeDialog('weaponPicker');
document.querySelector("#weaponLevelClose").onclick=()=>closeDialog('weaponLevelPicker');
document.querySelector("#back").onclick=()=>closeDialog("detail");

function auditCompanionData(){
 const allowed=new Set(["Broadblade","Gauntlets","Pistols","Rectifier","Sword"]);
 const problems=[];
 DATA.forEach(x=>{if(!allowed.has(x.weapon))problems.push(`Resonator ${x.name}: ${x.weapon}`)});
 WEAPONS.forEach(w=>{
   if(!allowed.has(w.type))problems.push(`Weapon ${w.name}: invalid type ${w.type}`);
   if(![1,2,3,4,5].includes(Number(w.rarity)))problems.push(`Weapon ${w.name}: invalid rarity ${w.rarity}`);
 });
 window.__WWC_AUDIT__={ok:problems.length===0,problems,resonators:DATA.length,weapons:WEAPONS.length};
 return window.__WWC_AUDIT__;
}
auditCompanionData();
