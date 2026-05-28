'use client';

import { CarouselSlide, ContentDraft, SocialMediaAgentService } from '@/src/api/SocialMediaAgentService';
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
  onDone: (sourceId: string, targetIds: string[]) => void;
}

function resolveUrl(url: string) {
  if (!url) return '';
  if (url.startsWith('/'))
    return `${process.env.NEXT_PUBLIC_URI_API_BASE_URL ?? process.env.NEXT_PUBLIC_API_BASE_URL ?? ''}${url}`;
  return url;
}

function SlideStrip({ slides }: { slides: CarouselSlide[] }) {
  const visible = slides.slice(0, 4);
  return (
    <div style={{ display: 'flex', gap: 3, padding: '6px 8px', background: '#F9FAFB', borderTop: '1px solid #F3F4F6' }}>
      {visible.map((s, i) => (
        <div
          key={i}
          style={{
            flex: 1,
            aspectRatio: '1',
            background: '#E5E7EB',
            borderRadius: 4,
            overflow: 'hidden',
            position: 'relative',
          }}
        >
          {s.image_url ? (
            <img
              src={resolveUrl(s.image_url)}
              alt={`slide ${i + 1}`}
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            />
          ) : (
            <div style={{ width: '100%', height: '100%', background: '#D1D5DB' }} />
          )}
        </div>
      ))}
      {slides.length > 4 && (
        <div
          style={{
            width: 24,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 10,
            color: '#6B7280',
            fontWeight: 700,
          }}
        >
          +{slides.length - 4}
        </div>
      )}
    </div>
  );
}

export default function SyncImageDialog({ drafts, selectedIds, onClose, onDone }: SyncImageDialogProps) {
  const selected = drafts.filter((d) => selectedIds.has(d.draft_id ?? d.id ?? ''));

  const allCarousels = selected.every((d) => d.post_type === 'carousel');
  const isCarouselMode = allCarousels && selected.some((d) => d.post_type === 'carousel');

  // For carousel mode: only allow syncing between drafts with the same slide count
  const slideCounts = isCarouselMode ? selected.map((d) => (d.slides ?? []).length) : [];
  const allSameSlideCount = slideCounts.length > 0 && slideCounts.every((n) => n === slideCounts[0]);
  const slideCountMismatch = isCarouselMode && !allSameSlideCount;

  // For feed mode: only show drafts that have an image
  const eligibleDrafts = isCarouselMode
    ? selected.filter((d) => (d.slides ?? []).some((s) => s.image_url))
    : selected.filter((d) => d.image_url);

  const [sourceDraftId, setSourceDraftId] = useState<string>('');
  const [applying, setApplying] = useState(false);

  const handleApply = async () => {
    if (!sourceDraftId) return;
    setApplying(true);
    try {
      const targetIds = selected
        .filter((d) => (d.draft_id ?? d.id) !== sourceDraftId)
        .map((d) => d.draft_id ?? d.id ?? '');

      const res = await SocialMediaAgentService.syncImageAcrossDrafts(sourceDraftId, targetIds);
      if (res.status) {
        const skipped = (res.responseData as { skipped?: { id: string; reason: string }[] })?.skipped ?? [];
        const count = res.responseData?.updated_count ?? targetIds.length;
        if (skipped.length > 0) {
          ToastService.showToast(
            `Synced to ${count} platform${count !== 1 ? 's' : ''}. ${skipped.length} skipped (slide count mismatch).`,
            ToastTypeEnum.Warning
          );
        } else {
          ToastService.showToast(
            `${isCarouselMode ? 'Slide images' : 'Image'} applied to ${count} platform${count !== 1 ? 's' : ''}`,
            ToastTypeEnum.Success
          );
        }
        onDone(sourceDraftId, targetIds);
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
          width: 560,
          maxWidth: '92vw',
          boxShadow: '0 8px 40px rgba(0,0,0,0.18)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <p style={{ fontSize: 17, fontWeight: 700, color: '#111', margin: '0 0 4px' }}>
          {isCarouselMode ? 'Sync carousel slides across platforms' : 'Sync image across platforms'}
        </p>
        <p style={{ fontSize: 13, color: '#6B7280', margin: '0 0 20px' }}>
          {isCarouselMode
            ? "Pick which platform's slide images to use. All slide images will be applied to the other selected carousels."
            : "Pick which platform's image to use. It will be applied to all other selected posts while keeping their individual captions."}
        </p>

        {slideCountMismatch && (
          <div
            style={{
              background: '#FEF3C7',
              border: '1px solid #FDE68A',
              borderRadius: 8,
              padding: '10px 14px',
              marginBottom: 16,
              fontSize: 13,
              color: '#92400E',
            }}
          >
            Selected carousels have different slide counts ({slideCounts.join(', ')} slides). Only carousels with the
            same number of slides can be synced.
          </div>
        )}

        {eligibleDrafts.length === 0 ? (
          <p style={{ fontSize: 13, color: '#9CA3AF', textAlign: 'center', padding: '24px 0' }}>
            {isCarouselMode
              ? 'None of the selected carousels have slide images yet. Generate images first.'
              : 'None of the selected drafts have images yet. Generate images first.'}
          </p>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: 12 }}>
            {eligibleDrafts.map((draft) => {
              const id = draft.draft_id ?? draft.id ?? '';
              const meta = platformMeta[draft.platform] ?? { label: draft.platform, icon: null, color: '#6B7280' };
              const selected = sourceDraftId === id;
              const slides = draft.slides ?? [];
              const slideCount = slides.length;

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
                    textAlign: 'left',
                  }}
                >
                  {isCarouselMode ? (
                    <SlideStrip slides={slides} />
                  ) : (
                    <div style={{ width: '100%', aspectRatio: '4/3', background: '#F3F4F6', overflow: 'hidden' }}>
                      <img
                        src={resolveUrl(draft.image_url!)}
                        alt={meta.label}
                        style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                      />
                    </div>
                  )}
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
                    {isCarouselMode && (
                      <span style={{ fontSize: 11, color: '#9CA3AF', marginLeft: 2 }}>{slideCount} slides</span>
                    )}
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
            {isCarouselMode
              ? `All ${(eligibleDrafts.find((d) => (d.draft_id ?? d.id) === sourceDraftId)?.slides ?? []).length} slide images will be applied to the other ${selectedIds.size - 1} selected carousel${selectedIds.size - 1 !== 1 ? 's' : ''}.`
              : `This image will be applied to the other ${selectedIds.size - 1} selected platform${selectedIds.size - 1 !== 1 ? 's' : ''}.`}
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
            disabled={!sourceDraftId || applying || eligibleDrafts.length < 2 || slideCountMismatch}
            style={{
              padding: '8px 20px',
              borderRadius: 8,
              border: 'none',
              background: !sourceDraftId || applying || slideCountMismatch ? '#E5E7EB' : '#CD1B78',
              color: !sourceDraftId || applying || slideCountMismatch ? '#9CA3AF' : '#fff',
              fontSize: 13,
              fontWeight: 700,
              cursor: !sourceDraftId || applying || slideCountMismatch ? 'not-allowed' : 'pointer',
            }}
          >
            {applying ? 'Applying…' : isCarouselMode ? 'Sync slides to all selected' : 'Apply to all selected'}
          </button>
        </div>
      </div>
    </div>
  );
}
