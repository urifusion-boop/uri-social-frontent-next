'use client';

import { IS_PRODUCTION } from '@/src/configs/env.config';
import { UriHttpClient } from '@/src/configs/http.config';
import { useEffect, useState } from 'react';

/** The new capabilities being rolled out in stages (staff first, then a share of brands). */
export type FeatureFlag = 'website_playbook' | 'builder_products' | 'budget_suggestions' | 'competitors';
export type FeatureFlags = Record<FeatureFlag, boolean>;

const OFF: FeatureFlags = { website_playbook: false, builder_products: false, budget_suggestions: false, competitors: false };
const ALL_ON: FeatureFlags = { website_playbook: true, builder_products: true, budget_suggestions: true, competitors: true };

// One request per page load and brand, shared by every component that asks.
let cached: { brand: string; at: number; promise: Promise<FeatureFlags> } | null = null;
const MAX_AGE_MS = 5 * 60 * 1000;

function activeBrand(): string {
  try {
    return localStorage.getItem('@URI@ACTIVE_BRAND_ID') ?? '';
  } catch {
    return '';
  }
}

export function loadFeatures(): Promise<FeatureFlags> {
  // Staging is for the whole team to test: every new capability is on for everyone there.
  // Production keeps the staged rollout (staff first, then a share of brands).
  if (!IS_PRODUCTION) return Promise.resolve({ ...ALL_ON });
  const brand = activeBrand();
  if (cached && cached.brand === brand && Date.now() - cached.at < MAX_AGE_MS) return cached.promise;
  const promise = UriHttpClient.getClient()
    .get<{ flags: Partial<FeatureFlags> }>('/features')
    .then((r) => ({ ...OFF, ...(r.data?.flags ?? {}) }))
    // If the switches can't be read, show today's product: every new capability stays off.
    .catch(() => ({ ...OFF }));
  cached = { brand, at: Date.now(), promise };
  return promise;
}

/** Which new capabilities this brand sees. Off until known, so nothing new flashes up and away. */
export function useFeatures(): { flags: FeatureFlags; loaded: boolean } {
  const [state, setState] = useState<{ flags: FeatureFlags; loaded: boolean }>(
    IS_PRODUCTION ? { flags: OFF, loaded: false } : { flags: { ...ALL_ON }, loaded: true },
  );
  useEffect(() => {
    let alive = true;
    void loadFeatures().then((flags) => alive && setState({ flags, loaded: true }));
    return () => {
      alive = false;
    };
  }, []);
  return state;
}
