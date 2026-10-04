# Scope advanced Words filters to Custom

Status: Approved

## Authorization

The user's 2026-10-03 request to implement every reviewed fix in separate stackable PRs authorizes this scope, specification, plan, and implementation. The approved plan skips optional refinement.

## Problem and acceptance

Hidden Custom filters affect explicit Hiragana, Katakana, and Both subjects. They can generate the opposite script or remove every vocabulary candidate. Only Custom uses saved group and length filters; explicit subjects use their complete script groups and the existing default length 3–6.

- Apply the active subject's filter to Words, Characters, and Guess.
- Keep the saved Custom filter and settings editing draft intact so returning to Custom restores it.
- Preserve preference hydration, settings Apply/Cancel, and session reset behavior.
- Keep Custom mixed sampling in its separate fix, without editing `characters.ts`.
