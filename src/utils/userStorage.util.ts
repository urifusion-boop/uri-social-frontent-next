// Browser storage that belongs to ONE signed-in user.
//
// Live-reported 2026-11: unfinished ads started on one account showed up in
// another account signed in on the same browser, and opening one copied it into
// that second account. Sign-out only removed the login itself; everything else
// the app had kept in the browser (unfinished ads, the active brand, video
// sessions, the WhatsApp link) stayed behind for whoever signed in next.
//
// Anything that belongs to a user goes through this file, never straight to
// localStorage/sessionStorage:
//   - every key is filed under the signed-in user's id, so another account
//     reads a different key and finds nothing;
//   - wipeUserData() removes all of it, and runs on sign-out, on a forced
//     sign-out (expired session), and when a different user signs in on this
//     browser (claimBrowserFor), which also covers a sign-out that never ran.
// Preferences that aren't anyone's data (tour seen, theme) stay where they are.

import { STORE_KEYS } from '@/src/configs/store.config';

const USER_PREFIX = '@URI@U@';
const OWNER_KEY = '@URI@BROWSER_OWNER';
const ACTIVE_BRAND = 'active_brand';

// Keys and key prefixes that held user data before this file existed. Removed
// on every wipe, so copies written by an older version can't resurface.
const LEGACY_KEYS = [
  '@URI@ACTIVE_BRAND_ID',
  'uri:dvg:session',
  'uri:janevideo:session',
  'uri:multiclip:session',
  'uri:vsg:session',
  'uri_wa_connection',
  'jane_ads_pending_topup',
];
const LEGACY_PREFIXES = ['@URI@WIZARD_DRAFTS@'];

function decodeUserId(accessToken: unknown): string | null {
  if (typeof accessToken !== 'string') return null;
  try {
    const part = accessToken.split('.')[1];
    if (!part) return null;
    const json = atob(part.replace(/-/g, '+').replace(/_/g, '/').padEnd(Math.ceil(part.length / 4) * 4, '='));
    const body = JSON.parse(json);
    const id = body?.claims?.userId ?? body?.userId;
    return typeof id === 'string' && id ? id : null;
  } catch {
    return null;
  }
}

/** The signed-in user's id, read from the session token the API calls carry. */
export function currentUserId(): string | null {
  try {
    const tokens = JSON.parse(localStorage.getItem(STORE_KEYS.USER_TOKENS) || '{}');
    return decodeUserId(tokens?.accessToken);
  } catch {
    return null;
  }
}

function scoped(key: string): string | null {
  const uid = currentUserId();
  return uid ? `${USER_PREFIX}${uid}@${key}` : null;
}

function makeStore(storage: () => Storage) {
  return {
    /** null when nobody is signed in: nothing is shared through an "anonymous" slot. */
    getItem(key: string): string | null {
      try {
        const k = scoped(key);
        return k ? storage().getItem(k) : null;
      } catch {
        return null;
      }
    },
    setItem(key: string, value: string): void {
      try {
        const k = scoped(key);
        if (k) storage().setItem(k, value);
      } catch {
        // storage full or disabled; every caller treats this as best-effort
      }
    },
    removeItem(key: string): void {
      try {
        const k = scoped(key);
        if (k) storage().removeItem(k);
      } catch {
        /* no-op */
      }
    },
  };
}

/** localStorage, filed under the signed-in user. */
export const userStorage = makeStore(() => localStorage);
/** sessionStorage, filed under the signed-in user. */
export const userSessionStorage = makeStore(() => sessionStorage);

export function getActiveBrandIdForUser(): string | null {
  return userStorage.getItem(ACTIVE_BRAND);
}

export function setActiveBrandIdForUser(brandId: string | null): void {
  if (brandId) userStorage.setItem(ACTIVE_BRAND, brandId);
  else userStorage.removeItem(ACTIVE_BRAND);
}

function removeMatching(storage: Storage, test: (key: string) => boolean): void {
  const doomed: string[] = [];
  for (let i = 0; i < storage.length; i++) {
    const k = storage.key(i);
    if (k && test(k)) doomed.push(k);
  }
  doomed.forEach((k) => storage.removeItem(k));
}

/** Remove every user's data from this browser (not preferences, not the login itself). */
export function wipeUserData(): void {
  try {
    removeMatching(
      localStorage,
      (k) => k.startsWith(USER_PREFIX) || LEGACY_KEYS.includes(k) || LEGACY_PREFIXES.some((p) => k.startsWith(p))
    );
    localStorage.removeItem(OWNER_KEY);
  } catch {
    /* no-op */
  }
  try {
    // sessionStorage only ever holds this app's per-tab working state
    // (open thread, open scan, cached connections, content handed between pages).
    sessionStorage.clear();
  } catch {
    /* no-op */
  }
}

/** Call whenever a session is (re)established. If this browser last belonged to
 *  someone else, or to a version that didn't record an owner, everything left
 *  behind is wiped before the new user sees a single screen. */
export function claimBrowserFor(userId: string | null): void {
  if (!userId) return;
  try {
    if (localStorage.getItem(OWNER_KEY) !== userId) {
      wipeUserData();
      localStorage.setItem(OWNER_KEY, userId);
    }
  } catch {
    /* no-op */
  }
}

/** claimBrowserFor the user in the given session token. */
export function claimBrowserForToken(accessToken: unknown): void {
  claimBrowserFor(decodeUserId(accessToken));
}
