// ESLint: catches likely bugs (unused variables, undefined names, unreachable code).
// Formatting is left to Prettier, so the two never argue.
const js = require('@eslint/js');
const globals = require('globals');
const { defineConfig, globalIgnores } = require('eslint/config');

module.exports = defineConfig([
  globalIgnores(['node_modules', 'prisma/migrations']),
  {
    files: ['**/*.js'],
    extends: [js.configs.recommended],
    languageOptions: { sourceType: 'commonjs', globals: globals.node },
    rules: {
      // Allow unused function arguments that start with _ (e.g. Express's next in error handlers)
      'no-unused-vars': ['error', { argsIgnorePattern: '^_|^next$' }],
    },
  },
  {
    files: ['tests/**/*.js'],
    languageOptions: { globals: globals.jest },
  },
]);
