'use client';

import { Box, Button, Dialog, DialogActions, DialogContent, Typography } from '@mui/material';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { MdTimerOff } from 'react-icons/md';

/**
 * Shown when the user has no active plan. It used to always say "Your 7-day
 * trial is over" — wrong for anyone whose trial ended long ago or whose plan
 * (e.g. an access-code plan, which ends when its credits run out) has ended,
 * and the trial isn't 7 days anyway. It now says what is actually true.
 * Matches OutOfCreditsModal design language.
 */
interface TrialExpiredModalProps {
  open: boolean;
  onClose: () => void;
  /** credits_out: had a plan / bought credits and used them all. no_plan: never paid, trial over. */
  reason?: 'credits_out' | 'no_plan';
  trialEndDate?: string | null;
}

const RECENT_TRIAL_DAYS = 14;

const TrialExpiredModal = ({ open, onClose, reason = 'no_plan', trialEndDate }: TrialExpiredModalProps) => {
  const router = useRouter();
  const [now] = useState(() => Date.now());
  const ended = trialEndDate ? new Date(trialEndDate.endsWith('Z') ? trialEndDate : `${trialEndDate}Z`) : null;
  const endedLabel =
    ended && !Number.isNaN(ended.getTime()) && now - ended.getTime() < RECENT_TRIAL_DAYS * 86400000
      ? ended.toLocaleDateString(undefined, { day: 'numeric', month: 'long' })
      : null;
  const creditsOut = reason === 'credits_out';
  const title = creditsOut
    ? "You've used all your credits"
    : endedLabel
      ? 'Your free trial has ended'
      : "You don't have an active plan";
  const body = creditsOut
    ? 'Top up or choose a plan to keep creating posts, ads and replies with URI Agent.'
    : endedLabel
      ? `Your free trial ended on ${endedLabel}. Choose a plan to keep creating with URI Agent.`
      : 'Choose a plan to keep creating posts, ads and replies with URI Agent.';

  const handleUpgrade = () => {
    onClose();
    router.push('/pricing/');
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
          {title}
        </Typography>
        <Typography fontSize="14px" color="#6B7280" lineHeight={1.7}>
          {body}
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
          {creditsOut ? 'Get more credits' : 'View Plans'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default TrialExpiredModal;
