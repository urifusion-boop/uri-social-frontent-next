'use client';

import { useState } from 'react';
import {
  Box,
  Button,
  Checkbox,
  Dialog,
  FormControlLabel,
  IconButton,
  Menu,
  MenuItem,
  TextField,
  Typography,
} from '@mui/material';
import { MdChevronLeft, MdChevronRight, MdClose } from 'react-icons/md';
import { ContentDraft, SocialMediaAgentService, TikTokPostSettings } from '@/src/api/SocialMediaAgentService';
import { ToastService } from '@/src/utils/toast.util';
import { ToastTypeEnum } from '@/src/models/enum-models/ToastTypeEnum';
import { describePublishJob, queuedNotice, queuedPublish, resumeTimeMs } from '@/src/utils/publishJobMessage.util';
import TikTokPostDialog from '../workspace/TikTokPostDialog';
import { PLATFORM_META, firstSlideImage, mediaMeta } from './GeneratedContentCard';

const PINK = '#CD1B78';

interface GeneratedDraftEditorProps {
  draft: ContentDraft;
  connectedPlatforms: string[] | null;
  onClose: () => void;
  onRefresh: () => void;
}

// The on-brand counterpart to the classic DraftCard editor — used wherever a
// freshly generated/library draft is opened for a quick caption tweak and
// publish decision (the wizard's Review & Schedule step, Content Library's
// "Edit" action). Deliberately NOT a port of DraftCard's full feature set
// (image regenerate, CanvasEditor, logo reposition, deny) — Canvas/Move Logo
// now live on DraftDetailView instead (Content Library's "View details"),
// since that's the actual "click a post, see the image" surface; this one
// stays a lightweight caption-and-publish dialog on purpose.
export default function GeneratedDraftEditor({
  draft: initialDraft,
  connectedPlatforms,
  onClose,
  onRefresh,
}: GeneratedDraftEditorProps) {
  const [draft, setDraft] = useState(initialDraft);
  const [content, setContent] = useState(initialDraft.content);
  const [hashtagInput, setHashtagInput] = useState((initialDraft.hashtags ?? []).join(', '));
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [musicSaving, setMusicSaving] = useState(false);
  const [approveAnchor, setApproveAnchor] = useState<HTMLElement | null>(null);
  const [scheduleOpen, setScheduleOpen] = useState(false);
  const [scheduleAt, setScheduleAt] = useState('');
  const [busy, setBusy] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [tiktokDialogOpen, setTiktokDialogOpen] = useState(false);

  const id = draft.draft_id ?? draft.id ?? '';
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
  const isConnected =
    connectedPlatforms === null || connectedPlatforms.map((p) => p.toLowerCase()).includes(platformKey);
  const isTiktokPhoto = platformKey === 'tiktok' && !draft.video_url;

  const handleSave = async () => {
    const hashtags = hashtagInput
      .split(',')
      .map((h) => h.trim().replace(/^#/, ''))
      .filter(Boolean);
    setSaving(true);
    try {
      const response = await SocialMediaAgentService.refineContent({
        draft_id: id,
        refinements: { content, hashtags },
      });
      if (response.status && response.responseData) {
        setDraft(response.responseData);
        setDirty(false);
        ToastService.showToast('Draft updated', ToastTypeEnum.Success);
        onRefresh();
      } else {
        ToastService.showToast(response.responseMessage || 'Save failed', ToastTypeEnum.Error);
      }
    } catch {
      ToastService.showToast('Save failed — try again', ToastTypeEnum.Error);
    } finally {
      setSaving(false);
    }
  };

  const handleToggleMusic = async (enabled: boolean) => {
    const previous = draft.tiktok_auto_add_music;
    setDraft((d) => ({ ...d, tiktok_auto_add_music: enabled }));
    setMusicSaving(true);
    try {
      const res = await SocialMediaAgentService.setTiktokAutoAddMusic(id, enabled);
      if (!res.status) {
        setDraft((d) => ({ ...d, tiktok_auto_add_music: previous }));
        ToastService.showToast(res.responseMessage || 'Could not save', ToastTypeEnum.Error);
      }
    } catch {
      setDraft((d) => ({ ...d, tiktok_auto_add_music: previous }));
      ToastService.showToast('Could not save', ToastTypeEnum.Error);
    } finally {
      setMusicSaving(false);
    }
  };

  const doApprove = async (option: 'immediate' | 'schedule' | 'save_draft', datetime?: string) => {
    if (option !== 'save_draft' && !isConnected) {
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
      const queued = option === 'immediate' ? queuedPublish(res.responseData, id) : null;
      if (res.status) {
        ToastService.showToast(
          queued
            ? queuedNotice(queued)
            : option === 'immediate'
              ? 'Published!'
              : option === 'schedule'
                ? 'Scheduled!'
                : 'Saved to drafts.',
          queued ? ToastTypeEnum.Warning : ToastTypeEnum.Success
        );
        onRefresh();
        onClose();
      } else {
        ToastService.showToast(res.responseMessage || 'Action failed', ToastTypeEnum.Error);
      }
    } catch {
      ToastService.showToast('Action failed — try again', ToastTypeEnum.Error);
    } finally {
      setBusy(false);
      setApproveAnchor(null);
      setScheduleOpen(false);
    }
  };

  // The pictures a TikTok photo post carries: each carousel slide, or the single image.
  const resolveUrl = (url: string) => {
    if (!url.startsWith('/')) return url;
    const base = process.env.NEXT_PUBLIC_URI_API_BASE_URL || process.env.NEXT_PUBLIC_URI_API_BASE_URL_DEV || '';
    return `${base}${url}`;
  };
  const tiktokPhotoUrls = (isCarousel ? slides.map((sl) => sl.image_url) : [draft.image_url ?? firstSlideImage(draft)])
    .filter((u): u is string => !!u)
    .map(resolveUrl);
  const editedHashtags = hashtagInput
    .split(',')
    .map((h) => h.trim().replace(/^#/, ''))
    .filter(Boolean);

  // A TikTok photo cannot go through the quick approve call: TikTok requires its own
  // screen first (privacy, comments, disclosure, consent), so Publish Now opens that
  // screen and nothing is sent until the user confirms it.
  const handlePublishNow = () => {
    setApproveAnchor(null);
    if (!isTiktokPhoto) {
      doApprove('immediate');
      return;
    }
    if (!isConnected) {
      ToastService.showToast(
        `${meta?.label ?? draft.platform} isn't connected — connect it first.`,
        ToastTypeEnum.Error
      );
      return;
    }
    setTiktokDialogOpen(true);
  };

  // Sends the post once the user has confirmed on the Post to TikTok screen, then follows
  // the job so they see its status through to the end (same flow as the Drafts tab card).
  const handleTikTokPhotoConfirm = async (settings: TikTokPostSettings) => {
    setTiktokDialogOpen(false);
    setBusy(true);
    try {
      const res = await SocialMediaAgentService.publishTikTokPhotoDraft({ draft_id: id, tiktok: settings });
      if (!res.status || !res.responseData) {
        ToastService.showToast(res.responseMessage || "Couldn't send this to TikTok.", ToastTypeEnum.Error);
        return;
      }
      ToastService.showToast('Sending to TikTok…', ToastTypeEnum.Warning);
      const jobId = res.responseData.job_id;
      // Normally ~200s. A job waiting its turn (TikTok rate limit, or another post going out first)
      // is followed until it is due plus a margin, so waiting never reads as a timeout.
      const POLL_MS = 5000;
      const WAIT_MARGIN_MS = 3 * 60 * 1000;
      let deadline = Date.now() + 200_000;
      let toldAboutWait = false;
      while (Date.now() < deadline) {
        await new Promise((r) => setTimeout(r, POLL_MS));
        const poll = await SocialMediaAgentService.getVideoPublishJob(jobId);
        const job = poll.responseData;
        if (!job) continue;
        const msg = describePublishJob(job);
        if (job.status === 'queued') {
          const due = resumeTimeMs(job);
          if (due) deadline = Math.max(deadline, due + WAIT_MARGIN_MS);
          if (msg.tone === 'waiting' && !toldAboutWait) {
            toldAboutWait = true;
            ToastService.showToast(`${msg.title}. ${msg.body}`, ToastTypeEnum.Warning);
          }
          continue;
        }
        if (job.status === 'published') {
          ToastService.showToast(`${msg.title}. ${msg.body}`, ToastTypeEnum.Success);
          onRefresh();
          onClose();
          return;
        }
        // Accepted by TikTok but not yet confirmed: never shown as posted.
        if (job.status === 'processing' && job.error) {
          ToastService.showToast(msg.body, ToastTypeEnum.Warning);
          onRefresh();
          return;
        }
        if (job.status === 'failed') {
          // A rate limit or cap is a warning, not a red failure, and never a "reconnect" prompt.
          ToastService.showToast(
            msg.tone === 'warning' ? `${msg.title}. ${msg.body}` : msg.body,
            msg.tone === 'error' ? ToastTypeEnum.Error : ToastTypeEnum.Warning
          );
          onRefresh();
          return;
        }
      }
      ToastService.showToast(
        'TikTok is still processing this post. Check your TikTok profile in a few minutes.',
        ToastTypeEnum.Warning
      );
      onRefresh();
    } catch (err: unknown) {
      const detail = (err as { data?: { detail?: string } })?.data?.detail;
      ToastService.showToast(detail || "Couldn't send this to TikTok. Please try again.", ToastTypeEnum.Error);
    } finally {
      setBusy(false);
    }
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

  // While the Post to TikTok screen is open it takes over: the editor's own dialog would hold the
  // keyboard focus and sit over it. Everything typed in the editor lives in this component's state,
  // so it is all still here when the screen closes.
  if (tiktokDialogOpen) {
    return (
      <TikTokPostDialog
        media={{ kind: 'photo', urls: tiktokPhotoUrls }}
        initialTitle={content.split('\n')[0].slice(0, 90)}
        initialDescription={[content, editedHashtags.map((h) => `#${h}`).join(' ')].filter(Boolean).join('\n\n')}
        onClose={() => setTiktokDialogOpen(false)}
        onConfirm={handleTikTokPhotoConfirm}
      />
    );
  }

  return (
    <Dialog
      open
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{ sx: { borderRadius: '20px', overflow: 'hidden' } }}
    >
      {/* Header */}
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          px: 2.5,
          py: 2,
          background: 'linear-gradient(180deg, #FCE4EC 0%, #FBF8F7 100%)',
          borderBottom: '1px solid #F3D4E4',
        }}
      >
        <Box display="flex" alignItems="center" gap={1.25} sx={{ minWidth: 0 }}>
          <Box
            sx={{
              width: 32,
              height: 32,
              borderRadius: '9px',
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
            <Typography fontSize="14.5px" fontWeight={700} color="#111827" noWrap>
              {meta?.label ?? draft.platform}
            </Typography>
            <Typography fontSize="11.5px" color="#9CA3AF" noWrap>
              {label}
            </Typography>
          </Box>
        </Box>
        <IconButton size="small" onClick={onClose} sx={{ color: '#6B7280' }}>
          <MdClose size={18} />
        </IconButton>
      </Box>

      {/* Body */}
      <Box sx={{ p: 2.5, maxHeight: '70vh', overflowY: 'auto' }}>
        <Box
          onClick={() => previewImage && setLightboxOpen(true)}
          sx={{
            width: '100%',
            maxHeight: 220,
            aspectRatio: draft.post_type === 'story' ? '9 / 16' : aspect,
            borderRadius: '12px',
            overflow: 'hidden',
            border: '1px solid #E5E7EB',
            background: previewImage ? `url(${previewImage}) center/cover` : draft.video_url ? '#111' : '#F9FAFB',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            position: 'relative',
            mb: 2,
            cursor: previewImage ? 'zoom-in' : 'default',
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
              {isCarousel && currentSlide?.image_failed ? '⚠️ Image generation failed' : 'No image'}
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
          <Box sx={{ p: 1.25, mb: 2, borderRadius: '8px', border: '1px solid #E5E7EB', background: '#FAFAFA' }}>
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

        <Typography fontSize="12.5px" fontWeight={700} color="#111827" mb={0.75}>
          Caption
        </Typography>
        <TextField
          fullWidth
          multiline
          rows={5}
          value={content}
          onChange={(e) => {
            setContent(e.target.value);
            setDirty(true);
          }}
          sx={{ mb: 2, '& .MuiOutlinedInput-root': { fontSize: '13px' } }}
        />

        <Typography fontSize="12.5px" fontWeight={700} color="#111827" mb={0.75}>
          Hashtags
        </Typography>
        <TextField
          fullWidth
          size="small"
          value={hashtagInput}
          onChange={(e) => {
            setHashtagInput(e.target.value);
            setDirty(true);
          }}
          placeholder="marketing, socialmedia, growth"
          helperText="Comma-separated, without # — added automatically"
          sx={{ mb: dirty ? 1.5 : 2, '& .MuiOutlinedInput-root': { fontSize: '13px' } }}
        />

        {dirty && (
          <Button
            onClick={handleSave}
            disabled={saving || !content.trim()}
            size="small"
            sx={{
              mb: 2,
              textTransform: 'none',
              fontWeight: 700,
              fontSize: '12.5px',
              color: PINK,
              border: `1px solid ${PINK}`,
              borderRadius: '8px',
              px: 1.5,
            }}
          >
            {saving ? 'Saving…' : 'Save caption changes'}
          </Button>
        )}

        {isTiktokPhoto && (
          <Box sx={{ p: 1.5, borderRadius: '10px', border: '1px solid #E5E7EB', background: '#F9FAFB' }}>
            <FormControlLabel
              control={
                <Checkbox
                  size="small"
                  checked={!!draft.tiktok_auto_add_music}
                  disabled={musicSaving}
                  onChange={(e) => handleToggleMusic(e.target.checked)}
                  sx={{ color: PINK, '&.Mui-checked': { color: PINK } }}
                />
              }
              label={
                <Typography fontSize="12px" color="#374151">
                  Let TikTok auto-add background music — it picks the track, there's no way to choose one for photo
                  posts.
                </Typography>
              }
            />
          </Box>
        )}
      </Box>

      {/* Footer */}
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 1,
          px: 2.5,
          py: 2,
          borderTop: '1px solid #E5E7EB',
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
            onClick={(e) => setApproveAnchor(e.currentTarget)}
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
            Post ▾
          </Button>
        </Box>
      </Box>

      <Menu anchorEl={approveAnchor} open={!!approveAnchor} onClose={() => setApproveAnchor(null)}>
        <MenuItem onClick={handlePublishNow}>Publish Now</MenuItem>
        <MenuItem
          onClick={() => {
            setApproveAnchor(null);
            setScheduleOpen(true);
          }}
        >
          Schedule…
        </MenuItem>
        <MenuItem onClick={() => doApprove('save_draft')}>Save as Draft</MenuItem>
      </Menu>

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
            onChange={(e) => {
              setScheduleAt(e.target.value);
              // See GeneratedContentCard's identical fix: the native picker doesn't
              // close itself once a full date+time is set, so it sat visually on top
              // of the Confirm button below until blurred.
              if (e.target.value) e.target.blur();
            }}
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
