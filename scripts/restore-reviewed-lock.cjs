const fs = require('node:fs');
const crypto = require('node:crypto');
const zlib = require('node:zlib');
const EXPECTED = 'e323207b6f5b9df1dfdead00a58cbd91b0cd10cabfa28461189ccefc32fca2e8';
const hash = value => crypto.createHash('sha256').update(value).digest('hex');
async function main() {
  if (process.env.GITHUB_REPOSITORY !== 'josiahdavegilbert-alt/cypress-lab-cloud') throw new Error('Unexpected repository');
  let bytes;
  if (fs.existsSync('package-lock.json')) {
    bytes = fs.readFileSync('package-lock.json');
  } else {
    const response = await fetch('https://api.github.com/repos/josiahdavegilbert-alt/cypress-lab-cloud/issues/comments/6205690959', { signal: AbortSignal.timeout(20000), headers: { Authorization: `Bearer ${process.env.GH_TOKEN}`, Accept: 'application/vnd.github+json', 'X-GitHub-Api-Version': '2022-11-28' } });
    if (!response.ok) throw new Error(`Dependency snapshot HTTP ${response.status}`);
    const comment = await response.json();
    const match = String(comment.body).match(/Generated lockfile for review only \(gzip \+ base64\):\s*```text\s*([A-Za-z0-9+/=\s]+)```/);
    if (!match) throw new Error('Pinned dependency snapshot missing');
    bytes = zlib.gunzipSync(Buffer.from(match[1].replace(/\s/g, ''), 'base64'), { maxOutputLength: 2 * 1024 * 1024 });
  }
  if (hash(bytes) !== EXPECTED) throw new Error('Dependency snapshot SHA-256 mismatch; refusing unlocked fallback');
  const lock = JSON.parse(bytes.toString('utf8'));
  const manifest = JSON.parse(fs.readFileSync('package.json', 'utf8'));
  if (lock.lockfileVersion !== 3 || lock.name !== manifest.name || lock.version !== manifest.version || !lock.packages?.['']) throw new Error('Unexpected lockfile identity');
  if (manifest.devDependencies?.cypress !== '16.2.0' || lock.packages[''].devDependencies?.cypress !== '16.2.0' || lock.packages['node_modules/cypress']?.version !== '16.2.0') throw new Error('Unexpected Cypress version');
  for (const key of ['dependencies', 'devDependencies', 'optionalDependencies']) {
    const normalize = value => JSON.stringify(Object.entries(value || {}).sort(([a], [b]) => a.localeCompare(b)));
    if (normalize(manifest[key]) !== normalize(lock.packages[''][key])) throw new Error(`Manifest mismatch: ${key}`);
  }
  const packages = Object.entries(lock.packages).filter(([name]) => name !== '');
  for (const [name, metadata] of packages) {
    if (!name.startsWith('node_modules/') || metadata.link || !metadata.version || !metadata.resolved || !metadata.integrity) throw new Error(`Unexpected package metadata: ${name}`);
    const url = new URL(metadata.resolved);
    if (url.protocol !== 'https:' || url.hostname !== 'registry.npmjs.org' || url.port || url.username || url.password) throw new Error(`Unexpected package source: ${name}`);
    if (!/^sha512-[A-Za-z0-9+/]+={0,2}$/.test(metadata.integrity)) throw new Error(`Unexpected integrity metadata: ${name}`);
  }
  fs.writeFileSync('package-lock.json', bytes);
  console.log(JSON.stringify({ snapshotSha256: EXPECTED, packageCount: packages.length, cypress: '16.2.0', sourceMetadataValidated: true, limitation: 'Metadata validation is not a vulnerability audit. Snapshot restored from a hash-pinned GitHub comment until the full lockfile is committed.' }));
}
main().catch(error => { console.error(error.message); process.exitCode = 1; });
