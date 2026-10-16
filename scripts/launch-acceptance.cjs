const fs = require('node:fs');
const { spawnSync, execFileSync } = require('node:child_process');
const output = 'acceptance-result.json';
if (fs.existsSync(output)) fs.unlinkSync(output);
const child = spawnSync(process.execPath, ['scripts/acceptance.cjs'], { encoding: 'utf8', timeout: 420000, maxBuffer: 4 * 1024 * 1024, env: process.env });
const consoleText = `${child.stdout || ''}\n${child.stderr || ''}`.replace(/\u001b\[[0-9;]*m/g, '');
process.stdout.write(consoleText);
if (!fs.existsSync(output)) {
  const summary = { verified: false, commit: execFileSync('git', ['rev-parse', 'HEAD'], { encoding: 'utf8' }).trim(), exitStatus: child.status, signal: child.signal, launcherError: child.error?.message || null, consoleTail: consoleText.slice(-10000), limitation: 'Synthetic fixture diagnostics only. An early process exit prevented normal acceptance results.' };
  fs.writeFileSync(output, JSON.stringify(summary, null, 2));
}
const result = JSON.parse(fs.readFileSync(output, 'utf8'));
process.exitCode = result.verified === true && child.status === 0 ? 0 : 1;
