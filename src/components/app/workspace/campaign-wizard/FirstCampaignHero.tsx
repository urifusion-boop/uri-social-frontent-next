'use client';
/**
 * The Overview page's first-run state: a centred hero that shows what a campaign looks like
 * (a phone with a finished ad, a few floating notes around it) and one clear action.
 * Replaces the plain "Let's get your first campaign running" box.
 */

const PINK = '#C2185B';
const PINK2 = '#E0407F';
const INK = '#1A0A12';
const MUTED = '#7A7270';

// Keyframes and hover can't be inline styles; class names are prefixed so nothing else is touched.
const CSS = `
@keyframes fch-float { 0%,100% { transform: translateY(0) } 50% { transform: translateY(-8px) } }
@keyframes fch-phone { 0%,100% { transform: translateX(-50%) rotate(-4deg) translateY(0) }
                       50% { transform: translateX(-50%) rotate(-4deg) translateY(-10px) } }
.fch-btn { transition: transform .2s ease, box-shadow .2s ease; }
.fch-btn:hover { transform: translateY(-2px); box-shadow: 0 24px 44px -12px rgba(194,24,91,.6) !important; }
.fch-btn:focus-visible { outline: 3px solid rgba(194,24,91,.35); outline-offset: 3px; }
@media (prefers-reduced-motion: reduce) { .fch-anim { animation: none !important; } }
`;

function Chip({
  emoji,
  tint,
  title,
  note,
  style,
  compact,
  delay,
}: {
  emoji: string;
  tint: string;
  title: string;
  note: string;
  style: React.CSSProperties;
  compact: boolean;
  delay: string;
}) {
  return (
    <div
      className="fch-anim"
      style={{
        position: 'absolute',
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        background: '#fff',
        borderRadius: 16,
        padding: compact ? '8px 10px' : '10px 14px',
        fontSize: compact ? 12 : 13,
        fontWeight: 700,
        color: INK,
        whiteSpace: 'nowrap',
        textAlign: 'left',
        boxShadow: '0 18px 40px -16px rgba(120,20,60,.35), 0 0 0 1px rgba(0,0,0,.04)',
        animation: `fch-float 7s ease-in-out infinite ${delay}`,
        ...style,
      }}
    >
      <span
        aria-hidden
        style={{
          width: compact ? 24 : 28,
          height: compact ? 24 : 28,
          borderRadius: 10,
          background: tint,
          display: 'grid',
          placeItems: 'center',
          fontSize: compact ? 13 : 15,
        }}
      >
        {emoji}
      </span>
      <span>
        {title}
        <small style={{ display: 'block', fontSize: compact ? 10 : 11, color: MUTED, fontWeight: 600 }}>{note}</small>
      </span>
    </div>
  );
}

export default function FirstCampaignHero({ onStart, isMobile }: { onStart: () => void; isMobile: boolean }) {
  const artW = isMobile ? 300 : 420;
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        textAlign: 'center',
        maxWidth: 760,
        margin: `${isMobile ? 16 : 40}px auto 0`,
      }}
    >
      <style>{CSS}</style>

      {/* Illustration — decorative, hidden from screen readers */}
      <div aria-hidden style={{ position: 'relative', width: artW, height: isMobile ? 260 : 300 }}>
        <div
          style={{
            position: 'absolute',
            top: -40,
            left: '50%',
            transform: 'translateX(-50%)',
            width: isMobile ? 330 : 380,
            height: isMobile ? 330 : 380,
            borderRadius: '50%',
            border: '1px dashed rgba(194,24,91,.18)',
          }}
        />
        <div
          style={{
            position: 'absolute',
            top: 10,
            left: '50%',
            transform: 'translateX(-50%)',
            width: isMobile ? 240 : 280,
            height: isMobile ? 240 : 280,
            borderRadius: '50%',
            border: '1px solid rgba(194,24,91,.08)',
          }}
        />
        <div
          style={{
            position: 'absolute',
            top: 40,
            left: '50%',
            transform: 'translateX(-50%)',
            width: 340,
            height: 240,
            background: 'radial-gradient(closest-side, rgba(224,64,127,.28), rgba(224,64,127,0))',
            filter: 'blur(10px)',
          }}
        />
        <div
          className="fch-anim"
          style={{
            position: 'absolute',
            left: '50%',
            top: 10,
            width: isMobile ? 160 : 180,
            height: isMobile ? 240 : 270,
            borderRadius: 30,
            background: '#fff',
            padding: 14,
            boxShadow: '0 30px 60px -20px rgba(120,20,60,.35), 0 0 0 1px rgba(0,0,0,.04)',
            transform: 'translateX(-50%) rotate(-4deg)',
            animation: 'fch-phone 6s ease-in-out infinite',
          }}
        >
          <div
            style={{
              position: 'relative',
              height: isMobile ? 130 : 150,
              borderRadius: 18,
              overflow: 'hidden',
              background: 'linear-gradient(135deg,#C2185B,#F06292 60%,#FFB199)',
            }}
          >
            <span
              style={{
                position: 'absolute',
                right: -20,
                bottom: -30,
                width: 120,
                height: 120,
                borderRadius: '50%',
                background: 'rgba(255,255,255,.18)',
              }}
            />
            <span
              style={{
                position: 'absolute',
                left: 14,
                top: 12,
                background: 'rgba(255,255,255,.25)',
                color: '#fff',
                fontSize: 10,
                fontWeight: 700,
                padding: '3px 8px',
                borderRadius: 20,
              }}
            >
              Sponsored
            </span>
            <b
              style={{
                position: 'absolute',
                left: 14,
                bottom: 14,
                color: '#fff',
                fontSize: isMobile ? 17 : 19,
                fontWeight: 900,
                lineHeight: 1.05,
                textAlign: 'left',
              }}
            >
              Fresh styles,
              <br />
              delivered today
            </b>
          </div>
          {[100, 70, 45].map((w) => (
            <span
              key={w}
              style={{ display: 'block', height: 8, borderRadius: 6, background: '#F1E9EC', marginTop: 10, width: `${w}%` }}
            />
          ))}
          <div
            style={{
              marginTop: 12,
              height: 26,
              borderRadius: 20,
              background: INK,
              color: '#fff',
              fontSize: 11,
              fontWeight: 700,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            Send message
          </div>
        </div>
        <Chip
          emoji="✨"
          tint="#FCE4EE"
          title="Jane designed it"
          note="Copy + visual, in your brand"
          compact={isMobile}
          delay=".8s"
          style={isMobile ? { left: -58, top: 170 } : { left: -70, top: 150 }}
        />
        <Chip
          emoji="💬"
          tint="#E7F6EE"
          title="+38 new chats"
          note="Last 7 days"
          compact={isMobile}
          delay=".2s"
          style={isMobile ? { right: -58, top: 40 } : { right: -60, top: 56 }}
        />
        {!isMobile && (
          <Chip
            emoji="📍"
            tint="#EEE7FB"
            title="Lagos · Abuja"
            note="Instagram & Facebook"
            compact={false}
            delay="1.4s"
            style={{ right: -30, bottom: 6 }}
          />
        )}
      </div>

      <h3
        style={{
          maxWidth: 640,
          margin: `${isMobile ? 20 : 34}px 0 0`,
          fontSize: isMobile ? 32 : 44,
          lineHeight: 1.08,
          fontWeight: 900,
          letterSpacing: -1,
          color: INK,
        }}
      >
        Your first campaign is{' '}
        <span
          style={{
            whiteSpace: isMobile ? 'normal' : 'nowrap',
            background: `linear-gradient(90deg, ${PINK}, ${PINK2})`,
            WebkitBackgroundClip: 'text',
            backgroundClip: 'text',
            color: 'transparent',
          }}
        >
          one message away
        </span>
      </h3>
      <p style={{ margin: '14px 0 0', maxWidth: 540, fontSize: isMobile ? 15.5 : 18, lineHeight: 1.55, color: MUTED }}>
        Tell Jane what you want to promote. She writes the copy, designs the visual and sets it all up. Nothing goes
        live until you say so.
      </p>

      <button
        type="button"
        onClick={onStart}
        className="fch-btn"
        style={{
          marginTop: 30,
          width: isMobile ? '100%' : undefined,
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 10,
          padding: isMobile ? '17px 24px' : '18px 34px',
          borderRadius: 999,
          border: 0,
          cursor: 'pointer',
          fontFamily: 'inherit',
          fontSize: 18,
          fontWeight: 800,
          color: '#fff',
          background: `linear-gradient(135deg, ${PINK}, ${PINK2})`,
          boxShadow: '0 18px 36px -12px rgba(194,24,91,.55), inset 0 1px 0 rgba(255,255,255,.25)',
        }}
      >
        Start a campaign
        <span
          aria-hidden
          style={{
            width: 28,
            height: 28,
            borderRadius: '50%',
            background: 'rgba(255,255,255,.2)',
            display: 'grid',
            placeItems: 'center',
          }}
        >
          →
        </span>
      </button>
      <div style={{ marginTop: 14, fontSize: 13.5, fontWeight: 600, color: '#9A9090' }}>
        Takes about 2 minutes · You approve before anything spends
      </div>

      <div
        style={{
          marginTop: isMobile ? 30 : 44,
          display: 'flex',
          flexDirection: isMobile ? 'column' : 'row',
          alignItems: isMobile ? 'stretch' : 'center',
          justifyContent: 'center',
          gap: 14,
          flexWrap: 'wrap',
          width: isMobile ? '100%' : undefined,
        }}
      >
        {['Tell Jane your goal', 'She builds the ad', 'You approve, it goes live'].map((label, i) => (
          <div
            key={label}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              padding: '12px 16px',
              borderRadius: 16,
              background: 'rgba(255,255,255,.7)',
              border: '1px solid rgba(194,24,91,.10)',
              fontSize: 14,
              fontWeight: 700,
              color: INK,
            }}
          >
            <span
              style={{
                width: 24,
                height: 24,
                borderRadius: '50%',
                background: '#FCE4EE',
                color: PINK,
                fontSize: 12,
                fontWeight: 900,
                display: 'grid',
                placeItems: 'center',
              }}
            >
              {i + 1}
            </span>
            {label}
          </div>
        ))}
      </div>
    </div>
  );
}
