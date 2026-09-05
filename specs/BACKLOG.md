# Architecture Remediation Backlog

- **Source:** Architecture assessment performed 2026-09-04
- **Delivery rule:** One branch and one pull request per backlog item
- **Base branch:** `develop`
- **Status:** Approved sequence — PRs 1–3 and E2E hardening (#58) merged; PR 4 open for review

This backlog replaces the earlier recommendation to productionize the
experimental Ollama practice feature. The feature will instead be removed in
PR 1. The remaining items are ordered to minimize overlapping changes and to
keep every pull request independently reviewable and reversible.

| Order | Pull request | Suggested branch | Outcome | Depends on |
| --- | --- | --- | --- | --- |
| 1 | Remove Ollama practice completely | `chore/remove-ollama-practice` | No Ollama, SQLite quiz bank, generated-quiz routes, or quiz UI remains in the active application | None |
| 2 | Make wordset acquisition reliable | `fix/wordset-download-lifecycle` | Downloads, persistence, cache state, and failures have explicit, tested semantics | PR 1 |
| 3 | Move wordset payloads to static delivery | `perf/static-wordset-delivery` | Large JSON payloads use CDN/static delivery with a small version manifest | PR 2 |
| 4 | Unify game session state | `refactor/unify-game-session-state` | Score, streak, progress, completion, and reset behavior have one owner | PR 3 |
| 5 | Resolve React lifecycle warnings | `refactor/react-lifecycle-cleanup` | Current hook purity and effect synchronization warnings are removed | PR 4 |
| 6 | Decompose feature concentration points | `refactor/split-large-feature-modules` | Large words and game modules have focused, testable responsibilities | PR 5 |

## PR 1 — Remove Ollama practice completely — Merged

**Problem:** The hidden experimental feature exposes unauthenticated model
generation routes and relies on process-local coordination plus a writable,
instance-local SQLite file. Those assumptions do not fit the application's
deployment model.

**Scope:** Remove the practice page, generated-quiz API routes, Ollama client,
SQLite database, background worker, quiz-specific components and tests,
progress hook, curriculum, feature flag, registry entry, locale strings, and
obsolete runtime configuration. Preserve historical specs and changelog
entries as immutable project history.

**Acceptance summary:** No active source, configuration, route, dependency, or
generated application route references Ollama or the generated quiz feature.
The standard quality gates pass.

**Detailed specification:**
[2026-09-04-remove-ollama-practice/spec.md](2026-09-04-remove-ollama-practice/spec.md)

## PR 2 — Make wordset acquisition reliable

**Status:** Merged in [PR #57](https://github.com/franprince/japanese-practice/pull/57).

**Verification (2026-09-05):** Typecheck and production build pass; 121 unit
tests and all 8 relevant Words/browser lifecycle tests pass. Lint reports zero
errors and 53 warnings (down from 59 in the source checkout). The remaining
lifecycle warnings belong to PR 5. See the [implementation plan](2026-09-04-wordset-download-lifecycle/implementation_plan.md).

**Problem:** Wordset acquisition currently combines mobile policy, network
requests, progress reporting, IndexedDB persistence, memory caching, browser
events, and UI confirmation. Some failures are swallowed and can still mark a
dataset as available.

**Goals:**

1. Define a typed lifecycle: `idle`, `checking-cache`, `awaiting-consent`,
   `downloading`, `persisting`, `ready`, and `failed`.
2. Treat HTTP errors, aborted streams, malformed JSON, invalid dataset shapes,
   and IndexedDB failures as explicit failures.
3. Mark a language confirmed only after validation and durable persistence
   complete successfully.
4. Make cache writes resolve on transaction completion and reject on request,
   transaction, or quota failure.
5. Consolidate device detection and confirmation-key logic into one module.
6. Replace untyped custom window events with a typed adapter or direct state
   subscription.
7. Keep cached content usable during background revalidation failures.

**Non-goals:** Change payload URLs, split datasets, or alter vocabulary
selection behavior. Those changes belong to PR 3.

**Required tests:** Cache hit/miss, transaction failure, network failure,
malformed data, aborted download, successful persistence, language switch,
mobile consent, stale-while-revalidate, and retry after failure.

**Acceptance criteria:** The UI never reports success after a failed download;
no empty catch block remains in the acquisition path; confirmation implies a
validated dataset is readable from cache; existing desktop and mobile flows
remain functional.

**Detailed specification:**
[2026-09-04-wordset-download-lifecycle/spec.md](2026-09-04-wordset-download-lifecycle/spec.md)

## PR 3 — Move wordset payloads to static delivery

**Status:** Merged in [PR #59](https://github.com/franprince/japanese-practice/pull/59)
on 2026-09-05. PR 4 continues from `develop` at `7745aeb`.
See the
[specification](2026-09-05-static-wordset-delivery/spec.md),
[plan](2026-09-05-static-wordset-delivery/implementation_plan.md), and
[tasks](2026-09-05-static-wordset-delivery/tasks.md).

**Problem:** The application route reads, parses, and serializes wordsets up to
approximately 32 MB. Validation requests can therefore consume unnecessary
CPU and memory instead of using static hosting and CDN caching.

**Goals:**

1. Extend the build pipeline to emit a small manifest with language, version,
   byte size, checksum, and static asset URL.
2. Fetch the manifest for version checks and consent-size display.
3. Download wordset JSON directly from versioned static assets.
4. Configure immutable caching for versioned payloads and revalidation for the
   small manifest.
5. Remove `/api/wordset` after all clients use the static contract.
6. Document the generated artifact contract and deployment behavior.

**Non-goals:** Redesign the word schema, add server-side search, or change the
IndexedDB lifecycle established in PR 2.

**Required tests:** Manifest schema validation, deterministic checksum/version
generation, cache-busting after a version change, 304/revalidation behavior
for the manifest where applicable, missing asset behavior, and an E2E download
smoke test.

**Acceptance criteria:** No request handler parses a full wordset; repeat
visits reuse cached immutable assets; the mobile size prompt uses manifest
metadata; both English and Spanish datasets load correctly.

## PR 4 — Unify game session state

**Status:** Implemented and verified; [PR #60](https://github.com/franprince/japanese-practice/pull/60)
is open against `develop` without merge conflicts.
See the [specification](2026-09-05-unify-game-session-state/spec.md),
[plan](2026-09-05-unify-game-session-state/implementation_plan.md), and
[tasks](2026-09-05-unify-game-session-state/tasks.md).

**Verification (2026-09-05):** Typecheck and production build pass; all 167
unit/integration tests and all 44 production browser tests pass. Lint has zero
errors and 40 existing warnings, down from 53 on `develop`. The lifecycle
cleanup remains PR 5 and starts after this item merges.

**Problem:** Feature hooks own score and streak while page-level session state
mirrors the same values. Absolute-value callbacks, keyed remounts, and reset
ordering keep the two stores synchronized only by convention.

**Goals:**

1. Introduce a reducer-owned session model for score, current streak, best
   streak, answered count, correct count, target, play mode, and completion.
2. Express interactions as domain events such as `answer-submitted`,
   `question-skipped`, `session-restarted`, `mode-changed`, and
   `target-changed`.
3. Make feature hooks emit answer outcomes instead of maintaining score.
4. Remove reset-by-remount keys used only to synchronize duplicated state.
5. Preserve current scoring and streak-bonus rules.
6. Keep feature-specific question and input state local to each game.

**Non-goals:** Persist progress across browser sessions or redesign gameplay.

**Required tests:** Reducer transition table, streak bonuses, incorrect and
skipped answers, exact target completion, infinite mode, target changes,
restart behavior, and integration coverage for all four games.

**Acceptance criteria:** Score and streak have one source of truth; one user
answer produces exactly one session event; all four game pages use the same
session contract; visible behavior remains unchanged.

## PR 5 — Resolve React lifecycle warnings

**Problem:** Lint reports state-before-declaration, synchronous effect-driven
state, and render-time impurity warnings. These patterns create extra renders
and make initialization behavior sensitive to React scheduling.

**Goals:**

1. Fix words-page initialization so state declarations precede all use.
2. Replace derived-state effects with lazy initializers, memoized values, or
   explicit event transitions where appropriate.
3. Move number-pad shuffling out of render-time computation and give reshuffle
   behavior an explicit trigger.
4. Stabilize callbacks and effect dependencies without suppressing rules.
5. Remove obsolete props, imports, and destructured values exposed by lint.
6. Promote relevant React hook warnings to errors after the tree is clean.

**Non-goals:** Split large components or redesign session ownership beyond PR
4. Mechanical decomposition belongs to PR 6.

**Required tests:** Stable number-pad ordering across unrelated renders,
settings initialization on open, language hydration behavior, question
generation frequency, and regression coverage for words filter loading.

**Acceptance criteria:** `bun run lint` reports no React hook lifecycle or
purity warnings and no active-source unused-variable warnings; tests and build
remain green.

## PR 6 — Decompose feature concentration points

**Problem:** Several modules combine orchestration, domain decisions, state
transitions, presentation, and persistence. The largest concentration points
include the words settings overlay, word-game hook, words domain module, and
dataset loader.

**Goals:**

1. Split the words settings overlay into focused mode, session, and filter
   sections with a small orchestration shell.
2. Separate word-question selection from answer evaluation and UI state.
3. Split the words domain module by generation, filtering, and romaji
   conversion responsibilities.
4. Give wordset storage, transport, validation, and policy distinct modules
   while preserving the contracts created in PRs 2 and 3.
5. Define public barrel exports per feature and prevent UI modules from
   importing implementation internals.
6. Add focused unit tests at each new boundary before moving behavior.

**Non-goals:** Change user-visible behavior, add new games, or create a generic
framework for hypothetical features.

**Required tests:** Contract tests for extracted modules, unchanged feature
integration tests, import-boundary checks, and existing E2E critical paths.

**Acceptance criteria:** Each extracted module has one documented reason to
change; feature components depend on public contracts; no circular dependency
is introduced; quality gates and E2E critical paths pass.

## Backlog operating rules

Before starting PRs 2–6, create and approve a dedicated `spec.md`,
`implementation_plan.md`, and `tasks.md` for that PR. Branch from the latest
`develop` after its predecessor merges. Do not combine backlog items merely
because they touch the same file. Each PR must include its own tests and must
pass typecheck, lint, unit tests, E2E tests relevant to its scope, and the
production build.
