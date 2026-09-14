'use strict';
const TUTORIAL_KEY='wwc_tutorial_v1';
let tutorialStep=0,tutorialContext='welcome';
function tutorialSeen(){try{return localStorage.getItem(TUTORIAL_KEY)==='seen';}catch{return false;}}
const tutorialSteps=()=>[
 [tr('Bienvenue dans WuWa Companion','Welcome to WuWa Companion'),tr('Retrouve ta collection et les informations du jeu au même endroit. Ce guide est facultatif : tu peux le passer et le relancer dans Plus → Réglages.','Keep your collection and game information in one place. This guide is optional: skip it anytime and replay it in More → Settings.')],
 [tr('1. Renseigner mon compte','1. Record my account'),tr('Dans Mon compte, choisis Résonateurs, Armes, Échos ou Ressources. Ajoute tes personnages possédés, puis ouvre leur fiche pour renseigner leurs niveaux. Une valeur « ? » reste inconnue : elle n’est pas comptée comme zéro.','In My Account, choose Resonators, Weapons, Echoes or Resources. Add your owned characters, then open their sheets to record levels. A “?” stays unknown; it is not treated as zero.')],
 [tr('2. Équiper mes exemplaires','2. Equip my copies'),tr('Chaque arme et chaque Écho représente un exemplaire de ton inventaire. Dans la fiche d’un Résonateur, choisis l’arme et les cinq Échos équipés. Enregistrer applique les changements ; fermer la fiche les annule.','Each weapon and Echo represents one inventory copy. In a Resonator sheet, choose the equipped weapon and five Echoes. Save applies the changes; closing the sheet cancels them.')],
 [tr('3. Consulter l’Encyclopédie','3. Explore the Encyclopedia'),tr('Consulte les Résonateurs, armes et Échos sans les ajouter à ton compte. Les filtres changent la sélection immédiatement. Dans les catalogues Armes et Échos, le bouton Rechercher applique le texte saisi.','Browse Resonators, weapons and Echoes without adding them to your account. Filters change the selection immediately. In weapon and Echo catalogues, Search applies the text you enter.')],
 [tr('4. Garder mes données','4. Keep my data'),tr('Le compte reste dans ce navigateur, sans connexion à Kuro ni synchronisation automatique. Exporte une sauvegarde dans Plus → Réglages pour changer d’appareil. Un import propose un aperçu avant application.','Your account stays in this browser, without Kuro login or automatic sync. Export a backup in More → Settings to switch devices. Imports show a preview before applying changes.')]
];
function showTutorial(context='welcome'){
 tutorialStep=0;tutorialContext=context;
 let dialog=document.getElementById('tutorial');
 if(!dialog){dialog=document.createElement('dialog');dialog.id='tutorial';dialog.className='tutorial-dialog';dialog.setAttribute('aria-labelledby','tutorialTitle');document.body.append(dialog);dialog.addEventListener('cancel',event=>{event.preventDefault();finishTutorial();});}
 renderTutorial();dialog.showModal();
}
function renderTutorial(){
 const steps=tutorialSteps(),[title,text]=steps[tutorialStep],dialog=document.getElementById('tutorial');
 dialog.innerHTML=`<p class="editor-eyebrow">${tr('Découvrir Companion','Discover Companion')} · ${tutorialStep+1} / ${steps.length}</p><h2 id="tutorialTitle" tabindex="-1">${title}</h2>${tutorialContext==='import'&&tutorialStep===0?`<p>${tr('Ton import est enregistré. Voici comment utiliser ces données dans l’application.','Your import is saved. Here is how to use this data in the app.')}</p>`:''}<p>${text}</p><div class="tutorial-progress" aria-hidden="true">${steps.map((_,i)=>`<span class="${i<=tutorialStep?'active':''}"></span>`).join('')}</div><footer class="companion-actions">${companionButton('tutorial-skip',tr('Passer le tutoriel','Skip tutorial'))}${tutorialStep?companionButton('tutorial-previous',tr('Précédent','Previous')):''}${companionButton('tutorial-next',tutorialStep===steps.length-1?tr('Commencer','Get started'):tr('Suivant','Next'))}</footer>`;
 if(dialog.open)document.getElementById('tutorialTitle').focus();
}
function finishTutorial(){try{localStorage.setItem(TUTORIAL_KEY,'seen');}catch{}document.getElementById('tutorial')?.close();}
function maybeShowTutorial(){
 let imported=false;try{imported=localStorage.getItem('wwc_tutorial_after_import')==='yes';localStorage.removeItem('wwc_tutorial_after_import');}catch{}
 if((imported||!tutorialSeen())&&!document.querySelector('dialog[open]'))showTutorial(imported?'import':'welcome');
}
function queueImportTutorial(){try{localStorage.setItem('wwc_tutorial_after_import','yes');}catch{}}
Object.assign(companionActions,{
 'tutorial-replay':()=>showTutorial('replay'),
 'tutorial-skip':finishTutorial,
 'tutorial-previous':()=>{tutorialStep=Math.max(0,tutorialStep-1);renderTutorial();},
 'tutorial-next':()=>{if(tutorialStep===tutorialSteps().length-1)finishTutorial();else{tutorialStep++;renderTutorial();}}
});
