'use client';

import { useEffect, useRef, useState } from 'react';
import { SocialMediaAgentService } from '@/src/api/SocialMediaAgentService';
import { ToastService } from '@/src/utils/toast.util';
import { ToastTypeEnum } from '@/src/models/enum-models/ToastTypeEnum';

const ACCEPTED_TYPES = ['video/mp4', 'video/quicktime', 'video/webm', 'video/x-m4v'];
const MAX_MB = 500;

const SUBMAGIC_TEMPLATES = [
  { name: 'Sara', feel: 'Clean, minimal, modern', icon: '✨' },
  { name: 'Matt', feel: 'Bold, high-impact', icon: '🔥' },
  { name: 'Hormozi 1', feel: 'Punchy authority', icon: '💪' },
  { name: 'Beast', feel: 'Viral, high-energy', icon: '⚡' },
  { name: 'Mark', feel: 'Smooth, professional', icon: '🎯' },
  { name: 'Kelly 2', feel: 'Trendy, social-first', icon: '💫' },
  { name: 'Daniel', feel: 'Classic, trustworthy', icon: '⭐' },
  { name: 'Iman', feel: 'Premium, modern', icon: '👑' },
] as const;

type TemplateName = (typeof SUBMAGIC_TEMPLATES)[number]['name'];
type SilencePace = 'off' | 'natural' | 'fast' | 'extra-fast';
type Phase = 'pick' | 'uploading' | 'processing' | 'ready' | 'failed';

interface Props {
  onSaveToDrafts?: () => void;
}

const STATUS_LABEL: Record<string, string> = {
  processing: 'Analysing your video…',
  transcribing: 'Transcribing audio…',
  exporting: 'Rendering final video…',
  completed: 'Done!',
  failed: 'Something went wrong',
};

const STATUS_PROGRESS: Record<string, number> = {
  processing: 25,
  transcribing: 55,
  exporting: 80,
  completed: 100,
};

export default function SubmagicProductionForm({ onSaveToDrafts }: Props) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);

  const [isDragging, setIsDragging] = useState(false);
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [videoPreviewUrl, setVideoPreviewUrl] = useState<string | null>(null);

  const [templateName, setTemplateName] = useState<TemplateName>('Sara');
  const [silencePace, setSilencePace] = useState<SilencePace>('natural');
  const [magicZooms, setMagicZooms] = useState(false);
  const [magicBrolls, setMagicBrolls] = useState(false);
  const [cleanAudio, setCleanAudio] = useState(false);
  const [removeBadTakes, setRemoveBadTakes] = useState(false);

  const [enableMusic, setEnableMusic] = useState(false);
  const [customMusicFile, setCustomMusicFile] = useState<File | null>(null);
  const customMusicInputRef = useRef<HTMLInputElement>(null);

  const [phase, setPhase] = useState<Phase>('pick');
  const [submagicStatus, setSubmagicStatus] = useState('processing');
  const [jobId, setJobId] = useState<string | null>(null);
  const [outputUrl, setOutputUrl] = useState<string | null>(null);
  const [failureReason, setFailureReason] = useState<string | null>(null);

  // Save-to-drafts state
  const [publishPlatforms, setPublishPlatforms] = useState<string[]>([]);
  const [publishCaption, setPublishCaption] = useState('');
  const [isSavingDraft, setIsSavingDraft] = useState(false);

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
      ToastService.showToast(`File too large. Max ${MAX_MB} MB.`, ToastTypeEnum.Error);
      return;
    }
    setVideoFile(file);
    setVideoPreviewUrl(URL.createObjectURL(file));
  };

  const startPolling = (id: string) => {
    if (pollRef.current) clearInterval(pollRef.current);
    pollRef.current = setInterval(async () => {
      try {
        const res = await SocialMediaAgentService.getSubmagicJob(id);
        const data = res?.responseData;
        if (!data) return;

        setSubmagicStatus(data.status);

        if (data.status === 'completed' && data.output_url) {
          if (pollRef.current) clearInterval(pollRef.current);
          setOutputUrl(data.output_url);
          setPhase('ready');
        } else if (data.status === 'failed') {
          if (pollRef.current) clearInterval(pollRef.current);
          setFailureReason(data.failure_reason);
          setPhase('failed');
        }
      } catch {
        // network blip — keep polling
      }
    }, 8000);
  };

  const handleSubmit = async () => {
    if (!videoFile) return;
    setPhase('uploading');

    const formData = new FormData();
    formData.append('video', videoFile);
    formData.append('template_name', templateName);
    formData.append('language', 'en');
    formData.append('remove_silence_pace', silencePace === 'off' ? '' : silencePace);
    formData.append('magic_zooms', String(magicZooms));
    formData.append('magic_brolls', String(magicBrolls));
    formData.append('clean_audio', String(cleanAudio));
    formData.append('remove_bad_takes', String(removeBadTakes));
    formData.append('enable_music', String(enableMusic));
    if (enableMusic && customMusicFile) formData.append('custom_music', customMusicFile);

    try {
      const res = await SocialMediaAgentService.produceWithSubmagic(formData);
      const id = res?.responseData?.job_id;
      if (!id) throw new Error('No job ID returned');
      setJobId(id);
      setPhase('processing');
      setSubmagicStatus('processing');
      startPolling(id);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Upload failed';
      ToastService.showToast(msg, ToastTypeEnum.Error);
      setPhase('pick');
    }
  };

  const handleReset = () => {
    if (pollRef.current) clearInterval(pollRef.current);
    setVideoFile(null);
    setVideoPreviewUrl(null);
    setJobId(null);
    setOutputUrl(null);
    setFailureReason(null);
    setSubmagicStatus('processing');
    setPhase('pick');
    setPublishPlatforms([]);
    setPublishCaption('');
    setEnableMusic(false);
    setCustomMusicFile(null);
  };

  const handleSaveToDrafts = async () => {
    if (!outputUrl || publishPlatforms.length === 0) return;
    setIsSavingDraft(true);
    try {
      await SocialMediaAgentService.saveVideoDraft({
        merged_video_url: outputUrl,
        caption: publishCaption,
        platforms: publishPlatforms,
      });
      ToastService.showToast('Video saved to drafts!', ToastTypeEnum.Success);
      onSaveToDrafts?.();
    } catch {
      ToastService.showToast('Could not save draft — try again.', ToastTypeEnum.Error);
    } finally {
      setIsSavingDraft(false);
    }
  };

  // ── Ready ──────────────────────────────────────────────────────────────────
  if (phase === 'ready' && outputUrl) {
    return (
      <div style={{ padding: '20px 0', maxWidth: 560 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 18 }}>
          <div
            style={{
              width: 32,
              height: 32,
              borderRadius: 10,
              background: 'linear-gradient(135deg,#16a34a,#15803d)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 16,
            }}
          >
            ✓
          </div>
          <div>
            <div style={{ fontWeight: 800, fontSize: 15, color: '#111' }}>Submagic video ready</div>
            <div style={{ fontSize: 12, color: '#888' }}>Template: {templateName}</div>
          </div>
        </div>

        <div style={{ borderRadius: 12, overflow: 'hidden', background: '#000', marginBottom: 16 }}>
          <video
            ref={videoRef}
            src={outputUrl}
            controls
            playsInline
            style={{ width: '100%', maxHeight: 480, display: 'block', objectFit: 'contain' }}
          />
        </div>

        {/* Save to Drafts */}
        <div
          style={{
            background: '#fafaf9',
            border: '1.5px solid #e8e5e3',
            borderRadius: 12,
            padding: '14px 16px',
            marginBottom: 16,
          }}
        >
          <div style={{ fontWeight: 700, fontSize: 13, color: '#333', marginBottom: 12 }}>Save to Drafts</div>

          <div style={{ marginBottom: 12 }}>
            <div style={{ fontSize: 12, color: '#777', marginBottom: 8, fontWeight: 600 }}>Select platforms</div>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {(
                [
                  { key: 'instagram', label: 'Instagram' },
                  { key: 'tiktok', label: 'TikTok' },
                  { key: 'facebook', label: 'Facebook' },
                  { key: 'youtube', label: 'YouTube Shorts' },
                ] as { key: string; label: string }[]
              ).map((p) => {
                const selected = publishPlatforms.includes(p.key);
                return (
                  <button
                    key={p.key}
                    type="button"
                    onClick={() =>
                      setPublishPlatforms((prev) => (selected ? prev.filter((x) => x !== p.key) : [...prev, p.key]))
                    }
                    style={{
                      padding: '5px 14px',
                      borderRadius: 20,
                      border: selected ? '1.5px solid #C2185B' : '1.5px solid #E5E7EB',
                      background: selected ? '#FDF2F8' : '#fff',
                      color: selected ? '#C2185B' : '#6B7280',
                      fontSize: 12,
                      fontWeight: 600,
                      cursor: 'pointer',
                      transition: 'all 0.15s',
                    }}
                  >
                    {p.label}
                  </button>
                );
              })}
            </div>
          </div>

          <div style={{ marginBottom: 12 }}>
            <div style={{ fontSize: 12, color: '#777', marginBottom: 8, fontWeight: 600 }}>Caption</div>
            <textarea
              value={publishCaption}
              onChange={(e) => setPublishCaption(e.target.value)}
              placeholder="Write a caption for your post…"
              rows={3}
              style={{
                width: '100%',
                padding: '10px 12px',
                borderRadius: 8,
                border: '1.5px solid #E5E7EB',
                fontSize: 13,
                color: '#111',
                resize: 'vertical',
                fontFamily: 'inherit',
                boxSizing: 'border-box',
                outline: 'none',
              }}
            />
          </div>

          <button
            type="button"
            onClick={handleSaveToDrafts}
            disabled={isSavingDraft || publishPlatforms.length === 0}
            style={{
              width: '100%',
              padding: '10px 0',
              borderRadius: 9,
              border: 'none',
              background: publishPlatforms.length === 0 ? '#e0dcd9' : 'linear-gradient(135deg,#C2185B,#8E1545)',
              color: publishPlatforms.length === 0 ? '#aaa' : '#fff',
              fontWeight: 700,
              fontSize: 13,
              cursor: publishPlatforms.length === 0 || isSavingDraft ? 'not-allowed' : 'pointer',
            }}
          >
            {isSavingDraft ? 'Saving…' : 'Save to Drafts'}
          </button>
        </div>

        <div style={{ display: 'flex', gap: 10 }}>
          <a
            href={outputUrl}
            download="submagic-video.mp4"
            target="_blank"
            rel="noreferrer"
            style={{
              flex: 1,
              padding: '11px 0',
              borderRadius: 10,
              textAlign: 'center',
              background: 'linear-gradient(135deg,#C2185B,#8E1545)',
              color: '#fff',
              fontWeight: 700,
              fontSize: 14,
              textDecoration: 'none',
            }}
          >
            Download Video
          </a>
          <button
            onClick={handleReset}
            style={{
              padding: '11px 18px',
              borderRadius: 10,
              border: '1.5px solid #e0dcd9',
              background: '#fff',
              color: '#555',
              fontWeight: 600,
              fontSize: 13,
              cursor: 'pointer',
            }}
          >
            Produce Another
          </button>
        </div>
      </div>
    );
  }

  // ── Failed ─────────────────────────────────────────────────────────────────
  if (phase === 'failed') {
    return (
      <div style={{ padding: '32px 0', maxWidth: 440 }}>
        <div style={{ fontWeight: 700, fontSize: 15, color: '#b91c1c', marginBottom: 8 }}>Production failed</div>
        {failureReason && <div style={{ fontSize: 13, color: '#888', marginBottom: 20 }}>{failureReason}</div>}
        <button
          onClick={handleReset}
          style={{
            padding: '10px 20px',
            borderRadius: 10,
            border: 'none',
            background: 'linear-gradient(135deg,#C2185B,#8E1545)',
            color: '#fff',
            fontWeight: 700,
            fontSize: 13,
            cursor: 'pointer',
          }}
        >
          Try Again
        </button>
      </div>
    );
  }

  // ── Processing / Uploading ─────────────────────────────────────────────────
  if (phase === 'processing' || phase === 'uploading') {
    const progress = phase === 'uploading' ? 10 : (STATUS_PROGRESS[submagicStatus] ?? 30);
    const label = phase === 'uploading' ? 'Uploading video…' : (STATUS_LABEL[submagicStatus] ?? 'Processing…');

    return (
      <div style={{ padding: '32px 0', maxWidth: 440 }}>
        <div style={{ marginBottom: 20, fontWeight: 700, fontSize: 15, color: '#111' }}>Producing with Submagic</div>

        <div style={{ background: '#f0eeec', borderRadius: 8, height: 8, marginBottom: 10 }}>
          <div
            style={{
              height: 8,
              borderRadius: 8,
              background: 'linear-gradient(90deg,#C2185B,#E91E63)',
              width: `${progress}%`,
              transition: 'width 1.2s ease',
            }}
          />
        </div>
        <div style={{ fontSize: 13, color: '#888', marginBottom: 24 }}>{label}</div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {(
            [
              { label: 'Upload', threshold: 10 },
              { label: 'Transcription', threshold: 55 },
              { label: 'Rendering', threshold: 80 },
              { label: 'Complete', threshold: 100 },
            ] as { label: string; threshold: number }[]
          ).map((stage) => {
            const done = progress >= stage.threshold;
            const active = !done && progress >= stage.threshold - 30;
            return (
              <div key={stage.label} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div
                  style={{
                    width: 20,
                    height: 20,
                    borderRadius: '50%',
                    flexShrink: 0,
                    background: done ? '#16a34a' : active ? '#C2185B' : '#e8e5e3',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 11,
                    color: '#fff',
                    fontWeight: 800,
                    transition: 'background 0.4s',
                  }}
                >
                  {done ? '✓' : active ? '…' : ''}
                </div>
                <div
                  style={{
                    fontSize: 13,
                    color: done ? '#111' : active ? '#C2185B' : '#bbb',
                    fontWeight: done || active ? 600 : 400,
                  }}
                >
                  {stage.label}
                </div>
              </div>
            );
          })}
        </div>

        <div
          style={{
            marginTop: 24,
            padding: '10px 14px',
            borderRadius: 8,
            background: '#f8f7f5',
            border: '1px solid #e8e5e3',
            fontSize: 12,
            color: '#888',
          }}
        >
          Submagic typically takes 2–5 minutes. This page will update automatically.
        </div>
      </div>
    );
  }

  // ── Pick ───────────────────────────────────────────────────────────────────
  const canSubmit = !!videoFile;

  return (
    <div style={{ padding: '20px 0', maxWidth: 620 }}>
      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <div style={{ fontWeight: 800, fontSize: 16, color: '#111', marginBottom: 4 }}>Produce with Submagic</div>
        <div style={{ fontSize: 13, color: '#888' }}>
          Auto captions, silence removal, AI b-roll and zooms — powered by Submagic.
        </div>
      </div>

      {/* Upload */}
      <div style={{ marginBottom: 24 }}>
        <div
          style={{
            fontSize: 12,
            fontWeight: 700,
            color: '#555',
            marginBottom: 10,
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
          }}
        >
          Upload Video
        </div>

        {videoFile ? (
          <div
            style={{
              borderRadius: 12,
              overflow: 'hidden',
              background: '#000',
              marginBottom: 10,
              position: 'relative',
            }}
          >
            <video
              src={videoPreviewUrl ?? undefined}
              controls
              playsInline
              style={{ width: '100%', maxHeight: 260, display: 'block', objectFit: 'contain' }}
            />
            <button
              onClick={() => {
                setVideoFile(null);
                setVideoPreviewUrl(null);
              }}
              style={{
                position: 'absolute',
                top: 8,
                right: 8,
                width: 28,
                height: 28,
                borderRadius: '50%',
                background: 'rgba(0,0,0,0.6)',
                border: 'none',
                color: '#fff',
                fontSize: 14,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              ✕
            </button>
          </div>
        ) : (
          <div
            onClick={() => fileInputRef.current?.click()}
            onDragOver={(e) => {
              e.preventDefault();
              setIsDragging(true);
            }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={(e) => {
              e.preventDefault();
              setIsDragging(false);
              const f = e.dataTransfer.files[0];
              if (f) acceptFile(f);
            }}
            style={{
              border: `2px dashed ${isDragging ? '#C2185B' : '#d1cdc9'}`,
              borderRadius: 12,
              padding: '32px 20px',
              textAlign: 'center',
              cursor: 'pointer',
              background: isDragging ? '#fdf2f8' : '#fafaf9',
              transition: 'all 0.15s',
            }}
          >
            <div style={{ fontSize: 28, marginBottom: 8 }}>🎬</div>
            <div style={{ fontWeight: 700, fontSize: 14, color: '#333', marginBottom: 4 }}>Drop your video here</div>
            <div style={{ fontSize: 12, color: '#999' }}>MP4 or MOV · max 500 MB</div>
          </div>
        )}

        <input
          ref={fileInputRef}
          type="file"
          accept="video/mp4,video/quicktime,video/webm"
          style={{ display: 'none' }}
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) acceptFile(f);
          }}
        />
      </div>

      {/* Template picker */}
      <div style={{ marginBottom: 24 }}>
        <div
          style={{
            fontSize: 12,
            fontWeight: 700,
            color: '#555',
            marginBottom: 10,
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
          }}
        >
          Caption Style
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10 }}>
          {SUBMAGIC_TEMPLATES.map((t) => {
            const selected = templateName === t.name;
            return (
              <button
                key={t.name}
                type="button"
                onClick={() => setTemplateName(t.name)}
                style={{
                  padding: '12px 8px',
                  borderRadius: 10,
                  border: selected ? '2px solid #C2185B' : '1.5px solid #E5E7EB',
                  background: selected ? '#FDF2F8' : '#fff',
                  cursor: 'pointer',
                  textAlign: 'center',
                  transition: 'all 0.15s',
                }}
              >
                <div style={{ fontSize: 20, marginBottom: 4 }}>{t.icon}</div>
                <div style={{ fontSize: 12, fontWeight: 700, color: selected ? '#C2185B' : '#222', marginBottom: 2 }}>
                  {t.name}
                </div>
                <div style={{ fontSize: 10, color: '#999', lineHeight: 1.3 }}>{t.feel}</div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Options */}
      <div
        style={{
          background: '#fafaf9',
          border: '1.5px solid #e8e5e3',
          borderRadius: 12,
          padding: '14px 16px',
          marginBottom: 24,
        }}
      >
        <div style={{ fontWeight: 700, fontSize: 13, color: '#333', marginBottom: 14 }}>Options</div>

        {/* Silence removal */}
        <div style={{ marginBottom: 14 }}>
          <div style={{ fontSize: 12, color: '#777', marginBottom: 8, fontWeight: 600 }}>Silence Removal</div>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {(
              [
                { value: 'off', label: 'Off' },
                { value: 'natural', label: 'Natural' },
                { value: 'fast', label: 'Fast' },
                { value: 'extra-fast', label: 'Extra Fast' },
              ] as { value: SilencePace; label: string }[]
            ).map((opt) => {
              const active = silencePace === opt.value;
              return (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setSilencePace(opt.value)}
                  style={{
                    padding: '5px 12px',
                    borderRadius: 20,
                    border: active ? '1.5px solid #C2185B' : '1.5px solid #E5E7EB',
                    background: active ? '#FDF2F8' : '#fff',
                    color: active ? '#C2185B' : '#6B7280',
                    fontSize: 12,
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  {opt.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Toggle options */}
        {(
          [
            { label: 'Magic Zooms', sub: 'Auto zoom effects on key moments', state: magicZooms, set: setMagicZooms },
            { label: 'AI B-Roll', sub: 'Insert relevant b-roll cutaways', state: magicBrolls, set: setMagicBrolls },
            { label: 'Clean Audio', sub: 'Remove background noise', state: cleanAudio, set: setCleanAudio },
            {
              label: 'Remove Bad Takes',
              sub: 'AI detects and cuts poor takes',
              state: removeBadTakes,
              set: setRemoveBadTakes,
            },
          ] as { label: string; sub: string; state: boolean; set: (v: boolean) => void }[]
        ).map((opt) => (
          <div
            key={opt.label}
            onClick={() => opt.set(!opt.state)}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '10px 0',
              borderTop: '1px solid #f0eeed',
              cursor: 'pointer',
            }}
          >
            <div>
              <div style={{ fontSize: 13, fontWeight: 600, color: '#222' }}>{opt.label}</div>
              <div style={{ fontSize: 11, color: '#999' }}>{opt.sub}</div>
            </div>
            <div
              style={{
                width: 40,
                height: 22,
                borderRadius: 11,
                background: opt.state ? '#C2185B' : '#d1cdc9',
                position: 'relative',
                flexShrink: 0,
                transition: 'background 0.2s',
              }}
            >
              <div
                style={{
                  position: 'absolute',
                  top: 3,
                  left: opt.state ? 21 : 3,
                  width: 16,
                  height: 16,
                  borderRadius: '50%',
                  background: '#fff',
                  transition: 'left 0.2s',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
                }}
              />
            </div>
          </div>
        ))}

        {/* Background music toggle */}
        <div
          onClick={() => setEnableMusic(!enableMusic)}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '10px 0',
            borderTop: '1px solid #f0eeed',
            cursor: 'pointer',
          }}
        >
          <div>
            <div style={{ fontSize: 13, fontWeight: 600, color: '#222' }}>🎵 Background Music</div>
            <div style={{ fontSize: 11, color: '#999' }}>Upload an MP3 to mix into the final video</div>
          </div>
          <div
            style={{
              width: 40,
              height: 22,
              borderRadius: 11,
              background: enableMusic ? '#C2185B' : '#d1cdc9',
              position: 'relative',
              flexShrink: 0,
              transition: 'background 0.2s',
            }}
          >
            <div
              style={{
                position: 'absolute',
                top: 3,
                left: enableMusic ? 21 : 3,
                width: 16,
                height: 16,
                borderRadius: '50%',
                background: '#fff',
                transition: 'left 0.2s',
                boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
              }}
            />
          </div>
        </div>

        {/* Music file uploader */}
        <div
          style={{
            marginTop: 4,
            opacity: enableMusic ? 1 : 0.35,
            pointerEvents: enableMusic ? 'auto' : 'none',
          }}
        >
          <div style={{ fontSize: 11, color: '#999', marginBottom: 8 }}>
            {enableMusic ? 'MP3 — mixed at 30% volume over the video' : '(enable background music to upload)'}
          </div>
          {customMusicFile ? (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                padding: '10px 12px',
                borderRadius: 8,
                border: '1.5px solid #C2185B',
                background: '#FDF2F8',
              }}
            >
              <span style={{ fontSize: 18 }}>🎵</span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div
                  style={{
                    fontSize: 12,
                    fontWeight: 600,
                    color: '#C2185B',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {customMusicFile.name}
                </div>
                <div style={{ fontSize: 11, color: '#888' }}>{(customMusicFile.size / 1024 / 1024).toFixed(1)} MB</div>
              </div>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setCustomMusicFile(null);
                  if (customMusicInputRef.current) customMusicInputRef.current.value = '';
                }}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#C2185B',
                  cursor: 'pointer',
                  fontSize: 14,
                  padding: 0,
                }}
              >
                ✕
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => customMusicInputRef.current?.click()}
              style={{
                width: '100%',
                padding: '10px 0',
                borderRadius: 8,
                border: '1.5px dashed #d1cdc9',
                background: '#fafaf9',
                color: '#888',
                fontSize: 12,
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              + Upload MP3
            </button>
          )}
          <input
            ref={customMusicInputRef}
            type="file"
            accept="audio/mpeg,audio/mp3,.mp3"
            style={{ display: 'none' }}
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) setCustomMusicFile(f);
            }}
          />
        </div>
      </div>

      {/* Submit */}
      <button
        type="button"
        onClick={handleSubmit}
        disabled={!canSubmit}
        style={{
          width: '100%',
          padding: '14px 0',
          borderRadius: 12,
          border: 'none',
          background: canSubmit ? 'linear-gradient(135deg,#C2185B,#8E1545)' : '#e0dcd9',
          color: canSubmit ? '#fff' : '#aaa',
          fontWeight: 700,
          fontSize: 15,
          cursor: canSubmit ? 'pointer' : 'not-allowed',
          transition: 'all 0.15s',
        }}
      >
        {videoFile ? `Produce with Submagic` : 'Upload a video to continue'}
      </button>
    </div>
  );
}
