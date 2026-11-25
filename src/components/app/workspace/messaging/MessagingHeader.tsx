'use client';

import type { ReactNode } from 'react';
import { AudioLines, ChartLine, Mail, Settings, SlidersHorizontal, Users, type LucideIcon } from 'lucide-react';

export const MSG_FONT = "'Urbanist', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif";
export const MSG_PINK = '#E0156B';
export const MSG_PINK_DARK = '#C2185B';
export const MSG_BG = '#FDF5F8';
export const MSG_INK = '#1B1520';
export const MSG_MUTED = '#6D6572';
export const MSG_LINE = '#F1EBEE';

/** The Messaging sections, in the order the tabs and the sidebar show them. "settings" is
 *  the gear in the header (channels, AI usage, tags, alerts), not a tab. */
export type MessagingSection = 'inbox' | 'automations' | 'quick' | 'audience' | 'voice' | 'insights' | 'settings';

export const MESSAGING_TABS: { id: Exclude<MessagingSection, 'settings'>; label: string; icon: LucideIcon }[] = [
  { id: 'inbox', label: 'Inbox', icon: Mail },
  { id: 'automations', label: 'Automations', icon: SlidersHorizontal },
  { id: 'audience', label: 'Audience', icon: Users },
  { id: 'voice', label: 'Brand Voice', icon: AudioLines },
  { id: 'insights', label: 'Insights', icon: ChartLine },
];

export interface ConnectionsSummary {
  label: string;
  fg: string;
  bg: string;
  dot: string;
}

/** The page header and section tabs shared by every Messaging screen: the pink mail
 *  tile, "Automated Messaging", the channels pill (opens Settings › Channels), the gear
 *  (Settings) and the tabs. */
export default function MessagingHeader({
  active,
  onSelect,
  connections,
  extra,
  compact = false,
}: {
  active: MessagingSection;
  onSelect: (section: MessagingSection) => void;
  connections: ConnectionsSummary;
  /** e.g. the "customers waiting" bell, shown left of the gear */
  extra?: ReactNode;
  /** phones: smaller tile, no subtitle, the channels pill shrinks to its dot */
  compact?: boolean;
}) {
  return (
    <div style={{ fontFamily: MSG_FONT, padding: compact ? '12px 14px 4px' : '16px 24px 0', background: MSG_BG }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: compact ? 10 : 18 }}>
        <div
          style={{
            width: compact ? 38 : 44,
            height: compact ? 38 : 42,
            borderRadius: 11,
            background: MSG_PINK,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 4px 12px rgba(224,21,107,.25)',
            flexShrink: 0,
          }}
        >
          <Mail size={compact ? 19 : 21} color="#fff" strokeWidth={1.8} />
        </div>
        <div style={{ minWidth: 0 }}>
          <h1
            style={{
              margin: 0,
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              fontSize: compact ? 17 : 20,
              fontWeight: 700,
              letterSpacing: -0.3,
              color: MSG_INK,
            }}
          >
            Automated Messaging
          </h1>
          {!compact && (
            <div style={{ fontSize: 12.5, color: MSG_MUTED, marginTop: 2 }}>
              Manage conversations, automate replies and turn messages into customers.
            </div>
          )}
        </div>
        <div style={{ flex: 1 }} />
        <button
          type="button"
          onClick={() => onSelect('settings')}
          aria-label={connections.label}
          title={connections.label}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            height: 32,
            padding: compact ? '0 10px' : '0 14px',
            borderRadius: 18,
            border: 'none',
            background: connections.bg,
            color: connections.fg,
            fontSize: 12.5,
            fontWeight: 600,
            fontFamily: MSG_FONT,
            cursor: 'pointer',
            whiteSpace: 'nowrap',
          }}
        >
          <span style={{ width: 8, height: 8, borderRadius: '50%', background: connections.dot }} />
          {!compact && connections.label}
        </button>
        {extra}
        <button
          type="button"
          aria-label="Messaging settings"
          onClick={() => onSelect('settings')}
          style={{
            width: 34,
            height: 34,
            borderRadius: 9,
            border: active === 'settings' ? `2px solid ${MSG_PINK}` : '1px solid #ECE6EA',
            background: active === 'settings' ? '#FDF1F6' : '#fff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            flexShrink: 0,
          }}
        >
          <Settings size={18} color={active === 'settings' ? MSG_PINK : '#3A3240'} strokeWidth={1.8} />
        </button>
      </div>

      {/* Phones already have the app's own section menu at the top; no second tab row. */}
      {!compact && (
        <div
          role="tablist"
          style={{ display: 'flex', gap: compact ? 4 : 14, marginTop: compact ? 10 : 12, overflowX: 'auto' }}
        >
          {MESSAGING_TABS.map(({ id, label, icon: Icon }) => {
            const on = active === id;
            return (
              <button
                key={id}
                type="button"
                role="tab"
                aria-selected={on}
                onClick={() => onSelect(id)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 9,
                  height: 38,
                  padding: compact ? '0 12px' : '0 18px',
                  border: 'none',
                  borderBottom: on ? `3px solid ${MSG_PINK}` : '3px solid transparent',
                  borderRadius: '8px 8px 0 0',
                  background: on ? '#fff' : 'transparent',
                  color: on ? MSG_PINK : '#3A3240',
                  fontWeight: on ? 600 : 500,
                  fontSize: 13.5,
                  fontFamily: MSG_FONT,
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                }}
              >
                <Icon size={18} strokeWidth={1.8} />
                {label}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
