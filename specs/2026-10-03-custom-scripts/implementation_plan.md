# Implementation plan

Approved by the user's 2026-10-03 request to implement all reviewed fixes.

1. Extend mixed-script eligibility in `characters.ts` to Custom.
2. Cover Custom/Both mixed order and Custom single-script selections in domain tests.
3. Add browser regressions for Characters and Guess selecting both scripts.
4. Run focused unit tests, typecheck, and lint. The parent schedules builds and browser execution for the final stack.

## Final stacked verification

Verified on stack position 7/8 with Next.js 16.3.8, React 19.2.8, and Bun 1.4.2: typecheck, lint (zero errors, five existing warnings), feature boundaries, all 390 unit tests, production build, and 2 Chromium tests pass. The build and browser server use the actual cumulative branch contents. Position 1 reuses the full browser result from the identical security worktree.

The branch `fix/review-07-custom-scripts` is prepared for a separate PR against `fix/review-06-word-filter-scope`. External publication/check state is recorded by GitHub.
