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
import { MdMoreVert } from 'react-icons/md';
import { ContentDraft, SocialMediaAgentService } from '@/src/api/SocialMediaAgentService';
import { ToastService } from '@/src/utils/toast.util';
import { ToastTypeEnum } from '@/src/models/enum-models/ToastTypeEnum';

const PINK = '#CD1B78';

const PLATFORM_META: Record<string, { icon: React.ReactNode; color: string; label: string }> = {
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
function firstSlideImage(draft: ContentDraft): string | undefined {
  return draft.slides?.find((s) => s.image_url)?.image_url;
}

// Matches DraftCard's own aspect-ratio resolution exactly, plus a readable
// "1:1 Post (1080 × 1080)" label built from the same real fields.
function mediaMeta(draft: ContentDraft): { aspect: string; label: string } {
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

interface GeneratedContentCardProps {
  draft: ContentDraft;
  connectedPlatforms: string[] | null;
  onEdit: (draft: ContentDraft) => void;
  onRefresh: () => void;
  onDelete?: (id: string) => void;
}

export default function GeneratedContentCard({
  draft,
  connectedPlatforms,
  onEdit,
  onRefresh,
  onDelete,
}: GeneratedContentCardProps) {
  const [menuAnchor, setMenuAnchor] = useState<HTMLElement | null>(null);
  const [scheduleOpen, setScheduleOpen] = useState(false);
  const [scheduleAt, setScheduleAt] = useState('');
  const [busy, setBusy] = useState(false);

  const id = draft.draft_id ?? draft.id ?? '';
  const platformKey = (draft.platform || '').toLowerCase();
  const meta = PLATFORM_META[platformKey];
  const { aspect, label } = mediaMeta(draft);
  const isCarousel = draft.post_type === 'carousel';
  const previewImage = draft.image_url ?? firstSlideImage(draft);
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
          aspectRatio: aspect,
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
        {!previewImage && !draft.video_url && (
          <Typography fontSize="12px" color="#9CA3AF">
            No image
          </Typography>
        )}
        {isCarousel && (draft.slides?.length ?? 0) > 1 && (
          <Box
            sx={{
              position: 'absolute',
              bottom: 8,
              right: 8,
              background: 'rgba(17,24,39,.65)',
              color: '#fff',
              fontSize: '10.5px',
              fontWeight: 700,
              borderRadius: '999px',
              px: 1,
              py: 0.25,
            }}
          >
            1/{draft.slides?.length} slides
          </Box>
        )}
      </Box>

      <Box sx={{ p: 1.5, flex: 1, display: 'flex', flexDirection: 'column' }}>
        <Box sx={{ flex: 1, mb: 1.25 }}>
          <Typography
            fontSize="12.5px"
            color="#374151"
            sx={{
              display: '-webkit-box',
              WebkitLineClamp: 3,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
              whiteSpace: 'pre-wrap',
              mb: draft.hashtags?.length ? 0.5 : 0,
            }}
          >
            {draft.content}
          </Typography>
          {!!draft.hashtags?.length && (
            <Typography fontSize="11.5px" color={PINK}>
              {draft.hashtags.map((h) => `#${h.replace(/^#+/, '')}`).join(' ')}
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
