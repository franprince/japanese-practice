# Implementation plan

Approved by the user's request to implement every reviewed fix on 2026-10-03.

1. Add vocabulary/kana context to shared answer validation and pass the actual Words format from evaluation.
2. Replace blanket suffix rules with exact greeting and standalone particle equivalents, excluding lexical kanji entries.
3. Cover mother, iroha, tooth, generated kana, particles, and greetings with focused unit and browser regressions.
4. Run focused tests, typecheck, and lint. The parent schedules stack build/browser verification.

## Final stacked verification

Verified on stack position 3/8 with Next.js 16.3.8, React 19.2.8, and Bun 1.4.2: typecheck, lint (zero errors, five existing warnings), feature boundaries, all 340 unit tests, production build, and 11 Chromium tests pass. The build and browser server use the actual cumulative branch contents. Position 1 reuses the full browser result from the identical security worktree.

The branch `fix/review-03-word-particles` is prepared for a separate PR against `fix/review-02-kanji-options`. External publication/check state is recorded by GitHub.
