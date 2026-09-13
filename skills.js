const CHARACTER_DETAIL_CACHE_PREFIX="wwc_character_detail_v4:";
let editingSkills={};
let editingSkillDefs=[];
let skillDetailRequestToken=0;
const SKILL_ORDER=["Normal Attack","Skill","Forte Circuit","Liberation","Intro"];
const SKILL_LABELS={
 fr:{"Normal Attack":"Attaque normale","Skill":"Compétence de Résonance","Forte Circuit":"Circuit Forte","Liberation":"Libération de Résonance","Intro":"Compétence d’Intro"},
 en:{"Normal Attack":"Normal Attack","Skill":"Resonance Skill","Forte Circuit":"Forte Circuit","Liberation":"Resonance Liberation","Intro":"Intro Skill"}
};
function normalizeSkillType(v){
 const raw=content(v).trim().toLowerCase().replace(/resonance\s+/g,"");
 // Order matters: "Intro Skill", "Outro Skill" and "Inherent Skill"
 // must not be swallowed by the generic "skill" branch.
 if(raw.includes("intro"))return "Intro";
 if(raw.includes("outro"))return "Outro";
 if(raw.includes("inherent"))return "Inherent Skill";
 if(raw.includes("forte"))return "Forte Circuit";
 if(raw.includes("liberation"))return "Liberation";
 if(raw.includes("normal"))return "Normal Attack";
 if(raw==="skill"||raw.includes("skill"))return "Skill";
 return content(v).trim();
}
function skillIcon(v){return assetUrl(v)}
function normalizeSkillDefs(detail){
 const arr=Array.isArray(detail?.Skills)?detail.Skills:Array.isArray(detail?.skills)?detail.skills:[];
 const byType=new Map();
 for(const sk of arr){
   const rawType=first(sk,["SkillType","Type","type"]);
   const rawName=first(sk,["SkillName","Name","name"]);
   const type=normalizeSkillType(rawType)||normalizeSkillType(rawName);
   if(!SKILL_ORDER.includes(type) || byType.has(type))continue;
   byType.set(type,{
     id:String(first(sk,["Id","SkillId","id"])||type),
     type,
     icon:skillIcon(first(sk,["Icon","SkillIcon","SkillIconPath","IconPath","SkillIconUrl","icon"]))
   });
 }
 // Some API character payloads omit the Intro icon in Skills but expose it in SkillTree.
 const tree=Array.isArray(detail?.SkillTree)?detail.SkillTree:Array.isArray(detail?.skillTree)?detail.skillTree:[];
 for(const node of tree){
   const type=normalizeSkillType(first(node,["SkillType","Type","NodeType","type"]))||
              normalizeSkillType(first(node,["SkillName","Name","NodeName","name"]));
   if(!SKILL_ORDER.includes(type))continue;
   const icon=skillIcon(first(node,["Icon","SkillIcon","SkillIconPath","IconPath","NodeIcon","PropertyNodeIcon","icon"]));
   if(icon && (!byType.has(type)||!byType.get(type).icon)){
     const previous=byType.get(type)||{id:String(first(node,["Id","SkillId","NodeId","id"])||type),type,icon:""};
     previous.icon=icon; byType.set(type,previous);
   }
 }
 // The control remains visible even if upstream data is temporarily incomplete.
 return SKILL_ORDER.map(type=>byType.get(type)||{id:type,type,icon:""});
}
function characterDetailCacheKey(gameId){return CHARACTER_DETAIL_CACHE_PREFIX+String(gameId)}
function readCharacterDetailCache(gameId){
 try{
   const x=JSON.parse(localStorage.getItem(characterDetailCacheKey(gameId))||"null");
   return x?.gameVersion===catalogState.gameVersion&&String(x.detail?.Id)===String(gameId)?x.detail:null;
 }catch(e){return null}
}

const ROVER_SKILL_SIBLING={
 "1406":"1408","1408":"1406",
 "1501":"1502","1502":"1501",
 "1604":"1605","1605":"1604",
 "1309":"1310","1310":"1309"
};
function coreSkillCount(detail){
 const defs=normalizeSkillDefsRaw(detail);
 return defs.length;
}
function normalizeSkillDefsRaw(detail){
 const arr=Array.isArray(detail?.Skills)?detail.Skills:Array.isArray(detail?.skills)?detail.skills:[];
 const seen=new Set(), out=[];
 for(const sk of arr){
   const type=normalizeSkillType(first(sk,["SkillType","Type","type"]))||normalizeSkillType(first(sk,["SkillName","Name","name"]));
   if(SKILL_ORDER.includes(type)&&!seen.has(type)){seen.add(type);out.push(type)}
 }
 return out;
}
async function backfillRoverDetail(gameId,detail){
 const sibling=ROVER_SKILL_SIBLING[String(gameId)];
 if(!sibling || (coreSkillCount(detail)>=5&&detail.SkillTree?.length))return detail;
 try{
   const sib=await fetchJSON(`${ENCORE_BASE}/en/character/${encodeURIComponent(sibling)}`);
   if(String(sib?.Id)!==String(sibling))return detail;
   const merged={...detail};
   if((!Array.isArray(merged.Skills)||coreSkillCount(merged)<5)&&Array.isArray(sib?.Skills))merged.Skills=sib.Skills;
   if((!Array.isArray(merged.SkillTree)||!merged.SkillTree.length)&&Array.isArray(sib?.SkillTree))merged.SkillTree=sib.SkillTree;
   return merged;
 }catch(e){
   return detail;
 }
}

async function getCharacterDetail(gameId,{background=false}={}){
 const cached=readCharacterDetailCache(gameId);
 if(cached && !background)return {detail:cached,fromCache:true};
 let detail=await fetchJSON(`${ENCORE_BASE}/en/character/${encodeURIComponent(gameId)}`);
 if(String(detail?.Id)!==String(gameId))throw Error('Invalid character identity');
 detail=await backfillRoverDetail(gameId,detail);
 try{localStorage.setItem(characterDetailCacheKey(gameId),JSON.stringify({gameVersion:catalogState.gameVersion,savedAt:new Date().toISOString(),detail}));}catch{/* Optional cache failure must not hide successfully fetched data. */}
 return {detail,fromCache:false};
}

function auditCoreSkillIcons(){
 const missing=editingSkillDefs.filter(x=>SKILL_ORDER.includes(x.type)&&!x.icon).map(x=>x.type);
 window.__WWC_SKILL_ICON_AUDIT__={
   ok:missing.length===0,
   character:editingName||null,
   missing
 };
 return window.__WWC_SKILL_ICON_AUDIT__;
}

function drawSkillsEditor(state="ready"){
 drawForteEditor(state);
 const box=document.querySelector("#skillsEditor"); if(!box)return;
 const focusedType=box.contains(document.activeElement)?document.activeElement.dataset.skillLevel:null;
 document.querySelector("#skillsLabel").textContent=lang==="fr"?"Compétences / Forte":"Skills / Forte";
 const src=document.querySelector("#skillsSource");
 if(state==="loading"&&!editingSkillDefs.length){
   src.textContent="";
   box.innerHTML=`<div class="skill-loading">${lang==="fr"?"Chargement des données du Résonateur…":"Loading Resonator data…"}</div>`;
   return;
 }
 if(state==="error"&&!editingSkillDefs.length){
   src.textContent="";
   box.innerHTML=`<div class="skill-error">${lang==="fr"?"Données de compétences indisponibles pour le moment.":"Skill data is unavailable right now."}</div>`;
   return;
 }
 auditCoreSkillIcons();
 src.innerHTML=`<span class="data-refresh-dot"></span>${lang==="fr"?"données du jeu":"game data"}`;
 if(!editingSkillDefs.length){
   box.innerHTML=`<div class="skill-error">${lang==="fr"?"Aucune donnée de compétence exploitable trouvée.":"No usable skill data found."}</div>`;
   return;
 }
 box.innerHTML=`<div class="skill-grid-edit">${editingSkillDefs.map(def=>{
   const lv=editingSkills[def.type]??null;
   return `<div class="skill-edit-row">
     ${def.icon?`<span class="skill-icon-wrap"><img src="${esc(def.icon)}" alt="" loading="lazy" decoding="async" onerror="this.style.display='none';this.nextElementSibling.style.display='grid'"><span class="skill-icon-fallback">✦</span></span>`:`<span class="skill-icon-wrap"><span class="skill-icon-fallback" style="display:grid">✦</span></span>`}
     <div class="skill-edit-copy"><b>${esc(SKILL_LABELS[lang][def.type]||def.type)}</b><label>${lang==='fr'?'Niveau actuel':'Current level'}
       <select data-skill-level="${esc(def.type)}" aria-label="${esc(SKILL_LABELS[lang][def.type]||def.type)}"><option value="" ${lv===null?'selected':''}>?</option>${Array.from({length:10},(_,i)=>i+1).map(n=>`<option value="${n}" ${lv===n?'selected':''}>${n} / 10</option>`).join('')}</select></label>
     </div>
   </div>`;
 }).join("")}</div>`;
 if(focusedType)box.querySelector(`[data-skill-level="${CSS.escape(focusedType)}"]`)?.focus({preventScroll:true});
}
function setEditingSkillLevel(type,level){
 if(!SKILL_ORDER.includes(type))return;
 if(level===null)delete editingSkills[type];
 else if(Number.isInteger(level)&&level>=1&&level<=10)editingSkills[type]=level;
 else return;
 const input=document.querySelector(`[data-skill-level="${CSS.escape(type)}"]`);if(input)input.value=level===null?'':String(level);
}
async function loadEditorSkills(resonator){
 const token=++skillDetailRequestToken;
 editingSkillDefs=[];
 editingSkills={...(accountData[editingName]?.skills||{})};
 editingForteNodes={...(accountData[editingName]?.forteNodes||{})};
 editingForteDefs=[];
 editingForteChanged=false;
 drawSkillsEditor("loading");
 if(!resonator?.gameId){drawSkillsEditor("error");return}
 try{
   const cached=readCharacterDetailCache(resonator.gameId);
   if(cached){
     editingSkillDefs=normalizeSkillDefs(cached);
     editingForteDefs=normalizeForteDefs(cached);
     if(token===skillDetailRequestToken)drawSkillsEditor();
     // refresh detail in background, never block the editor
     getCharacterDetail(resonator.gameId,{background:true}).then(({detail})=>{
       if(token!==skillDetailRequestToken)return;
       const next=normalizeSkillDefs(detail);
       if(next.length){editingSkillDefs=next;editingForteDefs=normalizeForteDefs(detail);drawSkillsEditor()}
     }).catch(()=>{});
     return;
   }
   const {detail}=await getCharacterDetail(resonator.gameId);
   if(token!==skillDetailRequestToken)return;
   editingSkillDefs=normalizeSkillDefs(detail);
   editingForteDefs=normalizeForteDefs(detail);
   drawSkillsEditor();
 }catch(e){
   console.warn("Skill detail unavailable",e);
   if(token===skillDetailRequestToken)drawSkillsEditor("error");
 }
}


document.getElementById('skillsEditor').addEventListener('change',event=>{const input=event.target.closest('[data-skill-level]');if(input)setEditingSkillLevel(input.dataset.skillLevel,input.value===''?null:Number(input.value));});
