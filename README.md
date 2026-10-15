# Cypress cloud lab

Private, on-demand Cypress tests on GitHub-hosted Linux runners. No laptop or local tunnel is required for these jobs. This is not an always-on browser, VM, or MCP endpoint.

## Before the first run
Verify the account's current GitHub Actions allowance and billing controls. Configure paid usage to be blocked before running jobs. A private repository consumes included runner minutes and storage; this workflow alone cannot guarantee zero charges.

## Run
Open Actions, select Cypress manual smoke test, and choose Run workflow on main. The workflow has no push or scheduled trigger. It uses a standard Ubuntu runner, a ten-minute job timeout, one concurrency group, no test retries, and one-day retention for failure screenshots. Read results in the run logs.

## Contents and validation
Cypress is pinned to 16.2.0. The smoke spec is a reconstruction of the demonstrated example-page workflow with an added heading assertion, not a retrieved copy of the local file. No test execution is claimed by this commit. Dependencies are installed using npm install because a validated package-lock.json has not yet been generated. Add a reviewed lockfile and switch to npm ci after validation. Third-party actions use major release tags, not immutable commit pins.

## Migration boundaries
No local files were deleted. Do not upload .bridge-token, passwords, .env files, cypress.env.json, browser profiles, node_modules, or binary caches. Gitignore patterns do not remove secrets already tracked. Inspect any additional local specs and configuration before transferring them. The Windows read-only bridge remains local and is not deployed by this repository.

## Assistant integration
The currently discovered GitHub connector supports repository file operations but does not expose Actions workflow dispatch or run-log tools. Manual dispatch works independently of the laptop; direct assistant dispatch and result retrieval require another supported authenticated integration. Never use repository commits as a hidden substitute for approved workflow dispatch.

Only test authorized targets. Private VPN-only challenges require separately approved network connectivity. Do not publish challenge data or credentials.
