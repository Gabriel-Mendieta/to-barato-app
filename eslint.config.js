const { defineConfig } = require('eslint/config');
const expoConfig = require('eslint-config-expo/flat');

module.exports = defineConfig([
  ...expoConfig,
  {
    ignores: [
      '.expo/**',
      'android/**',
      'coverage/**',
      'dist/**',
      'ios/**',
      'node_modules/**',
      'web-build/**',
    ],
  },
  {
    files: ['**/*.{js,jsx,ts,tsx}'],
    rules: {
      'no-console': ['warn', { allow: ['warn', 'error'] }],
      // Existing data-fetching effects use state updates during setup; keep this visible
      // while the legacy screens are migrated without blocking the baseline lint command.
      'react-hooks/refs': 'warn',
      'react-hooks/set-state-in-effect': 'warn',
      'react/no-unescaped-entities': 'warn',
    },
  },
]);
