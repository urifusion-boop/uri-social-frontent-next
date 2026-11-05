'use client';

import { ChangeEvent, useEffect, useRef, useState } from 'react';
import {
  AdsPlanAd,
  AssetAttestation,
  CampaignService,
  CreativeProvenanceInput,
  PlanAdLayout,
  PlanAdsState,
} from '@/src/api/CampaignService';
import { AiVideoChoices, useCreativePaths, VideoWhoPrompt } from '@/src/components/app/workspace/CreativePathControls';

/*
 * The ads a campaign tests, on the plan card. Any mix of ads Jane makes and the client's
 * own photos and videos. They share one ad set by default; a budget that gives each
 * Meta's daily floor can give each its own ad set instead.
 */

const PINK = '#C2185B';
const MAX_ADS = 6;

const ANGLE_LABELS: Record<string, string> = {
  problem: 'The problem it fixes',
  offer: 'The offer',
  outcome: 'The result',
  versus: 'Before and after',
  announcement: 'The news',
  post: 'Our take',
};

/** What the ad actually looks like when a format rendered it, otherwise its angle. */
const adLabel = (ad: AdsPlanAd, position: number, formatNames: Record<string, string>) =>
  formatNames[ad.vsg01_format_id || ''] ||
  ANGLE_LABELS[ad.concept || ''] ||
  (ad.is_video ? `Video ${position}` : `Ad ${position}`);

const smallBtn = (disabled = false): React.CSSProperties => ({
  background: '#fff',
  color: PINK,
  border: `1.5px solid ${PINK}`,
  borderRadius: 18,
  padding: '6px 12px',
  fontSize: 12.5,
  fontWeight: 700,
  cursor: disabled ? 'default' : 'pointer',
  opacity: disabled ? 0.5 : 1,
});

const errorMessage = (e: unknown) => {
  const detail = (e as { response?: { data?: { detail?: unknown } } } | null)?.response?.data?.detail;
  return typeof detail === 'string' ? detail : 'That didn’t work. Please try again.';
};

const PHOTO_CHOICES: { value: AssetAttestation | undefined; label: string }[] = [
  { value: 'product_photo', label: '📦 My real product' },
  { value: 'real_customer_photo', label: '🙋 A real customer' },
  { value: 'owner_photo', label: '🧑🏾 Me or my team' },
  { value: undefined, label: 'Skip' },
];

type Upload = { url: string; isVideo: boolean };

export function AdTestBuilder({
  planId,
  main,
  concepts,
  layout,
  canSplit,
  dailyNgn,
  description,
  wanted = 0,
  onChange,
}: {
  /** Absent once launched: the ads are then shown but can't change. */
  planId?: string;
  main: AdsPlanAd;
  concepts: AdsPlanAd[];
  layout: PlanAdLayout;
  canSplit: boolean;
  dailyNgn?: number;
  description: string;
  /** "Test N ideas": how many ads Jane is working up to. She adds them one at a time. */
  wanted?: number;
  onChange: (next: PlanAdsState) => void;
}) {
  const info = useCreativePaths(description);
  const fileRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState('');
  const [error, setError] = useState('');
  const [upload, setUpload] = useState<Upload | null>(null);
  const [pickingAiVideo, setPickingAiVideo] = useState(false);
  const [formatNames, setFormatNames] = useState<Record<string, string>>({});
  const [editing, setEditing] = useState<{ index: number; headline: string; text: string } | null>(null);

  useEffect(() => {
    CampaignService.getAdFormats()
      .then(({ formats }) => setFormatNames(Object.fromEntries(formats.map((f) => [f.format_id, f.name]))))
      .catch(() => setFormatNames({}));
  }, []);

  const ads = [main, ...concepts];
  const editable = !!planId;
  const full = ads.length >= MAX_ADS;

  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;
  const workingUp = useRef(false);
  useEffect(() => {
    if (!planId || !wanted || workingUp.current) return;
    workingUp.current = true;
    (async () => {
      let made = 1 + concepts.length;
      try {
        while (made < wanted) {
          setBusy(`Jane is making ad ${made + 1} of ${wanted}…`);
          const next = await CampaignService.addPlanAd(planId, { source: 'generate', auto: true });
          onChangeRef.current(next);
          made = 1 + next.concepts.length;
          if (!next.concepts_wanted) break;
        }
      } catch (e) {
        setError(
          `${errorMessage(e)} You can add another below, or launch with the ${made === 1 ? 'one' : made} you have.`
        );
      }
      setBusy('');
    })();
    // Runs once for the plan: the server decides when it has enough.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [planId, wanted]);

  async function run(label: string, call: () => Promise<PlanAdsState>) {
    setBusy(label);
    setError('');
    try {
      onChange(await call());
    } catch (e) {
      setError(errorMessage(e));
    }
    setBusy('');
  }

  const addUploaded = (body: Parameters<typeof CampaignService.addPlanAd>[1]) => {
    setUpload(null);
    setPickingAiVideo(false);
    return run('Adding your ad…', () => CampaignService.addPlanAd(planId!, body));
  };

  async function onFile(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    setBusy('Uploading…');
    setError('');
    try {
      const { url, is_video } = await CampaignService.uploadMedia(file);
      setUpload({ url, isVideo: is_video });
    } catch (err) {
      setError(errorMessage(err));
    }
    setBusy('');
  }

  if (!editable && !concepts.length) return null;

  return (
    <div style={{ padding: '12px 16px 0' }}>
      {ads.length > 1 && (
        <>
          <div style={{ fontSize: 12, fontWeight: 800, color: '#555', marginBottom: 8 }}>Testing {ads.length} ads</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: 8 }}>
            {ads.map((ad, i) => (
              <div
                key={`${ad.image_url}${i}`}
                style={{ position: 'relative', border: '1px solid #eee', borderRadius: 10, overflow: 'hidden' }}
              >
                {ad.is_video ? (
                  <video
                    src={ad.image_url}
                    controls
                    muted
                    preload="metadata"
                    style={{ width: '100%', height: 120, objectFit: 'cover', display: 'block', background: '#000' }}
                  />
                ) : (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={ad.image_url}
                    alt={adLabel(ad, i + 1, formatNames)}
                    style={{ width: '100%', height: 120, objectFit: 'cover', display: 'block', background: '#f5f5f5' }}
                  />
                )}
                {editable && i > 0 && (
                  <button
                    type="button"
                    aria-label={`Remove ${adLabel(ad, i + 1, formatNames)}`}
                    disabled={!!busy}
                    onClick={() => run('Removing…', () => CampaignService.removePlanAd(planId!, i - 1))}
                    style={{
                      position: 'absolute',
                      top: 4,
                      right: 4,
                      width: 24,
                      height: 24,
                      borderRadius: 12,
                      border: 'none',
                      background: 'rgba(0,0,0,0.65)',
                      color: '#fff',
                      cursor: 'pointer',
                    }}
                  >
                    ×
                  </button>
                )}
                <div style={{ padding: '6px 8px' }}>
                  <div style={{ fontSize: 10.5, fontWeight: 800, color: PINK, textTransform: 'uppercase' }}>
                    {adLabel(ad, i + 1, formatNames)}
                  </div>
                  {editing?.index === i - 1 ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 4, marginTop: 4 }}>
                      <input
                        aria-label="Headline"
                        maxLength={40}
                        value={editing.headline}
                        onChange={(e) => setEditing({ ...editing, headline: e.target.value })}
                        style={{ fontSize: 12, border: '1px solid #ddd', borderRadius: 6, padding: 4 }}
                      />
                      <textarea
                        aria-label="Caption"
                        rows={4}
                        value={editing.text}
                        onChange={(e) => setEditing({ ...editing, text: e.target.value })}
                        style={{ fontSize: 11.5, border: '1px solid #ddd', borderRadius: 6, padding: 4 }}
                      />
                      <div style={{ display: 'flex', gap: 4 }}>
                        <button
                          type="button"
                          disabled={!!busy}
                          style={smallBtn(!!busy)}
                          onClick={() => {
                            const edit = editing;
                            setEditing(null);
                            run('Saving…', () =>
                              CampaignService.editPlanAd(planId!, edit.index, edit.headline, edit.text)
                            );
                          }}
                        >
                          Save
                        </button>
                        <button type="button" style={smallBtn()} onClick={() => setEditing(null)}>
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div style={{ fontSize: 12, fontWeight: 700, color: '#1a0a12', lineHeight: 1.3 }}>
                        {ad.headline}
                      </div>
                      <div style={{ fontSize: 11.5, color: '#666', lineHeight: 1.35, marginTop: 2 }}>
                        {ad.primary_text}
                      </div>
                      {editable && i > 0 && (
                        <button
                          type="button"
                          disabled={!!busy}
                          onClick={() => setEditing({ index: i - 1, headline: ad.headline, text: ad.primary_text })}
                          style={{
                            background: 'none',
                            border: 'none',
                            padding: 0,
                            marginTop: 4,
                            color: PINK,
                            fontSize: 11.5,
                            fontWeight: 700,
                            cursor: 'pointer',
                          }}
                        >
                          Edit words
                        </button>
                      )}
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {editable && ads.length > 1 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 10, fontSize: 12.5, alignItems: 'center' }}>
          <span style={{ color: '#555', fontWeight: 700 }}>Run them:</span>
          <label style={{ display: 'flex', gap: 5, alignItems: 'center', cursor: 'pointer' }}>
            <input
              type="radio"
              checked={layout === 'single_ad_set'}
              disabled={!!busy}
              onChange={() => run('Saving…', () => CampaignService.setPlanAdLayout(planId!, 'single_ad_set'))}
            />
            All in one ad set
          </label>
          <label
            title={canSplit ? undefined : 'Each ad set needs at least ₦2,000 a day'}
            style={{
              display: 'flex',
              gap: 5,
              alignItems: 'center',
              cursor: canSplit ? 'pointer' : 'default',
              opacity: canSplit ? 1 : 0.5,
            }}
          >
            <input
              type="radio"
              checked={layout === 'abo'}
              disabled={!!busy || !canSplit}
              onChange={() => run('Saving…', () => CampaignService.setPlanAdLayout(planId!, 'abo'))}
            />
            Each in its own ad set
            {dailyNgn ? ` (₦${Math.round(dailyNgn / ads.length).toLocaleString()} a day each)` : ''}
            {!canSplit && ' — budget too small'}
          </label>
        </div>
      )}

      {editable && !full && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 10, alignItems: 'center' }}>
          <span style={{ fontSize: 12.5, color: '#555', fontWeight: 700 }}>Add another ad to test:</span>
          <button
            type="button"
            disabled={!!busy}
            style={smallBtn(!!busy)}
            onClick={() => run('Jane is making it…', () => CampaignService.addPlanAd(planId!, { source: 'generate' }))}
          >
            ✨ Jane makes one (1 credit)
          </button>
          <button type="button" disabled={!!busy} style={smallBtn(!!busy)} onClick={() => fileRef.current?.click()}>
            📎 My photo or video
          </button>
          <button
            type="button"
            disabled={!!busy || info?.paths.ai_video.open === false}
            title={info?.paths.ai_video.why_closed ?? undefined}
            style={smallBtn(!!busy || info?.paths.ai_video.open === false)}
            onClick={() => setPickingAiVideo((v) => !v)}
          >
            🎬 AI video
          </button>
          <input
            ref={fileRef}
            type="file"
            hidden
            accept="image/png,image/jpeg,image/webp,video/mp4,video/quicktime,video/webm"
            onChange={onFile}
          />
        </div>
      )}

      {busy && <div style={{ fontSize: 12.5, color: '#888', marginTop: 8 }}>{busy}</div>}
      {error && <div style={{ fontSize: 12.5, color: '#B71C1C', marginTop: 8 }}>{error}</div>}

      {pickingAiVideo && (
        <div style={{ marginTop: 10 }}>
          <AiVideoChoices
            info={info}
            onPick={(url, provenance: CreativeProvenanceInput) =>
              addUploaded({ source: 'upload', reference_image_url: url, is_video: true, ...provenance })
            }
          />
        </div>
      )}

      {upload?.isVideo && (
        <div style={{ marginTop: 10 }}>
          <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 6 }}>Who’s in this video?</div>
          <VideoWhoPrompt
            info={info}
            onAnswer={(provenance) =>
              addUploaded({ source: 'upload', reference_image_url: upload.url, is_video: true, ...provenance })
            }
          />
        </div>
      )}

      {upload && !upload.isVideo && (
        <div style={{ marginTop: 10 }}>
          <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 6 }}>What does this photo actually show?</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {PHOTO_CHOICES.map((c) => (
              <button
                key={c.label}
                type="button"
                style={smallBtn()}
                onClick={() =>
                  addUploaded({
                    source: 'upload',
                    reference_image_url: upload.url,
                    is_video: false,
                    asset_attestation: c.value,
                  })
                }
              >
                {c.label}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
