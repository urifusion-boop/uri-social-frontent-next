'use client';

import type { ReadStep } from '@/src/api/BrandIntelService';
import { C, font, GRADIENT, pill } from '@/src/components/app/workspace/PlaybookPanel';
import type { ReactNode } from 'react';

export { C, font, GRADIENT, pill };

export const card: React.CSSProperties = {
  background: '#fff',
  border: `1px solid ${C.line}`,
  borderRadius: 14,
  padding: 14,
  display: 'flex',
  flexDirection: 'column',
  gap: 8,
  minWidth: 0,
};

export const btn = (kind: 'primary' | 'ghost' | 'quiet' | 'link' = 'ghost', busy = false): React.CSSProperties => ({
  ...font,
  border: kind === 'ghost' ? `1.5px solid ${C.pink}` : 'none',
  borderRadius: kind === 'link' ? 0 : 20,
  padding: kind === 'link' ? 0 : kind === 'quiet' ? '6px 8px' : '7px 14px',
  background: kind === 'primary' ? GRADIENT : kind === 'ghost' ? '#fff' : 'none',
  color: kind === 'primary' ? '#fff' : kind === 'quiet' ? C.muted : C.pink,
  fontWeight: 700,
  fontSize: 12.5,
  cursor: busy ? 'default' : 'pointer',
  opacity: busy ? 0.65 : 1,
  whiteSpace: 'nowrap',
  textDecoration: kind === 'link' ? 'underline' : 'none',
  boxShadow: kind === 'primary' ? '0 4px 14px rgba(194,24,91,.22)' : 'none',
});

export const input: React.CSSProperties = {
  ...font,
  border: `1.5px solid ${C.line}`,
  borderRadius: 10,
  padding: '9px 12px',
  fontSize: 13.5,
  color: C.ink,
  outline: 'none',
  minWidth: 0,
  background: '#fff',
};

export function errorText(e: unknown, fallback: string): string {
  const err = e as { response?: { data?: { detail?: unknown } } };
  const d = err?.response?.data?.detail;
  return typeof d === 'string' && d.trim() ? d : fallback;
}

export function Steps({ steps }: { steps: ReadStep[] }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }} aria-live="polite">
      {steps.map((s) => (
        <div key={s.id} style={{ display: 'flex', gap: 8, alignItems: 'center', fontSize: 13, color: C.body }}>
          {s.status === 'done' ? (
            <span aria-hidden style={{ width: 16, height: 16, borderRadius: '50%', background: C.green, color: '#fff', fontSize: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              ✓
            </span>
          ) : (
            <span aria-hidden className="cmp-spin" style={{ width: 16, height: 16, borderRadius: '50%', border: `2px solid ${C.pink}`, borderRightColor: 'transparent', flexShrink: 0 }} />
          )}
          <span>
            {s.label}
            {s.detail ? <span style={{ color: C.faint }}> · {s.detail}</span> : null}
          </span>
        </div>
      ))}
      <style>{`.cmp-spin{animation:cmpspin .8s linear infinite}@keyframes cmpspin{to{transform:rotate(360deg)}}
        @media (prefers-reduced-motion: reduce){.cmp-spin{animation:none}}`}</style>
    </div>
  );
}

export function Notice({ tone = 'amber', children }: { tone?: 'amber' | 'red' | 'pink'; children: ReactNode }) {
  const colors = tone === 'red' ? [C.redBg, C.red] : tone === 'pink' ? ['#FDF2F7', C.pink] : [C.amberBg, C.amber];
  return (
    <div role={tone === 'pink' ? undefined : 'alert'} style={{ background: colors[0], color: colors[1], borderRadius: 10, padding: '10px 12px', fontSize: 13, lineHeight: 1.5 }}>
      {children}
    </div>
  );
}

export const linkLabel = (url: string) => url.replace(/^https?:\/\/(www\.)?/, '').replace(/\/$/, '');
