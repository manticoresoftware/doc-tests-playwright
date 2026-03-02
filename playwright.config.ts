import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests',

  /* Maximum time a test can run */
  timeout: 30_000,

  expect: {
    timeout: 5_000,
  },

  /* Run tests in files in parallel */
  fullyParallel: true,

  /* Fail the build on CI if test.only is left in source code */
  forbidOnly: !!process.env.CI,

  /* Retry on CI only */
  retries: process.env.CI ? 2 : 0,

  /* Single worker on CI for stability */
  workers: process.env.CI ? 1 : undefined,

  /* Reporters */
  reporter: process.env.CI
    ? [['blob'], ['github']]
    : [['list'], ['html', { open: 'on-failure' }]],

  use: {
    baseURL: 'https://manual.manticoresearch.com',

    /* Record video, keep only on failure */
    video: 'retain-on-failure',

    /* Collect trace on first retry */
    trace: 'on-first-retry',

    /* Screenshot on failure */
    screenshot: 'only-on-failure',

    /* Timeouts */
    actionTimeout: 10_000,
    navigationTimeout: 15_000,
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
});
