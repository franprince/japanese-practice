# Testing Setup

This project uses **Bun** as the test runner with **React Testing Library** for component testing.

## Running Tests

```bash
# Run all unit tests
bun run test:unit

# Run tests in watch mode
bun test src --watch

# Run a specific test file
bun test src/lib/core/__tests__/game-registry.test.ts
```

> [!NOTE]
> Use `bun run test:unit` (or `bun test src`), not a bare `bun test` — the
> latter also picks up the Playwright specs under `e2e/`, which aren't valid
> `bun:test` files and fail to run.

## Test Structure

### Test Utilities

- **`src/test-utils/setup.ts`**: Global test setup with cleanup configuration
- **`src/test-utils/index.tsx`**: Custom render function that wraps components with necessary providers (ThemeProvider, I18nProvider)

### Example Tests

- **`src/lib/core/__tests__/game-registry.test.ts`**: Tests for the game registry configuration

## Writing Tests

### Basic Test Example

```typescript
import { describe, test, expect } from 'bun:test'

describe('MyFeature', () => {
  test('should work correctly', () => {
    const result = myFunction()
    expect(result).toBe(expectedValue)
  })
})
```

### Testing with Custom Render

```typescript
import { render, screen } from '@/test-utils'
import { MyComponent } from './my-component'

test('renders component', () => {
  render(<MyComponent />)
  expect(screen.getByText('Hello')).toBeInTheDocument()
})
```

## Test Guidelines

Following your testing principles:

1. ✅ **Focus on user interactions** - Test what users see and do
2. ✅ **Avoid implementation details** - Test behavior, not internals
3. ✅ **Use React Testing Library queries** - `getByRole`, `getByText`, etc.

## Example: Testing Business Logic

```typescript
// src/lib/core/__tests__/game-registry.test.ts
import { describe, test, expect } from 'bun:test'
import { GAMES } from '@/lib/core'

describe('Game Registry', () => {
  test('should have all 4 games defined', () => {
    expect(GAMES).toHaveLength(4)
  })

  test('each game should have required properties', () => {
    GAMES.forEach(game => {
      expect(game).toHaveProperty('id')
      expect(game).toHaveProperty('href')
      // ... more assertions
    })
  })
})
```

## Browser tests

Playwright runs Chromium against a production build on
`http://127.0.0.1:3100`. It builds and starts its own server, waits for
`/api/health`, and never reuses a running server. Keep port 3100 free.

```bash
# Install the browser once (add --with-deps on Linux if needed)
node node_modules/@playwright/test/cli.js install chromium

# Build and run all browser tests
bun run test:e2e

# Run a specific file
bun run test:e2e e2e/tests/wordset-lifecycle.spec.ts

# Repeat twice without retries, using an already-built app
E2E_SKIP_BUILD=1 bun run test:e2e --repeat-each=2 --retries=0

# Interactive runner (headed/debug scripts are also available)
bun run test:e2e:ui

# Inspect the last HTML report
node node_modules/@playwright/test/cli.js show-report
```

Only set `E2E_SKIP_BUILD=1` after a successful build of the current application
code; otherwise tests will exercise stale output. The scripts use the locally
installed CLI explicitly to avoid Bun resolving a different `playwright` binary.

### Coverage and conventions

- Use `test` and `expect` from `e2e/fixtures`. Every test gets an isolated browser
  context, English initial preferences, and a check for uncaught page errors.
  Language changes remain intact across reloads.
- Assert observable outcomes: correct/incorrect feedback, locked answers,
  editable next rounds, selected modes, session completion/restart, and language
  persistence. Do not use fixed sleeps, optional assertions, or forced clicks.
- Controlled word/kanji responses make answer expectations reproducible without
  mocking game logic. Desktop and mobile smoke tests also exercise the real
  wordset endpoint. IndexedDB and localStorage are real browser storage.
- Download cases cover HTTP/JSON/schema/storage failures, consent, retry,
  cancellation, durable reload after failed revalidation, and language-specific
  caches. Service workers are blocked so route interception stays reliable;
  this is not service-worker/offline-PWA coverage.
- `performance.spec.ts` checks interaction readiness at desktop/mobile widths.
  Its attached runner timings are diagnostic observations, not INP or performance
  budgets; machine load and Playwright overhead affect them.
- Only Chromium is currently configured; mobile coverage uses a narrow viewport,
  not a claim of Safari, Firefox, or physical-device compatibility.

### CI and failure evidence

CI runs typecheck, lint, unit tests and build, installs Chromium, then runs the
browser suite with one worker. Local runs use two workers and no retries; CI
allows two diagnostic retries but still fails if a test is flaky. Use
`--retries=0` when checking stability. The real mobile payload smoke test has a
60-second overall timeout to accommodate downloading and storing the large data
file on slower runners; this is a functional check, not a performance budget.

Failures retain traces and screenshots under `test-results/`, plus an HTML report
under `playwright-report/`. CI uploads both as `playwright-results` for seven days.
Some tests also attach contextual screenshots or timing JSON to their report.
