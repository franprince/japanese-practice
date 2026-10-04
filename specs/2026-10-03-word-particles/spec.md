# Validate particle readings with lexical context

Status: Approved

## Authorization

The user's 2026-10-03 request to implement all reviewed fixes in separate stackable PRs authorizes this scope, specification, plan, and implementation. The approved plan skips optional refinement.

## Problem and outcome

Suffix-only は/へ/を substitutions reward wrong readings, including `hawa` for 母 (`haha`) and `irowa` for 伊呂波 (`iroha`). Remove blanket suffix substitutions. Vocabulary keeps the conventional readings of こんにちは and こんばんは and standalone kana particle equivalents. Lexical kanji entries such as 歯 are not particles, and generated Characters/Guess use kana readings.

## Acceptance

- Reject wrong lexical and generated suffix readings without points; admit them to mistake review.
- Preserve exact, case/trim, romanization, macron, and dictionary-supported aliases.
- Keep valid standalone particle readings and the two shipped lexical greetings.
- Do not infer a particle boundary in arbitrary multi-character text; no grammatical parsing or dataset schema changes are included.
