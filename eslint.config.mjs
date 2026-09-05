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
    // Enforce the cleaned lifecycle and unused-declaration rules. Scoped
    // non-React/test overrides below retain their existing purposes.
    rules: {
      "@typescript-eslint/no-unused-vars": "error",
      "@typescript-eslint/no-explicit-any": "warn",
      "react-hooks/set-state-in-effect": "error",
      "react-hooks/purity": "error",
      "react-hooks/immutability": "error",
      "react-hooks/exhaustive-deps": "error",
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
