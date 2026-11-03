/* global process */
import { defineConfig } from '@playwright/test';

const baseURL = process.env.BASE_URL || 'http://localhost:3000';
const isLocal = baseURL.includes('localhost') || baseURL.includes('127.0.0.1');

export default defineConfig({
  testDir: './tests',
  fullyParallel: false,
  workers: 1,
  reporter: [
    ['list'],
    ['json', { outputFile: 'playwright-report/results.json' }],
    ['html', { open: 'never', outputFolder: 'playwright-report/html' }]
  ],
  use: {
    baseURL,
    channel: 'chrome',
    headless: true,
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    viewport: { width: 1280, height: 720 },
  },
  ...(isLocal
    ? {
        webServer: {
          command: 'npm run dev',
          url: 'http://localhost:3000',
          reuseExistingServer: true,
          timeout: 60000,
        },
      }
    : {}),
});
