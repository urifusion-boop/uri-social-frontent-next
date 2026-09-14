'use client';

/**
 * Home — the default surface (DASH-PRD-01 §4).
 *
 * A dashboard for someone who does not want a dashboard. It answers four questions
 * and shows nothing else:
 *
 *   1. Did anyone message me?   2. Is my campaign working?
 *   3. How much money is left?  4. What should I do now?
 *
 * Three rules from §0 override everything about how this renders:
 *
 * **Lead with people, never impressions.** "23 people messaged you" is the headline;
 * reach and spend are context. No CPM/CTR/frequency reaches this file at all — §9's
 * hidden column is hidden by not being fetched.
 *
 * **Never print a zero we can't stand behind.** A wa.me link ad reports 0
 * conversations for its whole life because Meta only counts them for native
 * Click-to-WhatsApp. The API sends `null` for those, never 0, and every count here
 * branches on the null: "we can't count messages on this one" is the opposite
 * message to "nobody messaged you", and printing the wrong one loses a client.
 *
 * **Empty states show an action, never a zero** (§12). A first session that reads as
 * failure is a client who doesn't come back.
 *
 * Mobile-first per §11: one vertical scroll, no side-by-side panels, no horizontal
 * scrolling at 390px, and the delta renders before anything heavy.
 */

import { useCallback, useEffect, useState } from 'react';
import { CampaignService, type DashboardHome } from '@/src/api/CampaignService';

const PINK = '#C2185B';
const AMBER = '#a15c00';

const naira = (n: number | null | undefined) =>
  typeof n === 'number' ? `₦${Math.round(n).toLocaleString()}` : '—';

/** "Tuesday" for a recent visit, a date for an older one — §4.1 wants a human
 *  reference point, not a timestamp. */
function sinceLabel(iso: string | null): string {
  if (!iso) return '';
  const then = new Date(iso);
  const days = Math.floor((Date.now() - then.getTime()) / 86_400_000);
  if (days <= 0) return 'earlier today';
  if (days === 1) return 'yesterday';
  if (days < 7) return then.toLocaleDateString(undefined, { weekday: 'long' });
  return then.toLocaleDateString(undefined, { day: 'numeric', month: 'short' });
}

function daysLeft(endsAt: string | null): string {
  if (!endsAt) return '';
  const days = Math.ceil((new Date(endsAt).getTime() - Date.now()) / 86_400_000);
  if (days <= 0) return 'ending today';
  return days === 1 ? '1 day left' : `${days} days left`;
}

interface HomePanelProps {
  onNavigate?: (surface: string) => void;
}

export default function HomePanel({ onNavigate }: HomePanelProps) {
  const [data, setData] = useState<DashboardHome | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setError('');
    try {
      setData(await CampaignService.getDashboardHome());
    } catch {
      setError("Couldn't load your dashboard. Pull to refresh or try again shortly.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  if (loading) {
    return <div style={{ padding: 24, color: '#888', fontSize: 13 }}>Loading…</div>;
  }
  if (error) {
    return (
      <div style={{ padding: 24 }}>
        <div style={{ fontSize: 13, color: '#c62828', marginBottom: 10 }}>{error}</div>
        <button type="button" onClick={load} style={btn}>
          Try again
        </button>
      </div>
    );
  }
  if (!data) return null;

  const { since_you_last_looked: delta, live_campaigns: live, money, suggestions } = data;

  return (
    <div style={{ flex: 1, overflowY: 'auto', padding: '18px 16px', maxWidth: 720 }}>
      {/* §12 — a brand-new client gets one clear action, not a screen of zeros. */}
      {data.is_first_run ? (
        <section style={card}>
          <h2 style={h2}>Let&rsquo;s get your first campaign running</h2>
          <p style={muted}>
            Tell Jane what you want to promote. She writes the copy, designs the visual and
            sets it up — you approve before anything goes live.
          </p>
          <button type="button" onClick={() => onNavigate?.('campaigns')} style={btn}>
            Start a campaign
          </button>
        </section>
      ) : (
        <>
          {/* §4.1 — a delta, not a total. "147 conversations" tells a weekly visitor
              nothing; "12 since Tuesday" is immediately interpretable. */}
          <section style={card}>
            <div style={label}>
              {delta.since ? `Since ${sinceLabel(delta.since)}` : 'So far'}
            </div>
            {delta.people_messaged !== null ? (
              <div style={{ fontSize: 26, fontWeight: 700, marginTop: 2 }}>
                {delta.people_messaged}{' '}
                <span style={{ fontSize: 15, fontWeight: 500, color: '#555' }}>
                  {delta.people_messaged === 1 ? 'person messaged you' : 'people messaged you'}
                </span>
              </div>
            ) : (
              // NOT "0 people messaged you" — we cannot see these, which is a
              // different thing and must never be reported as failure.
              <div style={{ fontSize: 14, color: '#555', marginTop: 4, lineHeight: 1.5 }}>
                We can&rsquo;t count messages from your ads yet.
              </div>
            )}
            {delta.uncountable_campaigns > 0 && (
              <div style={{ fontSize: 11.5, color: AMBER, marginTop: 6, lineHeight: 1.5 }}>
                {delta.uncountable_campaigns === 1
                  ? "1 campaign isn't counted here"
                  : `${delta.uncountable_campaigns} campaigns aren't counted here`}{' '}
                — they send people to WhatsApp through a link, which we can&rsquo;t track.{' '}
                <button type="button" onClick={() => onNavigate?.('connections')} style={linkBtn}>
                  Fix this
                </button>
              </div>
            )}
          </section>

          {/* §4.3 — what to DO. The most important block here, and deliberately
              empty when nothing qualifies: a padded list is less trustworthy. */}
          {suggestions.length > 0 && (
            <section style={card}>
              <div style={label}>Jane suggests</div>
              {suggestions.map((s) => (
                <div key={`${s.kind}-${s.campaign_id}`} style={suggestionRow}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13.5, fontWeight: 600 }}>{s.text}</div>
                    {s.detail && (
                      <div style={{ fontSize: 11.5, color: '#777', marginTop: 2, lineHeight: 1.5 }}>
                        {s.detail}
                      </div>
                    )}
                  </div>
                  <button type="button" onClick={() => onNavigate?.(s.action)} style={smallBtn}>
                    {s.action_label}
                  </button>
                </div>
              ))}
            </section>
          )}

          {/* §4.2 — money is leaving the wallet right now, and unanswered anxiety
              becomes a support ticket. Spend is the prominent figure. */}
          <section style={card}>
            <div style={label}>Running now</div>
            {live.length === 0 ? (
              <div style={{ marginTop: 4 }}>
                <div style={muted}>Nothing running at the moment.</div>
                <button type="button" onClick={() => onNavigate?.('campaigns')} style={btn}>
                  Start a campaign
                </button>
              </div>
            ) : (
              live.map((c) => (
                <div key={c.campaign_id} style={{ marginTop: 10 }}>
                  <div style={{ fontSize: 13.5, fontWeight: 600 }}>{c.name}</div>
                  <div style={{ fontSize: 12, color: '#555', marginTop: 2 }}>
                    {naira(c.spent_ngn)} of {naira(c.budget_ngn)} spent
                    {c.ends_at ? ` · ${daysLeft(c.ends_at)}` : ''}
                  </div>
                  {/* Suppressed rather than zeroed — see the module note. */}
                  {c.people_messaged !== null && (
                    <div style={{ fontSize: 12.5, color: '#1a7f37', marginTop: 2 }}>
                      {c.people_messaged}{' '}
                      {c.people_messaged === 1 ? 'person messaged' : 'people messaged'}
                    </div>
                  )}
                  <ProgressBar spent={c.spent_ngn} budget={c.budget_ngn} />
                </div>
              ))
            )}
          </section>

          {/* §4.4 — answers "how much have I got left" before they plan anything. */}
          <section style={card}>
            <div style={label}>Money</div>
            <div style={{ fontSize: 14, marginTop: 2 }}>
              <span style={{ fontWeight: 700, color: money.low ? AMBER : '#111' }}>
                {naira(money.wallet_ngn)}
              </span>{' '}
              <span style={{ color: '#777' }}>ad wallet</span>
              {money.credits !== null && (
                <>
                  <span style={{ color: '#ccc' }}> · </span>
                  <span style={{ fontWeight: 700 }}>{money.credits}</span>{' '}
                  <span style={{ color: '#777' }}>credits</span>
                </>
              )}
            </div>
            {money.low && (
              <div style={{ fontSize: 11.5, color: AMBER, marginTop: 6 }}>
                Too low to start a new campaign — top up at least {naira(money.min_topup_ngn)}.{' '}
                <button type="button" onClick={() => onNavigate?.('wallet')} style={linkBtn}>
                  Top up
                </button>
              </div>
            )}
          </section>
        </>
      )}
    </div>
  );
}

/** Spend against the stated budget. Prepaid clients want to see where their money
 *  went far more than they want performance metrics (§4.2). */
function ProgressBar({ spent, budget }: { spent: number | null; budget: number | null }) {
  if (typeof spent !== 'number' || typeof budget !== 'number' || budget <= 0) return null;
  const pct = Math.min(100, Math.round((spent / budget) * 100));
  return (
    <div style={{ height: 6, background: '#eee', borderRadius: 3, marginTop: 6, overflow: 'hidden' }}>
      <div style={{ width: `${pct}%`, height: '100%', background: PINK }} />
    </div>
  );
}

const card: React.CSSProperties = {
  background: '#fff',
  border: '1px solid #ece8e5',
  borderRadius: 12,
  padding: '14px 16px',
  marginBottom: 12,
};
const h2: React.CSSProperties = { fontSize: 16, fontWeight: 700, margin: '0 0 6px' };
const label: React.CSSProperties = {
  fontSize: 11,
  fontWeight: 700,
  color: '#888',
  textTransform: 'uppercase',
  letterSpacing: 0.4,
};
const muted: React.CSSProperties = { fontSize: 12.5, color: '#777', margin: '4px 0 10px', lineHeight: 1.55 };
const btn: React.CSSProperties = {
  background: PINK,
  color: '#fff',
  border: 'none',
  borderRadius: 20,
  padding: '9px 18px',
  fontSize: 13,
  fontWeight: 600,
  cursor: 'pointer',
};
const smallBtn: React.CSSProperties = {
  background: '#fff',
  color: PINK,
  border: `1.5px solid ${PINK}`,
  borderRadius: 16,
  padding: '6px 14px',
  fontSize: 12,
  fontWeight: 600,
  cursor: 'pointer',
  whiteSpace: 'nowrap',
  flexShrink: 0,
};
const linkBtn: React.CSSProperties = {
  background: 'none',
  border: 'none',
  padding: 0,
  color: PINK,
  fontSize: 'inherit',
  fontWeight: 600,
  cursor: 'pointer',
  textDecoration: 'underline',
};
const suggestionRow: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 10,
  marginTop: 10,
};
