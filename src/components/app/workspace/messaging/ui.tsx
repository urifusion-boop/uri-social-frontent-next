'use client';

import type { CSSProperties, ReactNode } from 'react';
import { MSG_FONT, MSG_INK, MSG_LINE, MSG_MUTED, MSG_PINK } from './MessagingHeader';

/** The white panel every Messaging page sits in, under the tabs. */
export function Pane({ children, style }: { children: ReactNode; style?: CSSProperties }) {
  return (
    <div
      style={{
        background: '#fff',
        borderRadius: 14,
        border: '1px solid #F4E9EE',
        boxShadow: '0 1px 3px rgba(80,20,50,.05)',
        display: 'flex',
        minHeight: 0,
        overflow: 'hidden',
        fontFamily: MSG_FONT,
        color: MSG_INK,
        ...style,
      }}
    >
      {children}
    </div>
  );
}

export function Col({ children, style }: { children: ReactNode; style?: CSSProperties }) {
  return (
    <div style={{ borderRight: `1px solid ${MSG_LINE}`, minHeight: 0, overflowY: 'auto', ...style }}>{children}</div>
  );
}

export function Box({ children, style, selected }: { children: ReactNode; style?: CSSProperties; selected?: boolean }) {
  return (
    <div
      style={{
        border: `1px solid ${selected ? '#F2B8CF' : '#EFE8EC'}`,
        boxShadow: selected ? '0 0 0 3px #FBE3EE' : undefined,
        borderRadius: 12,
        background: '#fff',
        ...style,
      }}
    >
      {children}
    </div>
  );
}

export function Title({ children, sub }: { children: ReactNode; sub?: ReactNode }) {
  return (
    <div>
      <div style={{ fontSize: 14, fontWeight: 700, color: MSG_INK }}>{children}</div>
      {sub && <div style={{ fontSize: 12, color: MSG_MUTED, marginTop: 2 }}>{sub}</div>}
    </div>
  );
}

export function Label({ children, style }: { children: ReactNode; style?: CSSProperties }) {
  return <div style={{ fontSize: 12.5, fontWeight: 600, color: '#2A2230', ...style }}>{children}</div>;
}

export function Btn({
  children,
  onClick,
  kind = 'primary',
  disabled,
  style,
  type = 'button',
}: {
  children: ReactNode;
  onClick?: () => void;
  kind?: 'primary' | 'outline' | 'ghost' | 'danger';
  disabled?: boolean;
  style?: CSSProperties;
  type?: 'button' | 'submit';
}) {
  const look: Record<string, CSSProperties> = {
    primary: { background: MSG_PINK, color: '#fff', border: 'none', boxShadow: '0 4px 12px rgba(224,21,107,.22)' },
    outline: { background: '#fff', color: '#2A2230', border: '1px solid #ECE6EA' },
    ghost: { background: 'transparent', color: MSG_PINK, border: 'none' },
    danger: { background: '#fff', color: '#C62828', border: '1px solid #F5C7C7' },
  };
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      style={{
        height: 34,
        padding: '0 14px',
        borderRadius: 9,
        fontSize: 12.5,
        fontWeight: 600,
        fontFamily: MSG_FONT,
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 7,
        whiteSpace: 'nowrap',
        cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.55 : 1,
        ...look[kind],
        ...style,
      }}
    >
      {children}
    </button>
  );
}

export function Toggle({ on, onChange, label }: { on: boolean; onChange?: (v: boolean) => void; label?: string }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      aria-label={label}
      onClick={() => onChange?.(!on)}
      style={{
        width: 34,
        height: 19,
        borderRadius: 10,
        border: 'none',
        padding: 0,
        background: on ? MSG_PINK : '#E3DDE1',
        position: 'relative',
        flexShrink: 0,
        cursor: onChange ? 'pointer' : 'default',
      }}
    >
      <span
        style={{
          position: 'absolute',
          top: 2,
          left: on ? 17 : 2,
          width: 15,
          height: 15,
          borderRadius: '50%',
          background: '#fff',
          transition: 'left .15s',
        }}
      />
    </button>
  );
}

export function Pill({ children, fg, bg, style }: { children: ReactNode; fg: string; bg: string; style?: CSSProperties }) {
  return (
    <span
      style={{
        fontSize: 11,
        fontWeight: 600,
        padding: '2px 9px',
        borderRadius: 6,
        background: bg,
        color: fg,
        display: 'inline-block',
        whiteSpace: 'nowrap',
        ...style,
      }}
    >
      {children}
    </span>
  );
}

export function Field({
  value,
  onChange,
  placeholder,
  multiline,
  style,
  mono,
  onEnter,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  multiline?: boolean;
  style?: CSSProperties;
  mono?: boolean;
  onEnter?: () => void;
}) {
  const base: CSSProperties = {
    width: '100%',
    border: '1px solid #ECE6EA',
    borderRadius: 9,
    padding: multiline ? '9px 11px' : '0 11px',
    height: multiline ? undefined : 34,
    minHeight: multiline ? 76 : undefined,
    fontSize: 12.5,
    fontFamily: mono ? 'ui-monospace, Menlo, monospace' : MSG_FONT,
    color: '#2A2230',
    background: '#fff',
    outline: 'none',
    boxSizing: 'border-box',
    resize: multiline ? 'vertical' : undefined,
    lineHeight: 1.5,
    ...style,
  };
  return multiline ? (
    <textarea value={value} placeholder={placeholder} onChange={(e) => onChange(e.target.value)} style={base} />
  ) : (
    <input
      value={value}
      placeholder={placeholder}
      onChange={(e) => onChange(e.target.value)}
      onKeyDown={(e) => e.key === 'Enter' && onEnter?.()}
      style={base}
    />
  );
}

/** A row in a left-hand list (filters, categories, segments, settings sections). */
export function NavRow({
  label,
  count,
  active,
  onClick,
  icon,
}: {
  label: ReactNode;
  count?: number | string;
  active?: boolean;
  onClick?: () => void;
  icon?: ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        width: 'calc(100% - 16px)',
        margin: '0 8px 2px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '9px 12px',
        borderRadius: 7,
        border: 'none',
        background: active ? '#FDEEF4' : 'transparent',
        color: active ? '#D0145C' : '#2A2230',
        fontWeight: active ? 600 : 500,
        fontSize: 13.5,
        fontFamily: MSG_FONT,
        cursor: 'pointer',
        textAlign: 'left',
      }}
    >
      <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        {icon}
        {label}
      </span>
      {count !== undefined && <span>{count}</span>}
    </button>
  );
}

export function Muted({ children, style }: { children: ReactNode; style?: CSSProperties }) {
  return <div style={{ fontSize: 12, color: MSG_MUTED, lineHeight: 1.5, ...style }}>{children}</div>;
}

export function Bar({ percent, color }: { percent: number; color?: string }) {
  return (
    <div style={{ height: 7, borderRadius: 4, background: '#F4EEF1', overflow: 'hidden' }}>
      <div
        style={{
          width: `${Math.max(0, Math.min(100, percent))}%`,
          height: '100%',
          borderRadius: 4,
          background: color || 'linear-gradient(90deg,#E8237A,#C2185B)',
        }}
      />
    </div>
  );
}

export function apiError(e: unknown, fallback: string): string {
  const d = (e as { response?: { data?: { detail?: unknown } } })?.response?.data?.detail;
  return typeof d === 'string' && d ? d : fallback;
}
