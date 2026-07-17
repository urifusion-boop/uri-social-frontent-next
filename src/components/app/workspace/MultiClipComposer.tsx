'use client';

import { SocialMediaAgentService, MultiClipJob, MultiClipClip } from '@/src/api/SocialMediaAgentService';
import { useEffect, useRef, useState } from 'react';

const PRIMARY = '#CD1B78';
const DARK = '#0d0e0f';
const GREY = '#6B7280';
const BORDER = '#E5E7EB';
const LIGHT = '#F9FAFB';

const SESSION_KEY = 'uri:multiclip:session';

const ORIENTATIONS = [
  { value: '9:16', label: 'Vertical', sub: 'Reels · TikTok · Status' },
  { value: '1:1', label: 'Square', sub: 'Feed posts' },
  { value: '16:9', label: 'Landscape', sub: 'YouTube · Wide' },
];

const DURATIONS = [
  { value: 15, label: '15s', sub: 'Punchy' },
  { value: 30, label: '30s', sub: 'Standard' },
  { value: 60, label: '60s', sub: 'Detailed' },
];

const STORY_TYPES = [
  { value: 'founder', label: 'Founder Story', sub: 'You talking · transcript captions' },
  { value: 'product', label: 'Product Story', sub: 'Silent product clips · script captions' },
];

const CLIP_TYPE_LABEL: Record<string, string> = {
  speech: 'Speech',
  silent: 'Silent',
  still: 'Still image',
};

const SHOT_TYPE_LABEL: Record<string, string> = {
  attention_shot: 'Hero shot',
  detail_closeup: 'Close-up',
  benefit_context: 'In use',
  packaging: 'Packaging',
  cta_shot: 'CTA shot',
  general: 'General',
};

const QUALITY_FLAG_LABEL: Record<string, string> = {
  too_dark: 'Too dark',
  too_short: 'Too short',
  too_quiet: 'Too quiet',
  pre_edited: 'Pre-edited',
  upload_failed: 'Upload failed',
};

// ── Drag-to-reorder helper ────────────────────────────────────────────────────

function reorder<T>(list: T[], from: number, to: number): T[] {
  const result = [...list];
  const [moved] = result.splice(from, 1);
  result.splice(to, 0, moved);
  return result;
}

// ── Sub-components ────────────────────────────────────────────────────────────

function ProgressBar({ value }: { value: number }) {
  return (
    <div style={{ width: '100%', height: 6, background: BORDER, borderRadius: 4, overflow: 'hidden' }}>
      <div
        style={{
          height: '100%',
          width: `${Math.min(100, value)}%`,
          background: PRIMARY,
          borderRadius: 4,
          transition: 'width 0.4s ease',
        }}
      />
    </div>
  );
}

function Chip({ label, color = GREY }: { label: string; color?: string }) {
  return (
    <span
      style={{
        display: 'inline-block',
        padding: '2px 8px',
        borderRadius: 6,
        border: `1px solid ${color}33`,
        background: `${color}14`,
        color,
        fontSize: 11,
        fontWeight: 600,
      }}
    >
      {label}
    </span>
  );
}

function ClipCard({
  clip,
  rank,
  total,
  storyType = 'founder',
  onMoveUp,
  onMoveDown,
  onDrop,
  onPositionChange,
}: {
  clip: MultiClipClip;
  rank: number;
  total: number;
  storyType?: 'founder' | 'product';
  onMoveUp: () => void;
  onMoveDown: () => void;
  onDrop: (dropped: boolean) => void;
  onPositionChange?: (pos: 'left' | 'center' | 'right') => void;
}) {
  const dropped = !!clip.dropped;
  const hasWarning = clip.quality_flags.length > 0 || clip.recommended_drop;

  return (
    <div
      style={{
        border: `1.5px solid ${dropped ? '#FCA5A5' : hasWarning ? '#FCD34D' : BORDER}`,
        borderRadius: 12,
        padding: '14px 16px',
        background: dropped ? '#FFF5F5' : hasWarning ? '#FFFBEB' : '#fff',
        opacity: dropped ? 0.6 : 1,
        transition: 'opacity 0.2s',
      }}
    >
      {/* Header row */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
        {/* Order badge */}
        <div
          style={{
            width: 28,
            height: 28,
            borderRadius: '50%',
            background: dropped ? '#E5E7EB' : PRIMARY,
            color: '#fff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 12,
            fontWeight: 700,
            flexShrink: 0,
          }}
        >
          {dropped ? '✕' : rank + 1}
        </div>

        {/* Filename + meta */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <p
            style={{
              margin: 0,
              fontSize: 13,
              fontWeight: 700,
              color: DARK,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {clip.filename || `Clip ${rank + 1}`}
          </p>
          <p style={{ margin: '2px 0 0', fontSize: 11.5, color: GREY }}>{clip.duration_seconds.toFixed(1)}s</p>
        </div>

        {/* Type chip */}
        {storyType === 'product' && clip.shot_type ? (
          <Chip label={SHOT_TYPE_LABEL[clip.shot_type] || clip.shot_type} color="#7c3aed" />
        ) : (
          <Chip
            label={CLIP_TYPE_LABEL[clip.clip_type] || clip.clip_type}
            color={clip.clip_type === 'speech' ? '#16a34a' : clip.clip_type === 'still' ? '#7c3aed' : GREY}
          />
        )}

        {/* Move buttons */}
        {!dropped && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <button onClick={onMoveUp} disabled={rank === 0} style={arrowBtn(rank === 0)} title="Move up">
              ↑
            </button>
            <button
              onClick={onMoveDown}
              disabled={rank === total - 1}
              style={arrowBtn(rank === total - 1)}
              title="Move down"
            >
              ↓
            </button>
          </div>
        )}
      </div>

      {/* Transcript / vision preview */}
      {!dropped && (storyType === 'product' ? clip.vision_description : clip.transcript) && (
        <p
          style={{
            margin: '0 0 8px',
            fontSize: 12,
            color: GREY,
            fontStyle: 'italic',
            overflow: 'hidden',
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
          }}
        >
          {storyType === 'product' ? clip.vision_description : `“${clip.transcript}”`}
        </p>
      )}

      {/* Quality warnings */}
      {clip.quality_flags.length > 0 && (
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 8 }}>
          {clip.quality_flags.map((f) => (
            <Chip key={f} label={`⚠ ${QUALITY_FLAG_LABEL[f] || f}`} color="#D97706" />
          ))}
        </div>
      )}

      {/* Pre-edited warning */}
      {!dropped && clip.quality_flags.includes('pre_edited') && (
        <div
          style={{
            background: '#EFF6FF',
            border: '1px solid #93C5FD',
            borderRadius: 8,
            padding: '8px 12px',
            marginBottom: 8,
            fontSize: 12,
            color: '#1E40AF',
            lineHeight: 1.5,
          }}
        >
          This clip already has captions or music baked in — our captions may double up. For best results, upload raw
          footage.
        </div>
      )}

      {/* Recommended drop banner */}
      {clip.recommended_drop && !dropped && (
        <div
          style={{
            background: '#FEF3C7',
            border: '1px solid #FCD34D',
            borderRadius: 8,
            padding: '8px 12px',
            marginBottom: 8,
            fontSize: 12,
            color: '#92400E',
          }}
        >
          {clip.drop_reason || 'This clip may affect overall quality.'}
        </div>
      )}

      {/* Crop position nudge */}
      {!dropped && onPositionChange && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
          <span style={{ fontSize: 11, color: GREY, flexShrink: 0 }}>Crop focus:</span>
          {(['left', 'center', 'right'] as const).map((pos) => {
            const active = (clip.subject_position ?? 'center') === pos;
            return (
              <button
                key={pos}
                onClick={() => onPositionChange(pos)}
                style={{
                  padding: '3px 10px',
                  borderRadius: 6,
                  border: `1.5px solid ${active ? PRIMARY : BORDER}`,
                  background: active ? PRIMARY : 'transparent',
                  color: active ? '#fff' : GREY,
                  fontSize: 11,
                  fontWeight: active ? 700 : 500,
                  cursor: 'pointer',
                  fontFamily: 'inherit',
                  textTransform: 'capitalize',
                }}
              >
                {pos}
              </button>
            );
          })}
        </div>
      )}

      {/* Drop / Restore action */}
      <button
        onClick={() => onDrop(!dropped)}
        style={{
          padding: '5px 12px',
          borderRadius: 7,
          border: `1.5px solid ${dropped ? '#16a34a' : '#EF4444'}`,
          background: 'transparent',
          color: dropped ? '#16a34a' : '#EF4444',
          fontSize: 12,
          fontWeight: 600,
          cursor: 'pointer',
          fontFamily: 'inherit',
        }}
      >
        {dropped ? 'Restore clip' : 'Drop clip'}
      </button>
    </div>
  );
}

function arrowBtn(disabled: boolean): React.CSSProperties {
  return {
    width: 22,
    height: 22,
    borderRadius: 4,
    border: `1.5px solid ${disabled ? BORDER : GREY}`,
    background: 'transparent',
    color: disabled ? BORDER : GREY,
    cursor: disabled ? 'default' : 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: 12,
    fontFamily: 'inherit',
    padding: 0,
  };
}

// ── Main component ────────────────────────────────────────────────────────────

export default function MultiClipComposer({
  onSaveToDrafts,
  onSendToProduce,
}: {
  onSaveToDrafts?: () => void;
  onSendToProduce?: (url: string) => void;
} = {}) {
  // Config
  const [storyType, setStoryType] = useState<'founder' | 'product'>('founder');
  const [orientation, setOrientation] = useState<'9:16' | '1:1' | '16:9'>('9:16');
  const [targetDuration, setTargetDuration] = useState(30);
  const [enableMusic, setEnableMusic] = useState(true);
  const [musicVolume, setMusicVolume] = useState(0.12); // Shotstack track volume

  // Product Story script
  const [scriptDescription, setScriptDescription] = useState('');
  const [scriptDraft, setScriptDraft] = useState('');
  const [scriptLines, setScriptLines] = useState<string[]>([]);
  const [scriptDrafting, setScriptDrafting] = useState(false);
  const [scriptApproving, setScriptApproving] = useState(false);

  // Upload
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [dragging, setDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Job
  const [job, setJob] = useState<MultiClipJob | null>(null);
  const [jobError, setJobError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [uploadPct, setUploadPct] = useState(0);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Local clip ordering (mirrors job.clips sorted by order_index)
  const [orderedClipIds, setOrderedClipIds] = useState<string[]>([]);
  const [stitching, setStitching] = useState(false);

  // Result
  const [caption, setCaption] = useState('');
  const [captionGenerating, setCaptionGenerating] = useState(false);
  const [captionPlatform, setCaptionPlatform] = useState('instagram');
  const captionGeneratedRef = useRef(false);

  // AI editing decisions
  const [aiDecisions, setAiDecisions] = useState<{
    cuts: { at: number; end: number; reason: string }[];
    zooms: { at: number; duration: number; reason: string }[];
    transition_style: string;
    summary: string;
  } | null>(null);
  const [analyzingDecisions, setAnalyzingDecisions] = useState(false);
  const decisionsRequestedRef = useRef(false);

  // ── Session persistence ─────────────────────────────────────────────────────

  const saveSession = (j: MultiClipJob) => {
    try {
      localStorage.setItem(SESSION_KEY, JSON.stringify({ job: j }));
    } catch {
      /* quota */
    }
  };

  const clearSession = () => {
    try {
      localStorage.removeItem(SESSION_KEY);
    } catch {
      /* ignore */
    }
  };

  // Restore on mount
  useEffect(() => {
    try {
      const raw = localStorage.getItem(SESSION_KEY);
      if (!raw) return;
      const { job: saved } = JSON.parse(raw) as { job: MultiClipJob };
      if (!saved?.job_id || saved.status === 'ready' || saved.status === 'failed') {
        clearSession();
        return;
      }
      setJob(saved);
      setOrderedClipIds([...saved.clips].sort((a, b) => a.order_index - b.order_index).map((c) => c.clip_id));
      // Fetch latest immediately
      SocialMediaAgentService.getMultiClipJob(saved.job_id)
        .then((res) => {
          if (res.status && res.responseData) {
            setJob(res.responseData);
            saveSession(res.responseData);
          }
        })
        .catch(() => {});
    } catch {
      /* corrupted */
    }
  }, []);

  // ── Polling ─────────────────────────────────────────────────────────────────

  useEffect(() => {
    if (!job || job.status === 'ready' || job.status === 'failed') {
      if (pollRef.current) clearInterval(pollRef.current);
      if (job?.status === 'ready' || job?.status === 'failed') clearSession();
      return;
    }
    pollRef.current = setInterval(async () => {
      try {
        const res = await SocialMediaAgentService.getMultiClipJob(job.job_id);
        if (res.status && res.responseData) {
          const updated = res.responseData;
          setJob(updated);
          saveSession(updated);
          if (updated.status === 'awaiting_order' && orderedClipIds.length === 0) {
            setOrderedClipIds([...updated.clips].sort((a, b) => a.order_index - b.order_index).map((c) => c.clip_id));
          }
          if (updated.status === 'ready' || updated.status === 'failed') {
            if (pollRef.current) clearInterval(pollRef.current);
            clearSession();
          }
        }
      } catch {
        /* keep polling */
      }
    }, 8000);
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [job?.job_id, job?.status]);

  // Auto-generate caption when render completes
  useEffect(() => {
    if (job?.status === 'ready' && job.output_url && !captionGeneratedRef.current && !caption) {
      captionGeneratedRef.current = true;
      generateCaption(job, captionPlatform);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [job?.status]);

  // Auto-run AI decisions analysis when video is ready
  useEffect(() => {
    if (job?.status === 'ready' && job.job_id && !decisionsRequestedRef.current) {
      decisionsRequestedRef.current = true;
      setAnalyzingDecisions(true);
      SocialMediaAgentService.analyzeMultiClipJob(job.job_id)
        .then((res) => {
          if (res.status && res.responseData) setAiDecisions(res.responseData);
        })
        .catch(() => {})
        .finally(() => setAnalyzingDecisions(false));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [job?.status]);

  // ── File handling ───────────────────────────────────────────────────────────

  const addFiles = (files: FileList | null) => {
    if (!files) return;
    const incoming = Array.from(files).filter((f) => f.type.startsWith('video/') && f.size <= 500 * 1024 * 1024);
    setSelectedFiles((prev) => {
      const combined = [...prev, ...incoming];
      return combined.slice(0, 10);
    });
  };

  const removeFile = (i: number) => setSelectedFiles((prev) => prev.filter((_, idx) => idx !== i));

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    addFiles(e.dataTransfer.files);
  };

  // ── Submit ──────────────────────────────────────────────────────────────────

  const handleStart = async () => {
    if (selectedFiles.length < 1) return;
    setSubmitting(true);
    setUploadPct(0);
    setJobError('');
    clearSession();
    const fd = new FormData();
    selectedFiles.forEach((f) => fd.append('clips', f));
    fd.append('story_type', storyType);
    fd.append('target_duration', String(targetDuration));
    fd.append('orientation', orientation);
    fd.append('enable_music', enableMusic ? 'true' : 'false');
    fd.append('music_mood', 'chill');
    fd.append('music_volume', String(enableMusic ? musicVolume : 0));
    try {
      const res = await SocialMediaAgentService.startMultiClipJob(fd, setUploadPct);
      if (res.status && res.responseData) {
        const jobRes = await SocialMediaAgentService.getMultiClipJob(res.responseData.job_id);
        if (jobRes.status && jobRes.responseData) {
          setJob(jobRes.responseData);
          saveSession(jobRes.responseData);
        }
      } else {
        setJobError(res.responseMessage || 'Failed to start. Please try again.');
      }
    } catch {
      setJobError('Something went wrong. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  // ── Reorder ─────────────────────────────────────────────────────────────────

  const moveClip = async (fromIdx: number, toIdx: number) => {
    if (!job) return;
    const newOrder = reorder(orderedClipIds, fromIdx, toIdx);
    setOrderedClipIds(newOrder);
    try {
      await SocialMediaAgentService.reorderMultiClipJob(job.job_id, newOrder);
    } catch {
      /* best-effort */
    }
  };

  // ── Drop clip ───────────────────────────────────────────────────────────────

  const handleDrop2 = async (clipId: string, dropped: boolean) => {
    if (!job) return;
    // Optimistic update
    setJob((prev) =>
      prev
        ? {
            ...prev,
            clips: prev.clips.map((c) => (c.clip_id === clipId ? { ...c, dropped } : c)),
          }
        : prev
    );
    try {
      await SocialMediaAgentService.dropMultiClip(job.job_id, clipId, dropped);
    } catch {
      /* best-effort */
    }
  };

  // ── Stitch ──────────────────────────────────────────────────────────────────

  const handleStitch = async () => {
    if (!job) return;
    setStitching(true);
    setJobError('');
    try {
      const res = await SocialMediaAgentService.stitchMultiClipJob(job.job_id);
      if (res.status && res.responseData) {
        setJob((prev) => (prev ? { ...prev, status: 'stitching', progress: 70, status_message: 'Rendering…' } : prev));
        saveSession({ ...job, status: 'stitching', progress: 70, status_message: 'Rendering…' });
      } else {
        setJobError(res.responseMessage || 'Stitch failed. Please try again.');
      }
    } catch {
      setJobError('Something went wrong starting the render.');
    } finally {
      setStitching(false);
    }
  };

  // ── Product Story: script handlers ─────────────────────────────────────────

  const handleDraftScript = async () => {
    if (!job || !scriptDescription.trim()) return;
    setScriptDrafting(true);
    try {
      const res = await SocialMediaAgentService.draftProductScript(job.job_id, scriptDescription.trim());
      if (res.status && res.responseData) {
        setScriptDraft(res.responseData.draft);
        setScriptLines(res.responseData.lines);
      }
    } catch {
      /* silently fail */
    } finally {
      setScriptDrafting(false);
    }
  };

  const handleApproveScript = async () => {
    if (!job) return;
    const finalScript = scriptDraft || job.script_draft || '';
    const finalLines =
      scriptLines.length > 0
        ? scriptLines
        : (job.script_lines_draft ?? finalScript.split('\n').filter((l) => l.trim()));
    if (!finalScript.trim()) return;
    setScriptApproving(true);
    try {
      const res = await SocialMediaAgentService.approveProductScript(job.job_id, finalScript, finalLines);
      if (res.status) {
        setJob((prev) =>
          prev
            ? { ...prev, status: 'analyzing', progress: 60, status_message: 'Describing clips with AI vision…' }
            : prev
        );
      }
    } catch {
      /* silently fail */
    } finally {
      setScriptApproving(false);
    }
  };

  // ── Caption generation ──────────────────────────────────────────────────────

  const generateCaption = async (j: MultiClipJob, plt: string) => {
    setCaptionGenerating(true);
    try {
      const storyboardLike = {
        story_type: j.story_type,
        clips: [...j.clips]
          .filter((c) => !c.dropped)
          .sort((a, b) => a.order_index - b.order_index)
          .map((c) => ({ transcript: c.transcript, duration_seconds: c.duration_seconds })),
      };
      const res = await SocialMediaAgentService.generateVideoCaption({
        storyboard: storyboardLike as unknown as Record<string, unknown>,
        platform: plt,
      });
      if (res.status && res.responseData?.caption) {
        setCaption(res.responseData.caption);
      }
    } catch {
      /* silently fail */
    } finally {
      setCaptionGenerating(false);
    }
  };

  // ── Re-stitch (reset ready job back to awaiting_order) ──────────────────────

  const [reStitching, setReStitching] = useState(false);

  const handleReStitch = async () => {
    if (!job) return;
    setReStitching(true);
    try {
      await SocialMediaAgentService.resetMultiClipJob(job.job_id);
      captionGeneratedRef.current = false;
      setCaption('');
      setJob((prev) =>
        prev ? { ...prev, status: 'awaiting_order', output_url: null, render_id: null, completed_at: null } : prev
      );
    } catch {
      /* keep current state */
    } finally {
      setReStitching(false);
    }
  };

  // ── Crop position nudge ─────────────────────────────────────────────────────

  const handlePositionChange = async (clipId: string, position: 'left' | 'center' | 'right') => {
    if (!job) return;
    // Optimistic update
    setJob((prev) =>
      prev
        ? { ...prev, clips: prev.clips.map((c) => (c.clip_id === clipId ? { ...c, subject_position: position } : c)) }
        : prev
    );
    try {
      await SocialMediaAgentService.updateClipPosition(job.job_id, clipId, position);
    } catch {
      // revert on failure
      setJob((prev) =>
        prev
          ? {
              ...prev,
              clips: prev.clips.map((c) => (c.clip_id === clipId ? { ...c, subject_position: c.subject_position } : c)),
            }
          : prev
      );
    }
  };

  // ── Reset ───────────────────────────────────────────────────────────────────

  const handleReset = () => {
    setAiDecisions(null);
    setAnalyzingDecisions(false);
    decisionsRequestedRef.current = false;
    if (pollRef.current) clearInterval(pollRef.current);
    clearSession();
    setJob(null);
    setJobError('');
    setSelectedFiles([]);
    setOrderedClipIds([]);
    setCaption('');
    setStitching(false);
    captionGeneratedRef.current = false;
    setScriptDescription('');
    setScriptDraft('');
    setScriptLines([]);
    setScriptDrafting(false);
    setScriptApproving(false);
  };

  // ── Derived ─────────────────────────────────────────────────────────────────

  const clipById = (id: string) => job?.clips.find((c) => c.clip_id === id);
  const activeClips = orderedClipIds.map((id) => clipById(id)).filter(Boolean) as MultiClipClip[];
  const droppedCount = job?.clips.filter((c) => c.dropped).length ?? 0;
  const activeCount = (job?.clips.length ?? 0) - droppedCount;

  // ── Render ──────────────────────────────────────────────────────────────────

  const sectionStyle: React.CSSProperties = {
    border: `1.5px solid ${BORDER}`,
    borderRadius: 14,
    padding: '20px 20px',
    marginBottom: 16,
    background: '#fff',
  };

  // Step 1 — Upload form (shown when no job)
  if (!job) {
    return (
      <div style={{ maxWidth: 680, margin: '0 auto', padding: '8px 0 40px' }}>
        <h2 style={{ fontSize: 20, fontWeight: 800, color: DARK, margin: '0 0 4px' }}>Multi-Clip Compose</h2>
        <p style={{ fontSize: 13.5, color: GREY, margin: '0 0 24px' }}>
          Upload 2–10 video clips. Jane will transcribe each, suggest the best order, then stitch them into one video.
        </p>

        {/* Story type */}
        <div style={sectionStyle}>
          <p
            style={{
              fontSize: 12,
              fontWeight: 700,
              color: GREY,
              margin: '0 0 10px',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
            }}
          >
            Story Type
          </p>
          <div style={{ display: 'flex', gap: 10 }}>
            {STORY_TYPES.map((s) => {
              const active = storyType === s.value;
              return (
                <button
                  key={s.value}
                  onClick={() => setStoryType(s.value as typeof storyType)}
                  style={{
                    flex: 1,
                    padding: '10px 8px',
                    borderRadius: 10,
                    border: `1.5px solid ${active ? PRIMARY : BORDER}`,
                    background: active ? '#FFF0F8' : '#fff',
                    color: active ? PRIMARY : DARK,
                    fontWeight: active ? 700 : 500,
                    fontSize: 13,
                    cursor: 'pointer',
                    fontFamily: 'inherit',
                    textAlign: 'center',
                  }}
                >
                  <div style={{ fontWeight: 700 }}>{s.label}</div>
                  <div style={{ fontSize: 11, color: GREY, marginTop: 2 }}>{s.sub}</div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Orientation */}
        <div style={sectionStyle}>
          <p
            style={{
              fontSize: 12,
              fontWeight: 700,
              color: GREY,
              margin: '0 0 10px',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
            }}
          >
            Orientation
          </p>
          <div style={{ display: 'flex', gap: 10 }}>
            {ORIENTATIONS.map((o) => {
              const active = orientation === o.value;
              return (
                <button
                  key={o.value}
                  onClick={() => setOrientation(o.value as typeof orientation)}
                  style={{
                    flex: 1,
                    padding: '10px 8px',
                    borderRadius: 10,
                    border: `1.5px solid ${active ? PRIMARY : BORDER}`,
                    background: active ? '#FFF0F8' : '#fff',
                    color: active ? PRIMARY : DARK,
                    fontWeight: active ? 700 : 500,
                    fontSize: 13,
                    cursor: 'pointer',
                    fontFamily: 'inherit',
                    textAlign: 'center',
                  }}
                >
                  <div style={{ fontWeight: 700 }}>{o.label}</div>
                  <div style={{ fontSize: 11, color: GREY, marginTop: 2 }}>{o.sub}</div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Target length */}
        <div style={sectionStyle}>
          <p
            style={{
              fontSize: 12,
              fontWeight: 700,
              color: GREY,
              margin: '0 0 10px',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
            }}
          >
            Target Length
          </p>
          <div style={{ display: 'flex', gap: 10 }}>
            {DURATIONS.map((d) => {
              const active = targetDuration === d.value;
              return (
                <button
                  key={d.value}
                  onClick={() => setTargetDuration(d.value)}
                  style={{
                    flex: 1,
                    padding: '10px 8px',
                    borderRadius: 10,
                    border: `1.5px solid ${active ? PRIMARY : BORDER}`,
                    background: active ? '#FFF0F8' : '#fff',
                    color: active ? PRIMARY : DARK,
                    fontWeight: active ? 700 : 500,
                    fontSize: 13,
                    cursor: 'pointer',
                    fontFamily: 'inherit',
                    textAlign: 'center',
                  }}
                >
                  <div style={{ fontWeight: 700 }}>{d.label}</div>
                  <div style={{ fontSize: 11, color: GREY, marginTop: 2 }}>{d.sub}</div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Music toggle */}
        <div style={{ ...sectionStyle }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: enableMusic ? 12 : 0,
            }}
          >
            <div>
              <p style={{ margin: 0, fontSize: 13.5, fontWeight: 700, color: DARK }}>Background Music</p>
              <p style={{ margin: '2px 0 0', fontSize: 12, color: GREY }}>Soft music under your video</p>
            </div>
            <button
              onClick={() => setEnableMusic((v) => !v)}
              style={{
                width: 44,
                height: 24,
                borderRadius: 12,
                border: 'none',
                background: enableMusic ? PRIMARY : '#D1D5DB',
                cursor: 'pointer',
                position: 'relative',
                transition: 'background 0.2s',
                flexShrink: 0,
              }}
            >
              <span
                style={{
                  position: 'absolute',
                  top: 2,
                  left: enableMusic ? 22 : 2,
                  width: 20,
                  height: 20,
                  borderRadius: '50%',
                  background: '#fff',
                  transition: 'left 0.2s',
                  boxShadow: '0 1px 4px rgba(0,0,0,0.2)',
                }}
              />
            </button>
          </div>
          {enableMusic && (
            <div style={{ display: 'flex', gap: 6 }}>
              {(
                [
                  { label: 'Quiet', vol: 0.06 },
                  { label: 'Medium', vol: 0.12 },
                  { label: 'Loud', vol: 0.25 },
                ] as const
              ).map(({ label, vol }) => (
                <button
                  key={label}
                  onClick={() => setMusicVolume(vol)}
                  style={{
                    flex: 1,
                    padding: '6px 4px',
                    borderRadius: 8,
                    border: `1.5px solid ${musicVolume === vol ? PRIMARY : BORDER}`,
                    background: musicVolume === vol ? '#FFF0F8' : '#fff',
                    color: musicVolume === vol ? PRIMARY : GREY,
                    fontSize: 12,
                    fontWeight: musicVolume === vol ? 700 : 500,
                    cursor: 'pointer',
                    fontFamily: 'inherit',
                  }}
                >
                  {label}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Upload zone */}
        <div style={sectionStyle}>
          <p
            style={{
              fontSize: 12,
              fontWeight: 700,
              color: GREY,
              margin: '0 0 10px',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
            }}
          >
            Clips ({selectedFiles.length}/10)
          </p>

          <div
            onDragOver={(e) => {
              e.preventDefault();
              setDragging(true);
            }}
            onDragLeave={() => setDragging(false)}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            style={{
              border: `2px dashed ${dragging ? PRIMARY : BORDER}`,
              borderRadius: 12,
              padding: '28px 20px',
              textAlign: 'center',
              cursor: 'pointer',
              background: dragging ? '#FFF0F8' : LIGHT,
              transition: 'all 0.15s',
              marginBottom: selectedFiles.length > 0 ? 14 : 0,
            }}
          >
            <p style={{ margin: 0, fontSize: 14, fontWeight: 700, color: dragging ? PRIMARY : DARK }}>
              Drop video clips here
            </p>
            <p style={{ margin: '4px 0 0', fontSize: 12.5, color: GREY }}>
              or click to browse · up to 10 clips · 500MB each
            </p>
            <input
              ref={fileInputRef}
              type="file"
              accept="video/*,image/*"
              multiple
              style={{ display: 'none' }}
              onChange={(e) => addFiles(e.target.files)}
            />
          </div>

          {/* File list */}
          {selectedFiles.length > 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {selectedFiles.map((f, i) => (
                <div
                  key={i}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10,
                    padding: '8px 12px',
                    borderRadius: 8,
                    background: LIGHT,
                    border: `1px solid ${BORDER}`,
                  }}
                >
                  <span style={{ fontSize: 18 }}>🎬</span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p
                      style={{
                        margin: 0,
                        fontSize: 12.5,
                        fontWeight: 600,
                        color: DARK,
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {f.name}
                    </p>
                    <p style={{ margin: 0, fontSize: 11, color: GREY }}>{(f.size / 1024 / 1024).toFixed(1)} MB</p>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      removeFile(i);
                    }}
                    style={{
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      color: GREY,
                      fontSize: 16,
                      padding: 4,
                    }}
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {jobError && <p style={{ fontSize: 13, color: '#EF4444', margin: '0 0 12px' }}>{jobError}</p>}

        {submitting ? (
          <div
            style={{
              background: LIGHT,
              border: `1.5px solid ${BORDER}`,
              borderRadius: 12,
              padding: '18px 20px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
              <p style={{ margin: 0, fontSize: 13.5, fontWeight: 700, color: DARK }}>
                {uploadPct < 100 ? 'Uploading clips…' : 'Processing on server…'}
              </p>
              {uploadPct < 100 && <span style={{ fontSize: 12, fontWeight: 700, color: PRIMARY }}>{uploadPct}%</span>}
            </div>
            <ProgressBar value={uploadPct < 100 ? uploadPct : 100} />
            <p style={{ margin: '8px 0 0', fontSize: 12, color: GREY }}>
              {uploadPct < 100
                ? `Sending ${selectedFiles.length} file${selectedFiles.length !== 1 ? 's' : ''} — stay on this page`
                : 'Files received — analysing audio, detecting subjects…'}
            </p>
          </div>
        ) : (
          <button
            onClick={handleStart}
            disabled={selectedFiles.length < 1}
            style={{
              width: '100%',
              padding: '13px 0',
              borderRadius: 12,
              background: selectedFiles.length < 1 ? '#E5E7EB' : PRIMARY,
              color: selectedFiles.length < 1 ? '#9CA3AF' : '#fff',
              border: 'none',
              fontSize: 14.5,
              fontWeight: 800,
              cursor: selectedFiles.length < 1 ? 'not-allowed' : 'pointer',
              fontFamily: 'inherit',
            }}
          >
            {`Analyse ${selectedFiles.length} Clip${selectedFiles.length !== 1 ? 's' : ''}`}
          </button>
        )}
      </div>
    );
  }

  // Step 2 — Analysing
  if (job.status === 'analyzing') {
    return (
      <div style={{ maxWidth: 680, margin: '0 auto', padding: '8px 0 40px' }}>
        <JobHeader job={job} onReset={handleReset} />
        <div style={sectionStyle}>
          <p style={{ margin: '0 0 12px', fontSize: 14, fontWeight: 700, color: DARK }}>Analysing your clips…</p>
          <ProgressBar value={job.progress} />
          <p style={{ margin: '8px 0 0', fontSize: 12.5, color: GREY }}>{job.status_message}</p>
        </div>
      </div>
    );
  }

  // Shared budget banner (shown in both awaiting_script and awaiting_order)
  const BudgetBanner =
    job.length_budget_info && job.length_budget_info.recommendation !== 'ok' ? (
      <div
        style={{
          background: job.length_budget_info.recommendation === 'short' ? '#EFF6FF' : '#FFF7ED',
          border: `1.5px solid ${job.length_budget_info.recommendation === 'short' ? '#93C5FD' : '#F97316'}`,
          borderRadius: 10,
          padding: '10px 14px',
          marginBottom: 16,
          display: 'flex',
          gap: 10,
          alignItems: 'flex-start',
        }}
      >
        <span style={{ fontSize: 17, lineHeight: 1.3 }}>
          {job.length_budget_info.recommendation === 'short' ? 'ℹ️' : '✂️'}
        </span>
        <p
          style={{
            margin: 0,
            fontSize: 13,
            color: job.length_budget_info.recommendation === 'short' ? '#1E40AF' : '#7C2D12',
            lineHeight: 1.5,
          }}
        >
          {job.length_budget_info.message}
        </p>
      </div>
    ) : null;

  // Step 2b — Script editor (Product Story awaiting_script)
  if (job.status === 'awaiting_script') {
    const displayDraft = scriptDraft || job.script_draft || '';
    const canDraft = scriptDescription.trim().length > 0;
    const canApprove = displayDraft.trim().length > 0;
    return (
      <div style={{ maxWidth: 680, margin: '0 auto', padding: '8px 0 40px' }}>
        <JobHeader job={job} onReset={handleReset} />

        {job.mismatch_info && (
          <div
            style={{
              background: '#FFF7ED',
              border: '1.5px solid #F97316',
              borderRadius: 10,
              padding: '10px 14px',
              marginBottom: 16,
              display: 'flex',
              gap: 10,
              alignItems: 'flex-start',
            }}
          >
            <span style={{ fontSize: 18, lineHeight: 1.2 }}>⚠️</span>
            <p style={{ margin: 0, fontSize: 13, color: '#7C2D12', lineHeight: 1.5 }}>{job.mismatch_info.message}</p>
          </div>
        )}

        {BudgetBanner}

        <div style={sectionStyle}>
          <p style={{ margin: '0 0 4px', fontSize: 14, fontWeight: 800, color: DARK }}>Write your script</p>
          <p style={{ margin: '0 0 14px', fontSize: 13, color: GREY }}>
            {job.clips.length} clip{job.clips.length !== 1 ? 's' : ''} ready. Describe what this video is about — Jane
            will draft a script that becomes the on-screen captions.
          </p>
          <textarea
            value={scriptDescription}
            onChange={(e) => setScriptDescription(e.target.value)}
            placeholder="e.g. new Ankara collection, ₦15k, available now — for modern Nigerian women"
            rows={3}
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
              marginBottom: 12,
            }}
          />
          <button
            onClick={handleDraftScript}
            disabled={scriptDrafting || !canDraft}
            style={{
              width: '100%',
              padding: '11px 0',
              borderRadius: 10,
              background: scriptDrafting || !canDraft ? '#E5E7EB' : PRIMARY,
              color: scriptDrafting || !canDraft ? '#9CA3AF' : '#fff',
              border: 'none',
              fontSize: 13.5,
              fontWeight: 700,
              cursor: scriptDrafting || !canDraft ? 'not-allowed' : 'pointer',
              fontFamily: 'inherit',
            }}
          >
            {scriptDrafting ? 'Drafting…' : 'Draft script with AI'}
          </button>
        </div>

        {displayDraft && (
          <div style={sectionStyle}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
              <p style={{ margin: 0, fontSize: 13.5, fontWeight: 700, color: DARK }}>Script</p>
              <button
                onClick={handleDraftScript}
                disabled={scriptDrafting || !canDraft}
                style={{
                  padding: '4px 12px',
                  borderRadius: 7,
                  border: `1.5px solid ${GREY}`,
                  background: 'transparent',
                  color: GREY,
                  fontSize: 12,
                  fontWeight: 600,
                  cursor: scriptDrafting || !canDraft ? 'not-allowed' : 'pointer',
                  fontFamily: 'inherit',
                  opacity: scriptDrafting || !canDraft ? 0.5 : 1,
                }}
              >
                {scriptDrafting ? 'Redrafting…' : 'Redraft'}
              </button>
            </div>
            <p style={{ margin: '0 0 8px', fontSize: 12, color: GREY }}>
              Edit freely — each line becomes a caption for one clip.
            </p>
            <textarea
              value={displayDraft}
              onChange={(e) => {
                setScriptDraft(e.target.value);
                setScriptLines(e.target.value.split('\n').filter((l) => l.trim()));
              }}
              rows={Math.max(4, displayDraft.split('\n').length + 1)}
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
                marginBottom: 12,
              }}
            />
            <button
              onClick={handleApproveScript}
              disabled={scriptApproving || !canApprove}
              style={{
                width: '100%',
                padding: '11px 0',
                borderRadius: 10,
                background: scriptApproving || !canApprove ? '#E5E7EB' : PRIMARY,
                color: scriptApproving || !canApprove ? '#9CA3AF' : '#fff',
                border: 'none',
                fontSize: 13.5,
                fontWeight: 700,
                cursor: scriptApproving || !canApprove ? 'not-allowed' : 'pointer',
                fontFamily: 'inherit',
              }}
            >
              {scriptApproving ? 'Applying…' : 'Approve script →'}
            </button>
          </div>
        )}
      </div>
    );
  }

  // Step 3 — Review & reorder (awaiting_order)
  if (job.status === 'awaiting_order') {
    return (
      <div style={{ maxWidth: 680, margin: '0 auto', padding: '8px 0 40px' }}>
        <JobHeader job={job} onReset={handleReset} />

        {/* Mismatch / info banner */}
        {job.mismatch_info ? (
          <div
            style={{
              background: '#FFF7ED',
              border: '1.5px solid #F97316',
              borderRadius: 10,
              padding: '10px 14px',
              marginBottom: 16,
              display: 'flex',
              gap: 10,
              alignItems: 'flex-start',
            }}
          >
            <span style={{ fontSize: 18, lineHeight: 1.2 }}>⚠️</span>
            <p style={{ margin: 0, fontSize: 13, color: '#7C2D12', lineHeight: 1.5 }}>{job.mismatch_info.message}</p>
          </div>
        ) : (
          job.clips.some((c) => c.clip_type === 'silent') &&
          job.clips.some((c) => c.clip_type === 'speech') && (
            <div
              style={{
                background: '#EFF6FF',
                border: '1.5px solid #BFDBFE',
                borderRadius: 12,
                padding: '12px 16px',
                marginBottom: 14,
                fontSize: 13,
                color: '#1E40AF',
              }}
            >
              Some clips have no speech detected — they&apos;ll be included as visual context between talking clips.
            </div>
          )
        )}

        {BudgetBanner}

        <div style={{ ...sectionStyle }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
            <div>
              <p style={{ margin: 0, fontSize: 14, fontWeight: 800, color: DARK }}>Review Clips</p>
              <p style={{ margin: '2px 0 0', fontSize: 12, color: GREY }}>
                {activeCount} clip{activeCount !== 1 ? 's' : ''} · drag ↑↓ to reorder · AI suggested order shown
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {activeClips
              .filter((c) => !c.dropped)
              .map((clip, visibleRank) => {
                const trueIdx = orderedClipIds.indexOf(clip.clip_id);
                return (
                  <ClipCard
                    key={clip.clip_id}
                    clip={clip}
                    rank={visibleRank}
                    total={activeClips.filter((c) => !c.dropped).length}
                    storyType={job.story_type}
                    onMoveUp={() => moveClip(trueIdx, trueIdx - 1)}
                    onMoveDown={() => moveClip(trueIdx, trueIdx + 1)}
                    onDrop={(dropped) => handleDrop2(clip.clip_id, dropped)}
                    onPositionChange={(pos) => handlePositionChange(clip.clip_id, pos)}
                  />
                );
              })}
          </div>

          {/* Dropped clips (collapsed) */}
          {droppedCount > 0 && (
            <div style={{ marginTop: 14 }}>
              <p style={{ fontSize: 12, fontWeight: 600, color: GREY, margin: '0 0 8px' }}>Dropped ({droppedCount})</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {job.clips
                  .filter((c) => c.dropped)
                  .map((clip, i) => (
                    <ClipCard
                      key={clip.clip_id}
                      clip={clip}
                      rank={i}
                      total={droppedCount}
                      storyType={job.story_type}
                      onMoveUp={() => {}}
                      onMoveDown={() => {}}
                      onDrop={(dropped) => handleDrop2(clip.clip_id, dropped)}
                    />
                  ))}
              </div>
            </div>
          )}
        </div>

        {jobError && <p style={{ fontSize: 13, color: '#EF4444', margin: '0 0 12px' }}>{jobError}</p>}

        <button
          onClick={handleStitch}
          disabled={stitching || activeCount === 0}
          style={{
            width: '100%',
            padding: '13px 0',
            borderRadius: 12,
            background: stitching || activeCount === 0 ? '#E5E7EB' : PRIMARY,
            color: stitching || activeCount === 0 ? '#9CA3AF' : '#fff',
            border: 'none',
            fontSize: 14.5,
            fontWeight: 800,
            cursor: stitching || activeCount === 0 ? 'not-allowed' : 'pointer',
            fontFamily: 'inherit',
          }}
        >
          {stitching ? 'Starting render…' : `Stitch ${activeCount} Clip${activeCount !== 1 ? 's' : ''}`}
        </button>
      </div>
    );
  }

  // Step 4 — Stitching / rendering
  if (job.status === 'stitching') {
    return (
      <div style={{ maxWidth: 680, margin: '0 auto', padding: '8px 0 40px' }}>
        <JobHeader job={job} onReset={handleReset} />
        <div style={sectionStyle}>
          <p style={{ margin: '0 0 12px', fontSize: 14, fontWeight: 700, color: DARK }}>Stitching your video…</p>
          <ProgressBar value={job.progress} />
          <p style={{ margin: '8px 0 0', fontSize: 12.5, color: GREY }}>{job.status_message}</p>
        </div>
      </div>
    );
  }

  // Step 5 — Done
  if (job.status === 'ready' && job.output_url) {
    return (
      <div style={{ maxWidth: 680, margin: '0 auto', padding: '8px 0 40px' }}>
        <JobHeader job={job} onReset={handleReset} />

        {/* Video preview */}
        <div style={sectionStyle}>
          <p style={{ margin: '0 0 12px', fontSize: 14, fontWeight: 800, color: DARK }}>Your composed video</p>
          <video
            src={job.output_url}
            controls
            style={{ width: '100%', borderRadius: 10, background: '#000', maxHeight: 480 }}
          />
          <a
            href={job.output_url}
            download
            style={{
              display: 'block',
              marginTop: 10,
              fontSize: 12.5,
              color: PRIMARY,
              fontWeight: 600,
              textDecoration: 'none',
            }}
          >
            Download video
          </a>
        </div>

        {/* Caption */}
        <div style={sectionStyle}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
            <p style={{ margin: 0, fontSize: 13.5, fontWeight: 700, color: DARK }}>Caption</p>
            <button
              onClick={() => {
                captionGeneratedRef.current = true;
                generateCaption(job, captionPlatform);
              }}
              disabled={captionGenerating}
              style={{
                padding: '5px 12px',
                borderRadius: 7,
                border: `1.5px solid ${PRIMARY}`,
                background: 'transparent',
                color: PRIMARY,
                fontSize: 12,
                fontWeight: 600,
                cursor: captionGenerating ? 'not-allowed' : 'pointer',
                fontFamily: 'inherit',
                opacity: captionGenerating ? 0.6 : 1,
              }}
            >
              {captionGenerating ? 'Generating…' : 'Regenerate'}
            </button>
          </div>
          <div style={{ display: 'flex', gap: 6, marginBottom: 10 }}>
            {(['instagram', 'facebook', 'tiktok', 'linkedin'] as const).map((p) => (
              <button
                key={p}
                onClick={() => setCaptionPlatform(p)}
                style={{
                  flex: 1,
                  padding: '6px 4px',
                  borderRadius: 8,
                  border: `1.5px solid ${captionPlatform === p ? PRIMARY : BORDER}`,
                  background: captionPlatform === p ? '#FFF0F8' : '#fff',
                  color: captionPlatform === p ? PRIMARY : GREY,
                  fontSize: 11.5,
                  fontWeight: captionPlatform === p ? 700 : 500,
                  cursor: 'pointer',
                  fontFamily: 'inherit',
                  textTransform: 'capitalize',
                }}
              >
                {p}
              </button>
            ))}
          </div>
          <textarea
            value={captionGenerating ? '' : caption}
            onChange={(e) => setCaption(e.target.value)}
            placeholder={captionGenerating ? 'Generating caption…' : 'Write a caption for this video…'}
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
              background: captionGenerating ? LIGHT : '#fff',
            }}
          />
        </div>

        {/* Voiceover guide — Product Story only */}
        {job.story_type === 'product' && job.script_lines && job.script_lines.length > 0 && (
          <div style={{ ...sectionStyle, background: '#F0FDF4', borderColor: '#86EFAC' }}>
            <p style={{ margin: '0 0 8px', fontSize: 13.5, fontWeight: 700, color: '#14532D' }}>
              Record your voiceover
            </p>
            <p style={{ margin: '0 0 12px', fontSize: 12.5, color: '#166534', lineHeight: 1.5 }}>
              Read this script aloud while recording on your phone — it matches the captions exactly.
            </p>
            <ol style={{ margin: 0, paddingLeft: 18, display: 'flex', flexDirection: 'column', gap: 6 }}>
              {job.script_lines.map((line, i) => (
                <li key={i} style={{ fontSize: 13, color: '#14532D', lineHeight: 1.5 }}>
                  {line}
                </li>
              ))}
            </ol>
          </div>
        )}

        {/* AI editing decisions */}
        <div style={{ ...sectionStyle, background: '#F5F3FF', borderColor: '#C4B5FD' }}>
          <p style={{ margin: '0 0 4px', fontSize: 14, fontWeight: 800, color: '#4C1D95' }}>AI Editing Decisions</p>
          {analyzingDecisions ? (
            <p style={{ margin: '8px 0 0', fontSize: 13, color: '#6D28D9' }}>
              Analysing your clips for cuts, zooms &amp; transitions…
            </p>
          ) : aiDecisions ? (
            <>
              {aiDecisions.summary && (
                <p style={{ margin: '4px 0 12px', fontSize: 12.5, color: '#5B21B6', fontStyle: 'italic' }}>
                  {aiDecisions.summary}
                </p>
              )}

              {/* Transition style */}
              <div style={{ marginBottom: 12 }}>
                <p
                  style={{
                    margin: '0 0 4px',
                    fontSize: 11.5,
                    fontWeight: 700,
                    color: '#7C3AED',
                    textTransform: 'uppercase',
                    letterSpacing: '0.04em',
                  }}
                >
                  Transition Style
                </p>
                <span
                  style={{
                    display: 'inline-block',
                    padding: '3px 12px',
                    borderRadius: 20,
                    background: '#EDE9FE',
                    color: '#6D28D9',
                    fontSize: 12.5,
                    fontWeight: 700,
                    textTransform: 'capitalize',
                  }}
                >
                  {aiDecisions.transition_style}
                </span>
              </div>

              {/* Cuts */}
              {aiDecisions.cuts.length > 0 && (
                <div style={{ marginBottom: 12 }}>
                  <p
                    style={{
                      margin: '0 0 6px',
                      fontSize: 11.5,
                      fontWeight: 700,
                      color: '#7C3AED',
                      textTransform: 'uppercase',
                      letterSpacing: '0.04em',
                    }}
                  >
                    Suggested Cuts ({aiDecisions.cuts.length})
                  </p>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                    {aiDecisions.cuts.map((c, i) => (
                      <div
                        key={i}
                        style={{ display: 'flex', gap: 8, alignItems: 'flex-start', fontSize: 12.5, color: '#4C1D95' }}
                      >
                        <span style={{ fontWeight: 700, flexShrink: 0, color: '#7C3AED' }}>
                          {c.at.toFixed(1)}s–{c.end.toFixed(1)}s
                        </span>
                        <span style={{ color: '#5B21B6' }}>{c.reason}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Zooms */}
              {aiDecisions.zooms.length > 0 && (
                <div>
                  <p
                    style={{
                      margin: '0 0 6px',
                      fontSize: 11.5,
                      fontWeight: 700,
                      color: '#7C3AED',
                      textTransform: 'uppercase',
                      letterSpacing: '0.04em',
                    }}
                  >
                    Zoom Moments ({aiDecisions.zooms.length})
                  </p>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                    {aiDecisions.zooms.map((z, i) => (
                      <div
                        key={i}
                        style={{ display: 'flex', gap: 8, alignItems: 'flex-start', fontSize: 12.5, color: '#4C1D95' }}
                      >
                        <span style={{ fontWeight: 700, flexShrink: 0, color: '#7C3AED' }}>
                          {z.at.toFixed(1)}s ({z.duration.toFixed(1)}s)
                        </span>
                        <span style={{ color: '#5B21B6' }}>{z.reason}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          ) : (
            <p style={{ margin: '8px 0 0', fontSize: 13, color: '#7C3AED' }}>
              AI analysis unavailable — you can still continue to production.
            </p>
          )}
        </div>

        {/* Continue to Produce My Video */}
        <button
          onClick={() => onSendToProduce?.(job.output_url!)}
          style={{
            width: '100%',
            padding: '14px 0',
            borderRadius: 12,
            background: 'linear-gradient(135deg, #7C3AED 0%, #CD1B78 100%)',
            color: '#fff',
            border: 'none',
            fontSize: 15,
            fontWeight: 800,
            cursor: 'pointer',
            fontFamily: 'inherit',
            marginBottom: 12,
            boxShadow: '0 4px 16px rgba(124,58,237,0.3)',
          }}
        >
          ⚡ Continue to Produce My Video
        </button>

        <div style={{ display: 'flex', gap: 10 }}>
          <button
            onClick={handleReStitch}
            disabled={reStitching}
            style={{
              flex: 1,
              padding: '12px 0',
              borderRadius: 12,
              background: LIGHT,
              color: DARK,
              border: `1.5px solid ${BORDER}`,
              fontSize: 13.5,
              fontWeight: 700,
              cursor: reStitching ? 'not-allowed' : 'pointer',
              fontFamily: 'inherit',
              opacity: reStitching ? 0.6 : 1,
            }}
          >
            {reStitching ? 'Resetting…' : 'Edit & Re-stitch'}
          </button>
          <button
            onClick={handleReset}
            style={{
              flex: 1,
              padding: '12px 0',
              borderRadius: 12,
              background: LIGHT,
              color: GREY,
              border: `1.5px solid ${BORDER}`,
              fontSize: 13.5,
              fontWeight: 600,
              cursor: 'pointer',
              fontFamily: 'inherit',
            }}
          >
            New composition
          </button>
        </div>
      </div>
    );
  }

  // Failed state
  return (
    <div style={{ maxWidth: 680, margin: '0 auto', padding: '8px 0 40px' }}>
      <JobHeader job={job} onReset={handleReset} />
      <div style={{ ...sectionStyle, borderColor: '#FCA5A5', background: '#FFF5F5' }}>
        <p style={{ margin: 0, fontSize: 14, fontWeight: 700, color: '#DC2626' }}>Something went wrong</p>
        <p style={{ margin: '6px 0 14px', fontSize: 13, color: '#7F1D1D' }}>{job.status_message}</p>
        <button
          onClick={handleReset}
          style={{
            padding: '9px 20px',
            borderRadius: 8,
            background: PRIMARY,
            color: '#fff',
            border: 'none',
            fontSize: 13,
            fontWeight: 700,
            cursor: 'pointer',
            fontFamily: 'inherit',
          }}
        >
          Try again
        </button>
      </div>
    </div>
  );
}

// ── Shared job header ─────────────────────────────────────────────────────────

function JobHeader({ job, onReset }: { job: MultiClipJob; onReset: () => void }) {
  const statusColor: Record<string, string> = {
    analyzing: '#D97706',
    awaiting_order: '#2563EB',
    stitching: '#7C3AED',
    ready: '#16a34a',
    failed: '#DC2626',
  };
  const statusLabel: Record<string, string> = {
    analyzing: 'Analysing',
    awaiting_order: 'Ready to review',
    stitching: 'Rendering',
    ready: 'Done',
    failed: 'Failed',
  };

  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
      <div>
        <h2 style={{ fontSize: 20, fontWeight: 800, color: DARK, margin: 0 }}>Multi-Clip Compose</h2>
        <span
          style={{
            display: 'inline-block',
            marginTop: 4,
            padding: '2px 10px',
            borderRadius: 8,
            background: `${statusColor[job.status]}22`,
            color: statusColor[job.status],
            fontSize: 12,
            fontWeight: 700,
          }}
        >
          {statusLabel[job.status] || job.status}
        </span>
      </div>
      {(job.status === 'awaiting_order' || job.status === 'ready' || job.status === 'failed') && (
        <button
          onClick={onReset}
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
          New composition
        </button>
      )}
    </div>
  );
}
