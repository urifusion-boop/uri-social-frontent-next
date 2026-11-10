'use client';

import { useEffect, useState, type CSSProperties } from 'react';
import { BrandProfileService } from '@/src/api/BrandProfileService';

export type BrandLogo = { url: string; position: string; size: 'small' | 'medium' | 'large' };

// Share of the video's width, by the playbook's logo size. The same numbers the server uses when it stamps the logo
// onto the finished video, so the storyboard preview matches it.
export const LOGO_WIDTH_PERCENT: Record<BrandLogo['size'], number> = { small: 12, medium: 16, large: 20 };

const SIZES = ['small', 'medium', 'large'] as const;

/** The logo from the owner's Brand Playbook, or null if there is none (or it can't be read: it is only a preview). */
export function useBrandLogo(): BrandLogo | null {
  const [logo, setLogo] = useState<BrandLogo | null>(null);
  useEffect(() => {
    let cancelled = false;
    BrandProfileService.get()
      .then((res) => {
        const profile = res?.status ? res.responseData : null;
        const url = (profile?.logo_url || '').trim();
        if (cancelled || !/^https?:\/\//i.test(url)) return;
        const size = SIZES.find((s) => s === profile?.logo_size) ?? 'small';
        const position = (profile?.logo_position || 'bottom_right').toLowerCase().replace(/-/g, '_');
        setLogo({ url, position, size });
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);
  return logo;
}

/** CSS for the logo's corner, kept clear of the edges like the finished video (and of the app's own buttons). */
export function logoPlacement(position: string): CSSProperties {
  const side = '5%';
  const top = '8%';
  const bottom = '9%';
  switch (position) {
    case 'top_left':
      return { left: side, top };
    case 'top_center':
      return { left: '50%', top, transform: 'translateX(-50%)' };
    case 'top_right':
      return { right: side, top };
    case 'bottom_left':
      return { left: side, bottom };
    case 'bottom_center':
      return { left: '50%', bottom, transform: 'translateX(-50%)' };
    case 'center':
      return { left: '50%', top: '50%', transform: 'translate(-50%, -50%)' };
    default:
      return { right: side, bottom };
  }
}
