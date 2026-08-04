/**
 * Playwright e2e — Multi-Plan Audience Variants: the choose_plan_variant card set
 * (recommended card, trade-offs, budget-gated single/multi select) and building
 * one or two ads from the selection.
 *
 * Runs against a LOCAL dev server on this branch (npm run dev). Auth is faked via
 * localStorage, every jane-ads API call is mocked — deterministic, no real backend.
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

const TWO_VARIANTS = {
  variants: [
    {
      rank: 1,
      recommended: true,
      who_its_for: 'property developers doing multiple units',
      audience_segment: 'B2B developers',
      geo_pockets: ['Lekki construction sites'],
      trigger: 'a developer fitting out ten units is one relationship worth ten jobs',
      why_this_could_work: 'They buy on competence, and they come back.',
      trade_off: 'Small audience, and a longer conversation before anything is agreed.',
      needs_video: true,
      budget_alone_ngn: 80000,
      budget_shared_ngn: 40000,
    },
    {
      rank: 2,
      recommended: false,
      who_its_for: 'people fitting out a new place',
      audience_segment: 'homeowners 30-55',
      geo_pockets: ['Ajah', 'Sangotedo'],
      trigger: 'solar gets bought at the moment someone sets up a new home',
      why_this_could_work: 'You catch them while deciding, not months later.',
      trade_off: 'Slower to convert than someone with an urgent problem.',
      needs_video: true,
      budget_alone_ngn: 80000,
      budget_shared_ngn: 40000,
    },
  ],
  recommendation_reason: "I'd start with the developers. You said the new builds are your bigger jobs.",
  max_selectable: 2,
  selection_rule_reason: '',
};

async function mockJaneAds(page: Page) {
  await page.route('**/jane-ads/admin/access', (r) => r.fulfill({ json: { allowed: false } }));
  await page.route('**/jane-ads/wallet', (r) =>
    r.fulfill({ json: { balance_ngn: 500000, currency: 'NGN', min_topup_ngn: 1000, transactions: [] } })
  );
  await page.route('**/jane-ads/threads', (r) =>
    r.request().method() === 'POST'
      ? r.fulfill({
          json: {
            thread_id: 'thr_test',
            title: 'New campaign',
            status: 'draft',
            preview: '',
            created_at: '',
            updated_at: '',
          },
        })
      : r.fulfill({ json: { threads: [] } })
  );
  await page.route('**/jane-ads/threads/*/history', (r) => r.fulfill({ json: { messages: [] } }));
  await page.route('**/jane-ads/chat/history**', (r) =>
    r.fulfill({ json: r.request().method() === 'GET' ? { messages: [] } : { ok: true } })
  );
  await page.route('**/jane-ads/creative/drafts**', (r) => r.fulfill({ json: { drafts: [] } }));

  // The real backend runs plan-variant generation BEFORE the creative_source=ask
  // check — so the very first message (frontend's send() already defaults to
  // creative_source:'ask') still gets choose_plan_variant, never choose_creative_source.
  // Only once variants have already been offered does a later 'ask' call (from
  // continueWithVariants) mean "how should I source the image" — track that with a
  // flag, mirroring image-choice.spec.ts's own step-counter convention for the same
  // kind of stateful, order-dependent mock.
  let variantsOffered = false;
  await page.route('**/jane-ads/meta/plan-from-message', async (route) => {
    const body = JSON.parse(route.request().postData() || '{}');
    // A variant was selected AND a real creative source chosen — the build itself.
    if (body.selected_plan_variant && body.creative_source && body.creative_source !== 'ask') {
      const v = body.selected_plan_variant;
      return route.fulfill({
        json: {
          stage: 'planned',
          plan_id: `plan_${v.rank}`,
          plan: {
            goal: 'messages',
            behaviour: 'discover',
            explanation: `Built for: ${v.who_its_for}`,
            platforms: [{ platform: 'meta', budget_ngn: v.budget_alone_ngn, days: 7, variants: 1, test_scope: 'none' }],
          },
          creative: {
            image_url:
              'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=',
            headline: `Ad for plan ${v.rank}`,
            primary_text: v.who_its_for,
            cta: 'Send WhatsApp Message',
          },
          whatsapp_number: '2348031234567',
          variant_group_id: body.variant_group_id,
          selected_plan_variant: v,
          wallet: {
            balance_ngn: 500000,
            budget_ngn: v.budget_alone_ngn,
            service_fee_ngn: 5000,
            total_due_ngn: v.budget_alone_ngn + 5000,
            sufficient: true,
          },
        },
      });
    }
    // Variant(s) already offered and picked, now asking how to source the image —
    // the step that was previously (live-caught 2026-08-04) skipped entirely.
    if (body.creative_source === 'ask' && variantsOffered) {
      return route.fulfill({
        json: {
          stage: 'choose_creative_source',
          understood: {},
          creative_options: { can_generate: true, drafts: [] },
        },
      });
    }
    variantsOffered = true;
    return route.fulfill({
      json: {
        stage: 'choose_plan_variant',
        understood: {},
        plan_variants: TWO_VARIANTS,
        variant_group_id: 'vgrp_test123',
      },
    });
  });
}

test('single-select: expand the recommended card and build one ad', async ({ page }) => {
  await fakeAuth(page);
  await mockJaneAds(page);
  await page.goto('/workspace/?tab=campaigns');

  await expect(page.getByRole('heading', { name: 'Campaigns' })).toBeVisible({ timeout: 20000 });
  const input = page.getByPlaceholder(/Tell Jane what you want to promote/i);
  await input.fill('solar installer, budget 80000, lekki');
  await input.press('Enter');

  // Recommendation shown, both cards present, trade-offs visible for the expanded one.
  await expect(page.getByText(/I'd start with the developers/i)).toBeVisible();
  await expect(page.getByText('property developers doing multiple units')).toBeVisible();
  await expect(page.getByText('people fitting out a new place')).toBeVisible();
  await expect(page.getByText('★ RECOMMENDED')).toBeVisible();
  // Recommended card expanded by default — its trade-off is visible without tapping.
  await expect(page.getByText(/Small audience, and a longer conversation/i)).toBeVisible();

  // max_selectable is 2 in this fixture, so the button reads "Select this one" —
  // the user is still only picking ONE (single-select is a user choice here, not
  // a UI restriction, since the budget allows up to two).
  await page.getByRole('button', { name: 'Select this one' }).first().click({ force: true });
  // Wait for the selection re-render to settle before the next click — this local
  // dev environment can race a rapid click against React's re-render otherwise.
  await expect(page.getByText('✓ Selected')).toBeVisible();
  await page.getByRole('button', { name: 'Build this ad' }).click({ force: true });

  // The image-source ask must still appear — this is the step a live bug (2026-08-04)
  // skipped entirely, auto-generating without ever asking.
  await expect(page.getByText(/how would you like to handle the image/i)).toBeVisible();
  await page.getByRole('button', { name: /Let Jane create one/i }).click({ force: true });

  await expect(page.getByText('Ad for plan 1')).toBeVisible({ timeout: 20000 });
  await expect(page.getByText('Built for: property developers doing multiple units')).toBeVisible();
});

test('multi-select: pick two, cost disclosure shown, build two independent ads', async ({ page }) => {
  await fakeAuth(page);
  await mockJaneAds(page);
  await page.goto('/workspace/?tab=campaigns');

  await expect(page.getByRole('heading', { name: 'Campaigns' })).toBeVisible({ timeout: 20000 });
  const input = page.getByPlaceholder(/Tell Jane what you want to promote/i);
  await input.fill('solar installer, budget 80000, lekki');
  await input.press('Enter');

  await expect(page.getByText('★ RECOMMENDED')).toBeVisible();

  // Selecting a card changes ITS OWN button label to "✓ Selected", so it drops out
  // of the "Select this one" match set — re-querying .first() after each click
  // naturally advances to the next still-unselected card instead of using .nth(),
  // which would break once the first element stops matching the filter.
  const selectButton = page.getByRole('button', { name: 'Select this one' });
  await selectButton.first().click({ force: true });
  // Wait for the first selection's re-render to settle before the next click —
  // firing two rapid clicks back-to-back raced the re-render in this environment.
  await expect(page.getByText('✓ Selected')).toBeVisible();
  await selectButton.first().click({ force: true });

  // Cost disclosure shown BEFORE building, reflecting both selections.
  await expect(page.getByText(/2 creative credits/i)).toBeVisible();

  await page.getByRole('button', { name: 'Build 2 ads' }).click({ force: true });

  // Asked once for both — picking a source fans out to build BOTH selected variants.
  await expect(page.getByText(/how would you like to handle the image/i)).toBeVisible();
  await page.getByRole('button', { name: /Let Jane create one/i }).click({ force: true });

  // Two independent result cards, one per plan — confirms spec §7 "one creative
  // per plan" survived the fix (not just a single build for the first variant).
  await expect(page.getByText('Ad for plan 1')).toBeVisible({ timeout: 20000 });
  await expect(page.getByText('Ad for plan 2')).toBeVisible({ timeout: 20000 });
});
