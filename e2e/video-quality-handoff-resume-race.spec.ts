/**
 * Regression test for a real reported bug: after finishing "improve quality" on an
 * uploaded video and pressing "Use in my ad", the user landed back on whatever
 * conversation thread happened to be most-recently-touched instead of the one the
 * video actually came from — the resume looked like it silently did nothing.
 *
 * Root cause: CampaignsPage.tsx has two independent mount-time effects that both
 * decide which thread is active — one unconditionally reopens threads[0] (the
 * generic "reload lands back where you left off" effect), the other resumes the
 * specific thread a video hand-off came from. Since CampaignsPage remounts on
 * navigating back from the video tool, both effects fired on the same mount with no
 * ordering guarantee, and the generic one could clobber the resume. Fixed by
 * skipping the generic reopen whenever a resume is pending.
 *
 * This test seeds two threads with a DIFFERENT, more "recent" thread at index 0 —
 * exactly the shape that exposed the race — switches into the second thread,
 * uploads a video there, completes the hand-off, and asserts the resumed thread
 * (not threads[0]) is what's actually showing afterward.
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
  await page.route('**/jane-ads/admin/access', (r) => r.fulfill({ json: { allowed: false } }));
  await page.route('**/jane-ads/wallet', (r) =>
    r.fulfill({ json: { balance_ngn: 50000, currency: 'NGN', min_topup_ngn: 1000, transactions: [] } })
  );

  // Two pre-existing threads. "thr_sales" is listed FIRST — the generic mount
  // effect treats index 0 as "most recent" — while the video hand-off actually
  // happens inside "thr_video". This ordering is what exposed the real bug.
  await page.route('**/jane-ads/threads', (r) =>
    r.request().method() === 'POST'
      ? r.fulfill({
          json: {
            thread_id: 'thr_new',
            title: 'New campaign',
            status: 'draft',
            preview: '',
            created_at: '',
            updated_at: '',
          },
        })
      : r.fulfill({
          json: {
            threads: [
              {
                thread_id: 'thr_sales',
                title: 'Get me more sales',
                status: 'planned',
                preview: '',
                created_at: '',
                updated_at: '',
              },
              {
                thread_id: 'thr_video',
                title: 'Video ad from my upload',
                status: 'planned',
                preview: '',
                created_at: '',
                updated_at: '',
              },
            ],
          },
        })
  );
  await page.route('**/jane-ads/threads/*/history', (r) => {
    const url = r.request().url();
    // thr_video carries a real prior USER turn ("brief"), same as the real bug: the
    // client typed what they wanted before uploading the video. This is what
    // openThread rebuilds into a brief on reopen — a jane-only marker wouldn't
    // exercise that path (sinceResolved only counts role:'user' turns), which is
    // exactly why the earlier version of this test didn't catch the stale-briefSoFar
    // bug: it only checked the right thread reopened, never that resuming actually
    // continued the plan with it.
    const messages = url.includes('thr_video')
      ? [
          { message_id: 'm_video_brief', role: 'user', kind: 'text', text: 'Ad for my hot lunch delivery' },
          { message_id: 'm_video_marker', role: 'jane', kind: 'text', text: 'VIDEO_THREAD_MARKER' },
        ]
      : [{ message_id: 'm_sales_marker', role: 'jane', kind: 'text', text: 'SALES_THREAD_MARKER' }];
    r.fulfill({ json: { messages } });
  });
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

test('resuming a video hand-off reopens the originating thread, not the generic most-recent one', async ({ page }) => {
  await fakeAuth(page);
  await mockBackend(page);
  await page.goto('/workspace/?tab=campaigns');

  await expect(page.getByRole('heading', { name: 'Campaigns' })).toBeVisible({ timeout: 20000 });

  // Mount opens thr_sales (index 0) by default — expected, matches "reload lands
  // back where you left off". Then the user switches into the video thread.
  await expect(page.getByText('SALES_THREAD_MARKER')).toBeVisible({ timeout: 10000 });
  await page.getByText('Video ad from my upload', { exact: true }).click();
  await expect(page.getByText('VIDEO_THREAD_MARKER')).toBeVisible({ timeout: 10000 });

  // Upload a video inside thr_video and hand it off for quality improvement.
  await page.getByRole('button', { name: /Upload photo\/video/i }).click();
  await page.locator('input[type="file"]').setInputFiles(FIXTURE_VIDEO);
  await expect(page.getByText(/improve this video.*quality/i)).toBeVisible({ timeout: 10000 });
  await page.getByRole('button', { name: /Improve it/i }).click();

  await expect(page.getByText('"test-ad-clip.mp4"')).toBeVisible({ timeout: 10000 });
  await page.getByRole('button', { name: 'Me talking to camera' }).click();
  await page.getByRole('button', { name: 'Sell a product' }).click();
  await expect(page.getByRole('button', { name: 'Looks good, make it' })).toBeVisible({ timeout: 10000 });
  await page.getByRole('button', { name: 'Looks good, make it' }).click();

  const useInAd = page.getByRole('button', { name: /Use in my ad/i });
  await expect(useInAd).toBeVisible({ timeout: 20000 });
  await useInAd.click();

  // Back on Campaigns: the resumed thread's history must still be what's showing —
  // this is the assertion the race fix alone satisfies (the generic "reopen
  // threads[0]" effect would otherwise have clobbered it back to thr_sales).
  await expect(page.getByRole('heading', { name: 'Campaigns' })).toBeVisible({ timeout: 10000 });
  await expect(page.getByText('VIDEO_THREAD_MARKER')).toBeVisible({ timeout: 10000 });

  // And the resume must have actually continued the plan with the produced video —
  // this is the assertion that catches the separate stale-briefSoFar-closure bug:
  // continueWithSource silently no-ops on an empty brief, and briefSoFar's update
  // from openThread hadn't flushed into a re-render yet when the resume effect,
  // captured on the stale pre-openThread render, called it. Without passing
  // openThread's returned brief through explicitly, this never appears.
  await expect(page.getByText('Fresh Lunch').first()).toBeVisible({ timeout: 10000 });
});
