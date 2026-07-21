'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { SocialMediaAgentService } from '@/src/api/SocialMediaAgentService';
import { ToastService } from '@/src/utils/toast.util';
import { ToastTypeEnum } from '@/src/models/enum-models/ToastTypeEnum';

// ── Types ─────────────────────────────────────────────────────────────────────

type Stage = 'upload' | 'classify' | 'intent' | 'plan' | 'render' | 'preview' | 'cleanup' | 'publish';
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
  const chatEndRef = useRef<HTMLDivElement>(null);

  const [stage, setStage] = useState<Stage>('upload');
  const [adjustField, setAdjustField] = useState<AdjustField | null>(null);

  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [videoPreviewUrl, setVideoPreviewUrl] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  const [classification, setClassification] = useState<Classification>('talking_head');
  const [plan, setPlan] = useState<VideoPlan | null>(null);

  const [jobId, setJobId] = useState<string | null>(null);
  const [renderStatus, setRenderStatus] = useState('pending');
  const [renderProgress, setRenderProgress] = useState(0);
  const [outputUrl, setOutputUrl] = useState<string | null>(null);
  const [renderError, setRenderError] = useState<string | null>(null);

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

  const acceptFile = useCallback(
    (file: File) => {
      const OK = ['video/mp4', 'video/quicktime', 'video/webm', 'video/x-m4v'];
      if (!OK.includes(file.type) && !/\.(mp4|mov|webm|m4v)$/i.test(file.name)) {
        ToastService.showToast('Please upload an MP4 or MOV video.', ToastTypeEnum.Error);
        return;
      }
      if (file.size > 500 * 1024 * 1024) {
        ToastService.showToast('File too large. Max 500 MB.', ToastTypeEnum.Error);
        return;
      }
      setVideoFile(file);
      setVideoPreviewUrl(URL.createObjectURL(file));
      addMsg('user', `"${file.name}"`);
      setStage('classify');
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
    setStage('render');
    setRenderProgress(5);
    setRenderStatus('pending');

    const fd = new FormData();
    fd.append('video', videoFile);
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
      setJobId(id);
      startPolling(id);
    } catch (err) {
      setRenderError(err instanceof Error ? err.message : 'Upload failed');
      setStage('preview');
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
    if (videoPreviewUrl) URL.revokeObjectURL(videoPreviewUrl);
    setStage('upload');
    setVideoFile(null);
    setVideoPreviewUrl(null);
    setPlan(null);
    setJobId(null);
    setOutputUrl(null);
    setRenderError(null);
    setRenderProgress(0);
    setRenderStatus('pending');
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
              const f = e.dataTransfer.files[0];
              if (f) acceptFile(f);
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
            <div style={{ fontSize: 12, color: GRAY, marginTop: 4 }}>MP4, MOV, WebM · up to 500 MB</div>
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
            accept="video/mp4,video/quicktime,video/webm,video/x-m4v,.mp4,.mov,.webm,.m4v"
            style={{ display: 'none' }}
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) acceptFile(f);
              e.target.value = '';
            }}
          />
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
          <JaneBubble text="Got it — looks like this is you talking to camera. Right?" />
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 10 }}>
            <TapBtn
              label="Yes, that's me talking"
              onClick={() => handleClassify('talking_head', "Yes, that's me talking")}
            />
            <TapBtn label="No, it's my product" onClick={() => handleClassify('product', "No, it's my product")} />
            <TapBtn label="Both" onClick={() => handleClassify('mixed', 'Both — speech and product')} />
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
              {STATUS_LABEL[renderStatus] ?? 'Working on it…'}
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
                label: 'Caption text',
                desc: 'Edit specific words or lines',
                fn: () => {
                  addMsg('user', 'Caption text');
                  addMsg(
                    'jane',
                    'Caption editing is available in the "Produce my video" tab where you can click individual words. Head there with your video URL ready.'
                  );
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
