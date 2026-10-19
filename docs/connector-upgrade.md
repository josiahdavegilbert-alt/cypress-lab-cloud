# Cypress Lab connector upgrade

Requested after capability validation. This is a migration specification, NOT a deployed connector or a promise of remote control. The local bridge source is not present in this cloud repository and this chat has no local Cypress MCP tools available. Do not overwrite an unknown installation.

## Existing routes

- GitHub repository connector: can edit approved repository code, create allowed request issues and read result comments. This is not a live browser.
- Original Cypress Lab: laptop-hosted MCP bridge; previously reported as exposing only session discovery and status. Current connectivity and deployed code must be inspected again, not assumed from history.
- GitHub Actions: bounded on-demand test jobs, not an always-on HTTPS MCP server. GitHub Pages is not a Node MCP backend.

## Proposed tool contract

Names below are proposals, not currently callable tools.

| Tool | Contract |
| --- | --- |
| `lab_capabilities` | Return actual deployed version, backend availability and tested capabilities; distinguish implemented, passed, unavailable and pending. |
| `lab_request_run` | Accept a fixed approved suite ID, require confirmation, return request ID and immutable run identity when assigned; reject arbitrary commands, URLs and paths. |
| `lab_run_status` | Resolve a supplied request/run ID; return pending, running, verified, failed, canceled or unknown with commit and attempt. Never return an unrelated last success. |
| `lab_read_evidence` | Retrieve bounded allowlisted evidence for an exact run/attempt; redact sensitive data and enforce repo ownership, path checks and size limits. |

Retain existing local session/status tools unless a deliberate migration replaces them. Live DOM and reporter access through `cypress tap` are separate optional local capabilities; verify documented CLI support and the correct active session before adding them. A cloud run does not establish a tap connection.

## Deployment gates

1. Read the actual bridge source and dependency lockfile using an approved local access method. Never upload `.bridge-token`, `.env`, private credentials, browser profiles or cookies.
2. Identify the desired backend. Extending laptop-hosted tools retains the laptop dependency; laptop-independent operation needs a separately deployed authenticated HTTPS service or the existing GitHub request/result path.
3. Preserve authentication, narrow permissions and strict schemas; enforce transport origin/host protections as applicable. No arbitrary terminal, filesystem, source-code or target execution parameters. No credentials in browser test environment or reports.
4. Validate unauthenticated rejection, capability discovery, run confirmation, stale-run rejection, timeouts, failed/pending reporting, evidence limits and secret redaction. Also validate restart/disconnect behavior and token rotation without printing tokens.
5. Only then update the Perplexity connector URL/configuration and refresh discovered tools. Repository edits alone do not change the Perplexity connector or local bridge. Private tokens are configured locally or in approved secret storage, never pasted into chat.

Do not disable the old connector until the replacement route passes end-to-end acceptance. Do not add paid hosting or change $0 account billing safeguards without separate authorization.
