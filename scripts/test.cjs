// One reproducible entry point. UI suites use independent headless browser profiles.
const {spawnSync}=require('node:child_process'),path=require('node:path');
const root=path.resolve(__dirname,'..');
const suites=['account-store','activity-rules','convene-rules','progression','responsive','features','editor','echoes','planning','activities','profiles-teams','recommendations','convenes','optimization','final-review','pwa-update'];
for(const name of suites){
 console.log('\nTesting '+name);
 const result=spawnSync(process.execPath,[path.join(root,'tests',name+'.cjs')],{cwd:root,stdio:'inherit'});
 if(result.error){console.error(result.error);process.exit(1);}
 if(result.status!==0)process.exit(result.status||1);
}
console.log('\nPASS: '+suites.length+' suites.');
