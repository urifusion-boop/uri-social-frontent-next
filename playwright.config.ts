import { defineConfig, devices } from '@playwright/test';

/**
 * Playwright config for the Jane + Ads e2e specs (e2e/*.spec.ts).
 * Auth-gated app: pass a saved session via STORAGE_STATE (see the spec header).
 *
 *   BASE_URL=https://staging.urisocial.com STORAGE_STATE=e2e/.auth/state.json \
 *     npx playwright test
 */
export default defineConfig({
  testDir: './e2e',
  timeout: 60_000,
  expect: { timeout: 10_000 },
  use: {
    baseURL: process.env.BASE_URL || 'http://localhost:3000',
    storageState: process.env.STORAGE_STATE || undefined,
    trace: 'on-first-retry',
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
});
