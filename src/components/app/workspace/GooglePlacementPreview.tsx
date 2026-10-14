'use client';

/**
 * How a Google ad looks in each place it can run: Search results, websites and
 * apps (Display), YouTube & Discover, or all of them (Everywhere). Used full size
 * on the plan, and small in the placement picker so people can see the difference
 * before they choose.
 */

export type GooglePlacement = 'search' | 'display' | 'demand_gen' | 'pmax';

export const GOOGLE_PLACEMENTS: {
  value: GooglePlacement;
  label: string;
  where: string;
  needs: string;
}[] = [
  {
    value: 'search',
    label: 'Search',
    where: 'Text ad at the top of Google when people search for what you sell.',
    needs: 'Text only',
  },
  {
    value: 'display',
    label: 'Display',
    where: 'Picture ads on millions of websites and apps people already use.',
    needs: 'Picture',
  },
  {
    value: 'demand_gen',
    label: 'YouTube & Discover',
    where: 'In YouTube feeds and Shorts, the Google Discover feed and Gmail.',
    needs: 'Picture · from ₦8,000/day',
  },
  {
    value: 'pmax',
    label: 'Everywhere',
    where: 'All of the above — Google puts it wherever it works best.',
    needs: 'Picture',
  },
];

export const placementLabel = (p?: string) => {
  if (p === 'display') return 'Google Display';
  if (p === 'demand_gen') return 'YouTube & Discover';
  if (p === 'pmax') return 'Google — everywhere';
  return 'Google Search';
};

type Ad = { headline?: string; text?: string; imageUrl?: string; business?: string; link?: string };

const ink = '#202124';
const grey = '#5f6368';
const blueLink = '#1a0dab';

const Img = ({ src, ratio, radius = 0 }: { src?: string; ratio: string; radius?: number }) =>
  src ? (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt=""
      style={{ width: '100%', aspectRatio: ratio, objectFit: 'cover', display: 'block', borderRadius: radius }}
    />
  ) : (
    <div
      style={{
        width: '100%',
        aspectRatio: ratio,
        borderRadius: radius,
        background: 'linear-gradient(135deg,#e8eaed,#f1f3f4)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: grey,
        fontSize: 11,
      }}
    >
      Your picture
    </div>
  );

const Initial = ({ name, size = 22 }: { name?: string; size?: number }) => (
  <span
    style={{
      width: size,
      height: size,
      borderRadius: '50%',
      background: '#C2185B',
      color: '#fff',
      fontSize: size * 0.45,
      fontWeight: 800,
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
      flexShrink: 0,
    }}
  >
    {(name || 'A').trim().charAt(0).toUpperCase()}
  </span>
);

const AdTag = () => (
  <span
    style={{
      fontSize: 10,
      fontWeight: 700,
      color: ink,
      border: `1px solid ${grey}`,
      borderRadius: 3,
      padding: '0 3px',
    }}
  >
    Ad
  </span>
);

function SearchAd({ ad }: { ad: Ad }) {
  return (
    <div style={{ background: '#fff', borderRadius: 10, padding: '12px 14px', border: '1px solid #eceff1' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 7, fontSize: 11.5, color: ink }}>
        <Initial name={ad.business} size={20} />
        <span>
          <b>Sponsored</b>
          <span style={{ display: 'block', color: grey, fontSize: 11 }}>{ad.link || 'your link'}</span>
        </span>
      </div>
      <div style={{ fontSize: 16, color: blueLink, margin: '6px 0 2px', lineHeight: 1.3 }}>{ad.headline}</div>
      <div style={{ fontSize: 12.5, color: '#4d5156', lineHeight: 1.45 }}>{ad.text}</div>
    </div>
  );
}

function DisplayAd({ ad }: { ad: Ad }) {
  return (
    <div style={{ background: '#f1f3f4', borderRadius: 10, padding: 10 }}>
      <div style={{ fontSize: 10, color: grey, marginBottom: 6 }}>On a news site or app</div>
      <div style={{ background: '#fff', borderRadius: 6, overflow: 'hidden', border: '1px solid #e0e0e0' }}>
        <Img src={ad.imageUrl} ratio="1.91 / 1" />
        <div style={{ padding: '9px 10px', display: 'flex', gap: 8, alignItems: 'center' }}>
          <Initial name={ad.business} size={26} />
          <div style={{ minWidth: 0, flex: 1 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: ink, lineHeight: 1.3 }}>{ad.headline}</div>
            <div style={{ fontSize: 11.5, color: grey, lineHeight: 1.35, marginTop: 2 }}>{ad.text}</div>
          </div>
          <span
            style={{
              flexShrink: 0,
              background: '#1a73e8',
              color: '#fff',
              borderRadius: 14,
              padding: '5px 10px',
              fontSize: 11,
              fontWeight: 700,
            }}
          >
            Open
          </span>
        </div>
        <div
          style={{ padding: '0 10px 7px', display: 'flex', gap: 5, alignItems: 'center', fontSize: 10, color: grey }}
        >
          <AdTag /> {ad.business}
        </div>
      </div>
    </div>
  );
}

function YouTubeAd({ ad }: { ad: Ad }) {
  return (
    <div style={{ background: '#0f0f0f', borderRadius: 10, padding: 10, color: '#fff' }}>
      <div style={{ fontSize: 10, color: '#aaa', marginBottom: 6 }}>In the YouTube feed</div>
      <Img src={ad.imageUrl} ratio="16 / 9" radius={8} />
      <div style={{ display: 'flex', gap: 9, marginTop: 8 }}>
        <Initial name={ad.business} size={30} />
        <div style={{ minWidth: 0 }}>
          <div style={{ fontSize: 13, fontWeight: 600, lineHeight: 1.3 }}>{ad.headline}</div>
          <div style={{ fontSize: 11, color: '#aaa', marginTop: 3, display: 'flex', gap: 5, alignItems: 'center' }}>
            <span style={{ fontWeight: 700, color: '#fff' }}>Sponsored</span> · {ad.business}
          </div>
        </div>
      </div>
      <div
        style={{
          marginTop: 8,
          background: '#3ea6ff',
          color: '#0f0f0f',
          textAlign: 'center',
          borderRadius: 16,
          padding: '6px 0',
          fontSize: 12,
          fontWeight: 700,
        }}
      >
        Learn more
      </div>
    </div>
  );
}

function DiscoverAd({ ad }: { ad: Ad }) {
  return (
    <div style={{ background: '#fff', borderRadius: 10, overflow: 'hidden', border: '1px solid #eceff1' }}>
      <div style={{ fontSize: 10, color: grey, padding: '8px 10px 0' }}>In Google Discover & Gmail</div>
      <div style={{ padding: 10 }}>
        <Img src={ad.imageUrl} ratio="1.91 / 1" radius={10} />
        <div style={{ fontSize: 13.5, color: ink, fontWeight: 600, margin: '8px 0 4px', lineHeight: 1.3 }}>
          {ad.headline}
        </div>
        <div style={{ display: 'flex', gap: 5, alignItems: 'center', fontSize: 11, color: grey }}>
          <AdTag /> {ad.business}
        </div>
      </div>
    </div>
  );
}

/** The full preview for the plan card. */
export function GooglePlacementPreview({ placement, ad }: { placement: GooglePlacement; ad: Ad }) {
  const title =
    placement === 'pmax'
      ? 'HOW IT CAN APPEAR — GOOGLE PICKS WHERE'
      : `HOW IT APPEARS — ${placementLabel(placement).toUpperCase()}`;
  return (
    <div style={{ padding: '14px 16px', background: '#f8f9fa', borderBottom: '1px solid #eee' }}>
      <div style={{ fontSize: 10.5, fontWeight: 700, color: grey, letterSpacing: 0.4, marginBottom: 8 }}>{title}</div>
      {placement === 'search' && <SearchAd ad={ad} />}
      {placement === 'display' && <DisplayAd ad={ad} />}
      {placement === 'demand_gen' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 10 }}>
          <YouTubeAd ad={ad} />
          <DiscoverAd ad={ad} />
        </div>
      )}
      {placement === 'pmax' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 10 }}>
          <SearchAd ad={ad} />
          <DisplayAd ad={ad} />
          <YouTubeAd ad={ad} />
          <DiscoverAd ad={ad} />
        </div>
      )}
      <div style={{ fontSize: 11, color: grey, marginTop: 8, lineHeight: 1.45 }}>
        {placement === 'search'
          ? 'Text only — no picture needed. Google mixes in extra headlines from your keywords.'
          : 'Google fits your picture and words to each spot, so the exact look varies a little.'}
      </div>
    </div>
  );
}

/** The small, tappable cards for choosing where on Google. */
export function GooglePlacementPicker({
  value,
  onChange,
  ad,
}: {
  value: GooglePlacement;
  onChange: (p: GooglePlacement) => void;
  ad: Ad;
}) {
  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
        gap: 8,
        margin: '4px 0 8px',
      }}
    >
      {GOOGLE_PLACEMENTS.map((p) => {
        const on = value === p.value;
        return (
          <button
            key={p.value}
            type="button"
            aria-pressed={on}
            onClick={() => onChange(p.value)}
            style={{
              textAlign: 'left',
              padding: 8,
              borderRadius: 10,
              border: `1.5px solid ${on ? '#C2185B' : '#e0dcd9'}`,
              background: on ? '#FCE7F3' : '#fff',
              cursor: 'pointer',
              fontFamily: 'inherit',
              boxShadow: on ? '0 2px 8px rgba(194,24,91,.18)' : 'none',
            }}
          >
            <div
              style={{ height: 74, overflow: 'hidden', borderRadius: 6, pointerEvents: 'none', position: 'relative' }}
            >
              <div style={{ transform: 'scale(0.42)', transformOrigin: 'top left', width: '238%' }}>
                {p.value === 'search' && <SearchAd ad={ad} />}
                {p.value === 'display' && <DisplayAd ad={ad} />}
                {p.value === 'demand_gen' && <YouTubeAd ad={ad} />}
                {p.value === 'pmax' && (
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                    <SearchAd ad={ad} />
                    <DisplayAd ad={ad} />
                  </div>
                )}
              </div>
            </div>
            <div style={{ fontSize: 12, fontWeight: 800, color: on ? '#C2185B' : ink, marginTop: 6 }}>
              {on ? '✓ ' : ''}
              {p.label}
            </div>
            <div style={{ fontSize: 10.5, color: grey, lineHeight: 1.35, marginTop: 2 }}>{p.where}</div>
            <div style={{ fontSize: 10, color: '#888', marginTop: 3, fontWeight: 600 }}>{p.needs}</div>
          </button>
        );
      })}
    </div>
  );
}
