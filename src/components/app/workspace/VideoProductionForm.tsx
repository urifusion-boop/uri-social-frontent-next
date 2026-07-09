'use client';

import { useEffect, useRef, useState } from 'react';
import { SocialMediaAgentService } from '@/src/api/SocialMediaAgentService';
import { ToastService } from '@/src/utils/toast.util';
import { ToastTypeEnum } from '@/src/models/enum-models/ToastTypeEnum';

const ACCEPTED_TYPES = ['video/mp4', 'video/quicktime', 'video/webm', 'video/x-m4v'];

function parseSrt(srt: string): { index: number; text: string }[] {
  if (!srt.trim()) return [];
  const normalized = srt.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
  const entries: { index: number; text: string }[] = [];
  // Find every block start: a line containing only digits, followed by a timestamp line.
  // This works regardless of whether blocks are separated by blank lines.
  const re = /^\d+\n\d{2}:\d{2}:\d{2}[,.]\d{3}\s*-->\s*\d{2}:\d{2}:\d{2}[,.]\d{3}/gm;
  const starts: number[] = [];
  let m: RegExpExecArray | null;
  while ((m = re.exec(normalized)) !== null) starts.push(m.index);
  starts.forEach((start, i) => {
    const end = i + 1 < starts.length ? starts[i + 1] : normalized.length;
    const block = normalized.slice(start, end).trim();
    const lines = block.split('\n');
    const idx = parseInt(lines[0], 10);
    const text = lines.slice(2).join(' ').trim();
    if (!isNaN(idx) && text) entries.push({ index: idx, text });
  });
  return entries;
}

const CAPTION_COLOR_PRESETS = [
  { label: 'White', value: '#FFFFFF' },
  { label: 'Yellow', value: '#FFD700' },
  { label: 'Red', value: '#FF3B30' },
  { label: 'Green', value: '#00C853' },
  { label: 'Blue', value: '#2196F3' },
  { label: 'Purple', value: '#9C27B0' },
];
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
type Phase = 'pick' | 'uploading' | 'processing' | 'review' | 'rendering' | 'ready' | 'failed';

interface BrollDecision {
  at: number;
  duration: number;
  description: string;
  concept: string;
  reason?: string;
  url?: string;
  image_prompt?: string;
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
  const [muteOriginalAudio, setMuteOriginalAudio] = useState(false);
  const [enableWhoosh, setEnableWhoosh] = useState(true);
  const [enableCaptions, setEnableCaptions] = useState(true);
  const [customMusicFile, setCustomMusicFile] = useState<File | null>(null);
  const customMusicInputRef = useRef<HTMLInputElement>(null);

  // When video type changes, reset captions and mute-original to sensible defaults.
  // product = captions off, mute original on (b-roll; original audio is ambient noise).
  // founder/tiktok = captions on, keep original audio (speaker voice is the content).
  useEffect(() => {
    setEnableCaptions(videoType !== 'product');
    setMuteOriginalAudio(videoType === 'product');
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

  // Review phase state
  const [jobId, setJobId] = useState<string | null>(null);
  const [brollDecisions, setBrollDecisions] = useState<BrollDecision[]>([]);
  const [removedBrollIdx, setRemovedBrollIdx] = useState<Set<number>>(new Set());
  const [hookText, setHookText] = useState('');
  const [musicMood, setMusicMood] = useState('upbeat');
  const [reviewCuts, setReviewCuts] = useState<{ remove_start: number; remove_end: number; reason: string }[]>([]);
  const [isStartingRender, setIsStartingRender] = useState(false);
  // Per-b-roll regeneration state
  const [regeneratingIdx, setRegeneratingIdx] = useState<Set<number>>(new Set());
  const [editingIdx, setEditingIdx] = useState<number | null>(null);
  const [editPromptText, setEditPromptText] = useState('');

  // Clean-up layer state
  const [adjustColor, setAdjustColor] = useState<string>('');
  const [adjustFont, setAdjustFont] = useState<string>('');
  const [hookTextEdit, setHookTextEdit] = useState<string>('');
  const [srtEntries, setSrtEntries] = useState<{ index: number; text: string }[]>([]);
  const [captionEdits, setCaptionEdits] = useState<Record<number, string>>({});
  const [editingCaptionIdx, setEditingCaptionIdx] = useState<number | null>(null);
  const [thumbnailUrl, setThumbnailUrl] = useState<string | null>(null);
  const [isAdjusting, setIsAdjusting] = useState(false);
  const videoRef = useRef<HTMLVideoElement | null>(null);

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

  const startPolling = (id: string) => {
    if (pollRef.current) clearInterval(pollRef.current);
    pollRef.current = setInterval(async () => {
      try {
        const res = await SocialMediaAgentService.getVideoProductionJob(id);
        const j = res?.responseData;
        if (!j) return;
        setProgress(j.progress ?? 0);
        setStatusMessage(j.status_message ?? '');
        if (j.status === 'awaiting_review') {
          clearInterval(pollRef.current!);
          const d = j.ai_decisions;
          setBrollDecisions(d?.broll ?? []);
          setRemovedBrollIdx(new Set());
          setHookText(d?.hook_text ?? '');
          setMusicMood(d?.music_mood ?? 'upbeat');
          setReviewCuts(d?.cuts ?? j.cuts ?? []);
          setPhase('review');
        } else if (j.status === 'ready' && j.output_url) {
          clearInterval(pollRef.current!);
          setOutputUrl(j.output_url);
          setPacingNote(j.pacing_note ?? '');
          setCuts(j.cuts ?? []);
          setZooms(j.zooms ?? []);
          setSoundEffects(
            (j as { sound_effects?: { at: number; type: string; reason: string }[] }).sound_effects ?? []
          );
          const newHookText = (j as { ai_decisions?: { hook_text?: string } }).ai_decisions?.hook_text ?? hookText;
          setHookText(newHookText);
          setHookTextEdit(newHookText);
          setSrtEntries(parseSrt((j as { srt?: string }).srt ?? ''));
          setCaptionEdits({});
          setEditingCaptionIdx(null);
          setAdjustColor('');
          setAdjustFont('');
          setIsAdjusting(false);
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

  const handleStartRender = async () => {
    if (!jobId) return;
    setIsStartingRender(true);
    try {
      const approvedBroll = brollDecisions.filter((_, i) => !removedBrollIdx.has(i));
      await SocialMediaAgentService.startVideoProductionRender(jobId, {
        broll: approvedBroll,
        hook_text: hookText,
        music_mood: musicMood,
        cuts: reviewCuts,
      });
      setPhase('rendering');
      setProgress(56);
      setStatusMessage('Rendering your video…');
      startPolling(jobId);
    } catch {
      ToastService.showToast('Failed to start render. Please try again.', ToastTypeEnum.Error);
    } finally {
      setIsStartingRender(false);
    }
  };

  const regenerateBroll = async (index: number, newPrompt?: string) => {
    if (!jobId) return;
    setRegeneratingIdx((prev) => new Set(prev).add(index));
    try {
      const res = await SocialMediaAgentService.regenerateBroll(jobId, index, newPrompt);
      const updated = res?.responseData?.broll;
      if (updated) {
        setBrollDecisions((prev) => prev.map((b, i) => (i === index ? { ...b, ...updated } : b)));
      }
    } catch {
      ToastService.showToast('Could not regenerate that b-roll. Try again.', ToastTypeEnum.Error);
    } finally {
      setRegeneratingIdx((prev) => {
        const next = new Set(prev);
        next.delete(index);
        return next;
      });
    }
  };

  const handleReroll = (index: number) => regenerateBroll(index);

  const handleEditSave = async (index: number) => {
    const text = editPromptText.trim();
    setEditingIdx(null);
    if (text) await regenerateBroll(index, text);
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
      formData.append('mute_original_audio', String(enableMusic && muteOriginalAudio));
      formData.append('enable_sfx', String(enableWhoosh));
      formData.append('enable_captions', String(enableCaptions));
      if (customMusicFile) formData.append('custom_music', customMusicFile);
      formData.append('transition_style', transitionStyle);

      const res = await SocialMediaAgentService.submitVideoProduction(formData, (pct) => {
        setProgress(pct);
        setStatusMessage(`Uploading… ${pct}%`);
      });
      if (!res?.responseData?.job_id) throw new Error('No job ID returned');

      const jid = res.responseData.job_id;
      setJobId(jid);
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
    setJobId(null);
    setPhase('pick');
    setProgress(0);
    setStatusMessage('');
    setOutputUrl(null);
    setCuts([]);
    setZooms([]);
    setSoundEffects([]);
    setBrollDecisions([]);
    setRemovedBrollIdx(new Set());
    setHookText('');
    setMusicMood('upbeat');
    setReviewCuts([]);
    setAdjustColor('');
    setAdjustFont('');
    setHookTextEdit('');
    setSrtEntries([]);
    setCaptionEdits({});
    setEditingCaptionIdx(null);
    setThumbnailUrl(null);
    setIsAdjusting(false);
  };

  const [isCapturingFrame, setIsCapturingFrame] = useState(false);

  const captureFrame = async () => {
    if (!jobId) return;
    const video = videoRef.current;
    const seconds = video ? Math.floor(video.currentTime) : 0;
    setIsCapturingFrame(true);
    try {
      const url = await SocialMediaAgentService.captureVideoFrame(jobId, seconds);
      setThumbnailUrl(url);
    } catch {
      ToastService.showToast('Could not capture frame — try uploading a custom image instead.', ToastTypeEnum.Error);
    } finally {
      setIsCapturingFrame(false);
    }
  };

  const handleThumbnailUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => setThumbnailUrl(ev.target?.result as string);
    reader.readAsDataURL(file);
  };

  const handleApplyAdjustments = async () => {
    if (!jobId) return;
    const hasColorEdit = !!adjustColor;
    const hasFontEdit = !!adjustFont;
    const hasHookEdit = hookTextEdit.trim().toUpperCase() !== hookText.trim().toUpperCase();
    const hasCaptionEdits = Object.keys(captionEdits).length > 0;
    if (!hasColorEdit && !hasFontEdit && !hasHookEdit && !hasCaptionEdits) return;

    setIsAdjusting(true);
    try {
      const edits = Object.entries(captionEdits).map(([idx, text]) => ({
        index: parseInt(idx, 10),
        text,
      }));
      await SocialMediaAgentService.adjustVideoProduction(jobId, {
        captionColor: hasColorEdit ? adjustColor : undefined,
        captionFont: hasFontEdit ? adjustFont : undefined,
        hookText: hasHookEdit ? hookTextEdit.trim().toUpperCase() : undefined,
        captionTextEdits: hasCaptionEdits ? edits : undefined,
      });
      setOutputUrl(null);
      setPhase('rendering');
      setProgress(60);
      setStatusMessage('Applying your changes…');
      startPolling(jobId);
    } catch {
      ToastService.showToast('Failed to apply changes. Please try again.', ToastTypeEnum.Error);
      setIsAdjusting(false);
    }
  };

  // ── Render ────────────────────────────────────────────────────────────────

  if (phase === 'review') {
    const activeBroll = brollDecisions.filter((_, i) => !removedBrollIdx.has(i));
    return (
      <div style={{ padding: '20px 0', maxWidth: 560 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
          <div style={{ fontWeight: 800, fontSize: 17, color: '#111' }}>Review AI Decisions</div>
        </div>
        <div style={{ fontSize: 13, color: '#888', marginBottom: 20 }}>
          {reviewCuts.length} cut{reviewCuts.length !== 1 ? 's' : ''} · {activeBroll.length} b-roll clip
          {activeBroll.length !== 1 ? 's' : ''} · {musicMood} music
          {hookText && <span> · hook: "{hookText}"</span>}
        </div>

        {/* B-roll section */}
        <div style={{ marginBottom: 20 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: '#555', marginBottom: 10 }}>🎬 B-roll Clips</div>
          {brollDecisions.length === 0 ? (
            <div style={{ fontSize: 13, color: '#aaa', fontStyle: 'italic' }}>No b-roll planned for this video.</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {brollDecisions.map((br, i) => {
                const removed = removedBrollIdx.has(i);
                const regenerating = regeneratingIdx.has(i);
                const editing = editingIdx === i;
                return (
                  <div
                    key={i}
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 8,
                      padding: 10,
                      borderRadius: 10,
                      border: `1.5px solid ${removed ? '#e8e5e3' : '#C2185B33'}`,
                      background: removed ? '#fafafa' : '#fff8fb',
                      opacity: removed ? 0.55 : 1,
                      transition: 'all 0.15s',
                    }}
                  >
                    <div style={{ display: 'flex', gap: 10 }}>
                      {/* Thumbnail */}
                      <div
                        style={{
                          position: 'relative',
                          flexShrink: 0,
                          width: 64,
                          height: 96,
                          borderRadius: 8,
                          overflow: 'hidden',
                          background: '#eee',
                          border: '1px solid #e0dcd9',
                        }}
                      >
                        {br.url ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={br.url}
                            alt={br.description}
                            style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                          />
                        ) : (
                          <div
                            style={{
                              width: '100%',
                              height: '100%',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontSize: 20,
                            }}
                          >
                            🎬
                          </div>
                        )}
                        {regenerating && (
                          <div
                            style={{
                              position: 'absolute',
                              inset: 0,
                              background: 'rgba(255,255,255,0.7)',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontSize: 11,
                              fontWeight: 600,
                              color: '#C2185B',
                            }}
                          >
                            …
                          </div>
                        )}
                      </div>

                      {/* Text + actions */}
                      <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column' }}>
                        <div style={{ fontSize: 13, fontWeight: 600, color: '#111', marginBottom: 2 }}>
                          {br.description || br.concept}
                        </div>
                        <div style={{ fontSize: 11, color: '#888', marginBottom: 'auto' }}>
                          at {br.at.toFixed(1)}s · {br.duration}s
                        </div>
                        {!removed && (
                          <div style={{ display: 'flex', gap: 6, marginTop: 6, flexWrap: 'wrap' }}>
                            <button
                              type="button"
                              disabled={regenerating}
                              onClick={() => handleReroll(i)}
                              style={{
                                padding: '3px 8px',
                                borderRadius: 6,
                                border: '1px solid #ddd',
                                background: '#fff',
                                color: '#555',
                                fontWeight: 600,
                                fontSize: 11,
                                cursor: regenerating ? 'not-allowed' : 'pointer',
                              }}
                            >
                              🔄 Reroll
                            </button>
                            <button
                              type="button"
                              disabled={regenerating}
                              onClick={() => {
                                setEditingIdx(i);
                                setEditPromptText(br.image_prompt ?? '');
                              }}
                              style={{
                                padding: '3px 8px',
                                borderRadius: 6,
                                border: '1px solid #ddd',
                                background: '#fff',
                                color: '#555',
                                fontWeight: 600,
                                fontSize: 11,
                                cursor: regenerating ? 'not-allowed' : 'pointer',
                              }}
                            >
                              ✎ Edit
                            </button>
                          </div>
                        )}
                      </div>

                      {/* Remove / restore */}
                      <button
                        type="button"
                        onClick={() => {
                          setRemovedBrollIdx((prev) => {
                            const next = new Set(prev);
                            if (next.has(i)) next.delete(i);
                            else next.add(i);
                            return next;
                          });
                        }}
                        style={{
                          alignSelf: 'flex-start',
                          flexShrink: 0,
                          padding: '4px 10px',
                          borderRadius: 6,
                          border: `1px solid ${removed ? '#C2185B' : '#ddd'}`,
                          background: removed ? '#fff' : '#f5f4f0',
                          color: removed ? '#C2185B' : '#888',
                          fontWeight: 600,
                          fontSize: 11,
                          cursor: 'pointer',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {removed ? '+ Restore' : '✕ Remove'}
                      </button>
                    </div>

                    {/* Inline edit-prompt editor */}
                    {editing && (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                        <textarea
                          value={editPromptText}
                          onChange={(e) => setEditPromptText(e.target.value)}
                          rows={3}
                          placeholder="Describe the image you want (e.g. a founder relaxing at a tidy desk, bright office)…"
                          style={{
                            width: '100%',
                            boxSizing: 'border-box',
                            fontSize: 12,
                            padding: 8,
                            borderRadius: 8,
                            border: '1.5px solid #C2185B55',
                            resize: 'vertical',
                            fontFamily: 'inherit',
                            color: '#111',
                          }}
                        />
                        <div style={{ display: 'flex', gap: 6 }}>
                          <button
                            type="button"
                            onClick={() => handleEditSave(i)}
                            style={{
                              padding: '5px 12px',
                              borderRadius: 6,
                              border: 'none',
                              background: 'linear-gradient(135deg,#C2185B,#8E1545)',
                              color: '#fff',
                              fontWeight: 700,
                              fontSize: 11,
                              cursor: 'pointer',
                            }}
                          >
                            Regenerate
                          </button>
                          <button
                            type="button"
                            onClick={() => setEditingIdx(null)}
                            style={{
                              padding: '5px 12px',
                              borderRadius: 6,
                              border: '1.5px solid #e0dcd9',
                              background: '#fff',
                              color: '#555',
                              fontWeight: 600,
                              fontSize: 11,
                              cursor: 'pointer',
                            }}
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Cuts summary */}
        {reviewCuts.length > 0 && (
          <div style={{ marginBottom: 20 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: '#555', marginBottom: 8 }}>
              ✂️ Cuts ({reviewCuts.length})
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              {reviewCuts.slice(0, 4).map((c, i) => (
                <div
                  key={i}
                  style={{ fontSize: 12, color: '#666', background: '#f8f7f5', borderRadius: 6, padding: '5px 8px' }}
                >
                  {c.remove_start.toFixed(1)}s – {c.remove_end.toFixed(1)}s — {c.reason}
                </div>
              ))}
              {reviewCuts.length > 4 && (
                <div style={{ fontSize: 11, color: '#aaa' }}>+{reviewCuts.length - 4} more cuts</div>
              )}
            </div>
          </div>
        )}

        {/* Actions */}
        <div style={{ display: 'flex', gap: 10 }}>
          <button
            type="button"
            onClick={handleStartRender}
            disabled={isStartingRender}
            style={{
              flex: 1,
              padding: '12px 0',
              borderRadius: 10,
              border: 'none',
              background: isStartingRender ? '#e0dcd9' : 'linear-gradient(135deg,#C2185B,#8E1545)',
              color: '#fff',
              fontWeight: 700,
              fontSize: 14,
              cursor: isStartingRender ? 'not-allowed' : 'pointer',
            }}
          >
            {isStartingRender
              ? 'Starting…'
              : `🎬 Render Video${activeBroll.length > 0 ? ` with ${activeBroll.length} B-roll` : ''}`}
          </button>
          <button
            type="button"
            onClick={handleReset}
            style={{
              padding: '12px 16px',
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

  if (phase === 'rendering') {
    return (
      <div style={{ padding: '20px 0', maxWidth: 560 }}>
        <div style={{ fontWeight: 800, fontSize: 17, color: '#111', marginBottom: 4 }}>Rendering…</div>
        <div style={{ fontSize: 13, color: '#888', marginBottom: 20 }}>{statusMessage}</div>
        <div style={{ background: '#f0eded', borderRadius: 8, height: 8, overflow: 'hidden', marginBottom: 8 }}>
          <div
            style={{
              height: '100%',
              borderRadius: 8,
              background: 'linear-gradient(90deg,#C2185B,#8E1545)',
              width: `${progress}%`,
              transition: 'width 0.4s ease',
            }}
          />
        </div>
        <div style={{ fontSize: 12, color: '#aaa', textAlign: 'right' }}>{progress}%</div>
      </div>
    );
  }

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
            ref={videoRef}
            src={outputUrl}
            controls
            playsInline
            poster={thumbnailUrl ?? undefined}
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

        {/* ── Clean-up layer ─────────────────────────────────────── */}
        <div
          style={{
            background: '#fafaf9',
            border: '1.5px solid #e8e5e3',
            borderRadius: 12,
            padding: '14px 16px',
            marginBottom: 16,
          }}
        >
          <div style={{ fontWeight: 700, fontSize: 13, color: '#333', marginBottom: 12 }}>Tweak your video</div>

          {/* Caption colour */}
          <div style={{ marginBottom: 14 }}>
            <div style={{ fontSize: 12, color: '#777', marginBottom: 8, fontWeight: 600 }}>Caption colour</div>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {CAPTION_COLOR_PRESETS.map((preset) => {
                const selected = adjustColor === preset.value;
                return (
                  <button
                    key={preset.value}
                    type="button"
                    title={preset.label}
                    onClick={() => setAdjustColor(selected ? '' : preset.value)}
                    style={{
                      width: 28,
                      height: 28,
                      borderRadius: '50%',
                      border: selected ? '3px solid #C2185B' : '2px solid #ddd',
                      background: preset.value,
                      cursor: 'pointer',
                      flexShrink: 0,
                      boxShadow: selected ? '0 0 0 2px #fff, 0 0 0 4px #C2185B' : 'none',
                      transition: 'box-shadow 0.15s',
                    }}
                  />
                );
              })}
              {adjustColor && (
                <button
                  type="button"
                  onClick={() => setAdjustColor('')}
                  style={{
                    fontSize: 11,
                    color: '#888',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    alignSelf: 'center',
                    padding: '0 4px',
                  }}
                >
                  Reset
                </button>
              )}
            </div>
          </div>

          {/* Caption font */}
          <div style={{ marginBottom: 14 }}>
            <div style={{ fontSize: 12, color: '#777', marginBottom: 8, fontWeight: 600 }}>Caption font</div>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {[
                { label: 'Montserrat', desc: 'Default' },
                { label: 'Anton', desc: 'Heavy' },
                { label: 'Bangers', desc: 'Comic' },
                { label: 'Pacifico', desc: 'Script' },
                { label: 'Permanent Marker', desc: 'Handwritten' },
                { label: 'Press Start 2P', desc: 'Retro' },
              ].map((f) => {
                const selected = adjustFont === f.label;
                return (
                  <button
                    key={f.label}
                    type="button"
                    onClick={() => setAdjustFont(selected ? '' : f.label)}
                    style={{
                      padding: '5px 12px',
                      borderRadius: 20,
                      border: `1.5px solid ${selected ? '#C2185B' : '#ddd'}`,
                      background: selected ? '#fff0f5' : '#fff',
                      color: selected ? '#C2185B' : '#444',
                      fontWeight: selected ? 700 : 400,
                      fontSize: 12,
                      cursor: 'pointer',
                      transition: 'all 0.12s',
                    }}
                  >
                    <span style={{ fontWeight: 700 }}>{f.label}</span>
                    <span style={{ color: '#aaa', marginLeft: 4, fontSize: 11 }}>{f.desc}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Hook text edit */}
          <div style={{ marginBottom: 14 }}>
            <div style={{ fontSize: 12, color: '#777', marginBottom: 8, fontWeight: 600 }}>Edit hook text</div>
            <input
              type="text"
              value={hookTextEdit}
              onChange={(e) => setHookTextEdit(e.target.value.toUpperCase())}
              style={{
                width: '100%',
                fontSize: 12,
                fontWeight: 700,
                letterSpacing: '0.03em',
                padding: '8px 10px',
                border: '1.5px solid #ddd',
                borderRadius: 8,
                background: '#fff',
                color: '#111',
                boxSizing: 'border-box',
                outline: 'none',
              }}
              onFocus={(e) => (e.currentTarget.style.borderColor = '#C2185B')}
              onBlur={(e) => (e.currentTarget.style.borderColor = '#ddd')}
            />
          </div>

          {/* Caption text edits */}
          {srtEntries.length > 0 && (
            <div style={{ marginBottom: 14 }}>
              <div style={{ fontSize: 12, color: '#777', marginBottom: 8, fontWeight: 600 }}>Edit captions</div>
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 6,
                  maxHeight: 200,
                  overflowY: 'auto',
                  paddingRight: 4,
                }}
              >
                {srtEntries.map((entry) => {
                  const isEditing = editingCaptionIdx === entry.index;
                  const currentText = captionEdits[entry.index] ?? entry.text;
                  const isEdited = captionEdits[entry.index] !== undefined;
                  return (
                    <div
                      key={entry.index}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 8,
                        background: isEdited ? '#fff8fb' : '#fff',
                        border: `1px solid ${isEdited ? '#C2185B44' : '#ece9e6'}`,
                        borderRadius: 8,
                        padding: '6px 10px',
                      }}
                    >
                      <span style={{ fontSize: 10, color: '#bbb', minWidth: 18, fontWeight: 600 }}>{entry.index}</span>
                      {isEditing ? (
                        <input
                          autoFocus
                          value={currentText}
                          onChange={(e) => setCaptionEdits((prev) => ({ ...prev, [entry.index]: e.target.value }))}
                          onBlur={() => {
                            if (captionEdits[entry.index] === entry.text) {
                              setCaptionEdits((prev) => {
                                const n = { ...prev };
                                delete n[entry.index];
                                return n;
                              });
                            }
                            setEditingCaptionIdx(null);
                          }}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' || e.key === 'Escape') (e.target as HTMLInputElement).blur();
                          }}
                          style={{
                            flex: 1,
                            fontSize: 12,
                            border: 'none',
                            outline: '1.5px solid #C2185B',
                            borderRadius: 4,
                            padding: '2px 6px',
                            background: '#fff',
                            color: '#111',
                          }}
                        />
                      ) : (
                        <span
                          onClick={() => setEditingCaptionIdx(entry.index)}
                          style={{ flex: 1, fontSize: 12, color: '#333', cursor: 'text', lineHeight: 1.4 }}
                        >
                          {currentText}
                        </span>
                      )}
                      {isEdited && (
                        <button
                          type="button"
                          onClick={() =>
                            setCaptionEdits((prev) => {
                              const n = { ...prev };
                              delete n[entry.index];
                              return n;
                            })
                          }
                          style={{
                            fontSize: 10,
                            color: '#aaa',
                            background: 'none',
                            border: 'none',
                            cursor: 'pointer',
                            padding: 0,
                            flexShrink: 0,
                          }}
                        >
                          ↺
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Thumbnail / cover image */}
          <div style={{ marginBottom: 14 }}>
            <div style={{ fontSize: 12, color: '#777', marginBottom: 8, fontWeight: 600 }}>Cover image</div>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
              <button
                type="button"
                onClick={captureFrame}
                disabled={isCapturingFrame}
                style={{
                  padding: '5px 12px',
                  borderRadius: 20,
                  border: '1.5px solid #ddd',
                  background: '#fff',
                  color: isCapturingFrame ? '#aaa' : '#444',
                  fontSize: 12,
                  cursor: isCapturingFrame ? 'not-allowed' : 'pointer',
                }}
              >
                {isCapturingFrame ? 'Capturing…' : 'Capture current frame'}
              </button>
              <label
                style={{
                  padding: '5px 12px',
                  borderRadius: 20,
                  border: '1.5px solid #ddd',
                  background: '#fff',
                  color: '#444',
                  fontSize: 12,
                  cursor: 'pointer',
                }}
              >
                Upload image
                <input type="file" accept="image/*" onChange={handleThumbnailUpload} style={{ display: 'none' }} />
              </label>
              {thumbnailUrl && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <img
                    src={thumbnailUrl}
                    alt="Cover"
                    style={{ height: 40, borderRadius: 6, border: '1.5px solid #ddd', objectFit: 'cover' }}
                  />
                  <button
                    type="button"
                    onClick={() => setThumbnailUrl(null)}
                    style={{
                      fontSize: 11,
                      color: '#aaa',
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      padding: 0,
                    }}
                  >
                    Remove
                  </button>
                </div>
              )}
            </div>
            {!thumbnailUrl && (
              <div style={{ fontSize: 11, color: '#bbb', marginTop: 6 }}>
                Seek the video above to your desired frame, then capture.
              </div>
            )}
          </div>

          {/* Apply button */}
          {(adjustColor ||
            adjustFont ||
            hookTextEdit.trim().toUpperCase() !== hookText.trim().toUpperCase() ||
            Object.keys(captionEdits).length > 0) && (
            <button
              type="button"
              onClick={handleApplyAdjustments}
              disabled={isAdjusting}
              style={{
                marginTop: 14,
                width: '100%',
                padding: '10px 0',
                borderRadius: 9,
                border: 'none',
                background: isAdjusting ? '#e0dcd9' : 'linear-gradient(135deg,#C2185B,#8E1545)',
                color: '#fff',
                fontWeight: 700,
                fontSize: 13,
                cursor: isAdjusting ? 'not-allowed' : 'pointer',
              }}
            >
              {isAdjusting ? 'Re-rendering…' : 'Apply Changes'}
            </button>
          )}
        </div>

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

        {/* Mute original audio — only shown when background music is enabled */}
        {enableMusic && (
          <button
            onClick={() => setMuteOriginalAudio(!muteOriginalAudio)}
            style={{
              width: '100%',
              marginBottom: 10,
              padding: '10px 14px',
              borderRadius: 10,
              border: muteOriginalAudio ? '2px solid #C2185B' : '1.5px solid #e5e7eb',
              background: muteOriginalAudio ? '#FDF2F8' : '#f9fafb',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 10,
              transition: 'all 0.15s',
            }}
          >
            <div style={{ textAlign: 'left' }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: muteOriginalAudio ? '#C2185B' : '#555' }}>
                🔇 Use music only (mute original audio)
              </div>
              <div style={{ fontSize: 11, color: '#999', marginTop: 2 }}>
                {muteOriginalAudio
                  ? 'Only the music plays — original video audio is muted'
                  : 'Voice plays alongside the music (music is ducked under voice)'}
              </div>
            </div>
            <span
              style={{
                width: 32,
                height: 18,
                borderRadius: 9,
                background: muteOriginalAudio ? '#C2185B' : '#d1d5db',
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
                  transform: muteOriginalAudio ? 'translateX(14px)' : 'translateX(0)',
                  transition: 'transform 0.15s',
                  display: 'block',
                }}
              />
            </span>
          </button>
        )}

        {/* Custom soundtrack — only shown when background music is enabled */}
        <div
          style={{ marginBottom: 14, opacity: enableMusic ? 1 : 0.35, pointerEvents: enableMusic ? 'auto' : 'none' }}
        >
          <div style={{ fontSize: 12, color: '#555', marginBottom: 6, fontWeight: 600 }}>
            Custom soundtrack{' '}
            <span style={{ fontWeight: 400, color: '#aaa' }}>
              {enableMusic ? '(MP3 — replaces AI music)' : '(enable background music to upload)'}
            </span>
          </div>
          {customMusicFile ? (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                padding: '9px 12px',
                borderRadius: 10,
                border: '2px solid #C2185B',
                background: '#FDF2F8',
              }}
            >
              <span style={{ fontSize: 18, flexShrink: 0 }}>🎵</span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div
                  style={{
                    fontSize: 12,
                    fontWeight: 700,
                    color: '#111',
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
                onClick={() => setCustomMusicFile(null)}
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
                Remove
              </button>
            </div>
          ) : (
            <button
              onClick={() => customMusicInputRef.current?.click()}
              style={{
                width: '100%',
                padding: '9px 12px',
                borderRadius: 10,
                border: '1.5px dashed #d0ccc8',
                background: '#fafaf9',
                cursor: 'pointer',
                fontSize: 12,
                fontWeight: 600,
                color: '#888',
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                transition: 'all 0.15s',
              }}
            >
              <span style={{ fontSize: 16 }}>🎵</span>
              Upload MP3 soundtrack
            </button>
          )}
          <input
            ref={customMusicInputRef}
            type="file"
            accept="audio/mpeg,audio/mp3,.mp3"
            style={{ display: 'none' }}
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (!f) return;
              if (f.size > 50 * 1024 * 1024) {
                alert('MP3 must be under 50 MB');
                return;
              }
              setCustomMusicFile(f);
            }}
          />
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
