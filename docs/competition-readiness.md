# Competition-readiness gates

## Honest current status

A passing smoke test establishes a browser-testing foundation, not competition readiness. PR #14 adds broader controlled capabilities but its previous head had zero reported check runs at inspection. Historical runs on main cannot validate new branch code, a deployed connector, or a different competition target.

This increment adds a real loopback-only rehearsal implementation. Do not call it browser-verified until the exact new commit's workflow and evidence round trip pass. Unit-test fixtures are explicitly synthetic verdict inputs and are never reported as browser results.

## Implemented rehearsal

Seven named checks run twice in separate Cypress runs, Chrome only, retries disabled:

1. Anonymous requests are denied.
2. Browser form login, session restoration, real API response and UI assertion; backend counters prove login was not repeated.
3. Server-side session expiry triggers validated session recreation; exact counter expectations detect missing validation.
4. Browser state is isolated from the preceding test.
5. A controlled hidden DOM clue is inspected and revealed, with a screenshot.
6. A fixed harmless file is uploaded and downloaded with exact byte comparison and screenshot evidence.
7. A simulated temporary API error recovers to a genuine backend response, without arbitrary sleeps.

Every test records a fixed check ID and allowlisted counters only. No raw cookies, full DOM, arbitrary response bodies, credentials or real flags enter the structured report. The practice session is ephemeral and not a real account. Screenshot contents are controlled fixture data, not an external website.

## Execution and evidence

`Controlled competition rehearsal` supports owner-only manual dispatch, preserving the existing manual-only policy. It has no push/PR/issue/schedule trigger, live CTF target, arbitrary input, paid runner, external target command, workflow write or billing change. Committing these files does not intentionally dispatch tests. Running Actions can consume the account's included usage; confirm existing spending safeguards before activation. Their account configuration is not verified by repository code.

The workflow checks out the selected ref and records its exact commit, unit-tests first, uses the existing npm ci installer, verifies the committed lockfile before and after installation, runs seven checks twice, uploads bounded private evidence for seven days, downloads it again and validates run ID, attempt, commit, file hashes and lockfile hash. A Chrome result is not success if the download/hash check fails. A skipped, canceled, timed-out, missing or unrelated report is not success. Two successful repetitions are a regression gate, not a quantified reliability guarantee.

Local commands from a prepared authorized checkout:

```text
node --test scripts/tests/*.test.cjs
node scripts/install-diagnostics.cjs
node scripts/run-rehearsal.cjs
```

Use the GitHub workflow for the artifact round trip; the local runner is not a deployed connector. Installation uses registry/Cypress download infrastructure. Browser application requests in these fixed rehearsal specs use only the loopback fixture; this is not a network sandbox for arbitrary specs or compromised dependencies. No broad claim of enforced whole-machine egress isolation is made.

## Gates still required

| Gate | Completion evidence |
| --- | --- |
| Expanded capability acceptance | Actual fresh eight-pass/one-intentional-failure result for the separate capabilities suite, plus screenshot evidence and upload/download verification |
| Rehearsal regression | Exact workflow run and attempt, two seven-pass Chrome repetitions, unchanged lockfile, verified downloaded evidence |
| Safe authorized target adapter | Reviewed exact-origin/path/method scope, redirect and subresource rules, request/time/response limits, negative tests, and dry-run checks before contacting a target |
| Representative target exercise | Owner-approved multi-step workflow within the actual event's rules; no flag submission without approval |
| Connector deployment | Inspect the actual bridge code and settings, implement narrowly scoped request/status/evidence tools, authenticate, reject stale results and test end to end |
| Component testing | Supported framework/bundler, reviewed locked dependency change and actual mount test, if completing the earlier full Cypress capability request; not a prerequisite for remote website investigation |
| Recovery and operator use | Confirm failed/pending/canceled/blocked-budget handling and a short runbook for competition-time reruns and evidence retrieval |

Do not merge or label the project competition-ready solely because code was generated or a smoke test passed. Keep main and the existing connector unchanged until their separate validation and deployment approvals. The immediate next result to inspect is an explicitly approved real rehearsal run, not another smoke request issue.

## Activation approval

Do not merge, dispatch a run, or create a request issue just to activate this suite without approval. The workflow must first be available on the default branch for manual dispatch; merging unverified code solely to enable that first controlled run must be clearly described and approved as such. An alternative is a separately approved, narrowly scoped temporary PR trigger. No such trigger is added here.
