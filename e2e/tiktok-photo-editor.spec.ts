/**
 * Posting a TikTok photo from the draft editor (Content Library / wizard).
 *
 * TikTok requires its own "Post to TikTok" screen before a photo goes out (privacy, comments, disclosure,
 * consent). The editor's Publish Now used to call the quick approve endpoint instead, which refuses a TikTok
 * draft without a video ("TikTok post has no video_url"). These specs pin the fix and what must not change.
 *
 * Local dev server, auth faked, every backend call mocked:
 *
 *     npm run dev
 *     npx playwright test e2e/tiktok-photo-editor.spec.ts --project=chromium
 */
import { test, expect, Page } from '@playwright/test';

const ok = (responseData: object) => ({
  json: { status: true, responseCode: 200, responseMessage: 'ok', responseData },
});

const PHOTO = {
  id: 'd_photo',
  draft_id: 'd_photo',
  platform: 'tiktok',
  content: 'Banana bread fresh from the oven',
  hashtags: ['bananabread'],
  image_url: 'https://fake-cdn.test/photo.png',
  status: 'draft',
  created_at: '2026-11-01T10:00:00Z',
};
const VIDEO = {
  ...PHOTO,
  id: 'd_video',
  draft_id: 'd_video',
  content: 'Behind the scenes reel',
  video_url: 'https://fake-cdn.test/v.mp4',
};
const INSTAGRAM = { ...PHOTO, id: 'd_ig', draft_id: 'd_ig', platform: 'instagram', content: 'Instagram caption here' };

type Calls = { approve: unknown[]; photo: unknown[] };

async function setup(page: Page, drafts: object[]): Promise<Calls> {
  const calls: Calls = { approve: [], photo: [] };
  await page.addInitScript(() => {
    localStorage.setItem('@URI@AUTHENTICATED', 'true');
    localStorage.setItem('@URI@USER_TOKENS', JSON.stringify({ accessToken: 'test', refreshToken: 'test' }));
    localStorage.setItem(
      '@URI@USER_DETAILS',
      JSON.stringify({ userId: 'u_test', email: 'test@uri', firstName: 'Test' })
    );
    localStorage.setItem('@URI@ACTIVE_BRAND_ID', 'brnd_personal_u_test');
  });
  await page.route(/\/social-media\//, async (route) => {
    // The app's own pages live under /social-media/ too: only API calls are answered here.
    if (!['fetch', 'xhr'].includes(route.request().resourceType())) return route.continue();
    const path = new URL(route.request().url()).pathname;
    const method = route.request().method();
    if (path.includes('brand-profile')) return route.fulfill(ok({ brand_name: 'E2E', onboarding_completed: true }));
    if (path.endsWith('/content-calendar')) return route.fulfill(ok({ drafts }));
    if (path.endsWith('/scheduled')) return route.fulfill(ok({ scheduled_drafts: [] }));
    if (path.endsWith('/connections/tiktok/creator-info')) {
      return route.fulfill(
        ok({
          creator_nickname: 'Test Creator',
          creator_username: 'testcreator',
          creator_avatar_url: '',
          privacy_level_options: ['SELF_ONLY', 'PUBLIC_TO_EVERYONE'],
          comment_disabled: false,
          duet_disabled: false,
          stitch_disabled: false,
          max_video_post_duration_sec: null,
        })
      );
    }
    if (path.endsWith('/connections')) {
      return route.fulfill(ok({ connections: {}, connected_platforms: ['tiktok', 'instagram'], total_connections: 2 }));
    }
    if (path.endsWith('/approve') && method === 'POST') {
      calls.approve.push(route.request().postDataJSON());
      return route.fulfill(ok({ approved_drafts: [{ draft_id: 'x' }], errors: [] }));
    }
    if (path.endsWith('/publish-tiktok-photo-draft') && method === 'POST') {
      calls.photo.push(route.request().postDataJSON());
      return route.fulfill(ok({ job_id: 'job_1' }));
    }
    if (path.includes('/video-publish-job/')) {
      return route.fulfill(
        ok({
          job_id: 'job_1',
          draft_id: 'd_photo',
          platform: 'tiktok',
          status: 'published',
          platform_post_id: 'p1',
          post_url: null,
          error: null,
        })
      );
    }
    // An un-stubbed call 401s against a fake session and logs the app out.
    return route.fulfill({ json: { status: true, responseCode: 200, responseMessage: 'ok', responseData: {} } });
  });
  await page.goto('/workspace/');
  await page.getByText('Content Studio', { exact: true }).click();
  await page.getByRole('button', { name: 'Content Library' }).click();
  return calls;
}

/** Library row -> detail view -> the editor, the way a person gets there. */
async function openEditorViaDetail(page: Page, title: string) {
  await page.getByText(title, { exact: false }).first().click();
  await page.getByRole('button', { name: 'Edit', exact: true }).click();
  await expect(page.getByRole('button', { name: /^Post/ })).toBeVisible();
}

async function publishNow(page: Page) {
  await page.getByRole('button', { name: /^Post/ }).click();
  await page.getByRole('menuitem', { name: 'Publish Now' }).click();
}

test.describe('Posting a TikTok photo from the editor', () => {
  test('Publish Now opens the Post to TikTok screen and does not call approve', async ({ page }) => {
    const calls = await setup(page, [PHOTO]);
    await openEditorViaDetail(page, 'Banana bread');
    await publishNow(page);

    await expect(page.getByRole('dialog', { name: 'Post to TikTok' })).toBeVisible();
    expect(calls.approve).toEqual([]);
    expect(calls.photo).toEqual([]); // nothing is sent until the person confirms
  });

  test('the screen can be typed in, and cancelling returns to the editor with its edits intact', async ({ page }) => {
    await setup(page, [PHOTO]);
    await openEditorViaDetail(page, 'Banana bread');
    await page.getByRole('textbox').first().fill('Caption typed in the editor');
    await publishNow(page);

    const screen = page.getByRole('dialog', { name: 'Post to TikTok' });
    await expect(screen).toBeVisible();
    // Real typing needs the keyboard focus. The editor's own dialog would take it back.
    const title = screen.locator('textarea').first();
    await title.click();
    await page.keyboard.press('End');
    await page.keyboard.type(' plus words typed on the TikTok screen');
    await expect(title).toHaveValue(/plus words typed on the TikTok screen/);

    await screen.getByRole('button', { name: 'Cancel' }).click();
    await expect(screen).toHaveCount(0);
    await expect(page.getByRole('textbox').first()).toHaveValue('Caption typed in the editor');
    await expect(page.getByRole('button', { name: /^Post/ })).toBeVisible();
  });

  test('confirming sends the chosen settings to the photo post endpoint', async ({ page }) => {
    const calls = await setup(page, [PHOTO]);
    await openEditorViaDetail(page, 'Banana bread');
    await publishNow(page);

    const screen = page.getByRole('dialog', { name: 'Post to TikTok' });
    await screen.locator('select').selectOption('SELF_ONLY');
    await screen.getByRole('button', { name: 'Post', exact: true }).click();

    await expect.poll(() => calls.photo.length).toBe(1);
    const sent = calls.photo[0] as { draft_id: string; tiktok: Record<string, unknown> };
    expect(sent.draft_id).toBe('d_photo');
    expect(sent.tiktok.privacy_level).toBe('SELF_ONLY');
    expect(String(sent.tiktok.title)).toContain('Banana bread');
    expect(calls.approve).toEqual([]);
  });

  test('pressing Post before choosing who can view says what is needed and sends nothing', async ({ page }) => {
    const calls = await setup(page, [PHOTO]);
    await openEditorViaDetail(page, 'Banana bread');
    await publishNow(page);

    const screen = page.getByRole('dialog', { name: 'Post to TikTok' });
    await expect(screen.getByText('Pick who can view this post to continue')).toBeVisible();
    await screen.getByRole('button', { name: 'Post', exact: true }).click();

    await expect(screen.getByText('Choose who can view this post before you post.')).toBeVisible();
    expect(calls.photo).toEqual([]);

    await screen.locator('select').selectOption('SELF_ONLY');
    await expect(screen.getByText('Choose who can view this post before you post.')).toHaveCount(0);
    await expect(screen.getByText('Only me · interactions off')).toBeVisible();
  });

  test('nothing is pre-selected, and each option says what it means', async ({ page }) => {
    await setup(page, [PHOTO]);
    await openEditorViaDetail(page, 'Banana bread');
    await publishNow(page);

    const select = page.getByRole('dialog', { name: 'Post to TikTok' }).locator('select');
    await expect(select).toHaveValue(''); // TikTok: no default, the user must choose
    // TikTok returned Only me first; the screen lists the widest reach first.
    const options = await select.locator('option:not([disabled])').allTextContents();
    expect(options).toEqual(['Everyone — anyone on TikTok can see it', 'Only me — only you can see it']);
  });

  test('the Post button stays in view on a short screen', async ({ page }) => {
    await page.setViewportSize({ width: 1000, height: 560 });
    await setup(page, [PHOTO]);
    await openEditorViaDetail(page, 'Banana bread');
    await publishNow(page);

    const screen = page.getByRole('dialog', { name: 'Post to TikTok' });
    await expect(screen.getByRole('button', { name: 'Post', exact: true })).toBeInViewport();
  });

  test('a TikTok draft with a video still publishes through approve', async ({ page }) => {
    const calls = await setup(page, [VIDEO]);
    await openEditorViaDetail(page, 'Behind the scenes');
    await publishNow(page);

    await expect.poll(() => calls.approve.length).toBe(1);
    expect(calls.photo).toEqual([]);
    await expect(page.getByRole('dialog', { name: 'Post to TikTok' })).toHaveCount(0);
  });

  test('another platform still publishes through approve', async ({ page }) => {
    const calls = await setup(page, [INSTAGRAM]);
    await openEditorViaDetail(page, 'Instagram caption');
    await publishNow(page);

    await expect.poll(() => calls.approve.length).toBe(1);
    expect(calls.photo).toEqual([]);
    await expect(page.getByRole('dialog', { name: 'Post to TikTok' })).toHaveCount(0);
  });

  test('the screen shows the text as edited in the editor, not the saved text', async ({ page }) => {
    await setup(page, [PHOTO]);
    await openEditorViaDetail(page, 'Banana bread');
    const caption = page.getByRole('textbox').first();
    await caption.fill('Brand new caption typed just now');
    await publishNow(page);

    const screen = page.getByRole('dialog', { name: 'Post to TikTok' });
    await expect(screen.locator('textarea').first()).toHaveValue(/Brand new caption typed just now/);
  });
});
