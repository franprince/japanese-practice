# Words Game Testing Guide

This document outlines the testing strategy and use cases for the Words Game module. It serves as a reference for ensuring the quality and reliability of the game's functionality.

## Test Scope

The testing strategy covers two main areas:
1.  **Unit Logic (`GameCard`)**: Testing core game mechanics, input validation, scoring, and feedback systems in isolation.
2.  **Integration (`WordsPage`)**: Testing the page layout, game initialization, and integration with settings and score systems.

## Use Cases & Test Scenarios

### 1. Initialization and Loading
- **Scenario**: Game loads successfully.
  - **Expectation**: Loading state is shown initially.
  - **Expectation**: A word is fetched and displayed (Kana).
  - **Expectation**: Input field is focused (unless suppressed).
  - **Expectation**: Score and streak are initialized to 0.

- **Scenario**: No words available (empty filter).
  - **Expectation**: "No words found" message is displayed.
  - **Expectation**: Option to open settings is available.

### 2. Gameplay Mechanics
- **Scenario**: User enters correct answer.
  - **Input**: User types correct Romaji and presses Enter/Check.
  - **Expectation**: Feeddback shows "Correct" (Green).
  - **Expectation**: Input is case-insensitive and trimmed.
  - **Expectation**: Score increases.
  - **Expectation**: Streak increases.
  - **Expectation**: "Next" button appears.

- **Scenario**: User enters incorrect answer.
  - **Input**: User types incorrect Romaji.
  - **Expectation**: Feedback shows "Incorrect" (Red).
  - **Expectation**: Correct answer is revealed.
  - **Expectation**: Streak resets to 0.

- **Scenario**: Particle special case ('ha' -> 'wa').
  - **Input**: Word ends in 'ha' (topic marker), user types 'wa'.
  - **Expectation**: Answer is accepted as correct.

- **Scenario**: Skipping a word.
  - **Input**: User clicks "Skip".
  - **Expectation**: Current word changes.
  - **Expectation**: Streak resets to 0.
  - **Expectation**: Score remains unchanged for the skip action itself (or logic dependent).

### 3. User Interface & Controls
- **Scenario**: Settings interaction.
  - **Input**: User changes game mode (e.g., Hiragana only).
  - **Expectation**: Game resets with new filter application.

- **Scenario**: Input validation.
  - **Input**: Empty input.
  - **Expectation**: "Check" button is disabled.

### 4. Accessibility & Edge Cases
- **Scenario**: Keyboard navigation.
  - **Input**: usage of `Enter` key to submit and advance.
  - **Expectation**: Workflow flows smoothly without mouse interaction.

## Implementation Details

Tests are implemented using `bun:test`, `@testing-library/react`, and `@testing-library/user-event`.

- **Test Files**:
    - `src/components/words/game-card.test.tsx`: Component-level tests.
    - `app/words/__tests__/page.test.tsx`: Page-level integration tests.

## Running Tests

Execute the following command to run the suite:

```bash
bun test app/words/__tests__/page.test.tsx src/components/words/game-card.test.tsx
```
