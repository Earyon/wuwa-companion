let editingEquipment={mode:"keep"},weaponPickerMode="inventory";
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
 const state=CompanionStore.get();
 editingOriginal=structuredClone(state.characters[x.id]||{});
 const copy=state.weapons.find(w=>w.id===editingOriginal.weaponCopyId);
 editingEquipment=copy?{mode:'copy',id:copy.id,expected:copy}:{mode:'keep'};
 editingLevel=d.level||null;
 editingSeq=(d.sequence!==undefined?d.sequence:0);
 editingWeapon=d.weapon?.name||null;
 editingWeaponLevel=d.weapon?.level||null;
 editingWeaponRank=d.weapon?.rank??null;
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
   if(editingEquipment.mode==='keep'){
    ws.innerHTML=`<p class="companion-note">${lang==='fr'?'Équipement ancien conservé. Choisis un exemplaire existant ou ajoute un exemplaire depuis le catalogue pour le modifier.':'Previous equipment preserved. Choose its inventory copy or add a copy from the catalogue to edit it.'} · ${editingWeaponLevel||'?'} · R${editingWeaponRank||'?'}</p>`;
   }else ws.innerHTML=`<button class="weapon-setting" onclick="openWeaponLevelPicker()"><b>${lang==="fr"?"Niveau":"Level"}</b>${editingWeaponLevel||"—"}</button><div class="weapon-setting"><b>${lang==="fr"?"Syntonisation":"Syntony"}</b><div class="rank-row">${[1,2,3,4,5].map(n=>`<button class="rank-btn ${editingWeaponRank===n?"active":""}" onclick="event.stopPropagation();editingWeaponRank=${n};updateEditorControls()">R${n}</button>`).join("")}</div></div>`;
   ws.innerHTML+=`<button class="companion-button" onclick="clearEditingWeapon()">${lang==='fr'?'Déséquiper':'Unequip'}</button>`;
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
 weaponPickerMode=CompanionStore.get().weapons.some(copy=>WEAPONS.find(w=>w.id===copy.catalogId)?.type===type)?'inventory':'new';
 document.querySelector('#weaponPickerTitle').textContent=lang==='fr'?'Choisir une arme compatible':'Choose a compatible weapon';
 document.querySelector('#weaponQ').placeholder=lang==='fr'?'Rechercher une arme…':'Search a weapon…';
 document.querySelector('#weaponQ').value='';drawWeapons();
 document.querySelector('#weaponPicker').classList.add('open');
}
function drawWeapons(){
 const q=(document.querySelector('#weaponQ').value||'').toLowerCase(),type=currentResonatorWeaponType();
 const data=CompanionStore.get(),character=resolveResonatorRef(editingName);
 document.querySelector('#weaponSource').innerHTML=`<button class="companion-button" aria-pressed="${weaponPickerMode==='inventory'}" onclick="weaponPickerMode='inventory';drawWeapons()">${tr('Mes exemplaires','My copies')}</button><button class="companion-button" aria-pressed="${weaponPickerMode==='new'}" onclick="weaponPickerMode='new';drawWeapons()">${tr('Ajouter un exemplaire','Add a copy')}</button>`;
 document.querySelector('#weaponPickerNote').textContent=weaponPickerMode==='new'?tr('Le choix sera ajouté à ton inventaire lors de l’enregistrement du Résonateur.','The choice will be added to your inventory when you save the Resonator.'):tr('Un exemplaire ne peut équiper qu’un Résonateur à la fois.','A copy can equip only one Resonator at a time.');
 const rows=weaponPickerMode==='new'?WEAPONS.filter(w=>w.type===type&&w.name.toLowerCase().includes(q)).map(w=>({row:w,copy:null})):data.weapons.map(copy=>({copy,row:WEAPONS.find(w=>w.id===copy.catalogId)})).filter(({row})=>row?.type===type&&row.name.toLowerCase().includes(q));
 rows.sort((a,b)=>(b.row.rarity-a.row.rarity)||a.row.name.localeCompare(b.row.name));
 document.querySelector('#weaponGrid').innerHTML=rows.map(({row,copy})=>{
  const owner=copy?CompanionStore.weaponOwner(data,copy.id):null,unavailable=owner&&owner!==character?.id;
  const selection=copy?`data-copy="${esc(copy.id)}" onclick="selectWeaponCopy(this.dataset.copy)"`:`onclick="selectWeaponByIndex(${WEAPONS.indexOf(row)})"`;
  const subtitle=copy?`#${data.weapons.indexOf(copy)+1} · ${tr('Niv.','Lv.')} ${copy.level??'?'} · R${copy.rank??'?'}`:'★'.repeat(row.rarity);
  return `<button class="weapon-card" ${selection} ${unavailable?'disabled':''}><div class="weapon-img-wrap"><img src="${esc(row.image)}" alt="" loading="lazy" decoding="async" data-candidates='${esc(JSON.stringify(weaponImageCandidates(row.name,row.image)))}' data-try-index="0" onerror="weaponImgFallback(this)"><span class="weapon-fallback">◇</span></div><b>${esc(row.name)}</b><small>${subtitle}${owner?'<br>'+esc(DATA.find(c=>c.id===owner)?.name||owner):''}</small></button>`;
 }).join('')||`<div class="empty">${tr('Aucun exemplaire compatible. Utilise « Ajouter un exemplaire » si nécessaire.','No compatible copy. Use “Add a copy” if needed.')}</div>`;
}
function selectWeaponByIndex(index){
 const row=WEAPONS[index];if(!row||row.type!==currentResonatorWeaponType())return;
 const previous=editingOriginal.weapon?.name===row.name?editingOriginal.weapon:null;
 editingEquipment={mode:'new',catalogId:row.id};editingWeapon=row.name;editingWeaponLevel=previous?.level??null;editingWeaponRank=previous?previous.rank??null:1;
 document.querySelector('#weaponPicker').classList.remove('open');updateEditorControls();
}
function selectWeaponCopy(id){
 const state=CompanionStore.get(),copy=state.weapons.find(w=>w.id===id),row=WEAPONS.find(w=>w.id===copy?.catalogId),owner=CompanionStore.weaponOwner(state,id);
 if(!copy||!row||row.type!==currentResonatorWeaponType()||(owner&&owner!==resolveResonatorRef(editingName)?.id))return;
 editingEquipment={mode:'copy',id,expected:copy};editingWeapon=row.name;editingWeaponLevel=copy.level;editingWeaponRank=copy.rank;
 document.querySelector('#weaponPicker').classList.remove('open');updateEditorControls();
}
function clearEditingWeapon(){editingEquipment={mode:'none'};editingWeapon=null;editingWeaponLevel=null;editingWeaponRank=null;updateEditorControls();}
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
 const progress={...editingOriginal,level:editingLevel,sequence:editingSeq,skills:{...editingSkills}};
 if(editingForteChanged)progress.forteNodes={...editingForteNodes};
 const character=resolveResonatorRef(editingName);if(!character)return;
 try{CompanionStore.saveCharacter(character.id,progress,editingOriginal,lang==='fr'?'Progression enregistrée':'Progress saved',{...editingEquipment,level:editingWeaponLevel,rank:editingWeaponRank},{characters:DATA,weapons:WEAPONS});}
 catch(error){companionMessage(lang==='fr'?'Progression non enregistrée. Tes modifications restent ouvertes ; vérifie le stockage ou une modification dans un autre onglet.':'Progress not saved. Your edits remain open; check storage or changes in another tab.',true);return;}
 document.querySelector("#accountEditor").classList.remove("open");
 render();
}
