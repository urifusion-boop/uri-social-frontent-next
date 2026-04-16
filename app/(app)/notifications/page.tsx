'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import DashboardLayout from '@/src/components/app/atoms/DashboardLayout';
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
  { value: '', label: 'All' },
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

/* ── Page Component ────────────────────────────────────────────── */

export default function NotificationsPage() {
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
      router.push('/workspace?tab=content');
    } else if (n.type === 'content_posted') {
      router.push('/workspace?tab=calendar');
    } else if (n.type === 'trial_ending' || n.type === 'trial_expired') {
      router.push('/workspace?tab=billing');
    }
  };

  const displayed = tab === 'unread' ? notifications.filter((n) => !n.read) : notifications;
  const hasMore = notifications.length < total;

  return (
    <DashboardLayout>
      <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto">
          {/* Header */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center gap-3">
                <div
                  className="flex items-center justify-center"
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: 10,
                    background: 'rgba(194,24,91,.08)',
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
                  <h1 className="text-2xl font-bold text-gray-900">Notifications</h1>
                  <p className="text-sm text-gray-500">
                    {unreadCount > 0
                      ? `${unreadCount} unread notification${unreadCount !== 1 ? 's' : ''}`
                      : 'You\u2019re all caught up'}
                  </p>
                </div>
              </div>
              {unreadCount > 0 && (
                <button
                  onClick={handleMarkAllRead}
                  className="text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors"
                  style={{ color: '#C2185B', background: 'rgba(194,24,91,.06)' }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(194,24,91,.12)')}
                  onMouseLeave={(e) => (e.currentTarget.style.background = 'rgba(194,24,91,.06)')}
                >
                  Mark all as read
                </button>
              )}
            </div>
          </div>

          {/* Tabs + Filter */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-5">
            {/* Tabs */}
            <div className="flex rounded-lg overflow-hidden" style={{ border: '1px solid #e5e3df' }}>
              {(['all', 'unread'] as const).map((t) => (
                <button
                  key={t}
                  onClick={() => setTab(t)}
                  className="text-xs font-semibold px-4 py-2 transition-colors capitalize"
                  style={{
                    background: tab === t ? '#C2185B' : '#fff',
                    color: tab === t ? '#fff' : '#6b7280',
                  }}
                >
                  {t === 'all' ? 'All' : `Unread (${unreadCount})`}
                </button>
              ))}
            </div>

            {/* Type filter */}
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="text-xs font-medium px-3 py-2 rounded-lg bg-white cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#C2185B]/20"
              style={{ border: '1px solid #e5e3df', color: '#374151' }}
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
            className="bg-white rounded-xl overflow-hidden"
            style={{ border: '1px solid #edecea', boxShadow: '0 1px 3px rgba(0,0,0,.04)' }}
          >
            {loading && notifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16">
                <div
                  className="mb-3"
                  style={{
                    width: 28,
                    height: 28,
                    border: '2.5px solid #e5e3df',
                    borderTopColor: '#C2185B',
                    borderRadius: '50%',
                    animation: 'spin 0.6s linear infinite',
                  }}
                />
                <span className="text-sm text-gray-400">Loading notifications…</span>
              </div>
            ) : displayed.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20">
                <div className="text-4xl mb-3">🔔</div>
                <p className="text-base font-semibold text-gray-700 mb-1">
                  {tab === 'unread' ? 'No unread notifications' : 'No notifications yet'}
                </p>
                <p className="text-sm text-gray-400">
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
                    className="w-full text-left transition-colors group"
                    style={{
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: 14,
                      padding: '16px 20px',
                      background: n.read ? '#fff' : 'rgba(194,24,91,.015)',
                      borderBottom: i < displayed.length - 1 ? '1px solid #f5f4f2' : 'none',
                      cursor: 'pointer',
                      borderLeft: n.read ? '3px solid transparent' : '3px solid #C2185B',
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = '#fafaf9')}
                    onMouseLeave={(e) => (e.currentTarget.style.background = n.read ? '#fff' : 'rgba(194,24,91,.015)')}
                  >
                    {/* Icon */}
                    <div
                      className="flex items-center justify-center shrink-0"
                      style={{
                        width: 42,
                        height: 42,
                        borderRadius: 10,
                        background: meta.bg,
                        fontSize: 20,
                      }}
                    >
                      {meta.icon}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-[10px] font-bold uppercase tracking-wide" style={{ color: meta.color }}>
                          {meta.label}
                        </span>
                        {!n.read && (
                          <span
                            className="shrink-0"
                            style={{
                              width: 6,
                              height: 6,
                              borderRadius: '50%',
                              background: '#C2185B',
                            }}
                          />
                        )}
                        <span className="ml-auto text-[11px] text-gray-400 shrink-0">
                          {timeAgo(n.sent_at || n.created_at)}
                        </span>
                      </div>
                      <p
                        className="text-[13px] leading-snug text-gray-800 mb-1"
                        style={{ fontWeight: n.read ? 400 : 600 }}
                      >
                        {n.subject}
                      </p>
                      <p className="text-[11px] text-gray-400">{formatDate(n.sent_at || n.created_at)}</p>
                    </div>

                    {/* Read indicator */}
                    {!n.read && (
                      <div
                        className="shrink-0 mt-1 opacity-0 group-hover:opacity-100 transition-opacity"
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
                        }}
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
            <div className="flex justify-center mt-6">
              <button
                onClick={() => fetchPage(page + 1, filter)}
                className="text-sm font-semibold px-6 py-2.5 rounded-lg transition-colors"
                style={{
                  color: '#C2185B',
                  background: 'rgba(194,24,91,.06)',
                  border: '1px solid rgba(194,24,91,.12)',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(194,24,91,.12)')}
                onMouseLeave={(e) => (e.currentTarget.style.background = 'rgba(194,24,91,.06)')}
              >
                Load more notifications
              </button>
            </div>
          )}

          {loading && notifications.length > 0 && (
            <div className="flex justify-center mt-4">
              <div
                style={{
                  width: 20,
                  height: 20,
                  border: '2px solid #e5e3df',
                  borderTopColor: '#C2185B',
                  borderRadius: '50%',
                  animation: 'spin 0.6s linear infinite',
                }}
              />
            </div>
          )}

          {/* Total count */}
          {!loading && displayed.length > 0 && (
            <p className="text-center text-[11px] text-gray-400 mt-4">
              Showing {displayed.length} of {total} notification{total !== 1 ? 's' : ''}
            </p>
          )}
        </div>
      </div>

      <style jsx>{`
        @keyframes spin {
          to {
            transform: rotate(360deg);
          }
        }
      `}</style>
    </DashboardLayout>
  );
}
