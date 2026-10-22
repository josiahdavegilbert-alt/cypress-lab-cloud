const fs = require('node:fs');
const {execFileSync} = require('node:child_process');
const {hash, verifyArtifact} = require('./rehearsal-artifact.cjs');
const identity = {commit: execFileSync('git', ['rev-parse', 'HEAD'], {encoding: 'utf8'}).trim(), runId: process.env.GITHUB_RUN_ID, attempt: process.env.GITHUB_RUN_ATTEMPT};
console.log(JSON.stringify(verifyArtifact('.rehearsal-downloaded/rehearsal-output', identity, hash(fs.readFileSync('package-lock.json')))));
