const fs=require('node:fs');
const path=require('node:path');
const crypto=require('node:crypto');
const {execFileSync}=require('node:child_process');
const {createFixture}=require('./capability-fixture.cjs');
const {evaluate}=require('./capability-policy.cjs');
async function main(){
 const cypress=require('cypress');
 fs.rmSync('capability-evidence.jsonl',{force:true});
 const {server,counters}=createFixture();
 await new Promise((resolve,reject)=>{server.once('error',reject);server.listen(0,'127.0.0.1',resolve);});
 const started=new Date().toISOString();
 try{
  const results=await cypress.run({browser:'chrome',configFile:'cypress.capabilities.config.cjs',spec:'cypress/capabilities/core.cy.js',config:{e2e:{baseUrl:`http://127.0.0.1:${server.address().port}`}}});
  if(!Array.isArray(results.runs))throw new Error(results.message||'No Cypress run results');
  const evidence=fs.existsSync('capability-evidence.jsonl')?fs.readFileSync('capability-evidence.jsonl','utf8').trim().split('\n').filter(Boolean).map(JSON.parse):[];
  const screenshots=results.runs.flatMap(run=>run.screenshots||[]).filter(s=>s.path&&fs.existsSync(s.path)).map(s=>({file:path.basename(s.path),bytes:fs.statSync(s.path).size,sha256:crypto.createHash('sha256').update(fs.readFileSync(s.path)).digest('hex')}));
  const tests=results.runs.flatMap(run=>run.tests||[]);
  const summary={...evaluate(results,evidence,counters,screenshots),commit:execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim(),started,finished:new Date().toISOString(),runId:process.env.GITHUB_RUN_ID||null,attempt:process.env.GITHUB_RUN_ATTEMPT||null,tests:results.totalTests,passed:results.totalPassed,failed:results.totalFailed,counters,screenshots,errors:tests.filter(t=>t.state==='failed').map(t=>({test:t.title,message:String(t.displayError||'').replace(/\u001b\[[0-9;]*m/g,'').slice(0,2000)})),scope:'Loopback fixture only; no external website, cookies, credentials or user-supplied code.'};
  fs.writeFileSync('capability-result.json',JSON.stringify(summary,null,2));
  console.log(JSON.stringify(summary,null,2));if(!summary.verified)process.exitCode=1;
 }finally{server.closeAllConnections();await new Promise(resolve=>server.close(resolve));}
}
main().catch(error=>{fs.writeFileSync('capability-result.json',JSON.stringify({verified:false,error:String(error.message).slice(0,2000)}));console.error(error.message);process.exitCode=1;});
