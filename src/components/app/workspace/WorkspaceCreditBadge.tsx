'use client';

/**
 * Workspace Credit Badge Component
 * Displays user's credit balance in workspace header
 */

import { useAuth } from '@/src/providers/AuthProvider';

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

  return (
    <button
      onClick={onClick}
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
      title="View billing details"
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
  );
}
