# Spec: Remove Ollama practice completely

- **Date:** 2026-09-04
- **Slug:** `remove-ollama-practice`
- **Status:** Done — implemented and verified 2026-09-04
- **Target branch:** `develop`
- **Working branch:** `chore/remove-ollama-practice`

## Problem statement

The experimental Ollama practice feature is hidden by default but remains an
active application subsystem. Its public API routes can invoke model work
without authentication or rate limiting. Its quiz bank uses a SQLite file in
the application working directory, and its background-generation lock exists
only within one server process. These assumptions conflict with immutable,
ephemeral, or horizontally scaled deployments.

Keeping the subsystem behind a navigation feature flag does not remove its
operational, security, maintenance, or dependency cost. The product decision
is to remove it rather than productionize it.

## Goals

1. Remove every active page and API route belonging to Ollama practice.
2. Remove its model client, SQLite store, background worker, feature flag,
   progress hook, curriculum, UI components, and tests.
3. Remove its game-registry entry and locale strings.
4. Remove deployment, ignore, and routing configuration needed only by this
   subsystem.
5. Preserve the four supported games: words, numbers, kanji, and dates.
6. Leave no generated production route or active code reference for the
   removed feature.

## Removal inventory

### Delete

- `app/practice/ollama/page.tsx`
- `app/api/generate-quiz/route.ts`
- `app/api/quizzes/route.ts`
- `src/lib/core/ollama.ts`
- `src/lib/core/feature-flags.ts`
- `src/lib/server/db.ts`
- `src/lib/server/quiz-worker.ts`
- `src/lib/japanese/curriculum.ts`
- `src/hooks/use-quiz-progress.ts`
- `src/components/quiz/quiz-engine.tsx`
- `src/components/quiz/quiz-engine.test.tsx`
- `src/components/quiz/unit-selector.tsx`
- `src/components/quiz/unit-selector.test.tsx`

### Edit

- `src/lib/core/game-registry.ts`: retain only the four supported game
  definitions and remove feature-flag filtering.
- `src/lib/core/__tests__/game-registry.test.ts`: remove Ollama-specific tests
  and continue verifying the supported registry contract.
- `src/locales/en.json`, `src/locales/es.json`, `src/locales/ja.json`: remove
  Ollama title and description keys.
- `app/robots.ts`: remove the obsolete `/practice/ollama` disallow entry while
  retaining `/api/` policy.
- `next.config.mjs`: remove the `bun:sqlite` external-package exception.
- `.gitignore`: remove quiz-database ignore rules if no SQLite usage remains.
- `chowa.config.mjs`: remove routing comments and rules that exist only for
  Ollama/SQLite work.
- `specs/INDEX.md`: register this specification.

## Historical records

Existing changelog entries and dated specifications describe work that really
happened. They remain unchanged. Searches that include project history can
therefore still find `Ollama`, but searches limited to active application and
configuration files must not.

The removal does not migrate or delete the browser's old
`ollama-quiz-progress` local-storage value. With all readers removed, it is
inert. Clearing user storage for an already hidden feature would add code and
runtime behavior solely for cleanup.

## Inputs and outputs

The removal introduces no new runtime inputs or schemas.

The following routes cease to exist and must return the framework's normal
404 response:

- `GET /practice/ollama`
- `POST /api/generate-quiz`
- `POST /api/quizzes`

The home-page game registry contains exactly these IDs:

```text
romaji, numbers, kanji, dates
```

## Non-goals

- Replace Ollama with another model provider.
- Retain reusable quiz infrastructure for a hypothetical future feature.
- Migrate old generated questions or local progress.
- Rewrite historical specifications or changelog entries.
- Address wordset, session-state, React lifecycle, or module-decomposition
  work tracked separately in `specs/BACKLOG.md`.

## Edge cases

1. Removing the curriculum must not affect the four supported games; it is
   currently imported only by Ollama-specific modules.
2. Removing `bun:sqlite` configuration must not affect Bun-based scripts or
   tests; SQLite is the only capability being removed.
3. Locale JSON must remain valid and maintain identical key sets across
   English, Spanish, and Japanese.
4. The `/api/` robots exclusion remains after removing the practice-page
   exclusion.
5. The game registry remains a stable exported array for the homepage and
   retains unique IDs and hrefs.
6. Old local-storage data remains harmless because no active code reads it.

## Acceptance criteria

1. The removal inventory is deleted or edited exactly as specified.
2. `rg -n -i 'ollama|quiz-worker|quizzes\.sqlite|generate-quiz|ENABLE_OLLAMA'`
   returns no matches in active application, source, package, Docker, Next,
   Chowa, or locale configuration files.
3. Production build output contains no `/practice/ollama`,
   `/api/generate-quiz`, or `/api/quizzes` route.
4. `GAMES` contains exactly `romaji`, `numbers`, `kanji`, and `dates` in the
   existing order.
5. Registry tests verify required fields and unique IDs/hrefs for those four
   games.
6. No `bun:sqlite` import or `serverExternalPackages` exception remains.
7. `bun run typecheck` passes.
8. `bun run lint` passes without new warnings.
9. `bun run test:unit` passes.
10. `bun run build` passes.
11. The repository diff contains no unrelated application changes.

## Clarification decisions

The phrase “remove the feature completely” is interpreted as removal of every
active runtime, UI, test, and configuration artifact. Historical dated specs
and changelog records remain because altering them would falsify project
history. No unresolved product decision remains in this specification.
