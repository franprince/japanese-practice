# Resolve React lifecycle warnings

**Status:** Approved, implemented and verified on 2026-09-05; ready for PR approval.
**Backlog:** PR 5, following the merged game-session refactor in
[PR #60](https://github.com/franprince/japanese-practice/pull/60).
**Base:** `develop` at `c2e5862`.
**Branch:** `refactor/react-lifecycle-cleanup`.

## Problem

The current lint baseline has 40 warnings: 14 React lifecycle/purity warnings,
17 unused declarations in active source, six explicit-`any` warnings, and
three anonymous configuration export warnings. The first two groups are this
backlog item's scope.

Words initializes its filter through a setter declared below the effect.
Several components copy props or derived values into state through effects.
Game hooks generate questions when initialization callback dependencies change,
so changes unrelated to answering can replace a question or clear input.
The number pad shuffles inside a render-time memo. Language and theme providers
combine browser preference hydration with effects that update React state,
and translation loads lack protection against stale results.

These patterns make rendering and initialization harder to reason about and
prevent the project from enforcing the relevant lint rules as errors.

## Goals

1. Remove every active React lifecycle/purity and unused-variable warning
   without adding lint suppressions, broad exclusions, or artificial scheduling
   delays solely to avoid a rule.
2. Preserve the reducer-owned session contract from PR 4, including duplicate
   and stale outcome protection, scoring, completion, and explicit resets.
3. Make question initialization and replacement follow deliberate lifecycle
   or user events, with stable callback dependencies and guarded async results.
4. Make Words settings drafts and character-group initialization predictable.
5. Keep browser preference hydration consistent with server-rendered output,
   and prevent obsolete translation requests from winning a language change.
6. Promote the cleaned React rules and active-source unused-variable rule to
   errors so CI prevents their recurrence.

## Behavior and contracts

### Questions and sessions

- Numbers, Dates, Kanji and Words retain their current question distributions,
  answer evaluation, scoring, skip presentation and session completion rules.
- Input edits, feedback, unrelated parent renders, focus suppression, and
  opening or closing settings do not generate another question.
- Next and advancing Skip generate one playable replacement. A rapid duplicate
  answer or Skip still produces at most one session outcome.
- A session restart or relevant game configuration change clears the local
  question/input/feedback state once for that transition. Numbers conversion
  direction continues to preserve the current number and partial input.
- An active Words language change selects from the new language dataset.
  Dates can refresh its translated question on a language change. A completed
  session preserves its final question and answer until the user restarts.
- Late word, kanji or validation results cannot overwrite newer configuration,
  a restarted session, or an unmounted hook. Strict Mode effect replay must not
  commit an obsolete question or emit a session outcome.
- Initialization exposes the existing loading/empty presentation until a
  question is playable; it does not show a fabricated answerable placeholder.

### Number pad

- Shuffle occurs on keypad initialization, a change to the key set, or an
  explicit transition from ordered to shuffled keys.
- The chosen order survives unrelated rerenders, input changes, language
  changes and disabled-state changes. A new question can initialize a fresh
  order when its keypad mounts.
- Disabling shuffle restores the supplied key order. Arabic mode remains
  ordered. Shuffling preserves every key exactly once.
- Server rendering and initial hydration agree; render-time calculations do
  not call an unseeded random source.

### Words initialization and settings

- State declarations precede their use. Initial character-group loading
  selects all groups with the existing default length range of 3–6.
- A stale or replayed initialization completion cannot overwrite a newer
  selection or update an unmounted page.
- Every settings opening starts a draft from the latest committed settings.
  Closing without Apply discards the draft; reopening uses committed values.
- Unrelated renders and late group loading do not discard edits made in an
  open draft. Newly loaded groups become available for selection.
- Apply retains the existing atomic settings/session restart behavior. Applying
  unchanged settings does not reset the session.
- Selecting Custom still scrolls its controls into view. DOM synchronization
  can use an effect; it must not require effect-driven derived React state.

### Browser preferences and acquisition

- A valid saved language or theme becomes active after hydration and survives
  reload. Server and initial client snapshots match, and initialization cannot
  overwrite a saved preference with the default.
- Preserve the existing default language/theme and supported values. Invalid
  saved values fall back to those defaults.
- A language selection updates the preference and document language. The latest
  selected language owns its translation result and loading state; failed or
  obsolete loads cannot display another language as the selected one.
- Translation fallback remains the English message or key where necessary.
- Mobile wordset cache checks, consent, progress, persistence, cancellation,
  language switches and retries retain their existing acquisition semantics.
  The rendered state always corresponds to the current dataset language.
- Confetti retains its appearance and particle count without effect-driven
  derived-state updates or hydration mismatches.

### Lint enforcement

- Set `react-hooks/set-state-in-effect`, `react-hooks/purity`,
  `react-hooks/immutability`, `react-hooks/exhaustive-deps`, and
  `@typescript-eslint/no-unused-vars` to errors for application code.
- Keep existing non-React script/E2E and test-fixture exceptions scoped to their
  current purposes. Do not weaken them or add application exceptions to obtain
  a passing lint run.
- Remove obsolete imports, props and destructured values, updating call sites
  when removing a prop from a public component contract.
- The six explicit-`any` and three configuration-export warnings are outside
  scope; zero total lint warnings is not an acceptance requirement.

## Acceptance criteria and verification

1. `bun run lint` passes with zero React hook lifecycle/purity/dependency
   diagnostics and zero unused-variable diagnostics in active application code.
   The listed cleaned rules fail future violations as errors.
2. Number-pad component tests verify stable ordering across unrelated renders,
   ordered Arabic keys, key membership and explicit shuffle transitions.
3. Settings tests cover latest-value initialization, cancel/reopen, Apply,
   unrelated rerenders during draft editing, and delayed character-group
   availability. Words browser tests verify usable loaded filters.
4. Preference tests cover saved and invalid values, server/client hydration,
   reload persistence and rapid language changes with out-of-order results.
5. Hook integration tests cover question stability during input/focus/settings
   changes, intentional resets, stale async results, and Strict Mode cleanup.
   Existing score, duplicate outcome, completion and restart tests remain green.
6. `bun run typecheck`, `bun run test:unit`, `bun run build`, and the full
   `bun run test:e2e` pass. The browser fixtures report no uncaught page errors
   or hydration failures caused by this change.
7. Capture and inspect browser proof of the Numbers keypad and Words settings
   after the refactor. Review the final diff for unintended gameplay changes.

## Non-goals

- Do not split the large feature modules or introduce feature import boundaries;
  those changes belong to backlog PR 6.
- Do not redesign session ownership, scoring, question selection, UI layout,
  translations, wordset delivery or storage.
- Do not add persisted game progress, dependencies, or new game features.
- Do not undertake a general explicit-`any` or configuration formatting cleanup.

## Clarification and risk review

The approved backlog supplies the task order and scope. This draft resolves
the ambiguous reset and shuffle triggers above using the current session
compatibility contract. The main regression risks are accidental question
replacement, discarded settings drafts, saved preferences overwritten during
hydration, and stale asynchronous results. Each has explicit acceptance
coverage. No product preference question remains open.

The user approved this specification on 2026-09-05. See the
[implementation plan](implementation_plan.md) and [task checklist](tasks.md).
The user approved the implementation plan; execution and verification are complete.
