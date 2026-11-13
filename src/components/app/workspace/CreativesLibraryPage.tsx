/**
 * Campaign Manager's "Creatives" entry used to be an honest "not built yet" stub —
 * but the backend already has real, reusable creative: every draft a brand has
 * generated or uploaded (CampaignService.listDrafts, the same source the Campaign
 * Wizard's "Use a past draft" step already reads from). This is that data given its
 * own browsable page instead of only being reachable mid-campaign.
 */
'use client';
import { useEffect, useState } from 'react';
import { FaFacebook, FaInstagram, FaLinkedin, FaTiktok, FaTwitter } from 'react-icons/fa';
import { CampaignService, DraftSummary } from '@/src/api/CampaignService';
import { useIsMobile } from '@/src/hooks/useIsMobile';
import { useFeatures } from '@/src/hooks/useFeatures';
import MakeFromPicture from '@/src/components/app/competitors/MakeFromPicture';

const PINK = '#C2185B';

const PLATFORM_ICON: Record<string, { icon: React.ReactNode; color: string }> = {
  facebook: { icon: <FaFacebook size={12} />, color: '#1877F2' },
  instagram: { icon: <FaInstagram size={12} />, color: '#E1306C' },
  instagram_reels: { icon: <FaInstagram size={12} />, color: '#E1306C' },
  twitter: { icon: <FaTwitter size={12} />, color: '#1DA1F2' },
  linkedin: { icon: <FaLinkedin size={12} />, color: '#0A66C2' },
  tiktok: { icon: <FaTiktok size={12} />, color: '#010101' },
};

function timeAgo(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  return new Date(iso).toLocaleDateString();
}

export default function CreativesLibraryPage({ onUseInWizard }: { onUseInWizard: (draft: DraftSummary) => void }) {
  const { flags } = useFeatures();
  // "Make one like this" from a creative the owner already has (PRD WS4; rolled out with Competitors).
  const [makeFrom, setMakeFrom] = useState<string | null>(null);
  const isMobile = useIsMobile();
  const [drafts, setDrafts] = useState<DraftSummary[] | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let alive = true;
    CampaignService.listDrafts(60)
      .then((r) => {
        if (alive) setDrafts(r.drafts);
      })
      .catch(() => {
        if (alive) setFailed(true);
      });
    return () => {
      alive = false;
    };
  }, []);

  return (
    <div style={{ padding: isMobile ? '14px 12px 28px' : '20px 24px 40px' }}>
      <h2 style={{ margin: 0, fontSize: 18, fontWeight: 800, color: '#1a0a12' }}>Creatives</h2>
      <p style={{ margin: '2px 0 18px', fontSize: 12.5, color: '#7a7270' }}>
        Everything you've generated or uploaded — reuse any of it as a new campaign's creative.
      </p>

      {drafts === null && !failed && <p style={{ fontSize: 13, color: '#7a7270' }}>Loading your creative…</p>}
      {failed && (
        <p style={{ fontSize: 13, color: '#b91c1c' }}>Couldn't load your creative library — try again shortly.</p>
      )}
      {drafts !== null && drafts.length === 0 && (
        <p style={{ fontSize: 13, color: '#7a7270' }}>
          Nothing here yet — creative you generate or upload while building a campaign shows up here afterward.
        </p>
      )}

      {drafts && drafts.length > 0 && (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: isMobile ? 'repeat(2, 1fr)' : 'repeat(auto-fill, minmax(190px, 1fr))',
            gap: 14,
          }}
        >
          {drafts.map((d) => {
            const platform = PLATFORM_ICON[d.platform];
            return (
              <div
                key={d.draft_id}
                style={{
                  border: '1px solid #ece8e6',
                  borderRadius: 12,
                  overflow: 'hidden',
                  background: '#fff',
                  display: 'flex',
                  flexDirection: 'column',
                }}
              >
                <div
                  style={{
                    aspectRatio: '1',
                    background: d.image_url ? `center/cover no-repeat url(${d.image_url})` : '#f6f3f2',
                  }}
                />
                <div style={{ padding: 10, display: 'flex', flexDirection: 'column', gap: 6, flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    {platform ? (
                      <span
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 4,
                          fontSize: 11,
                          fontWeight: 700,
                          color: platform.color,
                        }}
                      >
                        {platform.icon}
                        {d.platform}
                      </span>
                    ) : (
                      <span style={{ fontSize: 11, color: '#9a9090' }}>{d.platform}</span>
                    )}
                    <span style={{ fontSize: 10.5, color: '#9a9090' }}>{timeAgo(d.created_at)}</span>
                  </div>
                  <p
                    style={{
                      margin: 0,
                      fontSize: 11.5,
                      color: '#4a4440',
                      lineHeight: 1.4,
                      display: '-webkit-box',
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: 'vertical',
                      overflow: 'hidden',
                      flex: 1,
                    }}
                  >
                    {d.content || 'No caption'}
                  </p>
                  <button
                    type="button"
                    onClick={() => onUseInWizard(d)}
                    style={{
                      border: `1px solid ${PINK}`,
                      background: '#fff',
                      color: PINK,
                      borderRadius: 8,
                      padding: '6px 10px',
                      fontSize: 11.5,
                      fontWeight: 700,
                      cursor: 'pointer',
                    }}
                  >
                    Use in Campaign Builder
                  </button>
                  {flags.competitors && d.image_url && (
                    <button
                      type="button"
                      onClick={() => setMakeFrom(d.image_url)}
                      style={{
                        border: 'none',
                        background: 'none',
                        color: '#7a7270',
                        padding: '2px 0',
                        fontSize: 11.5,
                        fontWeight: 700,
                        cursor: 'pointer',
                      }}
                    >
                      Make more like this
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
      {makeFrom && (
        <MakeFromPicture
          imageUrl={makeFrom}
          from="creatives"
          onClose={() => setMakeFrom(null)}
          onUseInCampaign={(draft) => {
            setMakeFrom(null);
            onUseInWizard(draft);
          }}
        />
      )}
    </div>
  );
}
