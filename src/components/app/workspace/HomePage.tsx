'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  ArrowRight,
  ArrowDown,
  ArrowUp,
  BarChart3,
  FileText,
  Megaphone,
  MessageCircle,
  PenLine,
  Users,
} from 'lucide-react';
import { useAuth } from '@/src/providers/AuthProvider';
import { SocialMediaAgentService } from '@/src/api/SocialMediaAgentService';
import { CampaignService } from '@/src/api/CampaignService';
import { InboxService } from '@/src/api/InboxService';

type PeriodDays = 7 | 30;

interface OverviewStats {
  contentPublished: number;
  contentPublishedPrevious: number;
  totalReach: number;
  totalReachPrevious: number;
  adCampaigns: number; // currently active/running, right now — not period-bound
  adCampaignsCreated: number; // created within the period, for the trend arrow
  adCampaignsCreatedPrevious: number;
  customerMessages: number; // conversations with activity in the period
  customerMessagesPrevious: number;
}

const QUICK_ACTIONS = [
  {
    id: 'schedule',
    icon: PenLine,
    title: 'Create Content',
    description: 'Generate, schedule and publish AI-powered content.',
    iconBg: '#E91E63',
    cardBg: '#FDF1F6',
  },
  {
    id: 'campaigns',
    icon: Megaphone,
    title: 'Run Campaigns',
    description: 'Launch and manage ads across multiple platforms.',
    iconBg: '#F59E0B',
    cardBg: '#FEF6E7',
  },
  {
    id: 'messages',
    icon: MessageCircle,
    title: 'Manage Messages',
    description: 'Respond to inquiries and automate replies.',
    iconBg: '#3B82F6',
    cardBg: '#EDF4FE',
  },
  {
    id: 'performance',
    icon: BarChart3,
    title: 'View Performance',
    description: 'Track results and grow your business.',
    iconBg: '#7C3AED',
    cardBg: '#F3EDFD',
  },
] as const;

function greetingForHour(hour: number): string {
  if (hour < 12) return 'Good morning';
  if (hour < 18) return 'Good afternoon';
  return 'Good evening';
}

// Percentage change between two REAL period totals — never a guessed/invented
// number. `null` when there's no honest baseline to compare against (the
// previous period was zero), so the UI can say "new" instead of a nonsense
// "∞%" or a silently-wrong 0%.
function pctChange(current: number, previous: number): number | null {
  if (previous === 0) return current > 0 ? null : 0;
  return Math.round(((current - previous) / previous) * 100);
}

function TrendBadge({ value }: { value: number | null }) {
  if (value === null) {
    return <span style={{ fontSize: 11.5, fontWeight: 600, color: '#9CA3AF' }}>new</span>;
  }
  const up = value >= 0;
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 2,
        fontSize: 11.5,
        fontWeight: 600,
        color: up ? '#16A34A' : '#DC2626',
      }}
    >
      {up ? <ArrowUp size={11} /> : <ArrowDown size={11} />}
      {Math.abs(value)}%
    </span>
  );
}

export default function HomePage({ onNavigate }: { onNavigate: (id: string) => void }) {
  const { userDetails } = useAuth();
  const [period, setPeriod] = useState<PeriodDays>(7);
  const [stats, setStats] = useState<OverviewStats | null>(null);
  const [loading, setLoading] = useState(true);

  const firstName = userDetails?.firstName || 'there';
  const greeting = useMemo(() => greetingForHour(new Date().getHours()), []);
  const today = useMemo(
    () => new Date().toLocaleDateString('en-US', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }),
    []
  );

  useEffect(() => {
    let cancelled = false;
    setLoading(true);

    const windowMs = period * 24 * 60 * 60 * 1000;
    const periodStart = Date.now() - windowMs;
    const previousPeriodStart = Date.now() - 2 * windowMs;

    Promise.all([
      SocialMediaAgentService.getPerformance(period),
      SocialMediaAgentService.getPerformance(period * 2),
      CampaignService.listCampaigns().catch(() => ({ campaigns: [] })),
      InboxService.listConversations({ limit: 200 }).catch(() => []),
    ])
      .then(([currentPerf, doublePerf, campaignsRes, conversations]) => {
        if (cancelled) return;

        const currentPublished = currentPerf.responseData?.total_published ?? 0;
        const doublePublished = doublePerf.responseData?.total_published ?? 0;
        const currentReach = currentPerf.responseData?.summary?.total_reach ?? 0;
        const doubleReach = doublePerf.responseData?.summary?.total_reach ?? 0;

        const campaigns = campaignsRes.campaigns ?? [];
        // Jane Ads' campaign list endpoint is Meta-specific today (Google/TikTok
        // adapters exist but aren't yet live-verified against a real account —
        // see jane_ads/adapters/). This count reflects real, currently-running
        // campaigns, not a fabricated cross-platform total.
        const activeStatuses = new Set(['active', 'live', 'in review', 'processing', 'scheduled']);
        const adCampaigns = campaigns.filter((c) => activeStatuses.has((c.status || '').toLowerCase())).length;
        const createdInPeriod = campaigns.filter(
          (c) => c.created_at && new Date(c.created_at).getTime() >= periodStart
        ).length;
        const createdInPrevious = campaigns.filter(
          (c) =>
            c.created_at &&
            new Date(c.created_at).getTime() >= previousPeriodStart &&
            new Date(c.created_at).getTime() < periodStart
        ).length;

        const activeInPeriod = conversations.filter(
          (c) => c.last_activity_at && new Date(c.last_activity_at).getTime() >= periodStart
        ).length;
        const activeInPrevious = conversations.filter(
          (c) =>
            c.last_activity_at &&
            new Date(c.last_activity_at).getTime() >= previousPeriodStart &&
            new Date(c.last_activity_at).getTime() < periodStart
        ).length;

        setStats({
          contentPublished: currentPublished,
          contentPublishedPrevious: doublePublished - currentPublished,
          totalReach: currentReach,
          totalReachPrevious: doubleReach - currentReach,
          adCampaigns,
          adCampaignsCreated: createdInPeriod,
          adCampaignsCreatedPrevious: createdInPrevious,
          customerMessages: activeInPeriod,
          customerMessagesPrevious: activeInPrevious,
        });
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [period]);

  const tiles = stats
    ? [
        {
          icon: FileText,
          color: '#E91E63',
          bg: '#FDF1F6',
          label: 'Content Published',
          value: stats.contentPublished,
          change: pctChange(stats.contentPublished, stats.contentPublishedPrevious),
        },
        {
          icon: Megaphone,
          color: '#F59E0B',
          bg: '#FEF6E7',
          label: 'Ad Campaigns',
          value: stats.adCampaigns,
          change: pctChange(stats.adCampaignsCreated, stats.adCampaignsCreatedPrevious),
        },
        {
          icon: MessageCircle,
          color: '#3B82F6',
          bg: '#EDF4FE',
          label: 'Customer Messages',
          value: stats.customerMessages,
          change: pctChange(stats.customerMessages, stats.customerMessagesPrevious),
        },
        {
          icon: Users,
          color: '#7C3AED',
          bg: '#F3EDFD',
          label: 'Total Reach',
          value: stats.totalReach >= 1000 ? `${(stats.totalReach / 1000).toFixed(1)}K` : stats.totalReach,
          change: pctChange(stats.totalReach, stats.totalReachPrevious),
        },
      ]
    : [];

  return (
    <div style={{ padding: '18px 24px 32px', fontFamily: 'var(--wf)' }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 24 }}>
        <div>
          <div
            style={{ fontSize: 11, fontWeight: 600, color: '#9CA3AF', letterSpacing: 0.6, textTransform: 'uppercase' }}
          >
            Welcome back
          </div>
          <h1 style={{ fontSize: 26, fontWeight: 800, color: '#1A1523', margin: '4px 0 2px' }}>
            {greeting}, {firstName} 👋
          </h1>
          <div style={{ fontSize: 13.5, color: '#6B7280' }}>
            Here&apos;s what&apos;s happening with your brand today.
          </div>
        </div>
        <div style={{ fontSize: 12.5, color: '#9CA3AF', whiteSpace: 'nowrap' }}>{today}</div>
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(230px, 1fr))',
          gap: 14,
          marginBottom: 20,
        }}
      >
        {QUICK_ACTIONS.map((action) => {
          const Icon = action.icon;
          return (
            <button
              key={action.id}
              onClick={() => onNavigate(action.id)}
              style={{
                textAlign: 'left',
                border: 'none',
                borderRadius: 14,
                padding: 18,
                background: action.cardBg,
                cursor: 'pointer',
                position: 'relative',
                fontFamily: 'var(--wf)',
              }}
            >
              <div
                style={{
                  width: 38,
                  height: 38,
                  borderRadius: 10,
                  background: action.iconBg,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: 12,
                }}
              >
                <Icon size={18} color="#fff" />
              </div>
              <div style={{ fontSize: 14.5, fontWeight: 700, color: '#1A1523', marginBottom: 3 }}>{action.title}</div>
              <div style={{ fontSize: 12, color: '#6B7280', lineHeight: 1.4, paddingRight: 28 }}>
                {action.description}
              </div>
              <div
                style={{
                  position: 'absolute',
                  bottom: 16,
                  right: 16,
                  width: 26,
                  height: 26,
                  borderRadius: '50%',
                  background: 'rgba(255,255,255,.7)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <ArrowRight size={13} color="#1A1523" />
              </div>
            </button>
          );
        })}
      </div>

      <div style={{ border: '1px solid #EDECEA', borderRadius: 14, padding: 18 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
          <div style={{ fontSize: 15, fontWeight: 700, color: '#1A1523' }}>
            Overview <span style={{ fontWeight: 400, color: '#9CA3AF' }}>(Last {period} days)</span>
          </div>
          <select
            value={period}
            onChange={(e) => setPeriod(Number(e.target.value) as PeriodDays)}
            style={{
              fontSize: 12.5,
              fontWeight: 600,
              color: '#374151',
              border: '1px solid #E5E3DF',
              borderRadius: 8,
              padding: '6px 10px',
              background: '#fff',
              cursor: 'pointer',
              fontFamily: 'var(--wf)',
            }}
          >
            <option value={7}>Last 7 days</option>
            <option value={30}>Last 30 days</option>
          </select>
        </div>

        {loading ? (
          <div style={{ padding: '24px 0', textAlign: 'center', fontSize: 12.5, color: '#9CA3AF' }}>Loading…</div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12 }}>
            {tiles.map((tile) => {
              const Icon = tile.icon;
              return (
                <div key={tile.label} style={{ border: '1px solid #EDECEA', borderRadius: 12, padding: 14 }}>
                  <div
                    style={{
                      width: 30,
                      height: 30,
                      borderRadius: 8,
                      background: tile.bg,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      marginBottom: 10,
                    }}
                  >
                    <Icon size={15} color={tile.color} />
                  </div>
                  <div style={{ fontSize: 12, color: '#6B7280', marginBottom: 4 }}>{tile.label}</div>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
                    <span style={{ fontSize: 22, fontWeight: 800, color: '#1A1523' }}>{tile.value}</span>
                    <TrendBadge value={tile.change} />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
