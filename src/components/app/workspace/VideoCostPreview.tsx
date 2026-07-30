'use client';

import { VideoCostEstimate, formatDuration } from '@/src/utils/videoBilling';

interface VideoCostPreviewProps {
  estimate: VideoCostEstimate;
  creditsRemaining: number | null;
  isTrial: boolean;
}

/**
 * Video Editing Billing PRD §6/§9 — cost preview shown before the user
 * confirms an edit. Mirrors the PRD's own example copy:
 *   "Your video is 2 minutes and 14 seconds long. Billable duration: 3
 *    minutes. Editing cost: 12 credits."
 * and the trial/insufficient-credit variants.
 */
export default function VideoCostPreview({ estimate, creditsRemaining, isTrial }: VideoCostPreviewProps) {
  const { durationSeconds, billableMinutes, creditsRequired, ratePerMinute } = estimate;
  const insufficient = !isTrial && creditsRemaining !== null && creditsRemaining < creditsRequired;

  return (
    <div
      style={{
        marginTop: 12,
        marginBottom: 4,
        padding: '12px 14px',
        borderRadius: 10,
        border: insufficient ? '1.5px solid #FDBA74' : '1px solid #E5E7EB',
        background: insufficient ? '#FFF7ED' : '#FAFAF9',
        fontSize: 12.5,
        color: '#4B5563',
        lineHeight: 1.7,
      }}
    >
      <div>
        Your video is {formatDuration(durationSeconds)} long. Billable duration: {billableMinutes} minute
        {billableMinutes === 1 ? '' : 's'} ({ratePerMinute} credits/min).
      </div>

      {isTrial ? (
        <div style={{ marginTop: 4 }}>
          <span style={{ color: '#9CA3AF' }}>Standard cost: {creditsRequired} credits.</span>{' '}
          <strong style={{ color: '#16A34A' }}>Your cost today: 0 credits</strong> — covered by your video editing free
          trial.
        </div>
      ) : (
        <div style={{ marginTop: 4, fontWeight: 600, color: insufficient ? '#C2410C' : '#111827' }}>
          Editing cost: {creditsRequired} credits
          {creditsRemaining !== null && <> · Available balance: {creditsRemaining} credits</>}
        </div>
      )}

      {insufficient && (
        <div style={{ marginTop: 6, color: '#C2410C' }}>
          This video requires {creditsRequired} credits, but you currently have {creditsRemaining} credits.{' '}
          <a href="/billing" style={{ color: '#C2410C', fontWeight: 600 }}>
            Purchase more credits
          </a>{' '}
          to continue.
        </div>
      )}
    </div>
  );
}
