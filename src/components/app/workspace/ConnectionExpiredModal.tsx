'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { NotificationService, Notification } from '@/src/api/NotificationService';
import { useAuth } from '@/src/providers/AuthProvider';

const PINK = '#C2185B';
const COUNTDOWN_SECONDS = 15;
const POLL_INTERVAL_MS = 60000;

/**
 * Global, auto-triggering modal for the "connection_disconnected" notification
 * type (see backend NotificationService.notify_connection_disconnected) —
 * fired when Outstand reports a connection no longer exists on its side
 * (revoked on the platform's end, not something the user did here).
 *
 * Polls independently of NotificationProvider's unread-count poll rather
 * than extending its shared interface, since this is a narrow, self-contained
 * behavior (one notification type, one modal) not needed by the rest of the
 * app.
 */
export default function ConnectionExpiredModal() {
  const { isAuthenticated } = useAuth();
  const router = useRouter();
  const [pending, setPending] = useState<Notification | null>(null);
  const [secondsLeft, setSecondsLeft] = useState(COUNTDOWN_SECONDS);

  // Mirrors `pending` for use inside the poll callback without needing it in
  // the callback's dependency array (which would tear down/recreate the
  // interval on every state change).
  const pendingRef = useRef<Notification | null>(null);
  useEffect(() => {
    pendingRef.current = pending;
  }, [pending]);

  // Guards goReconnect specifically against double-invocation (e.g. the
  // button clicked in the same tick the countdown hits zero) — NOT a
  // permanent "already handled" flag, so it must not block later polls once
  // reset for the next notification.
  const actionInFlightRef = useRef(false);

  const checkForDisconnected = useCallback(async () => {
    if (!isAuthenticated || pendingRef.current) return; // a modal is already showing
    try {
      const data = await NotificationService.getNotifications(1, 5, 'connection_disconnected');
      const unread = data.notifications.find((n) => !n.read);
      if (unread) {
        actionInFlightRef.current = false;
        setSecondsLeft(COUNTDOWN_SECONDS);
        setPending(unread);
      }
    } catch {
      // Best-effort UX nudge, not a critical path — stay silent on failure.
    }
  }, [isAuthenticated]);

  useEffect(() => {
    checkForDisconnected();
    const interval = setInterval(checkForDisconnected, POLL_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [checkForDisconnected]);

  const goReconnect = useCallback(async () => {
    const notif = pendingRef.current;
    if (!notif || actionInFlightRef.current) return;
    actionInFlightRef.current = true;
    try {
      await NotificationService.markAsRead(notif.notification_id);
    } catch {
      // Proceed to redirect regardless — being unable to mark it read
      // shouldn't trap the user on a stale modal.
    }
    setPending(null);
    router.push('/workspace/?tab=connections');
  }, [router]);

  // Countdown ticks every second; hitting zero triggers the same reconnect
  // action as clicking the button, matching the "go there automatically"
  // requirement — there is deliberately no dismiss/ignore option.
  useEffect(() => {
    if (!pending) return;
    if (secondsLeft <= 0) {
      goReconnect();
      return;
    }
    const t = setTimeout(() => setSecondsLeft((s) => s - 1), 1000);
    return () => clearTimeout(t);
  }, [pending, secondsLeft, goReconnect]);

  if (!pending) return null;

  const platform = (typeof pending.metadata?.platform === 'string' && pending.metadata.platform) || 'social';
  const platformLabel = platform.charAt(0).toUpperCase() + platform.slice(1);

  return (
    <>
      {/* Backdrop */}
      <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 9998 }} />

      {/* Modal */}
      <div
        style={{
          position: 'fixed',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          background: '#fff',
          borderRadius: 16,
          padding: 32,
          width: '90%',
          maxWidth: 440,
          zIndex: 9999,
          boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
          textAlign: 'center',
        }}
      >
        <div style={{ fontSize: 40, marginBottom: 12 }}>⚠️</div>
        <h2 style={{ margin: '0 0 8px', fontSize: 20, fontWeight: 800, color: '#111', fontFamily: 'var(--wf)' }}>
          {`${platformLabel} connection expired`}
        </h2>
        <p style={{ margin: '0 0 24px', fontSize: 14, color: '#6B7280', lineHeight: 1.6, fontFamily: 'var(--wf)' }}>
          {`Your ${platformLabel} connection is no longer active, so posts to it won't go out. Reconnect now to keep publishing.`}
        </p>
        <button
          onClick={goReconnect}
          style={{
            width: '100%',
            padding: 14,
            borderRadius: 10,
            border: 'none',
            background: `linear-gradient(135deg, ${PINK}, #E94396)`,
            color: '#fff',
            fontSize: 15,
            fontWeight: 700,
            cursor: 'pointer',
            marginBottom: 12,
            fontFamily: 'var(--wf)',
          }}
        >
          Reconnect Now
        </button>
        <p style={{ margin: 0, fontSize: 12, color: '#9CA3AF', fontFamily: 'var(--wf)' }}>
          Redirecting automatically in {secondsLeft}s…
        </p>
      </div>
    </>
  );
}
