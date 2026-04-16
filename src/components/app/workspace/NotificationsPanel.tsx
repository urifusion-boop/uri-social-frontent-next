'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useNotifications } from '@/src/providers/NotificationProvider';
import { Notification, NotificationService } from '@/src/api/NotificationService';

/* ── Type metadata ─────────────────────────────────────────────── */

const TYPE_META: Record<string, { icon: string; color: string; bg: string; label: string }> = {
  signup: { icon: '👋', color: '#C2185B', bg: 'rgba(194,24,91,.08)', label: 'Welcome' },
  content_created: { icon: '✨', color: '#7C3AED', bg: 'rgba(124,58,237,.08)', label: 'Content Ready' },
  content_posted: { icon: '🚀', color: '#059669', bg: 'rgba(5,150,105,.08)', label: 'Published' },
  daily_suggestion: { icon: '💡', color: '#D97706', bg: 'rgba(217,119,6,.08)', label: 'Suggestion' },
  inactivity: { icon: '🔔', color: '#6366F1', bg: 'rgba(99,102,241,.08)', label: 'Reminder' },
  trial_start: { icon: '🎉', color: '#C2185B', bg: 'rgba(194,24,91,.08)', label: 'Trial Started' },
  trial_ending: { icon: '⏰', color: '#EA580C', bg: 'rgba(234,88,12,.08)', label: 'Trial Ending' },
  trial_expired: { icon: '⚠️', color: '#DC2626', bg: 'rgba(220,38,38,.08)', label: 'Trial Expired' },
};

const TYPE_FILTERS = [
  { value: '', label: 'All Notifications' },
  { value: 'content_created', label: 'Content Ready' },
  { value: 'content_posted', label: 'Published' },
  { value: 'daily_suggestion', label: 'Suggestions' },
  { value: 'inactivity', label: 'Reminders' },
  { value: 'trial_start', label: 'Trial' },
  { value: 'trial_ending', label: 'Trial Ending' },
  { value: 'trial_expired', label: 'Trial Expired' },
];

/* ── Helpers ────────────────────────────────────────────────────── */

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: days > 365 ? 'numeric' : undefined,
  });
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

/* ── Component ─────────────────────────────────────────────────── */

export default function NotificationsPanel({ onJane }: { onJane: () => void }) {
  const router = useRouter();
  const { unreadCount, refreshUnreadCount } = useNotifications();

  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('');
  const [tab, setTab] = useState<'all' | 'unread'>('all');

  const fetchPage = useCallback(async (p: number, typeFilter: string, reset: boolean = false) => {
    setLoading(true);
    try {
      const data = await NotificationService.getNotifications(p, 20, typeFilter || undefined);
      setNotifications((prev) => (reset ? data.notifications : [...prev, ...data.notifications]));
      setTotal(data.total);
      setPage(p);
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPage(1, filter, true);
  }, [filter, fetchPage]);

  const handleMarkAsRead = async (n: Notification) => {
    if (n.read) return;
    try {
      await NotificationService.markAsRead(n.notification_id);
      setNotifications((prev) =>
        prev.map((item) => (item.notification_id === n.notification_id ? { ...item, read: true } : item))
      );
      refreshUnreadCount();
    } catch {
      // silent
    }
  };

  const handleMarkAllRead = async () => {
    const unread = notifications.filter((n) => !n.read);
    if (unread.length === 0) return;
    await Promise.all(unread.map((n) => NotificationService.markAsRead(n.notification_id)));
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    refreshUnreadCount();
  };

  const handleClick = (n: Notification) => {
    handleMarkAsRead(n);
    if (n.type === 'content_created' || n.type === 'daily_suggestion') {
      onJane();
    } else if (n.type === 'content_posted') {
      router.push('/workspace?tab=schedule');
    } else if (n.type === 'trial_ending' || n.type === 'trial_expired') {
      router.push('/workspace?tab=billing');
    }
  };

  const displayed = tab === 'unread' ? notifications.filter((n) => !n.read) : notifications;
  const hasMore = notifications.length < total;

  return (
    <div style={{ height: '100%', overflow: 'auto', background: '#f5f4f0', padding: '28px 24px' }}>
      <div style={{ maxWidth: 720, margin: '0 auto' }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div
              style={{
                width: 40,
                height: 40,
                borderRadius: 10,
                background: 'rgba(194,24,91,.08)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <svg
                width={20}
                height={20}
                viewBox="0 0 24 24"
                fill="none"
                stroke="#C2185B"
                strokeWidth={2}
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9" />
                <path d="M13.73 21a2 2 0 01-3.46 0" />
              </svg>
            </div>
            <div>
              <h2 style={{ fontSize: 20, fontWeight: 800, color: '#111', margin: 0, fontFamily: 'var(--wf)' }}>
                Notifications
              </h2>
              <p style={{ fontSize: 13, color: '#9CA3AF', margin: 0, fontFamily: 'var(--wf)' }}>
                {unreadCount > 0
                  ? `${unreadCount} unread notification${unreadCount !== 1 ? 's' : ''}`
                  : 'You\u2019re all caught up'}
              </p>
            </div>
          </div>
          {unreadCount > 0 && (
            <button
              onClick={handleMarkAllRead}
              style={{
                fontSize: 12,
                fontWeight: 700,
                color: '#C2185B',
                background: 'rgba(194,24,91,.06)',
                border: 'none',
                padding: '7px 14px',
                borderRadius: 8,
                cursor: 'pointer',
                transition: 'background 0.15s',
                fontFamily: 'var(--wf)',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(194,24,91,.12)')}
              onMouseLeave={(e) => (e.currentTarget.style.background = 'rgba(194,24,91,.06)')}
            >
              Mark all as read
            </button>
          )}
        </div>

        {/* Tabs + Filter */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 12,
            marginBottom: 16,
            flexWrap: 'wrap',
          }}
        >
          <div style={{ display: 'flex', borderRadius: 8, overflow: 'hidden', border: '1px solid #e5e3df' }}>
            {(['all', 'unread'] as const).map((t) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                style={{
                  fontSize: 12,
                  fontWeight: 700,
                  padding: '8px 16px',
                  background: tab === t ? '#C2185B' : '#fff',
                  color: tab === t ? '#fff' : '#6b7280',
                  border: 'none',
                  cursor: 'pointer',
                  fontFamily: 'var(--wf)',
                  transition: 'all 0.15s',
                }}
              >
                {t === 'all' ? 'All' : `Unread (${unreadCount})`}
              </button>
            ))}
          </div>

          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            style={{
              fontSize: 12,
              fontWeight: 600,
              padding: '8px 12px',
              borderRadius: 8,
              border: '1px solid #e5e3df',
              background: '#fff',
              color: '#374151',
              cursor: 'pointer',
              fontFamily: 'var(--wf)',
              outline: 'none',
            }}
          >
            {TYPE_FILTERS.map((f) => (
              <option key={f.value} value={f.value}>
                {f.label}
              </option>
            ))}
          </select>
        </div>

        {/* Notification List */}
        <div
          style={{
            background: '#fff',
            borderRadius: 12,
            overflow: 'hidden',
            border: '1px solid #edecea',
            boxShadow: '0 1px 3px rgba(0,0,0,.04)',
          }}
        >
          {loading && notifications.length === 0 ? (
            <div style={{ padding: '56px 16px', textAlign: 'center' }}>
              <div
                style={{
                  width: 28,
                  height: 28,
                  border: '2.5px solid #e5e3df',
                  borderTopColor: '#C2185B',
                  borderRadius: '50%',
                  animation: 'notifSpin 0.6s linear infinite',
                  margin: '0 auto 10px',
                }}
              />
              <span style={{ fontSize: 13, color: '#9CA3AF', fontFamily: 'var(--wf)' }}>Loading notifications…</span>
            </div>
          ) : displayed.length === 0 ? (
            <div style={{ padding: '64px 16px', textAlign: 'center' }}>
              <div style={{ fontSize: 36, marginBottom: 10 }}>🔔</div>
              <p
                style={{ fontSize: 15, fontWeight: 700, color: '#374151', margin: '0 0 4px', fontFamily: 'var(--wf)' }}
              >
                {tab === 'unread' ? 'No unread notifications' : 'No notifications yet'}
              </p>
              <p style={{ fontSize: 13, color: '#9CA3AF', margin: 0, fontFamily: 'var(--wf)' }}>
                {tab === 'unread'
                  ? 'All your notifications have been read'
                  : 'You\u2019ll see notifications here when there\u2019s something new'}
              </p>
            </div>
          ) : (
            displayed.map((n, i) => {
              const meta = TYPE_META[n.type] || TYPE_META.signup;
              return (
                <button
                  key={n.notification_id}
                  onClick={() => handleClick(n)}
                  style={{
                    width: '100%',
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: 14,
                    padding: '14px 18px',
                    background: n.read ? '#fff' : 'rgba(194,24,91,.015)',
                    borderBottom: i < displayed.length - 1 ? '1px solid #f5f4f2' : 'none',
                    cursor: 'pointer',
                    borderLeft: n.read ? '3px solid transparent' : '3px solid #C2185B',
                    borderRight: 'none',
                    borderTop: 'none',
                    textAlign: 'left',
                    transition: 'background 0.12s',
                    fontFamily: 'var(--wf)',
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = '#fafaf9')}
                  onMouseLeave={(e) => (e.currentTarget.style.background = n.read ? '#fff' : 'rgba(194,24,91,.015)')}
                >
                  {/* Icon */}
                  <div
                    style={{
                      width: 40,
                      height: 40,
                      borderRadius: 10,
                      background: meta.bg,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: 18,
                      flexShrink: 0,
                    }}
                  >
                    {meta.icon}
                  </div>

                  {/* Content */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2 }}>
                      <span
                        style={{
                          fontSize: 10,
                          fontWeight: 800,
                          color: meta.color,
                          textTransform: 'uppercase',
                          letterSpacing: '0.3px',
                        }}
                      >
                        {meta.label}
                      </span>
                      {!n.read && (
                        <span
                          style={{ width: 6, height: 6, borderRadius: '50%', background: '#C2185B', flexShrink: 0 }}
                        />
                      )}
                      <span style={{ marginLeft: 'auto', fontSize: 11, color: '#9CA3AF', flexShrink: 0 }}>
                        {timeAgo(n.sent_at || n.created_at)}
                      </span>
                    </div>
                    <p
                      style={{
                        fontSize: 13,
                        fontWeight: n.read ? 400 : 600,
                        color: '#1f2937',
                        margin: 0,
                        lineHeight: 1.4,
                      }}
                    >
                      {n.subject}
                    </p>
                    <p style={{ fontSize: 11, color: '#9CA3AF', margin: '3px 0 0' }}>
                      {formatDate(n.sent_at || n.created_at)}
                    </p>
                  </div>

                  {/* Mark as read button */}
                  {!n.read && (
                    <div
                      title="Mark as read"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleMarkAsRead(n);
                      }}
                      style={{
                        width: 28,
                        height: 28,
                        borderRadius: 7,
                        border: '1px solid #e5e3df',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: 'pointer',
                        background: '#fff',
                        flexShrink: 0,
                        marginTop: 2,
                        opacity: 0.3,
                        transition: 'opacity 0.15s',
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.opacity = '1')}
                      onMouseLeave={(e) => (e.currentTarget.style.opacity = '0.3')}
                    >
                      <svg width={12} height={12} viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" strokeWidth={2.5}>
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                    </div>
                  )}
                </button>
              );
            })
          )}
        </div>

        {/* Load more */}
        {hasMore && !loading && tab === 'all' && (
          <div style={{ textAlign: 'center', marginTop: 20 }}>
            <button
              onClick={() => fetchPage(page + 1, filter)}
              style={{
                fontSize: 13,
                fontWeight: 700,
                color: '#C2185B',
                background: 'rgba(194,24,91,.06)',
                border: '1px solid rgba(194,24,91,.12)',
                padding: '10px 24px',
                borderRadius: 8,
                cursor: 'pointer',
                fontFamily: 'var(--wf)',
                transition: 'background 0.15s',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(194,24,91,.12)')}
              onMouseLeave={(e) => (e.currentTarget.style.background = 'rgba(194,24,91,.06)')}
            >
              Load more notifications
            </button>
          </div>
        )}

        {loading && notifications.length > 0 && (
          <div style={{ textAlign: 'center', marginTop: 16 }}>
            <div
              style={{
                width: 20,
                height: 20,
                border: '2px solid #e5e3df',
                borderTopColor: '#C2185B',
                borderRadius: '50%',
                animation: 'notifSpin 0.6s linear infinite',
                margin: '0 auto',
              }}
            />
          </div>
        )}

        {!loading && displayed.length > 0 && (
          <p style={{ textAlign: 'center', fontSize: 11, color: '#9CA3AF', marginTop: 14, fontFamily: 'var(--wf)' }}>
            Showing {displayed.length} of {total} notification{total !== 1 ? 's' : ''}
          </p>
        )}
      </div>

      <style>{`
        @keyframes notifSpin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
