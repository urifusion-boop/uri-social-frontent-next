/**
 * Playwright e2e — Jane + Ads campaign threads (Tier E) and the create flow.
 *
 * These run against a LOGGED-IN session. Because staging is auth-gated, provide a saved
 * auth state so the tests skip the login UI:
 *
 *   1. Log in once and save the session:
 *        npx playwright open --save-storage=e2e/.auth/state.json https://staging.urisocial.com
 *      (log in in the opened browser, then close it)
 *   2. Point the tests at it:
 *        BASE_URL=https://staging.urisocial.com \
 *        STORAGE_STATE=e2e/.auth/state.json \
 *        npx playwright test e2e/campaigns-threads.spec.ts
 *
 * The jane-ads API calls (plan/threads) are intercepted so the tests are deterministic
 * and never spend real ad budget or hit Meta — they exercise the UI's thread wiring,
 * not the backend (which has its own pytest suite).
 */
import { test, expect, Page } from '@playwright/test';

const CAMPAIGNS_URL = '/workspace/?tab=campaigns';

// Minimal fake backend for the jane-ads endpoints the page calls, so the thread rail
// behaves deterministically without a real brand/campaign.
async function mockJaneAds(page: Page, threads: Array<Record<string, unknown>> = []) {
  const store = { threads: [...threads] };

  await page.route('**/jane-ads/threads', async (route) => {
    if (route.request().method() === 'POST') {
      const t = {
        thread_id: 'thr_' + Math.random().toString(36).slice(2, 10),
        title: 'New campaign', status: 'draft', preview: '',
        created_at: '', updated_at: '',
      };
      store.threads.unshift(t);
      return route.fulfill({ json: t });
    }
    return route.fulfill({ json: { threads: store.threads } });
  });

  await page.route('**/jane-ads/threads/*/history', (route) =>
    route.fulfill({ json: { messages: [] } }));

  await page.route('**/jane-ads/meta/plan-from-message', (route) =>
    route.fulfill({
      json: {
        stage: 'need_more',
        understood: { missing: ['offer_type'] },
        question: 'What are you advertising — a product, a service, a promotion…?',
      },
    }));

  await page.route('**/jane-ads/chat/history/**', (route) => route.fulfill({ json: { ok: true } }));
  await page.route('**/jane-ads/admin/access', (route) => route.fulfill({ json: { allowed: false } }));
}

test.beforeEach(async ({ page }) => {
  await mockJaneAds(page);
  await page.goto(CAMPAIGNS_URL);
  await expect(page.getByRole('heading', { name: 'Campaigns' })).toBeVisible();
});

test('thread rail is visible with a New button', async ({ page }) => {
  await expect(page.getByRole('button', { name: /New campaign/i })).toBeVisible();
});

test('sending a first message creates a thread in the rail', async ({ page }) => {
  await page.getByPlaceholder(/Tell Jane what you want to promote/i).fill('Get me more customers in Surulere, ₦10k');
  await page.getByRole('button', { name: /^Send$/ }).click();
  // Jane's follow-up (from the mocked need_more) appears…
  await expect(page.getByText(/What are you advertising/i)).toBeVisible();
  // …and a thread now exists in the rail (created lazily on the first message).
  await expect(page.locator('text=New campaign')).toHaveCount(2); // the + New button + the created thread row
});

test('+ New starts a fresh conversation', async ({ page }) => {
  await page.getByPlaceholder(/Tell Jane/i).fill('an ad for my shop');
  await page.getByRole('button', { name: /^Send$/ }).click();
  await expect(page.getByText(/What are you advertising/i)).toBeVisible();
  await page.getByRole('button', { name: /New campaign/i }).click();
  // Back to just the greeting — the prior turn is not shown in the new thread.
  await expect(page.getByText('an ad for my shop')).toHaveCount(0);
});
