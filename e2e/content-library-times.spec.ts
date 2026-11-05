/**
 * Times in the Content Library are shown in the viewer's own time zone.
 *
 * The backend sends UTC with no zone suffix ("2026-11-05T14:05:00"). The library used to read that as local
 * time, so a post scheduled for 4:05 PM showed as 2:05 PM for someone two hours ahead of UTC.
 *
 * Local dev server, auth faked, every backend call mocked:
 *
 *     npm run dev
 *     npx playwright test e2e/content-library-times.spec.ts --project=chromium
 */
import { test, expect } from '@playwright/test';

const ok = (responseData: object) => ({
  json: { status: true, responseCode: 200, responseMessage: 'ok', responseData },
});

const SCHEDULED = {
  id: 'd_sched',
  draft_id: 'd_sched',
  platform: 'tiktok',
  content: 'Banana bread fresh from the oven',
  image_url: 'https://fake-cdn.test/photo.png',
  status: 'scheduled',
  scheduled_date: '2026-11-05T14:05:00', // 14:05 UTC, no zone suffix, as the backend sends it
  created_at: '2026-11-01T10:00:00',
};

// Two hours ahead of UTC: 14:05 UTC is 4:05 PM here.
test.use({ timezoneId: 'Africa/Johannesburg' });

test('a scheduled post shows its time in the viewer’s own time zone', async ({ page }) => {
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
    if (path.endsWith('/content-calendar')) return route.fulfill(ok({ drafts: [SCHEDULED] }));
    if (path.endsWith('/scheduled')) return route.fulfill(ok({ scheduled_drafts: [SCHEDULED] }));
    if (path.endsWith('/connections')) {
      return route.fulfill(ok({ connections: {}, connected_platforms: ['tiktok'], total_connections: 1 }));
    }
    return route.fulfill(ok({}));
  });

  await page.goto('/workspace/');
  await page.getByText('Content Studio', { exact: true }).click();
  await page.getByRole('button', { name: 'Content Library' }).click();

  const row = page.getByText('Banana bread').first();
  await expect(row).toBeVisible();
  await expect(page.getByText('Nov 5 · 4:05 PM')).toBeVisible();
  await expect(page.getByText('Nov 5 · 2:05 PM')).toHaveCount(0);
});
