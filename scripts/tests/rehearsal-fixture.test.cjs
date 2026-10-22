const {test} = require('node:test');
const assert = require('node:assert/strict');
const {createRehearsalFixture, SAMPLE, COUNTERS} = require('../rehearsal-fixture.cjs');
async function withFixture(run) {
  const fixture = createRehearsalFixture();
  await new Promise(resolve => fixture.server.listen(0, '127.0.0.1', resolve));
  const base = `http://127.0.0.1:${fixture.server.address().port}`;
  try { await run(fixture, base); } finally { fixture.server.closeAllConnections(); await new Promise(resolve => fixture.server.close(resolve)); }
}
test('real loopback fixture authenticates, expires, resets and handles only the fixed practice file', () => withFixture(async (fixture, base) => {
  assert.equal((await fetch(base)).status, 200);
  const denied = await fetch(base + '/api/clue'); assert.equal(denied.status, 401);
  assert.equal((await fetch(base + '/api/login', {method: 'POST', body: JSON.stringify({user: 'other'})})).status, 400);
  const login = await fetch(base + '/api/login', {method: 'POST', body: JSON.stringify({user: 'practice-competitor'})});
  assert.equal(login.status, 200); const headers = {cookie: login.headers.get('set-cookie').split(';')[0]};
  assert.match(login.headers.get('set-cookie'), /HttpOnly; SameSite=Strict/);
  assert.equal((await fetch(base + '/api/session', {headers})).status, 200);
  const clue = await fetch(base + '/api/clue', {headers}); assert.deepEqual(await clue.json(), {clue: 'practice_clue'});
  assert.equal((await fetch(base + '/challenge', {headers})).status, 200);
  const upload = await fetch(base + '/api/upload', {method: 'POST', headers, body: JSON.stringify({name: 'practice.txt', content: SAMPLE})});
  assert.equal(upload.status, 200); assert.equal((await upload.json()).bytes, Buffer.byteLength(SAMPLE));
  assert.equal((await fetch(base + '/artifact.txt', {headers})).status, 200);
  assert.equal((await fetch(base + '/artifact.txt', {headers})).headers.get('content-disposition'), 'attachment; filename="practice-artifact.txt"');
  assert.equal(await (await fetch(base + '/artifact.txt', {headers})).text(), SAMPLE);
  fixture.expire(); assert.equal((await fetch(base + '/api/session', {headers})).status, 401);
  fixture.reset(); assert.deepEqual(fixture.counters, Object.fromEntries(COUNTERS.map(k => [k, 0])));
}));
test('loopback fixture rejects malformed/oversize JSON and unknown routes without recording successful login', () => withFixture(async (fixture, base) => {
  for (const body of ['{', 'x'.repeat(4097), JSON.stringify({user: ['practice-competitor']})]) assert.equal((await fetch(base + '/api/login', {method: 'POST', body})).status, 400);
  assert.equal(fixture.counters.logins, 0); assert.equal((await fetch(base + '/unknown')).status, 404);
  assert.equal((await fetch(base + '/api/clue', {method: 'POST'})).status, 404);
  assert.equal((await fetch(base + '/api/login', {method: 'GET'})).status, 404);
}));
