'use client';

import { useState } from 'react';
import type { AdFormat } from '@/src/api/CampaignService';

const PINK = '#C2185B';

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
  <div style={{ padding: '10px 12px 12px', borderTop: '1px solid #f0ede8', background: '#fbfaf8' }}>
    <p style={{ margin: '0 0 8px', fontSize: 12, color: '#444', lineHeight: 1.5 }}>{format.mechanism}</p>
    {format.business_types.length > 0 && (
      <div style={{ marginBottom: 8 }}>
        <div style={{ fontSize: 10.5, fontWeight: 700, color: '#999', textTransform: 'uppercase', letterSpacing: 0.4 }}>
          Best for
        </div>
        <div style={{ fontSize: 12, color: '#555', marginTop: 2 }}>{format.business_types.join(' · ')}</div>
      </div>
    )}
    {format.modification_required && (
      <div>
        <div style={{ fontSize: 10.5, fontWeight: 700, color: '#999', textTransform: 'uppercase', letterSpacing: 0.4 }}>
          Rules
        </div>
        <div style={{ fontSize: 12, color: '#555', marginTop: 2, lineHeight: 1.5 }}>{format.modification_required}</div>
      </div>
    )}
  </div>
);

/** A browsable card for the Brand Playbook's "Visual Styles — Ads" section.
 *  Click (or the "See more" link) toggles the detail panel — the first
 *  click-to-expand style affordance in the app (video/organic style pickers
 *  show everything inline, with no equivalent expand). */
export const AdFormatGalleryCard = ({ format }: { format: AdFormat }) => {
  const [open, setOpen] = useState(false);
  const statusBadge = STATUS_COPY[format.status];
  return (
    <div
      style={{ borderRadius: 10, overflow: 'hidden', border: '1.5px solid #f0ede8', width: 220, background: '#fff' }}
    >
      <div
        role="button"
        tabIndex={0}
        onClick={() => setOpen((v) => !v)}
        onKeyDown={(e) => e.key === 'Enter' && setOpen((v) => !v)}
        style={{ padding: '10px 12px', cursor: 'pointer' }}
      >
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 6 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: '#111' }}>{format.name}</div>
          {statusBadge && (
            <span
              style={{
                flexShrink: 0,
                fontSize: 9.5,
                fontWeight: 700,
                padding: '2px 6px',
                borderRadius: 20,
                background: statusBadge.bg,
                color: statusBadge.fg,
                whiteSpace: 'nowrap',
              }}
            >
              {statusBadge.label}
            </span>
          )}
        </div>
        <div style={{ fontSize: 11.5, color: '#888', marginTop: 4, lineHeight: 1.4 }}>{format.claim}</div>
        <div style={{ marginTop: 8, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <BrandMarkChip value={format.brand_mark} />
          <span style={{ fontSize: 11, fontWeight: 700, color: PINK }}>{open ? 'See less' : 'See more'}</span>
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
  return (
    <div style={{ marginTop: 10, border: '1px solid #f0ede8', borderRadius: 10, overflow: 'hidden' }}>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          padding: '6px 10px',
          background: '#fdf0f6',
        }}
      >
        <span
          role="button"
          tabIndex={0}
          onClick={() => setInfoOpen((v) => !v)}
          onKeyDown={(e) => e.key === 'Enter' && setInfoOpen((v) => !v)}
          style={{ fontSize: 11.5, fontWeight: 700, color: PINK, cursor: 'pointer' }}
        >
          Style: {format.name} <span style={{ opacity: 0.6 }}>ⓘ</span>
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
              }}
            >
              <div style={{ fontSize: 12.5, fontWeight: 700, color: '#111' }}>{alt.name}</div>
              <div style={{ fontSize: 11, color: '#888', marginTop: 2 }}>{alt.claim}</div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};
