/**
 * Paying for a generated video, on the Describe It screen:
 *  - with billing off nothing changes (no price, no confirmation);
 *  - with billing on the customer sees the price and balance before clicking, confirms it, and the request
 *    carries an Idempotency-Key;
 *  - not enough credits disables the button and offers a top-up; a refusal from the server is shown as written;
 *  - after the job, what was charged and what came back is shown in credits.
 *
 * Local dev server, auth faked, every backend call mocked. The storyboard is seeded through the screen's own
 * saved-session slot, so the test starts exactly where a customer is when they have a script and frames.
 */
import { test, expect, Page, Request } from '@playwright/test';

const STORYBOARD = {
  total_duration_seconds: 15,
  target_platform: 'tiktok',
  aspect_ratio: '9:16',
  creative_direction: 'A calm, bright morning for a Lagos seller.',
  video_style: 'clean_commercial',
  scenes: [1, 2, 3].map((n) => ({
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

const FRAMES = {
  1: 'https://fake-cdn.test/f1.png',
  2: 'https://fake-cdn.test/f2.png',
  3: 'https://fake-cdn.test/f3.png',
};

const CREDITS_BY_OUTCOME: Record<string, number> = { quick_video: 3, high_quality: 4 };

async function setup(
  page: Page,
  opts: {
    quote?: (body: { outcome: string }) => object;
    start?: (req: Request) => { status: number; json: object };
  } = {}
) {
  const started: Request[] = [];
  const quoted: { outcome: string }[] = [];

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
      platform: 'tiktok',
      duration: 15,
      selectedOutcome: 'quick_video',
      selectedVoice: 'Sarah',
      storyboardJobId: null,
      frameJobId: null,
      frameMap: FRAMES,
      videoJob: null,
      mergedUrl: '',
      draftCaption: '',
    }
  );

  await page.route('**/video-drafts**', (r) =>
    r.fulfill({ json: { status: true, responseCode: 200, responseMessage: 'ok', responseData: [] } })
  );
  await page.route('**/connections', (r) =>
    r.fulfill({
      json: {
        status: true,
        responseCode: 200,
        responseData: { connections: {}, connected_platforms: [], total_connections: 0 },
      },
    })
  );
  await page.route('**/video-quote', (r) => {
    const body = r.request().postDataJSON() as { outcome: string };
    quoted.push(body);
    const quote = opts.quote
      ? opts.quote(body)
      : {
          billing: 'on',
          credits_required: CREDITS_BY_OUTCOME[body.outcome] ?? 3,
          naira_reference: (CREDITS_BY_OUTCOME[body.outcome] ?? 3) * 800,
          balance: 10,
          balance_after: 10 - (CREDITS_BY_OUTCOME[body.outcome] ?? 3),
          sufficient: true,
        };
    return r.fulfill({ json: { status: true, responseCode: 200, responseData: quote } });
  });
  await page.route('**/generate-video-from-storyboard', (r) => {
    started.push(r.request());
    const reply = opts.start?.(r.request()) ?? {
      status: 200,
      json: {
        status: true,
        responseCode: 200,
        responseData: {
          job_id: 'J1',
          status: 'queued',
          total_scenes: 3,
          outcome: 'quick_video',
          model: 'm',
          current_scene: 0,
          clips: [],
          error: null,
        },
      },
    };
    return r.fulfill({ status: reply.status, json: reply.json });
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
  await expect(page.getByRole('button', { name: /^(Generate|Regenerate) Videos$/ })).toBeVisible({ timeout: 20000 });
  return { started, quoted };
}

const jobResponse = (billing: object | null, withCost = true) => ({
  status: 200,
  json: {
    status: true,
    responseCode: 200,
    responseData: {
      job_id: 'J1',
      status: 'complete',
      outcome: 'quick_video',
      model: 'm',
      total_scenes: 3,
      current_scene: 3,
      error: null,
      ...(billing ? { billing } : {}),
      clips: [1, 2, 3].map((n) => ({
        scene_number: n,
        duration_seconds: 5,
        shot_type: 'medium',
        motion: 'x',
        text_overlay: null,
        video_prompt: 'x',
        video_url: n === 3 && billing ? null : `https://fake-cdn.test/c${n}.mp4`,
        cost_usd: withCost ? 0.2 : null,
        routed_model: 'minimax/h3-max-turbo/image-to-video',
        fallback_used: false,
      })),
    },
  },
});

test.describe('Describe It: paying for a video', () => {
  test('with billing off there is no price and no confirmation', async ({ page }) => {
    const { started } = await setup(page, { quote: () => ({ billing: 'off' }) });
    await expect(page.getByTestId('video-price')).toHaveCount(0);
    const button = page.getByRole('button', { name: 'Generate Videos', exact: true });
    await expect(button).toBeVisible();
    await button.click();
    await expect(page.getByText('Generate this video?')).toHaveCount(0);
    await expect.poll(() => started.length).toBe(1);
  });

  test('with billing on the price and balance show before the click', async ({ page }) => {
    await setup(page);
    const price = page.getByTestId('video-price');
    await expect(price).toContainText('3 credits');
    await expect(price).toContainText('₦2,400');
    await expect(price).toContainText('Your balance: 10 → 7');
    await expect(page.getByRole('button', { name: 'Generate Videos · 3 credits' })).toBeEnabled();
  });

  test('the price follows the video type', async ({ page }) => {
    const { quoted } = await setup(page);
    await page.getByRole('button', { name: /High Quality/ }).click();
    await expect(page.getByTestId('video-price')).toContainText('4 credits');
    await expect(page.getByRole('button', { name: 'Generate Videos · 4 credits' })).toBeVisible();
    expect(quoted.map((q) => q.outcome)).toContain('high_quality');
  });

  test('the customer confirms the price, and the request carries an idempotency key', async ({ page }) => {
    const { started } = await setup(page);
    await page.getByRole('button', { name: 'Generate Videos · 3 credits' }).click();
    await expect(page.getByText('Generate this video?')).toBeVisible();
    await expect(page.getByText(/This will use 3 credits, leaving you 7/)).toBeVisible();
    expect(started.length).toBe(0); // nothing is sent until they agree

    await page.getByRole('button', { name: 'Not yet' }).click();
    expect(started.length).toBe(0);

    await page.getByRole('button', { name: 'Generate Videos · 3 credits' }).click();
    await page.getByRole('button', { name: 'Generate', exact: true }).click();
    await expect.poll(() => started.length).toBe(1);
    const key = started[0].headers()['idempotency-key'];
    expect(key).toBeTruthy();
    expect(key.length).toBeGreaterThan(8);
    expect((started[0].postDataJSON() as { outcome: string }).outcome).toBe('quick_video');
  });

  test('not enough credits disables the button and offers a top-up', async ({ page }) => {
    await setup(page, {
      quote: () => ({
        billing: 'on',
        credits_required: 3,
        naira_reference: 2400,
        balance: 1,
        balance_after: 0,
        sufficient: false,
      }),
    });
    await expect(page.getByText("You don't have enough credits for this video.")).toBeVisible();
    await expect(page.getByRole('button', { name: 'Generate Videos · 3 credits' })).toBeDisabled();
    await expect(page.getByRole('button', { name: 'Top up credits' })).toBeVisible();
  });

  test('a refusal from the server is shown as the server wrote it, with a top-up', async ({ page }) => {
    await setup(page, {
      start: () => ({
        status: 402,
        json: {
          status: false,
          responseCode: 402,
          responseMessage: 'This video needs 3 credits, but you have 2. Top up to continue.',
          responseData: { credits_required: 3, credits_remaining: 2, upgrade_url: '/pricing' },
        },
      }),
    });
    await page.getByRole('button', { name: 'Generate Videos · 3 credits' }).click();
    await page.getByRole('button', { name: 'Generate', exact: true }).click();
    await expect(page.getByText('This video needs 3 credits, but you have 2. Top up to continue.')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Top up credits' }).first()).toBeVisible();
    await expect(page.getByText('Something went wrong starting video generation.')).toHaveCount(0);
  });

  test('a video that cannot be priced shows the reason, not a generic failure', async ({ page }) => {
    await setup(page, {
      start: () => ({ status: 400, json: { detail: 'Videos can be at most 60 seconds.' } }),
    });
    await page.getByRole('button', { name: 'Generate Videos · 3 credits' }).click();
    await page.getByRole('button', { name: 'Generate', exact: true }).click();
    await expect(page.getByText('Videos can be at most 60 seconds.')).toBeVisible();
  });

  test('after the job it says what was used and what came back, in credits', async ({ page }) => {
    await setup(page, {
      start: () => jobResponse({ mode: 'on', status: 'settled', credits_charged: 3, credits_refunded: 1 }),
    });
    await page.getByRole('button', { name: 'Generate Videos · 3 credits' }).click();
    await page.getByRole('button', { name: 'Generate', exact: true }).click();
    const result = page.getByTestId('video-billing-result');
    await expect(result).toContainText('2 credits used');
    await expect(result).toContainText("1 credit returned for scenes we couldn't deliver");
    // The internal dollar cost and model names are not for customers who are being charged.
    await expect(page.getByText(/Routed to:/)).toHaveCount(0);
    await expect(page.getByText(/~\$/)).toHaveCount(0);
  });

  test('a refund we could not pay says so', async ({ page }) => {
    await setup(page, {
      start: () => jobResponse({ mode: 'on', status: 'refund_failed', credits_charged: 3, credits_refunded: 0 }),
    });
    await page.getByRole('button', { name: 'Generate Videos · 3 credits' }).click();
    await page.getByRole('button', { name: 'Generate', exact: true }).click();
    await expect(page.getByText("We couldn't return your credits automatically.")).toBeVisible();
  });

  test('with billing off the internal cost readout is unchanged', async ({ page }) => {
    await setup(page, { quote: () => ({ billing: 'off' }), start: () => jobResponse(null) });
    await page.getByRole('button', { name: 'Generate Videos', exact: true }).click();
    await expect(page.getByText(/~\$0\.600/)).toBeVisible();
    await expect(page.getByTestId('video-billing-result')).toHaveCount(0);
  });
});
