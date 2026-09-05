# Tasks: Remove Ollama practice completely

- **Spec:** [spec.md](./spec.md)
- **Plan:** [implementation_plan.md](./implementation_plan.md)
- **Status:** Done — pull request pending authorization

## Runtime removal

- [x] Delete the Ollama practice page and both generated-quiz API routes.
- [x] Delete the Ollama client, feature flag, SQLite store, and background worker.
- [x] Delete the quiz curriculum and browser progress hook.
- [x] Delete quiz components and their feature-specific unit tests.

## Active configuration cleanup

- [x] Reduce the game registry to the four supported games.
- [x] Update registry tests for the permanent four-game contract.
- [x] Remove Ollama keys from all locale files and verify key parity.
- [x] Remove the obsolete robots exclusion, SQLite runtime exception, database ignore rules, and Chowa routing rules.

## Regression coverage

- [x] Add E2E request checks that all three removed routes return 404.
- [x] Confirm active source and configuration contain no removed-feature references.

## Verification

- [x] Run `bun run typecheck`.
- [x] Run `bun run lint` and confirm no new warnings.
- [x] Run `bun run test:unit`.
- [x] Run `bun run test:e2e e2e/tests/health.spec.ts`.
- [x] Run `bun run build` and inspect the generated route table.
- [x] Run locale-key parity and repository diff checks.

## Delivery

- [x] Mark the spec, plan, tasks, index, and backlog statuses complete.
- [x] Create the runtime-removal commit.
- [x] Create the architecture-documentation commit.
- [ ] Ask whether to push and open the pull request against `develop`.

## Verification results

- Active-reference scan: no matches.
- Typecheck: passed.
- Lint: passed with 59 pre-existing warnings and no errors; the removal reduced
  the baseline by two warnings.
- Unit tests: 75 passed, 0 failed.
- Focused E2E: 4 passed, including 404 checks for all removed routes.
- Production build: passed; removed routes are absent from the route table.
- Locale parity: 191 matching keys in English, Spanish, and Japanese.
- Visual proof: [four-game homepage](../../docs/visual-proof/remove-ollama-home.png)
  and [removed route 404](../../docs/visual-proof/remove-ollama-404.png).
