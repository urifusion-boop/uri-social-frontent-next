'use client';

import { Box, Button, Dialog, DialogActions, DialogContent, Typography } from '@mui/material';
import { useRouter } from 'next/navigation';
import { MdWarning } from 'react-icons/md';

/**
 * OutOfCreditsModal - PRD Section 8: Credit Exhaustion
 * Shows when user attempts to generate content with 0 credits
 */
interface OutOfCreditsModalProps {
  open: boolean;
  onClose: () => void;
}

const OutOfCreditsModal = ({ open, onClose }: OutOfCreditsModalProps) => {
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
            background: '#FEF2F2',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 20px',
          }}
        >
          <MdWarning size={32} color="#DC2626" />
        </Box>
        <Typography fontSize="20px" fontWeight={700} color="#111827" mb={1}>
          You're out of credits
        </Typography>
        <Typography fontSize="14px" color="#6B7280" lineHeight={1.7}>
          You've used all your monthly campaigns. Upgrade your plan to continue generating content with URI Agent.
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
          Cancel
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

export default OutOfCreditsModal;
