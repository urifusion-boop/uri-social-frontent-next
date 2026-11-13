/**
 * Campaign Manager → Competitors (PRD WS2–4).
 *
 * Businesses: Jane's search shows progress, suggestions wait for Keep / Not a competitor (with a
 * reason), owners can add one. Their ads: save a screenshot, Jane reads it, the side sheet says
 * why it works, "Make one like this" makes versions one by one, and "Use in a campaign" opens
 * the builder with that ad already picked.
 *
 *     npx next dev -p 3002
 *     BASE_URL=http://localhost:3002 npx playwright test e2e/competitors.spec.ts --project=chromium
 */
import { test, expect, type Page } from '@playwright/test';

const ok = (responseData: unknown) => ({ json: { status: true, responseCode: 200, responseMessage: 'ok', responseData } });
const PNG =
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=';

const RIDE = {
  id: 'cmp_1', name: 'RideEasy', website: 'https://rideeasy.ng/', instagram: 'rideeasy.ng', kind: 'direct', location: 'Lekki',
  what_they_sell: 'Airport transfers', why: 'Same airport runs to the same travellers', source_url: 'https://rideeasy.ng/',
  description: '', status: 'suggested', source: 'discovered', removed_reason: '',
};
const SHUTTLE = { ...RIDE, id: 'cmp_2', name: 'Lagos Shuttle', website: 'https://lagosshuttle.com/', instagram: '', kind: 'similar', why: 'Staff buses' };
const REASONS = [
  { value: 'not_a_competitor', label: 'Not a competitor' },
  { value: 'different_area', label: 'Different area' },
];
const ANALYSIS = {
  headline: 'Never miss a flight', angle: 'problem', hook: 'a worried traveller', offer: '₦20,000 fixed', cta: 'Book now',
  customer_problem: 'Missing flights in traffic', format: 'photo', layout: 'photo with a bold headline band',
  why_it_works: 'It shows the fear first, then a fixed price.',
};

async function setup(page: Page) {
  await page.addInitScript(() => {
    localStorage.setItem('@URI@AUTHENTICATED', 'true');
    localStorage.setItem('@URI@USER_TOKENS', JSON.stringify({ accessToken: 'test', refreshToken: 'test' }));
    localStorage.setItem('@URI@USER_DETAILS', JSON.stringify({ userId: 'u_test', email: 'test@uri', firstName: 'Test' }));
    localStorage.setItem('@URI@ACTIVE_BRAND_ID', 'brnd_personal_u_test');
  });
  const state = {
    list: { suggested: [] as typeof RIDE[], active: [] as typeof RIDE[], removed_count: 0, discovery: null as unknown, reasons: REASONS },
    polls: 0,
    ads: [] as Record<string, unknown>[],
    recPolls: 0,
    removed: '' as string,
  };
  await page.route(/\/social-media\//, (route) => {
    if (!['fetch', 'xhr'].includes(route.request().resourceType())) return route.continue();
    const path = new URL(route.request().url()).pathname;
    if (path.endsWith('/brand-profile')) return route.fulfill(ok({ brand_name: 'Magen', onboarding_completed: true, key_products_services: ['Airport runs', 'Staff buses'] }));
    if (path.endsWith('/video-drafts')) return route.fulfill(ok([]));
    return route.fulfill(ok({}));
  });
  await page.route(/\/jane-ads\//, (route) => {
    const path = new URL(route.request().url()).pathname;
    if (path.endsWith('/creative/upload-signature')) return route.fulfill({ status: 500, json: {} });
    if (path.endsWith('/creative/upload')) return route.fulfill({ json: { url: 'https://cdn.uri/shot.png', is_video: false } });
    if (path.endsWith('/wizard-drafts')) return route.fulfill({ json: { drafts: [] } });
    if (path.endsWith('/objectives')) return route.fulfill({ json: { objectives: [] } });
    return route.fulfill({ json: { ok: true, formats: [], campaigns: [] } });
  });
  await page.route(/\/competitors/, async (route) => {
    const req = route.request();
    const url = new URL(req.url());
    const path = url.pathname;
    if (path.endsWith('/competitors') && req.method() === 'GET') return route.fulfill({ json: state.list });
    if (path.endsWith('/competitors/discover')) {
      state.list.discovery = { job_id: 'job_d', status: 'running', steps: [{ id: 'search', label: 'Searching the web for businesses like yours', status: 'running', detail: '', order: 1 }], found: [], poll_after_ms: 300 };
      return route.fulfill({ json: state.list.discovery });
    }
    if (path.includes('/competitors/discover/')) {
      state.polls += 1;
      if (state.polls < 2) return route.fulfill({ json: { ...(state.list.discovery as object), steps: [{ id: 'search', label: 'Searching the web for businesses like yours', status: 'done', detail: '6 possible matches', order: 1 }, { id: 'check', label: 'Checking each one is a real, open business', status: 'running', detail: '', order: 2 }] } });
      state.list = { ...state.list, suggested: [RIDE, SHUTTLE], discovery: { job_id: 'job_d', status: 'done', steps: [], found: [] } };
      return route.fulfill({ json: state.list.discovery });
    }
    if (path.endsWith('/keep')) {
      const kept = { ...RIDE, status: 'active' };
      return route.fulfill({ json: kept });
    }
    if (path.endsWith('/remove')) {
      state.removed = JSON.parse(req.postData() || '{}').reason;
      return route.fulfill({ json: { ...SHUTTLE, status: 'removed', removed_reason: state.removed } });
    }
    if (path.endsWith('/competitors') && req.method() === 'POST') {
      const body = JSON.parse(req.postData() || '{}');
      return route.fulfill({ json: { ...RIDE, id: 'cmp_3', name: body.name, website: '', instagram: 'vipwheels', status: 'active', source: 'added', kind: 'direct', why: '', what_they_sell: '' } });
    }
    if (path.endsWith('/competitors/ads') && req.method() === 'POST') {
      const ad = { id: 'cad_1', image_url: PNG, competitor_id: 'cmp_1', competitor_name: 'RideEasy', platform: 'instagram', link: '', note: '', status: 'analyzing', analysis: {}, angle_label: '', error: '', created_at: '2026-11-13T12:00:00Z' };
      state.ads = [ad];
      return route.fulfill({ json: ad });
    }
    if (path.endsWith('/competitors/ads') && req.method() === 'GET') {
      state.ads = state.ads.map((a) => ({ ...a, status: 'ready', analysis: ANALYSIS, angle_label: 'Problem / solution' }));
      return route.fulfill({ json: { ads: state.ads, next_before: null, angles: [{ value: 'problem', label: 'Problem / solution' }, { value: 'offer', label: 'Offer' }] } });
    }
    if (path.endsWith('/recreate')) {
      return route.fulfill({ json: { id: 'rec_1', ad_id: 'cad_1', product: 'Airport runs', count: 2, status: 'running', results: [], error: '', reference: { image_url: PNG, competitor_name: 'RideEasy', analysis: ANALYSIS } } });
    }
    if (path.includes('/recreations/') && path.endsWith('/use')) {
      return route.fulfill({ json: { draft_id: 'draft_9', platform: 'instagram', content: 'Fixed-price airport runs.', image_url: PNG, created_at: '' } });
    }
    if (path.includes('/recreations/')) {
      state.recPolls += 1;
      const results = [{ image_url: PNG, headline: 'Never stress about your flight', primary_text: 'Fixed-price airport runs from Magen.', angle: 'problem' }];
      if (state.recPolls >= 2) results.push({ image_url: PNG + '#2', headline: 'Airport runs, fixed price', primary_text: 'Book Magen today.', angle: 'offer' });
      return route.fulfill({ json: { id: 'rec_1', ad_id: 'cad_1', product: 'Airport runs', count: 2, status: state.recPolls >= 2 ? 'done' : 'running', results, error: '', reference: { image_url: PNG, competitor_name: 'RideEasy', analysis: ANALYSIS }, poll_after_ms: 300 } });
    }
    return route.fulfill({ json: {} });
  });
  return state;
}

test('find competitors, keep one, rule one out with a reason, and add one', async ({ page }) => {
  const state = await setup(page);
  await page.goto('/workspace/?tab=campaign-competitors');

  await expect(page.getByRole('heading', { name: 'Competitors' })).toBeVisible({ timeout: 30000 });
  await expect(page.getByText('Find businesses like yours')).toBeVisible();
  await page.getByRole('button', { name: 'Find my competitors' }).click();
  await expect(page.getByText('Looking for businesses like yours')).toBeVisible();
  await expect(page.getByText('Checking each one is a real, open business')).toBeVisible();

  await expect(page.getByText('Are these your competitors?', { exact: true })).toBeVisible();
  await expect(page.getByText('Same airport runs to the same travellers')).toBeVisible();

  await page.getByRole('button', { name: 'Keep', exact: true }).first().click();
  await expect(page.getByText('Your competitors', { exact: true })).toBeVisible();
  await expect(page.getByRole('radio', { name: 'Direct' })).toHaveAttribute('aria-checked', 'true');

  await page.getByRole('button', { name: 'Not a competitor' }).click();
  await page.getByRole('button', { name: 'Different area' }).click();
  await expect(page.getByText('Are these your competitors?', { exact: true })).toHaveCount(0);
  expect(state.removed).toBe('different_area');

  await page.getByRole('button', { name: '+ Add a competitor' }).click();
  await page.getByLabel('Business name').fill('VIP Wheels');
  await page.getByLabel('Website or Instagram').fill('@vipwheels');
  await page.getByRole('button', { name: 'Add', exact: true }).click();
  await expect(page.getByText('VIP Wheels')).toBeVisible();
  await expect(page.getByText('@vipwheels')).toBeVisible();
});

test('save a competitor ad, see why it works, make your own version and use it in a campaign', async ({ page }) => {
  const state = await setup(page);
  state.list = { ...state.list, active: [{ ...RIDE, status: 'active' }] };
  await page.goto('/workspace/?tab=campaign-competitors');
  await page.getByRole('tab', { name: 'Their ads' }).click();

  await expect(page.getByText('Save ads you see from competitors')).toBeVisible();
  await page.getByRole('button', { name: "+ Add an ad you've seen" }).first().click();
  await page.locator('#cmp-ad-file').setInputFiles({ name: 'shot.png', mimeType: 'image/png', buffer: Buffer.from(PNG.split(',')[1], 'base64') });
  await page.getByLabel('Whose ad is it?').selectOption('cmp_1');
  await page.getByRole('button', { name: 'Save ad' }).click();

  await expect(page.getByText('Problem / solution · instagram')).toBeVisible({ timeout: 15000 });
  await page.getByText('Problem / solution · instagram').click();
  const sheet = page.locator('.MuiDrawer-paper');
  await expect(sheet.getByText('Why it works')).toBeVisible();
  await expect(sheet.getByText('It shows the fear first, then a fixed price.')).toBeVisible();
  await sheet.getByRole('button', { name: 'Make one like this' }).click();

  const composer = page.getByRole('dialog', { name: 'Make one like this' });
  await expect(composer.getByText('Not copied:')).toBeVisible();
  await composer.getByRole('button', { name: '2', exact: true }).click();
  await expect(composer.getByText('2 content credits')).toBeVisible();
  await composer.getByRole('button', { name: 'Make my versions' }).click();
  await expect(composer.getByText('Never stress about your flight')).toBeVisible();
  await expect(composer.getByText('Airport runs, fixed price')).toBeVisible();
  await composer.getByRole('button', { name: 'Use in a campaign →' }).first().click();

  await expect(page.getByText('Create Campaign')).toBeVisible({ timeout: 15000 });
});
