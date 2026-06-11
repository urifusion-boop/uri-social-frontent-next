'use client';

import { useEffect, useRef, useState } from 'react';
import { SocialMediaAgentService, VideoPolishJob, VideoPolishStyle } from '@/src/api/SocialMediaAgentService';
import { ToastService } from '@/src/utils/toast.util';
import { ToastTypeEnum } from '@/src/models/enum-models/ToastTypeEnum';

const ACCEPTED_TYPES = ['video/mp4', 'video/quicktime', 'video/webm', 'video/x-m4v', 'video/3gpp'];
const MAX_MB = 500;

interface Props {
  onPolishComplete: () => void;
}

type Phase = 'pick' | 'uploading' | 'processing' | 'ready' | 'failed';

const ENERGY_ICONS = ['', '🔹', '🔸', '🔶', '⚡', '🔥'];

export default function VideoPolishForm({ onPolishComplete }: Props) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const [isDragging, setIsDragging] = useState(false);
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [videoPreviewUrl, setVideoPreviewUrl] = useState<string | null>(null);

  const [styles, setStyles] = useState<VideoPolishStyle[]>([]);
  const [selectedStyle, setSelectedStyle] = useState<string>('clean_professional');

  const [phase, setPhase] = useState<Phase>('pick');
  const [progress, setProgress] = useState(0);
  const [statusMessage, setStatusMessage] = useState('');
  const [qualityFlags, setQualityFlags] = useState<{ dark?: boolean; noisy?: boolean }>({});

  const [job, setJob] = useState<VideoPolishJob | null>(null);
  const [selectedClipIdx, setSelectedClipIdx] = useState(0);

  // Load style presets on mount
  useEffect(() => {
    SocialMediaAgentService.getVideoPolishStyles()
      .then((res) => {
        if (res?.responseData) setStyles(res.responseData);
      })
      .catch(() => {});
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
      if (videoPreviewUrl) URL.revokeObjectURL(videoPreviewUrl);
    };
  }, [videoPreviewUrl]);

  const acceptFile = (file: File) => {
    if (!ACCEPTED_TYPES.includes(file.type)) {
      ToastService.showToast('Please upload an MP4 or MOV video.', ToastTypeEnum.Error);
      return;
    }
    if (file.size > MAX_MB * 1024 * 1024) {
      ToastService.showToast(`File too large. Maximum is ${MAX_MB}MB.`, ToastTypeEnum.Error);
      return;
    }
    const url = URL.createObjectURL(file);
    const vid = document.createElement('video');
    vid.preload = 'metadata';
    vid.onloadedmetadata = () => {
      URL.revokeObjectURL(url);
      if (vid.duration < 120) {
        ToastService.showToast(
          `Video is too short (${Math.round(vid.duration)}s). Minimum is 2 minutes for AI polishing.`,
          ToastTypeEnum.Error
        );
        return;
      }
      setVideoFile(file);
      setVideoPreviewUrl(URL.createObjectURL(file));
    };
    vid.src = url;
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) acceptFile(file);
  };

  const startPolling = (jobId: string) => {
    if (pollRef.current) clearInterval(pollRef.current);
    pollRef.current = setInterval(async () => {
      try {
        const res = await SocialMediaAgentService.getVideoPolishJob(jobId);
        const j = res?.responseData;
        if (!j) return;

        setProgress(j.progress ?? 0);
        setStatusMessage(j.status_message ?? '');
        setQualityFlags(j.source_quality_flags ?? {});

        if (j.status === 'ready') {
          clearInterval(pollRef.current!);
          setJob(j);
          setPhase('ready');
        } else if (j.status === 'failed') {
          clearInterval(pollRef.current!);
          setStatusMessage(j.status_message ?? 'Processing failed.');
          setPhase('failed');
        }
      } catch {
        // transient error — keep polling
      }
    }, 4000);
  };

  const handleSubmit = async () => {
    if (!videoFile) {
      ToastService.showToast('Please select a video first.', ToastTypeEnum.Error);
      return;
    }

    setPhase('uploading');
    setProgress(0);
    setStatusMessage('Uploading your video…');

    try {
      const formData = new FormData();
      formData.append('video', videoFile);
      formData.append('style_preset', selectedStyle);
      formData.append('language', 'en-NG');

      const res = await SocialMediaAgentService.submitVideoPolish(formData);
      if (!res?.responseData?.job_id) throw new Error('No job ID returned');

      setPhase('processing');
      setStatusMessage('Analysing footage…');
      startPolling(res.responseData.job_id);
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ??
        'Upload failed. Please try again.';
      ToastService.showToast(msg, ToastTypeEnum.Error);
      setPhase('pick');
    }
  };

  const handleRestyle = async (newStyle: string) => {
    if (!job) return;
    setSelectedStyle(newStyle);
    setPhase('processing');
    setProgress(10);
    setStatusMessage('Restyling your clip…');

    try {
      const formData = new FormData();
      formData.append('original_job_id', job.job_id);
      formData.append('new_style_preset', newStyle);
      formData.append('language', 'en-NG');

      const res = await SocialMediaAgentService.restyleVideoPolish(formData);
      if (!res?.responseData?.job_id) throw new Error('No job ID');
      startPolling(res.responseData.job_id);
    } catch {
      ToastService.showToast('Restyle failed. Please try again.', ToastTypeEnum.Error);
      setPhase('ready');
    }
  };

  const handleApprove = () => {
    onPolishComplete();
    ToastService.showToast('Clip added to your drafts!', ToastTypeEnum.Success);
  };

  const handleReset = () => {
    if (pollRef.current) clearInterval(pollRef.current);
    setVideoFile(null);
    setVideoPreviewUrl(null);
    setJob(null);
    setPhase('pick');
    setProgress(0);
    setStatusMessage('');
    setSelectedClipIdx(0);
  };

  const selectedStyleObj = styles.find((s) => s.name === selectedStyle);

  // ── Quality warning banner ─────────────────────────────────────────────
  const qualityWarnings: string[] = [];
  if (qualityFlags.dark) qualityWarnings.push('a bit dark');
  if (qualityFlags.noisy) qualityWarnings.push('noisy audio');

  return (
    <div style={{ maxWidth: 680, margin: '0 auto' }}>
      {/* ── Pick phase ──────────────────────────────────────────────────── */}
      {phase === 'pick' && (
        <>
          {/* Headline */}
          <div style={{ marginBottom: 24 }}>
            <h2 style={{ fontSize: 22, fontWeight: 700, color: '#111', margin: 0 }}>Polish My Video</h2>
            <p style={{ fontSize: 14, color: '#6B7280', margin: '6px 0 0' }}>
              Film yourself. Jane makes it professional. Reframed · Captioned · Trimmed.
            </p>
          </div>

          {/* Upload area */}
          <div
            onDragOver={(e) => {
              e.preventDefault();
              setIsDragging(true);
            }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            style={{
              border: `2px dashed ${isDragging ? '#CD1B78' : '#E5E7EB'}`,
              borderRadius: 16,
              padding: '36px 24px',
              textAlign: 'center',
              cursor: 'pointer',
              background: isDragging ? '#FDF2F8' : '#FAFAFA',
              transition: 'all 0.15s',
              marginBottom: 24,
            }}
          >
            {videoFile ? (
              <div>
                <div style={{ fontSize: 32, marginBottom: 8 }}>🎬</div>
                <div style={{ fontWeight: 600, color: '#111', fontSize: 15 }}>{videoFile.name}</div>
                <div style={{ fontSize: 13, color: '#6B7280', marginTop: 4 }}>
                  {(videoFile.size / (1024 * 1024)).toFixed(1)} MB
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleReset();
                  }}
                  style={{
                    marginTop: 12,
                    fontSize: 12,
                    color: '#CD1B78',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    textDecoration: 'underline',
                  }}
                >
                  Remove
                </button>
              </div>
            ) : (
              <div>
                <div style={{ fontSize: 40, marginBottom: 12 }}>📹</div>
                <div style={{ fontWeight: 600, color: '#374151', fontSize: 15 }}>
                  Drop your video here, or click to browse
                </div>
                <div style={{ fontSize: 13, color: '#9CA3AF', marginTop: 6 }}>
                  MP4, MOV · Min 2 min · Max 3 hours · Max 500MB
                </div>
              </div>
            )}
            <input
              ref={fileInputRef}
              type="file"
              accept="video/mp4,video/quicktime,video/webm,.mp4,.mov,.webm"
              style={{ display: 'none' }}
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) acceptFile(f);
              }}
            />
          </div>

          {/* Filming tips */}
          {!videoFile && (
            <div
              style={{
                background: '#F0FDF4',
                border: '1px solid #BBF7D0',
                borderRadius: 12,
                padding: '14px 18px',
                marginBottom: 24,
                fontSize: 13,
              }}
            >
              <div style={{ fontWeight: 600, color: '#166534', marginBottom: 6 }}>💡 Tips for the best result</div>
              <div style={{ color: '#15803D', lineHeight: 1.7 }}>
                📍 Film in a quiet spot · 💡 Face a window for natural light · 📱 Hold your phone steady
              </div>
            </div>
          )}

          {/* Style picker */}
          <div style={{ marginBottom: 24 }}>
            <div style={{ fontWeight: 600, color: '#374151', fontSize: 14, marginBottom: 12 }}>Choose a style</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              {(styles.length > 0 ? styles : FALLBACK_STYLES).map((s) => {
                const active = selectedStyle === s.name;
                return (
                  <button
                    key={s.name}
                    onClick={() => setSelectedStyle(s.name)}
                    style={{
                      textAlign: 'left',
                      padding: '14px 16px',
                      borderRadius: 12,
                      border: active ? '2px solid #CD1B78' : '1.5px solid #E5E7EB',
                      background: active ? '#FDF2F8' : '#fff',
                      cursor: 'pointer',
                      transition: 'all 0.15s',
                    }}
                  >
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        marginBottom: 4,
                      }}
                    >
                      <span style={{ fontWeight: 700, fontSize: 13, color: active ? '#CD1B78' : '#111' }}>
                        {s.display_name}
                      </span>
                      <span style={{ fontSize: 12 }}>{ENERGY_ICONS[s.energy_level] ?? ''}</span>
                    </div>
                    <div style={{ fontSize: 12, color: '#6B7280', lineHeight: 1.4 }}>{s.description}</div>
                    <div style={{ fontSize: 11, color: '#9CA3AF', marginTop: 4 }}>Best for: {s.best_for}</div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Submit */}
          <button
            onClick={handleSubmit}
            disabled={!videoFile}
            style={{
              width: '100%',
              padding: '14px 0',
              borderRadius: 12,
              background: videoFile ? 'linear-gradient(135deg, #CD1B78 0%, #A01560 100%)' : '#E5E7EB',
              color: videoFile ? '#fff' : '#9CA3AF',
              fontWeight: 700,
              fontSize: 15,
              border: 'none',
              cursor: videoFile ? 'pointer' : 'not-allowed',
              transition: 'all 0.15s',
            }}
          >
            Polish My Video ✨
          </button>

          <div style={{ fontSize: 12, color: '#9CA3AF', textAlign: 'center', marginTop: 10 }}>
            1 credit for clips under 2 min · 2 credits for 2–10 min
          </div>
        </>
      )}

      {/* ── Uploading / Processing phase ────────────────────────────────── */}
      {(phase === 'uploading' || phase === 'processing') && (
        <div style={{ textAlign: 'center', padding: '48px 24px' }}>
          <div style={{ fontSize: 48, marginBottom: 20 }}>✨</div>
          <div style={{ fontWeight: 700, fontSize: 18, color: '#111', marginBottom: 8 }}>
            {phase === 'uploading' ? 'Uploading your video…' : 'Polishing your clip…'}
          </div>
          <div style={{ fontSize: 14, color: '#6B7280', marginBottom: 28, minHeight: 20 }}>
            {statusMessage || 'This usually takes about 2 minutes'}
          </div>

          {/* Progress bar */}
          <div
            style={{
              background: '#F3F4F6',
              borderRadius: 999,
              height: 8,
              overflow: 'hidden',
              marginBottom: 12,
              maxWidth: 400,
              margin: '0 auto 12px',
            }}
          >
            <div
              style={{
                height: '100%',
                borderRadius: 999,
                background: 'linear-gradient(90deg, #CD1B78, #A01560)',
                width: `${progress}%`,
                transition: 'width 0.6s ease',
              }}
            />
          </div>
          <div style={{ fontSize: 13, color: '#9CA3AF', marginBottom: 24 }}>{progress}%</div>

          {/* What Jane is doing */}
          <div
            style={{
              background: '#FDF2F8',
              borderRadius: 12,
              padding: '16px 20px',
              maxWidth: 400,
              margin: '0 auto',
              textAlign: 'left',
            }}
          >
            <div style={{ fontWeight: 600, fontSize: 13, color: '#CD1B78', marginBottom: 10 }}>What Jane is doing:</div>
            {[
              { label: 'Checking footage quality', done: progress >= 10 },
              { label: 'Uploading to processing engine', done: progress >= 30 },
              { label: 'Transcribing with AI', done: progress >= 50 },
              { label: 'Reframing to vertical (9:16)', done: progress >= 65 },
              { label: 'Adding animated captions', done: progress >= 78 },
              { label: 'Trimming filler + dead air', done: progress >= 88 },
              { label: 'Rendering final clip', done: progress >= 95 },
            ].map((step) => (
              <div key={step.label} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                <span style={{ fontSize: 14, minWidth: 18 }}>{step.done ? '✅' : '⏳'}</span>
                <span style={{ fontSize: 13, color: step.done ? '#374151' : '#9CA3AF' }}>{step.label}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Ready phase ─────────────────────────────────────────────────── */}
      {phase === 'ready' && job && (
        <div>
          {/* Quality warning if flags were set */}
          {qualityWarnings.length > 0 && (
            <div
              style={{
                background: '#FFFBEB',
                border: '1px solid #FDE68A',
                borderRadius: 12,
                padding: '12px 16px',
                marginBottom: 20,
                fontSize: 13,
                color: '#92400E',
              }}
            >
              ⚠️ Note: this footage was {qualityWarnings.join(' and ')}. The clip has been processed but may not look
              its best. Check captions before posting, especially for Pidgin.
            </div>
          )}

          <div style={{ fontWeight: 700, fontSize: 20, color: '#111', marginBottom: 6 }}>Your clip is ready! 🎉</div>
          <div style={{ fontSize: 14, color: '#6B7280', marginBottom: 20 }}>
            {job.output_clips.length} clip{job.output_clips.length !== 1 ? 's' : ''} generated · Style:{' '}
            {selectedStyleObj?.display_name ?? selectedStyle.replace(/_/g, ' ')}
          </div>

          {/* Clip selector tabs */}
          {job.output_clips.length > 1 && (
            <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
              {job.output_clips.map((clip, i) => (
                <button
                  key={i}
                  onClick={() => setSelectedClipIdx(i)}
                  style={{
                    padding: '6px 14px',
                    borderRadius: 8,
                    fontSize: 13,
                    border: selectedClipIdx === i ? '2px solid #CD1B78' : '1.5px solid #E5E7EB',
                    background: selectedClipIdx === i ? '#FDF2F8' : '#fff',
                    color: selectedClipIdx === i ? '#CD1B78' : '#6B7280',
                    cursor: 'pointer',
                    fontWeight: 600,
                    maxWidth: 180,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}
                  title={clip.title ?? `Clip ${i + 1}`}
                >
                  #{i + 1} ·{' '}
                  {clip.title
                    ? clip.title.slice(0, 22) + (clip.title.length > 22 ? '…' : '')
                    : `${Math.round(clip.duration)}s`}
                </button>
              ))}
            </div>
          )}

          {/* Two-column: portrait video | transcript + metadata */}
          {job.output_clips[selectedClipIdx]?.clip_url && (
            <div style={{ display: 'flex', gap: 20, marginBottom: 20, alignItems: 'flex-start' }}>
              {/* Portrait video player */}
              <div
                style={{
                  flexShrink: 0,
                  width: 220,
                  borderRadius: 16,
                  overflow: 'hidden',
                  background: '#000',
                }}
              >
                <video
                  key={
                    job.output_clips[selectedClipIdx].captioned_clip_url || job.output_clips[selectedClipIdx].clip_url
                  }
                  src={
                    job.output_clips[selectedClipIdx].captioned_clip_url || job.output_clips[selectedClipIdx].clip_url
                  }
                  controls
                  playsInline
                  style={{ width: '100%', display: 'block' }}
                />
              </div>

              {/* Right panel: title, virality, transcript */}
              <div style={{ flex: 1, minWidth: 0 }}>
                {/* Title */}
                {job.output_clips[selectedClipIdx].title && (
                  <div style={{ fontWeight: 700, fontSize: 15, color: '#111', marginBottom: 10 }}>
                    {job.output_clips[selectedClipIdx].title}
                  </div>
                )}

                {/* Virality score */}
                {(job.output_clips[selectedClipIdx].virality_score ?? 0) > 0 && (
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: 4, marginBottom: 10 }}>
                    <span style={{ fontWeight: 800, fontSize: 26, color: '#CD1B78', lineHeight: 1 }}>
                      {(job.output_clips[selectedClipIdx].virality_score ?? 0).toFixed(1)}
                    </span>
                    <span style={{ fontSize: 13, color: '#9CA3AF' }}>/10 virality</span>
                  </div>
                )}

                {/* Hook */}
                {job.output_clips[selectedClipIdx].hook && (
                  <div
                    style={{
                      fontSize: 12,
                      color: '#6B7280',
                      fontStyle: 'italic',
                      marginBottom: 12,
                      lineHeight: 1.5,
                    }}
                  >
                    &ldquo;{job.output_clips[selectedClipIdx].hook}&rdquo;
                  </div>
                )}

                {/* Transcript */}
                {job.output_clips[selectedClipIdx].caption_text && (
                  <div>
                    <div
                      style={{
                        fontSize: 11,
                        fontWeight: 700,
                        color: '#9CA3AF',
                        textTransform: 'uppercase',
                        letterSpacing: '0.08em',
                        marginBottom: 6,
                      }}
                    >
                      Transcript
                    </div>
                    <div
                      style={{
                        fontSize: 13,
                        color: '#374151',
                        lineHeight: 1.65,
                        maxHeight: 260,
                        overflowY: 'auto',
                        paddingRight: 4,
                      }}
                    >
                      {job.output_clips[selectedClipIdx].caption_text}
                    </div>
                  </div>
                )}

                {/* Duration + style metadata */}
                <div style={{ marginTop: 12, fontSize: 12, color: '#9CA3AF' }}>
                  {Math.round(job.output_clips[selectedClipIdx].duration)}s &middot;{' '}
                  {selectedStyleObj?.display_name ?? selectedStyle.replace(/_/g, ' ')} &middot; {job.credits_charged}{' '}
                  credits
                </div>
              </div>
            </div>
          )}

          {/* Actions */}
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <button
              onClick={handleApprove}
              style={{
                flex: 1,
                minWidth: 160,
                padding: '13px 0',
                borderRadius: 12,
                background: 'linear-gradient(135deg, #CD1B78 0%, #A01560 100%)',
                color: '#fff',
                fontWeight: 700,
                fontSize: 15,
                border: 'none',
                cursor: 'pointer',
              }}
            >
              Approve & Schedule ✅
            </button>
            <button
              onClick={() => setPhase('pick')}
              style={{
                flex: 1,
                minWidth: 140,
                padding: '13px 0',
                borderRadius: 12,
                border: '1.5px solid #E5E7EB',
                background: '#fff',
                color: '#374151',
                fontWeight: 600,
                fontSize: 14,
                cursor: 'pointer',
              }}
            >
              Try a Different Style
            </button>
            <button
              onClick={handleReset}
              style={{
                padding: '13px 20px',
                borderRadius: 12,
                border: '1.5px solid #E5E7EB',
                background: '#fff',
                color: '#6B7280',
                fontWeight: 600,
                fontSize: 14,
                cursor: 'pointer',
              }}
            >
              Skip
            </button>
          </div>

          {/* Restyle panel — shown when "Try a Different Style" is picked */}
          {phase === 'ready' && (
            <div style={{ marginTop: 20 }}>
              <div style={{ fontWeight: 600, color: '#374151', fontSize: 14, marginBottom: 12 }}>
                Or pick a different style (0.5 credits):
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                {(styles.length > 0 ? styles : FALLBACK_STYLES)
                  .filter((s) => s.name !== selectedStyle)
                  .map((s) => (
                    <button
                      key={s.name}
                      onClick={() => handleRestyle(s.name)}
                      style={{
                        textAlign: 'left',
                        padding: '12px 14px',
                        borderRadius: 10,
                        border: '1.5px solid #E5E7EB',
                        background: '#fff',
                        cursor: 'pointer',
                        transition: 'all 0.15s',
                      }}
                      onMouseOver={(e) => (e.currentTarget.style.borderColor = '#CD1B78')}
                      onMouseOut={(e) => (e.currentTarget.style.borderColor = '#E5E7EB')}
                    >
                      <div style={{ fontWeight: 700, fontSize: 13, color: '#111', marginBottom: 2 }}>
                        {s.display_name} {ENERGY_ICONS[s.energy_level] ?? ''}
                      </div>
                      <div style={{ fontSize: 12, color: '#6B7280' }}>{s.description}</div>
                    </button>
                  ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── Failed phase ─────────────────────────────────────────────────── */}
      {phase === 'failed' && (
        <div style={{ textAlign: 'center', padding: '48px 24px' }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>😔</div>
          <div style={{ fontWeight: 700, fontSize: 18, color: '#111', marginBottom: 8 }}>Something went wrong</div>
          <div style={{ fontSize: 14, color: '#6B7280', marginBottom: 24 }}>
            {statusMessage || 'Processing failed. Please try again.'}
          </div>
          <button
            onClick={handleReset}
            style={{
              padding: '12px 32px',
              borderRadius: 12,
              background: 'linear-gradient(135deg, #CD1B78 0%, #A01560 100%)',
              color: '#fff',
              fontWeight: 700,
              fontSize: 15,
              border: 'none',
              cursor: 'pointer',
            }}
          >
            Try Again
          </button>
        </div>
      )}
    </div>
  );
}

// Fallback if API is not yet configured
const FALLBACK_STYLES: VideoPolishStyle[] = [
  {
    name: 'naija_bold',
    display_name: 'Naija Bold',
    description: 'High-energy, bold captions, fast cuts',
    best_for: 'Sales, promos',
    energy_level: 5,
    good_for_intents: [],
  },
  {
    name: 'clean_professional',
    display_name: 'Clean Professional',
    description: 'Minimal captions, steady reframe',
    best_for: 'B2B, services',
    energy_level: 2,
    good_for_intents: [],
  },
  {
    name: 'street_casual',
    display_name: 'Street Casual',
    description: 'Playful captions, relaxed pacing',
    best_for: 'Lifestyle',
    energy_level: 3,
    good_for_intents: [],
  },
  {
    name: 'storyteller',
    display_name: 'Storyteller',
    description: 'Emphasizes key words, slower pacing',
    best_for: 'Founder stories',
    energy_level: 2,
    good_for_intents: [],
  },
  {
    name: 'product_pop',
    display_name: 'Product Pop',
    description: 'Punchy, product-focused captions',
    best_for: 'Product demos',
    energy_level: 4,
    good_for_intents: [],
  },
  {
    name: 'minimal_clean',
    display_name: 'Minimal Clean',
    description: 'Simple captions, no transitions',
    best_for: 'Premium brands',
    energy_level: 1,
    good_for_intents: [],
  },
];
