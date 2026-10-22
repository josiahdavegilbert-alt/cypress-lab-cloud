const {test}=require('node:test');
const assert=require('node:assert/strict');
const {createFixture}=require('../capability-fixture.cjs');
test('controlled fixture serves DOM, API and second page with bounded inputs',async()=>{
 const {server,counters}=createFixture();
 await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
 const base=`http://127.0.0.1:${server.address().port}`;
 try{
  const page=await fetch(base);assert.equal(page.status,200);assert.match(await page.text(),/data-cy="reveal"/);assert.equal(page.headers.get('cache-control'),'no-store');
  const next=await fetch(base+'/next');assert.match(await next.text(),/page_two_clue/);
  const direct=await fetch(base+'/api/clue');assert.deepEqual(await direct.json(),{clue:'practice_clue',source:'direct-http'});
  const real=await fetch(base+'/api/clue',{method:'POST',body:JSON.stringify({name:'Learner'})});assert.deepEqual(await real.json(),{name:'Learner',clue:'practice_clue'});
  for(const body of ['{',JSON.stringify({name:'x'.repeat(33)})]){const invalid=await fetch(base+'/api/clue',{method:'POST',body});assert.equal(invalid.status,400);}
  assert.equal((await fetch(base+'/missing')).status,404);
  assert.deepEqual(counters,{browserPosts:1,directGets:1});
 }finally{await new Promise(resolve=>server.close(resolve));}
});
