# Kanji Game Testing Guide

This document outlines the testing strategy for the Kanji Game Page (`app/kanji/page.tsx`).

## Test Scope

1.  **Page Layout**: Stats, Title, Game Card container.
2.  **Game Logic Integration**: Interaction between `KanjiDifficultySelector` and `useGamePage`.
3.  **Session Management**: Resetting session on difficulty change.

## Use Cases

- **Load**:
  - Default difficulty: "easy".
  - Score/Streak: 0 (or restored from session).
- **Change Difficulty**:
  - User selects "Medium".
  - Session resets.
  - New difficulty is passed to `KanjiGameCard`.
- **Scoring**:
  - handled by `useGamePage` (mocked in integration tests).

## Running Tests

```bash
bun test app/kanji/__tests__/page.test.tsx
```
