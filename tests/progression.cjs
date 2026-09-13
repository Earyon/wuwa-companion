const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const source=fs.readFileSync('cost-engine.js','utf8'),c=vm.createContext({});vm.runInContext(source+';globalThis.engine=CostEngine;',c);
const E=c.engine,tables=require('../data/progression.json'),detail=structuredClone(require('./fixtures/qingxiao-costs.json')),weapon=require('./fixtures/sword-costs.json');
const normalizer=fs.readFileSync('skills.js','utf8').split('function normalizeSkillType')[1].split('function skillIcon')[0];c.content=v=>v;vm.runInContext('function normalizeSkillType'+normalizer,c);detail.Skills=detail.Skills.map(s=>({...s,SkillType:c.normalizeSkillType(s.SkillType)}));
const types=['Normal Attack','Skill','Forte Circuit','Liberation','Intro'];
const passives=[...detail.SkillTree.map(n=>'node:'+n.Id),...detail.Skills.filter(s=>s.SkillType==='Inherent Skill'&&s.Consumes.some(r=>r.Consume.length)).map(s=>'skill:'+s.SkillId)];
const actual={level:1,ascension:0,skills:Object.fromEntries(types.map(t=>[t,1])),forteNodes:Object.fromEntries(passives.map(id=>[id,false]))};
const goal={level:90,ascension:6,skills:Object.fromEntries(types.map(t=>[t,10])),forteNodes:Object.fromEntries(passives.map(id=>[id,true]))};
let r=E.calculate(actual,goal,detail,null,null,tables);
assert.equal(r.complete,true);assert.equal(r.costs['exp:role'],2438000);assert.equal(r.costs['2'],3053300,'Independent full Qingxiao cost total');assert.equal(r.costs['41400344'],46);assert.equal(r.costs['42601620'],60);assert.equal(r.costs['41400304'],26);
const weaponGoal={level:null,skills:{},weaponLevel:90,weaponAscension:6};r=E.calculate({},weaponGoal,null,{level:1,ascension:0},weapon,tables);assert.equal(r.complete,true);assert.equal(r.costs['exp:weapon'],2692400);assert.equal(r.costs['2'],1406960);
// Source curves use target level for characters and current level for weapons.
assert.equal(E.calculate({level:1,ascension:0},{level:2},detail,null,null,tables).costs['exp:role'],400);
assert.equal(E.calculate({},{weaponLevel:2},null,{level:1,ascension:0},weapon,tables).costs['exp:weapon'],600);
assert.equal(E.calculate({level:20},{level:21},detail,null,null,tables).complete,false,'Boundary ascension is ambiguous');
assert.equal(E.calculate({level:20,ascension:1},{level:21},detail,null,null,tables).complete,true);
assert.ok(!E.calculate({level:null},{level:90},detail,null,null,tables).complete);
assert.equal(E.calculate({level:90},{level:80},detail,null,null,tables).costs['exp:role'],undefined,'Lower target requires no resources');
const invalid=structuredClone(detail);invalid.Skills.find(s=>s.SkillType==='Intro').Consumes.find(r=>r.SkillId===2).Consume[0].Value=-1;
r=E.calculate({skills:{Intro:1}},{skills:{Intro:3}},invalid,null,null,tables);assert.equal(r.complete,false);assert.equal(Object.keys(r.costs).length,0,'Invalid row does not leak a partial skill total');
let net=E.net({'2':200,'exp:role':1000},{'2':0,'43010001':1},tables);assert.equal(net[0].remaining,200);assert.equal(net[1].remaining,0,'Confirmed sufficient EXP is enough even when other tiers are unknown');
net=E.net({'2':200,'exp:role':2000},{'43010001':1},tables);assert.equal(net[0].remaining,null);assert.equal(net[1].remaining,null);assert.equal(net[1].known,1000);
for(let split=2;split<90;split++){const a=E.calculate({level:1,ascension:6},{level:split},detail,null,null,tables),b=E.calculate({level:split,ascension:6},{level:90},detail,null,null,tables);assert.equal((a.costs['exp:role']||0)+(b.costs['exp:role']||0),2438000);}
console.log('PASS: independently cross-checked full character/weapon totals, curve boundaries, ascensions, passive IDs, invalid/missing data, unknown/zero stock and every level partition.');
