# Implementation plan

Execution follows the user's continuation instruction for the approved backlog.

1. Add `src/lib/core/game-session.ts`: pure state initializer, typed events and
   reducer. Refactor `use-session-progress.ts` to wrap it and derive translated
   presentation values. Configure base points at page/session initialization.
2. Change `use-base-game.ts` to feedback and per-question outcome admission only.
   Use synchronous question guards and session generations for duplicate/stale
   protection. No score arithmetic or aggregate state belongs here.
3. Migrate the four game hooks, cards and pages to `sessionId` and
   `onSessionEvent`. Replace keyed remounts with explicit generation-sensitive
   question resets. Keep feature state local; pass reducer-derived attempt
   accuracy to the Words card. Reset settings in one reducer transition.
4. Add reducer and hook integration tests, extend relevant browser coverage, and
   capture a session screenshot. Run typecheck, lint, unit tests, production
   build and all four game E2E suites. Review the complete diff and update records.

Coverage: aggregate ownership/scoring -> 1, 4; outcome events/deduplication ->
2–4; explicit resets and compatibility -> 3–4. Every spec criterion maps to a
plan step. No uncovered goals or unrelated components were found.

Risk review identified async Words validation, repeated handlers before render,
final-round skips, and Numbers direction switches as focused regression cases.

## Verification — 2026-09-05

- `bun run typecheck` passes.
- `bun run lint` passes with zero errors and 40 existing warnings (53 on base).
- `bun run test:unit`: 167 tests pass, including reducer transitions and all four
  game hooks, duplicate/stale events, async validation and completed-language
  changes. No failures.
- `bun run build` passes. The full E2E command also builds the latest production
  code before starting its server.
- `bun run test:e2e`: all 44 production browser tests pass, including seven new
  session regressions and existing game, mobile lifecycle and static delivery
  coverage. The seven new tests also pass when capturing full-page proof with
  `E2E_SKIP_BUILD=1 bun run test:e2e e2e/tests/game-session.spec.ts`.
- Review caught a completed Words/Dates session changing its final question
  when the UI language changed. Guarded initialization and regression tests
  now preserve the completed result until restart.
- `git diff --check` passes. No active absolute-score callbacks, aggregate
  setters, or reset-only session keys remain. `origin/develop` is still `7745aeb`.

Build and browser verification need local process/socket access beyond the
sandbox. Existing browser-data-age, standalone-start and terminal-color
warnings remain; browser fixtures report no uncaught page exceptions.

## Visual proof

Full-page captures from the production browser tests were inspected:

- [Numbers streak bonus and skip](numbers-streak-bonus.png): score 65, current
  streak 0, best streak 6, three rounds remaining.
- [Dates final skip](dates-final-skip.png): five-round completion with disabled
  input, Check and Skip controls.
- [Words accuracy](words-session-accuracy.png): one correct answer and four
  skips retain 100% answer accuracy and show 20% session accuracy.
