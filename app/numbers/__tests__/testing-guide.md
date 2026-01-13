# Numbers Game Testing Guide

This document outlines the testing strategy for the Numbers Game Page (`app/numbers/page.tsx`).

## Test Scope

1.  **Page Layout**: Stats, Title, Controls.
2.  **Controls**:
    - `DifficultySelector`: Easy/Medium/Hard.
    - Mode Toggles: "Arabic -> Kanji" vs "Kanji -> Arabic".
3.  **Session Management**:
    - Changing difficulty resets session.
    - Changing mode resets session (implicitly or explicitly handled).

## Use Cases

- **Load**:
  - Default: Easy, Arabic -> Kanji.
- **Change Difficulty**:
  - Triggers session reset.
  - Updates `NumberGameCard` difficulty.
- **Change Mode**:
  - Updates local state `numbersMode`.
  - Updates `NumberGameCard`.

## Running Tests

```bash
bun test app/numbers/__tests__/page.test.tsx
```
