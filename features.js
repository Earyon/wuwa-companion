'use strict';
// Presentation gate only. Stored goals, builds and pull history are preserved.
let guidesVisible=false;
const collectionViews=['account','ency','more'];
const deferredViews=new Set(['daily','planner']);
const deferredMoreViews=new Set(['wishes','optimize','tracker']);
function viewIsVisible(view){return guidesVisible||!deferredViews.has(view);}
function moreViewIsVisible(view){return guidesVisible||!deferredMoreViews.has(view);}
