# Reliable wordset acquisition — implementation plan

Continued under the user's 2026-09-05 backlog instruction. Branch:
`fix/wordset-acquisition-reliability`, based on `origin/develop` at `7388289`.

## Contract clarification

The draft named arrays absent from the existing datasets. Validate the actual
`WordSets` contract: `hiraganaWords`, `katakanaWords`, and optional `bothForms`.
Versions are positive safe integers (existing files use 1 and 2). Preserve
unknown fields and validate every word. No payload migration is needed.
Production fixtures also contain ungrouped legacy `ゝゞゐゑヽヾヰヱー` entries
with empty romanization. Accept only that precise existing exception; ordinary
words still require a non-empty answer. Preserve payloads and vocabulary behavior.

## Components and files

1. Add `src/lib/japanese/words/acquisition.ts`: typed errors/states, normalization,
   mobile/confirmation policy, full validation, transaction-backed cache I/O,
   streamed transport, deduplicated acquisition, cancellation and subscriptions.
   Inject storage/transport/policy dependencies to exercise failures deterministically.
2. Make `loader.ts` the compatibility adapter for existing `WordSets` callers.
   Keep the endpoint and ETags. Cache hits trigger nonblocking revalidation;
   explicit updates reject on failure. Share device policy with `words.ts`.
3. Connect `use-mobile-wordset.ts` to acquisition state. Abort superseded work;
   never enable words without a durable mobile result. Treat size as advisory.
4. Replace DOM events in `use-wordset-update.ts`. Update the mobile modal and
   words page for localized failures, retry, indeterminate progress, persistence,
   and cancellation. Add matching English, Spanish, and Japanese locale keys.

## Verification and goal coverage

- Lifecycle, failures, persistence, validation: unit tests of transport, cache
  transactions, and injected acquisition, including completion/error ordering.
- Consent, normalization, cancellation, switching and retry: hook integration
  tests and browser regressions for mobile failure/retry and existing words flows.
- Cached availability and notifications: 304, failed refresh, manual update
  rejection, subscriptions, concurrency and memory-fallback tests.
- Run typecheck, lint, all unit tests, relevant Playwright tests and build.
  Record pre-existing warnings separately. Review the complete diff before commit.

Each spec goal maps to the components and checks above. The schema correction
preserves the explicit compatibility goal; no other backlog item is included.

## Verification results — 2026-09-05

- `bun run typecheck`: pass.
- `bun run test:unit`: 121 tests pass, including 46 acquisition/hook regressions.
- `bun run lint`: zero errors; 53 warnings versus 59 in the source checkout.
  Existing effect/lifecycle warnings remain assigned to backlog PR 5.
- `node node_modules/@playwright/test/cli.js test e2e/tests/words.spec.ts
  e2e/tests/wordset-lifecycle.spec.ts --workers=2 --reporter=line`: 8 pass.
  Updated obsolete mobile settings/feedback selectors and made the correct-answer
  test deterministic. The new browser tests cover HTTP failure/retry and readable
  cache confirmation, quota failure/cancel, and cancellation while downloading.
- `bun run build`: pass, including production TypeScript and all 15 pages.
- `git diff --check`: pass. Inspected the mobile HTTP-error screenshot at
  `test-results/wordset-download-error.png` (generated, not committed).

The isolated worktree uses its own copy of the existing dependencies. The original
checkout's unrelated package/lockfile changes remain there. The local Bun command
resolution reports `unknown command 'test'` for the Playwright script, so verification
invoked the project's installed Playwright CLI directly with Node. Browser tests
and Turbopack required local sockets outside the sandbox. Build warnings about
browser data age and edge-runtime static generation are pre-existing.
