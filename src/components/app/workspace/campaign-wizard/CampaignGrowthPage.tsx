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
import PageHeader from '@/src/components/app/atoms/PageHeader';

export default function CampaignGrowthPage() {
  const isMobile = useIsMobile();
  return (
    <div style={{ minHeight: '100%', background: 'linear-gradient(180deg, #FCE4EC 0%, #FBF8F7 40%, #FAFAF8 100%)' }}>
      <div style={{ maxWidth: 900, margin: '0 auto', padding: isMobile ? '14px 12px 28px' : '18px 20px 28px' }}>
        <PageHeader
          section="Campaign Manager"
          title="Growth"
          description="What each campaign is doing, what’s wrong with it, and what to do next."
          compact={isMobile}
          style={{ marginBottom: 16 }}
        />
        <GrowthPanel isMobile={isMobile} />
      </div>
    </div>
  );
}
