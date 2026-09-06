# Implementation plan

**Status:** Implemented and verified on 2026-09-05; [PR #62](https://github.com/franprince/japanese-practice/pull/62) open against `develop`.
**Specification:** [Approved by the user on 2026-09-05](spec.md).
**Branch/base:** `refactor/split-large-feature-modules`, from `develop` at `a959f8b`.
**Delivery:** One backlog item and one PR against `develop`.
**Checklist:** [tasks.md](tasks.md).

## Structure and responsibility ownership

Keep the current hook and page interfaces. Add a sibling `wordsets` directory
for dataset concerns, leaving `words` responsible for practice logic. These
public entry points have different consumers:

- `src/components/words/index.ts`: named exports of `GameCard`,
  `WordsSettingsOverlay`, `MobileWordsetModal`, and `WordsMobileMenu` for pages.
- `src/lib/japanese/words/index.ts`: named practice functions and types,
  including existing selectors/conversion and the new question/evaluation APIs.
- `src/lib/japanese/wordsets/index.ts`: named runtime acquisition, metadata,
  policy, loader operations, errors, and consumer types.
- `src/lib/japanese/wordsets/build.ts`: only pure dataset/manifest validation
  and metadata types for publishing and fixtures; no acquisition dependencies.

Internal files import direct dependencies rather than their own barrel.
Words domain code can use the public dataset entry point. Dataset code does
not depend on Words practice logic, React, or feature hooks/components.
Retain canonical `JapaneseWord`, `WordFilter`, `WordSets`, and `LoaderDeps`
definitions in `src/types`; re-export types explicitly without duplicating them.
Use the existing leaf type paths (`types/japanese`, `types/game`, `types/api`,
and `i18n/translations`). The broad `@/types` and `@/lib/i18n` barrels reach
React through re-exports and must not enter the domain/dataset dependency graph.

| Module | Responsibility and reason to change |
| --- | --- |
| `words-settings-overlay.tsx` | Dialog lifecycle, one editing draft, Apply/close, and Custom scroll coordination |
| `words/settings/mode-section.tsx` | Mode and game-type choices and their presentation |
| `words/settings/session-section.tsx` | Infinite/session and target controls |
| `words/settings/filter-section.tsx` | Group/length editing controls |
| `japanese/words/filtering.ts` | Pool composition, blacklist/group/length filtering, cache keys, and mobile candidate cap |
| `japanese/words/selection.ts` | Dataset-backed vocabulary selection and filtered-pool cache ownership |
| `japanese/words/characters.ts` | Dictionary-backed character generation and existing group sampling |
| `japanese/words/romaji.ts` | Kana-to-romaji conversion with current dictionary lookup semantics |
| `japanese/words/question.ts` | Game-type selection and Guess distractor construction |
| `japanese/words/evaluation.ts` | Answer correctness and character-diagnostic evaluation |
| `hooks/use-word-game.ts` | React question/input/diagnostic state, request admission, focus, and session interaction |
| `japanese/wordsets/contracts.ts` | Shared transport/storage/lifecycle types used without importing orchestration |
| `japanese/wordsets/errors.ts` | The single error-class definitions and failure kinds |
| `japanese/wordsets/policy.ts` | Dataset-language/device policy and cache/confirmation keys |
| `japanese/wordsets/validation.ts` | Full dataset shape validation |
| `japanese/wordsets/manifest.ts` | Manifest schema/path validation and manifest URL contract |
| `japanese/wordsets/transport.ts` | Manifest fetch, streaming payload download, progress, integrity, and transport errors |
| `japanese/wordsets/storage.ts` | IndexedDB adapter, transaction durability, aborts, and connection cleanup |
| `japanese/wordsets/acquisition.ts` | Acquisition lifecycle, memory, shared requests, revalidation, subscriptions, and singleton |
| `japanese/wordsets/loader.ts` | Existing convenience API delegating to the acquisition singleton |

Add concise responsibility comments and `docs/words-module-boundaries.md` with
the public contracts, dependency direction, test exceptions, and module map.
Avoid additional layers or moving unrelated game hooks.

## 1. Characterize the existing boundaries

**Files:** Existing Words hook/page/settings and acquisition/static-delivery
tests; add focused tests under `src/lib/japanese/words/__tests__/`.

- Before each extraction, add missing behavioral cases against the current
  implementation, then move assertions to the new boundary as it becomes
  available. Existing acquisition tests already exercise validation, transport,
  storage, and service behavior directly; relocate those instead of duplicating
  equivalent coverage.
- Add selection/conversion characterization for dataset pools including
  `bothForms`, blacklist substrings, inclusive lengths, every-group matching,
  empty groups/pools, input non-mutation, script selection, generated metadata,
  dictionary readiness, and the current romaji transformations.
- Add Guess cases at the current hook seam before moving generation: force
  one-character requests, reject repeated/answer distractors, reach fallback
  after ten candidate attempts, and preserve three distinct choices.
- Extend current settings interaction tests for group toggles, length controls,
  Guess hiding lengths, and session targets before extracting sections.
- Replace the incomplete process-global `mock.module` of the Words barrel in
  `use-word-game.test.ts` with scoped, restored spies or narrow injected helper
  dependencies. Keep the real barrel and all exports available to page and new
  domain tests in a combined `bun test src` run. Update page test seams when
  the hook starts calling the public question API.
- Control random values and deferred promises locally, restore spies/globals,
  and avoid relying on test order or a cache populated by another test.
- Before changing UI code, capture desktop/mobile settings and gameplay from
  the current production baseline using existing browser fixtures. Save baseline
  proof in this spec directory for comparison during final verification.

## 2. Separate dataset acquisition responsibilities

**Files:** Add the listed `src/lib/japanese/wordsets/*` modules; migrate
`words/{acquisition,errors,manifest,loader}.ts`; retain `src/lib/core/db.ts` and
`src/types/api.ts` contracts. Move relevant tests to `wordsets/__tests__/`.

- Put `DatasetLanguage`, `WordsetFetch`, `WordsetStorage`, lifecycle snapshots,
  events, and metadata interfaces in `contracts.ts`. Keep operation bookkeeping
  private to acquisition. Types/errors must not import the service that uses them.
- Move `WordsetError` and `ConsentRequired` to one errors module. Re-export the
  original class objects from the public entry point so `instanceof` remains
  reliable; do not define replacement classes in compatibility adapters.
- Move normalization, mobile detection, keys, and confirmation access into
  policy; preserve normalization/default-language differences at existing call
  sites. Keep browser access inside callable functions.
- Move `validateWordset` unchanged to validation. Move manifest schema/path
  validation to manifest and `fetchWordsetMetadata` into transport alongside
  `downloadWordset`. Keep the existing transport arguments/result union,
  validation order, checksum calculation, progress, and abort classifications.
- Move `cacheTransaction` and `indexedDbStorage` into storage. Keep database
  name/version/stores in shared `core/db.ts`, which also serves Kanji. Do not
  replace transaction completion with request success or change read-back logic.
- Keep `WordsetAcquisition` orchestration in acquisition with the same injected
  dependencies and exactly one exported default instance. Retain operation
  membership, stable idle snapshots, state/event subscriptions, memory fallback,
  confirmation timing, and revalidation behavior without refactoring transitions.
- Retain the loader convenience signatures, including ignored `LoaderDeps`, in
  the dataset loader facade. Move their consumer imports together. Remove the
  obsolete files under `words` after every caller has migrated.
- Update `use-mobile-wordset.ts`, `use-mobile-device.ts`, and
  `use-wordset-update.ts` to the runtime entry point. Migrate
  `scripts/publish-wordsets.ts`, `src/test/wordset-fixture.ts`, and
  `e2e/tests/static-wordset-delivery.spec.ts` to `wordsets/build.ts`.
  `scripts/build-wordset.ts` imports `JapaneseWord` from its canonical type file.
- Adjust `words.ts`'s loader import temporarily, then replace it in step 3.
  Update `docs/static-wordsets.md` only where moved implementation paths need
  correction; keep its artifact and deployment contract intact.

**Focused verification:** Relocated validation/transport/storage/lifecycle and
static-delivery suites; mobile hook regressions; typecheck. Assert public error
identity and stable singleton/snapshot behavior through the real facade.
Compare published artifacts with the baseline; no source dataset changes.

## 3. Extract vocabulary, characters, and conversion

**Files:** Add `words/{filtering,selection,characters,romaji}.ts`, update
`words/index.ts`, and remove `words/words.ts` after migrating imports.

- Move conversion into `romaji.ts`. Keep `kanaToRomaji(text)`'s synchronous
  public contract. An internal converter may accept a dictionary map explicitly
  for focused fixtures; the public wrapper still reads the current synchronous
  map. Preserve the import-time `characterGroups` snapshot separately in the
  character module and continue exporting it.
- Extract candidate-pool composition, filter/key construction, and mobile
  clamping into functions that accept data and policy inputs. Keep filters and
  source arrays unmodified, blacklist behavior intact, and the 1,500-item cap.
- Keep the module-scoped filtered cache in `selection.ts`, with the exact
  mode/language/device/sorted-group/length keys and lifetime. `getRandomWord`
  retains loading, error propagation, cache lookup, and random choice; it calls
  the public dataset contract. Keep the current consent-error compatibility
  behavior. Do not add checksum invalidation or change cache-hit sampling.
- Move character generation into `characters.ts`. Keep dictionary awaits,
  mixed-script rules, special-group probabilities, inclusive length choice,
  group metadata, and accumulated per-character romaji. Use a supplied random
  source only at narrow testable generation/sampling boundaries; production
  defaults keep the existing random sampling order and distributions.
- Change the Words barrel to explicit named exports, retaining the existing
  practice API. Dataset operations now belong to the dataset entry point;
  migrate their callers rather than retaining duplicate ownership in two barrels.

**Focused verification:** `filtering.test.ts`, `selection.test.ts`,
`characters.test.ts`, and `romaji.test.ts`. Exercise real wrappers using restored
service spies where needed, with pure fixture-based assertions underneath.
Test cap behavior and key isolation/equivalence directly, including reordered
groups. Keep refresh-required cache behavior and unknown-kana conversion intact.

## 4. Separate question loading and evaluation from the hook

**Files:** Add `words/{question,evaluation}.ts`, export their public APIs,
update `use-word-game.ts`, hook/page tests, and add domain contract tests.

- Define `WordQuestionRequest` with mode, game type, filter, and language.
  `loadWordQuestion(request)` returns `{ word, options, error? }`, where `word`
  and `options` may be null. It selects vocabulary/characters and constructs
  Guess distractors without touching React, focus, request IDs, or sessions.
  A small optional dependency argument can provide selectors and randomness
  for contract tests without a process-global module mock.
- Retain the existing fallback pool and ten-attempt candidate limit. Preserve
  partial failure behavior: if distractor loading fails after a primary word
  was selected, return that word, null options, and the original error. A failed
  primary load returns null with the original error. The hook logs once with
  the existing message; `getRandomWord` itself still propagates typed failures.
- Define evaluation results with correctness, nullable diagnostics, and an
  optional original diagnostic error. Use the existing shared validation and
  detection functions; keep Guess out of diagnostic evaluation.
- Preserve direct validation's synchronous result and use a Promise only for
  diagnostic work. The hook must not introduce an extra asynchronous delay
  before submitting an otherwise synchronous correct/Guess outcome. It logs
  diagnostic failures with the existing message and keeps the incorrect result.
- Retain `configKey`, sorted filter memoization, request/validation IDs,
  generation cleanup, latest-disabled admission in `useBaseGame`, and the
  current load/commit ordering. Helpers return data; only the hook commits
  current results and submits admitted session events.
- Retain input/focus behavior, revealed answer formatting, Skip presentation,
  error-map accumulation, restart clearing, and callbacks. Do not change the
  page's order-sensitive settings comparison or add a second session owner.

**Focused verification:** `question.test.ts` and `evaluation.test.ts` cover all
three game types, empty/failure/partial outcomes, distractor uniqueness/fallback,
normalization, diagnostic promotion/failure, and non-mutation. Hook regressions
retain duplicate/stale handling, synchronous admission, deferred validation,
focus/equivalent-filter stability, Strict Mode, final-question retention, and
diagnostic reset. Run the combined domain/hook/page tests to catch mock leakage.

## 5. Extract controlled settings sections

**Files:** Add the three `src/components/words/settings/*-section.tsx` files and
`src/components/words/index.ts`; update the overlay and `app/words/page.tsx`.

- Move mode/type JSX into `ModeSection`, session/target JSX into `SessionSection`,
  and group/length JSX into `FilterSection`. Keep the current class strings,
  labels, section numbering, control bounds, and component structure so layout
  and event behavior remain stable. Do not add wrapper DOM solely for extraction.
- Pass current draft values plus typed change callbacks. The overlay's mounted
  `WordsSettingsDraft` remains the only state owner. Filter controls forward functional
  updates that return new filter values to the shell setter, preserving batched
  edits; sections neither keep drafts nor apply settings themselves.
- Keep dialog/portal, header/footer, Apply/close order, and scroll-request ref
  in the shell. Pass a section ref into the filter component without changing
  Custom scrolling or focus restoration. Keep the outer controlled dialog API.
- Export only page-facing components from the UI barrel. `app/words/page.tsx`
  uses that barrel; sibling components keep direct internal imports. Update
  touched shared dictionary imports in `app/kanji/page.tsx` and
  `kanji-option-card.tsx` to the existing shared public entry point, without
  reorganizing their feature files.

**Focused verification:** Keep overlay/page integration tests. Add one
`settings/sections.test.tsx` suite covering controlled mode/type, session/target,
group toggle/all/none, word/character length and Guess visibility. Check callback
values and non-mutation, then retain draft Cancel/reopen/Apply/late-group cases
at the shell boundary. Browser checks retain actual Radix and slider behavior.

## 6. Enforce public boundaries and acyclic dependencies

**Files:** Add `scripts/check-feature-boundaries.ts`,
`src/test/feature-boundaries.test.ts`, and `docs/words-module-boundaries.md`;
add `check:boundaries` to `package.json`.

- Use the already installed TypeScript parser and module resolver with the
  repository's actual `tsconfig.json`; do not add a dependency or use a regex
  as the import parser. Export an analyzer and keep filesystem/CLI work behind
  the script's main entry point.
- Scan source locations `app`, `src`, `scripts`, and `e2e`, including new files
  before they are staged. Include TS/TSX/MTS/CTS and corresponding JS extensions;
  exclude generated output, dependencies, and fixture source strings. Local
  declaration files remain in the graph so type-only imports cannot hide a
  forbidden dependency. Treat JSON/assets as terminal dependencies. Resolve alias/relative
  imports, explicit index/extension spellings, side-effect imports, named/star/
  namespace re-exports, type-only imports/re-exports/import types, external
  import-equals declarations, and literal dynamic imports/require calls. Report
  unresolved local imports in the guarded graph instead of silently dropping
  them. Strings passed to `mock.module` are not import edges.
- Enforce outside-consumer access to the three feature roots through their
  named public entry points. Reject imports/re-exports of internals by pages,
  components, hooks, scripts, and general fixture/E2E helpers. Only focused unit
  tests colocated within the relevant feature may reach its internals.
- Reject same-feature implementation imports of its own public entry points.
  Public entry points must use named exports rather than wildcard/namespace-star
  exports. Affected UI consumers use the shared public barrel for dictionary
  helpers; domain internals may use its leaf modules. Keep generic core imports
  outside this consumer-import restriction.
  Follow resolved dependencies through shared/core/type modules to detect cycles
  touching the affected roots, including type-only cycles. Report a useful path;
  do not reject unrelated legacy cycles elsewhere in the application.
- Verify that dataset code cannot depend on Words practice or UI code; that
  domain/dataset dependencies cannot reach React, app pages, feature components,
  or hooks; and that `wordsets/build.ts` cannot reach acquisition, loader,
  storage, `core/db.ts`, or browser policy. Neutral contracts and errors cannot
  depend on orchestration. Include lower-level dependencies in this analysis,
  rather than checking only immediate directory neighbors.
- Fixture tests include valid facade/internal/colocated-test imports and invalid
  alias/relative/type/dynamic/re-export access, self-barrel use, direct/indirect
  cycles, lower-layer inversions, and build-to-browser dependencies. A test also
  checks the real source graph, so existing `bun test src` in CI/pre-push enforces
  the boundary without changing ESLint severities or CI configuration. Check
  test-consumer imports with their scoped exceptions, but exclude unit/E2E tests
  from production cycle and transitive-layer analysis. Include fixtures for
  unresolved local imports, allowed asset/external imports, unrelated cycles,
  and indirect React access through the broad type/i18n barrels.

## 7. Verify and prepare delivery

**Files:** Existing Words, lifecycle, static-delivery and session E2E suites;
proof and verification notes in this spec directory; index/backlog/checklist.

- Run focused tests as each boundary changes. Then pass `bun run typecheck`,
  `bun run lint`, `bun run test:unit`, and `bun run check:boundaries`.
- Run `bun run build` followed by `E2E_SKIP_BUILD=1 bun run test:e2e` against
  that current build. Build and browser operations run sequentially. Preserve
  the full four-game/browser regression suite and hydration/error collectors.
- Reuse existing Words fixtures/page objects. Extend browser assertions only
  for uncovered behavior needed by this extraction; no fixed sleeps, optional
  assertions, or changes that weaken current checks.
- Capture final Words settings and gameplay at desktop/mobile viewports with
  the same fixture data, language, theme, settings, and viewport as baseline.
  Inspect before/after proof for layout, controls, focus, and scroll behavior;
  compare UI structure where random character content legitimately differs.
- Check type/lint rules remain unchanged, no source payload/manifest-contract
  drift occurred, and no new dependencies or production cycles appeared.
  Record actual test counts and any warnings/limitations; the previous task's
  191 unit and 47 browser passes are historical, not this task's verification.
- Review the complete diff and `git diff --check`, fetch/check the base, update
  these documents, and commit coherent code/test clusters with Conventional
  Commits. Keep one task branch; do not merge or push a protected branch.
- Once the result is verified, request PR creation approval unless the user
  has granted it by then. Open one PR against `develop`, include inspected
  visual proof and verification, and check mergeability. Resolve any base
  conflicts on this branch before calling the PR ready. Do not merge the PR.

## Coverage analysis

| Specification goal / acceptance | Plan steps | Tasks |
| --- | --- | --- |
| Settings sections; single draft; preserved controls and presentation | 1, 5, 7 | T2, T7, T9 |
| Selection/evaluation independent from React and session admission | 1, 4 | T2, T5, T6 |
| Filtering, character generation, romaji and cache compatibility | 1, 3 | T2, T4 |
| Separate dataset responsibilities; preserve acquisition/static contracts | 1, 2 | T2, T3 |
| Public contracts, documented ownership, no forbidden imports/cycles | 2–6 | T3–T8 |
| Focused contracts plus unchanged feature/session regressions | 1–6 | T2–T8 |
| Typecheck/lint/unit/build/E2E and inspected visual proof | 7 | T9, T10 |

Every approved goal and acceptance criterion has implementation and verification
coverage. The build-only entry point, controlled settings sections, and scoped
dependency checker directly support the approved boundaries; no additional
feature or behavior change is planned.

## Approval and execution record

- Specification approved by the user on 2026-09-05.
- Implementation plan and checklist approved by the user on 2026-09-05; implementation complete.
- Independent review confirmed the extraction order and preservation coverage.
  It identified two enforcement gaps: affected UI imports of shared helpers and
  direct/transitive build dependencies on `core/db.ts`. Step 6 now explicitly
  covers both. No unresolved specification-to-plan gap remains.
- Planning verification: local document links, whitespace, and ten unique
  ordered task identifiers pass. These checks do not verify application changes.
- Planning changed only documentation. Implementation followed the user's approval.

### Review findings resolved

- Preserved the shell's functional filter updates. Independent review reproduced
  a lost-update regression in the first controlled-section draft against both
  the extracted code and the original HEAD implementation. The final section
  forwards `SetStateAction<WordFilter>` to the shell. A regression batches two
  group changes and a length change before Apply; it fails before the correction
  and passes afterward.
- Added deferred groups/map readiness, actual mixed-script generation, special
  group sampling thresholds, and same-turn correct-Answer-then-Skip tests after
  independent domain/lifecycle review. The synchronous evaluation fast path and
  request guards remain in the hook.
- Restored readable multiline shell/filter JSX. Independent review confirmed all
  110 class-string expressions match the original UI.
- The first full browser run passed 48/49. The existing Custom-filter viewport
  assertion observed 98.735% visibility after a selected button's scale clipped
  the panel edge. The test now explicitly centers that button before checking
  the unchanged 99% visibility threshold; no assertion or product styling was
  weakened. Final results follow below.
- Include local declaration files in dependency traversal so type-only edges
  cannot bypass the intended React/build boundary. Third-party declarations and
  generated files remain outside the scanned inventory.


### Final verification (2026-09-05)

- `bun run typecheck` passes; the production build's TypeScript check also passes.
- `bun run lint` passes with zero errors and the same eight unrelated warnings.
  Lifecycle/dependency/unused-variable rule severities are unchanged.
- `bun run test:unit`: **302 passing tests across 30 files**, up from 191 in the
  merged baseline. Includes focused domain/dataset/settings contracts, the
  boundary checker fixtures/real graph, and all retained game/lifecycle tests.
- `bun run check:boundaries` passes on the final graph. No forbidden imports,
  affected cycles, React dependencies in domain/dataset code, or browser
  acquisition dependencies in the build contract remain.
- `bun run build` passes. After the corrected build,
  `E2E_SKIP_BUILD=1 bun run test:e2e`: **49 passing Chromium tests**, including
  two additional desktop/mobile Words draft regressions. Shared-fixture
  exception/hydration checks pass; the three static-delivery tests use bare
  Playwright fixtures without that collector.
- SHA-256 comparisons confirm both source wordsets and the generated manifest
  match the pre-refactor bytes. Static publication contract tests also pass.
- The final fetch confirms the base remains `origin/develop` at `a959f8b`.
  Full code/test diff review and staged whitespace checks pass.
- Code, tests, and module documentation committed as `7caf9b8`
  (`refactor(words): separate practice and dataset responsibilities`).
  Specification/results/proof are recorded in the following documentation commit.
- The user approved PR creation on 2026-09-05. The branch was pushed after the
  mandatory pre-push typecheck, lint, 302-test unit suite, production build and
  wordset build passed. Both source datasets and the manifest still match the
  recorded SHA-256 checksums.
- [PR #62](https://github.com/franprince/japanese-practice/pull/62) is open against
  `develop`, with visual proof and verification results. GitHub reported
  `MERGEABLE` at creation; CI and the Vercel preview were still running.
  Merging remains the user's decision.

### Visual proof

Captured the same deterministic Words fixture, English language, theme and
viewport before extraction and after the final corrected build. Inspected all
four scenes; each before/after pair has **identical decoded RGB pixels**.
Desktop full-page captures are 1280×1189; mobile captures are 390×844.

| Scene | Before | After |
| --- | --- | --- |
| Desktop gameplay | [Baseline](before/words-desktop-gameplay.png) | [Final](after/words-desktop-gameplay.png) |
| Desktop settings | [Baseline](before/words-desktop-settings.png) | [Final](after/words-desktop-settings.png) |
| Mobile gameplay | [Baseline](before/words-mobile-gameplay.png) | [Final](after/words-mobile-gameplay.png) |
| Mobile settings | [Baseline](before/words-mobile-settings.png) | [Final](after/words-mobile-settings.png) |

### Remaining limitations

Browser coverage uses the existing Chromium configuration and desktop/mobile
viewports. Existing browser-data-age, standalone-start, terminal-color and
performance-monitor notices remain. The eight lint warnings are the pre-existing
explicit-any/configuration-export warnings. Filtered-pool cache invalidation
and linguistic behavior remain unchanged, as required by the specification.
