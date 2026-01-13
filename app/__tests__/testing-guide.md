# Home Page Testing Guide

This document outlines the testing strategy for the Home Page (`app/page.tsx`).

## Test Scope

1.  **Rendering**: Verify all major sections (Hero, Games Grid, Footer) appear.
2.  **Navigation**: Ensure game cards contain correct links.
3.  **Localization**: Verify translated strings are rendered (mocked).

## Use Cases

- **Load**: User visits root URL `http://.../`.
  - Expect Title, Tagline, Theme Switcher, Language Switcher.
  - Expect list of available games.
- **Game Selection**: User sees "Words", "Kanji", etc.
  - Each card links to correct route (e.g., `/words`).

## Running Tests

```bash
bun test app/__tests__/page.test.tsx
```
