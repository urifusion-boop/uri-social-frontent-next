'use client';

import { useEffect, useRef, useState } from 'react';
import { BrandProfileData, BrandProfileService } from '@/src/api/BrandProfileService';
import { ContentDraft, SocialMediaAgentService } from '@/src/api/SocialMediaAgentService';
import { useAuth } from '@/src/providers/AuthProvider';
import { useRouter } from 'next/navigation';
import { ReactNode } from 'react';

/* ── Icons ─────────────────────────────────────────────────────────────── */
const I = ({ n, s = 18, c = 'currentColor' }: { n: string; s?: number; c?: string }) => {
  const p: Record<string, ReactNode> = {
    home: <path d="M3 12l9-8 9 8M5 11v8a1 1 0 001 1h4v-5h4v5h4a1 1 0 001-1v-8" />,
    inbox: <><polyline points="22 12 16 12 14 15 10 15 8 12 2 12" /><path d="M5.45 5.11L2 12v6a2 2 0 002 2h16a2 2 0 002-2v-6l-3.45-6.89A2 2 0 0016.76 4H7.24a2 2 0 00-1.79 1.11z" /></>,
    calendar: <><rect x="3" y="4" width="18" height="17" rx="2" /><path d="M16 2v4M8 2v4M3 10h18" /></>,
    chart: <path d="M18 20V10M12 20V4M6 20v-6" />,
    globe: <><circle cx="12" cy="12" r="10" /><line x1="2" y1="12" x2="22" y2="12" /><path d="M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10 15.3 15.3 0 014-10z" /></>,
    book: <><path d="M4 19.5A2.5 2.5 0 016.5 17H20" /><path d="M4 4.5A2.5 2.5 0 016.5 2H20v20H6.5A2.5 2.5 0 014 19.5z" /></>,
    settings: <><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z" /></>,
    send: <><line x1="22" y1="2" x2="11" y2="13" /><polygon points="22 2 15 22 11 13 2 9 22 2" /></>,
    check: <polyline points="20 6 9 17 4 12" />,
    x: <><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></>,
    edit: <><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" /><path d="M18.5 2.5a2.12 2.12 0 013 3L12 15l-4 1 1-4 9.5-9.5z" /></>,
    mic: <><path d="M12 1a3 3 0 00-3 3v8a3 3 0 006 0V4a3 3 0 00-3-3z" /><path d="M19 10v2a7 7 0 01-14 0v-2" /><line x1="12" y1="19" x2="12" y2="23" /><line x1="8" y1="23" x2="16" y2="23" /></>,
    bell: <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 01-3.46 0" />,
    trending: <><polyline points="23 6 13.5 15.5 8.5 10.5 1 18" /><polyline points="17 6 23 6 23 12" /></>,
    clock: <><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></>,
    heart: <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z" />,
    eye: <><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" /></>,
    arrowUp: <><line x1="12" y1="19" x2="12" y2="5" /><polyline points="5 12 12 5 19 12" /></>,
    refresh: <><polyline points="23 4 23 10 17 10" /><path d="M20.49 15a9 9 0 11-2.12-9.36L23 10" /></>,
    trash: <><polyline points="3 6 5 6 21 6" /><path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" /></>,
    copy: <><rect x="9" y="9" width="13" height="13" rx="2" /><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" /></>,
    plus: <><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></>,
    image: <><rect x="3" y="3" width="18" height="18" rx="2" /><circle cx="8.5" cy="8.5" r="1.5" /><polyline points="21 15 16 10 5 21" /></>,
    share: <><circle cx="18" cy="5" r="3" /><circle cx="6" cy="12" r="3" /><circle cx="18" cy="19" r="3" /><line x1="8.59" y1="13.51" x2="15.42" y2="17.49" /><line x1="15.41" y1="6.51" x2="8.59" y2="10.49" /></>,
    calendarPlus: <><rect x="3" y="4" width="18" height="17" rx="2" /><path d="M16 2v4M8 2v4M3 10h18M12 14v4M10 16h4" /></>,
    logout: <><path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4" /><polyline points="16 17 21 12 16 7" /><line x1="21" y1="12" x2="9" y2="12" /></>,
    upload: <><polyline points="16 16 12 12 8 16" /><line x1="12" y1="12" x2="12" y2="21" /><path d="M20.39 18.39A5 5 0 0018 9h-1.26A8 8 0 103 16.3" /></>,
    sparkle: <path d="M12 2l2.09 6.26L20 10.27l-4.47 3.88L16.18 21 12 17.77 7.82 21l.63-6.85L4 10.27l5.91-1.01z" strokeLinejoin="round" />,
    filter: <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />,
  };
  return (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.8" style={{ flexShrink: 0, display: 'block' }}>
      {p[n]}
    </svg>
  );
};

/* ── Shared UI ──────────────────────────────────────────────────────────── */
const JaneAvatar = ({ size = 32, pulse = false }: { size?: number; pulse?: boolean }) => (
  <div style={{ width: size, height: size, borderRadius: '50%', background: 'linear-gradient(135deg,#880E4F,#E91E63)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, position: 'relative' }}>
    <span style={{ color: '#fff', fontWeight: 800, fontSize: size * 0.38 }}>J</span>
    {pulse && <div style={{ position: 'absolute', bottom: -1, right: -1, width: size * 0.3, height: size * 0.3, borderRadius: '50%', background: '#4caf50', border: '2px solid #1a0a12', boxShadow: '0 0 6px rgba(76,175,80,.5)' }} />}
  </div>
);

const UserAvatar = ({ size = 32, initials = 'You' }: { size?: number; initials?: string }) => (
  <div style={{ width: size, height: size, borderRadius: '50%', background: '#2a1520', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
    <span style={{ color: '#E91E63', fontWeight: 700, fontSize: size * 0.28 }}>{initials}</span>
  </div>
);

const PlatformDot = ({ p, s = 7 }: { p: string; s?: number }) => {
  const c: Record<string, string> = { instagram: '#c13584', linkedin: '#0a66c2', x: '#111', twitter: '#1da1f2', facebook: '#1877f2', tiktok: '#010101' };
  return <div style={{ width: s, height: s, borderRadius: 2, background: c[p?.toLowerCase()] ?? '#999', flexShrink: 0 }} />;
};

type BadgeV = 'default' | 'muted' | 'success' | 'danger' | 'warning';
const Bd = ({ children, v = 'default' }: { children: ReactNode; v?: BadgeV }) => {
  const m: Record<BadgeV, { bg: string; c: string; b: string }> = {
    default: { bg: 'rgba(194,24,91,.1)', c: '#AD1457', b: 'rgba(194,24,91,.18)' },
    muted:   { bg: 'rgba(0,0,0,.04)', c: '#888', b: 'rgba(0,0,0,.06)' },
    success: { bg: 'rgba(76,175,80,.08)', c: '#2e7d32', b: 'rgba(76,175,80,.15)' },
    danger:  { bg: 'rgba(155,44,61,.08)', c: '#9b2c3d', b: 'rgba(155,44,61,.15)' },
    warning: { bg: 'rgba(255,193,7,.1)', c: '#f57f17', b: 'rgba(255,193,7,.2)' },
  };
  const s = m[v];
  return <span style={{ background: s.bg, color: s.c, border: `1px solid ${s.b}`, padding: '2px 8px', borderRadius: 5, fontSize: 10.5, fontWeight: 600 }}>{children}</span>;
};

const platformGradient = (platform: string) => {
  const m: Record<string, string> = {
    instagram: 'linear-gradient(135deg,#880E4F,#C2185B)',
    facebook: 'linear-gradient(135deg,#0D47A1,#2196F3)',
    linkedin: 'linear-gradient(135deg,#4A148C,#7B1FA2)',
    twitter: 'linear-gradient(135deg,#1a0a12,#37182b)',
    tiktok: 'linear-gradient(135deg,#111,#333)',
  };
  return m[platform?.toLowerCase()] ?? 'linear-gradient(135deg,#37474F,#607D8B)';
};

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
  dayIndex?: number;        // 0-6 for this week
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
  raw?: ContentDraft;       // original API draft for approve/deny/delete
}

const draftToItem = (d: ContentDraft, mondayMs: number): PostItem => {
  const s = d.status ?? d.approval_status ?? 'draft';
  let status: PostItem['status'] = 'draft';
  if (s.includes('pending')) status = 'queue';
  else if (s === 'scheduled') status = 'scheduled';
  else if (s === 'published') status = 'published';
  else status = 'draft';

  // Compute day index in current week
  let dayIndex: number | undefined;
  const dateStr = d.scheduled_datetime ?? d.created_at;
  if (dateStr) {
    const ms = new Date(dateStr).getTime();
    const diff = Math.floor((ms - mondayMs) / 86400000);
    if (diff >= 0 && diff <= 6) dayIndex = diff;
  }

  return {
    id: d.id ?? d.draft_id ?? String(Math.random()),
    status,
    platform: d.platform,
    caption: d.content,
    hashtags: d.hashtags ?? [],
    time: d.scheduled_datetime ? new Date(d.scheduled_datetime).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : undefined,
    dayIndex,
    auto: d.auto_generated,
    image_url: d.image_url,
    raw: d,
  };
};

const getMondayMs = () => {
  const today = new Date();
  const dow = today.getDay();
  const monday = new Date(today);
  monday.setDate(today.getDate() - (dow === 0 ? 6 : dow - 1));
  monday.setHours(0, 0, 0, 0);
  return monday.getTime();
};

const WEEK_DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const statusColors: Record<string, string> = { queue: '#C2185B', draft: '#888', scheduled: '#4caf50', published: '#1565c0' };
const statusLabels: Record<string, string> = { queue: 'Needs Review', draft: 'Draft', scheduled: 'Scheduled', published: 'Published' };

/* ══════════════════════════════════════════════════════════════════════════
   POSTING SCHEDULE PAGE (v3)
═══════════════════════════════════════════════════════════════════════════ */
const SchedulePage = ({ onJane }: { onJane: () => void }) => {
  const [posts, setPosts] = useState<PostItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState('all');
  const [platformFilter, setPlatformFilter] = useState('all');
  const [selected, setSelected] = useState<string[]>([]);
  const [showCreate, setShowCreate] = useState(false);
  const [createMode, setCreateMode] = useState<'ai' | 'manual'>('ai');
  const [aiPrompt, setAiPrompt] = useState('');
  const [aiThinking, setAiThinking] = useState(false);
  const [aiResult, setAiResult] = useState<ContentDraft[] | null>(null);
  const [manualCaption, setManualCaption] = useState('');
  const [manualPlatform, setManualPlatform] = useState('Instagram');
  const [manualPillar, setManualPillar] = useState('Product');
  const [manualDate, setManualDate] = useState('');
  const [calendarDay, setCalendarDay] = useState<number | null>(null);

  const mondayMs = getMondayMs();

  const weekDates = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(mondayMs + i * 86400000);
    return `${d.toLocaleString('default', { month: 'short' })} ${d.getDate()}`;
  });

  const todayIdx = (() => {
    const dow = new Date().getDay();
    return dow === 0 ? 6 : dow - 1;
  })();

  const load = async () => {
    setLoading(true);
    try {
      const [calRes, schRes] = await Promise.all([
        SocialMediaAgentService.getContentCalendar(),
        SocialMediaAgentService.getScheduled(),
      ]);
      const allDrafts: ContentDraft[] = [
        ...(calRes.status ? (calRes.responseData?.drafts ?? []) : []),
        ...(schRes.status ? (schRes.responseData?.scheduled_drafts ?? []) : []),
      ];
      // Deduplicate by id
      const seen = new Set<string>();
      const unique = allDrafts.filter(d => {
        const key = d.id ?? d.draft_id ?? '';
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      });
      setPosts(unique.map(d => draftToItem(d, mondayMs)));
    } finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const filtered = posts.filter(p => {
    if (filter !== 'all' && p.status !== filter) return false;
    if (platformFilter !== 'all' && p.platform.toLowerCase() !== platformFilter) return false;
    if (calendarDay !== null && p.dayIndex !== calendarDay) return false;
    return true;
  });

  const queueCount = posts.filter(p => p.status === 'queue').length;
  const draftCount = posts.filter(p => p.status === 'draft').length;
  const schedCount = posts.filter(p => p.status === 'scheduled').length;
  const pubCount   = posts.filter(p => p.status === 'published').length;

  const toggleSelect = (id: string) => setSelected(s => s.includes(id) ? s.filter(x => x !== id) : [...s, id]);
  const selectAll = () => setSelected(filtered.map(p => p.id));
  const clearSelect = () => setSelected([]);

  const approvePost = async (post: PostItem) => {
    const draftId = post.raw?.draft_id ?? post.raw?.id ?? post.id;
    await SocialMediaAgentService.approveContent({ draft_ids: [draftId], schedule_option: 'save_draft' });
    setPosts(ps => ps.map(x => x.id === post.id ? { ...x, status: 'scheduled' } : x));
  };

  const rejectPost = async (post: PostItem) => {
    const draftId = post.raw?.draft_id ?? post.raw?.id ?? post.id;
    await SocialMediaAgentService.denyContent({ draft_ids: [draftId], denial_reason: 'Rejected' });
    setPosts(ps => ps.filter(x => x.id !== post.id));
  };

  const deletePost = async (post: PostItem) => {
    const draftId = post.raw?.draft_id ?? post.raw?.id ?? post.id;
    try { await SocialMediaAgentService.deleteDraft(draftId); } catch { /* ignore */ }
    setPosts(ps => ps.filter(x => x.id !== post.id));
  };

  const bulkApprove = async () => {
    const toApprove = posts.filter(x => selected.includes(x.id) && x.status === 'queue');
    for (const p of toApprove) await approvePost(p);
    clearSelect();
  };

  const bulkDelete = async () => {
    const toDel = posts.filter(x => selected.includes(x.id));
    for (const p of toDel) await deletePost(p);
    clearSelect();
  };

  const handleAiCreate = async () => {
    if (!aiPrompt.trim()) return;
    setAiThinking(true);
    try {
      const res = await SocialMediaAgentService.generateContent({
        seed_content: aiPrompt,
        platforms: ['instagram', 'facebook'],
        include_images: false,
      });
      const drafts: ContentDraft[] = (res as unknown as { responseData: { drafts: ContentDraft[] } }).responseData?.drafts ?? [];
      if (res.status && drafts.length > 0) {
        setAiResult(drafts);
        setPosts(ps => [...ps, ...drafts.map(d => draftToItem(d, mondayMs))]);
      }
    } finally { setAiThinking(false); }
  };

  const addManualPost = () => {
    if (!manualCaption.trim()) return;
    const newPost: PostItem = {
      id: 'man' + Date.now(),
      status: 'draft',
      platform: manualPlatform,
      pillar: manualPillar,
      caption: manualCaption,
      time: manualDate ? new Date(manualDate).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : undefined,
      comp: 50,
      lastEdited: 'Just now',
    };
    setPosts(ps => [...ps, newPost]);
    setManualCaption(''); setManualDate(''); setShowCreate(false);
  };

  const calPosts = posts.filter(p => (p.status === 'queue' || p.status === 'scheduled') && p.dayIndex != null);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: '#f5f4f0', position: 'relative' }}>

      {/* Top bar */}
      <div style={{ padding: '16px 24px', background: '#fff', borderBottom: '1px solid #edecea', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <h1 style={{ fontSize: 20, fontWeight: 800, color: '#111', margin: 0 }}>Posting Schedule</h1>
          <p style={{ fontSize: 12.5, color: '#999', margin: '2px 0 0' }}>Plan, review, and track all your content</p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {/* Quick stats */}
          <div style={{ display: 'flex', gap: 4, marginRight: 8 }}>
            {([
              { label: 'Review', key: 'queue', count: queueCount, color: '#C2185B' },
              { label: 'Drafts', key: 'draft', count: draftCount, color: '#888' },
              { label: 'Scheduled', key: 'scheduled', count: schedCount, color: '#4caf50' },
              { label: 'Published', key: 'published', count: pubCount, color: '#1565c0' },
            ] as { label: string; key: string; count: number; color: string }[]).map(s => (
              <button key={s.key} onClick={() => setFilter(filter === s.key ? 'all' : s.key)} style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '5px 10px', borderRadius: 7, background: filter === s.key ? `${s.color}15` : 'transparent', border: filter === s.key ? `1.5px solid ${s.color}40` : '1.5px solid transparent', cursor: 'pointer', fontFamily: 'var(--wf)' }}>
                <div style={{ width: 7, height: 7, borderRadius: '50%', background: s.color }} />
                <span style={{ fontSize: 12, fontWeight: 600, color: s.color }}>{s.count}</span>
                <span style={{ fontSize: 11.5, color: '#999' }}>{s.label}</span>
              </button>
            ))}
          </div>
          <button onClick={load} style={{ width: 32, height: 32, borderRadius: 7, border: '1.5px solid #e5e3df', background: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <I n="refresh" s={13} c={loading ? '#C2185B' : '#999'} />
          </button>
          <button onClick={() => { setShowCreate(true); setAiResult(null); }} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '9px 18px', borderRadius: 9, border: 'none', background: '#C2185B', color: '#fff', fontWeight: 700, fontSize: 13, cursor: 'pointer', fontFamily: 'var(--wf)', boxShadow: '0 2px 8px rgba(194,24,91,.25)' }}>
            <I n="plus" s={16} c="#fff" /> New Post
          </button>
        </div>
      </div>

      {/* Weekly calendar strip */}
      <div style={{ background: '#fff', borderBottom: '1px solid #edecea', padding: '12px 24px 0' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
          <I n="calendar" s={16} c="#C2185B" />
          <span style={{ fontSize: 13, fontWeight: 700, color: '#222' }}>This Week</span>
          <span style={{ fontSize: 12, color: '#999' }}>{weekDates[0]} — {weekDates[6]}</span>
          {calendarDay !== null && (
            <button onClick={() => setCalendarDay(null)} style={{ fontSize: 11, color: '#C2185B', background: 'rgba(194,24,91,.08)', border: 'none', padding: '2px 8px', borderRadius: 4, cursor: 'pointer', fontFamily: 'var(--wf)', fontWeight: 600 }}>Clear filter ×</button>
          )}
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', gap: 6, paddingBottom: 12 }}>
          {WEEK_DAYS.map((day, i) => {
            const dayPosts = calPosts.filter(p => p.dayIndex === i);
            const isToday = i === todayIdx;
            const isSel = calendarDay === i;
            return (
              <button key={day} onClick={() => setCalendarDay(isSel ? null : i)} style={{ padding: '8px 6px', borderRadius: 10, border: isSel ? '2px solid #C2185B' : isToday ? '2px solid rgba(194,24,91,.3)' : '1.5px solid #edecea', background: isSel ? 'rgba(194,24,91,.04)' : isToday ? 'rgba(194,24,91,.02)' : '#fafaf8', cursor: 'pointer', textAlign: 'left', fontFamily: 'var(--wf)', minHeight: 72, display: 'flex', flexDirection: 'column' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
                  <span style={{ fontSize: 10.5, fontWeight: 700, color: isToday ? '#C2185B' : '#999', textTransform: 'uppercase', letterSpacing: 0.5 }}>{day}</span>
                  <span style={{ fontSize: 10, color: isToday ? '#C2185B' : '#bbb' }}>{weekDates[i].split(' ')[1]}</span>
                </div>
                {isToday && <div style={{ fontSize: 8, fontWeight: 700, color: '#C2185B', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 2 }}>Today</div>}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 2, flex: 1 }}>
                  {dayPosts.slice(0, 3).map(p => (
                    <div key={p.id} style={{ display: 'flex', alignItems: 'center', gap: 3, padding: '2px 5px', borderRadius: 4, background: `${statusColors[p.status]}08`, borderLeft: `2px solid ${statusColors[p.status]}` }}>
                      <PlatformDot p={p.platform} s={5} />
                      <span style={{ fontSize: 8.5, color: '#555', fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>{p.caption.slice(0, 20)}</span>
                    </div>
                  ))}
                  {dayPosts.length === 0 && <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><span style={{ fontSize: 9, color: '#ddd' }}>Empty</span></div>}
                </div>
                {dayPosts.length > 0 && <div style={{ fontSize: 9, color: '#999', textAlign: 'right', marginTop: 2 }}>{dayPosts.length} post{dayPosts.length > 1 ? 's' : ''}</div>}
              </button>
            );
          })}
        </div>
      </div>

      {/* Filter bar + bulk actions */}
      <div style={{ padding: '10px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#fafaf8', borderBottom: '1px solid #f0eeea' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          {[{ id: 'all', label: 'All' }, { id: 'queue', label: 'Needs Review' }, { id: 'draft', label: 'Drafts' }, { id: 'scheduled', label: 'Scheduled' }, { id: 'published', label: 'Published' }].map(f => (
            <button key={f.id} onClick={() => setFilter(f.id)} style={{ padding: '5px 12px', borderRadius: 6, border: filter === f.id ? '1.5px solid #222' : '1.5px solid #e5e3df', background: filter === f.id ? '#222' : '#fff', color: filter === f.id ? '#fff' : '#666', fontSize: 11.5, fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--wf)' }}>{f.label}</button>
          ))}
          <span style={{ width: 1, height: 20, background: '#e5e3df', margin: '0 4px' }} />
          <select value={platformFilter} onChange={e => setPlatformFilter(e.target.value)} style={{ padding: '5px 10px', borderRadius: 6, border: '1.5px solid #e5e3df', fontSize: 11.5, fontFamily: 'var(--wf)', outline: 'none', color: '#666', cursor: 'pointer', background: '#fff' }}>
            <option value="all">All Platforms</option>
            <option value="instagram">Instagram</option>
            <option value="linkedin">LinkedIn</option>
            <option value="x">X / Twitter</option>
            <option value="facebook">Facebook</option>
          </select>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          {selected.length > 0 && (
            <>
              <Bd>{selected.length} selected</Bd>
              <button onClick={bulkApprove} style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '5px 12px', borderRadius: 6, border: 'none', background: '#111', color: '#E91E63', fontSize: 11.5, fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--wf)' }}><I n="check" s={13} c="#E91E63" />Approve All</button>
              <button onClick={bulkDelete} style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '5px 12px', borderRadius: 6, border: '1.5px solid rgba(155,44,61,.2)', background: '#fff', color: '#9b2c3d', fontSize: 11.5, fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--wf)' }}><I n="trash" s={13} c="#9b2c3d" />Delete</button>
              <button onClick={clearSelect} style={{ padding: '5px 10px', borderRadius: 6, border: '1.5px solid #e5e3df', background: '#fff', color: '#888', fontSize: 11.5, cursor: 'pointer', fontFamily: 'var(--wf)' }}>Clear</button>
            </>
          )}
          {selected.length === 0 && filtered.length > 0 && (
            <button onClick={selectAll} style={{ padding: '5px 10px', borderRadius: 6, border: '1.5px solid #e5e3df', background: '#fff', color: '#888', fontSize: 11.5, cursor: 'pointer', fontFamily: 'var(--wf)' }}>Select all</button>
          )}
          <span style={{ fontSize: 11.5, color: '#bbb' }}>{filtered.length} posts</span>
        </div>
      </div>

      {/* Content list */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '14px 24px 20px' }}>
        {filter === 'queue' && queueCount > 0 && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12, padding: '10px 14px', borderRadius: 10, background: 'rgba(194,24,91,.03)', border: '1px solid rgba(194,24,91,.1)' }}>
            <JaneAvatar size={22} />
            <span style={{ fontSize: 12.5, color: '#555' }}><strong style={{ color: '#C2185B' }}>URI Agent</strong> drafted {queueCount} post{queueCount > 1 ? 's' : ''} waiting for your approval.</span>
          </div>
        )}
        {filter === 'draft' && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12, padding: '10px 14px', borderRadius: 10, background: 'rgba(0,0,0,.02)', border: '1px solid #edecea' }}>
            <I n="edit" s={15} c="#999" />
            <span style={{ fontSize: 12.5, color: '#555' }}>Works in progress. Generate content from Workspace or create manually.</span>
          </div>
        )}

        {filtered.length === 0 && !loading && (
          <div style={{ textAlign: 'center', padding: '48px 20px' }}>
            <div style={{ width: 48, height: 48, borderRadius: 12, background: 'rgba(0,0,0,.03)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px' }}><I n="calendar" s={22} c="#ccc" /></div>
            <h4 style={{ fontSize: 14, fontWeight: 700, color: '#333', margin: '0 0 4px' }}>No posts here</h4>
            <p style={{ fontSize: 12.5, color: '#999', margin: '0 0 12px' }}>Create a new post to get started.</p>
            <button onClick={() => setShowCreate(true)} style={{ padding: '9px 18px', borderRadius: 8, border: 'none', background: '#C2185B', color: '#fff', fontWeight: 600, fontSize: 13, cursor: 'pointer', fontFamily: 'var(--wf)' }}>New Post</button>
          </div>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {filtered.map(post => {
            const isSel = selected.includes(post.id);
            return (
              <div key={post.id} style={{ borderRadius: 11, border: isSel ? '2px solid #C2185B' : '1px solid #edecea', background: '#fff', overflow: 'hidden', transition: 'border-color .12s' }}>
                <div style={{ display: 'flex', gap: 12, padding: '12px 14px', alignItems: 'center' }}>
                  {/* Checkbox */}
                  <button onClick={() => toggleSelect(post.id)} style={{ width: 20, height: 20, borderRadius: 5, border: isSel ? 'none' : '2px solid #ddd', background: isSel ? '#C2185B' : '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0, padding: 0 }}>
                    {isSel && <I n="check" s={12} c="#fff" />}
                  </button>
                  {/* Thumbnail */}
                  <div style={{ width: 44, height: 44, borderRadius: 9, background: platformGradient(post.platform), flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
                    {post.image_url
                      ? <img src={post.image_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      : <I n="image" s={16} c="rgba(255,255,255,.3)" />}
                  </div>
                  {/* Info */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginBottom: 3, flexWrap: 'wrap' }}>
                      <PlatformDot p={post.platform} />
                      <span style={{ fontSize: 12, fontWeight: 600, color: '#222' }}>{post.platform.charAt(0).toUpperCase() + post.platform.slice(1)}</span>
                      {post.pillar && <Bd>{post.pillar}</Bd>}
                      <Bd v={post.status === 'queue' ? 'default' : post.status === 'draft' ? 'muted' : post.status === 'scheduled' ? 'success' : 'muted'}>{statusLabels[post.status]}</Bd>
                      {post.auto && <Bd v="warning">Auto</Bd>}
                      {post.top && <Bd v="success">Top Performer</Bd>}
                    </div>
                    <p style={{ fontSize: 12, color: '#666', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{post.caption}</p>
                    {post.hashtags && post.hashtags.length > 0 && (
                      <div style={{ display: 'flex', gap: 4, marginTop: 3, flexWrap: 'wrap' }}>
                        {post.hashtags.slice(0, 4).map(h => <span key={h} style={{ fontSize: 10.5, color: '#C2185B', fontWeight: 500 }}>#{h}</span>)}
                      </div>
                    )}
                  </div>
                  {/* Meta */}
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 3, flexShrink: 0 }}>
                    {post.time && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                        <I n="clock" s={12} c={post.status === 'scheduled' ? '#4caf50' : '#bbb'} />
                        <span style={{ fontSize: 11.5, color: post.status === 'scheduled' ? '#2e7d32' : '#999', fontWeight: post.status === 'scheduled' ? 600 : 400 }}>{post.time}</span>
                      </div>
                    )}
                    {post.comp != null && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 5, width: 80 }}>
                        <div style={{ flex: 1, height: 3, borderRadius: 99, background: '#f0eeea', overflow: 'hidden' }}>
                          <div style={{ width: `${post.comp}%`, height: '100%', borderRadius: 99, background: post.comp > 70 ? '#4caf50' : post.comp > 40 ? '#FFC107' : '#C2185B' }} />
                        </div>
                        <span style={{ fontSize: 10, color: '#999' }}>{post.comp}%</span>
                      </div>
                    )}
                    {post.pub && <span style={{ fontSize: 11, color: '#bbb' }}>{post.pub}</span>}
                  </div>
                  {/* Actions */}
                  <div style={{ display: 'flex', gap: 4, flexShrink: 0 }}>
                    {post.status === 'queue' && (
                      <>
                        <button onClick={() => approvePost(post)} title="Approve" style={{ width: 32, height: 32, borderRadius: 7, border: 'none', background: '#111', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><I n="check" s={14} c="#E91E63" /></button>
                        <button onClick={() => rejectPost(post)} title="Reject" style={{ width: 32, height: 32, borderRadius: 7, border: '1.5px solid rgba(155,44,61,.15)', background: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><I n="x" s={14} c="#9b2c3d" /></button>
                      </>
                    )}
                    {post.status === 'draft' && (
                      <>
                        <button title="Ask Agent" style={{ width: 32, height: 32, borderRadius: 7, border: 'none', background: '#111', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><I n="sparkle" s={14} c="#E91E63" /></button>
                        <button title="Edit" style={{ width: 32, height: 32, borderRadius: 7, border: '1.5px solid #e5e3df', background: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><I n="edit" s={14} c="#888" /></button>
                      </>
                    )}
                    {post.status === 'scheduled' && (
                      <>
                        <button title="Preview" style={{ width: 32, height: 32, borderRadius: 7, border: '1.5px solid #e5e3df', background: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><I n="eye" s={14} c="#888" /></button>
                        <button title="Reschedule" style={{ width: 32, height: 32, borderRadius: 7, border: '1.5px solid #e5e3df', background: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><I n="clock" s={14} c="#888" /></button>
                      </>
                    )}
                    {post.status === 'published' && (
                      <>
                        <button title="Repurpose" style={{ width: 32, height: 32, borderRadius: 7, border: '1.5px solid #e5e3df', background: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><I n="copy" s={14} c="#888" /></button>
                        <button title="Share" style={{ width: 32, height: 32, borderRadius: 7, border: '1.5px solid #e5e3df', background: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><I n="share" s={14} c="#888" /></button>
                      </>
                    )}
                    <button onClick={() => deletePost(post)} title="Delete" style={{ width: 32, height: 32, borderRadius: 7, border: '1.5px solid rgba(155,44,61,.1)', background: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><I n="trash" s={14} c="#ccc" /></button>
                  </div>
                </div>
                {/* Published metrics row */}
                {post.status === 'published' && post.eng && (
                  <div style={{ display: 'flex', borderTop: '1px solid #f5f4f0', background: '#fafaf8' }}>
                    {([
                      { l: 'Engagements', v: post.eng },
                      { l: 'Reach', v: post.reach },
                      { l: 'Comments', v: post.comments },
                      { l: 'Shares', v: post.shares },
                      ...(post.saves ? [{ l: 'Saves', v: post.saves }] : []),
                    ] as { l: string; v: string | number | undefined }[]).map((m, idx, arr) => (
                      <div key={m.l} style={{ flex: 1, padding: '8px 12px', borderRight: idx < arr.length - 1 ? '1px solid #f0eeea' : 'none', textAlign: 'center' }}>
                        <div style={{ fontSize: 13, fontWeight: 700, color: '#222' }}>{m.v ?? '—'}</div>
                        <div style={{ fontSize: 9.5, color: '#999' }}>{m.l}</div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Bottom Jane bar */}
      <div style={{ padding: '10px 24px 14px', borderTop: '1px solid #edecea', background: '#fff', display: 'flex', gap: 8, alignItems: 'center' }}>
        <JaneAvatar size={26} />
        <input placeholder="Ask URI Agent about your schedule..." style={{ flex: 1, padding: '9px 13px', borderRadius: 9, border: '1.5px solid #e5e3df', fontSize: 13, fontFamily: 'var(--wf)', outline: 'none', background: '#fafal8' }}
          onKeyDown={e => { if (e.key === 'Enter') onJane(); }} />
        <button onClick={onJane} style={{ width: 32, height: 32, borderRadius: 7, border: 'none', background: '#C2185B', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <I n="send" s={13} c="#fff" />
        </button>
      </div>

      {/* Create post slide-over */}
      {showCreate && (
        <>
          <div onClick={() => { setShowCreate(false); setAiResult(null); }} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.3)', zIndex: 100 }} />
          <div style={{ position: 'fixed', top: 0, right: 0, bottom: 0, width: 460, background: '#fff', boxShadow: '-8px 0 40px rgba(0,0,0,.1)', zIndex: 101, display: 'flex', flexDirection: 'column', fontFamily: 'var(--wf)' }}>
            {/* Header */}
            <div style={{ padding: '18px 22px', borderBottom: '1px solid #edecea', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <h2 style={{ fontSize: 17, fontWeight: 800, color: '#111', margin: 0 }}>New Post</h2>
              <button onClick={() => { setShowCreate(false); setAiResult(null); }} style={{ width: 32, height: 32, borderRadius: 8, border: '1.5px solid #e5e3df', background: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <I n="x" s={16} c="#888" />
              </button>
            </div>
            {/* Mode toggle */}
            <div style={{ padding: '16px 22px 0' }}>
              <div style={{ display: 'flex', gap: 3, background: '#f5f4f0', borderRadius: 10, padding: 3 }}>
                <button onClick={() => setCreateMode('ai')} style={{ flex: 1, padding: 9, borderRadius: 8, background: createMode === 'ai' ? '#fff' : 'transparent', border: 'none', fontFamily: 'var(--wf)', fontSize: 13, fontWeight: createMode === 'ai' ? 700 : 500, color: createMode === 'ai' ? '#C2185B' : '#999', cursor: 'pointer', boxShadow: createMode === 'ai' ? '0 1px 4px rgba(0,0,0,.06)' : 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                  <I n="sparkle" s={14} c={createMode === 'ai' ? '#C2185B' : '#ccc'} /> Ask Agent
                </button>
                <button onClick={() => setCreateMode('manual')} style={{ flex: 1, padding: 9, borderRadius: 8, background: createMode === 'manual' ? '#fff' : 'transparent', border: 'none', fontFamily: 'var(--wf)', fontSize: 13, fontWeight: createMode === 'manual' ? 700 : 500, color: createMode === 'manual' ? '#111' : '#999', cursor: 'pointer', boxShadow: createMode === 'manual' ? '0 1px 4px rgba(0,0,0,.06)' : 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                  <I n="edit" s={14} c={createMode === 'manual' ? '#111' : '#ccc'} /> Write Manually
                </button>
              </div>
            </div>
            {/* Body */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '18px 22px' }}>
              {createMode === 'ai' ? (
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
                    <JaneAvatar size={28} />
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 700, color: '#C2185B' }}>URI Agent</div>
                      <div style={{ fontSize: 11.5, color: '#999' }}>Describe what you want and I'll draft it in your brand voice.</div>
                    </div>
                  </div>
                  <textarea value={aiPrompt} onChange={e => setAiPrompt(e.target.value)} placeholder="e.g. Create a post announcing our new product launch. Make it exciting with a sense of urgency..." rows={4} style={{ width: '100%', padding: '12px 14px', borderRadius: 10, border: '1.5px solid #e5e3df', fontSize: 13.5, fontFamily: 'var(--wf)', outline: 'none', resize: 'vertical', background: '#fafaf8', boxSizing: 'border-box', lineHeight: 1.6 } as React.CSSProperties} />
                  <button onClick={handleAiCreate} disabled={!aiPrompt.trim() || aiThinking} style={{ marginTop: 10, width: '100%', padding: 11, borderRadius: 9, border: 'none', background: aiPrompt.trim() && !aiThinking ? '#C2185B' : '#eee', color: aiPrompt.trim() && !aiThinking ? '#fff' : '#ccc', fontWeight: 700, fontSize: 13.5, cursor: aiPrompt.trim() && !aiThinking ? 'pointer' : 'default', fontFamily: 'var(--wf)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                    {aiThinking ? 'Generating...' : <><I n="sparkle" s={15} c="#fff" /> Generate Draft</>}
                  </button>
                  {aiResult && aiResult.length > 0 && (
                    <div style={{ marginTop: 18, borderRadius: 12, border: '1px solid rgba(194,24,91,.15)', background: 'rgba(194,24,91,.02)', padding: 16 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginBottom: 10 }}>
                        <JaneAvatar size={20} />
                        <span style={{ fontSize: 12.5, fontWeight: 700, color: '#C2185B' }}>Agent's drafts</span>
                        <Bd v="success">Ready</Bd>
                      </div>
                      {aiResult.map(d => (
                        <div key={d.id ?? d.draft_id} style={{ background: '#fff', borderRadius: 10, border: '1px solid #edecea', padding: 14, marginBottom: 10 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginBottom: 6 }}>
                            <PlatformDot p={d.platform} /><span style={{ fontSize: 12, fontWeight: 600 }}>{d.platform}</span>
                          </div>
                          <p style={{ fontSize: 13, color: '#333', lineHeight: 1.6, margin: '0 0 6px', whiteSpace: 'pre-line' }}>{d.content.slice(0, 160)}{d.content.length > 160 ? '…' : ''}</p>
                          <div style={{ display: 'flex', gap: 4 }}>{(d.hashtags ?? []).slice(0, 4).map(h => <span key={h} style={{ fontSize: 11, color: '#C2185B', fontWeight: 500 }}>#{h}</span>)}</div>
                        </div>
                      ))}
                      <button onClick={() => { setShowCreate(false); setAiResult(null); setAiPrompt(''); }} style={{ width: '100%', padding: 10, borderRadius: 8, border: 'none', background: '#111', color: '#E91E63', fontWeight: 700, fontSize: 13, cursor: 'pointer', fontFamily: 'var(--wf)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5 }}>
                        <I n="check" s={14} c="#E91E63" /> View in Queue
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <div>
                  <div style={{ marginBottom: 14 }}>
                    <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#444', marginBottom: 5 }}>Platform</label>
                    <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
                      {['Instagram', 'LinkedIn', 'X', 'Facebook'].map(plat => (
                        <button key={plat} onClick={() => setManualPlatform(plat)} style={{ padding: '6px 12px', borderRadius: 7, border: manualPlatform === plat ? '1.5px solid #222' : '1.5px solid #e5e3df', background: manualPlatform === plat ? '#222' : '#fff', color: manualPlatform === plat ? '#fff' : '#666', fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--wf)', display: 'flex', alignItems: 'center', gap: 4 }}>
                          <PlatformDot p={plat} s={6} />{plat}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div style={{ marginBottom: 14 }}>
                    <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#444', marginBottom: 5 }}>Content Pillar</label>
                    <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
                      {['Product', 'Education', 'BTS', 'Customer', 'Promotion', 'Culture', 'Industry', 'Trending'].map(p => (
                        <button key={p} onClick={() => setManualPillar(p)} style={{ padding: '5px 11px', borderRadius: 6, border: manualPillar === p ? '1.5px solid #C2185B' : '1.5px solid #e5e3df', background: manualPillar === p ? 'rgba(194,24,91,.06)' : '#fff', color: manualPillar === p ? '#C2185B' : '#666', fontSize: 11.5, fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--wf)' }}>{p}</button>
                      ))}
                    </div>
                  </div>
                  <div style={{ marginBottom: 14 }}>
                    <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#444', marginBottom: 5 }}>Caption</label>
                    <textarea value={manualCaption} onChange={e => setManualCaption(e.target.value)} placeholder="Write your caption here..." rows={5} style={{ width: '100%', padding: '12px 14px', borderRadius: 10, border: '1.5px solid #e5e3df', fontSize: 13.5, fontFamily: 'var(--wf)', outline: 'none', resize: 'vertical', background: '#fafaf8', boxSizing: 'border-box', lineHeight: 1.6 } as React.CSSProperties} />
                  </div>
                  <div style={{ marginBottom: 14 }}>
                    <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#444', marginBottom: 5 }}>Schedule (optional)</label>
                    <input type="datetime-local" value={manualDate} onChange={e => setManualDate(e.target.value)} style={{ width: '100%', padding: '10px 13px', borderRadius: 9, border: '1.5px solid #e5e3df', fontSize: 13, fontFamily: 'var(--wf)', outline: 'none', background: '#fafaf8', boxSizing: 'border-box' } as React.CSSProperties} />
                  </div>
                  <button onClick={addManualPost} disabled={!manualCaption.trim()} style={{ width: '100%', padding: 11, borderRadius: 9, border: 'none', background: manualCaption.trim() ? '#C2185B' : '#eee', color: manualCaption.trim() ? '#fff' : '#ccc', fontWeight: 700, fontSize: 13.5, cursor: manualCaption.trim() ? 'pointer' : 'default', fontFamily: 'var(--wf)' }}>
                    {manualDate ? 'Schedule Post' : 'Save as Draft'}
                  </button>
                  <div style={{ marginTop: 12, padding: '10px 14px', borderRadius: 9, background: 'rgba(194,24,91,.03)', border: '1px solid rgba(194,24,91,.1)', display: 'flex', alignItems: 'center', gap: 8 }}>
                    <JaneAvatar size={20} />
                    <span style={{ fontSize: 12, color: '#666' }}>Want the agent to improve this? Switch to <button onClick={() => setCreateMode('ai')} style={{ background: 'none', border: 'none', color: '#C2185B', fontWeight: 700, cursor: 'pointer', fontFamily: 'var(--wf)', fontSize: 12, padding: 0, textDecoration: 'underline' }}>Ask Agent</button> mode.</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

/* ── SubPage wrapper ─────────────────────────────────────────────────────── */
const SubPage = ({ title, icon, desc, children, onJane }: { title: string; icon: string; desc: string; children: ReactNode; onJane: () => void }) => (
  <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
    <div style={{ padding: '18px 24px 14px', borderBottom: '1px solid #edecea' }}>
      <h2 style={{ fontSize: 17, fontWeight: 800, color: '#111', display: 'flex', alignItems: 'center', gap: 8 }}><I n={icon} s={18} c="#C2185B" />{title}</h2>
      <p style={{ fontSize: 12.5, color: '#999', marginTop: 2 }}>{desc}</p>
    </div>
    <div style={{ flex: 1, overflowY: 'auto', padding: '18px 24px' }}>{children}</div>
    <div style={{ padding: '10px 24px 14px', borderTop: '1px solid #edecea', background: '#fff', display: 'flex', gap: 7, alignItems: 'center' }}>
      <JaneAvatar size={26} />
      <input placeholder={`Ask about ${title.toLowerCase()}...`} style={{ flex: 1, padding: '9px 13px', borderRadius: 9, border: '1.5px solid #e5e3df', fontSize: 13, fontFamily: 'var(--wf)', outline: 'none', background: '#fafaf8' }}
        onKeyDown={e => { if (e.key === 'Enter') onJane(); }} />
      <button onClick={onJane} style={{ width: 32, height: 32, borderRadius: 7, border: 'none', background: '#C2185B', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <I n="send" s={13} c="#fff" />
      </button>
    </div>
  </div>
);

/* ── Subpages ────────────────────────────────────────────────────────────── */
const MessagesPage = ({ onJane }: { onJane: () => void }) => (
  <SubPage title="Customer Messages" icon="inbox" desc="DMs, comments, and mentions across all platforms" onJane={onJane}>
    {([
      { u: '@coffeelover_ng', p: 'Instagram', t: 'When will the new content launch?', tm: '12m' },
      { u: '@jakethebaker', p: 'X', t: 'Your latest post was fire! 🔥', tm: '1h' },
      { u: 'Adaeze Okonkwo', p: 'LinkedIn', t: 'Would love to discuss a partnership.', tm: '3h' },
      { u: '@morning_fan', p: 'Instagram', t: 'Do you ship to Abuja?', tm: '5h' },
    ] as { u: string; p: string; t: string; tm: string }[]).map((m, i) => (
      <div key={i} style={{ display: 'flex', gap: 10, padding: '13px 15px', borderRadius: 11, border: '1px solid #edecea', background: '#fff', marginBottom: 7, cursor: 'pointer' }}>
        <div style={{ width: 34, height: 34, borderRadius: '50%', background: '#f5f4f0', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <span style={{ fontSize: 11, fontWeight: 700, color: '#888' }}>{(m.u[0] === '@' ? m.u[1] : m.u[0]).toUpperCase()}</span>
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

const PerformancePage = ({ onJane, brandName }: { onJane: () => void; brandName: string }) => (
  <SubPage title="Performance Memos" icon="chart" desc="Analysis of your brand performance" onJane={onJane}>
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10, marginBottom: 18 }}>
      {[{ l: 'Reach', v: '—' }, { l: 'Engagement', v: '—' }, { l: 'Followers', v: '—' }].map(s => (
        <div key={s.l} style={{ padding: 16, background: '#fff', borderRadius: 12, border: '1px solid #edecea' }}>
          <div style={{ fontSize: 11.5, color: '#999', marginBottom: 5 }}>{s.l}</div>
          <div style={{ fontSize: 22, fontWeight: 800, color: '#111' }}>{s.v}</div>
          <div style={{ fontSize: 11, color: '#bbb', marginTop: 3 }}>Connect social accounts</div>
        </div>
      ))}
    </div>
    <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #edecea', padding: 18 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 12 }}>
        <JaneAvatar size={22} />
        <span style={{ fontSize: 13, fontWeight: 700, color: '#C2185B' }}>URI Agent Memo</span>
      </div>
      <p style={{ fontSize: 13, color: '#555', lineHeight: 1.7, margin: 0 }}>Connect your social accounts in <strong>Settings → Social Accounts</strong> to start tracking real performance data for <strong>{brandName}</strong>. Once connected, I'll surface insights and recommendations here weekly.</p>
    </div>
  </SubPage>
);

const IntelPage = ({ onJane }: { onJane: () => void }) => (
  <SubPage title="Market Intel" icon="globe" desc="What people say about your brand across the web" onJane={onJane}>
    <div style={{ background: 'rgba(194,24,91,.03)', borderRadius: 12, border: '1px dashed rgba(194,24,91,.2)', padding: '32px 24px', textAlign: 'center' }}>
      <I n="globe" s={32} c="rgba(194,24,91,.3)" />
      <p style={{ fontSize: 13, color: '#888', marginTop: 12, lineHeight: 1.6 }}>Market intelligence will appear here once your brand profile is fully set up and social accounts are connected.</p>
    </div>
  </SubPage>
);

const PlaybookPage = ({ onJane, profile }: { onJane: () => void; profile: BrandProfileData | null }) => (
  <SubPage title="Brand Playbook" icon="book" desc="Everything URI Agent knows about your brand" onJane={onJane}>
    {[
      { t: 'Brand Identity', items: [profile?.brand_name, profile?.industry, profile?.product_description].filter(Boolean) as string[] },
      { t: 'Voice', items: [profile?.derived_voice].filter(Boolean) as string[] },
      { t: 'Content Pillars', items: (profile?.content_pillars ?? []) as string[] },
      { t: 'Guardrails', items: [profile?.guardrails?.avoid_topics ? `Avoid: ${profile.guardrails.avoid_topics}` : null, profile?.guardrails?.emoji_usage ? `Emoji: ${profile.guardrails.emoji_usage}` : null].filter(Boolean) as string[] },
    ].map(s => (
      <div key={s.t} style={{ background: '#fff', borderRadius: 12, border: '1px solid #edecea', padding: '16px 18px', marginBottom: 8 }}>
        <h3 style={{ fontSize: 13.5, fontWeight: 700, color: '#111', marginBottom: 8 }}>{s.t}</h3>
        {(s.items.length > 0 ? s.items : ['—']).map((item, i) => (
          <div key={i} style={{ fontSize: 12.5, color: '#555', padding: '4px 0', borderBottom: i < s.items.length - 1 ? '1px solid #f5f4f0' : 'none' }}>{item}</div>
        ))}
      </div>
    ))}
  </SubPage>
);

const SettingsPage = ({ onJane, brandName }: { onJane: () => void; brandName: string }) => (
  <SubPage title="Settings & Plan" icon="settings" desc="Manage your account, billing, and team" onJane={onJane}>
    <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #edecea', padding: 18, marginBottom: 10 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
        <div><div style={{ fontSize: 14, fontWeight: 700 }}>Free Plan</div><div style={{ fontSize: 12, color: '#999' }}>3 accounts · 30 posts/month</div></div>
        <Bd>Current</Bd>
      </div>
      <button style={{ width: '100%', padding: 11, borderRadius: 9, border: 'none', background: '#C2185B', color: '#fff', fontWeight: 700, fontSize: 13, cursor: 'pointer', fontFamily: 'var(--wf)' }}>Upgrade to Pro</button>
    </div>
    <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #edecea', padding: '16px 18px' }}>
      <h3 style={{ fontSize: 13.5, fontWeight: 700, marginBottom: 10 }}>Brand</h3>
      <div style={{ fontSize: 12.5, color: '#555', padding: '7px 0' }}>{brandName || 'No brand name set'}</div>
    </div>
  </SubPage>
);

/* ── Feed types ─────────────────────────────────────────────────────────── */
interface FeedMsg { id: string; type: 'jane' | 'jane-card' | 'user'; time: string; content: ReactNode; }

const STATUS_MSGS = [
  'Monitoring trends in your niche...',
  'Analysing audience engagement patterns...',
  'Optimising your posting schedule...',
  'Scanning for trending hashtags...',
  'Generating content ideas...',
];

const NAV = [
  { id: 'workspace', icon: 'home', label: 'Workspace' },
  { id: 'messages', icon: 'inbox', label: 'Customer Messages', count: 0 },
  { id: 'schedule', icon: 'calendar', label: 'Posting Schedule' },
  { id: 'performance', icon: 'chart', label: 'Performance' },
  { id: 'intel', icon: 'globe', label: 'Market Intel' },
  { id: 'playbook', icon: 'book', label: 'Brand Playbook' },
  { id: 'settings', icon: 'settings', label: 'Settings & Plan' },
];

/* ══════════════════════════════════════════════════════════════════════════
   MAIN DASHBOARD
═══════════════════════════════════════════════════════════════════════════ */
export default function WorkspaceDashboard() {
  const { logoutUser } = useAuth();
  const router = useRouter();

  const [ready, setReady] = useState(false);
  const [nav, setNav] = useState('workspace');
  const [sIdx, setSIdx] = useState(0);
  const [feed, setFeed] = useState<FeedMsg[]>([]);
  const [input, setInput] = useState('');
  const [typing, setTyping] = useState(false);
  const [profile, setProfile] = useState<BrandProfileData | null>(null);
  const feedEnd = useRef<HTMLDivElement>(null);

  useEffect(() => {
    BrandProfileService.get().then(res => {
      if (res.status && res.responseData) setProfile(res.responseData);
    });
  }, []);

  useEffect(() => {
    const name = profile?.brand_name ?? 'your brand';
    const now = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    setFeed([{
      id: 'w1', type: 'jane', time: now, content: (
        <div>
          <p style={{ margin: 0 }}>Good {new Date().getHours() < 12 ? 'morning' : 'afternoon'}! Here's your briefing for <strong>{name}</strong>:</p>
          <ul style={{ margin: '6px 0 0', paddingLeft: 18, fontSize: 13, color: '#555', lineHeight: 1.7 }}>
            <li>Check <strong>Posting Schedule</strong> for posts needing review</li>
            <li>Type a topic below and I'll draft content across your platforms</li>
            <li>Connect social accounts in <strong>Settings</strong> to unlock analytics</li>
          </ul>
        </div>
      ),
    }]);
    setTimeout(() => setReady(true), 120);
  }, [profile]);

  useEffect(() => {
    const iv = setInterval(() => setSIdx(i => (i + 1) % STATUS_MSGS.length), 5000);
    return () => clearInterval(iv);
  }, []);

  useEffect(() => { feedEnd.current?.scrollIntoView({ behavior: 'smooth' }); }, [feed, typing]);

  const sendMsg = async () => {
    if (!input.trim()) return;
    const txt = input.trim(); setInput('');
    const now = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    setFeed(f => [...f, { id: 'u' + Date.now(), type: 'user', time: now, content: txt }]);
    setTyping(true);

    try {
      const l = txt.toLowerCase();
      if (l.includes('generate') || l.includes('create') || l.includes('draft') || l.includes('post') || l.includes('write')) {
        const res = await SocialMediaAgentService.generateContent({ seed_content: txt, platforms: ['instagram', 'facebook'], include_images: false });
        setTyping(false);
        const drafts: ContentDraft[] = (res as unknown as { responseData: { drafts: ContentDraft[] } }).responseData?.drafts ?? [];
        if (res.status && drafts.length > 0) {
          setFeed(f => [...f, {
            id: 'j' + Date.now(), type: 'jane-card', time: now, content: (
              <div>
                <p style={{ margin: '0 0 10px', fontSize: 13, color: '#444' }}>Generated {drafts.length} draft{drafts.length > 1 ? 's' : ''}. Check <strong>Posting Schedule → Needs Review</strong>.</p>
                {drafts.slice(0, 2).map(d => (
                  <div key={d.id ?? d.draft_id} style={{ marginBottom: 8, padding: '12px 14px', borderRadius: 10, background: '#f9f9f9', border: '1px solid #edecea' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 5 }}>
                      <PlatformDot p={d.platform} />
                      <span style={{ fontSize: 12, fontWeight: 600, color: '#222' }}>{d.platform.charAt(0).toUpperCase() + d.platform.slice(1)}</span>
                    </div>
                    <p style={{ fontSize: 12.5, color: '#555', margin: 0, lineHeight: 1.5 }}>{d.content.slice(0, 120)}{d.content.length > 120 ? '…' : ''}</p>
                  </div>
                ))}
                <button onClick={() => setNav('schedule')} style={{ marginTop: 8, padding: '8px 14px', borderRadius: 8, border: 'none', background: '#111', color: '#E91E63', fontWeight: 600, fontSize: 12, cursor: 'pointer', fontFamily: 'var(--wf)' }}>Review in Posting Schedule →</button>
              </div>
            ),
          }]);
        } else {
          setFeed(f => [...f, { id: 'j' + Date.now(), type: 'jane', time: now, content: <p style={{ margin: 0 }}>I ran into an issue generating content. Please try again.</p> }]);
        }
        return;
      }

      await new Promise(r => setTimeout(r, 1200));
      setTyping(false);
      let reply: ReactNode = <p style={{ margin: 0 }}>Got it! To generate posts, just tell me what topic or campaign you want content for.</p>;
      if (l.includes('schedule') || l.includes('queue') || l.includes('pending')) {
        reply = <p style={{ margin: 0 }}>Check the <strong>Posting Schedule</strong> tab to see your full queue, drafts, and scheduled posts — all in one place with the weekly calendar.</p>;
      } else if (l.includes('performance') || l.includes('analytic')) {
        reply = <p style={{ margin: 0 }}>Connect your social accounts in <strong>Settings → Social Accounts</strong> and I'll pull real performance data for you.</p>;
      }
      setFeed(f => [...f, { id: 'j' + Date.now(), type: 'jane', time: now, content: reply }]);
    } catch {
      setTyping(false);
      setFeed(f => [...f, { id: 'j' + Date.now(), type: 'jane', time: now, content: <p style={{ margin: 0 }}>Something went wrong. Please try again.</p> }]);
    }
  };

  const goWorkspace = () => setNav('workspace');
  const brandName = profile?.brand_name ?? 'Your Brand';
  const brandInitials = brandName.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();

  const PAGES: Record<string, ReactNode> = {
    messages: <MessagesPage onJane={goWorkspace} />,
    schedule: <SchedulePage onJane={goWorkspace} />,
    performance: <PerformancePage onJane={goWorkspace} brandName={brandName} />,
    intel: <IntelPage onJane={goWorkspace} />,
    playbook: <PlaybookPage onJane={goWorkspace} profile={profile} />,
    settings: <SettingsPage onJane={goWorkspace} brandName={brandName} />,
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Urbanist:wght@400;500;600;700;800;900&display=swap');
        :root{--wf:'Urbanist',sans-serif}
        .workspace-root *{box-sizing:border-box;margin:0;padding:0}
        .workspace-root{font-family:var(--wf)}
        .workspace-root ::-webkit-scrollbar{width:5px}
        .workspace-root ::-webkit-scrollbar-thumb{background:#ddd;border-radius:99px}
        .workspace-root input:focus,.workspace-root textarea:focus,.workspace-root select:focus{outline:none}
        @keyframes wTypeBounce{0%,80%,100%{transform:translateY(0);opacity:.4}40%{transform:translateY(-5px);opacity:1}}
        @keyframes wStatusFade{0%{opacity:0;transform:translateY(3px)}12%{opacity:1;transform:translateY(0)}88%{opacity:1}100%{opacity:0;transform:translateY(-3px)}}
      `}</style>

      <div className="workspace-root" style={{ display: 'flex', height: '100vh', fontFamily: 'var(--wf)', background: '#f5f4f0', opacity: ready ? 1 : 0, transition: 'opacity .3s' }}>

        {/* SIDEBAR */}
        <div style={{ width: 224, background: '#1a0a12', display: 'flex', flexDirection: 'column', padding: '18px 0', flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 9, padding: '0 18px', marginBottom: 26 }}>
            <div style={{ width: 28, height: 28, borderRadius: 7, background: 'linear-gradient(135deg,#C2185B,#E91E63)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <span style={{ color: '#fff', fontWeight: 900, fontSize: 13 }}>U</span>
            </div>
            <span style={{ color: '#fff', fontWeight: 700, fontSize: 15 }}>URI <span style={{ fontWeight: 400, color: 'rgba(255,255,255,.4)' }}>Social</span></span>
          </div>
          <div style={{ margin: '0 12px 18px', padding: '12px 14px', borderRadius: 11, background: 'rgba(194,24,91,.08)', border: '1px solid rgba(194,24,91,.12)' }}>
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
            {NAV.map(n => (
              <button key={n.id} onClick={() => setNav(n.id)} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '9px 18px', background: nav === n.id ? 'rgba(194,24,91,.1)' : 'transparent', border: 'none', borderLeft: nav === n.id ? '2.5px solid #E91E63' : '2.5px solid transparent', fontFamily: 'var(--wf)', fontSize: 12.5, color: nav === n.id ? '#fce4ec' : 'rgba(255,255,255,.35)', fontWeight: nav === n.id ? 600 : 400, cursor: 'pointer', textAlign: 'left', transition: 'all .12s' }}>
                <I n={n.icon} s={15} c={nav === n.id ? '#E91E63' : 'rgba(255,255,255,.22)'} />
                <span style={{ flex: 1 }}>{n.label}</span>
                {n.count != null && n.count > 0 && <span style={{ background: '#E91E63', color: '#fff', fontSize: 9.5, fontWeight: 700, padding: '1px 5px', borderRadius: 4 }}>{n.count}</span>}
              </button>
            ))}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 18px 0', marginTop: 14, borderTop: '1px solid rgba(255,255,255,.05)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
              {profile?.logo_url
                ? <img src={profile.logo_url} alt="logo" style={{ width: 30, height: 30, borderRadius: '50%', objectFit: 'cover' }} />
                : <div style={{ width: 30, height: 30, borderRadius: '50%', background: 'linear-gradient(135deg,#880E4F,#C2185B)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><span style={{ color: '#fff', fontWeight: 700, fontSize: 11 }}>{brandInitials}</span></div>}
              <div>
                <div style={{ fontSize: 12, color: 'rgba(255,255,255,.75)', fontWeight: 600 }}>{brandName}</div>
                <div style={{ fontSize: 10, color: 'rgba(255,255,255,.2)' }}>Free Plan</div>
              </div>
            </div>
            <button onClick={logoutUser} title="Logout" style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4 }}>
              <I n="logout" s={14} c="rgba(255,255,255,.2)" />
            </button>
          </div>
        </div>

        {/* MAIN */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          {/* Topbar */}
          <div style={{ padding: '9px 24px', background: '#fff', borderBottom: '1px solid #edecea', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
              <div style={{ width: 7, height: 7, borderRadius: '50%', background: '#4caf50', boxShadow: '0 0 7px rgba(76,175,80,.4)' }} />
              <span style={{ fontSize: 12.5, color: '#666' }}>
                <strong style={{ color: '#C2185B' }}>URI Agent</strong> is active:{' '}
                <span key={sIdx} style={{ animation: 'wStatusFade 5s linear', display: 'inline-block' }}>{STATUS_MSGS[sIdx]}</span>
              </span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
              <button onClick={() => router.push('/settings/social-accounts')} style={{ width: 32, height: 32, borderRadius: 7, border: '1px solid #e5e3df', background: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <I n="settings" s={14} c="#666" />
              </button>
              <button onClick={() => router.push('/social-media/brand-setup')} style={{ width: 32, height: 32, borderRadius: 7, border: '1px solid #e5e3df', background: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }} title="Edit Brand Setup">
                <I n="edit" s={14} c="#666" />
              </button>
            </div>
          </div>

          {/* Page content */}
          <div style={{ flex: 1, overflow: 'hidden' }}>
            {nav === 'workspace' ? (
              <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
                <div style={{ flex: 1, overflowY: 'auto', padding: '18px 24px 8px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
                    <div style={{ flex: 1, height: 1, background: '#edecea' }} />
                    <span style={{ fontSize: 11, fontWeight: 600, color: '#ccc', letterSpacing: 0.5, textTransform: 'uppercase' }}>
                      {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
                    </span>
                    <div style={{ flex: 1, height: 1, background: '#edecea' }} />
                  </div>
                  {feed.map(msg => (
                    <div key={msg.id} style={{ marginBottom: 20 }}>
                      {msg.type === 'user' ? (
                        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
                          <div style={{ maxWidth: 500 }}>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 5, marginBottom: 4 }}>
                              <span style={{ fontSize: 10.5, color: '#bbb' }}>{msg.time}</span>
                              <span style={{ fontSize: 12, fontWeight: 700, color: '#555' }}>You</span>
                            </div>
                            <div style={{ padding: '11px 16px', borderRadius: '14px 3px 14px 14px', background: '#1a0a12', color: '#f3d0df', fontSize: 13, lineHeight: 1.6 }}>{msg.content}</div>
                          </div>
                          <UserAvatar size={30} initials={brandInitials} />
                        </div>
                      ) : (
                        <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                          <JaneAvatar size={30} />
                          <div style={{ maxWidth: 560, flex: 1 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginBottom: 4 }}>
                              <span style={{ fontSize: 12, fontWeight: 700, color: '#C2185B' }}>URI Agent</span>
                              <span style={{ fontSize: 10, color: '#C2185B', background: 'rgba(194,24,91,.07)', padding: '1px 6px', borderRadius: 3, fontWeight: 600 }}>AI</span>
                              <span style={{ fontSize: 10.5, color: '#bbb' }}>{msg.time}</span>
                            </div>
                            <div style={{ padding: '11px 16px', borderRadius: '3px 14px 14px 14px', background: '#fff', border: '1px solid #edecea', fontSize: 13, lineHeight: 1.6, color: '#333' }}>{msg.content}</div>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                  {typing && (
                    <div style={{ display: 'flex', gap: 10, marginBottom: 20 }}>
                      <JaneAvatar size={30} />
                      <div style={{ padding: '12px 18px', borderRadius: '3px 14px 14px 14px', background: '#fff', border: '1px solid #edecea' }}>
                        <div style={{ display: 'flex', gap: 4 }}>
                          {[0, 1, 2].map(i => <div key={i} style={{ width: 6, height: 6, borderRadius: '50%', background: '#C2185B', opacity: 0.4, animation: `wTypeBounce 1.2s ${i * 0.15}s infinite` }} />)}
                        </div>
                      </div>
                    </div>
                  )}
                  <div ref={feedEnd} />
                </div>
                <div style={{ padding: '10px 24px 16px', background: 'linear-gradient(0deg,#f5f4f0 80%,transparent)' }}>
                  <div style={{ display: 'flex', gap: 7, alignItems: 'flex-end', background: '#fff', borderRadius: 13, border: '1.5px solid #e5e3df', padding: '5px 5px 5px 16px', boxShadow: '0 3px 16px rgba(0,0,0,.05)' }}>
                    <input value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMsg(); } }}
                      placeholder="Tell URI Agent what to create — e.g. 'Write 3 posts about our new product launch'"
                      style={{ flex: 1, border: 'none', outline: 'none', fontSize: 13.5, fontFamily: 'var(--wf)', padding: '9px 0', background: 'transparent', color: '#222' }} />
                    <button onClick={sendMsg} style={{ width: 38, height: 38, borderRadius: 9, border: 'none', background: input.trim() ? '#C2185B' : '#eee', cursor: input.trim() ? 'pointer' : 'default', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'background .2s' }}>
                      <I n="send" s={15} c={input.trim() ? '#fff' : '#ccc'} />
                    </button>
                  </div>
                  <div style={{ textAlign: 'center', marginTop: 5 }}>
                    <span style={{ fontSize: 10, color: '#ccc' }}>URI Agent can make mistakes. Always review before publishing.</span>
                  </div>
                </div>
              </div>
            ) : PAGES[nav]}
          </div>
        </div>
      </div>
    </>
  );
}
