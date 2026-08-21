export default [
  {
    files: ["e2e/**/*.js", "playwright.config.js", "scripts/verify-testnet-deployment.js"],
    languageOptions: {
      ecmaVersion: "latest",
      globals: {
        console: "readonly",
        document: "readonly",
        Error: "readonly",
        fetch: "readonly",
        Map: "readonly",
        Object: "readonly",
        process: "readonly",
        sessionStorage: "readonly",
        Set: "readonly",
        window: "readonly",
      },
      sourceType: "module",
    },
    rules: {
      eqeqeq: "error",
      "no-constant-binary-expression": "error",
      "no-dupe-keys": "error",
      "no-redeclare": "error",
      "no-undef": "error",
      "no-unreachable": "error",
      "no-unused-vars": ["error", { argsIgnorePattern: "^_" }],
    },
  },
];
