import js from "@eslint/js";
import globals from "globals";

// Flat ESLint config for the generator's OWN source (Node ESM). Generated
// projects get their own ESLint setup from the templates; this lints the
// generator code itself.
export default [
  {
    ignores: [
      "node_modules/**",
      // Template & addition files are emitted into generated projects (some
      // contain EJS placeholders); they are not linted as generator source.
      "generators/**/templates/**",
      "generators/**/additions/**",
    ],
  },
  js.configs.recommended,
  {
    languageOptions: {
      ecmaVersion: "latest",
      sourceType: "module",
      globals: {
        ...globals.node,
      },
    },
  },
  {
    // Vitest globals are enabled via `globals: true` in vitest.config.js.
    files: ["**/__tests__/**/*.js", "**/*.test.js"],
    languageOptions: {
      globals: {
        describe: "readonly",
        it: "readonly",
        test: "readonly",
        expect: "readonly",
        beforeAll: "readonly",
        afterAll: "readonly",
        beforeEach: "readonly",
        afterEach: "readonly",
        vi: "readonly",
      },
    },
  },
];
