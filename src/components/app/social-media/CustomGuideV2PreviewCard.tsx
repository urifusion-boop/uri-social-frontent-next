'use client';

import { CustomVisualGuideV2 } from '@/src/api/CustomVisualGuideV2Service';
import { Box, Chip, IconButton, Typography } from '@mui/material';
import { FaTimes, FaPalette, FaEye } from 'react-icons/fa';

interface CustomGuideV2PreviewCardProps {
  guide: CustomVisualGuideV2;
  onRemove?: () => void;
  compact?: boolean;
}

export default function CustomGuideV2PreviewCard({ guide, onRemove, compact = false }: CustomGuideV2PreviewCardProps) {
  return (
    <Box
      sx={{
        position: 'relative',
        borderRadius: compact ? '10px' : '12px',
        overflow: 'hidden',
        border: '1px solid #E5E7EB',
        background: '#fff',
        transition: 'all 0.2s',
        '&:hover': {
          boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
        },
      }}
    >
      {/* Remove button */}
      {onRemove && (
        <IconButton
          onClick={onRemove}
          size="small"
          sx={{
            position: 'absolute',
            top: 8,
            right: 8,
            background: 'rgba(255,255,255,0.95)',
            backdropFilter: 'blur(4px)',
            zIndex: 2,
            '&:hover': {
              background: '#fff',
              color: '#EF4444',
            },
          }}
        >
          <FaTimes size={12} />
        </IconButton>
      )}

      {/* Reference Image Preview */}
      <Box
        sx={{
          width: '100%',
          height: compact ? 120 : 180,
          position: 'relative',
          overflow: 'hidden',
          background: '#F9FAFB',
        }}
      >
        <img
          src={guide.original_image_url}
          alt={guide.name}
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            display: 'block',
          }}
        />

        {/* V2 Badge */}
        <Chip
          label="V2"
          size="small"
          sx={{
            position: 'absolute',
            top: 8,
            left: 8,
            height: 22,
            fontSize: 10,
            fontWeight: 700,
            background: 'linear-gradient(135deg, #8B5CF6 0%, #EC4899 100%)',
            color: '#fff',
            border: '1.5px solid #fff',
            boxShadow: '0 2px 8px rgba(139,92,246,0.3)',
          }}
        />
      </Box>

      {/* Guide Info */}
      <Box sx={{ p: compact ? 1.5 : 2 }}>
        {/* Guide Name */}
        <Typography
          sx={{
            fontSize: compact ? 13 : 14,
            fontWeight: 600,
            color: '#0d0e0f',
            mb: 1,
            lineHeight: 1.3,
          }}
        >
          {guide.name}
        </Typography>

        {/* Style Summary */}
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.75, mb: 1.5 }}>
          {/* Medium & Aesthetic */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <FaPalette size={12} color="#8B5CF6" />
            <Typography sx={{ fontSize: 11.5, color: '#6B7280', fontWeight: 500 }}>
              {guide.style_summary.medium} • {guide.style_summary.overall_aesthetic}
            </Typography>
          </Box>

          {/* Mood */}
          {guide.style_summary.mood && (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <FaEye size={12} color="#EC4899" />
              <Typography sx={{ fontSize: 11.5, color: '#6B7280', fontWeight: 500 }}>
                {guide.style_summary.mood}
              </Typography>
            </Box>
          )}
        </Box>

        {/* Identity Protection Badge */}
        {guide.identity_elements_excluded > 0 && (
          <Chip
            label={`${guide.identity_elements_excluded} identity element${guide.identity_elements_excluded > 1 ? 's' : ''} excluded`}
            size="small"
            sx={{
              height: 20,
              fontSize: 10,
              fontWeight: 600,
              background: '#FEF3C7',
              color: '#F59E0B',
              mb: 1,
            }}
          />
        )}

        {/* Usage Stats */}
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            pt: 1,
            borderTop: '1px solid #F3F4F6',
          }}
        >
          <Typography sx={{ fontSize: 11, color: '#9CA3AF', fontWeight: 500 }}>
            Used {guide.times_used} time{guide.times_used !== 1 ? 's' : ''}
          </Typography>

          {/* Style Transfer Badge */}
          <Chip
            label="Style Transfer"
            size="small"
            sx={{
              height: 18,
              fontSize: 9.5,
              fontWeight: 600,
              background: 'linear-gradient(135deg, #8B5CF6 0%, #EC4899 100%)',
              color: '#fff',
              px: 0.5,
            }}
          />
        </Box>
      </Box>
    </Box>
  );
}
