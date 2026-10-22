const {test} = require('node:test');
const assert = require('node:assert/strict');
const {EXPECTED, CHECKS, evaluateRehearsal} = require('../rehearsal-policy.cjs');
const {COUNTERS} = require('../rehearsal-fixture.cjs');
function synthetic() {
  return {results: {browserName: 'chrome', totalTests: 7, totalPassed: 7, totalFailed: 0, totalPending: 0, totalSkipped: 0, runs: [{tests: CHECKS.map(id => ({title: ['Controlled competition rehearsal', id], state: 'passed', attempts: [{state: 'passed'}]}))}]}, evidence: CHECKS.map(id => ({id, counters: Object.fromEntries(COUNTERS.map(key => [key, EXPECTED[id][key] || 0]))})), screenshots: [{name: 'rehearsal-dom.png', validPNG: true}, {name: 'rehearsal-files.png', validPNG: true}]};
}
const verdict = x => evaluateRehearsal(x.results, x.evidence, x.screenshots).verified;
test('synthetic verdict-policy input accepts complete one-attempt Chrome results', () => assert.equal(verdict(synthetic()), true));
for (const [name, mutate] of [
  ['wrong browser', x => { x.results.browserName = 'electron'; }],
  ['missing test', x => x.results.runs[0].tests.pop()],
  ['duplicate check', x => { x.evidence[1] = x.evidence[0]; }],
  ['unexpected backend traffic', x => { x.evidence[0].counters.clueReads++; }],
  ['hidden retry', x => x.results.runs[0].tests[0].attempts.unshift({state: 'failed'})],
  ['pending test', x => { x.results.totalPending = 1; }],
  ['skipped test', x => { x.results.totalSkipped = 1; }],
  ['failed test', x => { x.results.runs[0].tests[0].state = 'failed'; }],
  ['missing screenshot', x => x.screenshots.pop()],
  ['invalid screenshot', x => { x.screenshots[0].validPNG = false; }],
  ['unknown counter', x => { x.evidence[0].counters.unknown = 0; }]
]) test(`synthetic verdict-policy input rejects ${name}`, () => { const value = synthetic(); mutate(value); assert.equal(verdict(value), false); });
