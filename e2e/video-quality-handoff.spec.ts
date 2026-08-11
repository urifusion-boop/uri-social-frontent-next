/**
 * Playwright e2e — the video-upload "improve quality?" hand-off: uploading a video
 * in a Jane Ads conversation, choosing to improve it, landing on Submagic with the
 * file already loaded (no re-picking), and returning to the exact same thread with
 * the produced result once the client picks "Use in my ad".
 *
 * Lands on Submagic, not Video Polish (Reap) — Reap has a hard 2-minute minimum
 * baked into that vendor's own API (live-confirmed: a real ~90s ad clip got
 * rejected server-side even after the frontend's own pre-check was bypassed, since
 * the limit isn't ours to relax). Submagic has no such floor and is built for
 * exactly this job (caption/edit one clip you already have), not Reap's job of
 * extracting clips from long raw footage.
 *
 * Runs against a LOCAL dev server on this branch (npm run dev). Auth is faked and
 * every backend call is mocked, so the run is deterministic and never touches real
 * AI video processing — this verifies the UI wiring, not the backend. Same pattern
 * as image-choice.spec.ts.
 */
import { test, expect, Page } from '@playwright/test';
import path from 'path';

const FIXTURE_VIDEO = path.join(__dirname, 'fixtures', 'test-ad-clip.mp4');

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

async function mockBackend(page: Page) {
  // Jane Ads — non-critical reads.
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
  await page.route('**/jane-ads/threads/*/history', (r) => r.fulfill({ json: { messages: [] } }));
  await page.route('**/jane-ads/chat/history**', (r) =>
    r.fulfill({ json: r.request().method() === 'GET' ? { messages: [] } : { ok: true } })
  );
  await page.route('**/jane-ads/creative/drafts**', (r) => r.fulfill({ json: { drafts: [] } }));

  // The video upload itself — a fake hosted url, marked as a video.
  await page.route('**/jane-ads/creative/upload', (r) =>
    r.fulfill({ json: { url: 'https://fake-cdn.test/uploaded-ad-clip.mp4', is_video: true } })
  );

  // Plenty of credits, so Submagic's own insufficient-credits gate never blocks submit.
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

  // Submagic.
  await page.route('**/submagic-produce', (r) =>
    r.request().method() === 'POST' ? r.fulfill({ json: { responseData: { job_id: 'job_test' } } }) : r.fallback()
  );
  await page.route('**/submagic-job/**', (r) =>
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

  // Plan-from-message — only reached if the resumed thread continues the plan;
  // not asserted on directly here, but mocked so the resume call doesn't hang.
  await page.route('**/jane-ads/meta/plan-from-message', (r) =>
    r.fulfill({
      json: {
        stage: 'planned',
        plan_id: 'plan_test',
        plan: {
          goal: 'messages',
          behaviour: 'discover',
          explanation: 'why',
          platforms: [{ platform: 'meta', budget_ngn: 5000, days: 3, variants: 1, test_scope: 'none' }],
        },
        creative: {
          image_url: 'https://fake-cdn.test/produced-ad-clip.mp4',
          is_video: true,
          headline: 'Fresh Lunch',
          primary_text: 'Hot meals near you.',
          cta: 'Send WhatsApp Message',
        },
        whatsapp_number: '2348031234567',
        wallet: { balance_ngn: 50000, budget_ngn: 5000, service_fee_ngn: 500, total_due_ngn: 5500, sufficient: true },
      },
    })
  );
}

test('upload a video -> improve quality -> Submagic -> use in my ad -> resumes the thread', async ({ page }) => {
  await fakeAuth(page);
  await mockBackend(page);
  await page.goto('/workspace/?tab=campaigns');

  await expect(page.getByRole('heading', { name: 'Campaigns' })).toBeVisible({ timeout: 20000 });

  // Upload a video via the top-level "Upload photo/video" button.
  await page.getByRole('button', { name: /Upload photo\/video/i }).click();
  await page.locator('input[type="file"]').setInputFiles(FIXTURE_VIDEO);

  // The improve-quality prompt appears instead of the video being silently attached.
  await expect(page.getByText(/improve this video.*quality/i)).toBeVisible({ timeout: 10000 });

  await page.getByRole('button', { name: /Improve it/i }).click();

  // Landed on Submagic, file already loaded — no re-picking. It renders a preview
  // player for the already-accepted file rather than showing the filename as text.
  await expect(page.getByRole('button', { name: 'Produce with Submagic' })).toBeVisible({ timeout: 10000 });
  await expect(page.locator('video[src^="blob:"]').first()).toBeVisible();

  await page.getByRole('button', { name: 'Produce with Submagic' }).click();

  // Job resolves to 'completed' on the very first poll (mocked) — the finished
  // video and the "Use in my ad" action both appear.
  const useInAd = page.getByRole('button', { name: /Use in my ad/i });
  await expect(useInAd).toBeVisible({ timeout: 15000 });
  await useInAd.click();

  // Back on Campaigns, thread resumed, continuing with the produced clip.
  await expect(page.getByRole('heading', { name: 'Campaigns' })).toBeVisible({ timeout: 10000 });
});
