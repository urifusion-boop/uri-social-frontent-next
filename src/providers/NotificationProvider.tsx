'use client';

import { createContext, useContext, useState, useEffect, useCallback, useRef, ReactNode } from 'react';
import { NotificationService, Notification, NotificationListResponse } from '@/src/api/NotificationService';
import { useAuth } from '@/src/providers/AuthProvider';

interface NotificationContextValue {
  unreadCount: number;
  notifications: Notification[];
  total: number;
  loading: boolean;
  refreshUnreadCount: () => Promise<void>;
  fetchNotifications: (page?: number) => Promise<void>;
  markAsRead: (notificationId: string) => Promise<void>;
  markAllVisible: () => Promise<void>;
}

const NotificationContext = createContext<NotificationContextValue | null>(null);

export function useNotifications() {
  const ctx = useContext(NotificationContext);
  if (!ctx) throw new Error('useNotifications must be used within NotificationProvider');
  return ctx;
}

export function NotificationProvider({ children }: { children: ReactNode }) {
  const { isAuthenticated } = useAuth();
  const [unreadCount, setUnreadCount] = useState(0);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const failCountRef = useRef(0);

  const refreshUnreadCount = useCallback(async () => {
    if (!isAuthenticated) return;
    // Stop polling after 3 consecutive failures (token expired / auth issue)
    if (failCountRef.current >= 3) return;
    try {
      const count = await NotificationService.getUnreadCount();
      setUnreadCount(count);
      failCountRef.current = 0; // reset on success
    } catch {
      failCountRef.current += 1;
    }
  }, [isAuthenticated]);

  const fetchNotifications = useCallback(
    async (page: number = 1) => {
      if (!isAuthenticated) return;
      setLoading(true);
      try {
        const data: NotificationListResponse = await NotificationService.getNotifications(page, 20);
        if (page === 1) {
          setNotifications(data.notifications);
        } else {
          setNotifications((prev) => [...prev, ...data.notifications]);
        }
        setTotal(data.total);
      } catch {
        // silent
      } finally {
        setLoading(false);
      }
    },
    [isAuthenticated]
  );

  const markAsRead = useCallback(async (notificationId: string) => {
    try {
      await NotificationService.markAsRead(notificationId);
      setNotifications((prev) => prev.map((n) => (n.notification_id === notificationId ? { ...n, read: true } : n)));
      setUnreadCount((c) => Math.max(0, c - 1));
    } catch {
      // silent
    }
  }, []);

  const markAllVisible = useCallback(async () => {
    const unread = notifications.filter((n) => !n.read);
    await Promise.all(unread.map((n) => NotificationService.markAsRead(n.notification_id)));
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    setUnreadCount(0);
  }, [notifications]);

  // Poll unread count every 60 seconds
  useEffect(() => {
    if (!isAuthenticated) return;
    failCountRef.current = 0; // reset on auth state change
    refreshUnreadCount();
    const interval = setInterval(refreshUnreadCount, 60000);
    return () => clearInterval(interval);
  }, [isAuthenticated, refreshUnreadCount]);

  return (
    <NotificationContext.Provider
      value={{
        unreadCount,
        notifications,
        total,
        loading,
        refreshUnreadCount,
        fetchNotifications,
        markAsRead,
        markAllVisible,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
}
