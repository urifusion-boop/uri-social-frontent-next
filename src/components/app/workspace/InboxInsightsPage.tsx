'use client';

import { ReactNode, useState } from 'react';

/*
 * Insights / "Ask URI" — per PRD §5/§9: aggregate counts with their
 * denominator and reporting period, grouped recurring themes with sample
 * threads (never a bare AI claim with no evidence), and a question box that
 * always states coverage limits rather than pretending to know everything.
 * The theme counts and Ask URI answers below are illustrative placeholders
 * standing in for the real aggregation this needs a backend for — but the
 * summary stats ARE computed live from whatever conversations are passed in,
 * so they move as you use the rest of Inbox.
 */

const FONT = "'Urbanist', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif";

const I = ({ n, s = 18, c = 'currentColor' }: { n: string; s?: number; c?: string }) => {
  const p: Record<string, ReactNode> = {
    zap: <polygon points="13 2 3 14 11 14 9 22 21 10 13 10 13 2" />,
    alertTriangle: (
      <>
        <polygon points="12 3 22 20 2 20" />
        <line x1="12" y1="9" x2="12" y2="14" />
        <circle cx="12" cy="17" r="1" fill={c} stroke="none" />
      </>
    ),
    send: (
      <>
        <line x1="22" y1="2" x2="11" y2="13" />
        <polygon points="22 2 15 22 11 13 2 9 22 2" />
      </>
    ),
    trending: (
      <>
        <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" />
        <polyline points="17 6 23 6 23 12" />
      </>
    ),
    check: <polyline points="20 6 9 17 4 12" />,
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

export interface InsightsConversation {
  id: string;
  type: 'dm' | 'comment';
  channel: 'instagram' | 'facebook' | 'whatsapp' | 'tiktok';
  name: string;
  excerpt: string;
  time: string;
  status: 'unassigned' | 'pending' | 'urgent' | 'resolved';
}

interface Theme {
  id: string;
  label: string;
  keywords: string[];
  fallbackCount: number;
}

const THEMES: Theme[] = [
  { id: 'price', label: 'Price & availability questions', keywords: ['price', 'stock', 'much', '₦'], fallbackCount: 3 },
  {
    id: 'delivery',
    label: 'Delivery & pickup questions',
    keywords: ['deliver', 'pick up', 'pickup', 'arrive', 'lekki'],
    fallbackCount: 2,
  },
  {
    id: 'authenticity',
    label: 'Product authenticity questions',
    keywords: ['real', 'leather', 'authentic'],
    fallbackCount: 1,
  },
];

interface CannedAnswer {
  match: string[];
  answer: string;
}

const CANNED_ANSWERS: CannedAnswer[] = [
  {
    match: ['delivery', 'shipping', 'deliver'],
    answer:
      'Delivery came up in the sample below over the last 7 days. Most were asking about Lekki pickup or standard shipping windows — none flagged a missed delivery.',
  },
  {
    match: ['price', 'stock', 'availability'],
    answer:
      'Price/availability questions were the most common theme in the sample below — mostly about the Tan Woven Tote. Sample too small yet to say whether this is a specific product or a general pattern.',
  },
  {
    match: ['complaint', 'unhappy', 'refund'],
    answer:
      'The sample below includes the complaints currently open. Coverage of resolved/older complaints is incomplete since this is a small illustrative set, not the full history.',
  },
];

const SUGGESTED_QUESTIONS = [
  'What are customers asking about most?',
  'Any delivery complaints this week?',
  'How many conversations are still unanswered?',
];

function computeStats(conversations: InsightsConversation[]) {
  const total = conversations.length;
  const resolved = conversations.filter((c) => c.status === 'resolved').length;
  const urgent = conversations.filter((c) => c.status === 'urgent').length;
  const responseRate = total === 0 ? 0 : Math.round((resolved / total) * 100);
  return { total, resolved, urgent, responseRate };
}

export default function InboxInsightsPage({
  isMobile,
  conversations,
}: {
  isMobile: boolean;
  conversations: InsightsConversation[];
}) {
  const [question, setQuestion] = useState('');
  const [answer, setAnswer] = useState<{ q: string; a: string; samples: InsightsConversation[] } | null>(null);

  const stats = computeStats(conversations);

  function ask(q: string) {
    const trimmed = q.trim();
    if (!trimmed) return;
    const lower = trimmed.toLowerCase();
    const matched = CANNED_ANSWERS.find((c) => c.match.some((m) => lower.includes(m)));
    const samples = conversations.slice(0, 3);
    setAnswer({
      q: trimmed,
      a: matched
        ? matched.answer
        : `I don't have enough conversation history yet to answer that with confidence — here's the most relevant sample I could find instead.`,
      samples,
    });
  }

  return (
    <div
      style={{
        padding: isMobile ? 14 : 24,
        display: 'flex',
        flexDirection: 'column',
        gap: 20,
        maxWidth: 880,
        margin: '0 auto',
        boxSizing: 'border-box',
      }}
    >
      {/* summary stats — computed live from the passed conversations */}
      <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr 1fr' : 'repeat(4, 1fr)', gap: 10 }}>
        {[
          { label: 'Conversations (sample)', value: stats.total },
          { label: 'Resolved', value: stats.resolved },
          { label: 'Urgent / open', value: stats.urgent },
          { label: 'Response rate', value: `${stats.responseRate}%` },
        ].map((s) => (
          <div
            key={s.label}
            style={{ background: '#fff', border: '1px solid rgba(0,0,0,.08)', borderRadius: 12, padding: '14px 16px' }}
          >
            <div style={{ fontSize: 22, fontWeight: 800, color: '#1a1a1a' }}>{s.value}</div>
            <div style={{ fontSize: 11.5, color: '#888', marginTop: 2 }}>{s.label}</div>
          </div>
        ))}
      </div>
      <div style={{ fontSize: 11.5, color: '#999', marginTop: -12, display: 'flex', alignItems: 'center', gap: 6 }}>
        <I n="alertTriangle" s={12} c="#B26A00" />
        Based on {stats.total} conversations currently loaded — not your full history. Numbers will read differently
        once this is wired to the real Unified Inbox API.
      </div>

      {/* recurring themes */}
      <div>
        <div style={{ fontSize: 13, fontWeight: 800, color: '#1a1a1a', marginBottom: 10 }}>Recurring themes</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {THEMES.map((theme) => {
            const matches = conversations.filter((c) =>
              theme.keywords.some((k) => c.excerpt.toLowerCase().includes(k))
            );
            const count = matches.length || theme.fallbackCount;
            return (
              <div
                key={theme.id}
                style={{
                  background: '#fff',
                  border: '1px solid rgba(0,0,0,.08)',
                  borderRadius: 12,
                  padding: '14px 16px',
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    marginBottom: matches.length ? 10 : 0,
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <I n="trending" s={14} c="#AD1457" />
                    <span style={{ fontSize: 13, fontWeight: 700, color: '#1a1a1a' }}>{theme.label}</span>
                  </div>
                  <span
                    style={{
                      fontSize: 11,
                      fontWeight: 700,
                      color: '#AD1457',
                      background: 'rgba(194,24,91,.08)',
                      padding: '3px 9px',
                      borderRadius: 10,
                    }}
                  >
                    {count} in sample
                  </span>
                </div>
                {matches.length > 0 && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    {matches.slice(0, 3).map((m) => (
                      <div key={m.id} style={{ fontSize: 12, color: '#666', paddingLeft: 22 }}>
                        <span style={{ fontWeight: 700, color: '#333' }}>{m.name}</span> — &ldquo;{m.excerpt}&rdquo;
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Ask URI */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
          <I n="zap" s={15} c="#AD1457" />
          <span style={{ fontSize: 13, fontWeight: 800, color: '#1a1a1a' }}>Ask URI</span>
        </div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 10 }}>
          {SUGGESTED_QUESTIONS.map((q) => (
            <button
              key={q}
              type="button"
              onClick={() => {
                setQuestion(q);
                ask(q);
              }}
              style={{
                fontSize: 11.5,
                fontWeight: 600,
                color: '#AD1457',
                background: 'rgba(194,24,91,.06)',
                border: '1px solid rgba(194,24,91,.15)',
                borderRadius: 14,
                padding: '6px 12px',
                cursor: 'pointer',
                fontFamily: FONT,
              }}
            >
              {q}
            </button>
          ))}
        </div>
        <div
          style={{
            display: 'flex',
            gap: 8,
            background: '#fff',
            border: '1px solid rgba(0,0,0,.1)',
            borderRadius: 10,
            padding: '8px 10px',
          }}
        >
          <input
            aria-label="Ask a question about your conversations"
            placeholder="Ask a question about your conversations..."
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') ask(question);
            }}
            style={{ flex: 1, border: 'none', outline: 'none', fontSize: 13, fontFamily: FONT, color: '#333' }}
          />
          <button
            type="button"
            onClick={() => ask(question)}
            disabled={!question.trim()}
            style={{
              border: 'none',
              borderRadius: 8,
              background: question.trim() ? '#AD1457' : '#d9a9bc',
              color: '#fff',
              width: 32,
              height: 32,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: question.trim() ? 'pointer' : 'default',
            }}
          >
            <I n="send" s={14} c="#fff" />
          </button>
        </div>

        {answer && (
          <div
            style={{
              marginTop: 12,
              background: '#fff',
              border: '1.5px dashed #E91E63',
              borderRadius: 12,
              padding: '14px 16px',
            }}
          >
            <div style={{ fontSize: 12, fontWeight: 700, color: '#AD1457', marginBottom: 6 }}>
              &ldquo;{answer.q}&rdquo;
            </div>
            <div style={{ fontSize: 13, color: '#1a1a1a', lineHeight: 1.55, marginBottom: 10 }}>{answer.a}</div>
            {answer.samples.length > 0 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4, marginBottom: 8 }}>
                {answer.samples.map((s) => (
                  <div key={s.id} style={{ fontSize: 11.5, color: '#666' }}>
                    <span style={{ fontWeight: 700, color: '#333' }}>{s.name}</span> · {s.time} ago — &ldquo;{s.excerpt}
                    &rdquo;
                  </div>
                ))}
              </div>
            )}
            <div style={{ fontSize: 10.5, color: '#999', display: 'flex', alignItems: 'center', gap: 5 }}>
              <I n="alertTriangle" s={11} c="#999" />
              Reporting period: current sample only · denominator: {stats.total} conversations · coverage: illustrative,
              not your full history
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
