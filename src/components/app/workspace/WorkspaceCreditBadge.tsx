'use client';

/**
 * Workspace Credit Badge Component
 * Displays user's credit balance in workspace header
 */

import { useAuth } from '@/src/providers/AuthProvider';
import { Tooltip } from '@mui/material';

interface WorkspaceCreditBadgeProps {
  onClick: () => void;
}

export default function WorkspaceCreditBadge({ onClick }: WorkspaceCreditBadgeProps) {
  const { userDetails } = useAuth();

  if (!userDetails) return null;

  // Trial users show trial credits instead
  if (userDetails.trialActive) return null;

  const creditsRemaining = userDetails.creditsRemaining ?? 0;
  const lowCreditWarning = userDetails.lowCreditWarning ?? false;
  const isExhausted = creditsRemaining === 0;

  const tooltipText = isExhausted
    ? "You've used all your credits. Click to upgrade and keep generating content."
    : lowCreditWarning
      ? `Only ${creditsRemaining} credit${creditsRemaining === 1 ? '' : 's'} left — each credit generates one full campaign. Click to top up.`
      : `${creditsRemaining} credit${creditsRemaining === 1 ? '' : 's'} remaining — each credit generates one full set of platform posts. Click to manage billing.`;

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
          border: `1px solid ${
            isExhausted ? 'rgba(220,38,38,.15)' : lowCreditWarning ? 'rgba(245,158,11,.15)' : 'rgba(194,24,91,.12)'
          }`,
          background: isExhausted
            ? 'rgba(220,38,38,.05)'
            : lowCreditWarning
              ? 'rgba(245,158,11,.05)'
              : 'rgba(194,24,91,.04)',
          cursor: 'pointer',
          fontFamily: 'var(--wf)',
          transition: 'all 0.15s',
        }}
        onMouseEnter={(e) =>
          (e.currentTarget.style.background = isExhausted
            ? 'rgba(220,38,38,.08)'
            : lowCreditWarning
              ? 'rgba(245,158,11,.08)'
              : 'rgba(194,24,91,.06)')
        }
        onMouseLeave={(e) =>
          (e.currentTarget.style.background = isExhausted
            ? 'rgba(220,38,38,.05)'
            : lowCreditWarning
              ? 'rgba(245,158,11,.05)'
              : 'rgba(194,24,91,.04)')
        }
      >
        <span
          style={{
            fontSize: 15,
            fontWeight: 800,
            color: isExhausted ? '#DC2626' : lowCreditWarning ? '#F59E0B' : '#C2185B',
          }}
        >
          {creditsRemaining}
        </span>
        <span
          style={{
            fontSize: 11,
            fontWeight: 500,
            color: isExhausted ? '#DC2626' : lowCreditWarning ? '#F59E0B' : '#C2185B',
          }}
        >
          {creditsRemaining === 1 ? 'credit' : 'credits'}
        </span>
      </button>
    </Tooltip>
  );
}
