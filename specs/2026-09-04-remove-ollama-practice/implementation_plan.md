# Implementation plan: Remove Ollama practice completely

- **Spec:** [spec.md](./spec.md) — approved 2026-09-04
- **Status:** Done — implemented and verified 2026-09-04
- **Target branch:** `develop`
- **Working branch:** `chore/remove-ollama-practice`

## Delivery strategy

Implement the removal as one pull request with two atomic Conventional
Commits. The first commit removes the executable subsystem and updates its
focused tests. The second commit records the architecture backlog and marks
the removal documents complete. This keeps the runtime change reviewable
without separating documentation that defines its intent.

No compatibility shim, redirect, or tombstone route will remain. Next.js will
serve its normal 404 response for all removed paths.

## Change set 1 — Remove executable quiz subsystem

### Delete route surfaces

- Delete `app/practice/ollama/page.tsx`.
- Delete `app/api/generate-quiz/route.ts`.
- Delete `app/api/quizzes/route.ts`.
- Remove `/practice/ollama` from `app/robots.ts`; retain `/api/`.

Deleting the route directories leaves no page or handler that can invoke the
model client or open the quiz database.

### Delete server and domain implementation

- Delete `src/lib/core/ollama.ts`.
- Delete `src/lib/core/feature-flags.ts`.
- Delete `src/lib/server/db.ts`.
- Delete `src/lib/server/quiz-worker.ts`.
- Delete `src/lib/japanese/curriculum.ts`.
- Delete `src/hooks/use-quiz-progress.ts`.

After deletion, remove empty directories only when Git no longer tracks any
file within them. The browser IndexedDB module at `src/lib/core/db.ts` stays;
it is unrelated to the server SQLite store.

### Delete quiz presentation and focused tests

- Delete `src/components/quiz/quiz-engine.tsx` and its test.
- Delete `src/components/quiz/unit-selector.tsx` and its test.

These components have no consumer outside the removed page. Retaining them as
generic infrastructure would conflict with the approved complete-removal
scope.

### Simplify game registry

Edit `src/lib/core/game-registry.ts` to:

1. Remove the feature-flag import.
2. Rename or replace `ALL_GAMES` with the exported `GAMES` constant.
3. Remove the Ollama definition.
4. Remove `buildGamesList`, because conditional registry construction no
   longer has a caller or product purpose.
5. Keep the existing four definitions and order unchanged.

Edit `src/lib/core/__tests__/game-registry.test.ts` to:

1. Import only `GAMES`.
2. Assert the exact ordered ID list:
   `romaji`, `numbers`, `kanji`, `dates`.
3. Run required-property validation over `GAMES`.
4. Retain unique-href and per-game route checks.
5. Remove all feature-flag and Ollama cases.

### Remove translations and runtime configuration

- Delete `games.ollama.title` and `games.ollama.description` from all three
  locale JSON files.
- Remove `serverExternalPackages: ["bun:sqlite"]` from `next.config.mjs` and
  leave `output: "standalone"` intact.
- Remove `*.sqlite` and `quizzes.sqlite` from `.gitignore`, including their
  obsolete explanatory comment.
- Remove the Ollama security-routing rule and SQLite architecture-routing
  rule from `chowa.config.mjs`. Preserve unrelated mechanical, refactor, and
  debug routing policy.

### Add route-removal regression coverage

Extend `e2e/tests/health.spec.ts` with a separate describe block that checks:

- `GET /practice/ollama` returns 404.
- `POST /api/generate-quiz` returns 404.
- `POST /api/quizzes` returns 404.

Use Playwright's request fixture so the test verifies the actual Next.js route
table without depending on page text or framework-specific 404 markup.

## Change set 2 — Finalize specification and backlog

After implementation and verification:

- Create `tasks.md` from the approved plan before changing runtime code.
- Mark completed task checkboxes as work finishes.
- Set the spec and plan status to `Done` only after every acceptance criterion
  passes.
- Update the removal row in `specs/INDEX.md` to `Done` with links to the plan
  and tasks.
- Update PR 1's status in `specs/BACKLOG.md` to done while leaving PRs 2–6
  proposed and independently scoped.

Historical dated specifications and `CHANGELOG.md` remain untouched.

## Verification plan

Run checks in this order:

1. **Active-reference scan**

   ```sh
   rg -n -i 'ollama|quiz-worker|quizzes\.sqlite|generate-quiz|ENABLE_OLLAMA' \
     app src package.json next.config.mjs Dockerfile chowa.config.mjs \
     .gitignore
   ```

   Expected result: no matches.

2. **Type checking:** `bun run typecheck`.
3. **Lint:** `bun run lint`; compare warnings with the pre-removal baseline and
   confirm this change adds none.
4. **Unit tests:** `bun run test:unit`.
5. **Focused E2E:** `bun run test:e2e e2e/tests/health.spec.ts`.
6. **Production build:** `bun run build`; inspect the printed route table and
   confirm all three removed routes are absent.
7. **Locale parity:** compare sorted JSON keys across `en`, `es`, and `ja`.
8. **Repository diff:** inspect `git diff --check`, `git diff`, and
   `git status --short` for unrelated changes.

Ten feature-specific tests are removed: six belong to the two deleted quiz
components and four cover Ollama registry gating. One exact four-game registry
contract test replaces the gating cases, so the suite decreases from 84 to 75
tests. Passing the smaller suite does not represent lost coverage for supported
behavior.

## Visual proof

This pull request deletes a UI page. Capture proof for the PR description:

1. A request or browser screenshot showing `/practice/ollama` returns the
   standard 404 page after removal.
2. A homepage screenshot showing only the four supported game tiles.

Store both reviewed screenshots under `docs/visual-proof/` so the PR
description can link to evidence available from the branch.

The homepage is expected to look unchanged under the default feature-flag-off
configuration. The meaningful visible change is that direct navigation to the
removed page no longer shows an unavailable experimental screen.

## Commit plan

1. `chore(quiz): remove Ollama practice subsystem`
   - All active code, route, configuration, locale, and test changes.
2. `docs(architecture): add remediation backlog`
   - Backlog, specification, implementation plan, tasks, and index status.

Before each commit, inspect the staged diff and confirm that the commit stands
alone. Do not push or open the PR until both commits and all verification gates
are complete.

## Rollback

Revert the runtime commit to restore the feature as one coherent unit. No data
migration or external resource change occurs, so rollback requires no database
or infrastructure action. Old browser-local progress remains untouched in
both directions.
