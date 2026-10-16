const fs = require('node:fs');
const path = require('node:path');
const { execFileSync } = require('node:child_process');
const OUTPUT = path.join(process.cwd(), 'acceptance-result.json');
async function report() {
  const event = JSON.parse(fs.readFileSync(process.env.GITHUB_EVENT_PATH, 'utf8'));
  if (process.env.GITHUB_REPOSITORY !== 'josiahdavegilbert-alt/cypress-lab-cloud' || event.sender?.login !== 'josiahdavegilbert-alt' || event.issue?.user?.login !== 'josiahdavegilbert-alt' || event.issue?.title !== '[Cypress] Run acceptance') throw new Error('Unauthorized report target');
  const result = fs.existsSync(OUTPUT) ? JSON.parse(fs.readFileSync(OUTPUT, 'utf8')) : { verified: false, error: 'No acceptance result file; inspect run logs.' };
  const run = `${process.env.GITHUB_SERVER_URL}/${process.env.GITHUB_REPOSITORY}/actions/runs/${process.env.GITHUB_RUN_ID}`;
  const body = ['Cypress acceptance report', `Run: ${run}`, `Attempt: ${process.env.GITHUB_RUN_ATTEMPT}`, `Install step: ${process.env.INSTALL_OUTCOME}`, `Validation step: ${process.env.VALIDATION_OUTCOME}`, '', 'Controlled fixture only. One deliberate test failure is expected; verified=true requires exactly two passing tests, that specific failure, screenshot evidence and the real API exchange.', '', '```json', JSON.stringify(result, null, 2).slice(0, 18000), '```'].join('\n');
  const response = await fetch(`https://api.github.com/repos/josiahdavegilbert-alt/cypress-lab-cloud/issues/${event.issue.number}/comments`, { method: 'POST', signal: AbortSignal.timeout(15000), headers: { Authorization: `Bearer ${process.env.GH_TOKEN}`, Accept: 'application/vnd.github+json', 'Content-Type': 'application/json', 'X-GitHub-Api-Version': '2022-11-28' }, body: JSON.stringify({ body }) });
  if (!response.ok) throw new Error(`Report HTTP ${response.status}`);
  console.log('Acceptance report posted.');
}
async function validate() {
  const http = require('node:http');
  const crypto = require('node:crypto');
  const cypress = require('cypress');
  const evidenceFile = path.join(process.cwd(), 'acceptance-network.jsonl');
  if (fs.existsSync(evidenceFile)) fs.unlinkSync(evidenceFile);
  let apiCalls = 0;
  const page = `<!doctype html><html><body><h1>Controlled lab</h1><input data-cy="name"><button data-cy="reveal">Reveal</button><div data-cy="result"></div><a data-cy="next" href="/next">Next</a><script>document.querySelector('button').onclick=async()=>{const name=document.querySelector('input').value;const r=await fetch('/api/clue',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({name})});const d=await r.json();document.querySelector('[data-cy=result]').textContent=d.name+': '+d.clue;};</script></body></html>`;
  const server = http.createServer((req, res) => {
    if (req.method === 'POST' && req.url === '/api/clue') {
      let body = '';
      req.on('data', chunk => { body += chunk; if (body.length > 4096) req.destroy(); });
      req.on('end', () => {
        try { const data = JSON.parse(body); apiCalls++; res.writeHead(200, { 'Content-Type': 'application/json', 'X-Lab-Evidence': 'controlled-fixture' }); res.end(JSON.stringify({ clue: 'practice_clue', name: data.name })); }
        catch { res.writeHead(400); res.end('Bad JSON'); }
      });
    } else if (req.method === 'GET' && (req.url === '/' || req.url === '/next')) {
      res.writeHead(200, { 'Content-Type': 'text/html' }); res.end(req.url === '/' ? page : '<!doctype html><h1>Second page</h1>');
    } else { res.writeHead(404); res.end('Not found'); }
  });
  await new Promise((resolve, reject) => { server.once('error', reject); server.listen(0, '127.0.0.1', resolve); });
  const started = Date.now();
  try {
    const results = await cypress.run({ browser: 'chrome', configFile: 'cypress.acceptance.config.cjs', spec: 'cypress/acceptance/browser.cy.js', config: { e2e: { baseUrl: `http://127.0.0.1:${server.address().port}` } } });
    if (!Array.isArray(results.runs)) throw new Error(results.message || 'Cypress did not produce run results');
    const evidence = fs.existsSync(evidenceFile) ? fs.readFileSync(evidenceFile, 'utf8').trim().split('\n').filter(Boolean).map(line => JSON.parse(line)) : [];
    const tests = results.runs.flatMap(run => run.tests || []);
    const failures = tests.filter(test => test.state === 'failed');
    const screenshots = results.runs.flatMap(run => run.screenshots || []).filter(s => s.path && fs.existsSync(s.path)).map(s => ({ file: path.basename(s.path), bytes: fs.statSync(s.path).size, sha256: crypto.createHash('sha256').update(fs.readFileSync(s.path)).digest('hex') }));
    const expectedFailure = failures.length === 1 && failures[0].title.includes('EXPECTED_FAILURE_DIAGNOSTIC');
    const verified = results.totalTests === 3 && results.totalPassed === 2 && results.totalFailed === 1 && expectedFailure && screenshots.some(s => s.bytes > 0) && evidence.length === 1 && apiCalls === 1;
    const summary = { verified, commit: execFileSync('git', ['rev-parse', 'HEAD'], { encoding: 'utf8' }).trim(), durationMs: Date.now() - started, tests: results.totalTests, passed: results.totalPassed, failed: results.totalFailed, expectedFailure, errors: failures.map(t => ({ title: t.title, message: String(t.displayError || t.attempts?.find(a => a.error)?.error?.message || 'No error text available').replace(/\u001b\[[0-9;]*m/g, '').slice(0, 3000) })), evidence, serverApiCalls: apiCalls, screenshots, limitation: 'Screenshot metadata proves local generation, not image retrieval. Fixtures contain no secrets. Dependencies remain unlocked until reviewed package-lock.json is committed.' };
    fs.writeFileSync(OUTPUT, JSON.stringify(summary, null, 2));
    console.log(JSON.stringify(summary, null, 2));
    if (!verified) process.exitCode = 1;
  } finally { await new Promise(resolve => server.close(resolve)); }
}
(process.argv[2] === '--report' ? report() : validate()).catch(error => {
  console.error(error.message);
  if (process.argv[2] !== '--report') fs.writeFileSync(OUTPUT, JSON.stringify({ verified: false, error: error.message.slice(0, 2000) }));
  process.exitCode = 1;
});
