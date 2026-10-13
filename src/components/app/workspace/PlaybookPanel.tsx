'use client';

import { ReactNode, useEffect, useState } from 'react';

/**
 * The shared look of the panels at the top of the Brand Playbook (Playbook
 * strength, Tell Jane): one compact header bar that drops down into a
 * detailed body. Same border, header, chevron and open/close motion for both.
 */

export const C = {
  pink: '#C2185B',
  plum: '#7B0D3D',
  ink: '#111827',
  body: '#374151',
  muted: '#6B7280',
  faint: '#9CA3AF',
  line: '#EEEAE6',
  soft: '#FBF7F9',
  green: '#047857',
  greenBg: '#ECFDF5',
  red: '#B91C1C',
  redBg: '#FEF2F2',
  amber: '#92400E',
  amberBg: '#FFFBEB',
};
export const GRADIENT = `linear-gradient(135deg, ${C.pink} 0%, ${C.plum} 100%)`;
export const font: React.CSSProperties = { fontFamily: 'var(--wf)' };

export const pill = (bg: string, color: string): React.CSSProperties => ({
  display: 'inline-flex',
  alignItems: 'center',
  gap: 4,
  padding: '1px 8px',
  borderRadius: 999,
  background: bg,
  color,
  fontSize: 10.5,
  fontWeight: 700,
  lineHeight: '17px',
  whiteSpace: 'nowrap',
});

export const Chevron = ({ open }: { open: boolean }) => (
  <svg
    width="16"
    height="16"
    viewBox="0 0 24 24"
    aria-hidden
    style={{ transition: 'transform .25s ease', transform: open ? 'rotate(180deg)' : 'none', flexShrink: 0 }}
  >
    <path d="M6 9l6 6 6-6" fill="none" stroke={C.muted} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

/** Open/closed, remembered per panel in this browser. */
export const usePanelOpen = (storageKey: string, initial = false): [boolean, () => void, (v: boolean) => void] => {
  const [open, setOpen] = useState(initial);
  useEffect(() => {
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved === '1') setOpen(true);
      if (saved === '0') setOpen(false);
    } catch {
      // storage unavailable — keep the default
    }
  }, [storageKey]);
  const set = (v: boolean) => {
    setOpen(v);
    try {
      localStorage.setItem(storageKey, v ? '1' : '0');
    } catch {
      // ignore
    }
  };
  return [open, () => set(!open), set];
};

interface PanelProps {
  id: string;
  open: boolean;
  onToggle: () => void;
  icon: ReactNode;
  title: ReactNode;
  /** Small tags after the title (e.g. a level). */
  tags?: ReactNode;
  subtitle?: ReactNode;
  /** Badges at the right of the header, inside the toggle. */
  badges?: ReactNode;
  /** Buttons at the right of the header, outside the toggle (e.g. "Preview Jane's voice"). */
  actions?: ReactNode;
  /** Shown under the header whether or not the panel is open (e.g. a result just produced). */
  below?: ReactNode;
  children: ReactNode;
}

export const PlaybookPanel = ({
  id,
  open,
  onToggle,
  icon,
  title,
  tags,
  subtitle,
  badges,
  actions,
  below,
  children,
}: PanelProps) => (
  <section
    className="pb-panel"
    style={{
      ...font,
      marginBottom: 10,
      borderRadius: 14,
      padding: 1,
      background: open ? GRADIENT : `linear-gradient(135deg, #F3C6D8, ${C.line})`,
      boxShadow: open ? '0 10px 30px rgba(123,13,61,.10)' : '0 1px 4px rgba(17,24,39,.04)',
      transition: 'box-shadow .25s ease',
    }}
  >
    <style>{`
      .pb-panel .pb-head:hover { background: #FDF7FA; }
      @media (max-width: 520px) {
        .pb-panel .pb-wide { display: none !important; }
        .pb-panel .pb-title { font-size: 13px !important; }
        .pb-panel .pb-actions { display: none !important; }
        .pb-panel .pb-actions-narrow { display: flex !important; }
      }
    `}</style>
    <div style={{ background: '#fff', borderRadius: 13, overflow: 'hidden' }}>
      <div
        className="pb-head"
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          padding: '0 12px 0 0',
          background: open ? 'linear-gradient(180deg, #FDF2F7 0%, #fff 100%)' : '#fff',
          transition: 'background .2s',
        }}
      >
        <button
          type="button"
          onClick={onToggle}
          aria-expanded={open}
          aria-controls={id}
          style={{
            ...font,
            flex: 1,
            minWidth: 0,
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            padding: '10px 0 10px 12px',
            border: 'none',
            background: 'transparent',
            cursor: 'pointer',
            textAlign: 'left',
          }}
        >
          {icon}
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, minWidth: 0 }}>
              <span
                className="pb-title"
                style={{
                  fontSize: 13.5,
                  fontWeight: 800,
                  color: C.ink,
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                }}
              >
                {title}
              </span>
              {tags}
            </div>
            {subtitle && (
              <div
                style={{
                  fontSize: 11.5,
                  color: C.muted,
                  marginTop: 1,
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                }}
              >
                {subtitle}
              </div>
            )}
          </div>
          {badges}
        </button>
        {actions && (
          <div className="pb-actions" style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
            {actions}
          </div>
        )}
        <button
          type="button"
          onClick={onToggle}
          aria-expanded={open}
          aria-controls={id}
          aria-label={open ? 'Collapse' : 'Expand'}
          style={{
            width: 28,
            height: 28,
            borderRadius: 8,
            border: `1px solid ${C.line}`,
            background: '#fff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            flexShrink: 0,
          }}
        >
          <Chevron open={open} />
        </button>
      </div>

      {below}

      <div
        id={id}
        style={{ display: 'grid', gridTemplateRows: open ? '1fr' : '0fr', transition: 'grid-template-rows .3s ease' }}
      >
        <div style={{ overflow: 'hidden', minHeight: 0 }} inert={!open}>
          <div style={{ padding: '2px 12px 12px', borderTop: `1px solid ${C.line}` }}>
            {actions && (
              <div className="pb-actions-narrow" style={{ display: 'none', gap: 6, marginTop: 10 }}>
                {actions}
              </div>
            )}
            {children}
          </div>
        </div>
      </div>
    </div>
  </section>
);
