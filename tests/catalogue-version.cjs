const assert=require('node:assert/strict'),version=require('../catalogue-version.js');
const captured=[{GameVer:'3.6.0',ResVer:'3.6.6',Changelist:'8499915'},{character:[1212,1413],weapon:[21010076,21020106]}];
assert.deepEqual(version.read(captured),{gameVersion:'3.6.0',resourceVersion:'3.6.6'});
assert.deepEqual(version.read(captured[0]),version.read(captured));
for(const value of [null,[],{},[{character:[]}],[captured[0],captured[0]],{GameVer:'',ResVer:'3.6.6'},{GameVer:'3.6.0',ResVer:null}])assert.throws(()=>version.read(value));
console.log('PASS: actual array-shaped version response, legacy object and rejection of absent or ambiguous metadata.');
