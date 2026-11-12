/**
 * The Video section of Content Studio:
 *  - the Generate Videos / Edit Videos switcher sits at the TOP, above the Jane chat (the always-mounted chat
 *    used to render first and push the buttons underneath it);
 *  - Generate goes straight to Describe It, with no Upload Images / Describe It toggle;
 *  - saved videos live in the Drafts tab: there is no separate Saved Video Drafts list under the generator.
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
  test('the Generate Videos and Edit Videos buttons are above the Jane chat', async ({ page }) => {
    await openVideoSection(page);
    const editVideos = page.getByRole('button', { name: /✦ Edit Videos/ }).first();
    const generate = page.getByRole('button', { name: /🎬 Generate Videos$/ }).first();
    const chatHeading = page.getByText('Jane · Video', { exact: true });

    await expect(chatHeading).toBeVisible({ timeout: 20000 });
    const [a, g, h] = await Promise.all([editVideos.boundingBox(), generate.boundingBox(), chatHeading.boundingBox()]);
    expect(a && g && h).toBeTruthy();
    expect(a!.y).toBeLessThan(h!.y);
    expect(g!.y).toBeLessThan(h!.y);
    // Side by side on one row, Generate Videos first.
    expect(Math.abs(a!.y - g!.y)).toBeLessThan(6);
    expect(g!.x).toBeLessThan(a!.x);
  });

  test('Generate goes straight to Describe It, with no Upload Images option', async ({ page }) => {
    await openVideoSection(page);
    await page
      .getByRole('button', { name: /🎬 Generate Videos$/ })
      .first()
      .click();

    await expect(page.getByText("What's the video about?")).toBeVisible({ timeout: 10000 });
    await expect(page.getByRole('button', { name: 'Upload Images' })).toHaveCount(0);
    await expect(page.getByRole('button', { name: /Describe It/ })).toHaveCount(0);
    // The old upload-first generator's own section is gone.
    await expect(page.getByText('Brand Images')).toHaveCount(0);
    // The switcher is still at the top, above the form.
    const generate = await page
      .getByRole('button', { name: /🎬 Generate Videos$/ })
      .first()
      .boundingBox();
    const form = await page.getByText("What's the video about?").boundingBox();
    expect(generate!.y).toBeLessThan(form!.y);
  });

  test('there is no Saved Video Drafts list under the generator (saved videos live in the Drafts tab)', async ({
    page,
  }) => {
    await openVideoSection(page);
    await page
      .getByRole('button', { name: /🎬 Generate Videos$/ })
      .first()
      .click();
    await expect(page.getByText("What's the video about?")).toBeVisible({ timeout: 10000 });
    await expect(page.getByText('Saved Video Drafts')).toHaveCount(0);
    await expect(page.getByText('No video drafts saved yet.')).toHaveCount(0);
  });
});
