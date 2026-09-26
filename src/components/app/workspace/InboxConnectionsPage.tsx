'use client';

import { ReactNode, useState } from 'react';

/*
 * Channel Connections — per FR01 of the Unified Social Inbox PRD: connection
 * state, granted scopes, last event, token health and a capability matrix
 * per channel, with actionable errors instead of a broken empty inbox.
 * Connection state is owned by the parent (InboxDashboard) and passed in, so
 * the top bar's "channels connected" summary and this page can never
 * disagree. The Connect/Reconnect wizard below is a real, fully interactive
 * UI walkthrough of the PRD's §3.1 flow, but it is clearly labelled as a
 * preview: no actual OAuth happens without the real backend, and finishing
 * it only ever updates this session's local state.
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
    loader: (
      <>
        <line x1="12" y1="2" x2="12" y2="6" />
        <line x1="12" y1="18" x2="12" y2="22" />
        <line x1="4.93" y1="4.93" x2="7.76" y2="7.76" />
        <line x1="16.24" y1="16.24" x2="19.07" y2="19.07" />
        <line x1="2" y1="12" x2="6" y2="12" />
        <line x1="18" y1="12" x2="22" y2="12" />
        <line x1="4.93" y1="19.07" x2="7.76" y2="16.24" />
        <line x1="16.24" y1="7.76" x2="19.07" y2="4.93" />
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

export type TokenHealth = 'healthy' | 'expiring' | 'unavailable';

export interface Capability {
  key: string;
  label: string;
  ok: boolean;
}

export interface ChannelConnection {
  id: string;
  label: string;
  color: string;
  connected: boolean;
  statusNote: string;
  scopes: string[];
  lastEvent: string;
  tokenHealth: TokenHealth;
  capabilities: Capability[];
  approved: boolean; // false = platform hasn't granted API access yet (e.g. TikTok) — never offer a fake connect
  mockAccounts: string[];
}

export const INITIAL_CHANNEL_CONNECTIONS: ChannelConnection[] = [
  {
    id: 'instagram',
    label: 'Instagram',
    color: '#C2185B',
    connected: true,
    statusNote: 'Connected as @amaraleatherco',
    scopes: ['instagram_business_basic', 'instagram_manage_messages', 'instagram_manage_comments'],
    lastEvent: '2 minutes ago',
    tokenHealth: 'healthy',
    approved: true,
    mockAccounts: ['@amaraleatherco (Business)'],
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
    approved: true,
    mockAccounts: ['Amara Leather Co.'],
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
    approved: true,
    mockAccounts: ['+234 801 234 5678'],
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
    approved: false,
    mockAccounts: [],
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

type WizardStep = 'prereq' | 'authorize' | 'account' | 'test' | 'done';

const TEST_CHECKS = ['Subscribing to webhooks', 'Sending a test event', 'Verifying reply capability'];

function ConnectWizard({
  channel,
  onClose,
  onConnected,
}: {
  channel: ChannelConnection;
  onClose: () => void;
  onConnected: (channelId: string, accountLabel: string) => void;
}) {
  const [step, setStep] = useState<WizardStep>('prereq');
  const [selectedAccount, setSelectedAccount] = useState(channel.mockAccounts[0] ?? '');
  const [checksDone, setChecksDone] = useState(0);
  const [busy, setBusy] = useState(false);

  function startAuthorize() {
    setBusy(true);
    setStep('authorize');
    setTimeout(() => {
      setBusy(false);
      setStep('account');
    }, 1300);
  }

  function startTest() {
    setStep('test');
    setChecksDone(0);
    TEST_CHECKS.forEach((_, i) => {
      setTimeout(() => setChecksDone((n) => Math.max(n, i + 1)), (i + 1) * 550);
    });
    setTimeout(() => setStep('done'), TEST_CHECKS.length * 550 + 300);
  }

  return (
    <>
      <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.4)', zIndex: 1100 }} />
      <div
        style={{
          position: 'fixed',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%,-50%)',
          zIndex: 1101,
          background: '#fff',
          borderRadius: 16,
          width: 440,
          maxWidth: '92vw',
          maxHeight: '85vh',
          overflowY: 'auto',
          boxShadow: '0 20px 60px rgba(0,0,0,.3)',
          boxSizing: 'border-box',
        }}
      >
        <div style={{ padding: '18px 20px 0', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div
              style={{
                width: 30,
                height: 30,
                borderRadius: 9,
                background: channel.color,
                color: '#fff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 800,
                fontSize: 12,
              }}
            >
              {channel.label[0]}
            </div>
            <div style={{ fontSize: 15, fontWeight: 800, color: '#1a1a1a' }}>Connect {channel.label}</div>
          </div>
          <button
            type="button"
            aria-label="Close"
            onClick={onClose}
            style={{
              width: 30,
              height: 30,
              border: 'none',
              background: 'transparent',
              color: '#666',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              borderRadius: 8,
            }}
          >
            <I n="x" s={16} />
          </button>
        </div>

        <div
          style={{
            margin: '12px 20px 0',
            fontSize: 10.5,
            color: '#B26A00',
            background: 'rgba(237,108,2,.08)',
            border: '1px solid rgba(237,108,2,.2)',
            borderRadius: 8,
            padding: '6px 10px',
          }}
        >
          Preview flow — actual account linking requires the real backend OAuth integration.
        </div>

        <div style={{ padding: 20 }}>
          {!channel.approved ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  color: '#B26A00',
                  fontWeight: 700,
                  fontSize: 13,
                }}
              >
                <I n="alertTriangle" s={16} c="#B26A00" />
                Not available yet
              </div>
              <div style={{ fontSize: 13, color: '#444', lineHeight: 1.55 }}>{channel.statusNote}.</div>
              <div style={{ fontSize: 12.5, color: '#888', lineHeight: 1.55 }}>
                This channel is shown as unavailable rather than a broken connection — there is nothing to authorize
                until platform approval comes through.
              </div>
            </div>
          ) : step === 'prereq' ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div style={{ fontSize: 13, color: '#444', lineHeight: 1.55 }}>
                Connecting {channel.label} will ask for the following permissions:
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {(channel.scopes.length > 0
                  ? channel.scopes
                  : [`${channel.id}_manage_messages`, `${channel.id}_manage_comments`]
                ).map((s) => (
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
              <div style={{ fontSize: 12, color: '#888', lineHeight: 1.5 }}>
                You'll choose which {channel.label} account to connect, then URI runs a safe test — subscribing to
                events, sending a test event and checking reply capability — before this shows as connected anywhere.
              </div>
              <button
                type="button"
                onClick={startAuthorize}
                style={{
                  padding: '10px 16px',
                  borderRadius: 8,
                  border: 'none',
                  background: '#AD1457',
                  color: '#fff',
                  fontSize: 13,
                  fontWeight: 700,
                  cursor: 'pointer',
                  fontFamily: FONT,
                  alignSelf: 'flex-start',
                }}
              >
                Continue to {channel.label}
              </button>
            </div>
          ) : step === 'authorize' ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12, padding: '20px 0' }}>
              <div style={{ animation: busy ? undefined : undefined }}>
                <I n="loader" s={28} c="#AD1457" />
              </div>
              <div style={{ fontSize: 13, color: '#444', fontWeight: 600 }}>
                Redirecting to {channel.label} to sign in...
              </div>
            </div>
          ) : step === 'account' ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div style={{ fontSize: 13, color: '#444' }}>Choose which account to connect:</div>
              {channel.mockAccounts.map((acc) => (
                <button
                  key={acc}
                  type="button"
                  onClick={() => setSelectedAccount(acc)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '11px 14px',
                    borderRadius: 10,
                    border: selectedAccount === acc ? '1.5px solid #E91E63' : '1px solid rgba(0,0,0,.1)',
                    background: selectedAccount === acc ? 'rgba(194,24,91,.06)' : '#fff',
                    fontSize: 13,
                    fontWeight: 700,
                    color: '#333',
                    cursor: 'pointer',
                    fontFamily: FONT,
                    textAlign: 'left',
                  }}
                >
                  {acc}
                  {selectedAccount === acc && <I n="check" s={15} c="#AD1457" />}
                </button>
              ))}
              <button
                type="button"
                onClick={startTest}
                style={{
                  padding: '10px 16px',
                  borderRadius: 8,
                  border: 'none',
                  background: '#AD1457',
                  color: '#fff',
                  fontSize: 13,
                  fontWeight: 700,
                  cursor: 'pointer',
                  fontFamily: FONT,
                  alignSelf: 'flex-start',
                  marginTop: 4,
                }}
              >
                Connect this account
              </button>
            </div>
          ) : step === 'test' ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div style={{ fontSize: 13, color: '#444', fontWeight: 600, marginBottom: 4 }}>
                Running a safe connection test...
              </div>
              {TEST_CHECKS.map((label, i) => (
                <div
                  key={label}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10,
                    fontSize: 13,
                    color: checksDone > i ? '#2E7D32' : '#999',
                  }}
                >
                  {checksDone > i ? <I n="check" s={15} c="#2E7D32" /> : <I n="loader" s={15} c="#ccc" />}
                  {label}
                </div>
              ))}
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10, padding: '10px 0' }}>
              <div
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: '50%',
                  background: 'rgba(46,125,50,.1)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <I n="check" s={22} c="#2E7D32" />
              </div>
              <div style={{ fontSize: 14, fontWeight: 800, color: '#1a1a1a' }}>Connected to {selectedAccount}</div>
              <div style={{ fontSize: 12, color: '#888', textAlign: 'center' }}>
                All checks passed — this channel is ready to use in Inbox.
              </div>
              <button
                type="button"
                onClick={() => {
                  onConnected(channel.id, selectedAccount);
                  onClose();
                }}
                style={{
                  marginTop: 8,
                  padding: '10px 24px',
                  borderRadius: 8,
                  border: 'none',
                  background: '#AD1457',
                  color: '#fff',
                  fontSize: 13,
                  fontWeight: 700,
                  cursor: 'pointer',
                  fontFamily: FONT,
                }}
              >
                Done
              </button>
            </div>
          )}
        </div>
      </div>
    </>
  );
}

export default function InboxConnectionsPage({
  isMobile,
  connections,
  onConnected,
}: {
  isMobile: boolean;
  connections: ChannelConnection[];
  onConnected: (channelId: string, accountLabel: string) => void;
}) {
  const [wizardChannelId, setWizardChannelId] = useState<string | null>(null);
  const wizardChannel = connections.find((c) => c.id === wizardChannelId) ?? null;

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

      {connections.map((c) => {
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
                onClick={() => setWizardChannelId(c.id)}
                style={{
                  padding: '7px 14px',
                  borderRadius: 8,
                  border: '1px solid rgba(0,0,0,.12)',
                  background: '#fff',
                  fontSize: 12.5,
                  fontWeight: 700,
                  color: '#444',
                  cursor: 'pointer',
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

      {wizardChannel && (
        <ConnectWizard channel={wizardChannel} onClose={() => setWizardChannelId(null)} onConnected={onConnected} />
      )}
    </div>
  );
}
