'use client';

import { useState } from 'react';
import type { AdFormat } from '@/src/api/CampaignService';

const PINK = '#C2185B';

// Every format is text-only in the corpus (no example photography exists for any
// of them — a real, separate scope gap noted when this gallery was first built).
// Rather than ship flat white cards with no visual identity at all, each format
// gets a distinct icon + gradient pairing that reflects its actual mechanism —
// enough to make the gallery scannable and feel designed, without pretending to
// be a real product photo.
const FORMAT_VISUALS: Record<string, { icon: string; from: string; to: string }> = {
  'SEED-093': { icon: '⭐', from: '#F5A623', to: '#F76B1C' }, // Review Card
  'SEED-074': { icon: '💬', from: '#F2709C', to: '#FF9472' }, // Testimonial + Offer
  'SEED-080': { icon: '⚡', from: '#4568DC', to: '#B06AB3' }, // Problem / Solution
  'SEED-075': { icon: '⚖️', from: '#3A3D40', to: '#181719' }, // Us vs Them
  'SEED-081': { icon: '🧾', from: '#D1913C', to: '#FFD194' }, // The Receipt
  'SEED-087': { icon: '📱', from: '#25D366', to: '#128C7E' }, // Borrowed Interface
  'SEED-082': { icon: '🗣️', from: '#EACDA3', to: '#B49062' }, // Text on a Face
  'SEED-077': { icon: '📰', from: '#606C88', to: '#3F4C6B' }, // News Headline
  'SEED-078': { icon: '📈', from: '#56AB2F', to: '#A8E063' }, // Day 1 → Day 30
  'SEED-083': { icon: '🙈', from: '#232526', to: '#0F0C29' }, // The Censored Item
  'SEED-088': { icon: '🧺', from: '#F7971E', to: '#FFD200' }, // Starter Pack
  'SEED-089': { icon: '😄', from: '#F857A6', to: '#FF5858' }, // Humour / Cartoon
  'PLANNED-price-led-offer': { icon: '🏷️', from: '#CD1B78', to: '#8E1545' },
  'PLANNED-text-only': { icon: '🔤', from: '#485563', to: '#29323C' },
  'PLANNED-work-in-progress': { icon: '🛠️', from: '#F2994A', to: '#F2C94C' },
};
const DEFAULT_VISUAL = { icon: '🎯', from: '#9CA3AF', to: '#6B7280' };

const BRAND_MARK_COPY: Record<AdFormat['brand_mark'], { label: string; bg: string; fg: string }> = {
  required: { label: 'Logo required', bg: '#fdf0f6', fg: PINK },
  optional: { label: 'Logo optional', bg: '#f3f2ef', fg: '#777' },
  prohibited: { label: 'No logo', bg: '#fdecea', fg: '#c62828' },
};

const STATUS_COPY: Record<AdFormat['status'], { label: string; bg: string; fg: string } | null> = {
  live: null, // no badge — this is the normal, expected state
  built: { label: 'Not yet in rotation', bg: '#fff6e5', fg: '#9a6a00' },
  planned: { label: 'Coming soon', bg: '#f3f2ef', fg: '#999' },
};

export const BrandMarkChip = ({ value }: { value: AdFormat['brand_mark'] }) => {
  const c = BRAND_MARK_COPY[value];
  return (
    <span
      style={{
        display: 'inline-block',
        fontSize: 10.5,
        fontWeight: 700,
        padding: '2px 8px',
        borderRadius: 20,
        background: c.bg,
        color: c.fg,
      }}
    >
      {c.label}
    </span>
  );
};

/** The "see more" body, shared by the Playbook gallery card and the in-flow chip
 *  on a generated ad — so expanding either one looks and reads identically. */
export const AdFormatDetailPanel = ({ format }: { format: AdFormat }) => (
  <div style={{ padding: '12px 14px 14px', borderTop: '1px solid #f0ede8', background: '#fbfaf8' }}>
    <p style={{ margin: '0 0 10px', fontSize: 12.5, color: '#3a3733', lineHeight: 1.55 }}>{format.mechanism}</p>
    {format.business_types.length > 0 && (
      <div style={{ marginBottom: 10 }}>
        <div
          style={{ fontSize: 10, fontWeight: 700, color: '#a39c92', textTransform: 'uppercase', letterSpacing: 0.6 }}
        >
          Best for
        </div>
        <div style={{ fontSize: 12.5, color: '#555', marginTop: 3 }}>{format.business_types.join(' · ')}</div>
      </div>
    )}
    {format.modification_required && (
      <div>
        <div
          style={{ fontSize: 10, fontWeight: 700, color: '#a39c92', textTransform: 'uppercase', letterSpacing: 0.6 }}
        >
          Rules
        </div>
        <div style={{ fontSize: 12.5, color: '#555', marginTop: 3, lineHeight: 1.55 }}>
          {format.modification_required}
        </div>
      </div>
    )}
  </div>
);

/** A browsable, selectable card for the Brand Playbook's "Visual Styles — Ads"
 *  section. Each card has its own icon/gradient header (real visual identity,
 *  since no example photography exists for any format) and an independent
 *  expand toggle — one card's "See more" only affects its own height; the
 *  parent grid must use `alignItems: 'flex-start'` or siblings will stretch
 *  to match (a real bug this component previously shipped with).
 *
 *  Selecting up to 3 cards (mirrors the organic Visual Style section's
 *  MAX_SELECTIONS pattern) marks them as the brand's standing ad-format
 *  preference — `select_and_render_vsg01_creative` on the backend tries the
 *  first eligible selection before falling back to plain retrieval ranking. */
export const AdFormatGalleryCard = ({
  format,
  isSelected,
  onToggleSelect,
  selectionDisabled,
}: {
  format: AdFormat;
  isSelected?: boolean;
  onToggleSelect?: () => void;
  // true when 3 are already selected and this one isn't one of them
  selectionDisabled?: boolean;
}) => {
  const [open, setOpen] = useState(false);
  const statusBadge = STATUS_COPY[format.status];
  const visual = FORMAT_VISUALS[format.format_id] ?? DEFAULT_VISUAL;
  const selectable = format.status !== 'planned' && !!onToggleSelect;

  return (
    <div
      style={{
        borderRadius: 12,
        overflow: 'hidden',
        border: isSelected ? `2px solid ${PINK}` : '1.5px solid #f0ede8',
        boxShadow: isSelected ? `0 0 0 3px ${PINK}22` : '0 1px 3px rgba(20,15,10,0.05)',
        width: 230,
        background: '#fff',
        alignSelf: 'flex-start',
      }}
    >
      <div
        role={selectable ? 'button' : undefined}
        tabIndex={selectable ? 0 : undefined}
        onClick={selectable && !selectionDisabled ? onToggleSelect : undefined}
        onKeyDown={(e) => selectable && !selectionDisabled && e.key === 'Enter' && onToggleSelect?.()}
        style={{
          height: 84,
          position: 'relative',
          background: `linear-gradient(135deg, ${visual.from}, ${visual.to})`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: selectable ? (selectionDisabled ? 'not-allowed' : 'pointer') : 'default',
          opacity: selectionDisabled ? 0.55 : 1,
        }}
      >
        <span style={{ fontSize: 32, filter: 'drop-shadow(0 1px 3px rgba(0,0,0,0.25))' }}>{visual.icon}</span>
        {statusBadge && (
          <span
            style={{
              position: 'absolute',
              top: 8,
              right: 8,
              fontSize: 9.5,
              fontWeight: 700,
              padding: '2px 7px',
              borderRadius: 20,
              background: 'rgba(255,255,255,0.9)',
              color: statusBadge.fg,
              whiteSpace: 'nowrap',
            }}
          >
            {statusBadge.label}
          </span>
        )}
        {isSelected && (
          <span
            style={{
              position: 'absolute',
              top: 8,
              left: 8,
              width: 20,
              height: 20,
              borderRadius: '50%',
              background: PINK,
              color: '#fff',
              fontSize: 12,
              fontWeight: 800,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 0 0 2px #fff',
            }}
          >
            ✓
          </span>
        )}
      </div>

      <div style={{ padding: '11px 13px' }}>
        <div style={{ fontSize: 14, fontWeight: 800, color: '#1a1614', letterSpacing: -0.1 }}>{format.name}</div>
        <div style={{ fontSize: 11.5, color: '#87807a', marginTop: 4, lineHeight: 1.45, minHeight: 32 }}>
          {format.claim}
        </div>
        <div style={{ marginTop: 9, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 6 }}>
          <BrandMarkChip value={format.brand_mark} />
          <button
            onClick={() => setOpen((v) => !v)}
            style={{
              background: 'none',
              border: 'none',
              fontSize: 11,
              fontWeight: 700,
              color: PINK,
              cursor: 'pointer',
              padding: 0,
              flexShrink: 0,
            }}
          >
            {open ? 'See less' : 'See more'}
          </button>
        </div>
      </div>
      {open && <AdFormatDetailPanel format={format} />}
    </div>
  );
};

/** The in-flow "Style — {name} · change" row shown next to a generated ad — only
 *  ever rendered when the backend actually used a VSG-01 format (vsg01_format_id
 *  non-empty). Modeled directly on JaneVideoChat.tsx's plan.style row: a compact
 *  line with an info toggle for the current pick, plus a separate "change" link
 *  that reveals the OTHER real ranked candidates (from the same pre-generation
 *  suggest-format call) — picking one calls onSelect, which replays this exact
 *  generation with that format forced (see CampaignsPage's continueWithSource). */
export const AdFormatChip = ({
  format,
  alternatives = [],
  onSelect,
}: {
  format: AdFormat;
  alternatives?: AdFormat[];
  onSelect?: (formatId: string) => void;
}) => {
  const [infoOpen, setInfoOpen] = useState(false);
  const [changing, setChanging] = useState(false);
  const visual = FORMAT_VISUALS[format.format_id] ?? DEFAULT_VISUAL;
  return (
    <div style={{ marginTop: 10, border: '1px solid #f0ede8', borderRadius: 10, overflow: 'hidden' }}>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          padding: '6px 10px',
          background: `linear-gradient(135deg, ${visual.from}22, ${visual.to}22)`,
        }}
      >
        <span
          role="button"
          tabIndex={0}
          onClick={() => setInfoOpen((v) => !v)}
          onKeyDown={(e) => e.key === 'Enter' && setInfoOpen((v) => !v)}
          style={{ fontSize: 11.5, fontWeight: 700, color: PINK, cursor: 'pointer' }}
        >
          {visual.icon} Style: {format.name} <span style={{ opacity: 0.6 }}>ⓘ</span>
        </span>
        {onSelect && alternatives.length > 0 && (
          <button
            onClick={() => setChanging((v) => !v)}
            style={{
              marginLeft: 'auto',
              background: 'none',
              border: 'none',
              color: PINK,
              fontSize: 11,
              fontWeight: 700,
              cursor: 'pointer',
              padding: 0,
            }}
          >
            {changing ? 'cancel' : 'change'}
          </button>
        )}
      </div>
      {infoOpen && <AdFormatDetailPanel format={format} />}
      {changing && (
        <div style={{ padding: 10, borderTop: '1px solid #f0ede8', display: 'flex', flexDirection: 'column', gap: 6 }}>
          {alternatives.map((alt) => (
            <button
              key={alt.format_id}
              onClick={() => {
                setChanging(false);
                onSelect?.(alt.format_id);
              }}
              style={{
                textAlign: 'left',
                padding: '8px 10px',
                borderRadius: 8,
                border: '1.5px solid #f0ede8',
                background: '#fff',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'flex-start',
                gap: 8,
              }}
            >
              <span style={{ fontSize: 15 }}>{(FORMAT_VISUALS[alt.format_id] ?? DEFAULT_VISUAL).icon}</span>
              <span>
                <div style={{ fontSize: 12.5, fontWeight: 700, color: '#111' }}>{alt.name}</div>
                <div style={{ fontSize: 11, color: '#888', marginTop: 2 }}>{alt.claim}</div>
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};
