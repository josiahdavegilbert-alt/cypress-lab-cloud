const {COUNTERS} = require('./rehearsal-fixture.cjs');
const EXPECTED = Object.freeze({
  anonymous_access: {denied: 1},
  login_session_restore: {loginAttempts: 1, logins: 1, validations: 2, clueReads: 1},
  session_recovery: {loginAttempts: 2, logins: 2, validations: 3, denied: 1},
  state_isolation: {denied: 1},
  bounded_dom_evidence: {},
  upload_download: {loginAttempts: 1, logins: 1, validations: 1, uploads: 1, downloads: 1},
  error_recovery: {loginAttempts: 1, logins: 1, validations: 1, clueReads: 1}
});
const CHECKS = Object.freeze(Object.keys(EXPECTED));
function evaluateRehearsal(results, evidence, screenshots) {
  const tests = (results.runs || []).flatMap(run => run.tests || []);
  const checks = Object.fromEntries(CHECKS.map(id => {
    const matches = tests.filter(t => t.title?.at(-1) === id);
    const entries = evidence.filter(e => e.id === id);
    const countersOK = entries.length === 1 && Object.keys(entries[0].counters || {}).sort().join() === [...COUNTERS].sort().join() && COUNTERS.every(key => entries[0].counters[key] === (EXPECTED[id][key] || 0));
    return [id, matches.length === 1 && matches[0].state === 'passed' && matches[0].attempts?.length === 1 && matches[0].attempts[0].state === 'passed' && countersOK];
  }));
  const screenshotsOK = screenshots.some(s => s.name.includes('rehearsal-dom') && s.validPNG) && screenshots.some(s => s.name.includes('rehearsal-files') && s.validPNG);
  return {verified: results.browserName === 'chrome' && results.totalTests === CHECKS.length && results.totalPassed === CHECKS.length && results.totalFailed === 0 && results.totalPending === 0 && results.totalSkipped === 0 && tests.length === CHECKS.length && evidence.length === CHECKS.length && Object.values(checks).every(Boolean) && screenshotsOK, checks, screenshotsOK};
}
module.exports = {EXPECTED, CHECKS, evaluateRehearsal};
