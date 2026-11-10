/**
 * "Overview" — Campaign Manager's new sidebar sub-item for what the old chat page
 * kept as an internal tab (DASH-PRD-01 §4's HomePanel: did anyone message you, is
 * your campaign working, how much wallet is left, what to do now). Reused
 * unchanged — the component itself was never the old page's design, just where it
 * lived — now a real sidebar destination like every other Campaign Manager page
 * instead of a tab buried inside the chat flow being retired.
 */
'use client';
import HomePanel from '@/src/components/app/workspace/HomePanel';

export default function CampaignOverviewPage({ onNavigate }: { onNavigate: (id: string) => void }) {
  return (
    <div style={{ minHeight: '100%', background: 'linear-gradient(180deg, #FCE4EC 0%, #FBF8F7 40%, #FAFAF8 100%)' }}>
      <div style={{ maxWidth: 900, margin: '0 auto', padding: '18px 20px 28px' }}>
        <h2 style={{ margin: 0, fontSize: 18, fontWeight: 800, color: '#1a0a12' }}>Overview</h2>
        <p style={{ margin: '2px 0 16px', fontSize: 12.5, color: '#7a7270' }}>
          What&rsquo;s happening across your campaigns, at a glance.
        </p>
        <HomePanel
          onNavigate={(surface) => {
            if (surface === 'wallet') onNavigate('campaign-wallet');
            else if (surface === 'campaigns' || surface === 'ask_jane') onNavigate('campaign-wizard');
            else onNavigate(surface);
          }}
        />
      </div>
    </div>
  );
}
