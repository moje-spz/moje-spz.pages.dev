// SPDX-License-Identifier: CC0-1.0
// SPDX-FileCopyrightText: 2025 Pavol Babinčák

module.exports = {
	root: true,
	extends: [
		'eslint:recommended',
		'plugin:svelte/recommended',
		'prettier'
	],
	parser: 'espree',
	plugins: ['@typescript-eslint', 'file-naming'],
	parserOptions: {
		sourceType: 'module',
		ecmaVersion: 2020
	},
	env: {
		browser: true,
		es2017: true,
		node: true
	},
	ignorePatterns: [
		'*',
		'!src/**/*.ts',
		'!src/**/*.js',
		'!src/**/*.svelte',
		'!.prettierrc.js',
		'.vscode/firefox.prefs.js',
		'.vscode/firefox-tmp/**/*.js',
		'.vscode/firefox-tmp/**/*.ts',
		'node_modules/'
	],
	overrides: [
		{
			files: ['.prettierrc.js'],
			parser: 'espree'
		},
		{
			files: ['src/**/*.ts', 'src/**/*.js', 'tests/**/*.test.ts', 'tests/**/*.ts', 'tests/**/*.js'],
			excludedFiles: ['.vscode/firefox-tmp/**/*'],
			extends: ['plugin:@typescript-eslint/recommended'],
			parser: '@typescript-eslint/parser',
			parserOptions: {
				project: ['./tsconfig.json', './tests/tsconfig.json', './scripts/tsconfig.playwright.json']
			}
		},
		{
			files: ['*.svelte'],
			parser: 'svelte-eslint-parser',
			parserOptions: {
				parser: '@typescript-eslint/parser'
			}
		},
		{
			files: ['**/*.test.ts'],
			env: {
				jest: true,
				node: true
			},
			rules: {
				'@typescript-eslint/no-explicit-any': 'error',
				'@typescript-eslint/explicit-function-return-type': 'error'
			}
		},
		{
			files: ['src/routes/**/*'],
			excludeFiles: ['src/tests/**/*'],
			rules: {
				'file-naming/match': ['error', {
					allowed: ['^\\+[a-z]+\\.(ts|js|svelte)$', '^\\+']
				}]
			}
		}
	],
	rules: {
		'@typescript-eslint/no-explicit-any': 'error'
	}
};
