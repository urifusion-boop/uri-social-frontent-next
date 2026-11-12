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

test('meta_connection_ads_no_whatsapp points to Connected Accounts', async ({ page }) => {
  await fakeAuth(page);
  await mockBase(page);
  await page.route('**/jane-ads/meta/plan-from-message', (r) =>
    r.fulfill({
      json: {
        stage: 'meta_connection_ads_no_whatsapp',
        understood: {},
        page_name: 'Test Page',
      },
    })
  );
  await page.goto('/workspace/?tab=campaigns');
  await expect(page.getByRole('heading', { name: 'Campaigns' })).toBeVisible({ timeout: 20000 });
  const input = page.getByPlaceholder(/Tell Jane what you want to promote/i);
  await input.fill('solar installer, budget 80000, lekki');
  await input.press('Enter');

  const link = page.getByRole('link', { name: /Manage this number anytime in Connected Accounts/i });
  await expect(link).toBeVisible();
  await expect(link).toHaveAttribute('href', '/workspace?tab=connections');
  // The stale "link it to your Page under Facebook Page Settings" instruction must be gone.
  await expect(page.getByText(/one-time code/i)).toHaveCount(0);
});

test('a WhatsApp-shaped launch error offers the Connected Accounts link too', async ({ page }) => {
  await fakeAuth(page);
  await mockBase(page);
  let launchAttempts = 0;
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
  await page.route('**/jane-ads/meta/plan/*/launch', (r) => {
    launchAttempts++;
    return r.fulfill({
      status: 400,
      json: { detail: 'That WhatsApp number looks invalid — please check the format.' },
    });
  });

  await page.goto('/workspace/?tab=campaigns');
  await expect(page.getByRole('heading', { name: 'Campaigns' })).toBeVisible({ timeout: 20000 });
  const input = page.getByPlaceholder(/Tell Jane what you want to promote/i);
  await input.fill('solar installer, budget 80000, lekki');
  await input.press('Enter');

  await page.getByRole('button', { name: /Looks good — launch it/i }).click({ force: true });
  await expect(page.getByText(/looks invalid/i)).toBeVisible();

  const link = page.getByRole('link', { name: /Manage this number anytime in Connected Accounts/i });
  await expect(link).toBeVisible();
  expect(launchAttempts).toBe(1);
});
