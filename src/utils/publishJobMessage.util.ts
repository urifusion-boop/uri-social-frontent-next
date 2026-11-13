import type { ApprovePublishResult, ApproveResult, VideoPublishJob } from '@/src/api/SocialMediaAgentService';

export type PublishJobTone = 'info' | 'waiting' | 'success' | 'warning' | 'error';

export interface PublishJobMessage {
  tone: PublishJobTone;
  title: string;
  body: string;
  // False when pressing Publish again cannot help (a daily or app-wide cap).
  canRetry: boolean;
  // True while the job is still going to happen on its own, so the caller should keep polling.
  inFlight: boolean;
}

const PLATFORM_NAMES: Record<string, string> = {
  tiktok: 'TikTok',
  instagram: 'Instagram',
  facebook: 'Facebook',
};

const platformName = (platform: string | null | undefined) =>
  PLATFORM_NAMES[(platform ?? '').toLowerCase()] ?? 'the platform';

// "14:35" in the viewer's own time zone; empty when the value is missing or unreadable.
export function formatResumeAt(iso: string | null | undefined): string {
  if (!iso) return '';
  // The backend sends UTC; a value with no zone suffix is UTC too.
  const hasZone = /([zZ]|[+-]\d{2}:?\d{2})$/.test(iso);
  const date = new Date(hasZone ? iso : `${iso}Z`);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

// The time a waiting job is expected to start, as epoch ms (0 when it isn't waiting).
export function resumeTimeMs(job: Pick<VideoPublishJob, 'next_attempt_at' | 'resume_at'>): number {
  const iso = job.next_attempt_at || job.resume_at;
  if (!iso) return 0;
  const hasZone = /([zZ]|[+-]\d{2}:?\d{2})$/.test(iso);
  const ms = new Date(hasZone ? iso : `${iso}Z`).getTime();
  return Number.isNaN(ms) ? 0 : ms;
}

// One place that decides what a publish job's status means to the person looking at it, so a rate limit
// is never shown as a red "failed" and a cap never invites a pointless retry.
export function describePublishJob(job: VideoPublishJob): PublishJobMessage {
  const name = platformName(job.platform);
  const at = formatResumeAt(job.next_attempt_at || job.resume_at);

  switch (job.status) {
    case 'published':
      return {
        tone: 'success',
        title: `Posted to ${name}`,
        body: 'It may take a few minutes to finish processing and appear on your profile.',
        canRetry: false,
        inFlight: false,
      };

    case 'queued': {
      const limited = job.wait_reason === 'rate_limited';
      const waiting = !!resumeTimeMs(job);
      if (!waiting) {
        return {
          tone: 'info',
          title: 'Queued',
          body: `Waiting to be sent to ${name}.`,
          canRetry: false,
          inFlight: true,
        };
      }
      return {
        tone: 'waiting',
        title: limited ? `${name} asked us to slow down` : 'Next in line to post',
        // A busy account's time is only when the other post's lock would run out, so it gets no clock time.
        body: limited
          ? `This post will go out on its own${at ? ` after ${at}` : ' in a few minutes'}. You don't need to do anything.`
          : `We send one post at a time to each ${name} account, so this one goes out as soon as the one before it finishes, usually within a few minutes. You don't need to do anything.`,
        canRetry: false,
        inFlight: true,
      };
    }

    case 'uploading':
      return { tone: 'info', title: `Sending to ${name}…`, body: '', canRetry: false, inFlight: true };

    case 'processing':
      return {
        tone: 'warning',
        title: `${name} is still processing this post`,
        body: job.error || `Check your ${name} profile in a few minutes.`,
        canRetry: false,
        inFlight: false,
      };

    case 'failed': {
      if (job.error_code === 'daily_cap') {
        return {
          tone: 'warning',
          title: `${name}'s posting limit reached`,
          body:
            job.error ||
            `This ${name} account has hit its posting limit for now. Try again later; reconnecting won't help.`,
          canRetry: false,
          inFlight: false,
        };
      }
      if (job.error_code === 'app_cap') {
        return {
          tone: 'warning',
          title: `${name} is limiting this app`,
          body:
            job.error || `${name} is limiting how many accounts this app can post for until its review is complete.`,
          canRetry: false,
          inFlight: false,
        };
      }
      if (job.error_code === 'rate_limited') {
        return {
          tone: 'warning',
          title: `${name} is busy`,
          body:
            job.error ||
            `${name} is limiting how fast we can post. Try again${at ? ` after ${at}` : ' in a few minutes'}.`,
          canRetry: job.retryable !== false,
          inFlight: false,
        };
      }
      return {
        tone: 'error',
        title: `Couldn't post to ${name}`,
        body: job.error || `${name} couldn't publish this post.`,
        canRetry: job.retryable !== false,
        inFlight: false,
      };
    }

    default:
      return { tone: 'info', title: 'Working…', body: '', canRetry: false, inFlight: true };
  }
}

// The publish result of a draft that Approve held back (rate limit, or another post going out first), or null.
export function queuedPublish(result: ApproveResult | null | undefined, draftId?: string): ApprovePublishResult | null {
  const match = (result?.approved_drafts ?? []).find(
    (a) =>
      (!draftId || a.draft_id === draftId) &&
      (a.publish_result?.queued || a.publish_result?.publish_status === 'queued')
  );
  return match?.publish_result ?? null;
}

// How long a "didn't publish" explanation stays up: these are full sentences telling the owner
// what to do, and the default few seconds vanished before they could be read.
export const PUBLISH_FAILURE_TOAST_MS = 15000;

// Approve answers status:true even when the network refused the post right then; the refusal is in
// approved_drafts[].publish_result. The owner-facing reason (already in plain words), or null when it
// went out, is going out, or is queued.
export function failedPublish(result: ApproveResult | null | undefined, draftId?: string): string | null {
  const match = (result?.approved_drafts ?? []).find((a) => !draftId || a.draft_id === draftId);
  const pr = match?.publish_result;
  if (!pr || pr.success || pr.queued || pr.publish_status === 'queued' || pr.status === 'confirming') return null;
  const name = match?.platform ? match.platform.charAt(0).toUpperCase() + match.platform.slice(1) : 'the platform';
  return pr.error || `This post couldn't be published to ${name}. Please try again.`;
}

export function queuedNotice(result: ApprovePublishResult): string {
  const at = formatResumeAt(result.resume_at);
  // The backend words the time in UTC; show it in the viewer's own time zone instead.
  if (result.message) return at ? result.message.replace(/\b\d{2}:\d{2} UTC\b/, at) : result.message;
  return `Queued: this will post${at ? ` around ${at}` : ' shortly'}.`;
}
