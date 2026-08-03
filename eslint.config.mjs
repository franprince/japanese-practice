// Flat config (ESLint 9). This file is .mjs because it uses ESM `import` and
// package.json has no "type": "module".
//
// eslint-config-next >= 15.3 exports native flat-config arrays, so no
// FlatCompat / @eslint/eslintrc bridge is needed.
import next from "eslint-config-next";
import nextTypescript from "eslint-config-next/typescript";

export default [
  {
    ignores: [
      ".next/**",
      ".vercel/**",
      "node_modules/**",
      "test-results/**",
      "playwright-report/**",
      "public/**",
      "data/**",
      "next-env.d.ts",
      "*.tsbuildinfo",
    ],
  },

  ...next,
  ...nextTypescript,

  {
    // Baseline for pre-existing debt in app code. Lint has never run in this
    // repo, so these start as warnings to get a green gate that still fails
    // on anything new. Every other rule keeps its upstream severity.
    //
    // Declared BEFORE the scoped overrides below: in flat config the last
    // matching block wins, so a global block placed after them would undo
    // their "off" settings.
    //
    // Burn-down is tracked in specs/INDEX.md; promote each back to "error"
    // as it reaches zero.
    rules: {
      // ~33 occurrences. Follow-up: reduce-any-and-unused.
      "@typescript-eslint/no-unused-vars": "warn",
      // ~11 occurrences. Follow-up: reduce-any-and-unused.
      "@typescript-eslint/no-explicit-any": "warn",
      // ~12 occurrences, mostly legitimate localStorage hydration on mount.
      "react-hooks/set-state-in-effect": "warn",

      // TODO(fix-react-hooks-violations): these two are REAL BUGS, not style.
      // They are warnings only because fixing them means changing application
      // code, which the approved spec puts out of scope for this change.
      //   - src/components/numbers/number-pad.tsx:47 — Math.random() during
      //     render, so the keypad shuffle can reorder on any re-render.
      //   - app/words/page.tsx:50 — setFilter read before its declaration, so
      //     the earlier read never observes later updates.
      "react-hooks/purity": "warn",
      "react-hooks/immutability": "warn",
    },
  },

  {
    // Build scripts, Playwright e2e and ambient type shims are not Next.js
    // application code. Without this, ~37 of the ~103 reported problems are
    // false positives — most visibly every react-hooks/rules-of-hooks error,
    // which fires on Playwright's `use` fixture callback in e2e/fixtures
    // because the plugin reads it as React's `use` hook.
    files: ["e2e/**", "scripts/**", "types/**", "src/types/**"],
    rules: {
      "react-hooks/rules-of-hooks": "off",
      "react-hooks/purity": "off",
      "react-hooks/immutability": "off",
      "react-hooks/set-state-in-effect": "off",
      "react-hooks/exhaustive-deps": "off",
      "@next/next/no-assign-module-variable": "off",
      "@typescript-eslint/no-explicit-any": "off",
      "@typescript-eslint/no-empty-object-type": "off",
      "@typescript-eslint/no-require-imports": "off",
      "@typescript-eslint/no-unused-vars": "off",
    },
  },

  {
    // Test fixtures legitimately carry partial/loose shapes.
    files: ["**/*.test.ts", "**/*.test.tsx", "src/test-utils/**"],
    rules: {
      "@typescript-eslint/no-explicit-any": "off",
      "@typescript-eslint/no-unused-vars": "off",
    },
  },
];
