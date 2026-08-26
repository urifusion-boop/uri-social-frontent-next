/**
 * Playwright e2e — mobile layout for the workspace shell.
 *
 * Verifies the phone-sized viewport actually works: no horizontal overflow, and
 * every desktop nav destination is reachable (Campaigns and Blog were previously
 * absent from both MOBILE_TABS and MORE_NAV, so mobile could not open them at all).
 *
 * Auth is client-side localStorage, so these seed a token and stub the API rather
 * than needing a real session:
 *   npx playwright test e2e/mobile-responsive.spec.ts --project=mobile
 */
import { test, expect, Page } from '@playwright/test';

const PHONE = { width: 390, height: 844 };

async function seedAuth(page: Page) {
  await page.addInitScript(() => {
    localStorage.setItem('@URI@AUTHENTICATED', 'true');
    localStorage.setItem(
      '@URI@USER_TOKENS',
      JSON.stringify({ accessToken: 'e2e-fake-token', refreshToken: 'e2e-fake-refresh' })
    );
    localStorage.setItem(
      '@URI@USER_DETAILS',
      JSON.stringify({ id: 'e2e-user', email: 'e2e@example.com', firstName: 'E2E', subscriptionTier: 'pro' })
    );
  });
}

/** Blanket-stub the API so the shell renders without a backend. */
async function stubApi(page: Page) {
  await page.route('**://localhost:9003/**', async (route) => {
    const url = route.request().url();
    const ok = (responseData: unknown) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ status: true, message: 'ok', responseData }),
      });

    // The shell redirects to brand-setup unless the profile says onboarding is done.
    if (url.includes('brand-profile') || url.includes('brand_profile'))
      return ok({ brand_name: 'E2E Brand', logo_url: null, onboarding_completed: true });
    if (url.includes('/threads')) return ok([]);
    if (url.includes('/notifications')) return ok({ items: [], unread_count: 0 });
    return ok([]);
  });
}

test.use({ viewport: PHONE });

test.beforeEach(async ({ page }) => {
  await seedAuth(page);
  await stubApi(page);
});

test('workspace has no horizontal overflow on a phone viewport', async ({ page }) => {
  await page.goto('/workspace');
  await page.waitForLoadState('networkidle');

  const overflow = await page.evaluate(() => ({
    scrollWidth: document.documentElement.scrollWidth,
    clientWidth: document.documentElement.clientWidth,
  }));
  // A 1px rounding tolerance; anything more is a real sideways scroll.
  expect(overflow.scrollWidth).toBeLessThanOrEqual(overflow.clientWidth + 1);
});

test('viewport meta is emitted so mobile browsers do not zoom out', async ({ page }) => {
  await page.goto('/');
  const content = await page.locator('meta[name="viewport"]').getAttribute('content');
  expect(content).toContain('width=device-width');
  expect(content).toContain('initial-scale=1');
});

test('Campaigns and Blog are reachable from the mobile More drawer', async ({ page }) => {
  await page.goto('/workspace');
  await page.waitForLoadState('networkidle');

  // Bottom bar is mobile-only; "More" holds everything it has no room for.
  await page.getByRole('button', { name: 'More' }).click();

  await expect(page.getByRole('button', { name: 'Campaigns' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Blog', exact: true })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Connected Accounts' })).toBeVisible();
});

test('opening Campaigns from mobile renders the page without overflow', async ({ page }) => {
  await page.goto('/workspace');
  await page.waitForLoadState('networkidle');

  await page.getByRole('button', { name: 'More' }).click();
  await page.getByRole('button', { name: 'Campaigns' }).click();

  await expect(page.getByRole('heading', { name: 'Campaigns' })).toBeVisible();

  const overflow = await page.evaluate(() => ({
    scrollWidth: document.documentElement.scrollWidth,
    clientWidth: document.documentElement.clientWidth,
  }));
  expect(overflow.scrollWidth).toBeLessThanOrEqual(overflow.clientWidth + 1);

  // The 220px thread rail must not be an inline column on a phone — it is a
  // drawer behind the ☰ button instead.
  await expect(page.getByRole('button', { name: 'Open campaign threads' })).toBeVisible();
});

test('campaign thread rail opens as a drawer and closes again', async ({ page }) => {
  await page.goto('/workspace');
  await page.waitForLoadState('networkidle');
  await page.getByRole('button', { name: 'More' }).click();
  await page.getByRole('button', { name: 'Campaigns' }).click();

  await page.getByRole('button', { name: 'Open campaign threads' }).click();
  await expect(page.getByRole('button', { name: '+ New campaign' })).toBeVisible();

  await page.getByRole('button', { name: 'Close campaign threads' }).click();
  await expect(page.getByRole('button', { name: '+ New campaign' })).toBeHidden();
});

test('the bug-report FAB does not cover the mobile bottom nav', async ({ page }) => {
  await page.goto('/workspace');
  await page.waitForLoadState('networkidle');

  const fab = page.locator('button[title="Report a bug"]');
  await expect(fab).toBeVisible();

  const fabBox = await fab.boundingBox();
  const navBox = await page.getByRole('button', { name: 'More' }).boundingBox();
  expect(fabBox && navBox).toBeTruthy();
  // The FAB must sit entirely above the bottom bar, not on top of it.
  expect(fabBox!.y + fabBox!.height).toBeLessThanOrEqual(navBox!.y + 1);
});

test('Blog opens from the mobile More drawer', async ({ page }) => {
  await page.goto('/workspace');
  await page.waitForLoadState('networkidle');

  await page.getByRole('button', { name: 'More' }).click();
  await page.getByRole('button', { name: 'Blog', exact: true }).click();

  const overflow = await page.evaluate(() => ({
    scrollWidth: document.documentElement.scrollWidth,
    clientWidth: document.documentElement.clientWidth,
  }));
  expect(overflow.scrollWidth).toBeLessThanOrEqual(overflow.clientWidth + 1);
});
