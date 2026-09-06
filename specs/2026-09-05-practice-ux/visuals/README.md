# Visual review

Before captures come from the initial UI audit. After captures show the implementation on a local production server. Questions vary because practice uses randomized selection; these are layout comparisons rather than pixel-equality tests.

| Screen | Before | After |
| --- | --- | --- |
| Desktop home (1440 × 1000 viewport) | ![Before home](before/home.png) | ![After home](after/home.png) |
| Mobile Words feedback (390 × 844 viewport) | ![Before feedback](before/words-mobile.png) | ![After feedback](after/words-mobile.png) |
| Desktop Numbers (1440 × 1000 viewport) | ![Before Numbers](before/numbers.png) | ![After Numbers](after/numbers.png) |

Additional inspection: mobile settings, all four mobile practice pages, Daylight, Spanish and Japanese settings at 320px, and long kana wrapping. Chromium viewport/device emulation does not reproduce a physical phone's operating-system keyboard.

## Successful scenarios

These are unedited full-page Chromium screenshots from the production build, using actual game data and answers submitted through the UI. Each game completes a five-question session with 100% accuracy. Desktop uses a 1440 × 1000 viewport; mobile uses 390 × 844. Full-page images include content below the viewport.

| Correct-answer feedback | Desktop | Mobile |
| --- | --- | --- |
| Words | ![Desktop words correct](success/desktop-words-correct.png) | ![Mobile words correct](success/mobile-words-correct.png) |
| Numbers | ![Desktop numbers correct](success/desktop-numbers-correct.png) | ![Mobile numbers correct](success/mobile-numbers-correct.png) |
| Dates | ![Desktop dates correct](success/desktop-dates-correct.png) | ![Mobile dates correct](success/mobile-dates-correct.png) |
| Kanji | ![Desktop kanji correct](success/desktop-kanji-correct.png) | ![Mobile kanji correct](success/mobile-kanji-correct.png) |

| Successful completion | Desktop | Mobile |
| --- | --- | --- |
| Words: five correct answers | ![Desktop words complete](success/desktop-words-complete.png) | ![Mobile words complete](success/mobile-words-complete.png) |
| Numbers: five correct answers | ![Desktop numbers complete](success/desktop-numbers-complete.png) | ![Mobile numbers complete](success/mobile-numbers-complete.png) |
| Dates: five correct answers | ![Desktop dates complete](success/desktop-dates-complete.png) | ![Mobile dates complete](success/mobile-dates-complete.png) |
| Kanji: five correct answers | ![Desktop kanji complete](success/desktop-kanji-complete.png) | ![Mobile kanji complete](success/mobile-kanji-complete.png) |
| Words: missed-item review completed correctly | ![Desktop review complete](success/desktop-words-review-complete.png) | ![Mobile review complete](success/mobile-words-review-complete.png) |

The review scenario skips one question, answers the remaining four correctly, starts “Practice missed items,” and answers the skipped question correctly. The capture checks 100% review accuracy and confirms the review button disappears. It also exposes an existing copy issue: the completed-count label says “1 questions completed” for a single-item review.

Reproduce from the repository root with a running production server:

```sh
node specs/2026-09-05-practice-ux/visuals/capture-success.mjs http://127.0.0.1:3101
```

The capture script asserts correct feedback, progress counts, completion accuracy, enabled restart controls, no remaining missed items, no horizontal overflow, and no browser page errors. It seeds only supported practice preferences; it does not mock answers, game state, or rendered markup.
