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
type Phase = 'pick' | 'uploading' | 'processing' | 'awaiting_review' | 'ready' | 'failed';

interface AiDecisions {
  cuts: { remove_start: number; remove_end: number; reason: string; confidence?: number }[];
  zooms: { at: number; type: string; intensity: string; reason: string }[];
  sound_effects: { at: number; type: string; reason: string }[];
  broll: { at: number; duration: number; description: string; concept: string }[];
  hook_text: string;
  music_mood: string;
  pacing_note: string;
  caption_cues?: { start: number; end: number; type: 'emphasis' | 'cta' | 'metric' }[];
  topic_changes?: { at: number; confidence: number }[];
  icon_overlays?: { at: number; duration: number; category: string }[];
}

interface Props {
  onComplete: () => void;
  sourceUrl?: string | null;
}

export default function VideoProductionForm({ onComplete, sourceUrl }: Props) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const [isDragging, setIsDragging] = useState(false);
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [videoPreviewUrl, setVideoPreviewUrl] = useState<string | null>(null);
  const [videoType, setVideoType] = useState<VideoType>('founder');
  const [enableMusic, setEnableMusic] = useState(true);
  const [enableWhoosh, setEnableWhoosh] = useState(true);
  const [enableCaptions, setEnableCaptions] = useState(true);

  // When video type changes, reset captions to its sensible default:
  // product = off (B-roll rarely has meaningful narration), founder/tiktok = on.
  useEffect(() => {
    setEnableCaptions(videoType !== 'product');
  }, [videoType]);
  const [transitionStyle, setTransitionStyle] = useState('auto');

  // When sourceUrl is provided (transferred from Multi-Clip Composer), skip the pick phase
  const [phase, setPhase] = useState<Phase>(sourceUrl ? 'pick' : 'pick');
  const [progress, setProgress] = useState(0);
  const [statusMessage, setStatusMessage] = useState('');

  const [currentJobId, setCurrentJobId] = useState<string | null>(null);
  const [outputUrl, setOutputUrl] = useState<string | null>(null);
  const [pacingNote, setPacingNote] = useState('');
  const [cuts, setCuts] = useState<{ remove_start: number; remove_end: number; reason: string }[]>([]);
  const [zooms, setZooms] = useState<{ at: number; type: string; intensity: string; reason: string }[]>([]);
  const [soundEffects, setSoundEffects] = useState<{ at: number; type: string; reason: string }[]>([]);

  // Review phase
  const [aiDecisions, setAiDecisions] = useState<AiDecisions | null>(null);
  const [enabledCuts, setEnabledCuts] = useState<boolean[]>([]);
  const [enabledZooms, setEnabledZooms] = useState<boolean[]>([]);
  const [enabledSfx, setEnabledSfx] = useState<boolean[]>([]);
  const [editedHookText, setEditedHookText] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);

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

        if (j.status === 'awaiting_review' && j.ai_decisions) {
          clearInterval(pollRef.current!);
          const d = j.ai_decisions;
          setAiDecisions(d);
          setEnabledCuts(d.cuts.map(() => true));
          setEnabledZooms(d.zooms.map(() => true));
          setEnabledSfx(d.sound_effects.map(() => true));
          setEditedHookText(d.hook_text ?? '');
          setPhase('awaiting_review');
        } else if (j.status === 'ready' && j.output_url) {
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
    if (!videoFile && !sourceUrl) {
      ToastService.showToast('Please select a video first.', ToastTypeEnum.Error);
      return;
    }
    setPhase('uploading');
    setProgress(0);
    setStatusMessage(sourceUrl ? 'Sending composition to producer…' : 'Uploading your video…');

    try {
      const formData = new FormData();
      if (videoFile) {
        formData.append('video', videoFile);
      } else if (sourceUrl) {
        formData.append('source_url', sourceUrl);
      }
      formData.append('video_type', videoType);
      formData.append('enable_music', String(enableMusic));
      formData.append('enable_sfx', String(enableWhoosh));
      formData.append('enable_captions', String(enableCaptions));
      formData.append('transition_style', transitionStyle);

      const res = await SocialMediaAgentService.submitVideoProduction(formData, (pct) => {
        setProgress(pct);
        setStatusMessage(`Uploading… ${pct}%`);
      });
      if (!res?.responseData?.job_id) throw new Error('No job ID returned');

      const jid = res.responseData.job_id;
      setCurrentJobId(jid);
      setPhase('processing');
      setStatusMessage('Starting pipeline…');
      startPolling(jid);
    } catch (err: unknown) {
      const axiosErr = err as { response?: { status?: number }; code?: string; message?: string };
      const status = axiosErr?.response?.status;
      const code = axiosErr?.code;
      const msg = axiosErr?.message;
      console.error('[VideoProduction] upload error:', { status, code, msg });

      if (code === 'ECONNABORTED' || msg?.includes('timeout')) {
        ToastService.showToast('Upload timed out — try a smaller video or a faster connection.', ToastTypeEnum.Error);
      } else if (status === 413) {
        ToastService.showToast('Video file is too large for upload.', ToastTypeEnum.Error);
      } else if (status === 401 || status === 403) {
        ToastService.showToast('Session expired — please log in again.', ToastTypeEnum.Error);
      } else {
        ToastService.showToast('Upload failed. Please try again.', ToastTypeEnum.Error);
      }
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
    setAiDecisions(null);
    setCurrentJobId(null);
  };

  const handleApproveRender = async () => {
    if (!currentJobId || !aiDecisions) return;
    setSubmittingReview(true);
    try {
      const approvedDecisions = {
        cuts: aiDecisions.cuts.filter((_, i) => enabledCuts[i]),
        zooms: aiDecisions.zooms.filter((_, i) => enabledZooms[i]),
        sound_effects: aiDecisions.sound_effects.filter((_, i) => enabledSfx[i]),
        broll: aiDecisions.broll,
        hook_text: editedHookText,
        music_mood: aiDecisions.music_mood,
      };
      await SocialMediaAgentService.startVideoRender(currentJobId, approvedDecisions);
      setPhase('processing');
      setProgress(56);
      setStatusMessage('Rendering…');
      startPolling(currentJobId);
    } catch {
      ToastService.showToast('Failed to start render. Please try again.', ToastTypeEnum.Error);
    } finally {
      setSubmittingReview(false);
    }
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

  if (phase === 'awaiting_review' && aiDecisions) {
    const totalRemoved = aiDecisions.cuts
      .filter((_, i) => enabledCuts[i])
      .reduce((s, c) => s + (c.remove_end - c.remove_start), 0);

    return (
      <div style={{ padding: '20px 0', maxWidth: 560 }}>
        {/* Header */}
        <div style={{ marginBottom: 20 }}>
          <div style={{ fontWeight: 800, fontSize: 15, color: '#111', marginBottom: 4 }}>Review AI Decisions</div>
          <div style={{ fontSize: 13, color: '#888' }}>
            Toggle what you want to keep. Jane will render only approved edits.
          </div>
          {aiDecisions.pacing_note && (
            <div
              style={{
                marginTop: 10,
                padding: '8px 12px',
                background: '#f0f9ff',
                border: '1px solid #bae6fd',
                borderRadius: 8,
                fontSize: 12,
                color: '#0369a1',
              }}
            >
              {aiDecisions.pacing_note}
            </div>
          )}
        </div>

        {/* Hook text */}
        <ReviewSection icon="🪝" title="Hook Text" subtitle="Shown as overlay in the first 2.5s">
          <input
            value={editedHookText}
            onChange={(e) => setEditedHookText(e.target.value)}
            placeholder="Leave blank to skip hook overlay"
            maxLength={80}
            style={{
              width: '100%',
              border: '1.5px solid #e5e7eb',
              borderRadius: 8,
              padding: '9px 12px',
              fontSize: 13,
              color: '#111',
              fontFamily: 'inherit',
              outline: 'none',
              boxSizing: 'border-box',
              background: '#fff',
            }}
          />
        </ReviewSection>

        {/* Cuts */}
        {aiDecisions.cuts.length > 0 && (
          <ReviewSection
            icon="✂️"
            title={`Cuts (${enabledCuts.filter(Boolean).length}/${aiDecisions.cuts.length} enabled)`}
            subtitle={`Removing ${totalRemoved.toFixed(1)}s of dead air / filler`}
            accentColor="#C2185B"
          >
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {aiDecisions.cuts.map((cut, i) => (
                <DecisionRow
                  key={i}
                  enabled={enabledCuts[i]}
                  onToggle={() => setEnabledCuts((prev) => prev.map((v, idx) => (idx === i ? !v : v)))}
                  label={`${cut.remove_start.toFixed(1)}s – ${cut.remove_end.toFixed(1)}s`}
                  sublabel={cut.reason}
                  color="#C2185B"
                />
              ))}
            </div>
          </ReviewSection>
        )}

        {/* Zooms */}
        {aiDecisions.zooms.length > 0 && (
          <ReviewSection
            icon="🔍"
            title={`Zooms (${enabledZooms.filter(Boolean).length}/${aiDecisions.zooms.length} enabled)`}
            subtitle="Camera emphasis on key moments"
            accentColor="#1976D2"
          >
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {aiDecisions.zooms.map((z, i) => (
                <DecisionRow
                  key={i}
                  enabled={enabledZooms[i]}
                  onToggle={() => setEnabledZooms((prev) => prev.map((v, idx) => (idx === i ? !v : v)))}
                  label={`${z.at.toFixed(1)}s — ${z.type} (${z.intensity})`}
                  sublabel={z.reason}
                  color="#1976D2"
                />
              ))}
            </div>
          </ReviewSection>
        )}

        {/* Sound effects */}
        {aiDecisions.sound_effects.length > 0 && (
          <ReviewSection
            icon="🔊"
            title={`Sound Effects (${enabledSfx.filter(Boolean).length}/${aiDecisions.sound_effects.length} enabled)`}
            subtitle="Impact sounds at key transitions"
            accentColor="#7B1FA2"
          >
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {aiDecisions.sound_effects.map((sfx, i) => (
                <DecisionRow
                  key={i}
                  enabled={enabledSfx[i]}
                  onToggle={() => setEnabledSfx((prev) => prev.map((v, idx) => (idx === i ? !v : v)))}
                  label={`${sfx.at.toFixed(1)}s — ${sfx.type}`}
                  sublabel={sfx.reason}
                  color="#7B1FA2"
                />
              ))}
            </div>
          </ReviewSection>
        )}

        {/* B-roll info (display only) */}
        {aiDecisions.broll.length > 0 && (
          <ReviewSection icon="🎬" title={`B-Roll (${aiDecisions.broll.length})`} subtitle="Inserted automatically">
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              {aiDecisions.broll.map((br, i) => (
                <div key={i} style={{ fontSize: 12, color: '#555', padding: '4px 0' }}>
                  <span style={{ color: '#888' }}>
                    {br.at.toFixed(1)}s–{(br.at + (br.duration ?? 3)).toFixed(1)}s
                  </span>{' '}
                  {br.description}
                </div>
              ))}
            </div>
          </ReviewSection>
        )}

        {/* Music */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 20, flexWrap: 'wrap' }}>
          <div
            style={{
              flex: 1,
              minWidth: 180,
              padding: '10px 14px',
              background: '#f9fafb',
              border: '1px solid #e5e7eb',
              borderRadius: 10,
              fontSize: 12,
              color: '#555',
            }}
          >
            🎵 Music:{' '}
            <span style={{ fontWeight: 700, color: '#111', textTransform: 'capitalize' }}>
              {aiDecisions.music_mood}
            </span>{' '}
            mood (CC0)
          </div>
          {(aiDecisions.caption_cues?.length ?? 0) > 0 && (
            <div
              style={{
                flex: 1,
                minWidth: 180,
                padding: '10px 14px',
                background: '#f9fafb',
                border: '1px solid #e5e7eb',
                borderRadius: 10,
                fontSize: 12,
                color: '#555',
              }}
            >
              🎨 Styled captions:{' '}
              {[
                ...(aiDecisions.caption_cues!.filter((c) => c.type === 'emphasis').length > 0
                  ? [`${aiDecisions.caption_cues!.filter((c) => c.type === 'emphasis').length} emphasis`]
                  : []),
                ...(aiDecisions.caption_cues!.filter((c) => c.type === 'cta').length > 0 ? ['CTA'] : []),
              ].join(' · ')}{' '}
              + metrics auto-detected
            </div>
          )}
          {(aiDecisions.topic_changes?.length ?? 0) > 0 && (
            <div
              style={{
                flex: 1,
                minWidth: 180,
                padding: '10px 14px',
                background: '#f9fafb',
                border: '1px solid #e5e7eb',
                borderRadius: 10,
                fontSize: 12,
                color: '#555',
              }}
            >
              ✨ Transitions:{' '}
              <span style={{ fontWeight: 700, color: '#111' }}>
                {aiDecisions.topic_changes!.length} topic shift
                {aiDecisions.topic_changes!.length !== 1 ? 's' : ''}
              </span>{' '}
              (flash / swipe)
            </div>
          )}
          {(aiDecisions.icon_overlays?.length ?? 0) > 0 && (
            <div
              style={{
                flex: 1,
                minWidth: 180,
                padding: '10px 14px',
                background: '#f9fafb',
                border: '1px solid #e5e7eb',
                borderRadius: 10,
                fontSize: 12,
                color: '#555',
              }}
            >
              🎯 Icon overlays:{' '}
              <span style={{ fontWeight: 700, color: '#111' }}>{aiDecisions.icon_overlays!.length}</span>{' '}
              {[...new Set(aiDecisions.icon_overlays!.map((o) => o.category))].join(', ')}
            </div>
          )}
        </div>

        {/* Actions */}
        <div style={{ display: 'flex', gap: 10 }}>
          <button
            onClick={handleApproveRender}
            disabled={submittingReview}
            style={{
              flex: 1,
              padding: '13px 0',
              borderRadius: 10,
              border: 'none',
              cursor: submittingReview ? 'not-allowed' : 'pointer',
              background: submittingReview ? '#e5e7eb' : 'linear-gradient(135deg,#C2185B,#8E1545)',
              color: submittingReview ? '#9ca3af' : '#fff',
              fontWeight: 700,
              fontSize: 15,
              transition: 'all 0.15s',
            }}
          >
            {submittingReview ? 'Starting render…' : 'Approve & Render ✅'}
          </button>
          <button
            onClick={handleReset}
            style={{
              padding: '13px 18px',
              borderRadius: 10,
              border: '1.5px solid #e0dcd9',
              background: '#fff',
              color: '#555',
              fontWeight: 600,
              fontSize: 13,
              cursor: 'pointer',
            }}
          >
            Cancel
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
            { label: 'AI content analysis', threshold: 55 },
            { label: 'Review approved', threshold: 60 },
            { label: 'Building render timeline', threshold: 68 },
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

      {/* Production options */}
      <div style={{ marginBottom: 16 }}>
        <div
          style={{
            fontSize: 12,
            fontWeight: 700,
            color: '#555',
            marginBottom: 10,
            textTransform: 'uppercase',
            letterSpacing: 1,
          }}
        >
          Production options
        </div>

        {/* Toggles row */}
        <div style={{ display: 'flex', gap: 10, marginBottom: 12 }}>
          {[
            { label: '🎵 Background music', value: enableMusic, set: setEnableMusic },
            { label: '💨 Whoosh sounds', value: enableWhoosh, set: setEnableWhoosh },
            { label: '💬 Captions', value: enableCaptions, set: setEnableCaptions },
          ].map(({ label, value, set }) => (
            <button
              key={label}
              onClick={() => set(!value)}
              style={{
                flex: 1,
                padding: '9px 12px',
                borderRadius: 10,
                border: value ? '2px solid #C2185B' : '1.5px solid #e5e7eb',
                background: value ? '#FDF2F8' : '#f9fafb',
                cursor: 'pointer',
                fontSize: 12,
                fontWeight: 600,
                color: value ? '#C2185B' : '#888',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                transition: 'all 0.15s',
              }}
            >
              {label}
              <span
                style={{
                  width: 32,
                  height: 18,
                  borderRadius: 9,
                  background: value ? '#C2185B' : '#d1d5db',
                  display: 'inline-flex',
                  alignItems: 'center',
                  padding: '0 2px',
                  transition: 'background 0.15s',
                  flexShrink: 0,
                }}
              >
                <span
                  style={{
                    width: 14,
                    height: 14,
                    borderRadius: '50%',
                    background: '#fff',
                    transform: value ? 'translateX(14px)' : 'translateX(0)',
                    transition: 'transform 0.15s',
                    display: 'block',
                  }}
                />
              </span>
            </button>
          ))}
        </div>

        {/* Transition picker */}
        <div style={{ fontSize: 12, color: '#555', marginBottom: 6, fontWeight: 600 }}>Transition style</div>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {(
            [
              { key: 'auto', label: 'Auto', desc: 'Best for your video type' },
              { key: 'circle_wipe', label: 'Circle Wipe', desc: 'Circle from center' },
              { key: 'diagonal_wipe', label: 'Diagonal', desc: 'Diagonal sweep' },
              { key: 'flash', label: 'Flash', desc: 'Quick white flash' },
              { key: 'swipe', label: 'Swipe', desc: 'Slide between clips' },
              { key: 'hard_cut', label: 'Hard Cut', desc: 'No effect' },
              { key: 'none', label: 'None', desc: 'No transitions at all' },
            ] as const
          ).map((t) => {
            const active = transitionStyle === t.key;
            return (
              <button
                key={t.key}
                onClick={() => setTransitionStyle(t.key)}
                title={t.desc}
                style={{
                  padding: '6px 12px',
                  borderRadius: 8,
                  border: active ? '2px solid #C2185B' : '1.5px solid #e5e7eb',
                  background: active ? '#FDF2F8' : '#fff',
                  cursor: 'pointer',
                  fontSize: 11,
                  fontWeight: active ? 700 : 500,
                  color: active ? '#C2185B' : '#555',
                  transition: 'all 0.15s',
                }}
              >
                {t.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Source — either a transferred composition URL or a file drop zone */}
      {sourceUrl && !videoFile ? (
        <div
          style={{
            border: '2px solid #C2185B',
            borderRadius: 12,
            background: '#fdf2f8',
            padding: '16px 20px',
            marginBottom: 16,
            display: 'flex',
            alignItems: 'center',
            gap: 12,
          }}
        >
          <div style={{ fontSize: 28, flexShrink: 0 }}>🎬</div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: '#111', marginBottom: 2 }}>Multi-Clip Composition</div>
            <div style={{ fontSize: 12, color: '#888' }}>Transferred from Compose — ready to produce</div>
          </div>
          <button
            onClick={() => fileInputRef.current?.click()}
            style={{
              fontSize: 11,
              color: '#C2185B',
              background: 'transparent',
              border: '1px solid #C2185B',
              borderRadius: 6,
              padding: '3px 10px',
              cursor: 'pointer',
              fontFamily: 'inherit',
              flexShrink: 0,
            }}
          >
            Replace
          </button>
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
      ) : (
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
      )}

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
        <strong>What happens:</strong> Reap transcribes your audio → GPT-5 analyses content and suggests edits → you
        review and approve → Shotstack renders the final video. Takes 3–8 minutes.
      </div>

      {/* Submit */}
      <button
        onClick={handleSubmit}
        disabled={!videoFile && !sourceUrl}
        style={{
          width: '100%',
          padding: '13px',
          borderRadius: 10,
          border: 'none',
          cursor: videoFile || sourceUrl ? 'pointer' : 'not-allowed',
          background: videoFile || sourceUrl ? 'linear-gradient(135deg,#C2185B,#8E1545)' : '#e5e7eb',
          color: videoFile || sourceUrl ? '#fff' : '#9ca3af',
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

function ReviewSection({
  icon,
  title,
  subtitle,
  accentColor,
  children,
}: {
  icon: string;
  title: string;
  subtitle: string;
  accentColor?: string;
  children: React.ReactNode;
}) {
  return (
    <div
      style={{
        marginBottom: 16,
        border: '1.5px solid #e5e7eb',
        borderRadius: 10,
        overflow: 'hidden',
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          padding: '10px 14px',
          background: '#f9fafb',
          borderBottom: '1px solid #e5e7eb',
        }}
      >
        <span style={{ fontSize: 15 }}>{icon}</span>
        <div>
          <div style={{ fontWeight: 700, fontSize: 13, color: accentColor ?? '#111' }}>{title}</div>
          <div style={{ fontSize: 11, color: '#9ca3af' }}>{subtitle}</div>
        </div>
      </div>
      <div style={{ padding: '10px 14px' }}>{children}</div>
    </div>
  );
}

function DecisionRow({
  enabled,
  onToggle,
  label,
  sublabel,
  color,
}: {
  enabled: boolean;
  onToggle: () => void;
  label: string;
  sublabel: string;
  color: string;
}) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        padding: '6px 8px',
        borderRadius: 7,
        background: enabled ? '#fafafa' : '#f3f4f6',
        opacity: enabled ? 1 : 0.55,
        cursor: 'pointer',
        userSelect: 'none',
        transition: 'all 0.15s',
      }}
      onClick={onToggle}
    >
      {/* Toggle pill */}
      <div
        style={{
          width: 34,
          height: 20,
          borderRadius: 99,
          background: enabled ? color : '#d1d5db',
          position: 'relative',
          flexShrink: 0,
          transition: 'background 0.2s',
        }}
      >
        <div
          style={{
            position: 'absolute',
            top: 3,
            left: enabled ? 17 : 3,
            width: 14,
            height: 14,
            borderRadius: 99,
            background: '#fff',
            transition: 'left 0.2s',
          }}
        />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: enabled ? '#111' : '#9ca3af' }}>{label}</div>
        {sublabel && (
          <div
            style={{
              fontSize: 11,
              color: '#9ca3af',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}
          >
            {sublabel}
          </div>
        )}
      </div>
    </div>
  );
}
