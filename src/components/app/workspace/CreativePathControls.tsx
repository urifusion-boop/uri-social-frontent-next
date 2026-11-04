'use client';

import { ReactNode, useEffect, useState } from 'react';
import {
  AiVideoChoice,
  CampaignService,
  CreativePathsInfo,
  CreativeProvenanceInput,
  CreatorBrief,
  UgcKind,
} from '@/src/api/CampaignService';

/*
 * The AI-video and filmed-video creative paths, shown where Jane asks how to handle
 * the ad's image: use a finished AI studio video, or get a brief to film a real one.
 * After any video upload Jane asks who is in it, so the ad is labelled honestly.
 * Every path is optional; one the brand's ads brief rules out says why it's closed.
 */

const PINK = '#C2185B';

const UGC_LABELS: Record<UgcKind, string> = {
  staff_demo: 'Me or my team',
  real_customer: 'A real customer',
  paid_creator: 'A paid creator',
  creator_style: 'A presenter, in a creator style',
};

const card: React.CSSProperties = {
  background: '#fff',
  border: '1px solid #eee',
  borderRadius: 14,
  padding: 14,
  fontSize: 13,
  color: '#333',
  lineHeight: 1.55,
  maxWidth: 560,
};

const primaryBtn = (disabled = false): React.CSSProperties => ({
  background: PINK,
  color: '#fff',
  border: 'none',
  borderRadius: 20,
  padding: '8px 16px',
  fontWeight: 700,
  fontSize: 13,
  cursor: disabled ? 'default' : 'pointer',
  opacity: disabled ? 0.5 : 1,
});

const ghostBtn: React.CSSProperties = {
  background: '#fff',
  color: PINK,
  border: `1.5px solid ${PINK}`,
  borderRadius: 20,
  padding: '7px 14px',
  fontWeight: 700,
  fontSize: 13,
  cursor: 'pointer',
};

const optionBtn = (active: boolean): React.CSSProperties => ({
  background: active ? PINK : '#fff',
  color: active ? '#fff' : PINK,
  border: `1.5px solid ${PINK}`,
  borderRadius: 12,
  padding: '9px 14px',
  fontSize: 13,
  fontWeight: 700,
  cursor: 'pointer',
});

export function useCreativePaths(description = ''): CreativePathsInfo | null {
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

/** The user's finished AI studio videos, to pick one as this ad's video. */
export function AiVideoChoices({
  info,
  onPick,
}: {
  info: CreativePathsInfo | null;
  onPick: (url: string, provenance: CreativeProvenanceInput) => void;
}) {
  const [videos, setVideos] = useState<AiVideoChoice[] | null>(null);
  useEffect(() => {
    CampaignService.aiVideos()
      .then(setVideos)
      .catch(() => setVideos([]));
  }, []);
  const noPeople = !!info?.paths.ai_video.note;

  return (
    <div style={card}>
      <div style={{ color: '#666', marginBottom: 10 }}>
        Your finished videos from the AI video studio. The one you pick runs as this ad’s video, recorded as
        AI-generated. It’s never presented as a customer.{noPeople && ` ${info?.paths.ai_video.note}`}
      </div>
      {videos === null ? (
        <div style={{ color: '#aaa' }}>Loading your videos…</div>
      ) : videos.length === 0 ? (
        <div style={{ color: '#888' }}>
          You haven’t finished an AI video yet. Make one in Content Studio’s video studio, then come back and pick it
          here.
        </div>
      ) : (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
          {videos.map((v) => {
            const blocked = noPeople && v.has_people;
            return (
              <button
                key={v.video_job_id}
                type="button"
                disabled={blocked}
                title={blocked ? 'Your ads brief rules out AI-generated people' : v.about}
                onClick={() => onPick(v.preview_url, { creative_path: 'ai_video', video_job_id: v.video_job_id })}
                style={{
                  width: 120,
                  padding: 0,
                  border: '2px solid #eee',
                  borderRadius: 10,
                  overflow: 'hidden',
                  background: '#fff',
                  cursor: blocked ? 'default' : 'pointer',
                  opacity: blocked ? 0.45 : 1,
                  textAlign: 'left',
                }}
              >
                <video
                  src={v.preview_url}
                  muted
                  preload="metadata"
                  style={{ width: '100%', height: 120, objectFit: 'cover', display: 'block', background: '#000' }}
                />
                <span style={{ display: 'block', padding: '6px 8px', fontSize: 11.5, color: '#555' }}>
                  {v.seconds}s{v.has_people ? ' · people' : ''}
                </span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

const Section = ({ label, children }: { label: string; children: ReactNode }) => (
  <div style={{ marginBottom: 10 }}>
    <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: 0.4, textTransform: 'uppercase', color: '#999' }}>
      {label}
    </div>
    <div>{children}</div>
  </div>
);

const briefAsText = (b: CreatorBrief) =>
  [
    `Video brief (${b.for})`,
    `Message: ${b.message}`,
    `Proof: ${b.proof}`,
    'Shots:',
    ...b.shots.map((s, i) => `${i + 1}. ${s.shot}: ${s.direction}`),
    ...(b.talking_points?.length ? ['Cover these in your own words:', ...b.talking_points.map((p) => `- ${p}`)] : []),
    `Length: ${b.length}`,
    `Honesty: ${b.honesty}`,
    `Disclosure: ${b.disclosure}`,
    `Usage rights: ${b.usage_rights}`,
  ].join('\n');

/** "Film a video": Jane writes the brief for whoever films it; once filmed, upload it. */
export function VideoBriefInline({
  info,
  description,
  onUploadFilmed,
}: {
  info: CreativePathsInfo | null;
  description: string;
  onUploadFilmed: () => void;
}) {
  const [kind, setKind] = useState<UgcKind>('staff_demo');
  const [brief, setBrief] = useState<CreatorBrief | null>(null);
  const [busy, setBusy] = useState(false);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState('');

  async function write(k: UgcKind) {
    setKind(k);
    setBusy(true);
    setError('');
    setCopied(false);
    try {
      setBrief(await CampaignService.creatorBrief({ ugc_kind: k, description }));
    } catch {
      setError("Couldn't write the brief. Try again.");
    }
    setBusy(false);
  }

  return (
    <div style={card}>
      <div style={{ color: '#666', marginBottom: 10 }}>
        A real person on camera. Pick who will film it and Jane writes their brief: what to say, the shots, and the
        permission you need. Send it to them, then upload the video here.
        {info?.ugc && <span style={{ display: 'block', marginTop: 4, color: '#888' }}>{info.ugc.why}</span>}
      </div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: brief || busy || error ? 12 : 0 }}>
        {(Object.keys(UGC_LABELS) as UgcKind[]).map((k) => (
          <button
            key={k}
            type="button"
            disabled={busy}
            onClick={() => write(k)}
            style={optionBtn(kind === k && !!brief)}
          >
            {UGC_LABELS[k]}
          </button>
        ))}
      </div>
      {busy && <div style={{ color: '#aaa' }}>Writing the brief…</div>}
      {error && <div style={{ color: '#B71C1C' }}>{error}</div>}
      {brief && !busy && (
        <>
          <Section label="Message">{brief.message}</Section>
          <Section label="Proof">{brief.proof}</Section>
          <Section label="Shots">
            <ol style={{ margin: '4px 0 0', paddingLeft: 18, listStyleType: 'decimal' }}>
              {brief.shots.map((s) => (
                <li key={s.shot + s.direction} style={{ marginBottom: 4 }}>
                  <strong>{s.shot}:</strong> {s.direction}
                </li>
              ))}
            </ol>
          </Section>
          {!!brief.talking_points?.length && (
            <Section label="Cover these in your own words">
              <ul style={{ margin: '4px 0 0', paddingLeft: 18, listStyleType: 'disc' }}>
                {brief.talking_points.map((p) => (
                  <li key={p}>{p}</li>
                ))}
              </ul>
            </Section>
          )}
          <Section label="Length">{brief.length}</Section>
          <Section label="Honesty">{brief.honesty}</Section>
          <Section label="Disclosure">{brief.disclosure}</Section>
          <Section label="Usage rights">{brief.usage_rights}</Section>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 4 }}>
            <button
              type="button"
              style={ghostBtn}
              onClick={() => {
                navigator.clipboard?.writeText(briefAsText(brief));
                setCopied(true);
              }}
            >
              {copied ? 'Copied ✓' : 'Copy brief'}
            </button>
            <button type="button" style={primaryBtn()} onClick={onUploadFilmed}>
              I’ve filmed it — upload the video
            </button>
          </div>
        </>
      )}
    </div>
  );
}

/** Asked after any video upload: who is on camera, and did they agree. */
export function VideoWhoPrompt({
  info,
  onAnswer,
}: {
  info: CreativePathsInfo | null;
  onAnswer: (provenance: CreativeProvenanceInput | undefined) => void;
}) {
  const [kind, setKind] = useState<UgcKind | null>(null);
  const [agreed, setAgreed] = useState(false);
  const ugcClosed = info ? !info.paths.ugc.open : false;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
        <button type="button" style={optionBtn(false)} onClick={() => onAnswer(undefined)}>
          No one, just my product or place
        </button>
        {(Object.keys(UGC_LABELS) as UgcKind[]).map((k) => (
          <button
            key={k}
            type="button"
            disabled={ugcClosed}
            title={ugcClosed ? (info?.paths.ugc.why_closed ?? '') : undefined}
            style={{ ...optionBtn(kind === k), opacity: ugcClosed ? 0.45 : 1 }}
            onClick={() => setKind(k)}
          >
            {UGC_LABELS[k]}
          </button>
        ))}
      </div>
      {ugcClosed && <div style={{ fontSize: 12, color: '#999' }}>{info?.paths.ugc.why_closed}</div>}
      {kind && (
        <div style={{ ...card, display: 'flex', flexDirection: 'column', gap: 8 }}>
          <label style={{ display: 'flex', gap: 8, alignItems: 'center', cursor: 'pointer' }}>
            <input type="checkbox" checked={agreed} onChange={(e) => setAgreed(e.target.checked)} />
            {kind === 'staff_demo'
              ? 'Everyone in it agreed to it being used in ads'
              : 'They agreed to it being used in ads'}
          </label>
          {kind === 'paid_creator' && (
            <div style={{ color: '#888' }}>“Paid partnership” will be added to the ad text.</div>
          )}
          {kind !== 'real_customer' && <div style={{ color: '#888' }}>The ad won’t call them a customer.</div>}
          <div>
            <button
              type="button"
              disabled={!agreed}
              style={primaryBtn(!agreed)}
              onClick={() => onAnswer({ creative_path: 'ugc', ugc_kind: kind, ugc_rights_confirmed: true })}
            >
              Continue
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
