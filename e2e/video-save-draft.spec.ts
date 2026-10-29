/**
 * Saving a finished video: the message points to the Drafts tab (not an "Upload Images tab"), and a button
 * takes the customer there.
 *
 * Local dev server, auth faked, every backend call mocked. The finished video is seeded through the screen's
 * own saved-session slot.
 */
import { test, expect, Page } from '@playwright/test';

const STORYBOARD = {
  total_duration_seconds: 10,
  target_platform: 'instagram_reels',
  aspect_ratio: '9:16',
  creative_direction: 'A calm, bright morning.',
  video_style: 'clean_commercial',
  scenes: [1, 2].map((n) => ({
    scene_number: n,
    duration_seconds: 5,
    shot_type: 'medium',
    motion: 'slow push in',
    video_prompt: `Scene ${n}`,
    reference_image_index: 0,
    text_overlay: null,
    dialogue: null,
  })),
};

const ok = (responseData: object) => ({
  json: { status: true, responseCode: 200, responseMessage: 'ok', responseData },
});

async function setup(page: Page) {
  const saved: unknown[] = [];
  await page.addInitScript(
    (session) => {
      localStorage.setItem('@URI@AUTHENTICATED', 'true');
      localStorage.setItem('@URI@USER_TOKENS', JSON.stringify({ accessToken: 'test', refreshToken: 'test' }));
      localStorage.setItem(
        '@URI@USER_DETAILS',
        JSON.stringify({ userId: 'u_test', email: 'test@uri', firstName: 'Test' })
      );
      localStorage.setItem('@URI@ACTIVE_BRAND_ID', 'brnd_personal_u_test');
      localStorage.setItem('uri:dvg:session', JSON.stringify(session));
    },
    {
      storyboard: STORYBOARD,
      platform: 'instagram_reels',
      duration: 10,
      selectedOutcome: 'quick_video',
      selectedVoice: 'Sarah',
      storyboardJobId: null,
      frameJobId: null,
      frameMap: { 1: 'https://fake-cdn.test/f1.png', 2: 'https://fake-cdn.test/f2.png' },
      videoJob: {
        job_id: 'J1',
        status: 'complete',
        outcome: 'quick_video',
        model: 'm',
        total_scenes: 2,
        current_scene: 2,
        error: null,
        clips: [1, 2].map((n) => ({
          scene_number: n,
          duration_seconds: 5,
          shot_type: 'medium',
          motion: 'x',
          text_overlay: null,
          video_prompt: 'x',
          video_url: `https://fake-cdn.test/c${n}.mp4`,
          cost_usd: 0.2,
          routed_model: 'minimax/h3-max-turbo/image-to-video',
          fallback_used: false,
        })),
      },
      mergedUrl: 'https://fake-cdn.test/merged.mp4',
      draftCaption: 'A caption',
    }
  );
  await page.route('**/connections', (r) =>
    r.fulfill(ok({ connections: {}, connected_platforms: [], total_connections: 0 }))
  );
  await page.route('**/video-drafts**', (r) => {
    if (r.request().method() === 'POST') {
      saved.push(r.request().postDataJSON());
      return r.fulfill(
        ok({ id: 'vd_1', media_type: 'video', video_url: 'https://fake-cdn.test/merged.mp4', status: 'draft' })
      );
    }
    return r.fulfill(ok([]));
  });
  await page.route('**/storyboard-quote', (r) => r.fulfill(ok({ billing: 'off' })));
  await page.route('**/video-quote', (r) => r.fulfill(ok({ billing: 'off' })));
  await page.goto('/workspace/');
  await page.getByText('Content Studio', { exact: true }).click();
  await page
    .locator('button', { hasText: /🎬\s*Video/ })
    .first()
    .click();
  await page
    .getByRole('button', { name: /🎬 Generate Videos$/ })
    .first()
    .click();
  return { saved };
}

test.describe('Saving a finished video', () => {
  test('the message points to the Drafts tab and not to the Upload Images tab', async ({ page }) => {
    const { saved } = await setup(page);
    await page.getByRole('button', { name: 'Save Draft' }).click();
    await expect(page.getByText('Draft saved successfully')).toBeVisible();
    await expect(page.getByText('Find it in the Drafts tab', { exact: false })).toBeVisible();
    await expect(page.getByText('Upload Images')).toHaveCount(0);
    expect(saved).toHaveLength(1);
  });

  test('"Go to Drafts" opens the Drafts tab', async ({ page }) => {
    await setup(page);
    await page.getByRole('button', { name: 'Save Draft' }).click();
    await page.getByRole('button', { name: 'Go to Drafts' }).click();
    await expect(page.getByText('Draft saved successfully')).toHaveCount(0);
    await expect(page.getByText("What's the video about?")).toHaveCount(0);
    // The Video tab (and its Generate Videos / Edit Videos switcher) is no longer showing.
    await expect(page.getByRole('button', { name: /🎬 Generate Videos$/ })).toHaveCount(0);
  });
});
