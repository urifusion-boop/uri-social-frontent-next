'use client';

import { useEffect, useState } from 'react';
import { Box, Typography } from '@mui/material';
import { FaFacebook, FaInstagram, FaLinkedin, FaTiktok, FaTwitter } from 'react-icons/fa';
import { BrandProfileService } from '@/src/api/BrandProfileService';
import { ContentWizardState } from './useContentWizardState';

const PLATFORM_BADGE: Record<string, { icon: React.ReactNode; color: string }> = {
  facebook: { icon: <FaFacebook size={15} color="#fff" />, color: '#1877F2' },
  instagram: {
    icon: <FaInstagram size={15} color="#fff" />,
    color: 'radial-gradient(circle at 30% 107%, #fdf497 0%, #fdf497 5%, #fd5949 45%, #d6249f 60%, #285AEB 90%)',
  },
  twitter: { icon: <FaTwitter size={15} color="#fff" />, color: '#1DA1F2' },
  linkedin: { icon: <FaLinkedin size={15} color="#fff" />, color: '#0A66C2' },
  tiktok: { icon: <FaTiktok size={15} color="#fff" />, color: '#010101' },
};

function Icon({ d }: { d: string }) {
  return (
    <Box component="svg" viewBox="0 0 24 24" sx={{ width: 18, height: 18 }}>
      <path d={d} fill="none" stroke="#374151" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </Box>
  );
}

const HEART =
  'M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.6l-1-1a5.5 5.5 0 0 0-7.8 7.8l1 1L12 21l7.8-7.6 1-1a5.5 5.5 0 0 0 0-7.8z';
const COMMENT = 'M21 11.5a8.4 8.4 0 0 1-8.9 8.4 9 9 0 0 1-3.6-.7L3 21l1.8-5.5A8.4 8.4 0 1 1 21 11.5Z';
const SHARE = 'M22 2 11 13M22 2l-7 20-4-9-9-4 20-7Z';
const BOOKMARK = 'M19 21 12 16l-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16Z';

// A single, honest-effort live preview — not a pixel-exact per-platform
// mockup (none exists anywhere in this codebase today). Shows the real
// brand name/logo, the brief as typed, and the first reference image, with
// a small badge for whichever platform is selected first. The like/comment/
// share/save icon row below is static platform-chrome, not fabricated data.
export default function PreviewPanel({ wizard }: { wizard: ContentWizardState }) {
  const [brand, setBrand] = useState<{ name: string; logoUrl?: string }>({ name: 'yourbrand' });

  useEffect(() => {
    BrandProfileService.get()
      .then((res) => {
        const data = res.responseData;
        if (data) setBrand({ name: data.brand_name || 'yourbrand', logoUrl: data.logo_url });
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
        <Box display="flex" alignItems="center" gap={1} sx={{ p: 1.25 }}>
          <Box
            sx={{
              width: 28,
              height: 28,
              borderRadius: '8px',
              background: badge?.color ?? '#9CA3AF',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            {badge?.icon}
          </Box>
          <Typography fontSize="12.5px" fontWeight={700} color="#111827">
            {brand.name}
          </Typography>
          <Box sx={{ ml: 'auto', display: 'flex', gap: '3px' }}>
            {[0, 1, 2].map((i) => (
              <Box key={i} sx={{ width: 3, height: 3, borderRadius: '50%', background: '#9CA3AF' }} />
            ))}
          </Box>
        </Box>

        <Box
          sx={{
            width: '100%',
            maxHeight: 220,
            aspectRatio: wizard.postType === 'story' ? '9 / 16' : '1 / 1',
            background: previewImage ? `url(${previewImage}) center/cover` : '#F3F4F6',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {!previewImage && (
            <Typography fontSize="12px" color="#9CA3AF" textAlign="center" px={2}>
              {wizard.includeImages ? 'AI image will appear here' : 'No image for this post'}
            </Typography>
          )}
        </Box>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25, px: 1.25, pt: 1.25 }}>
          <Icon d={HEART} />
          <Icon d={COMMENT} />
          <Icon d={SHARE} />
          <Box sx={{ ml: 'auto' }}>
            <Icon d={BOOKMARK} />
          </Box>
        </Box>

        <Box sx={{ p: 1.25, pt: 1 }}>
          <Typography
            fontSize="12.5px"
            color="#374151"
            sx={{
              display: '-webkit-box',
              WebkitLineClamp: 3,
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
