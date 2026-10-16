# Controlled acceptance validation

Open an explicitly approved owner issue titled `[Cypress] Run acceptance` to run the fixed acceptance suite. Manual dispatch of Cypress acceptance validation is also available. This intentionally consumes included Actions usage; retain the account's $0 blocked-spending budget. No push or schedule trigger is added.

The local fixture runs inside the GitHub runner and contains no private challenge data. Tests verify typing, clicking, a real HTTP POST/response, rendered output and navigation. A third test deliberately fails. The validation succeeds only if exactly two tests pass, exactly the designated third test fails, an API request reaches the actual fixture server, network evidence is captured, and a nonempty failure screenshot is generated. A green validation job therefore means the expected failure was correctly detected, not that every Cypress assertion passed.

The workflow publishes bounded errors, selected synthetic network fields, screenshot hashes/sizes, commit and timing to the request issue. It does not publish screenshot images, raw headers, cookies, private data or unrestricted logs. It does not claim full artifact retrieval. Screenshots are ephemeral on the runner; persistent authenticated artifact retrieval remains unfinished.

The existing smoke workflow remains unchanged. The acceptance spec is outside the ordinary smoke spec glob. This suite and its reporting must be execution-tested before claiming readiness. A reviewed package-lock.json and npm ci remain outstanding. Future competition websites require their actual authorized URLs, reviewed specs and cloud reachability checks; issue bodies are never treated as commands or target configuration.
