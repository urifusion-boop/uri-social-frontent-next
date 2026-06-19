'use client';

import { Box, IconButton, Popover, Typography } from '@mui/material';
import { useState } from 'react';
import { FaInfoCircle, FaCheckCircle, FaFont } from 'react-icons/fa';
import { MdImage, MdPalette } from 'react-icons/md';

interface CustomGuideInfoTooltipProps {
  variant?: 'icon' | 'text';
}

/**
 * Custom Guide Info Tooltip
 *
 * PRD Section 12: First-Time User Education
 *
 * Displays educational content about custom visual guides:
 * - What they are
 * - How they work
 * - What to expect from font matching
 */
export default function CustomGuideInfoTooltip({ variant = 'icon' }: CustomGuideInfoTooltipProps) {
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);
  const primary = '#CD1B78';

  const handleOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const open = Boolean(anchorEl);

  return (
    <>
      {variant === 'icon' ? (
        <IconButton
          size="small"
          onClick={handleOpen}
          sx={{
            color: '#6B7280',
            '&:hover': { color: primary },
          }}
        >
          <FaInfoCircle size={16} />
        </IconButton>
      ) : (
        <Box
          component="button"
          onClick={handleOpen}
          sx={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 0.5,
            background: 'none',
            border: 'none',
            color: primary,
            fontSize: 13,
            fontWeight: 600,
            cursor: 'pointer',
            textDecoration: 'underline',
            '&:hover': {
              opacity: 0.8,
            },
          }}
        >
          <FaInfoCircle size={14} />
          Learn More
        </Box>
      )}

      <Popover
        open={open}
        anchorEl={anchorEl}
        onClose={handleClose}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'center',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'center',
        }}
        PaperProps={{
          sx: {
            borderRadius: '12px',
            boxShadow: '0 8px 24px rgba(0,0,0,0.15)',
            maxWidth: 420,
            mt: 1,
          },
        }}
      >
        <Box sx={{ p: 3 }}>
          {/* Header */}
          <Box sx={{ mb: 2.5 }}>
            <Typography sx={{ fontSize: 18, fontWeight: 700, color: '#0d0e0f', mb: 0.5 }}>
              Custom Visual Guides
            </Typography>
            <Typography sx={{ fontSize: 13, color: '#6B7280', lineHeight: 1.5 }}>
              Upload reference images to create custom style guides for your content
            </Typography>
          </Box>

          {/* What we analyze */}
          <Box sx={{ mb: 2.5 }}>
            <Typography sx={{ fontSize: 13, fontWeight: 600, color: '#0d0e0f', mb: 1.5 }}>What we analyze:</Typography>

            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
              {/* Visual Style */}
              <Box sx={{ display: 'flex', gap: 1.5 }}>
                <Box
                  sx={{
                    width: 36,
                    height: 36,
                    borderRadius: '8px',
                    background: `${primary}15`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}
                >
                  <MdPalette size={18} color={primary} />
                </Box>
                <Box>
                  <Typography sx={{ fontSize: 13, fontWeight: 600, color: '#0d0e0f', mb: 0.25 }}>
                    Visual Style
                  </Typography>
                  <Typography sx={{ fontSize: 12, color: '#6B7280', lineHeight: 1.4 }}>
                    Colors, lighting, mood, composition, and overall aesthetic
                  </Typography>
                </Box>
              </Box>

              {/* Typography */}
              <Box sx={{ display: 'flex', gap: 1.5 }}>
                <Box
                  sx={{
                    width: 36,
                    height: 36,
                    borderRadius: '8px',
                    background: `${primary}15`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}
                >
                  <FaFont size={18} color={primary} />
                </Box>
                <Box>
                  <Typography sx={{ fontSize: 13, fontWeight: 600, color: '#0d0e0f', mb: 0.25 }}>Typography</Typography>
                  <Typography sx={{ fontSize: 12, color: '#6B7280', lineHeight: 1.4 }}>
                    Font characteristics and automatic matching to your library
                  </Typography>
                </Box>
              </Box>
            </Box>
          </Box>

          {/* Font Matching Outcomes */}
          <Box sx={{ mb: 2 }}>
            <Typography sx={{ fontSize: 13, fontWeight: 600, color: '#0d0e0f', mb: 1.5 }}>Font Matching:</Typography>

            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <FaCheckCircle size={14} color="#10B981" />
                <Typography sx={{ fontSize: 12, color: '#374151' }}>
                  <strong>Strong/Good Match:</strong> We found a great font in your library
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <FaCheckCircle size={14} color="#F59E0B" />
                <Typography sx={{ fontSize: 12, color: '#374151' }}>
                  <strong>Weak Match:</strong> Best option found, but consider uploading exact font
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <FaCheckCircle size={14} color="#EF4444" />
                <Typography sx={{ fontSize: 12, color: '#374151' }}>
                  <strong>No Match:</strong> We'll suggest uploading the identified font
                </Typography>
              </Box>
            </Box>
          </Box>

          {/* Processing time */}
          <Box
            sx={{
              p: 2,
              background: '#F3F4F6',
              borderRadius: '8px',
              border: '1px solid #E5E7EB',
            }}
          >
            <Typography sx={{ fontSize: 12, color: '#374151', lineHeight: 1.5 }}>
              <strong>Processing time:</strong> ~10-20 seconds per image
              <br />
              <strong>Max upload:</strong> 5 images at once, 10MB each
            </Typography>
          </Box>
        </Box>
      </Popover>
    </>
  );
}
