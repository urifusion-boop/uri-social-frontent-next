/**
 * Paying for a storyboard, on the Describe It screen: every run costs credits.
 *  - with billing off nothing changes (no price on the button);
 *  - with billing on the button shows the price, a click sends an Idempotency-Key, and the result says what was used;
 *  - not enough credits disables the button; a refusal from the server is shown as written, with a top-up;
 *  - a run that fails says the credit was returned;
 *  - rewriting from an edited creative direction is charged like any other run, with its own key.
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

async function setup(
  page: Page,
  opts: {
    quote?: object;
    start?: (n: number) => { status: number; json: object };
    job?: object;
  } = {}
) {
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
    r.fulfill(ok(opts.quote ?? { billing: 'on', credits_required: 1, balance: 5, balance_after: 4, sufficient: true }))
  );
  await page.route('**/generate-creative-storyboard', (r) => {
    sent.push(r.request());
    const reply = opts.start?.(sent.length) ?? {
      status: 200,
      json: {
        status: true,
        responseCode: 200,
        responseData: {
          job_id: `S${sent.length}`,
          status: 'generating',
          billing: { mode: 'on', credits_charged: 1, credits_refunded: 0, status: 'charged' },
        },
      },
    };
    return r.fulfill({ status: reply.status, json: reply.json });
  });
  await page.route('**/creative-storyboard-job/**', (r) =>
    r.fulfill(
      ok(
        opts.job ?? {
          job_id: 'S1',
          status: 'complete',
          storyboard: STORYBOARD,
          error: null,
          billing: { mode: 'on', credits_charged: 1, credits_refunded: 0, status: 'settled' },
        }
      )
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
  return { sent };
}

const storyboardButton = (page: Page) =>
  page.getByRole('button', { name: /^(Generate Storyboard|Not enough credits)/ });

test.describe('Describe It: paying for a storyboard', () => {
  test('with billing off there is no price on the button', async ({ page }) => {
    await setup(page, { quote: { billing: 'off' } });
    await expect(page.getByRole('button', { name: 'Generate Storyboard', exact: true })).toBeEnabled();
  });

  test('with billing on the button shows the price', async ({ page }) => {
    await setup(page);
    await expect(page.getByRole('button', { name: 'Generate Storyboard · 1 credit' })).toBeEnabled();
  });

  test('a click sends an Idempotency-Key and afterwards says what was used', async ({ page }) => {
    const { sent } = await setup(page);
    await page.getByRole('button', { name: 'Generate Storyboard · 1 credit' }).click();
    await expect(page.getByTestId('storyboard-billing-result')).toHaveText('1 credit used for this storyboard');
    expect(sent).toHaveLength(1);
    expect(sent[0].headers()['idempotency-key']).toMatch(/.{8,}/);
  });

  test('not enough credits disables the button', async ({ page }) => {
    const { sent } = await setup(page, {
      quote: { billing: 'on', credits_required: 1, balance: 0, balance_after: 0, sufficient: false },
    });
    const button = page.getByRole('button', { name: 'Not enough credits (needs 1)' });
    await expect(button).toBeDisabled();
    expect(sent).toHaveLength(0);
  });

  test('a refusal from the server is shown as written, with a top-up', async ({ page }) => {
    await setup(page, {
      start: () => ({
        status: 402,
        json: {
          status: false,
          responseCode: 402,
          responseMessage: 'This storyboard needs 1 credit, but you have 0. Top up to continue.',
          responseData: { credits_required: 1, credits_remaining: 0, upgrade_url: '/pricing' },
        },
      }),
    });
    await page.getByRole('button', { name: 'Generate Storyboard · 1 credit' }).click();
    await expect(page.getByText('This storyboard needs 1 credit, but you have 0. Top up to continue.')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Top up credits' })).toBeVisible();
  });

  test('a run that fails says the credit was returned', async ({ page }) => {
    await setup(page, {
      job: {
        job_id: 'S1',
        status: 'failed',
        storyboard: null,
        error: 'Failed to generate creative storyboard.',
        billing: { mode: 'on', credits_charged: 1, credits_refunded: 1, status: 'settled' },
      },
    });
    await page.getByRole('button', { name: 'Generate Storyboard · 1 credit' }).click();
    await expect(page.getByText('Failed to generate creative storyboard. Your credit was returned.')).toBeVisible();
  });

  test('rewriting from an edited direction is charged too, with its own key', async ({ page }) => {
    const { sent } = await setup(page);
    await page.getByRole('button', { name: 'Generate Storyboard · 1 credit' }).click();
    await expect(page.getByTestId('storyboard-billing-result')).toBeVisible();
    await page.getByText('✎ Edit').click();
    const regenerate = page.getByRole('button', { name: 'Regenerate with this direction · 1 credit' });
    await expect(regenerate).toBeVisible();
    await regenerate.click();
    await expect.poll(() => sent.length).toBe(2);
    expect(sent[1].headers()['idempotency-key']).not.toEqual(sent[0].headers()['idempotency-key']);
  });
});
