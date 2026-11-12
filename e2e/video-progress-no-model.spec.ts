/**
 * While a video is generating the customer sees progress (queued / processing, elapsed time) but never the
 * name of the model or the provider behind it.
 *
 * Local dev server, auth faked, every backend call mocked. The running job is seeded through the screen's own
 * saved-session slot and the job poll keeps answering with the same live status.
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

function runningJob(scene: object) {
  return {
    job_id: 'J1',
    status: 'generating',
    outcome: 'quick_video',
    model: 'fal-ai/kling-video/v2.5-turbo/standard/image-to-video',
    total_scenes: 2,
    current_scene: 1,
    error: null,
    clips: [],
    current_scene_status: scene,
  };
}

async function setup(page: Page, scene: object) {
  const job = runningJob(scene);
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
      videoJob: job,
      mergedUrl: null,
      draftCaption: '',
    }
  );
  await page.route('**/connections', (r) =>
    r.fulfill(ok({ connections: {}, connected_platforms: [], total_connections: 0 }))
  );
  await page.route('**/video-drafts**', (r) => r.fulfill(ok([])));
  await page.route('**/storyboard-quote', (r) => r.fulfill(ok({ billing: 'off' })));
  await page.route('**/video-quote', (r) => r.fulfill(ok({ billing: 'off' })));
  await page.route('**/video-job/**', (r) => r.fulfill(ok(job)));
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
}

test.describe('Progress while a video generates', () => {
  test('shows the state and elapsed time, never the model or provider', async ({ page }) => {
    await setup(page, {
      scene_number: 1,
      model_label: 'Kling 2.5 Standard',
      state: 'InProgress',
      elapsed_seconds: 42,
    });
    await expect(page.getByText('Generating Scene 1 of 2')).toBeVisible();
    await expect(page.getByText('Processing · 42s elapsed')).toBeVisible();
    const body = page.locator('body');
    await expect(body).not.toContainText(/fal\.?ai/i);
    await expect(body).not.toContainText('Kling');
    await expect(body).not.toContainText('image-to-video');
  });

  test('a queued scene shows its place in the queue without a model name', async ({ page }) => {
    await setup(page, {
      scene_number: 1,
      model_label: 'Kling 2.5 Standard',
      state: 'Queued',
      position: 3,
      elapsed_seconds: 5,
    });
    await expect(page.getByText('In queue (position 3) · 5s elapsed')).toBeVisible();
    await expect(page.locator('body')).not.toContainText('Kling');
  });

  test('the talking-video wait hint still appears', async ({ page }) => {
    await setup(page, {
      scene_number: 1,
      model_label: 'Talking Avatar',
      state: 'InProgress',
      elapsed_seconds: 90,
    });
    await expect(page.getByText('this model can take several minutes')).toBeVisible();
    await expect(page.locator('body')).not.toContainText('Talking Avatar:');
  });
});
