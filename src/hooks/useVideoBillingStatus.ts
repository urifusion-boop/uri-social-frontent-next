'use client';

import { useEffect, useState } from 'react';
import { BillingService } from '@/src/api/BillingService';
import { EventBus, EVENTS } from '@/src/services/EventBus';

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
 *
 * Re-fetches on CREDIT_UPDATED (emitted by AuthProvider whenever anything —
 * content generation, another video job, this one — consumes or refunds
 * credits) so this preview doesn't go stale mid-session the way it used to:
 * previously this only ever fetched once on mount, so a video charge here
 * or a content-generation charge elsewhere never showed up until reload.
 */
export function useVideoBillingStatus(): VideoBillingStatus {
  const [status, setStatus] = useState<VideoBillingStatus>({
    isTrial: false,
    creditsRemaining: null,
    loaded: false,
  });

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
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
    };

    load();
    const unsubscribe = EventBus.on(EVENTS.CREDIT_UPDATED, load);

    return () => {
      cancelled = true;
      unsubscribe();
    };
  }, []);

  return status;
}
