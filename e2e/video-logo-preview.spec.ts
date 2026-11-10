/**
 * The owner's logo from the Brand Playbook is always on the finished video (the server stamps it on when the clips
 * are merged). The storyboard cards preview it, in the corner and size the playbook says, so the owner sees it
 * before paying for clips. No logo in the playbook (or an unreadable playbook) shows nothing.
 *
 * Local dev server, auth faked, every backend call mocked.
 */
import { test, expect, Page } from '@playwright/test';

const scene = (n: number) => ({
  scene_number: n,
  duration_seconds: 5,
  shot_type: 'medium',
  motion: 'slow push in',
  video_prompt: `Scene ${n}`,
  reference_image_index: 0,
  text_overlay: null,
  dialogue: null,
});

const storyboard = {
  total_duration_seconds: 10,
  target_platform: 'instagram_reels',
  aspect_ratio: '9:16',
  creative_direction: 'A calm, bright morning.',
  video_style: 'before_after',
  scenes: [scene(1), scene(2)],
};

const ok = (responseData: unknown) => ({
  json: { status: true, responseCode: 200, responseMessage: 'ok', responseData },
});

async function open(page: Page, profile: object | 'broken') {
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
  await page.route('**/video-quote', (r) => r.fulfill(ok({ billing: 'off' })));
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
  await page.route('**/social-media/brand-profile', (r) =>
    profile === 'broken'
      ? r.fulfill({ status: 500, body: 'boom' })
      : r.fulfill(ok({ onboarding_completed: true, ...profile }))
  );
  await page.route('https://fake-cdn.test/**', (r) =>
    r.fulfill({
      status: 200,
      contentType: 'image/svg+xml',
      body: '<svg xmlns="http://www.w3.org/2000/svg" width="10" height="10"/>',
    })
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
  await page.getByPlaceholder(/A founder explains why they built this product/).fill('A short product video');
  await page.getByRole('button', { name: 'Generate Storyboard' }).click();
  await expect(page.getByText('1. medium')).toBeVisible({ timeout: 20000 });
}

test.describe('Describe It: the brand logo on the storyboard', () => {
  test('a playbook with a logo shows it on every scene in the chosen corner and size', async ({ page }) => {
    await open(page, {
      logo_url: 'https://fake-cdn.test/logo.png',
      logo_position: 'top_left',
      logo_size: 'large',
    });
    const logos = page.getByTestId('scene-logo');
    await expect(logos).toHaveCount(2);
    await expect(logos.first()).toHaveAttribute('src', 'https://fake-cdn.test/logo.png');
    const style = await logos.first().evaluate((el) => {
      const s = (el as HTMLElement).style;
      return { width: s.width, left: s.left, top: s.top };
    });
    expect(style).toEqual({ width: '20%', left: '5%', top: '8%' });
    await expect(page.getByTestId('logo-note')).toBeVisible();
  });

  test('a logo with no position or size set is small and bottom-right', async ({ page }) => {
    await open(page, { logo_url: 'https://fake-cdn.test/logo.png' });
    const style = await page
      .getByTestId('scene-logo')
      .first()
      .evaluate((el) => {
        const s = (el as HTMLElement).style;
        return { width: s.width, right: s.right, bottom: s.bottom };
      });
    expect(style).toEqual({ width: '12%', right: '5%', bottom: '9%' });
  });

  test('no logo in the playbook shows nothing', async ({ page }) => {
    await open(page, { brand_name: 'No logo yet' });
    await expect(page.getByTestId('scene-logo')).toHaveCount(0);
    await expect(page.getByTestId('logo-note')).toHaveCount(0);
  });

  test('an unreadable playbook shows nothing and the storyboard still works', async ({ page }) => {
    await open(page, 'broken');
    await expect(page.getByTestId('scene-logo')).toHaveCount(0);
    await expect(page.getByText('2. medium')).toBeVisible();
  });
});
