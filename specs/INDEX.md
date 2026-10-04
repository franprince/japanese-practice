# Spec Index

Every non-trivial change gets a folder under `specs/<YYYY-MM-DD>-<slug>/`
containing `spec.md` (problem, goals, non-goals, schemas, edge cases,
acceptance criteria) and `implementation_plan.md` (files touched, component
boundaries, test plan). Both are approved before code is written.

Never put `spec.md` or `implementation_plan.md` at the repo root — the next
feature's docs would overwrite them and the record of what was approved is
lost.

| Date | Slug | Title | Status |
| --- | --- | --- | --- |
| 2026-09-05 | [e2e-reliability](2026-09-05-e2e-reliability/spec.md) | Strengthen E2E behavior checks and CI execution | Implemented and verified — see [plan](2026-09-05-e2e-reliability/implementation_plan.md) and [tasks](2026-09-05-e2e-reliability/tasks.md) |
| 2026-08-02 | [restore-quality-gates](2026-08-02-restore-quality-gates/spec.md) | Restore the project's quality gates | Done — see [plan](2026-08-02-restore-quality-gates/implementation_plan.md) |
| 2026-08-02 | [remediate-review-findings](2026-08-02-remediate-review-findings/spec.md) | Remediate 2026-08-02 architecture review findings | In progress — Phase 1 of 4 done |
| 2026-09-04 | [seo-improvements](2026-09-04-seo-improvements/spec.md) | Improve search and social metadata | Done — see [plan](2026-09-04-seo-improvements/implementation_plan.md) |
| 2026-09-04 | [remove-ollama-practice](2026-09-04-remove-ollama-practice/spec.md) | Remove Ollama practice completely | Done — see [plan](2026-09-04-remove-ollama-practice/implementation_plan.md) and [tasks](2026-09-04-remove-ollama-practice/tasks.md) |
| 2026-09-04 | [wordset-download-lifecycle](2026-09-04-wordset-download-lifecycle/spec.md) | Make wordset acquisition reliable | Merged in [PR #57](https://github.com/franprince/japanese-practice/pull/57); see [plan](2026-09-04-wordset-download-lifecycle/implementation_plan.md) and [tasks](2026-09-04-wordset-download-lifecycle/tasks.md) |
| 2026-09-05 | [static-wordset-delivery](2026-09-05-static-wordset-delivery/spec.md) | Deliver wordsets as immutable static assets | Merged in [PR #59](https://github.com/franprince/japanese-practice/pull/59); see [plan](2026-09-05-static-wordset-delivery/implementation_plan.md) |
| 2026-09-05 | [unify-game-session-state](2026-09-05-unify-game-session-state/spec.md) | Unify game session state | Merged in [PR #60](https://github.com/franprince/japanese-practice/pull/60); see [plan](2026-09-05-unify-game-session-state/implementation_plan.md) and [tasks](2026-09-05-unify-game-session-state/tasks.md) |
| 2026-09-05 | [react-lifecycle-cleanup](2026-09-05-react-lifecycle-cleanup/spec.md) | Resolve React lifecycle warnings | Merged in [PR #61](https://github.com/franprince/japanese-practice/pull/61); see [plan](2026-09-05-react-lifecycle-cleanup/implementation_plan.md) and [tasks](2026-09-05-react-lifecycle-cleanup/tasks.md) |
| 2026-09-05 | [split-large-feature-modules](2026-09-05-split-large-feature-modules/spec.md) | Decompose feature concentration points | Implemented and verified — [PR #62](https://github.com/franprince/japanese-practice/pull/62) open against `develop`; see [plan](2026-09-05-split-large-feature-modules/implementation_plan.md) and [tasks](2026-09-05-split-large-feature-modules/tasks.md) |
| 2026-09-05 | [practice-ux](2026-09-05-practice-ux/spec.md) | Unify practice UX and add focused review | Implemented and verified — [PR #63](https://github.com/franprince/japanese-practice/pull/63) open against `develop`; [plan](2026-09-05-practice-ux/implementation_plan.md), [tasks](2026-09-05-practice-ux/tasks.md) |
| 2026-10-03 | [next-security](2026-10-03-next-security/spec.md) | Patch framework security dependencies | Verified — stack 1/8; separate topic PR |
| 2026-10-03 | [kanji-options](2026-10-03-kanji-options/spec.md) | Keep Kanji answer choices distinct | Verified — stack 2/8; separate topic PR |
| 2026-10-03 | [word-particles](2026-10-03-word-particles/spec.md) | Restrict particle reading exceptions | Verified — stack 3/8; separate topic PR |
| 2026-10-03 | [number-syntax](2026-10-03-number-syntax/spec.md) | Reject malformed Japanese numerals | Verified — stack 4/8; separate topic PR |
| 2026-10-03 | [date-whitespace](2026-10-03-date-whitespace/spec.md) | Accept spaced full-date answers | Verified — stack 5/8; separate topic PR |
| 2026-10-03 | [word-filter-scope](2026-10-03-word-filter-scope/spec.md) | Scope advanced filters to Custom practice | Verified — stack 6/8; separate topic PR |
| 2026-10-03 | [custom-scripts](2026-10-03-custom-scripts/spec.md) | Practice both selected scripts in Custom | Verified — stack 7/8; separate topic PR |
| 2026-10-03 | [kanji-translations](2026-10-03-kanji-translations/spec.md) | Preserve Spanish meanings during Kanji rebuilds | Verified — stack 8/8; separate topic PR |
