'use strict';
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const {execFileSync} = require('node:child_process');
const COUNTERS = ['loginAttempts', 'logins', 'validations', 'denied', 'clueReads', 'uploads', 'downloads'];
const EXPECTED = {
  anonymous_access: {denied: 1},
  login_session_restore: {loginAttempts: 1, logins: 1, validations: 2, clueReads: 1},
  session_recovery: {loginAttempts: 2, logins: 2, validations: 3, denied: 1},
  state_isolation: {denied: 1}, bounded_dom_evidence: {},
  upload_download: {loginAttempts: 1, logins: 1, validations: 1, uploads: 1, downloads: 1},
  error_recovery: {loginAttempts: 1, logins: 1, validations: 1, clueReads: 1}
};
const CHECKS = Object.keys(EXPECTED);
const digest = value => crypto.createHash('sha256').update(value).digest('hex');
function demand(condition, message) { if (!condition) throw new Error(message); }
function sameKeys(value, keys) {
  return value !== null && typeof value === 'object' && !Array.isArray(value) && Object.keys(value).sort().join('|') === [...keys].sort().join('|');
}
function verifyReadiness(root, identity, lockHash) {
  demand(identity && /^[a-f0-9]{40}$/.test(identity.commit) && /^[1-9][0-9]*$/.test(identity.runId) && /^[1-9][0-9]*$/.test(identity.attempt), 'Invalid expected identity');
  demand(/^[a-f0-9]{64}$/.test(lockHash), 'Invalid expected lock hash');
  const absolute = path.resolve(root);
  demand(fs.realpathSync(absolute) === absolute && fs.statSync(absolute).isDirectory(), 'Artifact root must be a real directory');
  function read(name, limit) {
    demand(typeof name === 'string' && /^(manifest\.json|result\.json|evidence-[12]\.jsonl|pass-[12]-[0-9]+\.png)$/.test(name), 'Unexpected evidence filename');
    const file = path.join(absolute, name); const stat = fs.lstatSync(file);
    demand(stat.isFile() && !stat.isSymbolicLink() && stat.size <= limit, 'Invalid or oversized evidence file');
    return fs.readFileSync(file);
  }
  function checkIdentity(value) {
    for (const key of ['commit', 'runId', 'attempt']) demand(value[key] === identity[key], 'Evidence identity mismatch');
  }
  const manifest = JSON.parse(read('manifest.json', 32768)); checkIdentity(manifest);
  demand(Array.isArray(manifest.files) && manifest.files.length >= 7 && manifest.files.length <= 30, 'Invalid manifest count');
  const files = new Map(); let total = 0;
  for (const entry of manifest.files) {
    demand(sameKeys(entry, ['path', 'bytes', 'sha256']) && entry.path !== 'manifest.json' && !files.has(entry.path), 'Invalid or duplicate manifest entry');
    demand(Number.isSafeInteger(entry.bytes) && entry.bytes >= 0 && /^[a-f0-9]{64}$/.test(entry.sha256), 'Invalid manifest metadata');
    const limit = entry.path === 'result.json' ? 524288 : entry.path?.endsWith('.jsonl') ? 131072 : 4 * 1024 * 1024;
    const bytes = read(entry.path, limit); total += bytes.length;
    demand(total <= 10 * 1024 * 1024, 'Artifact size limit exceeded');
    demand(bytes.length === entry.bytes && digest(bytes) === entry.sha256, 'Evidence integrity mismatch');
    files.set(entry.path, bytes);
  }
  const actual = fs.readdirSync(absolute).sort();
  demand(actual.join('|') === [...files.keys(), 'manifest.json'].sort().join('|'), 'Unlisted or missing artifact content');
  demand(['result.json', 'evidence-1.jsonl', 'evidence-2.jsonl'].every(name => files.has(name)), 'Missing required evidence');
  const report = JSON.parse(files.get('result.json')); checkIdentity(report);
  demand(report.verified === true && report.lockBefore === lockHash && report.lockAfter === lockHash, 'Report or lock gate failed');
  demand(Number.isFinite(Date.parse(report.started)) && Number.isFinite(Date.parse(report.finished)) && Date.parse(report.finished) >= Date.parse(report.started), 'Invalid report timestamps');
  demand(Array.isArray(report.repetitions) && report.repetitions.length === 2, 'Two repetitions required');
  const screenshotFiles = new Set();
  for (let index = 0; index < 2; index++) {
    const pass = report.repetitions[index];
    demand(pass.iteration === index + 1 && pass.verified === true && pass.browser === 'chrome' && pass.tests === 7 && pass.passed === 7 && pass.failed === 0, 'Incomplete or mismatched Chrome repetition');
    demand(typeof pass.browserVersion === 'string' && /^\d+\.\d+/.test(pass.browserVersion) && typeof pass.cypressVersion === 'string' && /^\d+\.\d+/.test(pass.cypressVersion), 'Missing browser or Cypress version');
    demand(sameKeys(pass.checks, CHECKS) && CHECKS.every(id => pass.checks[id] === true) && pass.screenshotsOK === true, 'Missing check verdicts');
    const lines = files.get(`evidence-${index + 1}.jsonl`).toString('utf8').trim().split('\n').filter(Boolean);
    demand(lines.length === 7, 'Seven evidence entries required');
    const ids = new Set();
    for (const line of lines) {
      const entry = JSON.parse(line);
      demand(sameKeys(entry, ['id', 'counters']) && Object.hasOwn(EXPECTED, entry.id) && !ids.has(entry.id), 'Unknown or duplicate evidence check');
      ids.add(entry.id);
      demand(sameKeys(entry.counters, COUNTERS) && COUNTERS.every(key => entry.counters[key] === (EXPECTED[entry.id][key] || 0)), 'Backend counter mismatch');
    }
    demand(Array.isArray(pass.screenshots) && pass.screenshots.length >= 2 && pass.screenshots.length <= 10, 'Missing screenshot records');
    for (const shot of pass.screenshots) {
      demand(sameKeys(shot, ['name', 'file', 'bytes', 'sha256', 'validPNG']) && typeof shot.name === 'string' && shot.name.length <= 256 && new RegExp(`^pass-${index + 1}-[0-9]+\\.png$`).test(shot.file) && !screenshotFiles.has(shot.file), 'Invalid or reused screenshot record');
      const bytes = files.get(shot.file);
      demand(bytes && shot.bytes === bytes.length && shot.sha256 === digest(bytes), 'Screenshot not covered by manifest');
      demand(shot.validPNG === true && bytes.length > 8 && bytes.subarray(0, 8).equals(Buffer.from('89504e470d0a1a0a', 'hex')), 'Invalid PNG signature');
      screenshotFiles.add(shot.file);
    }
    demand(['rehearsal-dom', 'rehearsal-files'].every(label => pass.screenshots.filter(shot => shot.name.includes(label)).length === 1), 'Missing or duplicate required screenshots');
  }
  demand([...files.keys()].filter(name => name.endsWith('.png')).every(name => screenshotFiles.has(name)), 'Unreferenced screenshot');
  return {gate: 'controlled-rehearsal-evidence', verified: true, ...identity, repetitions: 2, checksPerRepetition: 7, files: files.size, bytes: total, competitionReady: false};
}
if (require.main === module) {
  try {
    demand(process.argv.length === 3, 'Usage: node scripts/rehearsal-readiness.cjs <downloaded-rehearsal-output>');
    const identity = {commit: execFileSync('git', ['rev-parse', 'HEAD'], {encoding: 'utf8'}).trim(), runId: process.env.GITHUB_RUN_ID, attempt: process.env.GITHUB_RUN_ATTEMPT};
    execFileSync('git', ['ls-files', '--error-unmatch', 'package-lock.json'], {stdio: 'pipe'});
    console.log(JSON.stringify(verifyReadiness(process.argv[2], identity, digest(fs.readFileSync('package-lock.json')))));
  } catch { console.error('Controlled rehearsal evidence gate failed; no readiness claim.'); process.exitCode = 1; }
}
module.exports = {verifyReadiness, digest, CHECKS, COUNTERS, EXPECTED};
