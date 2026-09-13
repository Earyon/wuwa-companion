let DATA=[];
let WEAPONS=[];

const CATALOG_VERSION="0.5.7";
const CATALOG_CACHE_KEY="wwc_catalog_canonical_v050";
const ENCORE_BASE="https://api-v2.encore.moe/api";
let catalogState={status:"loading",source:"Encore API / WW_Data",error:null,gameVersion:null,resourceVersion:null};

function content(v){
  if(v==null)return "";
  if(typeof v==="string"||typeof v==="number")return String(v);
  return String(v.Content ?? v.content ?? v.Name ?? v.name ?? "");
}
function first(obj,keys){
  for(const k of keys) if(obj && obj[k]!=null && obj[k]!=="") return obj[k];
  return null;
}
function normalizeType(v){
  const raw=content(v).trim().toLowerCase().replace(/[\s_-]+/g,"");
  const map={
    sword:"Sword", longsword:"Sword",
    broadblade:"Broadblade", broadblades:"Broadblade",
    pistols:"Pistols", pistol:"Pistols",
    gauntlets:"Gauntlets", gauntlet:"Gauntlets",
    rectifier:"Rectifier", rectifiers:"Rectifier"
  };
  return map[raw]||null;
}
function normalizeElement(v){
  const raw=content(v).trim().toLowerCase();
  const map={aero:"Aero",electro:"Electro",fusion:"Fusion",glacio:"Glacio",havoc:"Havoc",spectro:"Spectro"};
  return map[raw]||null;
}
function assetUrl(v){
  if(v==null)return "";
  if(typeof v==="object"){
    v=v.Url ?? v.URL ?? v.url ?? v.Path ?? v.path ?? v.Icon ?? v.icon ?? v.Content ?? v.content ?? "";
  }
  let p=String(v||"").trim();
  if(!p)return "";
  if(/^https?:\/\//i.test(p))return p;
  p=p.split(".")[0];
  if(p.startsWith("/Game/Aki/")) return "https://api.encore.moe/resource/Data"+p+".webp";
  if(p.startsWith("Game/Aki/")) return "https://api.encore.moe/resource/Data/"+p+".webp";
  return p;
}
function quality(v){
  const n=Number(v);
  if([1,2,3,4,5].includes(n))return n;
  const m=content(v).match(/[1-5]/); return m?Number(m[0]):null;
}
function stableId(prefix,id,name){
  if(id!=null && String(id)!=="")return `${prefix}:${id}`;
  return `${prefix}:`+String(name).toLowerCase().replace(/[^a-z0-9]+/g,"-").replace(/^-|-$/g,"");
}
function listFrom(payload,keys){
  if(Array.isArray(payload))return payload;
  for(const k of keys) if(Array.isArray(payload?.[k])) return payload[k];
  return [];
}
function normalizeWeapon(w){
  const name=content(first(w,["WeaponName","Name","name"]));
  const id=first(w,["ItemId","Id","id","WeaponId"]);
  return {
    id:stableId("weapon",id,name),
    gameId:id==null?null:String(id),
    name,
    rarity:quality(first(w,["QualityId","Quality","Rarity","rarity"])),
    type:normalizeType(first(w,["WeaponTypeName","WeaponType","TypeName","type"])),
    image:assetUrl(first(w,["IconSmall","IconMiddle","Icon","icon"]))
  };
}
function normalizeCharacter(r){
  const name=content(first(r,["Name","RoleName","name"]));
  const id=first(r,["Id","RoleId","id"]);
  return {
    id:stableId("resonator",id,name),
    gameId:id==null?null:String(id),
    name,
    rarity:quality(first(r,["QualityId","Quality","Rarity","rarity"])),
    weapon:normalizeType(first(r,["WeaponTypeName","WeaponType","weaponType","WeaponName"])),
    element:normalizeElement(first(r,["ElementName","Element","AttributeName","element"])),
    gender:content(first(r,["Gender","Sex","gender","sex"])).trim(),
    image:assetUrl(first(r,["RoleHeadIconCircle","RoleHeadIcon","Icon","RoleHeadIconBig","icon"]))
  };
}

function isRover(r){
 return /^rover(?:\s*:|\s*$)/i.test(String(r?.name||"").trim());
}
const VERIFIED_MALE_ROVER_IDS=new Set(["1406","1501","1605","1309"]);
function keepPlayableMaleRovers(chars){
 const groups=new Map(), others=[];
 for(const r of chars){
   if(!isRover(r)){others.push(r);continue}
   const key=r.element||String(r.name).replace(/^rover\s*:?\s*/i,"").trim()||"Unknown";
   if(!groups.has(key))groups.set(key,[]);
   groups.get(key).push(r);
 }
 for(const [element,group] of groups){
   if(group.length===1){others.push(group[0]);continue}
   // 1) Prefer explicit canonical gender metadata.
   let chosen=group.find(r=>/^(male|man|m|男)$/i.test(String(r.gender||"").trim()));
   // 2) Verified game IDs for existing Rover elements.
   if(!chosen)chosen=group.find(r=>VERIFIED_MALE_ROVER_IDS.has(String(r.gameId||"")));
   // 3) Never expose both genders. If a future element arrives before gender metadata
   // is available, retain one deterministic entry and flag it internally for review.
   if(!chosen){
     chosen=[...group].sort((a,b)=>String(a.gameId||a.id).localeCompare(String(b.gameId||b.id),undefined,{numeric:true}))[0];
     chosen._genderFallback=true;
   }
   others.push(chosen);
 }
 return others;
}
function validateCanonical(chars,weapons){
  const errors=[];
  const types=new Set(["Sword","Broadblade","Pistols","Gauntlets","Rectifier"]);
  const elements=new Set(["Aero","Electro","Fusion","Glacio","Havoc","Spectro"]);
  const ids=new Set();
  for(const w of weapons){
    if(!w.id||ids.has(w.id))errors.push(`weapon duplicate/missing id ${w.name}`); ids.add(w.id);
    if(!w.name)errors.push(`weapon ${w.id}: missing name`);
    if(!types.has(w.type))errors.push(`${w.name}: missing/invalid canonical type`);
    if(![1,2,3,4,5].includes(w.rarity))errors.push(`${w.name}: missing/invalid rarity`);
  }
  const rids=new Set();
  for(const r of chars){
    if(!r.id||rids.has(r.id))errors.push(`resonator duplicate/missing id ${r.name}`); rids.add(r.id);
    if(!r.name)errors.push(`resonator ${r.id}: missing name`);
    if(!types.has(r.weapon))errors.push(`${r.name}: missing/invalid weapon type`);
    if(!elements.has(r.element))errors.push(`${r.name}: missing/invalid element`);
    if(![4,5].includes(r.rarity))errors.push(`${r.name}: missing/invalid rarity`);
  }
  // Catalogue sanity checks: block obviously partial/broken upstream responses.
  if(weapons.length<120)errors.push(`weapon catalogue unexpectedly small: ${weapons.length}`);
  if(chars.length<55)errors.push(`resonator catalogue unexpectedly small: ${chars.length}`);
  if(errors.length) throw new Error(errors.slice(0,12).join(" | ")+(errors.length>12?` | +${errors.length-12} more`:""));
}
async function fetchJSON(url){
  const res=await fetch(url,{cache:"no-store"});
  if(!res.ok)throw new Error(`HTTP ${res.status} — ${url}`);
  return res.json();
}

async function fetchCanonicalLists(newPayload=null){
  const [weaponPayload,charPayload]=await Promise.all([
    fetchJSON(`${ENCORE_BASE}/en/weapon`),
    fetchJSON(`${ENCORE_BASE}/en/character`)
  ]);
  const rawWeapons=listFrom(weaponPayload,["weapons","weaponList","data"]);
  const rawChars=listFrom(charPayload,["roleList","characters","characterList","data"]);
  const nw=rawWeapons.map(normalizeWeapon).filter(x=>x.name);
  const nc=keepPlayableMaleRovers(rawChars.map(normalizeCharacter).filter(x=>x.name));
  validateCanonical(nc,nw);
  DATA=nc; WEAPONS=nw;
  migrateOwnershipToCanonical();
  catalogState={
    status:"ready",source:"Encore API / WW_Data",error:null,
    gameVersion:first(newPayload,["GameVer","gameVersion"])||null,
    resourceVersion:first(newPayload,["ResVer","resourceVersion"])||null,
    updatedAt:new Date().toISOString()
  };
  localStorage.setItem(CATALOG_CACHE_KEY,JSON.stringify({
    savedAt:new Date().toISOString(),state:catalogState,characters:DATA,weapons:WEAPONS
  }));
  updateHealth();
}
function restoreValidatedCache(){
  try{
    const cached=JSON.parse(localStorage.getItem(CATALOG_CACHE_KEY)||"null");
    if(!cached?.characters?.length || !cached?.weapons?.length) return false;
    validateCanonical(cached.characters,cached.weapons);
    DATA=keepPlayableMaleRovers(cached.characters); WEAPONS=cached.weapons;
    migrateOwnershipToCanonical();
    catalogState={...cached.state,status:"cached",error:null,savedAt:cached.savedAt};
    updateHealth();
    return true;
  }catch(e){
    console.warn("Rejected catalogue cache",e);
    return false;
  }
}
function updateHealth(){
  window.__WWC_DATA_HEALTH__={
    ok:true,catalogVersion:CATALOG_VERSION,
    source:catalogState.source,status:catalogState.status,
    gameVersion:catalogState.gameVersion,resourceVersion:catalogState.resourceVersion,
    resonators:DATA.length,weapons:WEAPONS.length
  };
}
async function refreshCanonicalCatalog({force=false}={}){
  try{
    const newPayload=await fetchJSON(`${ENCORE_BASE}/en/new`).catch(()=>null);
    const newGame=first(newPayload,["GameVer","gameVersion"])||null;
    const newRes=first(newPayload,["ResVer","resourceVersion"])||null;
    const sameVersion=!force && DATA.length && WEAPONS.length &&
      newGame && newRes &&
      String(newGame)===String(catalogState.gameVersion) &&
      String(newRes)===String(catalogState.resourceVersion);
    if(sameVersion){
      catalogState={...catalogState,status:"cached",error:null,lastChecked:new Date().toISOString()};
      updateHealth();
      return {changed:false};
    }
    await fetchCanonicalLists(newPayload);
    return {changed:true};
  }catch(err){
    if(DATA.length && WEAPONS.length){
      catalogState={...catalogState,status:"cached",error:String(err)};
      updateHealth();
      return {changed:false,error:err};
    }
    catalogState={status:"error",source:"Encore API / WW_Data",error:String(err)};
    throw err;
  }
}
async function bootstrapCanonicalCatalog(){
  const hadCache=restoreValidatedCache();
  if(hadCache){
    render(); // immediate startup from last validated catalogue
    // Non-blocking freshness check. Only rerender if the canonical dataset changed.
    refreshCanonicalCatalog().then(r=>{if(r.changed)render()}).catch(()=>{});
    return;
  }
  loadingScreen();
  await refreshCanonicalCatalog({force:true});
  render();
}
function loadingScreen(){
 document.querySelector("#view").innerHTML=`<div class="content-panel cold-loader">
   <h2>${lang==="fr"?"Préparation de WuWa Companion":"Preparing WuWa Companion"}</h2>
   <p>${lang==="fr"?"Premier chargement : récupération et validation des données du jeu. Les ouvertures suivantes utiliseront le cache local validé.":"First load: fetching and validating game data. Following launches will use the validated local cache."}</p>
   <div class="load-track" role="progressbar" aria-label="${lang==="fr"?"Chargement":"Loading"}"><div class="load-bar"></div></div>
 </div>`;
}
function dataErrorScreen(err){
 document.querySelector("#view").innerHTML=`<div class="content-panel"><div class="empty"><b>${
   lang==="fr"?"Base de données indisponible":"Game database unavailable"
 }</b><br><br>${
   lang==="fr"
    ?"WuWa Companion refuse d’utiliser l’ancienne base manuelle ou des données incomplètes. Vérifie la connexion puis recharge la page."
    :"WuWa Companion refuses to use the old manual catalogue or incomplete data. Check the connection and reload."
 }</div></div>`;
 console.error("Canonical catalogue rejected:",err);
}

