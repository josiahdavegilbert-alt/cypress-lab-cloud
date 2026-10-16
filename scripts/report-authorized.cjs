const fs = require('node:fs');
const { execFileSync } = require('node:child_process');
async function main() {
  const event = JSON.parse(fs.readFileSync(process.env.GITHUB_EVENT_PATH, 'utf8'));
  if (process.env.GITHUB_REPOSITORY !== 'josiahdavegilbert-alt/cypress-lab-cloud' || event.sender?.login !== 'josiahdavegilbert-alt' || event.issue?.user?.login !== 'josiahdavegilbert-alt' || event.issue?.title !== '[Cypress] Check authorized homepage') throw new Error('Unauthorized report target');
  const commit = execFileSync('git', ['rev-parse', 'HEAD'], { encoding: 'utf8' }).trim();
  const body = ['Authorized homepage compatibility report', `Commit: ${commit}`, `Run: ${process.env.GITHUB_SERVER_URL}/${process.env.GITHUB_REPOSITORY}/actions/runs/${process.env.GITHUB_RUN_ID}`, `Attempt: ${process.env.GITHUB_RUN_ATTEMPT}`, `Install: ${process.env.INSTALL_OUTCOME}`, `Homepage test: ${process.env.TEST_OUTCOME}`, '', 'Scope: supplied homepage load and normal page resources only; no clicks, form submissions, crawling, scanning or challenge attempts. Screenshots and video disabled. No page text, response bodies, cookies or headers are posted. A passing result establishes only the homepage assertions, not complete challenge compatibility. If failure, inspect access-controlled run logs; no detailed private-site diagnostics are copied here.'].join('\n');
  const response = await fetch(`https://api.github.com/repos/josiahdavegilbert-alt/cypress-lab-cloud/issues/${event.issue.number}/comments`, { method: 'POST', signal: AbortSignal.timeout(15000), headers: { Authorization: `Bearer ${process.env.GH_TOKEN}`, Accept: 'application/vnd.github+json', 'Content-Type': 'application/json', 'X-GitHub-Api-Version': '2022-11-28' }, body: JSON.stringify({ body }) });
  if (!response.ok) throw new Error(`Report HTTP ${response.status}`);
}
main().catch(error => { console.error(error.message); process.exitCode = 1; });
