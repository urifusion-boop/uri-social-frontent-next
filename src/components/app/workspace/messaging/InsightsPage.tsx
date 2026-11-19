'use client';

import { useEffect, useMemo, useState } from 'react';
import { Lightbulb } from 'lucide-react';
import { InboxService, type InboxConversationDTO } from '@/src/api/InboxService';
import { MSG_MUTED } from './MessagingHeader';
import { PLATFORM_LABEL, PlatformIcon } from './platform';
import { Bar, Box, Muted, Pane, Title } from './ui';

type Range = 7 | 30 | 90;

// Plain-language names for what Jane labelled each conversation as.
const INTENT_NAMES: Record<string, string> = {
  pricing: 'Prices and plans',
  price: 'Prices and plans',
  availability: 'Is it available?',
  order: 'Placing an order',
  delivery: 'Delivery and pickup',
  booking: 'Booking or appointments',
  complaint: 'Complaints',
  refund: 'Refunds',
  support: 'Help with an order or account',
  general_question: 'General questions',
  question: 'General questions',
  greeting: 'Greetings',
  partnership: 'Partnerships',
  other: 'Other',
};

const KEYWORD_THEMES: { label: string; keywords: string[] }[] = [
  { label: 'Prices and plans', keywords: ['price', 'how much', 'cost', '₦', 'plan'] },
  { label: 'Delivery and pickup', keywords: ['deliver', 'pick up', 'pickup', 'shipping', 'arrive'] },
  { label: 'Running ads', keywords: ['ad ', 'ads', 'advert', 'campaign', 'promote'] },
];

const HOURS = [8, 10, 12, 14, 16, 18, 20];
const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

function themeOf(c: InboxConversationDTO): string {
  const label = c.situation_label || INTENT_NAMES[c.intent || ''] || '';
  if (label) return label;
  const text = (c.excerpt || '').toLowerCase();
  return KEYWORD_THEMES.find((t) => t.keywords.some((k) => text.includes(k)))?.label || '';
}

export default function InsightsPage({ isMobile }: { isMobile: boolean }) {
  const [all, setAll] = useState<InboxConversationDTO[] | null>(null);
  const [error, setError] = useState('');
  const [range, setRange] = useState<Range>(30);
  const [loadedAt, setLoadedAt] = useState(0);

  useEffect(() => {
    InboxService.listConversations({ limit: 200 })
      .then((c) => {
        setLoadedAt(Date.now());
        setAll(c);
      })
      .catch(() => setError("Couldn't load your conversations."));
  }, []);

  const data = useMemo(() => {
    const since = loadedAt - range * 86400000;
    const convs = (all ?? []).filter((c) => !c.last_activity_at || new Date(c.last_activity_at).getTime() >= since);
    const total = convs.length;
    const resolved = convs.filter((c) => c.status === 'resolved').length;
    const waiting = convs.filter((c) => c.needs_human && c.status !== 'resolved').length;
    const leads = convs.filter((c) => c.lead_stage && c.lead_stage !== 'lost').length;
    const fromAds = convs.filter((c) => c.source_ad_id).length;
    const themes = new Map<string, number>();
    for (const c of convs) {
      const t = themeOf(c);
      if (t) themes.set(t, (themes.get(t) ?? 0) + 1);
    }
    const top = [...themes.entries()].sort((a, b) => b[1] - a[1]).slice(0, 6);
    const channels = new Map<string, number>();
    for (const c of convs) channels.set(c.platform, (channels.get(c.platform) ?? 0) + 1);
    const heat: number[][] = DAYS.map(() => HOURS.map(() => 0));
    for (const c of convs) {
      if (!c.last_activity_at) continue;
      const d = new Date(c.last_activity_at);
      const day = (d.getDay() + 6) % 7;
      const slot = HOURS.findIndex((h, i) => d.getHours() >= h && d.getHours() < (HOURS[i + 1] ?? 24));
      if (slot >= 0) heat[day][slot] += 1;
    }
    const maxHeat = Math.max(1, ...heat.flat());
    return { total, resolved, waiting, leads, fromAds, top, channels: [...channels.entries()].sort((a, b) => b[1] - a[1]), heat, maxHeat };
  }, [all, range, loadedAt]);

  if (!all) return <div style={{ padding: 28 }}><Muted>{error || 'Loading…'}</Muted></div>;

  const pct = (n: number) => (data.total ? Math.round((n / data.total) * 100) : 0);
  const stats = [
    { label: 'Conversations', value: String(data.total) },
    { label: 'Resolved rate', value: `${pct(data.resolved)}%` },
    { label: 'Waiting for a person', value: String(data.waiting) },
    { label: 'Leads from chats', value: String(data.leads) },
    { label: 'From your ads', value: String(data.fromAds) },
  ];
  const maxChannel = Math.max(1, ...data.channels.map(([, n]) => n));
  const topTheme = data.top[0];

  return (
    <div style={{ padding: isMobile ? 14 : '0 28px 28px' }}>
      <Pane style={{ display: 'block', padding: '18px 20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 10, flexWrap: 'wrap' }}>
          <Title sub="What your customers keep asking about.">Insights</Title>
          <div style={{ display: 'flex', background: '#F6F2F4', borderRadius: 8, padding: 3, gap: 2 }}>
            {([7, 30, 90] as Range[]).map((r) => (
              <button
                key={r}
                type="button"
                onClick={() => setRange(r)}
                style={{ border: 'none', fontSize: 11.5, padding: '4px 10px', borderRadius: 6, cursor: 'pointer', fontFamily: 'inherit', background: range === r ? '#fff' : 'transparent', color: range === r ? '#D0145C' : '#5C5460', fontWeight: range === r ? 600 : 500, boxShadow: range === r ? '0 1px 2px rgba(0,0,0,.06)' : undefined }}
              >
                {r} days
              </button>
            ))}
          </div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr 1fr' : 'repeat(5, 1fr)', gap: 12, marginTop: 14 }}>
          {stats.map((s) => (
            <Box key={s.label} style={{ padding: '12px 14px' }}>
              <div style={{ fontSize: 11, color: MSG_MUTED }}>{s.label}</div>
              <div style={{ fontSize: 21, fontWeight: 700, marginTop: 3 }}>{s.value}</div>
            </Box>
          ))}
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1.2fr 1fr 1.1fr', gap: 12, marginTop: 14 }}>
          <Box style={{ padding: '14px 16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ fontSize: 12.5, fontWeight: 600 }}>Top questions</span>
              <span style={{ fontSize: 11, color: MSG_MUTED }}>From Jane&apos;s labels</span>
            </div>
            {data.top.map(([t, n]) => (
              <div key={t} style={{ marginTop: 11 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12.5 }}>
                  <span>{t}</span>
                  <span style={{ color: MSG_MUTED }}>{pct(n)}%</span>
                </div>
                <div style={{ marginTop: 5 }}>
                  <Bar percent={(n / (data.top[0]?.[1] || 1)) * 100} />
                </div>
              </div>
            ))}
            {data.top.length === 0 && <Muted style={{ marginTop: 12 }}>Themes appear as customers write in.</Muted>}
          </Box>
          <Box style={{ padding: '14px 16px' }}>
            <span style={{ fontSize: 12.5, fontWeight: 600 }}>Conversations by channel</span>
            {data.channels.map(([p, n]) => (
              <div key={p} style={{ display: 'flex', gap: 10, marginTop: 12, alignItems: 'center' }}>
                <PlatformIcon platform={p} size={22} radius="6px" />
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12.5 }}>
                    <span>{PLATFORM_LABEL[p] ?? p}</span>
                    <span style={{ color: MSG_MUTED }}>{n}</span>
                  </div>
                  <div style={{ marginTop: 5 }}>
                    <Bar percent={(n / maxChannel) * 100} />
                  </div>
                </div>
              </div>
            ))}
            {topTheme && (
              <div style={{ marginTop: 16, padding: '10px 12px', background: '#FDF1F6', border: '1px solid #F6C9DB', borderRadius: 10, fontSize: 12, lineHeight: 1.5 }}>
                <Lightbulb size={14} color="#D0145C" style={{ verticalAlign: -2, marginRight: 4 }} />
                <b>{pct(topTheme[1])}%</b> of chats are about {topTheme[0].toLowerCase()}. A quick reply or an FAQ answer could
                answer them instantly.
              </div>
            )}
          </Box>
          <Box style={{ padding: '14px 16px' }}>
            <span style={{ fontSize: 12.5, fontWeight: 600 }}>When customers write</span>
            <div style={{ marginTop: 8 }}>
              {DAYS.map((d, di) => (
                <div key={d} style={{ display: 'flex', gap: 6, marginTop: 5, alignItems: 'center' }}>
                  <span style={{ fontSize: 11, color: MSG_MUTED, width: 26 }}>{d}</span>
                  {HOURS.map((h, hi) => (
                    <span
                      key={h}
                      title={`${data.heat[di][hi]} conversation${data.heat[di][hi] === 1 ? '' : 's'}`}
                      style={{ flex: 1, height: 18, borderRadius: 4, background: `rgba(224,21,107,${0.06 + (data.heat[di][hi] / data.maxHeat) * 0.84})` }}
                    />
                  ))}
                </div>
              ))}
              <div style={{ display: 'flex', gap: 6, marginTop: 5 }}>
                <span style={{ width: 26 }} />
                {HOURS.map((h) => (
                  <span key={h} style={{ flex: 1, fontSize: 10.5, color: MSG_MUTED, textAlign: 'center' }}>
                    {h > 12 ? `${h - 12}pm` : h === 12 ? '12pm' : `${h}am`}
                  </span>
                ))}
              </div>
              <Muted style={{ marginTop: 8 }}>By each conversation&apos;s latest message.</Muted>
            </div>
          </Box>
        </div>
      </Pane>
    </div>
  );
}
