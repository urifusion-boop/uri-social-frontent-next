'use client';

/**
 * The "Style" step: how the ad looks. Every card shows a real ad made in that style
 * (public/ad-styles/<format_id>.jpg), Jane's own pick for this brief comes pre-selected,
 * and any other style, or "Let Jane choose for me", can be picked instead. The choice
 * travels on the creative choice itself (vsg01_format_id), so autosave, resume and the
 * Review step's "rebuild when an answer changes" all carry it without extra wiring.
 *
 * Which styles can work comes from /jane-ads/creative/suggest-format, the same ranking a
 * real generation uses: a style it doesn't list is shown greyed with the plain reason
 * (it needs a product photo, a customer photo, or it is made from Jane's own picture).
 */
import { useEffect, useMemo, useState } from 'react';
import { CampaignService, type AdFormat } from '@/src/api/CampaignService';
import type { WizardCreativeChoice } from './WizardCreativeStep';
import MultiAdStyles from './MultiAdStyles';

const PINK = '#C2185B';

type Group = 'events' | 'offers' | 'problems' | 'bold' | 'proof' | 'stories';

/** What each style is best for, and which filter it sits under. Only styles listed here
 *  (each with a real example image) are offered. */
export const STYLE_INFO: Record<string, { bestFor: string; group: Group }> = {
  'SEED-099': { bestFor: 'Events, webinars and classes with a date', group: 'events' },
  'SEED-104': { bestFor: 'Courses, admissions and registrations', group: 'events' },
  'SEED-100': { bestFor: 'A discount or seasonal deal', group: 'offers' },
  'SEED-096': { bestFor: 'A new price on your product', group: 'offers' },
  'SEED-081': { bestFor: 'Show what the old way really costs', group: 'offers' },
  'SEED-101': { bestFor: 'The problems you fix, side by side', group: 'problems' },
  'SEED-080': { bestFor: 'One problem, one fix', group: 'problems' },
  'SEED-075': { bestFor: 'You against the old way', group: 'problems' },
  'SEED-105': { bestFor: 'One bold claim, billboard size', group: 'bold' },
  'SEED-102': { bestFor: 'A person and one strong message', group: 'bold' },
  'SEED-097': { bestFor: 'Just one strong line', group: 'bold' },
  'SEED-077': { bestFor: 'Your news, as a headline', group: 'bold' },
  'SEED-103': { bestFor: 'Your service in action', group: 'stories' },
  'SEED-106': { bestFor: 'Answer what customers ask', group: 'proof' },
  'SEED-093': { bestFor: 'A customer review with your product', group: 'proof' },
  'SEED-074': { bestFor: "A real customer's words and an offer", group: 'proof' },
  'SEED-087': { bestFor: 'Your message as a familiar chat', group: 'stories' },
  'SEED-089': { bestFor: 'A light, funny take', group: 'stories' },
  'SEED-098': { bestFor: 'Behind the scenes of your work', group: 'stories' },
};

const GROUPS: { key: 'all' | Group; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'events', label: 'Events & courses' },
  { key: 'offers', label: 'Offers & prices' },
  { key: 'problems', label: 'Problems you solve' },
  { key: 'bold', label: 'Bold message' },
  { key: 'proof', label: 'Proof & reviews' },
  { key: 'stories', label: 'Stories & fun' },
];

/** Whether the Style step applies to this creative choice at all: it shapes a picture
 *  Jane makes (one ad, or each of several: MultiAdStyles) or one photo she builds on.
 *  A past draft or a video has nothing to style. */
export function styleApplies(creative: WizardCreativeChoice | null): boolean {
  if (!creative) return false;
  if (creative.creative_source === 'generate') return true;
  // A video (uploaded, or already on YouTube) runs as it is: nothing to style.
  if (creative.creative_source === 'upload') return !creative.is_video && !creative.youtube_video_id;
  return false;
}

function reasonFor(format: AdFormat, creative: WizardCreativeChoice): string {
  if (format.requires.includes('product_photo')) return 'Needs your product photo';
  if (format.requires.includes('real_customer_photo')) return 'Needs a photo of a real customer';
  if (creative.creative_source === 'upload') return 'Made from a picture Jane creates';
  return "Doesn't fit this ad";
}

export default function WizardStyleStep(props: Parameters<typeof SingleAdStyle>[0]) {
  const { creative } = props;
  if (creative.creative_source === 'generate' && (creative.concepts ?? 1) >= 2)
    return <MultiAdStyles creative={creative} description={props.description} onChange={props.onChange} />;
  return <SingleAdStyle {...props} />;
}

function SingleAdStyle({
  creative,
  description,
  onChange,
  onGoToCreative,
  onGoToBrief,
  adAlreadyBuilt = false,
}: {
  creative: WizardCreativeChoice;
  description: string;
  onChange: (next: WizardCreativeChoice) => void;
  onGoToCreative: () => void;
  /** Back to the step where the brief is written (Audience), for a style the brief can't support yet. */
  onGoToBrief: () => void;
  /** Jane has already built this campaign's ad. Opening the step must not change anything then (an
   *  automatic pick changed the creative, which the wizard reads as an edit: the built ad was thrown
   *  away and rebuilt, costing credits); only a choice the client makes here does. */
  adAlreadyBuilt?: boolean;
}) {
  const [formats, setFormats] = useState<AdFormat[] | null>(null);
  const [suggested, setSuggested] = useState<AdFormat | null>(null);
  const [eligible, setEligible] = useState<Set<string> | null>(null);
  // Styles that only state facts the brief gives (an event date, an offer, a price...), when this brief
  // doesn't give them: greyed with the reason before anyone picks one.
  const [needs, setNeeds] = useState<Record<string, string>>({});
  // Each style's credit price — shown only once ad image billing is "on" (in "shadow" the flat
  // 1 credit is still what's charged, so no price is shown).
  const [prices, setPrices] = useState<Record<string, number> | null>(null);
  const [failed, setFailed] = useState(false);
  const [filter, setFilter] = useState<'all' | Group>('all');

  const attestation = creative.creative_source === 'upload' ? creative.asset_attestation : undefined;
  const chosen =
    creative.creative_source === 'draft' || creative.creative_source === 'existing_post'
      ? undefined
      : creative.vsg01_format_id;

  useEffect(() => {
    let alive = true;
    Promise.all([
      CampaignService.getAdFormats(),
      CampaignService.suggestAdFormat({
        description: description.trim() || undefined,
        ...(attestation ? { asset_attestation: attestation } : {}),
        is_video: false,
      }),
    ])
      .then(([all, s]) => {
        if (!alive) return;
        setFormats(all.formats.filter((f) => f.status === 'live' && STYLE_INFO[f.format_id]));
        setSuggested(s.suggested && STYLE_INFO[s.suggested.format_id] ? s.suggested : null);
        setEligible(new Set([s.suggested, ...s.alternatives].filter(Boolean).map((f) => (f as AdFormat).format_id)));
        setNeeds(s.needs_in_brief ?? {});
        setPrices(s.billing_mode === 'on' && s.credits ? s.credits : null);
      })
      .catch(() => alive && setFailed(true));
    return () => {
      alive = false;
    };
  }, [description, attestation]);

  const pick = (formatId: string) => {
    if (creative.creative_source === 'draft' || creative.creative_source === 'existing_post') return;
    onChange({ ...creative, vsg01_format_id: formatId });
  };

  // First visit: Jane's pick is selected for you (nothing chosen yet is `undefined`;
  // "Let Jane choose for me" is the explicit '').
  useEffect(() => {
    if (adAlreadyBuilt) return;
    if (chosen && needs[chosen]) {
      pick(suggested ? suggested.format_id : '');
      return;
    }
    if (chosen === undefined && suggested) pick(suggested.format_id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [suggested, needs]);

  const cards = useMemo(() => {
    if (!formats || !eligible) return [];
    const ok = (f: AdFormat) => eligible.has(f.format_id) && !needs[f.format_id];
    const order = (f: AdFormat) => (suggested?.format_id === f.format_id ? 0 : ok(f) ? 1 : 2);
    return formats
      .filter((f) => filter === 'all' || STYLE_INFO[f.format_id].group === filter)
      .sort(
        (a, b) =>
          order(a) - order(b) ||
          Object.keys(STYLE_INFO).indexOf(a.format_id) - Object.keys(STYLE_INFO).indexOf(b.format_id)
      );
  }, [formats, eligible, suggested, filter, needs]);

  if (failed) {
    return (
      <div style={{ fontSize: 13, color: '#7a7270' }}>
        Couldn&apos;t load the styles right now. Jane will choose the best style for your ad.
      </div>
    );
  }
  if (!formats || !eligible) {
    return <div style={{ fontSize: 13, color: '#7a7270' }}>Loading styles…</div>;
  }

  return (
    <div>
      <div style={{ fontSize: 13.5, color: '#4a4245', marginBottom: 10 }}>How should your ad look?</div>

      {suggested && (
        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: 12,
            alignItems: 'center',
            background: 'linear-gradient(90deg,#FDF1F6,#fff)',
            border: '1px solid #F6C9DB',
            borderRadius: 12,
            padding: '11px 14px',
            marginBottom: 12,
          }}
        >
          <span
            style={{
              width: 30,
              height: 30,
              borderRadius: '50%',
              background: PINK,
              color: '#fff',
              fontWeight: 800,
              fontSize: 13,
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            J
          </span>
          <div style={{ flex: '1 1 220px', minWidth: 0 }}>
            <div style={{ fontSize: 13.5, fontWeight: 800, color: '#1a0a12' }}>Jane suggests {suggested.name}</div>
            <div style={{ fontSize: 12.5, color: '#5c5460', lineHeight: 1.45 }}>
              Best for {STYLE_INFO[suggested.format_id].bestFor.charAt(0).toLowerCase()}
              {STYLE_INFO[suggested.format_id].bestFor.slice(1)}, which fits what you&apos;re promoting.
            </div>
          </div>
          {chosen !== suggested.format_id && (
            <button
              type="button"
              onClick={() => pick(suggested.format_id)}
              style={{
                border: `1px solid ${PINK}`,
                color: PINK,
                background: '#fff',
                borderRadius: 9,
                padding: '8px 13px',
                fontWeight: 700,
                fontSize: 13,
                cursor: 'pointer',
                fontFamily: 'inherit',
              }}
            >
              Use {suggested.name}
            </button>
          )}
        </div>
      )}

      <div
        style={{
          display: 'flex',
          gap: 6,
          overflowX: 'auto',
          paddingBottom: 2,
          marginBottom: 10,
          scrollbarWidth: 'none',
        }}
      >
        {GROUPS.map((g) => (
          <button
            key={g.key}
            type="button"
            onClick={() => setFilter(g.key)}
            style={{
              flexShrink: 0,
              border: 'none',
              borderRadius: 999,
              padding: '6px 11px',
              fontSize: 12.5,
              fontWeight: 600,
              cursor: 'pointer',
              fontFamily: 'inherit',
              background: filter === g.key ? '#1a0a12' : '#f6f2f4',
              color: filter === g.key ? '#fff' : '#5c5460',
            }}
          >
            {g.label}
          </button>
        ))}
      </div>

      <button
        type="button"
        onClick={() => pick('')}
        style={{
          display: 'flex',
          gap: 10,
          alignItems: 'center',
          width: '100%',
          textAlign: 'left',
          border: chosen === '' ? `1.5px solid ${PINK}` : '1px dashed #e3d4dc',
          background: chosen === '' ? 'rgba(194,24,91,.05)' : '#fff',
          borderRadius: 12,
          padding: '10px 13px',
          marginBottom: 12,
          cursor: 'pointer',
          fontFamily: 'inherit',
        }}
      >
        <span
          style={{
            width: 16,
            height: 16,
            borderRadius: '50%',
            border: chosen === '' ? `5px solid ${PINK}` : '2px solid #cdbec6',
            flexShrink: 0,
            boxSizing: 'border-box',
          }}
        />
        <span>
          <span style={{ display: 'block', fontSize: 13.5, fontWeight: 800, color: '#1a0a12' }}>
            Let Jane choose for me
          </span>
          <span style={{ fontSize: 12.5, color: '#5c5460' }}>Jane picks the best style for your ad.</span>
        </span>
      </button>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: 11 }}>
        {cards.map((f) => {
          const photoOk = eligible.has(f.format_id);
          const briefNeed = needs[f.format_id];
          const ok = photoOk && !briefNeed;
          const on = chosen === f.format_id;
          const isPick = suggested?.format_id === f.format_id;
          return (
            <div
              key={f.format_id}
              role="button"
              tabIndex={ok ? 0 : -1}
              aria-disabled={!ok}
              aria-pressed={on}
              onClick={() => ok && pick(f.format_id)}
              onKeyDown={(e) => ok && (e.key === 'Enter' || e.key === ' ') && pick(f.format_id)}
              style={{
                border: on ? `2px solid ${PINK}` : '1px solid #efe6eb',
                boxShadow: on ? '0 0 0 3px #FBE3EE' : undefined,
                borderRadius: 12,
                overflow: 'hidden',
                background: '#fff',
                cursor: ok ? 'pointer' : 'default',
              }}
            >
              <div style={{ position: 'relative', aspectRatio: '1 / 1', background: '#f4f0f2' }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={`/ad-styles/${f.format_id}.jpg`}
                  alt={`${f.name} example`}
                  loading="lazy"
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover',
                    display: 'block',
                    filter: ok ? undefined : 'grayscale(.85)',
                    opacity: ok ? 1 : 0.45,
                  }}
                />
                {isPick && (
                  <span
                    style={{
                      position: 'absolute',
                      left: 8,
                      top: 8,
                      background: PINK,
                      color: '#fff',
                      fontSize: 11,
                      fontWeight: 800,
                      padding: '3px 8px',
                      borderRadius: 999,
                    }}
                  >
                    ★ Jane&apos;s pick
                  </span>
                )}
                {on && (
                  <span
                    style={{
                      position: 'absolute',
                      right: 8,
                      top: 8,
                      width: 24,
                      height: 24,
                      borderRadius: '50%',
                      background: PINK,
                      color: '#fff',
                      border: '2px solid #fff',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: 13,
                      fontWeight: 800,
                    }}
                  >
                    ✓
                  </span>
                )}
              </div>
              <div style={{ padding: '8px 10px 10px' }}>
                <div style={{ fontSize: 13.5, fontWeight: 800, color: ok ? '#1a0a12' : '#8a7f86' }}>
                  {f.name}
                  {prices?.[f.format_id] !== undefined && (
                    <span style={{ fontSize: 11.5, fontWeight: 700, color: PINK, marginLeft: 6 }}>
                      · {prices[f.format_id]} credit{prices[f.format_id] === 1 ? '' : 's'}
                    </span>
                  )}
                </div>
                <div style={{ fontSize: 12, color: '#5c5460', marginTop: 2, lineHeight: 1.35 }}>
                  {STYLE_INFO[f.format_id].bestFor}
                </div>
                {!ok && (
                  <div style={{ fontSize: 11.5, color: '#9a3412', fontWeight: 600, marginTop: 6, lineHeight: 1.35 }}>
                    {photoOk ? briefNeed : reasonFor(f, creative)}
                    {photoOk && (
                      <>
                        <br />
                        <span
                          role="link"
                          tabIndex={0}
                          onClick={(e) => {
                            e.stopPropagation();
                            onGoToBrief();
                          }}
                          onKeyDown={(e) => e.key === 'Enter' && onGoToBrief()}
                          style={{ color: PINK, textDecoration: 'underline', cursor: 'pointer' }}
                        >
                          Edit your brief
                        </span>
                      </>
                    )}
                    {!photoOk &&
                      (f.requires.includes('product_photo') || f.requires.includes('real_customer_photo')) && (
                        <>
                          <br />
                          <span
                            role="link"
                            tabIndex={0}
                            onClick={(e) => {
                              e.stopPropagation();
                              onGoToCreative();
                            }}
                            onKeyDown={(e) => e.key === 'Enter' && onGoToCreative()}
                            style={{ color: PINK, textDecoration: 'underline', cursor: 'pointer' }}
                          >
                            Add one in Creative
                          </span>
                        </>
                      )}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
