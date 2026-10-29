'use client';

import { Box, Typography } from '@mui/material';
import { useRouter } from 'next/navigation';
import { FaFacebook, FaInstagram, FaLinkedin, FaTiktok, FaTwitter } from 'react-icons/fa';
import SlideCountPicker from '../../atoms/SlideCountPicker';
import { ContentWizardState, PLATFORMS } from './useContentWizardState';

const PINK = '#CD1B78';

const PLATFORM_ICONS: Record<string, React.ReactNode> = {
  facebook: <FaFacebook size={20} color="#1877F2" />,
  instagram: <FaInstagram size={20} color="#E1306C" />,
  twitter: <FaTwitter size={20} color="#1DA1F2" />,
  linkedin: <FaLinkedin size={20} color="#0A66C2" />,
  tiktok: <FaTiktok size={20} color="#010101" />,
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

// A single square "radio card" tile — the shape both the platform and format
// pickers use in the approved design (icon, label, small radio dot), instead
// of the old horizontal checkbox-chip row.
function Tile({
  icon,
  label,
  subtitle,
  active,
  disabled,
  onClick,
}: {
  icon: React.ReactNode;
  label: string;
  subtitle?: string;
  active: boolean;
  disabled?: boolean;
  onClick: () => void;
}) {
  return (
    <Box
      onClick={disabled ? undefined : onClick}
      sx={{
        width: 108,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 0.75,
        border: '1.5px solid',
        borderColor: active ? PINK : '#E5E7EB',
        borderRadius: '12px',
        px: 1,
        py: 1.75,
        cursor: disabled ? 'not-allowed' : 'pointer',
        background: disabled ? '#F9FAFB' : active ? '#FDF2F8' : '#fff',
        opacity: disabled ? 0.5 : 1,
        userSelect: 'none',
        transition: 'all 0.15s',
      }}
    >
      <Box sx={{ height: 22, display: 'flex', alignItems: 'center' }}>{icon}</Box>
      <Typography fontSize="12.5px" fontWeight={700} color={active ? PINK : '#111827'} textAlign="center">
        {label}
      </Typography>
      {subtitle && (
        <Typography fontSize="10.5px" color="#9CA3AF" textAlign="center" sx={{ minHeight: 13 }}>
          {subtitle}
        </Typography>
      )}
      <Box
        sx={{
          width: 14,
          height: 14,
          borderRadius: '50%',
          border: '1.5px solid',
          borderColor: active ? PINK : '#D1D5DB',
          background: active ? PINK : 'transparent',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {active && <Box sx={{ width: 5, height: 5, borderRadius: '50%', background: '#fff' }} />}
      </Box>
    </Box>
  );
}

export default function StepPlatformFormat({ wizard }: { wizard: ContentWizardState }) {
  const router = useRouter();

  return (
    <Box>
      <Typography fontSize="14px" color="#374151" mb={1.25} fontWeight={600}>
        Choose Platform(s)
      </Typography>
      <Box display="flex" gap={1.25} flexWrap="wrap" mb={3}>
        {PLATFORMS.map(({ key, label }) => (
          <Tile
            key={key}
            icon={PLATFORM_ICONS[key]}
            label={label}
            active={wizard.selectedPlatforms.includes(key)}
            onClick={() => wizard.togglePlatform(key)}
          />
        ))}
      </Box>

      {wizard.showPostTypeSelector && (
        <>
          <Typography fontSize="14px" color="#374151" mb={1.25} fontWeight={600}>
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
                <Tile
                  key={key}
                  icon={<Typography fontSize="20px">{icon}</Typography>}
                  label={label}
                  subtitle={disabled ? 'Coming soon' : isVideo ? 'Opens Video tab' : subtitle}
                  active={active}
                  disabled={disabled}
                  onClick={() => {
                    if (isVideo) {
                      router.push('/workspace/?tab=video');
                      return;
                    }
                    wizard.setPostType(key);
                  }}
                />
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
