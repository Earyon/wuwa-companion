let editingOriginal={},editingName=null, editingLevel=null, editingSeq=0, editingWeapon=null, editingWeaponLevel=null, editingWeaponRank=1;
function accountStatus(name){
 const d=accountData[name]||{};
 const bits=[];
 if(d.level) bits.push(`${lang==="fr"?"Niv.":"Lv."} ${d.level}`);
 if(d.sequence!==undefined) bits.push(`S${d.sequence}`);
 const top=bits.length?bits.join(" · "):(lang==="fr"?"À compléter":"To complete");
 if(d.weapon?.name){
   const w=WEAPONS.find(x=>x.name===d.weapon.name);
   const wl=d.weapon.level?`${lang==="fr"?"Niv.":"Lv."}${d.weapon.level}`:"";
   const wr=d.weapon.rank?`R${d.weapon.rank}`:"";
   const sub=[wl,wr].filter(Boolean).join(" · ");
   return `<div class="status-main">${top}</div><div class="status-weapon"><span class="status-weapon-icon"><img src="${w?.image||""}" alt="" data-candidates='${esc(JSON.stringify(weaponImageCandidates(w?.name||editingWeapon,w?.image||"")))}' data-try-index="0" onerror="weaponImgFallback(this)"><span class="weapon-fallback">◇</span></span><span class="status-weapon-copy"><b>${esc(d.weapon.name)}</b>${sub?`<small>${sub}</small>`:""}</span></div>`;
 }
 return `<div class="status-main">${top}</div>`;
}

function openAccountEditor(name){
 syncPersonalViews();
 const x=DATA.find(v=>v.name===name); if(!x)return;
 editingName=name;
 const d=accountData[name]||{};
 editingOriginal=structuredClone(d);
 editingLevel=d.level||null;
 editingSeq=(d.sequence!==undefined?d.sequence:0);
 editingWeapon=d.weapon?.name||null;
 editingWeaponLevel=d.weapon?.level||null;
 editingWeaponRank=d.weapon?.rank||1;
 document.querySelector("#editorName").textContent=name;
 document.querySelector("#editorSub").textContent=`${x.element} · ${weaponLabel(x.weapon)} · ${"★".repeat(x.rarity)}`;
 document.querySelector("#levelLabel").textContent=lang==="fr"?"Niveau":"Level";
 document.querySelector("#sequenceLabel").textContent=lang==="fr"?"Séquence":"Sequence";
 document.querySelector("#weaponLabel").textContent=lang==="fr"?"Arme équipée":"Equipped weapon";
 document.querySelector("#editorSave").textContent=lang==="fr"?"Enregistrer":"Save";
 updateEditorControls();
 document.querySelector("#accountEditor").classList.add("open");
 loadEditorSkills(x);
}
function updateEditorControls(){
 document.querySelector("#levelCurrent").textContent=editingLevel ? `${lang==="fr"?"Niveau":"Level"} ${editingLevel}` : (lang==="fr"?"Choisir un niveau":"Choose a level");
 document.querySelector("#seqRow").innerHTML=[0,1,2,3,4,5,6].map(n=>`<button class="seq-btn ${editingSeq===n?"active":""}" onclick="editingSeq=${n};updateEditorControls()">S${n}</button>`).join("");
 const wc=document.querySelector("#weaponCurrent"), ws=document.querySelector("#weaponSettings");
 if(editingWeapon){
   const w=WEAPONS.find(x=>x.name===editingWeapon);
   wc.classList.remove("empty");
   wc.innerHTML=`<div class="equipped-img-wrap"><img src="${w?.image||""}" alt="" data-candidates='${esc(JSON.stringify(weaponImageCandidates(w?.name||editingWeapon,w?.image||"")))}' data-try-index="0" onerror="weaponImgFallback(this)"><span class="weapon-fallback">◇</span></div><div class="weapon-copy"><b>${esc(editingWeapon)}</b><small>${w?weaponLabel(w.type):""} · ${"★".repeat(w?.rarity||0)}</small></div>`;
   ws.innerHTML=`<button class="weapon-setting" onclick="openWeaponLevelPicker()"><b>${lang==="fr"?"Niveau":"Level"}</b>${editingWeaponLevel||"—"}</button><div class="weapon-setting"><b>${lang==="fr"?"Syntonisation":"Syntony"}</b><div class="rank-row">${[1,2,3,4,5].map(n=>`<button class="rank-btn ${editingWeaponRank===n?"active":""}" onclick="event.stopPropagation();editingWeaponRank=${n};updateEditorControls()">R${n}</button>`).join("")}</div></div>`;
 } else {
   wc.classList.add("empty");
   wc.textContent=lang==="fr"?"Choisir une arme compatible":"Choose a compatible weapon";
   ws.innerHTML="";
 }
}

function weaponImageCandidates(name, current){
 const raw = String(name||"");
 const strip = t => t.replace(/[^A-Za-z0-9]/g,"");
 const words = raw.replace(/['’]/g,"").split(/[\s:#&-]+/).filter(Boolean);
 const title = words.map(w=>w.charAt(0).toUpperCase()+w.slice(1)).join("");
 const keep = strip(raw);
 const lowerConnectors = words.map((w,i)=>{
   const lw=w.toLowerCase();
   if(i>0 && ["of","the","in","on","and"].includes(lw)) return lw;
   return w.charAt(0).toUpperCase()+w.slice(1);
 }).join("");
 const base="https://raw.githubusercontent.com/ryanbenson/wuthering-waves-assets/master/images/weapons/";
 const explicit={
   "Ages of Harvest":"AgesOfHarvest.png",
   "Broadblade of Night":"BroadbladeOfNight.png",
   "Broadblade of Voyager":"BroadbladeOfVoyager.png",
   "Sword of Night":"SwordOfNight.png",
   "Sword of Voyager":"SwordOfVoyager.png",
   "Pistols of Night":"PistolsOfNight.png",
   "Pistols of Voyager":"PistolsOfVoyager.png",
   "Gauntlets of Night":"GauntletsOfNight.png",
   "Gauntlets of Voyager":"GauntletsOfVoyager.png",
   "Rectifier of Night":"RectifierOfNight.png",
   "Rectifier of Voyager":"RectifierOfVoyager.png",
   "Call of the Abyss":"CalloftheAbyss.png",
   "Fables of Wisdom":"FablesofWisdom.png",
   "Meditations on Mercy":"MeditationsonMercy.png",
   "Romance in Farewell":"RomanceinFarewell.png",
   "Firstlight's Herald":"FirstlightsHerald.png",
   "Defier's Thorn":"DefiersThorn.png",
   "Moongazer's Sigil":"MoongazersSigil.png",
   "Bloodpact's Pledge":"BloodpactsPledge.png",
   "Starfield Calibrator":"StarfieldCalibrator.png",
   "Lux & Umbra":"LuxUmbra.png"
 };
 return [...new Set([
   current,
   explicit[raw]?base+explicit[raw]:null,
   base+title+".png",
   base+keep+".png",
   base+lowerConnectors+".png",
   base+title+".webp",
   base+keep+".webp"
 ].filter(Boolean))];
}
function setWeaponImage(img,name,current){
 img.dataset.weaponName=name||"";
 img.dataset.candidates=JSON.stringify(weaponImageCandidates(name,current));
 img.dataset.tryIndex="0";
 img.src=weaponImageCandidates(name,current)[0]||"";
}
function weaponImgFallback(img){
 let arr=[];
 try{arr=JSON.parse(img.dataset.candidates||"[]")}catch(e){}
 let i=(parseInt(img.dataset.tryIndex||"0",10)||0)+1;
 if(i<arr.length){
   img.dataset.tryIndex=String(i);
   img.src=arr[i];
   return;
 }
 img.style.display="none";
 const wrap=img.parentElement;
 const fb=wrap?.querySelector(".weapon-fallback");
 if(fb) fb.style.display="grid";
}
function currentResonatorWeaponType(){
 const x=DATA.find(v=>v.name===editingName); return x?.weapon||null;
}
function openWeaponPicker(){
 const type=currentResonatorWeaponType();
 const compatibleCount=WEAPONS.filter(w=>w.type===type).length;
 document.querySelector("#weaponPickerTitle").textContent=(lang==="fr"?`Choisir une ${weaponLabel(type)}`:`Choose a ${weaponLabel(type)}`)+` · ${compatibleCount}`;
 document.querySelector("#weaponQ").placeholder=lang==="fr"?"Rechercher une arme…":"Search a weapon…";
 document.querySelector("#weaponQ").value="";
 drawWeapons();
 document.querySelector("#weaponPicker").classList.add("open");
}
function drawWeapons(){
 const q=(document.querySelector("#weaponQ").value||"").toLowerCase();
 const type=currentResonatorWeaponType();
 const list=WEAPONS
   .filter(w=>w.type===type && w.name.toLowerCase().includes(q))
   .sort((a,b)=>(b.rarity-a.rarity)||a.name.localeCompare(b.name));
 document.querySelector("#weaponGrid").innerHTML=list.length?list.map(w=>`<button class="weapon-card" onclick="selectWeaponByIndex(${WEAPONS.indexOf(w)})"><div class="weapon-img-wrap"><img src="${w.image}" alt="${esc(w.name)}" loading="lazy" decoding="async" fetchpriority="low" data-candidates='${esc(JSON.stringify(weaponImageCandidates(w.name,w.image)))}' data-try-index="0" onerror="weaponImgFallback(this)"><span class="weapon-fallback">◇</span></div><b>${esc(w.name)}</b><small>${"★".repeat(w.rarity)}</small></button>`).join(""):`<div class="empty">${lang==="fr"?"Aucune arme compatible trouvée dans le catalogue actuel.":"No compatible weapon found in the current catalogue."}</div>`;
}
function selectWeaponByIndex(i){
 const w=WEAPONS[i], expected=currentResonatorWeaponType();
 if(!w || w.type!==expected) return;
 selectWeapon(w.name);
}
function selectWeapon(name){
 editingWeapon=name; editingWeaponLevel=null; editingWeaponRank=1;
 document.querySelector("#weaponPicker").classList.remove("open");
 updateEditorControls();
}
function openWeaponLevelPicker(){
 document.querySelector("#weaponLevelTitle").textContent=lang==="fr"?"Niveau de l’arme":"Weapon level";
 document.querySelector("#weaponLevelQ").placeholder=lang==="fr"?"Rechercher un niveau…":"Search a level…";
 document.querySelector("#weaponLevelQ").value="";
 drawWeaponLevels();
 document.querySelector("#weaponLevelPicker").classList.add("open");
}
function drawWeaponLevels(){
 const q=(document.querySelector("#weaponLevelQ").value||"").trim();
 const nums=Array.from({length:90},(_,i)=>i+1).filter(n=>!q||String(n).includes(q));
 document.querySelector("#weaponLevelGrid").innerHTML=nums.map(n=>`<button class="level-btn ${editingWeaponLevel===n?"active":""}" onclick="editingWeaponLevel=${n};document.querySelector('#weaponLevelPicker').classList.remove('open');updateEditorControls()">${n}</button>`).join("");
}
function openLevelPicker(){
 document.querySelector("#levelPickerTitle").textContent=lang==="fr"?"Choisir le niveau":"Choose level";
 document.querySelector("#levelQ").placeholder=lang==="fr"?"Rechercher un niveau…":"Search a level…";
 document.querySelector("#levelQ").value="";
 drawLevels();
 document.querySelector("#levelPicker").classList.add("open");
}
function drawLevels(){
 const q=(document.querySelector("#levelQ").value||"").trim();
 const nums=Array.from({length:90},(_,i)=>i+1).filter(n=>!q||String(n).includes(q));
 document.querySelector("#levelGrid").innerHTML=nums.map(n=>`<button class="level-btn ${editingLevel===n?"active":""}" onclick="editingLevel=${n};document.querySelector('#levelPicker').classList.remove('open');updateEditorControls()">${n}</button>`).join("");
}
function saveAccountEditor(){
 if(!editingName||!canWritePersonalData())return;
 const progress={...editingOriginal,level:editingLevel,sequence:editingSeq,weapon:editingWeapon?{name:editingWeapon,level:editingWeaponLevel,rank:editingWeaponRank}:null,skills:{...editingSkills}};
 if(editingForteChanged)progress.forteNodes={...editingForteNodes};
 const character=resolveResonatorRef(editingName);if(!character)return;
 try{CompanionStore.saveCharacter(character.id,progress,editingOriginal,lang==='fr'?'Progression enregistrée':'Progress saved');}
 catch(error){companionMessage(lang==='fr'?'Progression non enregistrée. Tes modifications restent ouvertes ; vérifie le stockage ou une modification dans un autre onglet.':'Progress not saved. Your edits remain open; check storage or changes in another tab.',true);return;}
 document.querySelector("#accountEditor").classList.remove("open");
 render();
}
