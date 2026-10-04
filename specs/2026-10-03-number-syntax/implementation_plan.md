# Implementation plan

1. Track the pending digit, descending small units and single 万 boundary in
   `japaneseToArabic`. Reject invalid tokens and syntax rather than ignoring them.
2. Add exhaustive domain round trips and targeted accepted/rejected examples.
   Add a reducer-backed hook regression and a user-visible keypad regression.
3. Run focused Numbers/shared session tests, typecheck, lint and diff checks.
   The parent task schedules production builds and browser execution.

## Verification

- Focused Numbers domain, hook and shared session suites: 49 tests passed,
  including all 99,999 generated practice numerals.
- `bun run typecheck` passed.
- `bun run lint` passed with five existing warnings and no errors.
- `git diff --check` passed.
- Added browser coverage; production build and browser execution are delegated
  to the parent task to avoid concurrent build resource contention.

## Final stacked verification

Verified on stack position 4/8 with Next.js 16.3.8, React 19.2.8, and Bun 1.4.2: typecheck, lint (zero errors, five existing warnings), feature boundaries, all 377 unit tests, production build, and 6 Chromium tests pass. The build and browser server use the actual cumulative branch contents. Position 1 reuses the full browser result from the identical security worktree.

The branch `fix/review-04-number-syntax` is prepared for a separate PR against `fix/review-03-word-particles`. External publication/check state is recorded by GitHub.
