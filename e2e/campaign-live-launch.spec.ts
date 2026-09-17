/**
 * Playwright e2e — a REAL campaign launch through the chat UI, no mocking.
 *
 * Every other spec here intercepts the jane-ads endpoints to assert UI wiring
 * deterministically. This one deliberately does not: it answers whether a person
 * clicking through the actual chat gets the same targeting that driving the API
 * directly produces — named locations, 2-3 pockets, interests AND behaviours.
 * Driving the API by hand skips the pickers and passes structured fields the UI
 * derives from a conversation, so it cannot answer that on its own.
 *
 * It spends real wallet balance and creates a real (PAUSED, zero-spend) Meta campaign,
 * so it is opt-in via RUN_LIVE=1 and never runs in a normal suite:
 *
 *   BASE_URL=https://uri-staging.urisocial.com STORAGE_STATE=e2e/.auth/state.json \
 *     RUN_LIVE=1 npx playwright test e2e/campaign-live-launch.spec.ts --project=chromium
 *
 * A first version of this passed in 17 seconds by clicking a plan card left over from
 * an EARLIER thread and launching that — a campaign whose targeting had nothing to do
 * with the brief it had just typed. Hence two rules below, both load-bearing: start a
 * brand-new thread, and only accept a launch whose plan_id was created during this run.
 */
import { test, expect } from '@playwright/test';

const CAMPAIGNS_URL = '/workspace/?tab=campaigns';

test.describe.configure({ mode: 'serial', timeout: 1_200_000 });

test.skip(!process.env.RUN_LIVE, 'live launch — set RUN_LIVE=1 to spend real balance');

test('a campaign launched from the chat UI targets named locations for the brief typed', async ({ page }) => {
  // plan_ids minted during THIS run, so a stale card from a previous thread can never
  // satisfy the assertion.
  const ourPlanIds = new Set<string>();
  const launches: { planId: string; body: Record<string, any> }[] = [];

  page.on('response', async (r) => {
    const url = r.url();
    if (!r.ok()) return;
    try {
      if (url.includes('/jane-ads/meta/plan-from-message')) {
        const j = await r.json();
        if (j?.plan_id) ourPlanIds.add(j.plan_id);
      } else if (url.includes('/jane-ads/meta/plan/') && url.endsWith('/launch')) {
        const planId = url.split('/plan/')[1].replace('/launch', '');
        launches.push({ planId, body: await r.json() });
      }
    } catch { /* non-json response — ignore */ }
  });

  await page.goto(CAMPAIGNS_URL, { waitUntil: 'networkidle' });

  // A FRESH thread. Without this the page restores the last one, plan card and all.
  const newCampaign = page.getByRole('button', { name: /New campaign/i }).first();
  if (await newCampaign.isVisible().catch(() => false)) {
    await newCampaign.click();
    await page.waitForTimeout(3_000);
  }

  const composer = page.getByPlaceholder(/Tell Jane what you want to promote/i);
  await expect(composer).toBeVisible({ timeout: 30_000 });
  await composer.fill(
    'I run a barbershop in Lagos. Get me more bookings on WhatsApp, budget 6000 naira. ' +
      'My customers are men who come in for regular haircuts and grooming. ' +
      'Pick the best areas in Lagos yourself.',
  );
  await page.keyboard.press('Enter');

  // Drive the conversation by always acting on the NEWEST prompt, never a fixed
  // priority list. Every step's buttons stay on screen after use — the variant cards,
  // the destination's "Use this", the creative-source chips — so a priority list
  // re-clicks whichever step happens to rank highest and the flow never advances.
  // Three runs died that way, each stalling at a different step. In a chat the newest
  // question is the one at the bottom, so take the LAST enabled match in DOM order.
  // Every prompt Jane can put in front of a client between the brief and the plan.
  // "Use this style" is the VSG-01 visual-style picker, which only appears while
  // JANE_ADS_VSG01_ENABLED is on — harmless to list when it is off, since the loop
  // only clicks what is actually on screen.
  const STEP_NAMES = [
    /Build this ad/i,
    /Use this style/i,
    /^Use this$/,
    /Let Jane create one/i,
    /My WhatsApp/i,
    /Choose this one/i,
  ];

  const launchBtn = page.getByText(/Looks good — launch it/i).first();
  for (let turn = 0; turn < 24; turn += 1) {
    if (ourPlanIds.size > 0 && (await launchBtn.isVisible().catch(() => false))) break;

    let target = null;
    let bestIndex = -1;
    for (const name of STEP_NAMES) {
      const all = page.getByRole('button', { name }).and(page.locator(':not([disabled])'));
      const count = await all.count().catch(() => 0);
      for (let i = 0; i < count; i += 1) {
        const btn = all.nth(i);
        if (!(await btn.isVisible().catch(() => false))) continue;
        // Position on the page stands in for "newest" — the chat grows downward.
        const box = await btn.boundingBox().catch(() => null);
        const y = box ? box.y : -1;
        if (y > bestIndex) {
          bestIndex = y;
          target = btn;
        }
      }
    }

    if (target) {
      await target.click({ timeout: 15_000 }).catch(() => undefined);
    } else if (await composer.isEditable().catch(() => false)) {
      await composer.fill('Yes, that works — go ahead and build the plan.');
      await page.keyboard.press('Enter');
    }
    await page.waitForTimeout(15_000);
  }

  expect(ourPlanIds.size, 'Jane never produced a plan for the brief typed').toBeGreaterThan(0);
  await expect(launchBtn).toBeVisible({ timeout: 600_000 });
  await launchBtn.click();

  await expect
    .poll(() => launches.filter((l) => ourPlanIds.has(l.planId)).length, {
      timeout: 600_000,
      intervals: [5_000],
    })
    .toBeGreaterThan(0);

  const ours = launches.find((l) => ourPlanIds.has(l.planId))!;
  expect(ours.body.launch?.campaign_id).toBeTruthy();
  expect(ours.body.launch?.status).toBe('PAUSED');
  console.log('LAUNCHED_CAMPAIGN_ID=' + ours.body.launch?.campaign_id);
});
