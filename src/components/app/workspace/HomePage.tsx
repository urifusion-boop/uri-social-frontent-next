'use client';

import { useEffect, useMemo, useState } from 'react';
import { ArrowRight, ArrowUp, ArrowDown, FileText, Megaphone, MessageCircle, PenLine, Users } from 'lucide-react';
import { useAuth } from '@/src/providers/AuthProvider';
import { SocialMediaAgentService } from '@/src/api/SocialMediaAgentService';
import { CampaignService } from '@/src/api/CampaignService';
import { InboxService } from '@/src/api/InboxService';

const PERIOD_DAYS = 7;

interface OverviewStats {
  contentPublished: number;
  contentPublishedPrevious: number;
  totalReach: number;
  totalReachPrevious: number;
  adCampaigns: number; // currently active/running, right now — not period-bound
  adCampaignsCreated: number; // created within the period, for the trend
  adCampaignsCreatedPrevious: number;
  customerMessages: number; // conversations with activity in the period
  customerMessagesPrevious: number;
}

const QUICK_ACTIONS = [
  {
    id: 'schedule',
    icon: PenLine,
    title: 'Create Social Media Content',
    description: 'Generate, schedule and publish AI-powered content.',
    iconBg: '#E91E63',
    cardBg: '#FDF1F6',
  },
  {
    id: 'campaigns',
    icon: Megaphone,
    title: 'Run Advertising Campaigns',
    description: 'Launch and manage ads across multiple platforms.',
    iconBg: '#F59E0B',
    cardBg: '#FEF6E7',
  },
  {
    id: 'messages',
    icon: MessageCircle,
    title: 'Manage Customer Messages',
    description: 'Respond to inquiries and automate replies.',
    iconBg: '#3B82F6',
    cardBg: '#EDF4FE',
  },
  {
    id: 'performance',
    icon: Users,
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

function InlineTrend({ value }: { value: number | null }) {
  if (value === null) return <span style={{ fontSize: 12, fontWeight: 600, color: '#9CA3AF' }}>new</span>;
  const up = value >= 0;
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 2,
        fontSize: 12,
        fontWeight: 700,
        color: up ? '#16A34A' : '#DC2626',
      }}
    >
      {up ? <ArrowUp size={12} /> : <ArrowDown size={12} />}
      {Math.abs(value)}%
    </span>
  );
}

// A small, honest "then vs. now" visual — built only from the two real period
// totals this page already fetches, never an invented daily series.
function MiniBars({ current, previous, color }: { current: number; previous: number; color: string }) {
  const max = Math.max(current, previous, 1);
  const curH = Math.max(6, Math.round((current / max) * 32));
  const prevH = Math.max(6, Math.round((previous / max) * 32));
  return (
    <div style={{ display: 'flex', alignItems: 'flex-end', gap: 4, height: 32 }}>
      <div style={{ width: 7, height: prevH, borderRadius: 3, background: `${color}33` }} />
      <div style={{ width: 7, height: curH, borderRadius: 3, background: color }} />
    </div>
  );
}

export default function HomePage({ onNavigate }: { onNavigate: (id: string) => void }) {
  const { userDetails } = useAuth();
  const [stats, setStats] = useState<OverviewStats | null>(null);

  const firstName = userDetails?.firstName || 'there';
  const greeting = useMemo(() => greetingForHour(new Date().getHours()), []);

  useEffect(() => {
    let cancelled = false;

    const windowMs = PERIOD_DAYS * 24 * 60 * 60 * 1000;
    const periodStart = Date.now() - windowMs;
    const previousPeriodStart = Date.now() - 2 * windowMs;

    Promise.all([
      SocialMediaAgentService.getPerformance(PERIOD_DAYS),
      SocialMediaAgentService.getPerformance(PERIOD_DAYS * 2),
      CampaignService.listCampaigns().catch(() => ({ campaigns: [] })),
      InboxService.listConversations({ limit: 200 }).catch(() => []),
    ]).then(([currentPerf, doublePerf, campaignsRes, conversations]) => {
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
    });

    return () => {
      cancelled = true;
    };
  }, []);

  const tiles = stats
    ? [
        {
          icon: FileText,
          color: '#E91E63',
          bg: '#FDF1F6',
          label: 'Content this week',
          value: stats.contentPublished,
          sub: 'Published',
          current: stats.contentPublished,
          previous: stats.contentPublishedPrevious,
        },
        {
          icon: Megaphone,
          color: '#F59E0B',
          bg: '#FEF6E7',
          label: 'Active campaigns',
          value: stats.adCampaigns,
          sub: 'Running',
          current: stats.adCampaignsCreated,
          previous: stats.adCampaignsCreatedPrevious,
        },
        {
          icon: MessageCircle,
          color: '#3B82F6',
          bg: '#EDF4FE',
          label: 'Customer messages',
          value: stats.customerMessages,
          sub: 'Active conversations',
          current: stats.customerMessages,
          previous: stats.customerMessagesPrevious,
        },
        {
          icon: Users,
          color: '#7C3AED',
          bg: '#F3EDFD',
          label: `Total reach (last ${PERIOD_DAYS} days)`,
          value: stats.totalReach >= 1000 ? `${(stats.totalReach / 1000).toFixed(1)}K` : stats.totalReach,
          change: pctChange(stats.totalReach, stats.totalReachPrevious),
          current: stats.totalReach,
          previous: stats.totalReachPrevious,
        },
      ]
    : [];

  return (
    <div style={{ padding: '24px 28px 32px', fontFamily: 'var(--wf)' }}>
      <h1 style={{ fontSize: 26, fontWeight: 800, color: '#1A1523', margin: '0 0 2px' }}>
        {greeting}, {firstName} 👋
      </h1>
      <div style={{ fontSize: 13.5, color: '#6B7280', marginBottom: 22 }}>
        Here&apos;s what&apos;s happening with your brand today.
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(230px, 1fr))',
          gap: 16,
          marginBottom: 16,
        }}
      >
        {QUICK_ACTIONS.map((action) => {
          const Icon = action.icon;
          return (
            <button
              key={action.id}
              onClick={() => onNavigate(action.id)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 14,
                textAlign: 'left',
                border: 'none',
                borderRadius: 16,
                padding: '18px 16px',
                background: action.cardBg,
                cursor: 'pointer',
                fontFamily: 'var(--wf)',
              }}
            >
              <div
                style={{
                  width: 42,
                  height: 42,
                  borderRadius: '50%',
                  background: action.iconBg,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}
              >
                <Icon size={19} color="#fff" />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 14.5, fontWeight: 700, color: '#1A1523', marginBottom: 2 }}>{action.title}</div>
                <div style={{ fontSize: 12, color: '#6B7280', lineHeight: 1.35 }}>{action.description}</div>
              </div>
              <div
                style={{
                  width: 28,
                  height: 28,
                  borderRadius: '50%',
                  background: 'rgba(255,255,255,.7)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}
              >
                <ArrowRight size={14} color="#1A1523" />
              </div>
            </button>
          );
        })}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(230px, 1fr))', gap: 16 }}>
        {stats === null
          ? Array.from({ length: 4 }).map((_, i) => (
              <div
                key={i}
                style={{
                  background: '#fff',
                  borderRadius: 16,
                  padding: 18,
                  boxShadow: '0 1px 3px rgba(20,16,14,.06)',
                  height: 96,
                }}
              />
            ))
          : tiles.map((tile) => {
              const Icon = tile.icon;
              return (
                <div
                  key={tile.label}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: 10,
                    background: '#fff',
                    borderRadius: 16,
                    padding: 18,
                    boxShadow: '0 1px 3px rgba(20,16,14,.06)',
                  }}
                >
                  <div style={{ minWidth: 0 }}>
                    <div
                      style={{
                        width: 32,
                        height: 32,
                        borderRadius: '50%',
                        background: tile.bg,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        marginBottom: 10,
                      }}
                    >
                      <Icon size={15} color={tile.color} />
                    </div>
                    <div style={{ fontSize: 12, color: '#6B7280', marginBottom: 5 }}>{tile.label}</div>
                    <div style={{ display: 'flex', alignItems: 'baseline', gap: 7 }}>
                      <span style={{ fontSize: 24, fontWeight: 800, color: '#1A1523' }}>{tile.value}</span>
                      {'change' in tile ? <InlineTrend value={(tile as { change: number | null }).change} /> : null}
                    </div>
                    {'sub' in tile && <div style={{ fontSize: 11.5, color: '#9CA3AF', marginTop: 1 }}>{tile.sub}</div>}
                  </div>
                  <MiniBars current={tile.current} previous={tile.previous} color={tile.color} />
                </div>
              );
            })}
      </div>
    </div>
  );
}
