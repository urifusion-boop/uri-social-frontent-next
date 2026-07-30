'use client';

import { useEffect, useState } from 'react';
import { BillingService } from '@/src/api/BillingService';
import { SocialMediaAgentService } from '@/src/api/SocialMediaAgentService';
import { EventBus, EVENTS } from '@/src/services/EventBus';
import { DEFAULT_VIDEO_EDIT_CREDITS_PER_MINUTE } from '@/src/utils/videoBilling';

export interface VideoBillingStatus {
  isTrial: boolean;
  creditsRemaining: number | null;
  /** Live, admin-configurable rate (PRD §12 NFR) — DEFAULT_VIDEO_EDIT_CREDITS_PER_MINUTE
   * only until the real value loads, so the preview isn't blank meanwhile. */
  ratePerMinute: number;
  loaded: boolean;
}

/**
 * Video Editing Billing PRD §6 — resolves whether the user is on an active
 * free trial (billed from the trial pool) or a paid wallet (billed from
 * credits_remaining), for the client-side cost preview. The backend is the
 * source of truth and re-checks this at submit time regardless.
 *
 * Re-fetches trial/balance on CREDIT_UPDATED (emitted by AuthProvider
 * whenever anything — content generation, another video job, this one —
 * consumes or refunds credits) so this preview doesn't go stale mid-session
 * the way it used to: previously this only ever fetched once on mount, so a
 * video charge here or a content-generation charge elsewhere never showed
 * up until reload. The rate is fetched once on mount — it changes far less
 * often, so it's not tied to the credit-event refresh cycle.
 */
export function useVideoBillingStatus(): VideoBillingStatus {
  const [status, setStatus] = useState<VideoBillingStatus>({
    isTrial: false,
    creditsRemaining: null,
    ratePerMinute: DEFAULT_VIDEO_EDIT_CREDITS_PER_MINUTE,
    loaded: false,
  });

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      try {
        const trial = await BillingService.getTrialStatus();
        if (cancelled) return;
        if (trial.trial_active) {
          setStatus((prev) => ({
            ...prev,
            isTrial: true,
            creditsRemaining: trial.credits_remaining ?? 0,
            loaded: true,
          }));
          return;
        }
        const balance = await BillingService.getCreditBalance();
        if (cancelled) return;
        setStatus((prev) => ({ ...prev, isTrial: false, creditsRemaining: balance.credits_remaining, loaded: true }));
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

  useEffect(() => {
    let cancelled = false;
    SocialMediaAgentService.getVideoEditingPricing()
      .then((res) => {
        const rate = res.responseData?.credits_per_minute;
        if (!cancelled && rate) setStatus((prev) => ({ ...prev, ratePerMinute: rate }));
      })
      .catch(() => {
        // Keep the default — the backend re-checks the real rate at submit
        // time regardless, this only affects the client-side preview.
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return status;
}
