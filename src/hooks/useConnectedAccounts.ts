'use client';

import { SocialMediaAgentService } from '@/src/api/SocialMediaAgentService';
import { EventBus, EVENTS } from '@/src/services/EventBus';
import { useCallback, useEffect, useState } from 'react';

/**
 * The one place the app learns which social accounts the active brand has connected.
 *
 * Every screen that needs "what's connected?" reads it from here, so they all agree: one
 * request per brand, shared by whoever asks while it is in flight, kept for a short while,
 * and dropped the moment an account is connected or disconnected (the HTTP client emits
 * CONNECTIONS_CHANGED after any successful connect / finalize / disconnect call), at which
 * point every screen using `useConnectedAccounts` refreshes itself.
 */

/** Networks a post can be published to. "Has any connected" means one of these. */
export const PUBLISHING_PLATFORMS = ['facebook', 'instagram', 'linkedin', 'tiktok'] as const;

type ConnectionsResponse = Awaited<ReturnType<typeof SocialMediaAgentService.getConnections>>;
type ConnectionsData = NonNullable<ConnectionsResponse['responseData']>;

export interface ConnectedAccounts {
  /** Networks with at least one connected account, as the backend names them ("facebook", "tiktok", ...). */
  platforms: string[];
  /** The connected accounts themselves, by network. */
  connections: ConnectionsData['connections'];
  total: number;
  /** True when a publishing network (Facebook, Instagram, LinkedIn or TikTok) is connected. */
  hasAny: boolean;
}

const EMPTY: ConnectedAccounts = { platforms: [], connections: {}, total: 0, hasAny: false };
const MAX_AGE_MS = 60 * 1000;

let cached: { brand: string; at: number; promise: Promise<ConnectionsResponse> } | null = null;

// Registered when this module loads, before any screen subscribes, so the copy is gone by the
// time the screens refetch.
EventBus.on(EVENTS.CONNECTIONS_CHANGED, () => {
  cached = null;
});

function activeBrand(): string {
  try {
    return localStorage.getItem('@URI@ACTIVE_BRAND_ID') ?? '';
  } catch {
    return '';
  }
}

export function toConnectedAccounts(res: ConnectionsResponse | null | undefined): ConnectedAccounts {
  const data = res?.status ? res.responseData : null;
  if (!data) return EMPTY;
  const platforms = (data.connected_platforms ?? []).map((p) => String(p).toLowerCase());
  return {
    platforms,
    connections: data.connections ?? {},
    total: data.total_connections ?? 0,
    hasAny: platforms.some((p) => (PUBLISHING_PLATFORMS as readonly string[]).includes(p)),
  };
}

/**
 * The active brand's connected accounts, in the backend's own response shape (so existing
 * callers of SocialMediaAgentService.getConnections can switch over unchanged).
 * `force` skips the short-lived copy — for screens that must show the very latest state.
 */
export function loadConnections({ force = false }: { force?: boolean } = {}): Promise<ConnectionsResponse> {
  const brand = activeBrand();
  if (!force && cached && cached.brand === brand && Date.now() - cached.at < MAX_AGE_MS) return cached.promise;
  const promise = SocialMediaAgentService.getConnections();
  const entry = { brand, at: Date.now(), promise };
  cached = entry;
  // A failed request isn't kept: the next caller tries again.
  promise.catch(() => {
    if (cached === entry) cached = null;
  });
  return promise;
}

/** Forget what we know; every screen using the hook refetches. */
export function connectionsChanged(): void {
  EventBus.emit(EVENTS.CONNECTIONS_CHANGED);
}

/** The active brand's connected accounts, refreshed automatically when they change. */
export function useConnectedAccounts(): ConnectedAccounts & { loaded: boolean; refresh: () => void } {
  const [state, setState] = useState<{ accounts: ConnectedAccounts; loaded: boolean }>({ accounts: EMPTY, loaded: false });
  const [version, setVersion] = useState(0);

  useEffect(() => {
    let alive = true;
    loadConnections()
      .then((res) => alive && setState({ accounts: toConnectedAccounts(res), loaded: true }))
      .catch(() => alive && setState({ accounts: EMPTY, loaded: true }));
    return () => {
      alive = false;
    };
  }, [version]);

  useEffect(() => EventBus.on(EVENTS.CONNECTIONS_CHANGED, () => setVersion((v) => v + 1)), []);

  const refresh = useCallback(() => connectionsChanged(), []);
  return { ...state.accounts, loaded: state.loaded, refresh };
}
