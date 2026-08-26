/**
 * Playwright e2e — the Plan Defence question box on the "planned" review card
 * ("Ask Jane about this plan"): a plain question, a what-if, and a challenge that
 * previews a re-derived plan before it's confirmed.
 *
 * Runs against a LOCAL dev server on this branch (npm run dev). Auth is faked by seeding
 * the localStorage keys the app reads, and every jane-ads API call is mocked so the run is
 * deterministic and never spends budget — this verifies the UI wiring, not the backend
 * (which has its own pytest suite, including a live check of plan_defence.py against
 * real OpenAI + a real local server).
 */
import { test, expect, Page } from '@playwright/test';

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

const PLANNED_RESULT = {
  stage: 'planned',
  plan_id: 'plan_test',
  plan: {
    goal: 'messages',
    behaviour: 'discover',
    explanation: 'why',
    platforms: [{ platform: 'meta', budget_ngn: 20000, days: 7, variants: 1, test_scope: 'none' }],
  },
  creative: {
    image_url:
      'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=',
    headline: 'Fresh Lunch',
    primary_text: 'Hot meals near you.',
    cta: 'Send WhatsApp Message',
  },
  whatsapp_number: '2348031234567',
  wallet: { balance_ngn: 50000, budget_ngn: 20000, service_fee_ngn: 2000, total_due_ngn: 22000, sufficient: true },
};

async function mockJaneAds(page: Page) {
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

  // One message → straight to a planned plan (skips the objective/budget/image steps —
  // out of scope for this spec, already covered by image-choice.spec.ts).
  await page.route('**/jane-ads/meta/plan-from-message', (r) => r.fulfill({ json: PLANNED_RESULT }));

  await page.route('**/jane-ads/meta/plan/plan_test/ask', async (route) => {
    const body = JSON.parse(route.request().postData() || '{}');
    const q = (body.question || '').toLowerCase();
    if (q.includes('what if')) {
      return route.fulfill({
        json: {
          kind: 'question',
          answer:
            'At ₦10,000 instead of ₦20,000: the run would be 5 days instead of 7 days; estimated leads would go from 40 to 20.',
          what_if: { changed: 'budget_ngn: 20,000 -> 10,000', original: {}, hypothetical: {} },
        },
      });
    }
    if (q.includes('students')) {
      if (body.confirm_correction) {
        return route.fulfill({
          json: {
            kind: 'challenge',
            stage: 'planned',
            plan_id: 'plan_test',
            plan: {
              goal: 'messages',
              behaviour: 'discover',
              explanation: 'Updated: targeting young professionals instead.',
              platforms: [{ platform: 'meta', budget_ngn: 20000, days: 7, variants: 1, test_scope: 'none' }],
            },
            creative: {
              image_url: PLANNED_RESULT.creative.image_url,
              headline: 'Fresh Lunch for Professionals',
              primary_text: 'Hot meals near your office.',
              cta: 'Send WhatsApp Message',
            },
          },
        });
      }
      return route.fulfill({
        json: {
          kind: 'challenge',
          stage: 'challenge_preview',
          plan_id: 'plan_test',
          note: 'This reflects your correction — resend with confirm_correction=true to replace the current plan.',
          plan: {
            goal: 'messages',
            behaviour: 'discover',
            explanation: 'Updated: targeting young professionals instead.',
            platforms: [{ platform: 'meta', budget_ngn: 20000, days: 7, variants: 1, test_scope: 'none' }],
          },
        },
      });
    }
    // Plain "why" question.
    return route.fulfill({
      json: {
        kind: 'question',
        answer:
          'I chose Meta because your customers discover this by scrolling, and your ₦20,000 budget clears the useful minimum for one strong platform.',
      },
    });
  });
}

test('ask a why-question and see the answer', async ({ page }) => {
  await fakeAuth(page);
  await mockJaneAds(page);
  await page.goto('/workspace/?tab=campaigns');

  await expect(page.getByRole('heading', { name: 'Campaigns' })).toBeVisible({ timeout: 20000 });

  const input = page.getByPlaceholder(/Tell Jane what you want to promote/i);
  await input.fill('get me more whatsapp messages for my restaurant, budget 20000');
  await input.press('Enter');

  await expect(page.getByText('Fresh Lunch')).toBeVisible();
  await expect(page.getByRole('button', { name: /Looks good — launch it/i })).toBeVisible();

  const askInput = page.getByPlaceholder(/Ask Jane about this plan/i);
  await expect(askInput).toBeVisible();
  await askInput.fill('Why did you pick this platform?');
  await page.getByRole('button', { name: 'Ask' }).click({ force: true });

  await expect(page.getByText(/I chose Meta because your customers discover/i)).toBeVisible();
});

test('a what-if renders the real re-derived comparison', async ({ page }) => {
  await fakeAuth(page);
  await mockJaneAds(page);
  await page.goto('/workspace/?tab=campaigns');

  await expect(page.getByRole('heading', { name: 'Campaigns' })).toBeVisible({ timeout: 20000 });
  const input = page.getByPlaceholder(/Tell Jane what you want to promote/i);
  await input.fill('get me more whatsapp messages for my restaurant, budget 20000');
  await input.press('Enter');
  await expect(page.getByText('Fresh Lunch')).toBeVisible();

  const askInput = page.getByPlaceholder(/Ask Jane about this plan/i);
  await askInput.fill('What if I spent half of that?');
  await page.getByRole('button', { name: 'Ask' }).click({ force: true });

  await expect(page.getByText(/estimated leads would go from 40 to 20/i)).toBeVisible();
});

test('a challenge shows a preview and only replaces the plan on confirm', async ({ page }) => {
  await fakeAuth(page);
  await mockJaneAds(page);
  await page.goto('/workspace/?tab=campaigns');

  await expect(page.getByRole('heading', { name: 'Campaigns' })).toBeVisible({ timeout: 20000 });
  const input = page.getByPlaceholder(/Tell Jane what you want to promote/i);
  await input.fill('get me more whatsapp messages for my restaurant, budget 20000');
  await input.press('Enter');
  await expect(page.getByText('Fresh Lunch')).toBeVisible();

  const askInput = page.getByPlaceholder(/Ask Jane about this plan/i);
  await askInput.fill('Actually students are not my main buyers, professionals are.');
  await page.getByRole('button', { name: 'Ask' }).click({ force: true });

  // Preview shown, nothing replaced yet — the original headline is still on screen.
  await expect(page.getByText(/resend with confirm_correction=true/i)).toBeVisible();
  await expect(page.getByText('Fresh Lunch', { exact: true })).toBeVisible();

  const confirmButton = page.getByRole('button', { name: /Replace plan with this correction/i });
  await expect(confirmButton).toBeVisible();
  await confirmButton.click({ force: true });

  // Now the card reflects the re-derived plan.
  await expect(page.getByText('Fresh Lunch for Professionals')).toBeVisible();
  await expect(page.getByText(/Updated: targeting young professionals/i)).toBeVisible();
});
