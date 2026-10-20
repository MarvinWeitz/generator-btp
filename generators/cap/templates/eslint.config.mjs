import capTsConfig from "@cbs-consulting/tools/eslint/cap/ts/eslint.config.mjs"

export default [
  { ignores: ["**/*.config.mjs", "**/*.config.js", "@cds-models/**"] },
  ...(Array.isArray(capTsConfig) ? capTsConfig : [capTsConfig]),
  // Test files use CDS test utilities (cds.test) whose types are resolved via
  // tsconfig paths — but the ESLint TypeScript project service anchors to the
  // tools package dir, so those paths aren't resolved. Disable only the three
  // rules that fire because of this, so all other type-aware rules stay active.
  {
    files: ["test/**/*.ts", "test/**/*.js"],
    rules: {
      "@typescript-eslint/no-unsafe-assignment": "off",
      "@typescript-eslint/no-unsafe-call": "off",
      "@typescript-eslint/no-unsafe-member-access": "off",
    },
  },
]

// TODO: Add ignore for CAP Linting for app directory
