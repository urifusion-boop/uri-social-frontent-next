'use client';

import { Dialog, DialogTitle, DialogContent, DialogActions, Button, Typography, Box } from '@mui/material';
import { MdEmail, MdWarning } from 'react-icons/md';
import { useRouter } from 'next/navigation';

interface VerifyEmailModalProps {
  open: boolean;
  onClose: () => void;
}

export default function VerifyEmailModal({ open, onClose }: VerifyEmailModalProps) {
  const router = useRouter();

  const handleVerify = () => {
    onClose();
    router.push('/verify-email');
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: '16px',
          p: 2,
        },
      }}
    >
      <DialogTitle sx={{ textAlign: 'center', pt: 3, pb: 2 }}>
        <Box display="flex" flexDirection="column" alignItems="center" gap={2}>
          <Box
            sx={{
              backgroundColor: '#FEF2F2',
              p: 2,
              borderRadius: '50%',
              display: 'inline-flex',
            }}
          >
            <MdWarning size={48} color="#EF4444" />
          </Box>
          <Typography variant="h5" fontWeight={700} color="#111827">
            Email Verification Required
          </Typography>
        </Box>
      </DialogTitle>

      <DialogContent>
        <Typography textAlign="center" color="#6B7280" fontSize="15px" mb={2}>
          To use this feature, please verify your email address first. This helps us keep your account secure.
        </Typography>

        <Box
          sx={{
            backgroundColor: '#F9FAFB',
            borderRadius: '12px',
            p: 2.5,
            border: '1px solid #E5E7EB',
          }}
        >
          <Box display="flex" alignItems="center" gap={1.5} mb={1.5}>
            <MdEmail size={20} color="#CD1B78" />
            <Typography fontSize="14px" fontWeight={600} color="#111827">
              Why verify your email?
            </Typography>
          </Box>
          <ul style={{ margin: 0, paddingLeft: '20px', color: '#6B7280', fontSize: '13px' }}>
            <li style={{ marginBottom: '8px' }}>Secure your account and prevent unauthorized access</li>
            <li style={{ marginBottom: '8px' }}>Receive important notifications about your posts</li>
            <li style={{ marginBottom: '8px' }}>Get updates on your scheduled content</li>
          </ul>
        </Box>
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 3, pt: 2, gap: 2 }}>
        <Button
          onClick={onClose}
          variant="outlined"
          fullWidth
          sx={{
            textTransform: 'none',
            fontWeight: 600,
            fontSize: '15px',
            color: '#6B7280',
            borderColor: '#E5E7EB',
            '&:hover': {
              borderColor: '#D1D5DB',
              backgroundColor: '#F9FAFB',
            },
          }}
        >
          Maybe Later
        </Button>
        <Button
          onClick={handleVerify}
          variant="contained"
          fullWidth
          sx={{
            textTransform: 'none',
            fontWeight: 600,
            fontSize: '15px',
            background: 'linear-gradient(135deg, #CD1B78 0%, #A01560 100%)',
            '&:hover': {
              background: 'linear-gradient(135deg, #A01560 0%, #7D1049 100%)',
            },
          }}
        >
          Verify Email Now
        </Button>
      </DialogActions>
    </Dialog>
  );
}
