/**
 * Video Editing Billing PRD — client-side cost preview helpers.
 *
 * Mirrors the backend's pricing rule exactly (app/services/VideoBillingService.py
 * on uri-social-backend): 4 credits per billable minute, partial minutes
 * rounded up. This is a PREVIEW only — the backend remains the source of
 * truth and re-checks/re-charges on submit; this just lets the UI show the
 * cost before the user confirms (PRD FR-04), without a network round trip.
 */

// Keep in sync with settings.VIDEO_EDIT_CREDITS_PER_MINUTE on the backend.
export const VIDEO_EDIT_CREDITS_PER_MINUTE = 4;

export function computeBillableMinutes(durationSeconds: number): number {
  return Math.max(1, Math.ceil(Math.max(durationSeconds, 0) / 60));
}

export function computeVideoCredits(durationSeconds: number): number {
  return computeBillableMinutes(durationSeconds) * VIDEO_EDIT_CREDITS_PER_MINUTE;
}

export function formatDuration(totalSeconds: number): string {
  const seconds = Math.max(0, Math.round(totalSeconds));
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  if (minutes === 0) return `${remainingSeconds} second${remainingSeconds === 1 ? '' : 's'}`;
  const minutePart = `${minutes} minute${minutes === 1 ? '' : 's'}`;
  if (remainingSeconds === 0) return minutePart;
  return `${minutePart} ${remainingSeconds} second${remainingSeconds === 1 ? '' : 's'}`;
}

/**
 * Reads a video's duration in the browser via a hidden <video> element —
 * works for both a local File (object URL) and a remote URL (e.g. a
 * Cloudinary source_url handed off from the Multi-Clip Composer), as long
 * as the remote host allows it to load. Resolves to null if duration can't
 * be read (PRD §11: "Video Duration Cannot Be Detected") — callers should
 * treat that as "no preview available" rather than blocking the user, since
 * the backend still does the authoritative probe + check at submit time.
 */
export function probeVideoDuration(source: File | string): Promise<number | null> {
  return new Promise((resolve) => {
    const url = typeof source === 'string' ? source : URL.createObjectURL(source);
    const video = document.createElement('video');
    video.preload = 'metadata';
    video.crossOrigin = 'anonymous';

    const cleanup = () => {
      if (typeof source !== 'string') URL.revokeObjectURL(url);
      video.removeAttribute('src');
      video.load();
    };

    const timeout = setTimeout(() => {
      cleanup();
      resolve(null);
    }, 8000);

    video.onloadedmetadata = () => {
      clearTimeout(timeout);
      const duration = Number.isFinite(video.duration) ? video.duration : null;
      cleanup();
      resolve(duration);
    };
    video.onerror = () => {
      clearTimeout(timeout);
      cleanup();
      resolve(null);
    };

    video.src = url;
  });
}

export interface VideoCostEstimate {
  durationSeconds: number;
  billableMinutes: number;
  creditsRequired: number;
}

export function estimateVideoCost(durationSeconds: number): VideoCostEstimate {
  return {
    durationSeconds,
    billableMinutes: computeBillableMinutes(durationSeconds),
    creditsRequired: computeVideoCredits(durationSeconds),
  };
}
