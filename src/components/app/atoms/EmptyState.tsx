'use client';
/**
 * The dashboard's shared "nothing here yet" state: a small illustration (an emoji on a floating
 * tile, two short notes beside it), a headline with one highlighted phrase, a line of
 * explanation and one clear action. Same visual language as the Overview first-run hero.
 */

const PINK = '#C2185B';
const PINK2 = '#E0407F';
const INK = '#1A0A12';
const MUTED = '#7A7270';

const CSS = `
@keyframes es-float { 0%,100% { transform: translate(-50%,-50%) rotate(-6deg) } 50% { transform: translate(-50%,-56%) rotate(-6deg) } }
.es-cta { transition: transform .2s ease, box-shadow .2s ease; }
.es-cta:hover { transform: translateY(-2px); box-shadow: 0 18px 32px -12px rgba(194,24,91,.6) !important; }
.es-cta:focus-visible, .es-alt:focus-visible { outline: 3px solid rgba(194,24,91,.35); outline-offset: 3px; }
@media (prefers-reduced-motion: reduce) { .es-anim { animation: none !important; } }
`;

export interface EmptyStateAction {
  label: string;
  onClick: () => void;
}

export default function EmptyState({
  emoji,
  notes,
  title,
  highlight,
  body,
  action,
  secondary,
  compact = false,
}: {
  emoji: string;
  /** Two short notes floating beside the tile, e.g. ["✨ Jane writes it", "✅ You approve"]. */
  notes?: [string, string];
  title: string;
  /** Shown after the title in the brand gradient. */
  highlight?: string;
  body: React.ReactNode;
  action?: EmptyStateAction;
  secondary?: EmptyStateAction;
  /** Smaller, for use inside a card. */
  compact?: boolean;
}) {
  const art = compact ? 0.8 : 1;
  return (
    <div
      style={{
        margin: compact ? '6px auto 2px' : '26px auto 8px',
        maxWidth: 460,
        textAlign: 'center',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
      }}
    >
      <style>{CSS}</style>
      <div aria-hidden style={{ position: 'relative', width: 150 * art, height: 118 * art, marginBottom: 14 * art }}>
        <span
          style={{
            position: 'absolute',
            left: '50%',
            top: '50%',
            transform: 'translate(-50%,-50%)',
            width: 120 * art,
            height: 90 * art,
            background: 'radial-gradient(closest-side, rgba(224,64,127,.25), rgba(224,64,127,0))',
            filter: 'blur(6px)',
          }}
        />
        <span
          style={{
            position: 'absolute',
            left: '50%',
            top: '50%',
            transform: 'translate(-50%,-50%)',
            width: 118 * art,
            height: 118 * art,
            borderRadius: '50%',
            border: '1px dashed rgba(194,24,91,.22)',
          }}
        />
        <span
          className="es-anim"
          style={{
            position: 'absolute',
            left: '50%',
            top: '50%',
            width: 70 * art,
            height: 70 * art,
            borderRadius: 22 * art,
            background: '#fff',
            display: 'grid',
            placeItems: 'center',
            fontSize: 32 * art,
            transform: 'translate(-50%,-50%) rotate(-6deg)',
            boxShadow: '0 18px 36px -14px rgba(120,20,60,.4), 0 0 0 1px rgba(0,0,0,.04)',
            animation: 'es-float 6s ease-in-out infinite',
          }}
        >
          {emoji}
        </span>
        {notes?.map((note, i) => (
          <span
            key={note}
            style={{
              position: 'absolute',
              ...(i === 0 ? { left: -14, top: 10 * art } : { right: -18, bottom: 8 * art }),
              background: '#fff',
              borderRadius: 12,
              padding: '5px 8px',
              fontSize: 10.5,
              fontWeight: 800,
              color: INK,
              whiteSpace: 'nowrap',
              boxShadow: '0 10px 22px -10px rgba(120,20,60,.35), 0 0 0 1px rgba(0,0,0,.04)',
            }}
          >
            {note}
          </span>
        ))}
      </div>

      <h3
        style={{
          margin: 0,
          fontSize: compact ? 19 : 24,
          lineHeight: 1.15,
          fontWeight: 900,
          letterSpacing: -0.4,
          color: INK,
        }}
      >
        {title}
        {highlight && (
          <>
            {' '}
            <span
              style={{
                background: `linear-gradient(90deg, ${PINK}, ${PINK2})`,
                WebkitBackgroundClip: 'text',
                backgroundClip: 'text',
                color: 'transparent',
              }}
            >
              {highlight}
            </span>
          </>
        )}
      </h3>
      <p style={{ margin: '8px 0 0', fontSize: compact ? 13 : 14, color: MUTED, lineHeight: 1.5 }}>{body}</p>

      {action && (
        <button
          type="button"
          onClick={action.onClick}
          className="es-cta"
          style={{
            marginTop: 16,
            display: 'inline-flex',
            alignItems: 'center',
            gap: 8,
            border: 0,
            borderRadius: 999,
            padding: compact ? '10px 18px' : '12px 22px',
            color: '#fff',
            fontFamily: 'inherit',
            fontSize: compact ? 14 : 15,
            fontWeight: 800,
            cursor: 'pointer',
            background: `linear-gradient(135deg, ${PINK}, ${PINK2})`,
            boxShadow: '0 14px 28px -12px rgba(194,24,91,.55)',
          }}
        >
          {action.label}
          <span
            aria-hidden
            style={{
              width: 22,
              height: 22,
              borderRadius: '50%',
              background: 'rgba(255,255,255,.22)',
              display: 'grid',
              placeItems: 'center',
              fontSize: 13,
            }}
          >
            →
          </span>
        </button>
      )}
      {secondary && (
        <button
          type="button"
          onClick={secondary.onClick}
          className="es-alt"
          style={{
            marginTop: 10,
            background: 'none',
            border: 0,
            padding: 4,
            cursor: 'pointer',
            fontFamily: 'inherit',
            fontSize: 13,
            fontWeight: 700,
            color: PINK,
          }}
        >
          {secondary.label}
        </button>
      )}
    </div>
  );
}
