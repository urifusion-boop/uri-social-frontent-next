'use client';
/**
 * The one page header every dashboard page uses: an optional section label above (e.g. "Campaign
 * Manager", "Messaging · Insights"), the page title, a one-line description, and the page's own
 * buttons on the right. Each page keeps its own words and buttons; only the look is shared.
 */
import type { ReactNode } from 'react';

const INK = '#1A0A12';
const MUTED = '#7A7270';
const SECTION = '#B08A98';

export default function PageHeader({
  section,
  title,
  description,
  actions,
  onBack,
  titleOnClick,
  titleSuffix,
  compact = false,
  style,
}: {
  /** Small label above the title — the menu section this page lives in. */
  section?: ReactNode;
  title: ReactNode;
  description?: ReactNode;
  /** The page's own buttons, shown on the right. */
  actions?: ReactNode;
  /** Shows a small "← section" link instead of the plain section label. */
  onBack?: () => void;
  /** Makes the title a button (mobile section switcher). */
  titleOnClick?: () => void;
  /** Rendered right after the title (e.g. a chevron or a status chip). */
  titleSuffix?: ReactNode;
  /** Slightly smaller, for narrow screens. */
  compact?: boolean;
  style?: React.CSSProperties;
}) {
  const titleEl = (
    <h1
      style={{
        margin: 0,
        fontSize: compact ? 20 : 22,
        lineHeight: 1.2,
        fontWeight: 900,
        letterSpacing: -0.4,
        color: INK,
        display: 'flex',
        alignItems: 'center',
        gap: 8,
      }}
    >
      {title}
      {titleSuffix}
    </h1>
  );

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'flex-start',
        justifyContent: 'space-between',
        gap: 12,
        flexWrap: 'wrap',
        ...style,
      }}
    >
      <div style={{ minWidth: 0, flex: '1 1 260px' }}>
        {onBack ? (
          <button
            type="button"
            onClick={onBack}
            style={{
              background: 'none',
              border: 0,
              padding: 0,
              marginBottom: 3,
              cursor: 'pointer',
              fontFamily: 'inherit',
              fontSize: 12.5,
              fontWeight: 700,
              color: SECTION,
            }}
          >
            ← {section ?? 'Back'}
          </button>
        ) : (
          section && <div style={{ fontSize: 12.5, fontWeight: 700, color: SECTION, marginBottom: 3 }}>{section}</div>
        )}
        {titleOnClick ? (
          <button
            type="button"
            onClick={titleOnClick}
            style={{
              background: 'none',
              border: 0,
              padding: 0,
              cursor: 'pointer',
              fontFamily: 'inherit',
              textAlign: 'left',
            }}
          >
            {titleEl}
          </button>
        ) : (
          titleEl
        )}
        {description && (
          <p style={{ margin: '3px 0 0', fontSize: 13, color: MUTED, lineHeight: 1.45 }}>{description}</p>
        )}
      </div>
      {actions && <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>{actions}</div>}
    </div>
  );
}
