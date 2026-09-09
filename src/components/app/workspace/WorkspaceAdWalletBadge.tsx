'use client';

/**
 * Workspace Ad Wallet Badge
 *
 * The prepaid ad-wallet balance in the workspace header, sitting beside the credit
 * badge and styled to match it. Credits and this are different currencies for
 * different things — credits generate content, this funds real ad spend — and the
 * balance was previously only visible by opening Campaigns → Wallet. Since campaigns
 * are now debited in full the moment they launch, the number moves during normal use
 * and belongs where it can be seen.
 */

import { useEffect, useState, useCallback } from 'react';
import { Tooltip } from '@mui/material';
import { CampaignService } from '@/src/api/CampaignService';

interface WorkspaceAdWalletBadgeProps {
  onClick: () => void;
}

const naira = (n: number) => `₦${Math.round(n).toLocaleString()}`;

export default function WorkspaceAdWalletBadge({ onClick }: WorkspaceAdWalletBadgeProps) {
  const [balance, setBalance] = useState<number | null>(null);

  const load = useCallback(async () => {
    try {
      const w = await CampaignService.getWallet();
      setBalance(w.balance_ngn ?? 0);
    } catch {
      // Never let a wallet read break the header — the badge just stays hidden.
      setBalance(null);
    }
  }, []);

  useEffect(() => {
    load();
    // A launch debits the wallet, and launches happen on another page (Campaigns).
    // Listening for the event keeps this in step without polling the API.
    const onChanged = () => load();
    window.addEventListener('ad-wallet-changed', onChanged);
    return () => window.removeEventListener('ad-wallet-changed', onChanged);
  }, [load]);

  // Hidden until we actually know the balance: a wallet that has never been topped up
  // reads ₦0, which is real information, but a failed/pending read is not.
  if (balance === null) return null;

  const isEmpty = balance <= 0;
  const isLow = !isEmpty && balance < 5_000; // below Squad's minimum top-up

  const colour = isEmpty ? '#DC2626' : isLow ? '#F59E0B' : '#C2185B';
  const tint = (a: number) =>
    isEmpty ? `rgba(220,38,38,${a})` : isLow ? `rgba(245,158,11,${a})` : `rgba(194,24,91,${a})`;

  const tooltipText = isEmpty
    ? 'Your ad wallet is empty — top up before launching a campaign.'
    : isLow
      ? `${naira(balance)} in your ad wallet — that's below the ₦5,000 minimum top-up. Click to add more.`
      : `${naira(balance)} in your ad wallet. Campaigns are paid for from this balance when you launch them.`;

  return (
    <Tooltip title={tooltipText} arrow placement="bottom" enterTouchDelay={0} leaveTouchDelay={3000}>
      <button
        onClick={onClick}
        type="button"
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 6,
          padding: '7px 11px',
          borderRadius: 7,
          border: `1px solid ${tint(0.15)}`,
          background: tint(0.04),
          cursor: 'pointer',
          fontFamily: 'var(--wf)',
          transition: 'all 0.15s',
        }}
        onMouseEnter={(e) => (e.currentTarget.style.background = tint(0.08))}
        onMouseLeave={(e) => (e.currentTarget.style.background = tint(0.04))}
      >
        <span style={{ fontSize: 15, fontWeight: 800, color: colour }}>{naira(balance)}</span>
        <span style={{ fontSize: 11, fontWeight: 500, color: colour }}>ad wallet</span>
      </button>
    </Tooltip>
  );
}
