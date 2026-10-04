# Validate Japanese numeral answers

## Authorization

On 2026-10-03 the user authorized fixing every reviewed finding in separate,
stackable PRs. This specification and plan implement the reviewed numeral
validation bug; no further approval is outstanding. Spec refinement is skipped
because the scope and implementation plan are already approved.

## Problem and contract

The parser discards consecutive digits and sums repeated or unordered units.
For a question asking for 2, keypad input 一二 receives points as if it were 二.

- Validate the whole input before returning a number; return -1 for invalid
  notation so the existing game records an incorrect answer and no points.
- Accept every generated practice numeral for 1–99999, standalone 〇/零, and
  optional explicit unit coefficients such as 一十, 一百 and 一千.
- Small units descend 千, 百, 十 within each section. 万 appears at most once
  and separates the leading coefficient section from the remainder. Valid
  larger coefficients such as 十万 remain accepted.
- Reject consecutive digits, unknown characters, repeated or unordered units,
  and zeros embedded in unit notation. Digit-by-digit notation is outside this
  game's unit-notation contract; do not silently discard those digits.
- Preserve the keypad, scoring rules, question generation and Arabic input mode.

## Acceptance

1. Exhaustive round trips pass for every value in all practice difficulty ranges.
2. Focused valid alternates and invalid syntax cases exercise parser boundaries.
3. Hook and browser regressions show malformed keypad input is incorrect, awards
   no points, consumes one round and remains eligible for mistake review.
