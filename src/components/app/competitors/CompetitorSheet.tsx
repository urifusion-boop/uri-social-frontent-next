'use client';

import { Competitor, CompetitorAd, CompetitorService } from '@/src/api/CompetitorService';
import { Drawer } from '@mui/material';
import { useEffect, useState } from 'react';
import { btn, C, font, linkLabel, pill } from './ui';

/** One competitor in full, next to the list: what they sell, why they compete, where Jane found
 * them, and the ads of theirs the owner has saved. */
export default function CompetitorSheet({
  competitor,
  onClose,
  onSeeAds,
}: {
  competitor: Competitor | null;
  onClose: () => void;
  onSeeAds: (id: string) => void;
}) {
  const [ads, setAds] = useState<CompetitorAd[] | null>(null);
  useEffect(() => {
    if (!competitor) return;
    let alive = true;
    setAds(null);
    CompetitorService.ads({ competitor_id: competitor.id })
      .then((l) => alive && setAds(l.ads.slice(0, 6)))
      .catch(() => alive && setAds([]));
    return () => {
      alive = false;
    };
  }, [competitor]);

  const c = competitor;
  return (
    <Drawer anchor="right" open={Boolean(c)} onClose={onClose} PaperProps={{ sx: { width: { xs: '100%', sm: 420 } } }}>
      {c && (
        <div style={{ ...font, display: 'flex', flexDirection: 'column', height: '100%' }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', padding: '16px 18px', borderBottom: `1px solid ${C.line}`, gap: 10 }}>
            <div style={{ minWidth: 0 }}>
              <div style={{ fontSize: 17, fontWeight: 800, color: C.ink }}>{c.name}</div>
              <div style={{ display: 'flex', gap: 6, alignItems: 'center', marginTop: 4, flexWrap: 'wrap' }}>
                <span style={pill(c.kind === 'direct' ? '#FDF2F7' : C.soft, c.kind === 'direct' ? C.pink : C.muted)}>
                  {c.kind === 'direct' ? 'Direct competitor' : 'Similar business'}
                </span>
                {c.location && <span style={{ fontSize: 12, color: C.muted }}>{c.location}</span>}
              </div>
            </div>
            <button type="button" onClick={onClose} aria-label="Close" style={btn('quiet')}>
              ✕
            </button>
          </div>
          <div style={{ padding: 18, overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: 14 }}>
            {[
              ['What they sell', c.what_they_sell || c.description],
              ['Why customers compare you', c.why],
            ]
              .filter(([, v]) => v)
              .map(([k, v]) => (
                <div key={k}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: C.faint, textTransform: 'uppercase', letterSpacing: '.05em' }}>{k}</div>
                  <div style={{ fontSize: 13.5, color: C.body, lineHeight: 1.5 }}>{v}</div>
                </div>
              ))}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4, fontSize: 13 }}>
              {c.website && (
                <a href={c.website} target="_blank" rel="noopener noreferrer" style={{ color: C.pink, fontWeight: 600 }}>
                  {linkLabel(c.website)}
                </a>
              )}
              {c.instagram && (
                <a href={`https://instagram.com/${c.instagram}`} target="_blank" rel="noopener noreferrer" style={{ color: C.pink, fontWeight: 600 }}>
                  @{c.instagram} on Instagram
                </a>
              )}
              {c.source_url && c.source_url !== c.website && (
                <a href={c.source_url} target="_blank" rel="noopener noreferrer" style={{ color: C.muted }}>
                  Where Jane found them
                </a>
              )}
              <span style={{ fontSize: 12, color: C.faint }}>{c.source === 'added' ? 'You added this business.' : 'Jane found this business and checked it is real.'}</span>
            </div>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: C.faint, textTransform: 'uppercase', letterSpacing: '.05em' }}>Their ads you saved</div>
                <button type="button" onClick={() => onSeeAds(c.id)} style={btn('link')}>
                  {ads?.length ? 'See all' : 'Add one'}
                </button>
              </div>
              {ads === null ? (
                <div style={{ height: 80 }} aria-busy="true" />
              ) : ads.length ? (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: 6 }}>
                  {ads.map((a) => (
                    <img key={a.id} src={a.thumb_url || a.image_url} alt={a.angle_label || 'Their ad'} loading="lazy" style={{ width: '100%', aspectRatio: '1 / 1', objectFit: 'cover', borderRadius: 8, border: `1px solid ${C.line}` }} />
                  ))}
                </div>
              ) : (
                <div style={{ fontSize: 12.5, color: C.muted }}>None yet. Save a screenshot of one of their ads and Jane will tell you why it works.</div>
              )}
            </div>
          </div>
        </div>
      )}
    </Drawer>
  );
}
