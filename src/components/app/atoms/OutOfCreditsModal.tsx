'use client';

import { useState } from 'react';
import { Box, Button, Dialog, DialogActions, DialogContent, TextField, Typography } from '@mui/material';
import { useRouter } from 'next/navigation';
import { MdWarning } from 'react-icons/md';
import { BillingService } from '@/src/api/BillingService';

/**
 * OutOfCreditsModal - PRD Section 8: Credit Exhaustion
 * Shows when user attempts to generate content with 0 credits
 */
interface OutOfCreditsModalProps {
  open: boolean;
  onClose: () => void;
  /** Called after a code is redeemed successfully, so the caller can refresh balance/state. */
  onRedeemed?: () => void | Promise<void>;
}

const OutOfCreditsModal = ({ open, onClose, onRedeemed }: OutOfCreditsModalProps) => {
  const router = useRouter();
  const [showRedeem, setShowRedeem] = useState(false);
  const [code, setCode] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);

  const handleUpgrade = () => {
    onClose();
    router.push('/pricing/');
  };

  const handleClose = () => {
    setShowRedeem(false);
    setCode('');
    setMessage(null);
    onClose();
  };

  const handleRedeem = async () => {
    if (!code.trim()) return;
    setSubmitting(true);
    setMessage(null);
    try {
      const result = await BillingService.redeemAccessCode(code.trim());
      const until = new Date(result.access_end).toLocaleDateString();
      setMessage({ type: 'ok', text: `${result.plan_name} unlocked — free until ${until}. You're all set!` });
      setCode('');
      await onRedeemed?.();
    } catch (err: unknown) {
      const detail =
        (err as { data?: { detail?: string } })?.data?.detail ??
        (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail;
      setMessage({ type: 'err', text: detail || 'Could not redeem this code.' });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="xs" fullWidth>
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
          You've used all your monthly campaigns. Upgrade your plan, or enter a partner code, to continue generating
          content with URI Agent.
        </Typography>

        {!showRedeem ? (
          <Button
            onClick={() => setShowRedeem(true)}
            sx={{ textTransform: 'none', color: '#C2185B', fontWeight: 600, fontSize: 12.5, mt: 1.5 }}
          >
            Have a code?
          </Button>
        ) : (
          <Box sx={{ mt: 2, textAlign: 'left' }}>
            <Box sx={{ display: 'flex', gap: 1 }}>
              <TextField
                size="small"
                fullWidth
                placeholder="Enter your code"
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                disabled={submitting}
                onKeyDown={(e) => e.key === 'Enter' && handleRedeem()}
              />
              <Button
                onClick={handleRedeem}
                disabled={submitting || !code.trim()}
                variant="contained"
                sx={{
                  textTransform: 'none',
                  whiteSpace: 'nowrap',
                  background: 'linear-gradient(135deg, #CD1B78 0%, #A01560 100%)',
                  '&:hover': { background: 'linear-gradient(135deg, #A01560 0%, #CD1B78 100%)' },
                }}
              >
                {submitting ? 'Redeeming…' : 'Redeem'}
              </Button>
            </Box>
            {message && (
              <Typography fontSize="12.5px" mt={1} color={message.type === 'ok' ? '#2E7D32' : '#DC2626'}>
                {message.text}
              </Typography>
            )}
          </Box>
        )}
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 3, gap: 1, justifyContent: 'center' }}>
        <Button
          onClick={handleClose}
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
