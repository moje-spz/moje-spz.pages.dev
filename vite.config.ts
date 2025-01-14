// SPDX-FileCopyrightText: 2025 Pavol Babinčák
// SPDX-License-Identifier: MIT

import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import jsonPlugin from '@rollup/plugin-json';

const file = fileURLToPath(new URL('package.json', import.meta.url));
const jsonContent = readFileSync(file, 'utf8');
const pkg = JSON.parse(jsonContent);

export default defineConfig({
	plugins: [sveltekit(), jsonPlugin()],
	resolve: {
		alias: {
			$lib: fileURLToPath(new URL('./src/lib', import.meta.url))
		}
	},
	test: {
		include: ['src/**/*.{test,spec}.{js,ts}', 'tests/**/*.{test,spec}.{js,ts}'],
		setupFiles: ['tests/setup.ts']
	},
	define: {
		pkg: pkg
	}
});
