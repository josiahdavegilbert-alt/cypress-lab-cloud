const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const zlib = require('node:zlib');
const { execFileSync } = require('node:child_process');
const hash = value => crypto.createHash('sha256').update(value).digest('hex');
function walk(root) {
  if (!fs.existsSync(root)) return [];
  return fs.readdirSync(root, { withFileTypes: true }).flatMap(entry => { const file = path.join(root, entry.name); return entry.isDirectory() ? walk(file) : [file]; });
}
async function main() {
  const result = fs.existsSync('acceptance-result.json') ? JSON.parse(fs.readFileSync('acceptance-result.json', 'utf8')) : {};
  const restored = walk('restored-acceptance');
  const screenshots = (result.screenshots || []).map(expected => {
    const matches = restored.filter(file => file.endsWith('.png') && path.basename(file) === expected.file);
    const verified = matches.length === 1 && fs.statSync(matches[0]).size === expected.bytes && hash(fs.readFileSync(matches[0])) === expected.sha256;
    return { file: expected.file, restoredAndHashVerified: verified };
  });
  const lock = fs.readFileSync('package-lock.json');
  const restoredLock = restored.filter(file => path.basename(file) === 'package-lock.json');
  const lockRestored = restoredLock.length === 1 && hash(fs.readFileSync(restoredLock[0])) === hash(lock);
  const trackedLock = spawnTrackedLock();
  const summary = { commit: execFileSync('git', ['rev-parse', 'HEAD'], { encoding: 'utf8' }).trim(), run: process.env.GITHUB_RUN_ID, attempt: process.env.GITHUB_RUN_ATTEMPT, artifactUrl: process.env.ARTIFACT_URL || null, retentionDays: 7, upload: process.env.UPLOAD_OUTCOME, download: process.env.DOWNLOAD_OUTCOME, screenshots, lockSha256: hash(lock), lockRestored, repositoryLockCommitted: trackedLock, limitation: 'Cloud download/hash verification is not assistant visual inspection. Artifact access follows repository permissions. Lockfile export requires review before commit.' };
  const verified = summary.upload === 'success' && summary.download === 'success' && screenshots.length > 0 && screenshots.every(s => s.restoredAndHashVerified) && lockRestored;
  summary.assetRoundTripVerified = verified;
  console.log(JSON.stringify(summary, null, 2));
  if (process.env.GITHUB_EVENT_NAME === 'issues') {
    const event = JSON.parse(fs.readFileSync(process.env.GITHUB_EVENT_PATH, 'utf8'));
    if (process.env.GITHUB_REPOSITORY !== 'josiahdavegilbert-alt/cypress-lab-cloud' || event.sender?.login !== 'josiahdavegilbert-alt' || event.issue?.user?.login !== 'josiahdavegilbert-alt' || event.issue?.title !== '[Cypress] Run acceptance') throw new Error('Unauthorized report target');
    const encoded = zlib.gzipSync(lock).toString('base64');
    const exportText = trackedLock ? 'Lockfile already tracked; no export needed.' : encoded.length <= 40000 ? ['Generated lockfile for review only (gzip + base64):', '```text', encoded, '```'].join('\n') : 'Lockfile export exceeds comment limit; retrieve the lockfile from the artifact.';
    const body = ['Acceptance asset report', '```json', JSON.stringify(summary, null, 2), '```', '', exportText].join('\n');
    const response = await fetch(`https://api.github.com/repos/josiahdavegilbert-alt/cypress-lab-cloud/issues/${event.issue.number}/comments`, { method: 'POST', signal: AbortSignal.timeout(15000), headers: { Authorization: `Bearer ${process.env.GH_TOKEN}`, Accept: 'application/vnd.github+json', 'Content-Type': 'application/json', 'X-GitHub-Api-Version': '2022-11-28' }, body: JSON.stringify({ body }) });
    if (!response.ok) throw new Error(`Asset report HTTP ${response.status}`);
  }
  if (!verified) process.exitCode = 1;
}
function spawnTrackedLock() {
  try { execFileSync('git', ['ls-files', '--error-unmatch', 'package-lock.json'], { stdio: 'pipe' }); return true; } catch { return false; }
}
main().catch(error => { console.error(error.message); process.exitCode = 1; });
