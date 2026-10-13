'use client';

import { BrandProfileData, BrandProfileService, PlaybookSuggestion } from '@/src/api/BrandProfileService';
import { ToastTypeEnum } from '@/src/models/enum-models/ToastTypeEnum';
import { ToastService } from '@/src/utils/toast.util';
import { useEffect, useState } from 'react';

const btn = (primary = false): React.CSSProperties => ({
  padding: '5px 12px',
  borderRadius: 7,
  border: '1.5px solid #C2185B',
  background: primary ? '#C2185B' : '#fff',
  color: primary ? '#fff' : '#C2185B',
  fontSize: 12,
  fontWeight: 600,
  cursor: 'pointer',
  fontFamily: 'var(--wf)',
});

interface Props {
  profile: BrandProfileData | null;
  onProfileUpdate: (p: BrandProfileData) => void;
}

/**
 * "Jane noticed": Playbook changes suggested from how the user keeps editing
 * her drafts and when their posts perform best. Each shows its evidence;
 * nothing changes until Apply. Renders nothing when there's nothing to suggest.
 */
const PlaybookSuggestions = ({ profile, onProfileUpdate }: Props) => {
  const [suggestions, setSuggestions] = useState<PlaybookSuggestion[]>([]);
  const [busy, setBusy] = useState('');

  useEffect(() => {
    BrandProfileService.getSuggestions().then(setSuggestions);
  }, [profile]);

  if (suggestions.length === 0) return null;

  const apply = async (s: PlaybookSuggestion) => {
    setBusy(s.id);
    try {
      const res = await BrandProfileService.applySuggestion(s.id);
      if (res.status && res.responseData) {
        onProfileUpdate(res.responseData);
        ToastService.showToast('Playbook updated', ToastTypeEnum.Success);
      } else {
        ToastService.showToast(res.responseMessage || 'Could not apply', ToastTypeEnum.Error);
      }
    } catch (err: unknown) {
      const e = err as { response?: { data?: { detail?: string } } };
      ToastService.showToast(e?.response?.data?.detail || 'Could not apply', ToastTypeEnum.Error);
      BrandProfileService.getSuggestions().then(setSuggestions);
    } finally {
      setBusy('');
    }
  };

  const dismiss = async (s: PlaybookSuggestion) => {
    setBusy(s.id);
    try {
      await BrandProfileService.dismissSuggestion(s.id);
      setSuggestions((prev) => prev.filter((x) => x.id !== s.id));
    } catch {
      ToastService.showToast('Could not dismiss', ToastTypeEnum.Error);
    } finally {
      setBusy('');
    }
  };

  return (
    <div
      style={{
        background: '#FFFBEB',
        borderRadius: 12,
        border: '1px solid #FDE68A',
        padding: '14px 18px',
        marginBottom: 10,
      }}
    >
      <div style={{ fontSize: 12, fontWeight: 700, color: '#92400E', textTransform: 'uppercase', letterSpacing: 0.8 }}>
        Jane noticed
      </div>
      <div style={{ fontSize: 12, color: '#92400E', marginBottom: 6 }}>
        Based on how you edit her drafts and how your posts perform. Nothing changes unless you apply it.
      </div>
      {suggestions.map((s) => (
        <div key={s.id} style={{ padding: '9px 0', borderTop: '1px solid #FDE68A' }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: '#111' }}>{s.title}</div>
          <div style={{ fontSize: 12.5, color: '#555', margin: '2px 0' }}>{s.evidence}</div>
          <div style={{ fontSize: 12.5, color: '#111', marginBottom: 7 }}>{s.change}</div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button type="button" style={btn(true)} disabled={busy === s.id} onClick={() => apply(s)}>
              {busy === s.id ? 'Working…' : 'Apply'}
            </button>
            <button type="button" style={btn()} disabled={busy === s.id} onClick={() => dismiss(s)}>
              Not now
            </button>
          </div>
        </div>
      ))}
    </div>
  );
};

export default PlaybookSuggestions;
