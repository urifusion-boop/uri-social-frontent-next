/**
 * The video type preselected after the script is written:
 *  - it is the one the script writer picked for this creative direction, with its reason;
 *  - spoken dialogue always means Talking / Dialogue;
 *  - an older script with no pick falls back to the style's own choice (Before / After is no longer
 *    Advanced References, which is the most expensive type);
 *  - the customer can still pick another type, and the suggestion banner keeps naming what was suggested.
 *
 * Local dev server, auth faked, every backend call mocked. The price request shows which type is selected.
 */
import { test, expect, Page } from '@playwright/test';

const BRIEF = 'A short video showing a business owner who never has time to post';

const scene = (n: number, dialogue: string | null = null) => ({
  scene_number: n,
  duration_seconds: 5,
  shot_type: 'medium',
  motion: 'slow push in',
  video_prompt: `Scene ${n}`,
  reference_image_index: 0,
  text_overlay: null,
  dialogue,
});

const board = (extra: object = {}, dialogue: string | null = null) => ({
  total_duration_seconds: 10,
  target_platform: 'instagram_reels',
  aspect_ratio: '9:16',
  creative_direction: 'A calm, bright morning for a Lagos seller.',
  video_style: 'before_after',
  scenes: [scene(1, dialogue), scene(2)],
  ...extra,
});

const ok = (responseData: object) => ({
  json: { status: true, responseCode: 200, responseMessage: 'ok', responseData },
});

async function setup(page: Page, storyboard: object) {
  const quoted: string[] = [];
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
  await page.route('**/storyboard-quote', (r) => r.fulfill(ok({ billing: 'off' })));
  await page.route('**/generate-creative-frames', (r) =>
    r.fulfill(ok({ job_id: 'F1', status: 'generating', total_scenes: 2 }))
  );
  await page.route('**/storyboard-frame-job/**', (r) =>
    r.fulfill(
      ok({
        job_id: 'F1',
        status: 'complete',
        total_scenes: 2,
        frames: [1, 2].map((n) => ({ scene_number: n, frame_image_url: `https://fake-cdn.test/f${n}.png` })),
      })
    )
  );
  await page.route('**/generate-creative-storyboard', (r) => r.fulfill(ok({ job_id: 'S1', status: 'generating' })));
  await page.route('**/creative-storyboard-job/**', (r) =>
    r.fulfill(ok({ job_id: 'S1', status: 'complete', storyboard, error: null }))
  );
  await page.route('**/video-quote', (r) => {
    quoted.push((r.request().postDataJSON() as { outcome: string }).outcome);
    return r.fulfill(ok({ billing: 'off' }));
  });

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
  await page.getByRole('button', { name: 'Generate Storyboard' }).click();
  await expect(page.getByTestId('outcome-suggestion')).toBeVisible({ timeout: 20000 });
  return { quoted };
}

const lastQuote = (quoted: string[]) => quoted[quoted.length - 1];

test.describe('Describe It: the preselected video type', () => {
  test('it is the type the script writer picked, with its reason', async ({ page }) => {
    const { quoted } = await setup(
      page,
      board({ suggested_outcome: 'quick_video', outcome_reason: 'Simple lifestyle scenes need nothing fancier.' })
    );
    await expect(page.getByTestId('outcome-suggestion')).toHaveText('✦ Suggested: Quick Video');
    await expect(page.getByText('Simple lifestyle scenes need nothing fancier.')).toBeVisible();
    await expect.poll(() => lastQuote(quoted)).toBe('quick_video');
  });

  test('a Before / After script is not sent to Advanced References any more', async ({ page }) => {
    const { quoted } = await setup(page, board()); // no pick from the writer: the style fallback applies
    await expect(page.getByTestId('outcome-suggestion')).toHaveText('✦ Suggested: High Quality');
    await expect.poll(() => lastQuote(quoted)).toBe('high_quality');
    expect(quoted).not.toContain('advanced_references');
  });

  test('spoken dialogue always means Talking / Dialogue', async ({ page }) => {
    const { quoted } = await setup(page, board({ suggested_outcome: 'quick_video' }, 'Jane has got this'));
    await expect(page.getByTestId('outcome-suggestion')).toHaveText('✦ Suggested: Talking / Dialogue');
    await expect.poll(() => lastQuote(quoted)).toBe('talking_dialogue');
  });

  test('the customer can pick another type, and the banner still names what was suggested', async ({ page }) => {
    const { quoted } = await setup(
      page,
      board({ suggested_outcome: 'quick_video', outcome_reason: 'Keep it simple.' })
    );
    const complex = page.getByRole('button', { name: /^Complex \/ Cinematic/ });
    // The types unlock once the scene images are ready.
    await expect(complex).not.toHaveAttribute('title', /Waiting for storyboard frames/, { timeout: 15000 });
    await complex.click();
    await expect.poll(() => lastQuote(quoted)).toBe('complex_cinematic');
    await expect(page.getByTestId('outcome-suggestion')).toHaveText('✦ Suggested: Quick Video');
    await expect(page.getByText('You can pick a different type below.')).toBeVisible();
  });
});
