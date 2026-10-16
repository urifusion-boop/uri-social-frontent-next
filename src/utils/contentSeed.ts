/**
 * Hand a ready brief to the content generator (e.g. from a Market
 * Intelligence opportunity card) without the owner copy-pasting anything.
 * Session-scoped and read once.
 */
const KEY = 'uri_content_seed';

export interface ContentSeed {
  seed: string;
  platforms?: string[];
  source?: string;
  cardId?: string;
}

export const setContentSeed = (seed: ContentSeed): void => {
  try {
    sessionStorage.setItem(KEY, JSON.stringify(seed));
  } catch {
    /* storage unavailable — the generator just opens empty */
  }
};

export const takeContentSeed = (): ContentSeed | null => {
  try {
    const raw = sessionStorage.getItem(KEY);
    if (!raw) return null;
    sessionStorage.removeItem(KEY);
    return JSON.parse(raw) as ContentSeed;
  } catch {
    return null;
  }
};
