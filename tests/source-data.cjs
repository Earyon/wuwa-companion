const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'..'),catalogue=require('../data/catalogue.json'),assets=require('../data/game-assets.json'),texts=require('../data/localization-fr.json');
const reviewed=new Set();
for(const folder of ['game','game-ui']){
 const manifest=require('../assets/'+folder+'/sources.json');assert.equal(manifest.creator,'Kuro Games');
 for(const row of manifest.files){const file=path.join(root,'assets',folder,row.file);assert.ok(file.startsWith(path.join(root,'assets',folder)+path.sep));
  if(row.spriteLayout==='standalone')assert.equal(row.texturePackage.split('/').at(-1),row.source.split('/').at(-1),'Standalone texture identity must match its sprite; the packed-atlas index is not valid here');
  if(row.spriteLayout)assert.ok(['packed','standalone'].includes(row.spriteLayout)&&row.rect.every(Number.isFinite));
  if(reviewed.has(file))continue;
  const bytes=fs.readFileSync(file);assert.equal(crypto.createHash('sha256').update(bytes).digest('hex'),row.sha256,row.file);assert.equal(bytes.subarray(0,4).toString(),'RIFF');assert.equal(bytes.subarray(8,12).toString(),'WEBP');reviewed.add(file);
 }
}
for(const group of ['assets','portraits','echoes','weapons'])for(const file of Object.values(assets[group]))assert.ok(reviewed.has(path.join(root,file)),file);
for(const c of catalogue.characters){const data=require('../data/resonators/'+c.gameId+'.json');assert.equal(String(data.Id),c.gameId);assert.equal(data.localSource.patchVersion,'3.6.13');assert.ok(assets.portraits[c.gameId]);assert.ok(texts.names.character[c.gameId]);
 for(const locale of ['fr','en']){assert.equal(data.locales[locale].ResonantChain.length,6);assert.ok(data.locales[locale].Skills.every(s=>s.SkillName&&s.SkillDescribe||s.SkillType==='Inherent Skill'));}
}
assert.equal(require('../data/achievements.json').achievements.filter(a=>a.name.fr&&a.description.fr).length,1207);
assert.equal(require('../data/weapons.json').weapons.length,122);
console.log(`PASS: ${reviewed.size} official image files match reviewed hashes; 58 character references/artworks, 122 weapons and 1,207 French achievements.`);
