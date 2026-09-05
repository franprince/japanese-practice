# Implementation plan

Execution authorized by the user's backlog continuation and PR instruction.

1. Add a manifest contract and typed metadata fetcher; share existing error types
   without a circular import. Add deterministic build-time asset publication
   using the existing payload validator and Node SHA-256. Wire dev/build/dataset
   scripts and static cache headers; remove the old API handler.
2. Adapt the acquisition transport to fetch/validate manifest metadata, compare
   cached checksums, stream static bytes, and verify integrity before returning.
   Retain acquisition, storage and notification behavior. Store an optional
   checksum on cache entries without a database migration.
3. Read mobile advisory size from the manifest; retain the existing estimate on
   metadata failure. Update README and document deployment/retention behavior.
4. Migrate route fixtures and add focused manifest, generation, cache-reuse,
   integrity, missing-asset and EN/ES browser coverage. Run required quality gates
   and production cache/304 checks, review diff, commit and open PR into develop.

Goal coverage: generation/contract -> 1 and 4; transport/cache reuse -> 2 and 4;
consent sizing -> 3 and 4; removal/deployment -> 1 and 3. No uncovered goals or
unrelated components. Existing versions and payload bytes remain compatible.

## Verification — 2026-09-05

- Typecheck passes; 136 unit/integration tests pass.
- Lint passes with zero errors and the base branch's 53 warnings. No new warning remains.
- Production build passes and no longer contains the wordset API route.
- All 11 relevant Playwright tests pass against the production build using
  `playwright.production.config.ts`: real EN/ES download, persistent cache reuse,
  mobile failure/retry/storage failure/cancellation, and existing words gameplay.
- HTTP assertions verify one-year immutable asset caching, exact byte lengths,
  manifest no-cache/ETag/304, missing asset 404, and removed endpoint 404.
  The HTTP test also passes against the default development server.
- Generator tests verify deterministic outputs, changed URLs without a version
  bump, retention of old assets, and no manifest replacement after invalid input.
- Review caught and fixed same-version read-back ambiguity: mobile confirmation
  now checks the delivery checksum as well as the numeric version.
- `git diff --check` passes. Generated assets and local build artifacts are excluded.

The build and browser server need local socket/process access beyond the sandbox;
verification succeeded with that access. Existing browser-data-age and standalone
start warnings remain unrelated to this change. The production test configuration
and reproduction commands are included in `docs/static-wordsets.md`.

## Integration with E2E hardening — 2026-09-05

Merged `develop` at `a723abd` after PR #58. Preserved its expanded browser tests,
CI browser gate, Node-based Playwright scripts and synchronous cache-request fix.
Resolved the overlapping word tests by migrating shared fixtures, failure injection,
request counts, cancellation checks and language switching to manifest/static URLs.
Malformed JSON/schema fixtures declare their actual byte count so those validation
paths remain covered; cached results include the verified asset checksum.

Post-merge verification: typecheck and production build pass, all 136 unit tests
and the full 37-test browser suite pass, and lint reports zero errors with 52
existing warnings. `git diff --check` and the unresolved-index check are clean.
