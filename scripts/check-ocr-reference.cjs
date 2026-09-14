'use strict';
// Optional local benchmark against the user's supplied video frames. No network or account writes.
// Fixtures remain private in test-results; normal CI does not depend on them.
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const directory=path.resolve(process.argv[2]||'test-results');
const load=name=>JSON.parse(fs.readFileSync(path.join(directory,name),'utf8'));
const words=data=>data.lines.flatMap(line=>line.words.map(word=>word.text));
const report={scope:'Five local OCR observations; not an end-to-end inventory scan',cases:[]};
const attrs=load('ocr-hiyuki-attributes.json'),attrWords=words(attrs);
const knownAttributes=['15370','2376','1222','149.2%','74.2%','267.6%'];
assert.ok(attrs.lines.some(line=>line.text==='Hiyuki'));
assert.ok(attrs.lines.some(line=>/^Nv\s*90$/.test(line.text)));
assert.ok(knownAttributes.every(value=>attrWords.includes(value)));
report.cases.push({screen:'attributes',correctValues:6,checkedValues:6,level:90,ascension:'not established',elapsedMs:attrs.elapsedMs});
const skill=load('detail-0116.00.png.ocr.json');
const levels=skill.lines.filter(line=>/^Nv\.\d+\/10$/.test(line.text)).map(line=>({
 x:Math.min(...line.words.map(w=>w.x)),value:Number(line.text.match(/\d+/)[0])
})).sort((a,b)=>a.x-b.x).map(x=>x.value);
assert.deepEqual(levels,[6,6,6,9,6]);
report.cases.push({screen:'skills',correctValues:5,checkedValues:5,unlocks:'not established',elapsedMs:skill.elapsedMs});
const weapon=load('detail-0039.00.png.ocr.json');
assert.ok(weapon.lines.some(l=>l.text==='Sabre #18'));
assert.ok(weapon.lines.some(l=>l.text==='Rang 1 Rang 2'));
report.cases.push({screen:'weapon refinement',currentAndTargetBothPresent:true,automaticRankSelection:false,elapsedMs:weapon.elapsedMs});
const stats=['30.0%','100','8.6%','510','9.4%','9.2%','6.9%'];
for(const [name,expected]of [['overview-025.jpg.ocr.json',1],['echo-full.ocr.json',4]]){
 const data=load(name),tokens=words(data),accepted=stats.filter(s=>tokens.includes(s));
 assert.equal(accepted.length,expected,'OCR baseline changed; inspect the source image before accepting a new score');
 report.cases.push({screen:'Echo detail',width:data.width,height:data.height,exactValues:accepted.length,checkedValues:stats.length,
  missingOrMalformed:stats.filter(s=>!tokens.includes(s)),safeToImportAutomatically:false,elapsedMs:data.elapsedMs});
}
fs.writeFileSync(path.join(directory,'ocr-benchmark.json'),JSON.stringify(report,null,2));
console.log(JSON.stringify(report,null,2));
