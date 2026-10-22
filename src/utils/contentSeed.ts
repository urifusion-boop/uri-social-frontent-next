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

/**
 * Same idea, for the video generator — which, unlike text content, has no
 * single server-side "generate everything now" call (storyboard, frames and
 * render are a genuine multi-step, user-reviewed flow). Handing over a brief
 * and jumping to Describe It is the honest "one click" here: it starts the
 * real flow pre-filled, rather than pretending a finished video exists.
 */
const VIDEO_KEY = 'uri_video_seed';

export interface VideoSeed {
  brief: string;
  source?: string;
  cardId?: string;
}

export const setVideoSeed = (seed: VideoSeed): void => {
  try {
    sessionStorage.setItem(VIDEO_KEY, JSON.stringify(seed));
  } catch {
    /* storage unavailable — the generator just opens empty */
  }
};

export const takeVideoSeed = (): VideoSeed | null => {
  try {
    const raw = sessionStorage.getItem(VIDEO_KEY);
    if (!raw) return null;
    sessionStorage.removeItem(VIDEO_KEY);
    return JSON.parse(raw) as VideoSeed;
  } catch {
    return null;
  }
};

// Non-destructive — for the outer tab switch that happens before
// DescribeVideoGenerator mounts and does the real (destructive) take itself.
export const hasVideoSeed = (): boolean => {
  try {
    return sessionStorage.getItem(VIDEO_KEY) !== null;
  } catch {
    return false;
  }
};
