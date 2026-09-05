# Tasks

**Status:** Implemented and verified; [PR #61](https://github.com/franprince/japanese-practice/pull/61) open against `develop`.
**Plan:** [implementation_plan.md](implementation_plan.md).

## Preparation

- [x] T1 — Confirm #60 merged, branch from current `develop`, inventory the
  warnings, record the dedicated specification, obtain its approval, and prepare
  the file-level plan with acceptance coverage.
- [x] Obtain implementation-plan approval before changing application code.

## Implementation and focused verification

- [x] T2 — Add stable hydration/storage snapshots; migrate language/theme
  providers and the language switcher; protect translation loads from stale
  success/failure; test saved/invalid preferences, hydration and rapid switches.
- [x] T3 — Correct Words group/filter initialization and cleanup; scope settings
  drafts to an open editing session; remove the scroll-state effect; test late
  groups, stale completion, cancel/reopen, editing stability and Apply semantics.
- [x] T4 — Replace Numbers/Dates question-init effects with local round
  identities and explicit transitions; adapt base-game admission; add the
  optional seeded source without changing selection formulas; stabilize keypad
  and confetti output; test hydration, bounds, duplicates and session resets.
- [x] T5 — Move Words/Kanji initialization commits to guarded async completions;
  derive pending/reset presentation; separate focus from question generation;
  test equivalent filters, obsolete requests, stale answers and Strict Mode.
- [x] T6 — Subscribe to stable acquisition/device snapshots; derive mobile
  selection/modal state for the current language; retain request cancellation
  and consent semantics; verify mobile hydration, language switches and retry.
- [x] T7 — Remove obsolete declarations/props and update call sites; promote
  the five specified lint rules to errors; inspect effective app/test/E2E config;
  pass lint with no targeted diagnostics and typecheck with the revised props.

T2 precedes hydration-dependent parts of T4/T6. T4's admission changes precede
T5; keep the intermediate commit coherent across all hook callers. T3 can be
implemented independently. T7 follows the behavior changes so lint identifies
the final unused declarations. Keep architectural decisions in the primary
session; only a fully specified mechanical cleanup is eligible for delegation.

## Final verification and delivery

- [x] T8 — Extend browser hydration checks and keypad/settings/preference
  regressions; pass typecheck, lint, all unit tests, the current production
  build and the full browser suite; capture and inspect visual proof.
- [x] T9 — Review the complete diff and check whitespace; update the plan,
  checklist, index and backlog with actual results; commit logical changes and
  their tests with Conventional Commit messages on this task branch.
- [x] Obtain PR approval, open [PR #61](https://github.com/franprince/japanese-practice/pull/61)
  against `develop` with the final scope, validation and visual proof, and
  verify mergeability. GitHub reports no merge conflicts; CI and preview
  checks were running at creation.
