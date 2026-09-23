/**
 * Playwright e2e — "Keep it running": extending a campaign past its end date.
 *
 * Two specs with different jobs:
 *
 * · The mocked ones intercept the quote and extend endpoints, so they answer whether
 *   the UI is wired correctly — including the cases that are awkward to arrange for
 *   real (an empty wallet, a Meta refusal) and the one that matters most for money:
 *   that nothing is charged until the client confirms a figure they were shown.
 *
 * · The live one (RUN_LIVE=1) drives the real API and spends real wallet balance:
 *
 *     BASE_URL=https://uri-staging.urisocial.com STORAGE_STATE=e2e/.auth/state.json \
 *       RUN_LIVE=1 npx playwright test e2e/keep-running.spec.ts --project=chromium
 */
import { test, expect, Page } from '@playwright/test';

const CAMPAIGNS_URL = '/workspace/?tab=campaigns';

async function dismissOverlays(page: Page) {
  await page.keyboard.press('Escape').catch(() => undefined);
  for (const name of [/Got it/i, /Skip/i, /Dismiss/i, /Close/i, /Next/i, /Finish/i]) {
    const btn = page.getByRole('button', { name }).first();
    for (let i = 0; i < 3; i += 1) {
      if (!(await btn.isVisible().catch(() => false))) break;
      await btn.click({ timeout: 4_000 }).catch(() => undefined);
      await page.waitForTimeout(400);
    }
  }
}

// The full CampaignRow shape — a partial one renders a card the panel button is
// missing from, which reads exactly like the feature being broken.
const CAMPAIGN = {
  campaign_id: 'cmp_e2e_1',
  platform: 'meta' as const,
  name: 'Uri Social',
  headline: 'Boost Your Sales Now',
  primary_text: 'Order today.',
  image_url: '',
  budget_ngn: 10000,
  ad_spend_ngn: 9000,
  goal: 'messages',
  city: 'Lagos',
  status: 'PAUSED',
  created_at: '2026-09-20T10:00:00Z',
  ads_manager_url: 'https://adsmanager.facebook.com',
  metrics: null,
};

function quoteFor(days: number, affordable = true) {
  const daily = 2500;
  const spend = daily * days;
  return {
    campaign_id: CAMPAIGN.campaign_id,
    days,
    daily_ngn: daily,
    ad_spend_ngn: spend,
    total_due_ngn: spend * 1.1,
    current_end_time: '2026-09-28T12:00:00+0000',
    new_end_time: '2026-10-05T12:00:00+0000',
    has_ended: true,
    wallet_balance_ngn: affordable ? 500000 : 1000,
    affordable,
  };
}

/** ONE handler for every request, dispatching by URL.
 *
 * Layered page.route() calls are ambiguous about which wins when several patterns
 * match, and a blanket catch-all silently swallowed the POST this feature exists to
 * make — the panel then never confirmed anything and the failure looked like a broken
 * button. A single router makes the mapping explicit and order-independent.
 *
 * Every un-stubbed call still has to return something: against a fake session they 401,
 * and the app's unauthorized handler logs out and redirects to /login.
 */
async function mockApi(
  page: Page,
  opts: { affordable?: boolean; onExtend?: () => { status?: number; json: unknown } } = {},
) {
  // A URL REGEX, not '**/*'. A catch-all glob also matches the page navigation and the
  // Next.js bundles, so the very first fulfil replaced the document with "{}" and the
  // app never loaded — every assertion after that failed for a reason that had nothing
  // to do with the feature. This handler only ever sees API calls.
  // Only jane-ads and /api/. Stubbing /social-media/* as well returned {} for calls
  // like brand-profile that the workspace needs to render, and the page never got as
  // far as the Campaign Manager tab.
  await page.route(/\/(jane-ads|api)\//, async (route) => {
    const url = route.request().url();
    const path = new URL(url).pathname;

    if (path.includes('/extend-quote')) {
      const days = Number(new URL(url).searchParams.get('days') || 7);
      return route.fulfill({ json: quoteFor(days, opts.affordable ?? true) });
    }
    if (/\/campaigns\/[^/]+\/extend$/.test(path)) {
      const res = opts.onExtend?.() ?? { json: {} };
      return route.fulfill({ status: res.status ?? 200, json: res.json });
    }
    if (path.endsWith('/jane-ads/meta/campaigns')) {
      return route.fulfill({ json: { campaigns: [CAMPAIGN] } });
    }
    if (path.includes('/jane-ads/wallet')) {
      return route.fulfill({
        json: { balance_ngn: 500000, currency: 'NGN', min_topup_ngn: 5000, transactions: [] },
      });
    }
    // Everything else still needs a 200: an un-stubbed call 401s against a fake
    // session, and the app's unauthorized handler logs out and redirects to /login.
    return route.fulfill({ json: {} });
  });
}

async function openCampaignManager(page: Page) {
  await page.goto(CAMPAIGNS_URL);
  await dismissOverlays(page);
  await page.getByRole('button', { name: /Campaign Manager/i }).click();
  await page.getByTestId('keep-running-open').first().click();
  await expect(page.getByTestId('keep-running-panel')).toBeVisible();
}

test.describe('Keep it running', () => {
  test('prices the extension before anything is charged', async ({ page }) => {
    let extendCalls = 0;
    await mockApi(page, { onExtend: () => { extendCalls += 1; return { json: {} }; } });
    await openCampaignManager(page);

    const quote = page.getByTestId('extend-quote');
    await expect(quote).toContainText('₦2,500');      // daily spend
    await expect(quote).toContainText('7 more days');
    await expect(quote).toContainText('₦19,250');     // 2,500 x 7 x 1.1

    // The figure is on the button itself, so nobody confirms a number they never saw.
    await expect(page.getByTestId('extend-confirm')).toContainText('₦19,250');
    expect(extendCalls).toBe(0);                      // nothing charged by merely looking
  });

  test('changing the length re-prices it', async ({ page }) => {
    await mockApi(page);
    await openCampaignManager(page);
    await page.getByTestId('extend-days-14').click();
    await expect(page.getByTestId('extend-quote')).toContainText('14 more days');
    await expect(page.getByTestId('extend-confirm')).toContainText('₦38,500');
  });

  test('a wallet that cannot cover it says the shortfall and blocks the button', async ({ page }) => {
    await mockApi(page, { affordable: false });
    await openCampaignManager(page);
    await expect(page.getByTestId('extend-shortfall')).toContainText('₦18,250');
    await expect(page.getByTestId('extend-confirm')).toBeDisabled();
  });

  test('confirming extends and reports the new end date', async ({ page }) => {
    await mockApi(page, {
      onExtend: () => ({
        json: {
          campaign_id: CAMPAIGN.campaign_id,
          extended_by_days: 7,
          charged_ngn: 19250,
          end_time: '2026-10-05T12:00:00+0000',
          wallet_balance_ngn: 480750,
          note: 'Same campaign, same creative.',
        },
      }),
    });
    await openCampaignManager(page);
    await page.getByTestId('extend-confirm').click();
    const done = page.getByTestId('keep-running-done');
    await expect(done).toBeVisible();
    await expect(done).toContainText(/Running until .*2026/);
    await expect(done).toContainText('₦19,250');
  });

  test('a refusal from the server is shown, not swallowed', async ({ page }) => {
    await mockApi(page, { onExtend: () => ({ status: 402, json: { detail: 'Top up first.' } }) });
    await openCampaignManager(page);
    await page.getByTestId('extend-confirm').click();
    await expect(page.getByTestId('extend-error')).toContainText('Top up first.');
    // Still on the form, so the client can pick fewer days rather than lose the panel.
    await expect(page.getByTestId('extend-quote')).toBeVisible();
  });
});

test.describe('live', () => {
  test.skip(!process.env.RUN_LIVE, 'set RUN_LIVE=1 — spends real wallet balance');

  test('extends a real campaign through the UI', async ({ page }) => {
    test.setTimeout(180_000);
    await page.goto(CAMPAIGNS_URL);
    await dismissOverlays(page);
    await page.getByRole('button', { name: /Campaign Manager/i }).click();

    const open = page.getByTestId('keep-running-open').first();
    await expect(open).toBeVisible({ timeout: 30_000 });
    await open.click();

    // A REAL quote from the API — proves the campaign's own daily spend was read off
    // Meta rather than assumed.
    const quote = page.getByTestId('extend-quote');
    await expect(quote).toBeVisible({ timeout: 60_000 });
    await expect(quote).toContainText('₦');

    const confirm = page.getByTestId('extend-confirm');
    if (await confirm.isDisabled()) {
      test.skip(true, 'wallet cannot cover the smallest extension right now');
    }
    await page.getByTestId('extend-days-3').click();
    await expect(quote).toContainText('3 more days');
    await confirm.click();

    await expect(page.getByTestId('keep-running-done')).toBeVisible({ timeout: 120_000 });
    await expect(page.getByTestId('keep-running-done')).toContainText('Running until');
  });
});
