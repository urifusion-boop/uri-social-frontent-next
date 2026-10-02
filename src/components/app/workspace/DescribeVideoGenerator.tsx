'use client';

import {
  SocialMediaAgentService,
  Storyboard,
  VideoClip,
  VideoDraft,
  VideoJob,
} from '@/src/api/SocialMediaAgentService';
import { VIDEO_STYLES, DEFAULT_STYLE_SLUG } from '@/src/data/videoStyles';
import {
  PRIMARY,
  DARK,
  GREY,
  LIGHT,
  BORDER,
  PLATFORMS,
  DURATIONS,
  VIDEO_OUTCOMES,
  AVATAR_VOICES,
  MODEL_LABELS,
  Section,
  Spinner,
  StoryboardResult,
} from '@/src/components/app/workspace/VideoStoryboardGenerator';
import { useEffect, useRef, useState } from 'react';

// "Describe it" flow: a free-text brief is the primary input (reference
// images are optional, unlike VideoStoryboardGenerator's upload-first flow
// where 1-5 images are required). gpt-5.4 writes a creative_direction +
// scene-by-scene script from the brief, then gpt-image-2 generates a
// consistent frame image per scene — each scene chains off the previous
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

export default function DescribeVideoGenerator() {
  const [brief, setBrief] = useState('');
  const [images, setImages] = useState<UploadedImage[]>([]);
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
  const [selectedVoice, setSelectedVoice] = useState('Sarah');
  const [videoJob, setVideoJob] = useState<VideoJob | null>(null);
  const [videoError, setVideoError] = useState('');
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Frame image generation state
  const [frameMap, setFrameMap] = useState<Record<number, string>>({});
  const [frameError, setFrameError] = useState('');
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
          if (res.responseData.status === 'complete') {
            clearInterval(framePollRef.current!);
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

  const handleGenerateStoryboard = async () => {
    if (!brief.trim()) return;
    setLoading(true);
    setError('');
    setStoryboard(null);
    setVideoJob(null);
    setVideoError('');
    setFrameMap({});
    setFrameError('');
    if (framePollRef.current) clearInterval(framePollRef.current);
    try {
      const res = await SocialMediaAgentService.generateCreativeStoryboard({
        brief: brief.trim(),
        reference_images: images.map((img) => img.dataUrl),
        target_platform: platform,
        target_duration_seconds: duration,
        video_style: selectedStyle,
      });
      if (res.status && res.responseData) {
        setStoryboard(res.responseData);
        SocialMediaAgentService.generateCreativeFrames(
          res.responseData.scenes,
          images.map((img) => img.dataUrl)
        )
          .then((frameRes) => {
            if (frameRes.status && frameRes.responseData) {
              startFramePolling(frameRes.responseData.job_id);
            }
          })
          .catch(() => {});
      } else {
        setError(res.responseMessage || 'Creative storyboard generation failed. Please try again.');
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
            <div style={{ display: 'flex', gap: 6 }}>
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
        disabled={!brief.trim() || loading}
        style={{
          width: '100%',
          padding: '13px 0',
          borderRadius: 10,
          background: !brief.trim() || loading ? '#E5E7EB' : PRIMARY,
          color: !brief.trim() || loading ? '#9CA3AF' : '#fff',
          border: 'none',
          fontSize: 14,
          fontWeight: 700,
          cursor: !brief.trim() || loading ? 'not-allowed' : 'pointer',
          fontFamily: 'inherit',
          transition: 'background .15s',
          marginBottom: 28,
        }}
      >
        {loading ? 'Writing creative direction & script…' : 'Generate Storyboard'}
      </button>

      {loading && <Spinner label="Inventing the creative concept and scene-by-scene script…" />}

      {storyboard && !loading && (
        <>
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
              <p
                style={{
                  fontSize: 10.5,
                  fontWeight: 700,
                  color: PRIMARY,
                  textTransform: 'uppercase',
                  letterSpacing: 0.5,
                  margin: '0 0 6px',
                }}
              >
                Creative Direction
              </p>
              <p style={{ fontSize: 13, color: DARK, margin: 0, lineHeight: 1.6 }}>{storyboard.creative_direction}</p>
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
              </div>
            )}

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
                <p style={{ fontSize: 11, color: GREY, margin: '6px 0 0' }}>
                  Each scene takes ~30–90 seconds. This page will update automatically.
                </p>
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
                    <select
                      value={selectedVoice}
                      onChange={(e) => setSelectedVoice(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '9px 10px',
                        borderRadius: 8,
                        border: `1px solid ${BORDER}`,
                        fontSize: 13,
                        fontFamily: 'inherit',
                        color: DARK,
                        background: '#fff',
                      }}
                    >
                      {AVATAR_VOICES.map((v) => (
                        <option key={v} value={v}>
                          {v}
                        </option>
                      ))}
                    </select>
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
                          Find it in your saved video drafts on the Upload Images tab.
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
    </div>
  );
}
