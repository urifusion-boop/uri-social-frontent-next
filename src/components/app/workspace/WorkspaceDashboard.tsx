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
    zap: <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />,
    clock: <><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></>,
    heart: <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z" />,
    eye: <><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" /></>,
    paperclip: <path d="M21.44 11.05l-9.19 9.19a6 6 0 01-8.49-8.49l9.19-9.19a4 4 0 015.66 5.66l-9.2 9.19a2 2 0 01-2.83-2.83l8.49-8.48" />,
    arrowUp: <><line x1="12" y1="19" x2="12" y2="5" /><polyline points="5 12 12 5 19 12" /></>,
    message: <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />,
    refresh: <><polyline points="23 4 23 10 17 10" /><path d="M20.49 15a9 9 0 11-2.12-9.36L23 10" /></>,
    trash: <><polyline points="3 6 5 6 21 6" /><path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" /></>,
    copy: <><rect x="9" y="9" width="13" height="13" rx="2" /><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" /></>,
    plus: <><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></>,
    image: <><rect x="3" y="3" width="18" height="18" rx="2" /><circle cx="8.5" cy="8.5" r="1.5" /><polyline points="21 15 16 10 5 21" /></>,
    share: <><circle cx="18" cy="5" r="3" /><circle cx="6" cy="12" r="3" /><circle cx="18" cy="19" r="3" /><line x1="8.59" y1="13.51" x2="15.42" y2="17.49" /><line x1="15.41" y1="6.51" x2="8.59" y2="10.49" /></>,
    calendarPlus: <><rect x="3" y="4" width="18" height="17" rx="2" /><path d="M16 2v4M8 2v4M3 10h18M12 14v4M10 16h4" /></>,
    logout: <><path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4" /><polyline points="16 17 21 12 16 7" /><line x1="21" y1="12" x2="9" y2="12" /></>,
  };
  return (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.8" style={{ flexShrink: 0, display: 'block' }}>
      {p[n]}
    </svg>
  );
};

/* ── Small shared components ────────────────────────────────────────────── */
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
  return <div style={{ width: s, height: s, borderRadius: 2, background: c[p.toLowerCase()] ?? '#999', flexShrink: 0 }} />;
};

type BadgeVariant = 'default' | 'muted' | 'success' | 'danger' | 'warning';
const Bd = ({ children, v = 'default' }: { children: ReactNode; v?: BadgeVariant }) => {
  const m: Record<BadgeVariant, { bg: string; c: string; b: string }> = {
    default: { bg: 'rgba(194,24,91,.1)', c: '#AD1457', b: 'rgba(194,24,91,.18)' },
    muted: { bg: 'rgba(0,0,0,.04)', c: '#888', b: 'rgba(0,0,0,.06)' },
    success: { bg: 'rgba(76,175,80,.08)', c: '#2e7d32', b: 'rgba(76,175,80,.15)' },
    danger: { bg: 'rgba(155,44,61,.08)', c: '#9b2c3d', b: 'rgba(155,44,61,.15)' },
    warning: { bg: 'rgba(255,193,7,.1)', c: '#f57f17', b: 'rgba(255,193,7,.2)' },
  };
  const s = m[v];
  return <span style={{ background: s.bg, color: s.c, border: `1px solid ${s.b}`, padding: '2px 8px', borderRadius: 5, fontSize: 10.5, fontWeight: 600 }}>{children}</span>;
};

const Btn = ({ children, primary, small, onClick, icon, danger, disabled }: { children: ReactNode; primary?: boolean; small?: boolean; onClick?: () => void; icon?: string; danger?: boolean; disabled?: boolean }) => (
  <button onClick={onClick} disabled={disabled} style={{ padding: small ? '7px 13px' : '10px 20px', borderRadius: 8, border: primary ? 'none' : danger ? '1.5px solid rgba(155,44,61,.2)' : '1.5px solid #e5e3df', background: primary ? '#111' : '#fff', color: primary ? '#E91E63' : danger ? '#9b2c3d' : '#444', fontWeight: 600, fontSize: small ? 12 : 13, cursor: disabled ? 'not-allowed' : 'pointer', opacity: disabled ? 0.5 : 1, fontFamily: 'var(--wf)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5, transition: 'all .15s' }}>
    {icon && <I n={icon} s={small ? 13 : 14} c={primary ? '#E91E63' : danger ? '#9b2c3d' : '#888'} />}{children}
  </button>
);

const TabBar = ({ tabs, active, onChange }: { tabs: { id: string; label: string; count?: number }[]; active: string; onChange: (id: string) => void }) => (
  <div style={{ display: 'flex', gap: 2, background: '#f5f4f0', borderRadius: 10, padding: 3 }}>
    {tabs.map(t => (
      <button key={t.id} onClick={() => onChange(t.id)} style={{ padding: '8px 16px', borderRadius: 8, background: active === t.id ? '#fff' : 'transparent', border: 'none', fontFamily: 'var(--wf)', fontSize: 12.5, fontWeight: active === t.id ? 700 : 500, color: active === t.id ? '#111' : '#999', cursor: 'pointer', boxShadow: active === t.id ? '0 1px 4px rgba(0,0,0,.08)' : 'none', transition: 'all .15s', display: 'flex', alignItems: 'center', gap: 6 }}>
        {t.label}
        {t.count != null && <span style={{ background: active === t.id ? '#C2185B' : '#ddd', color: active === t.id ? '#fff' : '#888', fontSize: 10, fontWeight: 700, padding: '1px 6px', borderRadius: 99, minWidth: 18, textAlign: 'center' }}>{t.count}</span>}
      </button>
    ))}
  </div>
);

/* ── Platform gradient map ──────────────────────────────────────────────── */
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

/* ── Draft PostCard (schedule view) ────────────────────────────────────── */
const PostCard = ({ post, actions, metrics, children }: { post: ContentDraft; actions?: ReactNode; metrics?: { label: string; value: string | number }[]; children?: ReactNode }) => (
  <div style={{ borderRadius: 12, border: '1px solid #edecea', background: '#fff', overflow: 'hidden', transition: 'border-color .15s' }}
    onMouseEnter={e => (e.currentTarget.style.borderColor = 'rgba(194,24,91,.2)')}
    onMouseLeave={e => (e.currentTarget.style.borderColor = '#edecea')}>
    <div style={{ display: 'flex', gap: 12, padding: '14px 16px' }}>
      <div style={{ width: 52, height: 52, borderRadius: 10, background: platformGradient(post.platform), flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        {post.image_url
          ? <img src={post.image_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: 10 }} />
          : <I n="image" s={18} c="rgba(255,255,255,.4)" />}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginBottom: 4, flexWrap: 'wrap' }}>
          <PlatformDot p={post.platform} s={8} />
          <span style={{ fontSize: 12, fontWeight: 600, color: '#222' }}>{post.platform.charAt(0).toUpperCase() + post.platform.slice(1)}</span>
          <Bd v="muted">{post.status ?? post.approval_status ?? 'draft'}</Bd>
          {post.auto_generated && <Bd v="warning">Auto</Bd>}
        </div>
        <p style={{ fontSize: 12.5, color: '#666', margin: 0, lineHeight: 1.4, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' } as React.CSSProperties}>{post.content}</p>
        {post.hashtags && post.hashtags.length > 0 && (
          <div style={{ display: 'flex', gap: 4, marginTop: 5, flexWrap: 'wrap' }}>
            {post.hashtags.map(h => <span key={h} style={{ fontSize: 11, color: '#C2185B', fontWeight: 500 }}>#{h}</span>)}
          </div>
        )}
        {children}
      </div>
    </div>
    {metrics && (
      <div style={{ display: 'flex', borderTop: '1px solid #f5f4f0' }}>
        {metrics.map((m, i) => (
          <div key={i} style={{ flex: 1, padding: '10px 16px', borderRight: i < metrics.length - 1 ? '1px solid #f5f4f0' : 'none', textAlign: 'center' }}>
            <div style={{ fontSize: 15, fontWeight: 800, color: '#111' }}>{m.value}</div>
            <div style={{ fontSize: 10.5, color: '#999' }}>{m.label}</div>
          </div>
        ))}
      </div>
    )}
    {actions && <div style={{ display: 'flex', gap: 6, padding: '10px 16px', borderTop: '1px solid #f5f4f0' }}>{actions}</div>}
  </div>
);

/* ── QueueItem (extracted to fix hooks-in-map) ──────────────────────────── */
const QueueItem = ({ post, onRefresh }: { post: ContentDraft; onRefresh: () => void }) => {
  const [status, setStatus] = useState<'approved' | 'rejected' | null>(null);
  const [loading, setLoading] = useState(false);

  const draftId = post.draft_id ?? post.id ?? '';

  const handleApprove = async () => {
    setLoading(true);
    try {
      const res = await SocialMediaAgentService.approveContent({ draft_ids: [draftId], schedule_option: 'save_draft' });
      if (res.status) { setStatus('approved'); onRefresh(); }
    } finally { setLoading(false); }
  };

  const handleReject = async () => {
    setLoading(true);
    try {
      const res = await SocialMediaAgentService.denyContent({ draft_ids: [draftId], denial_reason: 'Rejected from queue' });
      if (res.status) { setStatus('rejected'); onRefresh(); }
    } finally { setLoading(false); }
  };

  if (status) return (
    <div style={{ padding: '12px 14px', borderRadius: 10, background: status === 'approved' ? 'rgba(76,175,80,.05)' : 'rgba(155,44,61,.05)', border: `1px solid ${status === 'approved' ? 'rgba(76,175,80,.15)' : 'rgba(155,44,61,.15)'}`, display: 'flex', alignItems: 'center', gap: 8 }}>
      <I n={status === 'approved' ? 'check' : 'x'} s={14} c={status === 'approved' ? '#4caf50' : '#9b2c3d'} />
      <span style={{ fontSize: 12.5, fontWeight: 600, color: status === 'approved' ? '#2e7d32' : '#9b2c3d' }}>
        {status === 'approved' ? 'Approved and saved as draft.' : 'Rejected.'}
      </span>
    </div>
  );

  return (
    <PostCard post={post} actions={
      <>
        <Btn primary small onClick={handleApprove} icon="check" disabled={loading}>Approve</Btn>
        <Btn small icon="edit">Edit</Btn>
        <Btn small danger onClick={handleReject} icon="x" disabled={loading}>Reject</Btn>
      </>
    }>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 6 }}>
        <I n="clock" s={12} c="#bbb" />
        <span style={{ fontSize: 11.5, color: '#999' }}>{post.created_at ? new Date(post.created_at).toLocaleString() : 'Pending'}</span>
      </div>
    </PostCard>
  );
};

/* ── Posting Schedule page ──────────────────────────────────────────────── */
const SchedulePage = ({ onJane }: { onJane: () => void }) => {
  const [tab, setTab] = useState('queue');
  const [filter, setFilter] = useState('all');
  const [drafts, setDrafts] = useState<ContentDraft[]>([]);
  const [scheduled, setScheduled] = useState<ContentDraft[]>([]);
  const [loading, setLoading] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const [calRes, schRes] = await Promise.all([
        SocialMediaAgentService.getContentCalendar(),
        SocialMediaAgentService.getScheduled(),
      ]);
      if (calRes.status) setDrafts(calRes.responseData?.drafts ?? []);
      if (schRes.status) setScheduled(schRes.responseData?.scheduled_drafts ?? []);
    } finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const byStatus = (statuses: string[]) =>
    drafts.filter(d => {
      const s = d.status ?? d.approval_status ?? 'draft';
      const ok = statuses.some(st => s.includes(st));
      if (!ok) return false;
      if (filter !== 'all') return d.platform.toLowerCase() === filter;
      return true;
    });

  const filteredScheduled = filter === 'all' ? scheduled : scheduled.filter(d => d.platform.toLowerCase() === filter);

  const queue = byStatus(['pending', 'pending_approval']);
  const draftItems = byStatus(['draft']);
  const published = byStatus(['published']);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div style={{ padding: '18px 24px 0' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
          <div>
            <h2 style={{ fontSize: 18, fontWeight: 800, color: '#111', margin: 0 }}>Posting Schedule</h2>
            <p style={{ fontSize: 12.5, color: '#999', margin: '2px 0 0' }}>All your content — past, present, and future</p>
          </div>
          <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
            <select value={filter} onChange={e => setFilter(e.target.value)} style={{ padding: '7px 12px', borderRadius: 7, border: '1.5px solid #e5e3df', fontSize: 12, fontFamily: 'var(--wf)', outline: 'none', background: '#fff', color: '#555', cursor: 'pointer' }}>
              <option value="all">All Platforms</option>
              <option value="instagram">Instagram</option>
              <option value="linkedin">LinkedIn</option>
              <option value="twitter">X / Twitter</option>
              <option value="facebook">Facebook</option>
            </select>
            <button onClick={load} style={{ width: 32, height: 32, borderRadius: 7, border: '1.5px solid #e5e3df', background: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <I n="refresh" s={13} c={loading ? '#C2185B' : '#999'} />
            </button>
          </div>
        </div>
        <TabBar tabs={[
          { id: 'queue', label: 'Queue', count: queue.length },
          { id: 'drafts', label: 'Drafts', count: draftItems.length },
          { id: 'scheduled', label: 'Scheduled', count: filteredScheduled.length },
          { id: 'published', label: 'Published', count: published.length },
        ]} active={tab} onChange={t => setTab(t)} />
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: '16px 24px 20px' }}>
        {tab === 'queue' && (
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14, padding: '10px 14px', borderRadius: 10, background: 'rgba(194,24,91,.04)', border: '1px solid rgba(194,24,91,.1)' }}>
              <JaneAvatar size={24} />
              <span style={{ fontSize: 12.5, color: '#555' }}><strong style={{ color: '#C2185B' }}>URI Agent</strong> drafted {queue.length} {queue.length === 1 ? 'post' : 'posts'} waiting for your approval.</span>
            </div>
            {queue.length === 0 && !loading && <div style={{ textAlign: 'center', color: '#bbb', fontSize: 13, paddingTop: 40 }}>No posts pending approval. Generate content from the Workspace tab.</div>}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {queue.map(post => <QueueItem key={post.id ?? post.draft_id} post={post} onRefresh={load} />)}
            </div>
          </div>
        )}

        {tab === 'drafts' && (
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14, padding: '10px 14px', borderRadius: 10, background: 'rgba(0,0,0,.02)', border: '1px solid #edecea' }}>
              <I n="edit" s={16} c="#999" />
              <span style={{ fontSize: 12.5, color: '#555' }}>Saved drafts — not yet approved for publishing.</span>
            </div>
            {draftItems.length === 0 && !loading && <div style={{ textAlign: 'center', color: '#bbb', fontSize: 13, paddingTop: 40 }}>No drafts yet.</div>}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {draftItems.map(post => (
                <PostCard key={post.id ?? post.draft_id} post={post} actions={
                  <><Btn small icon="edit">Edit</Btn><Btn small icon="calendarPlus">Schedule</Btn></>
                } />
              ))}
            </div>
          </div>
        )}

        {tab === 'scheduled' && (
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14, padding: '10px 14px', borderRadius: 10, background: 'rgba(76,175,80,.04)', border: '1px solid rgba(76,175,80,.12)' }}>
              <I n="check" s={16} c="#4caf50" />
              <span style={{ fontSize: 12.5, color: '#555' }}>{filteredScheduled.length} posts approved and scheduled.</span>
            </div>
            {filteredScheduled.length === 0 && !loading && <div style={{ textAlign: 'center', color: '#bbb', fontSize: 13, paddingTop: 40 }}>No scheduled posts yet.</div>}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {filteredScheduled.map(post => (
                <PostCard key={post.id ?? post.draft_id} post={post} actions={
                  <><Btn small icon="eye">Preview</Btn><Btn small icon="clock">Reschedule</Btn><Btn small icon="edit">Edit</Btn></>
                }>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 6 }}>
                    <I n="clock" s={12} c="#4caf50" />
                    <span style={{ fontSize: 11.5, color: '#2e7d32', fontWeight: 600 }}>
                      {post.scheduled_datetime ? new Date(post.scheduled_datetime).toLocaleString() : 'Scheduled'}
                    </span>
                  </div>
                </PostCard>
              ))}
            </div>
          </div>
        )}

        {tab === 'published' && (
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14, padding: '10px 14px', borderRadius: 10, background: 'rgba(0,0,0,.02)', border: '1px solid #edecea' }}>
              <I n="chart" s={16} c="#999" />
              <span style={{ fontSize: 12.5, color: '#555' }}>Published posts history.</span>
            </div>
            {published.length === 0 && !loading && <div style={{ textAlign: 'center', color: '#bbb', fontSize: 13, paddingTop: 40 }}>No published posts yet.</div>}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {published.map(post => (
                <PostCard key={post.id ?? post.draft_id} post={post} actions={
                  <><Btn small icon="copy">Repurpose</Btn><Btn small icon="share">Share Report</Btn></>
                }>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 5 }}>
                    <I n="check" s={12} c="#4caf50" />
                    <span style={{ fontSize: 11.5, color: '#999' }}>{post.created_at ? new Date(post.created_at).toLocaleDateString() : 'Published'}</span>
                  </div>
                </PostCard>
              ))}
            </div>
          </div>
        )}
      </div>

      <div style={{ padding: '10px 24px 14px', borderTop: '1px solid #edecea', background: '#fff', display: 'flex', gap: 7, alignItems: 'center' }}>
        <JaneAvatar size={26} />
        <input placeholder="Ask about your schedule..." style={{ flex: 1, padding: '9px 13px', borderRadius: 9, border: '1.5px solid #e5e3df', fontSize: 13, fontFamily: 'var(--wf)', outline: 'none', background: '#fafaf8' }}
          onKeyDown={e => { if (e.key === 'Enter') onJane(); }} />
        <button onClick={onJane} style={{ width: 32, height: 32, borderRadius: 7, border: 'none', background: '#C2185B', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <I n="send" s={13} c="#fff" />
        </button>
      </div>
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

/* ── Placeholder subpages ────────────────────────────────────────────────── */
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
          <span style={{ fontSize: 11, fontWeight: 700, color: '#888' }}>{m.u[0] === '@' ? m.u[1].toUpperCase() : m.u[0].toUpperCase()}</span>
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
      {[{ l: 'Reach', v: '—', c: 'connect social accounts' }, { l: 'Engagement', v: '—', c: 'connect social accounts' }, { l: 'Followers', v: '—', c: 'connect social accounts' }].map(s => (
        <div key={s.l} style={{ padding: 16, background: '#fff', borderRadius: 12, border: '1px solid #edecea' }}>
          <div style={{ fontSize: 11.5, color: '#999', marginBottom: 5 }}>{s.l}</div>
          <div style={{ fontSize: 22, fontWeight: 800, color: '#111' }}>{s.v}</div>
          <div style={{ fontSize: 11, color: '#bbb', marginTop: 3 }}>{s.c}</div>
        </div>
      ))}
    </div>
    <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #edecea', padding: 18 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 12 }}>
        <JaneAvatar size={22} />
        <span style={{ fontSize: 13, fontWeight: 700, color: '#C2185B' }}>URI Agent Memo</span>
      </div>
      <p style={{ fontSize: 13, color: '#555', lineHeight: 1.7, margin: 0 }}>Connect your social accounts in Settings → Social Accounts to start tracking real performance data for <strong>{brandName || 'your brand'}</strong>. Once connected, I'll surface insights and recommendations here weekly.</p>
    </div>
  </SubPage>
);

const IntelPage = ({ onJane }: { onJane: () => void }) => (
  <SubPage title="Market Intel" icon="globe" desc="What people say about your brand across the web" onJane={onJane}>
    <div style={{ background: 'rgba(194,24,91,.03)', borderRadius: 12, border: '1px dashed rgba(194,24,91,.2)', padding: '32px 24px', textAlign: 'center' }}>
      <I n="globe" s={32} c="rgba(194,24,91,.3)" />
      <p style={{ fontSize: 13, color: '#888', marginTop: 12, lineHeight: 1.6 }}>Market intelligence will appear here once your brand profile is fully set up and social accounts are connected. URI Agent will monitor mentions, competitor activity, and trending topics in your niche.</p>
    </div>
  </SubPage>
);

const PlaybookPage = ({ onJane, profile }: { onJane: () => void; profile: BrandProfileData | null }) => (
  <SubPage title="Brand Playbook" icon="book" desc="Everything URI Agent knows about your brand" onJane={onJane}>
    {[
      { t: 'Brand Identity', items: [profile?.brand_name ?? '—', profile?.industry ?? '—', profile?.product_description ?? '—'].filter(Boolean) },
      { t: 'Voice', items: [profile?.derived_voice ?? '—'] },
      { t: 'Content Pillars', items: profile?.content_pillars ?? ['—'] },
      { t: 'Guardrails', items: [profile?.guardrails?.avoid_topics ? `Avoid: ${profile.guardrails.avoid_topics}` : null, profile?.guardrails?.banned_words ? `Banned: ${profile.guardrails.banned_words}` : null, profile?.guardrails?.emoji_usage ? `Emoji: ${profile.guardrails.emoji_usage}` : null].filter(Boolean) as string[] },
    ].map(s => (
      <div key={s.t} style={{ background: '#fff', borderRadius: 12, border: '1px solid #edecea', padding: '16px 18px', marginBottom: 8 }}>
        <h3 style={{ fontSize: 13.5, fontWeight: 700, color: '#111', marginBottom: 8 }}>{s.t}</h3>
        {s.items.map((item, i) => (
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
      <div style={{ fontSize: 12.5, color: '#555', padding: '7px 0', borderBottom: '1px solid #f5f4f0' }}>{brandName || 'No brand name set'}</div>
    </div>
  </SubPage>
);

/* ── Feed message types ─────────────────────────────────────────────────── */
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

  /* Load brand profile */
  useEffect(() => {
    BrandProfileService.get().then(res => {
      if (res.status && res.responseData) setProfile(res.responseData);
    });
  }, []);

  /* Build initial feed once profile loads */
  useEffect(() => {
    const name = profile?.brand_name ?? 'your brand';
    const now = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    setFeed([
      {
        id: 'w1', type: 'jane', time: now, content: (
          <div>
            <p style={{ margin: 0 }}>Good {new Date().getHours() < 12 ? 'morning' : 'afternoon'}! Here's your briefing for <strong>{name}</strong>:</p>
            <ul style={{ margin: '6px 0 0', paddingLeft: 18, fontSize: 13, color: '#555', lineHeight: 1.7 }}>
              <li>Check the <strong>Posting Schedule</strong> for pending approvals</li>
              <li>Type a topic below and I'll draft content for you</li>
              <li>Connect social accounts in <strong>Settings</strong> for analytics</li>
            </ul>
          </div>
        ),
      },
    ]);
    setTimeout(() => setReady(true), 120);
  }, [profile]);

  useEffect(() => {
    const iv = setInterval(() => setSIdx(i => (i + 1) % STATUS_MSGS.length), 5000);
    return () => clearInterval(iv);
  }, []);

  useEffect(() => { feedEnd.current?.scrollIntoView({ behavior: 'smooth' }); }, [feed, typing]);

  /* Chat send */
  const sendMsg = async () => {
    if (!input.trim()) return;
    const txt = input.trim();
    setInput('');
    const now = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    setFeed(f => [...f, { id: 'u' + Date.now(), type: 'user', time: now, content: txt }]);
    setTyping(true);

    try {
      const l = txt.toLowerCase();

      if (l.includes('generate') || l.includes('create') || l.includes('draft') || l.includes('post') || l.includes('write')) {
        const res = await SocialMediaAgentService.generateContent({
          seed_content: txt,
          platforms: ['instagram', 'facebook'],
          include_images: false,
        });

        setTyping(false);
        const drafts: ContentDraft[] = (res as unknown as { responseData: { drafts: ContentDraft[] } }).responseData?.drafts ?? [];

        if (res.status && drafts.length > 0) {
          setFeed(f => [...f, {
            id: 'j' + Date.now(), type: 'jane-card', time: now, content: (
              <div>
                <p style={{ margin: '0 0 10px', fontSize: 13, color: '#444' }}>Done! Generated {drafts.length} draft{drafts.length > 1 ? 's' : ''}. Review them in <strong>Posting Schedule → Queue</strong>.</p>
                {drafts.slice(0, 2).map(d => (
                  <div key={d.id ?? d.draft_id} style={{ marginBottom: 8, padding: '12px 14px', borderRadius: 10, background: '#f9f9f9', border: '1px solid #edecea' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
                      <PlatformDot p={d.platform} />
                      <span style={{ fontSize: 12, fontWeight: 600, color: '#222' }}>{d.platform.charAt(0).toUpperCase() + d.platform.slice(1)}</span>
                    </div>
                    <p style={{ fontSize: 12.5, color: '#555', margin: 0, lineHeight: 1.5 }}>{d.content.slice(0, 120)}{d.content.length > 120 ? '…' : ''}</p>
                  </div>
                ))}
              </div>
            ),
          }]);
        } else {
          setFeed(f => [...f, { id: 'j' + Date.now(), type: 'jane', time: now, content: <p style={{ margin: 0 }}>I ran into an issue generating content. Please try again.</p> }]);
        }
        return;
      }

      // Generic responses for non-generate queries
      await new Promise(r => setTimeout(r, 1200));
      setTyping(false);

      let reply: ReactNode = <p style={{ margin: 0 }}>Got it! Let me know if you'd like me to generate specific content or check your schedule.</p>;
      if (l.includes('schedule') || l.includes('queue') || l.includes('pending')) {
        reply = <p style={{ margin: 0 }}>Check the <strong>Posting Schedule</strong> tab to see everything in your queue, drafts, and scheduled posts.</p>;
      } else if (l.includes('performance') || l.includes('analytic') || l.includes('engagement')) {
        reply = <p style={{ margin: 0 }}>Connect your social accounts in <strong>Settings → Social Accounts</strong> and I'll start pulling real performance data.</p>;
      } else if (l.includes('brand') || l.includes('profile') || l.includes('playbook')) {
        reply = <p style={{ margin: 0 }}>Your brand playbook is in the <strong>Brand Playbook</strong> tab. You can update your brand setup anytime from <strong>Settings</strong>.</p>;
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
          {/* Logo */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 9, padding: '0 18px', marginBottom: 26 }}>
            <div style={{ width: 28, height: 28, borderRadius: 7, background: 'linear-gradient(135deg,#C2185B,#E91E63)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <span style={{ color: '#fff', fontWeight: 900, fontSize: 13 }}>U</span>
            </div>
            <span style={{ color: '#fff', fontWeight: 700, fontSize: 15 }}>URI <span style={{ fontWeight: 400, color: 'rgba(255,255,255,.4)' }}>Social</span></span>
          </div>

          {/* Agent card */}
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

          {/* Nav items */}
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 1 }}>
            {NAV.map(n => (
              <button key={n.id} onClick={() => setNav(n.id)} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '9px 18px', background: nav === n.id ? 'rgba(194,24,91,.1)' : 'transparent', border: 'none', borderLeft: nav === n.id ? '2.5px solid #E91E63' : '2.5px solid transparent', fontFamily: 'var(--wf)', fontSize: 12.5, color: nav === n.id ? '#fce4ec' : 'rgba(255,255,255,.35)', fontWeight: nav === n.id ? 600 : 400, cursor: 'pointer', textAlign: 'left', transition: 'all .12s' }}>
                <I n={n.icon} s={15} c={nav === n.id ? '#E91E63' : 'rgba(255,255,255,.22)'} />
                <span style={{ flex: 1 }}>{n.label}</span>
                {n.count != null && n.count > 0 && <span style={{ background: '#E91E63', color: '#fff', fontSize: 9.5, fontWeight: 700, padding: '1px 5px', borderRadius: 4 }}>{n.count}</span>}
              </button>
            ))}
          </div>

          {/* Brand footer */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 18px 0', marginTop: 14, borderTop: '1px solid rgba(255,255,255,.05)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
              {profile?.logo_url
                ? <img src={profile.logo_url} alt="logo" style={{ width: 30, height: 30, borderRadius: '50%', objectFit: 'cover' }} />
                : <div style={{ width: 30, height: 30, borderRadius: '50%', background: 'linear-gradient(135deg,#880E4F,#C2185B)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><span style={{ color: '#fff', fontWeight: 700, fontSize: 11 }}>{brandInitials}</span></div>
              }
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

        {/* MAIN AREA */}
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
              <button onClick={() => router.push('/social-media/brand-setup')} style={{ width: 32, height: 32, borderRadius: 7, border: '1px solid #e5e3df', background: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }} title="Brand Setup">
                <I n="edit" s={14} c="#666" />
              </button>
            </div>
          </div>

          {/* Page content */}
          <div style={{ flex: 1, overflow: 'hidden' }}>
            {nav === 'workspace' ? (
              <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
                {/* Feed */}
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

                {/* Input bar */}
                <div style={{ padding: '10px 24px 16px', background: 'linear-gradient(0deg,#f5f4f0 80%,transparent)' }}>
                  <div style={{ display: 'flex', gap: 7, alignItems: 'flex-end', background: '#fff', borderRadius: 13, border: '1.5px solid #e5e3df', padding: '5px 5px 5px 16px', boxShadow: '0 3px 16px rgba(0,0,0,.05)' }}>
                    <input
                      value={input}
                      onChange={e => setInput(e.target.value)}
                      onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMsg(); } }}
                      placeholder="Tell URI Agent what to create — e.g. 'Write 3 posts about our new product launch'"
                      style={{ flex: 1, border: 'none', outline: 'none', fontSize: 13.5, fontFamily: 'var(--wf)', padding: '9px 0', background: 'transparent', color: '#222' }}
                    />
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
