'use client';

import { Box, Typography } from '@mui/material';
import { MdAccessTime } from 'react-icons/md';

/**
 * TrialBanner — Compact inline banner for workspace header
 * Shows trial days/credits remaining with brand styling
 */
interface TrialBannerProps {
  daysRemaining: number;
  creditsRemaining: number;
  onClick?: () => void;
  /** Drops the "Free Trial" label, keeping just the icon + counts — for narrow
   * top bars where the full label would overflow or crowd other controls. */
  compact?: boolean;
}

const TrialBanner = ({ daysRemaining, creditsRemaining, onClick, compact = false }: TrialBannerProps) => {
  const isLow = creditsRemaining <= 2 || daysRemaining <= 0;

  return (
    <Box
      onClick={onClick}
      sx={{
        display: 'flex',
        alignItems: 'center',
        gap: 1,
        px: compact ? 1 : 1.5,
        py: 0.75,
        borderRadius: '8px',
        border: `1px solid ${isLow ? 'rgba(245,158,11,.2)' : 'rgba(205,27,120,.15)'}`,
        background: isLow ? 'rgba(245,158,11,.05)' : 'rgba(205,27,120,.04)',
        cursor: onClick ? 'pointer' : 'default',
        transition: 'all 0.15s',
        '&:hover': onClick
          ? {
              background: isLow ? 'rgba(245,158,11,.1)' : 'rgba(205,27,120,.08)',
            }
          : {},
      }}
    >
      <MdAccessTime size={16} color={isLow ? '#F59E0B' : '#CD1B78'} />
      {!compact && (
        <Typography
          fontSize="12px"
          fontWeight={700}
          color={isLow ? '#D97706' : '#CD1B78'}
          sx={{ whiteSpace: 'nowrap' }}
        >
          Free Trial
        </Typography>
      )}
      <Typography fontSize="11px" fontWeight={500} color={isLow ? '#92400E' : '#9B1159'} sx={{ whiteSpace: 'nowrap' }}>
        {daysRemaining}d · {creditsRemaining} credits
      </Typography>
    </Box>
  );
};

export default TrialBanner;
