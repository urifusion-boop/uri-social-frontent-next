'use client';

import { useState } from 'react';
import { Box, Button, Dialog, IconButton, TextField, Typography } from '@mui/material';
import { MdChevronLeft, MdChevronRight, MdClose } from 'react-icons/md';
import { ContentDraft, SocialMediaAgentService } from '@/src/api/SocialMediaAgentService';
import { ToastService } from '@/src/utils/toast.util';
import { ToastTypeEnum } from '@/src/models/enum-models/ToastTypeEnum';
import { PLATFORM_META, firstSlideImage, mediaMeta, isImagePending } from './GeneratedContentCard';

const PINK = '#CD1B78';

const STATUS_BADGE: Record<string, { bg: string; color: string; label: string }> = {
  draft: { bg: '#F3F4F6', color: '#374151', label: 'Draft' },
  pending_approval: { bg: '#FEF3C7', color: '#92400E', label: 'Needs Review' },
  scheduled: { bg: '#DBEAFE', color: '#1E40AF', label: 'Scheduled' },
  ready_to_publish: { bg: '#DBEAFE', color: '#1E40AF', label: 'Scheduled' },
  confirming: { bg: '#DBEAFE', color: '#1E40AF', label: 'Scheduled' },
  published: { bg: '#D1FAE5', color: '#065F46', label: 'Published' },
  denied: { bg: '#FEE2E2', color: '#991B1B', label: 'Archived' },
  replaced: { bg: '#FEE2E2', color: '#991B1B', label: 'Archived' },
  publish_failed: { bg: '#FEE2E2', color: '#991B1B', label: 'Archived' },
};

interface DraftDetailViewProps {
  draft: ContentDraft;
  connectedPlatforms: string[] | null;
  onClose: () => void;
  onEdit: (draft: ContentDraft) => void;
  onRefresh: () => void;
}

// The read-only counterpart to GeneratedDraftEditor — opened by clicking a
// card/row/calendar item, so "see everything about this post" and "edit
// this post" are two distinct, deliberate actions instead of one dialog
// doing both. A split layout (image left, full text + per-slide detail
// right) rather than the card's cramped single column, since this is where
// someone actually reads the whole thing, not just scans it.
export default function DraftDetailView({
  draft,
  connectedPlatforms,
  onClose,
  onEdit,
  onRefresh,
}: DraftDetailViewProps) {
  const platformKey = (draft.platform || '').toLowerCase();
  const meta = PLATFORM_META[platformKey];
  const { aspect, label } = mediaMeta(draft);
  const isCarousel = draft.post_type === 'carousel';
  const slides = draft.slides ?? [];
  const totalSlides = slides.length;
  const [slideIndex, setSlideIndex] = useState(0);
  const safeSlideIndex = Math.min(slideIndex, Math.max(totalSlides - 1, 0));
  const currentSlide = isCarousel ? slides[safeSlideIndex] : undefined;
  const previewImage = isCarousel ? currentSlide?.image_url : (draft.image_url ?? firstSlideImage(draft));
  const pending = isCarousel ? !currentSlide?.image_url && !currentSlide?.image_failed : isImagePending(draft);
  const failed = isCarousel
    ? !!currentSlide?.image_failed && !currentSlide?.image_url
    : !previewImage && draft.image_failed;
  const statusKey = draft.status ?? (draft.approval_status === 'pending' ? 'pending_approval' : draft.approval_status);
  const badge = (statusKey && STATUS_BADGE[statusKey]) || STATUS_BADGE.draft;
  const id = draft.draft_id ?? draft.id ?? '';
  const isConnected =
    connectedPlatforms === null || connectedPlatforms.map((p) => p.toLowerCase()).includes(platformKey);
  const tiktokNeedsFullFlow = platformKey === 'tiktok' && !draft.video_url;

  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [scheduleOpen, setScheduleOpen] = useState(false);
  const [scheduleAt, setScheduleAt] = useState('');
  const [busy, setBusy] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const doApprove = async (option: 'immediate' | 'schedule', datetime?: string) => {
    if (!isConnected) {
      ToastService.showToast(
        `${meta?.label ?? draft.platform} isn't connected — connect it first.`,
        ToastTypeEnum.Error
      );
      return;
    }
    setBusy(true);
    try {
      const res = await SocialMediaAgentService.approveContent({
        draft_ids: [id],
        schedule_option: option,
        ...(datetime ? { scheduled_datetime: new Date(datetime).toISOString() } : {}),
      });
      if (res.status) {
        ToastService.showToast(option === 'immediate' ? 'Published!' : 'Scheduled!', ToastTypeEnum.Success);
        onRefresh();
        onClose();
      } else {
        ToastService.showToast(res.responseMessage || 'Action failed', ToastTypeEnum.Error);
      }
    } catch {
      ToastService.showToast('Action failed — try again', ToastTypeEnum.Error);
    } finally {
      setBusy(false);
      setScheduleOpen(false);
    }
  };

  const handlePost = () => {
    if (tiktokNeedsFullFlow) {
      onEdit(draft);
      onClose();
      return;
    }
    doApprove('immediate');
  };

  const handleDelete = async () => {
    if (!confirmDelete) {
      setConfirmDelete(true);
      return;
    }
    setBusy(true);
    try {
      await SocialMediaAgentService.deleteDraft(id);
      ToastService.showToast('Deleted.', ToastTypeEnum.Success);
      onRefresh();
      onClose();
    } catch {
      ToastService.showToast('Could not delete — try again.', ToastTypeEnum.Error);
      setBusy(false);
      setConfirmDelete(false);
    }
  };

  return (
    <Dialog
      open
      onClose={onClose}
      maxWidth="lg"
      fullWidth
      PaperProps={{ sx: { borderRadius: '18px', overflow: 'hidden', height: { xs: '92vh', sm: '82vh' } } }}
    >
      <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, height: '100%', minHeight: 0 }}>
        {/* Image side */}
        <Box
          sx={{
            width: { xs: '100%', sm: '46%' },
            flexShrink: 0,
            background: '#111827',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            position: 'relative',
            minHeight: { xs: 260, sm: 'auto' },
          }}
        >
          <Box
            onClick={() => previewImage && setLightboxOpen(true)}
            sx={{
              width: '100%',
              height: '100%',
              aspectRatio: { xs: aspect, sm: 'auto' },
              position: 'relative',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: previewImage ? 'zoom-in' : 'default',
            }}
          >
            {draft.video_url ? (
              <Box
                component="video"
                src={draft.video_url}
                controls
                sx={{ width: '100%', height: '100%', objectFit: 'contain' }}
              />
            ) : previewImage ? (
              <Box
                component="img"
                src={previewImage}
                alt={label}
                sx={{ width: '100%', height: '100%', objectFit: 'contain' }}
              />
            ) : pending ? (
              <Box
                sx={{
                  width: '100%',
                  height: '100%',
                  background: 'linear-gradient(90deg, #1F2937 25%, #374151 50%, #1F2937 75%)',
                  backgroundSize: '200% 100%',
                  animation: 'shimmer 1.6s infinite',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  '@keyframes shimmer': {
                    '0%': { backgroundPosition: '200% 0' },
                    '100%': { backgroundPosition: '-200% 0' },
                  },
                }}
              >
                <Typography fontSize="13px" color="#D1D5DB">
                  🎨 Generating image…
                </Typography>
              </Box>
            ) : (
              <Typography fontSize="13px" color={failed ? '#F87171' : '#9CA3AF'}>
                {failed ? '⚠️ Image generation failed' : 'No image'}
              </Typography>
            )}

            {isCarousel && totalSlides > 1 && (
              <>
                <Box
                  sx={{
                    position: 'absolute',
                    bottom: 12,
                    left: '50%',
                    transform: 'translateX(-50%)',
                    background: 'rgba(0,0,0,.6)',
                    color: '#fff',
                    fontSize: '11px',
                    fontWeight: 700,
                    borderRadius: '999px',
                    px: 1.25,
                    py: 0.35,
                  }}
                >
                  {safeSlideIndex + 1} / {totalSlides}
                </Box>
                <IconButton
                  size="small"
                  onClick={(e) => {
                    e.stopPropagation();
                    setSlideIndex((i) => Math.max(0, i - 1));
                  }}
                  disabled={safeSlideIndex === 0}
                  sx={{
                    position: 'absolute',
                    left: 8,
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'rgba(255,255,255,.9)',
                    '&:hover': { background: '#fff' },
                    '&.Mui-disabled': { opacity: 0.3 },
                  }}
                >
                  <MdChevronLeft size={20} />
                </IconButton>
                <IconButton
                  size="small"
                  onClick={(e) => {
                    e.stopPropagation();
                    setSlideIndex((i) => Math.min(totalSlides - 1, i + 1));
                  }}
                  disabled={safeSlideIndex === totalSlides - 1}
                  sx={{
                    position: 'absolute',
                    right: 8,
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'rgba(255,255,255,.9)',
                    '&:hover': { background: '#fff' },
                    '&.Mui-disabled': { opacity: 0.3 },
                  }}
                >
                  <MdChevronRight size={20} />
                </IconButton>
              </>
            )}
          </Box>
        </Box>

        {/* Detail side */}
        <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0, minHeight: 0 }}>
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              px: 2.5,
              py: 2,
              borderBottom: '1px solid #E5E7EB',
              flexShrink: 0,
            }}
          >
            <Box display="flex" alignItems="center" gap={1.25} sx={{ minWidth: 0 }}>
              <Box
                sx={{
                  width: 30,
                  height: 30,
                  borderRadius: '8px',
                  background: meta?.color ?? '#9CA3AF',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}
              >
                {meta?.icon}
              </Box>
              <Box sx={{ minWidth: 0 }}>
                <Typography fontSize="14px" fontWeight={700} color="#111827" noWrap>
                  {meta?.label ?? draft.platform}
                </Typography>
                <Typography fontSize="11.5px" color="#9CA3AF" noWrap>
                  {label}
                </Typography>
              </Box>
              <Box
                component="span"
                sx={{
                  background: badge.bg,
                  color: badge.color,
                  borderRadius: '999px',
                  fontSize: '11px',
                  fontWeight: 700,
                  px: 1,
                  py: 0.35,
                  ml: 1,
                  whiteSpace: 'nowrap',
                }}
              >
                {badge.label}
              </Box>
            </Box>
            <IconButton size="small" onClick={onClose} sx={{ color: '#6B7280', flexShrink: 0 }}>
              <MdClose size={18} />
            </IconButton>
          </Box>

          <Box sx={{ flex: 1, overflowY: 'auto', px: 2.5, py: 2 }}>
            <Typography fontSize="12.5px" fontWeight={700} color="#111827" mb={0.75}>
              Caption
            </Typography>
            <Typography fontSize="13px" color="#374151" sx={{ whiteSpace: 'pre-wrap', mb: 2 }}>
              {draft.content}
            </Typography>

            {!!draft.hashtags?.length && (
              <>
                <Typography fontSize="12.5px" fontWeight={700} color="#111827" mb={0.75}>
                  Hashtags
                </Typography>
                <Typography fontSize="12.5px" color={PINK} sx={{ mb: 2 }}>
                  {draft.hashtags.map((h) => `#${h.replace(/^#+/, '')}`).join(' ')}
                </Typography>
              </>
            )}

            {isCarousel && totalSlides > 0 && (
              <>
                <Typography fontSize="12.5px" fontWeight={700} color="#111827" mb={0.75}>
                  Slides ({totalSlides})
                </Typography>
                <Box display="flex" flexDirection="column" gap={1}>
                  {slides.map((s, i) => (
                    <Box
                      key={i}
                      onClick={() => setSlideIndex(i)}
                      sx={{
                        display: 'flex',
                        gap: 1.25,
                        p: 1,
                        borderRadius: '8px',
                        border: '1px solid',
                        borderColor: i === safeSlideIndex ? PINK : '#E5E7EB',
                        background: i === safeSlideIndex ? '#FDF2F8' : '#fff',
                        cursor: 'pointer',
                      }}
                    >
                      <Box
                        sx={{
                          width: 44,
                          height: 44,
                          borderRadius: '6px',
                          flexShrink: 0,
                          background: s.image_url ? `url(${s.image_url}) center/cover` : '#F3F4F6',
                        }}
                      />
                      <Box sx={{ minWidth: 0 }}>
                        <Typography fontSize="11.5px" fontWeight={700} color="#111827" noWrap>
                          Slide {i + 1}
                          {s.headline ? ` — ${s.headline}` : ''}
                        </Typography>
                        {s.body && (
                          <Typography
                            fontSize="11.5px"
                            color="#6B7280"
                            sx={{
                              display: '-webkit-box',
                              WebkitLineClamp: 2,
                              WebkitBoxOrient: 'vertical',
                              overflow: 'hidden',
                            }}
                          >
                            {s.body}
                          </Typography>
                        )}
                      </Box>
                    </Box>
                  ))}
                </Box>
              </>
            )}
          </Box>

          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 1,
              px: 2.5,
              py: 2,
              borderTop: '1px solid #E5E7EB',
              flexShrink: 0,
            }}
          >
            <Button
              size="small"
              disabled={busy}
              onClick={handleDelete}
              onBlur={() => setConfirmDelete(false)}
              sx={{
                textTransform: 'none',
                fontWeight: 700,
                fontSize: '12.5px',
                color: confirmDelete ? '#fff' : '#DC2626',
                background: confirmDelete ? '#DC2626' : 'transparent',
                border: '1px solid',
                borderColor: '#FCA5A5',
                borderRadius: '8px',
                '&:hover': { background: confirmDelete ? '#B91C1C' : 'rgba(220,38,38,.06)' },
              }}
            >
              {confirmDelete ? 'Confirm delete?' : 'Delete'}
            </Button>

            <Box display="flex" gap={1}>
              <Button
                size="small"
                onClick={() => {
                  onEdit(draft);
                  onClose();
                }}
                sx={{
                  textTransform: 'none',
                  fontWeight: 700,
                  fontSize: '12.5px',
                  color: '#374151',
                  border: '1px solid #E5E7EB',
                  borderRadius: '8px',
                }}
              >
                Edit
              </Button>
              <Button
                size="small"
                disabled={busy}
                onClick={() => setScheduleOpen(true)}
                sx={{
                  textTransform: 'none',
                  fontWeight: 700,
                  fontSize: '12.5px',
                  color: '#374151',
                  border: '1px solid #E5E7EB',
                  borderRadius: '8px',
                }}
              >
                Schedule
              </Button>
              <Button
                size="small"
                disabled={busy}
                onClick={handlePost}
                sx={{
                  textTransform: 'none',
                  fontWeight: 700,
                  fontSize: '12.5px',
                  color: '#fff',
                  background: `linear-gradient(135deg, ${PINK} 0%, #A01560 100%)`,
                  borderRadius: '8px',
                  px: 1.75,
                  '&:hover': { background: `linear-gradient(135deg, #A01560 0%, ${PINK} 100%)` },
                }}
              >
                Post
              </Button>
            </Box>
          </Box>
        </Box>
      </Box>

      <Dialog open={scheduleOpen} onClose={() => setScheduleOpen(false)} maxWidth="xs" fullWidth>
        <Box sx={{ p: 2.5 }}>
          <Typography fontSize="15px" fontWeight={700} mb={1.5}>
            Schedule this post
          </Typography>
          <TextField
            type="datetime-local"
            fullWidth
            size="small"
            value={scheduleAt}
            onChange={(e) => setScheduleAt(e.target.value)}
            sx={{ mb: 2 }}
          />
          <Box display="flex" justifyContent="flex-end" gap={1}>
            <Button onClick={() => setScheduleOpen(false)} sx={{ textTransform: 'none', color: '#6B7280' }}>
              Cancel
            </Button>
            <Button
              variant="contained"
              disabled={!scheduleAt || busy}
              onClick={() => doApprove('schedule', scheduleAt)}
              sx={{ textTransform: 'none', background: PINK, '&:hover': { background: '#A01560' } }}
            >
              Confirm
            </Button>
          </Box>
        </Box>
      </Dialog>

      {previewImage && (
        <Dialog
          open={lightboxOpen}
          onClose={() => setLightboxOpen(false)}
          maxWidth="lg"
          PaperProps={{ sx: { background: 'transparent', boxShadow: 'none', overflow: 'visible' } }}
        >
          <Box sx={{ position: 'relative' }}>
            <IconButton
              onClick={() => setLightboxOpen(false)}
              aria-label="Close"
              sx={{
                position: 'absolute',
                top: -16,
                right: -16,
                background: '#fff',
                boxShadow: '0 1px 4px rgba(0,0,0,.3)',
                '&:hover': { background: '#F3F4F6' },
              }}
            >
              <MdClose size={18} />
            </IconButton>
            <Box
              component="img"
              src={previewImage}
              alt={label}
              sx={{ display: 'block', maxWidth: '90vw', maxHeight: '85vh', borderRadius: '8px' }}
            />
          </Box>
        </Dialog>
      )}
    </Dialog>
  );
}
