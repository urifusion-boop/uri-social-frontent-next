/**
 * "Growth" — Campaign Manager's new sidebar sub-item for what the old chat page
 * kept as an internal tab (campaign health, testing, the standing ads brief,
 * automation policy, history). GrowthPanel itself is untouched — it was already a
 * real, standalone, reusable component — this just gives it a real sidebar
 * destination instead of living inside the chat flow being retired.
 */
'use client';
import { useIsMobile } from '@/src/hooks/useIsMobile';
import { GrowthPanel } from '@/src/components/app/workspace/growth/GrowthPanel';

export default function CampaignGrowthPage() {
  const isMobile = useIsMobile();
  return (
    <div style={{ minHeight: '100%', background: 'linear-gradient(180deg, #FCE4EC 0%, #FBF8F7 40%, #FAFAF8 100%)' }}>
      <div style={{ maxWidth: 900, margin: '0 auto', padding: '18px 20px 28px' }}>
        <h2 style={{ margin: 0, fontSize: 18, fontWeight: 800, color: '#1a0a12' }}>Growth</h2>
        <p style={{ margin: '2px 0 16px', fontSize: 12.5, color: '#7a7270' }}>
          What each campaign is doing, what&rsquo;s wrong with it, and what to do next.
        </p>
        <GrowthPanel isMobile={isMobile} />
      </div>
    </div>
  );
}
