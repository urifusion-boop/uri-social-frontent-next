'use client';

import { UriHttpClient } from '@/src/configs/http.config';
import { useEffect, useState } from 'react';

/** The new capabilities being rolled out in stages (staff first, then a share of brands). */
export type FeatureFlag = 'website_playbook' | 'builder_products' | 'budget_suggestions' | 'competitors';
export type FeatureFlags = Record<FeatureFlag, boolean>;

const OFF: FeatureFlags = { website_playbook: false, builder_products: false, budget_suggestions: false, competitors: false };

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
  const [state, setState] = useState<{ flags: FeatureFlags; loaded: boolean }>({ flags: OFF, loaded: false });
  useEffect(() => {
    let alive = true;
    void loadFeatures().then((flags) => alive && setState({ flags, loaded: true }));
    return () => {
      alive = false;
    };
  }, []);
  return state;
}
