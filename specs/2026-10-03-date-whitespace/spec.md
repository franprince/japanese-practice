# Accept spaced date answers consistently

## Authorization

On 2026-10-03 the user authorized fixing every reviewed finding in separate,
stackable PRs. This specification and plan implement the reviewed date answer
normalization bug; no further approval is outstanding. Spec refinement is skipped
because the scope and implementation plan are already approved.

## Problem and contract

Full-date feedback displays romaji with a space between the month and day, but
submission removes whitespace only from the expected answer. Typing the displayed
`ichigatsu tsuitachi` is therefore marked incorrect for January 1.

- Normalize case and whitespace consistently on submitted text, expected kana
  and expected romaji before comparison.
- Accept the displayed spaced form, compact form, surrounding whitespace and
  internal whitespace variants, including tabs and Japanese full-width spaces.
- Preserve the user's original input and generated feedback spelling for display.
- Keep genuinely different date readings incorrect; retain scoring, mistake
  review, round admission, question generation and display toggles.

## Acceptance

1. Full-date hook regressions accept spaced/compact kana and romaji with correct
   scoring and no mistake recorded.
2. A changed day reading remains incorrect.
3. Browser coverage submits the spaced form shown by full-date feedback and
   verifies correct feedback and ten awarded points.
