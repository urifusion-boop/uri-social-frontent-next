'use client';

import { useCallback, useEffect, useState } from 'react';
import { InboxService, OneboxPlan, OneboxUsage } from '@/src/api/InboxService';

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

export function OneboxUsagePanel({ isMobile }: { isMobile: boolean }) {
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
  const barColor = u.exhausted ? '#C62828' : u.warning ? '#E65100' : '#2E7D32';

  return (
    <div
      style={{
        padding: isMobile ? 14 : 24,
        maxWidth: 820,
        margin: '0 auto',
        display: 'flex',
        flexDirection: 'column',
        gap: 14,
        fontFamily: FONT,
        boxSizing: 'border-box',
      }}
    >
      <div style={{ background: '#fff', border: '1px solid rgba(0,0,0,.08)', borderRadius: 14, padding: 20 }}>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, flexWrap: 'wrap' }}>
          <div style={{ fontSize: 16, fontWeight: 800, color: '#1a1a1a' }}>{u.plan_name}</div>
          <div style={{ fontSize: 12, color: '#888' }}>
            {u.status === 'trial' ? 'Free trial' : u.status === 'expired' ? 'Expired' : 'Active'} ·{' '}
            {day(u.period_start)} – {day(u.period_end)}
          </div>
        </div>
        <div style={{ margin: '14px 0 6px', fontSize: 28, fontWeight: 800, color: '#1a1a1a' }}>
          {u.used.toLocaleString()}
          <span style={{ fontSize: 15, fontWeight: 600, color: '#888' }}>
            {' '}
            of {u.allowance.toLocaleString()} AI conversations
          </span>
        </div>
        <div style={{ height: 10, background: '#f0eeec', borderRadius: 999, overflow: 'hidden' }}>
          <div style={{ width: `${Math.min(100, u.percent_used)}%`, height: '100%', background: barColor }} />
        </div>
        <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', marginTop: 8, fontSize: 12.5, color: '#555' }}>
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
        <div style={{ marginTop: 12, fontSize: 11.5, color: '#999', lineHeight: 1.5 }}>
          A conversation counts once, however many messages it has. After {u.message_cap} messages in one conversation
          the AI stops replying; you can carry on by hand, and it isn’t charged again.
        </div>
      </div>

      <div style={{ background: '#fff', border: '1px solid rgba(0,0,0,.08)', borderRadius: 14, padding: 20 }}>
        <div style={{ fontSize: 14.5, fontWeight: 800, color: '#1a1a1a', marginBottom: 10 }}>
          {u.status === 'active' ? 'Change or renew your plan' : 'Choose a plan'}
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12 }}>
          {data.plans.map((p) => (
            <div
              key={p.plan_id}
              style={{
                border: p.plan_id === u.plan_id ? '1.5px solid #E91E63' : '1px solid rgba(0,0,0,.1)',
                borderRadius: 12,
                padding: 14,
                display: 'flex',
                flexDirection: 'column',
                gap: 6,
              }}
            >
              <div style={{ fontWeight: 800, fontSize: 14 }}>{p.name}</div>
              <div style={{ fontSize: 20, fontWeight: 800 }}>
                ₦{p.price_ngn.toLocaleString()}
                <span style={{ fontSize: 12, color: '#888', fontWeight: 600 }}> /month</span>
              </div>
              <div style={{ fontSize: 12.5, color: '#555' }}>{p.conversations.toLocaleString()} AI conversations</div>
              {data.can_manage ? (
                <button
                  type="button"
                  disabled={busy !== ''}
                  onClick={() => subscribe(p.plan_id)}
                  style={{
                    marginTop: 4,
                    background: '#AD1457',
                    color: '#fff',
                    border: 'none',
                    borderRadius: 8,
                    padding: '8px 14px',
                    fontWeight: 700,
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
        <div style={{ marginTop: 10, fontSize: 11.5, color: '#999' }}>
          Shared across Instagram, Facebook, WhatsApp and TikTok. No automatic overage charges — ever.
        </div>
        {error && <div style={{ marginTop: 8, fontSize: 12.5, color: '#C62828' }}>{error}</div>}
      </div>

      <div
        style={{
          background: '#fff',
          border: '1px solid rgba(0,0,0,.08)',
          borderRadius: 14,
          padding: 20,
          fontSize: 12.5,
          color: '#555',
          lineHeight: 1.7,
        }}
      >
        <strong style={{ color: '#1a1a1a' }}>This period</strong>
        <div>
          {u.conversations} conversations · typically {u.median_messages} messages each (average {u.average_messages})
        </div>
        <div>
          {u.at_message_cap} reached the {u.message_cap}-message limit
        </div>
      </div>
    </div>
  );
}
