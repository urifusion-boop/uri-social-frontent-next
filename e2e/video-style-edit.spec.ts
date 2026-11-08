/**
 * Describe It: the style the AI picked can be changed while editing the creative direction.
 *  - the chip is a plain label until "Edit" is clicked, then a list of the video styles;
 *  - picking another style and regenerating sends that style with the edited direction;
 *  - regenerating without touching the list keeps the style the AI chose;
 *  - Cancel leaves the style as it was.
 *
 * Local dev server, auth faked, every backend call mocked.
 */
import { test, expect, Page, Request } from '@playwright/test';

const BRIEF = 'A short video showing a business owner who never has time to post';

const STORYBOARD = {
  total_duration_seconds: 10,
  target_platform: 'instagram_reels',
  aspect_ratio: '9:16',
  creative_direction: 'A calm, bright morning for a Lagos seller.',
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
  const sent: Request[] = [];
  await page.addInitScript(() => {
    localStorage.setItem('@URI@AUTHENTICATED', 'true');
    localStorage.setItem('@URI@USER_TOKENS', JSON.stringify({ accessToken: 'test', refreshToken: 'test' }));
    localStorage.setItem(
      '@URI@USER_DETAILS',
      JSON.stringify({ userId: 'u_test', email: 'test@uri', firstName: 'Test' })
    );
    localStorage.setItem('@URI@ACTIVE_BRAND_ID', 'brnd_personal_u_test');
  });
  await page.route('**/video-drafts**', (r) => r.fulfill(ok([])));
  await page.route('**/connections', (r) =>
    r.fulfill(ok({ connections: {}, connected_platforms: [], total_connections: 0 }))
  );
  await page.route('**/generate-creative-frames', (r) =>
    r.fulfill(ok({ job_id: 'F1', status: 'generating', total_scenes: 2 }))
  );
  await page.route('**/storyboard-frame-job/**', (r) =>
    r.fulfill(ok({ job_id: 'F1', status: 'complete', total_scenes: 2, frames: [] }))
  );
  await page.route('**/storyboard-quote', (r) =>
    r.fulfill(ok({ billing: 'on', credits_required: 1, balance: 5, balance_after: 4, sufficient: true }))
  );
  await page.route('**/generate-creative-storyboard', (r) => {
    sent.push(r.request());
    return r.fulfill(
      ok({
        job_id: `S${sent.length}`,
        status: 'generating',
        billing: { mode: 'on', credits_charged: 1, credits_refunded: 0, status: 'charged' },
      })
    );
  });
  await page.route('**/creative-storyboard-job/**', (r) =>
    r.fulfill(
      ok({
        job_id: 'S1',
        status: 'complete',
        storyboard: STORYBOARD,
        error: null,
        billing: { mode: 'on', credits_charged: 1, credits_refunded: 0, status: 'settled' },
      })
    )
  );

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
  await page.getByPlaceholder(/A founder explains why they built this product/).fill(BRIEF);
  await page.getByRole('button', { name: 'Generate Storyboard · 1 credit' }).click();
  await expect(page.getByText('Style: Clean Commercial')).toBeVisible();
  return { sent };
}

const styleList = (page: Page) => page.getByRole('combobox', { name: 'Video style' });
const regenerate = (page: Page) => page.getByRole('button', { name: 'Regenerate with this direction · 1 credit' });

test.describe('Describe It: changing the style while editing the direction', () => {
  test('the style is a plain label until Edit is clicked', async ({ page }) => {
    await setup(page);
    await expect(styleList(page)).toHaveCount(0);
    await page.getByText('✎ Edit').click();
    await expect(styleList(page)).toHaveValue('clean_commercial');
  });

  test('regenerating with another style sends that style and the edited direction', async ({ page }) => {
    const { sent } = await setup(page);
    await page.getByText('✎ Edit').click();
    await styleList(page).selectOption('luxury_slow_burn');
    await regenerate(page).click();
    await expect.poll(() => sent.length).toBe(2);
    const body = sent[1].postDataJSON();
    expect(body.video_style).toBe('luxury_slow_burn');
    expect(body.creative_direction_override).toBe('A calm, bright morning for a Lagos seller.');
  });

  test('regenerating without touching the list keeps the style the AI chose', async ({ page }) => {
    const { sent } = await setup(page);
    await page.getByText('✎ Edit').click();
    await regenerate(page).click();
    await expect.poll(() => sent.length).toBe(2);
    expect(sent[1].postDataJSON().video_style).toBe('clean_commercial');
  });

  test('cancel leaves the style as it was', async ({ page }) => {
    const { sent } = await setup(page);
    await page.getByText('✎ Edit').click();
    await styleList(page).selectOption('luxury_slow_burn');
    await page.getByRole('button', { name: 'Cancel' }).click();
    await expect(page.getByText('Style: Clean Commercial')).toBeVisible();
    await page.getByText('✎ Edit').click();
    await expect(styleList(page)).toHaveValue('clean_commercial');
    expect(sent).toHaveLength(1);
  });
});
