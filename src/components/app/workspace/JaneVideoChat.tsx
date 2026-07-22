'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { SocialMediaAgentService } from '@/src/api/SocialMediaAgentService';
import { ToastService } from '@/src/utils/toast.util';
import { ToastTypeEnum } from '@/src/models/enum-models/ToastTypeEnum';

// ── Types ─────────────────────────────────────────────────────────────────────

type Stage =
  | 'upload'
  | 'stitch'
  | 'classify'
  | 'intent'
  | 'plan'
  | 'render'
  | 'preview'
  | 'cleanup'
  | 'caption_edit'
  | 'broll_edit'
  | 'publish';

type BrollMode = 'auto' | 'custom' | 'none';
type BrollConvStep = 'choose' | 'upload' | 'place' | 'confirm';
type BrollClipTag = 'product' | 'lifestyle' | 'talking' | 'other';

interface BrollClipEntry {
  file: File;
  tag: BrollClipTag;
  previewUrl: string;
}

interface BrollPlacement {
  clipIndex: number;
  startTime: number;
  duration: number;
  segmentText: string;
}
type CaptionWord = { id: string; text: string; start_time: number; end_time: number };
type Classification = 'talking_head' | 'product' | 'mixed';
type Purpose = 'sell' | 'teach' | 'announce' | 'general';
type AdjustField = 'style' | 'captions' | 'trim' | 'broll' | 'music' | 'length' | 'format';

interface StyleTemplate {
  id: string;
  name: string;
  tagline: string;
  bg: string;
  accent: string;
}

interface VideoPlan {
  classification: Classification;
  purpose: Purpose;
  style: StyleTemplate;
  captionsEnabled: boolean;
  captionStyle: 'bold' | 'minimal' | 'animated';
  removeSilence: boolean;
  removeFiller: boolean;
  brollEnabled: boolean;
  brollDensity: 'light' | 'moderate' | 'heavy';
  musicEnabled: boolean;
  musicType: 'upbeat' | 'calm' | 'dramatic';
  targetLength: 'auto' | '15s' | '30s' | '60s';
  aspectRatio: '9:16' | '16:9' | '1:1';
}

interface HistMsg {
  id: string;
  role: 'jane' | 'user';
  text: string;
}

interface Props {
  onSaveToDrafts?: () => void;
}

// ── Style templates ───────────────────────────────────────────────────────────

const STYLE_TEMPLATES: StyleTemplate[] = [
  {
    id: 'fast_founder',
    name: 'Fast Founder',
    tagline: 'Punchy cuts · bold text · founder energy',
    bg: 'linear-gradient(135deg, #1A1A2E 0%, #E94560 100%)',
    accent: '#E94560',
  },
  {
    id: 'product_showcase',
    name: 'Product Showcase',
    tagline: 'Clean · product-forward · value first',
    bg: 'linear-gradient(135deg, #0F3460 0%, #533483 100%)',
    accent: '#7C5CBF',
  },
  {
    id: 'customer_story',
    name: 'Customer Story',
    tagline: 'Warm · authentic · trust-building',
    bg: 'linear-gradient(135deg, #2C3E50 0%, #E67E22 100%)',
    accent: '#E67E22',
  },
  {
    id: 'tiktok_energy',
    name: 'TikTok Energy',
    tagline: 'Native feel · viral pacing · kinetic',
    bg: 'linear-gradient(135deg, #010101 0%, #69C9D0 100%)',
    accent: '#69C9D0',
  },
];

function defaultPlan(c: Classification, p: Purpose): VideoPlan {
  const styleMap: Record<Purpose, StyleTemplate> = {
    sell: STYLE_TEMPLATES[1],
    teach: STYLE_TEMPLATES[0],
    announce: STYLE_TEMPLATES[0],
    general: STYLE_TEMPLATES[0],
  };
  const isTalking = c !== 'product';
  return {
    classification: c,
    purpose: p,
    style: styleMap[p],
    captionsEnabled: isTalking,
    captionStyle: 'bold',
    removeSilence: isTalking,
    removeFiller: isTalking,
    brollEnabled: p === 'sell',
    brollDensity: 'light',
    musicEnabled: true,
    musicType: 'upbeat',
    targetLength: 'auto',
    aspectRatio: '9:16',
  };
}

// ── Tokens ────────────────────────────────────────────────────────────────────

const PINK = '#CD1B78';
const LIGHT_PINK = '#FFF0F7';
const GRAY = '#6B7280';
const BORDER = '#E5E7EB';

// ── Small atoms ───────────────────────────────────────────────────────────────

function JaneBubble({ text }: { text: string }) {
  return (
    <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start', marginBottom: 6 }}>
      <div
        style={{
          width: 28,
          height: 28,
          borderRadius: '50%',
          background: PINK,
          color: '#fff',
          fontSize: 11,
          fontWeight: 700,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
          marginTop: 2,
        }}
      >
        J
      </div>
      <div
        style={{
          background: LIGHT_PINK,
          border: `1.5px solid ${BORDER_PINK}`,
          borderRadius: '0 12px 12px 12px',
          padding: '10px 14px',
          fontSize: 14,
          color: '#111827',
          lineHeight: 1.5,
          maxWidth: 'calc(100% - 42px)',
        }}
      >
        {text}
      </div>
    </div>
  );
}

const BORDER_PINK = '#F9A8D4';

function UserBubble({ text }: { text: string }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 6 }}>
      <div
        style={{
          background: '#F3F4F6',
          borderRadius: '12px 0 12px 12px',
          padding: '10px 14px',
          fontSize: 14,
          color: '#374151',
          maxWidth: '70%',
        }}
      >
        {text}
      </div>
    </div>
  );
}

function TapBtn({
  label,
  onClick,
  primary = false,
  small = false,
}: {
  label: string;
  onClick: () => void;
  primary?: boolean;
  small?: boolean;
}) {
  const [hover, setHover] = useState(false);
  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        padding: small ? '6px 12px' : '9px 18px',
        borderRadius: 9,
        border: primary ? 'none' : `1.5px solid ${hover ? PINK : BORDER}`,
        background: primary ? (hover ? '#A01560' : PINK) : hover ? LIGHT_PINK : '#fff',
        color: primary ? '#fff' : hover ? PINK : '#374151',
        fontSize: small ? 12 : 13,
        fontWeight: 600,
        cursor: 'pointer',
        transition: 'all 0.12s',
        flexShrink: 0,
      }}
    >
      {label}
    </button>
  );
}

function SectionLabel({ text }: { text: string }) {
  return (
    <div
      style={{
        fontSize: 10,
        fontWeight: 700,
        letterSpacing: '0.08em',
        textTransform: 'uppercase',
        color: GRAY,
        marginBottom: 8,
        marginTop: 4,
      }}
    >
      {text}
    </div>
  );
}

// ── Plan card ─────────────────────────────────────────────────────────────────

function PlanRow({
  label,
  value,
  field,
  onAdjust,
  disabled = false,
}: {
  label: string;
  value: string;
  field: AdjustField;
  onAdjust: (f: AdjustField) => void;
  disabled?: boolean;
}) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        padding: '10px 0',
        borderBottom: `1px solid ${BORDER}`,
      }}
    >
      <span style={{ fontSize: 13, color: '#374151', flex: 1 }}>
        <span style={{ color: GRAY, fontSize: 12, marginRight: 6 }}>{label}</span>
        {value}
      </span>
      {!disabled && (
        <button
          onClick={() => onAdjust(field)}
          style={{
            background: 'none',
            border: 'none',
            color: PINK,
            fontSize: 12,
            fontWeight: 600,
            cursor: 'pointer',
            padding: '2px 4px',
            borderRadius: 4,
            flexShrink: 0,
          }}
        >
          change
        </button>
      )}
    </div>
  );
}

function StylePreviewThumb({ style }: { style: StyleTemplate }) {
  return (
    <div
      style={{
        width: 56,
        height: 80,
        borderRadius: 6,
        background: style.bg,
        display: 'flex',
        alignItems: 'flex-end',
        padding: 5,
        flexShrink: 0,
      }}
    >
      <div
        style={{
          width: '100%',
          height: 6,
          borderRadius: 3,
          background: style.accent,
          opacity: 0.85,
        }}
      />
    </div>
  );
}

// ── Adjust field pickers ──────────────────────────────────────────────────────

function AdjustPanel({
  field,
  plan,
  onApply,
  onCancel,
}: {
  field: AdjustField;
  plan: VideoPlan;
  onApply: (patch: Partial<VideoPlan>) => void;
  onCancel: () => void;
}) {
  const section = (title: string, children: React.ReactNode) => (
    <div>
      <SectionLabel text={title} />
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>{children}</div>
    </div>
  );

  const opt = (label: string, active: boolean, onClick: () => void, desc?: string) => (
    <button
      onClick={onClick}
      style={{
        padding: '8px 14px',
        borderRadius: 9,
        border: `1.5px solid ${active ? PINK : BORDER}`,
        background: active ? LIGHT_PINK : '#fff',
        color: active ? PINK : '#374151',
        fontSize: 13,
        fontWeight: active ? 600 : 400,
        cursor: 'pointer',
        textAlign: 'left',
      }}
    >
      <div style={{ fontWeight: 600 }}>{label}</div>
      {desc && <div style={{ fontSize: 11, color: GRAY, marginTop: 2 }}>{desc}</div>}
    </button>
  );

  const content = () => {
    switch (field) {
      case 'style':
        return section(
          'Choose a style',
          STYLE_TEMPLATES.map((s) => (
            <button
              key={s.id}
              onClick={() => onApply({ style: s })}
              style={{
                display: 'flex',
                gap: 10,
                padding: 10,
                borderRadius: 10,
                border: `1.5px solid ${plan.style.id === s.id ? PINK : BORDER}`,
                background: plan.style.id === s.id ? LIGHT_PINK : '#fff',
                cursor: 'pointer',
                textAlign: 'left',
                alignItems: 'center',
              }}
            >
              <StylePreviewThumb style={s} />
              <div>
                <div style={{ fontSize: 13, fontWeight: 700, color: '#111827' }}>{s.name}</div>
                <div style={{ fontSize: 11, color: GRAY, marginTop: 3 }}>{s.tagline}</div>
              </div>
            </button>
          ))
        );

      case 'captions':
        return section(
          'Captions',
          <>
            {opt('On · bold', plan.captionsEnabled && plan.captionStyle === 'bold', () =>
              onApply({ captionsEnabled: true, captionStyle: 'bold' })
            )}
            {opt('On · minimal', plan.captionsEnabled && plan.captionStyle === 'minimal', () =>
              onApply({ captionsEnabled: true, captionStyle: 'minimal' })
            )}
            {opt('On · animated', plan.captionsEnabled && plan.captionStyle === 'animated', () =>
              onApply({ captionsEnabled: true, captionStyle: 'animated' })
            )}
            {opt(
              'Off',
              !plan.captionsEnabled,
              () => onApply({ captionsEnabled: false }),
              plan.classification === 'product' ? 'No speech detected' : undefined
            )}
          </>
        );

      case 'trim':
        return section(
          'Trimming',
          <>
            {opt('Cut pauses and filler', plan.removeSilence && plan.removeFiller, () =>
              onApply({ removeSilence: true, removeFiller: true })
            )}
            {opt('Cut pauses only', plan.removeSilence && !plan.removeFiller, () =>
              onApply({ removeSilence: true, removeFiller: false })
            )}
            {opt('Cut filler words only', !plan.removeSilence && plan.removeFiller, () =>
              onApply({ removeSilence: false, removeFiller: true })
            )}
            {opt('No trimming', !plan.removeSilence && !plan.removeFiller, () =>
              onApply({ removeSilence: false, removeFiller: false })
            )}
          </>
        );

      case 'broll':
        if (plan.classification === 'product') {
          return (
            <div style={{ fontSize: 13, color: GRAY, padding: '8px 0' }}>
              B-roll isn&apos;t available for product clips without speech. Add a voiceover first to unlock
              transcript-driven b-roll.
            </div>
          );
        }
        return section(
          'B-roll',
          <>
            {opt('Light', plan.brollEnabled && plan.brollDensity === 'light', () =>
              onApply({ brollEnabled: true, brollDensity: 'light' })
            )}
            {opt('Moderate', plan.brollEnabled && plan.brollDensity === 'moderate', () =>
              onApply({ brollEnabled: true, brollDensity: 'moderate' })
            )}
            {opt('Heavy', plan.brollEnabled && plan.brollDensity === 'heavy', () =>
              onApply({ brollEnabled: true, brollDensity: 'heavy' })
            )}
            {opt('Off', !plan.brollEnabled, () => onApply({ brollEnabled: false }))}
          </>
        );

      case 'music':
        return section(
          'Music',
          <>
            {opt('Upbeat · under your voice', plan.musicEnabled && plan.musicType === 'upbeat', () =>
              onApply({ musicEnabled: true, musicType: 'upbeat' })
            )}
            {opt('Calm · under your voice', plan.musicEnabled && plan.musicType === 'calm', () =>
              onApply({ musicEnabled: true, musicType: 'calm' })
            )}
            {opt('Dramatic · under your voice', plan.musicEnabled && plan.musicType === 'dramatic', () =>
              onApply({ musicEnabled: true, musicType: 'dramatic' })
            )}
            {opt('No music', !plan.musicEnabled, () => onApply({ musicEnabled: false }))}
          </>
        );

      case 'length':
        return section(
          'Target length',
          <>
            {opt('Auto · no limit', plan.targetLength === 'auto', () => onApply({ targetLength: 'auto' }))}
            {opt('~15 seconds', plan.targetLength === '15s', () => onApply({ targetLength: '15s' }))}
            {opt('~30 seconds', plan.targetLength === '30s', () => onApply({ targetLength: '30s' }))}
            {opt('~60 seconds', plan.targetLength === '60s', () => onApply({ targetLength: '60s' }))}
          </>
        );

      case 'format':
        return section(
          'Format / aspect ratio',
          <>
            {opt('Vertical · 9:16', plan.aspectRatio === '9:16', () => onApply({ aspectRatio: '9:16' }))}
            {opt('Landscape · 16:9', plan.aspectRatio === '16:9', () => onApply({ aspectRatio: '16:9' }))}
            {opt('Square · 1:1', plan.aspectRatio === '1:1', () => onApply({ aspectRatio: '1:1' }))}
          </>
        );

      default:
        return null;
    }
  };

  return (
    <div
      style={{
        background: '#F9FAFB',
        border: `1.5px solid ${BORDER}`,
        borderRadius: 12,
        padding: 16,
        marginTop: 12,
      }}
    >
      {content()}
      <button
        onClick={onCancel}
        style={{
          marginTop: 14,
          background: 'none',
          border: 'none',
          color: GRAY,
          fontSize: 12,
          cursor: 'pointer',
          padding: 0,
        }}
      >
        ← Back to plan
      </button>
    </div>
  );
}

// ── Main component ─────────────────────────────────────────────────────────────

export default function JaneVideoChat({ onSaveToDrafts }: Props) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const composePollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);

  const [stage, setStage] = useState<Stage>('upload');
  const [adjustField, setAdjustField] = useState<AdjustField | null>(null);

  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [videoFiles, setVideoFiles] = useState<File[]>([]);
  const [stitchedUrl, setStitchedUrl] = useState<string | null>(null);
  const [videoPreviewUrl, setVideoPreviewUrl] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  const [classification, setClassification] = useState<Classification>('talking_head');
  const [plan, setPlan] = useState<VideoPlan | null>(null);

  const [renderStatus, setRenderStatus] = useState('pending');
  const [renderProgress, setRenderProgress] = useState(0);
  const [outputUrl, setOutputUrl] = useState<string | null>(null);
  const [renderError, setRenderError] = useState<string | null>(null);
  const [isSilenceCutting, setIsSilenceCutting] = useState(false);

  const [zapCapJobId, setZapCapJobId] = useState<string | null>(null);
  const [captionWords, setCaptionWords] = useState<CaptionWord[]>([]);
  const [captionEdits, setCaptionEdits] = useState<Record<string, string>>({});
  const [editingWordId, setEditingWordId] = useState<string | null>(null);
  const [loadingTranscript, setLoadingTranscript] = useState(false);
  const [isRerendering, setIsRerendering] = useState(false);

  const [brollMode, setBrollMode] = useState<BrollMode | null>(null);
  const [brollConvStep, setBrollConvStep] = useState<BrollConvStep>('choose');
  const [brollClips, setBrollClips] = useState<BrollClipEntry[]>([]);
  const [brollPlacements, setBrollPlacements] = useState<BrollPlacement[]>([]);
  const [isApplyingBroll, setIsApplyingBroll] = useState(false);
  const brollInputRef = useRef<HTMLInputElement>(null);

  const [history, setHistory] = useState<HistMsg[]>([]);
  const [zapCapTemplates, setZapCapTemplates] = useState<{ id: string; name: string }[]>([]);

  const [publishPlatforms, setPublishPlatforms] = useState<string[]>([]);
  const [publishCaption, setPublishCaption] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    SocialMediaAgentService.getZapCapTemplates()
      .then((r) => setZapCapTemplates(r?.responseData?.templates ?? []))
      .catch(() => {});
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
      if (composePollRef.current) clearInterval(composePollRef.current);
      if (videoPreviewUrl) URL.revokeObjectURL(videoPreviewUrl);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [history, stage]);

  const addMsg = useCallback((role: HistMsg['role'], text: string) => {
    setHistory((prev) => [...prev, { id: `${Date.now()}${Math.random()}`, role, text }]);
  }, []);

  // ── File accept ────────────────────────────────────────────────────────────

  const acceptFiles = useCallback(
    (files: File[]) => {
      const OK = ['video/mp4', 'video/quicktime', 'video/webm', 'video/x-m4v'];
      const valid = files.filter((f) => OK.includes(f.type) || /\.(mp4|mov|webm|m4v)$/i.test(f.name));
      if (valid.length === 0) {
        ToastService.showToast('Please upload MP4 or MOV videos.', ToastTypeEnum.Error);
        return;
      }
      const oversized = valid.find((f) => f.size > 500 * 1024 * 1024);
      if (oversized) {
        ToastService.showToast(`"${oversized.name}" is too large. Max 500 MB per clip.`, ToastTypeEnum.Error);
        return;
      }

      if (valid.length === 1) {
        const f = valid[0];
        setVideoFile(f);
        setVideoPreviewUrl(URL.createObjectURL(f));
        addMsg('user', `"${f.name}"`);
        setStage('classify');
      } else {
        setVideoFiles(valid);
        // Use first clip as preview thumbnail in classify stage (set after stitch)
        setVideoPreviewUrl(URL.createObjectURL(valid[0]));
        addMsg('user', `${valid.length} clips uploaded`);
        setStage('stitch');
      }
    },
    [addMsg]
  );

  // ── Classify ───────────────────────────────────────────────────────────────

  const handleClassify = (c: Classification, label: string) => {
    addMsg('user', label);
    setClassification(c);
    setStage('intent');
  };

  // ── Intent ─────────────────────────────────────────────────────────────────

  const handleIntent = (purpose: Purpose, label: string) => {
    addMsg('user', label);
    const p = defaultPlan(classification, purpose);
    setPlan(p);

    // Pushback: captions requested on silent footage
    if (classification === 'product') {
      addMsg(
        'jane',
        "There's no speech in this clip, so I've turned captions off — there's nothing to caption. I've added music and text-on-screen instead. You can change anything in the plan below."
      );
    }

    setStage('plan');
  };

  // ── Plan adjustments ───────────────────────────────────────────────────────

  const applyAdjust = (patch: Partial<VideoPlan>) => {
    setPlan((prev) => (prev ? { ...prev, ...patch } : null));
    setAdjustField(null);
  };

  // ── Render ─────────────────────────────────────────────────────────────────

  const PROGRESS_MAP: Record<string, number> = {
    pending: 15,
    transcribing: 40,
    transcriptionCompleted: 60,
    rendering: 80,
    completed: 100,
    failed: 0,
  };
  const STATUS_LABEL: Record<string, string> = {
    pending: 'Waiting in queue…',
    transcribing: 'Transcribing audio…',
    transcriptionCompleted: 'Preparing render…',
    rendering: 'Rendering…',
    completed: 'Done!',
    failed: 'Something went wrong',
  };

  const startPolling = (id: string) => {
    if (pollRef.current) clearInterval(pollRef.current);
    pollRef.current = setInterval(async () => {
      try {
        const res = await SocialMediaAgentService.getZapCapJob(id);
        const d = res?.responseData;
        if (!d) return;
        setRenderStatus(d.status);
        setRenderProgress(PROGRESS_MAP[d.status] ?? 50);
        if (d.status === 'completed' && d.output_url) {
          clearInterval(pollRef.current!);
          setOutputUrl(d.output_url);
          addMsg('jane', 'Done. Here it is 👇');
          setStage('preview');
          // Fetch transcript so caption editor works immediately
          setLoadingTranscript(true);
          SocialMediaAgentService.getZapCapTranscript(id)
            .then((res) => setCaptionWords(res?.responseData?.words ?? []))
            .catch(() => {})
            .finally(() => setLoadingTranscript(false));
        } else if (d.status === 'failed') {
          clearInterval(pollRef.current!);
          setRenderError(d.failure_reason ?? 'Render failed');
          setStage('preview');
        }
      } catch {
        // keep polling on blip
      }
    }, 6000);
  };

  const handleRender = async () => {
    if (!videoFile || !plan) return;
    addMsg('user', 'Looks good, make it');
    addMsg('jane', 'On it — this should take about two minutes.');
    setIsSilenceCutting(false);
    setStage('render');
    setRenderProgress(5);
    setRenderStatus('pending');

    const fd = new FormData();
    if (stitchedUrl) {
      fd.append('source_url', stitchedUrl);
    } else if (videoFile) {
      fd.append('video', videoFile);
    }
    const zapTemplate = zapCapTemplates.length > 0 ? zapCapTemplates[0].id : 'beast';
    fd.append('template_id', zapTemplate);
    fd.append('language', 'en');
    fd.append('output_mode', 'composited');
    fd.append('quality', 'standard');
    fd.append('enable_broll', String(plan.brollEnabled && plan.classification !== 'product'));
    fd.append('enable_music', String(plan.musicEnabled));

    try {
      const res = await SocialMediaAgentService.produceWithZapCap(fd);
      const id = res?.responseData?.job_id;
      if (!id) throw new Error('No job ID returned');
      setZapCapJobId(id);
      setCaptionWords([]);
      setCaptionEdits({});
      startPolling(id);
    } catch (err) {
      setRenderError(err instanceof Error ? err.message : 'Upload failed');
      setStage('preview');
    }
  };

  // ── Cut silences (compose pipeline) ───────────────────────────────────────

  const handleCutSilences = async () => {
    if (!videoFile) return;
    addMsg('user', 'Cut silences & long pauses');
    addMsg(
      'jane',
      "On it — I'll analyse the audio and cut every section where you're not speaking. Takes about two minutes."
    );
    setIsSilenceCutting(true);
    setOutputUrl(null);
    setRenderError(null);
    setRenderProgress(5);
    setRenderStatus('analyzing');
    setStage('render');

    // Step 1: start the multi-clip job (single clip, founder mode → runs silencedetect at ingest)
    const fd = new FormData();
    fd.append('clips', videoFile);
    fd.append('story_type', 'founder');
    fd.append('target_duration', '0');
    fd.append('orientation', plan?.aspectRatio ?? '9:16');
    fd.append('enable_music', 'false');
    fd.append('music_mood', 'chill');
    fd.append('music_volume', '0');

    let composeJobId: string;
    try {
      const res = await SocialMediaAgentService.startMultiClipJob(fd);
      composeJobId = res?.responseData?.job_id ?? '';
      if (!composeJobId) throw new Error('No job ID returned');
    } catch (err) {
      setRenderError(err instanceof Error ? err.message : 'Upload failed');
      setStage('preview');
      return;
    }

    // Step 2: poll until ingest finishes (awaiting_order), then auto-stitch
    if (composePollRef.current) clearInterval(composePollRef.current);

    const COMPOSE_STATUS_LABEL: Record<string, string> = {
      analyzing: 'Analysing audio…',
      awaiting_order: 'Audio analysed — cutting silences…',
      stitching: 'Stitching edited video…',
      ready: 'Done!',
      failed: 'Something went wrong',
    };
    const COMPOSE_PROGRESS: Record<string, number> = {
      analyzing: 30,
      awaiting_order: 60,
      stitching: 80,
      ready: 100,
      failed: 0,
    };

    let hasStitched = false;

    composePollRef.current = setInterval(async () => {
      try {
        const res = await SocialMediaAgentService.getMultiClipJob(composeJobId);
        const job = res?.responseData;
        if (!job) return;

        setRenderStatus(COMPOSE_STATUS_LABEL[job.status] ?? job.status_message);
        setRenderProgress(COMPOSE_PROGRESS[job.status] ?? 50);

        if (job.status === 'awaiting_order' && !hasStitched) {
          // Ingest complete — auto-stitch immediately (single clip, no reordering needed)
          hasStitched = true;
          await SocialMediaAgentService.stitchMultiClipJob(composeJobId);
        }

        if (job.status === 'ready' && job.output_url) {
          clearInterval(composePollRef.current!);
          setOutputUrl(job.output_url);
          addMsg('jane', "Done. Here's the version with silences cut 👇");
          setStage('preview');
        } else if (job.status === 'failed') {
          clearInterval(composePollRef.current!);
          setRenderError('Silence cutting failed — try again.');
          setStage('preview');
        }
      } catch {
        // keep polling on blip
      }
    }, 6000);
  };

  // ── Stitch multiple clips ─────────────────────────────────────────────────

  const handleStitch = async () => {
    if (videoFiles.length === 0) return;
    addMsg('jane', `Stitching ${videoFiles.length} clips together — this takes about a minute.`);
    setRenderProgress(5);
    setRenderStatus('Uploading clips…');
    setStage('stitch');

    const fd = new FormData();
    videoFiles.forEach((f) => fd.append('clips', f));
    fd.append('story_type', 'founder');
    fd.append('target_duration', '0');
    fd.append('orientation', '9:16');
    fd.append('enable_music', 'false');
    fd.append('music_mood', 'chill');
    fd.append('music_volume', '0');

    let composeJobId: string;
    try {
      const res = await SocialMediaAgentService.startMultiClipJob(fd);
      composeJobId = res?.responseData?.job_id ?? '';
      if (!composeJobId) throw new Error('No job ID returned');
    } catch (err) {
      setRenderError(err instanceof Error ? err.message : 'Upload failed');
      setRenderStatus('failed');
      return;
    }

    if (composePollRef.current) clearInterval(composePollRef.current);
    let hasStitched = false;

    composePollRef.current = setInterval(async () => {
      try {
        const res = await SocialMediaAgentService.getMultiClipJob(composeJobId);
        const job = res?.responseData;
        if (!job) return;

        const labelMap: Record<string, string> = {
          analyzing: 'Analysing clips…',
          awaiting_order: 'Combining clips…',
          stitching: 'Stitching…',
          ready: 'Done!',
          failed: 'Something went wrong',
        };
        const progressMap: Record<string, number> = {
          analyzing: 30,
          awaiting_order: 55,
          stitching: 80,
          ready: 100,
          failed: 0,
        };

        setRenderStatus(labelMap[job.status] ?? job.status_message ?? job.status);
        setRenderProgress(progressMap[job.status] ?? 50);

        if (job.status === 'awaiting_order' && !hasStitched) {
          hasStitched = true;
          await SocialMediaAgentService.stitchMultiClipJob(composeJobId);
        }

        if (job.status === 'ready' && job.output_url) {
          clearInterval(composePollRef.current!);
          setStitchedUrl(job.output_url);
          setVideoFiles([]);
          addMsg('jane', 'Clips merged. Now tell me a bit about this video:');
          setStage('classify');
        } else if (job.status === 'failed') {
          clearInterval(composePollRef.current!);
          setRenderError('Stitch failed — try again.');
          setRenderStatus('failed');
        }
      } catch {
        // keep polling on blip
      }
    }, 6000);
  };

  // ── Rerender with caption edits ───────────────────────────────────────────

  const handleRerender = async () => {
    if (!zapCapJobId) return;
    setIsRerendering(true);
    addMsg('jane', 'Re-rendering with your caption edits — about two minutes.');
    setOutputUrl(null);
    setRenderProgress(5);
    setRenderStatus('pending');
    setIsSilenceCutting(false);
    setStage('render');
    try {
      const edits = Object.entries(captionEdits).map(([id, text]) => ({ id, text }));
      const res = await SocialMediaAgentService.rerenderZapCapJob(zapCapJobId, {
        word_edits: edits,
        template_id: zapCapTemplates.length > 0 ? zapCapTemplates[0].id : 'beast',
      });
      const newId = res?.responseData?.job_id;
      if (!newId) throw new Error('No job ID returned');
      setZapCapJobId(newId);
      setCaptionWords([]);
      setCaptionEdits({});
      startPolling(newId);
    } catch {
      ToastService.showToast('Re-render failed — try again.', ToastTypeEnum.Error);
      setStage('preview');
    } finally {
      setIsRerendering(false);
    }
  };

  // ── B-roll fix-up helpers ─────────────────────────────────────────────────

  const handleBrollAuto = async () => {
    if (!zapCapJobId) return;
    addMsg('user', 'Jane picks the clips (auto)');
    addMsg('jane', 'Re-rendering with auto b-roll — ZapCap will pick stock footage that matches your content.');
    setOutputUrl(null);
    setRenderProgress(5);
    setRenderStatus('pending');
    setIsSilenceCutting(false);
    setStage('render');
    try {
      const res = await SocialMediaAgentService.rerenderZapCapJob(zapCapJobId, {
        word_edits: [],
        template_id: zapCapTemplates.length > 0 ? zapCapTemplates[0].id : 'beast',
        enable_broll: true,
      });
      const newId = res?.responseData?.job_id;
      if (!newId) throw new Error('No job ID');
      setZapCapJobId(newId);
      setCaptionWords([]);
      setCaptionEdits({});
      startPolling(newId);
    } catch {
      ToastService.showToast('B-roll re-render failed — try again.', ToastTypeEnum.Error);
      setStage('preview');
    }
  };

  const handleBrollNone = async () => {
    if (!zapCapJobId) return;
    addMsg('user', 'Remove b-roll');
    addMsg('jane', 'Re-rendering without b-roll — clean talking head.');
    setOutputUrl(null);
    setRenderProgress(5);
    setRenderStatus('pending');
    setIsSilenceCutting(false);
    setStage('render');
    try {
      const res = await SocialMediaAgentService.rerenderZapCapJob(zapCapJobId, {
        word_edits: [],
        template_id: zapCapTemplates.length > 0 ? zapCapTemplates[0].id : 'beast',
        enable_broll: false,
      });
      const newId = res?.responseData?.job_id;
      if (!newId) throw new Error('No job ID');
      setZapCapJobId(newId);
      setCaptionWords([]);
      setCaptionEdits({});
      startPolling(newId);
    } catch {
      ToastService.showToast('Re-render failed — try again.', ToastTypeEnum.Error);
      setStage('preview');
    }
  };

  const handleCustomBrollApply = async () => {
    if (!zapCapJobId || brollPlacements.length === 0 || brollClips.length === 0) return;
    setIsApplyingBroll(true);
    addMsg('jane', 'Compositing your b-roll clips — this takes about two minutes.');
    setOutputUrl(null);
    setRenderProgress(5);
    setRenderStatus('pending');
    setIsSilenceCutting(false);
    setStage('render');
    try {
      const fd = new FormData();
      brollClips.forEach((entry) => fd.append('clips', entry.file));
      fd.append(
        'placements',
        JSON.stringify(
          brollPlacements.map((p) => ({
            clip_index: p.clipIndex,
            start_time: p.startTime,
            duration: p.duration,
          }))
        )
      );
      const res = await SocialMediaAgentService.customBrollZapCapJob(zapCapJobId, fd);
      const newId = res?.responseData?.job_id;
      if (!newId) throw new Error('No job ID');
      setZapCapJobId(newId);
      setCaptionWords([]);
      setCaptionEdits({});
      setBrollClips([]);
      setBrollPlacements([]);
      startPolling(newId);
    } catch {
      ToastService.showToast('Custom b-roll failed — try again.', ToastTypeEnum.Error);
      setStage('preview');
    } finally {
      setIsApplyingBroll(false);
    }
  };

  // ── Save to drafts ─────────────────────────────────────────────────────────

  const handleSaveToDrafts = async () => {
    if (!outputUrl) return;
    if (publishPlatforms.length === 0) {
      ToastService.showToast('Pick at least one platform first.', ToastTypeEnum.Error);
      return;
    }
    setIsSaving(true);
    try {
      await SocialMediaAgentService.saveVideoDraft({
        merged_video_url: outputUrl,
        caption: publishCaption,
        platforms: publishPlatforms,
      });
      addMsg('jane', 'Saved to drafts. You can schedule or publish it anytime from the Drafts tab.');
      setStage('publish');
      onSaveToDrafts?.();
    } catch {
      ToastService.showToast('Could not save — try again.', ToastTypeEnum.Error);
    } finally {
      setIsSaving(false);
    }
  };

  // ── Reset ──────────────────────────────────────────────────────────────────

  const reset = () => {
    if (pollRef.current) clearInterval(pollRef.current);
    if (composePollRef.current) clearInterval(composePollRef.current);
    if (videoPreviewUrl) URL.revokeObjectURL(videoPreviewUrl);
    setStage('upload');
    setVideoFile(null);
    setVideoPreviewUrl(null);
    setPlan(null);
    setOutputUrl(null);
    setRenderError(null);
    setRenderProgress(0);
    setRenderStatus('pending');
    setIsSilenceCutting(false);
    setVideoFiles([]);
    setStitchedUrl(null);
    setZapCapJobId(null);
    setCaptionWords([]);
    setCaptionEdits({});
    setEditingWordId(null);
    setBrollMode(null);
    setBrollConvStep('choose');
    setBrollClips([]);
    setBrollPlacements([]);
    setHistory([]);
    setClassification('talking_head');
    setAdjustField(null);
    setPublishPlatforms([]);
    setPublishCaption('');
  };

  // ── Active panel for current stage ────────────────────────────────────────

  const planLabels = plan
    ? {
        captionLabel: !plan.captionsEnabled ? 'off' : `on · ${plan.captionStyle}`,
        trimLabel:
          plan.removeSilence && plan.removeFiller
            ? 'cut pauses and filler'
            : plan.removeSilence
              ? 'cut pauses only'
              : plan.removeFiller
                ? 'cut filler only'
                : 'no trimming',
        brollLabel: !plan.brollEnabled ? 'off' : `on · ${plan.brollDensity}`,
        musicLabel: !plan.musicEnabled ? 'none' : `${plan.musicType}, under your voice`,
        lengthLabel: plan.targetLength === 'auto' ? 'auto (no limit)' : plan.targetLength,
        formatLabel:
          plan.aspectRatio === '9:16'
            ? 'vertical · 9:16'
            : plan.aspectRatio === '16:9'
              ? 'landscape · 16:9'
              : 'square · 1:1',
      }
    : null;

  const PLATFORM_OPTIONS = ['instagram', 'tiktok', 'youtube', 'facebook', 'linkedin'];

  const activePanel = () => {
    // ── UPLOAD ─────────────────────────────────────────────────────────────
    if (stage === 'upload') {
      return (
        <div>
          <JaneBubble text="Hey! Drop a video here and I'll take a look. I'll build you a complete plan before we touch anything." />
          <div
            onDragOver={(e) => {
              e.preventDefault();
              setIsDragging(true);
            }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={(e) => {
              e.preventDefault();
              setIsDragging(false);
              const files = Array.from(e.dataTransfer.files);
              if (files.length > 0) acceptFiles(files);
            }}
            onClick={() => fileInputRef.current?.click()}
            style={{
              marginTop: 12,
              border: `2px dashed ${isDragging ? PINK : BORDER}`,
              borderRadius: 14,
              padding: '32px 24px',
              textAlign: 'center',
              cursor: 'pointer',
              background: isDragging ? LIGHT_PINK : '#FAFAFA',
              transition: 'all 0.15s',
            }}
          >
            <div style={{ fontSize: 32, marginBottom: 8 }}>🎬</div>
            <div style={{ fontSize: 14, fontWeight: 600, color: '#374151' }}>Drop your video here</div>
            <div style={{ fontSize: 12, color: GRAY, marginTop: 4 }}>
              MP4, MOV, WebM · up to 500 MB · drop multiple clips to stitch
            </div>
            <div
              style={{
                marginTop: 14,
                display: 'inline-block',
                padding: '8px 20px',
                borderRadius: 8,
                background: PINK,
                color: '#fff',
                fontSize: 13,
                fontWeight: 600,
              }}
            >
              Choose file
            </div>
          </div>
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept="video/mp4,video/quicktime,video/webm,video/x-m4v,.mp4,.mov,.webm,.m4v"
            style={{ display: 'none' }}
            onChange={(e) => {
              const files = Array.from(e.target.files ?? []);
              if (files.length > 0) acceptFiles(files);
              e.target.value = '';
            }}
          />
        </div>
      );
    }

    // ── STITCH ─────────────────────────────────────────────────────────────
    if (stage === 'stitch') {
      // Error state
      if (renderStatus === 'failed') {
        return (
          <div>
            <JaneBubble text={`Stitch failed: ${renderError ?? 'something went wrong'}. Want to try again?`} />
            <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
              <TapBtn
                label="Try again"
                primary
                onClick={() => {
                  setRenderStatus('pending');
                  setRenderProgress(0);
                  setRenderError(null);
                  handleStitch();
                }}
              />
              <TapBtn label="Start over" onClick={reset} />
            </div>
          </div>
        );
      }

      // In progress
      if (renderProgress > 0) {
        return (
          <div>
            <div
              style={{
                background: LIGHT_PINK,
                border: `1.5px solid ${BORDER_PINK}`,
                borderRadius: 12,
                padding: 20,
                marginTop: 12,
              }}
            >
              <div style={{ fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 10 }}>{renderStatus}</div>
              <div style={{ height: 6, background: '#F3F4F6', borderRadius: 3, overflow: 'hidden' }}>
                <div
                  style={{
                    height: '100%',
                    width: `${renderProgress}%`,
                    background: `linear-gradient(90deg, ${PINK} 0%, #A01560 100%)`,
                    borderRadius: 3,
                    transition: 'width 0.8s ease',
                  }}
                />
              </div>
              <div style={{ fontSize: 11, color: GRAY, marginTop: 8 }}>{renderProgress}%</div>
            </div>
          </div>
        );
      }

      // Prompt
      return (
        <div>
          <JaneBubble
            text={`I see ${videoFiles.length} clips. I'll stitch them together in the order you dropped them, then we'll build your video plan.`}
          />
          <div
            style={{
              background: '#fff',
              border: `1.5px solid ${BORDER}`,
              borderRadius: 12,
              padding: '10px 14px',
              marginTop: 10,
              marginBottom: 12,
            }}
          >
            {videoFiles.map((f, i) => (
              <div
                key={i}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  padding: '7px 0',
                  borderBottom: i < videoFiles.length - 1 ? `1px solid ${BORDER}` : 'none',
                }}
              >
                <div
                  style={{
                    width: 22,
                    height: 22,
                    borderRadius: '50%',
                    background: '#F3F4F6',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 11,
                    fontWeight: 700,
                    color: GRAY,
                    flexShrink: 0,
                  }}
                >
                  {i + 1}
                </div>
                <div
                  style={{
                    fontSize: 13,
                    color: '#374151',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {f.name}
                </div>
                <div style={{ marginLeft: 'auto', fontSize: 11, color: GRAY, flexShrink: 0 }}>
                  {(f.size / 1024 / 1024).toFixed(0)} MB
                </div>
              </div>
            ))}
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <TapBtn label="Stitch & continue" primary onClick={handleStitch} />
            <TapBtn label="Start over" onClick={reset} />
          </div>
        </div>
      );
    }

    // ── CLASSIFY ───────────────────────────────────────────────────────────
    if (stage === 'classify') {
      return (
        <div>
          {videoPreviewUrl && (
            <video
              src={videoPreviewUrl}
              style={{
                width: '100%',
                maxHeight: 140,
                objectFit: 'cover',
                borderRadius: 10,
                marginBottom: 12,
              }}
              muted
              preload="metadata"
            />
          )}
          <JaneBubble text="Got it! What kind of clip is this?" />
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 10 }}>
            <TapBtn
              label="Me talking to camera"
              onClick={() => handleClassify('talking_head', 'Me talking to camera')}
            />
            <TapBtn label="My product" onClick={() => handleClassify('product', 'My product')} />
            <TapBtn label="Both" onClick={() => handleClassify('mixed', 'Both — me and my product')} />
          </div>
        </div>
      );
    }

    // ── INTENT ─────────────────────────────────────────────────────────────
    if (stage === 'intent') {
      return (
        <div>
          <JaneBubble text="What's this one for?" />
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 10 }}>
            <TapBtn label="Sell a product" onClick={() => handleIntent('sell', 'Sell a product')} />
            <TapBtn label="Share a tip" onClick={() => handleIntent('teach', 'Share a tip')} />
            <TapBtn label="Announce something" onClick={() => handleIntent('announce', 'Announce something')} />
            <TapBtn label="Just post it" onClick={() => handleIntent('general', 'Just post it')} />
          </div>
        </div>
      );
    }

    // ── PLAN ───────────────────────────────────────────────────────────────
    if (stage === 'plan' && plan && planLabels) {
      // If a field is being adjusted, show the adjust panel instead
      if (adjustField) {
        return (
          <div>
            <JaneBubble text="Here's my plan — have a look and change anything you want:" />
            <AdjustPanel field={adjustField} plan={plan} onApply={applyAdjust} onCancel={() => setAdjustField(null)} />
          </div>
        );
      }

      return (
        <div>
          <JaneBubble text="Here's my plan — have a look and change anything you want:" />

          {/* Plan card */}
          <div
            style={{
              background: '#fff',
              border: `1.5px solid ${BORDER}`,
              borderRadius: 12,
              padding: '4px 16px 8px',
              marginTop: 10,
              boxShadow: '0 1px 6px rgba(0,0,0,0.06)',
            }}
          >
            {/* Style row with visual thumb */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                padding: '12px 0 10px',
                borderBottom: `1px solid ${BORDER}`,
              }}
            >
              <StylePreviewThumb style={plan.style} />
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 12, color: GRAY }}>Style</div>
                <div style={{ fontSize: 14, fontWeight: 600, color: '#111827' }}>{plan.style.name}</div>
                <div style={{ fontSize: 11, color: GRAY }}>{plan.style.tagline}</div>
              </div>
              <button
                onClick={() => setAdjustField('style')}
                style={{
                  background: 'none',
                  border: 'none',
                  color: PINK,
                  fontSize: 12,
                  fontWeight: 600,
                  cursor: 'pointer',
                  padding: 0,
                }}
              >
                change
              </button>
            </div>

            <PlanRow
              label="Captions"
              value={planLabels.captionLabel}
              field="captions"
              onAdjust={setAdjustField}
              disabled={plan.classification === 'product' && !plan.captionsEnabled}
            />
            <PlanRow
              label="Trim"
              value={planLabels.trimLabel}
              field="trim"
              onAdjust={setAdjustField}
              disabled={plan.classification === 'product'}
            />
            <PlanRow label="B-roll" value={planLabels.brollLabel} field="broll" onAdjust={setAdjustField} />
            <PlanRow label="Music" value={planLabels.musicLabel} field="music" onAdjust={setAdjustField} />
            <PlanRow label="Length" value={planLabels.lengthLabel} field="length" onAdjust={setAdjustField} />
            <PlanRow label="Format" value={planLabels.formatLabel} field="format" onAdjust={setAdjustField} />
          </div>

          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 14 }}>
            <TapBtn label="Looks good, make it" primary onClick={handleRender} />
            <TapBtn label="See other styles" onClick={() => setAdjustField('style')} />
          </div>
        </div>
      );
    }

    // ── RENDER ─────────────────────────────────────────────────────────────
    if (stage === 'render') {
      return (
        <div>
          <div
            style={{
              background: LIGHT_PINK,
              border: `1.5px solid ${BORDER_PINK}`,
              borderRadius: 12,
              padding: 20,
              marginTop: 12,
            }}
          >
            <div style={{ fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 10 }}>
              {isSilenceCutting ? renderStatus : (STATUS_LABEL[renderStatus] ?? 'Working on it…')}
            </div>
            <div
              style={{
                height: 6,
                background: '#F3F4F6',
                borderRadius: 3,
                overflow: 'hidden',
              }}
            >
              <div
                style={{
                  height: '100%',
                  width: `${renderProgress}%`,
                  background: `linear-gradient(90deg, ${PINK} 0%, #A01560 100%)`,
                  borderRadius: 3,
                  transition: 'width 0.8s ease',
                }}
              />
            </div>
            <div style={{ fontSize: 11, color: GRAY, marginTop: 8 }}>{renderProgress}%</div>
          </div>
        </div>
      );
    }

    // ── PREVIEW ────────────────────────────────────────────────────────────
    if (stage === 'preview') {
      if (renderError) {
        return (
          <div>
            <JaneBubble text={`Something went wrong: ${renderError}. Want to try again?`} />
            <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
              <TapBtn label="Try again" primary onClick={reset} />
              <TapBtn label="Start over" onClick={reset} />
            </div>
          </div>
        );
      }

      return (
        <div>
          {outputUrl && (
            <video
              src={outputUrl}
              controls
              style={{
                width: '100%',
                maxHeight: 340,
                borderRadius: 12,
                background: '#000',
                marginBottom: 14,
              }}
            />
          )}

          {/* Publish options */}
          <div
            style={{
              background: '#fff',
              border: `1.5px solid ${BORDER}`,
              borderRadius: 12,
              padding: 16,
              marginBottom: 12,
            }}
          >
            <SectionLabel text="Platforms" />
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 14 }}>
              {PLATFORM_OPTIONS.map((p) => {
                const active = publishPlatforms.includes(p);
                return (
                  <button
                    key={p}
                    onClick={() => setPublishPlatforms((prev) => (active ? prev.filter((x) => x !== p) : [...prev, p]))}
                    style={{
                      padding: '6px 14px',
                      borderRadius: 8,
                      border: `1.5px solid ${active ? PINK : BORDER}`,
                      background: active ? LIGHT_PINK : '#fff',
                      color: active ? PINK : '#374151',
                      fontSize: 12,
                      fontWeight: active ? 600 : 400,
                      cursor: 'pointer',
                      textTransform: 'capitalize',
                    }}
                  >
                    {p}
                  </button>
                );
              })}
            </div>
            <SectionLabel text="Caption (optional)" />
            <textarea
              value={publishCaption}
              onChange={(e) => setPublishCaption(e.target.value)}
              placeholder="Add a caption for this post…"
              rows={2}
              style={{
                width: '100%',
                border: `1.5px solid ${BORDER}`,
                borderRadius: 8,
                padding: '8px 12px',
                fontSize: 13,
                color: '#374151',
                resize: 'none',
                boxSizing: 'border-box',
                outline: 'none',
                fontFamily: 'inherit',
              }}
            />
          </div>

          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <TapBtn label={isSaving ? 'Saving…' : 'Save to drafts'} primary onClick={handleSaveToDrafts} />
            <TapBtn
              label="Fix something"
              onClick={() => {
                addMsg('user', 'Fix something');
                setStage('cleanup');
              }}
            />
            <TapBtn
              label="Try a different style"
              onClick={() => {
                addMsg('user', 'Try a different style');
                addMsg(
                  'jane',
                  "That's a different style, so I'll rebuild it. Change the style below and tap 'make it' again."
                );
                setPlan((p) => (p ? { ...p } : null));
                setAdjustField('style');
                setStage('plan');
              }}
            />
          </div>
        </div>
      );
    }

    // ── CLEAN-UP ───────────────────────────────────────────────────────────
    if (stage === 'cleanup') {
      return (
        <div>
          <JaneBubble text="What would you like to fix? I can adjust within what we already made — no re-render for most of these." />
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 10 }}>
            {[
              {
                label: 'Cut silences & long pauses',
                desc: 'Audio analysis removes every section where you stop talking',
                fn: handleCutSilences,
              },
              {
                label: 'Caption text',
                desc: 'Edit specific words or lines',
                fn: () => {
                  addMsg('user', 'Caption text');
                  setStage('caption_edit');
                },
              },
              {
                label: 'B-roll',
                desc: 'Add stock footage, upload your own clips, or remove b-roll',
                fn: () => {
                  addMsg('user', 'B-roll');
                  setBrollMode(null);
                  setBrollConvStep('choose');
                  setBrollClips([]);
                  setBrollPlacements([]);
                  setStage('broll_edit');
                },
              },
              {
                label: 'Music',
                desc: 'Change or remove the music track',
                fn: () => {
                  addMsg('user', 'Music');
                  addMsg(
                    'jane',
                    "To swap the music, update the plan and I'll rebuild just the audio layer — coming soon in this flow."
                  );
                },
              },
              {
                label: 'Try a different style',
                desc: 'Full re-render in a new look',
                fn: () => {
                  addMsg('user', 'Try a different style');
                  addMsg(
                    'jane',
                    "That's a different style, so I'll rebuild it — about two minutes. Change the style below."
                  );
                  setAdjustField('style');
                  setStage('plan');
                },
              },
              {
                label: "Nothing, I'm done",
                desc: '',
                fn: () => {
                  addMsg('user', "Nothing, I'm done");
                  setStage('preview');
                },
              },
            ].map((item) => (
              <button
                key={item.label}
                onClick={item.fn}
                style={{
                  padding: '10px 14px',
                  borderRadius: 10,
                  border: `1.5px solid ${BORDER}`,
                  background: '#fff',
                  cursor: 'pointer',
                  textAlign: 'left',
                }}
              >
                <div style={{ fontSize: 13, fontWeight: 600, color: '#111827' }}>{item.label}</div>
                {item.desc && <div style={{ fontSize: 11, color: GRAY, marginTop: 2 }}>{item.desc}</div>}
              </button>
            ))}
          </div>
          {/* PRD: OUT-of-scope items listed so expectations are clear */}
          <div
            style={{
              marginTop: 14,
              padding: '8px 12px',
              background: '#F9FAFB',
              borderRadius: 8,
              fontSize: 11,
              color: GRAY,
            }}
          >
            Not in clean-up: keyframing, layers, transitions, text placement, stickers. Jane changes{' '}
            <em>what she chose</em> — she doesn&apos;t add new elements.
          </div>
        </div>
      );
    }

    // ── CAPTION EDIT ───────────────────────────────────────────────────────
    if (stage === 'caption_edit') {
      const editCount = Object.keys(captionEdits).length;

      if (isSilenceCutting) {
        return (
          <div>
            <JaneBubble text="This version was made by the silence cutter, which doesn't add captions. Tap 'Make it' from the plan to produce a captioned version first." />
            <div style={{ marginTop: 10 }}>
              <TapBtn label="Back" onClick={() => setStage('cleanup')} />
            </div>
          </div>
        );
      }

      return (
        <div>
          <JaneBubble text="Click any word to edit it. When you're happy, I'll re-render with your changes." />

          <div
            style={{
              background: '#fff',
              border: `1.5px solid ${BORDER}`,
              borderRadius: 12,
              padding: 16,
              marginTop: 10,
            }}
          >
            {loadingTranscript && <div style={{ fontSize: 13, color: GRAY }}>Loading transcript…</div>}

            {!loadingTranscript && captionWords.length === 0 && (
              <div style={{ fontSize: 13, color: GRAY }}>
                No transcript available for this video. Try re-rendering with captions enabled.
              </div>
            )}

            {!loadingTranscript && captionWords.length > 0 && (
              <>
                <div
                  style={{
                    display: 'flex',
                    flexWrap: 'wrap',
                    gap: 4,
                    padding: '10px 12px',
                    background: '#F9FAFB',
                    border: `1.5px solid ${BORDER}`,
                    borderRadius: 8,
                    maxHeight: 220,
                    overflowY: 'auto',
                    marginBottom: 12,
                  }}
                >
                  {captionWords.map((w) => {
                    const isEditing = editingWordId === w.id;
                    const edited = captionEdits[w.id];
                    const display = edited ?? w.text;
                    return (
                      <span key={w.id} style={{ display: 'inline-block' }}>
                        {isEditing ? (
                          <input
                            autoFocus
                            defaultValue={display}
                            onBlur={(e) => {
                              const val = e.target.value.trim();
                              if (val && val !== w.text) {
                                setCaptionEdits((prev) => ({ ...prev, [w.id]: val }));
                              } else {
                                setCaptionEdits((prev) => {
                                  const n = { ...prev };
                                  delete n[w.id];
                                  return n;
                                });
                              }
                              setEditingWordId(null);
                            }}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter' || e.key === 'Escape') (e.target as HTMLInputElement).blur();
                            }}
                            style={{
                              fontSize: 13,
                              border: 'none',
                              outline: `1.5px solid ${PINK}`,
                              borderRadius: 4,
                              padding: '2px 5px',
                              background: LIGHT_PINK,
                              color: PINK,
                              width: `${Math.max(display.length, 3) + 1}ch`,
                            }}
                          />
                        ) : (
                          <span
                            onClick={() => setEditingWordId(w.id)}
                            style={{
                              fontSize: 13,
                              padding: '3px 5px',
                              borderRadius: 4,
                              cursor: 'text',
                              color: edited ? PINK : '#374151',
                              background: edited ? LIGHT_PINK : 'transparent',
                              fontWeight: edited ? 600 : 400,
                            }}
                          >
                            {display}
                          </span>
                        )}
                      </span>
                    );
                  })}
                </div>

                {editCount > 0 && (
                  <button
                    onClick={() => setCaptionEdits({})}
                    style={{
                      fontSize: 11,
                      color: GRAY,
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      padding: 0,
                      marginBottom: 10,
                      display: 'block',
                    }}
                  >
                    ↺ Reset all edits ({editCount} changed)
                  </button>
                )}

                <button
                  onClick={editCount > 0 ? handleRerender : undefined}
                  disabled={isRerendering || editCount === 0}
                  style={{
                    width: '100%',
                    padding: '10px 0',
                    borderRadius: 9,
                    border: 'none',
                    background:
                      isRerendering || editCount === 0
                        ? '#E5E7EB'
                        : `linear-gradient(135deg, ${PINK} 0%, #8E1545 100%)`,
                    color: isRerendering || editCount === 0 ? GRAY : '#fff',
                    fontWeight: 700,
                    fontSize: 13,
                    cursor: isRerendering || editCount === 0 ? 'not-allowed' : 'pointer',
                  }}
                >
                  {isRerendering
                    ? 'Re-rendering…'
                    : editCount > 0
                      ? `Re-render with ${editCount} caption edit${editCount !== 1 ? 's' : ''}`
                      : 'Edit a word above to apply'}
                </button>
              </>
            )}
          </div>

          <div style={{ marginTop: 12 }}>
            <TapBtn label="← Back" onClick={() => setStage('cleanup')} />
          </div>
        </div>
      );
    }

    // ── BROLL EDIT ────────────────────────────────────────────────────────
    if (stage === 'broll_edit') {
      // Helper: derive ~5-second transcript segments from captionWords
      const transcriptSegments = (() => {
        if (captionWords.length === 0) return [];
        const segs: { text: string; startTime: number; endTime: number }[] = [];
        let segStart = captionWords[0].start_time;
        let segWords: string[] = [];
        for (const w of captionWords) {
          segWords.push(w.text);
          if (w.end_time - segStart >= 5 || w === captionWords[captionWords.length - 1]) {
            segs.push({ text: segWords.join(' '), startTime: segStart, endTime: w.end_time });
            segStart = w.end_time;
            segWords = [];
          }
        }
        return segs;
      })();

      // ── Step: choose mode ───────────────────────────────────────────────
      if (brollConvStep === 'choose') {
        return (
          <div>
            <JaneBubble text="How do you want to handle b-roll?" />
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 10 }}>
              {[
                {
                  label: 'Jane picks (auto)',
                  desc: "I'll add stock footage that matches your content — ~50% b-roll coverage",
                  onClick: handleBrollAuto,
                },
                {
                  label: 'Upload my own clips',
                  desc: 'Drop your product or lifestyle footage and tell me where to place it',
                  onClick: () => {
                    setBrollMode('custom');
                    setBrollConvStep('upload');
                  },
                },
                {
                  label: 'Remove b-roll',
                  desc: 'Strip all b-roll — back to clean talking head',
                  onClick: handleBrollNone,
                },
              ].map((opt) => (
                <button
                  key={opt.label}
                  onClick={opt.onClick}
                  style={{
                    padding: '10px 14px',
                    borderRadius: 10,
                    border: `1.5px solid ${BORDER}`,
                    background: '#fff',
                    cursor: 'pointer',
                    textAlign: 'left',
                  }}
                >
                  <div style={{ fontSize: 13, fontWeight: 600, color: '#111827' }}>{opt.label}</div>
                  <div style={{ fontSize: 11, color: GRAY, marginTop: 2 }}>{opt.desc}</div>
                </button>
              ))}
            </div>
            <div style={{ marginTop: 12 }}>
              <TapBtn label="← Back" onClick={() => setStage('cleanup')} />
            </div>
          </div>
        );
      }

      // ── Step: upload custom clips ───────────────────────────────────────
      if (brollConvStep === 'upload') {
        const CLIP_TAGS: { value: BrollClipTag; label: string }[] = [
          { value: 'product', label: 'Product' },
          { value: 'lifestyle', label: 'Lifestyle' },
          { value: 'talking', label: 'Close-up' },
          { value: 'other', label: 'Other' },
        ];

        const addBrollFiles = (files: File[]) => {
          const valid = files.filter(
            (f) => ['video/mp4', 'video/quicktime', 'video/webm'].includes(f.type) || /\.(mp4|mov|webm)$/i.test(f.name)
          );
          if (valid.length === 0) return;
          setBrollClips((prev) => [
            ...prev,
            ...valid.map((f) => ({ file: f, tag: 'other' as BrollClipTag, previewUrl: URL.createObjectURL(f) })),
          ]);
        };

        return (
          <div>
            <JaneBubble text="Upload your b-roll clips. Tag each one so I know what it shows — I'll use that when placing them." />

            {/* Drop zone */}
            <div
              onClick={() => brollInputRef.current?.click()}
              style={{
                marginTop: 12,
                border: `2px dashed ${BORDER}`,
                borderRadius: 12,
                padding: '20px 16px',
                textAlign: 'center',
                cursor: 'pointer',
                background: '#FAFAFA',
              }}
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => {
                e.preventDefault();
                addBrollFiles(Array.from(e.dataTransfer.files));
              }}
            >
              <div style={{ fontSize: 13, color: GRAY }}>Drop clips here or tap to browse</div>
              <div style={{ fontSize: 11, color: GRAY, marginTop: 4 }}>MP4 · MOV · WebM</div>
            </div>
            <input
              ref={brollInputRef}
              type="file"
              accept="video/mp4,video/quicktime,video/webm,.mp4,.mov,.webm"
              multiple
              style={{ display: 'none' }}
              onChange={(e) => addBrollFiles(Array.from(e.target.files ?? []))}
            />

            {/* Clip list with type tags */}
            {brollClips.length > 0 && (
              <div style={{ marginTop: 12, display: 'flex', flexDirection: 'column', gap: 8 }}>
                {brollClips.map((entry, i) => (
                  <div
                    key={i}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 8,
                      padding: '8px 10px',
                      border: `1.5px solid ${BORDER}`,
                      borderRadius: 10,
                      background: '#fff',
                    }}
                  >
                    <video
                      src={entry.previewUrl}
                      style={{ width: 48, height: 48, borderRadius: 6, objectFit: 'cover', flexShrink: 0 }}
                      muted
                    />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div
                        style={{
                          fontSize: 12,
                          fontWeight: 600,
                          color: '#111827',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {entry.file.name}
                      </div>
                      <div style={{ display: 'flex', gap: 4, marginTop: 4, flexWrap: 'wrap' }}>
                        {CLIP_TAGS.map((t) => (
                          <button
                            key={t.value}
                            onClick={() =>
                              setBrollClips((prev) => prev.map((c, j) => (j === i ? { ...c, tag: t.value } : c)))
                            }
                            style={{
                              padding: '2px 8px',
                              borderRadius: 6,
                              border: `1.5px solid ${entry.tag === t.value ? PINK : BORDER}`,
                              background: entry.tag === t.value ? LIGHT_PINK : '#fff',
                              color: entry.tag === t.value ? PINK : GRAY,
                              fontSize: 10,
                              fontWeight: 600,
                              cursor: 'pointer',
                            }}
                          >
                            {t.label}
                          </button>
                        ))}
                      </div>
                    </div>
                    <button
                      onClick={() => setBrollClips((prev) => prev.filter((_, j) => j !== i))}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', color: GRAY, fontSize: 16 }}
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            )}

            <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
              <TapBtn label="← Back" onClick={() => setBrollConvStep('choose')} />
              {brollClips.length > 0 && (
                <button
                  onClick={() => {
                    // Pre-populate placements: spread clips evenly across transcript segments
                    const segs =
                      transcriptSegments.length > 0
                        ? transcriptSegments
                        : [{ text: 'start of video', startTime: 0, endTime: 5 }];
                    const initial: BrollPlacement[] = brollClips.map((_, i) => {
                      const seg = segs[Math.floor((i / brollClips.length) * segs.length)];
                      return {
                        clipIndex: i,
                        startTime: seg.startTime,
                        duration: 4,
                        segmentText: seg.text,
                      };
                    });
                    setBrollPlacements(initial);
                    setBrollConvStep('place');
                  }}
                  style={{
                    padding: '8px 16px',
                    borderRadius: 8,
                    border: 'none',
                    background: PINK,
                    color: '#fff',
                    fontSize: 13,
                    fontWeight: 600,
                    cursor: 'pointer',
                    flex: 1,
                  }}
                >
                  Next — place clips →
                </button>
              )}
            </div>
          </div>
        );
      }

      // ── Step: place clips against transcript ────────────────────────────
      if (brollConvStep === 'place') {
        const segments =
          transcriptSegments.length > 0 ? transcriptSegments : [{ text: 'start of video', startTime: 0, endTime: 5 }];

        return (
          <div>
            <JaneBubble
              text={
                captionWords.length > 0
                  ? 'Pick the moment in your transcript where each clip should appear.'
                  : 'No transcript available — set start times manually for each clip.'
              }
            />

            <div style={{ marginTop: 12, display: 'flex', flexDirection: 'column', gap: 10 }}>
              {brollPlacements.map((placement, i) => (
                <div
                  key={i}
                  style={{
                    padding: '10px 12px',
                    border: `1.5px solid ${BORDER}`,
                    borderRadius: 10,
                    background: '#fff',
                  }}
                >
                  <div style={{ fontSize: 12, fontWeight: 600, color: '#111827', marginBottom: 6 }}>
                    Clip {i + 1}:{' '}
                    <span style={{ color: GRAY, fontWeight: 400 }}>{brollClips[placement.clipIndex]?.file.name}</span>
                  </div>

                  {captionWords.length > 0 ? (
                    <>
                      <div style={{ fontSize: 11, color: GRAY, marginBottom: 4 }}>Place when you say:</div>
                      <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                        {segments.map((seg, si) => (
                          <button
                            key={si}
                            onClick={() =>
                              setBrollPlacements((prev) =>
                                prev.map((p, j) =>
                                  j === i ? { ...p, startTime: seg.startTime, segmentText: seg.text } : p
                                )
                              )
                            }
                            style={{
                              padding: '3px 8px',
                              borderRadius: 6,
                              border: `1.5px solid ${placement.startTime === seg.startTime ? PINK : BORDER}`,
                              background: placement.startTime === seg.startTime ? LIGHT_PINK : '#FAFAFA',
                              color: placement.startTime === seg.startTime ? PINK : '#374151',
                              fontSize: 11,
                              cursor: 'pointer',
                              maxWidth: 160,
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap',
                            }}
                            title={seg.text}
                          >
                            "{seg.text.length > 30 ? seg.text.slice(0, 30) + '…' : seg.text}"
                          </button>
                        ))}
                      </div>
                    </>
                  ) : (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ fontSize: 11, color: GRAY }}>Start at:</span>
                      <input
                        type="number"
                        min={0}
                        step={0.5}
                        value={placement.startTime}
                        onChange={(e) =>
                          setBrollPlacements((prev) =>
                            prev.map((p, j) => (j === i ? { ...p, startTime: parseFloat(e.target.value) || 0 } : p))
                          )
                        }
                        style={{
                          width: 64,
                          padding: '3px 6px',
                          borderRadius: 6,
                          border: `1.5px solid ${BORDER}`,
                          fontSize: 12,
                        }}
                      />
                      <span style={{ fontSize: 11, color: GRAY }}>seconds</span>
                    </div>
                  )}

                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 6 }}>
                    <span style={{ fontSize: 11, color: GRAY }}>Duration:</span>
                    {[3, 4, 5, 6].map((d) => (
                      <button
                        key={d}
                        onClick={() =>
                          setBrollPlacements((prev) => prev.map((p, j) => (j === i ? { ...p, duration: d } : p)))
                        }
                        style={{
                          padding: '2px 8px',
                          borderRadius: 6,
                          border: `1.5px solid ${placement.duration === d ? PINK : BORDER}`,
                          background: placement.duration === d ? LIGHT_PINK : '#fff',
                          color: placement.duration === d ? PINK : GRAY,
                          fontSize: 11,
                          fontWeight: 600,
                          cursor: 'pointer',
                        }}
                      >
                        {d}s
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
              <TapBtn label="← Back" onClick={() => setBrollConvStep('upload')} />
              <button
                onClick={handleCustomBrollApply}
                disabled={isApplyingBroll}
                style={{
                  padding: '8px 16px',
                  borderRadius: 8,
                  border: 'none',
                  background: isApplyingBroll ? GRAY : PINK,
                  color: '#fff',
                  fontSize: 13,
                  fontWeight: 600,
                  cursor: isApplyingBroll ? 'not-allowed' : 'pointer',
                  flex: 1,
                }}
              >
                {isApplyingBroll
                  ? 'Compositing…'
                  : `Apply ${brollPlacements.length} clip${brollPlacements.length !== 1 ? 's' : ''}`}
              </button>
            </div>
          </div>
        );
      }

      return null;
    }

    // ── PUBLISH ────────────────────────────────────────────────────────────
    if (stage === 'publish') {
      return (
        <div>
          <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
            <TapBtn label="Make another video" primary onClick={reset} />
          </div>
        </div>
      );
    }

    return null;
  };

  // ── JSX ───────────────────────────────────────────────────────────────────

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 0, maxWidth: 620 }}>
      {/* Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          marginBottom: 16,
          paddingBottom: 14,
          borderBottom: `1px solid ${BORDER}`,
        }}
      >
        <div
          style={{
            width: 36,
            height: 36,
            borderRadius: '50%',
            background: PINK,
            color: '#fff',
            fontWeight: 700,
            fontSize: 14,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          J
        </div>
        <div>
          <div style={{ fontSize: 15, fontWeight: 700, color: '#111827' }}>Jane · Video</div>
          <div style={{ fontSize: 11, color: GRAY }}>Plan first, render once</div>
        </div>
        {stage !== 'upload' && (
          <button
            onClick={reset}
            style={{
              marginLeft: 'auto',
              background: 'none',
              border: `1.5px solid ${BORDER}`,
              borderRadius: 8,
              padding: '5px 12px',
              fontSize: 12,
              color: GRAY,
              cursor: 'pointer',
            }}
          >
            Start over
          </button>
        )}
      </div>

      {/* Chat history */}
      {history.length > 0 && (
        <div style={{ marginBottom: 12 }}>
          {history.map((m) =>
            m.role === 'jane' ? <JaneBubble key={m.id} text={m.text} /> : <UserBubble key={m.id} text={m.text} />
          )}
        </div>
      )}

      {/* Active panel for current stage */}
      <div>{activePanel()}</div>

      <div ref={chatEndRef} />
    </div>
  );
}
