'use client';

import { useEffect, useMemo, useState } from 'react';
import { ArrowDown, ArrowRight, ArrowUp, FileText, Megaphone, MessageCircle, PenLine, Users } from 'lucide-react';
import { useAuth } from '@/src/providers/AuthProvider';
import { SocialMediaAgentService } from '@/src/api/SocialMediaAgentService';
import { CampaignService } from '@/src/api/CampaignService';
import { InboxService } from '@/src/api/InboxService';
import { BrandProfileService, type PlaybookHealthData } from '@/src/api/BrandProfileService';
import { useConnectedAccounts } from '@/src/hooks/useConnectedAccounts';
import { useIsMobile } from '@/src/hooks/useIsMobile';
import { categorize } from '@/src/components/app/social-media/ContentLibrary/ContentLibraryPage';

type PeriodDays = 7 | 30;
type ContentTabId = 'create' | 'library' | 'calendar-v2';

const PINK = '#C2185B';
const PINK2 = '#E0407F';
const INK = '#1A1523';
const MUTED = '#6B7280';

interface OverviewStats {
  contentPublished: number;
  contentPublishedPrevious: number;
  totalReach: number;
  totalReachPrevious: number;
  adCampaigns: number; // currently active/running, right now — not period-bound
  adCampaignsCreated: number; // created within the period, for the trend
  adCampaignsCreatedPrevious: number;
  campaignsEver: number;
  customerMessages: number; // conversations with activity in the period
  customerMessagesPrevious: number;
}

interface LibraryCounts {
  drafts: number;
  scheduled: number;
  published: number;
}

const QUICK_ACTIONS = [
  {
    id: 'schedule',
    icon: PenLine,
    title: 'Create Content',
    description: 'Generate, schedule and publish AI-powered content.',
    iconBg: '#C2185B',
    cardBg: '#FDF1F6',
    shadow: 'rgba(194,24,91,.13)',
    pillColor: '#C2185B',
  },
  {
    id: 'campaign-wizard',
    icon: Megaphone,
    title: 'Run Campaigns',
    description: 'Launch and manage ads across multiple platforms.',
    iconBg: '#F59E0B',
    cardBg: '#FEF6E7',
    shadow: 'rgba(245,158,11,.13)',
    pillColor: '#B86A00',
  },
  {
    id: 'messages',
    icon: MessageCircle,
    title: 'Manage Messages',
    description: 'Respond to inquiries and automate replies.',
    iconBg: '#3B82F6',
    cardBg: '#EDF4FE',
    shadow: 'rgba(59,130,246,.13)',
    pillColor: '#2563EB',
  },
  {
    id: 'performance',
    icon: Users,
    title: 'View Performance',
    description: 'Track results and grow your business.',
    iconBg: '#7C3AED',
    cardBg: '#F3EDFD',
    shadow: 'rgba(124,58,237,.13)',
    pillColor: '#6D28D9',
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

// A small trend visual built only from the two real period totals this page
// already fetches (current vs. the period before it) — the in-between bars
// are a straight-line interpolation between those two real numbers, not an
// invented daily series, so there's no false claim of day-by-day data.
function MiniBars({ current, previous, color }: { current: number; previous: number; color: string }) {
  const steps = 5;
  const values = Array.from({ length: steps }, (_, i) => previous + ((current - previous) * i) / (steps - 1));
  const max = Math.max(...values, 1);
  return (
    <div style={{ display: 'flex', alignItems: 'flex-end', gap: 3, height: 30 }}>
      {values.map((v, i) => {
        const h = Math.max(4, Math.round((v / max) * 30));
        const isLast = i === values.length - 1;
        return (
          <div
            key={i}
            style={{
              width: 6,
              height: h,
              borderRadius: 2,
              background: isLast ? color : `${color}40`,
            }}
          />
        );
      })}
    </div>
  );
}

const plural = (n: number, one: string, many = `${one}s`) => `${n} ${n === 1 ? one : many}`;
const compact = (n: number) => (n >= 1000 ? `${(n / 1000).toFixed(1)}K` : String(n));

function Ring({ done, total, size = 64 }: { done: number; total: number; size?: number }) {
  const r = 26;
  const c = 2 * Math.PI * r;
  return (
    <div style={{ width: size, height: size, position: 'relative', flex: 'none' }}>
      <svg width={size} height={size} viewBox="0 0 64 64" aria-hidden>
        <defs>
          <linearGradient id="home-ring" x1="0" x2="1">
            <stop stopColor={PINK} />
            <stop offset="1" stopColor={PINK2} />
          </linearGradient>
        </defs>
        <circle cx={32} cy={32} r={r} fill="none" stroke="#F4E8ED" strokeWidth={7} />
        <circle
          cx={32}
          cy={32}
          r={r}
          fill="none"
          stroke="url(#home-ring)"
          strokeWidth={7}
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={c * (1 - done / Math.max(total, 1))}
          transform="rotate(-90 32 32)"
        />
      </svg>
      <span
        style={{
          position: 'absolute',
          inset: 0,
          display: 'grid',
          placeItems: 'center',
          fontWeight: 900,
          fontSize: size < 56 ? 13 : 16,
          color: INK,
        }}
      >
        {done}/{total}
      </span>
    </div>
  );
}

interface Step {
  key: string;
  title: string;
  note: string;
  done: boolean;
  progress?: number; // 0..1, shown as a bar
  action: string;
  primary?: boolean;
  go: () => void;
}

interface Pick {
  emoji: string;
  title: string;
  note: string;
  action: string;
  go: () => void;
}

const card: React.CSSProperties = {
  background: '#fff',
  borderRadius: 20,
  padding: '20px 22px',
  boxShadow: '0 14px 34px -24px rgba(120,20,60,.45), 0 0 0 1px rgba(194,24,91,.06)',
};

export default function HomePage({
  onNavigate,
  onOpenContent,
}: {
  onNavigate: (id: string) => void;
  /** Opens a Content Studio tab (Library, Calendar, Create). Falls back to Content Studio. */
  onOpenContent?: (tab: ContentTabId) => void;
}) {
  const { userDetails } = useAuth();
  const isMobile = useIsMobile();
  const connected = useConnectedAccounts();
  const [period, setPeriod] = useState<PeriodDays>(7);
  const [stats, setStats] = useState<OverviewStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [library, setLibrary] = useState<LibraryCounts | null>(null);
  const [health, setHealth] = useState<PlaybookHealthData | null>(null);

  const firstName = userDetails?.firstName || 'there';
  const greeting = useMemo(() => greetingForHour(new Date().getHours()), []);
  const today = useMemo(
    () => new Date().toLocaleDateString('en-US', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }),
    []
  );
  const openContent = (tab: ContentTabId) => (onOpenContent ? onOpenContent(tab) : onNavigate('schedule'));

  // Drafts / scheduled / published — the same sources and grouping the Content Library uses.
  useEffect(() => {
    let cancelled = false;
    Promise.all([
      SocialMediaAgentService.getContentCalendar().catch(() => null),
      SocialMediaAgentService.getScheduled().catch(() => null),
    ]).then(([calendarRes, scheduledRes]) => {
      if (cancelled || (!calendarRes && !scheduledRes)) return;
      const byId = new Map<string, Parameters<typeof categorize>[0]>();
      for (const d of [
        ...(calendarRes?.responseData?.drafts ?? []),
        ...(scheduledRes?.responseData?.scheduled_drafts ?? []),
      ]) {
        const id = d.id ?? d.draft_id;
        if (id) byId.set(id, d);
      }
      const counts: LibraryCounts = { drafts: 0, scheduled: 0, published: 0 };
      for (const d of byId.values()) {
        const c = categorize(d);
        if (c === 'draft') counts.drafts++;
        else if (c === 'scheduled') counts.scheduled++;
        else if (c === 'published') counts.published++;
      }
      setLibrary(counts);
    });
    BrandProfileService.getHealth().then((h) => !cancelled && setHealth(h));
    return () => {
      cancelled = true;
    };
  }, []);

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
          campaignsEver: campaigns.length,
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

  const platforms = connected.loaded ? connected.platforms.map((p) => p.toLowerCase()) : null;
  const hasFacebook = platforms?.includes('facebook') ?? false;
  const hasInstagram = platforms?.includes('instagram') ?? false;
  // A Page that was connected once but whose connection has stopped working still has an entry.
  const facebookNeedsReconnect = !hasFacebook && (connected.connections?.facebook?.length ?? 0) > 0;
  const totalContent = library ? library.drafts + library.scheduled + library.published : 0;

  // ── Setup checklist — only steps we can actually check are shown ────────
  const steps: Step[] = [];
  if (platforms) {
    steps.push({
      key: 'facebook',
      title: facebookNeedsReconnect ? 'Reconnect Facebook' : 'Connect Facebook',
      note: hasFacebook
        ? 'Your Facebook Page is connected'
        : facebookNeedsReconnect
          ? 'Your Page connection stopped working — reconnect to keep posting'
          : 'Post to your Page and run ads from it',
      done: hasFacebook,
      action: facebookNeedsReconnect ? 'Reconnect' : 'Connect',
      go: () => onNavigate('connections'),
    });
  }
  if (library) {
    steps.push({
      key: 'publish',
      title: 'Publish your first post',
      note: library.published ? `${plural(library.published, 'post')} published so far` : 'Pick a draft and publish it',
      done: library.published > 0,
      action: 'Open library',
      go: () => openContent('library'),
    });
  }
  if (health) {
    const ratio = health.total ? health.filled / health.total : 0;
    steps.push({
      key: 'playbook',
      title: 'Finish your Brand Playbook',
      note: `${health.filled} of ${health.total} filled${health.suggestions?.length ? ` · ${plural(health.suggestions.length, 'quick win')} to add next` : ''}`,
      done: ratio >= 0.8,
      progress: ratio,
      action: 'Finish playbook',
      primary: true,
      go: () => onNavigate('playbook'),
    });
  }
  if (platforms) {
    steps.push({
      key: 'instagram',
      title: 'Connect Instagram',
      note: hasInstagram ? 'Instagram is connected' : 'Post and reply to DMs from one place',
      done: hasInstagram,
      action: 'Connect',
      go: () => onNavigate('connections'),
    });
  }
  if (library) {
    steps.push({
      key: 'plan',
      title: 'Plan your month',
      note: totalContent ? `${plural(totalContent, 'post')} in your plan` : 'Let Jane write a 30-day content plan',
      done: totalContent > 0,
      action: 'Plan it',
      go: () => openContent('calendar-v2'),
    });
  }
  const doneCount = steps.filter((s) => s.done).length;
  const showChecklist = steps.length > 0 && doneCount < steps.length;
  // The first unfinished step gets the filled button; the rest are outlined.
  const firstTodo = steps.find((s) => !s.done)?.key;

  // ── Jane's picks — the most useful next things, from real data ──────────
  const picks: Pick[] = [];
  if (library && library.drafts > 0) {
    picks.push({
      emoji: '🗓️',
      title: `${plural(library.drafts, 'draft')} ready to schedule`,
      note: 'Written and waiting — schedule them in a couple of taps',
      action: 'Open',
      go: () => openContent('library'),
    });
  }
  if (stats && stats.campaignsEver === 0) {
    picks.push({
      emoji: '📣',
      title: 'Run your first ad',
      note: 'Jane builds it — nothing spends until you approve',
      action: 'Start',
      go: () => onNavigate('campaign-wizard'),
    });
  }
  if (health?.suggestions?.length) {
    picks.push({
      emoji: '✨',
      title: `Add "${health.suggestions[0].label}" to your playbook`,
      note: health.suggestions[0].why || 'So Jane guesses less about your brand',
      action: 'Add',
      go: () => onNavigate('playbook'),
    });
  }
  if (platforms && !hasInstagram && picks.length < 3) {
    picks.push({
      emoji: '📸',
      title: 'Connect Instagram',
      note: 'Post there too, and answer DMs from Uri',
      action: 'Connect',
      go: () => onNavigate('connections'),
    });
  }
  if (picks.length === 0) {
    picks.push({
      emoji: '✍️',
      title: "Create today's post",
      note: 'Describe it in a line — Jane writes and designs it',
      action: 'Create',
      go: () => openContent('create'),
    });
  }

  // ── One real number on each shortcut card ───────────────────────────────
  const pillFor = (id: string): string | null => {
    if (id === 'schedule')
      return library
        ? library.published || library.drafts
          ? `${library.published} published · ${library.drafts} drafts`
          : 'Nothing created yet'
        : null;
    if (id === 'campaign-wizard')
      return stats
        ? stats.adCampaigns
          ? `${plural(stats.adCampaigns, 'campaign')} live`
          : stats.campaignsEver
            ? 'None live right now'
            : 'No campaigns yet'
        : null;
    if (id === 'messages') return stats ? `${stats.customerMessages} this ${period === 7 ? 'week' : 'month'}` : null;
    if (id === 'performance') return stats ? `${compact(stats.totalReach)} reach · last ${period} days` : null;
    return null;
  };

  const tiles = stats
    ? [
        {
          icon: FileText,
          color: '#C2185B',
          bg: '#FDF1F6',
          label: 'Content Published',
          current: stats.contentPublished,
          previous: stats.contentPublishedPrevious,
          value: stats.contentPublished,
          display: String(stats.contentPublished),
          change: pctChange(stats.contentPublished, stats.contentPublishedPrevious),
          empty: period === 7 ? 'none this week' : 'none this month',
          fix: library?.drafts
            ? { label: 'Schedule a draft', go: () => openContent('library') }
            : { label: 'Create a post', go: () => openContent('create') },
        },
        {
          icon: Megaphone,
          color: '#F59E0B',
          bg: '#FEF6E7',
          label: 'Ad Campaigns',
          current: stats.adCampaignsCreated,
          previous: stats.adCampaignsCreatedPrevious,
          value: stats.adCampaigns,
          display: String(stats.adCampaigns),
          change: pctChange(stats.adCampaignsCreated, stats.adCampaignsCreatedPrevious),
          empty: 'none running',
          fix: { label: 'Start a campaign', go: () => onNavigate('campaign-wizard') },
        },
        {
          icon: MessageCircle,
          color: '#3B82F6',
          bg: '#EDF4FE',
          label: 'Customer Messages',
          current: stats.customerMessages,
          previous: stats.customerMessagesPrevious,
          value: stats.customerMessages,
          display: String(stats.customerMessages),
          change: pctChange(stats.customerMessages, stats.customerMessagesPrevious),
          empty: hasInstagram || hasFacebook ? 'none yet' : 'no account connected',
          fix: hasInstagram || hasFacebook ? null : { label: 'Connect', go: () => onNavigate('connections') },
        },
        {
          icon: Users,
          color: '#7C3AED',
          bg: '#F3EDFD',
          label: 'Total Reach',
          current: stats.totalReach,
          previous: stats.totalReachPrevious,
          value: stats.totalReach,
          display: compact(stats.totalReach),
          change: pctChange(stats.totalReach, stats.totalReachPrevious),
          empty: 'none yet',
          fix: null,
        },
      ]
    : [];

  return (
    <div
      style={{
        minHeight: '100%',
        padding: isMobile ? '16px 14px 28px' : '20px 24px 32px',
        fontFamily: 'var(--wf)',
        background: 'linear-gradient(180deg, #FDF2F6 0%, #FBF8F7 40%, #FAFAF8 100%)',
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'space-between',
          marginBottom: 20,
          gap: 12,
        }}
      >
        <div>
          <div
            style={{ fontSize: 11, fontWeight: 600, color: '#9CA3AF', letterSpacing: 0.6, textTransform: 'uppercase' }}
          >
            Welcome back
          </div>
          <h1 style={{ fontSize: isMobile ? 24 : 28, fontWeight: 800, color: INK, margin: '4px 0 2px' }}>
            {greeting}, {firstName} 👋
          </h1>
          <div style={{ fontSize: 13.5, color: MUTED }}>Here&apos;s what&apos;s happening with your brand today.</div>
        </div>
        {!isMobile && <div style={{ fontSize: 12.5, color: '#9CA3AF', whiteSpace: 'nowrap' }}>{today}</div>}
      </div>

      {/* Shortcut cards — the same four as before, now each with one real number */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(230px, 1fr))',
          gap: 16,
          marginBottom: 20,
        }}
      >
        {QUICK_ACTIONS.map((action) => {
          const Icon = action.icon;
          const pill = pillFor(action.id);
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
                padding: '20px 18px',
                background: action.cardBg,
                boxShadow: `0 6px 16px ${action.shadow}`,
                cursor: 'pointer',
                fontFamily: 'var(--wf)',
              }}
            >
              <div
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: '50%',
                  background: action.iconBg,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}
              >
                <Icon size={20} color="#fff" />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 14.5, fontWeight: 700, color: INK, marginBottom: 3, whiteSpace: 'nowrap' }}>
                  {action.title}
                </div>
                <div style={{ fontSize: 12, color: MUTED, lineHeight: 1.4 }}>{action.description}</div>
                {pill && (
                  <span
                    style={{
                      display: 'inline-block',
                      marginTop: 8,
                      background: 'rgba(255,255,255,.85)',
                      borderRadius: 999,
                      padding: '3px 10px',
                      fontSize: 11.5,
                      fontWeight: 800,
                      color: action.pillColor,
                    }}
                  >
                    {pill}
                  </span>
                )}
              </div>
              <div
                style={{
                  width: 28,
                  height: 28,
                  borderRadius: '50%',
                  background: 'rgba(255,255,255,.75)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}
              >
                <ArrowRight size={14} color={INK} />
              </div>
            </button>
          );
        })}
      </div>

      {/* Setup checklist + Jane's picks */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: showChecklist && !isMobile ? '1.25fr 1fr' : '1fr',
          gap: 16,
          marginBottom: 18,
          alignItems: 'stretch',
        }}
      >
        {showChecklist && (
          <div style={{ ...card, padding: '16px 18px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 6 }}>
              <Ring done={doneCount} total={steps.length} size={46} />
              <div style={{ minWidth: 0 }}>
                <div style={{ fontSize: 16.5, fontWeight: 900, letterSpacing: -0.2, color: INK }}>
                  Get your brand fully set up
                </div>
                <div style={{ fontSize: 12.5, color: MUTED, marginTop: 1 }}>
                  {steps.length - doneCount === 1 ? 'One more step' : `${steps.length - doneCount} more steps`} and Jane
                  can run everything for you.
                </div>
              </div>
            </div>

            {steps
              .filter((s) => !s.done)
              .map((s) => (
                <div
                  key={s.key}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10,
                    padding: '9px 2px',
                    borderTop: '1px solid #F7F0F3',
                  }}
                >
                  <span
                    aria-hidden
                    style={{
                      width: 8,
                      height: 8,
                      borderRadius: '50%',
                      flex: 'none',
                      background: s.key === firstTodo ? PINK : '#EBC6D5',
                    }}
                  />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ fontSize: 14, fontWeight: 700, color: INK, whiteSpace: 'nowrap' }}>{s.title}</span>
                      {typeof s.progress === 'number' && (
                        <span
                          aria-hidden
                          style={{
                            height: 5,
                            borderRadius: 5,
                            background: '#F4E8ED',
                            width: 64,
                            overflow: 'hidden',
                            flex: 'none',
                          }}
                        >
                          <span
                            style={{
                              display: 'block',
                              height: '100%',
                              width: `${Math.round(s.progress * 100)}%`,
                              background: `linear-gradient(90deg, ${PINK}, ${PINK2})`,
                            }}
                          />
                        </span>
                      )}
                    </div>
                    <div
                      style={{
                        fontSize: 12,
                        color: MUTED,
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                      }}
                    >
                      {s.note}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={s.go}
                    style={{
                      borderRadius: 999,
                      padding: '6px 12px',
                      fontFamily: 'inherit',
                      fontSize: 12,
                      fontWeight: 800,
                      cursor: 'pointer',
                      whiteSpace: 'nowrap',
                      ...(s.key === firstTodo
                        ? {
                            border: 0,
                            color: '#fff',
                            background: `linear-gradient(135deg, ${PINK}, ${PINK2})`,
                            boxShadow: '0 6px 14px -8px rgba(194,24,91,.6)',
                          }
                        : { border: '1px solid #EADDE2', color: INK, background: '#fff' }),
                    }}
                  >
                    {s.action}
                  </button>
                </div>
              ))}

            {doneCount > 0 && (
              <div
                style={{
                  display: 'flex',
                  flexWrap: 'wrap',
                  gap: 6,
                  paddingTop: 10,
                  borderTop: '1px solid #F7F0F3',
                }}
              >
                {steps
                  .filter((s) => s.done)
                  .map((s) => (
                    <span
                      key={s.key}
                      title={s.note}
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 5,
                        background: '#EEF8F2',
                        color: '#1E7A45',
                        borderRadius: 999,
                        padding: '4px 10px',
                        fontSize: 11.5,
                        fontWeight: 800,
                      }}
                    >
                      ✓ {s.title}
                    </span>
                  ))}
              </div>
            )}
          </div>
        )}

        <div
          style={{
            ...card,
            padding: '16px 16px',
            position: 'relative',
            overflow: 'hidden',
            color: '#fff',
            background: 'linear-gradient(150deg, #2A0F1E 0%, #4A1430 60%, #7A1E4E 100%)',
          }}
        >
          <span
            aria-hidden
            style={{
              position: 'absolute',
              right: -60,
              top: -60,
              width: 180,
              height: 180,
              borderRadius: '50%',
              background: 'rgba(224,64,127,.25)',
              filter: 'blur(10px)',
            }}
          />
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, position: 'relative', marginBottom: 4 }}>
            <span
              style={{
                width: 30,
                height: 30,
                borderRadius: '50%',
                background: 'linear-gradient(135deg, #F06292, #C2185B)',
                display: 'grid',
                placeItems: 'center',
                fontWeight: 900,
                fontSize: 13,
              }}
            >
              J
            </span>
            <div>
              <div style={{ fontWeight: 800, fontSize: 14.5 }}>Jane&apos;s picks for today</div>
              <div style={{ fontSize: 11.5, color: '#F3C6D8', fontWeight: 600 }}>
                From your content, campaigns and playbook
              </div>
            </div>
          </div>
          {picks.slice(0, 3).map((p) => (
            <button
              key={p.title}
              type="button"
              onClick={p.go}
              title={p.note}
              style={{
                display: 'flex',
                gap: 10,
                alignItems: 'center',
                width: '100%',
                textAlign: 'left',
                background: 'rgba(255,255,255,.08)',
                border: '1px solid rgba(255,255,255,.10)',
                borderRadius: 12,
                padding: '9px 12px',
                marginTop: 8,
                cursor: 'pointer',
                fontFamily: 'inherit',
                color: '#fff',
                position: 'relative',
              }}
            >
              <span aria-hidden style={{ fontSize: 15, flex: 'none' }}>
                {p.emoji}
              </span>
              <span style={{ flex: 1, minWidth: 0 }}>
                <b
                  style={{
                    display: 'block',
                    fontSize: 13.5,
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                  }}
                >
                  {p.title}
                </b>
                <small
                  style={{
                    display: 'block',
                    fontSize: 11.5,
                    color: '#F3D3E0',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                  }}
                >
                  {p.note}
                </small>
              </span>
              <span style={{ fontSize: 12, fontWeight: 800, color: '#FFB8D2', whiteSpace: 'nowrap', flex: 'none' }}>
                {p.action} →
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Real activity for the chosen period */}
      <div style={{ ...card, padding: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
          <div style={{ fontSize: 15, fontWeight: 700, color: INK }}>
            Overview <span style={{ fontWeight: 400, color: '#9CA3AF' }}>(Last {period} days)</span>
          </div>
          <div style={{ position: 'relative' }}>
            <select
              value={period}
              onChange={(e) => setPeriod(Number(e.target.value) as PeriodDays)}
              style={{
                appearance: 'none',
                WebkitAppearance: 'none',
                fontSize: 12.5,
                fontWeight: 600,
                color: '#374151',
                border: '1px solid #E5E3DF',
                borderRadius: 999,
                padding: '7px 30px 7px 14px',
                background: '#fff',
                cursor: 'pointer',
                fontFamily: 'var(--wf)',
              }}
            >
              <option value={7}>Last 7 days</option>
              <option value={30}>Last 30 days</option>
            </select>
            <ArrowDown
              size={13}
              color="#9CA3AF"
              style={{
                position: 'absolute',
                right: 12,
                top: '50%',
                transform: 'translateY(-50%)',
                pointerEvents: 'none',
              }}
            />
          </div>
        </div>

        {loading ? (
          <div style={{ padding: '24px 0', textAlign: 'center', fontSize: 12.5, color: '#9CA3AF' }}>Loading…</div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 14 }}>
            {tiles
              .map((tile) => {
                const Icon = tile.icon;
                return (
                  <div
                    key={tile.label}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: 10,
                      border: '1px solid #EDECEA',
                      borderRadius: 14,
                      padding: 18,
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
                          marginBottom: 11,
                        }}
                      >
                        <Icon size={15} color={tile.color} />
                      </div>
                      <div style={{ fontSize: 12, color: '#6B7280', marginBottom: 6, whiteSpace: 'nowrap' }}>
                        {tile.label}
                      </div>
                      <div style={{ display: 'flex', alignItems: 'baseline', gap: 7 }}>
                        <span
                          style={{
                            fontSize: 22,
                            fontWeight: 800,
                            color: '#1A1523',
                            fontVariantNumeric: 'tabular-nums',
                          }}
                        >
                          {tile.display}
                        </span>
                        {/* A zero says why instead of a green "↑ 0%". */}
                        {tile.value === 0 ? (
                          <span style={{ fontSize: 11.5, fontWeight: 600, color: '#9CA3AF' }}>{tile.empty}</span>
                        ) : (
                          <InlineTrend value={tile.change} />
                        )}
                      </div>
                      {tile.value === 0 && tile.fix && (
                        <button
                          type="button"
                          onClick={tile.fix.go}
                          style={{
                            marginTop: 4,
                            padding: 0,
                            border: 0,
                            background: 'none',
                            cursor: 'pointer',
                            fontFamily: 'inherit',
                            fontSize: 12,
                            fontWeight: 800,
                            color: PINK,
                          }}
                        >
                          {tile.fix.label} →
                        </button>
                      )}
                    </div>
                    <MiniBars current={tile.current} previous={tile.previous} color={tile.color} />
                  </div>
                );
              })}
          </div>
        )}
      </div>
    </div>
  );
}
