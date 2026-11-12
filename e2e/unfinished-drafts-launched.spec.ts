/**
 * Live 2026-11-12: a TikTok launch finished after the page stopped waiting, so its
 * draft was never cleared and stayed under Unfinished ("Ad already built") for an ad
 * that was live — with a broken-image thumbnail, since its media was a .mov video.
 */
import { test, expect, Page } from '@playwright/test';

const BRAND = 'brnd_personal_u_test';

function draft(id: string, planId: string, mediaUrl: string, isVideo: boolean) {
  return {
    id,
    objective: { value: 'traffic', label: 'Traffic' },
    platform: { mode: 'single', single: 'tiktok', multi: [] },
    googlePlacement: 'search',
    audience: { city: '' },
    budget: {},
    creative: null,
    results: {
      single: { stage: 'planned', plan_id: planId, creative: { image_url: mediaUrl, is_video: isVideo } },
    },
    savedAt: Date.now(),
  };
}

async function setup(page: Page) {
  await page.addInitScript(
    ({ brand, drafts }) => {
      localStorage.setItem('@URI@AUTHENTICATED', 'true');
      localStorage.setItem('@URI@USER_TOKENS', JSON.stringify({ accessToken: 'test', refreshToken: 'test' }));
      localStorage.setItem('@URI@USER_DETAILS', JSON.stringify({ userId: 'u_test', email: 't@uri', firstName: 'T' }));
      localStorage.setItem('@URI@ACTIVE_BRAND_ID', brand);
      localStorage.setItem(`@URI@WIZARD_DRAFTS@${brand}`, JSON.stringify(drafts));
    },
    {
      brand: BRAND,
      drafts: [
        draft('d_live', 'plan_live', 'https://cdn.example/clip.mov', true),
        draft('d_open', 'plan_open', 'https://cdn.example/clip2.mov', true),
      ],
    }
  );
  await page.route('**/jane-ads/admin/access', (r) => r.fulfill({ json: { allowed: false } }));
  await page.route('**/jane-ads/wizard-drafts', (r) => r.fulfill({ json: { drafts: [] } }));
  await page.route('**/jane-ads/wizard-draft/**', (r) => r.fulfill({ json: { ok: true } }));
  await page.route('**/jane-ads/dashboard/home', (r) =>
    r.fulfill({
      json: {
        since_you_last_looked: { since: null, people_messaged: null, countable_campaigns: 0, uncountable_campaigns: 0 },
        live_campaigns: [],
        money: { wallet_ngn: 100000, credits: 10, low: false, min_topup_ngn: 1000 },
        suggestions: [],
        is_first_run: false,
      },
    })
  );
  await page.route('**/jane-ads/meta/plan/*/status', (r) => {
    const launched = r.request().url().includes('plan_live');
    return r.fulfill({
      json: {
        status: launched ? 'launched' : 'pending',
        campaign_id: launched ? 'c1' : '',
        platform: 'tiktok',
        last_launch_error: '',
      },
    });
  });
}

test('a draft whose plan already launched leaves Unfinished; video drafts get a video icon', async ({ page }) => {
  await setup(page);
  await page.goto('/workspace/?tab=campaign-overview');
  const unfinished = page.getByText('Unfinished', { exact: true });
  await expect(unfinished).toBeVisible({ timeout: 30000 });
  // one draft left (the still-pending one), not two
  await expect(page.getByRole('button', { name: 'Resume' })).toHaveCount(1, { timeout: 15000 });
  await expect(page.locator('div[aria-hidden="true"]', { hasText: /^🎬$/ })).toHaveCount(1);
  // no <img> pointing at a video
  await expect(page.locator('img[src$=".mov"]')).toHaveCount(0);
  // the launched one is removed from storage too, so it doesn't come back on reload
  const stored = await page.evaluate((b) => JSON.parse(localStorage.getItem(`@URI@WIZARD_DRAFTS@${b}`) || '[]'), BRAND);
  expect(stored.map((d: { id: string }) => d.id)).toEqual(['d_open']);
});
