'use client';

import {
  SocialMediaAgentService,
  Storyboard,
  StoryboardScene,
  VideoDraft,
  VideoClip,
  VideoJob,
  VideoPublishJob,
  TikTokPostSettings,
} from '@/src/api/SocialMediaAgentService';
import TikTokPostDialog from './TikTokPostDialog';
import { VIDEO_STYLES, DEFAULT_STYLE_SLUG } from '@/src/data/videoStyles';
import { useEffect, useRef, useState, type CSSProperties } from 'react';
import { NigerianVoiceManifest, VOICE_MANIFEST_URL, parseVoiceManifest } from '@/src/components/app/workspace/voiceManifest';

// Exported — reused as-is by DescribeVideoGenerator.tsx so the two entry
// points (upload-first vs. describe-it) share one "turn a storyboard into
// video" rendering surface instead of two diverging copies.
export const PRIMARY = '#CD1B78';
export const DARK = '#0d0e0f';
export const GREY = '#6B7280';
export const LIGHT = '#F9FAFB';
export const BORDER = '#E5E7EB';

export const PLATFORMS = [
  { value: 'instagram_reels', label: 'Instagram Reels' },
  { value: 'tiktok', label: 'TikTok' },
  { value: 'facebook_reels', label: 'Facebook Reels' },
  { value: 'linkedin', label: 'LinkedIn' },
];

// Engineering-brief routing (§2 "Product Principle: URI Chooses the Model" +
// §4 "Recommended URI Routing Logic", Uzuri Creative / URI, 1 October 2026):
// "Customers should choose an outcome, not an inference provider. Model names
// should remain an implementation detail." These 7 keys/labels/descriptions
// are the brief's own §2 list verbatim; which model each one actually routes
// to (plus its automatic fallback) lives server-side in
// video_generation_service.py's OUTCOME_ROUTES, the real source of truth —
// this UI never sees or sends a raw model id. modelHint is shown ONLY as a
// small transparency label after a clip finishes (routed_model from the job),
// since this screen is still internal dev testing, not the customer-facing
// surface the brief is actually describing.
// Display-only — turns a routed_model id into its friendly name for the dev
// transparency note below. Never offered as a pickable option (that's the
// whole point of outcome routing); must match video_generation_service.py's
// MODEL_REGISTRY labels.
export const MODEL_LABELS: Record<string, string> = {
  'minimax/h3-max-turbo/image-to-video': 'H3 Max Turbo',
  'fal-ai/kling-video/v2.5-turbo/standard/image-to-video': 'Kling 2.5 Standard',
  'fal-ai/pixverse/v6/image-to-video': 'PixVerse V6',
  'minimax/h3-max/image-to-video': 'H3 Max',
  'alibaba/wan-3.0/image-to-video': 'Wan 3.0',
  'fal-ai/veo3.1/fast/image-to-video': 'Veo 3.1 Fast',
  'bytedance/seedance-2.0/image-to-video': 'Seedance 2.0 Fast',
  // Both missing before this fix — a completed Talking / Dialogue generation
  // showed the raw model id instead of a clean name.
  'fal-ai/ai-avatar/single-text': 'Talking Avatar',
  'minimax/h3-max/lip-sync/image-to-video': 'Talking Avatar (Nigerian)',
};

export const VIDEO_OUTCOMES = [
  { value: 'quick_video', label: 'Quick Video', description: 'Fast, low-cost general creative' },
  { value: 'animate_product', label: 'Animate My Product', description: 'Camera movement from a product photo' },
  { value: 'social_video', label: 'Social Video', description: 'Cheap variants for iteration' },
  { value: 'high_quality', label: 'High Quality', description: 'Premium brand shots, hero creative' },
  { value: 'complex_cinematic', label: 'Complex / Cinematic', description: 'Hard motion, multiple subjects' },
  { value: 'talking_dialogue', label: 'Talking / Dialogue', description: 'Scripted talking avatar, real lip-sync' },
  { value: 'advanced_references', label: 'Advanced References', description: 'Reference-driven, brand-critical' },
];

// Which outcome fits a storyboard's own video_style when nothing stronger
// (actual scripted dialogue) overrides it — each mapping grounded in that
// style's own "best_for"/vibe against the outcome's own description in
// video_generation_service.py's OUTCOME_ROUTES, not a guess: e.g. luxury_slow_burn's
// "Premium & cinematic" vibe is exactly high_quality's "Premium brand shots and
// hero creative"; before_after's side-by-side matched framing is exactly what
// advanced_references' "brand-consistency-critical" is for.
const STYLE_TO_OUTCOME: Record<string, string> = {
  clean_commercial: 'animate_product',
  luxury_slow_burn: 'high_quality',
  viral_fast_cut: 'social_video',
  ingredient_reveal: 'complex_cinematic',
  street_style: 'quick_video',
  unboxing_drama: 'complex_cinematic',
  before_after: 'advanced_references',
  mood_film: 'high_quality',
  product_explosion: 'complex_cinematic',
  testimonial_style: 'talking_dialogue',
  menu_showcase: 'animate_product',
  countdown_hype: 'social_video',
};

// Suggests which outcome to pick for a generated storyboard, with a one-line
// reason — scripted dialogue always wins (it's a functional requirement, not
// a vibe match: only talking_dialogue's model reads the dialogue field at
// all), falling back to the style-based mapping above when there's none.
export function suggestOutcome(storyboard: Storyboard): { outcome: string; reason: string } {
  const hasDialogue = storyboard.scenes.some((s) => s.dialogue && s.dialogue.trim());
  if (hasDialogue) {
    return {
      outcome: 'talking_dialogue',
      reason:
        'This script has spoken dialogue — only Talking / Dialogue actually turns it into audible, lip-synced speech. Every other outcome would animate the same frame silently.',
    };
  }
  const styleSlug = storyboard.video_style;
  const styleName = VIDEO_STYLES.find((s) => s.slug === styleSlug)?.name;
  const mapped = (styleSlug && STYLE_TO_OUTCOME[styleSlug]) || 'quick_video';
  const mappedLabel = VIDEO_OUTCOMES.find((o) => o.value === mapped)?.label ?? mapped;
  return {
    outcome: mapped,
    reason: styleName
      ? `No dialogue in this script — ${styleName}'s own look (${VIDEO_STYLES.find((s) => s.slug === styleSlug)?.vibe?.toLowerCase()}) matches ${mappedLabel} best.`
      : `No dialogue in this script — defaulting to ${mappedLabel}, the general-purpose outcome.`,
  };
}

// fal.ai's own documented voice enum for fal-ai/ai-avatar/single-text — keep
// in sync with AVATAR_VOICES in video_generation_service.py if this changes.
// Only shown/used when selectedOutcome === 'talking_dialogue'.
export const AVATAR_VOICES = [
  'Aria',
  'Roger',
  'Sarah',
  'Laura',
  'Charlie',
  'George',
  'Callum',
  'River',
  'Liam',
  'Charlotte',
  'Alice',
  'Matilda',
  'Will',
  'Jessica',
  'Eric',
  'Chris',
  'Brian',
  'Daniel',
  'Lily',
  'Bill',
];

// These voices are ElevenLabs' own stock "Default" library (confirmed —
// fal-ai/ai-avatar/single-text's voice enum uses ElevenLabs for TTS under
// the hood) and ElevenLabs hosts a public, no-auth preview sample for each
// one at a stable CDN URL. AvatarVoicePicker below only renders (and only
// lets a user pick) voices with a confirmed entry here — George, Brian,
// Bill, and Laura are still valid values the backend accepts, they're just
// not offered in this picker until their preview URL is confirmed too.
// NOTE: ElevenLabs is retiring this entire legacy default-voice set on
// 2026-12-31 (e.g. Callum -> Kellan, Brian -> Sawyer) — once AVATAR_VOICES
// is updated to the replacement set, these URLs need replacing too.
export const VOICE_PREVIEWS: Record<string, string> = {
  Aria: 'https://storage.googleapis.com/eleven-public-prod/premade/voices/9BWtsMINqrJLrRacOk9x/405766b8-1f4e-4d3c-aba1-6f25333823ec.mp3',
  Roger:
    'https://storage.googleapis.com/eleven-public-prod/premade/voices/CwhRBWXzGAHq8TQ4Fs17/58ee3ff5-f6f2-4628-93b8-e38eb31806b0.mp3',
  Sarah:
    'https://storage.googleapis.com/eleven-public-prod/premade/voices/EXAVITQu4vr4xnSDxMaL/01a3e33c-6e99-4ee7-8543-ff2216a32186.mp3',
  Charlie:
    'https://storage.googleapis.com/eleven-public-prod/premade/voices/IKne3meq5aSn9XLyUdCD/102de6f2-22ed-43e0-a1f1-111fa75c5481.mp3',
  Callum:
    'https://storage.googleapis.com/eleven-public-prod/premade/voices/N2lVS1w4EtoT3dr4eOWO/ac833bd8-ffda-4938-9ebc-b0f99ca25481.mp3',
  River:
    'https://storage.googleapis.com/eleven-public-prod/premade/voices/SAz9YHcvj6GT2YYXdXww/e6c95f0b-2227-491a-b3d7-2249240decb7.mp3',
  Liam: 'https://storage.googleapis.com/eleven-public-prod/premade/voices/TX3LPaxmHKxFdv7VOQHJ/63148076-6363-42db-aea8-31424308b92c.mp3',
  Charlotte:
    'https://storage.googleapis.com/eleven-public-prod/premade/voices/XB0fDUnXU5powFXDhCwa/942356dc-f10d-4d89-bda5-4f8505ee038b.mp3',
  Alice:
    'https://storage.googleapis.com/eleven-public-prod/premade/voices/Xb7hH8MSUJpSbSDYk0k2/d10f7534-11f6-41fe-a012-2de1e482d336.mp3',
  Matilda:
    'https://storage.googleapis.com/eleven-public-prod/premade/voices/XrExE9yKIg1WjnnlVkGX/b930e18d-6b4d-466e-bab2-0ae97c6d8535.mp3',
  Will: 'https://storage.googleapis.com/eleven-public-prod/premade/voices/bIHbv24MWmeRgasZH58o/8caf8f3d-ad29-4980-af41-53f20c72d7a4.mp3',
  Jessica:
    'https://storage.googleapis.com/eleven-public-prod/premade/voices/cgSgspJ2msm6clMCkdW9/56a97bf8-b69b-448f-846c-c3a11683d45a.mp3',
  Eric: 'https://storage.googleapis.com/eleven-public-prod/premade/voices/cjVigY5qzO86Huf0OWal/d098fda0-6456-4030-b3d8-63aa048c9070.mp3',
  Chris:
    'https://storage.googleapis.com/eleven-public-prod/premade/voices/iP95p4xoKVk53GoZ742B/3f4bde72-cc48-40dd-829f-57fbf906f4d7.mp3',
  Daniel:
    'https://storage.googleapis.com/eleven-public-prod/premade/voices/onwK4e9ZLuTAKqWW03F9/7eee0236-1a72-4b86-b303-5dcadc007ba9.mp3',
  Lily: 'https://storage.googleapis.com/eleven-public-prod/premade/voices/pFZP5JQG7iQjIQuC4Bku/89b68b35-b3dd-4348-a84a-a3c13a3c2b30.mp3',
};

// Real Nigerian-accented voices — ElevenLabs' stock library (AVATAR_VOICES
// above) has no African accents at all. These clone a real reference sample
// (YarnGPT, a Nigerian-built TTS model) per-generation instead of using a
// fixed voice enum — see NIGERIAN_VOICE_REFS in video_generation_service.py
// for the backend half of this. Keep this list in sync with that dict.
export const NIGERIAN_VOICES = ['Idera (Nigerian)', 'Jude (Nigerian)'];

// The raw reference clips themselves, same spirit as VOICE_PREVIEWS above —
// a representative sample of the voice, not a generated line.
export const NIGERIAN_VOICE_PREVIEWS: Record<string, string> = {
  'Idera (Nigerian)': 'https://v3b.fal.media/files/b/0aaf4340/2-A31OjeKxJX1mCVu8jEs_xrxy8rhkfgbh5ftdh91u.wav',
  'Jude (Nigerian)': 'https://v3b.fal.media/files/b/0aaf4340/dptLL3gm-UU3Syor1fUyF_fthsxkvq959bw7zvwi6d.wav',
};

// Shared by VideoStoryboardGenerator and DescribeVideoGenerator — a chip grid
// in place of a native <select>, listing only the voices with a confirmed
// VOICE_PREVIEWS entry, so a small play/pause control can sit inline per
// voice. Clicking a chip selects that voice; clicking its ▶/⏸ plays/stops a
// short sample without changing the selection.
export function AvatarVoicePicker({ value, onChange }: { value: string; onChange: (voice: string) => void }) {
  const [playingVoice, setPlayingVoice] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  // The two voices that always existed are the starting point; once the manifest of generated
  // previews loads, the picker shows exactly the voices listed there (see voiceManifest.ts).
  const [nigerian, setNigerian] = useState<NigerianVoiceManifest>({
    voices: NIGERIAN_VOICES,
    previews: NIGERIAN_VOICE_PREVIEWS,
  });

  useEffect(() => {
    return () => {
      audioRef.current?.pause();
    };
  }, []);

  useEffect(() => {
    let alive = true;
    fetch(VOICE_MANIFEST_URL, { cache: 'no-cache' })
      .then((res) => (res.ok ? res.json() : null))
      .then((json) => {
        const manifest = parseVoiceManifest(json);
        if (alive && manifest) setNigerian(manifest);
      })
      .catch(() => {
        /* no manifest yet: keep the two original voices */
      });
    return () => {
      alive = false;
    };
  }, []);

  const allPreviews: Record<string, string> = { ...VOICE_PREVIEWS, ...nigerian.previews };

  const togglePreview = (voice: string) => {
    const url = allPreviews[voice];
    if (!url) return;
    if (playingVoice === voice) {
      audioRef.current?.pause();
      setPlayingVoice(null);
      return;
    }
    if (!audioRef.current) {
      audioRef.current = new Audio();
      audioRef.current.onended = () => setPlayingVoice(null);
    }
    audioRef.current.src = url;
    audioRef.current.play().catch(() => setPlayingVoice(null));
    setPlayingVoice(voice);
  };

  const renderChip = (v: string) => {
    const isSelected = value === v;
    const isPlaying = playingVoice === v;
    return (
      <div
        key={v}
        onClick={() => onChange(v)}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') onChange(v);
        }}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 6,
          padding: '6px 10px',
          borderRadius: 8,
          border: `1.5px solid ${isSelected ? PRIMARY : BORDER}`,
          background: '#fff',
          color: isSelected ? PRIMARY : DARK,
          fontSize: 12.5,
          fontWeight: isSelected ? 600 : 500,
          cursor: 'pointer',
          userSelect: 'none',
        }}
      >
        {v}
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            togglePreview(v);
          }}
          aria-label={`${isPlaying ? 'Stop' : 'Play'} a sample of ${v}'s voice`}
          style={{
            border: 'none',
            background: 'transparent',
            cursor: 'pointer',
            padding: 0,
            fontSize: 11,
            lineHeight: 1,
            color: isSelected ? PRIMARY : GREY,
          }}
        >
          {isPlaying ? '⏸' : '▶'}
        </button>
      </div>
    );
  };

  const labelStyle: CSSProperties = {
    fontSize: 11,
    fontWeight: 600,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
    color: GREY,
    marginBottom: 4,
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      <div>
        <div style={labelStyle}>Nigerian</div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>{nigerian.voices.map(renderChip)}</div>
      </div>
      <div>
        <div style={labelStyle}>Default</div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
          {AVATAR_VOICES.filter((v) => VOICE_PREVIEWS[v]).map(renderChip)}
        </div>
      </div>
    </div>
  );
}

export const DURATIONS = [
  { value: 10, label: '10s' },
  { value: 15, label: '15s' },
  { value: 20, label: '20s' },
  { value: 30, label: '30s' },
  { value: 40, label: '40s' },
  { value: 50, label: '50s' },
  { value: 60, label: '60s' },
];

interface UploadedImage {
  dataUrl: string;
  name: string;
}

export default function VideoStoryboardGenerator() {
  const [images, setImages] = useState<UploadedImage[]>([]);
  const [optionalText, setOptionalText] = useState('');
  const [platform, setPlatform] = useState('instagram_reels');
  const [duration, setDuration] = useState(15);
  const [selectedStyle, setSelectedStyle] = useState(DEFAULT_STYLE_SLUG);
  const [loading, setLoading] = useState(false);
  const [storyboard, setStoryboard] = useState<Storyboard | null>(null);
  const [error, setError] = useState('');
  const [dragging, setDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Video generation state
  const [selectedOutcome, setSelectedOutcome] = useState('quick_video');
  const [outcomeSuggestionReason, setOutcomeSuggestionReason] = useState('');
  const [selectedVoice, setSelectedVoice] = useState('Sarah');
  const [videoJob, setVideoJob] = useState<VideoJob | null>(null);
  const [videoError, setVideoError] = useState('');
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Storyboard frame image generation state
  const [frameMap, setFrameMap] = useState<Record<number, string>>({});
  const [frameError, setFrameError] = useState('');
  const frameJobIdRef = useRef<string | null>(null);
  const framePollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Merge + draft state
  const [merging, setMerging] = useState(false);
  const [mergedUrl, setMergedUrl] = useState('');
  const [mergeError, setMergeError] = useState('');
  const [draftCaption, setDraftCaption] = useState('');
  const [captionGenerating, setCaptionGenerating] = useState(false);
  const [draftPlatforms, setDraftPlatforms] = useState<string[]>(['instagram_reels']);
  const [savingDraft, setSavingDraft] = useState(false);
  const [savedDraft, setSavedDraft] = useState<VideoDraft | null>(null);
  const [drafts, setDrafts] = useState<VideoDraft[]>([]);
  const [loadingDrafts, setLoadingDrafts] = useState(false);

  // Publish state
  const [connectedPlatforms, setConnectedPlatforms] = useState<string[] | null>(null);
  // selectedPublishPlatform: { [draftId]: platform }
  const [selectedPublishPlatform, setSelectedPublishPlatform] = useState<Record<string, string>>({});
  // publishJobs: { [draftId:platform]: VideoPublishJob }
  const [publishJobs, setPublishJobs] = useState<Record<string, VideoPublishJob>>({});
  // The draft whose Post to TikTok screen is open, if any.
  const [tiktokDialogDraft, setTiktokDialogDraft] = useState<VideoDraft | null>(null);
  const publishPollRefs = useRef<Record<string, ReturnType<typeof setInterval>>>({});

  const SESSION_KEY = 'uri:vsg:session';

  type VSGSession = {
    storyboard: Storyboard | null;
    platform: string;
    storyboardJobId: string | null;
    frameJobId: string | null;
    frameMap: Record<number, string>;
    job: VideoJob | null;
  };

  // Merges into whatever's already stored rather than requiring every call site
  // to know the full current state — each step only ever has its own slice in
  // hand (e.g. the frame-poll tick doesn't know the video job).
  const saveSession = (patch: Partial<VSGSession>) => {
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

  // Restore on mount: static fields (storyboard, platform) come back
  // immediately; an in-progress storyboard-generation job, frame job, or video
  // job also resumes real polling instead of just showing a stale snapshot.
  useEffect(() => {
    try {
      const raw = localStorage.getItem(SESSION_KEY);
      if (!raw) return;
      const saved = JSON.parse(raw) as Partial<VSGSession>;
      if (!saved.storyboard && !saved.storyboardJobId) {
        clearSession();
        return;
      }

      if (saved.storyboard) setStoryboard(saved.storyboard);
      if (saved.platform) setPlatform(saved.platform);
      // Restored unconditionally, same as storyboard/platform — once the frame
      // job finishes, frameJobId gets cleared from the session (nothing left to
      // poll for), but the actual completed images still need to come back from
      // SOMEWHERE on a later refresh, which is this.
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
            const suggestion = suggestOutcome({ ...result.storyboard, video_style: selectedStyle });
            setSelectedOutcome(suggestion.outcome);
            setOutcomeSuggestionReason(suggestion.reason);
            saveSession({ storyboard: result.storyboard, storyboardJobId: null });
            // images isn't restored from session (raw uploaded photos are form
            // input, not job state) — a resume through this specific path
            // loses the brand photos for frame generation, degrading to a
            // from-scratch generation instead of a hard failure.
            SocialMediaAgentService.generateStoryboardFrames(
              result.storyboard.scenes,
              images.map((img) => img.dataUrl)
            )
              .then((frameRes) => {
                if (frameRes.status && frameRes.responseData) {
                  saveSession({ frameJobId: frameRes.responseData.job_id });
                  startFramePolling(frameRes.responseData.job_id);
                }
              })
              .catch(() => {});
          } else {
            setError((result && result.error) || 'Storyboard generation failed. Please try again.');
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

      // Only resume job polling if there's an active job
      const job = saved.job;
      if (job?.job_id && job.status !== 'complete' && job.status !== 'failed') {
        setVideoJob(job);
        SocialMediaAgentService.getVideoJob(job.job_id)
          .then((res) => {
            if (res.status && res.responseData) {
              setVideoJob(res.responseData);
              if (res.responseData.status === 'complete' || res.responseData.status === 'failed') {
                saveSession({ job: null });
              } else {
                saveSession({ job: res.responseData });
              }
            }
          })
          .catch(() => {});
      }
    } catch {
      /* corrupted storage — ignore */
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
          if (res.responseData.status === 'complete' || res.responseData.status === 'failed') {
            if (pollRef.current) clearInterval(pollRef.current);
            clearSession();
          } else {
            saveSession({ job: res.responseData, storyboard, platform });
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

  // Load video drafts and connected platforms on mount
  useEffect(() => {
    setLoadingDrafts(true);
    SocialMediaAgentService.listVideoDrafts()
      .then((res) => {
        if (res.status && res.responseData) setDrafts(res.responseData);
      })
      .catch(() => {})
      .finally(() => setLoadingDrafts(false));

    SocialMediaAgentService.getConnections()
      .then((res) => {
        if (res.status && res.responseData) {
          setConnectedPlatforms(res.responseData.connected_platforms ?? []);
        }
      })
      .catch(() => setConnectedPlatforms([]));
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
        clearSession();
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
        setDrafts((prev) => [res.responseData!, ...prev]);
      }
    } catch {
      setMergeError('Failed to save draft.');
    } finally {
      setSavingDraft(false);
    }
  };

  const togglePlatform = (p: string) =>
    setDraftPlatforms((prev) => (prev.includes(p) ? prev.filter((x) => x !== p) : [...prev, p]));

  const handlePublish = async (draft: VideoDraft, tiktok?: TikTokPostSettings) => {
    const platform = selectedPublishPlatform[draft.id];
    if (!platform) return;
    const key = `${draft.id}:${platform}`;
    try {
      const res = await SocialMediaAgentService.publishVideoDraft({
        draft_id: draft.id,
        platform,
        ...(tiktok ? { tiktok } : {}),
      });
      if (!res.status || !res.responseData) return;
      const { job_id } = res.responseData;
      setPublishJobs((prev) => ({
        ...prev,
        [key]: {
          job_id,
          draft_id: draft.id,
          platform,
          status: 'queued',
          platform_post_id: null,
          post_url: null,
          error: null,
        },
      }));
      // Poll for status
      publishPollRefs.current[job_id] = setInterval(async () => {
        try {
          const poll = await SocialMediaAgentService.getVideoPublishJob(job_id);
          if (poll.status && poll.responseData) {
            setPublishJobs((prev) => ({ ...prev, [key]: poll.responseData! }));
            const s = poll.responseData.status;
            if (s === 'published' || s === 'failed') {
              clearInterval(publishPollRefs.current[job_id]);
              delete publishPollRefs.current[job_id];
              if (s === 'published') {
                setDrafts((prev) => prev.map((d) => (d.id === draft.id ? { ...d, status: 'published' } : d)));
              }
            }
          }
        } catch {
          /* keep polling */
        }
      }, 8000);
    } catch {
      /* ignore */
    }
  };

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
      };
      reader.readAsDataURL(file);
    });
  };

  const removeImage = (idx: number) => setImages((prev) => prev.filter((_, i) => i !== idx));

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    addFiles(e.dataTransfer.files);
  };

  // Frame generation runs scenes sequentially server-side (one gpt-image-2 call
  // per scene) — genuinely slow for several scenes, not stuck. But this polled
  // forever with no escape hatch at all: if the background job never flips to
  // "complete" — a worker dying mid-job, a stuck/crashed job, anything — the
  // UI just spun on "Generating frame…" with zero feedback, indistinguishable
  // from "still working." 60 attempts at 5s = 5 minutes, generous for even a
  // 5-scene storyboard, after which this stops polling and says so plainly
  // instead of spinning silently forever.
  const MAX_FRAME_POLL_ATTEMPTS = 60;

  const startFramePolling = (jobId: string) => {
    frameJobIdRef.current = jobId;
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
        /* keep polling — a single failed poll (network blip, transient 5xx)
           isn't reason to give up, only sustained timeout below is. */
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

  // Storyboard-script generation is job-based now (see generate-storyboard's own
  // docstring in complete_social_manager.py) — this polls it to completion.
  // Shared by the interactive "just kicked it off, keep the button's loading
  // state until it's done" path in handleGenerateStoryboard below AND the
  // mount-time restore effect above (resuming a job that was still running
  // when the page was last open).
  const STORYBOARD_POLL_INTERVAL_MS = 3000;
  const MAX_STORYBOARD_POLL_ATTEMPTS = 40; // ~2 minutes
  const pollStoryboardJob = async (
    jobId: string
  ): Promise<{ status: string; storyboard: Storyboard | null; error: string | null } | null> => {
    for (let attempt = 0; attempt < MAX_STORYBOARD_POLL_ATTEMPTS; attempt++) {
      try {
        const res = await SocialMediaAgentService.getStoryboardJob(jobId);
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

  const handleGenerateStoryboard = async () => {
    if (images.length === 0) return;
    setLoading(true);
    setError('');
    setStoryboard(null);
    setVideoJob(null);
    setVideoError('');
    setFrameMap({});
    setFrameError('');
    setOutcomeSuggestionReason('');
    clearSession();
    if (framePollRef.current) clearInterval(framePollRef.current);
    try {
      const jobRes = await SocialMediaAgentService.generateStoryboard({
        brand_images: images.map((img) => img.dataUrl),
        optional_text: optionalText.trim() || undefined,
        target_platform: platform,
        target_duration_seconds: duration,
        video_style: selectedStyle,
      });
      if (!jobRes.status || !jobRes.responseData) {
        setError(jobRes.responseMessage || 'Storyboard generation failed. Please try again.');
        return;
      }
      saveSession({ storyboardJobId: jobRes.responseData.job_id, platform });
      const result = await pollStoryboardJob(jobRes.responseData.job_id);
      if (!result) {
        setError('Storyboard generation is taking much longer than expected. Please try again.');
        return;
      }
      if (result.status === 'complete' && result.storyboard) {
        setStoryboard(result.storyboard);
        saveSession({ storyboard: result.storyboard, platform, storyboardJobId: null, frameJobId: null, frameMap: {} });
        // generateStoryboard's response never carries video_style back (only
        // the "describe it" endpoint's does, since there the model picks it)
        // — selectedStyle is what was actually used here, so feed it in.
        const suggestion = suggestOutcome({ ...result.storyboard, video_style: selectedStyle });
        setSelectedOutcome(suggestion.outcome);
        setOutcomeSuggestionReason(suggestion.reason);
        // Fire frame image generation in the background
        SocialMediaAgentService.generateStoryboardFrames(
          result.storyboard.scenes,
          images.map((img) => img.dataUrl)
        )
          .then((frameRes) => {
            if (frameRes.status && frameRes.responseData) {
              saveSession({ frameJobId: frameRes.responseData.job_id });
              startFramePolling(frameRes.responseData.job_id);
            }
          })
          .catch(() => {});
      } else {
        setError(result.error || 'Storyboard generation failed. Please try again.');
        saveSession({ storyboardJobId: null });
      }
    } catch {
      setError('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateVideos = async () => {
    if (!storyboard) return;
    setVideoError('');
    setVideoJob(null);
    setMergedUrl('');
    setMergeError('');
    setSavedDraft(null);
    if (pollRef.current) clearInterval(pollRef.current);
    try {
      // Inject each scene's storyboard frame URL so Veo uses it as a reference image
      const enrichedStoryboard = {
        ...storyboard,
        scenes: storyboard.scenes.map((s) => ({
          ...s,
          ...(frameMap[s.scene_number] ? { frame_image_url: frameMap[s.scene_number] } : {}),
        })),
      };
      const res = await SocialMediaAgentService.generateVideoFromStoryboard({
        storyboard: enrichedStoryboard,
        brand_images: images.map((img) => img.dataUrl),
        outcome: selectedOutcome,
        ...(selectedOutcome === 'talking_dialogue' ? { avatar_voice: selectedVoice } : {}),
      });
      if (res.status && res.responseData) {
        setVideoJob(res.responseData);
        saveSession({ job: res.responseData, storyboard, platform });
      } else {
        setVideoError(res.responseMessage || 'Could not start video generation.');
      }
    } catch {
      setVideoError('Something went wrong starting video generation.');
    }
  };

  const clipMap: Record<number, VideoClip> = {};
  (videoJob?.clips ?? []).forEach((c) => {
    clipMap[c.scene_number] = c;
  });

  return (
    <div style={{ padding: '20px 0', maxWidth: 720, margin: '0 auto' }}>
      {/* Image upload */}
      <Section
        title="Brand Images"
        subtitle="Upload 1–5 images to ground the storyboard (logo, product shots, sample posts)"
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
            {images.length >= 5 ? 'Maximum 5 images reached' : 'Drag & drop or click to upload'}
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
                <div
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    background: 'rgba(0,0,0,.45)',
                    padding: '2px 4px',
                    fontSize: 9.5,
                    color: '#fff',
                    fontWeight: 600,
                    letterSpacing: 0.3,
                  }}
                >
                  Image {i}
                </div>
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
            {images.length < 5 && (
              <button
                onClick={() => fileInputRef.current?.click()}
                style={{
                  width: 90,
                  height: 90,
                  borderRadius: 10,
                  border: `2px dashed ${BORDER}`,
                  background: LIGHT,
                  cursor: 'pointer',
                  fontSize: 22,
                  color: GREY,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}
              >
                +
              </button>
            )}
          </div>
        )}
      </Section>

      {/* Video Style Picker */}
      <Section
        title="Video Style"
        subtitle="Choose a visual style — it shapes camera movement, pacing, color grading, and energy"
      >
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 10 }}>
          {VIDEO_STYLES.map((style) => {
            const isSelected = selectedStyle === style.slug;
            return (
              <button
                key={style.slug}
                onClick={() => setSelectedStyle(style.slug)}
                style={{
                  border: `2px solid ${isSelected ? PRIMARY : BORDER}`,
                  borderRadius: 12,
                  padding: '12px 14px',
                  background: isSelected ? '#FFF0F8' : '#fff',
                  textAlign: 'left',
                  cursor: 'pointer',
                  fontFamily: 'inherit',
                  transition: 'all .15s',
                  position: 'relative',
                }}
              >
                {isSelected && (
                  <span
                    style={{
                      position: 'absolute',
                      top: 8,
                      right: 10,
                      width: 16,
                      height: 16,
                      borderRadius: 99,
                      background: PRIMARY,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: 9,
                      color: '#fff',
                      fontWeight: 700,
                      lineHeight: 1,
                    }}
                  >
                    ✓
                  </span>
                )}
                <p style={{ fontSize: 13, fontWeight: 700, color: isSelected ? PRIMARY : DARK, margin: '0 0 4px' }}>
                  {style.name}
                </p>
                <p style={{ fontSize: 11, color: GREY, margin: '0 0 6px', fontStyle: 'italic' }}>{style.vibe}</p>
                <p style={{ fontSize: 10.5, color: GREY, margin: '0 0 2px' }}>
                  <span style={{ fontWeight: 600 }}>Pacing:</span> {style.pacing}
                </p>
                <p style={{ fontSize: 10.5, color: GREY, margin: '0 0 2px' }}>
                  <span style={{ fontWeight: 600 }}>Camera:</span> {style.camera}
                </p>
                <p style={{ fontSize: 10.5, color: '#9CA3AF', margin: '4px 0 0' }}>Best for: {style.best_for}</p>
              </button>
            );
          })}
        </div>
      </Section>

      {/* Creative direction */}
      <Section title="Creative Direction" subtitle="Optional — describe the story or mood you want">
        <textarea
          value={optionalText}
          onChange={(e) => setOptionalText(e.target.value)}
          placeholder="e.g. Show the product being used outdoors at golden hour. Emphasise the texture and quality. End with the logo on a clean background."
          rows={3}
          maxLength={1000}
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
        <p style={{ fontSize: 11, color: '#9CA3AF', margin: '4px 0 0', textAlign: 'right' }}>
          {optionalText.length}/1000
        </p>
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
        </div>
      )}

      <button
        onClick={handleGenerateStoryboard}
        disabled={images.length === 0 || loading}
        style={{
          width: '100%',
          padding: '13px 0',
          borderRadius: 10,
          background: images.length === 0 || loading ? '#E5E7EB' : PRIMARY,
          color: images.length === 0 || loading ? '#9CA3AF' : '#fff',
          border: 'none',
          fontSize: 14,
          fontWeight: 700,
          cursor: images.length === 0 || loading ? 'not-allowed' : 'pointer',
          fontFamily: 'inherit',
          transition: 'background .15s',
          marginBottom: 28,
        }}
      >
        {loading ? 'Generating storyboard…' : 'Generate Storyboard'}
      </button>

      {loading && <Spinner label="Analysing brand images and crafting scenes…" />}

      {storyboard && !loading && (
        <>
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

          {/* Video generation section */}
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
              </div>
            )}

            {/* Total estimated cost — summed from each clip's own estimate (duration
                actually sent to the model × fal.ai's published per-second rate), so
                picking a different Video Outcome and regenerating gives a real number
                to compare, not just a visual impression. Dev-only transparency note:
                which model(s) actually ran (routed_model can differ from the outcome's
                usual primary when §4's automatic fallback kicked in) — the brief's own
                customer-facing surface would never show this, but this screen is still
                internal testing, not that surface. */}
            {videoJob?.status === 'complete' &&
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

            {/* Job progress */}
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
                {/* Outcome picker — engineering brief §2: the customer picks an outcome,
                    never a raw model name. Which model actually runs (plus its automatic
                    fallback) is resolved server-side; see the "Routed to:" transparency
                    note above once a job completes, which exists only because this screen
                    is still internal testing, not the brief's actual customer-facing surface. */}
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
                      // Every outcome routes to an image-to-video model (fal.ai) — none of
                      // them can run before frame generation finishes.
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

                {/* Voice picker — only matters once a scene actually has dialogue to
                    speak; fal-ai/ai-avatar/single-text takes a fixed voice enum, not
                    an uploaded voice sample. */}
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
                        This storyboard has no scripted dialogue yet — pick the "Testimonial Style" video style and
                        regenerate the storyboard to get a spoken script, or clips will fall back to reading their
                        on-screen text/prompt aloud.
                      </p>
                    )}
                  </div>
                )}
              </>
            )}

            {(!videoJob || videoJob.status === 'complete' || videoJob.status === 'failed') && (
              <button
                onClick={handleGenerateVideos}
                disabled={!!videoJob && videoJob.status === 'generating'}
                style={{
                  width: '100%',
                  padding: '13px 0',
                  borderRadius: 10,
                  background: PRIMARY,
                  color: '#fff',
                  border: 'none',
                  fontSize: 14,
                  fontWeight: 700,
                  cursor: 'pointer',
                  fontFamily: 'inherit',
                }}
              >
                {videoJob?.status === 'complete' ? 'Regenerate Videos' : 'Generate Videos'}
              </button>
            )}

            {/* Merge + Save Draft — shown after job is complete */}
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
                          Find it in your saved video drafts below.
                        </p>
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

      {/* Saved Video Drafts */}
      <div style={{ marginTop: 40, paddingTop: 28, borderTop: `1px solid ${BORDER}` }}>
        <p style={{ fontSize: 13.5, fontWeight: 700, color: DARK, margin: '0 0 4px' }}>Saved Video Drafts</p>
        <p style={{ fontSize: 12, color: GREY, margin: '0 0 16px' }}>Videos saved for posting</p>
        {loadingDrafts ? (
          <p style={{ fontSize: 13, color: GREY }}>Loading…</p>
        ) : drafts.length === 0 ? (
          <p style={{ fontSize: 13, color: '#9CA3AF' }}>No video drafts saved yet.</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {drafts.map((d) => {
              const PUBLISH_PLATFORMS = [
                { value: 'instagram_reels', label: 'Instagram Reels', connectionKey: 'instagram', enabled: true },
                { value: 'facebook_reels', label: 'Facebook', connectionKey: 'facebook', enabled: true },
                { value: 'tiktok', label: 'TikTok', connectionKey: 'tiktok', enabled: true },
                { value: 'linkedin', label: 'LinkedIn', connectionKey: 'linkedin', enabled: false },
              ];

              const selPlatform = selectedPublishPlatform[d.id] ?? '';

              return (
                <div key={d.id} style={{ border: `1.5px solid ${BORDER}`, borderRadius: 12, overflow: 'hidden' }}>
                  <video
                    src={d.video_url}
                    controls
                    playsInline
                    preload="metadata"
                    style={{ width: '100%', maxHeight: 320, display: 'block', background: '#000' }}
                  />
                  <div style={{ padding: '14px 16px' }}>
                    {d.content && (
                      <p style={{ fontSize: 13, color: DARK, margin: '0 0 10px', lineHeight: 1.5 }}>{d.content}</p>
                    )}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap', marginBottom: 12 }}>
                      <span style={{ fontSize: 11, fontWeight: 600, color: GREY }}>Saved for:</span>
                      {(d.platforms ?? []).map((p) => (
                        <span
                          key={p}
                          style={{
                            fontSize: 10.5,
                            fontWeight: 700,
                            color: PRIMARY,
                            background: '#FFF0F8',
                            borderRadius: 4,
                            padding: '2px 7px',
                            border: `1px solid #FBCFE8`,
                          }}
                        >
                          {p.replace(/_/g, ' ')}
                        </span>
                      ))}
                      <span style={{ fontSize: 11, color: '#9CA3AF', marginLeft: 'auto' }}>
                        {new Date(d.created_at).toLocaleDateString()}
                      </span>
                    </div>

                    {/* Publish section */}
                    {d.status === 'published' ? (
                      <div
                        style={{
                          background: '#F0FDF4',
                          border: '1px solid #86EFAC',
                          borderRadius: 8,
                          padding: '10px 12px',
                        }}
                      >
                        <p style={{ fontSize: 12.5, fontWeight: 700, color: '#16a34a', margin: 0 }}>Published</p>
                      </div>
                    ) : (
                      <div style={{ borderTop: `1px solid ${BORDER}`, paddingTop: 12 }}>
                        <p style={{ fontSize: 12, fontWeight: 600, color: GREY, margin: '0 0 8px' }}>Publish to</p>
                        <div style={{ display: 'flex', gap: 7, flexWrap: 'wrap', marginBottom: 12 }}>
                          {PUBLISH_PLATFORMS.filter((pp) => (d.platforms ?? []).includes(pp.value) || !pp.enabled).map(
                            (pp) => {
                              const isConnected =
                                connectedPlatforms?.map((c) => c.toLowerCase()).includes(pp.connectionKey) ?? false;
                              const isSelected = selPlatform === pp.value;
                              const canSelect = pp.enabled && isConnected;
                              const jobKey = `${d.id}:${pp.value}`;
                              const job = publishJobs[jobKey];
                              const isPublishing = job && job.status !== 'published' && job.status !== 'failed';

                              return (
                                <button
                                  key={pp.value}
                                  onClick={() => {
                                    if (!canSelect) return;
                                    setSelectedPublishPlatform((prev) => ({ ...prev, [d.id]: pp.value }));
                                  }}
                                  title={
                                    !pp.enabled
                                      ? 'Coming soon'
                                      : !isConnected
                                        ? `Connect your ${pp.label} account first`
                                        : ''
                                  }
                                  style={{
                                    padding: '6px 13px',
                                    borderRadius: 8,
                                    border: `1.5px solid ${isSelected ? PRIMARY : BORDER}`,
                                    background: isSelected ? '#FFF0F8' : '#fff',
                                    color: !pp.enabled || !isConnected ? '#9CA3AF' : isSelected ? PRIMARY : DARK,
                                    fontWeight: isSelected ? 700 : 500,
                                    fontSize: 12,
                                    cursor: canSelect ? 'pointer' : 'not-allowed',
                                    fontFamily: 'inherit',
                                    opacity: !pp.enabled ? 0.5 : 1,
                                    position: 'relative',
                                  }}
                                >
                                  {pp.label}
                                  {!pp.enabled && (
                                    <span style={{ display: 'block', fontSize: 9, color: '#9CA3AF', fontWeight: 400 }}>
                                      Coming soon
                                    </span>
                                  )}
                                  {pp.enabled && !isConnected && (
                                    <span style={{ display: 'block', fontSize: 9, color: '#9CA3AF', fontWeight: 400 }}>
                                      Not connected
                                    </span>
                                  )}
                                  {isPublishing && (
                                    <span style={{ display: 'block', fontSize: 9, color: PRIMARY, fontWeight: 600 }}>
                                      {job.status}…
                                    </span>
                                  )}
                                  {job?.status === 'published' && (
                                    <span style={{ display: 'block', fontSize: 9, color: '#16a34a', fontWeight: 600 }}>
                                      Published
                                    </span>
                                  )}
                                  {job?.status === 'failed' && (
                                    <span style={{ display: 'block', fontSize: 9, color: '#DC2626', fontWeight: 600 }}>
                                      Failed
                                    </span>
                                  )}
                                </button>
                              );
                            }
                          )}
                        </div>

                        {/* Publish job error */}
                        {selPlatform && publishJobs[`${d.id}:${selPlatform}`]?.status === 'failed' && (
                          <div
                            style={{
                              background: '#FEF2F2',
                              border: '1px solid #FECACA',
                              borderRadius: 8,
                              padding: '8px 10px',
                              marginBottom: 10,
                            }}
                          >
                            <p style={{ fontSize: 12, color: '#DC2626', margin: 0 }}>
                              {publishJobs[`${d.id}:${selPlatform}`].error ?? 'Publish failed. Please try again.'}
                            </p>
                          </div>
                        )}

                        {/* Post URL on success */}
                        {selPlatform &&
                          publishJobs[`${d.id}:${selPlatform}`]?.status === 'published' &&
                          publishJobs[`${d.id}:${selPlatform}`].post_url && (
                            <a
                              href={publishJobs[`${d.id}:${selPlatform}`].post_url!}
                              target="_blank"
                              rel="noopener noreferrer"
                              style={{
                                fontSize: 12.5,
                                color: PRIMARY,
                                fontWeight: 600,
                                textDecoration: 'none',
                                display: 'block',
                                marginBottom: 10,
                              }}
                            >
                              View post →
                            </a>
                          )}

                        <button
                          // TikTok needs the Post to TikTok screen first (privacy,
                          // interactions, disclosure, consent); nothing is sent until
                          // the user presses Post inside it.
                          onClick={() => (selPlatform === 'tiktok' ? setTiktokDialogDraft(d) : handlePublish(d))}
                          disabled={
                            !selPlatform ||
                            (!!publishJobs[`${d.id}:${selPlatform}`]?.status &&
                              publishJobs[`${d.id}:${selPlatform}`].status !== 'failed')
                          }
                          style={{
                            width: '100%',
                            padding: '10px 0',
                            borderRadius: 8,
                            background:
                              !selPlatform ||
                              (!!publishJobs[`${d.id}:${selPlatform}`]?.status &&
                                publishJobs[`${d.id}:${selPlatform}`].status !== 'failed')
                                ? '#E5E7EB'
                                : PRIMARY,
                            color:
                              !selPlatform ||
                              (!!publishJobs[`${d.id}:${selPlatform}`]?.status &&
                                publishJobs[`${d.id}:${selPlatform}`].status !== 'failed')
                                ? '#9CA3AF'
                                : '#fff',
                            border: 'none',
                            fontSize: 13,
                            fontWeight: 700,
                            cursor:
                              !selPlatform ||
                              (!!publishJobs[`${d.id}:${selPlatform}`]?.status &&
                                publishJobs[`${d.id}:${selPlatform}`].status !== 'failed')
                                ? 'not-allowed'
                                : 'pointer',
                            fontFamily: 'inherit',
                          }}
                        >
                          {publishJobs[`${d.id}:${selPlatform}`]?.status === 'queued' ||
                          publishJobs[`${d.id}:${selPlatform}`]?.status === 'uploading' ||
                          publishJobs[`${d.id}:${selPlatform}`]?.status === 'processing'
                            ? `${publishJobs[`${d.id}:${selPlatform}`].status}…`
                            : selPlatform
                              ? `Publish to ${PUBLISH_PLATFORMS.find((p) => p.value === selPlatform)?.label ?? selPlatform}`
                              : 'Select a platform above'}
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {tiktokDialogDraft && (
        <TikTokPostDialog
          media={{ kind: 'video', url: tiktokDialogDraft.video_url }}
          initialTitle={tiktokDialogDraft.content ?? ''}
          onClose={() => setTiktokDialogDraft(null)}
          onConfirm={(settings) => {
            const draft = tiktokDialogDraft;
            setTiktokDialogDraft(null);
            handlePublish(draft, settings);
          }}
        />
      )}
    </div>
  );
}

export function Section({ title, subtitle, children }: { title: string; subtitle: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 24 }}>
      <div style={{ marginBottom: 10 }}>
        <p style={{ fontSize: 13.5, fontWeight: 700, color: DARK, margin: 0 }}>{title}</p>
        <p style={{ fontSize: 12, color: GREY, margin: '2px 0 0' }}>{subtitle}</p>
      </div>
      {children}
    </div>
  );
}

export function Spinner({ label }: { label: string }) {
  return (
    <div style={{ textAlign: 'center', padding: '32px 0', color: GREY }}>
      <div
        style={{
          width: 36,
          height: 36,
          border: `3px solid ${BORDER}`,
          borderTopColor: PRIMARY,
          borderRadius: 99,
          margin: '0 auto 12px',
          animation: 'spin 0.8s linear infinite',
        }}
      />
      <p style={{ fontSize: 13, margin: 0 }}>{label}</p>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );
}

export function StoryboardResult({
  storyboard,
  clipMap,
  frameMap,
}: {
  storyboard: Storyboard;
  clipMap: Record<number, VideoClip>;
  frameMap: Record<number, string>;
}) {
  // Calculate cumulative start time per scene
  const scenesWithTime = storyboard.scenes.reduce<{ scene: StoryboardScene; start: number }[]>((acc, scene) => {
    const start = acc.length > 0 ? acc[acc.length - 1].start + acc[acc.length - 1].scene.duration_seconds : 0;
    return [...acc, { scene, start }];
  }, []);

  return (
    <div>
      <div
        style={{
          display: 'flex',
          gap: 20,
          padding: '12px 16px',
          background: '#FFF0F8',
          borderRadius: 10,
          marginBottom: 16,
          flexWrap: 'wrap',
        }}
      >
        <Chip label="Platform" value={storyboard.target_platform.replace(/_/g, ' ')} />
        <Chip label="Duration" value={`${storyboard.total_duration_seconds}s`} />
        <Chip label="Scenes" value={String(storyboard.scenes.length)} />
        <Chip label="Aspect" value={storyboard.aspect_ratio} />
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
        {scenesWithTime.map(({ scene, start }) => (
          <SceneCard
            key={scene.scene_number}
            scene={scene}
            startTime={start}
            clip={clipMap[scene.scene_number] ?? null}
            frameUrl={frameMap[scene.scene_number]}
          />
        ))}
      </div>
    </div>
  );
}

export function Chip({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p
        style={{
          fontSize: 10,
          fontWeight: 600,
          color: PRIMARY,
          margin: 0,
          textTransform: 'uppercase',
          letterSpacing: 0.5,
        }}
      >
        {label}
      </p>
      <p style={{ fontSize: 13, fontWeight: 700, color: DARK, margin: 0, textTransform: 'capitalize' }}>{value}</p>
    </div>
  );
}

export function SceneCard({
  scene,
  startTime,
  clip,
  frameUrl,
}: {
  scene: StoryboardScene;
  startTime: number;
  clip: VideoClip | null;
  frameUrl?: string;
}) {
  const [expanded, setExpanded] = useState(false);
  const endTime = startTime + scene.duration_seconds;

  // Show the storyboard frame image as the permanent card background.
  // The frame IS the first frame of the generated video (Veo animates from it).
  const bgSrc = frameUrl ?? null;
  const loadingFrame = !bgSrc;

  return (
    <div style={{ borderRadius: 10, overflow: 'hidden', background: '#111', boxShadow: '0 2px 8px rgba(0,0,0,0.18)' }}>
      {/* Storyboard frame */}
      <div
        style={{ position: 'relative', aspectRatio: '4/3', cursor: 'pointer', userSelect: 'none' }}
        onClick={() => setExpanded((v) => !v)}
      >
        {/* Background */}
        {loadingFrame ? (
          <>
            <div style={{ position: 'absolute', inset: 0, background: '#12121a' }} />
            <div
              style={{
                position: 'absolute',
                inset: 0,
                background: 'linear-gradient(90deg, transparent 25%, rgba(255,255,255,0.04) 50%, transparent 75%)',
                backgroundSize: '200% 100%',
                animation: 'shimmer 1.8s ease-in-out infinite',
              }}
            />
            <div
              style={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 8,
              }}
            >
              <div
                style={{
                  width: 22,
                  height: 22,
                  border: '2.5px solid rgba(255,255,255,0.15)',
                  borderTopColor: 'rgba(255,255,255,0.6)',
                  borderRadius: 99,
                  animation: 'spin 0.9s linear infinite',
                }}
              />
              <p style={{ fontSize: 9.5, color: 'rgba(255,255,255,0.35)', margin: 0, letterSpacing: 0.5 }}>
                Generating frame…
              </p>
            </div>
            <style>{`@keyframes shimmer{0%{background-position:200% 0}100%{background-position:-200% 0}}@keyframes spin{to{transform:rotate(360deg)}}`}</style>
          </>
        ) : (
          <img
            src={bgSrc!}
            alt=""
            style={{
              position: 'absolute',
              inset: 0,
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              display: 'block',
            }}
          />
        )}

        {/* Gradient overlays — top and bottom */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background:
              'linear-gradient(to bottom, rgba(0,0,0,0.65) 0%, rgba(0,0,0,0) 45%, rgba(0,0,0,0) 55%, rgba(0,0,0,0.72) 100%)',
          }}
        />

        {/* Top-left: scene number + shot type + time */}
        <div style={{ position: 'absolute', top: 10, left: 12 }}>
          <p
            style={{
              fontSize: 11,
              fontWeight: 700,
              color: '#fff',
              margin: 0,
              textTransform: 'uppercase',
              letterSpacing: 1,
            }}
          >
            {scene.scene_number}. {scene.shot_type.replace(/_/g, ' ')}
          </p>
          <p style={{ fontSize: 10, color: 'rgba(255,255,255,0.65)', margin: '2px 0 0', letterSpacing: 0.5 }}>
            {startTime} – {endTime}s
          </p>
        </div>

        {/* Top-right: clip status */}
        {clip && (
          <div style={{ position: 'absolute', top: 10, right: 10 }}>
            {clip.video_url && (
              <span
                style={{
                  fontSize: 10,
                  fontWeight: 700,
                  color: '#fff',
                  background: clip.warning ? '#B45309' : '#16a34a',
                  borderRadius: 4,
                  padding: '2px 7px',
                }}
                title={clip.warning || undefined}
              >
                {clip.warning ? '⚠ Fallback · ' : ''}
                {clip.cost_usd != null ? `Done · $${clip.cost_usd.toFixed(3)}` : 'Done'}
              </span>
            )}
            {clip.error && (
              <span
                style={{
                  fontSize: 10,
                  fontWeight: 700,
                  color: '#fff',
                  background: '#DC2626',
                  borderRadius: 4,
                  padding: '2px 7px',
                }}
              >
                Failed
              </span>
            )}
            {!clip.video_url && !clip.error && (
              <span
                style={{
                  fontSize: 10,
                  fontWeight: 700,
                  color: '#fff',
                  background: 'rgba(0,0,0,0.5)',
                  borderRadius: 4,
                  padding: '2px 7px',
                }}
              >
                Generating…
              </span>
            )}
          </div>
        )}

        {/* Bottom-left: text overlay */}
        {scene.text_overlay && (
          <div style={{ position: 'absolute', bottom: 10, left: 12, right: 40 }}>
            <p
              style={{
                fontSize: 13,
                fontWeight: 800,
                color: '#FFD700',
                margin: 0,
                textTransform: 'uppercase',
                letterSpacing: 1,
                lineHeight: 1.25,
                textShadow: '0 1px 4px rgba(0,0,0,0.8)',
              }}
            >
              {scene.text_overlay}
            </p>
          </div>
        )}

        {/* Bottom-right: expand toggle */}
        <div
          style={{
            position: 'absolute',
            bottom: 8,
            right: 10,
            color: 'rgba(255,255,255,0.7)',
            fontSize: 13,
          }}
        >
          {expanded ? '▲' : '▼'}
        </div>
      </div>

      {/* Video player — shown when clip is ready */}
      {clip?.video_url && (
        <div style={{ background: '#000', padding: '0 0 4px' }}>
          <video
            src={clip.video_url}
            controls
            playsInline
            style={{ width: '100%', display: 'block', maxHeight: 260 }}
          />
          <div style={{ display: 'flex', justifyContent: 'flex-end', padding: '4px 10px' }}>
            <a
              href={clip.video_url}
              download={`scene-${clip.scene_number}.mp4`}
              style={{ fontSize: 11, color: '#9CA3AF', textDecoration: 'none', fontWeight: 600 }}
            >
              Download
            </a>
          </div>
        </div>
      )}

      {/* Expanded: prompt + error */}
      {expanded && (
        <div style={{ padding: '12px 14px', background: '#18181b', borderTop: '1px solid #27272a' }}>
          <p
            style={{
              fontSize: 10.5,
              fontWeight: 700,
              color: '#71717a',
              textTransform: 'uppercase',
              letterSpacing: 0.5,
              margin: '0 0 6px',
            }}
          >
            Motion
          </p>
          <p style={{ fontSize: 12.5, color: '#d4d4d8', margin: '0 0 10px', lineHeight: 1.5 }}>{scene.motion}</p>
          {scene.continuity_note && (
            <>
              <p
                style={{
                  fontSize: 10.5,
                  fontWeight: 700,
                  color: '#71717a',
                  textTransform: 'uppercase',
                  letterSpacing: 0.5,
                  margin: '0 0 6px',
                }}
              >
                Continuity
              </p>
              <p style={{ fontSize: 12.5, color: '#d4d4d8', margin: '0 0 10px', lineHeight: 1.5, fontStyle: 'italic' }}>
                {scene.continuity_note}
              </p>
            </>
          )}
          {scene.dialogue && (
            <>
              <p
                style={{
                  fontSize: 10.5,
                  fontWeight: 700,
                  color: '#71717a',
                  textTransform: 'uppercase',
                  letterSpacing: 0.5,
                  margin: '0 0 6px',
                }}
              >
                Dialogue
              </p>
              <p style={{ fontSize: 12.5, color: '#FFD700', margin: '0 0 10px', lineHeight: 1.5 }}>
                &ldquo;{scene.dialogue}&rdquo;
              </p>
            </>
          )}
          <p
            style={{
              fontSize: 10.5,
              fontWeight: 700,
              color: '#71717a',
              textTransform: 'uppercase',
              letterSpacing: 0.5,
              margin: '0 0 6px',
            }}
          >
            Video Prompt
          </p>
          <p style={{ fontSize: 12, color: '#a1a1aa', margin: 0, lineHeight: 1.5 }}>{scene.video_prompt}</p>
          {clip?.warning && (
            <p
              style={{
                fontSize: 11.5,
                color: '#FBBF24',
                marginTop: 10,
                padding: '7px 10px',
                background: 'rgba(180,83,9,0.15)',
                borderRadius: 6,
              }}
            >
              {clip.warning}
            </p>
          )}
          {clip?.error && (
            <p
              style={{
                fontSize: 11.5,
                color: '#f87171',
                marginTop: 10,
                padding: '7px 10px',
                background: 'rgba(220,38,38,0.12)',
                borderRadius: 6,
              }}
            >
              {clip.error}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
