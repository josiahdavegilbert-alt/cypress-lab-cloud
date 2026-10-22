const {test} = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const {hash, verifyArtifact} = require('../rehearsal-artifact.cjs');
function synthetic(run) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'rehearsal-unit-'));
  const identity = {commit: 'unit-commit', runId: 'unit-run', attempt: '1'}; const lock = hash(Buffer.from('unit-lock'));
  const report = {...identity, verified: true, lockBefore: lock, lockAfter: lock, repetitions: [{verified: true}, {verified: true}]};
  fs.writeFileSync(path.join(root, 'result.json'), JSON.stringify(report));
  for (const name of ['evidence-1.jsonl', 'evidence-2.jsonl']) fs.writeFileSync(path.join(root, name), 'unit evidence\n');
  for (const name of ['one.png', 'two.png', 'three.png', 'four.png']) fs.writeFileSync(path.join(root, name), Buffer.from('89504e470d0a1a0a01', 'hex'));
  const manifest = {...identity, files: fs.readdirSync(root).map(file => { const data = fs.readFileSync(path.join(root, file)); return {path: file, bytes: data.length, sha256: hash(data)}; })};
  fs.writeFileSync(path.join(root, 'manifest.json'), JSON.stringify(manifest));
  try { run({root, identity, lock, manifest}); } finally { fs.rmSync(root, {recursive: true, force: true}); }
}
test('artifact verifier accepts matching synthetic unit fixture only', () => synthetic(({root, identity, lock}) => assert.equal(verifyArtifact(root, identity, lock).verified, true)));
for (const key of ['commit', 'runId', 'attempt']) test(`artifact verifier rejects stale ${key}`, () => synthetic(({root, identity, lock}) => assert.throws(() => verifyArtifact(root, {...identity, [key]: 'other'}, lock), /identity/)));
test('artifact verifier rejects mismatched lockfile', () => synthetic(({root, identity}) => assert.throws(() => verifyArtifact(root, identity, 'other'), /Lockfile/)));
test('artifact verifier rejects corruption', () => synthetic(({root, identity, lock}) => { fs.appendFileSync(path.join(root, 'one.png'), 'x'); assert.throws(() => verifyArtifact(root, identity, lock), /hash mismatch/); }));
test('artifact verifier rejects symlink', () => synthetic(({root, identity, lock}) => { fs.unlinkSync(path.join(root, 'one.png')); fs.symlinkSync('two.png', path.join(root, 'one.png')); assert.throws(() => verifyArtifact(root, identity, lock), /symlink/); }));
test('artifact verifier rejects duplicate entries', () => synthetic(({root, identity, lock, manifest}) => { manifest.files.push(manifest.files[0]); fs.writeFileSync(path.join(root, 'manifest.json'), JSON.stringify(manifest)); assert.throws(() => verifyArtifact(root, identity, lock), /Duplicate/); }));
test('artifact verifier rejects path escape', () => synthetic(({root, identity, lock, manifest}) => { manifest.files[0].path = '../outside'; fs.writeFileSync(path.join(root, 'manifest.json'), JSON.stringify(manifest)); assert.throws(() => verifyArtifact(root, identity, lock), /Unsafe/); }));
