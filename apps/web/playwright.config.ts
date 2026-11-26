import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  retries: 0,
  reporter: 'list',
  use: {
    baseURL: 'http://127.0.0.1:3123',
    trace: 'on-first-retry',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  webServer: {
    command:
      '../../node_modules/.bin/next build && ../../node_modules/.bin/next start -p 3123 -H 127.0.0.1',
    url: 'http://127.0.0.1:3123',
    reuseExistingServer: !process.env.CI,
    timeout: 180_000,
  },
});
