'use client';

import { CampaignService, DraftSummary } from '@/src/api/CampaignService';
import { CompetitorAd, CompetitorService } from '@/src/api/CompetitorService';
import { trackEvent } from '@/lib/analytics';
import { useEffect, useRef, useState } from 'react';
import AdComposer from './AdComposer';
import { btn, C, errorText, font } from './ui';

/**
 * "Make one like this" from any picture: an image already in Creatives, or a screenshot of an ad
 * the owner liked (the builder's "Start from an ad I like"). The picture is saved as a reference
 * (it then also shows under Competitors → Their ads), Jane reads it, and the composer opens.
 */
export default function MakeFromPicture({
  imageUrl,
  file,
  from,
  onClose,
  onUseInCampaign,
}: {
  imageUrl?: string;
  file?: File;
  from: 'creatives' | 'builder';
  onClose: () => void;
  onUseInCampaign: (draft: DraftSummary) => void;
}) {
  const [ad, setAd] = useState<CompetitorAd | null>(null);
  const [stage, setStage] = useState<'saving' | 'reading' | 'error'>('saving');
  const [error, setError] = useState('');
  const started = useRef(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (started.current) return;
    started.current = true;
    (async () => {
      try {
        const url = imageUrl ?? (file ? (await CampaignService.uploadMedia(file)).url : '');
        const saved = await CompetitorService.saveAd({ image_url: url, note: from === 'creatives' ? 'From Creatives' : 'An ad I liked' });
        trackEvent('reference_ad_saved', { from });
        setStage('reading');
        const check = async (tries: number) => {
          const list = await CompetitorService.ads();
          const found = list.ads.find((a) => a.id === saved.id);
          if (found?.status === 'ready') {
            setAd(found);
            return;
          }
          if (found?.status === 'failed' || tries > 40) {
            setStage('error');
            setError(found?.error || "Jane couldn't read that picture. Try a clearer one.");
            return;
          }
          timer.current = setTimeout(() => void check(tries + 1), 2500);
        };
        await check(0);
      } catch (e) {
        setStage('error');
        setError(errorText(e, "That picture didn't save. Try again."));
      }
    })();
    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
  }, [imageUrl, file, from]);

  if (ad) return <AdComposer ad={ad} onClose={onClose} onUseInCampaign={onUseInCampaign} />;

  return (
    <div role="dialog" aria-modal="true" aria-label="Make one like this" style={{ ...font, position: 'fixed', inset: 0, zIndex: 1300, background: 'rgba(26,10,18,.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
      <div style={{ background: '#fff', borderRadius: 16, padding: 22, maxWidth: 380, width: '100%', display: 'flex', flexDirection: 'column', gap: 12, textAlign: 'center' }}>
        {stage === 'error' ? (
          <>
            <div style={{ fontSize: 15, fontWeight: 800, color: C.ink }}>That didn&apos;t work</div>
            <div style={{ fontSize: 13, color: C.muted }}>{error}</div>
            <div>
              <button type="button" onClick={onClose} style={btn('primary')}>
                Close
              </button>
            </div>
          </>
        ) : (
          <>
            <div className="cmp-spin" aria-hidden style={{ width: 28, height: 28, borderRadius: '50%', border: `3px solid ${C.pink}`, borderRightColor: 'transparent', margin: '0 auto' }} />
            <div style={{ fontSize: 15, fontWeight: 800, color: C.ink }}>{stage === 'saving' ? 'Saving the picture…' : 'Jane is reading it…'}</div>
            <div style={{ fontSize: 13, color: C.muted }}>She works out its angle, hook and layout, then you choose what your version advertises.</div>
            <div>
              <button type="button" onClick={onClose} style={btn('quiet')}>
                Cancel
              </button>
            </div>
            <style>{`.cmp-spin{animation:cmpspin .8s linear infinite}@keyframes cmpspin{to{transform:rotate(360deg)}}`}</style>
          </>
        )}
      </div>
    </div>
  );
}
