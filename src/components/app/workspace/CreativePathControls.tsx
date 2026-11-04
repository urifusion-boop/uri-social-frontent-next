'use client';

import { ReactNode, useEffect, useRef, useState } from 'react';
import {
  AiVideoChoice,
  CampaignService,
  CreativePathsInfo,
  CreativeProvenanceInput,
  CreatorBrief,
  UgcKind,
} from '@/src/api/CampaignService';

/*
 * The AI-video and UGC creative paths in the ads chat: pick a finished AI studio
 * video, say who is in an uploaded video (and confirm they agreed), or get a
 * creator brief to film from. Every path is optional; a path the brand's ads brief
 * rules out is shown closed, with the reason, never hidden or swapped for another.
 */

const PINK = '#C2185B';

const pill = (disabled: boolean, active = false): React.CSSProperties => ({
  display: 'flex',
  alignItems: 'center',
  gap: 6,
  background: active ? '#fce4ec' : '#f6f5f3',
  border: `1px solid ${active ? '#f5c2d8' : '#e0dcd9'}`,
  borderRadius: 20,
  padding: '6px 12px',
  fontSize: 12.5,
  fontWeight: 600,
  color: disabled ? '#aaa' : active ? PINK : '#555',
  cursor: disabled ? 'default' : 'pointer',
});

const selectStyle: React.CSSProperties = {
  border: '1px solid #e0dcd9',
  borderRadius: 8,
  padding: '6px 10px',
  fontSize: 13,
  background: '#fff',
};

const UGC_LABELS: Record<UgcKind, string> = {
  real_customer: 'A real customer',
  paid_creator: 'A paid creator',
  creator_style: 'Creator-style brand video',
  staff_demo: 'Me or my team',
};

/* A panel anchored above the composer: title bar with a close button, closes on
   Escape or a click outside, and scrolls its body rather than the page. */
function Panel({
  trigger,
  title,
  subtitle,
  isMobile,
  onClose,
  children,
  toolbar,
}: {
  trigger: string;
  title: string;
  subtitle?: ReactNode;
  isMobile: boolean;
  onClose: () => void;
  children: ReactNode;
  toolbar?: ReactNode;
}) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    const onDown = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (ref.current && !ref.current.contains(target) && !target.closest(`[data-panel-trigger="${trigger}"]`))
        onClose();
    };
    document.addEventListener('keydown', onKey);
    document.addEventListener('mousedown', onDown);
    return () => {
      document.removeEventListener('keydown', onKey);
      document.removeEventListener('mousedown', onDown);
    };
  }, [onClose, trigger]);

  return (
    <div
      ref={ref}
      role="dialog"
      aria-label={title}
      style={{
        position: 'absolute',
        bottom: '100%',
        left: isMobile ? 12 : 24,
        marginBottom: 8,
        width: isMobile ? 'calc(100vw - 40px)' : 460,
        maxHeight: 'min(560px, 70vh)',
        display: 'flex',
        flexDirection: 'column',
        background: '#fff',
        border: '1px solid #e0dcd9',
        borderRadius: 14,
        boxShadow: '0 12px 32px rgba(0,0,0,.16)',
        zIndex: 20,
        fontSize: 13,
        color: '#333',
        overflow: 'hidden',
      }}
    >
      <div style={{ padding: '14px 16px 12px', borderBottom: '1px solid #f0edea' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
          <div style={{ flex: 1, fontWeight: 800, fontSize: 14.5, color: '#1a1a1a' }}>{title}</div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            style={{
              background: '#f6f5f3',
              border: 'none',
              borderRadius: '50%',
              width: 28,
              height: 28,
              fontSize: 16,
              lineHeight: 1,
              color: '#555',
              cursor: 'pointer',
              flexShrink: 0,
            }}
          >
            ×
          </button>
        </div>
        {subtitle && <div style={{ color: '#777', marginTop: 4, lineHeight: 1.5 }}>{subtitle}</div>}
        {toolbar && (
          <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginTop: 10, flexWrap: 'wrap' }}>
            {toolbar}
          </div>
        )}
      </div>
      <div style={{ padding: '12px 16px 16px', overflowY: 'auto', lineHeight: 1.55 }}>{children}</div>
    </div>
  );
}

export function useCreativePaths(description: string): CreativePathsInfo | null {
  const [info, setInfo] = useState<CreativePathsInfo | null>(null);
  useEffect(() => {
    let live = true;
    CampaignService.creativePaths({ description: description.slice(0, 500) })
      .then((i) => live && setInfo(i))
      .catch(() => live && setInfo(null));
    return () => {
      live = false;
    };
  }, [description]);
  return info;
}

export function AiVideoPicker({
  info,
  disabled,
  isMobile,
  onPick,
}: {
  info: CreativePathsInfo | null;
  disabled: boolean;
  isMobile: boolean;
  onPick: (url: string, label: string, provenance: CreativeProvenanceInput) => void;
}) {
  const [open, setOpen] = useState(false);
  const [videos, setVideos] = useState<AiVideoChoice[] | null>(null);
  const path = info?.paths.ai_video;
  const closed = path ? !path.open : false;
  const noPeople = !!path?.note;

  async function toggle() {
    setOpen((v) => !v);
    if (!videos) setVideos(await CampaignService.aiVideos().catch(() => []));
  }

  return (
    <>
      <button
        type="button"
        data-panel-trigger="ai-video"
        onClick={toggle}
        disabled={disabled || closed}
        title={closed ? (path?.why_closed ?? '') : 'Use a video you made in the AI video studio'}
        style={pill(disabled || closed, open)}
      >
        🎬 AI video
      </button>
      {open && !closed && (
        <Panel
          trigger="ai-video"
          title="Use an AI video you made"
          subtitle={
            <>
              Pick a finished video from the AI video studio and it runs as this campaign’s video ad. It’s recorded as
              AI-generated and the ad will never present it as a customer.{noPeople && ` ${path?.note}`}
            </>
          }
          isMobile={isMobile}
          onClose={() => setOpen(false)}
        >
          {videos === null ? (
            <div style={{ color: '#aaa' }}>Loading…</div>
          ) : videos.length === 0 ? (
            <div style={{ color: '#888' }}>
              No finished AI videos yet. Make one in Content Studio’s video studio, then come back here.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {videos.map((v) => {
                const blocked = noPeople && v.has_people;
                return (
                  <button
                    key={v.video_job_id}
                    type="button"
                    disabled={blocked}
                    onClick={() => {
                      setOpen(false);
                      onPick(v.preview_url, `AI video · ${v.seconds}s`, {
                        creative_path: 'ai_video',
                        video_job_id: v.video_job_id,
                      });
                    }}
                    style={{
                      display: 'flex',
                      gap: 12,
                      alignItems: 'center',
                      width: '100%',
                      textAlign: 'left',
                      background: '#fafafa',
                      border: '1px solid #f0edea',
                      borderRadius: 10,
                      padding: 8,
                      cursor: blocked ? 'default' : 'pointer',
                      opacity: blocked ? 0.5 : 1,
                      fontSize: 13,
                    }}
                  >
                    <video
                      src={v.preview_url}
                      muted
                      preload="metadata"
                      style={{ width: 56, height: 56, borderRadius: 8, objectFit: 'cover', flexShrink: 0 }}
                    />
                    <span>
                      <span style={{ display: 'block', color: '#1a1a1a' }}>{v.about || 'AI video'}</span>
                      <span style={{ color: '#888', fontSize: 12 }}>
                        {v.seconds}s{v.has_people ? ' · shows people' : ''}
                        {blocked && <span style={{ color: '#B71C1C' }}> · your brief rules out AI people</span>}
                      </span>
                    </span>
                  </button>
                );
              })}
            </div>
          )}
        </Panel>
      )}
    </>
  );
}

export function VideoProvenanceControl({
  info,
  value,
  onChange,
}: {
  info: CreativePathsInfo | null;
  value?: CreativeProvenanceInput;
  onChange: (p: CreativeProvenanceInput | undefined) => void;
}) {
  const ugcClosed = info ? !info.paths.ugc.open : false;
  const kind = value?.creative_path === 'ugc' ? value.ugc_kind : undefined;
  return (
    <div
      style={{
        display: 'flex',
        gap: 8,
        alignItems: 'center',
        flexWrap: 'wrap',
        fontSize: 12.5,
        color: '#555',
        margin: '0 0 8px',
      }}
    >
      <label htmlFor="video-who" style={{ fontWeight: 600 }}>
        Who’s in this video?
      </label>
      <select
        id="video-who"
        value={kind ?? ''}
        onChange={(e) => {
          const k = e.target.value as UgcKind | '';
          onChange(k ? { creative_path: 'ugc', ugc_kind: k, ugc_rights_confirmed: false } : undefined);
        }}
        style={{ ...selectStyle, fontSize: 12.5, padding: '4px 8px' }}
      >
        <option value="">No one — just my product or place</option>
        {(Object.keys(UGC_LABELS) as UgcKind[]).map((k) => (
          <option key={k} value={k} disabled={ugcClosed}>
            {UGC_LABELS[k]}
          </option>
        ))}
      </select>
      {ugcClosed && <span style={{ color: '#999' }}>{info?.paths.ugc.why_closed}</span>}
      {kind && (
        <label style={{ display: 'flex', gap: 6, alignItems: 'center', cursor: 'pointer' }}>
          <input
            type="checkbox"
            checked={!!value?.ugc_rights_confirmed}
            onChange={(e) => onChange({ ...value!, ugc_rights_confirmed: e.target.checked })}
          />
          They agreed to it being used in ads
        </label>
      )}
      {kind === 'paid_creator' && <span style={{ color: '#999' }}>“Paid partnership” is added to the ad text.</span>}
      {kind && kind !== 'real_customer' && <span style={{ color: '#999' }}>The ad won’t call them a customer.</span>}
    </div>
  );
}

const Row = ({ label, children }: { label: string; children: ReactNode }) => (
  <div style={{ marginBottom: 12 }}>
    <div
      style={{
        fontSize: 11,
        fontWeight: 800,
        letterSpacing: 0.4,
        textTransform: 'uppercase',
        color: '#999',
        marginBottom: 3,
      }}
    >
      {label}
    </div>
    <div>{children}</div>
  </div>
);

export function CreatorBriefButton({
  info,
  description,
  disabled,
  isMobile,
}: {
  info: CreativePathsInfo | null;
  description: string;
  disabled: boolean;
  isMobile: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [kind, setKind] = useState<UgcKind>('creator_style');
  const [brief, setBrief] = useState<CreatorBrief | null>(null);
  const [busy, setBusy] = useState(false);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState('');
  const closed = info ? !info.paths.ugc.open : false;

  async function write() {
    setBusy(true);
    setError('');
    setCopied(false);
    try {
      setBrief(await CampaignService.creatorBrief({ ugc_kind: kind, description }));
    } catch {
      setError("Couldn't write the brief. Try again.");
    }
    setBusy(false);
  }

  const asText = (b: CreatorBrief) =>
    [
      `Video brief (${b.for})`,
      `Message: ${b.message}`,
      `Proof: ${b.proof}`,
      'Shots:',
      ...b.shots.map((s, i) => `${i + 1}. ${s.shot}: ${s.direction}${s.say ? ` Say: "${s.say}"` : ''}`),
      `Length: ${b.length}`,
      `Honesty: ${b.honesty}`,
      `Disclosure: ${b.disclosure}`,
      `Usage rights: ${b.usage_rights}`,
    ].join('\n');

  return (
    <>
      <button
        type="button"
        data-panel-trigger="creator-brief"
        onClick={() => setOpen((v) => !v)}
        disabled={disabled || closed}
        title={closed ? (info?.paths.ugc.why_closed ?? '') : 'A brief someone can film your ad video from'}
        style={pill(disabled || closed, open)}
      >
        📝 Creator brief
      </button>
      {open && !closed && (
        <Panel
          trigger="creator-brief"
          title="Video brief"
          subtitle={
            <>
              Jane writes the instructions for filming a video ad: what to say, the shots, and the permission you need.
              Send it to whoever is filming, then upload the video here and say who’s in it.
              {info?.ugc && <span style={{ display: 'block', marginTop: 4 }}>{info.ugc.why}</span>}
            </>
          }
          isMobile={isMobile}
          onClose={() => setOpen(false)}
          toolbar={
            <>
              <select
                value={kind}
                onChange={(e) => {
                  setKind(e.target.value as UgcKind);
                  setBrief(null);
                }}
                aria-label="Who will film it"
                style={selectStyle}
              >
                {(Object.keys(UGC_LABELS) as UgcKind[]).map((k) => (
                  <option key={k} value={k}>
                    Filmed by: {UGC_LABELS[k]}
                  </option>
                ))}
              </select>
              <button
                type="button"
                onClick={write}
                disabled={busy}
                style={{
                  background: PINK,
                  color: '#fff',
                  border: 'none',
                  borderRadius: 8,
                  padding: '7px 14px',
                  fontWeight: 700,
                  fontSize: 13,
                  cursor: busy ? 'default' : 'pointer',
                  opacity: busy ? 0.7 : 1,
                }}
              >
                {busy ? 'Writing…' : brief ? 'Rewrite' : 'Write brief'}
              </button>
              {brief && (
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard?.writeText(asText(brief));
                    setCopied(true);
                  }}
                  style={{ ...pill(false), padding: '6px 12px' }}
                >
                  {copied ? 'Copied ✓' : 'Copy'}
                </button>
              )}
            </>
          }
        >
          {error && <div style={{ color: '#B71C1C', marginBottom: 8 }}>{error}</div>}
          {!brief && !busy && !error && <div style={{ color: '#888' }}>Pick who will film it, then Write brief.</div>}
          {busy && !brief && <div style={{ color: '#aaa' }}>Writing the brief…</div>}
          {brief && (
            <>
              <Row label="Message">{brief.message}</Row>
              <Row label="Proof">{brief.proof}</Row>
              <Row label="Shots">
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: 2 }}>
                  {brief.shots.map((s, i) => (
                    <div
                      key={s.shot + s.direction}
                      style={{
                        background: '#fafafa',
                        border: '1px solid #f0edea',
                        borderRadius: 10,
                        padding: '8px 10px',
                      }}
                    >
                      <div style={{ fontWeight: 700, fontSize: 12, color: PINK }}>
                        {i + 1}. {s.shot}
                      </div>
                      <div>{s.direction}</div>
                      {s.say && <div style={{ color: '#555', fontStyle: 'italic', marginTop: 2 }}>Say: “{s.say}”</div>}
                    </div>
                  ))}
                </div>
              </Row>
              <Row label="Length">{brief.length}</Row>
              <Row label="Honesty">{brief.honesty}</Row>
              <Row label="Disclosure">{brief.disclosure}</Row>
              <Row label="Usage rights">{brief.usage_rights}</Row>
            </>
          )}
        </Panel>
      )}
    </>
  );
}
