'use client';

import { useEffect, useRef, useState } from 'react';
import { SocialMediaAgentService } from '@/src/api/SocialMediaAgentService';
import { ToastService } from '@/src/utils/toast.util';
import { ToastTypeEnum } from '@/src/models/enum-models/ToastTypeEnum';

const ACCEPTED_TYPES = ['video/mp4', 'video/quicktime', 'video/webm', 'video/x-m4v'];
const MAX_MB = 500;

const VIDEO_TYPES = [
  {
    key: 'tiktok',
    label: 'TikTok / Hype',
    desc: 'Fast cuts, punchy zooms, hook in first second',
    icon: '⚡',
  },
  {
    key: 'product',
    label: 'Product Showcase',
    desc: 'Snappy, product-focused, moderate effects',
    icon: '📦',
  },
  {
    key: 'founder',
    label: 'Founder / Story',
    desc: 'Gentle pacing, natural rhythm, minimal cuts',
    icon: '🎙️',
  },
] as const;

type VideoType = 'tiktok' | 'product' | 'founder';
type Phase = 'pick' | 'uploading' | 'processing' | 'ready' | 'failed';

interface Props {
  onComplete: () => void;
}

export default function VideoProductionForm({ onComplete }: Props) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const [isDragging, setIsDragging] = useState(false);
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [videoPreviewUrl, setVideoPreviewUrl] = useState<string | null>(null);
  const [videoType, setVideoType] = useState<VideoType>('founder');

  const [phase, setPhase] = useState<Phase>('pick');
  const [progress, setProgress] = useState(0);
  const [statusMessage, setStatusMessage] = useState('');

  const [outputUrl, setOutputUrl] = useState<string | null>(null);
  const [pacingNote, setPacingNote] = useState('');
  const [cuts, setCuts] = useState<{ remove_start: number; remove_end: number; reason: string }[]>([]);
  const [zooms, setZooms] = useState<{ at: number; type: string; intensity: string; reason: string }[]>([]);
  const [soundEffects, setSoundEffects] = useState<{ at: number; type: string; reason: string }[]>([]);

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
      ToastService.showToast(`File too large. Max ${MAX_MB}MB.`, ToastTypeEnum.Error);
      return;
    }
    setVideoFile(file);
    setVideoPreviewUrl(URL.createObjectURL(file));
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
        const res = await SocialMediaAgentService.getVideoProductionJob(jobId);
        const j = res?.responseData;
        if (!j) return;
        setProgress(j.progress ?? 0);
        setStatusMessage(j.status_message ?? '');
        if (j.status === 'ready' && j.output_url) {
          clearInterval(pollRef.current!);
          setOutputUrl(j.output_url);
          setPacingNote(j.pacing_note ?? '');
          setCuts(j.cuts ?? []);
          setZooms(j.zooms ?? []);
          setSoundEffects(
            (j as { sound_effects?: { at: number; type: string; reason: string }[] }).sound_effects ?? []
          );
          setPhase('ready');
        } else if (j.status === 'failed') {
          clearInterval(pollRef.current!);
          setPhase('failed');
        }
      } catch {
        // transient — keep polling
      }
    }, 5000);
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
      formData.append('video_type', videoType);

      const res = await SocialMediaAgentService.submitVideoProduction(formData);
      if (!res?.responseData?.job_id) throw new Error('No job ID returned');

      setPhase('processing');
      setStatusMessage('Starting pipeline…');
      startPolling(res.responseData.job_id);
    } catch {
      ToastService.showToast('Upload failed. Please try again.', ToastTypeEnum.Error);
      setPhase('pick');
    }
  };

  const handleReset = () => {
    if (pollRef.current) clearInterval(pollRef.current);
    setVideoFile(null);
    setVideoPreviewUrl(null);
    setPhase('pick');
    setProgress(0);
    setStatusMessage('');
    setOutputUrl(null);
    setCuts([]);
    setZooms([]);
    setSoundEffects([]);
  };

  // ── Render ────────────────────────────────────────────────────────────────

  if (phase === 'ready' && outputUrl) {
    return (
      <div style={{ padding: '20px 0', maxWidth: 560 }}>
        {/* Header */}
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
            <div style={{ fontWeight: 800, fontSize: 15, color: '#111' }}>Video produced</div>
            {pacingNote && <div style={{ fontSize: 12, color: '#888' }}>{pacingNote}</div>}
          </div>
        </div>

        {/* Video player */}
        <div
          style={{ borderRadius: 12, overflow: 'hidden', background: '#000', marginBottom: 16, position: 'relative' }}
        >
          <video
            src={outputUrl}
            controls
            playsInline
            style={{ width: '100%', maxHeight: 480, display: 'block', objectFit: 'contain' }}
          />
        </div>

        {/* Edit decision summary */}
        {(cuts.length > 0 || zooms.length > 0 || soundEffects.length > 0) && (
          <div
            style={{
              background: '#f8f7f5',
              borderRadius: 10,
              padding: '12px 14px',
              marginBottom: 16,
              border: '1px solid #e8e5e3',
            }}
          >
            <div style={{ fontSize: 12, fontWeight: 700, color: '#555', marginBottom: 8 }}>AI Edit Decisions</div>
            <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
              {cuts.length > 0 && (
                <div style={{ fontSize: 12, color: '#C2185B' }}>
                  ✂️ <strong>{cuts.length}</strong> cut{cuts.length !== 1 ? 's' : ''}
                </div>
              )}
              {zooms.length > 0 && (
                <div style={{ fontSize: 12, color: '#1976D2' }}>
                  🔍 <strong>{zooms.length}</strong> zoom{zooms.length !== 1 ? 's' : ''}
                </div>
              )}
              {soundEffects.length > 0 && (
                <div style={{ fontSize: 12, color: '#7B1FA2' }}>
                  🔊 <strong>{soundEffects.length}</strong> SFX
                </div>
              )}
            </div>
            {cuts.slice(0, 3).map((c, i) => (
              <div key={i} style={{ fontSize: 11, color: '#888', marginTop: 4 }}>
                Cut {c.remove_start.toFixed(1)}s–{c.remove_end.toFixed(1)}s — {c.reason}
              </div>
            ))}
          </div>
        )}

        {/* Actions */}
        <div style={{ display: 'flex', gap: 10 }}>
          <a
            href={outputUrl}
            download="produced-video.mp4"
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

  if (phase === 'processing' || phase === 'uploading') {
    return (
      <div style={{ padding: '32px 0', maxWidth: 440 }}>
        <div style={{ marginBottom: 20, fontWeight: 700, fontSize: 15, color: '#111' }}>
          {phase === 'uploading' ? 'Uploading…' : 'Producing your video'}
        </div>

        {/* Progress bar */}
        <div style={{ background: '#f0eeec', borderRadius: 8, height: 8, marginBottom: 10 }}>
          <div
            style={{
              height: 8,
              borderRadius: 8,
              background: 'linear-gradient(90deg,#C2185B,#E91E63)',
              width: `${progress}%`,
              transition: 'width 0.8s ease',
            }}
          />
        </div>

        <div style={{ fontSize: 13, color: '#888', marginBottom: 24 }}>{statusMessage}</div>

        {/* Pipeline stages */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {[
            { label: 'Upload + transcription', threshold: 40 },
            { label: 'GPT-4o edit decisions', threshold: 58 },
            { label: 'Shotstack render', threshold: 65 },
            { label: 'Final render', threshold: 98 },
          ].map((stage) => {
            const done = progress > stage.threshold;
            const active = !done && progress > stage.threshold - 25;
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

        <div style={{ marginTop: 24, fontSize: 12, color: '#bbb' }}>
          This takes 3–8 minutes. You can leave this open.
        </div>
      </div>
    );
  }

  if (phase === 'failed') {
    return (
      <div style={{ padding: '32px 0', maxWidth: 440 }}>
        <div style={{ color: '#C2185B', fontWeight: 700, fontSize: 15, marginBottom: 12 }}>Production failed</div>
        <div style={{ fontSize: 13, color: '#888', marginBottom: 20 }}>
          {statusMessage || 'Something went wrong. Please try again.'}
        </div>
        <button
          onClick={handleReset}
          style={{
            padding: '11px 20px',
            borderRadius: 10,
            border: 'none',
            background: 'linear-gradient(135deg,#C2185B,#8E1545)',
            color: '#fff',
            fontWeight: 700,
            fontSize: 14,
            cursor: 'pointer',
          }}
        >
          Try Again
        </button>
      </div>
    );
  }

  // ── Pick phase ────────────────────────────────────────────────────────────
  return (
    <div style={{ padding: '20px 0', maxWidth: 520 }}>
      {/* Header */}
      <div style={{ marginBottom: 20 }}>
        <div style={{ fontWeight: 800, fontSize: 15, color: '#111', marginBottom: 4 }}>Produce My Video</div>
        <div style={{ fontSize: 13, color: '#888' }}>
          Upload raw footage. Jane transcribes, GPT-4o edits, Shotstack renders — one polished video.
        </div>
      </div>

      {/* Video type picker */}
      <div style={{ marginBottom: 18 }}>
        <div
          style={{
            fontSize: 12,
            fontWeight: 700,
            color: '#555',
            marginBottom: 8,
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
          }}
        >
          What kind of video?
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          {VIDEO_TYPES.map((vt) => {
            const active = videoType === vt.key;
            return (
              <button
                key={vt.key}
                onClick={() => setVideoType(vt.key)}
                style={{
                  flex: 1,
                  padding: '10px 8px',
                  borderRadius: 10,
                  cursor: 'pointer',
                  textAlign: 'left',
                  border: active ? '2px solid #C2185B' : '1.5px solid #e5e7eb',
                  background: active ? '#FDF2F8' : '#fff',
                  transition: 'all 0.15s',
                }}
              >
                <div style={{ fontSize: 18, marginBottom: 4 }}>{vt.icon}</div>
                <div style={{ fontSize: 12, fontWeight: 700, color: active ? '#C2185B' : '#111' }}>{vt.label}</div>
                <div style={{ fontSize: 11, color: '#888', marginTop: 2, lineHeight: 1.3 }}>{vt.desc}</div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Drop zone */}
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        style={{
          border: isDragging ? '2.5px dashed #C2185B' : videoFile ? '2px solid #C2185B' : '2px dashed #d0ccc8',
          borderRadius: 12,
          background: isDragging ? '#FDF2F8' : videoFile ? '#fdf2f8' : '#fafaf9',
          padding: '24px 20px',
          textAlign: 'center',
          cursor: 'pointer',
          transition: 'all 0.15s',
          marginBottom: 16,
        }}
      >
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
        {videoFile ? (
          <div>
            {videoPreviewUrl && (
              <video
                src={videoPreviewUrl}
                muted
                style={{ maxWidth: '100%', maxHeight: 180, borderRadius: 8, marginBottom: 10, objectFit: 'contain' }}
              />
            )}
            <div style={{ fontSize: 13, fontWeight: 700, color: '#111' }}>{videoFile.name}</div>
            <div style={{ fontSize: 12, color: '#888' }}>
              {(videoFile.size / 1024 / 1024).toFixed(1)} MB — click to change
            </div>
          </div>
        ) : (
          <div>
            <div style={{ fontSize: 32, marginBottom: 10 }}>🎬</div>
            <div style={{ fontWeight: 700, fontSize: 14, color: '#444', marginBottom: 4 }}>Drop your video here</div>
            <div style={{ fontSize: 12, color: '#aaa' }}>MP4, MOV, WebM · Up to 500MB</div>
          </div>
        )}
      </div>

      {/* Info note */}
      <div
        style={{
          background: '#f0f9ff',
          border: '1px solid #bae6fd',
          borderRadius: 8,
          padding: '10px 14px',
          fontSize: 12,
          color: '#0369a1',
          marginBottom: 18,
          lineHeight: 1.5,
        }}
      >
        <strong>What happens:</strong> Reap transcribes your audio → GPT-4o removes dead space and adds zooms →
        Shotstack renders the final video with animated captions. Takes 3–8 minutes.
      </div>

      {/* Submit */}
      <button
        onClick={handleSubmit}
        disabled={!videoFile}
        style={{
          width: '100%',
          padding: '13px',
          borderRadius: 10,
          border: 'none',
          cursor: videoFile ? 'pointer' : 'not-allowed',
          background: videoFile ? 'linear-gradient(135deg,#C2185B,#8E1545)' : '#e5e7eb',
          color: videoFile ? '#fff' : '#9ca3af',
          fontWeight: 700,
          fontSize: 15,
          transition: 'all 0.15s',
        }}
      >
        Produce Video
      </button>
    </div>
  );
}
