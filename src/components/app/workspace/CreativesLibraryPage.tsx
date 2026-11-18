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
  // The server sends UTC without a zone ("2026-11-15 10:20:33"); read bare, the browser took it
  // as local time, so in Lagos everything looked an hour older than it was.
  const utc = /[zZ]|[+-]\d\d:?\d\d$/.test(iso) ? iso : `${iso.replace(' ', 'T')}Z`;
  const diffMs = Date.now() - new Date(utc).getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  return new Date(utc).toLocaleDateString();
}

/** The creative's image, or — when there is none or it no longer loads — a soft branded tile with
 *  the platform icon and the start of the caption, instead of an empty grey square. */
function Thumb({ url, caption, icon }: { url?: string | null; caption: string; icon?: React.ReactNode }) {
  const [broken, setBroken] = useState(false);
  if (url && !broken) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={url}
        alt=""
        loading="lazy"
        onError={() => setBroken(true)}
        style={{ width: '100%', aspectRatio: '1', objectFit: 'cover', display: 'block', background: '#f6f3f2' }}
      />
    );
  }
  return (
    <div
      style={{
        aspectRatio: '1',
        background: 'linear-gradient(135deg, #FCE4EE 0%, #F8F0F3 55%, #EEE7FB 100%)',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        padding: 12,
      }}
    >
      <span
        style={{
          width: 28,
          height: 28,
          borderRadius: 9,
          background: '#fff',
          display: 'grid',
          placeItems: 'center',
          boxShadow: '0 4px 10px -4px rgba(120,20,60,.25)',
        }}
      >
        {icon}
      </span>
      <span
        style={{
          fontSize: 13,
          fontWeight: 800,
          color: '#1a0a12',
          lineHeight: 1.25,
          display: '-webkit-box',
          WebkitLineClamp: 3,
          WebkitBoxOrient: 'vertical',
          overflow: 'hidden',
        }}
      >
        {caption.replace(/\s+/g, ' ').trim() || 'Text post'}
      </span>
    </div>
  );
}

export default function CreativesLibraryPage({ onUseInWizard }: { onUseInWizard: (draft: DraftSummary) => void }) {
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
                <Thumb url={d.image_url} caption={d.content || ''} icon={platform?.icon} />
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
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
