# Spec: Remediate 2026-08-02 architecture review findings

- **Date:** 2026-08-02
- **Slug:** `remediate-review-findings`
- **Status:** Draft — awaiting approval

## Problem statement

A deep architecture/performance/UX review of the codebase on `develop`
(three focused passes over hooks, UI components, and Japanese domain logic,
plus a live run of `tsc --noEmit`, `eslint .`, and `bun test src`) surfaced
~25 findings. Quality gates themselves are healthy (typecheck clean, 66/66
unit tests pass, lint at 0 errors / 64 warnings), but the gates don't touch
several categories of real problems:

1. **Correctness bugs that mis-score a user's answer or show broken
   content** — the highest-severity class, since this is a learning app and
   these bugs actively teach wrong things.
2. **Dead/duplicated code and an unguarded experimental feature** that
   create real risk of a future edit landing in the wrong (dead) file, or a
   visitor hitting a feature that can't work for them.
3. **Performance costs in hot paths** — listeners re-subscribed almost every
   keystroke, missing memoization in components that render every question.
4. **UX/accessibility gaps** — broken theme options, missing ARIA state,
   inconsistent feedback across the four games.

Full finding detail (file:line, reproduction, severity) lives in the review
artifact from this session; this spec organizes remediation, it doesn't
re-derive the findings.

### Decisions already made (user input from this session)

- **Ollama practice feature**: treated as experimental. Scope for this pass
  is to **gate its visibility** behind an explicit opt-in env check, not to
  resolve which deployment target (Docker vs Vercel) it should actually run
  on — that decision is deferred.
- **Scoping**: one coordinated spec, executed as several staged
  branches/PRs (this document), rather than independent specs per category.
- **Shared "question-cycle" hook refactor** (deduplicating the load-next-
  question logic across `use-word-game`/`use-kanji-game`/`use-number-game`/
  `use-date-game`): deferred to its own follow-up spec. Anything in this
  pass that touches those four hooks is a small, targeted diff, not a
  restructuring.

### Open decision needed at spec approval

**Broken themes** (`forest`, `sunset`, `daylight`, `lavender`, `mint` have
no CSS in `globals.css`, only `sakura`/`ocean`/`default` actually render):

- **Option A (recommended for this pass):** trim `theme-context.tsx` and
  `theme-switcher.tsx` down to the three themes that work today
  (`default`/`sakura`/`ocean`). Designing five new palettes is a design
  decision, not a bug fix, and is out of place in a remediation pass.
- **Option B:** design and implement CSS for the five missing themes now,
  as part of Phase 4.

This spec is written assuming **Option A**; flag at approval if B is
wanted instead (it would extend Phase 4's scope and timeline).

## Goals

Ship the following in four sequential phases, each its own branch and PR:

**Phase 1 — Correctness**
1. Furigana bracket regex recognizes チョーオンプ / ー (chōonpu) so curriculum
   sentences containing it render as proper ruby text instead of raw
   brackets. (`src/components/ui/furigana-text.tsx`)
2. Romaji "nn"→"n" normalization no longer accepts genuine misspellings
   (e.g. "ana" for あんな) as correct — scoped to the actual ん-before-
   vowel/y ambiguity it was meant to cover. (`src/lib/japanese/shared/input.ts`)
3. `getRandomKanji` cannot infinite-loop when the candidate pool minus the
   excluded entry is empty. (`src/lib/japanese/kanji/data.ts`)
4. The date game's "show numbers / show name" toggle changes display
   format only — it no longer re-triggers question generation.
   (`src/hooks/use-date-game.ts`, `src/lib/japanese/dates/dates.ts`)
5. Full-date question generation never produces a calendar-invalid date
   (e.g. Feb 30). (`src/lib/japanese/dates/dates.ts`)
6. `loadNewWord` in the words game ignores a stale response if a newer
   request has already started, closing the overlapping-request race.
   (`src/hooks/use-word-game.ts`)

**Phase 2 — Dead code and unguarded feature**
7. Remove the three confirmed-dead, never-imported component files
   (`words-settings-popover.tsx`, `words/mode-selector.tsx`,
   `game/play-mode-controls.tsx`).
8. Remove the leftover pre-Next.js Vite/Bun scaffold (`build.ts`,
   `src/index.html`, `src/index.css`, `src/logo.svg`, `src/react.svg`, the
   `[serve.static]` section of `bunfig.toml`) confirmed unreferenced by any
   `package.json` script.
9. Remove the orphaned `src/hooks/use-game-page.ts` stub (confirmed zero
   imports repo-wide).
10. Gate the Ollama practice tile: it only appears in `GAMES`
    (`src/lib/core/game-registry.ts`) and the `/practice/ollama` route
    itself only renders its real UI when an explicit env flag is set;
    otherwise both show nothing / a plain "not available" state instead of
    a feature guaranteed to fail for most visitors.
11. Consolidate the three duplicated Fisher-Yates shuffle implementations
    (`core/random.ts`, `words.ts`, `kanji/data.ts`) onto the one in
    `core/random.ts`, and replace the biased `.sort(() => Math.random() -
    0.5)` option-shuffle in `use-word-game.ts` with it.

**Phase 3 — Performance**
12. Keydown-handler objects passed to `useKeyboardNavigation` from
    `use-kanji-game`, `use-number-game`, `use-date-game` are referentially
    stable across renders (no re-subscribe on every keystroke).
13. The same listener is properly disabled while a settings popover/modal
    has focus, closing the "hidden state gets mutated" gap.
14. `quiz-engine.tsx` derives `correctOption`/`correctParts` once per
    question via `useMemo` instead of twice per render via inline IIFEs.
15. `FuriganaText` memoizes its parsed output on `text` instead of
    re-running its regex loop on every render of every option.
16. Debug `console.log("[Loader] ...")` calls in
    `src/lib/japanese/words/loader.ts` are removed or gated behind a dev
    flag.

**Phase 4 — UX / accessibility**
17. Trim the theme system to the three working themes (`default`/`sakura`/
    `ocean`) — remove the five non-functional options from
    `theme-context.tsx`, `theme-switcher.tsx`, and `game-selector-card.tsx`'s
    `LIGHT_THEMES` handling. *(Per Option A above.)*
18. Segmented/toggle controls that communicate active state via color only
    now also expose it via `aria-pressed`/`aria-selected`/`role="radiogroup"`
    as appropriate: `game-settings-popover.tsx`, `kanji-difficulty-
    selector.tsx`, `numbers/difficulty-selector.tsx`, `dates/date-mode-
    selector.tsx`, `words-settings-overlay.tsx`.
19. Hardcoded raw Tailwind feedback colors in `result-display.tsx`,
    `kanji-option-card.tsx`, `quiz-engine.tsx`, and `session-summary-
    card.tsx` are replaced with the existing `success`/`destructive` theme
    tokens already used correctly by their sibling primitive
    (`game-card-container.tsx`).
20. `words/game-feedback-section.tsx` renders an explicit "Correct" /
    "Incorrect" text label alongside its icon, matching the other three
    games (currently color+icon only).
21. `mobile-wordset-modal.tsx` gets the same Escape/scroll-lock/backdrop-
    dismiss handling every other overlay in the app already has.
22. `quiz-engine.tsx`'s results screen: "Play Again" actually restarts the
    same question set in place; "Back to Settings" remains the separate,
    distinct action it currently duplicates.
23. Missing `lang="ja"` added to the `romaji` slot in
    `primitives/result-display.tsx`.

## Non-goals

Explicitly out of scope for this remediation pass — each is either a
design decision needing its own discussion, or a bigger structural change
whose risk shouldn't be mixed into bug-fix commits:

- **Resolving the Ollama deployment target** (Docker vs Vercel) and making
  its sqlite/local-Ollama persistence actually work in production. This
  pass only stops it from silently appearing broken; the underlying
  architecture decision is a separate spec once the target is chosen.
- **The shared `useQuestionCycle`-style hook refactor** across the four
  game hooks. Deferred per this session's decision.
- **Unifying the four different settings-UI patterns** (words' Radix
  Command Center vs the other three games' hand-rolled popover) into one
  design-system component. Same class of cross-cutting risk as the hook
  refactor — its own spec.
- **Redesigning wordset loading** for the 33MB/~190k-entry dataset (e.g.
  server-side filtering, chunked/paginated data). The fixes in this pass
  don't touch `loader.ts`'s fetch/filter architecture, only its console
  logging.
- **Particle-leniency (は/へ/を) linguistic accuracy fix** in
  `input.ts`. Flagged low-severity in the review; tightening it risks new
  false negatives without a clearer grammatical rule, so it's left alone
  here.
- **Score/streak dual-source-of-truth** between `useBaseGame` and
  `useSessionProgress`. The practical risk today is contained by
  `key={sessionId}` on `GameCard`; this pass adds a regression test
  asserting that invariant holds, but does not restructure the hooks
  (that restructuring is part of the deferred hook refactor).
- Five new theme palettes (`forest`/`sunset`/`daylight`/`lavender`/`mint`),
  per Option A above, unless overridden at approval.
- No behavior changes beyond what's listed — this pass does not add new
  features.

## Edge cases

- **Furigana regex fix must not regress existing matches.** Add `ー` to
  both character classes; re-run `error-detection`/`input` test suites plus
  a new case for `エレベーター[えれべーたー]` sourced directly from
  `curriculum.ts`.
- **Romaji "nn" fix must keep the legitimate ambiguity case working**
  (`shinkansen` accepting both "shinkansen" and "shinnkansen", per the
  existing test at `input.test.ts:30-33`) while rejecting the collapsed
  false-positive case (`"ana"` for あんな). The fix needs a test for both
  directions, not just the new one.
- **`getRandomKanji` guard** must still return a value when `list` has
  exactly one entry and no `exclude`, and must still exclude correctly
  when the list has 2+ entries — don't just remove the loop.
- **Date toggle fix**: verify both `week_days` and `months` question types
  render their alternate display (`display` vs `displayNumber`) correctly
  after the fix, since the two modes currently take different code paths.
- **Ollama gating**: decide the exact env var name and default (off) with
  the user at plan review; ensure `/practice/ollama` degrades to a message,
  not a 404 or a crash, when the flag is unset.
- **Theme trim**: check `src/locales/*.json` for any theme-name strings
  that would become unused, and confirm no saved-theme value from
  `localStorage` for a removed theme crashes `theme-context.tsx` on load
  (it should fall back to `default`).
- **Shuffle consolidation**: `kanji/data.ts`'s local `shuffle` and
  `core/random.ts`'s `shuffleArray` must be verified to produce the same
  contract (in-place vs returns-new-array) before call sites are switched,
  to avoid introducing a mutation bug.

## Acceptance criteria

**Phase 1**
1. A new test renders `エレベーター[えれべーたー]` and asserts a `<ruby>`
   element is produced, not raw literal text.
2. New `input.test.ts` cases: あんな→"ana" is rejected; shinkansen/
   shinnkansen ambiguity from the existing test still passes.
3. A new `kanji/data.test.ts`-equivalent test calls `getRandomKanji` with a
   single-entry list equal to `exclude` and returns within a normal test
   timeout (no hang).
4. Manual/e2e check: toggling display format on a date question preserves
   the currently-typed answer and does not change the question.
5. A new `dates.test.ts` case runs `generateFullDateQuestion` many times
   (e.g. 500) and asserts every generated day is valid for its month.
6. A new `use-word-game` test (or equivalent) simulates two overlapping
   `loadNewWord` calls resolving out of order and asserts the UI reflects
   the later request.

**Phase 2**
7-9. `git grep` for each removed file's basename returns no remaining
   imports; `bun run build` still succeeds.
10. With the env flag unset (default), the Ollama tile does not appear in
    `GAMES`/on the homepage, and navigating to `/practice/ollama` directly
    shows a clear "not available" state rather than attempting to call
    Ollama or sqlite.
11. `bun run lint` shows no new `@typescript-eslint/no-unused-vars` for
    `core/random.ts` exports; `use-word-game.ts` no longer contains
    `.sort(() => Math.random() - 0.5)`.

**Phase 3**
12-13. A new or updated hook test/e2e check confirms the keydown listener
    is added once per mount (not per keystroke) and is inert while a
    popover/modal is open.
14-15. No behavior change (same rendered output), verified by existing
    `quiz-engine.test.tsx` continuing to pass unmodified in assertions.
16. `git grep "\[Loader\]"` in `src/lib/japanese/words/loader.ts` returns
    nothing, or only calls gated behind `process.env.NODE_ENV !==
    "production"`.

**Phase 4**
17. `theme-switcher.tsx` offers exactly three options; selecting each one
    visibly changes the page; no `localStorage` value outside those three
    causes a rendering error.
18. Each listed selector's active option exposes `aria-pressed="true"` (or
    equivalent) verifiable via testing-library `getByRole`.
19. `git grep` for `bg-green-|text-green-|bg-red-|text-red-` in the four
    listed files returns no feedback-color matches (tokenized ones remain
    fine elsewhere if out of scope).
20. Words game feedback section shows visible "Correct"/"Incorrect" text,
    covered by a new assertion in its test file.
21. `mobile-wordset-modal.tsx` responds to Escape and does not allow
    background scroll while open, matching the pattern already used in
    `words-settings-popover.tsx`.
22. Clicking "Play Again" on the results screen starts a new attempt at
    the same question set without returning to the settings screen first;
    "Back to Settings" is the only path that does.
23. `result-display.tsx`'s romaji output has `lang="ja"`.

**Overall**
- `bunx tsc --noEmit`, `bun run lint`, `bun test src`, and `bun run build`
  all pass at the end of every phase, not just at the end of the whole
  effort.
- Each phase lands as its own branch (`fix/*` or `chore/*` per Chōwa's
  branching convention) and its own PR against `develop`, so any phase can
  be reviewed, merged, or reverted independently of the others.
