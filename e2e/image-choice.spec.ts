/**
 * Playwright e2e — the Jane + Ads image-selection flow (after budget: upload / past post /
 * let Jane generate) and the objective→budget→image→plan conversation.
 *
 * Runs against a LOCAL dev server on this branch (npm run dev). Auth is faked by seeding
 * the localStorage keys the app reads, and every jane-ads API call is mocked so the run is
 * deterministic and never spends budget — this verifies the UI wiring, not the backend.
 */
import { test, expect, Page } from '@playwright/test';

// Seed a fake logged-in session (the keys src/configs/store.config.ts reads).
async function fakeAuth(page: Page) {
  await page.addInitScript(() => {
    localStorage.setItem('@URI@AUTHENTICATED', 'true');
    localStorage.setItem('@URI@USER_TOKENS', JSON.stringify({ accessToken: 'test', refreshToken: 'test' }));
    localStorage.setItem('@URI@USER_DETAILS', JSON.stringify({ userId: 'u_test', email: 'test@uri', firstName: 'Test' }));
    localStorage.setItem('@URI@ACTIVE_BRAND_ID', 'brnd_personal_u_test');
  });
}

async function mockJaneAds(page: Page) {
  // Non-critical reads.
  await page.route('**/jane-ads/admin/access', (r) => r.fulfill({ json: { allowed: false } }));
  await page.route('**/jane-ads/wallet', (r) => r.fulfill({ json: { balance_ngn: 50000, currency: 'NGN', min_topup_ngn: 1000, transactions: [] } }));
  await page.route('**/jane-ads/threads', (r) =>
    r.request().method() === 'POST'
      ? r.fulfill({ json: { thread_id: 'thr_test', title: 'New campaign', status: 'draft', preview: '', created_at: '', updated_at: '' } })
      : r.fulfill({ json: { threads: [] } }));
  await page.route('**/jane-ads/threads/*/history', (r) => r.fulfill({ json: { messages: [] } }));
  await page.route('**/jane-ads/chat/history**', (r) => r.fulfill({ json: r.request().method() === 'GET' ? { messages: [] } : { ok: true } }));
  await page.route('**/jane-ads/creative/drafts**', (r) => r.fulfill({ json: { drafts: [] } }));

  // The plan flow — step through the stages based on the request body.
  let step = 0;
  await page.route('**/jane-ads/meta/plan-from-message', async (route) => {
    const body = JSON.parse(route.request().postData() || '{}');
    const src = body.creative_source;
    if (src === 'generate' || src === 'upload' || src === 'draft') {
      return route.fulfill({ json: {
        stage: 'planned', plan_id: 'plan_test',
        plan: { goal: 'messages', behaviour: 'discover', explanation: 'why', platforms: [{ platform: 'meta', budget_ngn: 5000, days: 3, variants: 1, test_scope: 'none' }] },
        creative: { image_url: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=', headline: 'Fresh Lunch', primary_text: 'Hot meals near you.', cta: 'Send WhatsApp Message' },
        whatsapp_number: '2348031234567',
        wallet: { balance_ngn: 50000, budget_ngn: 5000, service_fee_ngn: 500, total_due_ngn: 5500, sufficient: true },
      } });
    }
    // creative_source === 'ask' (or unset): walk objective → budget → choose.
    step += 1;
    if (step === 1) return route.fulfill({ json: { stage: 'need_more', understood: { missing: ['offer_type'] }, question: 'What are you advertising — a product, a service…?' } });
    if (step === 2) return route.fulfill({ json: { stage: 'need_more', understood: { missing: ['budget_ngn'] }, question: 'What budget would you like?' } });
    return route.fulfill({ json: { stage: 'choose_creative_source', understood: {}, creative_options: { can_generate: true, drafts: [] } } });
  });
}

test('objective → budget → image choice → plan', async ({ page }) => {
  await fakeAuth(page);
  await mockJaneAds(page);
  await page.goto('/workspace/?tab=campaigns');

  await expect(page.getByRole('heading', { name: 'Campaigns' })).toBeVisible({ timeout: 20000 });

  // 1. Describe the campaign (Enter submits — avoids the floating dev widget over Send).
  const input = page.getByPlaceholder(/Tell Jane what you want to promote/i);
  await input.fill('get me more whatsapp messages for my restaurant in surulere');
  await input.press('Enter');

  // Chat auto-scrolls on new messages and a floating dev-only debug widget overlays
  // fixed-position elements in this local harness (neither present in production), so
  // force:true is used throughout — actionability (visible/attached) is still asserted
  // via the expect()s before each click.

  // 2. Objective question + chips → pick Product.
  await expect(page.getByText(/What are you advertising/i)).toBeVisible();
  await page.getByRole('button', { name: 'Product' }).click({ force: true });

  // 3. Budget question → answer with a chip.
  await expect(page.getByText(/budget/i).first()).toBeVisible();
  await page.getByRole('button', { name: /₦5,000 budget/ }).click({ force: true });

  // 4. THE fix under test — the three image options appear (not an auto-generated image).
  await expect(page.getByText(/how would you like to handle the image/i)).toBeVisible();
  await expect(page.getByRole('button', { name: /Let Jane create one/i })).toBeVisible();
  await expect(page.getByRole('button', { name: /Upload my own/i })).toBeVisible();

  // 5. Let Jane generate → the plan/review card renders.
  await page.getByRole('button', { name: /Let Jane create one/i }).click({ force: true });
  await expect(page.getByText('Fresh Lunch')).toBeVisible();
  await expect(page.getByRole('button', { name: /Looks good — launch it/i })).toBeVisible();

  // 6. Tapping the campaign image opens a full-size lightbox. The chat auto-scrolls
  // smoothly on new messages, which can race a click against the settling scroll, so
  // retry the click until the modal (a second "campaign visual" img + Close button)
  // actually appears rather than asserting on the always-visible thumbnail.
  const imageButton = page.getByRole('button', { name: /View full campaign visual/i });
  const closeButton = page.getByRole('button', { name: 'Close' });
  await imageButton.scrollIntoViewIfNeeded();
  await expect(async () => {
    if (await closeButton.count()) return;
    await imageButton.click({ force: true, timeout: 2000 });
    await expect(page.locator('img[alt="campaign visual"]')).toHaveCount(2, { timeout: 1000 });
  }).toPass({ timeout: 10000 });
  await expect(closeButton).toBeVisible();
  await closeButton.click();
  await expect(closeButton).toHaveCount(0);
});
