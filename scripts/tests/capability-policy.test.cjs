const {test}=require('node:test');
const assert=require('node:assert/strict');
const {CHECKS,evaluate}=require('../capability-policy.cjs');
function passing(){return {results:{totalTests:9,totalPassed:8,totalFailed:1,runs:[{tests:[...CHECKS.map(id=>({title:['Controlled capability acceptance',id],state:'passed'})),{title:['Controlled capability acceptance','EXPECTED_FAILURE_DIAGNOSTIC'],state:'failed',displayError:'expected h1 to have text INTENTIONAL_CAPABILITY_FAILURE'}]}]},evidence:CHECKS.map(id=>({id})),counters:{browserPosts:2,directGets:1},screenshots:[{file:'controlled-dom.png',bytes:100},{file:'EXPECTED_FAILURE_DIAGNOSTIC (failed).png',bytes:100}]};}
const verdict=value=>evaluate(value.results,value.evidence,value.counters,value.screenshots);
test('accepts only the complete synthetic policy fixture',()=>assert.equal(verdict(passing()).verified,true));
for(const [name,mutate] of [
 ['missing evidence',v=>v.evidence.pop()],
 ['duplicate evidence',v=>{v.evidence[7]={id:v.evidence[0].id};}],
 ['unexpected real call during stub',v=>{v.counters.browserPosts++;}],
 ['unexpected failure',v=>{v.results.runs[0].tests[8].title=['different failure'];}],
 ['wrong expected failure reason',v=>{v.results.runs[0].tests[8].displayError='Network timeout';}],
 ['missing failure screenshot',v=>v.screenshots.pop()],
 ['missing DOM screenshot',v=>v.screenshots.shift()],
 ['zero-byte screenshot',v=>{v.screenshots[0].bytes=0;}],
 ['wrong passing test',v=>{v.results.runs[0].tests[0].title=['unrelated'];}],
 ['all tests pass without diagnostic',v=>{v.results.totalPassed=9;v.results.totalFailed=0;v.results.runs[0].tests[8].state='passed';}]
])test(`rejects ${name}`,()=>{const value=passing();mutate(value);assert.equal(verdict(value).verified,false);});
