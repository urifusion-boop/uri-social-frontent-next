'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { BrandProfileData, BrandProfileService } from '@/src/api/BrandProfileService';
import {
  AccountMetricItem,
  AccountMetricsData,
  AutoGenerateSettings,
  ContentDraft,
  PerformanceData,
  PerformancePost,
  SocialMediaAgentService,
} from '@/src/api/SocialMediaAgentService';
import { ToastService } from '@/src/utils/toast.util';
import { ToastTypeEnum } from '@/src/models/enum-models/ToastTypeEnum';
import ContentCalendarTab from '@/src/components/app/social-media/ContentCalendarTab';
import { PlatformStatus, SocialConnectionService } from '@/src/api/SocialConnectionService';
import { useAuth } from '@/src/providers/AuthProvider';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { ReactNode } from 'react';
import { FaFacebook, FaInstagram, FaLinkedin, FaWhatsapp } from 'react-icons/fa';
import { FaXTwitter } from 'react-icons/fa6';
import AutoGenerateTab from '@/src/components/app/social-media/AutoGenerateTab';
import ContentGeneratorForm from '@/src/components/app/social-media/ContentGeneratorForm';
import DraftCard from '@/src/components/app/social-media/DraftCard';
import ScheduledCard from '@/src/components/app/social-media/ScheduledCard';
import BillingPage from '@/src/components/app/workspace/BillingPage';
import WorkspaceCreditBadge from '@/src/components/app/workspace/WorkspaceCreditBadge';
import WorkspaceProfileDropdown from '@/src/components/app/workspace/WorkspaceProfileDropdown';

/* ── Icons ─────────────────────────────────────────────────────────────── */
const I = ({ n, s = 18, c = 'currentColor' }: { n: string; s?: number; c?: string }) => {
  const p: Record<string, ReactNode> = {
    home: <path d="M3 12l9-8 9 8M5 11v8a1 1 0 001 1h4v-5h4v5h4a1 1 0 001-1v-8" />,
    inbox: (
      <>
        <polyline points="22 12 16 12 14 15 10 15 8 12 2 12" />
        <path d="M5.45 5.11L2 12v6a2 2 0 002 2h16a2 2 0 002-2v-6l-3.45-6.89A2 2 0 0016.76 4H7.24a2 2 0 00-1.79 1.11z" />
      </>
    ),
    calendar: (
      <>
        <rect x="3" y="4" width="18" height="17" rx="2" />
        <path d="M16 2v4M8 2v4M3 10h18" />
      </>
    ),
    chart: <path d="M18 20V10M12 20V4M6 20v-6" />,
    globe: (
      <>
        <circle cx="12" cy="12" r="10" />
        <line x1="2" y1="12" x2="22" y2="12" />
        <path d="M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10 15.3 15.3 0 014-10z" />
      </>
    ),
    book: (
      <>
        <path d="M4 19.5A2.5 2.5 0 016.5 17H20" />
        <path d="M4 4.5A2.5 2.5 0 016.5 2H20v20H6.5A2.5 2.5 0 014 19.5z" />
      </>
    ),
    settings: (
      <>
        <circle cx="12" cy="12" r="3" />
        <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z" />
      </>
    ),
    send: (
      <>
        <line x1="22" y1="2" x2="11" y2="13" />
        <polygon points="22 2 15 22 11 13 2 9 22 2" />
      </>
    ),
    check: <polyline points="20 6 9 17 4 12" />,
    x: (
      <>
        <line x1="18" y1="6" x2="6" y2="18" />
        <line x1="6" y1="6" x2="18" y2="18" />
      </>
    ),
    edit: (
      <>
        <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" />
        <path d="M18.5 2.5a2.12 2.12 0 013 3L12 15l-4 1 1-4 9.5-9.5z" />
      </>
    ),
    mic: (
      <>
        <path d="M12 1a3 3 0 00-3 3v8a3 3 0 006 0V4a3 3 0 00-3-3z" />
        <path d="M19 10v2a7 7 0 01-14 0v-2" />
        <line x1="12" y1="19" x2="12" y2="23" />
        <line x1="8" y1="23" x2="16" y2="23" />
      </>
    ),
    bell: <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 01-3.46 0" />,
    trending: (
      <>
        <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" />
        <polyline points="17 6 23 6 23 12" />
      </>
    ),
    clock: (
      <>
        <circle cx="12" cy="12" r="10" />
        <polyline points="12 6 12 12 16 14" />
      </>
    ),
    heart: (
      <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z" />
    ),
    eye: (
      <>
        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
        <circle cx="12" cy="12" r="3" />
      </>
    ),
    arrowUp: (
      <>
        <line x1="12" y1="19" x2="12" y2="5" />
        <polyline points="5 12 12 5 19 12" />
      </>
    ),
    refresh: (
      <>
        <polyline points="23 4 23 10 17 10" />
        <path d="M20.49 15a9 9 0 11-2.12-9.36L23 10" />
      </>
    ),
    trash: (
      <>
        <polyline points="3 6 5 6 21 6" />
        <path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" />
      </>
    ),
    copy: (
      <>
        <rect x="9" y="9" width="13" height="13" rx="2" />
        <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" />
      </>
    ),
    plus: (
      <>
        <line x1="12" y1="5" x2="12" y2="19" />
        <line x1="5" y1="12" x2="19" y2="12" />
      </>
    ),
    image: (
      <>
        <rect x="3" y="3" width="18" height="18" rx="2" />
        <circle cx="8.5" cy="8.5" r="1.5" />
        <polyline points="21 15 16 10 5 21" />
      </>
    ),
    share: (
      <>
        <circle cx="18" cy="5" r="3" />
        <circle cx="6" cy="12" r="3" />
        <circle cx="18" cy="19" r="3" />
        <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
        <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
      </>
    ),
    calendarPlus: (
      <>
        <rect x="3" y="4" width="18" height="17" rx="2" />
        <path d="M16 2v4M8 2v4M3 10h18M12 14v4M10 16h4" />
      </>
    ),
    logout: (
      <>
        <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4" />
        <polyline points="16 17 21 12 16 7" />
        <line x1="21" y1="12" x2="9" y2="12" />
      </>
    ),
    upload: (
      <>
        <polyline points="16 16 12 12 8 16" />
        <line x1="12" y1="12" x2="12" y2="21" />
        <path d="M20.39 18.39A5 5 0 0018 9h-1.26A8 8 0 103 16.3" />
      </>
    ),
    sparkle: (
      <path
        d="M12 2l2.09 6.26L20 10.27l-4.47 3.88L16.18 21 12 17.77 7.82 21l.63-6.85L4 10.27l5.91-1.01z"
        strokeLinejoin="round"
      />
    ),
    filter: <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />,
    bookmark: <path d="M19 21l-7-5-7 5V5a2 2 0 012-2h10a2 2 0 012 2z" />,
  };
  return (
    <svg
      width={s}
      height={s}
      viewBox="0 0 24 24"
      fill="none"
      stroke={c}
      strokeWidth="1.8"
      style={{ flexShrink: 0, display: 'block' }}
    >
      {p[n]}
    </svg>
  );
};

/* ── Shared UI ──────────────────────────────────────────────────────────── */
const JaneAvatar = ({ size = 32, pulse = false }: { size?: number; pulse?: boolean }) => (
  <div
    style={{
      width: size,
      height: size,
      borderRadius: '50%',
      background: 'linear-gradient(135deg,#880E4F,#E91E63)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      flexShrink: 0,
      position: 'relative',
    }}
  >
    <span style={{ color: '#fff', fontWeight: 800, fontSize: size * 0.38 }}>J</span>
    {pulse && (
      <div
        style={{
          position: 'absolute',
          bottom: -1,
          right: -1,
          width: size * 0.3,
          height: size * 0.3,
          borderRadius: '50%',
          background: '#4caf50',
          border: '2px solid #1a0a12',
          boxShadow: '0 0 6px rgba(76,175,80,.5)',
        }}
      />
    )}
  </div>
);

const UserAvatar = ({ size = 32, initials = 'You' }: { size?: number; initials?: string }) => (
  <div
    style={{
      width: size,
      height: size,
      borderRadius: '50%',
      background: '#2a1520',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      flexShrink: 0,
    }}
  >
    <span style={{ color: '#E91E63', fontWeight: 700, fontSize: size * 0.28 }}>{initials}</span>
  </div>
);

const PlatformDot = ({ p, s = 7 }: { p: string; s?: number }) => {
  const c: Record<string, string> = {
    instagram: '#c13584',
    linkedin: '#0a66c2',
    x: '#111',
    twitter: '#1da1f2',
    facebook: '#1877f2',
    tiktok: '#010101',
  };
  return (
    <div style={{ width: s, height: s, borderRadius: 2, background: c[p?.toLowerCase()] ?? '#999', flexShrink: 0 }} />
  );
};

type BadgeV = 'default' | 'muted' | 'success' | 'danger' | 'warning';
const Bd = ({ children, v = 'default' }: { children: ReactNode; v?: BadgeV }) => {
  const m: Record<BadgeV, { bg: string; c: string; b: string }> = {
    default: { bg: 'rgba(194,24,91,.1)', c: '#AD1457', b: 'rgba(194,24,91,.18)' },
    muted: { bg: 'rgba(0,0,0,.04)', c: '#888', b: 'rgba(0,0,0,.06)' },
    success: { bg: 'rgba(76,175,80,.08)', c: '#2e7d32', b: 'rgba(76,175,80,.15)' },
    danger: { bg: 'rgba(155,44,61,.08)', c: '#9b2c3d', b: 'rgba(155,44,61,.15)' },
    warning: { bg: 'rgba(255,193,7,.1)', c: '#f57f17', b: 'rgba(255,193,7,.2)' },
  };
  const s = m[v];
  return (
    <span
      style={{
        background: s.bg,
        color: s.c,
        border: `1px solid ${s.b}`,
        padding: '2px 8px',
        borderRadius: 5,
        fontSize: 10.5,
        fontWeight: 600,
      }}
    >
      {children}
    </span>
  );
};

// Removed unused platformGradient function

/* ── Unified post item type ─────────────────────────────────────────────── */
interface PostItem {
  id: string;
  status: 'queue' | 'draft' | 'scheduled' | 'published';
  platform: string;
  type?: string;
  pillar?: string;
  caption: string;
  hashtags?: string[];
  time?: string;
  dayIndex?: number; // 0-6 for this week
  comp?: number;
  lastEdited?: string;
  auto?: boolean;
  top?: boolean;
  eng?: number;
  reach?: string;
  saves?: number;
  comments?: number;
  shares?: number;
  pub?: string;
  image_url?: string;
  raw?: ContentDraft; // original API draft for approve/deny/delete
}

// Removed unused functions and constants: draftToItem, getMondayMs, WEEK_DAYS, statusColors, statusLabels

/* ══════════════════════════════════════════════════════════════════════════
   POSTING SCHEDULE PAGE (v3)
═══════════════════════════════════════════════════════════════════════════ */
type ContentTab = 'create' | 'drafts' | 'saved' | 'scheduled' | 'auto' | 'calendar';

const ContentManagerPage = ({ onJane }: { onJane: () => void }) => {
  const [activeTab, setActiveTab] = useState<ContentTab>('create');
  const activeTabRef = useRef<ContentTab>('create');
  const [drafts, setDrafts] = useState<ContentDraft[]>([]);
  const [savedDrafts, setSavedDrafts] = useState<ContentDraft[]>([]);
  const [loadingSaved, setLoadingSaved] = useState(false);
  const [scheduled, setScheduled] = useState<ContentDraft[]>([]);
  const [autoSettings, setAutoSettings] = useState<AutoGenerateSettings | null>(null);
  const [loadingDrafts, setLoadingDrafts] = useState(false);
  const [draftsError, setDraftsError] = useState(false);
  const [loadingScheduled, setLoadingScheduled] = useState(false);
  const [loadingAuto, setLoadingAuto] = useState(false);
  const pollTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Multi-select batch scheduling
  const [selectedDraftIds, setSelectedDraftIds] = useState<Set<string>>(new Set());
  const [batchScheduleOpen, setBatchScheduleOpen] = useState(false);
  const [batchScheduledAt, setBatchScheduledAt] = useState('');
  const [batchScheduling, setBatchScheduling] = useState(false);

  const toggleDraftSelection = (id: string) => {
    setSelectedDraftIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleBatchSchedule = async () => {
    if (!batchScheduledAt) return;
    setBatchScheduling(true);
    try {
      const response = await SocialMediaAgentService.approveContent({
        draft_ids: Array.from(selectedDraftIds),
        schedule_option: 'schedule',
        scheduled_datetime: new Date(batchScheduledAt).toISOString(),
      });
      if (response.status) {
        ToastService.showToast(
          `${selectedDraftIds.size} post${selectedDraftIds.size > 1 ? 's' : ''} scheduled`,
          ToastTypeEnum.Success
        );
        setSelectedDraftIds(new Set());
        setBatchScheduleOpen(false);
        setBatchScheduledAt('');
        fetchDrafts();
      } else {
        ToastService.showToast(response.responseMessage || 'Scheduling failed', ToastTypeEnum.Error);
      }
    } catch {
      ToastService.showToast('Scheduling failed', ToastTypeEnum.Error);
    } finally {
      setBatchScheduling(false);
    }
  };

  const fetchDrafts = useCallback(async (silent = false) => {
    if (!silent) setLoadingDrafts(true);
    setDraftsError(false);
    try {
      const response = await SocialMediaAgentService.getContentCalendar();
      if (response.status && response.responseData) {
        const allDrafts = response.responseData.drafts ?? [];
        const EXCLUDE = new Set(['published', 'scheduled', 'approved', 'denied', 'replaced', 'publish_failed']);
        const filtered = allDrafts.filter((d: ContentDraft) => {
          const s = d.status;
          const a = d.approval_status;
          if (s) return !EXCLUDE.has(s);
          if (a) return a === 'pending';
          return true;
        });
        setDrafts(filtered);
        const stillPending = filtered.some((d: ContentDraft) => d.has_image && !d.image_url);
        if (stillPending && activeTabRef.current === 'drafts') {
          pollTimerRef.current = setTimeout(() => fetchDrafts(true), 4000);
        }
      } else {
        setDraftsError(true);
      }
    } catch {
      setDraftsError(true);
    } finally {
      if (!silent) setLoadingDrafts(false);
    }
  }, []);

  const fetchScheduled = useCallback(async (silent = false) => {
    if (!silent) setLoadingScheduled(true);
    try {
      const r = await SocialMediaAgentService.getScheduled();
      if (r.status && r.responseData) {
        const items: ContentDraft[] = r.responseData.scheduled_drafts ?? [];
        setScheduled(items);
        const stillPending = items.some((d: ContentDraft) => d.has_image && !d.image_url);
        if (stillPending && activeTabRef.current === 'scheduled') {
          pollTimerRef.current = setTimeout(() => fetchScheduled(true), 4000);
        }
      }
    } catch {
      /* no-op */
    } finally {
      if (!silent) setLoadingScheduled(false);
    }
  }, []);

  const fetchSaved = useCallback(async (silent = false) => {
    if (!silent) setLoadingSaved(true);
    try {
      const response = await SocialMediaAgentService.getContentCalendar();
      if (response.status && response.responseData) {
        const saved = (response.responseData.drafts ?? []).filter(
          (d: ContentDraft) =>
            d.status === 'approved' || d.status === 'ready_to_publish' || (d.status as string) === 'publish_failed'
        );
        setSavedDrafts(saved);
        const stillPending = saved.some((d: ContentDraft) => d.has_image && !d.image_url);
        if (stillPending && activeTabRef.current === 'saved') {
          pollTimerRef.current = setTimeout(() => fetchSaved(true), 4000);
        }
      }
    } catch {
      /* no-op */
    } finally {
      if (!silent) setLoadingSaved(false);
    }
  }, []);

  const fetchAuto = useCallback(async () => {
    setLoadingAuto(true);
    try {
      const r = await SocialMediaAgentService.getAutoGenerateSettings();
      if (r.status && r.responseData) setAutoSettings(r.responseData);
    } catch {
      /* no-op */
    } finally {
      setLoadingAuto(false);
    }
  }, []);

  useEffect(() => {
    activeTabRef.current = activeTab;
    if (pollTimerRef.current) clearTimeout(pollTimerRef.current);
    setSelectedDraftIds(new Set());
    if (activeTab === 'drafts') fetchDrafts();
    if (activeTab === 'saved') fetchSaved();
    if (activeTab === 'scheduled') fetchScheduled();
    if (activeTab === 'auto') fetchAuto();
  }, [activeTab, fetchDrafts, fetchSaved, fetchScheduled, fetchAuto]);

  useEffect(
    () => () => {
      if (pollTimerRef.current) clearTimeout(pollTimerRef.current);
    },
    []
  );

  const handleGenerated = () => {
    setActiveTab('drafts');
    fetchDrafts();
  };
  const handleRefreshDrafts = useCallback(() => {
    if (activeTabRef.current === 'drafts') fetchDrafts();
  }, [fetchDrafts]);

  const tabs: { key: ContentTab; label: string; count?: number }[] = [
    { key: 'create', label: 'Create' },
    { key: 'drafts', label: 'Drafts', count: drafts.length },
    { key: 'saved', label: 'Saved', count: savedDrafts.length },
    { key: 'scheduled', label: 'Scheduled', count: scheduled.length },
    { key: 'calendar', label: 'Calendar' },
    { key: 'auto', label: 'Auto' },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: '#f8f7f5' }}>
      {/* Header */}
      <div style={{ padding: '20px 24px 0', background: '#fff', borderBottom: '1px solid #edecea' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div
              style={{
                width: 36,
                height: 36,
                borderRadius: 10,
                background: 'linear-gradient(135deg,#880E4F,#E91E63)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              <I n="calendar" s={17} c="#fff" />
            </div>
            <div>
              <h2 style={{ fontSize: 16, fontWeight: 800, color: '#111', margin: 0, lineHeight: 1.2 }}>
                Content Manager
              </h2>
              <p style={{ fontSize: 11.5, color: '#999', margin: 0 }}>Create, review and schedule your posts</p>
            </div>
          </div>
          {/* Quick stats */}
          <div style={{ display: 'flex', gap: 12 }}>
            {drafts.length > 0 && (
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 16, fontWeight: 800, color: '#C2185B', lineHeight: 1 }}>{drafts.length}</div>
                <div style={{ fontSize: 10, color: '#aaa', fontWeight: 600 }}>DRAFTS</div>
              </div>
            )}
            {scheduled.length > 0 && (
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 16, fontWeight: 800, color: '#0a66c2', lineHeight: 1 }}>{scheduled.length}</div>
                <div style={{ fontSize: 10, color: '#aaa', fontWeight: 600 }}>SCHEDULED</div>
              </div>
            )}
          </div>
        </div>

        {/* Tab bar */}
        <div
          className="tab-scroll"
          style={
            {
              display: 'flex',
              gap: 2,
              overflowX: 'auto',
              WebkitOverflowScrolling: 'touch',
              scrollbarWidth: 'none',
              msOverflowStyle: 'none',
            } as React.CSSProperties
          }
        >
          {tabs.map((t) => {
            const active = activeTab === t.key;
            const icons: Record<ContentTab, string> = {
              create: 'plus',
              drafts: 'edit',
              saved: 'bookmark',
              scheduled: 'clock',
              calendar: 'calendar',
              auto: 'sparkle',
            };
            return (
              <button
                key={t.key}
                onClick={() => setActiveTab(t.key)}
                style={{
                  padding: '9px 14px 10px',
                  border: 'none',
                  background: 'none',
                  cursor: 'pointer',
                  fontSize: 13,
                  fontWeight: active ? 700 : 500,
                  fontFamily: 'var(--wf)',
                  color: active ? '#C2185B' : '#777',
                  borderBottom: active ? '2.5px solid #C2185B' : '2.5px solid transparent',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  whiteSpace: 'nowrap',
                  transition: 'color .15s',
                  outline: 'none',
                }}
              >
                <I n={icons[t.key]} s={13} c={active ? '#C2185B' : '#aaa'} />
                {t.label}
                {t.count != null && t.count > 0 && (
                  <span
                    style={{
                      background: active ? '#C2185B' : '#ede9e8',
                      color: active ? '#fff' : '#777',
                      borderRadius: 20,
                      fontSize: 10,
                      fontWeight: 700,
                      padding: '1px 7px',
                      lineHeight: '16px',
                      minWidth: 18,
                      textAlign: 'center',
                    }}
                  >
                    {t.count}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Content */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '20px 24px' }}>
        {activeTab === 'create' && <ContentGeneratorForm onGenerated={handleGenerated} />}

        {activeTab === 'drafts' && (
          <>
            {loadingDrafts ? (
              <CMSpinner />
            ) : draftsError ? (
              <CMEmptyState message="Could not load drafts." retry={fetchDrafts} />
            ) : drafts.length === 0 ? (
              <CMEmptyState message="No drafts yet. Generate content from the Create tab." />
            ) : (
              <>
                {/* Batch action bar */}
                {selectedDraftIds.size > 0 && (
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 12,
                      background: '#fff',
                      border: '1.5px solid #CD1B78',
                      borderRadius: 10,
                      padding: '10px 16px',
                      marginBottom: 12,
                    }}
                  >
                    <span style={{ fontSize: 13, fontWeight: 600, color: '#CD1B78', flex: 1 }}>
                      {selectedDraftIds.size} post{selectedDraftIds.size > 1 ? 's' : ''} selected
                    </span>
                    <button
                      onClick={() => setBatchScheduleOpen(true)}
                      style={{
                        background: '#CD1B78',
                        color: '#fff',
                        border: 'none',
                        borderRadius: 8,
                        padding: '6px 16px',
                        fontSize: 13,
                        fontWeight: 700,
                        cursor: 'pointer',
                      }}
                    >
                      Schedule All
                    </button>
                    <button
                      onClick={() => setSelectedDraftIds(new Set())}
                      style={{
                        background: 'none',
                        border: '1px solid #E5E7EB',
                        borderRadius: 8,
                        padding: '6px 12px',
                        fontSize: 13,
                        fontWeight: 600,
                        color: '#6B7280',
                        cursor: 'pointer',
                      }}
                    >
                      Clear
                    </button>
                  </div>
                )}

                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  {drafts.map((draft) => {
                    const draftId = draft.draft_id ?? draft.id ?? '';
                    return (
                      <DraftCard
                        key={draftId}
                        draft={draft}
                        onRefresh={fetchDrafts}
                        selectable
                        selected={selectedDraftIds.has(draftId)}
                        onSelectToggle={toggleDraftSelection}
                      />
                    );
                  })}
                </div>
              </>
            )}

            {/* Batch schedule dialog */}
            {batchScheduleOpen && (
              <div
                style={{
                  position: 'fixed',
                  inset: 0,
                  background: 'rgba(0,0,0,0.4)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  zIndex: 1300,
                }}
                onClick={() => setBatchScheduleOpen(false)}
              >
                <div
                  style={{
                    background: '#fff',
                    borderRadius: 16,
                    padding: 28,
                    width: 360,
                    maxWidth: '90vw',
                    boxShadow: '0 8px 32px rgba(0,0,0,0.15)',
                  }}
                  onClick={(e) => e.stopPropagation()}
                >
                  <p style={{ fontSize: 17, fontWeight: 700, color: '#111', margin: '0 0 4px' }}>
                    Schedule {selectedDraftIds.size} post{selectedDraftIds.size > 1 ? 's' : ''}
                  </p>
                  <p style={{ fontSize: 13, color: '#6B7280', margin: '0 0 20px' }}>
                    All selected posts will be scheduled for the same time.
                  </p>
                  <input
                    type="datetime-local"
                    value={batchScheduledAt}
                    onChange={(e) => setBatchScheduledAt(e.target.value)}
                    min={(() => {
                      const d = new Date(Date.now() + 5 * 60 * 1000);
                      const pad = (n: number) => String(n).padStart(2, '0');
                      return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
                    })()}
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      borderRadius: 8,
                      border: '1.5px solid #E5E7EB',
                      fontSize: 14,
                      marginBottom: 20,
                      boxSizing: 'border-box',
                    }}
                  />
                  <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
                    <button
                      onClick={() => setBatchScheduleOpen(false)}
                      style={{
                        padding: '8px 18px',
                        borderRadius: 8,
                        border: '1.5px solid #E5E7EB',
                        background: '#fff',
                        fontSize: 13,
                        fontWeight: 600,
                        color: '#374151',
                        cursor: 'pointer',
                      }}
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleBatchSchedule}
                      disabled={!batchScheduledAt || batchScheduling}
                      style={{
                        padding: '8px 18px',
                        borderRadius: 8,
                        border: 'none',
                        background: !batchScheduledAt || batchScheduling ? '#E5E7EB' : '#CD1B78',
                        color: !batchScheduledAt || batchScheduling ? '#9CA3AF' : '#fff',
                        fontSize: 13,
                        fontWeight: 700,
                        cursor: !batchScheduledAt || batchScheduling ? 'not-allowed' : 'pointer',
                      }}
                    >
                      {batchScheduling ? 'Scheduling...' : 'Confirm Schedule'}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </>
        )}

        {activeTab === 'saved' && (
          <>
            {loadingSaved ? (
              <CMSpinner />
            ) : savedDrafts.length === 0 ? (
              <CMEmptyState message="No saved drafts yet. Approve a draft and choose 'Save Draft' to keep it here." />
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                {savedDrafts.map((draft) => (
                  <DraftCard key={draft.draft_id ?? draft.id} draft={draft} onRefresh={fetchSaved} />
                ))}
              </div>
            )}
          </>
        )}

        {activeTab === 'scheduled' && (
          <>
            {loadingScheduled ? (
              <CMSpinner />
            ) : scheduled.length === 0 ? (
              <CMEmptyState message="No scheduled posts. Approve a draft and choose 'Schedule' to add one." />
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                {scheduled.map((item) => (
                  <ScheduledCard
                    key={item.draft_id ?? item.id}
                    draft={item}
                    onRefresh={fetchScheduled}
                    onUnscheduled={() => {
                      fetchDrafts();
                      setActiveTab('drafts');
                    }}
                  />
                ))}
              </div>
            )}
          </>
        )}

        {activeTab === 'calendar' && <ContentCalendarTab onGenerated={handleGenerated} />}

        {activeTab === 'auto' && (
          <>
            {loadingAuto ? (
              <CMSpinner />
            ) : (
              <AutoGenerateTab
                settings={autoSettings}
                onGenerated={handleGenerated}
                onSettingsChange={fetchAuto}
                onRefreshDrafts={handleRefreshDrafts}
              />
            )}
          </>
        )}
      </div>

      {/* Jane footer bar */}
      <div
        style={{
          padding: '10px 24px 14px',
          borderTop: '1px solid #edecea',
          background: '#fff',
          display: 'flex',
          gap: 7,
          alignItems: 'center',
        }}
      >
        <JaneAvatar size={26} />
        <input
          placeholder="Ask Jane about your content..."
          style={{
            flex: 1,
            padding: '9px 13px',
            borderRadius: 9,
            border: '1.5px solid #e5e3df',
            fontSize: 13,
            fontFamily: 'var(--wf)',
            outline: 'none',
            background: '#fafaf8',
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter') onJane();
          }}
        />
        <button
          onClick={onJane}
          style={{
            width: 32,
            height: 32,
            borderRadius: 7,
            border: 'none',
            background: '#C2185B',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <I n="send" s={13} c="#fff" />
        </button>
      </div>
    </div>
  );
};

const CMSpinner = () => (
  <div
    style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '60px 0',
      gap: 12,
    }}
  >
    <div
      style={{
        width: 32,
        height: 32,
        border: '3px solid #f0e6f0',
        borderTop: '3px solid #C2185B',
        borderRadius: '50%',
        animation: 'spin 0.75s linear infinite',
      }}
    />
    <span style={{ fontSize: 12.5, color: '#bbb', fontWeight: 500 }}>Loading…</span>
  </div>
);

const CMEmptyState = ({ message, retry }: { message: string; retry?: () => void }) => (
  <div
    style={{
      border: '2px dashed #e5e3df',
      borderRadius: 14,
      padding: '48px 24px',
      textAlign: 'center',
      background: '#fff',
      margin: '4px 0',
    }}
  >
    <I n="calendar" s={36} c="#d1d5db" />
    <p style={{ fontSize: 13.5, color: '#9ca3af', marginTop: 12 }}>{message}</p>
    {retry && (
      <button
        onClick={retry}
        style={{
          marginTop: 8,
          background: 'none',
          border: 'none',
          color: '#C2185B',
          fontSize: 13,
          cursor: 'pointer',
          textDecoration: 'underline',
          fontFamily: 'var(--wf)',
        }}
      >
        Retry
      </button>
    )}
  </div>
);

/* ── SubPage wrapper ─────────────────────────────────────────────────────── */
const SubPage = ({
  title,
  icon,
  desc,
  children,
  onJane,
}: {
  title: string;
  icon: string;
  desc: string;
  children: ReactNode;
  onJane: () => void;
}) => (
  <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
    <div style={{ padding: '18px 24px 14px', borderBottom: '1px solid #edecea' }}>
      <h2 style={{ fontSize: 17, fontWeight: 800, color: '#111', display: 'flex', alignItems: 'center', gap: 8 }}>
        <I n={icon} s={18} c="#C2185B" />
        {title}
      </h2>
      <p style={{ fontSize: 12.5, color: '#999', marginTop: 2 }}>{desc}</p>
    </div>
    <div style={{ flex: 1, overflowY: 'auto', padding: '18px 24px' }}>{children}</div>
    <div
      style={{
        padding: '10px 24px 14px',
        borderTop: '1px solid #edecea',
        background: '#fff',
        display: 'flex',
        gap: 7,
        alignItems: 'center',
      }}
    >
      <JaneAvatar size={26} />
      <input
        placeholder={`Ask about ${title.toLowerCase()}...`}
        style={{
          flex: 1,
          padding: '9px 13px',
          borderRadius: 9,
          border: '1.5px solid #e5e3df',
          fontSize: 13,
          fontFamily: 'var(--wf)',
          outline: 'none',
          background: '#fafaf8',
        }}
        onKeyDown={(e) => {
          if (e.key === 'Enter') onJane();
        }}
      />
      <button
        onClick={onJane}
        style={{
          width: 32,
          height: 32,
          borderRadius: 7,
          border: 'none',
          background: '#C2185B',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <I n="send" s={13} c="#fff" />
      </button>
    </div>
  </div>
);

/* ── Connections page ───────────────────────────────────────────────────── */
const PLATFORM_ICON: Record<string, ReactNode> = {
  linkedin: <FaLinkedin size={22} color="#0A66C2" />,
  x: <FaXTwitter size={22} color="#000" />,
  whatsapp: <FaWhatsapp size={22} color="#25D366" />,
  facebook: <FaFacebook size={22} color="#1877F2" />,
  instagram: <FaInstagram size={22} color="#E4405F" />,
};

const PLATFORMS = [
  { id: 'linkedin', label: 'LinkedIn', color: '#0A66C2', bg: '#E8F1FB', flow: 'oauth' },
  { id: 'x', label: 'X (Twitter)', color: '#000', bg: '#F0F0F0', flow: 'oauth' },
  { id: 'whatsapp', label: 'WhatsApp', color: '#25D366', bg: '#E8F9EF', flow: 'phone' },
  { id: 'facebook', label: 'Facebook', color: '#1877F2', bg: '#E7F0FD', flow: 'outstand' },
  { id: 'instagram', label: 'Instagram', color: '#E4405F', bg: '#FDE7EC', flow: 'outstand' },
];

const ConnectionsPage = ({ onJane }: { onJane: () => void }) => {
  const router = useRouter();
  const [statuses, setStatuses] = useState<Record<string, PlatformStatus>>({});
  const [loading, setLoading] = useState(true);
  const [disconnecting, setDisconnecting] = useState<string | null>(null);
  const [connecting, setConnecting] = useState<string | null>(null);
  const [waPhone, setWaPhone] = useState('');
  const [waExpanded, setWaExpanded] = useState(false);
  const [waError, setWaError] = useState('');

  const WA_CACHE_KEY = 'uri_wa_connection';

  const withTimeout = <T,>(p: Promise<T>, ms = 6000): Promise<T | null> =>
    Promise.race([p.catch(() => null), new Promise<null>((res) => setTimeout(() => res(null), ms))]);

  const saveWaCache = (phone: string) => {
    try {
      localStorage.setItem(WA_CACHE_KEY, JSON.stringify({ linked: true, phone }));
    } catch {
      /* noop */
    }
  };
  const clearWaCache = () => {
    try {
      localStorage.removeItem(WA_CACHE_KEY);
    } catch {
      /* noop */
    }
  };
  const readWaCache = (): PlatformStatus => {
    try {
      const raw = localStorage.getItem(WA_CACHE_KEY);
      if (raw) return JSON.parse(raw) as PlatformStatus;
    } catch {
      /* noop */
    }
    return { linked: false };
  };

  const loadStatuses = async () => {
    setLoading(true);
    try {
      const [li, x, wa, fbIg] = await Promise.all([
        withTimeout(SocialConnectionService.linkedinStatus()),
        withTimeout(SocialConnectionService.xStatus()),
        withTimeout(SocialConnectionService.whatsappStatus()),
        withTimeout(SocialMediaAgentService.getConnections()),
      ]);
      const next: Record<string, PlatformStatus> = {};
      next.linkedin = li?.responseData ?? { linked: false };
      next.x = x?.responseData ?? { linked: false };
      const waFromApi = wa?.responseData;
      if (waFromApi) {
        next.whatsapp = waFromApi;
        if (waFromApi.linked && waFromApi.phone) saveWaCache(waFromApi.phone);
        if (!waFromApi.linked) clearWaCache();
      } else {
        next.whatsapp = readWaCache();
      }
      if (fbIg?.responseData) {
        const conns = fbIg.responseData.connections ?? {};
        next.facebook = {
          linked: !!conns.facebook?.length,
          account_name: conns.facebook?.[0]?.page_name,
          outstand_account_id: conns.facebook?.[0]?.outstand_account_id,
        };
        next.instagram = {
          linked: !!conns.instagram?.length,
          account_name: conns.instagram?.[0]?.page_name,
          outstand_account_id: conns.instagram?.[0]?.outstand_account_id,
        };
      } else {
        next.facebook = { linked: false };
        next.instagram = { linked: false };
      }
      setStatuses(next);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStatuses();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const openOAuthPopup = (authUrl: string, onClose: () => void) => {
    const popup = window.open(authUrl, 'uri-oauth', 'width=620,height=700,left=200,top=80');
    if (!popup || popup.closed || typeof popup.closed === 'undefined') {
      // Popup was blocked — fall back to full-page redirect
      window.location.href = authUrl;
      return;
    }
    const timer = setInterval(() => {
      if (popup.closed) {
        clearInterval(timer);
        onClose();
      }
    }, 800);
  };

  const handleConnect = async (id: string, flow: string) => {
    if (flow === 'outstand') {
      router.push('/social-media/brand-setup');
      return;
    }
    if (flow === 'phone') {
      setWaExpanded(true);
      return;
    }
    setConnecting(id);
    try {
      const res =
        id === 'linkedin' ? await SocialConnectionService.linkedinConnect() : await SocialConnectionService.xConnect();
      if (res.status && res.responseData?.auth_url) {
        openOAuthPopup(res.responseData.auth_url, () => {
          setConnecting(null);
          loadStatuses(); // refresh linked status after OAuth completes
        });
        return; // connecting state cleared inside onClose callback
      }
    } catch {
      /* fall through */
    }
    setConnecting(null);
  };

  const handleWhatsappSubmit = async () => {
    if (!waPhone.trim()) return;
    setWaError('');
    setConnecting('whatsapp');
    try {
      const res = await SocialConnectionService.whatsappConnect(waPhone.trim());
      const detail = (res as unknown as { detail?: string }).detail;
      if (res.status) {
        const phone = res.responseData?.phone ?? waPhone.trim();
        saveWaCache(phone);
        setWaExpanded(false);
        setWaPhone('');
        setStatuses((prev) => ({ ...prev, whatsapp: { linked: true, phone } }));
      } else if (
        detail?.toLowerCase().includes('already linked') ||
        detail?.toLowerCase().includes('already connected')
      ) {
        saveWaCache(waPhone.trim());
        setWaExpanded(false);
        setWaPhone('');
        setStatuses((prev) => ({ ...prev, whatsapp: { linked: true, phone: waPhone.trim() } }));
      } else {
        setWaError(detail || res.responseMessage || 'Failed to connect. Please try again.');
      }
    } catch {
      setWaError('Something went wrong. Please try again.');
    } finally {
      setConnecting(null);
    }
  };

  const handleDisconnect = async (id: string) => {
    setDisconnecting(id);
    try {
      if (id === 'linkedin') await SocialConnectionService.linkedinDisconnect();
      else if (id === 'x') await SocialConnectionService.xDisconnect();
      else if (id === 'whatsapp') await SocialConnectionService.whatsappDisconnect();
      else if ((id === 'facebook' || id === 'instagram') && statuses[id]?.outstand_account_id) {
        await SocialMediaAgentService.disconnectPlatform(statuses[id].outstand_account_id!);
      }
      setStatuses((prev) => ({ ...prev, [id]: { linked: false } }));
    } finally {
      setDisconnecting(null);
    }
  };

  return (
    <SubPage
      title="Connected Accounts"
      icon="share"
      desc="Manage your social media platform connections"
      onJane={onJane}
    >
      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', paddingTop: 40 }}>
          <div
            style={{
              width: 28,
              height: 28,
              border: '3px solid #edecea',
              borderTopColor: '#C2185B',
              borderRadius: '50%',
              animation: 'spin 0.8s linear infinite',
            }}
          />
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {PLATFORMS.map((p) => {
            const s = statuses[p.id];
            const linked = s?.linked ?? false;
            const isBusy = disconnecting === p.id || connecting === p.id;
            return (
              <div key={p.id}>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 14,
                    padding: '14px 16px',
                    borderRadius: 12,
                    border: `1.5px solid ${linked ? p.color + '44' : '#edecea'}`,
                    background: linked ? p.bg : '#fff',
                    transition: 'all .15s',
                  }}
                >
                  <div
                    style={{
                      width: 44,
                      height: 44,
                      borderRadius: 11,
                      background: linked ? '#fff' : p.bg,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                      boxShadow: '0 1px 4px rgba(0,0,0,.06)',
                    }}
                  >
                    {PLATFORM_ICON[p.id]}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13.5, fontWeight: 700, color: '#111' }}>{p.label}</div>
                    {linked ? (
                      <div style={{ fontSize: 11.5, color: '#555', marginTop: 1 }}>
                        {s?.account_name || s?.username || s?.phone || 'Connected'}
                      </div>
                    ) : (
                      <div style={{ fontSize: 11.5, color: '#bbb', marginTop: 1 }}>Not connected</div>
                    )}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div
                      style={{
                        width: 8,
                        height: 8,
                        borderRadius: '50%',
                        background: linked ? '#4caf50' : '#ddd',
                        boxShadow: linked ? '0 0 6px rgba(76,175,80,.5)' : 'none',
                      }}
                    />
                    {linked ? (
                      <button
                        type="button"
                        onClick={() => handleDisconnect(p.id)}
                        disabled={isBusy}
                        style={{
                          padding: '5px 12px',
                          borderRadius: 7,
                          border: '1px solid #edecea',
                          background: '#fff',
                          fontSize: 12,
                          color: '#888',
                          cursor: 'pointer',
                          fontFamily: 'var(--wf)',
                          opacity: isBusy ? 0.5 : 1,
                        }}
                      >
                        {disconnecting === p.id ? '...' : 'Disconnect'}
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => handleConnect(p.id, p.flow)}
                        disabled={isBusy}
                        style={{
                          padding: '5px 14px',
                          borderRadius: 7,
                          border: 'none',
                          background: p.color,
                          fontSize: 12,
                          color: '#fff',
                          cursor: 'pointer',
                          fontWeight: 600,
                          fontFamily: 'var(--wf)',
                          opacity: isBusy ? 0.5 : 1,
                        }}
                      >
                        {connecting === p.id ? '...' : 'Connect'}
                      </button>
                    )}
                  </div>
                </div>
                {p.id === 'whatsapp' && waExpanded && !linked && (
                  <div
                    style={{
                      padding: '12px 16px',
                      background: '#f9f9f9',
                      borderRadius: '0 0 12px 12px',
                      border: '1.5px solid #25D36644',
                      borderTop: 'none',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 8,
                    }}
                  >
                    <input
                      type="tel"
                      placeholder="+1 234 567 8900"
                      value={waPhone}
                      onChange={(e) => setWaPhone(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleWhatsappSubmit()}
                      aria-label="WhatsApp phone number"
                      style={{
                        padding: '9px 13px',
                        borderRadius: 8,
                        border: '1.5px solid #25D366',
                        fontSize: 13,
                        fontFamily: 'var(--wf)',
                        outline: 'none',
                        background: '#fff',
                      }}
                    />
                    {waError && <div style={{ fontSize: 12, color: '#e53935' }}>{waError}</div>}
                    <div style={{ display: 'flex', gap: 8 }}>
                      <button
                        type="button"
                        onClick={handleWhatsappSubmit}
                        disabled={!waPhone.trim() || connecting === 'whatsapp'}
                        style={{
                          padding: '7px 16px',
                          borderRadius: 7,
                          border: 'none',
                          background: '#25D366',
                          color: '#fff',
                          fontSize: 12,
                          fontWeight: 600,
                          cursor: 'pointer',
                          fontFamily: 'var(--wf)',
                          opacity: !waPhone.trim() || connecting === 'whatsapp' ? 0.5 : 1,
                        }}
                      >
                        {connecting === 'whatsapp' ? 'Connecting...' : 'Connect WhatsApp'}
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setWaExpanded(false);
                          setWaError('');
                        }}
                        style={{
                          padding: '7px 12px',
                          borderRadius: 7,
                          border: '1px solid #edecea',
                          background: '#fff',
                          color: '#888',
                          fontSize: 12,
                          cursor: 'pointer',
                          fontFamily: 'var(--wf)',
                        }}
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </SubPage>
  );
};

/* ── Subpages ────────────────────────────────────────────────────────────── */
const MessagesPage = ({ onJane }: { onJane: () => void }) => (
  <SubPage
    title="Customer Messages"
    icon="inbox"
    desc="DMs, comments, and mentions across all platforms"
    onJane={onJane}
  >
    {(
      [
        { u: '@coffeelover_ng', p: 'Instagram', t: 'When will the new content launch?', tm: '12m' },
        { u: '@jakethebaker', p: 'X', t: 'Your latest post was fire! 🔥', tm: '1h' },
        { u: 'Adaeze Okonkwo', p: 'LinkedIn', t: 'Would love to discuss a partnership.', tm: '3h' },
        { u: '@morning_fan', p: 'Instagram', t: 'Do you ship to Abuja?', tm: '5h' },
      ] as { u: string; p: string; t: string; tm: string }[]
    ).map((m, i) => (
      <div
        key={i}
        style={{
          display: 'flex',
          gap: 10,
          padding: '13px 15px',
          borderRadius: 11,
          border: '1px solid #edecea',
          background: '#fff',
          marginBottom: 7,
          cursor: 'pointer',
        }}
      >
        <div
          style={{
            width: 34,
            height: 34,
            borderRadius: '50%',
            background: '#f5f4f0',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}
        >
          <span style={{ fontSize: 11, fontWeight: 700, color: '#888' }}>
            {(m.u[0] === '@' ? m.u[1] : m.u[0]).toUpperCase()}
          </span>
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginBottom: 2 }}>
            <span style={{ fontSize: 12.5, fontWeight: 700 }}>{m.u}</span>
            <span style={{ fontSize: 11, color: '#bbb' }}>via {m.p}</span>
            <span style={{ marginLeft: 'auto', fontSize: 11, color: '#bbb' }}>{m.tm}</span>
          </div>
          <p style={{ fontSize: 12.5, color: '#555', margin: 0 }}>{m.t}</p>
        </div>
      </div>
    ))}
  </SubPage>
);

const PLATFORM_COLORS: Record<string, string> = {
  instagram: '#E1306C',
  facebook: '#1877F2',
  linkedin: '#0A66C2',
  x: '#000',
  twitter: '#1DA1F2',
  tiktok: '#010101',
  youtube: '#FF0000',
  threads: '#000',
  bluesky: '#0085FF',
  pinterest: '#E60023',
};

const fmt = (n: number) =>
  n >= 1_000_000 ? `${(n / 1_000_000).toFixed(1)}M` : n >= 1_000 ? `${(n / 1_000).toFixed(1)}K` : String(n);
const platformIcon: Record<string, string> = {
  instagram: '📸',
  facebook: '👥',
  linkedin: '💼',
  x: '𝕏',
  twitter: '𝕏',
  tiktok: '🎵',
  youtube: '▶️',
  threads: '🧵',
  bluesky: '🦋',
  pinterest: '📌',
};

const PLATFORM_ENGAGEMENT_NOTE: Record<string, string> = {
  facebook: 'Facebook only provides follower count at the account level.',
  instagram: 'Instagram only provides follower, following, and media count.',
  linkedin: 'LinkedIn only provides follower count at the account level.',
  bluesky: 'BlueSky has limited metric support.',
};

const PerformancePage = ({ onJane }: { onJane: () => void }) => {
  const [view, setView] = useState<'posts' | 'accounts'>('posts');
  const [data, setData] = useState<PerformanceData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [days, setDays] = useState(30);
  const [expandedPost, setExpandedPost] = useState<string | null>(null);
  const [accountData, setAccountData] = useState<AccountMetricsData | null>(null);
  const [accountLoading, setAccountLoading] = useState(false);
  const [accountError, setAccountError] = useState(false);

  useEffect(() => {
    setLoading(true);
    setError(false);
    SocialMediaAgentService.getPerformance(days)
      .then((res) => {
        if (res.status && res.responseData) setData(res.responseData);
        else setError(true);
      })
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, [days]);

  useEffect(() => {
    setAccountLoading(true);
    setAccountError(false);
    SocialMediaAgentService.getAccountMetrics(days)
      .then((res) => {
        if (res.status && res.responseData) setAccountData(res.responseData);
        else setAccountError(true);
      })
      .catch(() => setAccountError(true))
      .finally(() => setAccountLoading(false));
  }, [days]);

  const statCard = (label: string, value: string | number, sub?: string, color = '#111') => (
    <div style={{ padding: '14px 16px', background: '#fff', borderRadius: 12, border: '1px solid #edecea' }}>
      <div
        style={{
          fontSize: 11,
          color: '#999',
          fontWeight: 600,
          textTransform: 'uppercase',
          letterSpacing: 0.5,
          marginBottom: 6,
        }}
      >
        {label}
      </div>
      <div style={{ fontSize: 22, fontWeight: 800, color, lineHeight: 1 }}>{value}</div>
      {sub && <div style={{ fontSize: 11, color: '#bbb', marginTop: 4 }}>{sub}</div>}
    </div>
  );

  return (
    <SubPage
      title="Performance"
      icon="chart"
      desc={
        view === 'posts'
          ? 'Real-time insights from your published posts via Outstand'
          : 'Account-level metrics for your connected social profiles'
      }
      onJane={onJane}
    >
      {/* View toggle */}
      <div
        style={{
          display: 'inline-flex',
          background: '#f5f4f0',
          borderRadius: 22,
          padding: 3,
          marginBottom: 14,
        }}
      >
        {(['posts', 'accounts'] as const).map((v) => (
          <button
            key={v}
            onClick={() => setView(v)}
            style={{
              padding: '5px 16px',
              borderRadius: 18,
              border: 'none',
              background: view === v ? '#fff' : 'transparent',
              color: view === v ? '#C2185B' : '#888',
              fontSize: 12.5,
              fontWeight: view === v ? 700 : 500,
              cursor: 'pointer',
              fontFamily: 'var(--wf)',
              boxShadow: view === v ? '0 1px 3px rgba(0,0,0,.08)' : 'none',
              transition: 'all 0.15s',
              textTransform: 'capitalize',
            }}
          >
            {v === 'posts' ? 'Posts' : 'Accounts'}
          </button>
        ))}
      </div>

      {/* Range selector */}
      <div style={{ display: 'flex', gap: 6, marginBottom: 16 }}>
        {[7, 30, 90].map((d) => (
          <button
            key={d}
            onClick={() => setDays(d)}
            style={{
              padding: '5px 14px',
              borderRadius: 20,
              border: `1.5px solid ${days === d ? '#C2185B' : '#e5e3df'}`,
              background: days === d ? '#fdf0f6' : '#fff',
              color: days === d ? '#C2185B' : '#666',
              fontSize: 12.5,
              fontWeight: days === d ? 700 : 500,
              cursor: 'pointer',
              fontFamily: 'var(--wf)',
            }}
          >
            {d}d
          </button>
        ))}
        <span style={{ marginLeft: 'auto', fontSize: 12, color: '#bbb', alignSelf: 'center' }}>Last {days} days</span>
      </div>

      {/* ── POSTS VIEW ── */}
      {view === 'posts' && (
        <>
          {loading && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 10 }}>
                {[0, 1, 2, 3].map((i) => (
                  <div
                    key={i}
                    style={{
                      height: 80,
                      borderRadius: 12,
                      background: 'linear-gradient(90deg, #f5f4f0 25%, #edecea 50%, #f5f4f0 75%)',
                      backgroundSize: '200% 100%',
                      animation: 'shimmer 1.5s infinite',
                    }}
                  />
                ))}
              </div>
            </div>
          )}

          {!loading && error && (
            <div
              style={{
                background: '#fff',
                borderRadius: 12,
                border: '1px solid #edecea',
                padding: 24,
                textAlign: 'center',
              }}
            >
              <I n="chart" s={32} c="#e5e3df" />
              <div style={{ fontSize: 13, color: '#999', marginTop: 10 }}>
                Could not load performance data. Please try again.
              </div>
            </div>
          )}

          {!loading && !error && data && !data.has_data && (
            <div
              style={{
                background: '#fff',
                borderRadius: 12,
                border: '1px solid #edecea',
                padding: 28,
                textAlign: 'center',
              }}
            >
              <I n="chart" s={36} c="rgba(194,24,91,.25)" />
              <div style={{ fontSize: 14, fontWeight: 700, color: '#111', marginTop: 12, marginBottom: 6 }}>
                No published posts yet
              </div>
              <div style={{ fontSize: 13, color: '#999', lineHeight: 1.6 }}>
                Generate and publish content from the <strong>Workspace</strong> tab. Analytics will appear here once
                posts are live.
              </div>
            </div>
          )}

          {!loading && !error && data?.has_data && (
            <>
              {/* Summary stats */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 10, marginBottom: 10 }}>
                {statCard('Impressions', fmt(data.summary.total_impressions), `${data.summary.total_posts} posts`)}
                {statCard('Reach', fmt(data.summary.total_reach))}
                {statCard(
                  'Engagement',
                  fmt(data.summary.total_likes + data.summary.total_comments + data.summary.total_shares)
                )}
                {statCard(
                  'Avg. Eng. Rate',
                  `${data.summary.avg_engagement_rate}%`,
                  undefined,
                  data.summary.avg_engagement_rate >= 3
                    ? '#16a34a'
                    : data.summary.avg_engagement_rate >= 1
                      ? '#d97706'
                      : '#C2185B'
                )}
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10, marginBottom: 16 }}>
                {statCard('Likes', fmt(data.summary.total_likes))}
                {statCard('Comments', fmt(data.summary.total_comments))}
                {statCard('Shares', fmt(data.summary.total_shares))}
              </div>

              {/* Per-platform breakdown */}
              {Object.keys(data.by_platform).length > 0 && (
                <div
                  style={{
                    background: '#fff',
                    borderRadius: 12,
                    border: '1px solid #edecea',
                    padding: '16px 18px',
                    marginBottom: 16,
                  }}
                >
                  <div
                    style={{
                      fontSize: 12,
                      fontWeight: 700,
                      color: '#C2185B',
                      textTransform: 'uppercase',
                      letterSpacing: 0.8,
                      marginBottom: 12,
                    }}
                  >
                    By Platform
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {Object.entries(data.by_platform).map(([pl, stats]) => (
                      <div key={pl} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <div
                          style={{
                            width: 32,
                            height: 32,
                            borderRadius: 8,
                            background: (PLATFORM_COLORS[pl] ?? '#666') + '18',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: 16,
                            flexShrink: 0,
                          }}
                        >
                          {platformIcon[pl] ?? '🌐'}
                        </div>
                        <div style={{ flex: 1 }}>
                          <div
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                              marginBottom: 3,
                            }}
                          >
                            <span style={{ fontSize: 13, fontWeight: 700, color: '#111', textTransform: 'capitalize' }}>
                              {pl}
                            </span>
                            <span style={{ fontSize: 12, color: '#999' }}>
                              {stats.posts} post{stats.posts !== 1 ? 's' : ''}
                            </span>
                          </div>
                          <div style={{ display: 'flex', gap: 14 }}>
                            {[
                              ['Impressions', fmt(stats.impressions)],
                              ['Reach', fmt(stats.reach)],
                              ['Eng.', `${stats.avg_engagement_rate}%`],
                            ].map(([l, v]) => (
                              <div key={l}>
                                <span style={{ fontSize: 11, color: '#bbb' }}>{l} </span>
                                <span style={{ fontSize: 12, fontWeight: 700, color: '#374151' }}>{v}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Top posts */}
              {data.top_posts.length > 0 && (
                <div
                  style={{ background: '#fff', borderRadius: 12, border: '1px solid #edecea', padding: '16px 18px' }}
                >
                  <div
                    style={{
                      fontSize: 12,
                      fontWeight: 700,
                      color: '#C2185B',
                      textTransform: 'uppercase',
                      letterSpacing: 0.8,
                      marginBottom: 12,
                    }}
                  >
                    Top Posts
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {data.top_posts.map((post: PerformancePost) => (
                      <div key={post.draft_id}>
                        <div
                          onClick={() => setExpandedPost(expandedPost === post.draft_id ? null : post.draft_id)}
                          style={{
                            display: 'flex',
                            alignItems: 'flex-start',
                            gap: 10,
                            padding: '10px 12px',
                            borderRadius: 10,
                            border: '1px solid #f0eeec',
                            cursor: 'pointer',
                            background: expandedPost === post.draft_id ? '#fdf8fc' : '#fafaf8',
                          }}
                        >
                          <div
                            style={{
                              width: 28,
                              height: 28,
                              borderRadius: 7,
                              background: (PLATFORM_COLORS[post.platform] ?? '#666') + '18',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontSize: 14,
                              flexShrink: 0,
                            }}
                          >
                            {platformIcon[post.platform] ?? '🌐'}
                          </div>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div
                              style={{
                                fontSize: 12.5,
                                color: '#374151',
                                lineHeight: 1.45,
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                whiteSpace: 'nowrap',
                              }}
                            >
                              {post.content_preview || '(No preview)'}
                            </div>
                            <div style={{ display: 'flex', gap: 12, marginTop: 5 }}>
                              {[
                                ['👁', fmt(post.impressions)],
                                ['❤️', fmt(post.likes)],
                                ['💬', fmt(post.comments)],
                                ['🔁', fmt(post.shares)],
                              ].map(([ic, v]) => (
                                <span key={ic as string} style={{ fontSize: 11.5, color: '#666' }}>
                                  {ic} {v}
                                </span>
                              ))}
                              <span style={{ marginLeft: 'auto', fontSize: 11, color: '#C2185B', fontWeight: 700 }}>
                                {post.engagement_rate}%
                              </span>
                            </div>
                          </div>
                        </div>
                        {expandedPost === post.draft_id && (
                          <div
                            style={{
                              padding: '10px 12px 12px',
                              background: '#fdf8fc',
                              borderRadius: '0 0 10px 10px',
                              border: '1px solid #f0eeec',
                              borderTop: 'none',
                              display: 'grid',
                              gridTemplateColumns: 'repeat(3, 1fr)',
                              gap: 8,
                            }}
                          >
                            {[
                              ['Views', fmt(post.views)],
                              ['Reach', fmt(post.reach)],
                              ['Engagement Rate', `${post.engagement_rate}%`],
                            ].map(([l, v]) => (
                              <div key={l as string}>
                                <div
                                  style={{
                                    fontSize: 10.5,
                                    color: '#bbb',
                                    textTransform: 'uppercase',
                                    letterSpacing: 0.4,
                                    marginBottom: 2,
                                  }}
                                >
                                  {l}
                                </div>
                                <div style={{ fontSize: 15, fontWeight: 800, color: '#111' }}>{v}</div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </>
      )}

      {/* ── ACCOUNTS VIEW ── */}
      {view === 'accounts' && (
        <>
          {accountLoading && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
                {[0, 1, 2].map((i) => (
                  <div
                    key={i}
                    style={{
                      height: 110,
                      borderRadius: 12,
                      background: 'linear-gradient(90deg, #f5f4f0 25%, #edecea 50%, #f5f4f0 75%)',
                      backgroundSize: '200% 100%',
                      animation: 'shimmer 1.5s infinite',
                    }}
                  />
                ))}
              </div>
            </div>
          )}

          {!accountLoading && accountError && (
            <div
              style={{
                background: '#fff',
                borderRadius: 12,
                border: '1px solid #edecea',
                padding: 24,
                textAlign: 'center',
              }}
            >
              <I n="chart" s={32} c="#e5e3df" />
              <div style={{ fontSize: 13, color: '#999', marginTop: 10 }}>
                Could not load account metrics. Please try again.
              </div>
            </div>
          )}

          {!accountLoading && !accountError && accountData && !accountData.has_data && (
            <div
              style={{
                background: '#fff',
                borderRadius: 12,
                border: '1px solid #edecea',
                padding: 28,
                textAlign: 'center',
              }}
            >
              <I n="chart" s={36} c="rgba(194,24,91,.25)" />
              <div style={{ fontSize: 14, fontWeight: 700, color: '#111', marginTop: 12, marginBottom: 6 }}>
                No connected accounts
              </div>
              <div style={{ fontSize: 13, color: '#999', lineHeight: 1.6 }}>
                Connect your social profiles in <strong>Settings</strong> to view account-level metrics.
              </div>
            </div>
          )}

          {!accountLoading && !accountError && accountData?.has_data && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {accountData.accounts.map((acc: AccountMetricItem) => (
                <div
                  key={acc.account_id}
                  style={{
                    background: '#fff',
                    borderRadius: 12,
                    border: '1px solid #edecea',
                    padding: '16px 18px',
                  }}
                >
                  {/* Account header */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
                    <div
                      style={{
                        width: 36,
                        height: 36,
                        borderRadius: 9,
                        background: (PLATFORM_COLORS[acc.network] ?? '#666') + '18',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: 18,
                        flexShrink: 0,
                      }}
                    >
                      {platformIcon[acc.network] ?? '🌐'}
                    </div>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 700, color: '#111' }}>{acc.page_name ?? acc.network}</div>
                      <div style={{ fontSize: 11, color: '#bbb', textTransform: 'capitalize' }}>
                        {acc.category ?? acc.network}
                      </div>
                    </div>
                  </div>

                  {/* Follower stats — only show fields that aren't null */}
                  <div style={{ display: 'flex', gap: 8, marginBottom: 12, flexWrap: 'wrap' }}>
                    {[
                      ['Followers', acc.followers_count],
                      ...(acc.following_count != null ? [['Following', acc.following_count]] : []),
                      ...(acc.posts_count != null ? [['Posts', acc.posts_count]] : []),
                    ].map(([l, v]) => (
                      <div key={l as string} style={{ background: '#fafaf8', borderRadius: 8, padding: '10px 14px' }}>
                        <div
                          style={{
                            fontSize: 10.5,
                            color: '#bbb',
                            textTransform: 'uppercase',
                            letterSpacing: 0.4,
                            marginBottom: 3,
                          }}
                        >
                          {l}
                        </div>
                        <div style={{ fontSize: 17, fontWeight: 800, color: '#111' }}>{fmt(v as number)}</div>
                      </div>
                    ))}
                  </div>

                  {/* Engagement over period */}
                  <div
                    style={{
                      fontSize: 11,
                      fontWeight: 700,
                      color: '#C2185B',
                      textTransform: 'uppercase',
                      letterSpacing: 0.6,
                      marginBottom: 8,
                    }}
                  >
                    Engagement · Last {days}d
                  </div>
                  {acc.engagement ? (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
                      {[
                        ['Views', fmt(acc.engagement.views)],
                        ['Likes', fmt(acc.engagement.likes)],
                        ['Comments', fmt(acc.engagement.comments)],
                        ['Shares', fmt(acc.engagement.shares)],
                        ['Reposts', fmt(acc.engagement.reposts)],
                        ['Quotes', fmt(acc.engagement.quotes)],
                      ].map(([l, v]) => (
                        <div key={l as string} style={{ minWidth: 60 }}>
                          <span style={{ fontSize: 11, color: '#bbb' }}>{l} </span>
                          <span style={{ fontSize: 12, fontWeight: 700, color: '#374151' }}>{v}</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div style={{ fontSize: 12, color: '#bbb', fontStyle: 'italic' }}>
                      {acc.engagement_note ??
                        PLATFORM_ENGAGEMENT_NOTE[acc.network] ??
                        'Engagement data unavailable for this period.'}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </SubPage>
  );
};

const IntelPage = ({ onJane }: { onJane: () => void }) => (
  <SubPage title="Market Intel" icon="globe" desc="What people say about your brand across the web" onJane={onJane}>
    <div
      style={{
        background: 'rgba(194,24,91,.03)',
        borderRadius: 12,
        border: '1px dashed rgba(194,24,91,.2)',
        padding: '32px 24px',
        textAlign: 'center',
      }}
    >
      <I n="globe" s={32} c="rgba(194,24,91,.3)" />
      <p style={{ fontSize: 13, color: '#888', marginTop: 12, lineHeight: 1.6 }}>
        Market intelligence will appear here once your brand profile is fully set up and social accounts are connected.
      </p>
    </div>
  </SubPage>
);

/* ── Playbook helpers ────────────────────────────────────────────────────── */
const pbTgl = <T,>(arr: T[], set: (v: T[]) => void, val: T) =>
  set(arr.includes(val) ? arr.filter((x) => x !== val) : [...arr, val]);

const PbInput = ({
  value,
  onChange,
  placeholder,
  textarea,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  textarea?: boolean;
}) => {
  const base: React.CSSProperties = {
    width: '100%',
    padding: '8px 11px',
    borderRadius: 8,
    border: '1.5px solid #e5e3df',
    fontSize: 13,
    fontFamily: 'var(--wf)',
    outline: 'none',
    background: '#fafaf8',
    color: '#111',
    resize: 'vertical',
  };
  return textarea ? (
    <textarea
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      rows={3}
      style={base}
    />
  ) : (
    <input value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} style={base} />
  );
};

const PbChip = ({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) => (
  <button
    onClick={onClick}
    style={{
      padding: '5px 13px',
      borderRadius: 20,
      border: `1.5px solid ${active ? '#C2185B' : '#e5e3df'}`,
      background: active ? '#fdf0f6' : '#fff',
      color: active ? '#C2185B' : '#555',
      fontSize: 12.5,
      fontWeight: active ? 700 : 500,
      cursor: 'pointer',
      fontFamily: 'var(--wf)',
    }}
  >
    {label}
  </button>
);

const PbSection = ({ title, children }: { title: string; children: ReactNode }) => (
  <div
    style={{
      background: '#fff',
      borderRadius: 12,
      border: '1px solid #edecea',
      padding: '16px 18px',
      marginBottom: 10,
    }}
  >
    <h3
      style={{
        fontSize: 12,
        fontWeight: 700,
        color: '#C2185B',
        textTransform: 'uppercase',
        letterSpacing: 0.8,
        marginBottom: 12,
      }}
    >
      {title}
    </h3>
    {children}
  </div>
);

const PbRow = ({
  label,
  value,
  editing,
  input,
}: {
  label: string;
  value?: string | string[];
  editing: boolean;
  input: ReactNode;
}) => (
  <div style={{ marginBottom: 12 }}>
    <div
      style={{
        fontSize: 11,
        fontWeight: 600,
        color: '#999',
        textTransform: 'uppercase',
        letterSpacing: 0.5,
        marginBottom: 4,
      }}
    >
      {label}
    </div>
    {editing ? (
      input
    ) : (
      <div
        style={{
          fontSize: 13,
          color: Array.isArray(value) ? '#374151' : value ? '#111' : '#bbb',
          fontWeight: Array.isArray(value) ? 400 : 500,
        }}
      >
        {Array.isArray(value) ? (value.length > 0 ? value.join(', ') : '—') : value || '—'}
      </div>
    )}
  </div>
);

const PlaybookPage = ({
  onJane,
  profile,
  onProfileUpdate,
}: {
  onJane: () => void;
  profile: BrandProfileData | null;
  onProfileUpdate: (p: BrandProfileData) => void;
}) => {
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  // editable state
  const [brandName, setBrandName] = useState('');
  const [industry, setIndustry] = useState('');
  const [website, setWebsite] = useState('');
  const [description, setDescription] = useState('');
  const [, setTagline] = useState('');
  const [voiceSample, setVoiceSample] = useState('');
  const [colors, setColors] = useState<string[]>([]);
  const [newColor, setNewColor] = useState('');
  const [pillars, setPillars] = useState<string[]>([]);
  const [newPillar, setNewPillar] = useState('');
  const [formats, setFormats] = useState<string[]>([]);
  const [avoidTopics, setAvoidTopics] = useState('');
  const [bannedWords, setBannedWords] = useState('');
  const [emojiUsage, setEmojiUsage] = useState('');
  const [maxHash, setMaxHash] = useState('');
  const [compliance, setCompliance] = useState('');
  const [ctaStyles, setCtaStyles] = useState<string[]>([]);
  const [defaultLink, setDefaultLink] = useState('');
  const [audienceAge, setAudienceAge] = useState<string[]>([]);
  const [primaryGoal, setPrimaryGoal] = useState('');
  const [targetPlatforms, setTargetPlatforms] = useState<string[]>([]);
  const [competitors, setCompetitors] = useState(['', '', '']);
  const [languages, setLanguages] = useState<string[]>([]);
  const [region, setRegion] = useState<string[]>([]);
  const [cadence, setCadence] = useState('');
  const [approval, setApproval] = useState('');
  const [templateUrls, setTemplateUrls] = useState<string[]>([]);
  const [uploadingTemplate, setUploadingTemplate] = useState(false);
  const templateInputRef = useRef<HTMLInputElement>(null);
  const [logoUrl, setLogoUrl] = useState('');
  const [logoUploading, setLogoUploading] = useState(false);
  const [logoError, setLogoError] = useState('');
  const logoInputRef = useRef<HTMLInputElement>(null);

  const startEdit = () => {
    if (!profile) return;
    setBrandName(profile.brand_name ?? '');
    setIndustry(profile.industry ?? '');
    setWebsite(profile.website ?? '');
    setDescription(profile.product_description ?? '');
    setTagline((profile as BrandProfileData & { tagline?: string }).tagline ?? '');
    setVoiceSample(profile.voice_sample ?? '');
    setColors([...(profile.brand_colors ?? [])]);
    setPillars([...(profile.content_pillars ?? [])]);
    setFormats([...(profile.preferred_formats ?? [])]);
    setAvoidTopics(profile.guardrails?.avoid_topics ?? '');
    setBannedWords(profile.guardrails?.banned_words ?? '');
    setEmojiUsage(profile.guardrails?.emoji_usage ?? '');
    setMaxHash(profile.guardrails?.max_hashtags ?? '');
    setCompliance(profile.guardrails?.compliance_notes ?? '');
    setCtaStyles([...(profile.cta_styles ?? [])]);
    setDefaultLink(profile.default_link ?? '');
    const age = profile.audience_age_range;
    setAudienceAge(Array.isArray(age) ? age : age ? [age] : []);
    setPrimaryGoal(profile.primary_goal ?? '');
    setTargetPlatforms([...(profile.target_platforms ?? [])]);
    const comps = profile.competitor_handles ?? [];
    setCompetitors([comps[0] ?? '', comps[1] ?? '', comps[2] ?? '']);
    setLanguages([...(profile.languages ?? [])]);
    const reg = profile.region;
    setRegion(Array.isArray(reg) ? reg : reg ? [reg] : []);
    setCadence(profile.posting_cadence ?? '');
    setApproval(profile.approval_workflow ?? '');
    setTemplateUrls([...(profile.sample_template_urls ?? [])]);
    setLogoUrl(profile.logo_url ?? '');
    setLogoError('');
    setEditing(true);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const updated: BrandProfileData = {
        ...profile,
        brand_name: brandName,
        industry,
        website,
        product_description: description,
        voice_sample: voiceSample,
        brand_colors: colors,
        content_pillars: pillars,
        preferred_formats: formats,
        guardrails: {
          avoid_topics: avoidTopics,
          banned_words: bannedWords,
          emoji_usage: emojiUsage,
          max_hashtags: maxHash,
          compliance_notes: compliance,
        },
        cta_styles: ctaStyles,
        default_link: defaultLink,
        audience_age_range: audienceAge.join(', '),
        primary_goal: primaryGoal,
        target_platforms: targetPlatforms,
        competitor_handles: competitors.filter(Boolean),
        languages,
        region: region.join(', '),
        posting_cadence: cadence,
        approval_workflow: approval,
        sample_template_urls: templateUrls,
        logo_url: logoUrl || undefined,
      };
      await BrandProfileService.save(updated);
      onProfileUpdate(updated);
      setEditing(false);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } finally {
      setSaving(false);
    }
  };

  const p = profile;
  const ageVal = p?.audience_age_range;
  const ageDisplay = Array.isArray(ageVal) ? ageVal : ageVal ? [ageVal] : [];
  const regVal = p?.region;
  const regDisplay = Array.isArray(regVal) ? regVal : regVal ? [regVal] : [];

  const ALL_FORMATS = [
    'Reels / Short video',
    'Carousel posts',
    'Static image',
    'Long-form article',
    'Infographic',
    'Story',
    'Thread / X post',
    'Poll',
    'Live session',
  ];
  const ALL_CTA = [
    'Link in bio',
    'Shop now',
    'DM us',
    'Book a call',
    'Learn more',
    'Sign up',
    'Download',
    'Visit our website',
    'Use code...',
  ];
  const ALL_AGES = ['Gen Z (18-24)', 'Millennials (25-40)', 'Gen X (41-56)', 'Boomers (57+)', 'Everyone'];
  const ALL_GOALS = [
    'Brand Awareness',
    'Drive Sales',
    'Grow Following',
    'Build Community',
    'Lead Generation',
    'Website Traffic',
  ];
  const ALL_PLATFORMS = ['Instagram', 'Facebook', 'X / Twitter', 'LinkedIn', 'TikTok', 'Pinterest', 'YouTube'];
  const ALL_LANGS = ['English', 'Yoruba', 'Pidgin', 'French', 'Hausa', 'Igbo', 'Swahili', 'Other'];
  const ALL_REGIONS = [
    'Nigeria',
    'West Africa',
    'Pan-African',
    'United States',
    'United Kingdom',
    'Global / International',
    'Other',
  ];
  const ALL_CADENCE = ['Daily', '3–4x per week', '2–3x per week', 'Weekly', 'Bi-weekly'];
  const ALL_APPROVAL = ['Auto-publish', 'Review before publishing'];

  return (
    <SubPage title="Brand Playbook" icon="book" desc="Everything URI Agent knows about your brand" onJane={onJane}>
      {/* Action bar */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
        {saved && !editing && (
          <span style={{ fontSize: 12.5, color: '#16a34a', fontWeight: 600 }}>✓ Changes saved</span>
        )}
        {!saved && <span />}
        {!editing ? (
          <button
            onClick={startEdit}
            style={{
              padding: '7px 16px',
              borderRadius: 8,
              border: '1.5px solid #C2185B',
              background: '#fff',
              color: '#C2185B',
              fontSize: 13,
              fontWeight: 700,
              cursor: 'pointer',
              fontFamily: 'var(--wf)',
            }}
          >
            Edit Profile
          </button>
        ) : (
          <div style={{ display: 'flex', gap: 8 }}>
            <button
              onClick={() => setEditing(false)}
              style={{
                padding: '7px 14px',
                borderRadius: 8,
                border: '1.5px solid #e5e3df',
                background: '#fff',
                color: '#666',
                fontSize: 13,
                fontWeight: 600,
                cursor: 'pointer',
                fontFamily: 'var(--wf)',
              }}
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              style={{
                padding: '7px 16px',
                borderRadius: 8,
                border: 'none',
                background: '#C2185B',
                color: '#fff',
                fontSize: 13,
                fontWeight: 700,
                cursor: 'pointer',
                fontFamily: 'var(--wf)',
                opacity: saving ? 0.7 : 1,
              }}
            >
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        )}
      </div>

      {/* Brand Identity */}
      <PbSection title="Brand Identity">
        {/* Logo row */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '10px 0',
            borderBottom: '1px solid #f3f1ee',
          }}
        >
          <span style={{ fontSize: 12.5, color: '#888', fontWeight: 600, minWidth: 120 }}>Logo</span>
          {!editing ? (
            p?.logo_url ? (
              <img
                src={p.logo_url}
                alt="brand logo"
                style={{ maxHeight: 44, maxWidth: 140, objectFit: 'contain', borderRadius: 6 }}
              />
            ) : (
              <span style={{ fontSize: 13, color: '#bbb' }}>—</span>
            )
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 6 }}>
              <input
                ref={logoInputRef}
                type="file"
                accept="image/png,image/jpeg,image/jpg,image/webp,image/svg+xml"
                style={{ display: 'none' }}
                onChange={async (e) => {
                  const file = e.target.files?.[0];
                  if (!file) return;
                  setLogoError('');
                  setLogoUploading(true);
                  try {
                    const res = await BrandProfileService.uploadLogo(file);
                    if (res.status && res.responseData?.logo_url) {
                      setLogoUrl(res.responseData.logo_url);
                    } else {
                      setLogoError('Upload failed. Please try again.');
                    }
                  } catch {
                    setLogoError('Upload failed. Please try again.');
                  } finally {
                    setLogoUploading(false);
                    e.target.value = '';
                  }
                }}
              />
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                {logoUrl && (
                  <img
                    src={logoUrl}
                    alt="logo preview"
                    style={{ maxHeight: 36, maxWidth: 120, objectFit: 'contain', borderRadius: 4 }}
                  />
                )}
                <button
                  onClick={() => logoInputRef.current?.click()}
                  disabled={logoUploading}
                  style={{
                    padding: '5px 12px',
                    borderRadius: 7,
                    border: '1.5px solid #C2185B',
                    background: '#fff',
                    color: '#C2185B',
                    fontSize: 12.5,
                    fontWeight: 600,
                    cursor: logoUploading ? 'not-allowed' : 'pointer',
                    fontFamily: 'var(--wf)',
                    opacity: logoUploading ? 0.6 : 1,
                  }}
                >
                  {logoUploading ? 'Uploading…' : logoUrl ? 'Replace logo' : 'Upload logo'}
                </button>
              </div>
              {logoError && <span style={{ fontSize: 11.5, color: '#EF4444' }}>{logoError}</span>}
            </div>
          )}
        </div>
        <PbRow
          label="Brand name"
          value={p?.brand_name}
          editing={editing}
          input={<PbInput value={brandName} onChange={setBrandName} placeholder="e.g. Paystack" />}
        />
        <PbRow
          label="Industry"
          value={p?.industry}
          editing={editing}
          input={<PbInput value={industry} onChange={setIndustry} placeholder="e.g. Fintech" />}
        />
        <PbRow
          label="Website"
          value={p?.website}
          editing={editing}
          input={<PbInput value={website} onChange={setWebsite} placeholder="https://..." />}
        />
        <PbRow
          label="Description"
          value={p?.product_description}
          editing={editing}
          input={
            <PbInput value={description} onChange={setDescription} placeholder="What does your business do?" textarea />
          }
        />
      </PbSection>

      {/* Brand Colors */}
      <PbSection title="Brand Colors">
        {!editing ? (
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {(p?.brand_colors ?? []).length > 0 ? (
              (p?.brand_colors ?? []).map((c, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <div style={{ width: 22, height: 22, borderRadius: 6, background: c, border: '1px solid #edecea' }} />
                  <span style={{ fontSize: 12.5, color: '#555' }}>{c}</span>
                </div>
              ))
            ) : (
              <span style={{ fontSize: 13, color: '#bbb' }}>—</span>
            )}
          </div>
        ) : (
          <div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 10 }}>
              {colors.map((c, i) => (
                <div
                  key={i}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                    padding: '4px 10px',
                    borderRadius: 8,
                    border: '1.5px solid #e5e3df',
                    background: '#fff',
                  }}
                >
                  <div style={{ width: 16, height: 16, borderRadius: 4, background: c }} />
                  <span style={{ fontSize: 12.5 }}>{c}</span>
                  <button
                    onClick={() => setColors(colors.filter((_, j) => j !== i))}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: '#bbb',
                      cursor: 'pointer',
                      fontSize: 14,
                      lineHeight: 1,
                      padding: 0,
                      marginLeft: 2,
                    }}
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
            <div style={{ display: 'flex', gap: 6 }}>
              <PbInput value={newColor} onChange={setNewColor} placeholder="#CD1B78" />
              <button
                onClick={() => {
                  if (newColor.trim()) {
                    setColors([...colors, newColor.trim()]);
                    setNewColor('');
                  }
                }}
                style={{
                  padding: '8px 14px',
                  borderRadius: 8,
                  border: '1.5px solid #C2185B',
                  background: '#fff',
                  color: '#C2185B',
                  fontSize: 13,
                  fontWeight: 700,
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                  fontFamily: 'var(--wf)',
                }}
              >
                + Add
              </button>
            </div>
          </div>
        )}
      </PbSection>

      {/* Sample Templates */}
      <PbSection title="Sample Templates">
        {!editing ? (
          (p?.sample_template_urls ?? []).length > 0 ? (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
              {(p?.sample_template_urls ?? []).map((url, i) => (
                <a key={i} href={url} target="_blank" rel="noopener noreferrer">
                  <img
                    src={url}
                    alt={`Template ${i + 1}`}
                    style={{
                      width: 90,
                      height: 90,
                      objectFit: 'cover',
                      borderRadius: 8,
                      border: '1.5px solid #e5e3df',
                    }}
                  />
                </a>
              ))}
            </div>
          ) : (
            <span style={{ fontSize: 13, color: '#bbb' }}>No sample templates uploaded yet.</span>
          )
        ) : (
          <div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, marginBottom: templateUrls.length > 0 ? 12 : 0 }}>
              {templateUrls.map((url, i) => (
                <div key={i} style={{ position: 'relative' }}>
                  <img
                    src={url}
                    alt={`Template ${i + 1}`}
                    style={{
                      width: 90,
                      height: 90,
                      objectFit: 'cover',
                      borderRadius: 8,
                      border: '1.5px solid #e5e3df',
                      display: 'block',
                    }}
                  />
                  <button
                    onClick={() => setTemplateUrls(templateUrls.filter((_, j) => j !== i))}
                    style={{
                      position: 'absolute',
                      top: -6,
                      right: -6,
                      width: 20,
                      height: 20,
                      borderRadius: '50%',
                      background: '#ef4444',
                      border: 'none',
                      color: '#fff',
                      fontSize: 12,
                      fontWeight: 700,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      lineHeight: 1,
                    }}
                    title="Remove"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
            <input
              ref={templateInputRef}
              type="file"
              accept="image/*"
              multiple
              style={{ display: 'none' }}
              onChange={async (e) => {
                const files = Array.from(e.target.files ?? []);
                if (!files.length) return;
                setUploadingTemplate(true);
                try {
                  const results = await Promise.all(files.map((f) => BrandProfileService.uploadSampleTemplate(f)));
                  const urls = results.map((r) => r.responseData?.file_url).filter(Boolean) as string[];
                  setTemplateUrls((prev) => [...prev, ...urls]);
                } finally {
                  setUploadingTemplate(false);
                  if (templateInputRef.current) templateInputRef.current.value = '';
                }
              }}
            />
            <button
              onClick={() => templateInputRef.current?.click()}
              disabled={uploadingTemplate}
              style={{
                padding: '7px 14px',
                borderRadius: 8,
                border: '1.5px dashed #C2185B',
                background: '#fff',
                color: '#C2185B',
                fontSize: 12.5,
                fontWeight: 700,
                cursor: uploadingTemplate ? 'not-allowed' : 'pointer',
                opacity: uploadingTemplate ? 0.6 : 1,
                fontFamily: 'var(--wf)',
              }}
            >
              {uploadingTemplate ? 'Uploading…' : '+ Add Template'}
            </button>
          </div>
        )}
      </PbSection>

      {/* Brand Voice */}
      <PbSection title="Brand Voice">
        <div style={{ marginBottom: 4 }}>
          <div
            style={{
              fontSize: 11,
              fontWeight: 600,
              color: '#999',
              textTransform: 'uppercase',
              letterSpacing: 0.5,
              marginBottom: 4,
            }}
          >
            Personality traits
          </div>
          <div style={{ fontSize: 13, color: '#111' }}>
            {p?.derived_voice || (p?.personality_quiz ? Object.values(p.personality_quiz).join(', ') : '—')}
          </div>
        </div>
        <div style={{ marginTop: 12 }}>
          <PbRow
            label="Voice sample"
            value={p?.voice_sample}
            editing={editing}
            input={
              <PbInput
                value={voiceSample}
                onChange={setVoiceSample}
                placeholder="A sample of how your brand writes..."
                textarea
              />
            }
          />
        </div>
      </PbSection>

      {/* Content Strategy */}
      <PbSection title="Content Strategy">
        <div style={{ marginBottom: 12 }}>
          <div
            style={{
              fontSize: 11,
              fontWeight: 600,
              color: '#999',
              textTransform: 'uppercase',
              letterSpacing: 0.5,
              marginBottom: 8,
            }}
          >
            Content pillars
          </div>
          {!editing ? (
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              {(p?.content_pillars ?? []).length > 0 ? (
                (p?.content_pillars ?? []).map((pl, i) => (
                  <span
                    key={i}
                    style={{
                      padding: '4px 12px',
                      borderRadius: 20,
                      background: '#fdf0f6',
                      color: '#C2185B',
                      fontSize: 12.5,
                      fontWeight: 600,
                    }}
                  >
                    {typeof pl === 'string' ? pl : ((pl as { theme?: string }).theme ?? String(pl))}
                  </span>
                ))
              ) : (
                <span style={{ fontSize: 13, color: '#bbb' }}>—</span>
              )}
            </div>
          ) : (
            <div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 8 }}>
                {pillars.map((pl, i) => (
                  <span
                    key={i}
                    style={{
                      padding: '4px 10px',
                      borderRadius: 20,
                      background: '#fdf0f6',
                      color: '#C2185B',
                      fontSize: 12.5,
                      fontWeight: 600,
                      display: 'flex',
                      alignItems: 'center',
                      gap: 5,
                    }}
                  >
                    {pl}
                    <button
                      onClick={() => setPillars(pillars.filter((_, j) => j !== i))}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: '#C2185B',
                        cursor: 'pointer',
                        fontSize: 14,
                        lineHeight: 1,
                        padding: 0,
                      }}
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
              <div style={{ display: 'flex', gap: 6 }}>
                <PbInput value={newPillar} onChange={setNewPillar} placeholder="e.g. Education" />
                <button
                  onClick={() => {
                    if (newPillar.trim()) {
                      setPillars([...pillars, newPillar.trim()]);
                      setNewPillar('');
                    }
                  }}
                  style={{
                    padding: '8px 14px',
                    borderRadius: 8,
                    border: '1.5px solid #C2185B',
                    background: '#fff',
                    color: '#C2185B',
                    fontSize: 13,
                    fontWeight: 700,
                    cursor: 'pointer',
                    whiteSpace: 'nowrap',
                    fontFamily: 'var(--wf)',
                  }}
                >
                  + Add
                </button>
              </div>
            </div>
          )}
        </div>
        <div>
          <div
            style={{
              fontSize: 11,
              fontWeight: 600,
              color: '#999',
              textTransform: 'uppercase',
              letterSpacing: 0.5,
              marginBottom: 8,
            }}
          >
            Preferred formats
          </div>
          {!editing ? (
            <div style={{ fontSize: 13, color: (p?.preferred_formats ?? []).length > 0 ? '#111' : '#bbb' }}>
              {(p?.preferred_formats ?? []).join(', ') || '—'}
            </div>
          ) : (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {ALL_FORMATS.map((f) => (
                <PbChip key={f} label={f} active={formats.includes(f)} onClick={() => pbTgl(formats, setFormats, f)} />
              ))}
            </div>
          )}
        </div>
      </PbSection>

      {/* Audience */}
      <PbSection title="Audience">
        <div style={{ marginBottom: 12 }}>
          <div
            style={{
              fontSize: 11,
              fontWeight: 600,
              color: '#999',
              textTransform: 'uppercase',
              letterSpacing: 0.5,
              marginBottom: 8,
            }}
          >
            Age range
          </div>
          {!editing ? (
            <div style={{ fontSize: 13, color: ageDisplay.length > 0 ? '#111' : '#bbb' }}>
              {ageDisplay.join(', ') || '—'}
            </div>
          ) : (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {ALL_AGES.map((a) => (
                <PbChip
                  key={a}
                  label={a}
                  active={audienceAge.includes(a)}
                  onClick={() => pbTgl(audienceAge, setAudienceAge, a)}
                />
              ))}
            </div>
          )}
        </div>
        <div style={{ marginBottom: 12 }}>
          <div
            style={{
              fontSize: 11,
              fontWeight: 600,
              color: '#999',
              textTransform: 'uppercase',
              letterSpacing: 0.5,
              marginBottom: 8,
            }}
          >
            Primary goal
          </div>
          {!editing ? (
            <div style={{ fontSize: 13, color: p?.primary_goal ? '#111' : '#bbb' }}>{p?.primary_goal || '—'}</div>
          ) : (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {ALL_GOALS.map((g) => (
                <PbChip
                  key={g}
                  label={g}
                  active={primaryGoal === g}
                  onClick={() => setPrimaryGoal(g === primaryGoal ? '' : g)}
                />
              ))}
            </div>
          )}
        </div>
        <div style={{ marginBottom: 12 }}>
          <div
            style={{
              fontSize: 11,
              fontWeight: 600,
              color: '#999',
              textTransform: 'uppercase',
              letterSpacing: 0.5,
              marginBottom: 8,
            }}
          >
            Priority platforms
          </div>
          {!editing ? (
            <div style={{ fontSize: 13, color: (p?.target_platforms ?? []).length > 0 ? '#111' : '#bbb' }}>
              {(p?.target_platforms ?? []).join(', ') || '—'}
            </div>
          ) : (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {ALL_PLATFORMS.map((pl) => (
                <PbChip
                  key={pl}
                  label={pl}
                  active={targetPlatforms.includes(pl)}
                  onClick={() => pbTgl(targetPlatforms, setTargetPlatforms, pl)}
                />
              ))}
            </div>
          )}
        </div>
        <div>
          <div
            style={{
              fontSize: 11,
              fontWeight: 600,
              color: '#999',
              textTransform: 'uppercase',
              letterSpacing: 0.5,
              marginBottom: 8,
            }}
          >
            Competitor handles
          </div>
          {!editing ? (
            <div
              style={{
                fontSize: 13,
                color: (p?.competitor_handles ?? []).filter(Boolean).length > 0 ? '#111' : '#bbb',
              }}
            >
              {(p?.competitor_handles ?? [])
                .filter(Boolean)
                .map((c) => `@${c}`)
                .join(', ') || '—'}
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {competitors.map((c, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span style={{ fontSize: 13, color: '#999' }}>@</span>
                  <PbInput
                    value={c}
                    onChange={(v) => {
                      const cp = [...competitors];
                      cp[i] = v;
                      setCompetitors(cp);
                    }}
                    placeholder={['e.g. competitor_brand', 'e.g. aspirational_brand', 'e.g. another_brand'][i]}
                  />
                </div>
              ))}
            </div>
          )}
        </div>
      </PbSection>

      {/* Language & Region */}
      <PbSection title="Language & Region">
        <div style={{ marginBottom: 12 }}>
          <div
            style={{
              fontSize: 11,
              fontWeight: 600,
              color: '#999',
              textTransform: 'uppercase',
              letterSpacing: 0.5,
              marginBottom: 8,
            }}
          >
            Languages
          </div>
          {!editing ? (
            <div style={{ fontSize: 13, color: (p?.languages ?? []).length > 0 ? '#111' : '#bbb' }}>
              {(p?.languages ?? []).join(', ') || '—'}
            </div>
          ) : (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {ALL_LANGS.map((l) => (
                <PbChip
                  key={l}
                  label={l}
                  active={languages.includes(l)}
                  onClick={() => pbTgl(languages, setLanguages, l)}
                />
              ))}
            </div>
          )}
        </div>
        <div>
          <div
            style={{
              fontSize: 11,
              fontWeight: 600,
              color: '#999',
              textTransform: 'uppercase',
              letterSpacing: 0.5,
              marginBottom: 8,
            }}
          >
            Region / market
          </div>
          {!editing ? (
            <div style={{ fontSize: 13, color: regDisplay.length > 0 ? '#111' : '#bbb' }}>
              {regDisplay.join(', ') || '—'}
            </div>
          ) : (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {ALL_REGIONS.map((r) => (
                <PbChip key={r} label={r} active={region.includes(r)} onClick={() => pbTgl(region, setRegion, r)} />
              ))}
            </div>
          )}
        </div>
      </PbSection>

      {/* Guardrails */}
      <PbSection title="Guardrails">
        <PbRow
          label="Topics to avoid"
          value={p?.guardrails?.avoid_topics}
          editing={editing}
          input={<PbInput value={avoidTopics} onChange={setAvoidTopics} placeholder="e.g. Politics, religion..." />}
        />
        <PbRow
          label="Banned words / phrases"
          value={p?.guardrails?.banned_words}
          editing={editing}
          input={<PbInput value={bannedWords} onChange={setBannedWords} placeholder="Comma separated" />}
        />
        <PbRow
          label="Emoji usage"
          value={p?.guardrails?.emoji_usage}
          editing={editing}
          input={<PbInput value={emojiUsage} onChange={setEmojiUsage} placeholder="e.g. Minimal, 1–2 per post" />}
        />
        <PbRow
          label="Max hashtags"
          value={p?.guardrails?.max_hashtags}
          editing={editing}
          input={<PbInput value={maxHash} onChange={setMaxHash} placeholder="e.g. 5" />}
        />
        <PbRow
          label="Compliance notes"
          value={p?.guardrails?.compliance_notes}
          editing={editing}
          input={
            <PbInput
              value={compliance}
              onChange={setCompliance}
              placeholder="Any regulatory or legal notes..."
              textarea
            />
          }
        />
      </PbSection>

      {/* CTAs */}
      <PbSection title="Call to Action">
        <div style={{ marginBottom: 12 }}>
          <div
            style={{
              fontSize: 11,
              fontWeight: 600,
              color: '#999',
              textTransform: 'uppercase',
              letterSpacing: 0.5,
              marginBottom: 8,
            }}
          >
            CTA styles
          </div>
          {!editing ? (
            <div style={{ fontSize: 13, color: (p?.cta_styles ?? []).length > 0 ? '#111' : '#bbb' }}>
              {(p?.cta_styles ?? []).join(', ') || '—'}
            </div>
          ) : (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {ALL_CTA.map((c) => (
                <PbChip
                  key={c}
                  label={c}
                  active={ctaStyles.includes(c)}
                  onClick={() => pbTgl(ctaStyles, setCtaStyles, c)}
                />
              ))}
            </div>
          )}
        </div>
        <PbRow
          label="Default link"
          value={p?.default_link}
          editing={editing}
          input={<PbInput value={defaultLink} onChange={setDefaultLink} placeholder="https://..." />}
        />
      </PbSection>

      {/* Posting & Workflow */}
      <PbSection title="Posting & Workflow">
        <div style={{ marginBottom: 12 }}>
          <div
            style={{
              fontSize: 11,
              fontWeight: 600,
              color: '#999',
              textTransform: 'uppercase',
              letterSpacing: 0.5,
              marginBottom: 8,
            }}
          >
            Posting cadence
          </div>
          {!editing ? (
            <div style={{ fontSize: 13, color: p?.posting_cadence ? '#111' : '#bbb' }}>{p?.posting_cadence || '—'}</div>
          ) : (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {ALL_CADENCE.map((c) => (
                <PbChip key={c} label={c} active={cadence === c} onClick={() => setCadence(c === cadence ? '' : c)} />
              ))}
            </div>
          )}
        </div>
        <div>
          <div
            style={{
              fontSize: 11,
              fontWeight: 600,
              color: '#999',
              textTransform: 'uppercase',
              letterSpacing: 0.5,
              marginBottom: 8,
            }}
          >
            Approval workflow
          </div>
          {!editing ? (
            <div style={{ fontSize: 13, color: p?.approval_workflow ? '#111' : '#bbb' }}>
              {p?.approval_workflow || '—'}
            </div>
          ) : (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {ALL_APPROVAL.map((a) => (
                <PbChip
                  key={a}
                  label={a}
                  active={approval === a}
                  onClick={() => setApproval(a === approval ? '' : a)}
                />
              ))}
            </div>
          )}
        </div>
      </PbSection>
    </SubPage>
  );
};

const SettingsPage = ({
  onJane,
  brandName,
  onNavChange,
  onBillingTabChange,
}: {
  onJane: () => void;
  brandName: string;
  onNavChange: (nav: string) => void;
  onBillingTabChange: (tab: 'overview' | 'credits' | 'payments' | 'plans') => void;
}) => {
  const { userDetails } = useAuth();
  const router = useRouter();

  return (
    <SubPage title="Settings" icon="settings" desc="Manage your account and brand preferences" onJane={onJane}>
      {/* Account Section */}
      <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #edecea', padding: 18, marginBottom: 12 }}>
        <h3 style={{ fontSize: 14, fontWeight: 700, marginBottom: 14, display: 'flex', alignItems: 'center', gap: 8 }}>
          <I n="settings" s={16} c="#C2185B" />
          Account Settings
        </h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div>
            <div style={{ fontSize: 11, color: '#999', marginBottom: 4, fontWeight: 600 }}>NAME</div>
            <div style={{ fontSize: 13.5, color: '#333', fontWeight: 500 }}>
              {userDetails?.firstName || ''} {userDetails?.lastName || ''}
            </div>
          </div>
          <div>
            <div style={{ fontSize: 11, color: '#999', marginBottom: 4, fontWeight: 600 }}>EMAIL</div>
            <div style={{ fontSize: 13.5, color: '#333', fontWeight: 500 }}>{userDetails?.email || ''}</div>
          </div>
        </div>
      </div>

      {/* Brand Settings */}
      <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #edecea', padding: 18, marginBottom: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
          <h3 style={{ fontSize: 14, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 8 }}>
            <I n="book" s={16} c="#C2185B" />
            Brand Profile
          </h3>
          <button
            onClick={() => router.push('/social-media/brand-setup')}
            style={{
              padding: '6px 12px',
              borderRadius: 7,
              border: '1px solid #e5e3df',
              background: '#fff',
              cursor: 'pointer',
              fontFamily: 'var(--wf)',
              fontSize: 12,
              fontWeight: 600,
              color: '#C2185B',
            }}
          >
            Edit Profile
          </button>
        </div>
        <div>
          <div style={{ fontSize: 11, color: '#999', marginBottom: 4, fontWeight: 600 }}>BRAND NAME</div>
          <div style={{ fontSize: 13.5, color: '#333', fontWeight: 500 }}>{brandName || 'Not set'}</div>
        </div>
      </div>

      {/* Subscription Info */}
      <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #edecea', padding: 18, marginBottom: 12 }}>
        <h3 style={{ fontSize: 14, fontWeight: 700, marginBottom: 14, display: 'flex', alignItems: 'center', gap: 8 }}>
          <I n="trending" s={16} c="#C2185B" />
          Subscription
        </h3>
        <div>
          <div style={{ fontSize: 11, color: '#999', marginBottom: 4, fontWeight: 600 }}>CURRENT PLAN</div>
          <div style={{ fontSize: 13.5, color: '#333', fontWeight: 600, textTransform: 'capitalize' }}>
            {userDetails?.subscriptionTier || 'Free'}
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #edecea', padding: 18 }}>
        <h3 style={{ fontSize: 14, fontWeight: 700, marginBottom: 14, display: 'flex', alignItems: 'center', gap: 8 }}>
          <I n="trending" s={16} c="#C2185B" />
          Quick Actions
        </h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <button
            onClick={() => onNavChange('billing')}
            style={{
              width: '100%',
              padding: '12px 14px',
              borderRadius: 9,
              border: '1px solid #e5e3df',
              background: '#fff',
              cursor: 'pointer',
              fontFamily: 'var(--wf)',
              fontSize: 13,
              fontWeight: 600,
              color: '#333',
              textAlign: 'left',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <span>View Billing & Credits</span>
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M6 12L10 8L6 4" stroke="#999" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          </button>
          <button
            onClick={() => {
              onBillingTabChange('plans');
              onNavChange('billing');
            }}
            style={{
              width: '100%',
              padding: '12px 14px',
              borderRadius: 9,
              border: 'none',
              background: 'linear-gradient(135deg, #C2185B, #E91E63)',
              color: '#fff',
              cursor: 'pointer',
              fontFamily: 'var(--wf)',
              fontSize: 13,
              fontWeight: 700,
              textAlign: 'left',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <span>Upgrade Plan</span>
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M6 12L10 8L6 4" stroke="#fff" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          </button>
        </div>
      </div>
    </SubPage>
  );
};

/* ── Feed types ─────────────────────────────────────────────────────────── */
interface FeedMsg {
  id: string;
  type: 'jane' | 'jane-card' | 'user';
  time: string;
  content: ReactNode;
}

const STATUS_MSGS = [
  'Monitoring trends in your niche...',
  'Analysing audience engagement patterns...',
  'Optimising your posting schedule...',
  'Scanning for trending hashtags...',
  'Generating content ideas...',
];

const NAV = [
  { id: 'workspace', icon: 'home', label: 'Workspace' },
  // { id: 'messages', icon: 'inbox', label: 'Customer Messages', count: 0 },
  { id: 'schedule', icon: 'calendar', label: 'Posting Schedule' },
  { id: 'connections', icon: 'share', label: 'Connected Accounts' },
  { id: 'performance', icon: 'chart', label: 'Performance' },
  { id: 'intel', icon: 'globe', label: 'Market Intel' },
  { id: 'playbook', icon: 'book', label: 'Brand Playbook' },
  { id: 'settings', icon: 'settings', label: 'Settings' },
  { id: 'billing', icon: 'trending', label: 'Billing' },
];

const MOBILE_TABS = [
  { id: 'workspace', icon: 'home', label: 'Jane' },
  { id: 'schedule', icon: 'calendar', label: 'Schedule' },
  { id: 'performance', icon: 'chart', label: 'Analytics' },
  { id: 'playbook', icon: 'book', label: 'Playbook' },
  { id: 'more', icon: 'settings', label: 'More' },
];

const MORE_NAV = [
  { id: 'intel', icon: 'globe', label: 'Market Intel' },
  { id: 'settings', icon: 'settings', label: 'Settings' },
  { id: 'billing', icon: 'trending', label: 'Billing' },
];

/* ══════════════════════════════════════════════════════════════════════════
   MAIN DASHBOARD
═══════════════════════════════════════════════════════════════════════════ */
export default function WorkspaceDashboard() {
  const { logoutUser, userDetails } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();

  const [ready, setReady] = useState(false);
  const [nav, setNav] = useState(() => searchParams?.get('tab') || 'workspace');
  const [billingTab, setBillingTab] = useState<'overview' | 'credits' | 'payments' | 'plans'>('overview');
  const [sIdx, setSIdx] = useState(0);
  const [feed, setFeed] = useState<FeedMsg[]>([]);
  const [input, setInput] = useState('');
  const [typing, setTyping] = useState(false);
  const [profile, setProfile] = useState<BrandProfileData | null>(null);
  const [isMobile, setIsMobile] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);
  const feedEnd = useRef<HTMLDivElement>(null);

  useEffect(() => {
    BrandProfileService.isOnboardingDone().then((done) => {
      if (!done) router.replace('/social-media/brand-setup');
    });
    BrandProfileService.get().then((res) => {
      if (res.status && res.responseData) setProfile(res.responseData);
    });
  }, [router]);

  useEffect(() => {
    const ck = () => setIsMobile(window.innerWidth < 768);
    ck();
    window.addEventListener('resize', ck);
    return () => window.removeEventListener('resize', ck);
  }, []);

  useEffect(() => {
    const name = profile?.brand_name ?? 'your brand';
    const now = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    setFeed([
      {
        id: 'w1',
        type: 'jane',
        time: now,
        content: (
          <div>
            <p style={{ margin: 0 }}>
              Good {new Date().getHours() < 12 ? 'morning' : 'afternoon'}! Here's your briefing for{' '}
              <strong>{name}</strong>:
            </p>
            <ul style={{ margin: '6px 0 0', paddingLeft: 18, fontSize: 13, color: '#555', lineHeight: 1.7 }}>
              <li>
                Check <strong>Posting Schedule</strong> for posts needing review
              </li>
              <li>Type a topic below and I'll draft content across your platforms</li>
              <li>
                Connect social accounts in <strong>Settings</strong> to unlock analytics
              </li>
            </ul>
          </div>
        ),
      },
    ]);
    setTimeout(() => setReady(true), 120);
  }, [profile]);

  useEffect(() => {
    const iv = setInterval(() => setSIdx((i) => (i + 1) % STATUS_MSGS.length), 5000);
    return () => clearInterval(iv);
  }, []);

  useEffect(() => {
    feedEnd.current?.scrollIntoView({ behavior: 'smooth' });
  }, [feed, typing]);

  const sendMsg = async () => {
    if (!input.trim()) return;
    const txt = input.trim();
    setInput('');
    const now = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    setFeed((f) => [...f, { id: 'u' + Date.now(), type: 'user', time: now, content: txt }]);
    setTyping(true);

    try {
      const l = txt.toLowerCase();
      if (
        l.includes('generate') ||
        l.includes('create') ||
        l.includes('draft') ||
        l.includes('post') ||
        l.includes('write')
      ) {
        const res = await SocialMediaAgentService.generateContent({
          seed_content: txt,
          platforms: ['instagram', 'facebook'],
          include_images: false,
        });
        setTyping(false);
        const drafts: ContentDraft[] =
          (res as unknown as { responseData: { drafts: ContentDraft[] } }).responseData?.drafts ?? [];
        if (res.status && drafts.length > 0) {
          setFeed((f) => [
            ...f,
            {
              id: 'j' + Date.now(),
              type: 'jane-card',
              time: now,
              content: (
                <div>
                  <p style={{ margin: '0 0 10px', fontSize: 13, color: '#444' }}>
                    Generated {drafts.length} draft{drafts.length > 1 ? 's' : ''}. Check{' '}
                    <strong>Posting Schedule → Needs Review</strong>.
                  </p>
                  {drafts.slice(0, 2).map((d) => (
                    <div
                      key={d.id ?? d.draft_id}
                      style={{
                        marginBottom: 8,
                        padding: '12px 14px',
                        borderRadius: 10,
                        background: '#f9f9f9',
                        border: '1px solid #edecea',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 5 }}>
                        <PlatformDot p={d.platform} />
                        <span style={{ fontSize: 12, fontWeight: 600, color: '#222' }}>
                          {d.platform.charAt(0).toUpperCase() + d.platform.slice(1)}
                        </span>
                      </div>
                      <p style={{ fontSize: 12.5, color: '#555', margin: 0, lineHeight: 1.5 }}>
                        {d.content.slice(0, 120)}
                        {d.content.length > 120 ? '…' : ''}
                      </p>
                    </div>
                  ))}
                  <button
                    onClick={() => setNav('schedule')}
                    style={{
                      marginTop: 8,
                      padding: '8px 14px',
                      borderRadius: 8,
                      border: 'none',
                      background: '#111',
                      color: '#E91E63',
                      fontWeight: 600,
                      fontSize: 12,
                      cursor: 'pointer',
                      fontFamily: 'var(--wf)',
                    }}
                  >
                    Review in Posting Schedule →
                  </button>
                </div>
              ),
            },
          ]);
        } else {
          setFeed((f) => [
            ...f,
            {
              id: 'j' + Date.now(),
              type: 'jane',
              time: now,
              content: <p style={{ margin: 0 }}>I ran into an issue generating content. Please try again.</p>,
            },
          ]);
        }
        return;
      }

      await new Promise((r) => setTimeout(r, 1200));
      setTyping(false);
      let reply: ReactNode = (
        <p style={{ margin: 0 }}>
          Got it! To generate posts, just tell me what topic or campaign you want content for.
        </p>
      );
      if (l.includes('schedule') || l.includes('queue') || l.includes('pending')) {
        reply = (
          <p style={{ margin: 0 }}>
            Check the <strong>Posting Schedule</strong> tab to see your full queue, drafts, and scheduled posts — all in
            one place with the weekly calendar.
          </p>
        );
      } else if (l.includes('performance') || l.includes('analytic')) {
        reply = (
          <p style={{ margin: 0 }}>
            Connect your social accounts in <strong>Settings → Social Accounts</strong> and I'll pull real performance
            data for you.
          </p>
        );
      }
      setFeed((f) => [...f, { id: 'j' + Date.now(), type: 'jane', time: now, content: reply }]);
    } catch {
      setTyping(false);
      setFeed((f) => [
        ...f,
        {
          id: 'j' + Date.now(),
          type: 'jane',
          time: now,
          content: <p style={{ margin: 0 }}>Something went wrong. Please try again.</p>,
        },
      ]);
    }
  };

  const goWorkspace = () => setNav('workspace');
  const brandName = profile?.brand_name ?? 'Your Brand';
  const brandInitials = brandName
    .split(' ')
    .map((w) => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  const PAGES: Record<string, ReactNode> = {
    messages: <MessagesPage onJane={goWorkspace} />,
    schedule: <ContentManagerPage onJane={goWorkspace} />,
    connections: <ConnectionsPage onJane={goWorkspace} />,
    performance: <PerformancePage onJane={goWorkspace} />,
    intel: <IntelPage onJane={goWorkspace} />,
    playbook: <PlaybookPage onJane={goWorkspace} profile={profile} onProfileUpdate={setProfile} />,
    settings: (
      <SettingsPage
        onJane={goWorkspace}
        brandName={brandName}
        onNavChange={setNav}
        onBillingTabChange={setBillingTab}
      />
    ),
    billing: <BillingPage onBack={goWorkspace} initialTab={billingTab} />,
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Urbanist:wght@400;500;600;700;800;900&display=swap');
        :root{--wf:'Urbanist',sans-serif}
        .workspace-root *{box-sizing:border-box}
        .workspace-root{font-family:var(--wf)}
        .workspace-root>*:not(.MuiBox-root):not([class*="Mui"]){margin:0;padding:0}
        @keyframes spin{to{transform:rotate(360deg)}}
        @keyframes shimmer{0%{background-position:200% 0}100%{background-position:-200% 0}}
        .workspace-root ::-webkit-scrollbar{width:5px;height:5px}
        .workspace-root ::-webkit-scrollbar-thumb{background:#ddd;border-radius:99px}
        .workspace-root .tab-scroll::-webkit-scrollbar{display:none}
        .workspace-root input:focus,.workspace-root textarea:focus,.workspace-root select:focus{outline:none}
        @keyframes wTypeBounce{0%,80%,100%{transform:translateY(0);opacity:.4}40%{transform:translateY(-5px);opacity:1}}
        @keyframes wStatusFade{0%{opacity:0;transform:translateY(3px)}12%{opacity:1;transform:translateY(0)}88%{opacity:1}100%{opacity:0;transform:translateY(-3px)}}
      `}</style>

      <div
        className="workspace-root"
        style={{
          display: 'flex',
          flexDirection: isMobile ? 'column' : 'row',
          height: '100vh',
          fontFamily: 'var(--wf)',
          background: '#f5f4f0',
          opacity: ready ? 1 : 0,
          transition: 'opacity .3s',
        }}
      >
        {/* SIDEBAR — desktop only */}
        {!isMobile && (
          <div
            style={{
              width: 224,
              background: '#1a0a12',
              display: 'flex',
              flexDirection: 'column',
              padding: '18px 0',
              flexShrink: 0,
            }}
          >
            <Link
              href="/"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 9,
                padding: '0 18px',
                marginBottom: 26,
                textDecoration: 'none',
                cursor: 'pointer',
                transition: 'opacity 0.2s',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.opacity = '0.8')}
              onMouseLeave={(e) => (e.currentTarget.style.opacity = '1')}
            >
              <img
                src="/images/urilogo-nobg.png"
                alt="URI Social"
                style={{ width: 32, height: 32, objectFit: 'contain' }}
              />
              <span
                style={{
                  color: '#fff',
                  fontWeight: 300,
                  fontSize: 15,
                  fontFamily: 'Georgia, "Times New Roman", serif',
                  fontStyle: 'italic',
                  letterSpacing: '0.5px',
                }}
              >
                social
              </span>
            </Link>
            <div
              style={{
                margin: '0 12px 18px',
                padding: '12px 14px',
                borderRadius: 11,
                background: 'rgba(194,24,91,.08)',
                border: '1px solid rgba(194,24,91,.12)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 9, marginBottom: 5 }}>
                <JaneAvatar size={28} pulse />
                <div>
                  <div style={{ fontSize: 12.5, fontWeight: 700, color: '#f3d0df' }}>URI Agent</div>
                  <div style={{ fontSize: 10, color: 'rgba(255,255,255,.3)' }}>AI Social Manager</div>
                </div>
              </div>
              <div style={{ fontSize: 10, color: 'rgba(255,255,255,.2)', paddingLeft: 37 }}>Active & ready</div>
            </div>
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 1 }}>
              {NAV.map((n) => (
                <button
                  key={n.id}
                  onClick={() => setNav(n.id)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10,
                    padding: '9px 18px',
                    background: nav === n.id ? 'rgba(194,24,91,.1)' : 'transparent',
                    border: 'none',
                    borderLeft: nav === n.id ? '2.5px solid #E91E63' : '2.5px solid transparent',
                    fontFamily: 'var(--wf)',
                    fontSize: 12.5,
                    color: nav === n.id ? '#fce4ec' : 'rgba(255,255,255,.35)',
                    fontWeight: nav === n.id ? 600 : 400,
                    cursor: 'pointer',
                    textAlign: 'left',
                    transition: 'all .12s',
                  }}
                >
                  <I n={n.icon} s={15} c={nav === n.id ? '#E91E63' : 'rgba(255,255,255,.22)'} />
                  <span style={{ flex: 1 }}>{n.label}</span>
                  {(n as { count?: number }).count != null && (n as { count?: number }).count! > 0 && (
                    <span
                      style={{
                        background: '#E91E63',
                        color: '#fff',
                        fontSize: 9.5,
                        fontWeight: 700,
                        padding: '1px 5px',
                        borderRadius: 4,
                      }}
                    >
                      {(n as { count?: number }).count}
                    </span>
                  )}
                </button>
              ))}
            </div>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '14px 18px 0',
                marginTop: 14,
                borderTop: '1px solid rgba(255,255,255,.05)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
                {profile?.logo_url ? (
                  <img
                    src={profile.logo_url}
                    alt="logo"
                    style={{ width: 30, height: 30, borderRadius: '50%', objectFit: 'cover' }}
                  />
                ) : (
                  <div
                    style={{
                      width: 30,
                      height: 30,
                      borderRadius: '50%',
                      background: 'linear-gradient(135deg,#880E4F,#C2185B)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <span style={{ color: '#fff', fontWeight: 700, fontSize: 11 }}>{brandInitials}</span>
                  </div>
                )}
                <div>
                  <div style={{ fontSize: 12, color: 'rgba(255,255,255,.75)', fontWeight: 600 }}>{brandName}</div>
                  <div style={{ fontSize: 10, color: 'rgba(255,255,255,.2)', textTransform: 'capitalize' }}>
                    {userDetails?.subscriptionTier || 'Free'} Plan
                  </div>
                </div>
              </div>
              <button
                onClick={logoutUser}
                title="Logout"
                style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4 }}
              >
                <I n="logout" s={14} c="rgba(255,255,255,.2)" />
              </button>
            </div>
          </div>
        )}

        {/* MAIN */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          {/* Topbar */}
          <div
            style={{
              padding: isMobile ? '8px 14px' : '9px 24px',
              background: '#fff',
              borderBottom: '1px solid #edecea',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: isMobile ? 7 : 9 }}>
              {isMobile && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginRight: 4 }}>
                  <div
                    style={{
                      width: 24,
                      height: 24,
                      borderRadius: 6,
                      background: 'linear-gradient(135deg,#C2185B,#E91E63)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                    }}
                  >
                    <span style={{ color: '#fff', fontWeight: 900, fontSize: 11 }}>U</span>
                  </div>
                  <span style={{ fontSize: 13, fontWeight: 700, color: '#111' }}>
                    URI <span style={{ fontWeight: 400, color: '#999' }}>Social</span>
                  </span>
                </div>
              )}
              {!isMobile && (
                <div
                  style={{
                    width: 7,
                    height: 7,
                    borderRadius: '50%',
                    background: '#4caf50',
                    boxShadow: '0 0 7px rgba(76,175,80,.4)',
                  }}
                />
              )}
              <span
                style={{
                  fontSize: isMobile ? 11 : 12.5,
                  color: '#666',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                  maxWidth: isMobile ? 160 : 'none',
                }}
              >
                {!isMobile && (
                  <>
                    <strong style={{ color: '#C2185B' }}>URI Agent</strong> is active:{' '}
                  </>
                )}
                <span key={sIdx} style={{ animation: 'wStatusFade 5s linear', display: 'inline-block' }}>
                  {isMobile ? STATUS_MSGS[sIdx].slice(0, 28) + '…' : STATUS_MSGS[sIdx]}
                </span>
              </span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
              <button
                onClick={() => router.push('/settings/social-accounts')}
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: 7,
                  border: '1px solid #e5e3df',
                  background: '#fff',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
                title="Social Accounts"
              >
                <I n="settings" s={14} c="#666" />
              </button>
              <button
                onClick={() => router.push('/social-media/brand-setup')}
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: 7,
                  border: '1px solid #e5e3df',
                  background: '#fff',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
                title="Edit Brand Setup"
              >
                <I n="edit" s={14} c="#666" />
              </button>

              {/* Credit Balance Badge */}
              {!isMobile && <WorkspaceCreditBadge onClick={() => setNav('billing')} />}

              {/* Profile Dropdown */}
              <WorkspaceProfileDropdown onNavigate={setNav} onLogout={logoutUser} />
            </div>
          </div>

          {/* Page content */}
          <div style={{ flex: 1, overflow: 'hidden' }}>
            {nav === 'workspace' ? (
              <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
                <div style={{ flex: 1, overflowY: 'auto', padding: isMobile ? '14px 14px 8px' : '18px 24px 8px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
                    <div style={{ flex: 1, height: 1, background: '#edecea' }} />
                    <span
                      style={{
                        fontSize: 11,
                        fontWeight: 600,
                        color: '#ccc',
                        letterSpacing: 0.5,
                        textTransform: 'uppercase',
                      }}
                    >
                      {new Date().toLocaleDateString('en-US', {
                        weekday: 'long',
                        month: 'long',
                        day: 'numeric',
                        year: 'numeric',
                      })}
                    </span>
                    <div style={{ flex: 1, height: 1, background: '#edecea' }} />
                  </div>
                  {feed.map((msg) => (
                    <div key={msg.id} style={{ marginBottom: 20 }}>
                      {msg.type === 'user' ? (
                        <div style={{ display: 'flex', gap: isMobile ? 6 : 10, justifyContent: 'flex-end' }}>
                          <div style={{ maxWidth: isMobile ? '88%' : 500 }}>
                            <div
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'flex-end',
                                gap: 5,
                                marginBottom: 4,
                              }}
                            >
                              <span style={{ fontSize: 10.5, color: '#bbb' }}>{msg.time}</span>
                              <span style={{ fontSize: 12, fontWeight: 700, color: '#555' }}>You</span>
                            </div>
                            <div
                              style={{
                                padding: isMobile ? '9px 12px' : '11px 16px',
                                borderRadius: '14px 3px 14px 14px',
                                background: '#1a0a12',
                                color: '#f3d0df',
                                fontSize: 13,
                                lineHeight: 1.6,
                              }}
                            >
                              {msg.content}
                            </div>
                          </div>
                          {!isMobile && <UserAvatar size={30} initials={brandInitials} />}
                        </div>
                      ) : (
                        <div style={{ display: 'flex', gap: isMobile ? 6 : 10, alignItems: 'flex-start' }}>
                          <JaneAvatar size={isMobile ? 26 : 30} />
                          <div style={{ maxWidth: isMobile ? '90%' : 560, flex: 1 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginBottom: 4 }}>
                              <span style={{ fontSize: 12, fontWeight: 700, color: '#C2185B' }}>URI Agent</span>
                              <span
                                style={{
                                  fontSize: 10,
                                  color: '#C2185B',
                                  background: 'rgba(194,24,91,.07)',
                                  padding: '1px 6px',
                                  borderRadius: 3,
                                  fontWeight: 600,
                                }}
                              >
                                AI
                              </span>
                              <span style={{ fontSize: 10.5, color: '#bbb' }}>{msg.time}</span>
                            </div>
                            <div
                              style={{
                                padding: '11px 16px',
                                borderRadius: '3px 14px 14px 14px',
                                background: '#fff',
                                border: '1px solid #edecea',
                                fontSize: 13,
                                lineHeight: 1.6,
                                color: '#333',
                              }}
                            >
                              {msg.content}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                  {typing && (
                    <div style={{ display: 'flex', gap: 10, marginBottom: 20 }}>
                      <JaneAvatar size={30} />
                      <div
                        style={{
                          padding: '12px 18px',
                          borderRadius: '3px 14px 14px 14px',
                          background: '#fff',
                          border: '1px solid #edecea',
                        }}
                      >
                        <div style={{ display: 'flex', gap: 4 }}>
                          {[0, 1, 2].map((i) => (
                            <div
                              key={i}
                              style={{
                                width: 6,
                                height: 6,
                                borderRadius: '50%',
                                background: '#C2185B',
                                opacity: 0.4,
                                animation: `wTypeBounce 1.2s ${i * 0.15}s infinite`,
                              }}
                            />
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                  <div ref={feedEnd} />
                </div>
                <div
                  style={{
                    padding: isMobile
                      ? `8px 14px ${isMobile ? 'calc(8px + env(safe-area-inset-bottom, 0px))' : '16px'}`
                      : '10px 24px 16px',
                    background: 'linear-gradient(0deg,#f5f4f0 80%,transparent)',
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      gap: 7,
                      alignItems: 'flex-end',
                      background: '#fff',
                      borderRadius: 13,
                      border: '1.5px solid #e5e3df',
                      padding: '5px 5px 5px 16px',
                      boxShadow: '0 3px 16px rgba(0,0,0,.05)',
                    }}
                  >
                    <input
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault();
                          sendMsg();
                        }
                      }}
                      placeholder="Tell URI Agent what to create — e.g. 'Write 3 posts about our new product launch'"
                      style={{
                        flex: 1,
                        border: 'none',
                        outline: 'none',
                        fontSize: 13.5,
                        fontFamily: 'var(--wf)',
                        padding: '9px 0',
                        background: 'transparent',
                        color: '#222',
                      }}
                    />
                    <button
                      onClick={sendMsg}
                      style={{
                        width: 38,
                        height: 38,
                        borderRadius: 9,
                        border: 'none',
                        background: input.trim() ? '#C2185B' : '#eee',
                        cursor: input.trim() ? 'pointer' : 'default',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        transition: 'background .2s',
                      }}
                    >
                      <I n="send" s={15} c={input.trim() ? '#fff' : '#ccc'} />
                    </button>
                  </div>
                  <div style={{ textAlign: 'center', marginTop: 5 }}>
                    <span style={{ fontSize: 10, color: '#ccc' }}>
                      URI Agent can make mistakes. Always review before publishing.
                    </span>
                  </div>
                </div>
              </div>
            ) : (
              PAGES[nav]
            )}
          </div>

          {/* BOTTOM NAV — mobile only */}
          {isMobile && (
            <div
              style={{
                display: 'flex',
                background: '#fff',
                borderTop: '1px solid #edecea',
                paddingBottom: 'env(safe-area-inset-bottom, 0px)',
                flexShrink: 0,
              }}
            >
              {MOBILE_TABS.map((t) => {
                const isActive = t.id === 'more' ? moreOpen : nav === t.id;
                return (
                  <button
                    key={t.id}
                    onClick={() => {
                      if (t.id === 'more') {
                        setMoreOpen((o) => !o);
                      } else {
                        setNav(t.id);
                        setMoreOpen(false);
                      }
                    }}
                    style={{
                      flex: 1,
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 2,
                      padding: '7px 0 5px',
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      fontFamily: 'var(--wf)',
                    }}
                  >
                    <I n={t.icon} s={20} c={isActive ? '#C2185B' : '#bbb'} />
                    <span
                      style={{ fontSize: 9.5, fontWeight: isActive ? 700 : 500, color: isActive ? '#C2185B' : '#bbb' }}
                    >
                      {t.label}
                    </span>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* MORE DRAWER — mobile only */}
        {isMobile && moreOpen && (
          <>
            <div
              onClick={() => setMoreOpen(false)}
              style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.25)', zIndex: 200 }}
            />
            <div
              style={{
                position: 'fixed',
                bottom: 56,
                left: 0,
                right: 0,
                background: '#fff',
                borderRadius: '16px 16px 0 0',
                boxShadow: '0 -4px 24px rgba(0,0,0,.12)',
                zIndex: 201,
                paddingBottom: 'env(safe-area-inset-bottom, 0px)',
              }}
            >
              {/* Handle */}
              <div style={{ display: 'flex', justifyContent: 'center', padding: '10px 0 4px' }}>
                <div style={{ width: 36, height: 4, borderRadius: 2, background: '#e5e3df' }} />
              </div>
              {/* User card */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  padding: '10px 18px 14px',
                  borderBottom: '1px solid #f0eeea',
                }}
              >
                {profile?.logo_url ? (
                  <img
                    src={profile.logo_url}
                    alt="logo"
                    style={{ width: 36, height: 36, borderRadius: '50%', objectFit: 'cover' }}
                  />
                ) : (
                  <div
                    style={{
                      width: 36,
                      height: 36,
                      borderRadius: '50%',
                      background: 'linear-gradient(135deg,#880E4F,#C2185B)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                    }}
                  >
                    <span style={{ color: '#fff', fontWeight: 700, fontSize: 13 }}>{brandInitials}</span>
                  </div>
                )}
                <div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: '#111' }}>{brandName}</div>
                  <div style={{ fontSize: 11, color: '#999', textTransform: 'capitalize' }}>
                    {userDetails?.subscriptionTier || 'Free'} Plan
                  </div>
                </div>
              </div>
              {/* More nav items */}
              {MORE_NAV.map((n) => (
                <button
                  key={n.id}
                  onClick={() => {
                    setNav(n.id);
                    setMoreOpen(false);
                  }}
                  style={{
                    width: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 12,
                    padding: '14px 18px',
                    background: nav === n.id ? 'rgba(194,24,91,.05)' : 'none',
                    border: 'none',
                    borderLeft: nav === n.id ? '3px solid #E91E63' : '3px solid transparent',
                    cursor: 'pointer',
                    fontFamily: 'var(--wf)',
                    fontSize: 14,
                    fontWeight: nav === n.id ? 600 : 500,
                    color: nav === n.id ? '#C2185B' : '#333',
                    textAlign: 'left',
                  }}
                >
                  <I n={n.icon} s={18} c={nav === n.id ? '#C2185B' : '#888'} />
                  {n.label}
                </button>
              ))}
              <button
                onClick={() => {
                  logoutUser();
                  setMoreOpen(false);
                }}
                style={{
                  width: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  padding: '14px 18px 18px',
                  background: 'none',
                  border: 'none',
                  borderTop: '1px solid #f0eeea',
                  cursor: 'pointer',
                  fontFamily: 'var(--wf)',
                  fontSize: 14,
                  fontWeight: 500,
                  color: '#999',
                  textAlign: 'left',
                  marginTop: 4,
                }}
              >
                <I n="logout" s={18} c="#ccc" />
                Sign out
              </button>
            </div>
          </>
        )}
      </div>
    </>
  );
}
