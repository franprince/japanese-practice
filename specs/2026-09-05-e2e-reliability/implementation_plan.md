# Plan

1. Update Playwright scripts/config for the local installed CLI, isolated port,
   production server, bounded workers, English browser defaults and failure artifacts.
2. Add shared browser helpers for practice settings, deterministic word/kanji
   datasets, cache reads and session completion; use real browser storage and media.
3. Strengthen home, dates, numbers, kanji and words tests. Replace timing-only
   checks with interaction assertions and attach descriptive timing observations.
4. Expand wordset browser cases: malformed payload, cancellation/retry, cached
   reload with failed HEAD, and normalized/independent language caches.
5. Add CI browser installation and suite execution after the build, artifact
   upload on failure, and update TESTING.md.
6. Run typecheck, lint, unit tests, build, all E2E tests and a no-retry repeat.
7. Fix the three directly observed regressions with minimal changes: install
   IndexedDB handlers only after request creation, raise the Dates toggle above
   the question layer, and remount the Numbers card on session restart.

The steps cover all spec goals. Tests use deterministic expected answers
without replacing the game logic. Real-payload smoke coverage remains available.

## Findings

- The previous suite used optional assertions, forced clicks, broad icon selectors,
  fixed sleeps, and runner timings mislabeled as INP. Those checks were replaced
  with observable transitions; unused page-object helpers with stale selectors
  were removed.
- Browser exception capture exposed a synchronous IndexedDB failure followed by
  transaction completion. A unit regression now also fires the late completion.
- Pointer actionability exposed the covered Dates toggle; session restart checks
  exposed the unkeyed Numbers card. Numbers now uses the existing session hook's
  identifier, matching the other games, without adding a second reset counter.
- Repeated runs caught a negative-test assumption: `九九九` is parsed as 9.
  The test now enters the valid value `十一` (11), outside Easy's 1–10 range.
- CI retries are diagnostic only: `failOnFlakyTests` prevents a flaky pass from
  making the job green.
