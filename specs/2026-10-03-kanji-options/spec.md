# Distinct Kanji answer choices

## Authorization

On 2026-10-03 the user authorized fixing every reviewed finding in separate,
stackable PRs. This specification and plan implement the reviewed Kanji choice
ambiguity; no further approval is outstanding. Spec refinement is skipped
because the scope and implementation plan are already approved.

## Problem and contract

Different characters can have the same reading, while answer buttons identify
choices by reading. The N5 entries 一, 壱 and 弌 all show いち and the same meaning,
yet only one hidden character is graded correct. Hard difficulty shows readings
alone, so different meanings cannot disambiguate duplicate readings.

- Include the correct entry once.
- Every distractor must have a nonempty trimmed reading different from the correct entry
  and every other distractor, and a different character from existing choices.
- Select real entries from the supplied pool, preserving randomized selection
  and ordering. Return fewer choices when distinct readings are exhausted.
- Keep scoring, difficulty hints, loading and the published datasets unchanged.

## Acceptance

1. Alternate characters with the correct reading never appear as distractors.
2. Duplicate distractor readings never appear together, including small pools.
3. A browser round using real-style alternate numerals displays distinct choices
   and accepts the visible matching reading.
