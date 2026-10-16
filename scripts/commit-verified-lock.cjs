const fs = require('node:fs');
const crypto = require('node:crypto');
const EXPECTED = 'e323207b6f5b9df1dfdead00a58cbd91b0cd10cabfa28461189ccefc32fca2e8';
const ROOT = 'https://api.github.com/repos/josiahdavegilbert-alt/cypress-lab-cloud';
const hash = bytes => crypto.createHash('sha256').update(bytes).digest('hex');
async function request(endpoint, method = 'GET', body) {
  const response = await fetch(ROOT + endpoint, { method, signal: AbortSignal.timeout(20000), headers: { Authorization: `Bearer ${process.env.GH_TOKEN}`, Accept: 'application/vnd.github+json', 'Content-Type': 'application/json', 'X-GitHub-Api-Version': '2022-11-28' }, ...(body ? { body: JSON.stringify(body) } : {}) });
  if (response.status === 404 && method === 'GET') return null;
  if (!response.ok) throw new Error(`GitHub ${method} HTTP ${response.status}`);
  return response.json();
}
async function main() {
  if (process.env.GITHUB_REPOSITORY !== 'josiahdavegilbert-alt/cypress-lab-cloud' || process.env.GITHUB_ACTOR !== 'josiahdavegilbert-alt') throw new Error('Unauthorized repository or actor');
  const event = JSON.parse(fs.readFileSync(process.env.GITHUB_EVENT_PATH, 'utf8'));
  if (process.env.GITHUB_EVENT_NAME !== 'workflow_dispatch' && !(process.env.GITHUB_EVENT_NAME === 'issues' && event.sender?.login === 'josiahdavegilbert-alt' && event.issue?.user?.login === 'josiahdavegilbert-alt' && event.issue?.title === '[Cypress] Commit verified lockfile')) throw new Error('Unauthorized event');
  const bytes = fs.readFileSync('package-lock.json');
  if (hash(bytes) !== EXPECTED) throw new Error('Unexpected lockfile bytes');
  const currentManifest = await request('/contents/package.json?ref=main');
  if (!currentManifest?.content || !Buffer.from(currentManifest.content, 'base64').equals(fs.readFileSync('package.json'))) throw new Error('Main manifest changed or could not be verified');
  const existing = await request('/contents/package-lock.json?ref=main');
  let result;
  if (existing) {
    if (!existing.content || hash(Buffer.from(existing.content, 'base64')) !== EXPECTED) throw new Error('A different lockfile already exists; refusing overwrite');
    result = { status: 'already-present', fileUrl: existing.html_url, sha256: EXPECTED };
  } else {
    const saved = await request('/contents/package-lock.json', 'PUT', { message: 'Commit verified Cypress dependency lockfile', content: bytes.toString('base64'), branch: 'main' });
    const check = await request('/contents/package-lock.json?ref=' + encodeURIComponent(saved.commit.sha));
    if (!check?.content || hash(Buffer.from(check.content, 'base64')) !== EXPECTED) throw new Error('Post-commit lockfile verification failed');
    result = { status: 'committed-and-hash-verified', commit: saved.commit.sha, commitUrl: saved.commit.html_url, fileUrl: saved.content.html_url, sha256: EXPECTED };
  }
  console.log(JSON.stringify(result, null, 2));
  if (process.env.GITHUB_EVENT_NAME === 'issues') await request(`/issues/${event.issue.number}/comments`, 'POST', { body: ['Verified lockfile commit result', '```json', JSON.stringify(result, null, 2), '```', 'Only package-lock.json was created. No dependency regeneration, workflow changes or CTF traffic. Consistent npm ci usage in all workflows still requires a separate change and validation.'].join('\n') });
}
main().catch(error => { console.error(error.message); process.exitCode = 1; });
