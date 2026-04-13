'use client';

import { Box, Button, Dialog, DialogActions, DialogContent, Typography } from '@mui/material';
import { useRouter } from 'next/navigation';
import { MdTimerOff } from 'react-icons/md';

/**
 * TrialExpiredModal — Shown when free trial has expired
 * Matches OutOfCreditsModal design language
 */
interface TrialExpiredModalProps {
  open: boolean;
  onClose: () => void;
}

const TrialExpiredModal = ({ open, onClose }: TrialExpiredModalProps) => {
  const router = useRouter();

  const handleUpgrade = () => {
    onClose();
    router.push('/pricing');
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
      <DialogContent sx={{ textAlign: 'center', pt: 4, pb: 3 }}>
        <Box
          sx={{
            width: 64,
            height: 64,
            borderRadius: '50%',
            background: 'rgba(205,27,120,.08)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 20px',
          }}
        >
          <MdTimerOff size={32} color="#CD1B78" />
        </Box>
        <Typography fontSize="20px" fontWeight={700} color="#111827" mb={1}>
          Your free trial has ended
        </Typography>
        <Typography fontSize="14px" color="#6B7280" lineHeight={1.7}>
          Your 3-day trial is over, but don't worry — choose a plan to continue creating amazing content with URI Agent.
        </Typography>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 3, gap: 1, justifyContent: 'center' }}>
        <Button
          onClick={onClose}
          variant="outlined"
          sx={{
            textTransform: 'none',
            px: 3,
            borderColor: '#E5E7EB',
            color: '#374151',
          }}
        >
          Maybe Later
        </Button>
        <Button
          onClick={handleUpgrade}
          variant="contained"
          sx={{
            textTransform: 'none',
            px: 3,
            background: 'linear-gradient(135deg, #CD1B78 0%, #A01560 100%)',
            '&:hover': { background: 'linear-gradient(135deg, #A01560 0%, #CD1B78 100%)' },
          }}
        >
          View Plans
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default TrialExpiredModal;
