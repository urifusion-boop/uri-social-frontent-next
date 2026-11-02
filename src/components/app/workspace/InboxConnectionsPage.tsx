'use client';

import { ReactNode, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { InboxService } from '@/src/api/InboxService';
import { SocialAccountService } from '@/src/api/SocialAccountService';
import { SocialMediaAgentService } from '@/src/api/SocialMediaAgentService';
import { ToastService } from '@/src/utils/toast.util';
import { ToastTypeEnum } from '@/src/models/enum-models/ToastTypeEnum';
import { WhatsAppConnect } from './WhatsAppConnect';

/*
 * Channel Connections — per FR01 of the Unified Social Inbox PRD: connection
 * state, granted scopes, last event, token health and a capability matrix
 * per channel, with actionable errors instead of a broken empty inbox.
 * Connection state is owned by the parent (InboxDashboard) and passed in, so
 * the top bar's "channels connected" summary and this page can never
 * disagree. Instagram and Facebook connect straight to Meta from here: the inbox
 * needs the Page's own token, which a connection made through Outstand never has.
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
  warning?: string; // an account here has dropped and must be reconnected to receive messages
}

// The channels the product can speak to. Everything about whether one is
// actually connected comes from the API — this only fixes the labels and the
// order, so a channel nobody connected cannot render as connected.
const CHANNEL_SHELLS: {
  id: string;
  label: string;
  color: string;
  approved: boolean;
  capabilities: Capability[];
}[] = [
  {
    id: 'instagram',
    label: 'Instagram',
    color: '#C2185B',
    approved: true,
    capabilities: [
      { key: 'receiveDM', label: 'Receive DMs', ok: true },
      { key: 'sendDM', label: 'Send DMs', ok: true },
      { key: 'receiveComment', label: 'Receive comments', ok: true },
      { key: 'replyComment', label: 'Reply to comments', ok: true },
    ],
  },
  {
    id: 'facebook',
    label: 'Facebook',
    color: '#1877F2',
    approved: true,
    capabilities: [
      { key: 'receiveDM', label: 'Receive DMs', ok: true },
      { key: 'sendDM', label: 'Send DMs', ok: true },
      { key: 'receiveComment', label: 'Receive comments', ok: true },
      { key: 'replyComment', label: 'Reply to comments', ok: true },
    ],
  },
  {
    id: 'whatsapp',
    label: 'WhatsApp',
    color: '#25D366',
    approved: true,
    capabilities: [
      { key: 'receiveDM', label: 'Receive messages', ok: true },
      { key: 'sendDM', label: 'Reply within 24 hours', ok: true },
      { key: 'templates', label: 'Templates after 24 hours', ok: true },
    ],
  },
];

function timeAgo(iso: string | null): string {
  if (!iso) return 'No events yet';
  const zoned = /[zZ]|[+-]\d{2}:?\d{2}$/.test(iso) ? iso : `${iso}Z`;
  const mins = Math.floor((Date.now() - new Date(zoned).getTime()) / 60000);
  if (Number.isNaN(mins)) return 'No events yet';
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins} minutes ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours} hours ago`;
  return `${Math.floor(hours / 24)} days ago`;
}

// An unconnected channel keeps its capability list, greyed out — the list says
// what the channel WOULD do, and `connected` says whether it does.
export function channelsFromApi(
  rows: {
    platform: string;
    name: string;
    external_account_id: string;
    has_token: boolean;
    last_event_at: string | null;
    needs_reconnect?: boolean;
    subscription_ok?: boolean | null;
    subscription_issue?: { code: string; message: string } | null;
  }[]
): ChannelConnection[] {
  return CHANNEL_SHELLS.map((shell) => {
    const all = rows.filter((r) => r.platform === shell.id);
    // A Page Meta refused to subscribe delivers nothing, however healthy the token looks.
    const blocked = (r: (typeof all)[number]) => r.needs_reconnect || r.subscription_ok === false;
    const live = all.filter((r) => !blocked(r));
    const stale = all.filter(blocked);
    // A live account wins; one left over from an old connection is named as needing
    // a reconnect rather than shown as working.
    const row = live[0] ?? stale[0];
    const connected = live.length > 0;
    const names = (list: typeof all) =>
      list
        .map((r) => r.name)
        .filter(Boolean)
        .join(', ');
    let statusNote = 'Not connected';
    if (connected) statusNote = `Connected — ${names(live) || shell.label}`;
    else if (stale.length) statusNote = 'Reconnect needed';
    const who = names(stale) || 'that account';
    const blockedReason = stale.find((r) => r.subscription_ok === false && !r.needs_reconnect)?.subscription_issue
      ?.message;
    const warning = blockedReason
      ? blockedReason
      : stale.length
        ? shell.id === 'instagram'
          ? `${who} has disconnected, so its messages aren't reaching this inbox. Log in to instagram.com as ${who}, then click Reconnect.`
          : `${who} has disconnected, so its messages aren't reaching this inbox. Click Reconnect and choose the ${who} Page.`
        : '';
    return {
      ...shell,
      connected,
      statusNote,
      warning,
      // Scopes are granted by Meta, not knowable from our own records, so we do
      // not print a list that might be wrong.
      scopes: [],
      lastEvent: row ? timeAgo(row.last_event_at) : '—',
      tokenHealth: !row || !connected ? 'unavailable' : row.has_token ? 'healthy' : 'unavailable',
      capabilities: shell.capabilities.map((c) => ({ ...c, ok: connected })),
    };
  });
}

export const INITIAL_CHANNEL_CONNECTIONS: ChannelConnection[] = channelsFromApi([]);

// What actually stops messages arriving once a channel is connected — each one a
// setting the business controls on Meta's side, not something Uri can fix for them.
const TROUBLESHOOTING: Record<string, { title: string; detail: string }[]> = {
  instagram: [
    {
      title: 'Allow access to messages',
      detail:
        'In the Instagram app on your business account: Settings → Messages and story replies → Message controls → Connected tools → turn on "Allow access to messages".',
    },
    {
      title: 'Use a Professional account linked to your Facebook Page',
      detail:
        'Instagram messages reach Uri through the Facebook Page the account is linked to. Switch to a Business or Creator account and link it to your Page in Instagram settings or Meta Business Suite.',
    },
    {
      title: 'Reconnect and allow every permission',
      detail:
        "If you unticked anything on the Facebook permission screen, messages can't be delivered. Click Reconnect and leave every permission switched on.",
    },
  ],
  facebook: [
    {
      title: 'Reconnect and allow every permission',
      detail:
        "If you unticked anything on the Facebook permission screen, messages can't be delivered. Click Reconnect, choose your Page, and leave every permission switched on.",
    },
    {
      title: 'Make sure you have full control of the Page',
      detail:
        'You need full control (admin access) of the Page. If someone else manages it, ask them to make you an admin, then reconnect.',
    },
    {
      title: 'Check messaging is turned on for the Page',
      detail:
        'In Meta Business Suite → Inbox, make sure people can message your Page, and that no other app has been set to handle its messages.',
    },
  ],
};

function TroubleshootPanel({ channelId, defaultOpen }: { channelId: string; defaultOpen: boolean }) {
  const [open, setOpen] = useState(defaultOpen);
  const steps = TROUBLESHOOTING[channelId];
  if (!steps) return null;
  return (
    <div style={{ borderTop: '1px solid rgba(0,0,0,.06)', paddingTop: 12 }}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 6,
          padding: 0,
          border: 'none',
          background: 'none',
          fontSize: 12.5,
          fontWeight: 700,
          color: '#AD1457',
          cursor: 'pointer',
          fontFamily: FONT,
        }}
      >
        <I n="alertTriangle" s={13} c="#AD1457" />
        Not receiving messages?
        <span style={{ fontWeight: 500, color: '#999' }}>{open ? 'Hide' : 'Show fixes'}</span>
      </button>
      {open && (
        <ol style={{ margin: '10px 0 0', paddingLeft: 20, display: 'flex', flexDirection: 'column', gap: 8 }}>
          {steps.map((step) => (
            <li key={step.title} style={{ fontSize: 12.5, color: '#333', lineHeight: 1.5 }}>
              <span style={{ fontWeight: 700 }}>{step.title}.</span> {step.detail}
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}

const HEALTH_META: Record<TokenHealth, { label: string; fg: string; bg: string; icon: string }> = {
  healthy: { label: 'Token healthy', fg: '#2E7D32', bg: 'rgba(46,125,50,.1)', icon: 'check' },
  expiring: { label: 'Token expiring soon', fg: '#B26A00', bg: 'rgba(237,108,2,.1)', icon: 'alertTriangle' },
  unavailable: { label: 'No token', fg: '#888', bg: 'rgba(0,0,0,.05)', icon: 'x' },
};

// Meta's own sign-in, through URI's app, asking for the messaging permissions. Meta returns
// here (?tab=messages&view=connections&connected=…), and this page finishes the connection.
function connectDirect(channelId: string) {
  const apiBase = process.env.NEXT_PUBLIC_URI_API_BASE_URL?.replace(/\/$/, '') ?? '';
  const flow = channelId === 'instagram' ? 'instagram-direct' : 'facebook-direct';
  window.location.href = `${apiBase}/social-media/connect/${flow}/initiate?source=inbox`;
}

type IgCandidate = { ig_user_id: string; page_name?: string; username?: string };

const INBOX_CONNECTIONS_URL = '/workspace/?tab=messages&view=connections';

export default function InboxConnectionsPage({
  isMobile,
  connections,
  onConnected,
  onChannelsChanged,
}: {
  isMobile: boolean;
  connections: ChannelConnection[];
  onConnected: (channelId: string, accountLabel: string) => void;
  onChannelsChanged: () => void;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [whatsAppOpen, setWhatsAppOpen] = useState(false);
  const [igPendingToken, setIgPendingToken] = useState<string | null>(null);
  const [igCandidates, setIgCandidates] = useState<IgCandidate[]>([]);
  const [igSelected, setIgSelected] = useState<Set<string>>(new Set());
  const [finishing, setFinishing] = useState(false);

  // Subscribing the Page is what makes Meta deliver messages, and Meta can refuse it
  // (no full control of the Page, a permission left off) — say so right away.
  const afterConnect = async (label: string) => {
    ToastService.showToast(`${label} connected`, ToastTypeEnum.Success);
    try {
      const res = await InboxService.resubscribeChannels();
      const issue = res.subscriptions.find((sub) => !sub.subscribed)?.issue;
      if (issue) ToastService.showToast(issue.message, ToastTypeEnum.Error);
    } catch {
      /* the cards below still show each Page's state */
    }
    onChannelsChanged();
  };

  const finish = async (run: () => Promise<{ status?: boolean }>, label: string) => {
    setFinishing(true);
    try {
      const res = await run();
      if (res.status) await afterConnect(label);
      else ToastService.showToast(`${label} could not be connected. Please try again.`, ToastTypeEnum.Error);
    } catch {
      ToastService.showToast(`${label} could not be connected. Please try again.`, ToastTypeEnum.Error);
    } finally {
      setFinishing(false);
    }
  };

  useEffect(() => {
    const connected = searchParams?.get('connected');
    if (!connected) return;
    const param = (key: string) => searchParams?.get(key) ?? '';
    router.replace(INBOX_CONNECTIONS_URL);
    if (connected === 'instagram_direct' && param('ig_user_id')) {
      finish(
        () => SocialAccountService.finalizeInstagramDirect(param('ig_user_id')),
        `Instagram @${param('username') || 'account'}`
      );
    } else if (connected === 'facebook_direct' && param('fb_page_id')) {
      finish(
        () => SocialAccountService.finalizeFacebookDirect(param('fb_page_id')),
        param('page_name') || 'Facebook Page'
      );
    } else if (connected === 'instagram_pending' && param('token')) {
      const token = param('token');
      SocialMediaAgentService.getInstagramDirectPending(token)
        .then((res) => {
          const candidates = res.responseData?.candidates ?? [];
          if (!res.status || candidates.length === 0) throw new Error();
          setIgPendingToken(token);
          setIgCandidates(candidates);
          setIgSelected(new Set(candidates.map((c) => c.ig_user_id)));
        })
        .catch(() =>
          ToastService.showToast('Could not load your Instagram accounts. Please try again.', ToastTypeEnum.Error)
        );
    } else if (connected === 'false') {
      ToastService.showToast(
        `Meta didn't finish connecting${param('error') ? `: ${param('error')}` : ''}. Please try again.`,
        ToastTypeEnum.Error
      );
    }
  }, [searchParams]); // eslint-disable-line react-hooks/exhaustive-deps

  const connectPickedInstagram = async () => {
    if (!igPendingToken || igSelected.size === 0) return;
    const ids = Array.from(igSelected);
    await finish(
      () => SocialMediaAgentService.finalizeInstagramDirectPending(igPendingToken, ids),
      ids.length > 1 ? `${ids.length} Instagram accounts` : 'Instagram account'
    );
    setIgPendingToken(null);
    setIgCandidates([]);
  };

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
        Connect Instagram and Facebook here with your Meta login so their messages and comments reach this inbox. Use
        the account that has full control of your Facebook Page. WhatsApp is connected here too.
      </div>

      {igPendingToken && (
        <div
          style={{
            background: '#fff',
            border: '1px solid rgba(194,24,91,.3)',
            borderRadius: 14,
            padding: isMobile ? 14 : 20,
            display: 'flex',
            flexDirection: 'column',
            gap: 10,
          }}
        >
          <div style={{ fontSize: 14.5, fontWeight: 800, color: '#1a1a1a' }}>
            Choose which Instagram accounts to connect
          </div>
          <div style={{ fontSize: 12.5, color: '#666' }}>
            More than one of your Facebook Pages has an Instagram account linked to it.
          </div>
          {igCandidates.map((cand) => {
            const on = igSelected.has(cand.ig_user_id);
            return (
              <label
                key={cand.ig_user_id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  padding: '10px 12px',
                  borderRadius: 10,
                  border: on ? '1.5px solid #E91E63' : '1px solid rgba(0,0,0,.1)',
                  cursor: 'pointer',
                  fontSize: 13,
                }}
              >
                <input
                  type="checkbox"
                  checked={on}
                  onChange={() =>
                    setIgSelected((prev) => {
                      const next = new Set(prev);
                      if (next.has(cand.ig_user_id)) next.delete(cand.ig_user_id);
                      else next.add(cand.ig_user_id);
                      return next;
                    })
                  }
                />
                <span style={{ fontWeight: 700, color: '#333' }}>@{cand.username || cand.ig_user_id}</span>
                {cand.page_name && <span style={{ color: '#999' }}>via {cand.page_name}</span>}
              </label>
            );
          })}
          <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
            <button
              type="button"
              disabled={finishing || igSelected.size === 0}
              onClick={connectPickedInstagram}
              style={{
                padding: '9px 16px',
                borderRadius: 8,
                border: 'none',
                background: '#AD1457',
                color: '#fff',
                fontSize: 13,
                fontWeight: 700,
                cursor: finishing || igSelected.size === 0 ? 'default' : 'pointer',
                opacity: finishing || igSelected.size === 0 ? 0.6 : 1,
                fontFamily: FONT,
              }}
            >
              {finishing ? 'Connecting…' : `Connect ${igSelected.size} account${igSelected.size === 1 ? '' : 's'}`}
            </button>
            <button
              type="button"
              onClick={() => setIgPendingToken(null)}
              style={{
                border: 'none',
                background: 'none',
                color: '#999',
                fontSize: 13,
                cursor: 'pointer',
                fontFamily: FONT,
              }}
            >
              Cancel
            </button>
          </div>
        </div>
      )}

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
                <div
                  style={{
                    fontSize: 12,
                    color: c.connected ? '#2E7D32' : c.warning ? '#B26A00' : '#999',
                    marginTop: 2,
                  }}
                >
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
                onClick={() => (c.id === 'whatsapp' ? setWhatsAppOpen(true) : connectDirect(c.id))}
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
              {c.warning && (
                <div
                  style={{
                    display: 'flex',
                    gap: 10,
                    alignItems: 'center',
                    flexWrap: 'wrap',
                    background: '#FFF7E6',
                    border: '1px solid #F5D9A8',
                    borderRadius: 10,
                    padding: '10px 12px',
                    fontSize: 12.5,
                    color: '#7A4B00',
                  }}
                >
                  <span style={{ flex: 1, minWidth: 220 }}>
                    <strong>Reconnect needed.</strong> {c.warning}
                  </span>
                  <button
                    type="button"
                    onClick={() => connectDirect(c.id)}
                    style={{
                      background: '#B26A00',
                      color: '#fff',
                      border: 'none',
                      borderRadius: 8,
                      padding: '7px 14px',
                      fontWeight: 700,
                      fontSize: 12.5,
                      cursor: 'pointer',
                      fontFamily: FONT,
                    }}
                  >
                    Reconnect
                  </button>
                </div>
              )}
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

              {c.connected && <TroubleshootPanel channelId={c.id} defaultOpen={c.lastEvent === 'No events yet'} />}
            </div>
          </div>
        );
      })}

      {whatsAppOpen && (
        <WhatsAppConnect
          onClose={() => setWhatsAppOpen(false)}
          onConnected={(label) => {
            setWhatsAppOpen(false);
            onConnected('whatsapp', label);
          }}
        />
      )}
    </div>
  );
}
