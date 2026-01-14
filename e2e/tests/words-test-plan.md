# Words Game E2E Test Plan

## Overview
This document outlines the comprehensive E2E test strategy for the Words Game page. The tests will verify UI components, user interactions, and capture visual states for documentation.

## Test Cases

### 1. Page Load
**Objective:** Verify the page loads successfully and navigates to the correct URL.

**Steps:**
1. Navigate to `/words`
2. Wait for page to load completely
3. Verify URL is `/words`
4. **Screenshot:** `words_initial_load.png`

---

### 2. UI Component Verification
**Objective:** Verify all UI components are visible and rendered correctly.

**Components to verify:**

#### Navigation & Header
- **Home button** - Link back to home page
- **Language switcher** - Dropdown/selector for language selection
- **Title** - Page heading "Práctica de palabras" (or localized equivalent)
- **Description** - Instructions/tip text below title

#### Game Controls
- **Popover trigger** - Settings button/icon
- **Mode selector** - Buttons for Hiragana/Katakana/Both/Custom modes
- **Character mode toggle** - Button to switch between word/character mode

#### Stats Display
- **Score icon + value** - Lightning/Zap icon with score number
- **Streak icon + value** - Flame icon with streak number

#### Game Card Components
- **Mode indicator** - Shows current mode (Words/Characters)
- **Japanese character display** - Large kana text
- **Input field** - Text input for user answer
- **Skip button** - Button to skip current word
- **Check button** - Button to verify answer (disabled when input empty)

#### Session Stats (if visible)
- **Rounds** - Number of rounds played
- **Score** - Current session score
- **Streak** - Current streak
- **Best** - Best streak/score

**Steps:**
1. Load the page
2. Verify each component is visible using appropriate selectors
3. Verify components have correct attributes (e.g., buttons not disabled inappropriately)

---

### 3. Settings Popover Interaction
**Objective:** Verify the settings popover opens and closes correctly.

**Steps:**
1. Locate popover trigger button
2. Click to open popover
3. Verify popover content is visible
4. Verify settings options are displayed
5. Close popover (click outside or close button)
6. Verify popover is hidden

---

### 4. Game Mode Changes
**Objective:** Verify mode selector buttons change the game mode correctly.

**Steps:**
1. Click Hiragana mode button
2. Verify mode indicator updates to show Hiragana
3. Click Katakana mode button
4. Verify mode indicator updates to show Katakana
5. Click Both mode button
6. Verify mode indicator updates accordingly

---

### 5. Custom Menu Interaction
**Objective:** Verify custom character selection menu opens and closes.

**Steps:**
1. Click Custom mode button
2. Verify custom menu/panel opens
3. Verify character group checkboxes/options are visible
4. Close custom menu
5. Verify menu is hidden

---

### 6. Correct Answer Flow
**Objective:** Verify correct answer submission shows success feedback.

**Steps:**
1. Wait for a word to be displayed
2. Read the displayed kana character(s)
3. Type the correct romaji answer in the input field
4. Click "Check" button (or press Enter)
5. Wait for feedback animation (1-1.5s)
6. Verify green/success feedback card is displayed
7. Verify feedback shows:
   - Success icon (checkmark)
   - Correct answer confirmation
   - Word meaning (if available)
   - Kanji representation (if available)
8. **Screenshot:** `words_feedback_correct.png`

---

### 7. Incorrect Answer Flow
**Objective:** Verify incorrect answer submission shows error feedback.

**Steps:**
1. Click "Next Word" button to proceed to next word
2. Wait for new word to be displayed
3. Type an incorrect answer in the input field
4. Click "Check" button (or press Enter)
5. Wait for feedback animation (1-1.5s)
6. Verify red/error feedback card is displayed
7. Verify feedback shows:
   - Error icon (X mark)
   - Correct answer
   - Word meaning (if available)
   - Kanji representation (if available)
8. **Screenshot:** `words_feedback_incorrect.png`

---

## Implementation Notes

### Handling Dynamic Content
- The word displayed is random, so we cannot predict the exact kana
- **Solution:** Use page evaluation to read the displayed kana and look up the correct answer from the word list, OR use a mock/fixture to control which word appears

### Localization Support
- Button text may vary based on language (Check/Verificar/Comprobar)
- **Solution:** Use multiple selectors with `has-text()` for all supported languages

### Screenshot Strategy
- Capture screenshots at key moments for visual regression and documentation
- Store screenshots in `test-results/screenshots/` directory
- Attach screenshots to Playwright HTML report for easy viewing

### Test Data
- Consider using `mockRandom()` or similar approach to make word selection deterministic
- Alternatively, use page evaluation to extract the current word and dynamically determine the correct answer

---

## Success Criteria
- All UI components are verified as visible
- Mode changes work correctly
- Popover and custom menu interactions function properly
- Correct answer shows green feedback with proper information
- Incorrect answer shows red feedback with proper information
- All screenshots are captured and embedded in the report
- Tests pass consistently across runs
