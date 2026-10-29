'use client';

import {
  SocialMediaAgentService,
  Storyboard,
  VideoClip,
  VideoDraft,
  VideoJob,
  VideoQuote,
  VideoJobBilling,
} from '@/src/api/SocialMediaAgentService';
import { VIDEO_STYLES } from '@/src/data/videoStyles';
import {
  PRIMARY,
  DARK,
  GREY,
  LIGHT,
  BORDER,
  PLATFORMS,
  DURATIONS,
  VIDEO_OUTCOMES,
  AvatarVoicePicker,
  MODEL_LABELS,
  Section,
  Spinner,
  StoryboardResult,
  suggestOutcome,
} from '@/src/components/app/workspace/VideoStoryboardGenerator';
import { useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import ConfirmDialog from '@/src/components/app/workspace/ConfirmDialog';
import { useAuth } from '@/src/providers/AuthProvider';
import { takeVideoSeed } from '@/src/utils/contentSeed';
import { ToastService } from '@/src/utils/toast.util';
import { ToastTypeEnum } from '@/src/models/enum-models/ToastTypeEnum';

// "Describe it" flow: a free-text brief is the primary input (reference
// images are optional, unlike VideoStoryboardGenerator's upload-first flow
// where 1-5 images are required). No style picker here on purpose — gpt-5.4
// infers the best-fitting VIDEO_STYLES entry from the brief itself as part
// of the same call (see video_creative_service.py) and writes a
// creative_direction + scene-by-scene script; its style pick comes back on
// storyboard.video_style for display, rather than asking the user to also
// choose a style for a video they've already described in their own words.
// gpt-image-2 then generates a
// scene's own generated image for visual consistency, rather than editing a
// fixed uploaded photo by index. Once scenes carry frame_image_url, this
// reuses the EXACT SAME outcome-routed fal.ai generation pipeline as the
// upload-first flow (video_generation_service.py never changed) — see
// VideoStoryboardGenerator.tsx for the shared constants/components imported
// above. Session persistence across reloads and the "Saved Video Drafts"
// list + publish flow are intentionally not duplicated here — they stay
// unique to the upload-first tab; drafts saved from either flow land in the
// same place and are visible there.

interface UploadedImage {
  dataUrl: string;
  name: string;
}

export default function DescribeVideoGenerator({ onGoToDrafts }: { onGoToDrafts?: () => void } = {}) {
  const [brief, setBrief] = useState('');
  const [images, setImages] = useState<UploadedImage[]>([]);
  // Required (not just a disclaimer the user can ignore) whenever reference
  // images are attached — an uploaded photo goes to gpt-image-2/fal.ai, so
  // this is the one point where the user affirmatively confirms they're
  // allowed to use it, not just text they can scroll past.
  const [confirmedImageRights, setConfirmedImageRights] = useState(false);
  const [platform, setPlatform] = useState('instagram_reels');
  const [duration, setDuration] = useState(15);
  const [loading, setLoading] = useState(false);
  const [storyboard, setStoryboard] = useState<Storyboard | null>(null);
  const [error, setError] = useState('');
  // Editing creative_direction regenerates the whole storyboard (new scenes,
  // new frames) from the edited text rather than just changing the label —
  // the direction is what the scenes exist to serve, so a stale script after
  // editing it would be misleading.
  const [editingDirection, setEditingDirection] = useState(false);
  const [editedDirection, setEditedDirection] = useState('');
  const [regeneratingDirection, setRegeneratingDirection] = useState(false);
  const [dragging, setDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // A brief handed over from a Market Intelligence / Listening opportunity
  // card recommended as a video — see contentSeed.ts's VideoSeed docstring
  // for why this is the honest "one click" for video instead of a server-
  // side generate-everything call.
  useEffect(() => {
    const seed = takeVideoSeed();
    if (seed?.brief) {
      setBrief(seed.brief);
      ToastService.showToast(
        'Brief from your market opportunity is ready — review it and generate.',
        ToastTypeEnum.Success
      );
    }
  }, []);

  // Video generation state
  const [selectedOutcome, setSelectedOutcome] = useState('quick_video');
  const [outcomeSuggestionReason, setOutcomeSuggestionReason] = useState('');
  const [selectedVoice, setSelectedVoice] = useState('Sarah');
  const [videoJob, setVideoJob] = useState<VideoJob | null>(null);
  const [videoError, setVideoError] = useState('');
  // What the server says this video costs (see /video-quote), and whether the customer is about to confirm it.
  // quote.billing === 'off' (or no quote yet) means video is not charged and no price is shown.
  const [quote, setQuote] = useState<VideoQuote | null>(null);
  const [confirmingGenerate, setConfirmingGenerate] = useState(false);
  const [needsTopUp, setNeedsTopUp] = useState(false);
  // Writing the storyboard costs credits too: its price, what the last run was charged/refunded, and whether the
  // customer must top up. storyboardQuote.billing === 'off' (or no quote yet) means no price is shown.
  const [storyboardQuote, setStoryboardQuote] = useState<VideoQuote | null>(null);
  const [storyboardBilling, setStoryboardBilling] = useState<VideoJobBilling | null>(null);
  const [storyboardNeedsTopUp, setStoryboardNeedsTopUp] = useState(false);
  const { refreshCreditBalance } = useAuth();
  const router = useRouter();
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Frame image generation state
  const [frameMap, setFrameMap] = useState<Record<number, string>>({});
  const [frameError, setFrameError] = useState('');
  const framePollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const frameJobIdRef = useRef<string | null>(null);

  // Merge + draft state
  const [merging, setMerging] = useState(false);
  const [mergedUrl, setMergedUrl] = useState('');
  const [mergeError, setMergeError] = useState('');
  const [draftCaption, setDraftCaption] = useState('');
  const [captionGenerating, setCaptionGenerating] = useState(false);
  const [draftPlatforms, setDraftPlatforms] = useState<string[]>(['instagram_reels']);
  const [savingDraft, setSavingDraft] = useState(false);
  const [savedDraft, setSavedDraft] = useState<VideoDraft | null>(null);

  // Poll for job status while generating
  useEffect(() => {
    if (!videoJob || videoJob.status === 'complete' || videoJob.status === 'failed') {
      if (pollRef.current) clearInterval(pollRef.current);
      return;
    }
    pollRef.current = setInterval(async () => {
      try {
        const res = await SocialMediaAgentService.getVideoJob(videoJob.job_id);
        if (res.status && res.responseData) {
          setVideoJob(res.responseData);
          saveSession({ videoJob: res.responseData });
          if (res.responseData.status === 'complete' || res.responseData.status === 'failed') {
            if (pollRef.current) clearInterval(pollRef.current);
          }
        }
      } catch {
        /* keep polling */
      }
    }, 10000);
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, [videoJob?.job_id, videoJob?.status]);

  // Session persistence — lets every long-running step here (frame
  // generation, scene video generation, and the finished result once both
  // are done) survive a page refresh, a tab switch away from Create Content
  // and back, or opening a second browser tab, instead of losing track of
  // an in-progress or just-finished generation. Own key (not VideoStoryboard
  // Generator's 'uri:vsg:session') so the two flows never clobber each
  // other's saved state. Unlike that flow, this one keeps the session alive
  // THROUGH completion (merged video + caption included) rather than wiping
  // it the moment the video job finishes — the whole point is that coming
  // back later still shows the finished result, not just mid-flight
  // progress. Only cleared on a fresh brief generation or a successful
  // draft save (see call sites below), both natural end-of-session points.
  const SESSION_KEY = 'uri:dvg:session';

  type DVGSession = {
    storyboard: Storyboard | null;
    platform: string;
    duration: number;
    selectedOutcome: string;
    selectedVoice: string;
    storyboardJobId: string | null;
    frameJobId: string | null;
    frameMap: Record<number, string>;
    videoJob: VideoJob | null;
    mergedUrl: string;
    draftCaption: string;
  };

  // Merges into whatever's already stored rather than requiring every call
  // site to know the full current state — each step only ever has its own
  // slice in hand (e.g. the frame-poll tick doesn't know the video job).
  const saveSession = (patch: Partial<DVGSession>) => {
    try {
      const raw = localStorage.getItem(SESSION_KEY);
      const existing = raw ? JSON.parse(raw) : {};
      localStorage.setItem(SESSION_KEY, JSON.stringify({ ...existing, ...patch }));
    } catch {
      /* quota exceeded — ignore */
    }
  };

  const clearSession = () => {
    try {
      localStorage.removeItem(SESSION_KEY);
    } catch {
      /* ignore */
    }
  };

  // Restore on mount: static fields (storyboard, platform, duration, outcome,
  // voice, merged video, caption) come back immediately; an in-progress frame
  // job or video job also resumes real polling instead of just showing a
  // stale snapshot.
  useEffect(() => {
    try {
      const raw = localStorage.getItem(SESSION_KEY);
      if (!raw) return;
      const saved = JSON.parse(raw) as Partial<DVGSession>;
      if (!saved.storyboard && !saved.storyboardJobId) {
        clearSession();
        return;
      }

      if (saved.storyboard) setStoryboard(saved.storyboard);
      if (saved.platform) setPlatform(saved.platform);
      if (saved.duration) setDuration(saved.duration);
      if (saved.selectedOutcome) setSelectedOutcome(saved.selectedOutcome);
      if (saved.selectedVoice) setSelectedVoice(saved.selectedVoice);
      if (saved.mergedUrl) setMergedUrl(saved.mergedUrl);
      if (saved.draftCaption) setDraftCaption(saved.draftCaption);
      // Restored unconditionally, same as storyboard/platform above — once the
      // frame job finishes, frameJobId gets cleared from the session (nothing
      // left to poll for), but the actual completed images still need to come
      // back from SOMEWHERE on a later refresh, which is this.
      if (saved.frameMap) setFrameMap(saved.frameMap);

      if (saved.storyboardJobId && !saved.storyboard) {
        // Storyboard-script generation itself was still running when the page
        // was last open — resume waiting for it rather than leaving the form
        // looking idle while the backend job keeps working regardless.
        setLoading(true);
        pollStoryboardJob(saved.storyboardJobId).then((result) => {
          setLoading(false);
          if (result && result.status === 'complete' && result.storyboard) {
            setStoryboard(result.storyboard);
            const suggestion = suggestOutcome(result.storyboard);
            setSelectedOutcome(suggestion.outcome);
            setOutcomeSuggestionReason(suggestion.reason);
            saveSession({
              storyboard: result.storyboard,
              storyboardJobId: null,
              selectedOutcome: suggestion.outcome,
            });
            // images isn't restored from session (raw uploaded photos are
            // form input, not job state — see saveSession's own note on
            // scope) — a resume through this specific path loses reference-
            // image grounding for frame generation's first scene, degrading
            // to a from-scratch generation instead of a hard failure.
            SocialMediaAgentService.generateCreativeFrames(
              result.storyboard.scenes,
              images.map((img) => img.dataUrl)
            )
              .then((frameRes) => {
                if (frameRes.status && frameRes.responseData) {
                  frameJobIdRef.current = frameRes.responseData.job_id;
                  saveSession({ frameJobId: frameRes.responseData.job_id });
                  startFramePolling(frameRes.responseData.job_id);
                }
              })
              .catch(() => {});
          } else {
            setError((result && result.error) || 'Creative storyboard generation failed. Please try again.');
            saveSession({ storyboardJobId: null });
          }
        });
      }

      if (saved.frameJobId) {
        frameJobIdRef.current = saved.frameJobId;
        SocialMediaAgentService.getStoryboardFrameJob(saved.frameJobId)
          .then((res) => {
            if (res.status && res.responseData) {
              const map: Record<number, string> = {};
              for (const f of res.responseData.frames) {
                if (f.frame_image_url) map[f.scene_number] = f.frame_image_url;
              }
              setFrameMap(map);
              saveSession({ frameMap: map });
              if (res.responseData.status === 'complete') {
                saveSession({ frameJobId: null });
              } else {
                startFramePolling(saved.frameJobId!);
              }
            }
          })
          .catch(() => {});
      }

      if (saved.videoJob) {
        setVideoJob(saved.videoJob);
        if (saved.videoJob.job_id && saved.videoJob.status !== 'complete' && saved.videoJob.status !== 'failed') {
          // One eager fetch for an immediate up-to-date status; the poll
          // effect above takes over the recurring 10s interval once its own
          // [videoJob?.job_id, videoJob?.status] dependency changes.
          SocialMediaAgentService.getVideoJob(saved.videoJob.job_id)
            .then((res) => {
              if (res.status && res.responseData) {
                setVideoJob(res.responseData);
                saveSession({ videoJob: res.responseData });
              }
            })
            .catch(() => {});
        }
      }
    } catch {
      /* corrupted storage — ignore */
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const generateCaption = async () => {
    if (!storyboard) return;
    setCaptionGenerating(true);
    try {
      const mappedPlatform = platform.startsWith('instagram')
        ? 'instagram'
        : platform.startsWith('facebook')
          ? 'facebook'
          : platform.startsWith('tiktok')
            ? 'tiktok'
            : platform.startsWith('linkedin')
              ? 'linkedin'
              : 'instagram';
      const res = await SocialMediaAgentService.generateVideoCaption({
        storyboard: storyboard as unknown as Record<string, unknown>,
        platform: mappedPlatform,
      });
      if (res.status && res.responseData?.caption) {
        setDraftCaption(res.responseData.caption);
        saveSession({ draftCaption: res.responseData.caption });
      }
    } catch {
      /* silently fail — user can write caption manually */
    } finally {
      setCaptionGenerating(false);
    }
  };

  const handleMerge = async () => {
    if (!videoJob) return;
    setMerging(true);
    setMergeError('');
    setMergedUrl('');
    setSavedDraft(null);
    try {
      const res = await SocialMediaAgentService.mergeVideoJob(videoJob.job_id);
      if (res.status && res.responseData) {
        setMergedUrl(res.responseData.merged_video_url);
        saveSession({ mergedUrl: res.responseData.merged_video_url });
        generateCaption();
      } else {
        setMergeError(res.responseMessage || 'Merge failed. Please try again.');
      }
    } catch {
      setMergeError('Something went wrong during merge.');
    } finally {
      setMerging(false);
    }
  };

  const handleSaveDraft = async () => {
    if (!mergedUrl) return;
    setSavingDraft(true);
    try {
      const res = await SocialMediaAgentService.saveVideoDraft({
        merged_video_url: mergedUrl,
        caption: draftCaption,
        platforms: draftPlatforms,
      });
      if (res.status && res.responseData) {
        setSavedDraft(res.responseData);
        clearSession(); // draft saved — the flow is done, it now lives in the Drafts tab
      }
    } catch {
      setMergeError('Failed to save draft.');
    } finally {
      setSavingDraft(false);
    }
  };

  const togglePlatform = (p: string) =>
    setDraftPlatforms((prev) => (prev.includes(p) ? prev.filter((x) => x !== p) : [...prev, p]));

  const addFiles = (files: FileList | null) => {
    if (!files) return;
    const remaining = 5 - images.length;
    if (remaining <= 0) return;
    const accepted = Array.from(files)
      .filter((f) => f.type.startsWith('image/') && f.size <= 10 * 1024 * 1024)
      .slice(0, remaining);
    accepted.forEach((file) => {
      const reader = new FileReader();
      reader.onload = () => {
        setImages((prev) =>
          prev.length < 5 ? [...prev, { dataUrl: reader.result as string, name: file.name }] : prev
        );
        // A newly added image hasn't been covered by any prior confirmation.
        setConfirmedImageRights(false);
      };
      reader.readAsDataURL(file);
    });
  };

  const removeImage = (idx: number) => {
    setImages((prev) => prev.filter((_, i) => i !== idx));
    setConfirmedImageRights(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    addFiles(e.dataTransfer.files);
  };

  // Same timeout/escape-hatch pattern as VideoStoryboardGenerator's frame
  // polling — a stalled background job shouldn't spin silently forever.
  const MAX_FRAME_POLL_ATTEMPTS = 60;

  const startFramePolling = (jobId: string) => {
    if (framePollRef.current) clearInterval(framePollRef.current);
    let attempts = 0;
    framePollRef.current = setInterval(async () => {
      attempts += 1;
      try {
        const res = await SocialMediaAgentService.getStoryboardFrameJob(jobId);
        if (res.status && res.responseData) {
          const map: Record<number, string> = {};
          for (const f of res.responseData.frames) {
            if (f.frame_image_url) map[f.scene_number] = f.frame_image_url;
          }
          setFrameMap(map);
          saveSession({ frameMap: map });
          if (res.responseData.status === 'complete') {
            clearInterval(framePollRef.current!);
            saveSession({ frameJobId: null });
            return;
          }
        }
      } catch {
        /* keep polling — a single failed poll isn't reason to give up */
      }
      if (attempts >= MAX_FRAME_POLL_ATTEMPTS) {
        clearInterval(framePollRef.current!);
        setFrameError(
          'Frame generation is taking much longer than expected and may have stalled. ' +
            'Try generating the storyboard again — any scenes already shown above finished successfully.'
        );
      }
    }, 5000);
  };

  // Storyboard-script generation is job-based now (see generate_creative_
  // storyboard's own docstring in complete_social_manager.py) — this polls
  // it to completion. Shared by the interactive "just kicked it off, keep
  // the button's loading state until it's done" path in runStoryboardGeneration
  // below AND the mount-time restore effect above (resuming a job that was
  // still running when the page was last open) — same wait, two different
  // callers with different ideas of what to do once it resolves, so this
  // only returns the raw result rather than driving any UI state itself.
  const STORYBOARD_POLL_INTERVAL_MS = 3000;
  const MAX_STORYBOARD_POLL_ATTEMPTS = 40; // ~2 minutes
  const pollStoryboardJob = async (
    jobId: string
  ): Promise<{
    status: string;
    storyboard: Storyboard | null;
    error: string | null;
    billing?: VideoJobBilling;
  } | null> => {
    for (let attempt = 0; attempt < MAX_STORYBOARD_POLL_ATTEMPTS; attempt++) {
      try {
        const res = await SocialMediaAgentService.getCreativeStoryboardJob(jobId);
        if (
          res.status &&
          res.responseData &&
          (res.responseData.status === 'complete' || res.responseData.status === 'failed')
        ) {
          return res.responseData;
        }
      } catch {
        /* keep polling — a single failed poll isn't reason to give up */
      }
      await new Promise((resolve) => setTimeout(resolve, STORYBOARD_POLL_INTERVAL_MS));
    }
    return null; // timed out
  };

  // Shared by a fresh generation and a creative-direction-edit regeneration —
  // both end the same way: a new storyboard, then kick off frame generation
  // for its scenes. videoStyleOverride/creativeDirectionOverride are only
  // set on the regenerate path, to keep the same style and force the edited
  // direction instead of letting the model infer/rewrite either.
  const runStoryboardGeneration = async (opts?: {
    videoStyleOverride?: string;
    creativeDirectionOverride?: string;
  }): Promise<boolean> => {
    setError('');
    setStoryboardNeedsTopUp(false);
    setStoryboardBilling(null);
    // Only clear the storyboard on a fresh generation — a direction-edit
    // regeneration keeps the old one mounted (and with it, the Creative
    // Direction block's own edit/regenerate UI) until the new one replaces
    // it below, instead of the whole section disappearing mid-regenerate.
    if (!opts) {
      setStoryboard(null);
    }
    setVideoJob(null);
    setVideoError('');
    setFrameMap({});
    setFrameError('');
    setOutcomeSuggestionReason('');
    if (framePollRef.current) clearInterval(framePollRef.current);
    clearSession(); // starting over — any prior session is no longer the thing to resume
    try {
      // A fresh key for every deliberate click, so a repeated send is the same run, not a second charge.
      const idempotencyKey =
        typeof crypto !== 'undefined' && 'randomUUID' in crypto
          ? crypto.randomUUID()
          : `${Date.now()}-${Math.random()}`;
      const jobRes = await SocialMediaAgentService.generateCreativeStoryboard(
        {
          brief: brief.trim(),
          reference_images: images.map((img) => img.dataUrl),
          target_platform: platform,
          target_duration_seconds: duration,
          // video_style omitted on a fresh generation on purpose — the model
          // infers it from the brief itself; see the top-of-file comment.
          ...(opts?.videoStyleOverride ? { video_style: opts.videoStyleOverride } : {}),
          ...(opts?.creativeDirectionOverride ? { creative_direction_override: opts.creativeDirectionOverride } : {}),
        },
        idempotencyKey
      );
      if (!jobRes.status || !jobRes.responseData) {
        setError(jobRes.responseMessage || 'Creative storyboard generation failed. Please try again.');
        return false;
      }
      if (jobRes.responseData.billing) {
        setStoryboardBilling(jobRes.responseData.billing);
        void refreshCreditBalance(); // the header balance drops straight away
      }
      saveSession({ storyboardJobId: jobRes.responseData.job_id });
      const result = await pollStoryboardJob(jobRes.responseData.job_id);
      if (!result) {
        setError('Storyboard generation is taking much longer than expected. Please try again.');
        return false;
      }
      if (result.billing) {
        // What was charged and what came back (a failed run gives its credit back).
        setStoryboardBilling(result.billing);
        void refreshCreditBalance();
      }
      if (result.status === 'complete' && result.storyboard) {
        setStoryboard(result.storyboard);
        const suggestion = suggestOutcome(result.storyboard);
        setSelectedOutcome(suggestion.outcome);
        setOutcomeSuggestionReason(suggestion.reason);
        saveSession({
          storyboard: result.storyboard,
          platform,
          duration,
          selectedOutcome: suggestion.outcome,
          selectedVoice,
          storyboardJobId: null,
          frameJobId: null,
          frameMap: {},
          videoJob: null,
          mergedUrl: '',
          draftCaption: '',
        });
        SocialMediaAgentService.generateCreativeFrames(
          result.storyboard.scenes,
          images.map((img) => img.dataUrl)
        )
          .then((frameRes) => {
            if (frameRes.status && frameRes.responseData) {
              frameJobIdRef.current = frameRes.responseData.job_id;
              saveSession({ frameJobId: frameRes.responseData.job_id });
              startFramePolling(frameRes.responseData.job_id);
            }
          })
          .catch(() => {});
        return true;
      } else {
        setError(
          (result.error || 'Creative storyboard generation failed. Please try again.') +
            (result.billing && result.billing.credits_refunded > 0 ? ' Your credit was returned.' : '')
        );
        saveSession({ storyboardJobId: null });
        return false;
      }
    } catch (e) {
      // The server answers a refusal (not enough credits) with a message written for the customer.
      const status = (e as { response?: { status?: number } } | null)?.response?.status;
      const data = (e as { response?: { data?: { responseMessage?: unknown; detail?: unknown } } } | null)?.response
        ?.data;
      const message =
        (typeof data?.responseMessage === 'string' && data.responseMessage) ||
        (typeof data?.detail === 'string' && data.detail) ||
        'Something went wrong. Please try again.';
      setError(message);
      if (status === 402) {
        setStoryboardNeedsTopUp(true);
        void refreshCreditBalance();
      }
      return false;
    }
  };

  const handleGenerateStoryboard = async () => {
    if (!brief.trim()) return;
    if (images.length > 0 && !confirmedImageRights) return;
    setLoading(true);
    try {
      await runStoryboardGeneration();
    } finally {
      setLoading(false);
    }
  };

  const handleRegenerateWithDirection = async () => {
    if (!editedDirection.trim()) return;
    setRegeneratingDirection(true);
    try {
      const succeeded = await runStoryboardGeneration({
        videoStyleOverride: storyboard?.video_style,
        creativeDirectionOverride: editedDirection.trim(),
      });
      // Stay in edit mode on failure — the edited text (and the error above)
      // stay visible so the user can just retry instead of losing the edit.
      if (succeeded) {
        setEditingDirection(false);
      }
    } finally {
      setRegeneratingDirection(false);
    }
  };

  // The server answers a refusal with a message written for the customer (not enough credits, a video that is
  // too long): show that, not a generic failure.
  const startError = (e: unknown): string => {
    const data = (e as { response?: { data?: { responseMessage?: unknown; detail?: unknown } } } | null)?.response
      ?.data;
    if (typeof data?.responseMessage === 'string' && data.responseMessage) return data.responseMessage;
    if (typeof data?.detail === 'string' && data.detail) return data.detail;
    return 'Something went wrong starting video generation.';
  };

  const handleGenerateVideos = async () => {
    if (!storyboard) return;
    setVideoError('');
    setNeedsTopUp(false);
    setVideoJob(null);
    setMergedUrl('');
    setMergeError('');
    setSavedDraft(null);
    if (pollRef.current) clearInterval(pollRef.current);
    saveSession({ videoJob: null, mergedUrl: '', draftCaption: '' });
    try {
      const enrichedStoryboard = {
        ...storyboard,
        scenes: storyboard.scenes.map((s) => ({
          ...s,
          ...(frameMap[s.scene_number] ? { frame_image_url: frameMap[s.scene_number] } : {}),
        })),
      };
      // A fresh key for every deliberate click: if this request is sent twice (a double click, a retry after a
      // dropped connection) the server returns the first job instead of charging a second time.
      const idempotencyKey =
        typeof crypto !== 'undefined' && 'randomUUID' in crypto
          ? crypto.randomUUID()
          : `${Date.now()}-${Math.random()}`;
      const res = await SocialMediaAgentService.generateVideoFromStoryboard(
        {
          storyboard: enrichedStoryboard,
          brand_images: images.map((img) => img.dataUrl),
          outcome: selectedOutcome,
          ...(selectedOutcome === 'talking_dialogue' ? { avatar_voice: selectedVoice } : {}),
        },
        idempotencyKey
      );
      if (res.status && res.responseData) {
        setVideoJob(res.responseData);
        saveSession({ videoJob: res.responseData, selectedOutcome, selectedVoice });
        if (res.responseData.billing) void refreshCreditBalance(); // the header balance drops straight away
      } else {
        setVideoError(res.responseMessage || 'Could not start video generation.');
      }
    } catch (e) {
      const status = (e as { response?: { status?: number } } | null)?.response?.status;
      setVideoError(startError(e));
      if (status === 402) {
        setNeedsTopUp(true);
        void refreshCreditBalance();
      }
    }
  };

  // The price of writing a storyboard, asked on arrival and again after every run (the balance has moved).
  useEffect(() => {
    if (loading || regeneratingDirection) return;
    let alive = true;
    SocialMediaAgentService.getStoryboardQuote()
      .then((res) => {
        if (alive) setStoryboardQuote(res.status && res.responseData ? res.responseData : null);
      })
      .catch(() => {
        if (alive) setStoryboardQuote(null); // no price to show is better than a wrong one
      });
    return () => {
      alive = false;
    };
  }, [loading, regeneratingDirection, storyboardBilling?.credits_refunded]);

  // The price, kept in step with what is about to be rendered. Only the scene lengths matter to it (not the
  // images), so it is re-asked whenever the storyboard, the video type or a talking voice changes.
  useEffect(() => {
    if (!storyboard) {
      setQuote(null);
      return;
    }
    let alive = true;
    const timer = setTimeout(() => {
      SocialMediaAgentService.getVideoQuote({
        storyboard: {
          scenes: storyboard.scenes.map((sc) => ({
            scene_number: sc.scene_number,
            duration_seconds: sc.duration_seconds,
          })),
        },
        outcome: selectedOutcome,
        ...(selectedOutcome === 'talking_dialogue' ? { avatar_voice: selectedVoice } : {}),
      })
        .then((res) => {
          if (alive) setQuote(res.status && res.responseData ? res.responseData : null);
        })
        .catch(() => {
          if (alive) setQuote(null); // no price to show is better than a wrong one
        });
    }, 250);
    return () => {
      alive = false;
      clearTimeout(timer);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [storyboard, selectedOutcome, selectedVoice, videoJob?.status]);

  // Once a charged job ends, what came back is on the job: refresh the header balance to match.
  const settledRef = useRef<string | null>(null);
  useEffect(() => {
    if (!videoJob?.billing || (videoJob.status !== 'complete' && videoJob.status !== 'failed')) return;
    if (settledRef.current === videoJob.job_id) return;
    settledRef.current = videoJob.job_id;
    void refreshCreditBalance();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [videoJob?.status, videoJob?.billing?.credits_refunded]);

  const storyboardPriced = storyboardQuote?.billing === 'on' && typeof storyboardQuote.credits_required === 'number';
  const storyboardCantAfford = storyboardPriced && storyboardQuote?.sufficient === false;
  const storyboardPriceTag = storyboardPriced
    ? ` · ${storyboardQuote!.credits_required} credit` + (storyboardQuote!.credits_required === 1 ? '' : 's')
    : '';
  const priced = quote?.billing === 'on' && typeof quote.credits_required === 'number';
  const cantAfford = priced && quote?.sufficient === false;
  const creditWord = (n: number) => `${n} credit${n === 1 ? '' : 's'}`;

  const clipMap: Record<number, VideoClip> = {};
  (videoJob?.clips ?? []).forEach((c) => {
    clipMap[c.scene_number] = c;
  });

  return (
    <div style={{ padding: '20px 0', maxWidth: 720, margin: '0 auto' }}>
      {/* The brief — primary input for this flow */}
      <Section
        title="What's the video about?"
        subtitle="Describe the story, product, or message — this drives everything below"
      >
        <textarea
          value={brief}
          onChange={(e) => setBrief(e.target.value)}
          placeholder="e.g. A founder explains why they built this product, speaking directly to camera, ending with a confident call to action."
          rows={4}
          maxLength={2000}
          style={{
            width: '100%',
            border: `1.5px solid ${BORDER}`,
            borderRadius: 10,
            padding: '10px 12px',
            fontSize: 13.5,
            color: DARK,
            resize: 'vertical',
            fontFamily: 'inherit',
            outline: 'none',
            boxSizing: 'border-box',
            background: '#fff',
          }}
        />
        <p style={{ fontSize: 11, color: '#9CA3AF', margin: '4px 0 0', textAlign: 'right' }}>{brief.length}/2000</p>
      </Section>

      {/* Optional reference images */}
      <Section
        title="Reference Images (optional)"
        subtitle="Upload up to 5 if you want the video grounded in real photos — otherwise it's generated entirely from the brief"
      >
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setDragging(true);
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={handleDrop}
          onClick={() => images.length < 5 && fileInputRef.current?.click()}
          style={{
            border: `2px dashed ${dragging ? PRIMARY : BORDER}`,
            borderRadius: 12,
            padding: '24px 16px',
            textAlign: 'center',
            cursor: images.length < 5 ? 'pointer' : 'default',
            background: dragging ? '#FFF0F8' : LIGHT,
            transition: 'all .15s',
            marginBottom: images.length ? 14 : 0,
          }}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            style={{ display: 'none' }}
            onChange={(e) => {
              addFiles(e.target.files);
              e.target.value = '';
            }}
          />
          <div style={{ fontSize: 28, marginBottom: 6 }}>📷</div>
          <p style={{ fontSize: 13.5, fontWeight: 600, color: DARK, margin: 0 }}>
            {images.length >= 5 ? 'Maximum 5 images reached' : 'Drag & drop or click to upload (optional)'}
          </p>
          <p style={{ fontSize: 12, color: GREY, margin: '4px 0 0' }}>
            PNG, JPG, WEBP — up to 10 MB each · {images.length}/5 uploaded
          </p>
        </div>

        {images.length > 0 && (
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            {images.map((img, i) => (
              <div
                key={i}
                style={{
                  position: 'relative',
                  width: 90,
                  height: 90,
                  borderRadius: 10,
                  overflow: 'hidden',
                  border: `1.5px solid ${BORDER}`,
                  flexShrink: 0,
                }}
              >
                <img
                  src={img.dataUrl}
                  alt={img.name}
                  style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                />
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    removeImage(i);
                  }}
                  style={{
                    position: 'absolute',
                    bottom: 4,
                    right: 4,
                    width: 20,
                    height: 20,
                    borderRadius: 99,
                    background: 'rgba(0,0,0,.6)',
                    border: 'none',
                    color: '#fff',
                    fontSize: 11,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    lineHeight: 1,
                  }}
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        )}

        {images.length > 0 && (
          <label
            style={{
              display: 'flex',
              alignItems: 'flex-start',
              gap: 8,
              marginTop: 14,
              padding: '10px 12px',
              borderRadius: 10,
              background: confirmedImageRights ? '#F0FDF4' : '#FFF7ED',
              border: `1px solid ${confirmedImageRights ? '#86EFAC' : '#FDBA74'}`,
              cursor: 'pointer',
            }}
          >
            <input
              type="checkbox"
              checked={confirmedImageRights}
              onChange={(e) => setConfirmedImageRights(e.target.checked)}
              style={{ marginTop: 2, flexShrink: 0, width: 15, height: 15, cursor: 'pointer' }}
            />
            <span style={{ fontSize: 12, color: DARK, lineHeight: 1.5 }}>
              I confirm I have the legal right to use the image{images.length > 1 ? 's' : ''} uploaded above, and
              permission to process {images.length > 1 ? 'them' : 'it'} with AI.
            </span>
          </label>
        )}
      </Section>

      {/* Platform + Duration */}
      <Section title="Video Settings" subtitle="Platform and target duration">
        <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
          <div style={{ flex: 1, minWidth: 180 }}>
            <label style={{ fontSize: 12, fontWeight: 600, color: GREY, display: 'block', marginBottom: 6 }}>
              Platform
            </label>
            <select
              value={platform}
              onChange={(e) => setPlatform(e.target.value)}
              style={{
                width: '100%',
                border: `1.5px solid ${BORDER}`,
                borderRadius: 8,
                padding: '8px 10px',
                fontSize: 13.5,
                color: DARK,
                background: '#fff',
                outline: 'none',
                fontFamily: 'inherit',
                cursor: 'pointer',
              }}
            >
              {PLATFORMS.map((p) => (
                <option key={p.value} value={p.value}>
                  {p.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label style={{ fontSize: 12, fontWeight: 600, color: GREY, display: 'block', marginBottom: 6 }}>
              Duration
            </label>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              {DURATIONS.map((d) => (
                <button
                  key={d.value}
                  onClick={() => setDuration(d.value)}
                  style={{
                    padding: '7px 14px',
                    borderRadius: 8,
                    border: `1.5px solid ${duration === d.value ? PRIMARY : BORDER}`,
                    background: duration === d.value ? '#FFF0F8' : '#fff',
                    color: duration === d.value ? PRIMARY : GREY,
                    fontWeight: duration === d.value ? 700 : 500,
                    fontSize: 13,
                    cursor: 'pointer',
                    fontFamily: 'inherit',
                    transition: 'all .15s',
                  }}
                >
                  {d.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </Section>

      {error && (
        <div
          style={{
            background: '#FEF2F2',
            border: '1px solid #FECACA',
            borderRadius: 10,
            padding: '10px 14px',
            marginBottom: 16,
          }}
        >
          <p style={{ fontSize: 13, color: '#DC2626', margin: 0 }}>{error}</p>
          {storyboardNeedsTopUp && (
            <button
              onClick={() => router.push('/workspace/?tab=billing&billing=buy-credits')}
              style={{
                marginTop: 8,
                background: PRIMARY,
                color: '#fff',
                border: 'none',
                borderRadius: 8,
                padding: '7px 14px',
                fontSize: 12.5,
                fontWeight: 700,
                cursor: 'pointer',
                fontFamily: 'inherit',
              }}
            >
              Top up credits
            </button>
          )}
        </div>
      )}

      {(() => {
        const needsRightsConfirm = images.length > 0 && !confirmedImageRights;
        const isDisabled = !brief.trim() || loading || needsRightsConfirm || storyboardCantAfford;
        return (
          <button
            onClick={handleGenerateStoryboard}
            disabled={isDisabled}
            title={needsRightsConfirm ? 'Confirm you have the rights to the uploaded image(s) above first' : ''}
            style={{
              width: '100%',
              padding: '13px 0',
              borderRadius: 10,
              background: isDisabled ? '#E5E7EB' : PRIMARY,
              color: isDisabled ? '#9CA3AF' : '#fff',
              border: 'none',
              fontSize: 14,
              fontWeight: 700,
              cursor: isDisabled ? 'not-allowed' : 'pointer',
              fontFamily: 'inherit',
              transition: 'background .15s',
              marginBottom: 28,
            }}
          >
            {loading
              ? 'Writing creative direction & script…'
              : needsRightsConfirm
                ? 'Confirm image rights above to continue'
                : storyboardCantAfford
                  ? `Not enough credits${storyboardPriceTag ? ` (needs ${storyboardQuote!.credits_required})` : ''}`
                  : `Generate Storyboard${storyboardPriceTag}`}
          </button>
        );
      })()}

      {loading && <Spinner label="Inventing the creative concept and scene-by-scene script…" />}

      {storyboard && !loading && (
        <>
          {storyboardBilling && storyboardBilling.mode === 'on' && storyboardBilling.credits_charged > 0 && (
            <p data-testid="storyboard-billing-result" style={{ fontSize: 12.5, color: GREY, margin: '0 0 12px' }}>
              {storyboardBilling.credits_charged - storyboardBilling.credits_refunded} credit
              {storyboardBilling.credits_charged - storyboardBilling.credits_refunded === 1 ? '' : 's'} used for this
              storyboard
            </p>
          )}
          {storyboard.creative_direction && (
            <div
              style={{
                background: '#FFF0F8',
                border: `1px solid #FBCFE8`,
                borderRadius: 10,
                padding: '14px 16px',
                marginBottom: 16,
              }}
            >
              <div
                style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', margin: '0 0 6px' }}
              >
                <p
                  style={{
                    fontSize: 10.5,
                    fontWeight: 700,
                    color: PRIMARY,
                    textTransform: 'uppercase',
                    letterSpacing: 0.5,
                    margin: 0,
                  }}
                >
                  Creative Direction
                </p>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  {storyboard.video_style && (
                    <span
                      style={{
                        fontSize: 10.5,
                        fontWeight: 700,
                        color: PRIMARY,
                        background: '#fff',
                        border: `1px solid #FBCFE8`,
                        borderRadius: 99,
                        padding: '2px 10px',
                      }}
                    >
                      Style:{' '}
                      {VIDEO_STYLES.find((s) => s.slug === storyboard.video_style)?.name ?? storyboard.video_style}
                    </span>
                  )}
                  {!editingDirection && !regeneratingDirection && (
                    <button
                      onClick={() => {
                        setEditedDirection(storyboard.creative_direction || '');
                        setEditingDirection(true);
                      }}
                      style={{
                        fontSize: 10.5,
                        fontWeight: 700,
                        color: PRIMARY,
                        background: 'transparent',
                        border: 'none',
                        cursor: 'pointer',
                        padding: 0,
                        fontFamily: 'inherit',
                      }}
                    >
                      ✎ Edit
                    </button>
                  )}
                </div>
              </div>

              {editingDirection ? (
                <div>
                  <textarea
                    value={editedDirection}
                    onChange={(e) => setEditedDirection(e.target.value)}
                    rows={4}
                    maxLength={2000}
                    disabled={regeneratingDirection}
                    style={{
                      width: '100%',
                      border: `1.5px solid ${BORDER}`,
                      borderRadius: 8,
                      padding: '8px 10px',
                      fontSize: 13,
                      color: DARK,
                      resize: 'vertical',
                      fontFamily: 'inherit',
                      outline: 'none',
                      boxSizing: 'border-box',
                      background: regeneratingDirection ? '#F9FAFB' : '#fff',
                      marginBottom: 8,
                    }}
                  />
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button
                      onClick={handleRegenerateWithDirection}
                      disabled={!editedDirection.trim() || regeneratingDirection || storyboardCantAfford}
                      style={{
                        padding: '7px 14px',
                        borderRadius: 8,
                        border: 'none',
                        background:
                          !editedDirection.trim() || regeneratingDirection || storyboardCantAfford
                            ? '#E5E7EB'
                            : PRIMARY,
                        color:
                          !editedDirection.trim() || regeneratingDirection || storyboardCantAfford ? '#9CA3AF' : '#fff',
                        fontSize: 12.5,
                        fontWeight: 700,
                        cursor:
                          !editedDirection.trim() || regeneratingDirection || storyboardCantAfford
                            ? 'not-allowed'
                            : 'pointer',
                        fontFamily: 'inherit',
                      }}
                    >
                      {regeneratingDirection
                        ? 'Regenerating scenes…'
                        : `Regenerate with this direction${storyboardPriceTag}`}
                    </button>
                    {!regeneratingDirection && (
                      <button
                        onClick={() => setEditingDirection(false)}
                        style={{
                          padding: '7px 14px',
                          borderRadius: 8,
                          border: `1.5px solid ${BORDER}`,
                          background: '#fff',
                          color: GREY,
                          fontSize: 12.5,
                          fontWeight: 600,
                          cursor: 'pointer',
                          fontFamily: 'inherit',
                        }}
                      >
                        Cancel
                      </button>
                    )}
                  </div>
                  {regeneratingDirection && (
                    <p style={{ fontSize: 11, color: GREY, margin: '8px 0 0' }}>
                      Rewriting the script to match this direction — new scenes and images are coming.
                    </p>
                  )}
                </div>
              ) : (
                <p style={{ fontSize: 13, color: DARK, margin: 0, lineHeight: 1.6 }}>{storyboard.creative_direction}</p>
              )}
            </div>
          )}

          {frameError && (
            <div
              style={{
                background: '#FEF2F2',
                border: '1px solid #FECACA',
                borderRadius: 10,
                padding: '10px 14px',
                marginBottom: 14,
              }}
            >
              <p style={{ fontSize: 13, color: '#DC2626', margin: 0 }}>{frameError}</p>
            </div>
          )}
          <StoryboardResult storyboard={storyboard} clipMap={clipMap} frameMap={frameMap} />

          {/* Video generation section — identical pattern to VideoStoryboardGenerator's,
              since it talks to the exact same outcome-routed pipeline underneath. */}
          <div style={{ marginTop: 24, paddingTop: 24, borderTop: `1px solid ${BORDER}` }}>
            {videoError && (
              <div
                style={{
                  background: '#FEF2F2',
                  border: '1px solid #FECACA',
                  borderRadius: 10,
                  padding: '10px 14px',
                  marginBottom: 14,
                }}
              >
                <p style={{ fontSize: 13, color: '#DC2626', margin: 0 }}>{videoError}</p>
                {needsTopUp && (
                  <button
                    onClick={() => router.push('/workspace/?tab=billing&billing=buy-credits')}
                    style={{
                      marginTop: 8,
                      background: PRIMARY,
                      color: '#fff',
                      border: 'none',
                      borderRadius: 8,
                      padding: '7px 14px',
                      fontSize: 12.5,
                      fontWeight: 700,
                      cursor: 'pointer',
                      fontFamily: 'inherit',
                    }}
                  >
                    Top up credits
                  </button>
                )}
              </div>
            )}

            {/* What this video cost and what came back. Customers see credits; the dollar cost and model names
                below are an internal readout, so they are shown only while video is not being charged. */}
            {videoJob?.billing && (videoJob.status === 'complete' || videoJob.status === 'failed') && (
              <div
                data-testid="video-billing-result"
                style={{
                  background: LIGHT,
                  border: `1px solid ${BORDER}`,
                  borderRadius: 10,
                  padding: '10px 14px',
                  marginBottom: 16,
                  fontSize: 13,
                  color: DARK,
                }}
              >
                {videoJob.billing.credits_charged > 0 ? (
                  <>
                    <strong>{creditWord(videoJob.billing.credits_charged - videoJob.billing.credits_refunded)}</strong>{' '}
                    used
                    {videoJob.billing.credits_refunded > 0 && (
                      <span style={{ color: GREY }}>
                        {' '}
                        · {creditWord(videoJob.billing.credits_refunded)} returned for scenes we couldn't deliver
                      </span>
                    )}
                  </>
                ) : (
                  <span style={{ color: GREY }}>No credits were used for this video.</span>
                )}
                {videoJob.billing.status === 'refund_failed' && (
                  <p style={{ fontSize: 12, color: '#B45309', margin: '4px 0 0' }}>
                    We couldn't return your credits automatically. Our team has been alerted and will sort it out.
                  </p>
                )}
              </div>
            )}

            {videoJob?.status === 'complete' &&
              !videoJob.billing &&
              (() => {
                const costed = videoJob.clips.filter((c) => c.cost_usd != null);
                if (costed.length === 0) return null;
                const total = costed.reduce((sum, c) => sum + (c.cost_usd ?? 0), 0);
                const outcomeLabel =
                  VIDEO_OUTCOMES.find((o) => o.value === videoJob.outcome)?.label ?? videoJob.outcome;
                const routedModels = Array.from(
                  new Set(videoJob.clips.map((c) => c.routed_model).filter((m): m is string => !!m))
                );
                const anyFallback = videoJob.clips.some((c) => c.fallback_used);
                return (
                  <div
                    style={{
                      background: LIGHT,
                      border: `1px solid ${BORDER}`,
                      borderRadius: 10,
                      padding: '10px 14px',
                      marginBottom: 16,
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: 12.5, color: GREY }}>
                        {outcomeLabel} · {costed.length}/{videoJob.clips.length} clip
                        {videoJob.clips.length === 1 ? '' : 's'} costed
                      </span>
                      <span style={{ fontSize: 14, fontWeight: 700, color: DARK }}>~${total.toFixed(3)}</span>
                    </div>
                    {routedModels.length > 0 && (
                      <p style={{ fontSize: 10.5, color: '#9CA3AF', margin: '4px 0 0' }}>
                        Routed to: {routedModels.map((m) => MODEL_LABELS[m] ?? m).join(', ')}
                        {anyFallback ? ' (fallback used on at least one clip)' : ''}
                      </p>
                    )}
                  </div>
                );
              })()}

            {videoJob && videoJob.status !== 'complete' && videoJob.status !== 'failed' && (
              <div
                style={{
                  background: '#FFF0F8',
                  border: `1px solid ${BORDER}`,
                  borderRadius: 12,
                  padding: '14px 16px',
                  marginBottom: 16,
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                  <div
                    style={{
                      width: 18,
                      height: 18,
                      border: `2.5px solid ${BORDER}`,
                      borderTopColor: PRIMARY,
                      borderRadius: 99,
                      animation: 'spin 0.8s linear infinite',
                      flexShrink: 0,
                    }}
                  />
                  <p style={{ fontSize: 13, fontWeight: 600, color: DARK, margin: 0 }}>
                    Generating Scene {videoJob.current_scene} of {videoJob.total_scenes}…
                  </p>
                </div>
                <div style={{ height: 6, background: BORDER, borderRadius: 99, overflow: 'hidden' }}>
                  <div
                    style={{
                      height: '100%',
                      background: PRIMARY,
                      borderRadius: 99,
                      width: `${Math.round(((videoJob.clips?.length ?? 0) / videoJob.total_scenes) * 100)}%`,
                      transition: 'width .4s ease',
                    }}
                  />
                </div>
                {videoJob.current_scene_status ? (
                  <p style={{ fontSize: 11, color: GREY, margin: '6px 0 0' }}>
                    {videoJob.current_scene_status.model_label}:{' '}
                    {videoJob.current_scene_status.state === 'Queued'
                      ? `in queue${videoJob.current_scene_status.position != null ? ` (position ${videoJob.current_scene_status.position})` : ''}`
                      : 'processing'}{' '}
                    · {videoJob.current_scene_status.elapsed_seconds}s elapsed
                    {videoJob.current_scene_status.model_label === 'Talking Avatar'
                      ? ' — this model can take several minutes'
                      : ''}
                  </p>
                ) : (
                  <p style={{ fontSize: 11, color: GREY, margin: '6px 0 0' }}>
                    Each scene takes ~30–90 seconds. This page will update automatically.
                  </p>
                )}
                <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
              </div>
            )}

            {videoJob?.status === 'failed' && (
              <div
                style={{
                  background: '#FEF2F2',
                  border: '1px solid #FECACA',
                  borderRadius: 10,
                  padding: '10px 14px',
                  marginBottom: 14,
                }}
              >
                <p style={{ fontSize: 13, color: '#DC2626', margin: 0 }}>Video generation failed: {videoJob.error}</p>
              </div>
            )}

            {(!videoJob || videoJob.status === 'complete' || videoJob.status === 'failed') && (
              <>
                {outcomeSuggestionReason && (
                  <div
                    style={{
                      background: '#FFF0F8',
                      border: `1px solid #FBCFE8`,
                      borderRadius: 10,
                      padding: '10px 14px',
                      marginBottom: 14,
                    }}
                  >
                    <p style={{ fontSize: 12.5, color: DARK, margin: 0, lineHeight: 1.5 }}>
                      <span style={{ fontWeight: 700, color: PRIMARY }}>
                        ✦ Suggested: {VIDEO_OUTCOMES.find((o) => o.value === selectedOutcome)?.label ?? selectedOutcome}
                      </span>{' '}
                      — {outcomeSuggestionReason}
                    </p>
                  </div>
                )}
                <div style={{ marginBottom: 16 }}>
                  <p
                    style={{
                      fontSize: 12,
                      fontWeight: 600,
                      color: GREY,
                      margin: '0 0 8px',
                      textTransform: 'uppercase',
                      letterSpacing: 0.5,
                    }}
                  >
                    Video Outcome
                  </p>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 8 }}>
                    {VIDEO_OUTCOMES.map((o) => {
                      const active = selectedOutcome === o.value;
                      const framesReady = storyboard ? storyboard.scenes.every((s) => frameMap[s.scene_number]) : false;
                      const blocked = !framesReady;
                      return (
                        <button
                          key={o.value}
                          onClick={() => !blocked && setSelectedOutcome(o.value)}
                          title={blocked ? 'Waiting for storyboard frames to finish generating…' : ''}
                          style={{
                            padding: '10px 8px',
                            borderRadius: 10,
                            border: `2px solid ${active ? PRIMARY : blocked ? '#E5E7EB' : BORDER}`,
                            background: active ? '#FFF0F8' : blocked ? '#F9FAFB' : '#fff',
                            color: active ? PRIMARY : blocked ? '#9CA3AF' : DARK,
                            fontWeight: active ? 700 : 500,
                            fontSize: 12.5,
                            textAlign: 'left',
                            cursor: blocked ? 'not-allowed' : 'pointer',
                            fontFamily: 'inherit',
                            transition: 'all .15s',
                            opacity: blocked ? 0.6 : 1,
                          }}
                        >
                          {o.label}
                          {!blocked && (
                            <span
                              style={{
                                display: 'block',
                                fontSize: 9.5,
                                color: active ? PRIMARY : '#9CA3AF',
                                marginTop: 2,
                                fontWeight: 400,
                                opacity: 0.85,
                              }}
                            >
                              {o.description}
                            </span>
                          )}
                          {blocked && (
                            <span
                              style={{
                                display: 'block',
                                fontSize: 9.5,
                                color: '#9CA3AF',
                                marginTop: 2,
                                fontWeight: 400,
                              }}
                            >
                              frames generating…
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {selectedOutcome === 'talking_dialogue' && (
                  <div style={{ marginBottom: 16 }}>
                    <p
                      style={{
                        fontSize: 12,
                        fontWeight: 600,
                        color: GREY,
                        margin: '0 0 8px',
                        textTransform: 'uppercase',
                        letterSpacing: 0.5,
                      }}
                    >
                      Avatar Voice
                    </p>
                    <AvatarVoicePicker value={selectedVoice} onChange={setSelectedVoice} />
                    {storyboard && !storyboard.scenes.some((s) => s.dialogue) && (
                      <p style={{ fontSize: 11, color: '#B45309', margin: '6px 0 0' }}>
                        This script has no scripted dialogue yet — describe a speaking person in your brief (or pick
                        "Testimonial Style") and regenerate the storyboard, or clips will fall back to reading their
                        on-screen text/prompt aloud.
                      </p>
                    )}
                  </div>
                )}
              </>
            )}

            {(!videoJob || videoJob.status === 'complete' || videoJob.status === 'failed') && (
              <>
                {priced && (
                  <div
                    data-testid="video-price"
                    style={{
                      background: cantAfford ? '#FEF2F2' : LIGHT,
                      border: `1px solid ${cantAfford ? '#FECACA' : BORDER}`,
                      borderRadius: 10,
                      padding: '10px 14px',
                      marginBottom: 12,
                      fontSize: 13,
                      color: DARK,
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
                      <span>
                        This video costs <strong>{creditWord(quote!.credits_required!)}</strong>
                      </span>
                      {typeof quote?.balance === 'number' && (
                        <span style={{ color: GREY }}>
                          Your balance: {quote.balance.toLocaleString()}
                          {!cantAfford &&
                            typeof quote.balance_after === 'number' &&
                            ` → ${quote.balance_after.toLocaleString()}`}
                        </span>
                      )}
                    </div>
                    {cantAfford ? (
                      <div style={{ marginTop: 6, display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                        <span style={{ color: '#DC2626' }}>You don't have enough credits for this video.</span>
                        <button
                          onClick={() => router.push('/workspace/?tab=billing&billing=buy-credits')}
                          style={{
                            background: PRIMARY,
                            color: '#fff',
                            border: 'none',
                            borderRadius: 8,
                            padding: '6px 12px',
                            fontSize: 12.5,
                            fontWeight: 700,
                            cursor: 'pointer',
                            fontFamily: 'inherit',
                          }}
                        >
                          Top up credits
                        </button>
                      </div>
                    ) : (
                      <p style={{ fontSize: 11.5, color: GREY, margin: '4px 0 0' }}>
                        Credits for any scene we can't deliver are returned automatically.
                      </p>
                    )}
                  </div>
                )}
                <button
                  onClick={() => (priced ? setConfirmingGenerate(true) : handleGenerateVideos())}
                  disabled={(!!videoJob && videoJob.status === 'generating') || cantAfford}
                  style={{
                    width: '100%',
                    padding: '13px 0',
                    borderRadius: 10,
                    background: cantAfford ? '#D1D5DB' : PRIMARY,
                    color: '#fff',
                    border: 'none',
                    fontSize: 14,
                    fontWeight: 700,
                    cursor: cantAfford ? 'not-allowed' : 'pointer',
                    fontFamily: 'inherit',
                  }}
                >
                  {videoJob?.status === 'complete' ? 'Regenerate Videos' : 'Generate Videos'}
                  {priced && ` · ${creditWord(quote!.credits_required!)}`}
                </button>
                <ConfirmDialog
                  isOpen={confirmingGenerate}
                  title="Generate this video?"
                  message={
                    priced
                      ? `This will use ${creditWord(quote!.credits_required!)}${
                          typeof quote?.balance_after === 'number'
                            ? `, leaving you ${quote.balance_after.toLocaleString()}`
                            : ''
                        }. Credits for any scene we can't deliver are returned automatically.`
                      : ''
                  }
                  confirmText="Generate"
                  cancelText="Not yet"
                  confirmColor={PRIMARY}
                  onConfirm={() => void handleGenerateVideos()}
                  onCancel={() => setConfirmingGenerate(false)}
                />
              </>
            )}

            {/* Merge + Save Draft */}
            {videoJob?.status === 'complete' && (
              <div style={{ marginTop: 24, paddingTop: 24, borderTop: `1px solid ${BORDER}` }}>
                {mergeError && (
                  <div
                    style={{
                      background: '#FEF2F2',
                      border: '1px solid #FECACA',
                      borderRadius: 10,
                      padding: '10px 14px',
                      marginBottom: 14,
                    }}
                  >
                    <p style={{ fontSize: 13, color: '#DC2626', margin: 0 }}>{mergeError}</p>
                  </div>
                )}

                {!mergedUrl && (
                  <button
                    onClick={handleMerge}
                    disabled={merging}
                    style={{
                      width: '100%',
                      padding: '13px 0',
                      borderRadius: 10,
                      background: merging ? '#E5E7EB' : '#0d0e0f',
                      color: merging ? '#9CA3AF' : '#fff',
                      border: 'none',
                      fontSize: 14,
                      fontWeight: 700,
                      cursor: merging ? 'not-allowed' : 'pointer',
                      fontFamily: 'inherit',
                    }}
                  >
                    {merging ? 'Merging clips…' : 'Merge Clips into Single Video'}
                  </button>
                )}

                {mergedUrl && (
                  <div style={{ marginTop: 4 }}>
                    <p style={{ fontSize: 13.5, fontWeight: 700, color: DARK, margin: '0 0 10px' }}>Merged Video</p>
                    <video
                      src={mergedUrl}
                      controls
                      playsInline
                      style={{
                        width: '100%',
                        borderRadius: 10,
                        maxHeight: 480,
                        display: 'block',
                        background: '#000',
                        marginBottom: 16,
                      }}
                    />
                    <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 20 }}>
                      <a
                        href={mergedUrl}
                        download="merged-video.mp4"
                        style={{ fontSize: 12, color: GREY, fontWeight: 600, textDecoration: 'none' }}
                      >
                        Download
                      </a>
                    </div>

                    {savedDraft ? (
                      <div
                        style={{
                          background: '#F0FDF4',
                          border: '1px solid #86EFAC',
                          borderRadius: 10,
                          padding: '12px 14px',
                        }}
                      >
                        <p style={{ fontSize: 13, fontWeight: 700, color: '#16a34a', margin: 0 }}>
                          Draft saved successfully
                        </p>
                        <p style={{ fontSize: 12, color: GREY, margin: '4px 0 0' }}>
                          Find it in the Drafts tab, where you can review, schedule and post it.
                        </p>
                        {onGoToDrafts && (
                          <button
                            onClick={onGoToDrafts}
                            style={{
                              marginTop: 10,
                              background: PRIMARY,
                              color: '#fff',
                              border: 'none',
                              borderRadius: 8,
                              padding: '8px 16px',
                              fontSize: 12.5,
                              fontWeight: 700,
                              cursor: 'pointer',
                              fontFamily: 'inherit',
                            }}
                          >
                            Go to Drafts
                          </button>
                        )}
                      </div>
                    ) : (
                      <div style={{ border: `1.5px solid ${BORDER}`, borderRadius: 12, padding: '16px' }}>
                        <p style={{ fontSize: 13.5, fontWeight: 700, color: DARK, margin: '0 0 12px' }}>
                          Save as Draft
                        </p>

                        <div
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            marginBottom: 6,
                          }}
                        >
                          <label style={{ fontSize: 12, fontWeight: 600, color: GREY }}>Caption</label>
                          <button
                            onClick={generateCaption}
                            disabled={captionGenerating || !storyboard}
                            style={{
                              padding: '4px 10px',
                              borderRadius: 6,
                              border: `1.5px solid ${PRIMARY}`,
                              background: 'transparent',
                              color: captionGenerating ? GREY : PRIMARY,
                              fontSize: 11.5,
                              fontWeight: 600,
                              cursor: captionGenerating || !storyboard ? 'not-allowed' : 'pointer',
                              fontFamily: 'inherit',
                              opacity: captionGenerating || !storyboard ? 0.5 : 1,
                            }}
                          >
                            {captionGenerating ? 'Generating…' : '✦ Regenerate'}
                          </button>
                        </div>
                        <textarea
                          value={captionGenerating ? '' : draftCaption}
                          onChange={(e) => setDraftCaption(e.target.value)}
                          placeholder={
                            captionGenerating ? 'Generating caption with AI…' : 'Write a caption for this video…'
                          }
                          rows={4}
                          maxLength={2200}
                          disabled={captionGenerating}
                          style={{
                            width: '100%',
                            border: `1.5px solid ${BORDER}`,
                            borderRadius: 8,
                            padding: '10px 12px',
                            fontSize: 13.5,
                            color: DARK,
                            resize: 'vertical',
                            fontFamily: 'inherit',
                            outline: 'none',
                            boxSizing: 'border-box',
                            marginBottom: 14,
                            background: captionGenerating ? '#F9FAFB' : '#fff',
                          }}
                        />

                        <label
                          style={{ fontSize: 12, fontWeight: 600, color: GREY, display: 'block', marginBottom: 8 }}
                        >
                          Platforms
                        </label>
                        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 16 }}>
                          {PLATFORMS.map((p) => {
                            const active = draftPlatforms.includes(p.value);
                            return (
                              <button
                                key={p.value}
                                onClick={() => togglePlatform(p.value)}
                                style={{
                                  padding: '6px 14px',
                                  borderRadius: 8,
                                  border: `1.5px solid ${active ? PRIMARY : BORDER}`,
                                  background: active ? '#FFF0F8' : '#fff',
                                  color: active ? PRIMARY : GREY,
                                  fontWeight: active ? 700 : 500,
                                  fontSize: 12.5,
                                  cursor: 'pointer',
                                  fontFamily: 'inherit',
                                }}
                              >
                                {p.label}
                              </button>
                            );
                          })}
                        </div>

                        <button
                          onClick={handleSaveDraft}
                          disabled={savingDraft || draftPlatforms.length === 0}
                          style={{
                            width: '100%',
                            padding: '11px 0',
                            borderRadius: 10,
                            background: savingDraft || draftPlatforms.length === 0 ? '#E5E7EB' : PRIMARY,
                            color: savingDraft || draftPlatforms.length === 0 ? '#9CA3AF' : '#fff',
                            border: 'none',
                            fontSize: 13.5,
                            fontWeight: 700,
                            cursor: savingDraft || draftPlatforms.length === 0 ? 'not-allowed' : 'pointer',
                            fontFamily: 'inherit',
                          }}
                        >
                          {savingDraft ? 'Saving…' : 'Save Draft'}
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
