/**
 * Playwright e2e — TikTok ads are TikTok all the way through, with no Meta wording,
 * stages or links leaking in.
 *
 * TikTok ads are not a separate section: they are the TikTok option of the Campaigns
 * chat, built Meta-first. Every platform shares the /jane-ads/meta/* endpoints, so the
 * URL cannot tell the platforms apart. What can leak is the Meta copy and the Meta
 * "connect your Facebook Page" prompts, and that is what these specs pin down.
 *
 * The mocked specs fake auth (like plan-defence.spec.ts) and never spend budget:
 *
 *     npm run dev
 *     npx playwright test e2e/tiktok-ads.spec.ts --project=chromium
 *
 * The RUN_LIVE spec drives the real staging API with a saved session. It stops at the
 * plan, so it spends nothing:
 *
 *     BASE_URL=<aws/dev frontend> STORAGE_STATE=e2e/.auth/state.json RUN_LIVE=1 \
 *       npx playwright test e2e/tiktok-ads.spec.ts --project=chromium
 */
import { test, expect, Page } from '@playwright/test';

const CAMPAIGNS_URL = '/workspace/?tab=campaigns';
const META_LEAK = /Instagram|Facebook|Meta\b/;

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

/** Any request to the Meta "connect your Facebook Page" flow during a TikTok run is a leak. */
function watchForFacebookConnect(page: Page): string[] {
  const hits: string[] = [];
  page.on('request', (req) => {
    if (/\/social-media\/connect\/facebook-ads/.test(req.url())) hits.push(req.url());
  });
  return hits;
}

const TIKTOK_PLAN = {
  stage: 'planned',
  plan_id: 'plan_tt',
  plan: {
    goal: 'messages',
    behaviour: 'discover',
    explanation: 'Short video fits how your customers scroll.',
    platforms: [{ platform: 'tiktok', budget_ngn: 20000, days: 7, variants: 1, test_scope: 'none' }],
    geo: { pins: [{ name: 'Victoria Island' }, { name: 'Lekki' }] },
  },
  creative: {
    image_url:
      'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=',
    headline: 'Fresh Lunch',
    primary_text: 'Hot meals near you.',
    cta: 'Send WhatsApp Message',
  },
  whatsapp_number: '2348031234567',
  wallet: { balance_ngn: 50000, budget_ngn: 20000, service_fee_ngn: 2000, total_due_ngn: 22000, sufficient: true },
};

// A full CampaignRow — a partial one renders a card the panel buttons are missing from.
// destination_type is deliberately instagram_dm: a brand default must not show Instagram
// wording on a TikTok campaign.
const TIKTOK_CAMPAIGN = {
  campaign_id: 'cmp_tt_1',
  platform: 'tiktok' as const,
  name: 'Uri Social',
  headline: 'Fresh Lunch',
  primary_text: 'Hot meals near you.',
  image_url: '',
  budget_ngn: 10000,
  ad_spend_ngn: 9000,
  goal: 'messages',
  city: 'Lagos',
  status: 'PAUSED',
  created_at: '2026-10-20T10:00:00Z',
  ads_manager_url: 'https://ads.tiktok.com/',
  destination_type: 'instagram_dm',
  metrics: null,
};

const PLAN_FIELDS = [
  { key: 'budget', label: 'Budget', type: 'number', value: 20000, editable: true },
  { key: 'locations', label: 'Locations', type: 'list', value: ['Victoria Island', 'Lekki'], editable: true },
];

type MockOpts = {
  planResponse?: Record<string, unknown>;
  planBodies?: Record<string, unknown>[];
  objectivePlatforms?: string[];
  campaigns?: unknown[];
};

/** ONE router for every API call (see keep-running.spec.ts for why not layered routes). */
async function mockApi(page: Page, opts: MockOpts = {}) {
  await page.route(/\/(jane-ads|api)\//, async (route) => {
    const url = new URL(route.request().url());
    const path = url.pathname;
    const method = route.request().method();

    if (path.endsWith('/jane-ads/admin/access')) return route.fulfill({ json: { allowed: false } });
    if (path.endsWith('/jane-ads/objectives')) {
      opts.objectivePlatforms?.push(url.searchParams.get('platform') ?? '');
      return route.fulfill({
        json: {
          objectives: [{ value: 'engagement', label: 'Engagement', blurb: 'Get people messaging you.', caveat: '' }],
        },
      });
    }
    if (/\/jane-ads\/meta\/plan\/[^/]+\/fields$/.test(path)) {
      return route.fulfill({ json: { plan_id: 'plan_tt', fields: PLAN_FIELDS } });
    }
    if (path.includes('/plan-from-message')) {
      opts.planBodies?.push(route.request().postDataJSON());
      return route.fulfill({ json: opts.planResponse ?? TIKTOK_PLAN });
    }
    if (path.endsWith('/jane-ads/meta/campaigns')) {
      return route.fulfill({ json: { campaigns: opts.campaigns ?? [] } });
    }
    if (path.includes('/jane-ads/wallet')) {
      return route.fulfill({
        json: { balance_ngn: 50000, currency: 'NGN', min_topup_ngn: 1000, transactions: [] },
      });
    }
    if (path.endsWith('/jane-ads/threads')) {
      return route.fulfill({
        json:
          method === 'POST'
            ? {
                thread_id: 'thr_tt',
                title: 'New campaign',
                status: 'draft',
                preview: '',
                created_at: '',
                updated_at: '',
              }
            : { threads: [] },
      });
    }
    if (/\/jane-ads\/threads\/[^/]+\/history/.test(path) || path.includes('/jane-ads/chat/history')) {
      return route.fulfill({ json: method === 'GET' ? { messages: [] } : { ok: true } });
    }
    if (path.includes('/jane-ads/creative/drafts')) return route.fulfill({ json: { drafts: [] } });
    // An un-stubbed call 401s against a fake session and logs the app out.
    return route.fulfill({ json: {} });
  });
}

async function openCampaigns(page: Page) {
  await page.goto(CAMPAIGNS_URL);
  await page.keyboard.press('Escape').catch(() => undefined);
  await expect(page.getByRole('heading', { name: 'Campaigns' })).toBeVisible({ timeout: 20_000 });
}

async function chooseTikTokAndSend(page: Page, message: string) {
  await page.getByTestId('platform-chip-tiktok').click();
  const input = page.getByPlaceholder(/Tell Jane what to promote on TikTok/i);
  await input.fill(message);
  await input.press('Enter');
}

test.describe('TikTok ads — mocked', () => {
  test.beforeEach(async ({ page }) => {
    await fakeAuth(page);
  });

  test('the TikTok chip travels on the first plan call and every follow-up', async ({ page }) => {
    const planBodies: Record<string, unknown>[] = [];
    const objectivePlatforms: string[] = [];
    await mockApi(page, {
      planBodies,
      objectivePlatforms,
      planResponse: { stage: 'need_more', understood: {}, question: 'What budget?' },
    });
    await openCampaigns(page);

    await page.getByTestId('platform-chip-tiktok').click();
    await expect(page.getByText(/This campaign will run on TikTok/i)).toBeVisible();
    // The client is told what budget TikTok accepts before they type one.
    await expect(page.getByText(/at least ₦31,000/)).toBeVisible();
    await expect(page.getByText(/up to 7 days \(₦217,000\)/)).toBeVisible();
    expect(objectivePlatforms).toContain('tiktok');

    const input = page.getByPlaceholder(/Tell Jane what to promote on TikTok/i);
    await input.fill('promote my lunch spot in Lekki');
    await input.press('Enter');
    await expect(page.getByText('What budget?')).toBeVisible();

    await input.fill('20000 naira');
    await input.press('Enter');
    await expect.poll(() => planBodies.length).toBeGreaterThanOrEqual(2);

    for (const body of planBodies) expect(body.preferred_platform).toBe('tiktok');
  });

  test('the budget guidance appears only for TikTok, never under "Jane picks"', async ({ page }) => {
    await mockApi(page);
    await openCampaigns(page);

    await expect(page.getByText(/at least ₦31,000/)).toHaveCount(0);
    await page.getByTestId('platform-chip-tiktok').click();
    await expect(page.getByText(/at least ₦31,000/)).toBeVisible();
    await page.getByTestId('platform-chip-auto').click();
    await expect(page.getByText(/at least ₦31,000/)).toHaveCount(0);
  });

  test('a TikTok plan reads TikTok everywhere and never Instagram, Facebook or Meta', async ({ page }) => {
    const facebookConnect = watchForFacebookConnect(page);
    await mockApi(page);
    await openCampaigns(page);
    await chooseTikTokAndSend(page, 'get me WhatsApp messages for my restaurant, budget 20000');

    await expect(page.getByText('Fresh Lunch')).toBeVisible();
    await expect(page.getByText('Runs on')).toBeVisible();
    await expect(page.getByRole('button', { name: /launch on TikTok/i })).toBeVisible();

    // The platform picker row names every platform by design (it is how you choose one), so it
    // is the only thing left out; any other Meta wording on the page still fails this.
    const visibleText = await page.evaluate(() => {
      const row = document.querySelector('[data-testid="platform-chip-auto"]')?.parentElement;
      if (row) row.style.display = 'none';
      return document.body.innerText;
    });
    expect(visibleText).not.toMatch(META_LEAK);
    expect(facebookConnect).toEqual([]);
  });

  test('a launch refused for goal and destination does not ask for a WhatsApp number', async ({ page }) => {
    await mockApi(page);
    await page.route('**/jane-ads/meta/plan/*/launch', (route) =>
      route.fulfill({ status: 400, json: { detail: 'A traffic campaign cannot send people to whatsapp.' } })
    );
    await openCampaigns(page);
    await chooseTikTokAndSend(page, 'get me WhatsApp messages for my restaurant, budget 20000');
    await page.getByRole('button', { name: /launch on TikTok/i }).click();

    await expect(page.getByText('A traffic campaign cannot send people to whatsapp.')).toBeVisible();
    await expect(page.getByPlaceholder('e.g. 0803 123 4567')).toHaveCount(0);
    await expect(page.getByRole('button', { name: /Save & retry/ })).toHaveCount(0);
  });

  test('a launch refused over the WhatsApp number itself still offers the number box', async ({ page }) => {
    await mockApi(page);
    await page.route('**/jane-ads/meta/plan/*/launch', (route) =>
      route.fulfill({ status: 400, json: { detail: 'Your WhatsApp number is not linked yet.' } })
    );
    await openCampaigns(page);
    await chooseTikTokAndSend(page, 'get me WhatsApp messages for my restaurant, budget 20000');
    await page.getByRole('button', { name: /launch on TikTok/i }).click();

    await expect(page.getByPlaceholder('e.g. 0803 123 4567')).toBeVisible();
  });

  test('a TikTok plan hides its locations, a Meta plan keeps them', async ({ page }) => {
    const metaPlan = {
      ...TIKTOK_PLAN,
      plan: { ...TIKTOK_PLAN.plan, platforms: [{ ...TIKTOK_PLAN.plan.platforms[0], platform: 'meta' }] },
    };
    // First a TikTok plan: neither the review row nor the area chip may show.
    await mockApi(page);
    await openCampaigns(page);
    await chooseTikTokAndSend(page, 'get me WhatsApp messages for my restaurant, budget 20000');
    await expect(page.getByText('Check the ad before it goes live')).toBeVisible();
    await expect(page.getByText('Budget', { exact: true })).toBeVisible();
    await expect(page.getByText('Locations', { exact: true })).toHaveCount(0);
    await expect(page.getByText('Victoria Island')).toHaveCount(0);

    // Then the same screen for a Meta plan, which must be untouched.
    await page.unroute(/\/(jane-ads|api)\//);
    await mockApi(page, { planResponse: metaPlan });
    await page
      .getByRole('button', { name: /New campaign/i })
      .first()
      .click();
    const input = page.getByPlaceholder(/Tell Jane what you want to promote/i);
    await input.fill('get me WhatsApp messages for my restaurant, budget 20000');
    await input.press('Enter');
    await expect(page.getByText('Locations', { exact: true })).toBeVisible();
    await expect(page.getByText('Victoria Island').first()).toBeVisible();
  });

  for (const [stage, expected] of [
    ['tiktok_needs_video', /TikTok needs either a video, or at least 2 photos/i],
    ['tiktok_not_configured', /TikTok Ads isn.t connected right now/i],
    ['tiktok_connection_no_whatsapp', /WhatsApp number to run this TikTok ad/i],
  ] as const) {
    test(`${stage} shows a TikTok message, never the Facebook Page prompt`, async ({ page }) => {
      const facebookConnect = watchForFacebookConnect(page);
      await mockApi(page, { planResponse: { stage } });
      await openCampaigns(page);
      await chooseTikTokAndSend(page, 'promote my lunch spot');

      await expect(page.getByText(expected)).toBeVisible();
      await expect(page.getByText(/Connect Facebook Page/i)).toHaveCount(0);
      expect(facebookConnect).toEqual([]);
    });
  }

  test('a TikTok campaign card is TikTok, with no Instagram wording', async ({ page }) => {
    await mockApi(page, { campaigns: [TIKTOK_CAMPAIGN] });
    await openCampaigns(page);
    await page.getByRole('button', { name: /Campaign Manager/i }).click();

    await expect(page.getByTitle('Running on TikTok')).toBeVisible();
    await expect(page.getByRole('link', { name: /View in TikTok Ads Manager/i })).toBeVisible();
    // The brand default is instagram_dm; on TikTok it must read as a plain link.
    await expect(page.getByText(/Instagram DMs/i)).toHaveCount(0);
    await expect(page.getByText(/Taps open your link/i)).toBeVisible();
  });

  test('a TikTok campaign that is on but not delivering says so, and can still be paused', async ({ page }) => {
    // Live 2026-10-26: TikTok Ads Manager said "Not delivered" (ad in review) while the
    // card said ACTIVE, because only the on/off flag was read.
    const note = "TikTok is reviewing this ad. It starts delivering once it's approved.";
    await mockApi(page, {
      campaigns: [
        {
          ...TIKTOK_CAMPAIGN,
          status: 'active',
          serving_note: note,
          metrics: {
            spend_ngn: 0,
            conversations: 0,
            cost_per_conversation_ngn: null,
            impressions: 0,
            reach: 0,
            delivery: 'Active',
            delivery_display: 'In review',
            ends_at: null,
          },
        },
      ],
    });
    await openCampaigns(page);
    await page.getByRole('button', { name: /Campaign Manager/i }).click();

    await expect(page.getByText('In review', { exact: true })).toBeVisible();
    await expect(page.getByText(note)).toBeVisible();
    // Still switched on underneath, so the client can switch it off.
    await expect(page.getByTitle('Pause')).toBeVisible();
    await expect(page.getByTitle('Activate')).toHaveCount(0);
  });

  test('a delivering TikTok campaign still just says Active', async ({ page }) => {
    await mockApi(page, {
      campaigns: [
        {
          ...TIKTOK_CAMPAIGN,
          status: 'active',
          metrics: {
            spend_ngn: 4000,
            conversations: 3,
            cost_per_conversation_ngn: 1333,
            impressions: 900,
            reach: 700,
            delivery: 'Active',
            ends_at: null,
          },
        },
      ],
    });
    await openCampaigns(page);
    await page.getByRole('button', { name: /Campaign Manager/i }).click();

    await expect(page.getByText('Active', { exact: true })).toBeVisible();
    await expect(page.getByText('In review')).toHaveCount(0);
    await expect(page.getByTitle('Pause')).toBeVisible();
  });

  test('a TikTok card shows its real clicks and cost per click, never WhatsApp conversations', async ({ page }) => {
    // The numbers TikTok Ads Manager showed for the live prod campaign (2026-10-27).
    await mockApi(page, {
      campaigns: [
        {
          ...TIKTOK_CAMPAIGN,
          status: 'paused',
          metrics: {
            spend_ngn: 656.88,
            conversations: null,
            cost_per_conversation_ngn: null,
            impressions: 2122,
            reach: 0,
            clicks: 103,
            cost_per_click_ngn: 6.38,
            delivery: 'Paused',
            ends_at: null,
          },
        },
      ],
    });
    await openCampaigns(page);
    await page.getByRole('button', { name: /Campaign Manager/i }).click();

    await expect(page.getByText('Clicks', { exact: true })).toBeVisible();
    await expect(page.getByText('103', { exact: true })).toBeVisible();
    await expect(page.getByText('Cost per click', { exact: true })).toBeVisible();
    await expect(page.getByText('₦6.38', { exact: true })).toBeVisible();
    await expect(page.getByText('2,122', { exact: true })).toBeVisible();
    await expect(page.getByText('WhatsApp conversations')).toHaveCount(0);
    await expect(page.getByText('Cost per conversation')).toHaveCount(0);
    // Real views with a reach of zero means TikTok did not give us the figure — not "0 people".
    const reached = page.getByText('People reached', { exact: true }).locator('xpath=following-sibling::div[1]');
    await expect(reached).toHaveText('N/A');
  });

  test('a Meta card keeps its WhatsApp conversation numbers, and a real zero reach', async ({ page }) => {
    await mockApi(page, {
      campaigns: [
        {
          ...TIKTOK_CAMPAIGN,
          platform: 'meta' as unknown as 'tiktok',
          status: 'active',
          metrics: {
            spend_ngn: 4000,
            conversations: 3,
            cost_per_conversation_ngn: 1333,
            impressions: 900,
            reach: 0,
            delivery: 'Active',
            ends_at: null,
          },
        },
      ],
    });
    await openCampaigns(page);
    await page.getByRole('button', { name: /Campaign Manager/i }).click();

    await expect(page.getByText('WhatsApp conversations')).toBeVisible();
    await expect(page.getByText('Cost per conversation')).toBeVisible();
    await expect(page.getByText('Cost per click')).toHaveCount(0);
    const reached = page.getByText('People reached', { exact: true }).locator('xpath=following-sibling::div[1]');
    await expect(reached).toHaveText('0');
  });

  test('targeting and keep-it-running say TikTok on a TikTok campaign', async ({ page }) => {
    await mockApi(page, { campaigns: [TIKTOK_CAMPAIGN] });
    await openCampaigns(page);
    await page.getByRole('button', { name: /Campaign Manager/i }).click();

    await page.getByTestId('keep-running-open').first().click();
    const panel = page.getByTestId('keep-running-panel');
    await expect(panel).toBeVisible();
    await expect(panel).toContainText('TikTok');
    await expect(panel).not.toContainText(/Meta\b/);
  });
});

test.describe('TikTok ads — live staging (RUN_LIVE=1, spends nothing)', () => {
  test.skip(!process.env.RUN_LIVE, 'Set RUN_LIVE=1 (and STORAGE_STATE) to hit the real staging API');

  test('the TikTok chip reaches a TikTok plan or a TikTok-specific stage, never Meta', async ({ page }) => {
    const facebookConnect = watchForFacebookConnect(page);
    const planBodies: Record<string, unknown>[] = [];
    page.on('request', (req) => {
      if (req.url().includes('/plan-from-message')) planBodies.push(req.postDataJSON());
    });

    await openCampaigns(page);
    await chooseTikTokAndSend(page, 'promote my restaurant in Lekki, budget 20000 naira, get WhatsApp messages');

    // A TikTok plan, or a TikTok stage asking for something (a video, a WhatsApp number),
    // or Jane asking a follow-up question. Any of them proves the request stayed on TikTok.
    await expect.poll(() => planBodies.length, { timeout: 60_000 }).toBeGreaterThan(0);
    expect(planBodies[0].preferred_platform).toBe('tiktok');

    await expect(page.getByText(/Connect Facebook Page/i)).toHaveCount(0);
    await expect(page.getByText(/Runs on\s*Instagram/i)).toHaveCount(0);
    expect(facebookConnect).toEqual([]);
  });
});
