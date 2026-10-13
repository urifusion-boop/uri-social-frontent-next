'use client';

import { BrandProfileService, PlaybookHealthData } from '@/src/api/BrandProfileService';
import { ToastTypeEnum } from '@/src/models/enum-models/ToastTypeEnum';
import { ToastService } from '@/src/utils/toast.util';
import { useState } from 'react';

const colorFor = (score: number) => (score >= 75 ? '#15803d' : score >= 50 ? '#B45309' : '#B91C1C');

const chip: React.CSSProperties = {
  fontSize: 10.5,
  fontWeight: 600,
  padding: '2px 7px',
  borderRadius: 10,
  background: 'rgba(194,24,91,.08)',
  color: '#C2185B',
};

/** Brand Playbook → strength: a score, what to add next (and what it improves), and a voice preview. */
const PlaybookHealth = ({ health }: { health: PlaybookHealthData | null }) => {
  const [previewing, setPreviewing] = useState(false);
  const [preview, setPreview] = useState<{ caption: string; banned_words_used: string[] } | null>(null);

  if (!health) return null;
  const color = colorFor(health.score);

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

  return (
    <div
      style={{
        background: '#fff',
        borderRadius: 12,
        border: '1px solid #edecea',
        padding: '16px 18px',
        marginBottom: 10,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap' }}>
        <div style={{ fontSize: 30, fontWeight: 800, color, lineHeight: 1 }}>{health.score}%</div>
        <div style={{ flex: 1, minWidth: 180 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: '#111' }}>Playbook strength: {health.level}</div>
          <div style={{ height: 6, borderRadius: 3, background: '#f1efec', marginTop: 6, overflow: 'hidden' }}>
            <div style={{ width: `${health.score}%`, height: '100%', background: color, borderRadius: 3 }} />
          </div>
          <div style={{ fontSize: 11.5, color: '#888', marginTop: 4 }}>
            {health.filled} of {health.total} settings filled in. The more Jane knows, the less she guesses.
          </div>
        </div>
        <button
          type="button"
          onClick={runPreview}
          disabled={previewing}
          style={{
            padding: '7px 13px',
            borderRadius: 7,
            border: '1.5px solid #C2185B',
            background: '#fff',
            color: '#C2185B',
            fontSize: 12.5,
            fontWeight: 600,
            cursor: previewing ? 'not-allowed' : 'pointer',
            fontFamily: 'var(--wf)',
          }}
        >
          {previewing ? 'Writing…' : 'Preview Jane’s voice'}
        </button>
      </div>

      {preview && (
        <div
          style={{
            marginTop: 12,
            padding: '10px 12px',
            borderRadius: 8,
            background: '#FDF2F8',
            border: '1px solid #F3D4E4',
            fontSize: 13,
            color: '#111',
            whiteSpace: 'pre-wrap',
          }}
        >
          <div
            style={{ fontSize: 10.5, fontWeight: 700, color: '#C2185B', textTransform: 'uppercase', marginBottom: 4 }}
          >
            Sample Instagram caption from your saved Playbook
          </div>
          {preview.caption}
          {preview.banned_words_used.length > 0 && (
            <div style={{ fontSize: 11.5, color: '#B91C1C', marginTop: 6 }}>
              This sample used words you asked Jane to avoid: {preview.banned_words_used.join(', ')}
            </div>
          )}
        </div>
      )}

      {health.suggestions.length > 0 && (
        <div style={{ marginTop: 12 }}>
          <div style={{ fontSize: 11, fontWeight: 600, color: '#999', textTransform: 'uppercase', letterSpacing: 0.5 }}>
            Add next — biggest improvement first
          </div>
          {health.suggestions.map((s) => (
            <div key={s.key} style={{ padding: '8px 0', borderBottom: '1px solid #f3f1ee' }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: '#111' }}>
                {s.label} <span style={{ fontWeight: 400, color: '#999' }}>· {s.section}</span>
              </div>
              <div style={{ fontSize: 12.5, color: '#555', margin: '2px 0 5px' }}>{s.why}</div>
              <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', alignItems: 'center' }}>
                <span style={{ fontSize: 10.5, color: '#999' }}>Improves</span>
                {s.improves.map((job) => (
                  <span key={job} style={chip}>
                    {job}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default PlaybookHealth;
