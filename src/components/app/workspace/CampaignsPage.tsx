'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { CampaignService, CampaignRow, LaunchFromMessageResult } from '@/src/api/CampaignService';

const PINK = '#C2185B';

interface CampaignsPageProps {
  onJane?: () => void;
}

type ChatMsg =
  | { id: string; role: 'user'; text: string }
  | { id: string; role: 'jane'; kind: 'text'; text: string }
  | { id: string; role: 'jane'; kind: 'result'; result: LaunchFromMessageResult };

const naira = (n?: number | null) => (n == null ? '—' : '₦' + Number(n).toLocaleString());
const uid = () => Math.random().toString(36).slice(2);

/**
 * Campaign section: chat with Jane to create a campaign in plain language, and manage
 * existing campaigns with their reach/conversation metrics. No platform jargon — the
 * user just describes what they want; Jane plans it, makes the creative, and launches
 * it (paused) on their behalf.
 */
export default function CampaignsPage({ onJane }: CampaignsPageProps) {
  const [tab, setTab] = useState<'chat' | 'manage'>('chat');
  const [messages, setMessages] = useState<ChatMsg[]>([
    {
      id: uid(),
      role: 'jane',
      kind: 'text',
      text:
        "Hi! Tell me what you'd like to promote and I'll plan and launch a campaign for you — " +
        "e.g. “I run a skincare brand in Lekki, I want people to discover us this week, budget 20k.” " +
        'I’ll write the copy, design the visual, and set it up for you (paused until you say go).',
    },
  ]);
  const [input, setInput] = useState('');
  const [busy, setBusy] = useState(false);
  const [campaigns, setCampaigns] = useState<CampaignRow[]>([]);
  const [loadingList, setLoadingList] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages, busy]);

  const loadCampaigns = useCallback(async () => {
    setLoadingList(true);
    try {
      const res = await CampaignService.listCampaigns();
      setCampaigns(res.campaigns || []);
    } catch {
      setCampaigns([]);
    } finally {
      setLoadingList(false);
    }
  }, []);

  useEffect(() => {
    if (tab === 'manage') loadCampaigns();
  }, [tab, loadCampaigns]);

  const send = async () => {
    const text = input.trim();
    if (!text || busy) return;
    setInput('');
    setMessages((m) => [...m, { id: uid(), role: 'user', text }]);
    setBusy(true);
    setMessages((m) => [
      ...m,
      {
        id: uid(),
        role: 'jane',
        kind: 'text',
        text: 'On it — reading your brief, planning the reach, writing the copy and designing the visual. This takes about a minute…',
      },
    ]);
    try {
      const result = await CampaignService.launchFromMessage({ message: text });
      setMessages((m) => [...m, { id: uid(), role: 'jane', kind: 'result', result }]);
      if (result.stage === 'launched') loadCampaigns();
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Something went wrong. Please try again.';
      setMessages((m) => [...m, { id: uid(), role: 'jane', kind: 'text', text: `Sorry — ${msg}` }]);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', fontFamily: 'var(--wf, Urbanist, sans-serif)' }}>
      {/* Header */}
      <div style={{ padding: '16px 24px 0', display: 'flex', alignItems: 'center', gap: 16 }}>
        {onJane && (
          <button
            onClick={onJane}
            style={{ background: 'none', border: 'none', color: '#999', cursor: 'pointer', fontSize: 13 }}
          >
            ← Jane
          </button>
        )}
        <h1 style={{ fontSize: 20, fontWeight: 800, color: '#1a0a12', margin: 0 }}>Campaigns</h1>
        <div style={{ marginLeft: 'auto', display: 'flex', gap: 4, background: '#f4f2f0', padding: 3, borderRadius: 10 }}>
          {(['chat', 'manage'] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              style={{
                padding: '7px 16px',
                border: 'none',
                borderRadius: 8,
                background: tab === t ? '#fff' : 'transparent',
                color: tab === t ? PINK : '#888',
                fontWeight: tab === t ? 700 : 500,
                fontSize: 13,
                cursor: 'pointer',
                boxShadow: tab === t ? '0 1px 3px rgba(0,0,0,.08)' : 'none',
              }}
            >
              {t === 'chat' ? 'Create with Jane' : 'My Campaigns'}
            </button>
          ))}
        </div>
      </div>

      {tab === 'chat' ? (
        <>
          <div ref={scrollRef} style={{ flex: 1, overflowY: 'auto', padding: '18px 24px' }}>
            {messages.map((m) => (
              <div key={m.id} style={{ marginBottom: 16 }}>
                {m.role === 'user' ? (
                  <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                    <div
                      style={{
                        maxWidth: 520,
                        padding: '11px 16px',
                        borderRadius: '14px 3px 14px 14px',
                        background: '#1a0a12',
                        color: '#f3d0df',
                        fontSize: 13,
                        lineHeight: 1.6,
                      }}
                    >
                      {m.text}
                    </div>
                  </div>
                ) : m.kind === 'text' ? (
                  <JaneBubble>{m.text}</JaneBubble>
                ) : (
                  <ResultCard result={m.result} />
                )}
              </div>
            ))}
            {busy && <JaneBubble>· · ·</JaneBubble>}
          </div>
          <div style={{ padding: '12px 24px 20px', borderTop: '1px solid #eee', background: '#fff' }}>
            <div style={{ display: 'flex', gap: 10, alignItems: 'flex-end' }}>
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    send();
                  }
                }}
                placeholder="Tell Jane what you want to promote…"
                rows={1}
                disabled={busy}
                style={{
                  flex: 1,
                  resize: 'none',
                  border: '1.5px solid #e0dcd9',
                  borderRadius: 12,
                  padding: '11px 14px',
                  fontSize: 14,
                  fontFamily: 'inherit',
                  color: '#111',
                  maxHeight: 120,
                }}
              />
              <button
                onClick={send}
                disabled={busy || !input.trim()}
                style={{
                  padding: '11px 20px',
                  border: 'none',
                  borderRadius: 12,
                  background: busy || !input.trim() ? '#ddd' : `linear-gradient(135deg,${PINK},#8E1545)`,
                  color: '#fff',
                  fontWeight: 800,
                  fontSize: 14,
                  cursor: busy || !input.trim() ? 'default' : 'pointer',
                  whiteSpace: 'nowrap',
                }}
              >
                {busy ? 'Working…' : 'Send'}
              </button>
            </div>
          </div>
        </>
      ) : (
        <div style={{ flex: 1, overflowY: 'auto', padding: '18px 24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', marginBottom: 14 }}>
            <p style={{ margin: 0, color: '#888', fontSize: 13 }}>
              Campaigns Jane has set up for you. Each is paused until you activate it.
            </p>
            <button
              onClick={loadCampaigns}
              style={{ marginLeft: 'auto', background: 'none', border: '1px solid #e0dcd9', borderRadius: 8, padding: '6px 12px', fontSize: 12, cursor: 'pointer', color: '#555' }}
            >
              ↻ Refresh
            </button>
          </div>
          {loadingList ? (
            <p style={{ color: '#aaa', fontSize: 13 }}>Loading…</p>
          ) : campaigns.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '48px 0', color: '#aaa' }}>
              <p style={{ fontSize: 14, margin: 0 }}>No campaigns yet.</p>
              <button
                onClick={() => setTab('chat')}
                style={{ marginTop: 12, background: PINK, color: '#fff', border: 'none', borderRadius: 10, padding: '9px 18px', fontWeight: 700, fontSize: 13, cursor: 'pointer' }}
              >
                Create one with Jane
              </button>
            </div>
          ) : (
            <div style={{ display: 'grid', gap: 12 }}>
              {campaigns.map((c) => (
                <CampaignCard key={c.campaign_id} c={c} />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function JaneBubble({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
      <div
        style={{
          width: 30,
          height: 30,
          borderRadius: '50%',
          background: `linear-gradient(135deg,${PINK},#8E1545)`,
          color: '#fff',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontWeight: 800,
          fontSize: 13,
          flexShrink: 0,
        }}
      >
        J
      </div>
      <div
        style={{
          maxWidth: 560,
          padding: '11px 16px',
          borderRadius: '3px 14px 14px 14px',
          background: '#f6f5f3',
          color: '#333',
          fontSize: 13,
          lineHeight: 1.6,
        }}
      >
        {children}
      </div>
    </div>
  );
}

function ResultCard({ result }: { result: LaunchFromMessageResult }) {
  if (result.stage === 'need_more') {
    return <JaneBubble>{result.question || 'Could you tell me a bit more — especially your budget?'}</JaneBubble>;
  }
  if (result.stage === 'advise') {
    return <JaneBubble>{result.advice?.reason || "That budget's a little low to run well — want to bump it up?"}</JaneBubble>;
  }
  const { plan, creative, launch } = result;
  return (
    <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
      <div
        style={{
          width: 30, height: 30, borderRadius: '50%', flexShrink: 0,
          background: `linear-gradient(135deg,${PINK},#8E1545)`, color: '#fff',
          display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: 13,
        }}
      >
        J
      </div>
      <div style={{ maxWidth: 560, flex: 1, border: '1px solid #eee', borderRadius: 14, overflow: 'hidden', background: '#fff' }}>
        {creative?.image_url && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={creative.image_url} alt="campaign visual" style={{ width: '100%', display: 'block', maxHeight: 320, objectFit: 'cover' }} />
        )}
        <div style={{ padding: 16 }}>
          <p style={{ margin: '0 0 4px', fontWeight: 800, fontSize: 15, color: '#1a0a12' }}>{creative?.headline}</p>
          <p style={{ margin: '0 0 12px', fontSize: 13, color: '#555', lineHeight: 1.5 }}>{creative?.primary_text}</p>
          {plan?.explanation && (
            <p style={{ margin: '0 0 12px', fontSize: 12.5, color: '#888', fontStyle: 'italic', lineHeight: 1.5 }}>
              &ldquo;{plan.explanation}&rdquo;
            </p>
          )}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 12 }}>
            {plan?.platforms?.map((p, i) => (
              <span key={i} style={{ fontSize: 11, fontWeight: 700, padding: '3px 9px', borderRadius: 20, background: '#fce4ec', color: PINK }}>
                {naira(p.budget_ngn)} · {p.days} days
              </span>
            ))}
            {plan?.geo?.pins?.length ? (
              <span style={{ fontSize: 11, fontWeight: 600, padding: '3px 9px', borderRadius: 20, background: '#f0eded', color: '#666' }}>
                📍 {plan.geo.pins.map((x) => x.name).join(', ')}
              </span>
            ) : null}
          </div>
          <div style={{ background: '#f6fbf6', border: '1px solid #cde9cd', borderRadius: 10, padding: '10px 12px' }}>
            <p style={{ margin: 0, fontSize: 12.5, color: '#2e7d32', fontWeight: 700 }}>✓ Campaign created (paused — no spend yet)</p>
            <p style={{ margin: '4px 0 8px', fontSize: 12, color: '#666' }}>{launch?.note}</p>
            {launch?.ads_manager_url && (
              <a href={launch.ads_manager_url} target="_blank" rel="noopener noreferrer" style={{ fontSize: 12.5, fontWeight: 800, color: PINK, textDecoration: 'none' }}>
                Open in Meta Manager →
              </a>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function CampaignCard({ c }: { c: CampaignRow }) {
  return (
    <div style={{ display: 'flex', gap: 14, border: '1px solid #eee', borderRadius: 12, padding: 12, background: '#fff' }}>
      {c.image_url ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={c.image_url} alt="" style={{ width: 84, height: 84, borderRadius: 8, objectFit: 'cover', flexShrink: 0 }} />
      ) : (
        <div style={{ width: 84, height: 84, borderRadius: 8, background: '#f4f2f0', flexShrink: 0 }} />
      )}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <p style={{ margin: 0, fontWeight: 700, fontSize: 14, color: '#1a0a12' }}>{c.name}</p>
          <span style={{ fontSize: 10.5, fontWeight: 700, padding: '2px 8px', borderRadius: 20, background: '#fff3e0', color: '#e65100', textTransform: 'uppercase' }}>
            {c.status}
          </span>
        </div>
        <p style={{ margin: '3px 0 0', fontSize: 12.5, color: '#666', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.headline}</p>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 14, marginTop: 8, fontSize: 12 }}>
          <Metric label="Budget" value={naira(c.budget_ngn)} />
          <Metric label="Reach spend" value={naira(c.metrics?.spend_ngn)} />
          <Metric label="Conversations" value={c.metrics ? String(c.metrics.conversations) : '—'} />
          {c.city && <Metric label="Area" value={c.city} />}
        </div>
      </div>
      {c.ads_manager_url && (
        <a href={c.ads_manager_url} target="_blank" rel="noopener noreferrer" style={{ alignSelf: 'center', fontSize: 12, fontWeight: 700, color: PINK, textDecoration: 'none', whiteSpace: 'nowrap' }}>
          Manage →
        </a>
      )}
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div style={{ color: '#aaa', fontSize: 10.5, textTransform: 'uppercase', letterSpacing: 0.3 }}>{label}</div>
      <div style={{ color: '#333', fontWeight: 700 }}>{value}</div>
    </div>
  );
}
