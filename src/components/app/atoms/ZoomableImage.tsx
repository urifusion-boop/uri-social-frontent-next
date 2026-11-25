'use client';

import { useEffect, useState, type CSSProperties } from 'react';
import { createPortal } from 'react-dom';

/**
 * An image you can click (or tap) to see whole, at full size, over everything else.
 * Thumbnails are often cropped square while ads are tall, so this is the only way to read
 * the whole ad. Rendered into document.body above any full-screen view (the ad composer
 * sits at z-index 1300). Closes on the backdrop, the ✕ or Escape.
 */
export default function ZoomableImage({
  src,
  alt,
  style,
  loading,
}: {
  src: string;
  alt: string;
  style?: CSSProperties;
  loading?: 'lazy' | 'eager';
}) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.stopPropagation();
        setOpen(false);
      }
    };
    window.addEventListener('keydown', onKey, true);
    return () => window.removeEventListener('keydown', onKey, true);
  }, [open]);

  return (
    <>
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          setOpen(true);
        }}
        aria-label={`View ${alt || 'image'} full size`}
        title="View full size"
        style={{ padding: 0, border: 'none', background: 'none', cursor: 'zoom-in', display: 'block', width: '100%' }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={src} alt={alt} loading={loading} style={style} />
      </button>
      {open &&
        createPortal(
          <div
            role="dialog"
            aria-modal="true"
            aria-label={alt || 'Image'}
            // React events bubble through portals: keep this click from reaching the views
            // underneath (some close when clicked outside their panel).
            onClick={(e) => {
              e.stopPropagation();
              setOpen(false);
            }}
            style={{
              position: 'fixed',
              inset: 0,
              zIndex: 2000,
              background: 'rgba(0,0,0,.85)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: 24,
              cursor: 'zoom-out',
            }}
          >
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setOpen(false);
              }}
              aria-label="Close"
              style={{
                position: 'absolute',
                top: 'calc(16px + env(safe-area-inset-top, 0px))',
                right: 20,
                width: 36,
                height: 36,
                borderRadius: '50%',
                border: 'none',
                background: 'rgba(255,255,255,.15)',
                color: '#fff',
                fontSize: 18,
                cursor: 'pointer',
              }}
            >
              ✕
            </button>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={src}
              alt={alt}
              onClick={(e) => e.stopPropagation()}
              style={{ maxWidth: '92vw', maxHeight: '88vh', objectFit: 'contain', borderRadius: 8, cursor: 'default' }}
            />
          </div>,
          document.body
        )}
    </>
  );
}
