'use client';

import { ReactElement } from 'react';
import {
  ApprovePayload,
  ApprovedDraft,
  ContentDraft,
  DenyPayload,
  SocialMediaAgentService,
} from '@/src/api/SocialMediaAgentService';
import { SocialConnectionService } from '@/src/api/SocialConnectionService';
import { ToastTypeEnum } from '@/src/models/enum-models/ToastTypeEnum';
import { ToastService } from '@/src/utils/toast.util';
import {
  Box,
  Button,
  Checkbox,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControlLabel,
  IconButton,
  Menu,
  MenuItem,
  TextField,
  Typography,
} from '@mui/material';
import { useEffect, useRef, useState } from 'react';
import { FaFacebook, FaInstagram, FaLinkedin, FaTwitter } from 'react-icons/fa';
import { MdChevronLeft, MdChevronRight } from 'react-icons/md';
import DraftEditor from './DraftEditor';

interface DraftCardProps {
  draft: ContentDraft;
  onRefresh: () => void;
  selectable?: boolean;
  selected?: boolean;
  onSelectToggle?: (draftId: string) => void;
}

const platformChip: Record<string, { icon: ReactElement; color: string; bg: string }> = {
  facebook: { icon: <FaFacebook size={13} color="#1877F2" />, color: '#1877F2', bg: '#EFF6FF' },
  instagram: { icon: <FaInstagram size={13} color="#E1306C" />, color: '#E1306C', bg: '#FFF0F6' },
  twitter: { icon: <FaTwitter size={13} color="#1DA1F2" />, color: '#1DA1F2', bg: '#EFF6FF' },
  linkedin: { icon: <FaLinkedin size={13} color="#0A66C2" />, color: '#0A66C2', bg: '#EFF6FF' },
};

const statusColors: Record<string, { bg: string; color: string }> = {
  draft: { bg: '#F3F4F6', color: '#374151' },
  pending_approval: { bg: '#FEF3C7', color: '#92400E' },
  approved: { bg: '#D1FAE5', color: '#065F46' },
  published: { bg: '#DBEAFE', color: '#1E40AF' },
  denied: { bg: '#FEE2E2', color: '#991B1B' },
  publish_failed: { bg: '#FEE2E2', color: '#991B1B' },
  scheduled: { bg: '#EDE9FE', color: '#5B21B6' },
};

// Industry-standard aspect ratios per platform
const PLATFORM_ASPECT: Record<string, string> = {
  linkedin: '1200 / 628', // 1.91:1 — LinkedIn recommended
  twitter: '16 / 9', // 1200×675 — Twitter/X standard
  facebook: '1200 / 630', // 1.91:1 — Facebook recommended
  instagram: '4 / 5', // 1080×1350 — highest reach on Instagram
};

const DraftCard = ({ draft: initialDraft, onRefresh, selectable, selected, onSelectToggle }: DraftCardProps) => {
  const [draft, setDraft] = useState<ContentDraft>(initialDraft);

  // Sync from parent when the parent refreshes (e.g. image_url arrives after background generation).
  // Only update while not editing so we don't discard the user's in-progress changes.
  useEffect(() => {
    if (!editing) {
      setDraft(initialDraft);
      // Reset imageLoaded and imageError so the img onLoad/onError fire again
      // for the new URL, preventing stale shimmer or 'Image unavailable' state.
      setImageLoaded(false);
      setImageError(false);
      imageRetryRef.current = 0;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialDraft.image_url, initialDraft.status, initialDraft.approval_status, initialDraft.slides]);
  const [editing, setEditing] = useState(false);
  const [denyOpen, setDenyOpen] = useState(false);
  const [denyReason, setDenyReason] = useState('');
  const [requestRegen, setRequestRegen] = useState(false);
  const [approveAnchor, setApproveAnchor] = useState<null | HTMLElement>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [scheduleOpen, setScheduleOpen] = useState(false);
  const [scheduledAt, setScheduledAt] = useState('');
  const [loading, setLoading] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);
  const imageRetryRef = useRef(0);
  // Track which slide URLs have already loaded so navigating back doesn't re-shimmer
  const loadedSlideUrls = useState<Set<string>>(() => new Set())[0];
  const [imageHovered, setImageHovered] = useState(false);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [imageEditOpen, setImageEditOpen] = useState(false);
  const [imageFeedback, setImageFeedback] = useState('');
  const [imageRegenerating, setImageRegenerating] = useState(false);
  const [slideIndex, setSlideIndex] = useState(0);

  const postType = draft.post_type ?? 'feed';
  const slides = draft.slides ?? [];
  const isCarousel = postType === 'carousel' && slides.length > 0;
  const isStory = postType === 'story';
  const totalSlides = slides.length;
  const currentSlide = isCarousel ? slides[slideIndex] : null;

  // Reset slide index and loaded cache when draft changes
  useEffect(() => {
    setSlideIndex(0);
    setImageLoaded(false);
    setImageError(false);
    imageRetryRef.current = 0;
    loadedSlideUrls.clear();
  }, [draft.id]);

  const resolveUrl = (url: string) => {
    if (!url.startsWith('/')) return url;
    const base = process.env.NEXT_PUBLIC_URI_API_BASE_URL || process.env.NEXT_PUBLIC_URI_API_BASE_URL_DEV || '';
    return `${base}${url}`;
  };

  // Retry loading up to 3 times with backoff before showing 'Image unavailable'.
  // Handles the race where the image file isn't yet flushed when the URL first arrives.
  const handleImageError = (e: React.SyntheticEvent<HTMLImageElement>) => {
    const MAX_RETRIES = 3;
    if (imageRetryRef.current < MAX_RETRIES) {
      imageRetryRef.current += 1;
      const delay = imageRetryRef.current * 1500;
      const img = e.currentTarget;
      const src = img.src;
      setTimeout(() => {
        img.src = '';
        img.src = src;
      }, delay);
    } else {
      setImageError(true);
    }
  };

  const pc = platformChip[draft.platform] ?? { icon: null, color: '#6B7280', bg: '#F3F4F6' };
  const sc = statusColors[draft.status ?? 'draft'] ?? statusColors.draft;

  const handleApprove = async (option: ApprovePayload['schedule_option'], datetime?: string) => {
    setApproveAnchor(null);
    setLoading(true);
    try {
      const draftId = draft.draft_id ?? draft.id ?? '';
      const payload: ApprovePayload = {
        draft_ids: [draftId],
        schedule_option: option,
        ...(datetime ? { scheduled_datetime: new Date(datetime).toISOString() } : {}),
      };
      const response = await SocialMediaAgentService.approveContent(payload);

      if (response.status) {
        // Check if any draft's publish_result indicates the agent backend
        // didn't actually post it (e.g. "not implemented yet" for LinkedIn/X).
        // In that case fall back to calling the platform publish endpoint directly.
        if (option === 'immediate') {
          const approved: ApprovedDraft[] = response.responseData?.approved_drafts ?? [];
          const thisResult = approved.find((a) => a.draft_id === draftId);

          if (thisResult?.publish_result && !thisResult.publish_result.success) {
            // Agent backend didn't publish — call the platform endpoint directly
            const platform = draft.platform?.toLowerCase();
            try {
              if (platform === 'linkedin') {
                const pubRes = await SocialConnectionService.linkedinPublish({ content: draft.content });
                if (pubRes.status) {
                  ToastService.showToast('Published to LinkedIn! ✅', ToastTypeEnum.Success);
                  onRefresh();
                  return;
                } else {
                  ToastService.showToast(pubRes.responseMessage || 'LinkedIn publish failed', ToastTypeEnum.Error);
                  return;
                }
              } else if (platform === 'x' || platform === 'twitter') {
                const pubRes = await SocialConnectionService.xPublish({ content: draft.content });
                if (pubRes.status) {
                  ToastService.showToast('Published to X! ✅', ToastTypeEnum.Success);
                  onRefresh();
                  return;
                } else {
                  ToastService.showToast(pubRes.responseMessage || 'X publish failed', ToastTypeEnum.Error);
                  return;
                }
              }
            } catch (pubErr: unknown) {
              // Network timeout or connection drop — the post may have still gone through
              // on the platform side. Show a non-alarming message and refresh drafts.
              const isNetworkError =
                pubErr instanceof Error &&
                (pubErr.message.includes('network') ||
                  pubErr.message.includes('timeout') ||
                  pubErr.message.includes('connection'));
              ToastService.showToast(
                isNetworkError
                  ? `Check your ${draft.platform} — the post may have been published (network timeout).`
                  : `Failed to publish to ${draft.platform}. Please check your connection is still active.`,
                isNetworkError ? ToastTypeEnum.Warning : ToastTypeEnum.Error
              );
              onRefresh(); // refresh anyway — draft status may have changed server-side
              return;
            }
          }
        }

        ToastService.showToast(
          option === 'immediate' ? 'Published!' : option === 'schedule' ? 'Scheduled!' : 'Saved as draft',
          ToastTypeEnum.Success
        );
        onRefresh();
      } else {
        ToastService.showToast(response.responseMessage || 'Approve failed', ToastTypeEnum.Error);
      }
    } catch {
      ToastService.showToast('Approve failed', ToastTypeEnum.Error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeny = async () => {
    if (!denyReason.trim()) {
      ToastService.showToast('Please provide a denial reason', ToastTypeEnum.Error);
      return;
    }
    setLoading(true);
    try {
      const payload: DenyPayload = {
        draft_ids: [draft.draft_id ?? draft.id ?? ''],
        denial_reason: denyReason.trim(),
        request_regeneration: requestRegen,
      };
      const response = await SocialMediaAgentService.denyContent(payload);
      if (response.status) {
        ToastService.showToast('Draft denied', ToastTypeEnum.Success);
        setDenyOpen(false);
        onRefresh();
      } else {
        ToastService.showToast(response.responseMessage || 'Deny failed', ToastTypeEnum.Error);
      }
    } catch {
      ToastService.showToast('Deny failed', ToastTypeEnum.Error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!confirmDelete) {
      setConfirmDelete(true);
      return;
    }
    setLoading(true);
    try {
      const draftId = draft.draft_id ?? draft.id ?? '';
      const response = await SocialMediaAgentService.deleteDraft(draftId);
      if (response.status) {
        ToastService.showToast('Draft deleted', ToastTypeEnum.Success);
        onRefresh();
      } else {
        ToastService.showToast(response.responseMessage || 'Delete failed', ToastTypeEnum.Error);
        setConfirmDelete(false);
      }
    } catch {
      ToastService.showToast('Delete failed', ToastTypeEnum.Error);
      setConfirmDelete(false);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box
      sx={{
        border: selected ? '2px solid #CD1B78' : '1px solid #E5E7EB',
        borderRadius: '12px',
        p: 2.5,
        background: selected ? '#FDF2F8' : '#fff',
        boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
        transition: 'border-color 0.15s, background 0.15s',
      }}
    >
      {/* Header row */}
      <Box display="flex" alignItems="center" gap={1} mb={1.5} flexWrap="wrap">
        {selectable && (
          <Checkbox
            checked={!!selected}
            onChange={() => onSelectToggle?.(draft.draft_id ?? draft.id ?? '')}
            onClick={(e) => e.stopPropagation()}
            size="small"
            sx={{ p: 0, mr: 0.5, color: '#CD1B78', '&.Mui-checked': { color: '#CD1B78' } }}
          />
        )}
        <Chip
          icon={pc.icon ?? undefined}
          label={draft.platform.charAt(0).toUpperCase() + draft.platform.slice(1)}
          size="small"
          sx={{ background: pc.bg, color: pc.color, fontWeight: 600, fontSize: '11px', height: 24 }}
        />
        <Chip
          label={(draft.status ?? draft.approval_status ?? 'pending').replace('_', ' ')}
          size="small"
          sx={{ background: sc.bg, color: sc.color, fontWeight: 600, fontSize: '11px', height: 24 }}
        />
        {draft.auto_generated && (
          <Chip
            label="Auto"
            size="small"
            sx={{ background: '#CCFBF1', color: '#0F766E', fontWeight: 700, fontSize: '11px', height: 24 }}
          />
        )}
        {postType === 'carousel' && (
          <Chip
            label="Carousel"
            size="small"
            sx={{ background: '#EDE9FE', color: '#5B21B6', fontWeight: 700, fontSize: '11px', height: 24 }}
          />
        )}
        {postType === 'story' && (
          <Chip
            label="Story"
            size="small"
            sx={{ background: '#FEF3C7', color: '#92400E', fontWeight: 700, fontSize: '11px', height: 24 }}
          />
        )}
      </Box>

      {/* Content */}
      {!editing && (
        <Typography fontSize="14px" color="#374151" sx={{ whiteSpace: 'pre-wrap', mb: 1.5, lineHeight: 1.6 }}>
          {draft.content}
        </Typography>
      )}

      {/* Hashtags */}
      {!editing && draft.hashtags && draft.hashtags.length > 0 && (
        <Box display="flex" gap={0.5} flexWrap="wrap" mb={1.5}>
          {draft.hashtags.map((tag) => (
            <Typography key={tag} fontSize="12px" color="#CD1B78" fontWeight={500}>
              #{tag}
            </Typography>
          ))}
        </Box>
      )}

      {/* ── Carousel image viewer ── */}
      {!editing && isCarousel && (
        <Box mb={1.5}>
          <Box
            sx={{
              borderRadius: '8px',
              overflow: 'hidden',
              border: '1px solid #E5E7EB',
              aspectRatio: '1 / 1',
              width: '100%',
              background: '#F3F4F6',
              position: 'relative',
            }}
          >
            {/* Slide counter */}
            <Box
              sx={{
                position: 'absolute',
                bottom: 8,
                left: '50%',
                transform: 'translateX(-50%)',
                background: 'rgba(0,0,0,0.5)',
                borderRadius: '12px',
                px: 1,
                py: 0.25,
                zIndex: 2,
              }}
            >
              <Typography fontSize="11px" color="#fff" fontWeight={600}>
                {slideIndex + 1} / {totalSlides}
              </Typography>
            </Box>

            {/* Shimmer / failed state when no slide image yet */}
            {!currentSlide?.image_url && (draft.has_image || draft.auto_generated) && (
              <Box
                sx={{
                  position: 'absolute',
                  inset: 0,
                  background: draft.image_failed
                    ? '#FFF7F7'
                    : 'linear-gradient(90deg, #F7F7FD 25%, #EEECFB 50%, #F7F7FD 75%)',
                  backgroundSize: '200% 100%',
                  animation: draft.image_failed ? 'none' : 'shimmer 2s infinite',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  border: draft.image_failed ? '1px dashed #FFCDD2' : 'none',
                  '@keyframes shimmer': {
                    '0%': { backgroundPosition: '200% 0' },
                    '100%': { backgroundPosition: '-200% 0' },
                  },
                }}
              >
                <Typography fontSize="12px" color={draft.image_failed ? '#EF5350' : '#9CA3AF'}>
                  {draft.image_failed ? '⚠️ Image generation timed out' : 'Generating slide image…'}
                </Typography>
              </Box>
            )}

            {currentSlide?.image_url &&
              (() => {
                const resolvedUrl = resolveUrl(currentSlide.image_url);
                const alreadyLoaded = loadedSlideUrls.has(resolvedUrl);
                return (
                  <>
                    {!alreadyLoaded && !imageLoaded && (
                      <Box
                        sx={{
                          position: 'absolute',
                          inset: 0,
                          background: 'linear-gradient(90deg, #F7F7FD 25%, #EEECFB 50%, #F7F7FD 75%)',
                          backgroundSize: '200% 100%',
                          animation: 'shimmer 2s infinite',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          '@keyframes shimmer': {
                            '0%': { backgroundPosition: '200% 0' },
                            '100%': { backgroundPosition: '-200% 0' },
                          },
                        }}
                      >
                        <Typography fontSize="12px" color="#9CA3AF">
                          Loading image…
                        </Typography>
                      </Box>
                    )}
                    <img
                      src={resolvedUrl}
                      alt={`Carousel slide ${slideIndex + 1}`}
                      onLoad={() => {
                        loadedSlideUrls.add(resolvedUrl);
                        setImageLoaded(true);
                      }}
                      onError={handleImageError}
                      onClick={() => setLightboxOpen(true)}
                      style={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'contain',
                        display: alreadyLoaded || imageLoaded ? 'block' : 'none',
                        cursor: 'pointer',
                      }}
                    />
                  </>
                );
              })()}

            {/* Prev / Next arrows */}
            {totalSlides > 1 && (
              <>
                <IconButton
                  size="small"
                  onClick={() => {
                    const nextIndex = Math.max(0, slideIndex - 1);
                    const nextUrl = slides[nextIndex]?.image_url ? resolveUrl(slides[nextIndex].image_url!) : null;
                    setSlideIndex(nextIndex);
                    setImageLoaded(nextUrl ? loadedSlideUrls.has(nextUrl) : false);
                  }}
                  disabled={slideIndex === 0}
                  sx={{
                    position: 'absolute',
                    left: 4,
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'rgba(255,255,255,0.85)',
                    zIndex: 2,
                    '&:hover': { background: '#fff' },
                    '&.Mui-disabled': { opacity: 0.3 },
                  }}
                >
                  <MdChevronLeft size={20} />
                </IconButton>
                <IconButton
                  size="small"
                  onClick={() => {
                    const nextIndex = Math.min(totalSlides - 1, slideIndex + 1);
                    const nextUrl = slides[nextIndex]?.image_url ? resolveUrl(slides[nextIndex].image_url!) : null;
                    setSlideIndex(nextIndex);
                    setImageLoaded(nextUrl ? loadedSlideUrls.has(nextUrl) : false);
                  }}
                  disabled={slideIndex === totalSlides - 1}
                  sx={{
                    position: 'absolute',
                    right: 4,
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'rgba(255,255,255,0.85)',
                    zIndex: 2,
                    '&:hover': { background: '#fff' },
                    '&.Mui-disabled': { opacity: 0.3 },
                  }}
                >
                  <MdChevronRight size={20} />
                </IconButton>
              </>
            )}
          </Box>

          {/* Slide headline + body */}
          {currentSlide && (currentSlide.headline || currentSlide.body) && (
            <Box mt={1} sx={{ border: '1px solid #E5E7EB', borderRadius: '8px', p: 1.25, background: '#F9FAFB' }}>
              {currentSlide.headline && (
                <Typography fontSize="13px" fontWeight={700} color="#111827" mb={0.25}>
                  {currentSlide.headline}
                </Typography>
              )}
              {currentSlide.body && (
                <Typography fontSize="12px" color="#6B7280" lineHeight={1.5}>
                  {currentSlide.body}
                </Typography>
              )}
            </Box>
          )}
        </Box>
      )}

      {/* ── Story image (9:16) ── */}
      {!editing && isStory && draft.image_url && (
        <Box
          mb={1.5}
          onMouseEnter={() => setImageHovered(true)}
          onMouseLeave={() => setImageHovered(false)}
          sx={{
            borderRadius: '8px',
            overflow: 'hidden',
            border: '1px solid #E5E7EB',
            aspectRatio: '9 / 16',
            width: '50%',
            background: '#F3F4F6',
            position: 'relative',
          }}
        >
          <Box
            sx={{
              position: 'absolute',
              top: 8,
              left: 8,
              background: 'rgba(0,0,0,0.55)',
              borderRadius: '6px',
              px: 0.75,
              py: 0.25,
              zIndex: 2,
            }}
          >
            <Typography fontSize="10px" fontWeight={700} color="#fff" letterSpacing={0.5}>
              STORY
            </Typography>
          </Box>
          {!imageLoaded && !imageError && (
            <Box
              sx={{
                position: 'absolute',
                inset: 0,
                background: 'linear-gradient(90deg, #F7F7FD 25%, #EEECFB 50%, #F7F7FD 75%)',
                backgroundSize: '200% 100%',
                animation: 'shimmer 2s infinite',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                '@keyframes shimmer': {
                  '0%': { backgroundPosition: '200% 0' },
                  '100%': { backgroundPosition: '-200% 0' },
                },
              }}
            >
              <Typography fontSize="12px" color="#9CA3AF">
                Loading image…
              </Typography>
            </Box>
          )}
          {imageError && (
            <Box
              sx={{
                position: 'absolute',
                inset: 0,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: '#F9FAFB',
              }}
            >
              <Typography fontSize="12px" color="#9CA3AF">
                Image unavailable
              </Typography>
            </Box>
          )}
          <img
            src={resolveUrl(draft.image_url)}
            alt="Story image"
            onLoad={() => setImageLoaded(true)}
            onError={handleImageError}
            onClick={() => setLightboxOpen(true)}
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'contain',
              display: imageLoaded ? 'block' : 'none',
              cursor: 'pointer',
            }}
          />
          {imageLoaded && (
            <Box
              sx={{
                position: 'absolute',
                bottom: 8,
                right: 8,
                opacity: imageHovered ? 1 : 0,
                transition: 'opacity 0.15s',
              }}
            >
              <Button
                size="small"
                onClick={(e) => {
                  e.stopPropagation();
                  setImageEditOpen(true);
                }}
                sx={{
                  minWidth: 0,
                  px: 1,
                  py: 0.5,
                  fontSize: '11px',
                  background: 'rgba(0,0,0,0.55)',
                  color: '#fff',
                  backdropFilter: 'blur(4px)',
                  borderRadius: '6px',
                  textTransform: 'none',
                  '&:hover': { background: 'rgba(0,0,0,0.75)' },
                }}
              >
                ✏️ Edit image
              </Button>
            </Box>
          )}
        </Box>
      )}

      {/* ── Feed image — correct platform aspect ratio, skeleton while loading ── */}
      {!editing &&
        !isCarousel &&
        !isStory &&
        draft.image_url &&
        (() => {
          const specs = draft.image_specs;
          const aspect =
            specs?.width && specs?.height
              ? `${specs.width} / ${specs.height}`
              : (PLATFORM_ASPECT[draft.platform] ?? '16 / 9');
          return (
            <Box
              mb={1.5}
              onMouseEnter={() => setImageHovered(true)}
              onMouseLeave={() => setImageHovered(false)}
              sx={{
                borderRadius: '8px',
                overflow: 'hidden',
                border: '1px solid #E5E7EB',
                aspectRatio: aspect,
                width: '100%',
                background: '#F3F4F6',
                position: 'relative',
              }}
            >
              {!imageLoaded && !imageError && (
                <Box
                  sx={{
                    position: 'absolute',
                    inset: 0,
                    background: 'linear-gradient(90deg, #F7F7FD 25%, #EEECFB 50%, #F7F7FD 75%)',
                    backgroundSize: '200% 100%',
                    animation: 'shimmer 2s infinite',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    '@keyframes shimmer': {
                      '0%': { backgroundPosition: '200% 0' },
                      '100%': { backgroundPosition: '-200% 0' },
                    },
                  }}
                >
                  <Typography fontSize="12px" color="#9CA3AF">
                    Loading image…
                  </Typography>
                </Box>
              )}
              {imageError && (
                <Box
                  sx={{
                    position: 'absolute',
                    inset: 0,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    background: '#F9FAFB',
                  }}
                >
                  <Typography fontSize="12px" color="#9CA3AF">
                    Image unavailable
                  </Typography>
                </Box>
              )}
              <img
                src={resolveUrl(draft.image_url)}
                alt={`AI-generated image for ${draft.platform}`}
                onLoad={() => setImageLoaded(true)}
                onError={handleImageError}
                onClick={() => setLightboxOpen(true)}
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'contain',
                  display: imageLoaded ? 'block' : 'none',
                  cursor: 'pointer',
                }}
              />
              {imageLoaded && (
                <Box
                  sx={{
                    position: 'absolute',
                    bottom: 8,
                    right: 8,
                    opacity: imageHovered ? 1 : 0,
                    transition: 'opacity 0.15s',
                  }}
                >
                  <Button
                    size="small"
                    onClick={(e) => {
                      e.stopPropagation();
                      setImageEditOpen(true);
                    }}
                    sx={{
                      minWidth: 0,
                      px: 1,
                      py: 0.5,
                      fontSize: '11px',
                      background: 'rgba(0,0,0,0.55)',
                      color: '#fff',
                      backdropFilter: 'blur(4px)',
                      borderRadius: '6px',
                      textTransform: 'none',
                      '&:hover': { background: 'rgba(0,0,0,0.75)' },
                    }}
                  >
                    ✏️ Edit image
                  </Button>
                </Box>
              )}
            </Box>
          );
        })()}
      {!editing && !isCarousel && !draft.image_url && (draft.has_image || draft.auto_generated) && (
        <Box
          mb={1.5}
          sx={{
            height: 80,
            borderRadius: '8px',
            border: draft.image_failed ? '1px dashed #FFCDD2' : '1px dashed #E0DEF7',
            background: draft.image_failed
              ? '#FFF7F7'
              : 'linear-gradient(90deg, #F7F7FD 25%, #EEECFB 50%, #F7F7FD 75%)',
            backgroundSize: '200% 100%',
            animation: draft.image_failed ? 'none' : 'shimmer 2s infinite',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 1,
            '@keyframes shimmer': {
              '0%': { backgroundPosition: '200% 0' },
              '100%': { backgroundPosition: '-200% 0' },
            },
          }}
        >
          <Typography fontSize="12px" color={draft.image_failed ? '#EF5350' : '#9CA3AF'}>
            {draft.image_failed ? '⚠️ Image generation timed out' : '🎨 Generating image…'}
          </Typography>
        </Box>
      )}

      {/* Inline editor */}
      {editing && (
        <DraftEditor
          draft={draft}
          onSaved={(updated) => {
            setDraft(updated);
            setEditing(false);
          }}
          onCancel={() => setEditing(false)}
        />
      )}

      {/* Action row */}
      {!editing && (
        <Box display="flex" gap={1} flexWrap="wrap" mt={1}>
          <Button
            size="small"
            variant="outlined"
            onClick={() => setEditing(true)}
            sx={{ textTransform: 'none', fontSize: '12px' }}
          >
            Edit
          </Button>
          <Button
            size="small"
            variant="contained"
            disabled={loading}
            onClick={(e) => setApproveAnchor(e.currentTarget)}
            sx={{
              textTransform: 'none',
              fontSize: '12px',
              background: '#CD1B78',
              '&:hover': { background: '#A01560' },
            }}
          >
            Approve
          </Button>
          <Button
            size="small"
            variant="outlined"
            color="error"
            disabled={loading}
            onClick={() => setDenyOpen(true)}
            sx={{ textTransform: 'none', fontSize: '12px' }}
          >
            Deny
          </Button>
          <Button
            size="small"
            variant={confirmDelete ? 'contained' : 'outlined'}
            color="error"
            disabled={loading}
            onClick={handleDelete}
            onBlur={() => setConfirmDelete(false)}
            sx={{ textTransform: 'none', fontSize: '12px', ml: 'auto' }}
          >
            {loading && confirmDelete ? 'Deleting...' : confirmDelete ? 'Confirm delete?' : 'Delete'}
          </Button>
        </Box>
      )}

      {/* Approve options popover */}
      <Menu anchorEl={approveAnchor} open={Boolean(approveAnchor)} onClose={() => setApproveAnchor(null)}>
        <MenuItem onClick={() => handleApprove('immediate')}>Publish Now</MenuItem>
        <MenuItem
          onClick={() => {
            setApproveAnchor(null);
            setScheduleOpen(true);
          }}
        >
          Schedule
        </MenuItem>
        <MenuItem onClick={() => handleApprove('save_draft')}>Save Draft</MenuItem>
      </Menu>

      {/* Schedule datetime picker dialog */}
      <Dialog open={scheduleOpen} onClose={() => setScheduleOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle>
          <Typography fontWeight={600} fontSize="16px">
            Schedule Post
          </Typography>
        </DialogTitle>
        <DialogContent>
          <Typography fontSize="13px" color="#6B7280" mb={2}>
            Pick when this post should be published.
          </Typography>
          <TextField
            type="datetime-local"
            fullWidth
            value={scheduledAt}
            onChange={(e) => setScheduledAt(e.target.value)}
            inputProps={{
              min: (() => {
                const d = new Date(Date.now() + 5 * 60 * 1000);
                const pad = (n: number) => String(n).padStart(2, '0');
                return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
              })(),
            }}
          />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3 }}>
          <Button onClick={() => setScheduleOpen(false)} variant="outlined" sx={{ textTransform: 'none' }}>
            Cancel
          </Button>
          <Button
            onClick={() => {
              if (!scheduledAt) {
                ToastService.showToast('Please pick a date and time', ToastTypeEnum.Error);
                return;
              }
              setScheduleOpen(false);
              handleApprove('schedule', scheduledAt);
            }}
            variant="contained"
            disabled={!scheduledAt}
            sx={{ textTransform: 'none', background: '#CD1B78', '&:hover': { background: '#A01560' } }}
          >
            Confirm Schedule
          </Button>
        </DialogActions>
      </Dialog>

      {/* Image lightbox */}
      <Dialog open={lightboxOpen} onClose={() => setLightboxOpen(false)} maxWidth="md" fullWidth>
        <DialogActions sx={{ p: 1, justifyContent: 'flex-end' }}>
          <Button onClick={() => setLightboxOpen(false)} size="small" sx={{ minWidth: 0, textTransform: 'none' }}>
            Close
          </Button>
        </DialogActions>
        <DialogContent
          sx={{ p: 2, pt: 0, display: 'flex', justifyContent: 'center', alignItems: 'center', background: '#000' }}
        >
          {draft.image_url && (
            <img
              src={draft.image_url.startsWith('/') ? resolveUrl(draft.image_url) : draft.image_url}
              alt={`AI-generated image for ${draft.platform}`}
              style={{ maxWidth: '100%', maxHeight: '80vh', objectFit: 'contain', display: 'block' }}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Image edit feedback dialog */}
      <Dialog
        open={imageEditOpen}
        onClose={() => {
          if (!imageRegenerating) setImageEditOpen(false);
        }}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle sx={{ fontSize: '15px', fontWeight: 600 }}>Regenerate image</DialogTitle>
        <DialogContent>
          <Typography fontSize="13px" color="#6B7280" mb={1.5}>
            Tell the AI what to change about the current image.
          </Typography>
          <TextField
            autoFocus
            multiline
            rows={3}
            fullWidth
            placeholder="e.g. Make it more vibrant, show a person working at a laptop in a Lagos office, use the brand's deep purple colour..."
            value={imageFeedback}
            onChange={(e) => setImageFeedback(e.target.value)}
            disabled={imageRegenerating}
            sx={{ fontSize: '13px' }}
          />
          {/* PRD 4.2: Image retry cost warning */}
          {draft.image_retry_count && draft.image_retry_count >= 1 && (
            <Box
              sx={{
                mt: 1.5,
                p: 1.5,
                borderRadius: '8px',
                background: '#FFFBEB',
                border: '1px solid #FCD34D',
              }}
            >
              <Typography fontSize="12px" color="#D97706" fontWeight={600}>
                ⚠️ This action will use 1 credit
              </Typography>
              <Typography fontSize="11px" color="#92400E" mt={0.5}>
                First image retry is free. Subsequent retries cost 1 credit each.
              </Typography>
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3, gap: 1 }}>
          <Button
            onClick={() => {
              setImageEditOpen(false);
              setImageFeedback('');
            }}
            disabled={imageRegenerating}
            sx={{ textTransform: 'none', fontSize: '13px' }}
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            disabled={!imageFeedback.trim() || imageRegenerating}
            onClick={async () => {
              const draftId = draft.draft_id ?? draft.id ?? '';
              setImageRegenerating(true);
              try {
                // PRD 4.2: First retry is free, second retry requires confirmation
                const res = await SocialMediaAgentService.regenerateImage(draftId, imageFeedback.trim());

                // Backend returns requires_confirmation: true for second retry
                if (res.responseData?.requires_confirmation && !res.responseData?.confirmed) {
                  // Show confirmation - user needs to confirm they want to use 1 credit
                  const confirmed = window.confirm(
                    'This action will use 1 credit. Continue?\n\nFirst image retry is free. Additional retries cost 1 credit each.'
                  );
                  if (!confirmed) {
                    setImageRegenerating(false);
                    return;
                  }
                  // Retry with confirmation
                  const confirmedRes = await SocialMediaAgentService.regenerateImage(
                    draftId,
                    imageFeedback.trim(),
                    true
                  );
                  if (confirmedRes.status) {
                    setDraft((prev) => ({ ...prev, image_url: undefined as unknown as string, has_image: true }));
                    setImageLoaded(false);
                    setImageEditOpen(false);
                    setImageFeedback('');
                    ToastService.showToast('Generating new image…', ToastTypeEnum.Success);
                    onRefresh();
                  } else {
                    // PRD 8: Handle 402 out of credits
                    if (confirmedRes.responseCode === 402) {
                      ToastService.showToast('Out of credits. Upgrade to continue.', ToastTypeEnum.Error);
                    } else {
                      ToastService.showToast(
                        confirmedRes.responseMessage || 'Failed to start image regeneration',
                        ToastTypeEnum.Error
                      );
                    }
                  }
                } else if (res.status) {
                  setDraft((prev) => ({ ...prev, image_url: undefined as unknown as string, has_image: true }));
                  setImageLoaded(false);
                  setImageEditOpen(false);
                  setImageFeedback('');
                  ToastService.showToast('Generating new image…', ToastTypeEnum.Success);
                  onRefresh();
                } else {
                  // PRD 8: Handle 402 out of credits
                  if (res.responseCode === 402) {
                    ToastService.showToast('Out of credits. Upgrade to continue.', ToastTypeEnum.Error);
                  } else {
                    ToastService.showToast(
                      res.responseMessage || 'Failed to start image regeneration',
                      ToastTypeEnum.Error
                    );
                  }
                }
              } catch (error: unknown) {
                const err = error as { response?: { status?: number } };
                if (err?.response?.status === 402) {
                  ToastService.showToast('Out of credits. Upgrade to continue.', ToastTypeEnum.Error);
                } else {
                  ToastService.showToast('Failed to start image regeneration', ToastTypeEnum.Error);
                }
              } finally {
                setImageRegenerating(false);
              }
            }}
            sx={{
              textTransform: 'none',
              fontSize: '13px',
              background: '#6F5ED3',
              '&:hover': { background: '#5A4DB8' },
            }}
          >
            {imageRegenerating ? 'Starting…' : 'Regenerate'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Deny panel */}
      {denyOpen && (
        <Box
          sx={{
            mt: 2,
            p: 2,
            border: '1px solid #FEE2E2',
            borderRadius: '8px',
            background: '#FFF5F5',
          }}
        >
          <Typography fontSize="13px" fontWeight={600} color="#991B1B" mb={1}>
            Deny Reason
          </Typography>
          <TextField
            placeholder="Explain why this draft is being denied..."
            fullWidth
            multiline
            rows={3}
            value={denyReason}
            onChange={(e) => setDenyReason(e.target.value)}
            sx={{ mb: 1.5 }}
            size="small"
          />
          <FormControlLabel
            control={
              <Checkbox checked={requestRegen} onChange={(e) => setRequestRegen(e.target.checked)} size="small" />
            }
            label={<Typography fontSize="12px">Request regeneration</Typography>}
            sx={{ mb: 1.5 }}
          />
          <Box display="flex" gap={1}>
            <Button
              size="small"
              variant="contained"
              color="error"
              onClick={handleDeny}
              disabled={loading || !denyReason.trim()}
              sx={{ textTransform: 'none', fontSize: '12px' }}
            >
              {loading ? 'Denying...' : 'Confirm Deny'}
            </Button>
            <Button
              size="small"
              variant="outlined"
              onClick={() => setDenyOpen(false)}
              sx={{ textTransform: 'none', fontSize: '12px' }}
            >
              Cancel
            </Button>
          </Box>
        </Box>
      )}
    </Box>
  );
};

export default DraftCard;
