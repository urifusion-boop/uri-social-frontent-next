/**
 * The Video section of Content Studio:
 *  - the Ask Jane / Generate switcher sits at the TOP, above the Jane chat (the always-mounted chat
 *    used to render first and push the buttons underneath it);
 *  - Generate goes straight to Describe It, with no Upload Images / Describe It toggle;
 *  - the Saved Video Drafts list (the only place a saved video is posted from) is still shown.
 *
 * Runs against a local dev server with auth faked and every backend call mocked.
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

const DRAFT = {
  id: 'vd_1',
  user_id: 'u_test',
  media_type: 'video',
  video_url: 'https://fake-cdn.test/saved.mp4',
  content: 'Let AI run your socials',
  platforms: ['tiktok'],
  status: 'draft',
  created_at: '2026-10-28T10:00:00Z',
};

async function openVideoSection(page: Page, drafts: unknown[] = []) {
  await fakeAuth(page);
  await page.route('**/video-drafts**', (r) =>
    r.fulfill({ json: { status: true, responseCode: 200, responseMessage: 'ok', responseData: drafts } })
  );
  await page.route('**/connections', (r) =>
    r.fulfill({
      json: {
        status: true,
        responseCode: 200,
        responseData: { connections: {}, connected_platforms: [], total_connections: 0 },
      },
    })
  );
  await page.route('**/billing/credits/balance', (r) =>
    r.fulfill({ json: { total_credits: 100, credits_used: 0, credits_remaining: 100, subscription_tier: 'standard' } })
  );
  await page.goto('/workspace/');
  await page.getByText('Content Studio', { exact: true }).click();
  await page
    .locator('button', { hasText: /🎬\s*Video/ })
    .first()
    .click();
}

test.describe('Video section', () => {
  test('the Ask Jane and Generate buttons are above the Jane chat', async ({ page }) => {
    await openVideoSection(page);
    const askJane = page.getByRole('button', { name: /✦ Ask Jane/ }).first();
    const generate = page.getByRole('button', { name: /🎬 Generate$/ }).first();
    const chatHeading = page.getByText('Jane · Video', { exact: true });

    await expect(chatHeading).toBeVisible({ timeout: 20000 });
    const [a, g, h] = await Promise.all([askJane.boundingBox(), generate.boundingBox(), chatHeading.boundingBox()]);
    expect(a && g && h).toBeTruthy();
    expect(a!.y).toBeLessThan(h!.y);
    expect(g!.y).toBeLessThan(h!.y);
    // Side by side on one row, Ask Jane first.
    expect(Math.abs(a!.y - g!.y)).toBeLessThan(6);
    expect(a!.x).toBeLessThan(g!.x);
  });

  test('Generate goes straight to Describe It, with no Upload Images option', async ({ page }) => {
    await openVideoSection(page);
    await page
      .getByRole('button', { name: /🎬 Generate$/ })
      .first()
      .click();

    await expect(page.getByText("What's the video about?")).toBeVisible({ timeout: 10000 });
    await expect(page.getByRole('button', { name: 'Upload Images' })).toHaveCount(0);
    await expect(page.getByRole('button', { name: /Describe It/ })).toHaveCount(0);
    // The old upload-first generator's own section is gone.
    await expect(page.getByText('Brand Images')).toHaveCount(0);
    // The switcher is still at the top, above the form.
    const generate = await page
      .getByRole('button', { name: /🎬 Generate$/ })
      .first()
      .boundingBox();
    const form = await page.getByText("What's the video about?").boundingBox();
    expect(generate!.y).toBeLessThan(form!.y);
  });

  test('saved videos are still listed (and can be posted) under Describe It', async ({ page }) => {
    await openVideoSection(page, [DRAFT]);
    await page
      .getByRole('button', { name: /🎬 Generate$/ })
      .first()
      .click();

    await expect(page.getByText('Saved Video Drafts')).toBeVisible({ timeout: 10000 });
    await expect(page.getByText('Let AI run your socials')).toBeVisible();
    await expect(page.getByText('No video drafts saved yet.')).toHaveCount(0);
  });

  test('with no saved videos the list says so', async ({ page }) => {
    await openVideoSection(page, []);
    await page
      .getByRole('button', { name: /🎬 Generate$/ })
      .first()
      .click();
    await expect(page.getByText('No video drafts saved yet.')).toBeVisible({ timeout: 10000 });
  });
});
