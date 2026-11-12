'use client';

import { ReactNode } from 'react';

/*
 * Insights — counts and recurring themes computed only from the conversations
 * currently loaded in the inbox. Nothing here is invented: a theme with no
 * matching conversations is not shown, and with none loaded the page says so.
 */

const I = ({ n, s = 18, c = 'currentColor' }: { n: string; s?: number; c?: string }) => {
  const p: Record<string, ReactNode> = {
    alertTriangle: (
      <>
        <polygon points="12 3 22 20 2 20" />
        <line x1="12" y1="9" x2="12" y2="14" />
        <circle cx="12" cy="17" r="1" fill={c} stroke="none" />
      </>
    ),
    trending: (
      <>
        <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" />
        <polyline points="17 6 23 6 23 12" />
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
}

const THEMES: Theme[] = [
  { id: 'price', label: 'Price & availability questions', keywords: ['price', 'stock', 'how much', 'cost', '₦'] },
  {
    id: 'delivery',
    label: 'Delivery & pickup questions',
    keywords: ['deliver', 'pick up', 'pickup', 'shipping', 'arrive'],
  },
];

function computeStats(conversations: InsightsConversation[]) {
  const total = conversations.length;
  const resolved = conversations.filter((c) => c.status === 'resolved').length;
  const urgent = conversations.filter((c) => c.status === 'urgent').length;
  const resolvedRate = total === 0 ? 0 : Math.round((resolved / total) * 100);
  return { total, resolved, urgent, resolvedRate };
}

export default function InboxInsightsPage({
  isMobile,
  conversations,
}: {
  isMobile: boolean;
  conversations: InsightsConversation[];
}) {
  const stats = computeStats(conversations);
  const themes = THEMES.map((theme) => ({
    ...theme,
    matches: conversations.filter((c) => theme.keywords.some((k) => c.excerpt.toLowerCase().includes(k))),
  })).filter((t) => t.matches.length > 0);

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
      <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr 1fr' : 'repeat(4, 1fr)', gap: 10 }}>
        {[
          { label: 'Conversations', value: stats.total },
          { label: 'Resolved', value: stats.resolved },
          { label: 'Urgent', value: stats.urgent },
          { label: 'Resolved rate', value: `${stats.resolvedRate}%` },
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
        <I n="alertTriangle" s={12} c="#999" />
        Based on the {stats.total} most recent conversations in your inbox.
      </div>

      <div>
        <div style={{ fontSize: 13, fontWeight: 800, color: '#1a1a1a', marginBottom: 10 }}>Recurring themes</div>
        {themes.length === 0 ? (
          <div style={{ fontSize: 12.5, color: '#888' }}>Not enough conversations yet.</div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {themes.map((theme) => (
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
                    marginBottom: 10,
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
                    {theme.matches.length}
                  </span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {theme.matches.slice(0, 3).map((m) => (
                    <div key={m.id} style={{ fontSize: 12, color: '#666', paddingLeft: 22 }}>
                      <span style={{ fontWeight: 700, color: '#333' }}>{m.name}</span> — &ldquo;{m.excerpt}&rdquo;
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
