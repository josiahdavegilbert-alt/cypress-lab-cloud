# Capability inventory

Status of this expansion: implementation proposed; actual Cypress execution pending. Node unit tests are not browser acceptance. The existing cloud smoke report is separately recorded in issue #13.

| Capability | What it means | Value for this project | Expansion evidence required |
| --- | --- | --- | --- |
| Browser interaction | Navigate, fill forms, assert UI | Repeat authorized multi-step workflows | `browser_interaction` passes on local fixture |
| Page inspection | Inspect DOM, title and attributes | Inspect dynamic content and retain relevant evidence | `page_inspection` plus screenshot |
| Network observation | `cy.intercept()` observes browser HTTP | Connect UI behavior to actual API exchange | `network_observation`, exact request/response assertions |
| Network simulation | Stub a response | Controlled error handling without hitting backend | `network_simulation`, 503 UI and server counter proof |
| Direct HTTP requests | `cy.request()` from Cypress Node process | Check APIs independently from UI | `direct_http`, response checks and no browser intercept |
| Component testing | Mount a source component in a real browser | Test our own reusable UI/challenge components | NOT implemented in this first increment; separate supported framework/bundler, locked dependencies and mount test needed |
| Controlled testing | Spies, stubs and clock/tick | Observe calls, replace behavior, control timers | `spy`, `stub`, `clock` all pass |

`cy.request()` is not observed or stubbed by `cy.intercept()`. Component testing requires component source; it does not extract remote components from an arbitrary website.

## Acceptance

Owner-only manual workflow: `Controlled Cypress capabilities`. It has no push, PR, issue or scheduled trigger. It checks out the selected workflow ref, uses npm ci via the existing diagnostic script, Chrome, pinned action commits, existing single-run concurrency and a ten-minute timeout. Main must contain the workflow before GitHub exposes manual dispatch in its UI. Do not merge merely to label it tested.

The controlled suite expects exactly eight passing tests and one deliberately failing diagnostic. The validator only succeeds when that named failure contains its intended assertion marker, both DOM and failure screenshots exist, eight distinct evidence markers match passed tests, exactly two real browser API calls occur, and one direct HTTP call occurs. A normal failure, missing screenshot or wrong backend count is not success. There are no external challenge targets or credentials in this suite.

Artifacts expire after seven days. Preserve run ID, attempt and checked-out commit. The workflow has no issue-report trigger yet; do not submit an invented issue title to start it. The existing `[Cypress] Run acceptance` title still runs the OLD acceptance workflow. Budget settings are unchanged; usage remains subject to existing account limits.

## Follow-on work

1. Execute the new browser acceptance suite and retain its actual report; repeat after any fix.
2. Add a minimal component and supported framework/bundler using reviewed exact dependency pins and an updated lockfile. Validate actual mount, rendering, interaction and unmount cleanup separately.
3. Add reviewed investigation helpers and representative login/session/DOM workflows, with redacted structured evidence and explicit target allowlisting. Do not treat this controlled suite as a general CTF investigation runner.
4. Add a fixed owner-only issue trigger for the new suite once merged and accepted, with bounded reports and run identity. Never accept issue text as shell, URLs, code or arbitrary spec paths.
5. Upgrade the connector according to `connector-upgrade.md`, validating each tool before advertising it.

Official references:
- https://docs.cypress.io/api/commands/intercept
- https://docs.cypress.io/api/commands/request
- https://docs.cypress.io/app/guides/stubs-spies-and-clocks
- https://docs.cypress.io/app/component-testing/get-started
