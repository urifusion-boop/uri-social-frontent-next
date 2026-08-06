'use client';

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { SocialMediaAgentService, MultiClipJob, MultiClipClip } from '@/src/api/SocialMediaAgentService';
import { ToastService } from '@/src/utils/toast.util';
import { ToastTypeEnum } from '@/src/models/enum-models/ToastTypeEnum';
import { probeVideoDuration, estimateVideoCost, VideoCostEstimate } from '@/src/utils/videoBilling';
import { useVideoBillingStatus } from '@/src/hooks/useVideoBillingStatus';
import VideoCostPreview from '@/src/components/app/workspace/VideoCostPreview';
import { EventBus, EVENTS } from '@/src/services/EventBus';
import { BrandTooltip } from '@/src/components/app/workspace/BrandTooltip';

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
type AdjustField = 'style' | 'captions' | 'trim' | 'broll' | 'music' | 'hookText' | 'length' | 'format';

interface StyleTemplate {
  id: string;
  name: string;
  tagline: string;
  bg: string;
  accent: string;
  previewGif?: string;
}

interface VideoPlan {
  classification: Classification;
  purpose: Purpose;
  style: StyleTemplate;
  captionsEnabled: boolean;
  removeSilence: boolean;
  removeFiller: boolean;
  brollEnabled: boolean;
  brollDensity: 'light' | 'moderate' | 'heavy';
  musicEnabled: boolean;
  musicSource: 'upload' | 'auto';
  muteOriginalAudio: boolean;
  hookTextEnabled: boolean;
  hookTextCustom: string;
  hookTextColor: string;
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
  isMobile?: boolean;
}

// ── Style templates ───────────────────────────────────────────────────────────
// Visual palette assigned by index to real ZapCap templates fetched at runtime

const TEMPLATE_PALETTE: Array<{ bg: string; accent: string }> = [
  { bg: 'linear-gradient(135deg, #1A1A2E 0%, #E94560 100%)', accent: '#E94560' },
  { bg: 'linear-gradient(135deg, #0F3460 0%, #533483 100%)', accent: '#7C5CBF' },
  { bg: 'linear-gradient(135deg, #2C3E50 0%, #E67E22 100%)', accent: '#E67E22' },
  { bg: 'linear-gradient(135deg, #010101 0%, #69C9D0 100%)', accent: '#69C9D0' },
  { bg: 'linear-gradient(135deg, #134E4A 0%, #34D399 100%)', accent: '#34D399' },
  { bg: 'linear-gradient(135deg, #1E1B4B 0%, #818CF8 100%)', accent: '#818CF8' },
];

const PLACEHOLDER_STYLE: StyleTemplate = {
  id: '',
  name: 'Loading…',
  tagline: '',
  bg: TEMPLATE_PALETTE[0].bg,
  accent: TEMPLATE_PALETTE[0].accent,
};

function defaultPlan(c: Classification, p: Purpose): VideoPlan {
  const isTalking = c !== 'product';
  return {
    classification: c,
    purpose: p,
    style: PLACEHOLDER_STYLE,
    captionsEnabled: isTalking,
    removeSilence: isTalking,
    removeFiller: isTalking,
    brollEnabled: p === 'sell',
    brollDensity: 'light',
    musicEnabled: false,
    musicSource: 'upload',
    muteOriginalAudio: false,
    hookTextEnabled: false,
    hookTextCustom: '',
    hookTextColor: '#ffffff',
    targetLength: 'auto',
    aspectRatio: '9:16',
  };
}

// ── Tokens ────────────────────────────────────────────────────────────────────

const PINK = '#CD1B78';
const LIGHT_PINK = '#FFF0F7';
const GRAY = '#6B7280';
const BORDER = '#E5E7EB';

const QUALITY_FLAG_LABEL: Record<string, string> = {
  too_dark: 'Too dark',
  too_short: 'Too short',
  too_quiet: 'Too quiet',
  pre_edited: 'Pre-edited',
  upload_failed: 'Upload failed',
};

const SESSION_KEY = 'uri:janevideo:session';

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

function InfoDot({ text }: { text: string }) {
  return (
    <BrandTooltip title={text} arrow placement="top">
      <span
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: 14,
          height: 14,
          borderRadius: '50%',
          border: `1.3px solid ${GRAY}`,
          color: GRAY,
          fontSize: 9,
          fontWeight: 700,
          fontStyle: 'italic',
          lineHeight: 1,
          cursor: 'help',
          flexShrink: 0,
          marginLeft: 4,
        }}
      >
        i
      </span>
    </BrandTooltip>
  );
}

function PlanRow({
  label,
  value,
  field,
  onAdjust,
  disabled = false,
  tooltip,
}: {
  label: string;
  value: string;
  field: AdjustField;
  onAdjust: (f: AdjustField) => void;
  disabled?: boolean;
  tooltip?: string;
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
      <span style={{ fontSize: 13, color: '#374151', flex: 1, display: 'flex', alignItems: 'center' }}>
        <span style={{ color: GRAY, fontSize: 12, marginRight: 6 }}>{label}</span>
        {value}
        {tooltip && <InfoDot text={tooltip} />}
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
            padding: '13px 10px',
            margin: '-13px -10px',
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
  if (style.previewGif) {
    return (
      <img
        src={style.previewGif}
        alt={style.name}
        style={{
          width: 56,
          height: 80,
          borderRadius: 6,
          objectFit: 'cover',
          flexShrink: 0,
          display: 'block',
        }}
      />
    );
  }
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
  styleTemplates,
  isMobile = false,
  musicFile,
  onMusicFileChange,
}: {
  field: AdjustField;
  plan: VideoPlan;
  onApply: (patch: Partial<VideoPlan>, closePanel?: boolean) => void;
  onCancel: () => void;
  styleTemplates: StyleTemplate[];
  isMobile?: boolean;
  musicFile: File | null;
  onMusicFileChange: (f: File | null) => void;
}) {
  const musicInputRef = useRef<HTMLInputElement>(null);

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
        padding: '12px 14px',
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
          styleTemplates.map((s) => (
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
            {opt('On', plan.captionsEnabled, () => onApply({ captionsEnabled: true }))}
            {opt(
              'Off',
              !plan.captionsEnabled,
              () => onApply({ captionsEnabled: false }),
              plan.classification === 'product' ? 'No speech detected' : undefined
            )}
          </>
        );

      case 'hookText':
        return (
          <div>
            {section(
              'Hook text',
              <>
                {opt('On', plan.hookTextEnabled, () => onApply({ hookTextEnabled: true }))}
                {opt('Off', !plan.hookTextEnabled, () => onApply({ hookTextEnabled: false, hookTextCustom: '' }))}
              </>
            )}
            {plan.hookTextEnabled && (
              <div style={{ marginTop: 10 }}>
                <SectionLabel text="Text (optional — leave blank for AI-generated)" />
                <input
                  type="text"
                  value={plan.hookTextCustom}
                  onChange={(e) => onApply({ hookTextCustom: e.target.value }, false)}
                  placeholder="e.g. You record, we do the rest"
                  maxLength={60}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    borderRadius: 8,
                    border: `1.5px solid ${BORDER}`,
                    fontSize: 13,
                    fontFamily: 'inherit',
                  }}
                />
              </div>
            )}
            {plan.hookTextEnabled && (
              <div style={{ marginTop: 14 }}>
                <SectionLabel text="Text color" />
                <div style={{ display: 'flex', gap: 8 }}>
                  {[
                    { label: 'White', value: '#ffffff' },
                    { label: 'Black', value: '#000000' },
                    { label: 'Pink', value: '#CD1B78' },
                    { label: 'Yellow', value: '#FACC15' },
                  ].map((c) => (
                    <button
                      key={c.value}
                      onClick={() => onApply({ hookTextColor: c.value })}
                      title={c.label}
                      style={{
                        width: 32,
                        height: 32,
                        borderRadius: '50%',
                        background: c.value,
                        border: plan.hookTextColor === c.value ? `2.5px solid ${PINK}` : `1.5px solid ${BORDER}`,
                        cursor: 'pointer',
                        padding: 0,
                        boxShadow: c.value === '#ffffff' ? 'inset 0 0 0 1px #E5E7EB' : 'none',
                      }}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
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
        return (
          <div>
            {section(
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
            )}
            <div
              style={{
                marginTop: 14,
                padding: '10px 12px',
                borderRadius: 8,
                background: '#F9FAFB',
                border: `1px solid ${BORDER}`,
                fontSize: 12,
                color: GRAY,
                lineHeight: 1.5,
              }}
            >
              Want to use your own clips? Render first, then tap{' '}
              <span style={{ fontWeight: 600, color: '#374151' }}>Fix Something → B-roll → Upload my own clips</span> to
              place them against your transcript.
            </div>
          </div>
        );

      case 'music':
        return (
          <div>
            {section(
              'Music',
              <>
                {opt('No music', !plan.musicEnabled, () => {
                  onMusicFileChange(null);
                  onApply({ musicEnabled: false });
                })}
                {opt('Upload your own', plan.musicEnabled && plan.musicSource === 'upload', () =>
                  onApply({ musicEnabled: true, musicSource: 'upload' })
                )}
                {opt('Auto-pick for me', plan.musicEnabled && plan.musicSource === 'auto', () => {
                  onMusicFileChange(null);
                  onApply({ musicEnabled: true, musicSource: 'auto' });
                })}
              </>
            )}

            {plan.musicEnabled && plan.musicSource === 'upload' && (
              <div style={{ marginTop: 14 }}>
                <SectionLabel text="Upload your own track" />
                {musicFile ? (
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 8,
                      padding: '10px 14px',
                      borderRadius: 9,
                      border: `1.5px solid ${PINK}`,
                      background: LIGHT_PINK,
                    }}
                  >
                    <span style={{ fontSize: 13, color: PINK, fontWeight: 600, flex: 1, minWidth: 0 }}>
                      🎵 {musicFile.name}
                    </span>
                    <button
                      onClick={() => onMusicFileChange(null)}
                      style={{
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        color: GRAY,
                        fontSize: 16,
                        padding: 12,
                        margin: -12,
                        flexShrink: 0,
                      }}
                    >
                      ×
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => musicInputRef.current?.click()}
                    style={{
                      padding: '12px 14px',
                      borderRadius: 9,
                      border: `1.5px solid ${BORDER}`,
                      background: '#fff',
                      color: '#374151',
                      fontSize: 13,
                      fontWeight: 600,
                      cursor: 'pointer',
                      width: '100%',
                      textAlign: 'left',
                    }}
                  >
                    + Upload MP3
                  </button>
                )}
                <input
                  ref={musicInputRef}
                  type="file"
                  accept="audio/mpeg,audio/mp3,.mp3"
                  style={{ display: 'none' }}
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (!f) return;
                    if (f.size > 50 * 1024 * 1024) {
                      ToastService.showToast('MP3 must be under 50MB.', ToastTypeEnum.Error);
                      return;
                    }
                    onMusicFileChange(f);
                    onApply({ musicEnabled: true, musicSource: 'upload' });
                    e.target.value = '';
                  }}
                />
              </div>
            )}

            {plan.musicEnabled && (
              <div style={{ marginTop: 14 }}>
                {section(
                  'Voice',
                  <>
                    {opt('Keep my voice, music underneath', !plan.muteOriginalAudio, () =>
                      onApply({ muteOriginalAudio: false })
                    )}
                    {opt('Mute my voice, just play music', plan.muteOriginalAudio, () =>
                      onApply({ muteOriginalAudio: true })
                    )}
                  </>
                )}
              </div>
            )}
          </div>
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

export default function JaneVideoChat({ onSaveToDrafts, isMobile = false }: Props) {
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
  const [costEstimate, setCostEstimate] = useState<VideoCostEstimate | null>(null);
  const billingStatus = useVideoBillingStatus();
  const insufficientCredits =
    !billingStatus.isTrial &&
    costEstimate !== null &&
    billingStatus.creditsRemaining !== null &&
    billingStatus.creditsRemaining < costEstimate.creditsRequired;

  // Video Editing Billing PRD FR-04: probe whichever source will actually be
  // rendered (the stitched composition takes priority over the raw upload,
  // matching handleRender's own precedence) so the plan-stage cost preview
  // reflects what's really about to be billed.
  useEffect(() => {
    const source = stitchedUrl || videoFile;
    if (!source) {
      setCostEstimate(null);
      return;
    }
    let cancelled = false;
    probeVideoDuration(source).then((duration) => {
      if (!cancelled && duration !== null) setCostEstimate(estimateVideoCost(duration, billingStatus.ratePerMinute));
    });
    return () => {
      cancelled = true;
    };
  }, [stitchedUrl, videoFile]);

  const [classification, setClassification] = useState<Classification>('talking_head');
  const [plan, setPlan] = useState<VideoPlan | null>(null);

  const [renderStatus, setRenderStatus] = useState('pending');
  const [renderProgress, setRenderProgress] = useState(0);
  const [outputUrl, setOutputUrl] = useState<string | null>(null);
  const [renderError, setRenderError] = useState<string | null>(null);
  const [isSilenceCutting, setIsSilenceCutting] = useState(false);

  const [zapCapJobId, setZapCapJobId] = useState<string | null>(null);
  const [composeJobId, setComposeJobId] = useState<string | null>(null);
  // Populated when a multi-clip job hits 'awaiting_order' — pauses handleStitch
  // so the user can review/reorder/drop clips before the actual stitch runs.
  const [reviewJob, setReviewJob] = useState<MultiClipJob | null>(null);
  const [reviewBusyClipId, setReviewBusyClipId] = useState<string | null>(null);
  const [captionWords, setCaptionWords] = useState<CaptionWord[]>([]);
  const [captionEdits, setCaptionEdits] = useState<Record<string, string>>({});
  const [editingWordId, setEditingWordId] = useState<string | null>(null);
  const [loadingTranscript, setLoadingTranscript] = useState(false);
  const [isRerendering, setIsRerendering] = useState(false);

  const [brollConvStep, setBrollConvStep] = useState<BrollConvStep>('choose');
  const [brollClips, setBrollClips] = useState<BrollClipEntry[]>([]);
  const [brollPlacements, setBrollPlacements] = useState<BrollPlacement[]>([]);
  const [isApplyingBroll, setIsApplyingBroll] = useState(false);
  const brollInputRef = useRef<HTMLInputElement>(null);

  // Custom background music — not part of VideoPlan since a File can't survive
  // the session-persistence JSON round-trip (same reason videoFile/videoFiles
  // are kept outside the plan too).
  const [musicFile, setMusicFile] = useState<File | null>(null);

  const [history, setHistory] = useState<HistMsg[]>([]);
  const [zapCapTemplates, setZapCapTemplates] = useState<
    {
      id: string;
      name: string;
      previews?: { previewGif?: string; previewMp4?: string };
    }[]
  >([]);

  // Map real ZapCap templates to visual StyleTemplate objects (palette by index)
  const styledTemplates = useMemo<StyleTemplate[]>(
    () =>
      zapCapTemplates.map((t, i) => ({
        id: t.id,
        name: t.name,
        tagline: '',
        bg: TEMPLATE_PALETTE[i % TEMPLATE_PALETTE.length].bg,
        accent: TEMPLATE_PALETTE[i % TEMPLATE_PALETTE.length].accent,
        previewGif: t.previews?.previewGif,
      })),
    [zapCapTemplates]
  );

  // Fallback: if templates finish loading after the intent was already chosen,
  // upgrade plan.style from the placeholder to the first real template
  useEffect(() => {
    if (styledTemplates.length > 0) {
      setPlan((prev) => {
        if (!prev || prev.style.id !== '') return prev;
        return { ...prev, style: styledTemplates[0] };
      });
    }
  }, [styledTemplates]);

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
    // Apply the first real ZapCap template immediately if already loaded
    if (styledTemplates.length > 0) {
      p.style = styledTemplates[0];
    }
    setPlan(p);

    // Pushback: captions requested on silent footage
    if (classification === 'product') {
      addMsg(
        'jane',
        "There's no speech in this clip, so I've turned captions off — there's nothing to caption. I've added text-on-screen instead. Since it's silent, you'll probably want background music — upload a track in the Music option below. You can change anything else in the plan too."
      );
    }

    setStage('plan');
  };

  // ── Plan adjustments ───────────────────────────────────────────────────────

  const applyAdjust = (patch: Partial<VideoPlan>, closePanel: boolean = true) => {
    setPlan((prev) => (prev ? { ...prev, ...patch } : null));
    if (closePanel) setAdjustField(null);
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
    pending: 'Getting things ready…',
    transcribing: 'Listening through your content…',
    transcriptionCompleted: 'Adding your captions and style…',
    rendering: 'Almost there — putting on the final touches…',
    completed: 'Your video is ready!',
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
          // Refunded server-side (Video Editing Billing PRD §refund-on-failure).
          EventBus.emit(EVENTS.CREDIT_CONSUMED, { amount: 0, operation: 'zapcap_produce_refund' });
        }
      } catch {
        // keep polling on blip
      }
    }, 6000);
  };

  // Shared multi-clip compose/stitch poll — used by both handleStitch and
  // handleCutSilences (and to resume an in-flight job after a page reload).
  const startComposePolling = (
    jobId: string,
    opts: {
      labelMap: Record<string, string>;
      progressMap: Record<string, number>;
      onReady: (outputUrl: string) => void | Promise<void>;
      onFailed: () => void;
      // When provided, polling pauses at 'awaiting_order' and hands the job
      // to the caller (clip review UI) instead of auto-stitching. Omit to
      // keep the old auto-stitch-immediately behavior.
      onAwaitingOrder?: (job: MultiClipJob) => void;
    }
  ) => {
    if (composePollRef.current) clearInterval(composePollRef.current);
    setComposeJobId(jobId);
    let hasStitched = false;

    composePollRef.current = setInterval(async () => {
      try {
        const res = await SocialMediaAgentService.getMultiClipJob(jobId);
        const job = res?.responseData;
        if (!job) return;

        setRenderStatus(opts.labelMap[job.status] ?? job.status_message ?? job.status);
        setRenderProgress(opts.progressMap[job.status] ?? 50);

        if (job.status === 'awaiting_order' && !hasStitched) {
          hasStitched = true;
          if (opts.onAwaitingOrder) {
            // Keep composeJobId set (rather than clearing it) so a page
            // reload during review can re-fetch and re-show this job.
            clearInterval(composePollRef.current!);
            opts.onAwaitingOrder(job);
            return;
          }
          await SocialMediaAgentService.stitchMultiClipJob(jobId);
        }

        if (job.status === 'ready' && job.output_url) {
          clearInterval(composePollRef.current!);
          setComposeJobId(null);
          await opts.onReady(job.output_url);
        } else if (job.status === 'failed') {
          clearInterval(composePollRef.current!);
          setComposeJobId(null);
          opts.onFailed();
        }
      } catch {
        // keep polling on blip
      }
    }, 6000);
  };

  // Multi-clip uploads are large and, on a slower/less stable mobile connection,
  // prone to a dropped connection mid-upload — with no server-side rejection
  // (no HTTP response at all) to explain it. Retry only that class of failure;
  // a real HTTP error from the server (4xx/5xx) means resending won't help.
  const startMultiClipJobWithRetry = async (
    fd: FormData,
    onRetry?: (attempt: number, maxAttempts: number) => void,
    maxAttempts = 3
  ): Promise<string> => {
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        const res = await SocialMediaAgentService.startMultiClipJob(fd);
        const id = res?.responseData?.job_id ?? '';
        if (!id) throw new Error('No job ID returned');
        return id;
      } catch (err) {
        const axiosErr = err as { response?: unknown };
        if (axiosErr?.response || attempt === maxAttempts) throw err;
        onRetry?.(attempt, maxAttempts);
        await new Promise((r) => setTimeout(r, 2000 * attempt));
      }
    }
    throw new Error('Upload failed');
  };

  const handleRender = async () => {
    if ((!videoFile && !stitchedUrl) || !plan) return;
    if (insufficientCredits) {
      ToastService.showToast('You do not have enough credits to edit this video.', ToastTypeEnum.Error);
      return;
    }
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
    const zapTemplate = plan?.style?.id || zapCapTemplates[0]?.id || 'beast';
    fd.append('template_id', zapTemplate);
    fd.append('language', 'en');
    fd.append('output_mode', 'composited');
    fd.append('quality', 'standard');
    fd.append('enable_broll', String(plan.brollEnabled && plan.classification !== 'product'));
    fd.append('caption_style', 'bold');
    const musicActive = plan.musicEnabled && (plan.musicSource === 'auto' || !!musicFile);
    fd.append('enable_music', String(musicActive));
    if (musicActive) {
      fd.append('music_source', plan.musicSource);
      if (plan.musicSource === 'upload' && musicFile) {
        fd.append('custom_music', musicFile);
      } else {
        fd.append('purpose', plan.purpose);
      }
      fd.append('mute_original_audio', String(plan.muteOriginalAudio));
    }
    fd.append('enable_hook_text', String(plan.hookTextEnabled));
    if (plan.hookTextEnabled) {
      if (plan.hookTextCustom.trim()) {
        fd.append('custom_hook_text', plan.hookTextCustom.trim());
      }
      fd.append('hook_text_color', plan.hookTextColor);
    }

    try {
      const res = await SocialMediaAgentService.produceWithZapCap(fd);
      const id = res?.responseData?.job_id;
      if (!id) throw new Error('No job ID returned');
      setZapCapJobId(id);
      setCaptionWords([]);
      setCaptionEdits({});
      // Charged synchronously inside POST /zapcap-produce, before this
      // response returns — mirrors ContentGeneratorForm's real-time update.
      EventBus.emit(EVENTS.CREDIT_CONSUMED, { amount: 1, operation: 'zapcap_produce' });
      startPolling(id);
    } catch (err) {
      const axiosErr = err as { response?: { status?: number; data?: { responseMessage?: string } } };
      if (axiosErr?.response?.status === 402) {
        // Video Editing Billing PRD §11: insufficient credits
        setRenderError(
          axiosErr.response?.data?.responseMessage || 'You do not have enough credits to edit this video.'
        );
      } else {
        setRenderError(err instanceof Error ? err.message : 'Upload failed');
      }
      setStage('preview');
    }
  };

  // ── Cut silences (compose pipeline) ───────────────────────────────────────

  const handleCutSilences = async () => {
    if (!videoFile && !stitchedUrl) return;
    addMsg('user', 'Cut silences, pauses & repetitions');
    // When called from Fix Something (zapCapJobId set), we'll re-run ZapCap after
    // cutting so captions + b-roll are preserved. Warn the user it takes longer.
    const willRerender = !!zapCapJobId;
    addMsg(
      'jane',
      willRerender
        ? "On it — I'll cut the silences then re-apply your captions and b-roll. About four minutes total."
        : "On it — I'll analyse the audio and cut every section where you're not speaking. Takes about two minutes."
    );
    setIsSilenceCutting(!willRerender);
    setOutputUrl(null);
    setRenderError(null);
    setRenderProgress(5);
    setRenderStatus('analyzing');
    setStage('render');

    // Step 1: start the multi-clip job (single clip, founder mode → runs silencedetect at ingest).
    // /multi-clip/start accepts either an uploaded file or a source_url. When the source is
    // a stitched multi-clip video (videoFile never set), pass stitchedUrl and let the backend
    // fetch it server-side — the browser can't fetch a third-party host directly (CSP).
    let jobId: string;
    try {
      const fd = new FormData();
      if (videoFile) {
        fd.append('clips', videoFile);
      } else if (stitchedUrl) {
        fd.append('source_url', stitchedUrl);
      }
      fd.append('story_type', 'founder');
      fd.append('target_duration', '0');
      fd.append('orientation', plan?.aspectRatio ?? '9:16');
      fd.append('enable_music', 'false');
      fd.append('music_mood', 'chill');
      fd.append('music_volume', '0');

      jobId = await startMultiClipJobWithRetry(fd, (attempt, max) => {
        setRenderStatus(`Upload dropped — retrying (${attempt}/${max - 1})…`);
      });
    } catch (err) {
      setRenderError(err instanceof Error ? err.message : 'Upload failed');
      setStage('preview');
      return;
    }

    // Step 2: poll until ingest finishes (awaiting_order), then auto-stitch
    startComposePolling(jobId, {
      labelMap: {
        analyzing: 'Analysing audio…',
        awaiting_order: 'Audio analysed — cutting silences…',
        stitching: 'Stitching edited video…',
        ready: 'Done!',
        failed: 'Something went wrong',
      },
      progressMap: {
        analyzing: 30,
        awaiting_order: 60,
        stitching: 80,
        ready: 100,
        failed: 0,
      },
      onReady: async (outputUrl) => {
        if (willRerender) {
          // Fix Something path — pipe the silence-cut URL back through ZapCap
          // so captions and b-roll are re-applied on the tighter edit.
          addMsg('jane', 'Silences cut — re-applying captions and b-roll…');
          setRenderProgress(5);
          setRenderStatus('pending');
          const fd2 = new FormData();
          fd2.append('source_url', outputUrl);
          fd2.append('template_id', plan?.style?.id || zapCapTemplates[0]?.id || 'beast');
          fd2.append('language', 'en');
          fd2.append('output_mode', 'composited');
          fd2.append('quality', 'standard');
          fd2.append('enable_broll', String(plan?.brollEnabled ?? false));
          fd2.append('enable_music', 'false');
          try {
            const res = await SocialMediaAgentService.produceWithZapCap(fd2);
            const newId = res?.responseData?.job_id;
            if (!newId) throw new Error('No job ID');
            setZapCapJobId(newId);
            setCaptionWords([]);
            setCaptionEdits({});
            // Charged synchronously inside POST /zapcap-produce, before this
            // response returns — mirrors ContentGeneratorForm's real-time update.
            EventBus.emit(EVENTS.CREDIT_CONSUMED, { amount: 1, operation: 'zapcap_produce' });
            startPolling(newId);
          } catch (err) {
            // ZapCap failed — fall back to the raw silence-cut video
            setIsSilenceCutting(true);
            setOutputUrl(outputUrl);
            const axiosErr = err as { response?: { status?: number } };
            addMsg(
              'jane',
              axiosErr?.response?.status === 402
                ? // Video Editing Billing PRD §11: insufficient credits
                  "Silences cut, but you don't have enough credits to re-apply captions — showing the cut version."
                : "Silences cut, but couldn't re-apply captions — showing the cut version."
            );
            setStage('preview');
          }
        } else {
          setOutputUrl(outputUrl);
          addMsg('jane', "Done. Here's the version with silences cut 👇");
          setStage('preview');
        }
      },
      onFailed: () => {
        setRenderError('Silence cutting failed — try again.');
        setStage('preview');
      },
    });
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

    let jobId: string;
    try {
      jobId = await startMultiClipJobWithRetry(fd, (attempt, max) => {
        setRenderStatus(`Upload dropped — retrying (${attempt}/${max - 1})…`);
      });
    } catch (err) {
      setRenderError(err instanceof Error ? err.message : 'Upload failed');
      setRenderStatus('failed');
      return;
    }

    startComposePolling(jobId, {
      labelMap: {
        analyzing: 'Analysing clips…',
        awaiting_order: 'Combining clips…',
        stitching: 'Stitching…',
        ready: 'Done!',
        failed: 'Something went wrong',
      },
      progressMap: {
        analyzing: 30,
        awaiting_order: 55,
        stitching: 80,
        ready: 100,
        failed: 0,
      },
      onReady: (outputUrl) => {
        setStitchedUrl(outputUrl);
        setVideoFiles([]);
        addMsg('jane', 'Clips merged. Now tell me a bit about this video:');
        setStage('classify');
      },
      onFailed: () => {
        setRenderError('Stitch failed — try again.');
        setRenderStatus('failed');
      },
      onAwaitingOrder: (job) => {
        setReviewJob(job);
        addMsg('jane', "I've looked over your clips — check the order and flag anything before I stitch them.");
      },
    });
  };

  // Called once the user confirms the clip order/drops/positions in the
  // review step — moves the job from awaiting_order into actual stitching.
  const continueStitchAfterReview = async () => {
    if (!reviewJob) return;
    const jobId = reviewJob.job_id;
    setReviewJob(null);
    setRenderProgress(60);
    setRenderStatus('Stitching…');
    try {
      await SocialMediaAgentService.stitchMultiClipJob(jobId);
    } catch {
      setRenderError('Stitch failed — try again.');
      setRenderStatus('failed');
      return;
    }
    startComposePolling(jobId, {
      labelMap: {
        stitching: 'Stitching…',
        ready: 'Done!',
        failed: 'Something went wrong',
      },
      progressMap: { stitching: 80, ready: 100, failed: 0 },
      onReady: (outputUrl) => {
        setStitchedUrl(outputUrl);
        setVideoFiles([]);
        addMsg('jane', 'Clips merged. Now tell me a bit about this video:');
        setStage('classify');
      },
      onFailed: () => {
        setRenderError('Stitch failed — try again.');
        setRenderStatus('failed');
      },
    });
  };

  // ── Clip review actions (reorder / drop / crop position) ──────────────────

  const moveReviewClip = async (clipId: string, direction: -1 | 1) => {
    if (!reviewJob) return;
    const activeClips = reviewJob.clips.filter((c) => !c.dropped).sort((a, b) => a.order_index - b.order_index);
    const idx = activeClips.findIndex((c) => c.clip_id === clipId);
    const swapIdx = idx + direction;
    if (idx === -1 || swapIdx < 0 || swapIdx >= activeClips.length) return;
    const reordered = [...activeClips];
    [reordered[idx], reordered[swapIdx]] = [reordered[swapIdx], reordered[idx]];
    const newOrderIds = reordered.map((c) => c.clip_id);
    const orderIndexById = new Map(newOrderIds.map((id, i) => [id, i]));
    setReviewJob({
      ...reviewJob,
      clips: reviewJob.clips.map((c) =>
        orderIndexById.has(c.clip_id) ? { ...c, order_index: orderIndexById.get(c.clip_id)! } : c
      ),
    });
    try {
      await SocialMediaAgentService.reorderMultiClipJob(reviewJob.job_id, newOrderIds);
    } catch {
      ToastService.showToast('Could not save the new order — try again.', ToastTypeEnum.Error);
    }
  };

  const toggleDropReviewClip = async (clipId: string, dropped: boolean) => {
    if (!reviewJob) return;
    setReviewBusyClipId(clipId);
    setReviewJob({
      ...reviewJob,
      clips: reviewJob.clips.map((c) => (c.clip_id === clipId ? { ...c, dropped } : c)),
    });
    try {
      await SocialMediaAgentService.dropMultiClip(reviewJob.job_id, clipId, dropped);
    } catch {
      ToastService.showToast('Could not update that clip — try again.', ToastTypeEnum.Error);
    } finally {
      setReviewBusyClipId(null);
    }
  };

  const setReviewClipPosition = async (clipId: string, position: 'left' | 'center' | 'right') => {
    if (!reviewJob) return;
    setReviewJob({
      ...reviewJob,
      clips: reviewJob.clips.map((c) => (c.clip_id === clipId ? { ...c, subject_position: position } : c)),
    });
    try {
      await SocialMediaAgentService.updateClipPosition(reviewJob.job_id, clipId, position);
    } catch {
      ToastService.showToast('Could not update crop position — try again.', ToastTypeEnum.Error);
    }
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
        template_id: plan?.style?.id || zapCapTemplates[0]?.id || 'beast',
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
        template_id: plan?.style?.id || zapCapTemplates[0]?.id || 'beast',
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
        template_id: plan?.style?.id || zapCapTemplates[0]?.id || 'beast',
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
            end_time: p.startTime + p.duration,
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
      clearSession();
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
    setComposeJobId(null);
    setCaptionWords([]);
    setCaptionEdits({});
    setEditingWordId(null);
    setBrollConvStep('choose');
    setBrollClips([]);
    setBrollPlacements([]);
    setMusicFile(null);
    setHistory([]);
    setClassification('talking_head');
    setAdjustField(null);
    setPublishPlatforms([]);
    setPublishCaption('');
    clearSession();
  };

  // ── Session persistence (survive a refresh/reload mid-flow) ───────────────
  // Same localStorage idiom as MultiClipComposer.tsx / VideoStoryboardGenerator.tsx:
  // save on change, restore on mount, resume any in-flight job by its id.

  const clearSession = () => {
    try {
      localStorage.removeItem(SESSION_KEY);
    } catch {
      /* ignore */
    }
  };

  useEffect(() => {
    if (stage === 'upload') return; // nothing submitted yet — nothing worth saving
    try {
      localStorage.setItem(
        SESSION_KEY,
        JSON.stringify({
          stage,
          plan,
          stitchedUrl,
          zapCapJobId,
          composeJobId,
          captionWords,
          captionEdits,
          brollConvStep,
          brollPlacements,
          history,
          publishPlatforms,
          publishCaption,
          outputUrl,
          renderStatus,
          renderProgress,
          classification,
          adjustField,
        })
      );
    } catch {
      /* quota */
    }
  }, [
    stage,
    plan,
    stitchedUrl,
    zapCapJobId,
    composeJobId,
    captionWords,
    captionEdits,
    brollConvStep,
    brollPlacements,
    history,
    publishPlatforms,
    publishCaption,
    outputUrl,
    renderStatus,
    renderProgress,
    classification,
    adjustField,
  ]);

  // Restore on mount — runs once, before the templates-fetch/cleanup effect below
  // has any bearing on this. Only resumes a session that got past raw upload and
  // isn't already a dead end.
  useEffect(() => {
    try {
      const raw = localStorage.getItem(SESSION_KEY);
      if (!raw) return;
      const saved = JSON.parse(raw) as {
        stage: Stage;
        plan: VideoPlan | null;
        stitchedUrl: string | null;
        zapCapJobId: string | null;
        composeJobId: string | null;
        captionWords: CaptionWord[];
        captionEdits: Record<string, string>;
        brollConvStep: BrollConvStep;
        brollPlacements: BrollPlacement[];
        history: HistMsg[];
        publishPlatforms: string[];
        publishCaption: string;
        outputUrl: string | null;
        renderStatus: string;
        renderProgress: number;
        classification: Classification;
        adjustField: AdjustField | null;
      };
      if (!saved?.stage || saved.stage === 'upload') {
        clearSession();
        return;
      }

      setStage(saved.stage);
      setPlan(saved.plan ?? null);
      setStitchedUrl(saved.stitchedUrl ?? null);
      setZapCapJobId(saved.zapCapJobId ?? null);
      setCaptionWords(saved.captionWords ?? []);
      setCaptionEdits(saved.captionEdits ?? {});
      setBrollConvStep(saved.brollConvStep ?? 'choose');
      setBrollPlacements(saved.brollPlacements ?? []);
      setHistory(saved.history ?? []);
      setPublishPlatforms(saved.publishPlatforms ?? []);
      setPublishCaption(saved.publishCaption ?? '');
      setOutputUrl(saved.outputUrl ?? null);
      setRenderStatus(saved.renderStatus ?? 'pending');
      setRenderProgress(saved.renderProgress ?? 0);
      setClassification(saved.classification ?? 'talking_head');
      setAdjustField(saved.adjustField ?? null);

      // Resume whichever job was in flight, if any.
      if (saved.composeJobId && saved.stage === 'stitch') {
        startComposePolling(saved.composeJobId, {
          labelMap: {
            analyzing: 'Analysing clips…',
            awaiting_order: 'Combining clips…',
            stitching: 'Stitching…',
            ready: 'Done!',
            failed: 'Something went wrong',
          },
          progressMap: { analyzing: 30, awaiting_order: 55, stitching: 80, ready: 100, failed: 0 },
          onReady: (outputUrl) => {
            setStitchedUrl(outputUrl);
            addMsg('jane', 'Clips merged. Now tell me a bit about this video:');
            setStage('classify');
          },
          onFailed: () => {
            setRenderError('Stitch failed — try again.');
            setRenderStatus('failed');
          },
          onAwaitingOrder: (job) => {
            setReviewJob(job);
          },
        });
      } else if (saved.zapCapJobId && saved.stage === 'render') {
        startPolling(saved.zapCapJobId);
      }
    } catch {
      clearSession();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Active panel for current stage ────────────────────────────────────────

  const planLabels = plan
    ? {
        captionLabel: plan.captionsEnabled ? 'on' : 'off',
        trimLabel:
          plan.removeSilence && plan.removeFiller
            ? 'cut pauses and filler'
            : plan.removeSilence
              ? 'cut pauses only'
              : plan.removeFiller
                ? 'cut filler only'
                : 'no trimming',
        brollLabel: !plan.brollEnabled ? 'off' : `on · ${plan.brollDensity}`,
        musicLabel: !plan.musicEnabled
          ? 'none'
          : plan.musicSource === 'auto'
            ? plan.muteOriginalAudio
              ? 'AI-picked, replacing your voice'
              : 'AI-picked, under your voice'
            : plan.muteOriginalAudio
              ? 'your track, replacing your voice'
              : 'your track, under your voice',
        hookTextLabel: !plan.hookTextEnabled ? 'off' : plan.hookTextCustom ? 'custom text' : 'AI-generated',
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
            <div style={{ display: 'flex', gap: 8, marginTop: 10, flexWrap: 'wrap' }}>
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

      // Clip review — paused at awaiting_order so the user can reorder/drop/
      // flag clips before the actual stitch runs.
      if (reviewJob) {
        const clips = [...reviewJob.clips].sort((a, b) => a.order_index - b.order_index);
        const activeClips = clips.filter((c) => !c.dropped);
        const posPill = (clip: MultiClipClip, pos: 'left' | 'center' | 'right') => {
          const active = (clip.subject_position ?? 'center') === pos;
          return (
            <button
              key={pos}
              onClick={() => setReviewClipPosition(clip.clip_id, pos)}
              style={{
                padding: '4px 10px',
                borderRadius: 20,
                border: `1.3px solid ${active ? PINK : BORDER}`,
                background: active ? LIGHT_PINK : '#fff',
                color: active ? PINK : GRAY,
                fontSize: 11,
                fontWeight: 600,
                cursor: 'pointer',
                textTransform: 'capitalize',
              }}
            >
              {pos}
            </button>
          );
        };
        return (
          <div>
            <JaneBubble text="Here's what I found in your clips — reorder, drop, or flag anything before I stitch them together." />
            <div
              style={{
                background: '#fff',
                border: `1.5px solid ${BORDER}`,
                borderRadius: 12,
                padding: '4px 14px',
                marginTop: 10,
                marginBottom: 12,
              }}
            >
              {clips.map((clip, i) => {
                const activeIdx = activeClips.findIndex((c) => c.clip_id === clip.clip_id);
                return (
                  <div
                    key={clip.clip_id}
                    style={{
                      padding: '10px 0',
                      borderBottom: i < clips.length - 1 ? `1px solid ${BORDER}` : 'none',
                      opacity: clip.dropped ? 0.45 : 1,
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
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
                        {activeIdx === -1 ? '–' : activeIdx + 1}
                      </div>
                      <div
                        style={{
                          fontSize: 13,
                          color: '#374151',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                          flex: 1,
                        }}
                      >
                        {clip.filename}
                      </div>
                      {!clip.dropped && (
                        <>
                          <button
                            onClick={() => moveReviewClip(clip.clip_id, -1)}
                            disabled={activeIdx <= 0}
                            style={{
                              background: 'none',
                              border: `1px solid ${BORDER}`,
                              borderRadius: 6,
                              width: 24,
                              height: 24,
                              cursor: activeIdx <= 0 ? 'default' : 'pointer',
                              color: activeIdx <= 0 ? '#D1D5DB' : '#374151',
                              fontSize: 12,
                              flexShrink: 0,
                            }}
                          >
                            ↑
                          </button>
                          <button
                            onClick={() => moveReviewClip(clip.clip_id, 1)}
                            disabled={activeIdx === -1 || activeIdx >= activeClips.length - 1}
                            style={{
                              background: 'none',
                              border: `1px solid ${BORDER}`,
                              borderRadius: 6,
                              width: 24,
                              height: 24,
                              cursor: activeIdx >= activeClips.length - 1 ? 'default' : 'pointer',
                              color: activeIdx >= activeClips.length - 1 ? '#D1D5DB' : '#374151',
                              fontSize: 12,
                              flexShrink: 0,
                            }}
                          >
                            ↓
                          </button>
                        </>
                      )}
                      <button
                        onClick={() => toggleDropReviewClip(clip.clip_id, !clip.dropped)}
                        disabled={reviewBusyClipId === clip.clip_id}
                        style={{
                          background: 'none',
                          border: 'none',
                          color: clip.dropped ? PINK : GRAY,
                          fontSize: 12,
                          fontWeight: 600,
                          cursor: 'pointer',
                          padding: '6px 6px',
                          flexShrink: 0,
                        }}
                      >
                        {clip.dropped ? 'Restore' : 'Drop'}
                      </button>
                    </div>
                    {!clip.dropped && (clip.quality_flags?.length > 0 || clip.recommended_drop) && (
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 6, marginLeft: 30 }}>
                        {clip.quality_flags?.map((f) => (
                          <span
                            key={f}
                            style={{
                              fontSize: 10,
                              fontWeight: 600,
                              padding: '2px 8px',
                              borderRadius: 20,
                              background: '#FEF3C7',
                              color: '#92400E',
                            }}
                          >
                            {QUALITY_FLAG_LABEL[f] ?? f}
                          </span>
                        ))}
                        {clip.recommended_drop && (
                          <span
                            style={{
                              fontSize: 10,
                              fontWeight: 600,
                              padding: '2px 8px',
                              borderRadius: 20,
                              background: '#FEE2E2',
                              color: '#991B1B',
                            }}
                          >
                            Recommend dropping{clip.drop_reason ? ` — ${clip.drop_reason}` : ''}
                          </span>
                        )}
                      </div>
                    )}
                    {!clip.dropped && (
                      <div style={{ display: 'flex', gap: 6, marginTop: 8, marginLeft: 30 }}>
                        {(['left', 'center', 'right'] as const).map((pos) => posPill(clip, pos))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
            {activeClips.length === 0 ? (
              <div style={{ fontSize: 12, color: GRAY, marginBottom: 10 }}>
                Restore at least one clip before continuing.
              </div>
            ) : null}
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <TapBtn
                label="Stitch & continue"
                primary
                onClick={() => {
                  if (activeClips.length === 0) return;
                  continueStitchAfterReview();
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
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
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
          {(stitchedUrl || videoPreviewUrl) && (
            <video
              // Prefer the actual stitched output once it exists — videoPreviewUrl is only
              // ever the raw first clip (set before stitching even starts), so for a
              // multi-clip upload it never reflected the real merged result.
              src={stitchedUrl || videoPreviewUrl!}
              style={{
                width: '100%',
                maxHeight: 140,
                objectFit: 'cover',
                borderRadius: 10,
                marginBottom: 12,
                background: '#000',
              }}
              // This is just a glance-preview, not something to scrub through — autoplaying
              // muted+loop forces mobile Safari to actually paint a frame immediately.
              // Relying on preload="metadata" + controls alone leaves it blank on iOS until
              // playback starts, since it won't reliably auto-generate a poster frame.
              muted
              playsInline
              autoPlay
              loop
              preload="auto"
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
            <AdjustPanel
              field={adjustField}
              plan={plan}
              onApply={applyAdjust}
              onCancel={() => setAdjustField(null)}
              styleTemplates={styledTemplates}
              isMobile={isMobile}
              musicFile={musicFile}
              onMusicFileChange={setMusicFile}
            />
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
                <div style={{ fontSize: 12, color: GRAY, display: 'flex', alignItems: 'center' }}>
                  Style
                  <InfoDot text="The caption look and pacing your video is edited with. Change it to try a different visual feel without redoing your plan." />
                </div>
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
                  padding: '13px 10px',
                  margin: '-13px -10px',
                  flexShrink: 0,
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
              tooltip="Burned-in subtitles synced to your speech. Off by default for silent product videos since there's no speech to caption."
            />
            <PlanRow
              label="Trim"
              value={planLabels.trimLabel}
              field="trim"
              onAdjust={setAdjustField}
              disabled={plan.classification === 'product'}
              tooltip="Automatically cuts out dead air, long pauses, and filler words like 'um' so your video stays tight."
            />
            <PlanRow
              label="B-roll"
              value={planLabels.brollLabel}
              field="broll"
              onAdjust={setAdjustField}
              tooltip="Cutaway footage inserted over parts of your talking-head clip to keep the video visually interesting."
            />
            <PlanRow
              label="Music"
              value={planLabels.musicLabel}
              field="music"
              onAdjust={setAdjustField}
              tooltip="Upload your own MP3 to play under the video, mixed quietly beneath your voice so it doesn't compete with your speech."
            />
            <PlanRow
              label="Hook Text"
              value={planLabels.hookTextLabel}
              field="hookText"
              onAdjust={setAdjustField}
              tooltip="A short line of text shown on screen for the first ~2.5 seconds to grab attention. Leave it on AI-generated or type your own."
            />
            <PlanRow
              label="Length"
              value={planLabels.lengthLabel}
              field="length"
              onAdjust={setAdjustField}
              tooltip="Target duration for the finished video. 'Auto' keeps everything and doesn't force a cutoff."
            />
            <PlanRow
              label="Format"
              value={planLabels.formatLabel}
              field="format"
              onAdjust={setAdjustField}
              tooltip="Aspect ratio for the export — vertical for Reels/TikTok/Shorts, landscape for YouTube, square for feed posts."
            />
          </div>

          {/* Video Editing Billing PRD FR-04: cost preview before confirming */}
          {costEstimate && billingStatus.loaded && (
            <VideoCostPreview
              estimate={costEstimate}
              creditsRemaining={billingStatus.creditsRemaining}
              isTrial={billingStatus.isTrial}
            />
          )}

          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 14 }}>
            <TapBtn
              label={insufficientCredits ? 'Not enough credits' : 'Looks good, make it'}
              primary
              onClick={handleRender}
            />
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
            <div style={{ display: 'flex', gap: 8, marginTop: 10, flexWrap: 'wrap' }}>
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
              playsInline
              style={{
                width: '100%',
                maxHeight: 340,
                borderRadius: 12,
                background: '#000',
                marginBottom: 14,
              }}
            />
          )}

          {/* Custom b-roll nudge */}
          {plan?.brollEnabled && (
            <div
              style={{
                background: '#F9FAFB',
                border: `1px solid ${BORDER}`,
                borderRadius: 10,
                padding: '10px 14px',
                marginBottom: 12,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: 12,
              }}
            >
              <div style={{ fontSize: 12, color: GRAY, lineHeight: 1.5 }}>
                Want to use your own b-roll clips? You can place them against your transcript.
              </div>
              <button
                onClick={() => {
                  addMsg('user', 'Upload my own b-roll');
                  setBrollConvStep('upload');
                  setBrollClips([]);
                  setBrollPlacements([]);
                  setStage('broll_edit');
                }}
                style={{
                  padding: '7px 14px',
                  borderRadius: 8,
                  border: `1.5px solid ${PINK}`,
                  background: LIGHT_PINK,
                  color: PINK,
                  fontSize: 12,
                  fontWeight: 600,
                  cursor: 'pointer',
                  flexShrink: 0,
                  whiteSpace: 'nowrap',
                }}
              >
                Upload my clips
              </button>
            </div>
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
                label: 'Cut silences, pauses & repetitions',
                desc: 'Audio + AI analysis removes silences, long pauses, filler words, and repeated phrases',
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
                              padding: '8px 7px',
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
                              padding: '8px 7px',
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
                      padding: '12px 0',
                      marginBottom: 2,
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
                      playsInline
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
                              padding: '8px 10px',
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
                      style={{
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        color: GRAY,
                        fontSize: 16,
                        padding: 12,
                        margin: -12,
                        flexShrink: 0,
                      }}
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            )}

            <div style={{ display: 'flex', gap: 8, marginTop: 12, flexWrap: 'wrap' }}>
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
                              padding: '9px 10px',
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
                          padding: '8px 6px',
                          borderRadius: 6,
                          border: `1.5px solid ${BORDER}`,
                          fontSize: 12,
                        }}
                      />
                      <span style={{ fontSize: 11, color: GRAY }}>seconds</span>
                    </div>
                  )}

                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 6, flexWrap: 'wrap' }}>
                    <span style={{ fontSize: 11, color: GRAY }}>Duration:</span>
                    {[3, 4, 5, 6].map((d) => (
                      <button
                        key={d}
                        onClick={() =>
                          setBrollPlacements((prev) => prev.map((p, j) => (j === i ? { ...p, duration: d } : p)))
                        }
                        style={{
                          padding: '9px 10px',
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

            <div style={{ display: 'flex', gap: 8, marginTop: 12, flexWrap: 'wrap' }}>
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
          <div style={{ display: 'flex', gap: 8, marginTop: 10, flexWrap: 'wrap' }}>
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
