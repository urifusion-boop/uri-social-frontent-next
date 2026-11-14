import type { Page } from '@playwright/test';

/** The staged-rollout switches (GET /features). The PRD screens are hidden unless a flag is on. */
export async function mockFeatures(page: Page, on = true) {
  const flags = { website_playbook: on, builder_products: on, budget_suggestions: on, competitors: on };
  await page.route(/\/features(\?|$)/, (route) => {
    if (!['fetch', 'xhr'].includes(route.request().resourceType())) return route.continue();
    return route.fulfill({ json: { flags } });
  });
}
