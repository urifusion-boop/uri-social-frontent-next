'use client';

import { Box, Checkbox, FormControlLabel, FormGroup, Typography } from '@mui/material';
import { useRouter } from 'next/navigation';
import { FaFacebook, FaInstagram, FaLinkedin, FaTiktok, FaTwitter } from 'react-icons/fa';
import SlideCountPicker from '../../atoms/SlideCountPicker';
import { ContentWizardState, PLATFORMS } from './useContentWizardState';

const PINK = '#CD1B78';

const PLATFORM_ICONS: Record<string, React.ReactNode> = {
  facebook: <FaFacebook size={16} color="#1877F2" />,
  instagram: <FaInstagram size={16} color="#E1306C" />,
  twitter: <FaTwitter size={16} color="#1DA1F2" />,
  linkedin: <FaLinkedin size={16} color="#0A66C2" />,
  tiktok: <FaTiktok size={16} color="#010101" />,
};

const FORMAT_TILES: Array<{
  key: 'feed' | 'carousel' | 'story' | 'video';
  label: string;
  icon: string;
  subtitle: string;
}> = [
  { key: 'feed', label: 'Feed Post', icon: '📄', subtitle: 'Single image' },
  { key: 'carousel', label: 'Carousel', icon: '🎠', subtitle: '2–10 slides' },
  { key: 'story', label: 'Story', icon: '📱', subtitle: 'Vertical, 24h' },
  { key: 'video', label: 'Video', icon: '🎬', subtitle: 'Full video studio' },
];

export default function StepPlatformFormat({ wizard }: { wizard: ContentWizardState }) {
  const router = useRouter();

  return (
    <Box>
      <Typography fontSize="14px" color="#374151" mb={1} fontWeight={500}>
        Choose Platform(s)
      </Typography>
      <FormGroup row sx={{ mb: 3, gap: 1, flexWrap: 'wrap' }}>
        {PLATFORMS.map(({ key, label }) => (
          <FormControlLabel
            key={key}
            control={
              <Checkbox
                checked={wizard.selectedPlatforms.includes(key)}
                onChange={() => wizard.togglePlatform(key)}
                size="small"
                sx={{ '&.Mui-checked': { color: PINK } }}
              />
            }
            label={
              <Box display="flex" alignItems="center" gap={0.75}>
                {PLATFORM_ICONS[key]}
                <Typography fontSize="13px" fontWeight={500}>
                  {label}
                </Typography>
              </Box>
            }
            sx={{
              border: '1px solid',
              borderColor: wizard.selectedPlatforms.includes(key) ? PINK : '#E5E7EB',
              borderRadius: '8px',
              px: 1.5,
              py: 0.5,
              mr: 0,
              background: wizard.selectedPlatforms.includes(key) ? '#FDF2F8' : 'transparent',
            }}
          />
        ))}
      </FormGroup>

      {wizard.showPostTypeSelector && (
        <>
          <Typography fontSize="14px" color="#374151" mb={1} fontWeight={500}>
            Choose Format
          </Typography>
          <Box display="flex" gap={1.25} flexWrap="wrap" mb={1.5}>
            {FORMAT_TILES.map(({ key, label, icon, subtitle }) => {
              // "Video" isn't a generation format here — it hands off to the
              // real, full Video tab (storyboard/produce/polish), which
              // already has far more capability than a wizard tile could
              // ever hold. Story stays disabled in this AI-generate flow,
              // matching the existing form (its backend readiness for
              // AI-generated images isn't confirmed).
              const disabled = key === 'story';
              const isVideo = key === 'video';
              const active = !isVideo && wizard.postType === key;
              return (
                <Box
                  key={key}
                  onClick={() => {
                    if (isVideo) {
                      router.push('/workspace/?tab=video');
                      return;
                    }
                    if (!disabled) wizard.setPostType(key);
                  }}
                  sx={{
                    border: '1px solid',
                    borderColor: active ? PINK : '#E5E7EB',
                    borderRadius: '10px',
                    px: 2,
                    py: 1.25,
                    cursor: disabled ? 'not-allowed' : 'pointer',
                    background: disabled ? '#F9FAFB' : active ? '#FDF2F8' : '#fff',
                    minWidth: 110,
                    userSelect: 'none',
                    opacity: disabled ? 0.45 : 1,
                    transition: 'all 0.15s',
                  }}
                >
                  <Typography fontSize="20px" lineHeight={1} mb={0.5}>
                    {icon}
                  </Typography>
                  <Typography fontSize="13px" fontWeight={600} color={active ? PINK : '#111827'}>
                    {label}
                  </Typography>
                  <Typography fontSize="11px" color="#6B7280">
                    {disabled ? 'Coming soon' : isVideo ? 'Opens Video tab' : subtitle}
                  </Typography>
                </Box>
              );
            })}
          </Box>

          {wizard.postType === 'carousel' && (
            <Box mb={1}>
              <SlideCountPicker value={wizard.numSlides} onChange={wizard.setNumSlides} />
            </Box>
          )}
        </>
      )}
    </Box>
  );
}
