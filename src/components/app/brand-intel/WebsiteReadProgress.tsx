'use client';

import type { WebsiteRead } from '@/src/api/BrandIntelService';
import { C, font } from '@/src/components/app/workspace/PlaybookPanel';

const EXPECTED_STEPS = 4; // check, home page, other pages, understanding

/** Jane reading the site, step by step, with what she has found so far. */
export default function WebsiteReadProgress({ read, compact = false }: { read: WebsiteRead; compact?: boolean }) {
  const steps = read.steps ?? [];
  const done = steps.filter((s) => s.status === 'done').length;
  const pct = Math.min(95, Math.round(((done + 0.5) / EXPECTED_STEPS) * 100));
  const host = read.url ? read.url.replace(/^https?:\/\//, '').replace(/\/$/, '') : 'your account';
  const queued = read.status === 'queued' && steps.length === 0;

  return (
    <div style={{ ...font, display: 'flex', flexDirection: 'column', gap: 12 }} aria-live="polite">
      {!compact && (
        <div style={{ fontSize: 18, fontWeight: 800, color: C.ink }}>
          {queued ? `Getting ready to read ${host}` : `Reading ${host}`}
        </div>
      )}
      <div
        role="progressbar"
        aria-valuenow={pct}
        aria-valuemin={0}
        aria-valuemax={100}
        style={{ height: 6, borderRadius: 6, background: C.line, overflow: 'hidden' }}
      >
        <div
          style={{
            width: `${queued ? 8 : pct}%`,
            height: '100%',
            borderRadius: 6,
            background: C.pink,
            transition: 'width .6s ease',
          }}
        />
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
        {queued && <StepLine status="running" label="Starting…" />}
        {steps.map((s) => (
          <StepLine key={s.id} status={s.status} label={s.label} detail={s.detail} />
        ))}
      </div>

      {(read.found?.length ?? 0) > 0 && (
        <div style={{ border: `1px solid ${C.line}`, borderRadius: 12, padding: '10px 12px', background: '#fff' }}>
          <div
            style={{
              fontSize: 10.5,
              fontWeight: 700,
              letterSpacing: '.08em',
              textTransform: 'uppercase',
              color: C.faint,
              marginBottom: 6,
            }}
          >
            Found so far
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {Array.from(new Set(read.found)).map((f) => (
              <span
                key={f}
                style={{
                  border: `1.5px solid ${C.pink}`,
                  color: C.pink,
                  borderRadius: 999,
                  padding: '3px 10px',
                  fontSize: 12,
                  fontWeight: 700,
                }}
              >
                {f}
              </span>
            ))}
          </div>
        </div>
      )}

      <div style={{ fontSize: 12.5, color: C.muted }}>
        This usually takes under a minute. You can leave this page; we&apos;ll let you know in your notifications when
        it&apos;s ready.
      </div>
    </div>
  );
}

function StepLine({ status, label, detail }: { status: 'running' | 'done'; label: string; detail?: string }) {
  return (
    <div style={{ display: 'flex', gap: 9, alignItems: 'center', fontSize: 13, color: C.body }}>
      {status === 'done' ? (
        <span
          aria-hidden
          style={{
            width: 18,
            height: 18,
            borderRadius: '50%',
            background: C.green,
            color: '#fff',
            fontSize: 11,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}
        >
          ✓
        </span>
      ) : (
        <span
          aria-hidden
          className="wr-spin"
          style={{
            width: 18,
            height: 18,
            borderRadius: '50%',
            border: `2px solid ${C.pink}`,
            borderRightColor: 'transparent',
            flexShrink: 0,
          }}
        />
      )}
      <span>
        {label}
        {detail ? <span style={{ color: C.faint }}> · {detail}</span> : null}
      </span>
      <style>{`.wr-spin{animation:wrspin .8s linear infinite}@keyframes wrspin{to{transform:rotate(360deg)}}
        @media (prefers-reduced-motion: reduce){.wr-spin{animation:none}}`}</style>
    </div>
  );
}
