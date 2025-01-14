import globals from 'globals';
import typescript from '@typescript-eslint/eslint-plugin';
import tsParser from '@typescript-eslint/parser';
import svelte from 'eslint-plugin-svelte';
import svelteParser from 'svelte-eslint-parser';

export default [
  {
    ignores: ['*.config.js', '*.cjs', 'dist/**', '.svelte-kit/**', '.vscode/firefox.prefs.js', '.vscode/**/*.js']
  },
  {
    files: ['**/*.{js,ts}'],
    languageOptions: {
      globals: {
        ...globals.browser,
        ...globals.node,
        ...globals.vitest
      },
      parser: tsParser,
      parserOptions: {
        project: ['./tsconfig.json', './scripts/tsconfig.playwright.json']
      }
    },
    plugins: {
      '@typescript-eslint': typescript
    },
    rules: {
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
      '@typescript-eslint/ban-ts-comment': 'error',
      '@typescript-eslint/explicit-function-return-type': 'warn',
      '@typescript-eslint/no-explicit-any': 'error',
      'no-control-regex': 'off'
    }
  },
  {
    files: ['**/*.svelte'],
    plugins: {
      svelte
    },
    processor: svelte.processors['.svelte'],
    languageOptions: {
      parser: svelteParser,
      parserOptions: {
        parser: {
          ts: tsParser
        },
        extraFileExtensions: ['.svelte']
      }
    },
    rules: {
      ...svelte.configs.recommended.rules,
      'svelte/no-at-html-tags': 'error',
      'svelte/valid-compile': 'error'
    }
  }
];
