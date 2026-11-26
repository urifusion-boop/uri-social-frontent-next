/**
 * The "Ads" step: see the ads before the plan.
 *
 * Live-asked on staging (2026-11-25): "we should be able to see the ads creative first before it
 * builds a plan". Jane used to make the ads only on Finalize, after her follow-up questions, so the
 * first ad anyone saw came at the very end. Here she makes them as soon as the Creative step is
 * answered, from the same answers the plan uses, and each shows the moment it's ready. The owner
 * can open one full size, change its words, make it again or remove it; Finalize then builds the
 * plan with exactly these ads (creative_source 'preview'): nothing is made or charged twice.
 *
 * Jane starts on her own only the first time. If an answer changes afterwards, the ads already made
 * stay and the owner chooses: make new ones (and pay for them) or keep these.
 */
'use client';
import { useEffect, useRef, useState } from 'react';
import { AdPreview, CampaignService, PlannedAd, PreviewAd } from '@/src/api/CampaignService';
import StyleLibrary, { resolvedStyles, styleName, useAdStyles } from './StyleLibrary';
import ZoomableImage from '@/src/components/app/atoms/ZoomableImage';
import { EventBus, EVENTS } from '@/src/services/EventBus';

const PINK = '#C2185B';
const INK = '#1a0a12';
const MUTED = '#7a7270';
const LINE = '#ece8e6';
const POLL_MS = 3000;

/** The ads made for this run, and the answers they were made from. */
export interface WizardAdPreviewRef {
  id: string;
  /** adPreviewKey() of the answers when they were made. */
  key: string;
}

export interface WizardAdsInputs {
  count: number;
  description: string;
  city: string;
  objective: string;
  destination_type: string;
  budget_ngn: number;
  vsg01_format_id: string;
  /** Several ads: what each says and its style ('' = Jane's pick), from the Style step. */
  ads?: PlannedAd[];
  style_mode?: string;
}

/** Everything the ads are made from. When it changes, the ads may no longer fit. */
export function adPreviewKey(i: WizardAdsInputs): string {
  return JSON.stringify([
    i.count,
    i.description.trim(),
    i.city.trim(),
    i.objective,
    i.destination_type,
    i.vsg01_format_id,
    // Older saved keys had no styles: only add them when there are several ads, so those still match.
    ...(i.ads?.length ? [i.ads, i.style_mode ?? 'jane'] : []),
  ]);
}

const ANGLE_LABEL: Record<string, string> = {
  problem: 'Problem first',
  offer: 'The offer',
  outcome: 'The result',
  versus: 'Before & after',
  announcement: 'News',
  post: 'In your voice',
};

function errorText(e: unknown, fallback: string): string {
  const d = (e as { response?: { data?: { detail?: unknown } } })?.response?.data?.detail;
  return typeof d === 'string' && d ? d : fallback;
}

export default function WizardAdsStep({
  inputs,
  value,
  onChange,
  onReadyChange,
  otherPlatforms = [],
}: {
  inputs: WizardAdsInputs;
  value: WizardAdPreviewRef | null;
  onChange: (next: WizardAdPreviewRef | null) => void;
  /** True once there is at least one finished ad and Jane isn't working on any. */
  onReadyChange: (ready: boolean) => void;
  /** Platforms in this campaign whose ads Jane still makes on Finalize (TikTok, Google). */
  otherPlatforms?: string[];
}) {
  const key = adPreviewKey(inputs);
  const [preview, setPreview] = useState<AdPreview | null>(null);
  const [error, setError] = useState('');
  const [starting, setStarting] = useState(false);
  const [busy, setBusy] = useState<number | null>(null);
  const [editing, setEditing] = useState<{ index: number; headline: string; text: string; error: string } | null>(null);
  const startedRef = useRef(false);
  const [restyling, setRestyling] = useState<number | null>(null);
  // The style library: to send each ad's style as it was shown on the Style step (Jane's picks
  // included), and for "Change style" on an ad.
  const { styles, failed: stylesFailed } = useAdStyles(inputs.description);
  const stylesSettled = Boolean(styles || stylesFailed);

  const start = async () => {
    setStarting(true);
    setError('');
    try {
      const { style_mode: _mode, ads: planned, ...rest } = inputs;
      void _mode;
      const shown = planned?.length ? resolvedStyles(planned, styles) : [];
      const p = await CampaignService.startAdPreview({
        ...rest,
        platform: 'meta',
        ...(planned?.length
          ? { count: planned.length, ads: planned.map((a, i) => ({ angle: a.angle, vsg01_format_id: shown[i] || '' })) }
          : {}),
      });
      setPreview(p);
      onChange({ id: p.id, key });
    } catch (e) {
      setError(errorText(e, "Jane couldn't start on your ads just now. Try again in a moment."));
    } finally {
      setStarting(false);
    }
  };

  // First visit: Jane starts on her own (once the styles are known, for several ads). After that,
  // never without the owner asking.
  useEffect(() => {
    if (value || startedRef.current) return;
    if (inputs.ads?.length && !stylesSettled) return;
    startedRef.current = true;
    void start();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stylesSettled]);

  // Load the saved ads, then follow them while Jane works.
  const running = preview?.status === 'running';
  useEffect(() => {
    if (!value?.id) return;
    let alive = true;
    let timer: ReturnType<typeof setTimeout> | undefined;
    let seen = -1;
    const load = async () => {
      try {
        const p = await CampaignService.getAdPreview(value.id);
        if (!alive) return;
        setPreview(p);
        // Each finished ad used credits: let the header balance catch up.
        const made = p.results.filter((r) => !r.redoing).length;
        if (seen >= 0 && made > seen)
          EventBus.emit(EVENTS.CREDIT_CONSUMED, { amount: made - seen, operation: 'ad_preview' });
        seen = made;
        if (p.status === 'running') timer = setTimeout(load, POLL_MS);
      } catch (e) {
        if (!alive) return;
        const status = (e as { response?: { status?: number } })?.response?.status;
        if (status === 404) {
          // Gone (another brand, or deleted): offer to start over rather than wait forever.
          setPreview(null);
          onChange(null);
          setError("Those ads aren't available any more. Ask Jane for new ones.");
          return;
        }
        setError(errorText(e, "Couldn't load your ads. Retrying…"));
        timer = setTimeout(load, POLL_MS * 2);
      }
    };
    void load();
    return () => {
      alive = false;
      if (timer) clearTimeout(timer);
    };
    // Re-follow whenever an action restarts Jane (make again).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value?.id, running]);

  const results = preview?.results ?? [];
  const ready = Boolean(preview && preview.status !== 'running' && results.length > 0);
  useEffect(() => onReadyChange(ready), [ready, onReadyChange]);

  const stale = Boolean(value && value.key !== key && results.length > 0);
  const pending = preview?.status === 'running' ? Math.max(0, preview.count - results.length) : 0;

  const act = async (index: number, fn: () => Promise<AdPreview | PreviewAd>, fallback: string) => {
    setBusy(index);
    setError('');
    try {
      const out = await fn();
      if ('results' in out) setPreview(out);
      else setPreview((p) => (p ? { ...p, results: p.results.map((r, i) => (i === index ? out : r)) } : p));
      return true;
    } catch (e) {
      setError(errorText(e, fallback));
      return false;
    } finally {
      setBusy(null);
    }
  };

  const saveWords = async () => {
    if (!editing || !value) return;
    const { index, headline, text } = editing;
    setBusy(index);
    try {
      const out = await CampaignService.editPreviewAd(value.id, index, headline, text);
      setPreview((p) => (p ? { ...p, results: p.results.map((r, i) => (i === index ? out : r)) } : p));
      setEditing(null);
    } catch (e) {
      setEditing({ ...editing, error: errorText(e, "Couldn't save those words. Try again.") });
    } finally {
      setBusy(null);
    }
  };

  const btn = (kind: 'primary' | 'quiet' | 'danger', disabled = false): React.CSSProperties => ({
    border: kind === 'primary' ? 'none' : `1px solid ${LINE}`,
    background: kind === 'primary' ? (disabled ? '#f0c6d6' : PINK) : '#fff',
    color: kind === 'primary' ? '#fff' : kind === 'danger' ? '#b3261e' : INK,
    borderRadius: 8,
    padding: '6px 8px',
    fontSize: 12,
    fontWeight: 700,
    cursor: disabled ? 'not-allowed' : 'pointer',
    fontFamily: 'inherit',
    opacity: disabled && kind !== 'primary' ? 0.5 : 1,
  });

  const count = inputs.count;
  const creditsLine = `${count} ad${count === 1 ? '' : 's'} · ${count} credit${count === 1 ? '' : 's'}`;

  return (
    <div>
      <style>{`@keyframes wzAdsPulse{0%,100%{opacity:.55}50%{opacity:1}}`}</style>
      <div
        style={{
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'space-between',
          gap: 12,
          flexWrap: 'wrap',
        }}
      >
        <p style={{ margin: 0, fontSize: 12.5, color: MUTED, lineHeight: 1.5, maxWidth: 560 }}>
          {running
            ? `Jane is making your ad${count === 1 ? '' : 's'} from your answers. Each one shows here as soon as it's ready.`
            : 'Your ads, made from your answers. Open one to see it full size, change its words, or make it again. Jane builds the plan with these next.'}
        </p>
        {preview && (
          <span style={{ fontSize: 12, fontWeight: 700, color: running ? PINK : '#15803d' }}>
            {running
              ? `${results.filter((r) => !r.redoing).length} of ${preview.count} ready`
              : `${results.length} ready`}
          </span>
        )}
      </div>

      {otherPlatforms.length > 0 && (
        <div
          style={{
            marginTop: 10,
            fontSize: 12,
            color: MUTED,
            background: '#f7f5f8',
            borderRadius: 9,
            padding: '8px 10px',
          }}
        >
          These run on Instagram & Facebook. Jane makes the {otherPlatforms.join(' and ')} ad
          {otherPlatforms.length > 1 ? 's' : ''} when she builds{' '}
          {otherPlatforms.length > 1 ? 'those plans' : 'that plan'}.
        </div>
      )}

      {stale && (
        <div
          role="status"
          style={{
            marginTop: 12,
            border: '1px solid rgba(194,24,91,.25)',
            background: 'rgba(194,24,91,.05)',
            borderRadius: 12,
            padding: '10px 12px',
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            flexWrap: 'wrap',
          }}
        >
          <span style={{ fontSize: 12.5, color: INK, flex: '1 1 240px', lineHeight: 1.45 }}>
            You changed some answers after Jane made these ads, so they may not match any more.
          </span>
          <button type="button" style={btn('quiet')} onClick={() => value && onChange({ ...value, key })}>
            Keep these
          </button>
          <button type="button" style={btn('primary', starting)} disabled={starting} onClick={() => void start()}>
            {starting ? 'Starting…' : `Make new ads (${creditsLine})`}
          </button>
        </div>
      )}

      {error && (
        <div
          role="alert"
          style={{
            marginTop: 12,
            fontSize: 12.5,
            color: '#b3261e',
            background: '#fdecea',
            borderRadius: 9,
            padding: '8px 10px',
          }}
        >
          {error}
        </div>
      )}

      {!preview && !error && (
        <div style={{ marginTop: 14, fontSize: 12.5, color: MUTED }}>
          {starting ? 'Asking Jane…' : 'Loading your ads…'}
        </div>
      )}

      {!preview && error && !value && (
        <button
          type="button"
          style={{ ...btn('primary', starting), marginTop: 12 }}
          disabled={starting}
          onClick={() => void start()}
        >
          {starting ? 'Starting…' : `Try again (${creditsLine})`}
        </button>
      )}

      {preview && (
        <div
          style={{
            marginTop: 14,
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(210px, 1fr))',
            gap: 12,
          }}
        >
          {results.map((ad, i) => {
            const isEditing = editing?.index === i;
            const working = busy === i || ad.redoing;
            return (
              <div
                key={`${ad.image_url}-${i}`}
                style={{
                  border: `1px solid ${LINE}`,
                  borderRadius: 14,
                  overflow: 'hidden',
                  background: '#fff',
                  display: 'flex',
                  flexDirection: 'column',
                }}
              >
                {ad.redoing ? (
                  <div
                    aria-label={`Making ad ${i + 1} again`}
                    style={{
                      aspectRatio: '4 / 5',
                      background: '#f4eef1',
                      animation: 'wzAdsPulse 1.4s ease-in-out infinite',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: 12,
                      color: MUTED,
                    }}
                  >
                    Making it again…
                  </div>
                ) : (
                  <ZoomableImage
                    src={ad.image_url}
                    alt={ad.headline || `Ad ${i + 1}`}
                    style={{
                      width: '100%',
                      aspectRatio: '4 / 5',
                      objectFit: 'contain',
                      background: '#f7f5f8',
                      display: 'block',
                    }}
                  />
                )}
                <div style={{ padding: '10px 12px 12px', display: 'flex', flexDirection: 'column', gap: 6, flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                    <span
                      style={{
                        fontSize: 10.5,
                        fontWeight: 800,
                        letterSpacing: '.06em',
                        textTransform: 'uppercase',
                        color: PINK,
                      }}
                    >
                      Ad {i + 1}
                    </span>
                    {ANGLE_LABEL[ad.angle] && (
                      <span
                        style={{
                          fontSize: 11,
                          color: MUTED,
                          background: '#f7f5f8',
                          borderRadius: 6,
                          padding: '1px 6px',
                        }}
                      >
                        {ANGLE_LABEL[ad.angle]}
                      </span>
                    )}
                  </div>
                  {(ad.style || ad.angle || inputs.vsg01_format_id) && styles && (
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        gap: 8,
                        background: '#f7f5f8',
                        borderRadius: 8,
                        padding: '6px 8px',
                        fontSize: 12,
                        color: MUTED,
                      }}
                    >
                      <span style={{ minWidth: 0 }}>
                        Style: {ad.style ? styleName(ad.style, styles.formats) : 'Jane’s choice'}
                      </span>
                      <button
                        type="button"
                        disabled={working || running}
                        title="Make this ad again in another style · uses credits like Make again"
                        onClick={() => setRestyling(i)}
                        style={{
                          background: 'none',
                          border: 'none',
                          padding: 0,
                          color: working || running ? '#c9a7b6' : PINK,
                          fontWeight: 700,
                          fontSize: 12,
                          cursor: working || running ? 'default' : 'pointer',
                          fontFamily: 'inherit',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        Change style
                      </button>
                    </div>
                  )}
                  {restyling === i && styles && value && (
                    <StyleLibrary
                      styles={styles}
                      title={`Change the style of Ad ${i + 1}`}
                      subtitle="Jane makes this ad again in the style you pick. The others stay as they are."
                      angle={ad.angle || undefined}
                      current={ad.style}
                      usedBy={results.reduce<Record<string, number[]>>((m, r, k) => {
                        if (r.style) m[r.style] = [...(m[r.style] ?? []), k];
                        return m;
                      }, {})}
                      useOneLabel={`Make it in this style${styles.prices ? '' : ' · 1 credit'}`}
                      onUseOne={(id) => {
                        setRestyling(null);
                        void act(
                          i,
                          () => CampaignService.redoPreviewAd(value.id, i, id),
                          "Jane couldn't make that one again just now."
                        );
                      }}
                      onClose={() => setRestyling(null)}
                    />
                  )}
                  {isEditing ? (
                    <>
                      <input
                        aria-label="Headline"
                        value={editing.headline}
                        maxLength={40}
                        onChange={(e) => setEditing({ ...editing, headline: e.target.value, error: '' })}
                        style={{
                          border: `1px solid ${LINE}`,
                          borderRadius: 8,
                          padding: '7px 9px',
                          fontSize: 13,
                          fontWeight: 700,
                          fontFamily: 'inherit',
                        }}
                      />
                      <textarea
                        aria-label="The ad's text"
                        value={editing.text}
                        rows={4}
                        onChange={(e) => setEditing({ ...editing, text: e.target.value, error: '' })}
                        style={{
                          border: `1px solid ${LINE}`,
                          borderRadius: 8,
                          padding: '7px 9px',
                          fontSize: 12.5,
                          lineHeight: 1.45,
                          fontFamily: 'inherit',
                          resize: 'vertical',
                        }}
                      />
                      <span style={{ fontSize: 11, color: MUTED }}>{editing.headline.length}/40</span>
                      {editing.error && <span style={{ fontSize: 12, color: '#b3261e' }}>{editing.error}</span>}
                      <div style={{ display: 'flex', gap: 6, marginTop: 'auto' }}>
                        <button
                          type="button"
                          style={btn('primary', busy === i)}
                          disabled={busy === i}
                          onClick={() => void saveWords()}
                        >
                          {busy === i ? 'Saving…' : 'Save'}
                        </button>
                        <button type="button" style={btn('quiet')} onClick={() => setEditing(null)}>
                          Cancel
                        </button>
                      </div>
                    </>
                  ) : (
                    <>
                      <div style={{ fontSize: 13.5, fontWeight: 800, color: INK, lineHeight: 1.3 }}>{ad.headline}</div>
                      <div
                        style={{
                          fontSize: 12.5,
                          color: '#4a4245',
                          lineHeight: 1.45,
                          display: '-webkit-box',
                          WebkitLineClamp: 4,
                          WebkitBoxOrient: 'vertical',
                          overflow: 'hidden',
                        }}
                        title={ad.primary_text}
                      >
                        {ad.primary_text}
                      </div>
                      {ad.cta && (
                        <span
                          style={{
                            alignSelf: 'flex-start',
                            fontSize: 11.5,
                            fontWeight: 700,
                            color: INK,
                            border: `1px solid ${LINE}`,
                            borderRadius: 6,
                            padding: '2px 8px',
                          }}
                        >
                          {ad.cta}
                        </span>
                      )}
                      <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap', marginTop: 'auto', paddingTop: 4 }}>
                        <button
                          type="button"
                          style={btn('quiet', working || running)}
                          disabled={working || running}
                          onClick={() =>
                            setEditing({ index: i, headline: ad.headline, text: ad.primary_text, error: '' })
                          }
                        >
                          Edit words
                        </button>
                        <button
                          type="button"
                          title="Uses 1 credit"
                          style={btn('quiet', working || running)}
                          disabled={working || running}
                          onClick={() =>
                            value &&
                            void act(
                              i,
                              () => CampaignService.redoPreviewAd(value.id, i),
                              "Jane couldn't make that one again just now."
                            )
                          }
                        >
                          {ad.redoing ? 'Making…' : 'Make again'}
                        </button>
                        {results.length > 1 && (
                          <button
                            type="button"
                            style={btn('danger', working || running)}
                            disabled={working || running}
                            onClick={() =>
                              value &&
                              void act(
                                i,
                                () => CampaignService.removePreviewAd(value.id, i),
                                "Couldn't remove that ad."
                              )
                            }
                          >
                            Remove
                          </button>
                        )}
                      </div>
                    </>
                  )}
                </div>
              </div>
            );
          })}
          {Array.from({ length: pending }, (_, k) => (
            <div
              key={`pending-${k}`}
              aria-label={`Making ad ${results.length + k + 1}`}
              style={{
                border: `1px solid ${LINE}`,
                borderRadius: 14,
                overflow: 'hidden',
                background: '#fff',
              }}
            >
              <div
                style={{
                  aspectRatio: '4 / 5',
                  background: '#f4eef1',
                  animation: 'wzAdsPulse 1.4s ease-in-out infinite',
                }}
              />
              <div style={{ padding: '10px 12px 14px', fontSize: 12.5, color: MUTED }}>
                {k === 0 ? `Making ad ${results.length + 1}…` : `Ad ${results.length + k + 1} next`}
              </div>
            </div>
          ))}
        </div>
      )}

      {preview?.status === 'failed' && (
        <div
          role="alert"
          style={{
            marginTop: 12,
            fontSize: 12.5,
            color: '#8a4b00',
            background: '#fff6e5',
            borderRadius: 9,
            padding: '8px 10px',
            display: 'flex',
            gap: 10,
            alignItems: 'center',
            flexWrap: 'wrap',
          }}
        >
          <span style={{ flex: '1 1 240px' }}>
            {results.length
              ? `${preview.error || "Jane couldn't finish every ad."} You can carry on with the ${results.length === 1 ? 'one' : results.length} she made.`
              : preview.error || "Jane couldn't make your ads just now."}
          </span>
          {results.length === 0 && (
            <button type="button" style={btn('primary', starting)} disabled={starting} onClick={() => void start()}>
              {starting ? 'Starting…' : 'Try again'}
            </button>
          )}
        </div>
      )}

      {preview && (
        <p style={{ margin: '12px 0 0', fontSize: 11.5, color: MUTED }}>
          {styles?.prices
            ? 'Each ad uses the credits its style costs and is also kept in Creatives. Making one again, or in another style, costs the same again.'
            : 'Each ad uses 1 credit and is also kept in Creatives. Making one again uses 1 more.'}
        </p>
      )}
    </div>
  );
}
