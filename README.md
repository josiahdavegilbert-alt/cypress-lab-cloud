# Cyber info — Cypress cloud lab

Private on-demand browser tests for authorized CTF preparation and web projects. GitHub-hosted runners do not need the laptop, Windows bridge, or local tunnel. This is not a permanent browser or MCP web server.

## Approved assistant execution path
Open a new issue in this repository using the connected personal account with the exact title `[Cypress] Run smoke`. Creating that issue intentionally starts a cloud test and must receive explicit action confirmation. No URL, shell command, or spec path is accepted from issue content. The fixed smoke spec visits the public Cypress example page. Only the owner actor and owner-authored request are allowed. Edits, comments, pushes and schedules do not start tests. Manual workflow dispatch remains available to the owner.

After completion, the workflow posts the install/test step outcomes, run link, attempt and checked-out commit as an issue comment. The assistant can read the request issue and comments using the existing GitHub connector. Match the run and attempt; never treat old comments or missing reports as new success. Job setup failures, cancellation or timeout can prevent a report; inspect the Actions page in those cases. Issue-based reporting gives a summary, not direct full log or screenshot retrieval.

## Limits and costs
Keep the account Actions budget at $0 with usage blocking. No paid runner is configured. Jobs use Ubuntu 24.04, Node 22.23.3, pinned action commits, Cypress 16.2.0, Chrome, a ten-minute timeout and a single concurrency group. Each execution consumes included usage. Budget controls can block execution; never raise them to make a job run. No claim of unlimited free usage or guaranteed uptime is made. Do not leave tests running to host a server.

## Validation and reproducibility
The earlier Electron/manual workflow passed. The Chrome/issue-triggered replacement is untested until run. Cypress is pinned but transitive dependencies are not yet locked. A reviewed package-lock.json and npm ci are still needed for full dependency reproducibility. No lockfile was invented. No full local-file migration is claimed.

## Security and scope
Issue text is untrusted data, never executable code. No credentials are supplied to the test step as environment variables. GITHUB_TOKEN is explicitly passed only to the report step and checkout credentials are not persisted. Repository workflows and code must still be reviewed because they execute with repository-level job permissions. The fixed public example is the only current target. Add future authorized challenge specs through reviewed and confirmed commits; do not accept arbitrary remote URLs, commands, or code in issue requests. Avoid publishing private artifacts or secrets in logs/comments. Do not upload .bridge-token, .env, cypress.env.json, node_modules, browser profiles or caches.

## Remaining work
Validate Chrome execution and issue reporting, then add a reviewed lockfile and category-appropriate authorized tests. The old laptop connector remains separate; it can be stopped or removed independently after this path is validated. No direct Actions dispatch/log tools are claimed.
