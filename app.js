const PROFILE={name:"Earyon",uid:"534230812",playerId:"601844929",unionLevel:68,sol3Rank:7,birthday:"13/12"};
const detected=new Set(["Aalto","Aemeath","Baizhi","Buling","Calcharo","Changli","Chixia","Danjin","Denia","Encore","Jianxin","Lingyang","Lumi","Luuk Herssen","Lynae","Mortefi","Qingxiao","Sanhua","Suisui","Taoqi","Verina","Yangyang","Youhu","Yuanwu"]);
const personalReadErrors=[];
function readPersonalJSON(key,fallback){
 try{
  const value=JSON.parse(localStorage.getItem(key)||JSON.stringify(fallback));
  if(Array.isArray(fallback)?(!Array.isArray(value)||value.some(x=>typeof x!=='string')):(!value||typeof value!=='object'||Array.isArray(value)))throw Error('Invalid personal record');
  return value;
 }catch(error){personalReadErrors.push(key);console.warn('Personal record retained but unreadable',key);return fallback;}
}
function canWritePersonalData(){
 if(!personalReadErrors.length)return true;
 alert(lang==='fr'?'Des données locales sont illisibles. Exporte ta sauvegarde dans Plus avant de restaurer une copie valide.':'Some local data is unreadable. Export your backup in More before restoring a valid copy.');return false;
}
let owned=readPersonalJSON("wwc_owned",[]);
let ownedIds=readPersonalJSON("wwc_owned_ids",[]);
let accountData=readPersonalJSON("wwc_account_data",{});

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
function persistCanonicalOwnership(){
 if(personalReadErrors.length)return;
 ownedIds=[...new Set(ownedIds)];
 owned=ownedIds.map(id=>DATA.find(r=>r.id===id)?.name).filter(Boolean);
 localStorage.setItem("wwc_owned_ids",JSON.stringify(ownedIds));
 // Keep legacy storage synced during prototype migration.
 localStorage.setItem("wwc_owned",JSON.stringify(owned));
}
function migrateOwnershipToCanonical(){
 if(!DATA.length||personalReadErrors.length)return;
 // A saved ID list, including [], is authoritative. Do not resurrect a removed
 // Resonator from retained progress, or discard IDs absent from a newer cache.
 if(localStorage.getItem('wwc_owned_ids')!==null){persistCanonicalOwnership();return;}
 const resolvedIds=new Set();

 // New stable-ID storage wins.
 for(const id of ownedIds){
   const r=resolveResonatorRef(id);
   if(r)resolvedIds.add(r.id);
 }

 // Migrate the old name-based list.
 for(const name of owned){
   const r=resolveResonatorRef(name);
   if(r)resolvedIds.add(r.id);
 }

 // Recover characters that had account-specific data even if the old owned list
 // was lost/corrupted during a prototype catalogue migration.
 for(const name of Object.keys(accountData||{})){
   const r=resolveResonatorRef(name);
   if(r)resolvedIds.add(r.id);
 }

 ownedIds=[...resolvedIds];
 persistCanonicalOwnership();
}
let lang=localStorage.getItem("wwc_lang")||"fr";
let encySort="alpha";
let encySortDir=1;
let ownedSort="alpha";
let ownedSortDir=1;
let ownedElement="All";
let currentView="account", accountTab="res", element="All";

const I18N={
 fr:{daily:"Tâches quotidiennes",ency:"Encyclopédie",account:"Mon compte",planner:"Planner",more:"Plus",back:"Retour",res:"Mes Résonateurs",weap:"Mes Armes",echo:"Mes Échos",resources:"Mes Ressources"},
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
 document.querySelectorAll("[data-view]").forEach(b=>b.classList.toggle("active",b.dataset.view===currentView));
 const labs=[t("daily"),t("ency"),t("account"),t("planner"),t("more")];
 document.querySelectorAll(".bottom-nav small").forEach((x,i)=>x.textContent=labs[i]);
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
 return `<div class="content-panel">
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
 const q=(document.querySelector("#q")?.value||"").toLowerCase().trim();
 const a=DATA
   .filter(x=>(element==="All"||x.element===element)&&x.name.toLowerCase().includes(q))
   .sort((a,b)=>{
     const alpha=a.name.localeCompare(b.name,lang==="fr"?"fr":"en",{sensitivity:"base"});
     if(encySort==="alpha")return encySortDir*alpha;
     const rarity=(Number(a.rarity)-Number(b.rarity))*encySortDir;
     return rarity||alpha;
   });
 document.querySelectorAll(".filters button").forEach(b=>b.classList.toggle("active",(element==="All"&&(b.textContent==="Tous"||b.textContent==="All"))||b.textContent===element));
 document.querySelector("#grid").innerHTML=a.map(x=>`<article class="char-card" onclick='openDetail(${esc(JSON.stringify(x.name))})'><div class="pic">${x.image?`<img src="${x.image}" alt="${esc(x.name)}" loading="lazy" decoding="async" fetchpriority="low">`:""}</div><div class="info"><b>${esc(x.name)}</b><small>${x.element} · ${weaponLabel(x.weapon)} · ${"★".repeat(x.rarity)}</small></div></article>`).join("");
}
function daily(){
 setHeader(t("daily"),lang==="fr"?"Votre tableau de bord personnel.":"Your personal dashboard.");document.querySelector("#accountTabs").innerHTML="";
 return personalDaily();
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
 if(DATA.length){auditOrderingAndOwnership();auditRoverUniqueness();}
 setActiveNav();
 const html=currentView==="account"?account():currentView==="ency"?encyclopedia():currentView==="daily"?daily():currentView==="planner"?planner():more();
 document.querySelector("#view").innerHTML=html;
 if(currentView==="ency")drawCards();
 if(currentView==="account"&&accountTab==="res")renderOwnedList();
 const bl=document.querySelector("#backLabel");if(bl)bl.textContent=t("back");
}


function renderOwnedList(){
 const listEl=document.querySelector("#ownedList"); if(!listEl)return;
 const q=(document.querySelector("#ownedSearch")?.value||"").toLowerCase().trim();
 let rows=ownedIds.map(id=>DATA.find(v=>v.id===id)).filter(Boolean);
 if(q) rows=rows.filter(x=>x.name.toLowerCase().includes(q));
 if(ownedElement!=="All")rows=rows.filter(x=>x.element===ownedElement);
 rows.sort((a,b)=>{
   const alpha=a.name.localeCompare(b.name,lang==="fr"?"fr":"en",{sensitivity:"base"});
   if(ownedSort==="alpha")return ownedSortDir*alpha;
   const rarity=(Number(a.rarity)-Number(b.rarity))*ownedSortDir;
   return rarity||alpha;
 });
 listEl.innerHTML=rows.length?rows.map(x=>`<div class="res-row" style="--element:${x.element==="Fusion"?"#ff826d":x.element==="Aero"?"#6ce1d2":x.element==="Spectro"?"#ffe08a":x.element==="Glacio"?"#76d7ff":x.element==="Electro"?"#b99aff":"#d676ff"}">
   <img src="${x.image||""}" alt="${esc(x.name)}" loading="lazy" decoding="async" fetchpriority="low">
   <div class="res-main"><b>${esc(x.name)}</b><div class="res-meta"><span class="element">✦ ${x.element}</span><span>${weaponLabel(x.weapon)}</span></div><div class="rarity-stars">${"★".repeat(x.rarity)}</div></div>
   <div class="status">${accountStatus(x.name)}</div>
   <button class="remove-res trash-btn" title="${lang==="fr"?"Retirer":"Remove"}" aria-label="${lang==="fr"?"Retirer "+esc(x.name):"Remove "+esc(x.name)}" onclick='event.stopPropagation();removeOwned(${esc(JSON.stringify(x.name))})'>
     <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 3h6l1 2h4v2H4V5h4l1-2Zm-2 6h10l-.8 11H7.8L7 9Zm3 2v7h2v-7h-2Zm4 0v7h2v-7h-2Z"/></svg>
   </button>
   <button class="chev edit-chevron" title="${lang==="fr"?"Modifier":"Edit"}" aria-label="${lang==="fr"?"Modifier "+esc(x.name):"Edit "+esc(x.name)}" onclick='openAccountEditor(${esc(JSON.stringify(x.name))})'>›</button>
 </div>`).join(""):`<div class="empty">${q?(lang==="fr"?"Aucun Résonateur ne correspond à la recherche.":"No Resonator matches your search."):(lang==="fr"?"Aucun Résonateur confirmé.":"No confirmed Resonator yet.")}</div>`;
 const footer=document.querySelector(".footer-row span");
 if(footer) footer.textContent=lang==="fr"?`Affichage : ${rows.length} sur ${ownedIds.length}`:`Showing: ${rows.length} of ${ownedIds.length}`;
}
function removeOwned(name){
 if(!canWritePersonalData())return;
 const msg=lang==="fr"?`Retirer ${name} de Mes Résonateurs ?`:`Remove ${name} from My Resonators?`;
 if(!confirm(msg))return;
 const r=resolveResonatorRef(name);
 if(r)ownedIds=ownedIds.filter(id=>id!==r.id);
 persistCanonicalOwnership();
 render();
}
function filterOwned(){ renderOwnedList(); }
function openSelector(){
 document.querySelector("#selectorTitle").textContent=lang==="fr"?"Ajouter un Résonateur":"Add a Resonator";
 document.querySelector("#selectorQ").placeholder=lang==="fr"?"Rechercher un Résonateur…":"Search a Resonator…";
 document.querySelector("#selectorQ").value="";
 document.querySelector("#selector").classList.add("open");drawSelector();
}
function drawSelector(){
 const q=(document.querySelector("#selectorQ").value||"").toLowerCase();
 const list=DATA
   .filter(x=>!ownedIds.includes(x.id)&&x.name.toLowerCase().includes(q))
   .sort((a,b)=>(Number(b.rarity)-Number(a.rarity))||a.name.localeCompare(b.name,lang==="fr"?"fr":"en",{sensitivity:"base"}));
 document.querySelector("#selectorGrid").innerHTML=list.map(x=>`<button class="select-card ${detected.has(x.name)?"detected":""}" onclick='confirmOwned(${esc(JSON.stringify(x.name))})'>${x.image?`<img src="${x.image}" alt="${esc(x.name)}">`:""}<span>${esc(x.name)}</span></button>`).join("");
}
function confirmOwned(name){
 if(!canWritePersonalData())return;
 const r=resolveResonatorRef(name);
 if(r&&!ownedIds.includes(r.id)){ownedIds.push(r.id);persistCanonicalOwnership()}
 document.querySelector("#selector").classList.remove("open");render();
}
function openDetail(name){
 const x=DATA.find(v=>v.name===name);if(!x)return;
 document.querySelector("#detailContent").innerHTML=`<div class="detailhero">${x.image?`<img src="${x.image}" alt="${esc(x.name)}">`:""}<div class="detailcopy"><div style="color:#f0d48b">${x.element} · ${weaponLabel(x.weapon)} · ${"★".repeat(x.rarity)}</div><h1>${esc(x.name)}</h1><p>${ownedIds.includes(x.id)?(lang==="fr"?"Possédé":"Owned"):name==="Hiyuki"?(lang==="fr"?"Souhait · non possédée":"Wishlist · not owned"):(lang==="fr"?"Statut inconnu":"Unknown status")}</p></div></div><div class="actions"><button class="action wish"><svg viewBox="0 0 24 24"><path d="M12 20.4 4.2 13C.8 9.8 2.4 4.5 6.8 4.5c2.1 0 3.7 1.2 5.2 3 1.5-1.8 3.1-3 5.2-3 4.4 0 6 5.3 2.6 8.5L12 20.4Z"/></svg>${lang==="fr"?"Souhait":"Wishlist"}</button><button class="action primary"><svg viewBox="0 0 24 24"><path d="M12 2.5 18.2 19 12 15.8 5.8 19 12 2.5Z" fill="currentColor"/></svg>${lang==="fr"?"Améliorer":"Improve"}</button></div>`;
 document.querySelector("#detail").classList.add("open");
}
function setLang(v){lang=v;localStorage.setItem("wwc_lang",v);render()}
document.querySelectorAll("[data-view]").forEach(b=>b.onclick=()=>{currentView=b.dataset.view;render()});
document.querySelector("#selectorClose").onclick=()=>document.querySelector("#selector").classList.remove("open");
document.querySelector("#editorClose").onclick=()=>document.querySelector("#accountEditor").classList.remove("open");
document.querySelector("#levelPickerClose").onclick=()=>document.querySelector("#levelPicker").classList.remove("open");
document.querySelector("#weaponPickerClose").onclick=()=>document.querySelector("#weaponPicker").classList.remove("open");
document.querySelector("#weaponLevelClose").onclick=()=>document.querySelector("#weaponLevelPicker").classList.remove("open");
document.querySelector("#back").onclick=()=>document.querySelector("#detail").classList.remove("open");

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




