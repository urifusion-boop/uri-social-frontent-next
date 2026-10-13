'use client';

import { BrandProfileService, PlaybookHealthData } from '@/src/api/BrandProfileService';
import { ToastTypeEnum } from '@/src/models/enum-models/ToastTypeEnum';
import { ToastService } from '@/src/utils/toast.util';
import { useState } from 'react';
import { C, font, pill, PlaybookPanel, usePanelOpen } from './PlaybookPanel';

const colorFor = (score: number) => (score >= 75 ? '#15803d' : score >= 50 ? '#B45309' : '#B91C1C');
const tintFor = (score: number) => (score >= 75 ? '#ECFDF5' : score >= 50 ? '#FFFBEB' : '#FEF2F2');

/** The score as a ring, with the number in the middle. */
const Ring = ({ score, size = 38 }: { score: number; size?: number }) => {
  const stroke = 4;
  const r = (size - stroke) / 2;
  const circ = 2 * Math.PI * r;
  const color = colorFor(score);
  return (
    <div style={{ position: 'relative', width: size, height: size, flexShrink: 0 }} aria-hidden>
      <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#F1EEEB" strokeWidth={stroke} />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={color}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circ}
          strokeDashoffset={circ * (1 - Math.max(0, Math.min(100, score)) / 100)}
          style={{ transition: 'stroke-dashoffset .6s ease' }}
        />
      </svg>
      <span
        style={{
          position: 'absolute',
          inset: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: size * 0.29,
          fontWeight: 800,
          color,
          letterSpacing: -0.3,
        }}
      >
        {score}
      </span>
    </div>
  );
};

/** Brand Playbook → strength: a score, what to add next (and what it improves), and a voice preview. */
const PlaybookHealth = ({ health }: { health: PlaybookHealthData | null }) => {
  const [open, toggle] = usePanelOpen('uri_pb_strength_open');
  const [previewing, setPreviewing] = useState(false);
  const [preview, setPreview] = useState<{ caption: string; banned_words_used: string[] } | null>(null);

  if (!health) return null;
  const color = colorFor(health.score);
  const next = health.suggestions.length;

  const runPreview = async () => {
    setPreviewing(true);
    try {
      const res = await BrandProfileService.previewVoice('instagram');
      if (res.status && res.responseData) setPreview(res.responseData);
      else ToastService.showToast(res.responseMessage || 'Could not write a preview', ToastTypeEnum.Error);
    } catch (err: unknown) {
      const e = err as { response?: { data?: { detail?: string } } };
      ToastService.showToast(e?.response?.data?.detail || 'Could not write a preview', ToastTypeEnum.Error);
    } finally {
      setPreviewing(false);
    }
  };

  const previewButton = (
    <button
      type="button"
      onClick={runPreview}
      disabled={previewing}
      style={{
        ...font,
        padding: '6px 11px',
        borderRadius: 8,
        border: '1px solid #F0C9D9',
        background: '#fff',
        color: C.pink,
        fontSize: 12,
        fontWeight: 700,
        cursor: previewing ? 'default' : 'pointer',
        opacity: previewing ? 0.6 : 1,
        whiteSpace: 'nowrap',
      }}
    >
      {previewing ? 'Writing…' : 'Preview Jane’s voice'}
    </button>
  );

  return (
    <PlaybookPanel
      id="pb-strength-panel"
      open={open}
      onToggle={toggle}
      icon={<Ring score={health.score} />}
      title="Playbook strength"
      tags={<span style={pill(tintFor(health.score), color)}>{health.level}</span>}
      subtitle={
        <>
          {health.filled} of {health.total} settings filled
          {next > 0 ? ` · ${next} to add next` : ' · nothing important missing'}
          <span className="pb-wide"> · the more Jane knows, the less she guesses</span>
        </>
      }
      actions={previewButton}
      below={
        preview && (
          <div style={{ padding: '0 12px 12px' }}>
            <div
              style={{
                position: 'relative',
                padding: '10px 32px 10px 12px',
                borderRadius: 10,
                background: '#FDF2F8',
                border: '1px solid #F3D4E4',
                fontSize: 12.5,
                lineHeight: 1.55,
                color: C.ink,
                whiteSpace: 'pre-wrap',
              }}
            >
              <div
                style={{
                  fontSize: 10,
                  fontWeight: 800,
                  color: C.pink,
                  textTransform: 'uppercase',
                  letterSpacing: 0.6,
                  marginBottom: 4,
                }}
              >
                Sample Instagram caption from your saved Playbook
              </div>
              {preview.caption}
              {preview.banned_words_used.length > 0 && (
                <div style={{ fontSize: 11.5, color: C.red, marginTop: 6 }}>
                  This sample used words you asked Jane to avoid: {preview.banned_words_used.join(', ')}
                </div>
              )}
              <button
                type="button"
                aria-label="Close preview"
                onClick={() => setPreview(null)}
                style={{
                  position: 'absolute',
                  top: 6,
                  right: 6,
                  border: 'none',
                  background: 'transparent',
                  color: C.faint,
                  fontSize: 16,
                  lineHeight: 1,
                  cursor: 'pointer',
                  padding: 4,
                }}
              >
                ×
              </button>
            </div>
          </div>
        )
      }
    >
      {/* Overall bar, for a quick read */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, margin: '10px 0 12px' }}>
        <div style={{ flex: 1, height: 5, borderRadius: 3, background: '#F1EEEB', overflow: 'hidden' }}>
          <div
            style={{
              width: `${health.score}%`,
              height: '100%',
              background: color,
              borderRadius: 3,
              transition: 'width .6s ease',
            }}
          />
        </div>
        <span style={{ fontSize: 11.5, fontWeight: 700, color }}>{health.score}%</span>
      </div>

      {next === 0 ? (
        <div style={{ fontSize: 12.5, color: C.muted, padding: '4px 0 2px' }}>
          Everything that matters most is filled in. Keep Business Pulse fresh so Jane knows what&apos;s happening now.
        </div>
      ) : (
        <>
          <div
            style={{
              fontSize: 10.5,
              fontWeight: 800,
              color: C.faint,
              textTransform: 'uppercase',
              letterSpacing: 0.6,
              marginBottom: 8,
            }}
          >
            Add next — biggest improvement first
          </div>
          <ol
            style={{
              listStyle: 'none',
              margin: 0,
              padding: 0,
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
              gap: 8,
            }}
          >
            {health.suggestions.map((s, i) => (
              <li
                key={s.key}
                style={{
                  display: 'flex',
                  gap: 10,
                  padding: '9px 10px',
                  border: `1px solid ${C.line}`,
                  borderRadius: 10,
                  background: i === 0 ? C.soft : '#fff',
                }}
              >
                <span
                  aria-hidden
                  style={{
                    width: 20,
                    height: 20,
                    borderRadius: '50%',
                    flexShrink: 0,
                    background: i === 0 ? C.pink : '#F1EEEB',
                    color: i === 0 ? '#fff' : C.muted,
                    fontSize: 10.5,
                    fontWeight: 800,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginTop: 1,
                  }}
                >
                  {i + 1}
                </span>
                <div style={{ minWidth: 0, flex: 1 }}>
                  <div style={{ fontSize: 12.5, fontWeight: 800, color: C.ink }}>
                    {s.label} <span style={{ fontWeight: 500, color: C.faint }}>· {s.section}</span>
                  </div>
                  <div style={{ fontSize: 12, color: C.body, lineHeight: 1.45, margin: '2px 0 6px' }}>{s.why}</div>
                  <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', alignItems: 'center' }}>
                    <span style={{ fontSize: 10.5, color: C.faint, marginRight: 2 }}>Improves</span>
                    {s.improves.map((job) => (
                      <span key={job} style={pill('#FCE4EC', C.pink)}>
                        {job}
                      </span>
                    ))}
                  </div>
                </div>
              </li>
            ))}
          </ol>
        </>
      )}
    </PlaybookPanel>
  );
};

export default PlaybookHealth;
