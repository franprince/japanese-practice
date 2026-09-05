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
| 2026-08-02 | [restore-quality-gates](2026-08-02-restore-quality-gates/spec.md) | Restore the project's quality gates | Done — see [plan](2026-08-02-restore-quality-gates/implementation_plan.md) |
| 2026-08-02 | [remediate-review-findings](2026-08-02-remediate-review-findings/spec.md) | Remediate 2026-08-02 architecture review findings | In progress — Phase 1 of 4 done |
| 2026-09-04 | [seo-improvements](2026-09-04-seo-improvements/spec.md) | Improve search and social metadata | Done — see [plan](2026-09-04-seo-improvements/implementation_plan.md) |
| 2026-09-04 | [remove-ollama-practice](2026-09-04-remove-ollama-practice/spec.md) | Remove Ollama practice completely | Done — see [plan](2026-09-04-remove-ollama-practice/implementation_plan.md) and [tasks](2026-09-04-remove-ollama-practice/tasks.md) |
| 2026-09-04 | [wordset-download-lifecycle](2026-09-04-wordset-download-lifecycle/spec.md) | Make wordset acquisition reliable | Merged in [PR #57](https://github.com/franprince/japanese-practice/pull/57); see [plan](2026-09-04-wordset-download-lifecycle/implementation_plan.md) and [tasks](2026-09-04-wordset-download-lifecycle/tasks.md) |
| 2026-09-05 | [static-wordset-delivery](2026-09-05-static-wordset-delivery/spec.md) | Deliver wordsets as immutable static assets | Implemented and verified — see [plan](2026-09-05-static-wordset-delivery/implementation_plan.md) |
