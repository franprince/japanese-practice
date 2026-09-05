# Implementation plan

**Status:** Implemented and verified on 2026-09-05; ready for PR approval.
**Specification:** [Approved on 2026-09-05](spec.md).
**Branch/base:** `refactor/react-lifecycle-cleanup`, from `develop` at `c2e5862`.
**Delivery:** One backlog item and one PR against `develop`.

## Approach and boundaries

Keep aggregate session state in `src/lib/core/game-session.ts` and
`use-session-progress.ts`. Local hooks continue to own questions, input and
feedback. Replace effects that copy or initialize local state with lazy
initialization, explicit event transitions, or pure derivation from a stored
question/configuration identity. Retain effects for external data requests,
subscriptions and DOM focus/scroll/attribute synchronization.

Use `useSyncExternalStore` for browser preferences, device state and the
existing acquisition service. Snapshots must remain stable until their source
changes, and the server snapshot must match initial hydration. This follows
[React's external-store contract](https://react.dev/reference/react/useSyncExternalStore).
Keep local form/game state in React; do not create an external game-state
framework to bypass a warning.

Initialize settings drafts at their editing boundary and derive values when
they do not need independent state, following
[React's guidance on avoiding synchronization effects](https://react.dev/learn/you-might-not-need-an-effect).
Random-looking values needed during rendering must be reproducible from stored
inputs; DOM work and fresh random sampling belong in initialization or explicit
events, consistent with [render purity](https://react.dev/reference/rules/components-and-hooks-must-be-pure).

## 1. Browser hydration, preferences and translations

**Files:** Add `src/hooks/use-hydrated.ts` and
`src/hooks/use-stored-preference.ts`; update `src/lib/i18n/i18n.tsx`,
`src/lib/theme/theme-context.tsx`, and
`src/components/language-switcher.tsx`. Inspect `app/layout.tsx` for any
attribute synchronization adjustment needed by the new snapshots.

- Provide a stable hydration snapshot (`false` on the server/initial hydration,
  `true` in the client snapshot) to replace effect-driven mounted flags.
- Add a small storage subscription hook for validated language/theme values.
  Read the saved value through the client snapshot, use the existing default
  in the server snapshot, and notify same-document consumers after a setter
  writes. Subscribe to browser storage changes and clean up listeners.
- Write preferences on user selection rather than writing defaults on mount.
  Preserve the keys `kana-words-lang` and `theme`, supported values and existing
  defaults. Storage failures must not crash rendering; retain the selected
  value in memory for that mounted provider if persistence is unavailable.
- Keep `document.documentElement.lang` and `data-theme` synchronization in
  effects. Neither effect writes React state or initializes persisted values.
- In I18n, tag loaded translations with their language and derive `isLoading`
  from the selected language and resolved result. English can use the imported
  dictionary immediately. Preserve lazy Spanish/Japanese imports and English
  fallback; do not show a stale loaded dictionary as the selected language.
- Guard translation success and failure callbacks with effect cleanup/request
  identity. Stabilize `setLang`, `t`, and the context value so unchanged
  dictionaries do not cause question regeneration through callback identity.
- Replace the language switcher's mounted effect with the hydration snapshot.
  Do not add `suppressHydrationWarning` to hide mismatches.

**Tests:** Add preference/provider tests under `src/hooks/__tests__` and
`src/lib/i18n/__tests__`. Use server rendering plus `hydrateRoot` with an
`onRecoverableError` collector for default, saved and invalid values. Test
same-document updates, listener cleanup and deferred translation loads that
resolve out of order, including switching back to English.

## 2. Words initial filters and settings drafts

**Files:** Update `app/words/page.tsx` and
`src/components/words/words-settings-overlay.tsx`.

- Move the filter declaration above its initialization effect. Store the
  loaded groups and default selection coherently; guard the async completion
  on cleanup and distinguish an untouched default from user-applied filters.
  Late completion must never replace an explicit selection.
- Keep a small draft editor component within the overlay file, mounted for
  each open editing session and initialized from the committed props. The
  closed dialog owns no draft. Retain Radix focus restoration and closing
  behavior; do not split the overlay into feature sections in this PR.
- Supply changing character groups as available choices without resetting an
  open draft. Apply sends the draft once through the existing page handler;
  Cancel/Escape/close discards it. Unchanged Apply preserves the session.
- Replace the state-based scroll acknowledgement with a ref or DOM callback
  that records an explicit Custom selection and scrolls after the section is
  present. Clear the request without setting React state from the effect.

**Tests:** Add `src/components/words/words-settings-overlay.test.tsx` and
page/filter initialization coverage in `src/components/words/words-page.test.tsx`.
Cover open, edit, unrelated rerender, late groups, cancel/reopen, committed prop
changes while closed, Apply once, unchanged Apply, and stale/unmounted group
completion. Extend `e2e/tests/words.spec.ts` for usable loaded Custom filters.

## 3. Synchronous questions, keypad order and confetti

**Files:** Update `src/hooks/use-number-game.ts`,
`src/hooks/use-date-game.ts`, `src/hooks/use-base-game.ts`,
`src/components/numbers/number-game-card.tsx`,
`src/components/dates/date-game-card.tsx`,
`src/components/numbers/number-pad.tsx`, `src/hooks/use-confetti.tsx`,
`src/lib/core/random.ts`, `src/lib/japanese/numbers/numbers.ts`, and
`src/lib/japanese/dates/dates.ts`.

- Represent a local round by its session/configuration identity and revision.
  Initialize local state lazily and advance it through Next/Skip. Derive reset
  state from a changed identity instead of synchronizing several state fields
  in an effect. Keep Numbers direction outside the reset identity.
- Give synchronous generators an optional random source, defaulting to their
  current source for existing callers. Add a small seeded source to
  `core/random.ts` so replaying a render or deriving a configuration reset from
  the same stored seed/revision produces the same question. Preserve the
  current selection formulas, ranges and calendar rules.
- Sample the initialization seed once through lazy state initialization and
  fresh seeds on explicit advancing events. Use the hydration snapshot to keep
  random-dependent game markup inactive during server/initial client output;
  expose empty/loading presentation until the actual question is playable.
- Adapt base-game admission to accept the local question identity and derive
  current feedback from that identity. Keep a synchronous event guard for
  duplicate handlers and reject stale handlers after a committed reset. Do not
  add session score/counter state or perform ref mutations during rendering.
- Dates retains the display toggle across rounds and resets it on session
  restart. Translation changes may refresh active question presentation, but
  must leave the completed question/feedback intact until restart.
- Store keypad initialization/shuffle revision separately from unrelated
  props. Derive each permutation reproducibly for that revision and key set;
  an explicit ordered-to-shuffled event creates a fresh revision. Equal key
  contents do not reshuffle just because a parent allocates another array.
  Ordered and Arabic modes use the supplied order. Initial hydration uses
  matching markup, and no unseeded random call occurs in a render memo.
- Derive confetti particles from a stable seed and count, preserving the
  existing color/position/delay/drift ranges and animation styles. Remove the
  effect that writes the particle array.

**Tests:** Add focused random-source/generator coverage for deterministic
replay and valid bounds, `src/components/numbers/number-pad.test.tsx`, and
`src/hooks/__tests__/use-confetti.test.tsx`. Extend
`src/hooks/__tests__/game-session-integration.test.ts` and
`src/hooks/__tests__/use-date-game.test.ts` for input/parent-render stability,
mode/difficulty/target/session transitions, stale handlers, rapid duplicate
Skip, completed-language preservation and Strict Mode. Check question identity
and validity, not whether two random questions happen to differ.

## 4. Async question loading and mobile acquisition

**Files:** Update `src/hooks/use-word-game.ts`,
`src/hooks/use-kanji-game.ts`, `src/hooks/use-mobile-wordset.ts`, and
`src/lib/japanese/words/acquisition.ts`. Add
`src/hooks/use-mobile-device.ts` to subscribe to the existing device policy.

- Words: identify the requested configuration separately from the resolved
  question. Derive loading/reset presentation while those identities differ;
  explicit Next initiates its loading transition in the event handler.
  Initialization effects start external data work and commit React state only
  from guarded async completion. Preserve `loadNewWord`'s promise behavior.
- Separate focus synchronization from word selection. `suppressFocus` changes
  and equivalent filter objects cannot invalidate a playable word or start a
  duplicate load. Retain request and validation guards, and present cleared
  diagnostics immediately for a new session.
- Kanji: initialize the question/options in the guarded dataset-load completion
  and explicit Next handler, removing the second effect that reacts to pool
  state. Tag pool and question results with difficulty/session identity. Use
  the existing cached loader on restart and reject obsolete completions.
- Both async hooks adopt the question identity/admission contract from step 3.
  Completed sessions ignore incidental reinitialization, and cleanup invalidates
  pending outcomes. No artificial timeout or microtask wrapper is added to
  make a synchronous state update appear asynchronous.
- Mobile: read device policy through a stable client/server snapshot, then
  derive the permitted game type from user selection, language and acquisition
  readiness. While device hydration is unresolved, avoid initiating a wordset
  download that could bypass mobile consent.
- Subscribe directly to `WordsetAcquisition` with `useSyncExternalStore`.
  Make the service's idle snapshots stable per normalized language; do not
  return newly allocated snapshots on every read. Keep acquisition semantics,
  transport, validation and persistence untouched.
- Tag modal/user-request state by dataset language so old errors/progress/modal
  state cannot leak across language changes. Effects start cache/metadata work
  and cancel obsolete requests; event handlers own selection/consent/cancel
  transitions. Remove synchronous effect-based UI resets and mirrored service
  state.

**Tests:** Extend `use-word-game.test.ts`, `use-mobile-wordset.test.ts`,
`game-session-integration.test.ts` and acquisition tests. Cover pending load
supersession, focus changes, semantically equal filters, unmount, Strict Mode
replay, stale validation, stable idle snapshots, mobile hydration/consent,
language changes during downloads and retries. Keep existing real browser
storage and download regressions in the final suite.

## 5. Unused declarations and lint enforcement

**Files:** `eslint.config.mjs`; the files already listed above;
`src/components/game/game-settings-popover.tsx`,
`src/components/game/session-summary-card.tsx`,
`src/components/layouts/game-page-layout.tsx`,
`src/components/words/game-card.tsx`,
`src/lib/japanese/kanji/data.ts`, `src/lib/japanese/shared/input.ts`,
`src/lib/japanese/words/words.ts`, and related call sites in
`app/{numbers,dates,kanji,words}/page.tsx` and `use-session-progress.ts`.

- Remove the 17 known unused declarations and any newly exposed unused values.
  Remove unused component props with their callers, including the unused
  settings remaining-count prop and Words close-settings callback. If removing
  summary-only props, retain the reducer's correct count and other live public
  session values.
- Promote the five rules named in the spec to errors and replace obsolete
  baseline comments. Keep existing script/E2E/type/test exceptions at their
  current scope and leave unrelated warning rules unchanged.
- Inspect effective ESLint configuration for representative app, hook, test
  and E2E paths to verify that override order preserves intended severity.

**Checks:** Lint plus typecheck validate removed contracts. Do not add tests
that merely assert an unused import is gone. Existing behavior tests validate
the affected components.

## 6. Browser verification, review and delivery

**Files:** Extend `e2e/fixtures/index.ts`, `e2e/tests/numbers.spec.ts`,
`e2e/tests/words.spec.ts`, `e2e/tests/home.spec.ts`, and
`e2e/tests/game-session.spec.ts`; add screenshots and verification notes to
this spec directory after implementation.

- Collect hydration-specific browser console errors as well as uncaught page
  exceptions. Avoid treating unrelated network/analytics messages as hydration
  failures. Use hydrateRoot tests to independently catch recoverable errors.
- Add browser assertions for keypad stability while entering answers, settings
  cancel/reopen without losing the current question, and saved language/theme
  after reload. Reuse fixtures and page objects rather than adding a runner.
- Run focused tests while changing each behavior, then run the project gates:
  `bun run typecheck`, `bun run lint`, `bun run test:unit`, `bun run build`,
  and `E2E_SKIP_BUILD=1 bun run test:e2e` after that successful current build.
  Run output-consuming/build operations sequentially. Broaden testing only
  when a failure, additional change or unresolved risk requires it.
- Capture and inspect Numbers keypad and Words settings screenshots from the
  current production browser run. Record proof, test totals, remaining warnings
  and any limitations in this plan and update `tasks.md`, `INDEX.md`, `BACKLOG.md`.
- Fetch/check the base and review the complete diff before Conventional Commits.
  Keep changes and their meaningful tests together. Request PR approval after
  the verified change is concrete; if authorized, open one PR to `develop`,
  include visual proof and verify mergeability. Do not merge it automatically.

## Coverage analysis

| Spec goal / acceptance | Plan steps | Persisted tasks |
| --- | --- | --- |
| Remove lifecycle/purity/unused diagnostics; enforce errors | 1–5 | T2–T7 |
| Preserve reducer scoring, admission, completion and resets | 3–4, 6 | T4, T5, T8 |
| Deliberate question loading; stable dependencies; stale results | 3–4 | T4, T5 |
| Predictable Words groups and editing drafts | 2, 6 | T3, T8 |
| Hydration, saved preferences and current translation ownership | 1, 4, 6 | T2, T6, T8 |
| Stable keypad and confetti output | 3, 6 | T4, T8 |
| All quality gates, inspected browser proof and diff review | 6 | T8, T9 |

Every specification goal and acceptance criterion has implementation and
verification coverage. No uncovered requirement or unrelated feature work
was found. The small browser hooks and optional random-source parameters
support the approved lifecycle contract; module decomposition remains PR 6.

## Approval and execution record

- Specification approved by the user on 2026-09-05.
- Plan and checklist approved by the user on 2026-09-05; implementation complete.
- `bun run typecheck` passes.
- `bun run lint` passes: zero errors and eight unrelated warnings, down from 40.
  All lifecycle/purity/dependency and active-source unused declarations are
  clean. Effective config inspection confirms error severity for all five
  specified app rules and unchanged scoped test/E2E exceptions.
- `bun run test:unit`: all 191 tests pass across 21 files, including 24 new
  lifecycle regressions. These exercise hydration, preference persistence and
  translation races/failures, settings drafts and stale group loads, stable
  keypad/confetti output, seeded generation, Strict Mode replay and stale
  async/disabled handlers across the games.
- `bun run build` passes on the final application code. After the build,
  `E2E_SKIP_BUILD=1 bun run test:e2e`: all 47 production Chromium tests pass,
  including the three new keypad/settings/preference browser regressions.
  Browser fixtures detected no uncaught page exceptions or hydration errors.
  The focused Words settings case also passes at a taller viewport for proof;
  its visibility check allows Chromium's subpixel intersection rounding.
- `git diff --check` passes. Final fetch confirms `origin/develop` is still
  `c2e5862`. No new dependency or lint suppression was introduced.

### Review findings resolved

- The outcome guard now checks the latest committed disabled state as well as
  the captured handler state, preventing retained answer handlers from scoring
  while controls are disabled.
- Removed an obsolete loader mock in the Words hook tests. With the new page
  tests loading the real module first, Bun applied that re-export mock to the
  real acquisition language normalizer. The tests now exercise its true
  English/Japanese shared-cache contract without that order-dependent mock.
- happy-dom 20 preserves quote/greater-than entities in parsed class attributes.
  The isolated keypad hydration test decodes those attributes as a browser does;
  actual Chromium verification independently checks production hydration.
- The initial new settings test used capitalized selectors that did not match
  the existing sentence-case labels. Corrected selectors; the full suite passes.

### Visual proof

Inspected production browser captures:

- [Numbers keypad](lifecycle-keypad.png): the shuffled key order remains stable
  while entering and clearing input; the question and ten-round session remain
  intact.
- [Words settings](lifecycle-settings.png): the Custom filter controls and
  committed session settings remain usable after cancel/reopen and unchanged
  Apply. Selected groups enable Save Settings.

### Remaining limitations

Browser verification uses the project's Chromium desktop/mobile viewport setup.
Existing browser-data-age, standalone-start and terminal-color notices remain.
The eight lint warnings are five existing explicit-`any` uses and three existing
anonymous configuration exports. Removing the redundant catch annotation in
this refactor also eliminated one explicit-`any` warning. Broader feature-module
decomposition remains backlog PR 6.
