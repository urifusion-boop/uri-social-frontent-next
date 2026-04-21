'use client';

import { useEffect, useState, useCallback } from 'react';
import { useNotifications } from '@/src/providers/NotificationProvider';
import { Notification, NotificationService } from '@/src/api/NotificationService';
import { ToastService } from '@/src/utils/toast.util';
import { ToastTypeEnum } from '@/src/models/enum-models/ToastTypeEnum';
import NotificationPreferencesModal from './NotificationPreferencesModal';
import ConfirmDialog from './ConfirmDialog';

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
  // Convert UTC date to local timezone
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
}

/* ── Component ─────────────────────────────────────────────────── */

export default function NotificationsPanel() {
  const { unreadCount, refreshUnreadCount } = useNotifications();

  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('');
  const [tab, setTab] = useState<'all' | 'unread'>('all');
  const [selectedNotification, setSelectedNotification] = useState<Notification | null>(null);
  const [preferencesOpen, setPreferencesOpen] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkMode, setBulkMode] = useState(false);
  const [confirmDialog, setConfirmDialog] = useState<{ show: boolean; type: 'delete' | 'bulk-delete'; id?: string }>({
    show: false,
    type: 'delete',
  });

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
    } catch (error) {
      console.error('Failed to mark as read:', error);
      ToastService.showToast('Failed to mark notification as read', ToastTypeEnum.Error);
    }
  };

  const handleMarkAllRead = async () => {
    const unread = notifications.filter((n) => !n.read);
    if (unread.length === 0) return;
    try {
      const result = await NotificationService.markAllAsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
      refreshUnreadCount();
      ToastService.showToast(`${result.count} notifications marked as read`, ToastTypeEnum.Success);
    } catch (error) {
      console.error('Failed to mark all as read:', error);
      ToastService.showToast('Failed to mark all as read', ToastTypeEnum.Error);
    }
  };

  const handleClick = (n: Notification) => {
    handleMarkAsRead(n);
    setSelectedNotification(n);
  };

  const handleArchive = async (notificationId: string) => {
    try {
      await NotificationService.archiveNotification(notificationId);
      setNotifications((prev) => prev.filter((n) => n.notification_id !== notificationId));
      setTotal((prev) => prev - 1);
      setSelectedNotification(null);
      refreshUnreadCount(); // Refresh since archived notifications auto-mark as read
      ToastService.showToast('Notification archived', ToastTypeEnum.Success);
    } catch (error) {
      console.error('Failed to archive notification:', error);
      ToastService.showToast('Failed to archive notification', ToastTypeEnum.Error);
    }
  };

  const handleDelete = async (notificationId: string) => {
    try {
      await NotificationService.deleteNotification(notificationId);
      setNotifications((prev) => prev.filter((n) => n.notification_id !== notificationId));
      setTotal((prev) => prev - 1);
      setSelectedNotification(null);
      refreshUnreadCount();
    } catch {
      // silent
    }
  };

  const toggleSelect = (notificationId: string) => {
    setSelectedIds((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(notificationId)) {
        newSet.delete(notificationId);
      } else {
        newSet.add(notificationId);
      }
      return newSet;
    });
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === displayed.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(displayed.map((n) => n.notification_id)));
    }
  };

  const handleBulkArchive = async () => {
    const ids = Array.from(selectedIds);
    if (ids.length === 0) return;

    try {
      const result = await NotificationService.bulkArchiveNotifications(ids);
      setNotifications((prev) => prev.filter((n) => !selectedIds.has(n.notification_id)));
      setTotal((prev) => prev - result.count);
      setSelectedIds(new Set());
      refreshUnreadCount();
      ToastService.showToast(`${result.count} notifications archived`, ToastTypeEnum.Success);
    } catch (error) {
      console.error('Failed to bulk archive:', error);
      ToastService.showToast('Failed to archive notifications', ToastTypeEnum.Error);
    }
  };

  const handleBulkDelete = async () => {
    const ids = Array.from(selectedIds);
    if (ids.length === 0) return;

    try {
      const result = await NotificationService.bulkDeleteNotifications(ids);
      setNotifications((prev) => prev.filter((n) => !selectedIds.has(n.notification_id)));
      setTotal((prev) => prev - result.count);
      setSelectedIds(new Set());
      refreshUnreadCount();
      ToastService.showToast(`${result.count} notifications deleted`, ToastTypeEnum.Success);
    } catch (error) {
      console.error('Failed to bulk delete:', error);
      ToastService.showToast('Failed to delete notifications', ToastTypeEnum.Error);
    }
  };

  const handleSingleDelete = async (notificationId: string) => {
    try {
      await NotificationService.deleteNotification(notificationId);
      setNotifications((prev) => prev.filter((n) => n.notification_id !== notificationId));
      setTotal((prev) => prev - 1);
      setSelectedNotification(null);
      refreshUnreadCount();
      ToastService.showToast('Notification deleted', ToastTypeEnum.Success);
    } catch (error) {
      console.error('Failed to delete notification:', error);
      ToastService.showToast('Failed to delete notification', ToastTypeEnum.Error);
    }
  };

  const displayed = tab === 'unread' ? notifications.filter((n) => !n.read) : notifications;
  const hasMore = notifications.length < total;

  return (
    <div style={{ height: '100%', overflow: 'auto', background: '#f5f4f0' }}>
      <div style={{ maxWidth: 1400, margin: '0 auto', padding: '28px clamp(16px, 4vw, 48px)' }}>
        {/* Header */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: 20,
            flexWrap: 'wrap',
            gap: 12,
          }}
        >
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
          <div style={{ display: 'flex', gap: 8 }}>
            <button
              onClick={() => setPreferencesOpen(true)}
              style={{
                fontSize: 12,
                fontWeight: 700,
                color: '#6B7280',
                background: '#F3F4F6',
                border: 'none',
                padding: '7px 14px',
                borderRadius: 8,
                cursor: 'pointer',
                transition: 'background 0.15s',
                fontFamily: 'var(--wf)',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.background = '#E5E7EB')}
              onMouseLeave={(e) => (e.currentTarget.style.background = '#F3F4F6')}
              title="Notification preferences"
            >
              <svg
                width={14}
                height={14}
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth={2}
                style={{ display: 'inline-block', marginRight: 4, verticalAlign: 'middle' }}
              >
                <circle cx="12" cy="12" r="3" />
                <path d="M12 1v6M12 17v6M4.22 4.22l4.24 4.24M15.54 15.54l4.24 4.24M1 12h6M17 12h6M4.22 19.78l4.24-4.24M15.54 8.46l4.24-4.24" />
              </svg>
              Settings
            </button>
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
        </div>

        {/* Tabs + Filter */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: 12,
            marginBottom: 16,
            alignItems: 'center',
          }}
        >
          <div
            style={{
              display: 'flex',
              borderRadius: 8,
              overflow: 'hidden',
              border: '1px solid #e5e3df',
              width: 'fit-content',
            }}
          >
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
                  whiteSpace: 'nowrap',
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
              justifySelf: 'end',
            }}
          >
            {TYPE_FILTERS.map((f) => (
              <option key={f.value} value={f.value}>
                {f.label}
              </option>
            ))}
          </select>
        </div>

        {/* Bulk Actions Bar */}
        {displayed.length > 0 && (
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <button
              onClick={() => {
                setBulkMode(!bulkMode);
                setSelectedIds(new Set());
              }}
              style={{
                fontSize: 12,
                fontWeight: 600,
                color: bulkMode ? '#C2185B' : '#6B7280',
                background: 'transparent',
                border: 'none',
                cursor: 'pointer',
                fontFamily: 'var(--wf)',
              }}
            >
              {bulkMode ? '✓ Select Mode' : 'Select Multiple'}
            </button>

            {bulkMode && (
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                {selectedIds.size > 0 && (
                  <span style={{ fontSize: 12, color: '#6B7280', fontFamily: 'var(--wf)' }}>
                    {selectedIds.size} selected
                  </span>
                )}
                <button
                  onClick={toggleSelectAll}
                  style={{
                    fontSize: 12,
                    fontWeight: 600,
                    color: '#6B7280',
                    background: '#F3F4F6',
                    border: 'none',
                    padding: '6px 12px',
                    borderRadius: 6,
                    cursor: 'pointer',
                    fontFamily: 'var(--wf)',
                  }}
                >
                  {selectedIds.size === displayed.length ? 'Deselect All' : 'Select All'}
                </button>
                {selectedIds.size > 0 && (
                  <>
                    <button
                      onClick={handleBulkArchive}
                      style={{
                        fontSize: 12,
                        fontWeight: 600,
                        color: '#fff',
                        background: '#059669',
                        border: 'none',
                        padding: '6px 12px',
                        borderRadius: 6,
                        cursor: 'pointer',
                        fontFamily: 'var(--wf)',
                      }}
                    >
                      Archive ({selectedIds.size})
                    </button>
                    <button
                      onClick={() => setConfirmDialog({ show: true, type: 'bulk-delete' })}
                      style={{
                        fontSize: 12,
                        fontWeight: 600,
                        color: '#fff',
                        background: '#DC2626',
                        border: 'none',
                        padding: '6px 12px',
                        borderRadius: 6,
                        cursor: 'pointer',
                        fontFamily: 'var(--wf)',
                      }}
                    >
                      Delete ({selectedIds.size})
                    </button>
                  </>
                )}
              </div>
            )}
          </div>
        )}

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
                  onClick={() => (bulkMode ? toggleSelect(n.notification_id) : handleClick(n))}
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
                  {/* Checkbox (bulk mode) */}
                  {bulkMode && (
                    <div
                      style={{
                        width: 20,
                        height: 20,
                        borderRadius: 4,
                        border: `2px solid ${selectedIds.has(n.notification_id) ? '#C2185B' : '#D1D5DB'}`,
                        background: selectedIds.has(n.notification_id) ? '#C2185B' : '#fff',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                        marginTop: 10,
                      }}
                    >
                      {selectedIds.has(n.notification_id) && (
                        <svg width={12} height={12} viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth={3}>
                          <polyline points="20 6 9 17 4 12" />
                        </svg>
                      )}
                    </div>
                  )}

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

                  {/* Action buttons */}
                  {!bulkMode && (
                    <div style={{ display: 'flex', gap: 6, flexShrink: 0, marginTop: 2 }}>
                      {!n.read && (
                        <div
                          title="Mark as read"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleMarkAsRead(n);
                          }}
                          style={{
                            width: 32,
                            height: 32,
                            borderRadius: 8,
                            border: '1px solid #E5E7EB',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            cursor: 'pointer',
                            background: '#F9FAFB',
                            transition: 'all 0.15s',
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.background = '#059669';
                            e.currentTarget.style.borderColor = '#059669';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.background = '#F9FAFB';
                            e.currentTarget.style.borderColor = '#E5E7EB';
                          }}
                        >
                          <svg
                            width={14}
                            height={14}
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth={2.5}
                          >
                            <polyline points="20 6 9 17 4 12" />
                          </svg>
                        </div>
                      )}
                      <div
                        title="Archive"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleArchive(n.notification_id);
                        }}
                        style={{
                          width: 32,
                          height: 32,
                          borderRadius: 8,
                          border: '1px solid #E5E7EB',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          cursor: 'pointer',
                          background: '#F9FAFB',
                          transition: 'all 0.15s',
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.background = '#F59E0B';
                          e.currentTarget.style.borderColor = '#F59E0B';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.background = '#F9FAFB';
                          e.currentTarget.style.borderColor = '#E5E7EB';
                        }}
                      >
                        <svg
                          width={14}
                          height={14}
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth={2}
                        >
                          <path d="M21 8v13H3V8M1 3h22v5H1zM10 12h4" />
                        </svg>
                      </div>
                      <div
                        title="Delete"
                        onClick={(e) => {
                          e.stopPropagation();
                          setConfirmDialog({ show: true, type: 'delete', id: n.notification_id });
                        }}
                        style={{
                          width: 32,
                          height: 32,
                          borderRadius: 8,
                          border: '1px solid #E5E7EB',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          cursor: 'pointer',
                          background: '#F9FAFB',
                          transition: 'all 0.15s',
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.background = '#EF4444';
                          e.currentTarget.style.borderColor = '#EF4444';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.background = '#F9FAFB';
                          e.currentTarget.style.borderColor = '#E5E7EB';
                        }}
                      >
                        <svg
                          width={14}
                          height={14}
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth={2}
                        >
                          <polyline points="3 6 5 6 21 6" />
                          <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                        </svg>
                      </div>
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

      {/* Notification Detail Modal */}
      {selectedNotification && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0,0,0,0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 10000,
            padding: 16,
          }}
          onClick={() => setSelectedNotification(null)}
        >
          <div
            style={{
              background: '#fff',
              borderRadius: 16,
              maxWidth: 560,
              width: '100%',
              maxHeight: '80vh',
              overflow: 'auto',
              boxShadow: '0 20px 60px rgba(0,0,0,.3)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {(() => {
              const meta = TYPE_META[selectedNotification.type] || TYPE_META.signup;
              return (
                <>
                  {/* Header */}
                  <div
                    style={{
                      padding: '20px 24px',
                      borderBottom: '1px solid #f5f4f2',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <div
                        style={{
                          width: 44,
                          height: 44,
                          borderRadius: 10,
                          background: meta.bg,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: 20,
                        }}
                      >
                        {meta.icon}
                      </div>
                      <div>
                        <span
                          style={{
                            fontSize: 11,
                            fontWeight: 800,
                            color: meta.color,
                            textTransform: 'uppercase',
                            letterSpacing: '0.3px',
                            fontFamily: 'var(--wf)',
                          }}
                        >
                          {meta.label}
                        </span>
                        <p style={{ fontSize: 12, color: '#9CA3AF', margin: 0, fontFamily: 'var(--wf)' }}>
                          {formatDate(selectedNotification.sent_at || selectedNotification.created_at)}
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => setSelectedNotification(null)}
                      style={{
                        width: 32,
                        height: 32,
                        borderRadius: 8,
                        border: '1px solid #e5e3df',
                        background: '#fff',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="#666" strokeWidth={2}>
                        <line x1="18" y1="6" x2="6" y2="18" />
                        <line x1="6" y1="6" x2="18" y2="18" />
                      </svg>
                    </button>
                  </div>

                  {/* Body */}
                  <div style={{ padding: '24px' }}>
                    <h3
                      style={{
                        fontSize: 18,
                        fontWeight: 700,
                        color: '#111',
                        margin: '0 0 12px',
                        fontFamily: 'var(--wf)',
                      }}
                    >
                      {selectedNotification.subject}
                    </h3>
                    <p
                      style={{
                        fontSize: 14,
                        color: '#374151',
                        lineHeight: 1.6,
                        margin: 0,
                        fontFamily: 'var(--wf)',
                        whiteSpace: 'pre-wrap',
                      }}
                    >
                      {(typeof selectedNotification.metadata?.message === 'string'
                        ? selectedNotification.metadata.message
                        : selectedNotification.subject) || selectedNotification.subject}
                    </p>
                  </div>

                  {/* Actions */}
                  <div
                    style={{
                      padding: '16px 24px',
                      borderTop: '1px solid #f5f4f2',
                      display: 'flex',
                      gap: 8,
                      justifyContent: 'flex-end',
                    }}
                  >
                    <button
                      onClick={() => handleArchive(selectedNotification.notification_id)}
                      style={{
                        fontSize: 13,
                        fontWeight: 600,
                        padding: '8px 16px',
                        borderRadius: 8,
                        border: '1px solid #e5e3df',
                        background: '#fff',
                        color: '#374151',
                        cursor: 'pointer',
                        fontFamily: 'var(--wf)',
                        transition: 'background 0.15s',
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.background = '#f9fafb')}
                      onMouseLeave={(e) => (e.currentTarget.style.background = '#fff')}
                    >
                      📦 Archive
                    </button>
                    <button
                      onClick={() => {
                        if (confirm('Delete this notification permanently?')) {
                          handleDelete(selectedNotification.notification_id);
                        }
                      }}
                      style={{
                        fontSize: 13,
                        fontWeight: 600,
                        padding: '8px 16px',
                        borderRadius: 8,
                        border: '1px solid #fecaca',
                        background: '#fff',
                        color: '#DC2626',
                        cursor: 'pointer',
                        fontFamily: 'var(--wf)',
                        transition: 'background 0.15s',
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.background = '#fef2f2')}
                      onMouseLeave={(e) => (e.currentTarget.style.background = '#fff')}
                    >
                      🗑️ Delete
                    </button>
                  </div>
                </>
              );
            })()}
          </div>
        </div>
      )}

      <style>{`
        @keyframes notifSpin {
          to { transform: rotate(360deg); }
        }
      `}</style>

      {/* Preferences Modal */}
      <NotificationPreferencesModal isOpen={preferencesOpen} onClose={() => setPreferencesOpen(false)} />

      {/* Confirm Dialog */}
      <ConfirmDialog
        isOpen={confirmDialog.show}
        title={confirmDialog.type === 'bulk-delete' ? 'Delete Notifications' : 'Delete Notification'}
        message={
          confirmDialog.type === 'bulk-delete'
            ? `Are you sure you want to delete ${selectedIds.size} notification${selectedIds.size > 1 ? 's' : ''}? This action cannot be undone.`
            : 'Are you sure you want to delete this notification? This action cannot be undone.'
        }
        confirmText="Delete"
        cancelText="Cancel"
        confirmColor="#EF4444"
        onConfirm={() => {
          if (confirmDialog.type === 'bulk-delete') {
            handleBulkDelete();
          } else if (confirmDialog.id) {
            handleSingleDelete(confirmDialog.id);
          }
        }}
        onCancel={() => setConfirmDialog({ show: false, type: 'delete' })}
      />
    </div>
  );
}
