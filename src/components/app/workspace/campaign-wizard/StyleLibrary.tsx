'use client';

/**
 * The full ad-style library, opened for one ad (or for all of them) on the Style step when the
 * campaign tests several ads, and from "Change style" on the Ads step.
 *
 * Live-asked on staging (2026-11-26): several ads were made with no say in how they looked, and
 * came out like ordinary posts. Each ad is now drawn in a style from this library: Jane's pick for
 * what the ad says, one style for all of them, or one the owner picks for each. Search, filters,
 * "best for this ad" first, a large preview, and the reason any style can't be used.
 */
import { useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { CampaignService, type AdFormat, type PlannedAd } from '@/src/api/CampaignService';
import { STYLE_INFO } from './WizardStyleStep';

const PINK = '#C2185B';
const INK = '#1a0a12';
const MUTED = '#6e6468';
const LINE = '#ede6e9';
const SOFT = '#f7f2f4';
const OK = '#1a7f37';

/** The ways in a campaign tests, in the order the backend makes them (concepts.ANGLES). */
export const ANGLE_ORDER = ['problem', 'offer', 'outcome', 'versus', 'announcement', 'post'] as const;
export const ANGLE_LABEL: Record<string, string> = {
  problem: 'Problem first',
  offer: 'The offer',
  outcome: 'The result',
  versus: 'Before & after',
  announcement: 'News',
  post: 'In your voice',
};
export const MIN_ADS = 2;
export const MAX_ADS = ANGLE_ORDER.length;

/** Words people search for, beyond each style's name and "best for". */
const SEARCH_WORDS: Record<string, string> = {
  'SEED-099': 'event webinar class date launch',
  'SEED-104': 'course school admission register enrol',
  'SEED-100': 'discount sale promo deal offer percent',
  'SEED-096': 'price product new cheaper',
  'SEED-081': 'cost save money compare',
  'SEED-101': 'problem fix list pain',
  'SEED-080': 'problem fix solution',
  'SEED-075': 'versus compare old new before after',
  'SEED-105': 'bold claim big text billboard',
  'SEED-102': 'person face portrait message',
  'SEED-097': 'quote line text minimal',
  'SEED-077': 'news announcement launch headline',
  'SEED-103': 'service action real scene result',
  'SEED-106': 'faq question answer',
  'SEED-093': 'review testimonial product stars',
  'SEED-074': 'testimonial customer quote',
  'SEED-087': 'chat whatsapp message conversation',
  'SEED-089': 'funny humour meme fun',
  'SEED-098': 'behind scenes team work process',
};

const GROUPS: { key: string; label: string }[] = [
  { key: 'all', label: 'All styles' },
  { key: 'events', label: 'Events & courses' },
  { key: 'offers', label: 'Offers & prices' },
  { key: 'problems', label: 'Problems you solve' },
  { key: 'bold', label: 'Bold message' },
  { key: 'proof', label: 'Proof & reviews' },
  { key: 'stories', label: 'Stories & fun' },
];

export interface AdStyles {
  formats: AdFormat[];
  /** Styles this brief can use, best ranked first. */
  ready: string[];
  /** Why a style can't be used ("Needs your product photo", "Needs an event with a date in your brief"). */
  why: Record<string, string>;
  forAngles: Record<string, string[]>;
  prices: Record<string, number> | null;
}

/** The style library and what this brief can use, loaded once per brief. */
export function useAdStyles(description: string): { styles: AdStyles | null; failed: boolean } {
  const [styles, setStyles] = useState<AdStyles | null>(null);
  const [failed, setFailed] = useState(false);
  useEffect(() => {
    let alive = true;
    setFailed(false);
    Promise.all([
      CampaignService.getAdFormats(),
      CampaignService.suggestAdFormat({ description: description.trim() || undefined, is_video: false }),
    ])
      .then(([all, s]) => {
        if (!alive) return;
        const formats = all.formats.filter((f) => f.status === 'live' && STYLE_INFO[f.format_id]);
        const needs = s.needs_in_brief ?? {};
        const ranked = [s.suggested, ...s.alternatives].filter(Boolean).map((f) => (f as AdFormat).format_id);
        const ready = ranked.filter((id) => !needs[id] && STYLE_INFO[id]);
        const why: Record<string, string> = {};
        for (const f of formats) {
          if (needs[f.format_id]) why[f.format_id] = needs[f.format_id];
          else if (!ranked.includes(f.format_id))
            why[f.format_id] = f.requires.includes('product_photo')
              ? 'Needs your product photo'
              : f.requires.includes('real_customer_photo')
                ? 'Needs a photo of a real customer'
                : "Doesn't fit this ad";
        }
        setStyles({
          formats,
          ready,
          why,
          forAngles: s.for_angles ?? {},
          prices: s.billing_mode === 'on' && s.credits ? s.credits : null,
        });
      })
      .catch(() => alive && setFailed(true));
    return () => {
      alive = false;
    };
  }, [description]);
  return { styles, failed };
}

/** The ads as planned: the saved plan when it matches the count, else filled in so it does
 *  (each new ad takes the next way in not yet used, with Jane's pick). */
export function plannedAds(count: number, saved?: PlannedAd[]): PlannedAd[] {
  const n = Math.max(MIN_ADS, Math.min(MAX_ADS, count));
  const out = (saved ?? []).slice(0, n).map((a) => ({ angle: a.angle, vsg01_format_id: a.vsg01_format_id || '' }));
  while (out.length < n) {
    const used = new Set(out.map((a) => a.angle));
    out.push({ angle: ANGLE_ORDER.find((k) => !used.has(k)) ?? 'problem', vsg01_format_id: '' });
  }
  return out;
}

/** Jane's style for each ad: the best style for what it says that no earlier ad has taken
 *  (the backend's concepts.jane_styles, so what's shown is what's made). */
export function janeStyles(ads: PlannedAd[], styles: AdStyles | null): string[] {
  if (!styles) return ads.map(() => '');
  const taken = new Set<string>();
  return ads.map((a) => {
    const prefs = (styles.forAngles[a.angle] ?? []).filter((f) => styles.ready.includes(f));
    const pick =
      prefs.find((f) => !taken.has(f)) ?? styles.ready.find((f) => !taken.has(f)) ?? prefs[0] ?? styles.ready[0] ?? '';
    if (pick) taken.add(pick);
    return pick;
  });
}

/** Each ad's style as it will be made: the owner's choice, else Jane's. */
export function resolvedStyles(ads: PlannedAd[], styles: AdStyles | null): string[] {
  const jane = janeStyles(ads, styles);
  return ads.map((a, i) => a.vsg01_format_id || jane[i]);
}

export function styleName(id: string, formats?: AdFormat[]): string {
  return formats?.find((f) => f.format_id === id)?.name ?? (id ? 'Your chosen style' : 'Jane chooses');
}

export default function StyleLibrary({
  styles,
  title,
  subtitle,
  angle,
  current,
  usedBy = {},
  onUseOne,
  onUseAll,
  useOneLabel = 'Use for this ad',
  onClose,
}: {
  styles: AdStyles;
  title: string;
  subtitle?: string;
  /** What the ad says: its best styles come first. Absent when choosing for all ads. */
  angle?: string;
  current?: string;
  /** Which ads already use each style (shown as "AD 1" on the card). */
  usedBy?: Record<string, number[]>;
  onUseOne?: (formatId: string) => void;
  onUseAll?: (formatId: string) => void;
  useOneLabel?: string;
  onClose: () => void;
}) {
  // The styles made for what this ad says, best first (ones this brief can't support yet show greyed,
  // with what's missing), then the other styles that suit this brief best.
  const angleStyles = angle ? (styles.forAngles[angle] ?? []) : [];
  const fits = angleStyles.filter((f) => styles.ready.includes(f));
  const bestList = [...angleStyles, ...styles.ready.filter((f) => !angleStyles.includes(f))].slice(
    0,
    Math.max(6, angleStyles.length)
  );
  const [filter, setFilter] = useState(angle && bestList.length ? 'fits' : 'all');
  const [query, setQuery] = useState('');
  const [sel, setSel] = useState(current && !styles.why[current] ? current : (fits[0] ?? styles.ready[0] ?? ''));

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.stopPropagation();
        onClose();
      }
    };
    window.addEventListener('keydown', onKey, true);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey, true);
      document.body.style.overflow = prev;
    };
  }, [onClose]);

  const order = Object.keys(STYLE_INFO);
  const list = useMemo(() => {
    const q = query.trim().toLowerCase();
    let out = styles.formats;
    if (q)
      out = out.filter((f) =>
        `${f.name} ${STYLE_INFO[f.format_id]?.bestFor ?? ''} ${SEARCH_WORDS[f.format_id] ?? ''}`
          .toLowerCase()
          .includes(q)
      );
    else if (filter === 'fits') out = out.filter((f) => bestList.includes(f.format_id));
    else if (filter !== 'all') out = out.filter((f) => STYLE_INFO[f.format_id]?.group === filter);
    const rank = (f: AdFormat) =>
      fits.includes(f.format_id)
        ? fits.indexOf(f.format_id)
        : styles.why[f.format_id]
          ? 100 + angleStyles.indexOf(f.format_id)
          : 50 + styles.ready.indexOf(f.format_id);
    return [...out].sort((a, b) => rank(a) - rank(b) || order.indexOf(a.format_id) - order.indexOf(b.format_id));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [styles, filter, query, angle]);

  const selected = styles.formats.find((f) => f.format_id === sel);
  const price = (id: string) =>
    styles.prices?.[id] !== undefined ? ` · ${styles.prices[id]} credit${styles.prices[id] === 1 ? '' : 's'}` : '';

  const chips = [...(angle && bestList.length ? [{ key: 'fits', label: '✦ Best for this ad' }] : []), ...GROUPS];

  const body = (
    <div
      role="presentation"
      onClick={(e) => {
        e.stopPropagation();
        if (e.target === e.currentTarget) onClose();
      }}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 2000,
        background: 'rgba(26,10,18,.55)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 12,
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        style={{
          background: '#fff',
          borderRadius: 16,
          width: 'min(1040px, 100%)',
          height: 'min(760px, 100%)',
          display: 'grid',
          gridTemplateRows: 'auto auto 1fr auto',
          overflow: 'hidden',
          fontFamily: 'inherit',
        }}
      >
        <div
          style={{
            padding: '16px 18px 10px',
            display: 'flex',
            justifyContent: 'space-between',
            gap: 12,
            borderBottom: `1px solid ${LINE}`,
          }}
        >
          <div>
            <div style={{ fontSize: 17, fontWeight: 800, color: INK }}>{title}</div>
            {subtitle && <div style={{ fontSize: 13, color: MUTED, marginTop: 3 }}>{subtitle}</div>}
          </div>
          <button
            type="button"
            aria-label="Close"
            onClick={onClose}
            style={{
              border: 'none',
              background: SOFT,
              borderRadius: 8,
              width: 32,
              height: 32,
              cursor: 'pointer',
              fontSize: 15,
              flexShrink: 0,
            }}
          >
            ✕
          </button>
        </div>

        <div style={{ padding: '12px 18px', display: 'grid', gap: 10, borderBottom: `1px solid ${LINE}` }}>
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search styles, e.g. discount, review, event, chat"
            aria-label="Search styles"
            style={{
              width: '100%',
              padding: '9px 12px',
              borderRadius: 9,
              border: `1px solid ${LINE}`,
              background: SOFT,
              fontSize: 13.5,
              fontFamily: 'inherit',
              boxSizing: 'border-box',
            }}
          />
          <div style={{ display: 'flex', gap: 6, overflowX: 'auto', paddingBottom: 2, scrollbarWidth: 'none' }}>
            {chips.map((c) => {
              const on = !query.trim() && filter === c.key;
              return (
                <button
                  key={c.key}
                  type="button"
                  onClick={() => {
                    setQuery('');
                    setFilter(c.key);
                  }}
                  style={{
                    flexShrink: 0,
                    border: `1px solid ${on ? INK : LINE}`,
                    borderRadius: 999,
                    padding: '5px 11px',
                    fontSize: 12.5,
                    fontWeight: 600,
                    cursor: 'pointer',
                    fontFamily: 'inherit',
                    background: on ? INK : '#fff',
                    color: on ? '#fff' : MUTED,
                    whiteSpace: 'nowrap',
                  }}
                >
                  {c.label}
                </button>
              );
            })}
          </div>
        </div>

        <div className="wz-lib-body" style={{ display: 'grid', minHeight: 0 }}>
          <style>{`.wz-lib-body{grid-template-columns:minmax(0,1fr) 300px}.wz-lib-prev{display:grid}
@media (max-width:760px){.wz-lib-body{grid-template-columns:1fr}.wz-lib-prev{display:none!important}}`}</style>
          <div style={{ overflow: 'auto', padding: '14px 18px', display: 'grid', gap: 12, alignContent: 'start' }}>
            {filter === 'fits' && !query.trim() && angle && (
              <div style={{ fontSize: 13, color: MUTED }}>
                Styles made for “{ANGLE_LABEL[angle] ?? angle}” first, then others that suit your brief.{' '}
                <button
                  type="button"
                  onClick={() => setFilter('all')}
                  style={{
                    background: 'none',
                    border: 'none',
                    padding: 0,
                    color: PINK,
                    fontWeight: 700,
                    cursor: 'pointer',
                    fontFamily: 'inherit',
                    fontSize: 13,
                  }}
                >
                  See all {styles.formats.length} styles
                </button>
              </div>
            )}
            {list.length === 0 ? (
              <div style={{ fontSize: 13, color: MUTED, padding: '20px 0' }}>
                No style matches “{query}”. Try another word, or{' '}
                <button
                  type="button"
                  onClick={() => {
                    setQuery('');
                    setFilter('all');
                  }}
                  style={{
                    background: 'none',
                    border: 'none',
                    padding: 0,
                    color: PINK,
                    fontWeight: 700,
                    cursor: 'pointer',
                    fontFamily: 'inherit',
                    fontSize: 13,
                  }}
                >
                  show all styles
                </button>
                .
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: 10 }}>
                {list.map((f) => {
                  const off = styles.why[f.format_id];
                  const on = sel === f.format_id;
                  const used = usedBy[f.format_id] ?? [];
                  const fitIdx = fits.indexOf(f.format_id);
                  return (
                    <button
                      key={f.format_id}
                      type="button"
                      aria-pressed={on}
                      aria-disabled={Boolean(off)}
                      onClick={() => !off && setSel(f.format_id)}
                      style={{
                        position: 'relative',
                        textAlign: 'left',
                        background: '#fff',
                        border: on ? `2px solid ${PINK}` : `2px solid ${LINE}`,
                        boxShadow: on ? '0 0 0 3px #FBE3EE' : undefined,
                        borderRadius: 11,
                        padding: 0,
                        overflow: 'hidden',
                        cursor: off ? 'not-allowed' : 'pointer',
                        display: 'flex',
                        flexDirection: 'column',
                        fontFamily: 'inherit',
                      }}
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={`/ad-styles/${f.format_id}.jpg`}
                        alt={`${f.name} example`}
                        loading="lazy"
                        style={{
                          width: '100%',
                          aspectRatio: '1 / 1',
                          objectFit: 'cover',
                          display: 'block',
                          background: SOFT,
                          filter: off ? 'grayscale(1)' : undefined,
                          opacity: off ? 0.4 : 1,
                        }}
                      />
                      {used.length > 0 && (
                        <span
                          style={{ position: 'absolute', top: 6, left: 6, display: 'flex', gap: 4, flexWrap: 'wrap' }}
                        >
                          {used.map((i) => (
                            <span
                              key={i}
                              style={{
                                background: INK,
                                color: '#fff',
                                fontSize: 10,
                                fontWeight: 800,
                                padding: '2px 6px',
                                borderRadius: 999,
                              }}
                            >
                              AD {i + 1}
                            </span>
                          ))}
                        </span>
                      )}
                      {on && (
                        <span
                          style={{
                            position: 'absolute',
                            top: 6,
                            right: 6,
                            width: 22,
                            height: 22,
                            borderRadius: '50%',
                            background: PINK,
                            color: '#fff',
                            display: 'grid',
                            placeItems: 'center',
                            fontSize: 12,
                            fontWeight: 800,
                          }}
                        >
                          ✓
                        </span>
                      )}
                      <span style={{ padding: '7px 8px 9px', display: 'grid', gap: 3 }}>
                        <span style={{ fontSize: 12.5, fontWeight: 700, color: off ? '#a79ea2' : INK }}>
                          {f.name}
                          {!off && price(f.format_id)}
                        </span>
                        {off ? (
                          <span style={{ fontSize: 11, color: '#9a3412', fontWeight: 600 }}>{off}</span>
                        ) : fitIdx >= 0 ? (
                          <span style={{ fontSize: 11, color: OK, fontWeight: 600 }}>
                            ✦ Fits this ad{fitIdx === 0 ? ' best' : ''}
                          </span>
                        ) : (
                          <span style={{ fontSize: 11, color: MUTED }}>{STYLE_INFO[f.format_id]?.bestFor}</span>
                        )}
                      </span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
          <aside
            className="wz-lib-prev"
            aria-live="polite"
            style={{
              borderLeft: `1px solid ${LINE}`,
              padding: 14,
              overflow: 'auto',
              gap: 10,
              alignContent: 'start',
              background: SOFT,
            }}
          >
            {selected ? (
              <>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={`/ad-styles/${selected.format_id}.jpg`}
                  alt={`${selected.name} example`}
                  style={{
                    width: '100%',
                    aspectRatio: '1 / 1',
                    objectFit: 'cover',
                    borderRadius: 10,
                    display: 'block',
                  }}
                />
                <div style={{ fontSize: 15, fontWeight: 800, color: INK }}>{selected.name}</div>
                <div style={{ fontSize: 12.5, color: MUTED, lineHeight: 1.45 }}>
                  Best for: {STYLE_INFO[selected.format_id]?.bestFor.toLowerCase()}.
                </div>
                {fits.includes(selected.format_id) && (
                  <div style={{ fontSize: 12.5, color: OK, fontWeight: 600 }}>✦ Suits what this ad says.</div>
                )}
                <div style={{ fontSize: 12, color: MUTED, lineHeight: 1.45 }}>
                  This is an example. Your ad uses your brand&apos;s logo, colours and your own words.
                </div>
              </>
            ) : (
              <div style={{ fontSize: 13, color: MUTED }}>Click a style to see it here.</div>
            )}
          </aside>
        </div>

        <div
          style={{
            padding: '12px 18px',
            borderTop: `1px solid ${LINE}`,
            display: 'flex',
            flexWrap: 'wrap',
            gap: 8,
            justifyContent: 'flex-end',
            alignItems: 'center',
          }}
        >
          <div style={{ flex: '1 1 180px', fontSize: 12.5, color: MUTED }}>
            {selected ? `Selected: ${selected.name}` : 'Click a style to select it'}
          </div>
          <button type="button" onClick={onClose} style={btn('plain')}>
            Cancel
          </button>
          {onUseAll && (
            <button
              type="button"
              disabled={!selected}
              onClick={() => selected && onUseAll(selected.format_id)}
              style={btn(onUseOne ? 'outline' : 'primary', !selected)}
            >
              Use for all ads
            </button>
          )}
          {onUseOne && (
            <button
              type="button"
              disabled={!selected}
              onClick={() => selected && onUseOne(selected.format_id)}
              style={btn('primary', !selected)}
            >
              {useOneLabel}
            </button>
          )}
        </div>
      </div>
    </div>
  );
  return typeof document === 'undefined' ? null : createPortal(body, document.body);
}

function btn(kind: 'plain' | 'outline' | 'primary', disabled = false): React.CSSProperties {
  return {
    fontSize: 13,
    fontWeight: 700,
    padding: '9px 15px',
    borderRadius: 9,
    cursor: disabled ? 'not-allowed' : 'pointer',
    fontFamily: 'inherit',
    whiteSpace: 'nowrap',
    opacity: disabled ? 0.5 : 1,
    border: kind === 'primary' ? `1px solid ${PINK}` : kind === 'outline' ? `1px solid ${PINK}` : `1px solid ${LINE}`,
    background: kind === 'primary' ? PINK : '#fff',
    color: kind === 'primary' ? '#fff' : kind === 'outline' ? PINK : INK,
  };
}
