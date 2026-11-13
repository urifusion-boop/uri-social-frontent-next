/**
 * Campaign builder quick wins (PRD WS5).
 *
 * "What are you advertising?" offers the Brand Playbook's products as cards, with who-it's-for
 * and the area pre-filled from the Playbook; "Something else" keeps the free description. The
 * budget step offers suggested amounts that say what they buy.
 *
 *     npx next dev -p 3002
 *     BASE_URL=http://localhost:3002 npx playwright test e2e/builder-products-and-budgets.spec.ts --project=chromium
 */
import { test, expect, type Page } from '@playwright/test';
import { mockFeatures } from './feature-flags';

test.beforeEach(async ({ page }) => mockFeatures(page));

const ok = (responseData: unknown) => ({ json: { status: true, responseCode: 200, responseMessage: 'ok', responseData } });

const PROFILE = {
  brand_name: 'Magen',
  industry: 'Event transport',
  onboarding_completed: true,
  key_products_services: ['Airport runs (from ₦25,000)', 'Staff buses', 'Wedding cars (from ₦80,000)'],
  ideal_customer_profile: 'Companies moving staff daily in Lekki',
  customer_location: 'Lekki, Lagos',
};

async function setup(page: Page, profile: Record<string, unknown> = PROFILE) {
  await page.addInitScript(() => {
    localStorage.setItem('@URI@AUTHENTICATED', 'true');
    localStorage.setItem('@URI@USER_TOKENS', JSON.stringify({ accessToken: 'test', refreshToken: 'test' }));
    localStorage.setItem('@URI@USER_DETAILS', JSON.stringify({ userId: 'u_test', email: 'test@uri', firstName: 'Test' }));
    localStorage.setItem('@URI@ACTIVE_BRAND_ID', 'brnd_personal_u_test');
  });
  const saved: Record<string, unknown>[] = [];
  const budgetCalls: string[] = [];
  await page.route(/\/social-media\//, (route) => {
    if (!['fetch', 'xhr'].includes(route.request().resourceType())) return route.continue();
    const path = new URL(route.request().url()).pathname;
    if (path.endsWith('/brand-profile')) {
      if (route.request().method() === 'POST') saved.push(JSON.parse(route.request().postData() || '{}'));
      return route.fulfill(ok(profile));
    }
    if (path.endsWith('/video-drafts')) return route.fulfill(ok([]));
    return route.fulfill(ok({}));
  });
  await page.route(/\/jane-ads\//, (route) => {
    const url = new URL(route.request().url());
    const path = url.pathname;
    if (path.endsWith('/objectives')) {
      return route.fulfill({
        json: { objectives: [{ value: 'traffic', label: 'Get more traffic', blurb: 'Send people to your link or website.', caveat: '' }] },
      });
    }
    if (path.endsWith('/budget-suggestions')) {
      budgetCalls.push(`${url.searchParams.get('platform')}|${url.searchParams.get('days')}`);
      return route.fulfill({
        json: {
          platform: 'meta', days: 7, note: '',
          options: [
            { amount_ngn: 24000, label: 'Start small', days: 7, ads: 1, what: '1 ad · 7 days', detail: 'About ₦3,000 a day goes to ads.', recommended: false },
            { amount_ngn: 47000, label: 'Recommended', days: 7, ads: 2, what: 'Tests 2 ads · 7 days', detail: 'About ₦6,000 a day goes to ads, shared by 2 ads so Meta can tell which works.', recommended: true },
            { amount_ngn: 70000, label: 'Test more ideas', days: 7, ads: 3, what: 'Tests 3 ads · 7 days', detail: 'About ₦9,000 a day goes to ads, shared by 3 ads so Meta can tell which works.', recommended: false },
          ],
        },
      });
    }
    if (path.endsWith('/wizard-drafts')) return route.fulfill({ json: { drafts: [] } });
    if (path.endsWith('/meta/campaigns')) return route.fulfill({ json: { campaigns: [] } });
    if (path.endsWith('/admin/access')) return route.fulfill({ json: { allowed: false } });
    return route.fulfill({ json: { ok: true, formats: [] } });
  });
  return { saved, budgetCalls };
}

async function toAudienceStep(page: Page) {
  await page.goto('/workspace/?tab=campaign-wizard');
  await page.getByRole('button', { name: '+ New Campaign' }).first().click();
  await page.getByText('Get more traffic', { exact: true }).click();
  await page.getByRole('button', { name: 'Next →' }).click();
  await page.getByText('Instagram & Facebook', { exact: true }).first().click();
  await page.getByRole('button', { name: 'Next →' }).click();
}

test('the Playbook products are offered as cards with who and where pre-filled', async ({ page }) => {
  const { budgetCalls } = await setup(page);
  await toAudienceStep(page);

  await expect(page.getByText('What are you advertising?')).toBeVisible();
  await expect(page.getByRole('checkbox', { name: /Airport runs/ })).toHaveAttribute('aria-checked', 'true');
  await expect(page.getByRole('checkbox', { name: /Wedding cars/ })).toContainText('from ₦80,000');
  await expect(page.getByPlaceholder(/Companies moving staff daily/)).toHaveValue('Companies moving staff daily in Lekki');
  await expect(page.getByPlaceholder('e.g. Lekki, Lagos')).toHaveValue('Lekki, Lagos');

  // Several can be picked to test in one campaign, up to three.
  await page.getByRole('checkbox', { name: /Staff buses/ }).click();
  await expect(page.getByRole('checkbox', { name: /Staff buses/ })).toHaveAttribute('aria-checked', 'true');
  await expect(page.getByRole('checkbox', { name: /Airport runs/ })).toHaveAttribute('aria-checked', 'true');
  await page.getByRole('checkbox', { name: /Wedding cars/ }).click();
  await page.getByRole('checkbox', { name: /Wedding cars/ }).click();
  await expect(page.getByText('Up to 3 at a time')).toHaveCount(0);
  await page.getByRole('button', { name: 'Next →' }).click();

  // Budget: suggestions that say what they buy; tapping one fills the amount.
  await expect(page.getByText('Suggested')).toBeVisible();
  await expect(page.getByText('Tests 2 ads · 7 days')).toBeVisible();
  await expect(page.getByText('Recommended').first()).toBeVisible();
  await page.getByRole('button', { name: /₦47,000/ }).click();
  await expect(page.getByPlaceholder('e.g. 15000')).toHaveValue('47000');
  await expect(page.getByRole('button', { name: /₦47,000/ })).toHaveAttribute('aria-pressed', 'true');
  await expect(page.getByRole('button', { name: 'Next →' })).toBeEnabled();
  expect(budgetCalls[0]).toBe('meta|7');
});

test('something else keeps the free description and can be added to the Playbook', async ({ page }) => {
  const { saved } = await setup(page);
  await toAudienceStep(page);

  await page.getByRole('checkbox', { name: /Something else/ }).click();
  const box = page.getByPlaceholder(/custom birthday cakes/);
  await box.fill('Corporate retreat shuttles — HR teams planning offsites');
  await page.getByText('Also add this to my Playbook’s products').click();
  await expect(page.getByText('Added “Corporate retreat shuttles” to your Playbook')).toBeVisible();
  expect(saved.at(-1)?.key_products_services).toEqual([...PROFILE.key_products_services, 'Corporate retreat shuttles']);
  await expect(page.getByRole('button', { name: 'Next →' })).toBeEnabled();
});

test('with the switches off, the builder is exactly today’s', async ({ page }) => {
  const { budgetCalls } = await setup(page);
  await mockFeatures(page, false);
  await toAudienceStep(page);
  await expect(page.getByText("What are you promoting, and who's it for?")).toBeVisible();
  await expect(page.getByRole('checkbox')).toHaveCount(0);
  await page.getByPlaceholder(/custom birthday cakes/).fill('Airport runs for busy travellers');
  await page.getByPlaceholder('e.g. Lekki, Lagos').fill('Lekki, Lagos');
  await page.getByRole('button', { name: 'Next →' }).click();
  await expect(page.getByPlaceholder('e.g. 15000')).toBeVisible();
  await expect(page.getByText('Suggested')).toHaveCount(0);
  expect(budgetCalls).toHaveLength(0);
});

test('a Playbook with no products gets today’s description box and a tip', async ({ page }) => {
  await setup(page, { brand_name: 'Magen', onboarding_completed: true });
  await toAudienceStep(page);
  await expect(page.getByText("What are you promoting, and who's it for?")).toBeVisible();
  await expect(page.getByText(/add your products to your Brand Playbook/)).toBeVisible();
  await expect(page.getByRole('checkbox')).toHaveCount(0);
});

test('the Creative step can start from a screenshot of an ad the owner liked', async ({ page }) => {
  await setup(page);
  const PNG = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=';
  const analysis = { headline: 'Never miss a flight', angle: 'problem', hook: '', offer: '', cta: 'Book now', customer_problem: '', format: 'photo', layout: 'photo', why_it_works: 'Fear first, then a fixed price.' };
  const saved: Record<string, unknown>[] = [];
  let ready = false;
  await page.route(/\/jane-ads\/creative\/upload/, (route) => {
    if (route.request().url().includes('signature')) return route.fulfill({ status: 500, json: {} });
    return route.fulfill({ json: { url: 'https://cdn.uri/liked.png', is_video: false } });
  });
  await page.route(/\/competitors\//, (route) => {
    if (!['fetch', 'xhr'].includes(route.request().resourceType())) return route.continue();
    const req = route.request();
    const path = new URL(req.url()).pathname;
    const ad = { id: 'cad_7', image_url: PNG, competitor_id: '', competitor_name: '', platform: '', link: '', note: 'An ad I liked', analysis, angle_label: 'Problem / solution', error: '', created_at: '' };
    if (path.endsWith('/competitors/ads') && req.method() === 'POST') {
      saved.push(JSON.parse(req.postData() || '{}'));
      return route.fulfill({ json: { ...ad, status: 'analyzing' } });
    }
    if (path.endsWith('/competitors/ads')) {
      const out = { ads: [{ ...ad, status: ready ? 'ready' : 'analyzing' }], next_before: null, angles: [] };
      ready = true;
      return route.fulfill({ json: out });
    }
    const rec = { id: 'rec_7', ad_id: 'cad_7', product: 'Airport runs', count: 1, error: '', reference: { image_url: PNG, competitor_name: '', analysis } };
    if (path.endsWith('/recreate')) return route.fulfill({ json: { ...rec, status: 'running', results: [] } });
    if (path.endsWith('/use')) return route.fulfill({ json: { draft_id: 'draft_77', platform: 'instagram', content: 'Fixed-price airport runs.', image_url: PNG, created_at: '' } });
    if (path.includes('/recreations/')) {
      return route.fulfill({ json: { ...rec, status: 'done', results: [{ image_url: PNG, headline: 'Fly calm with Magen', primary_text: 'Fixed-price airport runs.', angle: 'problem' }], poll_after_ms: 300 } });
    }
    return route.fulfill({ json: {} });
  });

  await toAudienceStep(page);
  await page.getByRole('button', { name: 'Next →' }).click();
  await page.getByRole('button', { name: /₦47,000/ }).click();
  await page.getByRole('button', { name: 'Next →' }).click();

  await expect(page.getByText('Start from an ad I like')).toBeVisible();
  await page.getByLabel('Screenshot of an ad you liked').setInputFiles({ name: 'liked.png', mimeType: 'image/png', buffer: Buffer.from(PNG.split(',')[1], 'base64') });
  const composer = page.getByRole('dialog', { name: 'Make one like this' });
  await expect(composer.getByRole('button', { name: /^Make my version/ })).toBeVisible({ timeout: 20000 });
  expect(saved[0]).toMatchObject({ image_url: 'https://cdn.uri/liked.png', note: 'An ad I liked' });
  await composer.getByRole('button', { name: '1', exact: true }).click();
  await composer.getByRole('button', { name: 'Make my version', exact: true }).click();
  await expect(composer.getByText('Fly calm with Magen')).toBeVisible();
  await composer.getByRole('button', { name: 'Use in a campaign →' }).click();

  await expect(composer).toHaveCount(0);
  await expect(page.getByRole('button', { name: 'Next →' })).toBeEnabled();
});
