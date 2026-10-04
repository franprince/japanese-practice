# Implementation plan

1. Update `getRandomOptions` in the Kanji domain to exclude the correct reading,
   reject empty readings, then remove a selected distractor character and reading from remaining entries.
2. Add focused domain regressions for aliases, whitespace, duplicate distractors
   and exhausted pools; add a deterministic browser regression.
3. Run Kanji and shared session tests, typecheck, lint and diff checks. The parent
   task schedules production builds and browser execution across the PR stack.

## Verification

- Focused Kanji domain and shared session suites: 19 tests passed.
- `bun run typecheck` passed.
- `bun run lint` passed with five existing warnings and no errors.
- `git diff --check` passed.
- Added browser coverage; production build and browser execution are delegated
  to the parent task to avoid concurrent build resource contention.

## Final stacked verification

Verified on stack position 2/8 with Next.js 16.3.8, React 19.2.8, and Bun 1.4.2: typecheck, lint (zero errors, five existing warnings), feature boundaries, all 325 unit tests, production build, and 5 Chromium tests pass. The build and browser server use the actual cumulative branch contents. Position 1 reuses the full browser result from the identical security worktree.

The branch `fix/review-02-kanji-options` is prepared for a separate PR against `fix/review-01-next-security`. External publication/check state is recorded by GitHub.
