'use client';

import { useEffect, useState } from 'react';
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

const pill = (disabled: boolean): React.CSSProperties => ({
  display: 'flex',
  alignItems: 'center',
  gap: 6,
  background: '#f6f5f3',
  border: '1px solid #e0dcd9',
  borderRadius: 20,
  padding: '6px 12px',
  fontSize: 12.5,
  fontWeight: 600,
  color: disabled ? '#aaa' : '#555',
  cursor: disabled ? 'default' : 'pointer',
});

const popover = (isMobile: boolean): React.CSSProperties => ({
  position: 'absolute',
  bottom: '100%',
  left: isMobile ? 12 : 24,
  marginBottom: 8,
  width: isMobile ? 'calc(100vw - 40px)' : 360,
  maxHeight: 380,
  overflowY: 'auto',
  background: '#fff',
  border: '1px solid #e0dcd9',
  borderRadius: 12,
  boxShadow: '0 8px 24px rgba(0,0,0,.12)',
  zIndex: 10,
  padding: 12,
  fontSize: 12.5,
  color: '#333',
});

const UGC_LABELS: Record<UgcKind, string> = {
  real_customer: 'A real customer',
  paid_creator: 'A paid creator',
  creator_style: 'Creator-style brand video',
  staff_demo: 'Me or my team',
};

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
        onClick={toggle}
        disabled={disabled || closed}
        title={closed ? (path?.why_closed ?? '') : 'Use a video you made in the AI video studio'}
        style={pill(disabled || closed)}
      >
        🎬 AI video
      </button>
      {open && !closed && (
        <div style={popover(isMobile)} role="dialog" aria-label="Choose an AI video">
          <div style={{ fontWeight: 700, marginBottom: 6 }}>Use an AI video you made</div>
          <div style={{ color: '#777', marginBottom: 8 }}>
            It runs as a video ad and is recorded as AI-generated. It can never be presented as a customer.
            {noPeople && ` ${path?.note}`}
          </div>
          {videos === null ? (
            <div style={{ color: '#aaa' }}>Loading…</div>
          ) : videos.length === 0 ? (
            <div style={{ color: '#aaa' }}>No finished AI videos yet. Make one in the video studio first.</div>
          ) : (
            videos.map((v) => {
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
                    gap: 10,
                    alignItems: 'center',
                    width: '100%',
                    textAlign: 'left',
                    background: 'none',
                    border: 'none',
                    borderRadius: 8,
                    padding: 8,
                    cursor: blocked ? 'default' : 'pointer',
                    opacity: blocked ? 0.5 : 1,
                  }}
                >
                  <video
                    src={v.preview_url}
                    muted
                    preload="metadata"
                    style={{ width: 44, height: 44, borderRadius: 8, objectFit: 'cover', flexShrink: 0 }}
                  />
                  <span>
                    {v.about || 'AI video'} · {v.seconds}s{v.has_people ? ' · shows people' : ''}
                    {blocked && <span style={{ color: '#B71C1C' }}> — your brief rules out AI people</span>}
                  </span>
                </button>
              );
            })
          )}
        </div>
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
        style={{ border: '1px solid #e0dcd9', borderRadius: 8, padding: '4px 8px', fontSize: 12.5 }}
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
  const [error, setError] = useState('');
  const closed = info ? !info.paths.ugc.open : false;

  async function write() {
    setBusy(true);
    setError('');
    try {
      setBrief(await CampaignService.creatorBrief({ ugc_kind: kind, description }));
    } catch {
      setError("Couldn't write the brief. Try again.");
    }
    setBusy(false);
  }

  const asText = (b: CreatorBrief) =>
    [
      `Creator brief (${b.for})`,
      `Message: ${b.message}`,
      `Proof: ${b.proof}`,
      'Shots:',
      ...b.shots.map((s) => `- ${s.shot}: ${s.direction}${s.say ? ` Say: "${s.say}"` : ''}`),
      `Length: ${b.length}`,
      `Honesty: ${b.honesty}`,
      `Disclosure: ${b.disclosure}`,
      `Usage rights: ${b.usage_rights}`,
    ].join('\n');

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        disabled={disabled || closed}
        title={closed ? (info?.paths.ugc.why_closed ?? '') : 'A brief a creator, customer or your team can film from'}
        style={pill(disabled || closed)}
      >
        📝 Creator brief
      </button>
      {open && !closed && (
        <div style={popover(isMobile)} role="dialog" aria-label="Creator brief">
          <div style={{ fontWeight: 700, marginBottom: 6 }}>A brief to film from</div>
          {info?.ugc && <div style={{ color: '#777', marginBottom: 8 }}>{info.ugc.why}</div>}
          <div style={{ display: 'flex', gap: 6, alignItems: 'center', marginBottom: 8, flexWrap: 'wrap' }}>
            <select
              value={kind}
              onChange={(e) => setKind(e.target.value as UgcKind)}
              aria-label="Who will film it"
              style={{ border: '1px solid #e0dcd9', borderRadius: 8, padding: '4px 8px', fontSize: 12.5 }}
            >
              {(Object.keys(UGC_LABELS) as UgcKind[]).map((k) => (
                <option key={k} value={k}>
                  {UGC_LABELS[k]}
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
                padding: '6px 12px',
                fontWeight: 700,
                fontSize: 12.5,
                cursor: busy ? 'default' : 'pointer',
              }}
            >
              {busy ? 'Writing…' : brief ? 'Rewrite' : 'Write brief'}
            </button>
            {brief && (
              <button
                type="button"
                onClick={() => navigator.clipboard?.writeText(asText(brief))}
                style={{ ...pill(false), padding: '5px 10px' }}
              >
                Copy
              </button>
            )}
          </div>
          {error && <div style={{ color: '#B71C1C' }}>{error}</div>}
          {brief && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6, lineHeight: 1.5 }}>
              <div>
                <strong>Message:</strong> {brief.message}
              </div>
              <div>
                <strong>Proof:</strong> {brief.proof}
              </div>
              <div>
                <strong>Shots:</strong>
                <ol style={{ margin: '4px 0 0', paddingLeft: 18 }}>
                  {brief.shots.map((s) => (
                    <li key={s.shot + s.direction}>
                      <strong>{s.shot}:</strong> {s.direction}
                      {s.say && <em> Say: “{s.say}”</em>}
                    </li>
                  ))}
                </ol>
              </div>
              <div>
                <strong>Length:</strong> {brief.length}
              </div>
              <div>
                <strong>Honesty:</strong> {brief.honesty}
              </div>
              <div>
                <strong>Disclosure:</strong> {brief.disclosure}
              </div>
              <div>
                <strong>Usage rights:</strong> {brief.usage_rights}
              </div>
            </div>
          )}
        </div>
      )}
    </>
  );
}
