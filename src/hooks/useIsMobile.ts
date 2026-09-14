'use client';

import { useEffect, useState } from 'react';

/** Matches the `md` breakpoint the dashboard already keyed its layout to. */
export const MOBILE_BREAKPOINT = 768;

/**
 * Tracks whether the viewport is phone-sized.
 *
 * Starts `false` so server and first client render agree — a `true` initial
 * value would hydrate a desktop tree on the server and a mobile tree on the
 * client, which React reports as a hydration mismatch.
 */
export const useIsMobile = (breakpoint: number = MOBILE_BREAKPOINT): boolean => {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const mql = window.matchMedia(`(max-width: ${breakpoint - 1}px)`);
    const sync = () => setIsMobile(mql.matches);
    sync();
    mql.addEventListener('change', sync);
    return () => mql.removeEventListener('change', sync);
  }, [breakpoint]);

  return isMobile;
};
