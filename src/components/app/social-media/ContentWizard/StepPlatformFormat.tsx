'use client';

import { Box, Typography } from '@mui/material';
import { useRouter } from 'next/navigation';
import { FaFacebook, FaInstagram, FaLinkedin, FaTiktok, FaTwitter } from 'react-icons/fa';
import SlideCountPicker from '../../atoms/SlideCountPicker';
import { ContentWizardState, PLATFORMS } from './useContentWizardState';

const PINK = '#CD1B78';

const PLATFORM_BADGE: Record<string, { icon: React.ReactNode; bg: string }> = {
  facebook: { icon: <FaFacebook size={15} color="#fff" />, bg: '#1877F2' },
  instagram: {
    icon: <FaInstagram size={15} color="#fff" />,
    bg: 'linear-gradient(135deg,#F58529,#DD2A7B,#8134AF)',
  },
  twitter: { icon: <FaTwitter size={15} color="#fff" />, bg: '#1DA1F2' },
  linkedin: { icon: <FaLinkedin size={15} color="#fff" />, bg: '#0A66C2' },
  tiktok: { icon: <FaTiktok size={15} color="#fff" />, bg: '#010101' },
};

const FORMAT_TILES: Array<{
  key: 'feed' | 'carousel' | 'story' | 'video';
  label: string;
  icon: string;
  bg: string;
  subtitle: string;
}> = [
  { key: 'feed', label: 'Feed Post', icon: '📄', bg: '#6B7280', subtitle: 'Single image' },
  { key: 'carousel', label: 'Carousel', icon: '🎠', bg: '#F59E0B', subtitle: '2–10 slides' },
  { key: 'story', label: 'Story', icon: '📱', bg: '#9CA3AF', subtitle: 'Vertical (coming soon)' },
  { key: 'video', label: 'Video', icon: '🎬', bg: '#3B82F6', subtitle: 'Short-form' },
];

// A left-aligned tile — icon badge top-left, label/subtitle below, small
// checkbox bottom-left — matching the approved design's card style for both
// the (multi-select) platform picker and the (single-select) format picker.
function Tile({
  icon,
  iconBg,
  label,
  subtitle,
  active,
  disabled,
  onClick,
}: {
  icon: React.ReactNode;
  iconBg: string;
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
        width: '100%',
        display: 'flex',
        flexDirection: 'column',
        gap: 0.5,
        border: '1.5px solid',
        borderColor: active ? PINK : '#E5E7EB',
        borderRadius: '12px',
        p: 1.25,
        cursor: disabled ? 'not-allowed' : 'pointer',
        background: disabled ? '#F9FAFB' : active ? '#FDF2F8' : '#fff',
        opacity: disabled ? 0.5 : 1,
        userSelect: 'none',
        transition: 'all 0.15s',
      }}
    >
      <Box
        sx={{
          width: 30,
          height: 30,
          borderRadius: '9px',
          background: iconBg,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          mb: 0.25,
        }}
      >
        {icon}
      </Box>
      <Typography fontSize="12.5px" fontWeight={700} color="#111827" sx={{ lineHeight: 1.2 }}>
        {label}
      </Typography>
      {subtitle && (
        <Typography fontSize="10px" color="#9CA3AF" sx={{ lineHeight: 1.2 }}>
          {subtitle}
        </Typography>
      )}
      <Box
        sx={{
          width: 14,
          height: 14,
          borderRadius: '4px',
          border: '1.5px solid',
          borderColor: active ? PINK : '#D1D5DB',
          background: active ? PINK : 'transparent',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          mt: 0.25,
        }}
      >
        {active && (
          <Box component="svg" viewBox="0 0 12 12" sx={{ width: 9, height: 9 }}>
            <path
              d="M2 6l2.5 2.5L10 3"
              stroke="#fff"
              strokeWidth="1.6"
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </Box>
        )}
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
      <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(92px, 1fr))', gap: 1.25, mb: 3 }}>
        {PLATFORMS.map(({ key, label }) => (
          <Tile
            key={key}
            icon={PLATFORM_BADGE[key].icon}
            iconBg={PLATFORM_BADGE[key].bg}
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
          <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(92px, 1fr))', gap: 1.25, mb: 1.5 }}>
            {FORMAT_TILES.map(({ key, label, icon, bg, subtitle }) => {
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
                  icon={<Typography fontSize="15px">{icon}</Typography>}
                  iconBg={bg}
                  label={label}
                  subtitle={isVideo ? 'Opens Video tab' : subtitle}
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
