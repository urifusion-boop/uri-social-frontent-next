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
      maxWidth="xs"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: '12px',
          p: 1.5,
        },
      }}
    >
      <DialogTitle sx={{ textAlign: 'center', pt: 2, pb: 1 }}>
        <Box display="flex" flexDirection="column" alignItems="center" gap={1.2}>
          <Box
            sx={{
              backgroundColor: '#FEF2F2',
              p: 1.5,
              borderRadius: '50%',
              display: 'inline-flex',
            }}
          >
            <MdWarning size={36} color="#EF4444" />
          </Box>
          <Typography variant="h6" fontWeight={700} color="#111827" fontSize="18px">
            Email Verification Required
          </Typography>
        </Box>
      </DialogTitle>

      <DialogContent sx={{ pt: 1 }}>
        <Typography textAlign="center" color="#6B7280" fontSize="13px" mb={1.5} lineHeight={1.4}>
          To use this feature, please verify your email address first. This helps us keep your account secure.
        </Typography>

        <Box
          sx={{
            backgroundColor: '#F9FAFB',
            borderRadius: '8px',
            p: 1.8,
            border: '1px solid #E5E7EB',
          }}
        >
          <Box display="flex" alignItems="center" gap={1.2} mb={1}>
            <MdEmail size={18} color="#CD1B78" />
            <Typography fontSize="13px" fontWeight={600} color="#111827">
              Why verify your email?
            </Typography>
          </Box>
          <ul style={{ margin: 0, paddingLeft: '18px', color: '#6B7280', fontSize: '12px', lineHeight: '1.5' }}>
            <li style={{ marginBottom: '5px' }}>Secure your account and prevent unauthorized access</li>
            <li style={{ marginBottom: '5px' }}>Receive important notifications about your posts</li>
            <li style={{ marginBottom: '0' }}>Get updates on your scheduled content</li>
          </ul>
        </Box>
      </DialogContent>

      <DialogActions sx={{ px: 2.5, pb: 2.5, pt: 1.5, gap: 1.5 }}>
        <Button
          onClick={onClose}
          variant="outlined"
          fullWidth
          sx={{
            textTransform: 'none',
            fontWeight: 600,
            fontSize: '14px',
            py: 0.9,
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
            fontSize: '14px',
            py: 0.9,
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
