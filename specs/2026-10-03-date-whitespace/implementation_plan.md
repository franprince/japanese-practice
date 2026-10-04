# Implementation plan

1. Apply one case/whitespace normalizer to all three comparison operands in
   `useDateGame.handleSubmit`.
2. Add reducer-backed hook cases for displayed romaji, whitespace, compact forms
   and kana, plus an incorrect-date check and a full-date browser regression.
3. Run focused Dates/shared session tests, typecheck, lint and diff checks. The
   parent task schedules production builds and browser execution.

## Verification

- Focused Dates hook/domain and shared session suites: 28 tests passed.
- Typecheck passed using `node node_modules/typescript/bin/tsc --noEmit`.
- Lint passed using `node node_modules/eslint/bin/eslint.js .` with five
  existing warnings and no errors.
- `git diff --check` passed.
- Direct tool entrypoints were used while copied dependency executable links
  were being repaired; the parent subsequently repaired those local links.
- Added browser coverage; production build and browser execution are delegated
  to the parent task to avoid concurrent build resource contention.

## Final stacked verification

Verified on stack position 5/8 with Next.js 16.3.8, React 19.2.8, and Bun 1.4.2: typecheck, lint (zero errors, five existing warnings), feature boundaries, all 383 unit tests, production build, and 5 Chromium tests pass. The build and browser server use the actual cumulative branch contents. Position 1 reuses the full browser result from the identical security worktree.

The branch `fix/review-05-date-whitespace` is prepared for a separate PR against `fix/review-04-number-syntax`. External publication/check state is recorded by GitHub.
