# Decompose feature concentration points

**Status:** Implemented and verified on 2026-09-05; PR creation pending.
**Backlog:** PR 6, following the lifecycle cleanup merged in
[PR #61](https://github.com/franprince/japanese-practice/pull/61).
**Base:** `develop` at `a959f8b`.
**Branch:** `refactor/split-large-feature-modules`.
**Delivery:** One branch and one PR against `develop`.

## Problem

The Words feature still combines independent responsibilities in a few modules:

- `words-settings-overlay.tsx` (432 lines) owns the dialog, editing draft,
  mode/type controls, session settings, and character/length filters.
- `use-word-game.ts` (283 lines) combines question and distractor selection,
  answer evaluation, character diagnostics, React state, async result admission,
  focus, and session events.
- `words.ts` (327 lines) combines vocabulary selection and caching, character
  generation, filtering, blacklist policy, and kana-to-romaji conversion.
- `acquisition.ts` (366 lines) combines acquisition orchestration, IndexedDB
  transactions, download transport, validation, language/device policy, and
  confirmation storage. The original `loader.ts` is now a 14-line adapter.

Existing integration tests protect much of the behavior, but selection and
conversion cannot yet be tested through focused boundaries. Some UI hooks import
dataset implementation files directly. `manifest.ts` also obtains types from
the acquisition module that imports it, coupling a lower-level contract to its
orchestrator.

This task separates those responsibilities while preserving the contracts
established by backlog PRs 2–5.

## Goals

1. Keep settings draft ownership and dialog coordination in a small shell;
   extract focused mode/type, session, and filter sections.
2. Separate question selection and answer evaluation from React UI state and
   session-event admission in the Words hook.
3. Separate vocabulary filtering/selection, character generation, and romaji
   conversion, with explicit inputs and independently testable outputs.
4. Separate wordset storage, transport, validation, and policy from the
   acquisition service. Preserve its single instance and lifecycle ownership.
5. Define explicit public entry points for the affected Words UI, practice
   domain, and dataset capabilities. Enforce consumer import boundaries and
   avoid circular dependencies.
6. Add or relocate meaningful contract tests at the extracted boundaries before
   moving their behavior, while retaining feature and browser regressions.

## Behavior and contracts

### Settings

- Every opening initializes a draft from the latest committed mode, game type,
  play mode, target count, and filter. The shell owns this draft; sections receive
  values and change callbacks rather than maintaining duplicate drafts.
- Cancel, Escape, and close discard edits. Unrelated renders, language updates,
  and newly available character groups do not overwrite an open draft.
- Apply closes the dialog and submits one complete settings tuple through the
  existing callback. Unchanged Apply retains the current session; changed
  settings retain the page's current comparison and restart behavior, including
  its order-sensitive filter comparison.
- Preserve all four modes, three game types, infinite/session selection, target
  presets, length ranges/defaults, group toggles, Select All/Deselect All, and
  the disabled Apply state for Custom with no selected groups.
- Preserve Custom scrolling, focus behavior, translated labels, section order,
  layout, classes, and desktop/mobile presentation.

### Question selection and filtering

- Selection accepts the existing `GameMode`, `WordsGameType`, `WordFilter`, and
  language. It returns a question containing a `JapaneseWord` and optional
  answer options, or an explicit empty result. It does not update React state,
  submit session events, or move focus.
- Words mode uses the selected language's existing dataset and vocabulary
  pools. Preserve blacklist matching, inclusive kana-length bounds, all-groups
  membership filtering, and empty-selection behavior.
- Preserve normalized language, mode, sorted group selection, length bounds,
  and mobile/desktop distinctions in the filtered-pool cache. Preserve its
  existing lifetime and mobile cap of 1,500 candidates. Do not mutate source
  datasets or caller-owned filters when filtering, sampling, or shuffling.
- Character practice retains the selected lengths, script/group selection,
  mixed-script behavior, special-group sampling, and output metadata.
- Guess mode generates one character, uses at most ten candidate attempts to
  find two distinct distractors, retains the existing fallback pool, and
  shuffles three unique options containing the correct romaji exactly once.
- Preserve empty-pool and loading/error presentation. Acquisition failures
  retain their typed errors through the domain boundary; the UI retains its
  current handling. Do not invent a playable placeholder.
- Conversion retains digraphs, small-tsu consonant doubling, prolonged sounds,
  vowel/macron substitutions, script lookup, and existing empty/unknown-input
  behavior. This task does not change linguistic acceptance rules.
- Preserve dictionary initialization requirements and synchronous snapshot
  behavior. Importing the converter must not start a wordset download or require
  React; character generation still awaits its dictionary data before use.

### Answer evaluation and UI lifecycle

- Evaluation accepts a question, answer string, and game type and returns
  correctness plus optional character diagnostics. It owns no session state
  and does not mutate the question or prior diagnostics.
- Preserve trimmed/case-normalized comparison and existing accepted romaji
  variants. For non-Guess answers, failed direct validation still uses
  `detectErrors`, including promotion to correct when it reports fully correct.
  Guess answers do not request character diagnostics.
- A diagnostic failure retains the existing incorrect-answer outcome and
  logging behavior; it cannot manufacture a correct result or a second event.
- The hook remains the owner of input, loading/empty state, answer presentation,
  focus, and diagnostics accumulated for the current session. The shared
  session reducer remains the only owner of scores, streaks, and completion.
- Preserve duplicate submission guards, question identity, stale request and
  validation rejection, Strict Mode cleanup, and disabled/completed-session
  guards. An extracted helper must not bypass outcome admission.
- Focus changes, settings opening/closing, and semantically equivalent filter
  props received by the hook do not regenerate a question. Next, Skip, restart,
  applied settings, configuration/language changes, and completion retain the
  currently tested behavior, including retaining the final question until
  restart and clearing session diagnostics on restart.

### Dataset acquisition

- Keep `WordSets`, manifest metadata, errors, lifecycle snapshots, update events,
  and the existing cache/loader/acquisition operations compatible for consumers.
  Internal import locations may change after callers migrate together.
- Preserve `WordsetError` and `ConsentRequired` class identity for `instanceof`
  consumers, the default acquisition singleton, and service injection in tests.
- Policy continues to normalize English/Japanese to `en` and other supported
  use to `es`; preserve device detection, `prod-*` cache keys, and
  `wordset-confirmed-*` confirmation keys. Keep DB name/version/stores unchanged.
- Validation continues to check complete datasets, optional legacy checksum
  metadata, and the existing exceptional kana records without mutating input.
- Transport preserves manifest revalidation, immutable payload URLs, decoded
  progress bytes, version/checksum verification, and distinctions between HTTP,
  network, aborted stream, parse, validation, and storage failures.
- Storage writes resolve on transaction completion. Preserve connection
  cleanup, abort handling, corruption eviction, and failure propagation.
- Acquisition owns memory, normalized concurrent work, cancellation membership,
  stable snapshots/subscriptions, and background revalidation. Preserve mobile
  consent and durable read-back requirements, desktop memory fallback, explicit
  update failures, and usable cached content after background refresh failure.
- Build-time publication can use validation and metadata contracts without
  depending on browser acquisition orchestration. Generated bytes, schemas,
  URLs, and caching headers remain unchanged.

### Module and import boundaries

- Document one responsibility and reason to change for each extracted module.
  Avoid arbitrary line-count targets or a generic feature framework.
- Public entry points expose deliberate named exports. Consumers outside Words
  UI use its entry point; app/components/hooks use public domain/dataset entry
  points rather than their storage, transport, selection, or validation internals.
- Internal modules import their dependencies directly, never their own public
  barrel. Shared types and errors must not depend on orchestration. Domain and
  dataset modules must not import React hooks, feature components, or app pages.
- Focused colocated tests may import internals to exercise their contracts.
  Build tooling uses the appropriate public dataset contract. Boundary checks
  cover alias and relative imports and re-exports, including type dependencies.
- Scope enforcement to the Words UI/domain/dataset work and affected shared
  imports. Other games receive only necessary public-import migrations; this
  task does not reorganize all four features.

## Acceptance criteria and verification

1. Settings sections, question selection, answer evaluation, filtering,
   character generation, conversion, storage, transport, validation, and policy
   have focused boundaries with documented responsibilities. The overlay and
   game hook coordinate them without duplicate settings/session state.
2. Contract tests cover settings edits/Apply/Cancel, empty and constrained pools,
   group and length filtering, mobile limits and non-mutation, character output,
   Guess distractor uniqueness/fallback, romaji conversion, and answer outcomes
   with successful/failed character diagnostics. Random cases use controlled
   inputs so tests assert behavior without statistical flakiness.
3. Existing acquisition/static-delivery tests still verify both production
   datasets, deterministic publishing, transaction durability, error classes,
   progress, language normalization, consent, shared cancellation, retry, and
   revalidation. Move tests with responsibilities; do not weaken assertions.
4. Existing Words hook/page/settings and shared session integration regressions
   pass, including stale asynchronous work, duplicate outcomes, settings draft
   retention, restart/completion, and language changes. Public-barrel mocks must
   not hide real contract coverage or break other tests in the combined Bun run.
5. Automated import-boundary checks reject forbidden internal imports and
   cycles in the affected module graph. Test the checks with valid and invalid
   fixtures, and verify the real production graph.
6. `bun run typecheck`, `bun run lint`, `bun run test:unit`, `bun run build`,
   and the full production `bun run test:e2e` suite pass. Do not weaken the
   lifecycle or unused-declaration lint errors established in PR 5.
7. Capture and inspect desktop/mobile Words settings and gameplay proof;
   compare with the merged baseline. Browser fixtures report no new uncaught
   exceptions or hydration failures. Review the diff for unintended UI,
   generated-data, or gameplay changes.

## Non-goals

- No new features, games, settings, visual redesign, scoring changes, saved
  progress, linguistic fixes, or changes to vocabulary selection policy.
- No shared question-cycle framework, new dependencies, new global state,
  database migration, payload/schema changes, or deployment changes.
- No unrelated lint cleanup or work from the older remediation phases.
- No change to filtered-cache invalidation policy disguised as extraction;
  record newly discovered behavior defects separately for explicit scoping.

## Clarification and approval record

The user requested continuation after PR #61 merged. The approved backlog
identifies PR 6 as the next item. This specification targets the current
acquisition concentration point, bounds import enforcement to the affected
features, and resolves preservation requirements against the merged code and
tests. No product preference remains unspecified.

An independent read-only review checked this draft against the backlog and
current tests. It identified an ambiguity between opening settings and applying
changes; the contracts above now distinguish those transitions and preserve
the page's existing comparison behavior. No remaining scope gap was identified.

The user approved this specification on 2026-09-05. See the
[implementation plan](implementation_plan.md) and [task checklist](tasks.md).
The user approved the implementation plan on 2026-09-05. Implementation and
verification are complete; PR creation approval is pending.
