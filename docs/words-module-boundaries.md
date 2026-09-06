# Words module boundaries

Words practice and dataset acquisition have separate public contracts. Pages
compose the UI, hooks own React state and session admission, domain functions
return questions/answer evaluations, and the dataset service owns acquisition.

## Public entry points

| Consumer | Entry point | Contract |
| --- | --- | --- |
| Pages outside the Words UI directory | `@/components/words` | Game card, settings overlay and consent modal |
| Practice hooks and other game components | `@/lib/japanese/words` | Vocabulary/character selection, conversion, question loading, evaluation and practice types |
| Runtime dataset consumers | `@/lib/japanese/wordsets` | Acquisition service, errors, lifecycle types, metadata fetch, policy and loader convenience operations |
| Publisher and static-data fixtures | `@/lib/japanese/wordsets/build` | Dataset/manifest validation and metadata types, with no browser acquisition dependency |

These entry points use named exports. Implementations import their own direct
dependencies rather than importing their own barrel. A Words domain module may
consume the dataset public entry point; datasets do not depend on practice logic.

## Ownership and reasons to change

### Settings and the game hook

- `words-settings-overlay.tsx` coordinates the controlled dialog, one mounted
  editing draft, Apply/Cancel and Custom scrolling. It changes when the editing
  lifecycle changes.
- `settings/mode-section.tsx` renders mode and game-type choices;
  `session-section.tsx` renders play mode and targets; `filter-section.tsx`
  renders group/length controls. Each receives values and callbacks; filter changes forward functional updates
  to the shell so batched edits compose. These
  modules change for their controls' presentation and interactions.
- `use-word-game.ts` owns question/input/loading state, request identity,
  stale-result rejection, focus, character diagnostics and session admission.
  It changes when the local React lifecycle changes. `useBaseGame` and the
  shared session reducer still admit outcomes and own score/streak/completion.

Opening settings creates a draft from committed values. Closing discards it.
The page retains its existing order-sensitive comparison when applying settings;
the hook separately normalizes filter-group order for question identity.

### Practice domain (`src/lib/japanese/words`)

| Module | Responsibility |
| --- | --- |
| `filtering.ts` | Candidate pool composition, blacklist/group/length filtering, cache keys and mobile sampling cap |
| `selection.ts` | Vocabulary acquisition, filtered-pool cache and final random selection |
| `characters.ts` | Dictionary initialization and character/script/group generation policies |
| `romaji.ts` | Synchronous kana conversion and its spelling rules |
| `question.ts` | Game-type selection and Guess distractor construction |
| `evaluation.ts` | Direct answer validation and optional asynchronous character diagnostics |

`loadWordQuestion` accepts mode, game type, filter and language and returns the
selected word, optional options and any original load error. Empty pools return
null. A distractor failure preserves the previously selected primary word, as
before. The caller logs errors and admits only results from its current request.

`evaluateWordAnswer` returns direct/Guess results synchronously; diagnostic work
returns a Promise. The hook retains synchronous session admission for direct
answers, guards delayed diagnostics, and accumulates admitted character errors.
The evaluator never submits events or changes a prior question/diagnostic map.

Filtering and generated choices do not mutate source data. The filtered cache
keeps the existing mode/language/device/group/length key and process lifetime.
It does not gain checksum invalidation: the existing update notification still
asks the visitor to refresh. Character generation awaits dictionary data;
`kanaToRomaji` keeps its synchronous map lookup and the exported `characterGroups`
keeps its historical import-time snapshot.

### Datasets (`src/lib/japanese/wordsets`)

| Module | Responsibility |
| --- | --- |
| `contracts.ts` | Shared metadata, transport, storage and lifecycle types |
| `errors.ts` | Single error-class identities and failure classification |
| `policy.ts` | Language/device policy and persistent key/confirmation access |
| `validation.ts` | Complete dataset shape validation without mutation |
| `manifest.ts` | Pure manifest schema and immutable asset-path validation |
| `transport.ts` | Manifest revalidation, streamed downloads, progress and integrity checks |
| `storage.ts` | IndexedDB transaction completion, cancellation and cleanup |
| `acquisition.ts` | Memory, shared requests, lifecycle snapshots/events, revalidation and the default service instance |
| `loader.ts` | Existing convenience signatures delegating to that service |

The service still owns consent, durable read-back, desktop memory fallback,
subscriber notification, shared cancellation and background refresh semantics.
`WordsetError` and `ConsentRequired` keep one class definition for `instanceof`
consumers. `core/db.ts` remains shared with Kanji, with unchanged database and
store names/version. See [static delivery](static-wordsets.md) for the unchanged
artifact, validation, cache and deployment contract.

## Enforcement and tests

Run `bun run check:boundaries` for the import graph. The normal `bun test src`
gate also runs fixture tests and a real repository graph assertion, so CI and
the existing pre-push checks enforce it.

The checker parses TypeScript/JavaScript and resolves paths using `tsconfig.json`.
It checks alias/relative imports, re-exports, type edges and literal dynamic
imports/require calls. It rejects deep feature imports from outside consumers,
self-barrel dependencies, wildcard public exports, unresolved or computed
dependencies in the guarded graph, and cycles touching the affected modules.
Traversal follows shared/core/type intermediaries, including local declarations.
It ignores unrelated cycles and does not traverse third-party packages or asset
contents. Generated output and installed dependencies are outside the inventory.

Domain/dataset paths cannot reach React, UI hooks/components or pages. Dataset
paths cannot reach practice logic. The build entry point cannot reach acquisition,
storage, browser policy or `core/db.ts`; neutral contracts/errors cannot depend
on orchestration. Use leaf type imports: broad `@/types` and `@/lib/i18n` barrels
can bring React into the dependency graph through re-exports.

Focused unit tests within a feature directory may import that feature's internal
modules. Hook/page tests and general `src/test`, E2E and publisher consumers use
the public contracts. Tests remain subject to import rules, but are excluded
from production cycle/layer traversal. Affected UI consumers use the existing
shared public barrel for dictionary/validation helpers.

Contract tests cover the extracted functions and adapter boundaries; integration
tests retain real session/lifecycle behavior. Browser tests exercise the built
application, including desktop/mobile controls, consent, draft cancellation,
answer locking, session completion/restart and hydration.
