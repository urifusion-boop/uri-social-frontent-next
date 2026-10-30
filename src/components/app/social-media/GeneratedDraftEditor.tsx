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
import { MdClose } from 'react-icons/md';
import { ContentDraft, SocialMediaAgentService } from '@/src/api/SocialMediaAgentService';
import { ToastService } from '@/src/utils/toast.util';
import { ToastTypeEnum } from '@/src/models/enum-models/ToastTypeEnum';
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
// publish decision (the wizard's Review & Schedule step, Content Library).
// Deliberately NOT a port of DraftCard's full feature set (image regenerate,
// CanvasEditor, logo reposition, deny) — those stay reachable from the
// classic Drafts tab, which still renders the real DraftCard unchanged.
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

  const id = draft.draft_id ?? draft.id ?? '';
  const platformKey = (draft.platform || '').toLowerCase();
  const meta = PLATFORM_META[platformKey];
  const { aspect, label } = mediaMeta(draft);
  const previewImage = draft.image_url ?? firstSlideImage(draft);
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
      if (res.status) {
        ToastService.showToast(
          option === 'immediate' ? 'Published!' : option === 'schedule' ? 'Scheduled!' : 'Saved to drafts.',
          ToastTypeEnum.Success
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
            mb: 2,
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
        </Box>

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
        <MenuItem onClick={() => doApprove('immediate')}>Publish Now</MenuItem>
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
    </Dialog>
  );
}
