'use client';

import { BrandIntelService, WebsiteRead } from '@/src/api/BrandIntelService';
import { useCallback, useEffect, useRef, useState } from 'react';

const FAST_MS = 1500;
const SLOW_MS = 5000;
const HIDDEN_MS = 15000;

export function errorText(e: unknown, fallback: string): string {
  const err = e as { response?: { data?: { detail?: unknown } }; message?: string };
  const detail = err?.response?.data?.detail;
  if (typeof detail === 'string' && detail.trim()) return detail;
  if (!err?.response && err?.message?.toLowerCase().includes('network')) {
    return "We couldn't reach Uri. Check your connection and try again.";
  }
  return fallback;
}

/**
 * One website read: start it, follow its progress, and pick it up again after a reload or a
 * visit elsewhere (the read itself runs on the server and doesn't need this page open).
 *
 * Polling slows down as the read goes on and nearly stops while the tab is hidden, so a page
 * left open in a background tab costs the server almost nothing.
 */
export function useWebsiteRead({ resume = true }: { resume?: boolean } = {}) {
  const [read, setRead] = useState<WebsiteRead | null>(null);
  const [starting, setStarting] = useState(false);
  const [error, setError] = useState('');
  const [resumed, setResumed] = useState(!resume);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const alive = useRef(true);
  const polls = useRef(0);

  const stop = () => {
    if (timer.current) clearTimeout(timer.current);
    timer.current = null;
  };

  const follow = useCallback((current: WebsiteRead) => {
    stop();
    if (!current.job_id || (current.status !== 'queued' && current.status !== 'running')) return;
    const hidden = typeof document !== 'undefined' && document.visibilityState === 'hidden';
    const wait = hidden ? HIDDEN_MS : polls.current < 20 ? (current.poll_after_ms ?? FAST_MS) : SLOW_MS;
    timer.current = setTimeout(async () => {
      polls.current += 1;
      try {
        const next = await BrandIntelService.get(current.job_id!);
        if (!alive.current) return;
        setRead(next);
        follow(next);
      } catch {
        if (alive.current) follow(current); // a blip: keep following, more slowly
      }
    }, wait);
  }, []);

  useEffect(() => {
    alive.current = true;
    if (resume) {
      BrandIntelService.latest()
        .then((r) => {
          if (!alive.current) return;
          if (r.status !== 'none') {
            setRead(r);
            follow(r);
          }
        })
        .catch(() => undefined)
        .finally(() => alive.current && setResumed(true));
    }
    const onVisible = () => {
      if (document.visibilityState === 'visible') setRead((r) => (r ? (follow(r), r) : r));
    };
    document.addEventListener('visibilitychange', onVisible);
    return () => {
      alive.current = false;
      stop();
      document.removeEventListener('visibilitychange', onVisible);
    };
  }, [resume, follow]);

  const start = useCallback(
    async (url: string, force = false) => {
      setStarting(true);
      setError('');
      polls.current = 0;
      try {
        const r = await BrandIntelService.start(url, force);
        setRead(r);
        follow(r);
        return r;
      } catch (e) {
        setError(errorText(e, "We couldn't start reading your website. Please try again."));
        return null;
      } finally {
        setStarting(false);
      }
    },
    [follow]
  );

  const reset = useCallback(() => {
    stop();
    setRead(null);
    setError('');
  }, []);

  return { read, setRead, start, starting, error, setError, reset, resumed };
}
