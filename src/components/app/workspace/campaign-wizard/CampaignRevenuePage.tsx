/**
 * "Revenue" — Campaign Manager's new sidebar sub-item for what the old chat page
 * kept as an admin-only internal tab (ad-spend fee revenue, CSV export). Reuses
 * BillingTab unchanged; the nav item that reaches this is itself only shown to
 * accounts CampaignService.billingAccess() approves (same gate the old tab used,
 * now checked once in WorkspaceDashboard rather than per-tab-click) — BillingTab's
 * own calls are re-checked server-side regardless, same as every other admin page
 * in this app.
 */
'use client';
import { BillingTab } from '../CampaignsPage';

export default function CampaignRevenuePage() {
  return (
    <div style={{ minHeight: '100%', background: 'linear-gradient(180deg, #FCE4EC 0%, #FBF8F7 40%, #FAFAF8 100%)' }}>
      <div style={{ maxWidth: 900, margin: '0 auto', padding: '18px 20px 28px' }}>
        <h2 style={{ margin: 0, fontSize: 18, fontWeight: 800, color: '#1a0a12' }}>Revenue</h2>
        <p style={{ margin: '2px 0 16px', fontSize: 12.5, color: '#7a7270' }}>
          Fee revenue from ad spend across every brand, with a CSV export.
        </p>
        <BillingTab />
      </div>
    </div>
  );
}
