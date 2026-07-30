'use client';

import { useEffect, useState } from 'react';
import { BillingService } from '@/src/api/BillingService';

export interface VideoBillingStatus {
  isTrial: boolean;
  creditsRemaining: number | null;
  loaded: boolean;
}

/**
 * Video Editing Billing PRD §6 — resolves whether the user is on an active
 * free trial (billed from the trial pool) or a paid wallet (billed from
 * credits_remaining), for the client-side cost preview. The backend is the
 * source of truth and re-checks this at submit time regardless.
 */
export function useVideoBillingStatus(): VideoBillingStatus {
  const [status, setStatus] = useState<VideoBillingStatus>({
    isTrial: false,
    creditsRemaining: null,
    loaded: false,
  });

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const trial = await BillingService.getTrialStatus();
        if (cancelled) return;
        if (trial.trial_active) {
          setStatus({ isTrial: true, creditsRemaining: trial.credits_remaining ?? 0, loaded: true });
          return;
        }
        const balance = await BillingService.getCreditBalance();
        if (cancelled) return;
        setStatus({ isTrial: false, creditsRemaining: balance.credits_remaining, loaded: true });
      } catch {
        if (!cancelled) setStatus((prev) => ({ ...prev, loaded: true }));
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return status;
}
