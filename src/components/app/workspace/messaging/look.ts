/**
 * Shared look for the Messaging pages (Inbox sub-pages, Brand Voice, AI Usage, Settings): the same
 * soft pink gradient, rounded cards, pill buttons and icon tiles the rest of the dashboard uses.
 */
import type { CSSProperties } from 'react';

export const PINK = '#C2185B';
export const PINK2 = '#E0407F';
export const INK = '#1A0A12';
export const MUTED = '#7A7270';

export const pageBackground = 'linear-gradient(180deg, #FCE4EC 0%, #FBF8F7 32%, #FAFAF8 100%)';

export const card: CSSProperties = {
  background: '#fff',
  borderRadius: 20,
  padding: '18px 20px',
  boxShadow: '0 14px 34px -24px rgba(120,20,60,.45), 0 0 0 1px rgba(194,24,91,.06)',
};

export const gradient = `linear-gradient(135deg, ${PINK}, ${PINK2})`;

export const primaryPill: CSSProperties = {
  border: 0,
  borderRadius: 999,
  color: '#fff',
  background: gradient,
  boxShadow: '0 8px 18px -10px rgba(194,24,91,.6)',
};

export const ghostPill: CSSProperties = {
  border: '1px solid #EADDE2',
  borderRadius: 999,
  color: INK,
  background: '#fff',
};

export function iconTile(background: string, size = 38): CSSProperties {
  return {
    width: size,
    height: size,
    borderRadius: size >= 40 ? 14 : 12,
    background,
    display: 'grid',
    placeItems: 'center',
    fontSize: Math.round(size * 0.45),
    flex: 'none',
  };
}
