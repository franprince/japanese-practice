# Unified game session state

Continued under the user's instruction to update the backlog and continue after
PR #59 merged. Base: `develop` at `7745aeb`. Scope: backlog PR 4 only.

## Problem and goals

Game hooks calculate score/streak while pages mirror those values and maintain
completion separately. Keyed remounts synchronize resets. Move all aggregate
session state to one pure reducer, deliver typed outcomes from feature hooks,
and reset question/input state explicitly without remounting cards.

## Contract and compatibility

- Session state owns score, current/best streak, answered/correct/skipped counts,
  target, play mode, completion and a session generation identifier. Derived
  accuracy/remaining values come from this state; no public aggregate setters.
- `answer-submitted` carries correctness, session generation and question ID;
  `question-skipped` carries those identifiers. `session-restarted`,
  `mode-changed`, and `target-changed` reset aggregates atomically. A combined
  Words settings change performs one restart with the new mode and target.
- Correct answers award base points plus `floor(previousStreak / 5) * 5`.
  Words uses one base point; Numbers, Dates and Kanji use ten. The sixth
  consecutive correct answer earns the first bonus. Incorrect/skipped answers
  award zero, clear current streak and preserve score/best streak.
- Answers and skips each consume one round. Finite sessions stop at exactly the
  positive integer target; completed sessions ignore subsequent outcomes.
  Infinite sessions keep counting and never complete. Duplicate question IDs,
  older question results and results from a previous session are ignored.
- Restart retains mode/target unless explicitly changed. Mode/target changes
  start a new session; invalid targets are ignored. Default: 10-round session.
- Feature hooks own only question, answer input, reveal/feedback, loading and
  feature diagnostics. One question accepts at most one outcome, including
  repeated keyboard/click handlers before React renders. Async Words validation
  and loading cannot update a newer question or restarted session.
- Keep current reset triggers: Numbers difficulty, Dates category and changed
  Kanji difficulty restart; Numbers conversion direction preserves session and
  current question/input. Words settings restart only when settings change.
- Preserve skip presentation: Words reveals the skipped answer; Numbers/Dates
  advance immediately. Completion locks every answering control either way.
- Words inline accuracy continues to exclude skips, while session accuracy
  includes them. Derive both from reducer counts. Clear Words error diagnostics
  and Dates display toggle on session restart, as prior remounts did.
- Mobile consent, wordset acquisition, translations, layouts and question
  selection algorithms retain their current contracts.

## Acceptance and tests

1. All four pages use the same reducer-backed session contract, with no mirrored
   score/streak, absolute-score callbacks or reset-only React keys.
2. A pure transition table verifies bonuses, failures/skips, best streak, finite
   and infinite modes, target changes, restart, duplicate/stale event rejection.
3. Hook integration verifies actual outcomes, rapid duplicate calls, completion
   locking and explicit resets across all four games; Words covers async races.
4. Existing all-game browser flows pass; browser checks cover visible scoring,
   skipping, restart and settings transitions. Capture visual proof.
5. Typecheck, lint, unit tests, relevant E2E and production build pass.

## Non-goals

No persisted progress, gameplay redesign, vocabulary changes, broad module
decomposition or unrelated lifecycle warning cleanup (backlog PRs 5–6).
