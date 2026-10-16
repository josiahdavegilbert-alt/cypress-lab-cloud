const fs = require('node:fs');
(async () => {
  const event = JSON.parse(fs.readFileSync(process.env.GITHUB_EVENT_PATH, 'utf8'));
  if (event.sender?.login !== 'josiahdavegilbert-alt' || event.issue?.user?.login !== 'josiahdavegilbert-alt' || event.issue?.title !== '[Cypress] Run smoke') throw new Error('Request not authorized');
  const repository = process.env.GITHUB_REPOSITORY;
  if (repository !== 'josiahdavegilbert-alt/cypress-lab-cloud') throw new Error('Unexpected repository');
  const url = `${process.env.GITHUB_SERVER_URL}/${repository}/actions/runs/${process.env.GITHUB_RUN_ID}`;
  const body = ['Cypress cloud smoke report', '', `Run: ${url}`, `Attempt: ${process.env.GITHUB_RUN_ATTEMPT}`, `Commit checked out: ${require('node:child_process').execFileSync('git', ['rev-parse', 'HEAD'], { encoding: 'utf8' }).trim()}`, `Dependency installation: ${process.env.INSTALL_OUTCOME}`, `Chrome smoke test step: ${process.env.TEST_OUTCOME}`, '', 'Only success of the test step confirms this run passed. A missing report, failure, or skipped step is not a passing test. Detailed logs are available at the run URL.'].join('\n');
  const response = await fetch(`https://api.github.com/repos/${repository}/issues/${event.issue.number}/comments`, {
    method: 'POST', signal: AbortSignal.timeout(15000),
    headers: { Authorization: `Bearer ${process.env.GH_TOKEN}`, Accept: 'application/vnd.github+json', 'Content-Type': 'application/json', 'X-GitHub-Api-Version': '2022-11-28' },
    body: JSON.stringify({ body })
  });
  if (!response.ok) throw new Error(`GitHub report failed: HTTP ${response.status}`);
  console.log('Posted run outcome to request issue.');
})().catch(error => { console.error(error.message); process.exitCode = 1; });
