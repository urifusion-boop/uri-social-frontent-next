/**
 * A video launch can outlast the connection (the TikTok video is re-encoded first), so
 * the launch request may drop while the launch itself goes through. Live 2026-11-12:
 * the page then said "already being launched" / "Could not load the ad details" for an
 * ad that had in fact launched. The card must follow the plan's real status instead.
 */
import { test, expect, Page } from '@playwright/test';

async function fakeAuth(page: Page) {
  await page.addInitScript(() => {
    localStorage.setItem('@URI@AUTHENTICATED', 'true');
    localStorage.setItem('@URI@USER_TOKENS', JSON.stringify({ accessToken: 'test', refreshToken: 'test' }));
    localStorage.setItem(
      '@URI@USER_DETAILS',
      JSON.stringify({ userId: 'u_test', email: 'test@uri', firstName: 'Test' })
    );
    localStorage.setItem('@URI@ACTIVE_BRAND_ID', 'brnd_personal_u_test');
  });
}

async function mockBase(page: Page) {
  await page.route('**/jane-ads/admin/access', (r) => r.fulfill({ json: { allowed: false } }));
  await page.route('**/jane-ads/wallet', (r) =>
    r.fulfill({ json: { balance_ngn: 500000, currency: 'NGN', min_topup_ngn: 1000, transactions: [] } })
  );
  await page.route('**/jane-ads/threads', (r) =>
    r.request().method() === 'POST'
      ? r.fulfill({
          json: {
            thread_id: 'thr_test',
            title: 'New campaign',
            status: 'draft',
            preview: '',
            created_at: '',
            updated_at: '',
          },
        })
      : r.fulfill({ json: { threads: [] } })
  );
  await page.route('**/jane-ads/threads/*/history', (r) => r.fulfill({ json: { messages: [] } }));
  await page.route('**/jane-ads/chat/history**', (r) =>
    r.fulfill({ json: r.request().method() === 'GET' ? { messages: [] } : { ok: true } })
  );
}

test('a dropped launch request follows through to the launched campaign, no error', async ({ page }) => {
  await fakeAuth(page);
  await mockBase(page);
  await page.route('**/jane-ads/meta/plan-from-message', (r) =>
    r.fulfill({
      json: {
        stage: 'planned',
        plan_id: 'plan_1',
        plan: {
          goal: 'messages',
          behaviour: 'discover',
          explanation: 'x',
          platforms: [{ platform: 'meta', budget_ngn: 80000, days: 7, variants: 1, test_scope: 'none' }],
        },
        creative: { image_url: 'https://cdn/a.png', headline: 'h', primary_text: 'p', cta: 'Send WhatsApp Message' },
        whatsapp_number: '2348031234567',
        wallet: {
          balance_ngn: 500000,
          budget_ngn: 80000,
          service_fee_ngn: 8000,
          total_due_ngn: 88000,
          sufficient: true,
        },
      },
    })
  );
  let launchClicked = false;
  let statusCalls = 0;
  await page.route('**/jane-ads/meta/plan/*/launch', (r) => {
    launchClicked = true;
    return r.abort('timedout');
  });
  await page.route('**/jane-ads/meta/plan/*/status', (r) => {
    if (!launchClicked)
      return r.fulfill({ json: { status: 'pending', campaign_id: '', platform: 'meta', last_launch_error: '' } });
    statusCalls++;
    return r.fulfill({
      json:
        statusCalls < 2
          ? { status: 'launching', campaign_id: '', platform: 'meta', last_launch_error: '' }
          : { status: 'launched', campaign_id: 'cmp_123', platform: 'meta', last_launch_error: '' },
    });
  });

  await page.goto('/workspace/?tab=campaigns');
  await expect(page.getByRole('heading', { name: 'Campaigns' })).toBeVisible({ timeout: 20000 });
  const input = page.getByPlaceholder(/Tell Jane what you want to promote/i);
  await input.fill('solar installer, budget 80000, lekki');
  await input.press('Enter');

  await page.getByRole('button', { name: /Looks good — launch/i }).click({ force: true });
  await expect(page.getByText(/Launching… video ads can take a few minutes/i)).toBeVisible();
  await expect(page.getByText(/Campaign created on/i)).toBeVisible({ timeout: 30000 });
  await expect(page.getByText(/already being launched|Could not launch|Could not load the ad details/i)).toHaveCount(0);
});

test('a launch that really failed says so, and that nothing was charged', async ({ page }) => {
  await fakeAuth(page);
  await mockBase(page);
  await page.route('**/jane-ads/meta/plan-from-message', (r) =>
    r.fulfill({
      json: {
        stage: 'planned',
        plan_id: 'plan_1',
        plan: {
          goal: 'messages',
          behaviour: 'discover',
          explanation: 'x',
          platforms: [{ platform: 'meta', budget_ngn: 80000, days: 7, variants: 1, test_scope: 'none' }],
        },
        creative: { image_url: 'https://cdn/a.png', headline: 'h', primary_text: 'p', cta: 'Send WhatsApp Message' },
        whatsapp_number: '2348031234567',
        wallet: {
          balance_ngn: 500000,
          budget_ngn: 80000,
          service_fee_ngn: 8000,
          total_due_ngn: 88000,
          sufficient: true,
        },
      },
    })
  );
  let launchClicked = false;
  await page.route('**/jane-ads/meta/plan/*/launch', (r) => {
    launchClicked = true;
    return r.fulfill({ status: 504, body: 'Gateway Timeout' });
  });
  await page.route('**/jane-ads/meta/plan/*/status', (r) =>
    r.fulfill({
      json: launchClicked
        ? { status: 'pending', campaign_id: '', platform: 'meta', last_launch_error: 'TikTok rejected the video.' }
        : { status: 'pending', campaign_id: '', platform: 'meta', last_launch_error: '' },
    })
  );

  await page.goto('/workspace/?tab=campaigns');
  await expect(page.getByRole('heading', { name: 'Campaigns' })).toBeVisible({ timeout: 20000 });
  const input = page.getByPlaceholder(/Tell Jane what you want to promote/i);
  await input.fill('solar installer, budget 80000, lekki');
  await input.press('Enter');

  await page.getByRole('button', { name: /Looks good — launch/i }).click({ force: true });
  await expect(page.getByText(/didn't go through: TikTok rejected the video\. Nothing was charged/i)).toBeVisible({
    timeout: 20000,
  });
});
