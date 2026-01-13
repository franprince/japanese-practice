# Dates Game Testing Guide

This document outlines the testing strategy for the Dates Game Page (`app/dates/page.tsx`).

## Test Scope

1.  **Page Layout**: Stats, Title.
2.  **Mode Switching**: `DateModeSelector` interaction (Days vs Months).
3.  **Session Management**: Resetting session on mode change.

## Use Cases

- **Load**:
  - Default mode: "days".
- **Change Mode**:
  - User selects "Months".
  - Session resets.
  - `DateGameCard` receives new mode.

## Running Tests

```bash
bun test app/dates/__tests__/page.test.tsx
```
