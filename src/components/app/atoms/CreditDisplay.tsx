'use client';

import { Box, Chip, CircularProgress, Tooltip, Typography } from '@mui/material';
import { useEffect, useState } from 'react';
import { MdInfo, MdWarning } from 'react-icons/md';
import { BillingService } from '@/src/api/BillingService';
import { useRouter } from 'next/navigation';

/**
 * CreditDisplay - Shows user's remaining credits in the header
 * PRD Section 5.1: Display credits_remaining prominently
 * PRD Section 7.3: Low credit warning at 3 credits
 */
const CreditDisplay = () => {
  const [creditsRemaining, setCreditsRemaining] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [tier, setTier] = useState<string>('');
  const router = useRouter();

  const fetchCredits = async () => {
    try {
      const balance = await BillingService.getCreditBalance();
      setCreditsRemaining(balance.credits_remaining);
      setTier(balance.subscription_tier || '');
    } catch (error) {
      console.error('Failed to fetch credits:', error);
      // Legacy users or error - don't show widget
      setCreditsRemaining(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCredits();
    // Refresh credits every 30 seconds
    const interval = setInterval(fetchCredits, 30000);
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <Box display="flex" alignItems="center" gap={1} px={1.5} py={0.75}>
        <CircularProgress size={16} sx={{ color: '#CD1B78' }} />
      </Box>
    );
  }

  // Legacy users (no wallet) get unlimited access
  if (creditsRemaining === null) {
    return null;
  }

  // PRD 7.3: Low credit warning when credits <= 3
  const isLow = creditsRemaining <= 3 && creditsRemaining > 0;
  const isEmpty = creditsRemaining === 0;

  return (
    <Tooltip
      title={
        isEmpty
          ? 'Out of credits. Upgrade to continue generating content.'
          : isLow
            ? `Low credits! You have ${creditsRemaining} campaign${creditsRemaining === 1 ? '' : 's'} left.`
            : `${tier} plan: ${creditsRemaining} campaign${creditsRemaining === 1 ? '' : 's'} remaining this month.`
      }
      arrow
    >
      <Box
        onClick={() => router.push('/pricing')}
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 1,
          px: 1.5,
          py: 0.75,
          borderRadius: '8px',
          border: '1px solid',
          borderColor: isEmpty ? '#FCA5A5' : isLow ? '#FCD34D' : '#E5E7EB',
          background: isEmpty ? '#FEF2F2' : isLow ? '#FFFBEB' : '#F9FAFB',
          cursor: 'pointer',
          transition: 'all 0.15s',
          '&:hover': {
            borderColor: '#CD1B78',
            background: '#FDF2F8',
          },
        }}
      >
        {isEmpty ? (
          <MdWarning size={18} color="#DC2626" />
        ) : isLow ? (
          <MdWarning size={18} color="#F59E0B" />
        ) : (
          <MdInfo size={16} color="#CD1B78" />
        )}
        <Typography fontSize="13px" fontWeight={600} color={isEmpty ? '#DC2626' : isLow ? '#D97706' : '#374151'}>
          {creditsRemaining} {creditsRemaining === 1 ? 'Credit' : 'Credits'}
        </Typography>
        {tier && (
          <Chip
            label={tier}
            size="small"
            sx={{
              height: 20,
              fontSize: '10px',
              fontWeight: 700,
              background: '#CD1B78',
              color: '#fff',
            }}
          />
        )}
      </Box>
    </Tooltip>
  );
};

export default CreditDisplay;
