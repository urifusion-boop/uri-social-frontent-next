/**
 * Playwright e2e — the Jane + Ads destination step (choose_destination).
 *
 * The whole conversation, end to end: describe → objective → budget → WHERE THE AD
 * SENDS PEOPLE → image source → plan card. The destination step is asked just before
 * the image step on purpose (it decides the ad's button and the CTA baked into the
 * generated image), so this spec asserts that order as well as the card itself.
 *
 * Runs against a LOCAL dev server on this branch (npm run dev). Auth is faked by seeding
 * the localStorage keys the app reads, and every jane-ads API call is mocked so the run is
 * deterministic and never spends budget — this verifies the UI wiring, not the backend.
 */
import { test, expect, Page } from '@playwright/test';

async function fakeAuth(page: Page) {
  await page.addInitScript(() => {
    localStorage.setItem('@URI@AUTHENTICATED', 'true');
    localStorage.setItem('@URI@USER_TOKENS', JSON.stringify({ accessToken: 'test', refreshToken: 'test' }));
    localStorage.setItem('@URI@USER_DETAILS', JSON.stringify({ userId: 'u_test', email: 'test@uri', firstName: 'Test' }));
    localStorage.setItem('@URI@ACTIVE_BRAND_ID', 'brnd_personal_u_test');
  });
}

const DESTINATION_OPTIONS = [
  { value: 'whatsapp', label: 'My WhatsApp', hint: 'They tap and land in a WhatsApp chat with you, message already typed.', field: 'whatsapp_number', input_label: 'Your WhatsApp number', placeholder: '0803 123 4567', takes_cta: false, current: '2348031234567' },
  { value: 'website', label: 'My website', hint: 'They tap and open your site.', field: 'website_url', input_label: 'Your website', placeholder: 'yourshop.com', takes_cta: true, current: '' },
  { value: 'instagram_dm', label: 'My Instagram DMs', hint: 'They tap and land in your Instagram inbox.', field: 'instagram_username', input_label: 'Your Instagram handle', placeholder: '@yourbrand', takes_cta: true, current: '' },
  { value: 'custom', label: "A link I'll paste", hint: 'Anywhere else — a payment link, a form, a Linktree.', field: 'custom_url', input_label: 'Paste your link', placeholder: 'https://paystack.com/pay/your-store', takes_cta: true, current: '' },
];

const CTA_CHOICES = [
  { value: 'learn_more', label: 'Learn More' },
  { value: 'shop_now', label: 'Shop Now' },
  { value: 'order_now', label: 'Order Now' },
  { value: 'book_now', label: 'Book Now' },
];

const PIXEL =
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=';

/** Records every plan-from-message request body so the test can assert what the UI sent. */
type Sent = Record<string, unknown>;

async function mockJaneAds(page: Page, sent: Sent[], opts: { rejectFirstLink?: boolean } = {}) {
  await page.route('**/jane-ads/admin/access', (r) => r.fulfill({ json: { allowed: false } }));
  await page.route('**/jane-ads/wallet', (r) => r.fulfill({ json: { balance_ngn: 50000, currency: 'NGN', min_topup_ngn: 1000, transactions: [] } }));
  await page.route('**/jane-ads/threads', (r) =>
    r.request().method() === 'POST'
      ? r.fulfill({ json: { thread_id: 'thr_test', title: 'New campaign', status: 'draft', preview: '', created_at: '', updated_at: '' } })
      : r.fulfill({ json: { threads: [] } }));
  await page.route('**/jane-ads/threads/*/history', (r) => r.fulfill({ json: { messages: [] } }));
  await page.route('**/jane-ads/chat/history**', (r) => r.fulfill({ json: r.request().method() === 'GET' ? { messages: [] } : { ok: true } }));
  await page.route('**/jane-ads/creative/drafts**', (r) => r.fulfill({ json: { drafts: [] } }));

  let step = 0;
  let rejectedOnce = false;
  await page.route('**/jane-ads/meta/plan-from-message', async (route) => {
    const body = JSON.parse(route.request().postData() || '{}');
    sent.push(body);

    // A concrete image source means the destination is already settled — build the plan.
    if (['generate', 'upload', 'draft', 'recomposite'].includes(body.creative_source)) {
      return route.fulfill({ json: {
        stage: 'planned', plan_id: 'plan_test',
        plan: { goal: 'messages', behaviour: 'discover', explanation: 'why', platforms: [{ platform: 'meta', budget_ngn: 5000, days: 3, variants: 1, test_scope: 'none' }] },
        creative: { image_url: PIXEL, headline: 'Fresh Lunch', primary_text: 'Hot meals near you.', cta: 'Shop Now' },
        destination_type: 'custom', destination_link: 'https://paystack.com/pay/uri-store', destination_cta: 'shop_now',
        wallet: { balance_ngn: 50000, budget_ngn: 5000, service_fee_ngn: 500, total_due_ngn: 5500, sufficient: true },
      } });
    }

    // Answering the destination picker.
    if (body.destination_type && body.destination_type !== 'ask') {
      if (opts.rejectFirstLink && !rejectedOnce) {
        rejectedOnce = true;
        return route.fulfill({ json: {
          stage: 'choose_destination', understood: {},
          question: 'Where should people who tap your ad end up?',
          destination_options: DESTINATION_OPTIONS, cta_choices: CTA_CHOICES,
          selected: { destination_type: body.destination_type, destination_cta: body.destination_cta },
          error: "That link doesn't look right — paste the full address, e.g. https://paystack.com/pay/your-store.",
        } });
      }
      return route.fulfill({ json: { stage: 'choose_creative_source', understood: {}, creative_options: { can_generate: true, drafts: [] } } });
    }

    step += 1;
    if (step === 1) return route.fulfill({ json: { stage: 'need_more', understood: { missing: ['offer_type'] }, question: 'What are you advertising — a product, a service…?' } });
    if (step === 2) return route.fulfill({ json: { stage: 'need_more', understood: { missing: ['budget_ngn'] }, question: 'What budget would you like?' } });
    // Budget answered → the destination step, BEFORE the image step.
    return route.fulfill({ json: {
      stage: 'choose_destination', understood: {},
      question: 'Where should people who tap your ad end up?',
      destination_options: DESTINATION_OPTIONS, cta_choices: CTA_CHOICES,
      selected: { destination_type: 'whatsapp', destination_cta: 'learn_more' },
      explanation: 'Targeting Surulere, where your customers already are.',
    } });
  });
}

async function walkToDestinationStep(page: Page) {
  await page.goto('/workspace/?tab=campaigns');
  await expect(page.getByRole('heading', { name: 'Campaigns' })).toBeVisible({ timeout: 20000 });

  const input = page.getByPlaceholder(/Tell Jane what you want to promote/i);
  await input.fill('get me more orders for my restaurant in surulere');
  await input.press('Enter');

  await expect(page.getByText(/What are you advertising/i)).toBeVisible();
  await page.getByRole('button', { name: 'Product' }).click({ force: true });

  await expect(page.getByText(/budget/i).first()).toBeVisible();
  await page.getByRole('button', { name: /₦5,000 budget/ }).click({ force: true });
}

test('describe → objective → budget → destination → image → plan', async ({ page }) => {
  const sent: Sent[] = [];
  await fakeAuth(page);
  await mockJaneAds(page, sent);
  await walkToDestinationStep(page);

  // 1. THE step under test — asked BEFORE the image options, with all four choices.
  await expect(page.getByText(/Where should people who tap your ad end up/i)).toBeVisible();
  await expect(page.getByRole('button', { name: /My WhatsApp/ })).toBeVisible();
  await expect(page.getByRole('button', { name: /My website/ })).toBeVisible();
  await expect(page.getByRole('button', { name: /My Instagram DMs/ })).toBeVisible();
  await expect(page.getByRole('button', { name: /A link I'll paste/ })).toBeVisible();
  // The image step must NOT have run yet — the destination decides the CTA baked into it.
  await expect(page.getByText(/how would you like to handle the image/i)).toHaveCount(0);

  // 2. WhatsApp is preselected (this brand has a number saved) — prefilled, no button picker.
  await expect(page.getByLabel('Your WhatsApp number')).toHaveValue('2348031234567');
  await expect(page.getByLabel('What should the button say?')).toHaveCount(0);

  // 3. Switch to "a link I'll paste" — the input relabels and the button picker appears.
  await page.getByRole('button', { name: /A link I'll paste/ }).click({ force: true });
  const linkInput = page.getByLabel('Paste your link');
  await expect(linkInput).toHaveValue('');
  await expect(linkInput).toHaveAttribute('placeholder', /paystack/i);
  await page.getByLabel('What should the button say?').selectOption('shop_now');

  // 4. Submit the link.
  await linkInput.fill('https://paystack.com/pay/uri-store');
  await page.getByRole('button', { name: 'Use this' }).click({ force: true });

  // The UI sent the answer in the shape the backend reads.
  await expect.poll(() => sent.at(-1)).toMatchObject({
    destination_type: 'custom',
    destination_value: 'https://paystack.com/pay/uri-store',
    destination_cta: 'shop_now',
    creative_source: 'ask',
  });

  // 5. The flow continues to the image step (it was never skipped).
  await expect(page.getByText(/how would you like to handle the image/i)).toBeVisible();
  await page.getByRole('button', { name: /Let Jane create one/i }).click({ force: true });

  // 6. The plan card renders with the chosen button.
  await expect(page.getByText('Fresh Lunch')).toBeVisible();
  await expect(page.getByRole('button', { name: /Looks good — launch it/i })).toBeVisible();
});

test('a link the backend rejects reopens the picker with the reason, not a dead error', async ({ page }) => {
  const sent: Sent[] = [];
  await fakeAuth(page);
  await mockJaneAds(page, sent, { rejectFirstLink: true });
  await walkToDestinationStep(page);

  await expect(page.getByText(/Where should people who tap your ad end up/i)).toBeVisible();
  await page.getByRole('button', { name: /A link I'll paste/ }).click({ force: true });
  await page.getByLabel('Paste your link').fill('my shop');
  await page.getByRole('button', { name: 'Use this' }).click({ force: true });

  // The picker comes back with the server's own wording, still usable. It arrives as a
  // NEW chat message and the rejected card stays above it (the thread is never
  // rewritten) — but that older card is now inert, so it can't resubmit the bad value
  // over this answer. Hence .last() for the live one.
  await expect(page.getByText(/That link doesn't look right/i)).toBeVisible();
  const retry = page.getByLabel('Paste your link').last();
  await expect(retry).toBeVisible();

  // The superseded picker is history: still readable, still showing exactly what the
  // user typed (going stale must not rewrite it), but inert — clicking its Save button
  // sends nothing.
  const stalePicker = page.getByLabel('Paste your link').first();
  await expect(stalePicker).toBeVisible();
  await expect(stalePicker).toHaveValue('my shop');
  const before = sent.length;
  await page.getByRole('button', { name: 'Use this' }).first().click({ force: true });
  await page.waitForTimeout(300);
  expect(sent.length).toBe(before);

  // And a corrected link on the live card goes through.
  await retry.fill('https://paystack.com/pay/uri-store');
  await page.getByRole('button', { name: 'Use this' }).last().click({ force: true });
  await expect(page.getByText(/how would you like to handle the image/i)).toBeVisible();
});

test('a returning brand with a destination already saved is not re-asked', async ({ page }) => {
  const sent: Sent[] = [];
  await fakeAuth(page);
  await fakeAuth(page);
  // Backend resolves the saved destination and goes straight to the image step.
  await page.route('**/jane-ads/admin/access', (r) => r.fulfill({ json: { allowed: false } }));
  await page.route('**/jane-ads/wallet', (r) => r.fulfill({ json: { balance_ngn: 50000, currency: 'NGN', min_topup_ngn: 1000, transactions: [] } }));
  await page.route('**/jane-ads/threads', (r) =>
    r.request().method() === 'POST'
      ? r.fulfill({ json: { thread_id: 'thr_test', title: 'New campaign', status: 'draft', preview: '', created_at: '', updated_at: '' } })
      : r.fulfill({ json: { threads: [] } }));
  await page.route('**/jane-ads/threads/*/history', (r) => r.fulfill({ json: { messages: [] } }));
  await page.route('**/jane-ads/chat/history**', (r) => r.fulfill({ json: r.request().method() === 'GET' ? { messages: [] } : { ok: true } }));
  await page.route('**/jane-ads/creative/drafts**', (r) => r.fulfill({ json: { drafts: [] } }));
  await page.route('**/jane-ads/meta/plan-from-message', async (route) => {
    sent.push(JSON.parse(route.request().postData() || '{}'));
    return route.fulfill({ json: { stage: 'choose_creative_source', understood: {}, creative_options: { can_generate: true, drafts: [] } } });
  });

  await page.goto('/workspace/?tab=campaigns');
  await expect(page.getByRole('heading', { name: 'Campaigns' })).toBeVisible({ timeout: 20000 });
  const input = page.getByPlaceholder(/Tell Jane what you want to promote/i);
  await input.fill('same again, ₦5,000');
  await input.press('Enter');

  await expect(page.getByText(/how would you like to handle the image/i)).toBeVisible();
  await expect(page.getByText(/Where should people who tap your ad end up/i)).toHaveCount(0);
});

test('a superseded question card cannot be answered again', async ({ page }) => {
  const sent: Sent[] = [];
  await fakeAuth(page);
  await mockJaneAds(page, sent);
  await walkToDestinationStep(page);

  await expect(page.getByText(/Where should people who tap your ad end up/i)).toBeVisible();
  await page.getByRole('button', { name: 'Use this' }).click({ force: true });
  await expect(page.getByText(/how would you like to handle the image/i)).toBeVisible();

  const answered = sent.length;

  // The destination picker is still on screen — the thread is a real conversation, so
  // nothing is removed — but it's now history and must not fire. Force-clicking its
  // buttons sends nothing, and it doesn't even change its own selection.
  await expect(page.getByText(/Where should people who tap your ad end up/i)).toBeVisible();
  await page.getByRole('button', { name: /My website/ }).click({ force: true });
  await page.getByRole('button', { name: 'Use this' }).click({ force: true });
  await page.waitForTimeout(300);
  expect(sent.length).toBe(answered);
  // Still showing the WhatsApp option it was answered with, not the one just clicked.
  await expect(page.getByLabel('Your WhatsApp number')).toBeVisible();

  // The live card below it still works.
  await expect(page.getByRole('button', { name: /Let Jane create one/i })).toBeVisible();
});
