'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { useNotifications } from '@/src/providers/NotificationProvider';
import { Notification } from '@/src/api/NotificationService';
import { useRouter } from 'next/navigation';

/* ── Helpers ──────────────────────────────────────────────────────── */

const TYPE_META: Record<string, { icon: string; color: string; bg: string; label: string }> = {
  signup: { icon: '👋', color: '#C2185B', bg: 'rgba(194,24,91,.06)', label: 'Welcome' },
  content_created: { icon: '✨', color: '#7C3AED', bg: 'rgba(124,58,237,.06)', label: 'Content Ready' },
  content_posted: { icon: '🚀', color: '#059669', bg: 'rgba(5,150,105,.06)', label: 'Published' },
  daily_suggestion: { icon: '💡', color: '#D97706', bg: 'rgba(217,119,6,.06)', label: 'Suggestion' },
  inactivity: { icon: '🔔', color: '#6366F1', bg: 'rgba(99,102,241,.06)', label: 'Reminder' },
  trial_start: { icon: '🎉', color: '#C2185B', bg: 'rgba(194,24,91,.06)', label: 'Trial Started' },
  trial_ending: { icon: '⏰', color: '#EA580C', bg: 'rgba(234,88,12,.06)', label: 'Trial Ending' },
  trial_expired: { icon: '⚠️', color: '#DC2626', bg: 'rgba(220,38,38,.06)', label: 'Trial Expired' },
};

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

/* ── Component ────────────────────────────────────────────────────── */

export default function NotificationBell({ isMobile = false }: { isMobile?: boolean }) {
  const { unreadCount, notifications, total, loading, fetchNotifications, markAsRead, markAllVisible } =
    useNotifications();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const router = useRouter();

  // Fetch notifications on first open
  const handleToggle = useCallback(() => {
    setOpen((prev) => {
      if (!prev && notifications.length === 0) fetchNotifications(1);
      return !prev;
    });
  }, [notifications.length, fetchNotifications]);

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  // Close on escape
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [open]);

  const handleNotificationClick = (n: Notification) => {
    if (!n.read) markAsRead(n.notification_id);

    // Navigate based on type
    if (n.type === 'content_created' || n.type === 'daily_suggestion') {
      setOpen(false);
      router.push('/workspace?tab=content');
    } else if (n.type === 'content_posted') {
      setOpen(false);
      router.push('/workspace?tab=calendar');
    } else if (n.type === 'trial_ending' || n.type === 'trial_expired') {
      setOpen(false);
      router.push('/workspace?tab=billing');
    }
  };

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      {/* Bell Button */}
      <button
        onClick={handleToggle}
        aria-label={`Notifications${unreadCount > 0 ? ` (${unreadCount} unread)` : ''}`}
        style={{
          width: 32,
          height: 32,
          borderRadius: 7,
          border: '1px solid #e5e3df',
          background: open ? '#fdf2f8' : '#fff',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          position: 'relative',
          transition: 'all 0.15s',
        }}
      >
        <svg
          width={14}
          height={14}
          viewBox="0 0 24 24"
          fill="none"
          stroke={open ? '#C2185B' : '#666'}
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9" />
          <path d="M13.73 21a2 2 0 01-3.46 0" />
        </svg>

        {/* Badge */}
        {unreadCount > 0 && (
          <span
            style={{
              position: 'absolute',
              top: -4,
              right: -4,
              minWidth: 16,
              height: 16,
              borderRadius: 999,
              background: '#C2185B',
              color: '#fff',
              fontSize: 9,
              fontWeight: 700,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '0 4px',
              border: '2px solid #fff',
              lineHeight: 1,
            }}
          >
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown */}
      {open && (
        <div
          style={{
            position: 'absolute',
            top: 'calc(100% + 8px)',
            right: isMobile ? -60 : 0,
            width: isMobile ? 'calc(100vw - 32px)' : 360,
            maxWidth: isMobile ? 'calc(100vw - 32px)' : 360,
            background: '#fff',
            borderRadius: 12,
            boxShadow: '0 8px 40px rgba(0,0,0,.12), 0 2px 8px rgba(0,0,0,.06)',
            border: '1px solid #edecea',
            zIndex: 9999,
            overflow: 'hidden',
            animation: 'notifDropIn 0.18s ease-out',
          }}
        >
          {/* Header */}
          <div
            style={{
              padding: '14px 16px 10px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              borderBottom: '1px solid #f3f2f0',
            }}
          >
            <span style={{ fontSize: 14, fontWeight: 700, color: '#111' }}>Notifications</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              {unreadCount > 0 && (
                <button
                  onClick={() => markAllVisible()}
                  style={{
                    fontSize: 11,
                    fontWeight: 600,
                    color: '#C2185B',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    padding: '2px 6px',
                    borderRadius: 4,
                    transition: 'background 0.15s',
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(194,24,91,.06)')}
                  onMouseLeave={(e) => (e.currentTarget.style.background = 'none')}
                >
                  Mark all read
                </button>
              )}
              {unreadCount > 0 && (
                <span
                  style={{
                    fontSize: 10,
                    fontWeight: 700,
                    color: '#C2185B',
                    background: 'rgba(194,24,91,.08)',
                    padding: '2px 7px',
                    borderRadius: 999,
                  }}
                >
                  {unreadCount}
                </span>
              )}
            </div>
          </div>

          {/* List */}
          <div
            style={{
              maxHeight: 380,
              overflowY: 'auto',
              overflowX: 'hidden',
            }}
          >
            {loading && notifications.length === 0 ? (
              <div style={{ padding: '32px 16px', textAlign: 'center' }}>
                <div
                  style={{
                    width: 24,
                    height: 24,
                    border: '2px solid #e5e3df',
                    borderTopColor: '#C2185B',
                    borderRadius: '50%',
                    animation: 'spin 0.6s linear infinite',
                    margin: '0 auto 8px',
                  }}
                />
                <span style={{ fontSize: 12, color: '#999' }}>Loading…</span>
              </div>
            ) : notifications.length === 0 ? (
              <div style={{ padding: '40px 16px', textAlign: 'center' }}>
                <div style={{ fontSize: 28, marginBottom: 8 }}>🔔</div>
                <p style={{ fontSize: 13, fontWeight: 600, color: '#374151', margin: '0 0 4px' }}>All caught up!</p>
                <p style={{ fontSize: 12, color: '#9CA3AF', margin: 0 }}>
                  You&apos;ll be notified when there&apos;s something new
                </p>
              </div>
            ) : (
              notifications.map((n) => {
                const meta = TYPE_META[n.type] || TYPE_META.signup;
                return (
                  <button
                    key={n.notification_id}
                    onClick={() => handleNotificationClick(n)}
                    style={{
                      width: '100%',
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: 10,
                      padding: '12px 16px',
                      background: n.read ? '#fff' : 'rgba(194,24,91,.02)',
                      borderLeft: n.read ? '3px solid transparent' : '3px solid #C2185B',
                      border: 'none',
                      borderBottom: '1px solid #f7f6f4',
                      cursor: 'pointer',
                      textAlign: 'left',
                      transition: 'background 0.12s',
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = '#fafaf9')}
                    onMouseLeave={(e) => (e.currentTarget.style.background = n.read ? '#fff' : 'rgba(194,24,91,.02)')}
                  >
                    {/* Icon */}
                    <div
                      style={{
                        width: 34,
                        height: 34,
                        borderRadius: 8,
                        background: meta.bg,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: 16,
                        flexShrink: 0,
                        marginTop: 1,
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
                            fontWeight: 700,
                            color: meta.color,
                            textTransform: 'uppercase',
                            letterSpacing: '0.3px',
                          }}
                        >
                          {meta.label}
                        </span>
                        {!n.read && (
                          <span
                            style={{
                              width: 5,
                              height: 5,
                              borderRadius: '50%',
                              background: '#C2185B',
                              flexShrink: 0,
                            }}
                          />
                        )}
                      </div>
                      <p
                        style={{
                          fontSize: 12.5,
                          fontWeight: n.read ? 400 : 600,
                          color: '#1f2937',
                          margin: 0,
                          lineHeight: 1.4,
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          display: '-webkit-box',
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: 'vertical',
                        }}
                      >
                        {n.subject}
                      </p>
                      <span style={{ fontSize: 11, color: '#9CA3AF', marginTop: 3, display: 'block' }}>
                        {timeAgo(n.sent_at || n.created_at)}
                      </span>
                    </div>
                  </button>
                );
              })
            )}
          </div>

          {/* Footer */}
          <div
            style={{
              padding: '10px 16px',
              borderTop: '1px solid #f3f2f0',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 12,
            }}
          >
            {notifications.length > 0 && notifications.length < total && (
              <button
                onClick={() => fetchNotifications(Math.floor(notifications.length / 20) + 1)}
                disabled={loading}
                style={{
                  fontSize: 12,
                  fontWeight: 600,
                  color: '#C2185B',
                  background: 'none',
                  border: 'none',
                  cursor: loading ? 'default' : 'pointer',
                  opacity: loading ? 0.5 : 1,
                  padding: '4px 12px',
                  borderRadius: 6,
                  transition: 'background 0.15s',
                }}
                onMouseEnter={(e) => {
                  if (!loading) e.currentTarget.style.background = 'rgba(194,24,91,.06)';
                }}
                onMouseLeave={(e) => (e.currentTarget.style.background = 'none')}
              >
                {loading ? 'Loading…' : 'Load more'}
              </button>
            )}
            <button
              onClick={() => {
                setOpen(false);
                router.push('/notifications');
              }}
              style={{
                fontSize: 12,
                fontWeight: 600,
                color: '#C2185B',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                padding: '4px 12px',
                borderRadius: 6,
                transition: 'background 0.15s',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(194,24,91,.06)')}
              onMouseLeave={(e) => (e.currentTarget.style.background = 'none')}
            >
              View all notifications
            </button>
          </div>
        </div>
      )}

      {/* Animations */}
      <style jsx>{`
        @keyframes notifDropIn {
          from {
            opacity: 0;
            transform: translateY(-6px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        @keyframes spin {
          to {
            transform: rotate(360deg);
          }
        }
      `}</style>
    </div>
  );
}
