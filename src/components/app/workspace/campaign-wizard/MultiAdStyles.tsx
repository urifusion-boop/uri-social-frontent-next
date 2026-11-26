'use client';

/**
 * The Style step when the campaign tests several ads: how each one looks.
 *
 * Three ways, one row per ad: Jane gives each ad the style that best fits what it says (the default),
 * one style for all of them, or the owner chooses for each from the full library (StyleLibrary).
 * Each row also says what the ad says (its way in), and ads can be added or removed right here; the
 * count stays in step with the Creative step's "Make several ads".
 */
import { useState } from 'react';
import type { PlannedAd } from '@/src/api/CampaignService';
import StyleLibrary, {
  ANGLE_LABEL,
  ANGLE_ORDER,
  MAX_ADS,
  MIN_ADS,
  janeStyles,
  plannedAds,
  resolvedStyles,
  styleName,
  useAdStyles,
} from './StyleLibrary';
import { STYLE_INFO } from './WizardStyleStep';
import type { WizardCreativeChoice } from './WizardCreativeStep';

const PINK = '#C2185B';
const INK = '#1a0a12';
const MUTED = '#6e6468';
const LINE = '#ede6e9';
const OK = '#1a7f37';

type Mode = 'jane' | 'same' | 'mine';
type GenerateChoice = Extract<WizardCreativeChoice, { creative_source: 'generate' }>;

const MODES: { key: Mode; title: string; text: string; tag?: string }[] = [
  {
    key: 'jane',
    title: 'Let Jane choose',
    tag: 'Recommended',
    text: 'Jane gives each ad the style that best fits what it says. You can still change any of them.',
  },
  { key: 'same', title: 'One style for all ads', text: 'Every ad looks the same, each with its own message.' },
  { key: 'mine', title: 'Choose for each ad', text: 'Pick a different style for every ad from the whole library.' },
];

export default function MultiAdStyles({
  creative,
  description,
  onChange,
}: {
  creative: GenerateChoice;
  description: string;
  onChange: (next: WizardCreativeChoice) => void;
}) {
  const { styles, failed } = useAdStyles(description);
  const [open, setOpen] = useState<number | 'all' | null>(null);
  const ads = plannedAds(creative.concepts ?? MIN_ADS, creative.ads);
  const mode: Mode = creative.style_mode ?? 'jane';
  const jane = janeStyles(ads, styles);
  const shown = resolvedStyles(ads, styles);

  const commit = (next: PlannedAd[], nextMode: Mode = mode) =>
    onChange({ ...creative, concepts: next.length, ads: next, style_mode: nextMode });

  const setMode = (m: Mode) => {
    if (m === 'jane')
      commit(
        ads.map((a) => ({ ...a, vsg01_format_id: '' })),
        'jane'
      );
    else if (m === 'same') {
      const shared = shown[0] || '';
      commit(
        ads.map((a) => ({ ...a, vsg01_format_id: shared })),
        'same'
      );
    } else
      // Coming from "one style for all", each ad starts from Jane's own pick, not the shared style.
      commit(
        ads.map((a, i) => ({ ...a, vsg01_format_id: (mode === 'same' ? jane[i] : shown[i]) || '' })),
        'mine'
      );
  };

  const applyToOne = (index: number, id: string) => {
    // Choosing for one ad while Jane chooses: the others keep what Jane picked for them.
    const base = mode === 'mine' ? ads : ads.map((a, i) => ({ ...a, vsg01_format_id: shown[i] || '' }));
    commit(
      base.map((a, i) => (i === index ? { ...a, vsg01_format_id: id } : a)),
      'mine'
    );
    setOpen(null);
  };
  const applyToAll = (id: string) => {
    commit(
      ads.map((a) => ({ ...a, vsg01_format_id: id })),
      'same'
    );
    setOpen(null);
  };
  const setAngle = (index: number, angle: string) =>
    commit(ads.map((a, i) => (i === index ? { ...a, angle, ...(mode === 'jane' ? { vsg01_format_id: '' } : {}) } : a)));
  const add = () => {
    const used = new Set(ads.map((a) => a.angle));
    const angle = ANGLE_ORDER.find((k) => !used.has(k)) ?? 'problem';
    commit([...ads, { angle, vsg01_format_id: mode === 'same' ? shown[0] || '' : '' }]);
  };
  const remove = (index: number) => commit(ads.filter((_, i) => i !== index));

  const usedBy: Record<string, number[]> = {};
  if (mode !== 'same') shown.forEach((id, i) => id && (usedBy[id] = [...(usedBy[id] ?? []), i]));

  const credits = shown.reduce((sum, id) => sum + (styles?.prices?.[id] ?? 1), 0);

  return (
    <div style={{ display: 'grid', gap: 16 }}>
      <div>
        <div style={{ fontSize: 16, fontWeight: 800, color: INK }}>How should your {ads.length} ads look?</div>
        <div style={{ fontSize: 13, color: MUTED, marginTop: 3, lineHeight: 1.45 }}>
          Each ad says something different to your customers. Choose how they look.
        </div>
      </div>

      {failed && (
        <div style={{ fontSize: 13, color: MUTED }}>
          Couldn&apos;t load the styles right now. Jane will choose a style for each ad.
        </div>
      )}

      <div
        role="radiogroup"
        aria-label="How to choose styles"
        style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: 10 }}
      >
        {MODES.map((m) => {
          const on = mode === m.key;
          return (
            <button
              key={m.key}
              type="button"
              role="radio"
              aria-checked={on}
              disabled={!styles}
              onClick={() => setMode(m.key)}
              style={{
                display: 'grid',
                gridTemplateColumns: '18px 1fr',
                gap: 10,
                textAlign: 'left',
                background: on ? '#FDF1F6' : '#fff',
                border: `1.5px solid ${on ? PINK : LINE}`,
                borderRadius: 12,
                padding: '12px 14px',
                cursor: styles ? 'pointer' : 'default',
                fontFamily: 'inherit',
              }}
            >
              <span
                style={{
                  width: 16,
                  height: 16,
                  marginTop: 2,
                  borderRadius: '50%',
                  boxSizing: 'border-box',
                  border: on ? `5px solid ${PINK}` : '2px solid #cdbec6',
                }}
              />
              <span>
                <span style={{ display: 'block', fontSize: 14, fontWeight: 800, color: INK }}>
                  {m.title}
                  {m.tag && (
                    <span
                      style={{
                        marginLeft: 6,
                        fontSize: 10.5,
                        fontWeight: 700,
                        color: OK,
                        background: '#EAF6EE',
                        padding: '1px 6px',
                        borderRadius: 6,
                        verticalAlign: 1,
                      }}
                    >
                      {m.tag}
                    </span>
                  )}
                </span>
                <span style={{ display: 'block', fontSize: 12.5, color: MUTED, marginTop: 2, lineHeight: 1.4 }}>
                  {m.text}
                </span>
              </span>
            </button>
          );
        })}
      </div>

      <div style={{ display: 'grid', gap: 10 }}>
        <style>{`.wz-adrow{display:grid;grid-template-columns:44px 84px minmax(0,1fr) auto;gap:14px;align-items:center}
.wz-adrow-acts{display:flex;flex-direction:column;gap:6px;align-items:stretch}
@media (max-width:620px){.wz-adrow{grid-template-columns:64px minmax(0,1fr)}.wz-adrow-num{grid-column:1/-1}
.wz-adrow-thumb{width:64px!important}.wz-adrow-acts{grid-column:1/-1;flex-direction:row;flex-wrap:wrap}}`}</style>
        {mode === 'same' && (
          <Row
            label="ALL"
            styleId={shown[0]}
            styles={styles}
            title={`Style: ${styleName(shown[0], styles?.formats)}`}
            note={`Used for all ${ads.length} ads`}
            onChoose={() => setOpen('all')}
          />
        )}
        {ads.map((a, i) => {
          const id = shown[i];
          const mine = mode === 'mine' && a.vsg01_format_id && a.vsg01_format_id !== jane[i];
          return (
            <Row
              key={i}
              label={`AD ${i + 1}`}
              styleId={id}
              styles={styles}
              angle={a.angle}
              onAngle={(v) => setAngle(i, v)}
              title={`Style: ${styleName(id, styles?.formats)}`}
              note={mode === 'same' ? 'Same style as all ads' : mine ? 'Your choice' : '✦ Jane’s pick for this message'}
              noteGreen={mode !== 'same' && !mine}
              onChoose={mode === 'same' ? undefined : () => setOpen(i)}
              onJane={
                mine ? () => commit(ads.map((x, k) => (k === i ? { ...x, vsg01_format_id: jane[i] } : x))) : undefined
              }
              onRemove={ads.length > MIN_ADS ? () => remove(i) : undefined}
            />
          );
        })}
        {ads.length < MAX_ADS ? (
          <button
            type="button"
            onClick={add}
            style={{
              border: `1.5px dashed ${LINE}`,
              borderRadius: 12,
              padding: 12,
              background: 'none',
              color: MUTED,
              cursor: 'pointer',
              fontSize: 13,
              fontFamily: 'inherit',
            }}
          >
            + Add another ad (up to {MAX_ADS})
          </button>
        ) : null}
        {ads.length <= MIN_ADS && (
          <div style={{ fontSize: 12, color: MUTED }}>
            A test needs at least {MIN_ADS} ads. For one ad, choose a single ad on the Creative step.
          </div>
        )}
      </div>

      <div style={{ fontSize: 13, color: MUTED, fontVariantNumeric: 'tabular-nums' }}>
        <b style={{ color: INK }}>{ads.length} ads</b> · {styles?.prices ? 'priced by style' : '1 credit each'} ·{' '}
        <b style={{ color: INK }}>
          {credits} credit{credits === 1 ? '' : 's'}
        </b>
      </div>

      {styles && open !== null && (
        <StyleLibrary
          styles={styles}
          title={open === 'all' ? 'Choose one style for all ads' : `Choose a style for Ad ${open + 1}`}
          subtitle={
            open === 'all'
              ? `Used for all ${ads.length} ads`
              : `This ad says: ${ANGLE_LABEL[ads[open].angle] ?? ads[open].angle}`
          }
          angle={open === 'all' ? undefined : ads[open].angle}
          current={open === 'all' ? shown[0] : shown[open]}
          usedBy={usedBy}
          onUseOne={open === 'all' ? undefined : (id) => applyToOne(open, id)}
          onUseAll={applyToAll}
          onClose={() => setOpen(null)}
        />
      )}
    </div>
  );
}

function Row({
  label,
  styleId,
  styles,
  angle,
  onAngle,
  title,
  note,
  noteGreen,
  onChoose,
  onJane,
  onRemove,
}: {
  label: string;
  styleId: string;
  styles: ReturnType<typeof useAdStyles>['styles'];
  angle?: string;
  onAngle?: (v: string) => void;
  title: string;
  note: string;
  noteGreen?: boolean;
  onChoose?: () => void;
  onJane?: () => void;
  onRemove?: () => void;
}) {
  const link: React.CSSProperties = {
    fontSize: 12,
    color: MUTED,
    background: 'none',
    border: 'none',
    padding: 0,
    textDecoration: 'underline',
    cursor: 'pointer',
    fontFamily: 'inherit',
  };
  return (
    <div
      className="wz-adrow"
      style={{ border: `1px solid ${LINE}`, borderRadius: 12, padding: 12, background: '#fff' }}
    >
      <span className="wz-adrow-num" style={{ fontSize: 12, fontWeight: 800, color: PINK, letterSpacing: '.04em' }}>
        {label}
      </span>
      <button
        type="button"
        className="wz-adrow-thumb"
        onClick={onChoose}
        disabled={!onChoose || !styles}
        aria-label={onChoose ? `Choose a style for ${label}` : title}
        style={{
          width: 84,
          aspectRatio: '1 / 1',
          borderRadius: 9,
          overflow: 'hidden',
          background: '#f7f2f4',
          border: 'none',
          padding: 0,
          cursor: onChoose ? 'pointer' : 'default',
        }}
      >
        {styleId ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={`/ad-styles/${styleId}.jpg`}
            alt=""
            style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
          />
        ) : (
          <span style={{ fontSize: 11, color: MUTED }}>{styles ? 'Jane chooses' : 'Loading…'}</span>
        )}
      </button>
      <div style={{ minWidth: 0, display: 'grid', gap: 5 }}>
        {angle !== undefined && onAngle && (
          <label
            style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', fontSize: 12.5, color: MUTED }}
          >
            Says:
            <select
              value={angle}
              onChange={(e) => onAngle(e.target.value)}
              style={{
                fontSize: 13,
                padding: '5px 8px',
                borderRadius: 8,
                border: `1px solid ${LINE}`,
                background: '#fff',
                fontFamily: 'inherit',
                color: INK,
              }}
            >
              {ANGLE_ORDER.map((k) => (
                <option key={k} value={k}>
                  {ANGLE_LABEL[k]}
                </option>
              ))}
            </select>
          </label>
        )}
        <div style={{ fontSize: 14.5, fontWeight: 700, color: INK, lineHeight: 1.3 }}>{title}</div>
        <div style={{ fontSize: 12, color: noteGreen ? OK : MUTED }}>
          {note}
          {styleId && STYLE_INFO[styleId] ? ` · ${STYLE_INFO[styleId].bestFor}` : ''}
        </div>
      </div>
      <div className="wz-adrow-acts">
        {onChoose && (
          <button
            type="button"
            onClick={onChoose}
            disabled={!styles}
            style={{
              fontSize: 13,
              fontWeight: 700,
              padding: '8px 14px',
              borderRadius: 9,
              border: `1px solid ${PINK}`,
              color: PINK,
              background: '#fff',
              cursor: styles ? 'pointer' : 'default',
              fontFamily: 'inherit',
              whiteSpace: 'nowrap',
            }}
          >
            Choose style
          </button>
        )}
        {onJane && (
          <button type="button" onClick={onJane} style={link}>
            Use Jane&apos;s pick
          </button>
        )}
        {onRemove && (
          <button type="button" onClick={onRemove} style={link}>
            Remove ad
          </button>
        )}
      </div>
    </div>
  );
}
