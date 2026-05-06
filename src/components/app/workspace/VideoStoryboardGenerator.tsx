'use client';

import {
  SocialMediaAgentService,
  Storyboard,
  StoryboardScene,
  VideoDraft,
  VideoClip,
  VideoJob,
} from '@/src/api/SocialMediaAgentService';
import { useEffect, useRef, useState } from 'react';

const PRIMARY = '#CD1B78';
const DARK = '#0d0e0f';
const GREY = '#6B7280';
const LIGHT = '#F9FAFB';
const BORDER = '#E5E7EB';

const PLATFORMS = [
  { value: 'instagram_reels', label: 'Instagram Reels' },
  { value: 'tiktok', label: 'TikTok' },
  { value: 'facebook_reels', label: 'Facebook Reels' },
  { value: 'linkedin', label: 'LinkedIn' },
];

const DURATIONS = [
  { value: 10, label: '10s' },
  { value: 15, label: '15s' },
  { value: 20, label: '20s' },
  { value: 30, label: '30s' },
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
  const [loading, setLoading] = useState(false);
  const [storyboard, setStoryboard] = useState<Storyboard | null>(null);
  const [error, setError] = useState('');
  const [dragging, setDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Video generation state
  const [videoJob, setVideoJob] = useState<VideoJob | null>(null);
  const [videoError, setVideoError] = useState('');
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Merge + draft state
  const [merging, setMerging] = useState(false);
  const [mergedUrl, setMergedUrl] = useState('');
  const [mergeError, setMergeError] = useState('');
  const [draftCaption, setDraftCaption] = useState('');
  const [draftPlatforms, setDraftPlatforms] = useState<string[]>(['instagram_reels']);
  const [savingDraft, setSavingDraft] = useState(false);
  const [savedDraft, setSavedDraft] = useState<VideoDraft | null>(null);
  const [drafts, setDrafts] = useState<VideoDraft[]>([]);
  const [loadingDrafts, setLoadingDrafts] = useState(false);

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

  // Load video drafts on mount
  useEffect(() => {
    setLoadingDrafts(true);
    SocialMediaAgentService.listVideoDrafts()
      .then((res) => {
        if (res.status && res.responseData) setDrafts(res.responseData);
      })
      .catch(() => {})
      .finally(() => setLoadingDrafts(false));
  }, []);

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

  const handleGenerateStoryboard = async () => {
    if (images.length === 0) return;
    setLoading(true);
    setError('');
    setStoryboard(null);
    setVideoJob(null);
    setVideoError('');
    try {
      const res = await SocialMediaAgentService.generateStoryboard({
        brand_images: images.map((img) => img.dataUrl),
        optional_text: optionalText.trim() || undefined,
        target_platform: platform,
        target_duration_seconds: duration,
      });
      if (res.status && res.responseData) {
        setStoryboard(res.responseData);
      } else {
        setError(res.responseMessage || 'Storyboard generation failed. Please try again.');
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
    try {
      const res = await SocialMediaAgentService.generateVideoFromStoryboard({
        storyboard,
        brand_images: images.map((img) => img.dataUrl),
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
          <StoryboardResult storyboard={storyboard} uploadedImages={images} clipMap={clipMap} />

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

                        <label
                          style={{ fontSize: 12, fontWeight: 600, color: GREY, display: 'block', marginBottom: 6 }}
                        >
                          Caption
                        </label>
                        <textarea
                          value={draftCaption}
                          onChange={(e) => setDraftCaption(e.target.value)}
                          placeholder="Write a caption for this video…"
                          rows={3}
                          maxLength={2200}
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
        <p style={{ fontSize: 12, color: GREY, margin: '0 0 16px' }}>Videos saved for future posting</p>
        {loadingDrafts ? (
          <p style={{ fontSize: 13, color: GREY }}>Loading…</p>
        ) : drafts.length === 0 ? (
          <p style={{ fontSize: 13, color: '#9CA3AF' }}>No video drafts saved yet.</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {drafts.map((d) => (
              <div key={d.id} style={{ border: `1.5px solid ${BORDER}`, borderRadius: 12, overflow: 'hidden' }}>
                <video
                  src={d.video_url}
                  controls
                  playsInline
                  style={{ width: '100%', maxHeight: 320, display: 'block', background: '#000' }}
                />
                <div style={{ padding: '12px 14px' }}>
                  {d.content && (
                    <p style={{ fontSize: 13, color: DARK, margin: '0 0 8px', lineHeight: 1.5 }}>{d.content}</p>
                  )}
                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 6 }}>
                    {d.platforms.map((p) => (
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
                  </div>
                  <p style={{ fontSize: 11, color: '#9CA3AF', margin: 0 }}>
                    {new Date(d.created_at).toLocaleDateString()}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function Section({ title, subtitle, children }: { title: string; subtitle: string; children: React.ReactNode }) {
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

function Spinner({ label }: { label: string }) {
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

function StoryboardResult({
  storyboard,
  uploadedImages,
  clipMap,
}: {
  storyboard: Storyboard;
  uploadedImages: UploadedImage[];
  clipMap: Record<number, VideoClip>;
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
            refImage={uploadedImages[scene.reference_image_index]}
            clip={clipMap[scene.scene_number] ?? null}
          />
        ))}
      </div>
    </div>
  );
}

function Chip({ label, value }: { label: string; value: string }) {
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

function SceneCard({
  scene,
  startTime,
  refImage,
  clip,
}: {
  scene: StoryboardScene;
  startTime: number;
  refImage?: UploadedImage;
  clip: VideoClip | null;
}) {
  const [expanded, setExpanded] = useState(false);
  const endTime = startTime + scene.duration_seconds;

  const bgSrc = scene.frame_image_url ?? refImage?.dataUrl;

  return (
    <div style={{ borderRadius: 10, overflow: 'hidden', background: '#111', boxShadow: '0 2px 8px rgba(0,0,0,0.18)' }}>
      {/* Storyboard frame */}
      <div
        style={{ position: 'relative', aspectRatio: '4/3', cursor: 'pointer', userSelect: 'none' }}
        onClick={() => setExpanded((v) => !v)}
      >
        {/* Background image */}
        {bgSrc ? (
          <img
            src={bgSrc}
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
        ) : (
          <div style={{ position: 'absolute', inset: 0, background: '#1a1a2e' }} />
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
                  background: '#16a34a',
                  borderRadius: 4,
                  padding: '2px 7px',
                }}
              >
                Done
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
