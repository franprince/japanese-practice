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

## Next Steps

1. Add tests for utility functions in `src/lib/`
2. Add tests for custom hooks in `src/hooks/`
3. Consider adding Playwright E2E tests for critical user flows
