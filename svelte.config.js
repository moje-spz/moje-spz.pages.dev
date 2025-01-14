// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: 2025 Pavol Babinčák

import cloudflareAdapter from '@sveltejs/adapter-cloudflare';
import autoAdapter from '@sveltejs/adapter-auto';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const path = fileURLToPath(new URL('package.json', import.meta.url));
const pkg = JSON.parse(readFileSync(path, 'utf8'));

// Use auto adapter when USE_AUTO_ADAPTER is set to 'true'
const useAutoAdapter = process.env.USE_AUTO_ADAPTER === 'true';
const adapter = useAutoAdapter ? autoAdapter : cloudflareAdapter;

/** @type {import('@sveltejs/kit').Config} */
const config = {
	kit: {
		adapter: adapter(),
		typescript: {
			config: (config) => {
				config.include = [...config.include, 'src/**/*.ts'];
				return config;
			}
		},
		files: {
			hooks: {
				server: 'src/hooks.server.ts',
				client: 'src/hooks.ts'
			}
		}
	},
	preprocess: vitePreprocess()
};

export default config;
