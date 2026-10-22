# Independent rehearsal evidence gate

## Why this increment exists

The first rehearsal artifact verifier checks transfer hashes, run identity and reported success booleans. It does not independently recompute the seven backend counter verdicts from downloaded JSONL, require distinct iteration numbers, or bind every required screenshot record to its manifest entry. That verifier remains unchanged for reviewability. The new additive gate rejects these inconsistent evidence cases even if all manifest hashes are recalculated to match them.

`scripts/rehearsal-readiness.cjs` independently checks the exact seven controlled evidence entries in each of two repetitions, exact backend counter keys and values, distinct iteration order, Chrome/version metadata, passing totals, every named check verdict, required DOM/file screenshots, screenshot metadata and PNG signatures, exact file inventory, bounded size, expected lockfile hash, commit, run ID and run attempt. Unexpected paths, symlink roots/files, missing or unlisted files and duplicate records fail closed. Only the controlled evidence schema is accepted. A PNG signature is a format sanity check, not full image decoding or visual proof of a browser action.

The counter expectations are deliberately fixed in this independent gate. Any intentional fixture change requires reviewing and updating both policies. Self-generated manifests prove content consistency, not authenticity against a malicious runner, modified branch code, or compromised dependencies. The workflow/commit and GitHub artifact association remain part of the trust boundary. Offline policy fixtures are explicitly synthetic and are not browser execution evidence.

## Local validation actually performed

On 2026-10-21 in the development sandbox, Node v20.20.1:

- `node --test scripts/tests/rehearsal-readiness.test.cjs`: 38 tests passed, zero failed.
- Syntax checks on the two new CommonJS files: passed.
- Workflow YAML parsing and checks of manual-only trigger, pinned Actions, owner/re-run owner/repository guards, read-only token, ten-minute limit and evidence verification before and after transfer: passed.

The tests include fabricated success flags with wrong counters, duplicate/missing/unknown check entries, extra sensitive evidence fields, stale identity, altered lockfile, wrong browser/totals, missing versions/checks/screenshots, duplicate iterations, corrupt bytes, rehashed inconsistent metadata, symlinks, path traversal, oversized files and unlisted contents. The generated one-pixel PNGs and synthetic results exist only in temporary unit fixtures. No real screenshots, Chrome execution, GitHub workflow runs, downloaded GitHub artifacts or competition success are claimed. The full combined repository test suite was not rerun in this sandbox for this increment.

## Manual workflow

The additional `Controlled readiness evidence` workflow reuses the existing fixed rehearsal runner and npm-ci installer without changing any prior file. It has manual dispatch only, no inputs, and requires both initial and re-run actors to be the owner in this exact repository. It runs repository unit tests, hashes the committed lockfile, installs locked dependencies, runs the seven Chrome checks twice without retries, evaluates source evidence, uploads controlled evidence with seven-day retention, downloads the same run/attempt artifact and repeats the independent evidence check. The final step also verifies the lockfile against its pre-install hash. Successful rehearsal alone cannot override a failed evidence gate.

This workflow is not dispatched by committing the file. It cannot be treated as exercised merely because it parses or the draft PR is clean. The repository token is read-only; checkout credentials are not persisted. The workload uses the existing standard hosted runner, not a paid service integration. A real Actions run may consume the account's included quota or incur charges depending on existing account policy; spending limits were not inspected or changed. Private evidence assumes this repository remains private and access is restricted. No real target, credentials, flags, arbitrary spec, shell or URL input is introduced. Dependency downloads are not loopback traffic; the fixed application exercise itself uses the loopback fixture.

## Activation boundary

The previous approval prohibited merge, run dispatch and automatic PR/push/issue triggers. This additive branch-only increment keeps those boundaries. GitHub's manual-dispatch workflow must exist on the default branch before it can be activated normally. Therefore do not promise a branch run can simply be requested with another smoke issue or that the draft is competition-ready.

Two separately approved paths are possible:

1. Review and explicitly approve an unverified merge to main, then manually run `Controlled readiness evidence` against the resulting exact main commit. This changes main and consumes Actions usage; neither action is performed by this increment.
2. Explicitly approve a narrowly scoped temporary validation trigger that checks out only reviewed code with a read-only token and no secrets, then remove it after recording results. This changes the earlier no-automatic-trigger policy; no such trigger is added here.

Available GitHub connector tools at implementation time expose repository/PR operations, not a dedicated Actions workflow-dispatch or Actions-artifact-download operation. The operator may need the GitHub Actions UI or their authenticated CLI for activation and private artifact retrieval. Do not request credentials in chat, simulate a dispatch, or treat an issue being opened as this workflow running.

## Actual next acceptance

Before labeling this rehearsal verified, record exact commit, workflow run ID, run attempt, both seven-pass Chrome results with zero retries, unchanged lockfile and a successful final downloaded-evidence gate. Failed, skipped, queued, canceled, timed-out and missing results are not passes. Keep the separate expanded capabilities suite, including its deliberate failure diagnostics, as a distinct pending acceptance gate.

Passing this gate still does not certify competition readiness. A reviewed target scope/limits adapter, an approved representative multi-step challenge exercise, operational recovery checks, event-rule compliance, and authenticated connector request/status/evidence integration remain separate requirements. No target access or connector deployment occurs in this increment.
