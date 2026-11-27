'use client';

import { CSSProperties, ReactNode } from 'react';
import { card, ghostPill, INK, MUTED, primaryPill } from '../messaging/look';

export const FONT = "'Urbanist', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif";
export const PINK = '#AD1457';
export const PINK_SOFT = 'rgba(194,24,91,.08)';

export const inputStyle: CSSProperties = {
  border: '1px solid rgba(0,0,0,.12)',
  borderRadius: 8,
  padding: '8px 10px',
  fontSize: 13,
  fontFamily: FONT,
  outline: 'none',
  width: '100%',
  boxSizing: 'border-box',
  background: '#fff',
};

export function errorText(e: unknown, fallback: string): string {
  const detail = (e as { response?: { data?: { detail?: unknown } } })?.response?.data?.detail;
  if (typeof detail === 'string') return detail;
  if (detail && typeof detail === 'object' && 'message' in detail) {
    return String((detail as { message: unknown }).message);
  }
  return fallback;
}

export function Card({
  title,
  desc,
  children,
  right,
}: {
  title?: string;
  desc?: string;
  children: ReactNode;
  right?: ReactNode;
}) {
  return (
    <div
      style={{
        ...card,
        display: 'flex',
        flexDirection: 'column',
        gap: 14,
      }}
    >
      {(title || right) && (
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            {title && <div style={{ fontSize: 17, fontWeight: 900, color: INK, letterSpacing: -0.2 }}>{title}</div>}
            {desc && <div style={{ fontSize: 13, color: MUTED, marginTop: 3, lineHeight: 1.5 }}>{desc}</div>}
          </div>
          {right}
        </div>
      )}
      {children}
    </div>
  );
}

export function Btn({
  children,
  onClick,
  kind = 'primary',
  disabled,
  small,
  type = 'button',
  title,
}: {
  children: ReactNode;
  onClick?: () => void;
  title?: string;
  kind?: 'primary' | 'secondary' | 'ghost' | 'danger';
  disabled?: boolean;
  small?: boolean;
  type?: 'button' | 'submit';
}) {
  const palette: Record<string, CSSProperties> = {
    primary: primaryPill,
    secondary: { ...ghostPill, color: PINK, border: '1px solid rgba(194,24,91,.35)' },
    ghost: ghostPill,
    danger: { ...ghostPill, color: '#C62828', border: '1px solid rgba(198,40,40,.35)' },
  };
  return (
    <button
      type={type}
      title={title}
      onClick={onClick}
      disabled={disabled}
      style={{
        ...palette[kind],
        padding: small ? '6px 12px' : '9px 16px',
        fontSize: small ? 12 : 13,
        fontWeight: 800,
        fontFamily: FONT,
        cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.55 : 1,
        whiteSpace: 'nowrap',
      }}
    >
      {children}
    </button>
  );
}

export function Chip({
  children,
  active,
  onClick,
  tone = 'pink',
}: {
  children: ReactNode;
  active?: boolean;
  onClick?: () => void;
  tone?: 'pink' | 'grey' | 'green' | 'amber';
}) {
  const tones: Record<string, CSSProperties> = {
    pink: { color: PINK, background: PINK_SOFT, border: '1px solid rgba(194,24,91,.2)' },
    grey: { color: '#555', background: '#f4f4f4', border: '1px solid rgba(0,0,0,.06)' },
    green: { color: '#1B5E20', background: '#E8F5E9', border: '1px solid #C8E6C9' },
    amber: { color: '#7A4B00', background: '#FFF7E6', border: '1px solid #F5D9A8' },
  };
  const style: CSSProperties = onClick
    ? {
        color: active ? PINK : '#555',
        background: active ? PINK_SOFT : '#fff',
        border: active ? '1px solid #E91E63' : '1px solid rgba(0,0,0,.12)',
        cursor: 'pointer',
      }
    : tones[tone];
  const Tag = onClick ? 'button' : 'span';
  return (
    <Tag
      type={onClick ? 'button' : undefined}
      onClick={onClick}
      style={{
        ...style,
        borderRadius: 999,
        padding: '5px 11px',
        fontSize: 12,
        fontWeight: 800,
        fontFamily: FONT,
        display: 'inline-flex',
        alignItems: 'center',
        gap: 4,
      }}
    >
      {children}
    </Tag>
  );
}

export function TraitSlider({
  label,
  low,
  high,
  value,
  onChange,
  disabled,
}: {
  label: string;
  low: string;
  high: string;
  value: number;
  onChange: (v: number) => void;
  disabled?: boolean;
}) {
  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
        <span style={{ fontSize: 12.5, fontWeight: 700, color: '#444' }}>{label}</span>
        <span style={{ fontSize: 12.5, fontWeight: 800, color: PINK }}>{value}</span>
      </div>
      <input
        type="range"
        min={0}
        max={100}
        value={value}
        disabled={disabled}
        onChange={(e) => onChange(Number(e.target.value))}
        aria-label={label}
        style={{ width: '100%', accentColor: PINK }}
      />
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: '#999' }}>
        <span>{low}</span>
        <span>{high}</span>
      </div>
    </div>
  );
}

export const TRAIT_NAMES: Record<string, string> = {
  formality: 'Formality',
  warmth: 'Warmth',
  enthusiasm: 'Enthusiasm',
  humour: 'Humour',
  empathy: 'Empathy',
  directness: 'Directness',
  verbosity: 'Reply length',
  proactivity: 'Proactivity',
  sales_assertiveness: 'Sales assertiveness',
  emoji: 'Emoji',
  question_frequency: 'Questions',
  localization: 'Local expression',
};

export function statusOf(p: { status: string; active_version: number | null; has_unpublished_changes: boolean }) {
  if (!p.active_version) return { text: 'Draft · not live yet', tone: 'amber' as const };
  if (p.has_unpublished_changes)
    return { text: `Live v${p.active_version} · unpublished edits`, tone: 'amber' as const };
  return { text: `Live · v${p.active_version}`, tone: 'green' as const };
}

export function when(at: string | null | undefined): string {
  if (!at) return '';
  const d = new Date(at.endsWith('Z') || at.includes('+') ? at : `${at}Z`);
  return d.toLocaleString(undefined, { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
}
