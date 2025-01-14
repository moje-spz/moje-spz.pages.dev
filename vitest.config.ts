import { defineConfig, mergeConfig } from 'vitest/config';
import { sveltekit } from '@sveltejs/kit/vite';
import { resolve } from 'path';

const baseConfig = defineConfig({
  plugins: [sveltekit()],
  test: {
    include: ['{src,tests}/**/*.{test,spec}.{js,ts}'],
    exclude: ['**/playwright/**', '**/node_modules/**'],
    globals: true,
    environment: 'jsdom',
    setupFiles: ['tests/setup.ts'],
    testTimeout: 1000,
  },
  resolve: {
    alias: {
      $lib: resolve(__dirname, './src/lib'),
      $app: resolve(__dirname, './node_modules/@sveltejs/kit/src/runtime/app')
    }
  }
});

export default defineConfig(({ mode }) => {
  if (mode === 'ui') {
    return mergeConfig(baseConfig, {
      test: {
        ui: true
      }
    });
  }
  return baseConfig;
});
