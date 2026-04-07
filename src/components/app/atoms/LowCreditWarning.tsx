'use client';

import { Box, Button, Dialog, DialogActions, DialogContent, Typography } from '@mui/material';
import { useRouter } from 'next/navigation';
import { MdInfo } from 'react-icons/md';

/**
 * LowCreditWarning - PRD Section 7.3: Low Credit Warning
 * Shows when user has 5 or fewer credits remaining
 */
interface LowCreditWarningProps {
  open: boolean;
  onClose: () => void;
  creditsRemaining: number;
}

const LowCreditWarning = ({ open, onClose, creditsRemaining }: LowCreditWarningProps) => {
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
            background: '#FFFBEB',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 20px',
          }}
        >
          <MdInfo size={32} color="#F59E0B" />
        </Box>
        <Typography fontSize="20px" fontWeight={700} color="#111827" mb={1}>
          Running low on credits
        </Typography>
        <Typography fontSize="14px" color="#6B7280" lineHeight={1.7} mb={2}>
          You have <strong>{creditsRemaining}</strong> campaign{creditsRemaining === 1 ? '' : 's'} left this month.
          Consider upgrading to avoid interruptions.
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
          Continue
        </Button>
        <Button
          onClick={handleUpgrade}
          variant="contained"
          sx={{
            textTransform: 'none',
            px: 3,
            background: 'linear-gradient(135deg, #F59E0B 0%, #D97706 100%)',
            '&:hover': { background: 'linear-gradient(135deg, #D97706 0%, #F59E0B 100%)' },
          }}
        >
          View Plans
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default LowCreditWarning;
