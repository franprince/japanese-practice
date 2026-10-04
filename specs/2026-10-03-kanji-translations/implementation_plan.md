# Implementation plan

Authorization: the user's request to fix each reviewed finding separately authorizes this scope, specification, plan, and execution.

1. Read previous Spanish meanings into a dedicated lookup in `scripts/build-kanjiset.ts`.
2. Add that lookup after the Spanish source dictionary in the existing base-dictionary fallback, retaining source precedence and all other fallback behavior.
3. Run the builder as a child process against four temporary entries. Block external fetches and verify preserved translations, source precedence, empty/missing meanings, reused English/readings/JLPT, and unchanged previous input.
4. Run focused tests, typecheck, and lint. Leave full build and commit/PR delivery to the coordinating task.

## Validation record

- `bun test src/lib/japanese/kanji`: 5 passed, 0 failed, including the isolated builder regression.
- `bun run typecheck`: passed.
- `bun run lint`: passed with 0 errors and the 5 existing warnings.
- The builder regression blocks external fetches and verifies that no Playwright enrichment ran.
- Published datasets remain unchanged. The coordinating task owns full gates, commits, and PR delivery.

## Final stacked verification

Verified on stack position 8/8 with Next.js 16.3.8, React 19.2.8, and Bun 1.4.2: typecheck, lint (zero errors, five existing warnings), feature boundaries, all 391 unit tests, production build, and 71 Chromium tests pass. The build and browser server use the actual cumulative branch contents. Position 1 reuses the full browser result from the identical security worktree.

The branch `fix/review-08-kanji-translations` is prepared for a separate PR against `fix/review-07-custom-scripts`. External publication/check state is recorded by GitHub.
