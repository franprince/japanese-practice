# Implementation plan

Authorization: user approved planning and execution together after the concrete UX assessment. No additional stage approval is needed.

1. Repair theme tokens and reduce decorative effects in app/globals.css; compact shared card/question/result/action primitives; add accessible input and feedback semantics.
2. Add a shared responsive PracticeSettingsDialog and SessionSettings section. Adapt Words' existing draft sections and introduce a generic settings wrapper for the other games. Keep game-specific controls within that wrapper.
3. Add SessionProgress above gameplay, compact secondary stats, and a consistent GamePageLayout. Integrate all routes, remove the Words mobile toolbar, and label active modes including random-character fallback.
4. Add a generic missed-question hook and typed optional review props. Integrate per-feature capture and replay without moving Japanese data types into the scoring core. Add the review action to session summaries.
5. Add validated local configuration persistence and a last-practice link. Simplify home cards, show examples and a beginner preset, and synchronize localized copy.
6. Update behavioral browser helpers for settings drafts. Test review queue semantics, settings preservation/restart, mobile progress/overlap, real computed theme colors, feedback/keyboard behavior, and long-content layouts. Run unit, type, lint, boundary, production build and Chromium suites; capture before/after proof.
7. Review final diff, record verification, commit logical changes, push task branch and open a PR against develop. Confirm the merged #62 prerequisite and check mergeability; do not merge.

## Traceability
Spec goals 1–3 → steps 1–3, 6; goal 4 → steps 1, 6; goal 5 → step 5; goal 6 → step 4; goal 7 → steps 5–7. No uncovered goals or unrelated plan components.

## Validation record
- `bun run typecheck`: passed.
- `bun run lint`: zero errors, five existing warnings (down from eight at the starting revision).
- `bun test src`: 322 passed, zero failures.
- `bun run check:boundaries`: passed.
- `bun run build`: passed; static application routes retained.
- `E2E_SKIP_BUILD=1 bun run test:e2e`: 58 passed against the final production build, including all nine new UX scenarios.
- Visual inspection: desktop 1440×1000 and mobile 390×844, plus browser assertions at 320×640/740; eight real theme backgrounds, three translated settings flows, long kana, consent, feedback and focus restoration.
- [Before/after proof](visuals/README.md). Physical phone keyboards and screen-reader speech have not been manually tested.
- PR #62 merged during this task; branch fast-forwarded to develop at 3371dd2 with an identical source tree before committing.

Progress deliberately reports completed questions rather than advancing a question number while the previous answer's feedback remains visible. Review queues collect only finite sessions and retain typed feature questions; infinite practice does not accumulate an unbounded review queue. Another tab's preferences do not silently reconfigure an active session. Beginner presets use router query state and work when storage is unavailable.
