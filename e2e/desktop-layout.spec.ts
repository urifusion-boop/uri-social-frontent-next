/**
 * Playwright e2e — desktop layout guard for the mobile-responsive work.
 *
 * The phone treatment (drawer thread rail, bottom-nav More drawer) is gated on
 * useIsMobile, so this pins the desktop side: full sidebar nav, inline thread
 * rail, no mobile chrome. Run with --project=chromium.
 */
import { test, expect, Route } from '@playwright/test';
test.use({ viewport: { width: 1440, height: 900 } });
test('desktop keeps the inline thread rail and full sidebar nav', async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem('@URI@AUTHENTICATED', 'true');
    localStorage.setItem('@URI@USER_TOKENS', JSON.stringify({ accessToken: 't' }));
    localStorage.setItem('@URI@USER_DETAILS', JSON.stringify({ id: 'u', email: 'e@x.com' }));
  });
  await page.route('**://localhost:9003/**', (r: Route) => {
    const u = r.request().url();
    const ok = (d: unknown) =>
      r.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ status: true, responseData: d }),
      });
    if (u.includes('brand-profile')) return ok({ brand_name: 'E2E', onboarding_completed: true });
    return ok([]);
  });
  await page.goto('/workspace');
  await page.waitForLoadState('networkidle');

  // Desktop sidebar nav present, no mobile bottom bar
  // First-run product tour throws a full-screen spotlight backdrop; dismiss it.
  const tourBackdrop = page.locator('div[style*="z-index: 9996"], div[style*="zIndex: 9996"]');
  if (await tourBackdrop.count()) await tourBackdrop.first().click({ force: true });

  await expect(page.locator('#tnav-campaigns')).toBeVisible();
  await expect(page.getByRole('button', { name: 'More' })).toBeHidden();

  await page.locator('#tnav-campaigns').click();
  await expect(page.getByRole('heading', { name: 'Campaigns' })).toBeVisible();

  // Rail is inline (no ☰ trigger, "+ New campaign" visible without opening a drawer)
  await expect(page.getByRole('button', { name: 'Open campaign threads' })).toBeHidden();
  await expect(page.getByRole('button', { name: '+ New campaign' })).toBeVisible();

  const overflow = await page.evaluate(() => ({
    s: document.documentElement.scrollWidth,
    c: document.documentElement.clientWidth,
  }));
  expect(overflow.s).toBeLessThanOrEqual(overflow.c + 1);
});
