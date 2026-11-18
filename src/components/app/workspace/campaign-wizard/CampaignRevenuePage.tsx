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
import { useIsMobile } from '@/src/hooks/useIsMobile';
import { BillingTab } from '../CampaignsPage';
import PageHeader from '@/src/components/app/atoms/PageHeader';

export default function CampaignRevenuePage() {
  const isMobile = useIsMobile();
  return (
    <div style={{ minHeight: '100%', background: 'linear-gradient(180deg, #FCE4EC 0%, #FBF8F7 40%, #FAFAF8 100%)' }}>
      {/* BillingTab brings its own padding (shared with the chat page's Revenue tab,
          which has no wrapper of its own to supply it) — only the heading gets this
          page's usual max-width/side padding, so the two don't stack. */}
      <div style={{ maxWidth: 900, margin: '0 auto', padding: isMobile ? '14px 12px 0' : '18px 20px 0' }}>
        <PageHeader
          section="Campaign Manager"
          title="Revenue"
          description="Fee revenue from ad spend across every brand, with a CSV export."
          compact={isMobile}
        />
      </div>
      <div style={{ maxWidth: 900, margin: '0 auto' }}>
        <BillingTab />
      </div>
    </div>
  );
}
