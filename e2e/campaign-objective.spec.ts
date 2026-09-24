/**
 * Playwright e2e — the client picks Meta's campaign objective.
 *
 * Jane used to infer it and pick herself, so every campaign came out Engagement or
 * Traffic and a client who asked for sales found "Objective: Engagement" in Ads
 * Manager. What matters here is not that the picker renders, but that the choice
 * actually travels: on the FIRST plan call and on every follow-up.
 */
import { test, expect, Page } from '@playwright/test';

const CAMPAIGNS_URL = '/workspace/?tab=campaigns';

const OBJECTIVES = [
  { value: 'awareness', label: 'Awareness', blurb: 'Show the ad to as many people as possible.', caveat: '' },
  { value: 'traffic', label: 'Traffic', blurb: 'Send people to your link.', caveat: '' },
  { value: 'engagement', label: 'Engagement', blurb: 'Get people messaging you.', caveat: '' },
  { value: 'leads', label: 'Leads', blurb: 'Collect enquiries.', caveat: "Leads arrive as WhatsApp messages — Uri doesn't use Meta's own lead forms yet." },
  { value: 'sales', label: 'Sales', blurb: 'Find people likely to buy.', caveat: 'Without tracking installed on your website, Meta optimises for taps rather than confirmed purchases.' },
  { value: 'followers', label: 'Followers', blurb: 'Grow your Page following.', caveat: '' },
];

/** Records what every plan request carried, so the assertions are about the payload
 *  rather than about the screen looking right. */
async function mockApi(page: Page, planBodies: Record<string, unknown>[]) {
  await page.route(/\/(jane-ads|api)\//, async (route) => {
    const url = route.request().url();
    const path = new URL(url).pathname;

    if (path.endsWith('/jane-ads/objectives')) {
      return route.fulfill({ json: { objectives: OBJECTIVES } });
    }
    if (path.includes('/plan-from-message')) {
      planBodies.push(route.request().postDataJSON());
      return route.fulfill({ json: { stage: 'need_more', understood: {}, question: 'What budget?' } });
    }
    if (path.endsWith('/jane-ads/meta/campaigns')) return route.fulfill({ json: { campaigns: [] } });
    if (path.includes('/jane-ads/wallet')) {
      return route.fulfill({ json: { balance_ngn: 500000, currency: 'NGN', min_topup_ngn: 5000, transactions: [] } });
    }
    return route.fulfill({ json: {} });
  });
}

async function openChat(page: Page) {
  await page.goto(CAMPAIGNS_URL);
  await page.keyboard.press('Escape').catch(() => undefined);
  await expect(page.getByTestId('objective-picker')).toBeVisible({ timeout: 20_000 });
}

test.describe('Campaign objective', () => {
  test('offers Meta\'s objectives, not Jane\'s guess', async ({ page }) => {
    await mockApi(page, []);
    await openChat(page);
    for (const o of OBJECTIVES) {
      await expect(page.getByTestId(`objective-${o.value}`)).toBeVisible();
    }
  });

  test('the objective the client picks reaches the plan request', async ({ page }) => {
    const bodies: Record<string, unknown>[] = [];
    await mockApi(page, bodies);
    await openChat(page);

    await page.getByTestId('objective-sales').click();
    await page.getByPlaceholder(/Tell Jane what you want to promote/i).fill('sell my wigs in Lekki');
    await page.keyboard.press('Enter');

    await expect.poll(() => bodies.length, { timeout: 20_000 }).toBeGreaterThan(0);
    expect(bodies[0].objective).toBe('sales');
  });

  test('not picking one sends nothing, so Jane falls back as before', async ({ page }) => {
    const bodies: Record<string, unknown>[] = [];
    await mockApi(page, bodies);
    await openChat(page);

    await page.getByPlaceholder(/Tell Jane what you want to promote/i).fill('sell my wigs');
    await page.keyboard.press('Enter');

    await expect.poll(() => bodies.length, { timeout: 20_000 }).toBeGreaterThan(0);
    expect(bodies[0].objective).toBeUndefined();
  });

  test('the objective survives a follow-up reply', async ({ page }) => {
    /* The bug this guards: attached media was silently dropped on four follow-up call
       sites because each built its own payload. The objective must ride on all of them,
       or a client picks Sales and the campaign that launches is not a Sales campaign. */
    const bodies: Record<string, unknown>[] = [];
    await mockApi(page, bodies);
    await openChat(page);

    await page.getByTestId('objective-awareness').click();
    const box = page.getByPlaceholder(/Tell Jane what you want to promote/i);
    await box.fill('promote my salon');
    await page.keyboard.press('Enter');
    await expect.poll(() => bodies.length, { timeout: 20_000 }).toBeGreaterThan(0);

    // Jane asked for a budget; answering is a SECOND, separate plan call.
    await box.fill('₦10,000 budget');
    await page.keyboard.press('Enter');
    await expect.poll(() => bodies.length, { timeout: 20_000 }).toBeGreaterThan(1);

    expect(bodies[bodies.length - 1].objective).toBe('awareness');
  });

  test('a caveat is shown for the objective being chosen, not for all of them', async ({ page }) => {
    await mockApi(page, []);
    await openChat(page);

    // Nothing picked yet — no warnings cluttering the choice.
    await expect(page.getByTestId('objective-caveat-sales')).toHaveCount(0);

    await page.getByTestId('objective-sales').click();
    await expect(page.getByTestId('objective-caveat-sales')).toContainText('taps rather than confirmed purchases');

    // Switching hides the old caveat and shows the new one.
    await page.getByTestId('objective-leads').click();
    await expect(page.getByTestId('objective-caveat-sales')).toHaveCount(0);
    await expect(page.getByTestId('objective-caveat-leads')).toContainText('WhatsApp messages');
  });
});
