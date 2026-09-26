'use client';

import { ReactNode } from 'react';

/*
 * Channel Connections — per FR01 of the Unified Social Inbox PRD: connection
 * state, granted scopes, last event, token health and a capability matrix
 * per channel, with actionable errors instead of a broken empty inbox.
 * All data here is placeholder, standing in for the real integration status
 * this screen will read from the Unified Inbox API once it exists — the
 * Connect/Reconnect actions are inert until then, same as elsewhere in Inbox.
 */

const FONT = "'Urbanist', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif";

const I = ({ n, s = 18, c = 'currentColor' }: { n: string; s?: number; c?: string }) => {
  const p: Record<string, ReactNode> = {
    check: <polyline points="20 6 9 17 4 12" />,
    x: (
      <>
        <line x1="18" y1="6" x2="6" y2="18" />
        <line x1="6" y1="6" x2="18" y2="18" />
      </>
    ),
    alertTriangle: (
      <>
        <polygon points="12 3 22 20 2 20" />
        <line x1="12" y1="9" x2="12" y2="14" />
        <circle cx="12" cy="17" r="1" fill={c} stroke="none" />
      </>
    ),
    clock: (
      <>
        <circle cx="12" cy="12" r="9" />
        <polyline points="12 7 12 12 15.5 14" />
      </>
    ),
  };
  return (
    <svg
      width={s}
      height={s}
      viewBox="0 0 24 24"
      fill="none"
      stroke={c}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      style={{ flexShrink: 0, display: 'block' }}
    >
      {p[n]}
    </svg>
  );
};

type TokenHealth = 'healthy' | 'expiring' | 'unavailable';

interface Capability {
  key: string;
  label: string;
  ok: boolean;
}

interface ChannelConnection {
  id: string;
  label: string;
  color: string;
  connected: boolean;
  statusNote: string;
  scopes: string[];
  lastEvent: string;
  tokenHealth: TokenHealth;
  capabilities: Capability[];
}

const CONNECTIONS: ChannelConnection[] = [
  {
    id: 'instagram',
    label: 'Instagram',
    color: '#C2185B',
    connected: true,
    statusNote: 'Connected as @amaraleatherco',
    scopes: ['instagram_business_basic', 'instagram_manage_messages', 'instagram_manage_comments'],
    lastEvent: '2 minutes ago',
    tokenHealth: 'healthy',
    capabilities: [
      { key: 'receiveDM', label: 'Receive DMs', ok: true },
      { key: 'sendDM', label: 'Send DMs', ok: true },
      { key: 'receiveComment', label: 'Receive comments', ok: true },
      { key: 'replyComment', label: 'Reply to comments', ok: true },
      { key: 'fetchHistory', label: 'Fetch history', ok: true },
    ],
  },
  {
    id: 'facebook',
    label: 'Facebook',
    color: '#1877F2',
    connected: true,
    statusNote: 'Connected — Amara Leather Co. Page',
    scopes: ['pages_messaging', 'pages_manage_metadata', 'pages_read_engagement'],
    lastEvent: '18 minutes ago',
    tokenHealth: 'expiring',
    capabilities: [
      { key: 'receiveDM', label: 'Receive DMs', ok: true },
      { key: 'sendDM', label: 'Send DMs', ok: true },
      { key: 'receiveComment', label: 'Receive comments', ok: true },
      { key: 'replyComment', label: 'Reply to comments', ok: true },
      { key: 'fetchHistory', label: 'Fetch history', ok: true },
    ],
  },
  {
    id: 'whatsapp',
    label: 'WhatsApp',
    color: '#25D366',
    connected: true,
    statusNote: 'Connected — +234 801 234 5678 (Cloud API)',
    scopes: ['whatsapp_business_messaging', 'whatsapp_business_management'],
    lastEvent: '1 minute ago',
    tokenHealth: 'healthy',
    capabilities: [
      { key: 'receiveDM', label: 'Receive messages', ok: true },
      { key: 'sendDM', label: 'Send messages', ok: true },
      { key: 'sendTemplate', label: 'Send template (outside 24h window)', ok: true },
      { key: 'fetchHistory', label: 'Fetch history', ok: false },
    ],
  },
  {
    id: 'tiktok',
    label: 'TikTok',
    color: '#111111',
    connected: false,
    statusNote: 'Not connected — Messaging Partner approval pending',
    scopes: [],
    lastEvent: '—',
    tokenHealth: 'unavailable',
    capabilities: [
      { key: 'receiveDM', label: 'Receive DMs', ok: false },
      { key: 'sendDM', label: 'Send DMs', ok: false },
      { key: 'receiveComment', label: 'Receive comments', ok: false },
      { key: 'replyComment', label: 'Reply to comments', ok: false },
    ],
  },
];

const HEALTH_META: Record<TokenHealth, { label: string; fg: string; bg: string; icon: string }> = {
  healthy: { label: 'Token healthy', fg: '#2E7D32', bg: 'rgba(46,125,50,.1)', icon: 'check' },
  expiring: { label: 'Token expiring soon', fg: '#B26A00', bg: 'rgba(237,108,2,.1)', icon: 'alertTriangle' },
  unavailable: { label: 'No token', fg: '#888', bg: 'rgba(0,0,0,.05)', icon: 'x' },
};

export default function InboxConnectionsPage({ isMobile }: { isMobile: boolean }) {
  return (
    <div
      style={{
        padding: isMobile ? 14 : 24,
        display: 'flex',
        flexDirection: 'column',
        gap: 16,
        maxWidth: 880,
        margin: '0 auto',
        boxSizing: 'border-box',
      }}
    >
      <div style={{ fontSize: 13, color: '#666', lineHeight: 1.5 }}>
        A channel only shows as connected here once real inbound events, history and replies have been verified end to
        end — never a partial setup pretending to work.
      </div>

      {CONNECTIONS.map((c) => {
        const health = HEALTH_META[c.tokenHealth];
        return (
          <div
            key={c.id}
            style={{ background: '#fff', border: '1px solid rgba(0,0,0,.08)', borderRadius: 14, overflow: 'hidden' }}
          >
            <div
              style={{
                padding: isMobile ? '14px 16px' : '16px 20px',
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                flexWrap: 'wrap',
              }}
            >
              <div
                style={{
                  width: 34,
                  height: 34,
                  borderRadius: 10,
                  background: c.color,
                  color: '#fff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 800,
                  fontSize: 13,
                  flex: '0 0 auto',
                }}
              >
                {c.label[0]}
              </div>
              <div style={{ flex: 1, minWidth: 160 }}>
                <div style={{ fontSize: 14.5, fontWeight: 800, color: '#1a1a1a' }}>{c.label}</div>
                <div style={{ fontSize: 12, color: c.connected ? '#2E7D32' : '#999', marginTop: 2 }}>
                  {c.statusNote}
                </div>
              </div>
              <span
                style={{
                  fontSize: 11,
                  fontWeight: 700,
                  padding: '4px 10px',
                  borderRadius: 12,
                  background: c.connected ? 'rgba(46,125,50,.1)' : 'rgba(0,0,0,.06)',
                  color: c.connected ? '#2E7D32' : '#777',
                  whiteSpace: 'nowrap',
                }}
              >
                {c.connected ? 'Connected' : 'Not connected'}
              </span>
              <button
                type="button"
                title="Coming soon"
                style={{
                  padding: '7px 14px',
                  borderRadius: 8,
                  border: '1px solid rgba(0,0,0,.12)',
                  background: '#fff',
                  fontSize: 12.5,
                  fontWeight: 700,
                  color: '#444',
                  cursor: 'default',
                  fontFamily: FONT,
                  flex: '0 0 auto',
                }}
              >
                {c.connected ? 'Reconnect' : 'Connect'}
              </button>
            </div>

            <div
              style={{
                padding: isMobile ? '0 16px 16px' : '0 20px 20px',
                display: 'flex',
                flexDirection: 'column',
                gap: 12,
              }}
            >
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, fontSize: 12, color: '#666' }}>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                    padding: '4px 10px',
                    borderRadius: 10,
                    background: health.bg,
                    color: health.fg,
                    fontWeight: 700,
                  }}
                >
                  <I n={health.icon} s={12} c={health.fg} />
                  {health.label}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <I n="clock" s={13} c="#999" />
                  Last event: {c.lastEvent}
                </div>
              </div>

              {c.scopes.length > 0 && (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                  {c.scopes.map((s) => (
                    <span
                      key={s}
                      style={{
                        fontSize: 10.5,
                        fontWeight: 600,
                        color: '#666',
                        background: '#f4f4f5',
                        borderRadius: 8,
                        padding: '3px 8px',
                      }}
                    >
                      {s}
                    </span>
                  ))}
                </div>
              )}

              <div>
                <div
                  style={{
                    fontSize: 11,
                    fontWeight: 800,
                    letterSpacing: '.04em',
                    textTransform: 'uppercase',
                    color: '#999',
                    marginBottom: 6,
                  }}
                >
                  Capabilities
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: 6 }}>
                  {c.capabilities.map((cap) => (
                    <div
                      key={cap.key}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 8,
                        fontSize: 12.5,
                        color: cap.ok ? '#333' : '#bbb',
                      }}
                    >
                      <I n={cap.ok ? 'check' : 'x'} s={13} c={cap.ok ? '#2E7D32' : '#ccc'} />
                      {cap.label}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
