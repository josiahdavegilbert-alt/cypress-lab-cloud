const fs = require('node:fs');
const path = require('node:path');
const {execFileSync} = require('node:child_process');
const {evaluateRehearsal} = require('./rehearsal-policy.cjs');
const {hash, validPNG} = require('./rehearsal-artifact.cjs');
async function main() {
  const cypress = require('cypress');
  const root = 'rehearsal-output'; fs.rmSync(root, {recursive: true, force: true}); fs.mkdirSync(root);
  execFileSync('git', ['ls-files', '--error-unmatch', 'package-lock.json']);
  const identity = {commit: execFileSync('git', ['rev-parse', 'HEAD'], {encoding: 'utf8'}).trim(), runId: process.env.GITHUB_RUN_ID || null, attempt: process.env.GITHUB_RUN_ATTEMPT || null};
  const lockBefore = hash(fs.readFileSync('package-lock.json')); const started = new Date().toISOString();
  const repetitions = [];
  for (const iteration of [1, 2]) {
    const evidenceFile = `${root}/evidence-${iteration}.jsonl`; fs.writeFileSync(evidenceFile, '');
    const results = await cypress.run({browser: 'chrome', configFile: 'cypress.rehearsal.config.cjs', spec: 'cypress/rehearsal/competition.cy.js', env: {rehearsalIteration: iteration}, config: {screenshotsFolder: `cypress/screenshots/rehearsal-${iteration}`, downloadsFolder: `cypress/downloads/rehearsal-${iteration}`}});
    if (!Array.isArray(results.runs)) throw new Error('Cypress returned no completed rehearsal results');
    const evidence = fs.readFileSync(evidenceFile, 'utf8').split('\n').filter(Boolean).map(JSON.parse);
    const screenshots = results.runs.flatMap(run => run.screenshots || []).map((s, index) => {
      const data = fs.readFileSync(s.path); const name = path.basename(s.path);
      const file = `pass-${iteration}-${index}.png`; fs.writeFileSync(`${root}/${file}`, data);
      return {name, file, bytes: data.length, sha256: hash(data), validPNG: validPNG(data)};
    });
    repetitions.push({iteration, ...evaluateRehearsal(results, evidence, screenshots), browser: results.browserName, browserVersion: results.browserVersion, cypressVersion: results.cypressVersion, tests: results.totalTests, passed: results.totalPassed, failed: results.totalFailed, screenshots});
  }
  const lockAfter = hash(fs.readFileSync('package-lock.json'));
  const result = {...identity, started, finished: new Date().toISOString(), lockBefore, lockAfter, repetitions, verified: lockBefore === lockAfter && repetitions.length === 2 && repetitions.every(r => r.verified), scope: 'Two controlled loopback rehearsals only. No CTF traffic, real credentials, arbitrary targets, flag submissions or dependency changes.'};
  fs.writeFileSync(`${root}/result.json`, JSON.stringify(result, null, 2));
  const files = fs.readdirSync(root).sort().map(file => { const data = fs.readFileSync(`${root}/${file}`); return {path: file, bytes: data.length, sha256: hash(data)}; });
  fs.writeFileSync(`${root}/manifest.json`, JSON.stringify({...identity, files}, null, 2));
  console.log(JSON.stringify(result, null, 2)); if (!result.verified) process.exitCode = 1;
}
main().catch(error => {
  fs.mkdirSync('rehearsal-output', {recursive: true});
  fs.writeFileSync('rehearsal-output/result.json', JSON.stringify({verified: false, error: 'Rehearsal could not complete; inspect the private workflow log.'}));
  console.error(String(error.message).slice(0, 1000)); process.exitCode = 1;
});
