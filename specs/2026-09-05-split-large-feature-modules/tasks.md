# Tasks

**Status:** Implemented and verified; PR creation approval pending.
**Plan:** [implementation_plan.md](implementation_plan.md).

## Preparation

- [x] T1 — Verify #61 merged, branch from `develop` at `a959f8b`, inventory
  current contracts, draft/review the specification, and record user approval.
- [x] Prepare the file-level implementation plan, dependency order, and
  acceptance-to-task coverage.
- [x] Obtain implementation-plan approval before changing application code.

## Implementation and focused verification

- [x] T2 — Add missing characterization cases before the related moves;
  remove the incomplete global Words barrel mock; verify real and mocked
  boundaries coexist in the combined suite; capture desktop/mobile baseline
  settings/gameplay proof before changing UI code.
- [x] T3 — Create dataset contracts/errors/policy/validation/manifest/transport/
  storage modules; move the service and loader facade; preserve singleton and
  class identity; migrate runtime/build/fixture consumers and corresponding
  tests; remove obsolete dataset files under `words`; pass acquisition,
  static-delivery, mobile-hook, and type checks with unchanged artifacts.
- [x] T4 — Extract vocabulary filtering and selection/cache ownership,
  dictionary-backed characters, and romaji conversion; define explicit Words
  exports; remove `words.ts`; pass focused pool/filter/mobile/non-mutation,
  generation, cache-key, readiness, and conversion tests.
- [x] T5 — Extract `loadWordQuestion` and its request/result contract; preserve
  game-type selection, single-character Guess, distractor attempt/fallback
  behavior and original/partial failures; verify deterministic contract cases
  without React or session side effects.
- [x] T6 — Extract answer evaluation with synchronous fast paths and deferred
  diagnostics; integrate both helpers into `useWordGame`; preserve request and
  session guards, input/focus/diagnostics, and logging; pass correctness,
  duplicate/stale/Strict Mode/final-question/restart and combined page tests.
- [x] T7 — Extract controlled mode/type, session, and filter sections; retain
  one shell-owned draft and identical dialog/scroll/presentation behavior;
  expose the Words UI barrel and migrate page/shared consumers; pass focused
  section and existing overlay/page tests.
- [x] T8 — Add the TypeScript-resolved boundary checker, valid/invalid fixture
  cases and real graph assertion, plus the focused script command; enforce
  public imports, no self-barrel/cyclic/layer-inverting dependencies, and build
  isolation; document module responsibilities and public contracts.

T2 is incremental: characterize each existing seam before its extraction and
move those assertions with it. T3 precedes T4; T4 precedes T5; T5 precedes hook
integration in T6. T7 can run independently after its T2 characterization and
baseline proof. T8's checker fixtures can run independently; enforcement against
the final graph follows T3–T7. T9 follows all implementation tasks.

Keep architectural choices and lifecycle-sensitive changes in the primary
session. Once exact props, JSX ranges, and import mappings are fixed, the
mechanical section moves or caller-import updates can be delegated. Independent
read-only review can check coverage and regressions alongside implementation.

## Final verification and delivery

- [x] T9 — Pass typecheck, lint, all unit/contract/boundary tests, the current
  production build, and the full production browser suite; inspect comparable
  desktop/mobile before/after Words proof; verify unchanged source payloads,
  lifecycle rule severities, and dependency constraints.
- [x] T10 — Review the full diff and whitespace; refresh/check the base; record
  actual verification/proof/limitations in the plan, checklist, index and
  backlog; make coherent Conventional Commits on this task branch.
- [ ] Obtain PR creation approval unless already granted; open one PR against
  `develop` with final scope, visual proof, and validation; verify mergeability
  and resolve conflicts on this branch if needed. Leave merging to the user.
