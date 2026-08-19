'use client';

/**
 * Escalations Page — customer-care replies to Jane-on-WhatsApp conversations Jane
 * couldn't answer from operational_facts. Reply here (or via the email deep-link
 * that lands on this same page, or directly from the WhatsApp Business phone app
 * under Coexistence) all land in the exact same WhatsApp chat thread the customer
 * already sees — WhatsApp has no concept of separate chats for the same two phone
 * numbers, so it doesn't matter which channel replied.
 */

import { useCallback, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/src/providers/AuthProvider';
import { EscalationService, EscalationConversation, EscalationDetail } from '@/src/api/EscalationService';

const I = ({ n, s = 18, c = 'currentColor' }: { n: string; s?: number; c?: string }) => {
  const paths: Record<string, React.ReactNode> = {
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
    send: (
      <>
        <line x1="22" y1="2" x2="11" y2="13" />
        <polygon points="22 2 15 22 11 13 2 9 22 2" />
      </>
    ),
    check: <polyline points="20 6 9 17 4 12" />,
    inbox: (
      <>
        <polyline points="22 12 16 12 14 15 10 15 8 12 2 12" />
        <path d="M5.45 5.11L2 12v6a2 2 0 002 2h16a2 2 0 002-2v-6l-3.45-6.89A2 2 0 0016.76 4H7.24a2 2 0 00-1.79 1.11z" />
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
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      style={{ flexShrink: 0 }}
    >
      {paths[n]}
    </svg>
  );
};

const CHANNEL_LABEL: Record<string, string> = {
  dashboard: 'Dashboard',
  email: 'Email',
  whatsapp_echo: 'WhatsApp',
};

interface EscalationsPageProps {
  onBack: () => void;
}

export default function EscalationsPage({ onBack }: EscalationsPageProps) {
  const { isSupportUser, isSupportStatusPending } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();

  const [conversations, setConversations] = useState<EscalationConversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [stateFilter, setStateFilter] = useState<'escalated' | 'all'>('escalated');
  const [selected, setSelected] = useState<EscalationDetail | null>(null);
  const [replyText, setReplyText] = useState('');
  const [sending, setSending] = useState(false);
  const [resolving, setResolving] = useState(false);
  const [message, setMessage] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);

  useEffect(() => {
    if (!isSupportStatusPending && !isSupportUser) {
      router.push('/workspace');
    }
  }, [isSupportUser, isSupportStatusPending, router]);

  const loadConversations = useCallback(async () => {
    try {
      setLoading(true);
      const data = await EscalationService.getEscalations({
        state: stateFilter === 'all' ? undefined : stateFilter,
        limit: 50,
      });
      setConversations(data.conversations);
    } catch (error) {
      console.error('Failed to load escalations:', error);
    } finally {
      setLoading(false);
    }
  }, [stateFilter]);

  useEffect(() => {
    loadConversations();
  }, [loadConversations]);

  const openConversation = useCallback(async (conversationId: string) => {
    try {
      const detail = await EscalationService.getEscalationDetail(conversationId);
      setSelected(detail);
      setReplyText('');
      setMessage(null);
    } catch (error) {
      console.error('Failed to load conversation detail:', error);
    }
  }, []);

  // Email deep-link support: ?tab=escalations&conversation={id} opens straight to
  // that conversation once the list has loaded.
  useEffect(() => {
    const conversationParam = searchParams?.get('conversation');
    if (conversationParam) {
      openConversation(conversationParam);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  const handleSendReply = async () => {
    if (!selected || !replyText.trim()) return;
    setSending(true);
    setMessage(null);
    try {
      const idempotencyKey = crypto.randomUUID();
      await EscalationService.sendReply(selected.id, replyText.trim(), idempotencyKey);
      const refreshed = await EscalationService.getEscalationDetail(selected.id);
      setSelected(refreshed);
      setReplyText('');
      setMessage({ type: 'ok', text: 'Reply sent.' });
      loadConversations();
    } catch (error: unknown) {
      console.error('Failed to send reply:', error);
      const detail = (error as { response?: { data?: { detail?: string } } })?.response?.data?.detail;
      setMessage({ type: 'err', text: detail || 'Failed to send reply.' });
    } finally {
      setSending(false);
    }
  };

  const handleResolveWithoutReply = async () => {
    if (!selected) return;
    if (
      !window.confirm(
        'Mark this conversation resolved without sending a reply? Use this only if you already handled it another way (phone call, in person).'
      )
    ) {
      return;
    }
    setResolving(true);
    setMessage(null);
    try {
      await EscalationService.resolveEscalation(selected.id);
      const refreshed = await EscalationService.getEscalationDetail(selected.id);
      setSelected(refreshed);
      setMessage({ type: 'ok', text: 'Marked resolved.' });
      loadConversations();
    } catch (error) {
      console.error('Failed to resolve conversation:', error);
      setMessage({ type: 'err', text: 'Failed to resolve conversation.' });
    } finally {
      setResolving(false);
    }
  };

  const formatTimestamp = (epochSeconds?: number) => {
    if (!epochSeconds) return 'N/A';
    return new Date(epochSeconds * 1000).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });
  };

  if (isSupportStatusPending || !isSupportUser) {
    return null;
  }

  return (
    <div
      style={{
        width: '100%',
        height: '100vh',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        background: '#fafafa',
      }}
    >
      {/* Header */}
      <div
        style={{
          padding: '20px 32px',
          borderBottom: '1px solid rgba(0,0,0,.08)',
          background: 'white',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexShrink: 0,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <button
            onClick={onBack}
            style={{
              background: 'white',
              border: '1px solid rgba(0,0,0,.08)',
              borderRadius: 8,
              width: 36,
              height: 36,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
            }}
          >
            ←
          </button>
          <div>
            <h1 style={{ fontSize: 24, fontWeight: 800, margin: 0, color: '#1a1a1a' }}>Escalations</h1>
            <p style={{ fontSize: 13, color: '#666', margin: '4px 0 0' }}>
              Customer questions Jane couldn&apos;t answer
            </p>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          {(['escalated', 'all'] as const).map((f) => (
            <button
              key={f}
              onClick={() => setStateFilter(f)}
              style={{
                background: stateFilter === f ? 'rgba(194,24,91,.08)' : 'white',
                color: stateFilter === f ? '#AD1457' : '#666',
                border: `1px solid ${stateFilter === f ? 'rgba(194,24,91,.2)' : 'rgba(0,0,0,.08)'}`,
                borderRadius: 8,
                padding: '8px 16px',
                fontSize: 12,
                fontWeight: 700,
                cursor: 'pointer',
                textTransform: 'capitalize',
              }}
            >
              {f === 'escalated' ? 'Needs Reply' : 'All'}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div style={{ flex: 1, overflow: 'auto', padding: 32 }}>
        {loading ? (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 300 }}>
            <I n="loader" s={24} c="#AD1457" />
          </div>
        ) : conversations.length === 0 ? (
          <div
            style={{
              background: 'white',
              border: '1px solid rgba(0,0,0,.08)',
              borderRadius: 12,
              padding: 48,
              textAlign: 'center',
            }}
          >
            <I n="inbox" s={40} c="#ccc" />
            <p style={{ fontSize: 14, color: '#999', marginTop: 16 }}>
              {stateFilter === 'escalated' ? 'No conversations waiting on a reply.' : 'No conversations yet.'}
            </p>
          </div>
        ) : (
          <div
            style={{ background: 'white', border: '1px solid rgba(0,0,0,.08)', borderRadius: 12, overflow: 'hidden' }}
          >
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: 'rgba(0,0,0,.02)', borderBottom: '1px solid rgba(0,0,0,.08)' }}>
                    <th
                      style={{ padding: '12px 16px', textAlign: 'left', fontSize: 12, fontWeight: 700, color: '#666' }}
                    >
                      Status
                    </th>
                    <th
                      style={{ padding: '12px 16px', textAlign: 'left', fontSize: 12, fontWeight: 700, color: '#666' }}
                    >
                      Reason
                    </th>
                    <th
                      style={{ padding: '12px 16px', textAlign: 'left', fontSize: 12, fontWeight: 700, color: '#666' }}
                    >
                      Last activity
                    </th>
                    <th
                      style={{
                        padding: '12px 16px',
                        textAlign: 'center',
                        fontSize: 12,
                        fontWeight: 700,
                        color: '#666',
                      }}
                    >
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {conversations.map((c) => (
                    <tr key={c.id} style={{ borderBottom: '1px solid rgba(0,0,0,.04)' }}>
                      <td style={{ padding: '12px 16px' }}>
                        <span
                          style={{
                            fontSize: 11,
                            fontWeight: 700,
                            padding: '3px 9px',
                            borderRadius: 6,
                            textTransform: 'uppercase',
                            color: c.state === 'escalated' ? '#C62828' : '#2E7D32',
                            background: c.state === 'escalated' ? 'rgba(198,40,40,.08)' : 'rgba(46,125,50,.08)',
                          }}
                        >
                          {c.state.replace('_', ' ')}
                        </span>
                      </td>
                      <td style={{ padding: '12px 16px', fontSize: 13, color: '#1a1a1a' }}>
                        {c.escalated_reason || '—'}
                      </td>
                      <td style={{ padding: '12px 16px', fontSize: 13, color: '#666' }}>
                        {formatTimestamp(c.last_message_at)}
                      </td>
                      <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                        <button
                          onClick={() => openConversation(c.id)}
                          style={{
                            background: 'rgba(194,24,91,.08)',
                            border: '1px solid rgba(194,24,91,.2)',
                            borderRadius: 6,
                            padding: '6px 12px',
                            fontSize: 12,
                            fontWeight: 700,
                            color: '#AD1457',
                            cursor: 'pointer',
                          }}
                        >
                          View
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Detail / reply modal */}
      {selected && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0,0,0,.4)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
            padding: 20,
          }}
          onClick={() => setSelected(null)}
        >
          <div
            style={{
              background: 'white',
              borderRadius: 16,
              maxWidth: 640,
              width: '100%',
              maxHeight: '85vh',
              overflow: 'hidden',
              display: 'flex',
              flexDirection: 'column',
              boxShadow: '0 20px 60px rgba(0,0,0,.3)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div
              style={{
                padding: 20,
                borderBottom: '1px solid rgba(0,0,0,.08)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <div>
                <h2 style={{ fontSize: 16, fontWeight: 800, margin: 0, color: '#1a1a1a' }}>Conversation</h2>
                <p style={{ fontSize: 12, color: '#666', margin: '4px 0 0' }}>
                  {selected.state.replace('_', ' ')}
                  {selected.resolved_via
                    ? ` · resolved via ${CHANNEL_LABEL[selected.resolved_via] || selected.resolved_via}`
                    : ''}
                </p>
              </div>
              <button
                onClick={() => setSelected(null)}
                style={{
                  background: 'rgba(0,0,0,.04)',
                  border: 'none',
                  borderRadius: 8,
                  width: 32,
                  height: 32,
                  cursor: 'pointer',
                }}
              >
                ✕
              </button>
            </div>

            <div style={{ flex: 1, overflow: 'auto', padding: 20, display: 'flex', flexDirection: 'column', gap: 10 }}>
              {selected.messages.map((m, i) => {
                const fromCustomer = m.role === 'customer';
                return (
                  <div key={i} style={{ display: 'flex', justifyContent: fromCustomer ? 'flex-start' : 'flex-end' }}>
                    <div
                      style={{
                        maxWidth: '75%',
                        padding: '10px 14px',
                        borderRadius: 12,
                        background: fromCustomer ? 'rgba(0,0,0,.04)' : 'rgba(194,24,91,.08)',
                        color: '#1a1a1a',
                        fontSize: 13,
                      }}
                    >
                      <div>{m.body}</div>
                      <div style={{ fontSize: 10, color: '#999', marginTop: 4 }}>
                        {m.role === 'customer'
                          ? 'Customer'
                          : m.role === 'jane'
                            ? 'Jane'
                            : `Agent${m.agent_email ? ` · ${m.agent_email}` : ''}`}
                        {m.channel ? ` · ${CHANNEL_LABEL[m.channel] || m.channel}` : ''}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {selected.state === 'escalated' && (
              <div
                style={{
                  padding: 20,
                  borderTop: '1px solid rgba(0,0,0,.08)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 10,
                }}
              >
                <textarea
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  placeholder="Type a reply — it will be sent to the customer on WhatsApp"
                  rows={3}
                  style={{
                    width: '100%',
                    padding: 10,
                    fontSize: 13,
                    border: '1px solid rgba(0,0,0,.12)',
                    borderRadius: 8,
                    outline: 'none',
                    resize: 'vertical',
                    fontFamily: 'inherit',
                  }}
                />
                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  <button
                    onClick={handleSendReply}
                    disabled={sending || !replyText.trim()}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 6,
                      padding: '9px 18px',
                      fontSize: 12,
                      fontWeight: 700,
                      color: 'white',
                      background: '#AD1457',
                      border: 'none',
                      borderRadius: 8,
                      cursor: sending || !replyText.trim() ? 'not-allowed' : 'pointer',
                      opacity: sending || !replyText.trim() ? 0.5 : 1,
                    }}
                  >
                    <I n="send" s={14} c="white" />
                    {sending ? 'Sending…' : 'Send Reply'}
                  </button>
                  <button
                    onClick={handleResolveWithoutReply}
                    disabled={resolving}
                    style={{
                      padding: '9px 14px',
                      fontSize: 12,
                      fontWeight: 600,
                      color: '#666',
                      background: 'transparent',
                      border: '1px solid rgba(0,0,0,.12)',
                      borderRadius: 8,
                      cursor: resolving ? 'not-allowed' : 'pointer',
                    }}
                  >
                    {resolving ? 'Working…' : 'Mark resolved (no reply)'}
                  </button>
                </div>
                {message && (
                  <div style={{ fontSize: 12, fontWeight: 600, color: message.type === 'ok' ? '#2E7D32' : '#C62828' }}>
                    {message.text}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
