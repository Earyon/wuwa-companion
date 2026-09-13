'use strict';
// Native modal focus, keyboard dismissal and inert background are shared by
// the character editor and its nested pickers.
function syncDialogScroll(){document.body.classList.toggle('has-modal',!!document.querySelector('dialog[open]'));}
function openDialog(id){
 const dialog=document.getElementById(id);
 // Make the content visible before native focus placement runs.
 dialog.classList.add('open');
 if(!dialog.open)dialog.showModal();
 syncDialogScroll();
}
function closeDialog(id){
 const dialog=document.getElementById(id);
 dialog.close();dialog.classList.remove('open');syncDialogScroll();
}
for(const dialog of document.querySelectorAll('dialog.selector-overlay')){
 dialog.addEventListener('close',()=>{if(!dialog.open)dialog.classList.remove('open');syncDialogScroll();});
}
