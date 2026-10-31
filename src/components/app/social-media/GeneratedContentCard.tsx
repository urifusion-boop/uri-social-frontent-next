'use client';

import { useState } from 'react';
import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  Menu,
  MenuItem,
  TextField,
  Typography,
} from '@mui/material';
import { FaFacebook, FaInstagram, FaLinkedin, FaTiktok, FaTwitter } from 'react-icons/fa';
import { MdChevronLeft, MdChevronRight, MdMoreVert } from 'react-icons/md';
import { ContentDraft, SocialMediaAgentService } from '@/src/api/SocialMediaAgentService';
import { ToastService } from '@/src/utils/toast.util';
import { ToastTypeEnum } from '@/src/models/enum-models/ToastTypeEnum';

const PINK = '#CD1B78';

export const PLATFORM_META: Record<string, { icon: React.ReactNode; color: string; label: string }> = {
  facebook: { icon: <FaFacebook size={14} color="#fff" />, color: '#1877F2', label: 'Facebook' },
  instagram: { icon: <FaInstagram size={14} color="#fff" />, color: '#E1306C', label: 'Instagram' },
  twitter: { icon: <FaTwitter size={14} color="#fff" />, color: '#1DA1F2', label: 'Twitter / X' },
  linkedin: { icon: <FaLinkedin size={14} color="#fff" />, color: '#0A66C2', label: 'LinkedIn' },
  tiktok: { icon: <FaTiktok size={14} color="#fff" />, color: '#010101', label: 'TikTok' },
};

const PLATFORM_ASPECT: Record<string, string> = {
  linkedin: '1200 / 628',
  twitter: '16 / 9',
  facebook: '1200 / 630',
  instagram: '4 / 5',
};

// Carousel images live one level down, per slide — draft.image_url is never
// set for a carousel draft, so reading only that (as an earlier version of
// this component did) silently showed "No image" on every real carousel.
export function firstSlideImage(draft: ContentDraft): string | undefined {
  return draft.slides?.find((s) => s.image_url)?.image_url;
}

// Matches DraftCard's own aspect-ratio resolution exactly, plus a readable
// "1:1 Post (1080 × 1080)" label built from the same real fields.
export function mediaMeta(draft: ContentDraft): { aspect: string; label: string } {
  const isCarousel = draft.post_type === 'carousel';
  const specs = isCarousel ? draft.slides?.find((s) => s.image_specs)?.image_specs : draft.image_specs;
  const isStory = draft.post_type === 'story';
  const isVideo = !!draft.video_url;
  const w = specs?.width;
  const h = specs?.height;
  const aspect = w && h ? `${w} / ${h}` : isStory ? '9 / 16' : (PLATFORM_ASPECT[draft.platform] ?? '1 / 1');
  const ratioLabel = w && h ? `${simplifyRatio(w, h)}` : isStory ? '9:16' : '1:1';
  const kind = isVideo ? 'Video' : isCarousel ? `Carousel · ${draft.slides?.length ?? '?'} slides` : 'Post';
  const dims = w && h ? ` (${w} × ${h})` : '';
  return { aspect, label: `${ratioLabel} ${kind}${dims}` };
}

function simplifyRatio(w: number, h: number): string {
  const gcd = (a: number, b: number): number => (b === 0 ? a : gcd(b, a % b));
  const d = gcd(w, h) || 1;
  return `${w / d}:${h / d}`;
}

// generate-content returns text immediately and finishes each image in the
// background (usually within a few seconds) — the draft this card gets is
// just a snapshot from that moment, so a card showing "No image" right
// after generating is almost always just mid-generation, not actually
// missing one. Used both to render the right placeholder here and to drive
// the wizard's post-generate poll (useContentWizardState) that picks the
// real image up once it lands.
export function isImagePending(draft: ContentDraft): boolean {
  if (draft.video_url) return false;
  if (!(draft.has_image || draft.auto_generated)) return false;
  if (draft.post_type === 'carousel') {
    return (draft.slides ?? []).some((s) => !s.image_url && !s.image_failed);
  }
  return !draft.image_url && !draft.image_failed;
}

function hasImageFailed(draft: ContentDraft): boolean {
  if (draft.post_type === 'carousel') {
    return (draft.slides ?? []).some((s) => s.image_failed && !s.image_url);
  }
  return !!draft.image_failed;
}

interface GeneratedContentCardProps {
  draft: ContentDraft;
  connectedPlatforms: string[] | null;
  onEdit: (draft: ContentDraft) => void;
  onRefresh: () => void;
  onDelete?: (id: string) => void;
  /** A library grid mixes many unrelated drafts whose real dimensions
   * genuinely differ (a carousel slide vs. a Facebook post vs. a TikTok
   * reel) — forcing every thumbnail to the same shape keeps the grid looking
   * like one coherent grid instead of a ragged mix of heights. Leave unset
   * for a single generation batch (the wizard's results step), where each
   * platform's own real, differing size is the correct, intentional thing
   * to show side by side. */
  uniformAspect?: string;
}

export default function GeneratedContentCard({
  draft,
  connectedPlatforms,
  onEdit,
  onRefresh,
  onDelete,
  uniformAspect,
}: GeneratedContentCardProps) {
  const [menuAnchor, setMenuAnchor] = useState<HTMLElement | null>(null);
  const [scheduleOpen, setScheduleOpen] = useState(false);
  const [scheduleAt, setScheduleAt] = useState('');
  const [busy, setBusy] = useState(false);

  const id = draft.draft_id ?? draft.id ?? '';
  const platformKey = (draft.platform || '').toLowerCase();
  const meta = PLATFORM_META[platformKey];
  const { aspect, label } = mediaMeta(draft);
  const [expanded, setExpanded] = useState(false);
  const isCarousel = draft.post_type === 'carousel';
  const slides = draft.slides ?? [];
  const totalSlides = slides.length;
  const [slideIndex, setSlideIndex] = useState(0);
  const safeSlideIndex = Math.min(slideIndex, Math.max(totalSlides - 1, 0));
  const currentSlide = isCarousel ? slides[safeSlideIndex] : undefined;
  const previewImage = isCarousel ? currentSlide?.image_url : (draft.image_url ?? firstSlideImage(draft));
  // Mid-generation / failed state for whichever slide is actually on screen
  // — not the carousel as a whole, so flipping to an already-finished slide
  // shows it immediately instead of the generic "some slide is pending" state.
  const pending = isCarousel ? !currentSlide?.image_url && !currentSlide?.image_failed : isImagePending(draft);
  const failed = isCarousel
    ? !!currentSlide?.image_failed && !currentSlide?.image_url
    : !previewImage && hasImageFailed(draft);
  const isConnected =
    connectedPlatforms === null || connectedPlatforms.map((p) => p.toLowerCase()).includes(platformKey);
  // TikTok image/carousel posts need DraftCard's own "Post to TikTok" consent
  // screen (platform policy) — a quick-post button here can't safely skip
  // that, so Post routes to the real editor for TikTok non-video content
  // instead of silently bypassing a required consent step.
  const tiktokNeedsFullFlow = platformKey === 'tiktok' && !draft.video_url;

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
        setScheduleOpen(false);
        onRefresh();
      } else {
        ToastService.showToast(res.responseMessage || 'Action failed', ToastTypeEnum.Error);
      }
    } catch {
      ToastService.showToast('Action failed — try again', ToastTypeEnum.Error);
    } finally {
      setBusy(false);
    }
  };

  const handlePost = () => {
    if (tiktokNeedsFullFlow) {
      onEdit(draft);
      return;
    }
    doApprove('immediate');
  };

  const handleDelete = async () => {
    setMenuAnchor(null);
    try {
      await SocialMediaAgentService.deleteDraft(id);
      ToastService.showToast('Deleted.', ToastTypeEnum.Success);
      onDelete?.(id);
      onRefresh();
    } catch {
      ToastService.showToast('Could not delete — try again.', ToastTypeEnum.Error);
    }
  };

  return (
    <Box
      sx={{
        border: '1px solid #E5E7EB',
        borderRadius: '14px',
        overflow: 'hidden',
        background: '#fff',
        boxShadow: '0 1px 3px rgba(20,16,14,.06)',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <Box display="flex" alignItems="center" justifyContent="space-between" sx={{ px: 1.5, py: 1.25, flexShrink: 0 }}>
        <Box display="flex" alignItems="center" gap={1} sx={{ minWidth: 0 }}>
          <Box
            sx={{
              width: 26,
              height: 26,
              borderRadius: '50%',
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
            <Typography fontSize="13px" fontWeight={700} color="#111827" noWrap>
              {meta?.label ?? draft.platform}
            </Typography>
            <Typography fontSize="11px" color="#9CA3AF" noWrap>
              {label}
            </Typography>
          </Box>
        </Box>
        <IconButton size="small" aria-label="More actions" onClick={(e) => setMenuAnchor(e.currentTarget)}>
          <MdMoreVert size={16} />
        </IconButton>
      </Box>

      <Box
        sx={{
          width: '100%',
          aspectRatio: uniformAspect ?? aspect,
          position: 'relative',
          flexShrink: 0,
          background: previewImage ? `url(${previewImage}) center/cover` : draft.video_url ? '#111' : '#F3F4F6',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {draft.video_url && (
          <Box
            component="video"
            src={draft.video_url}
            controls
            sx={{ width: '100%', height: '100%', objectFit: 'cover' }}
          />
        )}
        {!previewImage && !draft.video_url && pending && (
          <Box
            sx={{
              width: '100%',
              height: '100%',
              background: 'linear-gradient(90deg, #F9FAFB 25%, #F3E8EF 50%, #F9FAFB 75%)',
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
            <Typography fontSize="12px" color="#9CA3AF">
              🎨 Generating image…
            </Typography>
          </Box>
        )}
        {!previewImage && !draft.video_url && failed && (
          <Typography fontSize="12px" color="#EF5350">
            ⚠️ Image generation failed
          </Typography>
        )}
        {!previewImage && !draft.video_url && !pending && !failed && (
          <Typography fontSize="12px" color="#9CA3AF">
            No image
          </Typography>
        )}
        {isCarousel && totalSlides > 1 && (
          <>
            <Box
              sx={{
                position: 'absolute',
                bottom: 8,
                left: '50%',
                transform: 'translateX(-50%)',
                background: 'rgba(17,24,39,.65)',
                color: '#fff',
                fontSize: '10.5px',
                fontWeight: 700,
                borderRadius: '999px',
                px: 1,
                py: 0.25,
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
                left: 4,
                top: '50%',
                transform: 'translateY(-50%)',
                background: 'rgba(255,255,255,.9)',
                p: 0.5,
                '&:hover': { background: '#fff' },
                '&.Mui-disabled': { opacity: 0.3 },
              }}
            >
              <MdChevronLeft size={18} />
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
                right: 4,
                top: '50%',
                transform: 'translateY(-50%)',
                background: 'rgba(255,255,255,.9)',
                p: 0.5,
                '&:hover': { background: '#fff' },
                '&.Mui-disabled': { opacity: 0.3 },
              }}
            >
              <MdChevronRight size={18} />
            </IconButton>
          </>
        )}
      </Box>

      {isCarousel && currentSlide && (currentSlide.headline || currentSlide.body) && (
        <Box
          sx={{ mx: 1.5, mt: 1.25, p: 1.25, borderRadius: '8px', border: '1px solid #E5E7EB', background: '#FAFAFA' }}
        >
          {currentSlide.headline && (
            <Typography fontSize="12.5px" fontWeight={700} color="#111827" mb={0.25}>
              {currentSlide.headline}
            </Typography>
          )}
          {currentSlide.body && (
            <Typography fontSize="12px" color="#6B7280">
              {currentSlide.body}
            </Typography>
          )}
        </Box>
      )}

      <Box sx={{ p: 1.5, flex: 1, display: 'flex', flexDirection: 'column' }}>
        <Box sx={{ flex: 1, mb: 1.25 }}>
          <Typography
            fontSize="12.5px"
            color="#374151"
            sx={
              expanded
                ? { whiteSpace: 'pre-wrap', mb: draft.hashtags?.length ? 0.5 : 0 }
                : {
                    display: '-webkit-box',
                    WebkitLineClamp: 3,
                    WebkitBoxOrient: 'vertical',
                    overflow: 'hidden',
                    whiteSpace: 'pre-wrap',
                    mb: draft.hashtags?.length ? 0.5 : 0,
                  }
            }
          >
            {draft.content}
          </Typography>
          {!!draft.hashtags?.length && (
            <Typography fontSize="11.5px" color={PINK} sx={{ mb: 0.5 }}>
              {draft.hashtags.map((h) => `#${h.replace(/^#+/, '')}`).join(' ')}
            </Typography>
          )}
          {draft.content.length > 140 && (
            <Typography
              component="button"
              type="button"
              onClick={() => setExpanded((e) => !e)}
              sx={{
                fontSize: '11.5px',
                fontWeight: 700,
                color: '#6B7280',
                background: 'none',
                border: 'none',
                p: 0,
                cursor: 'pointer',
                fontFamily: 'inherit',
                '&:hover': { color: PINK },
              }}
            >
              {expanded ? 'Show less' : 'Show more'}
            </Typography>
          )}
        </Box>

        <Box display="flex" gap={0.75} sx={{ mt: 'auto' }}>
          <Button
            size="small"
            onClick={() => onEdit(draft)}
            sx={{
              flex: 1,
              textTransform: 'none',
              fontSize: '12px',
              fontWeight: 700,
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
              flex: 1,
              textTransform: 'none',
              fontSize: '12px',
              fontWeight: 700,
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
              flex: 1,
              textTransform: 'none',
              fontSize: '12px',
              fontWeight: 700,
              color: '#fff',
              background: PINK,
              borderRadius: '8px',
              '&:hover': { background: '#A01560' },
            }}
          >
            Post
          </Button>
        </Box>
      </Box>

      <Menu anchorEl={menuAnchor} open={!!menuAnchor} onClose={() => setMenuAnchor(null)}>
        <MenuItem onClick={handleDelete} sx={{ color: '#DC2626' }}>
          Delete
        </MenuItem>
      </Menu>

      <Dialog open={scheduleOpen} onClose={() => setScheduleOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ fontSize: '15px', fontWeight: 700 }}>Schedule this post</DialogTitle>
        <DialogContent>
          <TextField
            type="datetime-local"
            fullWidth
            size="small"
            value={scheduleAt}
            onChange={(e) => setScheduleAt(e.target.value)}
            sx={{ mt: 1 }}
          />
        </DialogContent>
        <DialogActions>
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
        </DialogActions>
      </Dialog>
    </Box>
  );
}
