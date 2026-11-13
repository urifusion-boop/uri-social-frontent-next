/**
 * Website → Brand Playbook (PRD Workstream 1).
 *
 * New users: brand setup asks for the website first, shows Jane reading it, lays out what she
 * found with where each value came from, and after "Looks right" skips to the few steps the
 * website couldn't answer.
 * Existing users: a Playbook panel reads the website and opens the findings in a side sheet;
 * applied fields then show "From your website" / "Jane's guess" in the Playbook.
 *
 * Local dev server, auth faked, every backend call mocked:
 *     npx next dev -p 3002
 *     BASE_URL=http://localhost:3002 npx playwright test e2e/website-to-playbook.spec.ts --project=chromium
 */
import { test, expect, type Page, type Route } from '@playwright/test';
import { mockFeatures } from './feature-flags';

test.beforeEach(async ({ page }) => mockFeatures(page));

const ok = (responseData: unknown) => ({
  json: { status: true, responseCode: 200, responseMessage: 'ok', responseData },
});

const FINDINGS = [
  { key: 'brand_name', label: 'Brand name', section: 'Brand Identity', found: 'Magen', current: 'Magen', basis: 'stated', page: 'https://magen.ng/', status: 'same', selected: false, merge: false },
  { key: 'product_description', label: 'Description', section: 'Brand Identity', found: 'Airport, staff and event transport in Lagos.', current: 'We make moving easier', basis: 'inferred', page: 'https://magen.ng/', status: 'different', selected: false, merge: false },
  { key: 'key_products_services', label: 'Key products / services', section: 'Brand Identity', found: ['Airport runs (from ₦25,000)', 'Staff buses'], current: [], basis: 'stated', page: 'https://magen.ng/services', status: 'new', selected: true, merge: true },
  { key: 'customer_pain_points', label: 'Customer pain points', section: 'Audience', found: ['Missing flights'], current: [], basis: 'inferred', page: 'https://magen.ng/', status: 'new', selected: true, merge: true },
  { key: 'derived_voice', label: 'Brand voice', section: 'Brand Voice', found: 'calm, reliable, a little formal', current: '', basis: 'inferred', page: 'https://magen.ng/', status: 'new', selected: true, merge: false },
];

const RUNNING = {
  job_id: 'job_1', status: 'running', url: 'https://magen.ng/', poll_after_ms: 300,
  steps: [
    { id: 'check', label: 'Checking magen.ng', status: 'done', detail: '', order: 1 },
    { id: 'home', label: 'Reading your home page', status: 'done', detail: 'Magen | Airport transport', order: 2 },
    { id: 'pages', label: 'Reading About, Services', status: 'running', detail: '', order: 3 },
  ],
  found: ['Magen', 'Airport runs (from ₦25,000)'],
};
const DONE = { ...RUNNING, status: 'done', site: 'magen.ng', read_at: '2026-11-13T12:00:00Z', findings: FINDINGS, applied: [] };

async function fakeAuth(page: Page) {
  await page.addInitScript(() => {
    localStorage.setItem('@URI@AUTHENTICATED', 'true');
    localStorage.setItem('@URI@USER_TOKENS', JSON.stringify({ accessToken: 'test', refreshToken: 'test' }));
    localStorage.setItem('@URI@USER_DETAILS', JSON.stringify({ userId: 'u_test', email: 'test@uri', firstName: 'Test' }));
    localStorage.setItem('@URI@ACTIVE_BRAND_ID', 'brnd_personal_u_test');
  });
}

async function mockBrandIntel(page: Page, latest: unknown, applied: string[], updates: Record<string, unknown>) {
  let polls = 0;
  const calls = { applyBody: null as null | Record<string, unknown> };
  await page.route(/\/brand-intel\/website-reads/, async (route: Route) => {
    const req = route.request();
    const path = new URL(req.url()).pathname;
    if (path.endsWith('/latest')) return route.fulfill({ json: latest });
    if (path.endsWith('/apply')) {
      calls.applyBody = JSON.parse(req.postData() || '{}');
      return route.fulfill({ json: { applied, profile_updates: updates } });
    }
    if (req.method() === 'POST') return route.fulfill({ json: { ...RUNNING, steps: [], found: [], status: 'queued' } });
    polls += 1;
    return route.fulfill({ json: polls < 2 ? RUNNING : DONE });
  });
  return calls;
}

test('new users start with their website and skip to the few steps it could not answer', async ({ page }) => {
  await fakeAuth(page);
  await page.route(/\/social-media\//, (route) => {
    if (!['fetch', 'xhr'].includes(route.request().resourceType())) return route.continue();
    const path = new URL(route.request().url()).pathname;
    if (path.endsWith('/brand-profile') && route.request().method() === 'GET') {
      return route.fulfill(ok({ brand_name: '', onboarding_completed: false }));
    }
    return route.fulfill(ok({}));
  });
  await page.route(/\/jane-ads\//, (route) => route.fulfill({ json: { formats: [] } }));
  const calls = await mockBrandIntel(page, { status: 'none' }, ['key_products_services', 'customer_pain_points', 'derived_voice', 'product_description'], {
    brand_name: 'Magen',
    industry: 'Event transport',
    key_products_services: ['Airport runs (from ₦25,000)', 'Staff buses'],
    derived_voice: 'calm, reliable, a little formal',
  });

  await page.goto('/social-media/brand-setup/');
  await page.getByRole('button', { name: /Let's get started/ }).click();

  await expect(page.getByText("What's your website?")).toBeVisible();
  await expect(page.getByRole('button', { name: 'Set up by hand' })).toBeVisible();
  await page.getByLabel('Your website').fill('magen.ng');
  await page.getByRole('button', { name: 'Read it' }).click();

  // Jane reads it, showing each step and what she's found so far.
  await expect(page.getByText('Reading your home page')).toBeVisible();
  await expect(page.getByText('Found so far')).toBeVisible();
  await expect(page.getByText(/You can leave this page/)).toBeVisible();

  // What she found, each value marked by where it came from.
  await expect(page.getByText("Here's what I found")).toBeVisible();
  await expect(page.getByText('From your website').first()).toBeVisible();
  await expect(page.getByText("Jane's guess · check this").first()).toBeVisible();
  await expect(page.getByText('Airport runs (from ₦25,000)')).toBeVisible();
  await expect(page.getByText('1 already match your Playbook')).toBeVisible();

  // Fix one guess in place before accepting.
  await page.getByText('Airport, staff and event transport in Lagos.').click();
  await page.getByLabel('Edit Description').fill('Airport and staff transport in Lagos');
  await page.getByRole('button', { name: 'Done' }).click();
  await expect(page.getByText('Your words')).toBeVisible();

  await page.getByRole('button', { name: 'Looks right — continue' }).click();
  expect(calls.applyBody?.fields).toEqual(['product_description', 'key_products_services', 'customer_pain_points', 'derived_voice']);
  expect(calls.applyBody?.edits).toEqual({ product_description: 'Airport and staff transport in Lagos' });

  // The shorter path: logo & colours next (name, industry and voice came from the website).
  await expect(page.getByText('🎨 Visual Identity')).toBeVisible();
  await expect(page.getByText('1/4')).toBeVisible();
});

test('a website that cannot be read says why and keeps both ways forward', async ({ page }) => {
  await fakeAuth(page);
  await page.route(/\/social-media\//, (route) =>
    !['fetch', 'xhr'].includes(route.request().resourceType())
      ? route.continue()
      : route.fulfill(ok(new URL(route.request().url()).pathname.endsWith('/brand-profile') ? { onboarding_completed: false } : {}))
  );
  await page.route(/\/jane-ads\//, (route) => route.fulfill({ json: { formats: [] } }));
  await page.route(/\/brand-intel\/website-reads/, (route) => {
    const path = new URL(route.request().url()).pathname;
    if (path.endsWith('/latest')) return route.fulfill({ json: { status: 'none' } });
    if (route.request().method() === 'POST') return route.fulfill({ json: { ...RUNNING, status: 'queued', steps: [] } });
    return route.fulfill({
      json: { job_id: 'job_1', status: 'failed', url: 'https://magen.ng/', steps: [], found: [], error: { code: 'blocked', message: "Your website doesn't let tools read it." } },
    });
  });

  await page.goto('/social-media/brand-setup/');
  await page.getByRole('button', { name: /Let's get started/ }).click();
  await page.getByLabel('Your website').fill('magen.ng');
  await page.getByRole('button', { name: 'Read it' }).click();

  await expect(page.getByText(/Your website doesn't let tools read it\. You can try again, or set up by hand/)).toBeVisible();
  await expect(page.getByRole('button', { name: 'Try again' })).toBeVisible();
  await page.getByRole('button', { name: 'Set up by hand' }).click();
  await expect(page.getByText('🏢 Brand Basics')).toBeVisible();
});

test('existing users review website suggestions in a side sheet and see where values came from', async ({ page }) => {
  await fakeAuth(page);
  const profile: Record<string, unknown> = {
    brand_name: 'Magen', industry: 'Transportation', website: 'magen.ng', product_description: 'We make moving easier',
    onboarding_completed: true,
  };
  await page.route(/\/social-media\//, (route) => {
    if (!['fetch', 'xhr'].includes(route.request().resourceType())) return route.continue();
    const path = new URL(route.request().url()).pathname;
    if (path.endsWith('/brand-profile') && route.request().method() === 'GET') return route.fulfill(ok(profile));
    if (path.endsWith('/brand-profile/health')) return route.fulfill(ok({ score: 40, level: 'Needs attention', filled: 10, total: 39, missing_count: 5, suggestions: [], used_in: {}, sections: {} }));
    if (path.endsWith('/brand-profile/suggestions')) return route.fulfill(ok({ suggestions: [] }));
    if (path.endsWith('/brand-profile/instructions')) return route.fulfill(ok({ instructions: [], history: [] }));
    if (path.endsWith('/video-drafts')) return route.fulfill(ok([]));
    return route.fulfill(ok({}));
  });
  await page.route(/\/jane-ads\//, (route) => route.fulfill({ json: { formats: [] } }));
  const applied = ['key_products_services', 'customer_pain_points', 'derived_voice'];
  await mockBrandIntel(page, DONE, applied, {
    key_products_services: ['Airport runs (from ₦25,000)', 'Staff buses'],
    customer_pain_points: ['Missing flights'],
    derived_voice: 'calm, reliable, a little formal',
    field_sources: {
      key_products_services: { source: 'website', basis: 'stated', value: ['Airport runs (from ₦25,000)', 'Staff buses'] },
      customer_pain_points: { source: 'website', basis: 'inferred', value: ['Missing flights'] },
    },
  });

  await page.goto('/workspace/?tab=playbook');
  await expect(page.getByText('Fill your Playbook from your website')).toBeVisible({ timeout: 30000 });
  await expect(page.getByText('4 new')).toBeVisible();
  await page.locator('.pb-panel', { hasText: 'Fill your Playbook from your website' }).locator('button:visible', { hasText: /^Review$/ }).first().click();

  const sheet = page.locator('.MuiDrawer-paper');
  await expect(sheet.getByText('Suggestions from your website')).toBeVisible();
  await expect(sheet.getByText('Yours now:')).toBeVisible(); // the owner's own description is shown, and left unticked
  await expect(sheet.getByText('3 selected')).toBeVisible();
  await sheet.getByRole('button', { name: 'Use 3' }).click();

  await expect(page.getByText('Added 3 things from your website to your Playbook.')).toBeVisible();
  await expect(page.getByText('From your website').first()).toBeVisible();
  await expect(page.getByText("Jane's guess").first()).toBeVisible();
});

test('no website: the Playbook panel can read the owner’s own Instagram instead', async ({ page }) => {
  await fakeAuth(page);
  const starts: Record<string, unknown>[] = [];
  await page.route(/\/social-media\//, (route) => {
    if (!['fetch', 'xhr'].includes(route.request().resourceType())) return route.continue();
    const path = new URL(route.request().url()).pathname;
    if (path.endsWith('/brand-profile') && route.request().method() === 'GET') return route.fulfill(ok({ brand_name: 'Magen', onboarding_completed: true }));
    if (path.endsWith('/brand-profile/health')) return route.fulfill(ok({ score: 40, level: 'Needs attention', filled: 10, total: 39, missing_count: 5, suggestions: [], used_in: {}, sections: {} }));
    if (path.endsWith('/brand-profile/suggestions')) return route.fulfill(ok({ suggestions: [] }));
    if (path.endsWith('/brand-profile/instructions')) return route.fulfill(ok({ instructions: [], history: [] }));
    if (path.endsWith('/video-drafts')) return route.fulfill(ok([]));
    return route.fulfill(ok({}));
  });
  await page.route(/\/jane-ads\//, (route) => route.fulfill({ json: { formats: [] } }));
  await page.route(/\/brand-intel\/website-reads/, (route) => {
    const req = route.request();
    const path = new URL(req.url()).pathname;
    if (path.endsWith('/latest')) return route.fulfill({ json: { status: 'none' } });
    if (req.method() === 'POST') {
      starts.push(JSON.parse(req.postData() || '{}'));
      return route.fulfill({ status: 400, json: { detail: 'Connect your Instagram in Connected Accounts first, then Jane can read it.' } });
    }
    return route.fulfill({ json: { status: 'none' } });
  });

  await page.goto('/workspace/?tab=playbook');
  await expect(page.getByText('Fill your Playbook from your website')).toBeVisible({ timeout: 30000 });
  await page.locator('.pb-panel', { hasText: 'Fill your Playbook from your website' }).getByText('Fill your Playbook from your website').click();
  await page.getByRole('button', { name: 'Read my Instagram' }).click();
  await expect.poll(() => starts.length).toBe(1);
  expect(starts[0]).toMatchObject({ source: 'instagram' });
  await expect(page.getByRole('alert').filter({ hasText: /Connect your Instagram/ })).toBeVisible();
});
