const {defineConfig}=require('cypress');
const fs=require('node:fs');
const {CHECKS}=require('./scripts/capability-policy.cjs');
module.exports=defineConfig({
 video:false,retries:0,screenshotOnRunFailure:true,
 screenshotsFolder:'cypress/screenshots/capabilities',defaultCommandTimeout:4000,
 e2e:{specPattern:'cypress/capabilities/**/*.cy.js',supportFile:false,
  setupNodeEvents(on){on('task',{
   capabilityEvidence(id){
    if(!CHECKS.includes(id))throw new Error('Unknown controlled-fixture check');
    fs.appendFileSync('capability-evidence.jsonl',JSON.stringify({id})+'\n');return null;
   }
  });}
 }
});
