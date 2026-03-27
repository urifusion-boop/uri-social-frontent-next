'use client';

import { ReactElement } from 'react';
import { ApprovePayload, ContentDraft, DenyPayload, SocialMediaAgentService } from '@/src/api/SocialMediaAgentService';
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
  Menu,
  MenuItem,
  TextField,
  Typography,
} from '@mui/material';
import { useEffect, useState } from 'react';
import { FaFacebook, FaInstagram, FaLinkedin, FaTwitter } from 'react-icons/fa';
import DraftEditor from './DraftEditor';

interface DraftCardProps {
  draft: ContentDraft;
  onRefresh: () => void;
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
};

// Industry-standard aspect ratios per platform
const PLATFORM_ASPECT: Record<string, string> = {
  linkedin: '1200 / 628', // 1.91:1 — LinkedIn recommended
  twitter: '16 / 9', // 1200×675 — Twitter/X standard
  facebook: '1200 / 630', // 1.91:1 — Facebook recommended
  instagram: '4 / 5', // 1080×1350 — highest reach on Instagram
};

const DraftCard = ({ draft: initialDraft, onRefresh }: DraftCardProps) => {
  const [draft, setDraft] = useState<ContentDraft>(initialDraft);

  // Sync from parent when the parent refreshes (e.g. image_url arrives after background generation).
  // Only update while not editing so we don't discard the user's in-progress changes.
  useEffect(() => {
    if (!editing) setDraft(initialDraft);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialDraft.image_url, initialDraft.status, initialDraft.approval_status]);
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
  const [lightboxOpen, setLightboxOpen] = useState(false);

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
        border: '1px solid #E5E7EB',
        borderRadius: '12px',
        p: 2.5,
        background: '#fff',
        boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
      }}
    >
      {/* Header row */}
      <Box display="flex" alignItems="center" gap={1} mb={1.5} flexWrap="wrap">
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

      {/* Generated image — correct platform aspect ratio, skeleton while loading */}
      {!editing &&
        draft.image_url &&
        (() => {
          const specs = (draft as { image_specs?: { width?: number; height?: number } }).image_specs;
          const aspect =
            specs?.width && specs?.height
              ? `${specs.width} / ${specs.height}`
              : (PLATFORM_ASPECT[draft.platform] ?? '16 / 9');
          return (
            <Box
              mb={1.5}
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
              {!imageLoaded && (
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
                src={
                  draft.image_url.startsWith('/')
                    ? `${process.env.NEXT_PUBLIC_URI_API_BASE_URL}${draft.image_url}`
                    : draft.image_url
                }
                alt={`AI-generated image for ${draft.platform}`}
                onLoad={() => setImageLoaded(true)}
                onClick={() => setLightboxOpen(true)}
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                  display: imageLoaded ? 'block' : 'none',
                  cursor: 'pointer',
                }}
              />
            </Box>
          );
        })()}
      {!editing && !draft.image_url && (draft.has_image || draft.auto_generated) && (
        <Box
          mb={1.5}
          sx={{
            height: 80,
            borderRadius: '8px',
            border: '1px dashed #E0DEF7',
            background: 'linear-gradient(90deg, #F7F7FD 25%, #EEECFB 50%, #F7F7FD 75%)',
            backgroundSize: '200% 100%',
            animation: 'shimmer 2s infinite',
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
          <Typography fontSize="12px" color="#9CA3AF">
            🎨 Generating image…
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
            inputProps={{ min: new Date(Date.now() + 5 * 60 * 1000).toISOString().slice(0, 16) }}
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
              src={
                draft.image_url.startsWith('/')
                  ? `${process.env.NEXT_PUBLIC_URI_API_BASE_URL}${draft.image_url}`
                  : draft.image_url
              }
              alt={`AI-generated image for ${draft.platform}`}
              style={{ maxWidth: '100%', maxHeight: '80vh', objectFit: 'contain', display: 'block' }}
            />
          )}
        </DialogContent>
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
