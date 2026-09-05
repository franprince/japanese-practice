# Tasks

- [x] Audit suite and record scope and plan.
- [x] Isolate server and stabilize shared fixtures/helpers.
- [x] Strengthen all game and language assertions.
- [x] Expand download lifecycle browser coverage.
- [x] Wire CI and document test commands.
- [x] Fix the three narrowly scoped bugs exposed by the regressions.
- [x] Verify full suite and repeat without retries; commit changes.

## Verification (2026-09-05)

- `bun run typecheck`: pass.
- `bun run lint`: 0 errors, 52 existing warnings.
- `bun run test:unit`: 121 pass, 0 fail.
- Production build: pass (built by the E2E server command).
- `E2E_SKIP_BUILD=1 bun run test:e2e --repeat-each=2 --retries=0`:
  68/68 pass, covering all 34 scenarios twice in 1.4 minutes.
- `git diff --check`: pass.
- CI workflow updated; remote execution awaits a follow-up PR.

Scope limits: Chromium only; narrow-viewport checks do not emulate physical
devices. Service workers are blocked. Runner timings are not an INP benchmark.
