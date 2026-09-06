# E2E reliability

Authorized by the user's request to improve the E2E suite on 2026-09-05.
Branch `test/e2e-reliability` builds on the wordset reliability change (PR #57,
now merged into develop).

## Goals and acceptance

- Replace fixed sleeps, conditional no-op tests and screenshot-only assertions
  with observable state transitions across all four games.
- Exercise correct/incorrect answers, mode selection, five-question completion
  and restart with stable selectors and controlled data where needed.
- Verify language persistence and durable wordset reuse, including failed
  revalidation and separate English/Spanish caches.
- Use an isolated production test server and the installed Playwright CLI;
  tests must not silently attach to a different app running on port 3000.
- Run browser checks in CI and retain useful failure artifacts. Keep timing
  observations descriptive: runner elapsed time is not an INP measurement.
- Full suite passes with retries disabled, plus a repeat run to assess stability.

Application feature changes and the remaining architecture backlog are out of
scope. Include narrow fixes for regressions exposed by the new tests: a cache
transaction completion handler referencing an uninitialized request after a
synchronous storage failure, the Dates display toggle covered by the question
layer, and Numbers restart leaving the completed round visible. These findings
were reported during execution; no session architecture refactor is included.
