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

const linkBtn: React.CSSProperties = {
  background: 'none',
  border: 'none',
  padding: 0,
  color: PINK,
  fontSize: 12.5,
  fontWeight: 700,
  cursor: 'pointer',
};

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
  const [selected, setSelected] = useState(0);
  const [adding, setAdding] = useState(false);
  const [changingLayout, setChangingLayout] = useState(false);

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

  const current = Math.min(selected, ads.length - 1);
  const shown = ads[current];
  const daily = dailyNgn ? Math.round(dailyNgn) : 0;
  const each = daily ? Math.round(daily / ads.length) : 0;
  const naira = (n: number) => `₦${n.toLocaleString()}`;

  const addMenu = (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 8 }}>
      <button
        type="button"
        disabled={!!busy}
        style={smallBtn(!!busy)}
        onClick={() => {
          setAdding(false);
          run('Jane is making another ad…', () => CampaignService.addPlanAd(planId!, { source: 'generate' }));
        }}
      >
        ✨ Jane makes one · 1 credit
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
    </div>
  );

  const pendingSteps = (
    <>
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
      <input
        ref={fileRef}
        type="file"
        hidden
        accept="image/png,image/jpeg,image/webp,video/mp4,video/quicktime,video/webm"
        onChange={onFile}
      />
    </>
  );

  // One ad: the card above already shows it. Offer more as a quiet link, not a section.
  if (ads.length === 1) {
    return (
      <div style={{ padding: '10px 16px 0' }}>
        {!busy && !adding && (
          <button
            type="button"
            onClick={() => setAdding(true)}
            style={{
              background: 'none',
              border: 'none',
              padding: 0,
              color: PINK,
              fontSize: 13,
              fontWeight: 700,
              cursor: 'pointer',
            }}
          >
            + Add another ad, so Meta can find which works best
          </button>
        )}
        {adding && addMenu}
        {pendingSteps}
      </div>
    );
  }

  const isEditing = editing?.index === current - 1;

  return (
    <div>
      {shown.is_video ? (
        <video
          key={shown.image_url}
          src={shown.image_url}
          controls
          playsInline
          style={{ width: '100%', display: 'block', maxHeight: 320, background: '#000' }}
        />
      ) : (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          key={shown.image_url}
          src={shown.image_url}
          alt={adLabel(shown, current + 1, formatNames)}
          style={{ width: '100%', display: 'block', maxHeight: 320, objectFit: 'contain', background: '#f5f5f5' }}
        />
      )}

      <div style={{ padding: '10px 16px 0' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
          <span style={{ fontSize: 12, fontWeight: 800, color: '#1a0a12' }}>
            Ad {current + 1} of {ads.length}
          </span>
          <span
            style={{
              fontSize: 10.5,
              fontWeight: 800,
              color: PINK,
              background: '#fce4ec',
              borderRadius: 10,
              padding: '2px 8px',
              textTransform: 'uppercase',
            }}
          >
            {adLabel(shown, current + 1, formatNames)}
          </span>
          {editable && current > 0 && !isEditing && (
            <span style={{ marginLeft: 'auto', display: 'flex', gap: 12 }}>
              <button
                type="button"
                disabled={!!busy}
                onClick={() => setEditing({ index: current - 1, headline: shown.headline, text: shown.primary_text })}
                style={linkBtn}
              >
                Edit words
              </button>
              <button
                type="button"
                disabled={!!busy}
                onClick={() => {
                  setSelected(current - 1);
                  run('Removing…', () => CampaignService.removePlanAd(planId!, current - 1));
                }}
                style={{ ...linkBtn, color: '#888' }}
              >
                Remove
              </button>
            </span>
          )}
        </div>

        {isEditing && editing ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: 8 }}>
            <input
              aria-label="Headline"
              maxLength={40}
              value={editing.headline}
              onChange={(e) => setEditing({ ...editing, headline: e.target.value })}
              style={{ fontSize: 14, fontWeight: 700, border: '1px solid #ddd', borderRadius: 8, padding: 8 }}
            />
            <textarea
              aria-label="Caption"
              rows={3}
              value={editing.text}
              onChange={(e) => setEditing({ ...editing, text: e.target.value })}
              style={{ fontSize: 13, border: '1px solid #ddd', borderRadius: 8, padding: 8 }}
            />
            <div style={{ display: 'flex', gap: 6 }}>
              <button
                type="button"
                disabled={!!busy}
                style={smallBtn(!!busy)}
                onClick={() => {
                  const edit = editing;
                  setEditing(null);
                  run('Saving…', () => CampaignService.editPlanAd(planId!, edit.index, edit.headline, edit.text));
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
            <p style={{ margin: '6px 0 4px', fontWeight: 800, fontSize: 15, color: '#1a0a12' }}>{shown.headline}</p>
            <p style={{ margin: 0, fontSize: 13, color: '#555', lineHeight: 1.5 }}>{shown.primary_text}</p>
          </>
        )}

        <div style={{ display: 'flex', gap: 8, marginTop: 12, overflowX: 'auto', paddingBottom: 2 }}>
          {ads.map((ad, i) => (
            <button
              key={`${ad.image_url}${i}`}
              type="button"
              aria-label={`Show ad ${i + 1}`}
              onClick={() => {
                setSelected(i);
                setEditing(null);
              }}
              style={{
                position: 'relative',
                flex: '0 0 auto',
                width: 64,
                height: 64,
                padding: 0,
                borderRadius: 10,
                overflow: 'hidden',
                cursor: 'pointer',
                background: ad.is_video ? '#000' : '#f5f5f5',
                border: i === current ? `2.5px solid ${PINK}` : '2.5px solid transparent',
              }}
            >
              {ad.is_video ? (
                <span style={{ color: '#fff', fontSize: 18 }}>▶</span>
              ) : (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={ad.image_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              )}
            </button>
          ))}
          {editable && !full && (
            <button
              type="button"
              aria-label="Add another ad"
              disabled={!!busy}
              onClick={() => setAdding((v) => !v)}
              style={{
                flex: '0 0 auto',
                width: 64,
                height: 64,
                borderRadius: 10,
                border: `1.5px dashed ${PINK}`,
                background: '#fff',
                color: PINK,
                fontSize: 24,
                cursor: busy ? 'default' : 'pointer',
              }}
            >
              +
            </button>
          )}
        </div>
        {adding && addMenu}

        <div style={{ fontSize: 12.5, color: '#666', marginTop: 10, lineHeight: 1.45 }}>
          {layout === 'abo'
            ? `Each of these ${ads.length} ads gets its own ad set${each ? ` and ${naira(each)} a day` : ''}, so every one gets a fair test.`
            : `All ${ads.length} ads run together in one ad set${daily ? ` and share its ${naira(daily)} a day` : ''}. Meta shows more of whichever does best.`}
          {editable && (
            <>
              {' '}
              <button type="button" onClick={() => setChangingLayout((v) => !v)} style={linkBtn}>
                {changingLayout ? 'Done' : 'Change'}
              </button>
            </>
          )}
        </div>
        {editable && changingLayout && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: 8, fontSize: 12.5 }}>
            <label style={{ display: 'flex', gap: 6, alignItems: 'center', cursor: 'pointer' }}>
              <input
                type="radio"
                checked={layout === 'single_ad_set'}
                disabled={!!busy}
                onChange={() => run('Saving…', () => CampaignService.setPlanAdLayout(planId!, 'single_ad_set'))}
              />
              Together in one ad set (best for small budgets)
            </label>
            <label
              title={canSplit ? undefined : 'Each ad set needs at least ₦2,000 a day'}
              style={{
                display: 'flex',
                gap: 6,
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
              Each in its own ad set{each ? `, ${naira(each)} a day each` : ''}
              {!canSplit && ' (needs a bigger budget)'}
            </label>
          </div>
        )}
        {pendingSteps}
      </div>
    </div>
  );
}
