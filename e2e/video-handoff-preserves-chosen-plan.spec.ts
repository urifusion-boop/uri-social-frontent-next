/**
 * Regression test for a real reported bug: a client picks an audience plan from the
 * multi-plan-variant cards, then uploads a video and asks to improve its quality
 * before building the ad. When they come back and hit "Use in my ad", the build came
 * back as a FRESH set of audience plans instead of the ad they'd already started —
 * "it just created new plans, it doesn't use the video to create an ad".
 *
 * Root cause: CampaignsPage tracks the chosen (but not-yet-built) plan variant in a
 * component-local ref (pendingVariantsRef). The video hand-off unmounts CampaignsPage
 * (a different top-level page, JaneVideoChat, renders while it's away) and remounts a
 * fresh instance on return — wiping that ref. The resumed build then calls
 * planFromMessage with NO selected_plan_variant, which the backend reads as "nothing
 * chosen yet" and answers with a fresh plan_variants set (same as the very first
 * message) instead of building with the video. Fixed by threading the chosen variant
 * through videoPolishHandoff/pendingResumeVideo, same pattern as the brief already
 * uses for the same class of remount.
 */
import { test, expect, Page } from '@playwright/test';
import path from 'path';
import type { PlanVariant } from '@/src/api/CampaignService';

const FIXTURE_VIDEO = path.join(__dirname, 'fixtures', 'test-ad-clip.mp4');

// Only the fields this test reads/asserts on out of planFromMessage's request body.
interface PlanFromMessageCall {
  creative_source?: string;
  selected_plan_variant?: PlanVariant | null;
  variant_group_id?: string;
}

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

const VARIANT = {
  rank: 1,
  recommended: true,
  who_its_for: 'people embarking on a spiritual journey',
  audience_segment: 'spiritual_seekers',
  geo_pockets: ['Ojodu', 'Allen'],
  trigger: 'searching for meaning after a life change',
  why_this_could_work: 'Highly motivated, loyal buyers.',
  trade_off: 'Longer conversion path.',
  needs_video: false,
  budget_alone_ngn: 10000,
  budget_shared_ngn: null,
};

async function mockBackend(page: Page, planFromMessageCalls: PlanFromMessageCall[]) {
  await page.route('**/jane-ads/admin/access', (r) => r.fulfill({ json: { allowed: false } }));
  await page.route('**/jane-ads/wallet', (r) =>
    r.fulfill({ json: { balance_ngn: 50000, currency: 'NGN', min_topup_ngn: 1000, transactions: [] } })
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
  // A real prior user turn — openThread rebuilds the brief from this on the resume
  // remount, same as send() does live. Without it, the resumed continueWithSource
  // silently no-ops on an empty brief regardless of this test's actual subject.
  await page.route('**/jane-ads/threads/*/history', (r) =>
    r.fulfill({ json: { messages: [{ message_id: 'm1', role: 'user', kind: 'text', text: 'Get me more sales' }] } })
  );
  await page.route('**/jane-ads/chat/history**', (r) =>
    r.fulfill({ json: r.request().method() === 'GET' ? { messages: [] } : { ok: true } })
  );
  await page.route('**/jane-ads/creative/drafts**', (r) => r.fulfill({ json: { drafts: [] } }));
  await page.route('**/jane-ads/creative/upload', (r) =>
    r.fulfill({ json: { url: 'https://fake-cdn.test/uploaded-ad-clip.mp4', is_video: true } })
  );
  await page.route('**/social-media/billing/credits/balance', (r) =>
    r.fulfill({
      json: {
        total_credits: 10000,
        credits_used: 0,
        credits_remaining: 10000,
        subscription_tier: 'standard',
        next_renewal: null,
      },
    })
  );
  await page.route('**/zapcap-templates', (r) => r.fulfill({ json: { responseData: { templates: [] } } }));
  await page.route('**/zapcap-produce', (r) =>
    r.request().method() === 'POST' ? r.fulfill({ json: { responseData: { job_id: 'job_test' } } }) : r.fallback()
  );
  await page.route('**/zapcap-job/*/transcript', (r) => r.fulfill({ json: { responseData: { words: [] } } }));
  await page.route('**/zapcap-job/**', (r) =>
    r.fulfill({
      json: {
        responseData: {
          status: 'completed',
          output_url: 'https://fake-cdn.test/produced-ad-clip.mp4',
          failure_reason: null,
        },
      },
    })
  );

  await page.route('**/jane-ads/meta/plan-from-message', (r) => {
    const body = r.request().postDataJSON() as PlanFromMessageCall;
    planFromMessageCalls.push(body);
    // A plain first message with no media already sends creative_source: 'ask' (see
    // send()'s fallback) — both the very first call AND the post-"Build this ad" call
    // carry 'ask', so the real distinguishing signal is whether a variant has been
    // chosen yet, not creative_source's value.
    if (body.creative_source === 'ask' && !body.selected_plan_variant) {
      // First message — offer the multi-plan-variant choice.
      return r.fulfill({
        json: {
          stage: 'choose_plan_variant',
          plan_variants: {
            variants: [VARIANT],
            recommendation_reason: 'why',
            max_selectable: 1,
            selection_rule_reason: '',
          },
          variant_group_id: 'grp_test',
        },
      });
    }
    if (body.creative_source === 'ask' && body.selected_plan_variant) {
      // "Build this ad" on the chosen variant — ask how to handle the image, exactly
      // like the normal flow (never auto-generate here).
      return r.fulfill({
        json: { stage: 'choose_creative_source', creative_options: { can_generate: true, drafts: [] } },
      });
    }
    // The resumed video-upload build. If selected_plan_variant survived the hand-off
    // (the fix), this is a real build; if it didn't (the bug), the real backend would
    // answer this exact shape with a fresh choose_plan_variant instead — this mock
    // isn't asked to replicate that half, since the test asserts on the request body
    // captured above, not on this response.
    return r.fulfill({
      json: {
        stage: 'planned',
        plan_id: 'plan_test',
        selected_plan_variant: body.selected_plan_variant ?? null,
        plan: {
          goal: 'sales',
          behaviour: 'discover',
          explanation: 'why',
          platforms: [{ platform: 'meta', budget_ngn: 10000, days: 3, variants: 1, test_scope: 'none' }],
        },
        creative: {
          image_url: 'https://fake-cdn.test/produced-ad-clip.mp4',
          is_video: true,
          headline: 'AD BUILT WITH VIDEO',
          primary_text: 'Built from the produced clip.',
          cta: 'Send WhatsApp Message',
        },
        whatsapp_number: '2348031234567',
        wallet: { balance_ngn: 50000, budget_ngn: 10000, service_fee_ngn: 500, total_due_ngn: 10500, sufficient: true },
      },
    });
  });
}

test('a plan chosen before a video hand-off still gets used when the build resumes', async ({ page }) => {
  const planFromMessageCalls: PlanFromMessageCall[] = [];
  await fakeAuth(page);
  await mockBackend(page, planFromMessageCalls);
  await page.goto('/workspace/?tab=campaigns');

  await expect(page.getByRole('heading', { name: 'Campaigns' })).toBeVisible({ timeout: 20000 });

  const input = page.getByPlaceholder(/Tell Jane what you want to promote/i);
  await input.fill('Get me more sales');
  await input.press('Enter');

  // Pick the (only) audience plan and build.
  await expect(page.getByText('people embarking on a spiritual journey')).toBeVisible({ timeout: 10000 });
  await page.getByRole('button', { name: 'Choose this one' }).click();
  await page.getByRole('button', { name: 'Build this ad' }).click();

  // Now asked how to handle the image — upload a video instead.
  await expect(page.getByText(/how would you like to handle the image/i)).toBeVisible({ timeout: 10000 });
  await page.getByRole('button', { name: /Upload my own/i }).click();
  await page.locator('input[type="file"]').setInputFiles(FIXTURE_VIDEO);
  await expect(page.getByText(/improve this video.*quality/i)).toBeVisible({ timeout: 10000 });
  await page.getByRole('button', { name: /Improve it/i }).click();

  // The full JaneVideoChat round trip.
  await expect(page.getByText('"test-ad-clip.mp4"')).toBeVisible({ timeout: 10000 });
  await page.getByRole('button', { name: 'Me talking to camera' }).click();
  await page.getByRole('button', { name: 'Sell a product' }).click();
  await expect(page.getByRole('button', { name: 'Looks good, make it' })).toBeVisible({ timeout: 10000 });
  await page.getByRole('button', { name: 'Looks good, make it' }).click();

  const useInAd = page.getByRole('button', { name: /Use in my ad/i });
  await expect(useInAd).toBeVisible({ timeout: 20000 });
  await useInAd.click();

  // Back on Campaigns, resumed — the ad actually got built (not another plan-variant
  // prompt), and the request that built it carried the previously-chosen variant.
  await expect(page.getByText('AD BUILT WITH VIDEO').first()).toBeVisible({ timeout: 10000 });

  const resumeCall = planFromMessageCalls.find((c) => c.creative_source === 'upload');
  expect(resumeCall).toBeTruthy();
  expect(resumeCall!.selected_plan_variant).toBeTruthy();
  expect(resumeCall!.selected_plan_variant!.who_its_for).toBe('people embarking on a spiritual journey');
  expect(resumeCall!.variant_group_id).toBe('grp_test');
});
