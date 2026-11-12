'use client';

import { useEffect, useState } from 'react';
import { AdsViewMode, CampaignService } from '@/src/api/CampaignService';

/*
 * Guided or Advanced: how much of the ads machinery this user sees for this brand.
 * One value shared by every ads screen, loaded once and kept in step when it changes.
 * Switching it only changes what is shown — no plan, campaign or setting changes.
 */

let current: AdsViewMode | null = null;
let loading: Promise<AdsViewMode> | null = null;
const listeners = new Set<(m: AdsViewMode) => void>();

function publish(mode: AdsViewMode) {
  current = mode;
  listeners.forEach((l) => l(mode));
}

function load(): Promise<AdsViewMode> {
  if (!loading) {
    loading = CampaignService.getAdsMode()
      .catch(() => 'guided' as const)
      .then((m) => {
        publish(m);
        return m;
      });
  }
  return loading;
}

export async function setAdsMode(mode: AdsViewMode): Promise<void> {
  const previous = current;
  publish(mode);
  try {
    publish(await CampaignService.setAdsMode(mode));
  } catch (e) {
    if (previous) publish(previous);
    throw e;
  }
}

export function useAdsMode(): { mode: AdsViewMode; advanced: boolean; ready: boolean } {
  const [mode, setMode] = useState<AdsViewMode | null>(current);
  useEffect(() => {
    listeners.add(setMode);
    if (!current) load();
    return () => {
      listeners.delete(setMode);
    };
  }, []);
  const m = mode ?? 'guided';
  return { mode: m, advanced: m === 'advanced', ready: mode !== null };
}
