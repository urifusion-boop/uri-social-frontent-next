'use client';

import { ContentDraft, SocialMediaAgentService } from '@/src/api/SocialMediaAgentService';
import { ToastTypeEnum } from '@/src/models/enum-models/ToastTypeEnum';
import { ToastService } from '@/src/utils/toast.util';
import { useState } from 'react';
import { FaFacebook, FaInstagram, FaLinkedin, FaTwitter } from 'react-icons/fa';

const platformMeta: Record<string, { label: string; icon: React.ReactNode; color: string }> = {
  facebook: { label: 'Facebook', icon: <FaFacebook size={13} color="#1877F2" />, color: '#1877F2' },
  instagram: { label: 'Instagram', icon: <FaInstagram size={13} color="#E1306C" />, color: '#E1306C' },
  twitter: { label: 'Twitter / X', icon: <FaTwitter size={13} color="#1DA1F2" />, color: '#1DA1F2' },
  linkedin: { label: 'LinkedIn', icon: <FaLinkedin size={13} color="#0A66C2" />, color: '#0A66C2' },
};

interface SyncImageDialogProps {
  drafts: ContentDraft[];
  selectedIds: Set<string>;
  onClose: () => void;
  onDone: () => void;
}

function resolveUrl(url: string) {
  if (!url) return '';
  if (url.startsWith('/'))
    return `${process.env.NEXT_PUBLIC_URI_API_BASE_URL ?? process.env.NEXT_PUBLIC_API_BASE_URL ?? ''}${url}`;
  return url;
}

export default function SyncImageDialog({ drafts, selectedIds, onClose, onDone }: SyncImageDialogProps) {
  const selectedDrafts = drafts.filter((d) => {
    const id = d.draft_id ?? d.id ?? '';
    return selectedIds.has(id) && d.image_url;
  });

  const [sourceDraftId, setSourceDraftId] = useState<string>('');
  const [applying, setApplying] = useState(false);

  const handleApply = async () => {
    if (!sourceDraftId) return;
    setApplying(true);
    try {
      const targetIds = drafts
        .filter((d) => {
          const id = d.draft_id ?? d.id ?? '';
          return selectedIds.has(id) && id !== sourceDraftId;
        })
        .map((d) => d.draft_id ?? d.id ?? '');

      const res = await SocialMediaAgentService.syncImageAcrossDrafts(sourceDraftId, targetIds);
      if (res.status) {
        ToastService.showToast(
          `Image applied to ${res.responseData?.updated_count ?? targetIds.length} platform${targetIds.length !== 1 ? 's' : ''}`,
          ToastTypeEnum.Success
        );
        onDone();
      } else {
        ToastService.showToast(res.responseMessage || 'Failed to sync image', ToastTypeEnum.Error);
      }
    } catch {
      ToastService.showToast('Failed to sync image', ToastTypeEnum.Error);
    } finally {
      setApplying(false);
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.45)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1400,
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: '#fff',
          borderRadius: 16,
          padding: 28,
          width: 520,
          maxWidth: '92vw',
          boxShadow: '0 8px 40px rgba(0,0,0,0.18)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <p style={{ fontSize: 17, fontWeight: 700, color: '#111', margin: '0 0 4px' }}>Sync image across platforms</p>
        <p style={{ fontSize: 13, color: '#6B7280', margin: '0 0 20px' }}>
          Pick which platform&apos;s image to use. It will be applied to all other selected posts while keeping their
          individual captions.
        </p>

        {selectedDrafts.length === 0 ? (
          <p style={{ fontSize: 13, color: '#9CA3AF', textAlign: 'center', padding: '24px 0' }}>
            None of the selected drafts have images yet. Generate images first.
          </p>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: 12 }}>
            {selectedDrafts.map((draft) => {
              const id = draft.draft_id ?? draft.id ?? '';
              const meta = platformMeta[draft.platform] ?? { label: draft.platform, icon: null, color: '#6B7280' };
              const selected = sourceDraftId === id;
              return (
                <button
                  key={id}
                  onClick={() => setSourceDraftId(selected ? '' : id)}
                  style={{
                    border: `2px solid ${selected ? '#CD1B78' : '#E5E7EB'}`,
                    borderRadius: 10,
                    background: selected ? '#FDF2F8' : '#fff',
                    padding: 0,
                    cursor: 'pointer',
                    overflow: 'hidden',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'stretch',
                    transition: 'border-color 0.15s, background 0.15s',
                  }}
                >
                  {/* Thumbnail */}
                  <div style={{ width: '100%', aspectRatio: '4/3', background: '#F3F4F6', overflow: 'hidden' }}>
                    <img
                      src={resolveUrl(draft.image_url!)}
                      alt={meta.label}
                      style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                    />
                  </div>
                  {/* Platform label */}
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 5,
                      padding: '7px 10px',
                      borderTop: '1px solid #F3F4F6',
                    }}
                  >
                    {meta.icon}
                    <span style={{ fontSize: 12, fontWeight: 600, color: selected ? '#CD1B78' : '#374151' }}>
                      {meta.label}
                    </span>
                    {selected && (
                      <span style={{ marginLeft: 'auto', fontSize: 11, color: '#CD1B78', fontWeight: 700 }}>✓</span>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        )}

        {sourceDraftId && (
          <p style={{ fontSize: 12, color: '#6B7280', margin: '14px 0 0' }}>
            This image will be applied to the other {selectedIds.size - 1} selected platform
            {selectedIds.size - 1 !== 1 ? 's' : ''}.
          </p>
        )}

        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 20 }}>
          <button
            onClick={onClose}
            style={{
              padding: '8px 18px',
              borderRadius: 8,
              border: '1.5px solid #E5E7EB',
              background: '#fff',
              fontSize: 13,
              fontWeight: 600,
              color: '#374151',
              cursor: 'pointer',
            }}
          >
            Cancel
          </button>
          <button
            onClick={handleApply}
            disabled={!sourceDraftId || applying || selectedDrafts.length < 2}
            style={{
              padding: '8px 20px',
              borderRadius: 8,
              border: 'none',
              background: !sourceDraftId || applying ? '#E5E7EB' : '#CD1B78',
              color: !sourceDraftId || applying ? '#9CA3AF' : '#fff',
              fontSize: 13,
              fontWeight: 700,
              cursor: !sourceDraftId || applying ? 'not-allowed' : 'pointer',
            }}
          >
            {applying ? 'Applying…' : 'Apply to all selected'}
          </button>
        </div>
      </div>
    </div>
  );
}
