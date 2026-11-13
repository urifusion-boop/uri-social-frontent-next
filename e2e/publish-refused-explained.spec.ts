/**
 * When a network refuses a post at the moment it's published, every Publish button says why, in
 * plain words, instead of "Published!" or "1 published.".
 *
 * Live on 2026-11-13: Facebook's identity check ("Confirm your identity before you can publish as
 * this Page") left an owner disconnecting and reconnecting, which can't clear it. Approve answers
 * status:true and puts the refusal in approved_drafts[].publish_result, which some buttons ignored.
 *
 *     npm run dev
 *     npx playwright test e2e/publish-refused-explained.spec.ts --project=chromium
 */
import { test, expect, type Page } from '@playwright/test';

const ok = (responseData: object) => ({
  json: { status: true, responseCode: 200, responseMessage: 'ok', responseData },
});

const FRIENDLY =
  "Facebook is asking you to confirm your identity before you can post from this Page. This is a security check on Facebook's side, not a problem with your connection here, so reconnecting won't fix it.";

const DRAFT = {
  id: 'd_fb',
  draft_id: 'd_fb',
  platform: 'facebook',
  content: 'Weekend sale on fresh pastries',
  image_url: 'https://fake-cdn.test/photo.png',
  status: 'draft',
  created_at: '2026-11-13T08:00:00',
};

async function setup(page: Page) {
  await page.addInitScript(() => {
    localStorage.setItem('@URI@AUTHENTICATED', 'true');
    localStorage.setItem('@URI@USER_TOKENS', JSON.stringify({ accessToken: 'test', refreshToken: 'test' }));
    localStorage.setItem(
      '@URI@USER_DETAILS',
      JSON.stringify({ userId: 'u_test', email: 'test@uri', firstName: 'Test' })
    );
    localStorage.setItem('@URI@ACTIVE_BRAND_ID', 'brnd_personal_u_test');
  });
  await page.route(/\/social-media\//, async (route) => {
    if (!['fetch', 'xhr'].includes(route.request().resourceType())) return route.continue();
    const path = new URL(route.request().url()).pathname;
    if (path.includes('brand-profile')) return route.fulfill(ok({ brand_name: 'E2E', onboarding_completed: true }));
    if (path.endsWith('/content-calendar')) return route.fulfill(ok({ drafts: [DRAFT] }));
    if (path.endsWith('/scheduled')) return route.fulfill(ok({ scheduled_drafts: [] }));
    if (path.endsWith('/video-drafts')) return route.fulfill(ok([]));
    if (path.endsWith('/connections')) {
      return route.fulfill(ok({ connections: {}, connected_platforms: ['facebook'], total_connections: 1 }));
    }
    if (path.endsWith('/approve')) {
      return route.fulfill(
        ok({
          approved_drafts: [
            {
              draft_id: 'd_fb',
              platform: 'facebook',
              status: 'approved',
              publish_result: { success: false, error: FRIENDLY },
            },
          ],
          errors: [],
          warnings: [],
          schedule_option: 'immediate',
        })
      );
    }
    return route.fulfill(ok({}));
  });
  await page.goto('/workspace/');
  await page.getByText('Content Studio', { exact: true }).click();
  await page.getByRole('button', { name: 'Content Library' }).click();
  await expect(page.getByText('Weekend sale').first()).toBeVisible();
}

test('Post on a library card explains the refusal instead of saying Published!', async ({ page }) => {
  await setup(page);
  await page.getByRole('button', { name: 'grid', exact: true }).click();
  await page.getByRole('button', { name: 'Post', exact: true }).first().click();

  await expect(page.getByText(/confirm your identity/).first()).toBeVisible();
  await expect(page.getByText(/reconnecting won't fix it/).first()).toBeVisible();
  await expect(page.getByText('Published!')).toHaveCount(0);
});

test('bulk Publish Now counts a refused post as failed, not published', async ({ page }) => {
  await setup(page);
  await page.locator('input[type="checkbox"]').nth(1).check();
  await page.getByRole('button', { name: 'Publish Now' }).click();

  await expect(page.getByText(/confirm your identity/).first()).toBeVisible();
  await expect(page.getByText('1 published.')).toHaveCount(0);
});
