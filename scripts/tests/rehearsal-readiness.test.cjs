'use strict';
const {test} = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const zlib = require('node:zlib');
const {verifyReadiness, digest, CHECKS, COUNTERS, EXPECTED} = require('../rehearsal-readiness.cjs');
function crc32(bytes) {
  let crc = 0xffffffff;
  for (const byte of bytes) { crc ^= byte; for (let i = 0; i < 8; i++) crc = (crc >>> 1) ^ ((crc & 1) ? 0xedb88320 : 0); }
  return (crc ^ 0xffffffff) >>> 0;
}
function chunk(type, data) {
  const label = Buffer.from(type); const out = Buffer.alloc(data.length + 12);
  out.writeUInt32BE(data.length); label.copy(out, 4); data.copy(out, 8); out.writeUInt32BE(crc32(Buffer.concat([label, data])), out.length - 4); return out;
}
function unitPNG() {
  const header = Buffer.alloc(13); header.writeUInt32BE(1); header.writeUInt32BE(1, 4); header[8] = 8; header[9] = 6;
  return Buffer.concat([Buffer.from('89504e470d0a1a0a', 'hex'), chunk('IHDR', header), chunk('IDAT', zlib.deflateSync(Buffer.from([0, 0, 0, 0, 255]))), chunk('IEND', Buffer.alloc(0))]);
}
function fixture(run) {
  const root = fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), 'readiness-policy-')));
  const identity = {commit: 'a'.repeat(40), runId: '123', attempt: '1'}; const lock = digest(Buffer.from('unit-lock'));
  const report = {...identity, verified: true, lockBefore: lock, lockAfter: lock, started: '2026-10-22T01:00:00.000Z', finished: '2026-10-22T01:01:00.000Z', repetitions: []};
  const write = (name, value) => fs.writeFileSync(path.join(root, name), value);
  for (const iteration of [1, 2]) {
    write(`evidence-${iteration}.jsonl`, CHECKS.map(id => JSON.stringify({id, counters: Object.fromEntries(COUNTERS.map(key => [key, EXPECTED[id][key] || 0]))})).join('\n') + '\n');
    const screenshots = ['rehearsal-dom.png', 'rehearsal-files.png'].map((name, index) => {
      const file = `pass-${iteration}-${index}.png`; const bytes = unitPNG(); write(file, bytes);
      return {name, file, bytes: bytes.length, sha256: digest(bytes), validPNG: true};
    });
    report.repetitions.push({iteration, verified: true, browser: 'chrome', browserVersion: '123.0.0.0', cypressVersion: '15.0.0', tests: 7, passed: 7, failed: 0, checks: Object.fromEntries(CHECKS.map(id => [id, true])), screenshotsOK: true, screenshots});
  }
  function seal() {
    write('result.json', JSON.stringify(report));
    const files = fs.readdirSync(root).filter(name => name !== 'manifest.json').map(name => { const bytes = fs.readFileSync(path.join(root, name)); return {path: name, bytes: bytes.length, sha256: digest(bytes)}; });
    write('manifest.json', JSON.stringify({...identity, files}));
  }
  function editEvidence(iteration, edit) {
    const name = `evidence-${iteration}.jsonl`; const entries = fs.readFileSync(path.join(root, name), 'utf8').trim().split('\n').map(JSON.parse);
    edit(entries); write(name, entries.map(value => JSON.stringify(value)).join('\n') + '\n');
  }
  seal();
  try { run({root, identity, lock, report, write, seal, editEvidence}); } finally { fs.rmSync(root, {recursive: true, force: true}); }
}
test('synthetic unit fixture passes evidence gate but never claims competition readiness', () => fixture(({root, identity, lock}) => {
  const result = verifyReadiness(root, identity, lock); assert.equal(result.verified, true); assert.equal(result.competitionReady, false); assert.equal(result.files, 7);
}));
for (const [name, mutate] of [
  ['fabricated success with wrong counters', x => x.editEvidence(1, entries => { entries[0].counters.logins++; })],
  ['duplicate evidence', x => x.editEvidence(1, entries => { entries[1] = entries[0]; })],
  ['unknown evidence check', x => x.editEvidence(1, entries => { entries[0].id = 'unknown'; })],
  ['extra sensitive evidence field', x => x.editEvidence(1, entries => { entries[0].cookie = 'unit-only'; })],
  ['missing evidence entry', x => x.editEvidence(2, entries => entries.pop())],
  ['wrong counter type', x => x.editEvidence(2, entries => { entries[0].counters.denied = '1'; })],
  ['extra counter', x => x.editEvidence(1, entries => { entries[0].counters.other = 0; })],
  ['duplicate repetition', x => { x.report.repetitions[1].iteration = 1; }],
  ['reordered repetitions', x => x.report.repetitions.reverse()],
  ['unverified repetition', x => { x.report.repetitions[1].verified = false; }],
  ['wrong browser', x => { x.report.repetitions[0].browser = 'electron'; }],
  ['missing versions', x => { delete x.report.repetitions[0].browserVersion; }],
  ['wrong totals', x => { x.report.repetitions[0].passed = 6; }],
  ['missing check flag', x => { delete x.report.repetitions[1].checks.anonymous_access; }],
  ['false check flag', x => { x.report.repetitions[1].checks.anonymous_access = false; }],
  ['changed lock', x => { x.report.lockAfter = 'b'.repeat(64); }],
  ['invalid timestamps', x => { x.report.finished = 'not-a-date'; }],
  ['backward timestamps', x => { x.report.finished = '2026-10-21T01:00:00.000Z'; }],
  ['reused screenshot', x => { x.report.repetitions[1].screenshots[0] = x.report.repetitions[0].screenshots[0]; }],
  ['missing DOM screenshot', x => { x.report.repetitions[0].screenshots[0].name = 'other.png'; }],
  ['screenshot omitted from manifest', x => { fs.unlinkSync(path.join(x.root, 'pass-1-0.png')); }],
  ['mismatched screenshot hash', x => { x.report.repetitions[0].screenshots[0].sha256 = 'b'.repeat(64); }],
  ['invalid PNG signature despite refreshed hashes', x => {
    const bytes = Buffer.from('not an image'); x.write('pass-1-0.png', bytes);
    Object.assign(x.report.repetitions[0].screenshots[0], {bytes: bytes.length, sha256: digest(bytes)});
  }],
  ['unreferenced image', x => x.write('pass-1-9.png', unitPNG())],
  ['unapproved artifact file', x => x.write('secrets.txt', 'unit-only')]
]) test(`synthetic policy rejects ${name} even with freshly recalculated manifest hashes`, () => fixture(x => { mutate(x); x.seal(); assert.throws(() => verifyReadiness(x.root, x.identity, x.lock)); }));
for (const key of ['commit', 'runId', 'attempt']) test(`rejects stale ${key}`, () => fixture(x => {
  const other = key === 'commit' ? 'b'.repeat(40) : '2'; assert.throws(() => verifyReadiness(x.root, {...x.identity, [key]: other}, x.lock), /identity/);
}));
test('rejects corrupted bytes without recomputed manifest', () => fixture(x => { fs.appendFileSync(path.join(x.root, 'evidence-1.jsonl'), 'x'); assert.throws(() => verifyReadiness(x.root, x.identity, x.lock), /integrity/); }));
test('rejects symlink evidence', () => fixture(x => { fs.unlinkSync(path.join(x.root, 'pass-1-0.png')); fs.symlinkSync('pass-1-1.png', path.join(x.root, 'pass-1-0.png')); assert.throws(() => verifyReadiness(x.root, x.identity, x.lock), /Invalid/); }));
test('rejects symlink root', () => fixture(x => {
  const alias = `${x.root}-alias`; fs.symlinkSync(x.root, alias); try { assert.throws(() => verifyReadiness(alias, x.identity, x.lock), /real directory/); } finally { fs.unlinkSync(alias); }
}));
test('rejects unlisted extras', () => fixture(x => { x.write('extra.txt', 'unit-only'); assert.throws(() => verifyReadiness(x.root, x.identity, x.lock), /Unlisted/); }));
test('rejects traversal manifest', () => fixture(x => {
  const file = path.join(x.root, 'manifest.json'); const value = JSON.parse(fs.readFileSync(file)); value.files[0].path = '../escape'; fs.writeFileSync(file, JSON.stringify(value)); assert.throws(() => verifyReadiness(x.root, x.identity, x.lock), /filename/);
}));
test('rejects duplicate manifest entries', () => fixture(x => {
  const file = path.join(x.root, 'manifest.json'); const value = JSON.parse(fs.readFileSync(file)); value.files.push(value.files[0]); fs.writeFileSync(file, JSON.stringify(value)); assert.throws(() => verifyReadiness(x.root, x.identity, x.lock), /duplicate/);
}));
test('rejects oversized file before reading it', () => fixture(x => { fs.truncateSync(path.join(x.root, 'evidence-1.jsonl'), 131073); assert.throws(() => verifyReadiness(x.root, x.identity, x.lock), /oversized/); }));
test('rejects missing GitHub identity', () => fixture(x => assert.throws(() => verifyReadiness(x.root, {...x.identity, runId: undefined}, x.lock), /identity/)));
test('rejects invalid expected lock hash', () => fixture(x => assert.throws(() => verifyReadiness(x.root, x.identity, 'bad'), /lock hash/)));
