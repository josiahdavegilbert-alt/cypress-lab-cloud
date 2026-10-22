const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const hash = buffer => crypto.createHash('sha256').update(buffer).digest('hex');
const validPNG = data => data.length > 8 && data.subarray(0, 8).equals(Buffer.from('89504e470d0a1a0a', 'hex'));
function safeFile(root, relative) {
  if (typeof relative !== 'string' || !/^[A-Za-z0-9_ .()/-]+$/.test(relative) || relative.includes('..') || path.isAbsolute(relative)) throw new Error('Unsafe evidence path');
  let file = path.resolve(root);
  for (const part of relative.split('/')) { file = path.join(file, part); if (fs.lstatSync(file).isSymbolicLink()) throw new Error('Evidence symlink rejected'); }
  if (!fs.statSync(file).isFile()) throw new Error('Evidence must be a file');
  return file;
}
function verifyArtifact(root, identity, lockHash) {
  const manifest = JSON.parse(fs.readFileSync(safeFile(root, 'manifest.json'), 'utf8'));
  for (const key of ['commit', 'runId', 'attempt']) if (!identity[key] || manifest[key] !== identity[key]) throw new Error('Stale or mismatched artifact identity');
  if (!Array.isArray(manifest.files) || manifest.files.length < 7 || manifest.files.length > 30) throw new Error('Unexpected evidence file count');
  const names = new Set(); let total = 0;
  for (const item of manifest.files) {
    if (names.has(item.path)) throw new Error('Duplicate evidence path'); names.add(item.path);
    const file = safeFile(root, item.path); const size = fs.statSync(file).size;
    total += size; if (total > 10 * 1024 * 1024) throw new Error('Evidence exceeds size limit');
    const data = fs.readFileSync(file);
    if (size !== item.bytes || hash(data) !== item.sha256) throw new Error('Evidence hash mismatch');
    if (item.path.endsWith('.png') && !validPNG(data)) throw new Error('Invalid screenshot signature');
  }
  if (!['result.json', 'evidence-1.jsonl', 'evidence-2.jsonl'].every(name => names.has(name))) throw new Error('Missing required evidence');
  const report = JSON.parse(fs.readFileSync(safeFile(root, 'result.json'), 'utf8'));
  if (report.verified !== true || report.repetitions?.length !== 2 || !report.repetitions.every(r => r.verified === true)) throw new Error('Rehearsal not verified');
  for (const key of ['commit', 'runId', 'attempt']) if (report[key] !== identity[key]) throw new Error('Mismatched report identity');
  if (!lockHash || report.lockBefore !== lockHash || report.lockAfter !== lockHash) throw new Error('Lockfile changed');
  return {verified: true, files: names.size, bytes: total, ...identity};
}
module.exports = {hash, validPNG, safeFile, verifyArtifact};
