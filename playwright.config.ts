import { defineConfig, devices } from '@playwright/test';

/**
 * See https://playwright.dev/docs/test-configuration.
 */
export default defineConfig({
  testDir: './tests/playwright',
  /* Run tests in files in parallel */
  fullyParallel: true,
  /* Fail the build on CI if you accidentally left test.only in the source code. */
  forbidOnly: !!process.env.CI,
  /* Retry on CI only */
  retries: process.env.CI ? 2 : 0,
  /* Opt out of parallel tests on CI. */
  workers: process.env.CI ? 1 : undefined,
  /* Reporter to use. See https://playwright.dev/docs/test-reporters */
  reporter: 'html',
  /* Run your local dev server before starting the tests */
  webServer: {
    command: 'npm run build && npm run preview',
    url: 'http://localhost:4173',
    reuseExistingServer: !process.env.CI,
  },
  /* Shared settings for all the projects below. See https://playwright.dev/docs/api/class-testoptions. */
  use: {
    baseURL: 'http://localhost:4173',
    /* Collect trace when retrying the failed test. See https://playwright.dev/docs/trace-viewer */
    trace: 'on-first-retry',
    navigationTimeout: 2000,
    actionTimeout: 2000
  },
  /* Configure projects for major browsers */
  projects: [
    {
      name: 'desktop-chrome',
      testMatch: /^(?!.*mobile).*\.spec\.ts$/,
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'desktop-firefox',
      testMatch: /^(?!.*mobile).*\.spec\.ts$/,
      use: { ...devices['Desktop Firefox'] },
    },
    /* Test against mobile viewports. */
    {
      name: 'mobile-chrome',
      testMatch: '**/*mobile.spec.ts',
      use: { ...devices['Pixel 5'] },
    },
  ],
  // Timeout for each expect() call
  expect: {
    timeout: 2000
  },
});
