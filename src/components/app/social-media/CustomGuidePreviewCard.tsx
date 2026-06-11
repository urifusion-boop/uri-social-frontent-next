'use client';

import { CustomVisualGuide, MatchOutcome } from '@/src/api/CustomVisualGuideService';
import { Box, Button, Chip, IconButton, Typography } from '@mui/material';
import { FaCheckCircle, FaExclamationTriangle, FaInfoCircle, FaTimes, FaFont } from 'react-icons/fa';

interface CustomGuidePreviewCardProps {
  guide: CustomVisualGuide;
  onRemove?: () => void;
  onSelectFont?: (guideId: string) => void;
  compact?: boolean;
}

export default function CustomGuidePreviewCard({
  guide,
  onRemove,
  onSelectFont,
  compact = false,
}: CustomGuidePreviewCardProps) {
  const primary = '#CD1B78';

  // Match outcome configuration
  const getMatchOutcomeConfig = (outcome: MatchOutcome) => {
    switch (outcome) {
      case 'STRONG_MATCH':
        return {
          color: '#10B981',
          bgColor: '#D1FAE5',
          icon: <FaCheckCircle size={18} />,
          label: 'Strong Match',
          message: 'Perfect! We found a great matching font in your library.',
        };
      case 'DECENT_MATCH':
        return {
          color: '#3B82F6',
          bgColor: '#DBEAFE',
          icon: <FaCheckCircle size={18} />,
          label: 'Good Match',
          message: 'We found a good matching font that should work well.',
        };
      case 'WEAK_MATCH':
        return {
          color: '#F59E0B',
          bgColor: '#FEF3C7',
          icon: <FaExclamationTriangle size={18} />,
          label: 'Weak Match',
          message: 'Match quality is low. Consider uploading the exact font.',
        };
      case 'NO_RECOMMENDED_MATCH':
        return {
          color: '#EF4444',
          bgColor: '#FEE2E2',
          icon: <FaInfoCircle size={18} />,
          label: 'No Match Found',
          message: guide.typography_match.identified_font_name
            ? `We identified "${guide.typography_match.identified_font_name}" but it's not in your library.`
            : 'No matching font found in your library.',
        };
      case 'NO_MATCH':
        return {
          color: '#6B7280',
          bgColor: '#F3F4F6',
          icon: <FaInfoCircle size={18} />,
          label: 'No Match',
          message: "We couldn't identify a specific font to match.",
        };
      case 'NO_TYPOGRAPHY':
        return {
          color: '#8B5CF6',
          bgColor: '#EDE9FE',
          icon: <FaInfoCircle size={18} />,
          label: 'No Typography',
          message: 'No visible text detected in this reference image.',
        };
      case 'DECORATIVE_ACCEPTED':
        return {
          color: '#EC4899',
          bgColor: '#FCE7F3',
          icon: <FaCheckCircle size={18} />,
          label: 'Decorative Font',
          message: 'Decorative/artistic font detected. Style guide created without font matching.',
        };
      default:
        return {
          color: '#6B7280',
          bgColor: '#F3F4F6',
          icon: <FaInfoCircle size={18} />,
          label: 'Processing',
          message: 'Processing...',
        };
    }
  };

  const outcomeConfig = getMatchOutcomeConfig(guide.match_outcome);

  return (
    <Box
      sx={{
        position: 'relative',
        borderRadius: compact ? '10px' : '12px',
        overflow: 'hidden',
        background: '#fff',
        border: '1px solid #E5E7EB',
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
            background: 'rgba(255,255,255,0.9)',
            backdropFilter: 'blur(4px)',
            zIndex: 2,
            '&:hover': {
              background: '#fff',
            },
          }}
        >
          <FaTimes size={14} />
        </IconButton>
      )}

      {/* Image preview */}
      <Box
        sx={{
          width: '100%',
          height: compact ? 120 : 180,
          background: `url(${guide.original_image_url}) center/cover`,
          position: 'relative',
        }}
      >
        {/* Match outcome badge */}
        <Box
          sx={{
            position: 'absolute',
            bottom: 8,
            left: 8,
            display: 'flex',
            alignItems: 'center',
            gap: 0.5,
            px: 1.5,
            py: 0.75,
            background: outcomeConfig.bgColor,
            borderRadius: '8px',
            border: `1px solid ${outcomeConfig.color}33`,
          }}
        >
          <Box sx={{ color: outcomeConfig.color, display: 'flex', alignItems: 'center' }}>{outcomeConfig.icon}</Box>
          <Typography
            sx={{
              fontSize: 12,
              fontWeight: 600,
              color: outcomeConfig.color,
            }}
          >
            {outcomeConfig.label}
          </Typography>
        </Box>
      </Box>

      {/* Content */}
      <Box sx={{ p: compact ? 1.5 : 2 }}>
        {/* Guide name */}
        <Typography
          sx={{
            fontSize: compact ? 13 : 14,
            fontWeight: 600,
            color: '#0d0e0f',
            mb: 0.5,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          {guide.name}
        </Typography>

        {/* Match message */}
        <Typography
          sx={{
            fontSize: 12,
            color: '#6B7280',
            mb: 1.5,
            lineHeight: 1.5,
          }}
        >
          {outcomeConfig.message}
        </Typography>

        {/* Matched font info */}
        {guide.typography_match.matched_font_name && (
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 1,
              p: 1.5,
              background: '#F9FAFB',
              borderRadius: '8px',
              mb: 1.5,
            }}
          >
            <FaFont size={18} color={primary} />
            <Box sx={{ flex: 1 }}>
              <Typography sx={{ fontSize: 11, color: '#6B7280', mb: 0.25 }}>Matched Font</Typography>
              <Typography sx={{ fontSize: 13, fontWeight: 600, color: '#0d0e0f' }}>
                {guide.typography_match.matched_font_name}
              </Typography>
            </Box>
            {guide.typography_match.match_confidence && (
              <Chip
                label={guide.typography_match.match_confidence}
                size="small"
                sx={{
                  fontSize: 10,
                  fontWeight: 600,
                  height: 20,
                  textTransform: 'uppercase',
                  background:
                    guide.typography_match.match_confidence === 'high'
                      ? '#D1FAE5'
                      : guide.typography_match.match_confidence === 'medium'
                        ? '#FEF3C7'
                        : '#FEE2E2',
                  color:
                    guide.typography_match.match_confidence === 'high'
                      ? '#10B981'
                      : guide.typography_match.match_confidence === 'medium'
                        ? '#F59E0B'
                        : '#EF4444',
                }}
              />
            )}
          </Box>
        )}

        {/* Next step suggestion */}
        {guide.typography_match.next_step_suggestion && (
          <Box
            sx={{
              p: 1.5,
              background: '#FEF3C7',
              borderRadius: '8px',
              border: '1px solid #FDE68A',
              mb: 1.5,
            }}
          >
            <Typography sx={{ fontSize: 11, fontWeight: 600, color: '#92400E', mb: 0.5 }}>Suggested Action:</Typography>
            <Typography sx={{ fontSize: 12, color: '#78350F', lineHeight: 1.4 }}>
              {guide.typography_match.next_step_suggestion.message}
            </Typography>
            <Box sx={{ display: 'flex', gap: 1, mt: 1 }}>
              {guide.typography_match.next_step_suggestion.actionable_link && (
                <Button
                  size="small"
                  variant="contained"
                  onClick={() => window.open(guide.typography_match.next_step_suggestion!.actionable_link, '_blank')}
                  sx={{
                    textTransform: 'none',
                    fontSize: 11,
                    fontWeight: 600,
                    background: primary,
                    color: '#fff',
                    '&:hover': {
                      background: '#9B1460',
                    },
                  }}
                >
                  Download from Google Fonts →
                </Button>
              )}
              {onSelectFont && (
                <Button
                  size="small"
                  onClick={() => onSelectFont(guide.id)}
                  sx={{
                    textTransform: 'none',
                    fontSize: 11,
                    fontWeight: 600,
                    color: primary,
                    '&:hover': {
                      background: `${primary}10`,
                    },
                  }}
                >
                  Upload Font File →
                </Button>
              )}
            </Box>
          </Box>
        )}

        {/* Aesthetic summary */}
        {!compact && guide.aesthetic_summary && (
          <Box>
            <Typography sx={{ fontSize: 11, fontWeight: 600, color: '#0d0e0f', mb: 0.75 }}>Visual Style:</Typography>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
              <Chip
                label={guide.aesthetic_summary.visual_genre}
                size="small"
                sx={{
                  fontSize: 10,
                  height: 22,
                  background: `${primary}10`,
                  color: primary,
                  fontWeight: 500,
                }}
              />
              <Chip
                label={guide.aesthetic_summary.mood.primary}
                size="small"
                sx={{
                  fontSize: 10,
                  height: 22,
                  background: '#F3F4F6',
                  color: '#374151',
                  fontWeight: 500,
                }}
              />
              {guide.aesthetic_summary.color_palette.temperature && (
                <Chip
                  label={guide.aesthetic_summary.color_palette.temperature}
                  size="small"
                  sx={{
                    fontSize: 10,
                    height: 22,
                    background: '#F3F4F6',
                    color: '#374151',
                    fontWeight: 500,
                  }}
                />
              )}
            </Box>
          </Box>
        )}

        {/* Times used */}
        {guide.times_used > 0 && (
          <Typography
            sx={{
              mt: 1.5,
              fontSize: 11,
              color: '#9CA3AF',
              textAlign: 'right',
            }}
          >
            Used {guide.times_used} {guide.times_used === 1 ? 'time' : 'times'}
          </Typography>
        )}
      </Box>
    </Box>
  );
}
