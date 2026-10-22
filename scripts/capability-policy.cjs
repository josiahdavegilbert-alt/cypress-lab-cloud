const CHECKS=Object.freeze(['browser_interaction','page_inspection','network_observation','network_simulation','direct_http','spy','stub','clock']);
function evaluate(results,evidence,counters,screenshots){
 const tests=(results.runs||[]).flatMap(run=>run.tests||[]);
 const failures=tests.filter(test=>test.state==='failed');
 const lastTitle=test=>test.title?.[test.title.length-1];
 const expectedFailure=failures.length===1&&lastTitle(failures[0])==='EXPECTED_FAILURE_DIAGNOSTIC'&&String(failures[0].displayError||'').includes('INTENTIONAL_CAPABILITY_FAILURE');
 const verifiedChecks=Object.fromEntries(CHECKS.map(id=>[id,tests.filter(t=>lastTitle(t)===id&&t.state==='passed').length===1&&evidence.filter(e=>e.id===id).length===1]));
 const screenshotsOK=screenshots.some(s=>s.file.includes('controlled-dom')&&s.bytes>0)&&screenshots.some(s=>s.file.includes('EXPECTED_FAILURE_DIAGNOSTIC')&&s.bytes>0);
 const verified=results.totalTests===9&&results.totalPassed===8&&results.totalFailed===1&&tests.length===9&&Object.values(verifiedChecks).every(Boolean)&&evidence.length===CHECKS.length&&expectedFailure&&screenshotsOK&&counters.browserPosts===2&&counters.directGets===1;
 return {verified,verifiedChecks,expectedFailure,screenshotsOK,componentTesting:'not implemented; separate mount/bundler acceptance required'};
}
module.exports={CHECKS,evaluate};
