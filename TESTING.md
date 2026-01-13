# Testing Setup

This project uses **Bun** as the test runner with **React Testing Library** for component testing.

## Running Tests

```bash
# Run all tests
bun test

# Run tests in watch mode
bun test --watch

# Run a specific test file
bun test src/lib/game-registry.test.ts
```

## Test Structure

### Test Utilities

- **`src/test-utils/setup.ts`**: Global test setup with cleanup configuration
- **`src/test-utils/index.tsx`**: Custom render function that wraps components with necessary providers (ThemeProvider, I18nProvider)

### Example Tests

- **`src/lib/game-registry.test.ts`**: Tests for the game registry configuration

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

## Current Limitations

> [!NOTE]
> **Component Testing**: Due to compatibility issues between React 19, Bun, and happy-dom, full component rendering tests may encounter errors. For comprehensive UI testing, consider using:
> - **Playwright** for E2E tests (already installed)
> - **Unit tests** for business logic and utilities (working perfectly)

## Test Guidelines

Following your testing principles:

1. ✅ **Focus on user interactions** - Test what users see and do
2. ✅ **Avoid implementation details** - Test behavior, not internals
3. ✅ **Use React Testing Library queries** - `getByRole`, `getByText`, etc.

## Example: Testing Business Logic

```typescript
// src/lib/game-registry.test.ts
import { describe, test, expect } from 'bun:test'
import { GAMES } from '@/lib/game-registry'

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
