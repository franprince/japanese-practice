# Spec: Restore the project's quality gates

- **Date:** 2026-08-02
- **Slug:** `restore-quality-gates`
- **Status:** Draft — awaiting approval

## Problem statement

The repo advertises four quality gates (`test`, `lint`, `build`, plus strict
TypeScript). Only two of them actually run, and nothing enforces any of them
outside a bypassable local hook.

Verified on `feat/improved-quiz-engine` at commit `b9fd2fc`:

| Gate | Command | Current state |
| --- | --- | --- |
| Unit tests | `bun test src` | Passes — 66/66 |
| Build | `bun run build` | Passes |
| Lint | `bun run lint` | **Fails to start.** ESLint 9 requires `eslint.config.js`; the repo has none |
| Typecheck | `bunx tsc --noEmit` | **25 errors**, all in the two quiz test files |
| CI | `.github/workflows/release.yml` | Runs `semantic-release` on `main` only. No job runs tests, types, lint, or build |

Three consequences follow:

1. **Type errors ship undetected.** `next build` does not type-check test
   files, and `tsc --noEmit` is in no hook and no workflow, so the 25 errors
   introduced with the quiz feature went unnoticed across ~10 commits.
2. **Lint has never run.** Because `bun run lint` fails at the config-loading
   step rather than on a rule, the failure looks like tooling noise and no
   accumulated violations are known.
3. **The only enforcement is `.husky/pre-push`**, which runs `bun test src`
   and `bun run build`. It is skippable with `--no-verify`, covers neither
   lint nor typecheck, and does not exist for contributors who clone without
   running `bun install`.

Separately, `quizzes.sqlite` — a generated SQLite database at the repo root —
is untracked and absent from `.gitignore`, so a routine `git add .` commits a
binary artifact.

### Root causes

**Lint.** No `eslint.config.js` exists. Additionally `eslint`,
`eslint-config-next`, `eslint-plugin-react-hooks`, and `typescript-eslint`
are present in `node_modules` only as hoisted transitive dependencies of
`next` — none appear in `package.json`. A config written against them would
work locally and break on a clean install or in CI.

**Typecheck.** The 25 errors reduce to four mechanical causes in
`src/components/quiz/quiz-engine.test.tsx` and
`src/components/quiz/unit-selector.test.tsx`:

- Neither file imports `describe`/`it`/`expect` from `bun:test`. Bun injects
  them at runtime, so the tests pass, but TypeScript does not see them —
  hence `TS2582`/`TS2304`. Every other test file in the repo imports them
  explicitly (`game-registry.test.ts:2`, `input.test.ts:2`), so this is a
  deviation from existing convention, not a missing type package.
- `jest.fn()` is used for mocks (`TS2304`). Bun's Jest-compat global has no
  type declaration; the project equivalent is `mock()` from `bun:test`.
- `DbQuizQuestion` and `QuizQuestion` are imported as value imports while
  `verbatimModuleSyntax` is on (`TS1484`).
- The `mockQuestions` fixtures predate `meaning` and `unitId` becoming
  required on `QuizQuestion` (`TS2739`).

## Goals

1. `bun run lint` executes and reports real results on a clean install.
2. `bunx tsc --noEmit` exits zero.
3. A CI workflow runs typecheck, lint, unit tests, and build on every pull
   request and on pushes to `main`, independently of any local hook.
4. `quizzes.sqlite` cannot be committed by accident.
5. The pre-push hook and `TESTING.md` describe commands that actually work.

## Non-goals

- **No behavior changes to application code.** Test fixtures and test-file
  imports are in scope; `quiz-engine.tsx` and other source files are not,
  beyond what a lint autofix would touch.
- **Not fixing the P1/P2 findings** — SQLite persistence under Docker, the
  unauthenticated generation endpoints, `seenIds` validation, quiz i18n, and
  dark-mode contrast are separate specs.
- **Not adopting a strict lint ruleset.** The goal is a running gate at a
  baseline that passes today. Tightening rules comes later.
- Not adding e2e (Playwright) to CI in this pass — it needs a browser
  install and a running server, and belongs in its own change.
- Not changing the release workflow's semantic-release behavior.

## Proposed shape

**ESLint.** Flat config at `eslint.config.js`, built on `eslint-config-next`
via the FlatCompat bridge, with `typescript-eslint` for TS rules. Ignore
`.next/`, `node_modules/`, `test-results/`, `playwright-report/`, `public/`,
and generated wordset data. Promote `eslint`, `eslint-config-next`, and
`typescript-eslint` to explicit `devDependencies` at their currently
installed versions.

> Note: the file must be `eslint.config.js`, not `.mjs`, only if the flat
> config can be authored as CommonJS. `package.json` has no `"type":
> "module"`, so ESM syntax requires `eslint.config.mjs`. The implementation
> plan will pin this down.

**Typecheck.** Add the missing `bun:test` imports, replace `jest.fn()` with
`mock()`, convert the two type imports to `import type`, and extend the
`mockQuestions` fixtures with `meaning` and `unitId`. No production code
changes.

**CI.** New `.github/workflows/ci.yml`: on `pull_request` and `push` to
`main`, one job on `ubuntu-latest` — checkout, setup Bun, `bun install
--frozen-lockfile`, then typecheck, lint, unit tests, and build as separate
named steps so a failure identifies itself.

**Scripts.** Add `typecheck` (`tsc --noEmit`) to `package.json`. Extend
`.husky/pre-push` to run typecheck and lint alongside the existing test and
build steps.

**Ignore.** Add `quizzes.sqlite` (and `*.sqlite`) to `.gitignore`.

**Docs.** Correct `TESTING.md`, which currently instructs `bun test` — that
command collects the Playwright specs under `e2e/` and fails with 7 errors.
The working command is `bun run test:unit`.

## Edge cases

- **Lint surfaces a large backlog.** Likely, since it has never run. If the
  baseline cannot be made green by autofix plus narrowly-scoped rule
  downgrades, the excess is recorded and deferred rather than silenced
  wholesale — the gate must fail on genuinely new problems.
- **`eslint-config-next` needs Next's plugin resolution.** If the FlatCompat
  bridge misbehaves under ESLint 9, fall back to composing
  `@next/eslint-plugin-next` rules directly.
- **Version drift.** Pinning transitives as direct devDependencies can
  conflict with what `next` resolves. Use the installed versions and verify
  `bun install --frozen-lockfile` still succeeds.
- **Hook slowdown.** Adding two steps lengthens every push. Acceptable:
  typecheck and lint are fast relative to the build already there.
- **`tsconfig.json` includes `**/*.ts`**, so `eslint.config.js` and any new
  config files must not introduce new typecheck errors.
- **CI must not run `wordset:build`** — the pre-push hook already special-
  cases `CI` to skip it, and the release workflow depends on that.

## Acceptance criteria

1. `bun run lint` completes and reports results (exit 0) on a clean
   `bun install --frozen-lockfile`.
2. `bunx tsc --noEmit` exits 0 with no output.
3. `bun test src` still passes 66/66, with no test rewritten to accommodate
   the type fixes.
4. `bun run build` still succeeds.
5. `.github/workflows/ci.yml` exists, triggers on `pull_request` and on
   `push` to `main`, and runs all four gates as distinct steps.
6. `git status --porcelain` does not list `quizzes.sqlite`.
7. `eslint`, `eslint-config-next`, and `typescript-eslint` appear in
   `package.json` `devDependencies`.
8. `.husky/pre-push` runs typecheck and lint in addition to tests and build.
9. Every command shown in `TESTING.md` runs successfully as written.
10. No file under `app/`, `src/hooks/`, `src/lib/`, or `src/components/`
    changes except the two quiz test files (and any purely mechanical lint
    autofix, listed explicitly at review time).
