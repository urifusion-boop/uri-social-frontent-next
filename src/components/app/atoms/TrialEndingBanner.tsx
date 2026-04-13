'use client';

import { Box, Button, Typography } from '@mui/material';
import { useRouter } from 'next/navigation';
import { MdAccessAlarm } from 'react-icons/md';

/**
 * TrialEndingBanner — Full-width dismissible banner
 * Shown when trial has ≤ 24 hours remaining
 * Matches brand gradient and design language
 */
interface TrialEndingBannerProps {
  hoursRemaining: number;
  creditsRemaining: number;
  onDismiss: () => void;
}

const TrialEndingBanner = ({ hoursRemaining, creditsRemaining, onDismiss }: TrialEndingBannerProps) => {
  const router = useRouter();

  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 2,
        px: 3,
        py: 1.5,
        background: 'linear-gradient(135deg, rgba(205,27,120,.06) 0%, rgba(160,21,96,.06) 100%)',
        borderBottom: '1px solid rgba(205,27,120,.12)',
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
        <MdAccessAlarm size={20} color="#CD1B78" />
        <Typography fontSize="13px" fontWeight={600} color="#111827">
          Your free trial ends in{' '}
          <Typography component="span" fontSize="13px" fontWeight={800} color="#CD1B78">
            {hoursRemaining} hour{hoursRemaining !== 1 ? 's' : ''}
          </Typography>
          {' · '}
          {creditsRemaining} credit{creditsRemaining !== 1 ? 's' : ''} left
        </Typography>
      </Box>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <Button
          size="small"
          onClick={() => router.push('/pricing')}
          sx={{
            textTransform: 'none',
            fontSize: '12px',
            fontWeight: 700,
            px: 2,
            py: 0.5,
            borderRadius: '6px',
            color: '#fff',
            background: 'linear-gradient(135deg, #CD1B78 0%, #A01560 100%)',
            '&:hover': { background: 'linear-gradient(135deg, #A01560 0%, #CD1B78 100%)' },
          }}
        >
          Upgrade Now
        </Button>
        <Button
          size="small"
          onClick={onDismiss}
          sx={{
            textTransform: 'none',
            fontSize: '12px',
            fontWeight: 500,
            px: 1,
            py: 0.5,
            minWidth: 'auto',
            color: '#6B7280',
          }}
        >
          Dismiss
        </Button>
      </Box>
    </Box>
  );
};

export default TrialEndingBanner;
