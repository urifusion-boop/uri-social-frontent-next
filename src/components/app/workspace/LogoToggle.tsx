'use client';

import type { BrandLogo } from './useBrandLogo';

/** "Put my logo on this video" switch. Shown only when the Brand Playbook has a logo (nothing to switch otherwise). */
export default function LogoToggle({
  logo,
  on,
  onChange,
}: {
  logo: BrandLogo | null;
  on: boolean;
  onChange: (on: boolean) => void;
}) {
  if (!logo) return null;
  return (
    <div
      data-testid="logo-toggle-row"
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        padding: '10px 14px',
        border: '1px solid #E5E7EB',
        borderRadius: 10,
        background: '#fff',
        marginBottom: 16,
      }}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={logo.url} alt="" style={{ width: 32, height: 32, objectFit: 'contain', borderRadius: 6 }} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ fontSize: 13, fontWeight: 700, color: '#111827', margin: 0 }}>Add my logo to the video</p>
        <p style={{ fontSize: 11.5, color: '#6b7280', margin: '2px 0 0' }}>
          {on ? 'Your Brand Playbook logo is added to the finished video.' : 'No logo on this video.'}
        </p>
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={on}
        aria-label="Add my logo to the video"
        data-testid="logo-toggle"
        onClick={() => onChange(!on)}
        style={{
          position: 'relative',
          width: 42,
          height: 24,
          borderRadius: 12,
          border: 'none',
          background: on ? '#CD1B78' : '#D1D5DB',
          cursor: 'pointer',
          flexShrink: 0,
          transition: 'background .15s',
        }}
      >
        <span
          style={{
            position: 'absolute',
            top: 3,
            left: on ? 21 : 3,
            width: 18,
            height: 18,
            borderRadius: '50%',
            background: '#fff',
            transition: 'left .15s',
          }}
        />
      </button>
    </div>
  );
}
