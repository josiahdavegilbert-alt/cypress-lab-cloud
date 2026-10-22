# Rehearsal validation ledger

## Development checks

2026-10-21, sandbox Node v20.20.1:

- `node --test scripts/tests/rehearsal-*.test.cjs`: 23 tests passed, zero failed. These are HTTP fixture integration tests and explicitly synthetic verdict/artifact policy tests, not Cypress browser runs.
- Syntax checks on every newly added CommonJS file and rehearsal spec: passed.
- New workflow YAML parsed with PyYAML BaseLoader; owner-only guard, pinned action SHAs, read-only token, timeout and manual-only trigger inspected.

No browser result is claimed. This sandbox has no Chrome or Xvfb. The CI runtime is the repository's existing Node 22.23.3. Dependencies, package manifest and lockfile are unchanged. No CTF site was contacted by this development work and no connector/billing settings were changed.

## Pending evidence

- Actual owner-approved rehearsal workflow run on the new commit.
- Both seven-check Chrome runs and exact counter verdicts.
- Artifact upload, download and run/attempt/commit/hash verification.
- Separate capability-suite execution; that existing workflow remains manual-only.

A queued or skipped Actions job is not a pass. Record actual results before changing status here.
