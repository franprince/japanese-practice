# Implementation Plan: Restore the project's quality gates

- **Spec:** [spec.md](./spec.md) — approved 2026-08-02
- **Branch:** `feat/improved-quiz-engine` (current) — see "Branching" below
- **Status:** Draft — awaiting approval

## Findings that shaped this plan

Three of the spec's open questions were resolved by investigation before
planning. They change the design:

**1. No `FlatCompat` bridge is needed.** `eslint-config-next@16.1.6` exports
native flat-config arrays (`dist/index.js` → 3 config objects,
`dist/typescript.js` → 5). The spec's fallback to composing
`@next/eslint-plugin-next` manually is unnecessary. The config file must be
**`eslint.config.mjs`** — it uses `import`, and `package.json` has no
`"type": "module"`.

**2. The `chalk` crash confirms the devDependency promotion is required.**
Running ESLint today dies with `TypeError: chalk.underline is not a
function`. ESLint 9 depends on `chalk@^4.0.0` (CommonJS), but because
`eslint` is only a hoisted transitive it has no nested copy, so Node resolves
`chalk` to the root-hoisted `chalk@5.6.2` (ESM) installed for
`semantic-release`/`marked-terminal`. Declaring `eslint` directly makes Bun
install its own nested `chalk@4`. This must be verified, not assumed.

**3. The backlog is measured, and a third of it is false positives.** A trial
run over 144 files produced **60 errors / 43 warnings (103 total, 5
autofixable)**:

| Area | Problems | Notes |
| --- | --- | --- |
| App code (`app/`, `src/`) | 64 | The real debt |
| Tooling (`e2e/`, `scripts/`, `build.ts`, `src/types/`) | 37 | Mostly inapplicable rules |
| Test files | 2 | `prefer-const`, autofixable |

All 5 `react-hooks/rules-of-hooks` **errors are false positives** in
`e2e/fixtures/index.ts`: the plugin reads Playwright's `use` fixture callback
as React's `use` hook. Likewise `@next/next/no-assign-module-variable` fires
on `scripts/build-kanjiset.ts:87`, a plain Node script. Scoping the config
removes all 37 tooling problems without silencing anything that applies.

Two errors in app code are **genuine bugs**, not style:

- `src/components/numbers/number-pad.tsx:47` — `react-hooks/purity`:
  `Math.random` called during render (the keypad shuffle), so the order can
  change on any incidental re-render.
- `app/words/page.tsx:50` — `react-hooks/immutability`: `setFilter` is read
  before its declaration, so the earlier read never observes later updates.

Both sit in application code, which the approved spec puts out of scope
(non-goal 1). They are therefore **recorded and deferred**, not fixed here.

## Files to create

| Path | Purpose |
| --- | --- |
| `eslint.config.mjs` | Flat config: ignores, Next presets, scoped overrides, baseline severities |
| `.github/workflows/ci.yml` | PR + `main` gate running typecheck / lint / test / build |

## Files to modify

| Path | Change |
| --- | --- |
| `package.json` | Add `eslint`, `eslint-config-next`, `typescript-eslint` to `devDependencies`; add `typecheck` script |
| `.gitignore` | Add `*.sqlite` and `quizzes.sqlite` |
| `.husky/pre-push` | Add typecheck + lint steps |
| `TESTING.md` | Replace `bun test` with `bun run test:unit`; refresh stale claims |
| `src/components/quiz/quiz-engine.test.tsx` | Add `bun:test` imports, `mock()`, `import type`, fixture fields |
| `src/components/quiz/unit-selector.test.tsx` | Add `bun:test` imports, `mock()` |
| `specs/INDEX.md` | Move row to Done |

Nothing under `app/`, `src/hooks/`, `src/lib/`, or `src/components/` is
touched except the two test files — satisfying acceptance criterion 10.

## Step 1 — Dependencies

Add at currently-installed versions, so `bun install --frozen-lockfile` keeps
resolving what is already on disk:

```
eslint             ^9.39.2
eslint-config-next ^16.1.6
typescript-eslint  ^8.54.0
```

`eslint-plugin-react-hooks@7.0.1` and `@eslint/eslintrc@3.3.3` stay
transitive — they are pulled in by `eslint-config-next` and not imported
directly by our config.

Run `bun install`, then **verify the chalk fix**: `bunx eslint --version` and
a formatted run must not throw. If a nested `chalk@4` does not appear under
`node_modules/eslint/`, fall back to a `resolutions`/`overrides` entry
pinning ESLint's chalk to `^4`, and note it in the config header.

## Step 2 — `eslint.config.mjs`

Layered, most general first:

1. **`ignores`** — `.next/`, `node_modules/`, `test-results/`,
   `playwright-report/`, `public/`, `data/`, `*.tsbuildinfo`,
   `next-env.d.ts`, `.vercel/`.
2. **`...next`, `...nextTs`** — the two upstream presets.
3. **Tooling override** (`e2e/**`, `scripts/**`, `build.ts`,
   `src/types/**`): disable `react-hooks/*` (Playwright `use` is not a React
   hook), `@next/next/*` (not Next app code), and
   `@typescript-eslint/no-explicit-any` (build scripts and ambient type
   shims legitimately use `any`). Clears all 37.
4. **Test override** (`**/*.test.ts`, `**/*.test.tsx`): allow `any` and
   unused vars in fixtures.
5. **Baseline severities**, each with a comment naming the follow-up spec:
   - `@typescript-eslint/no-unused-vars` → `warn` (33 in app code; already
     warn-severity upstream)
   - `@typescript-eslint/no-explicit-any` → `warn` (11 in app code)
   - `react-hooks/set-state-in-effect` → `warn` (12; new React-Compiler-era
     rule, largely legitimate localStorage hydration)
   - `react-hooks/purity`, `react-hooks/immutability` → **`warn` with an
     inline `TODO` naming the two files above**, so the two real bugs stay
     visible rather than disappearing

Every other rule keeps upstream severity, so genuinely new problems still
fail. Then run `bunx eslint . --fix` for the 5 autofixable items (expected:
`prefer-const`, 2 of them in test files).

**Target: `bun run lint` exits 0 with ~100 warnings and 0 errors.** If any
error survives scoping, it is reported before being downgraded — no blanket
`eslint-disable`.

## Step 3 — Typecheck fixes

`src/components/quiz/quiz-engine.test.tsx`:

- `import { describe, it, expect, mock } from "bun:test";` — matching
  `game-registry.test.ts:2` and `input.test.ts:2`
- `jest.fn()` → `mock()`
- `import { QuizEngine, type DbQuizQuestion }` and `import type
  { QuizQuestion }` (fixes `TS1484`)
- Add `meaning` and `unitId` to both `mockQuestions` entries (fixes
  `TS2739`). Values must not change assertions — `meaning` is rendered in the
  explanation panel, so use text no existing `getByText` matches.

`src/components/quiz/unit-selector.test.tsx`: same import treatment;
`jest.fn()` → `mock()` in all three tests.

**Target: `bunx tsc --noEmit` exits 0, `bun test src` still 66/66.**

## Step 4 — `package.json` script

```json
"typecheck": "tsc --noEmit"
```

## Step 5 — `.github/workflows/ci.yml`

Triggers: `pull_request`, and `push` to `main`. One `ubuntu-latest` job:
checkout → `oven-sh/setup-bun@v1` → `bun install --frozen-lockfile` → four
named steps (`bun run typecheck`, `bun run lint`, `bun run test:unit`, `bun
run build`) so a failure identifies itself.

Notes: no `fetch-depth: 0` (that is a semantic-release need). Playwright is
excluded per non-goal. `wordset:build` is not run — CI has no reason to
regenerate data, and `.husky/pre-push` already skips it when `CI` is set.

## Step 6 — `.gitignore`

Append `*.sqlite` and `quizzes.sqlite` under a "generated quiz database"
comment. The file is currently untracked, so no `git rm --cached` is needed —
confirm with `git status --porcelain` after.

## Step 7 — `.husky/pre-push`

Add `bun run typecheck` and `bun run lint` before the existing test/build
steps (fail fast on the cheap checks). Preserve the existing `CI` guard that
skips `wordset:build`.

## Step 8 — `TESTING.md`

Fix `bun test` → `bun run test:unit`, and explain why: bare `bun test`
collects the Playwright specs under `e2e/` and fails with 7 errors. Also drop
the stale "Current Limitations" note claiming React 19 + happy-dom component
rendering may not work — the quiz component tests render fine — and correct
the example path `src/lib/game-registry.test.ts` → `src/lib/core/__tests__/`.

## Test plan

No new test files. The change is to the gates themselves, so verification is
running them:

| # | Check | Expected |
| --- | --- | --- |
| 1 | `rm -rf node_modules && bun install --frozen-lockfile` | Succeeds; lockfile unchanged |
| 2 | `bun run lint` | Exit 0, readable output, no chalk crash |
| 3 | `bun run typecheck` | Exit 0, no output |
| 4 | `bun run test:unit` | 66/66 pass |
| 5 | `bun run build` | Succeeds |
| 6 | `git status --porcelain` | No `quizzes.sqlite` |
| 7 | Introduce a deliberate type error, run `bun run typecheck` | **Fails** — proves the gate bites; then revert |
| 8 | Same for an `eslint` error-severity rule | **Fails**; then revert |
| 9 | `bunx tsc --noEmit` with `eslint.config.mjs` present | No new errors from the config file |

Steps 7 and 8 matter most: a gate that passes because it checks nothing is
the problem being fixed.

CI itself can only be fully verified once the workflow is on a branch with an
open PR — flagged as a post-merge confirmation.

## Commits

Atomic, Conventional Commits, matching the repo's existing scopes:

1. `build: add eslint, eslint-config-next and typescript-eslint as devDependencies`
2. `build: add flat eslint config with scoped tooling overrides`
3. `fix(quiz): add bun:test imports and required fixture fields to quiz tests`
4. `build: add typecheck script`
5. `ci: run typecheck, lint, tests and build on pull requests`
6. `chore: ignore generated quizzes.sqlite database`
7. `chore: run typecheck and lint in the pre-push hook`
8. `docs: correct test commands in TESTING.md`

Commits 1 and 2 stay separate (dependency change vs. config), but the
`--fix`ed `prefer-const` changes ride with commit 2 since they only exist
because the config does.

## Branching

Current branch `feat/improved-quiz-engine` already carries unrelated
uncommitted work: the `speakerMatch` narrowing fix in `quiz-engine.tsx`, a
`baseline-browser-mapping` devDependency, and `bun.lock`. **This work should
go on a separate branch off `main`** — it is infrastructure, not quiz
features, and mixing them makes both harder to review.

Proposed: branch `chore/restore-quality-gates` from `main`. The pre-existing
uncommitted changes stay where they are and are not swept into these commits.

**Decision needed:** whether to branch from `main` as proposed, or continue
on `feat/improved-quiz-engine`.

## Risks

| Risk | Mitigation |
| --- | --- |
| Nested `chalk@4` does not materialise | Fall back to an explicit override; verify in step 1 before proceeding |
| Pinning transitives conflicts with `next`'s resolution | Use installed versions; `--frozen-lockfile` check is test 1 |
| Baseline downgrades hide future regressions | Only 5 rules downgraded, each commented; all other rules keep upstream severity |
| The 2 real bugs get forgotten | Recorded here and in config comments; follow-up spec proposed immediately after |
| CI newly blocks merges | Expected and intended; the gates pass locally first |

## Follow-up specs proposed

1. **`fix-react-hooks-violations`** — the `Math.random`-during-render shuffle
   in `number-pad.tsx` and the `setFilter` ordering in `words/page.tsx`.
2. **`reduce-any-and-unused`** — burn down the 33 unused-var and 11
   `no-explicit-any` warnings, then promote both back to `error`.
3. **`e2e-in-ci`** — Playwright with browser caching and a server harness.
