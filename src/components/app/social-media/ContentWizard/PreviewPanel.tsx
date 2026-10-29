'use client';

import { useEffect, useState } from 'react';
import { Box, Typography } from '@mui/material';
import { FaFacebook, FaInstagram, FaLinkedin, FaTiktok, FaTwitter } from 'react-icons/fa';
import { BrandProfileService } from '@/src/api/BrandProfileService';
import { ContentWizardState } from './useContentWizardState';

const PLATFORM_BADGE: Record<string, { icon: React.ReactNode; color: string }> = {
  facebook: { icon: <FaFacebook size={11} color="#fff" />, color: '#1877F2' },
  instagram: { icon: <FaInstagram size={11} color="#fff" />, color: '#E1306C' },
  twitter: { icon: <FaTwitter size={11} color="#fff" />, color: '#1DA1F2' },
  linkedin: { icon: <FaLinkedin size={11} color="#fff" />, color: '#0A66C2' },
  tiktok: { icon: <FaTiktok size={11} color="#fff" />, color: '#010101' },
};

// A single, honest-effort live preview — not a pixel-exact per-platform
// mockup (none exists anywhere in this codebase today). Shows the real
// brand name/logo, the brief as typed, and the first reference image, with
// a small badge for whichever platform is selected first.
export default function PreviewPanel({ wizard }: { wizard: ContentWizardState }) {
  const [brand, setBrand] = useState<{ name: string; logoUrl?: string }>({ name: 'Your Brand' });

  useEffect(() => {
    BrandProfileService.get()
      .then((res) => {
        const data = res.responseData;
        if (data) setBrand({ name: data.brand_name || 'Your Brand', logoUrl: data.logo_url });
      })
      .catch(() => {});
  }, []);

  const primaryPlatform = wizard.selectedPlatforms[0];
  const badge = primaryPlatform ? PLATFORM_BADGE[primaryPlatform] : null;
  const previewImage =
    wizard.referenceImages.find((img) => img.included)?.dataUrl ?? wizard.referenceImages[0]?.dataUrl;

  return (
    <Box>
      <Typography fontSize="12.5px" fontWeight={700} color="#111827" mb={1}>
        Preview
      </Typography>
      <Box
        sx={{
          border: '1px solid #E5E7EB',
          borderRadius: '16px',
          overflow: 'hidden',
          background: '#fff',
          boxShadow: '0 1px 3px rgba(20,16,14,.08)',
        }}
      >
        <Box display="flex" alignItems="center" gap={1} sx={{ p: 1.5 }}>
          <Box sx={{ position: 'relative', flexShrink: 0 }}>
            <Box
              sx={{
                width: 32,
                height: 32,
                borderRadius: '50%',
                background: brand.logoUrl ? `url(${brand.logoUrl}) center/cover` : '#F3F4F6',
                border: '1px solid #E5E7EB',
              }}
            />
            {badge && (
              <Box
                sx={{
                  position: 'absolute',
                  bottom: -2,
                  right: -2,
                  width: 15,
                  height: 15,
                  borderRadius: '50%',
                  background: badge.color,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  border: '1.5px solid #fff',
                }}
              >
                {badge.icon}
              </Box>
            )}
          </Box>
          <Typography fontSize="13px" fontWeight={700} color="#111827">
            {brand.name}
          </Typography>
        </Box>

        <Box
          sx={{
            width: '100%',
            aspectRatio: wizard.postType === 'story' ? '9 / 16' : '1 / 1',
            background: previewImage ? `url(${previewImage}) center/cover` : '#F3F4F6',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {!previewImage && (
            <Typography fontSize="12px" color="#9CA3AF">
              {wizard.includeImages ? 'AI image will appear here' : 'No image for this post'}
            </Typography>
          )}
        </Box>

        <Box sx={{ p: 1.5 }}>
          <Typography
            fontSize="12.5px"
            color="#374151"
            sx={{
              display: '-webkit-box',
              WebkitLineClamp: 4,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
              whiteSpace: 'pre-wrap',
            }}
          >
            {wizard.seedContent.trim() || 'Your brief will appear here as you type…'}
          </Typography>
        </Box>
      </Box>

      {wizard.selectedPlatforms.length > 1 && (
        <Typography fontSize="11px" color="#9CA3AF" mt={1}>
          Also posting to: {wizard.selectedPlatforms.slice(1).join(', ')}
        </Typography>
      )}
    </Box>
  );
}
