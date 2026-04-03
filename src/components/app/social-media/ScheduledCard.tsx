'use client';

import { ReactElement } from 'react';
import { ContentDraft, SocialMediaAgentService } from '@/src/api/SocialMediaAgentService';
import { ToastTypeEnum } from '@/src/models/enum-models/ToastTypeEnum';
import { ToastService } from '@/src/utils/toast.util';
import { Box, Button, Chip, Dialog, DialogActions, DialogContent, Typography } from '@mui/material';
import { useState } from 'react';
import { FaFacebook, FaInstagram, FaLinkedin, FaTwitter } from 'react-icons/fa';
import { MdCalendarToday, MdOutlineSchedule } from 'react-icons/md';

const PLATFORM_ASPECT: Record<string, string> = {
  linkedin: '1200 / 628',
  twitter: '16 / 9',
  facebook: '1200 / 630',
  instagram: '4 / 5',
};

interface ScheduledCardProps {
  draft: ContentDraft & { scheduled_date?: string };
  onRefresh: () => void;
}

const platformChip: Record<string, { icon: ReactElement; color: string; bg: string }> = {
  facebook: { icon: <FaFacebook size={13} color="#1877F2" />, color: '#1877F2', bg: '#EFF6FF' },
  instagram: { icon: <FaInstagram size={13} color="#E1306C" />, color: '#E1306C', bg: '#FFF0F6' },
  twitter: { icon: <FaTwitter size={13} color="#1DA1F2" />, color: '#1DA1F2', bg: '#EFF6FF' },
  linkedin: { icon: <FaLinkedin size={13} color="#0A66C2" />, color: '#0A66C2', bg: '#EFF6FF' },
};

const formatScheduledDate = (raw?: string): string => {
  if (!raw) return 'Unknown time';
  try {
    const d = new Date(raw);
    return d.toLocaleString(undefined, {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return raw;
  }
};

const getCountdown = (raw?: string): string => {
  if (!raw) return '';
  const diff = new Date(raw).getTime() - Date.now();
  if (diff <= 0) return 'Publishing soon…';
  const h = Math.floor(diff / 3_600_000);
  const m = Math.floor((diff % 3_600_000) / 60_000);
  if (h >= 24) return `in ${Math.floor(h / 24)}d ${h % 24}h`;
  if (h > 0) return `in ${h}h ${m}m`;
  return `in ${m}m`;
};

const ScheduledCard = ({ draft, onRefresh }: ScheduledCardProps) => {
  const [confirmUnschedule, setConfirmUnschedule] = useState(false);
  const [loading, setLoading] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [lightboxOpen, setLightboxOpen] = useState(false);

  const pc = platformChip[draft.platform] ?? { icon: null, color: '#6B7280', bg: '#F3F4F6' };
  const scheduledDate = (draft as any).scheduled_date ?? draft.scheduled_datetime;

  const handleUnschedule = async () => {
    if (!confirmUnschedule) {
      setConfirmUnschedule(true);
      return;
    }
    setLoading(true);
    try {
      const draftId = draft.draft_id ?? draft.id ?? '';
      const response = await SocialMediaAgentService.deleteDraft(draftId);
      if (response.status) {
        ToastService.showToast('Post unscheduled and removed', ToastTypeEnum.Success);
        onRefresh();
      } else {
        ToastService.showToast(response.responseMessage || 'Failed', ToastTypeEnum.Error);
        setConfirmUnschedule(false);
      }
    } catch {
      ToastService.showToast('Failed to unschedule', ToastTypeEnum.Error);
      setConfirmUnschedule(false);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box
      sx={{
        border: '1px solid #E5E7EB',
        borderRadius: '12px',
        background: '#fff',
        boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
        overflow: 'hidden',
      }}
    >
      {/* Scheduled banner */}
      <Box
        sx={{
          background: 'linear-gradient(135deg, #7C3AED 0%, #5B21B6 100%)',
          px: 2.5,
          py: 1.25,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 1,
        }}
      >
        <Box display="flex" alignItems="center" gap={1}>
          <MdCalendarToday color="#fff" size={15} />
          <Typography fontSize="13px" fontWeight={700} color="#fff">
            {formatScheduledDate(scheduledDate)}
          </Typography>
        </Box>
        <Box display="flex" alignItems="center" gap={0.75}>
          <MdOutlineSchedule color="rgba(255,255,255,0.75)" size={13} />
          <Typography fontSize="11px" color="rgba(255,255,255,0.85)" fontWeight={500}>
            {getCountdown(scheduledDate)}
          </Typography>
        </Box>
      </Box>

      {/* Card body */}
      <Box sx={{ p: 2.5 }}>
        {/* Platform chip */}
        <Box display="flex" alignItems="center" gap={1} mb={1.5}>
          <Chip
            icon={pc.icon ?? undefined}
            label={draft.platform.charAt(0).toUpperCase() + draft.platform.slice(1)}
            size="small"
            sx={{ background: pc.bg, color: pc.color, fontWeight: 600, fontSize: '11px', height: 24 }}
          />
          <Chip label="Scheduled" size="small" sx={{ background: '#EDE9FE', color: '#5B21B6', fontWeight: 600, fontSize: '11px', height: 24 }} />
        </Box>

        {/* Content preview */}
        <Typography
          fontSize="14px"
          color="#374151"
          sx={{
            whiteSpace: 'pre-wrap',
            lineHeight: 1.6,
            display: '-webkit-box',
            WebkitLineClamp: 4,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
            mb: 1.5,
          }}
        >
          {draft.content}
        </Typography>

        {/* Hashtags */}
        {draft.hashtags && draft.hashtags.length > 0 && (
          <Box display="flex" gap={0.5} flexWrap="wrap" mb={1.5}>
            {draft.hashtags.map((tag) => (
              <Typography key={tag} fontSize="12px" color="#7C3AED" fontWeight={500}>
                #{tag}
              </Typography>
            ))}
          </Box>
        )}

        {/* Image thumbnail if present */}
        {draft.image_url &&
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
                  src={draft.image_url.startsWith('/') ? `${process.env.NEXT_PUBLIC_URI_API_BASE_URL}${draft.image_url}` : draft.image_url}
                  alt="Scheduled post image"
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

        {/* Action */}
        <Box display="flex" justifyContent="flex-end">
          <Button
            size="small"
            variant={confirmUnschedule ? 'contained' : 'outlined'}
            color="error"
            disabled={loading}
            onClick={handleUnschedule}
            onBlur={() => setConfirmUnschedule(false)}
            sx={{ textTransform: 'none', fontSize: '12px' }}
          >
            {loading ? 'Removing...' : confirmUnschedule ? 'Confirm unschedule?' : 'Unschedule'}
          </Button>
        </Box>
      </Box>

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
              src={draft.image_url.startsWith('/') ? `${process.env.NEXT_PUBLIC_URI_API_BASE_URL}${draft.image_url}` : draft.image_url}
              alt="Scheduled post image"
              style={{ maxWidth: '100%', maxHeight: '80vh', objectFit: 'contain', display: 'block' }}
            />
          )}
        </DialogContent>
      </Dialog>
    </Box>
  );
};

export default ScheduledCard;
