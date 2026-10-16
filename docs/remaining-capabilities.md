# Locked workflow status

The complete package-lock.json was committed in 367c571a9cace836f6148abfed5cd57e11007eac and hash-verified against the tested snapshot. All three test workflows now use scripts/install-diagnostics.cjs, which runs only npm ci --no-audit --no-fund. Missing or inconsistent lockfiles must fail; no npm install fallback exists. The homepage workflow no longer restores dependency data from issue comments.

The lockfile bootstrap workflow is retired: manual dispatch only, read-only contents permission, and no repository write step. Its former scripts remain unused historical helpers and are not invoked by any active workflow. Dependency version changes require a separate reviewed manifest/lockfile update and clean-install tests.

Controlled acceptance retains synthetic diagnostics and screenshots for seven days and verifies downloaded screenshot sizes and hashes. This is cloud artifact retrieval, not assistant visual inspection. Older result limitation text about missing repository locking is historical and superseded by the committed lockfile; it is not a live repository status check.

The authorized homepage check remains limited to https://20260914.gm.neu-ctf.club/ and ordinary page resources, with screenshots/video disabled and no clicks, submissions, crawling or challenge attempts. The earlier homepage check passed, but the workflow cleanup must be rerun before claiming the new revision verified.

Acceptance, smoke and authorized homepage reruns each require separate explicit approval. No push or schedule trigger, billing changes or automatic competition traffic are added.
