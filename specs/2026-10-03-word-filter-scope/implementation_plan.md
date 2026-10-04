# Implementation plan

Approved by the user's request to implement all reviewed fixes on 2026-10-03.

1. Resolve a gameplay filter from the active subject separately from the settings draft.
2. Use complete matching groups and default length for explicit subjects; retain the saved Custom filter.
3. Add focused domain and browser tests for script/length ownership and saved draft preservation.
4. Run focused units, typecheck, and lint. The parent schedules stack builds and browser verification.

## Final stacked verification

Verified on stack position 6/8 with Next.js 16.3.8, React 19.2.8, and Bun 1.4.2: typecheck, lint (zero errors, five existing warnings), feature boundaries, all 387 unit tests, production build, and 14 Chromium tests pass. The build and browser server use the actual cumulative branch contents. Position 1 reuses the full browser result from the identical security worktree.

The branch `fix/review-06-word-filter-scope` is prepared for a separate PR against `fix/review-05-date-whitespace`. External publication/check state is recorded by GitHub.
