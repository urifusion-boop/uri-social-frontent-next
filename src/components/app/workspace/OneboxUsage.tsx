'use client';

import { useCallback, useEffect, useState } from 'react';
import { InboxService, OneboxPlan, OneboxUsage } from '@/src/api/InboxService';
import { card, ghostPill, gradient, INK, MUTED, PINK, primaryPill } from './messaging/look';

/*
 * What the inbox's AI has used this month. URI sells a monthly allowance of
 * AI-handled conversations — a conversation counts once however many messages it has.
 */

function day(iso: string): string {
  return new Date(/[zZ]|[+-]\d{2}:?\d{2}$/.test(iso) ? iso : `${iso}Z`).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
  });
}

const FONT = "'Urbanist', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif";

export function OneboxUsagePanel({ isMobile, embedded = false }: { isMobile: boolean; embedded?: boolean }) {
  const [data, setData] = useState<{ usage: OneboxUsage; plans: OneboxPlan[]; can_manage: boolean } | null>(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState('');

  const load = useCallback(async () => {
    try {
      setData(await InboxService.oneboxUsage());
    } catch {
      setError("Couldn't load your AI usage.");
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function subscribe(planId: string) {
    setBusy(planId);
    setError('');
    try {
      const r = await InboxService.oneboxSubscribe(planId);
      window.location.assign(r.payment_url);
    } catch (e) {
      const d = (e as { response?: { data?: { detail?: string } } })?.response?.data?.detail;
      setError(d || "Couldn't start the payment.");
      setBusy('');
    }
  }

  if (!data) {
    return <div style={{ padding: 24, fontSize: 13, color: error ? '#C62828' : '#999' }}>{error || 'Loading…'}</div>;
  }
  const u = data.usage;
  const barColor = u.exhausted ? '#C62828' : u.warning ? '#E65100' : gradient;

  return (
    <div
      style={{
        padding: embedded ? 0 : isMobile ? 14 : '22px 28px 32px',
        display: 'flex',
        flexDirection: 'column',
        gap: 14,
        fontFamily: FONT,
        boxSizing: 'border-box',
      }}
    >
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: isMobile ? '1fr' : 'minmax(0, 1fr) minmax(0, 2fr)',
          gap: 16,
          alignItems: 'stretch',
        }}
      >
        <div style={{ ...card, padding: 22 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
            <div style={{ fontSize: 17, fontWeight: 900, color: INK }}>{u.plan_name}</div>
            <div
              style={{
                fontSize: 11.5,
                fontWeight: 800,
                color: PINK,
                background: '#FCE4EE',
                borderRadius: 999,
                padding: '4px 10px',
              }}
            >
              {u.status === 'trial' ? 'Free trial' : u.status === 'expired' ? 'Expired' : 'Active'} ·{' '}
              {day(u.period_start)} – {day(u.period_end)}
            </div>
          </div>
          <div style={{ margin: '14px 0 6px', fontSize: 40, fontWeight: 900, color: INK, letterSpacing: -1 }}>
            {u.used.toLocaleString()}
            <span style={{ fontSize: 15, fontWeight: 700, color: MUTED, letterSpacing: 0 }}>
              {' '}
              / {u.allowance.toLocaleString()}
            </span>
          </div>
          <div style={{ fontSize: 13, color: MUTED, marginTop: -4 }}>AI conversations used</div>
          <div style={{ height: 10, background: '#F4E8ED', borderRadius: 999, overflow: 'hidden', marginTop: 6 }}>
            <div style={{ width: `${Math.min(100, u.percent_used)}%`, height: '100%', background: barColor }} />
          </div>
          <div
            style={{
              display: 'flex',
              gap: 16,
              flexWrap: 'wrap',
              marginTop: 8,
              fontSize: 12.5,
              fontWeight: 700,
              color: MUTED,
            }}
          >
            <span>{u.percent_used}% used</span>
            <span>{u.remaining.toLocaleString()} remaining</span>
            {u.queued_plan && <span>Next period: {u.queued_plan}</span>}
          </div>
          {u.warning && !u.exhausted && (
            <div
              style={{
                marginTop: 12,
                fontSize: 12.5,
                color: '#7A4B00',
                background: '#FFF7E6',
                border: '1px solid #F5D9A8',
                borderRadius: 10,
                padding: '9px 12px',
              }}
            >
              You’ve used {u.percent_used}% of your allowance. Upgrade before it runs out so customers keep getting AI
              replies.
            </div>
          )}
          {(u.exhausted || u.status === 'expired') && (
            <div
              style={{
                marginTop: 12,
                fontSize: 12.5,
                color: '#B71C1C',
                background: '#FDECEA',
                border: '1px solid #F5B7B1',
                borderRadius: 10,
                padding: '9px 12px',
              }}
            >
              {u.status === 'expired'
                ? 'Your plan has expired, so the AI isn’t replying to new customers. You can still reply by hand.'
                : 'You’ve used every AI conversation in your plan, so new customers won’t get AI replies until you upgrade or it renews. Conversations already counted keep replying, and you can always reply by hand.'}
            </div>
          )}
          <div style={{ marginTop: 12, fontSize: 12, color: MUTED, lineHeight: 1.5 }}>
            A conversation counts once, however many messages it has. After {u.message_cap} messages in one conversation
            the AI stops replying; you can carry on by hand, and it isn’t charged again.
          </div>
        </div>

        <div style={{ ...card, padding: 22 }}>
          <div style={{ fontSize: 17, fontWeight: 900, color: INK, marginBottom: 12 }}>
            {u.status === 'active' ? 'Change or renew your plan' : 'Choose a plan'}
          </div>
          <div style={{ fontSize: 12.5, color: MUTED, margin: '-8px 0 14px' }}>
            Shared across Instagram, Facebook, WhatsApp and TikTok. No automatic overage charges — ever.
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 14 }}>
            {data.plans.map((p) => (
              <div
                key={p.plan_id}
                style={{
                  position: 'relative',
                  border: p.plan_id === u.plan_id ? '1.5px solid transparent' : '1.5px solid #F1E4EA',
                  background:
                    p.plan_id === u.plan_id ? `linear-gradient(#fff,#fff) padding-box, ${gradient} border-box` : '#fff',
                  boxShadow: p.plan_id === u.plan_id ? '0 18px 34px -22px rgba(194,24,91,.55)' : 'none',
                  borderRadius: 18,
                  padding: 18,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 6,
                }}
              >
                {p.plan_id === u.plan_id && (
                  <span
                    style={{
                      position: 'absolute',
                      top: 14,
                      right: 14,
                      fontSize: 10.5,
                      fontWeight: 900,
                      color: '#fff',
                      background: gradient,
                      borderRadius: 999,
                      padding: '3px 8px',
                    }}
                  >
                    Your plan
                  </span>
                )}
                <div style={{ fontWeight: 800, fontSize: 15, color: INK }}>{p.name}</div>
                <div style={{ fontSize: 26, fontWeight: 900, color: INK }}>
                  ₦{p.price_ngn.toLocaleString()}
                  <span style={{ fontSize: 13, color: MUTED, fontWeight: 600 }}> /month</span>
                </div>
                <div style={{ fontSize: 13, color: '#4a4440', fontWeight: 600 }}>
                  <span style={{ color: '#1E8E4E', fontWeight: 900 }}>✓</span> {p.conversations.toLocaleString()} AI
                  conversations
                </div>
                {data.can_manage ? (
                  <button
                    type="button"
                    disabled={busy !== ''}
                    onClick={() => subscribe(p.plan_id)}
                    style={{
                      marginTop: 8,
                      ...(p.plan_id === u.plan_id ? primaryPill : ghostPill),
                      padding: '9px 14px',
                      fontWeight: 800,
                      fontFamily: 'inherit',
                      fontSize: 13,
                      cursor: busy ? 'default' : 'pointer',
                      opacity: busy ? 0.6 : 1,
                    }}
                  >
                    {busy === p.plan_id ? 'Opening payment…' : p.plan_id === u.plan_id ? 'Renew' : 'Choose'}
                  </button>
                ) : (
                  <div style={{ fontSize: 11.5, color: '#999' }}>An admin changes the plan.</div>
                )}
              </div>
            ))}
          </div>
          {error && <div style={{ marginTop: 8, fontSize: 12.5, color: '#C62828' }}>{error}</div>}
        </div>
      </div>

      <div
        style={{
          ...card,
          padding: 20,
          fontSize: 13,
          color: MUTED,
          lineHeight: 1.7,
        }}
      >
        <strong style={{ color: INK, fontSize: 15, marginRight: 18 }}>This period</strong>
        <div style={{ display: 'inline' }}>
          {u.conversations} conversations · typically {u.median_messages} messages each (average {u.average_messages})
        </div>
        <div style={{ display: 'inline', marginLeft: 18 }}>
          {u.at_message_cap} reached the {u.message_cap}-message limit
        </div>
      </div>
    </div>
  );
}
