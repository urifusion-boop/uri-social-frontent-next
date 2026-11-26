'use client';

/**
 * Google video ads, on the Creative step: what Google will make of a video before it's used.
 *
 * A video runs on YouTube & Discover, and beside the pictures on Display and Everywhere. It can be
 * uploaded, one saved in Uri's Video studio, or a video already on YouTube (a pasted link). Each
 * is checked first (POST /jane-ads/video/check): length against this placement's rules, its shape
 * (upright ones also run in Shorts), sound; and for Display/Everywhere, the picture Google shows
 * beside it, a still from the video or the owner's own photo. A video that can't run here stops Next.
 */
import { useEffect, useRef, useState } from 'react';
import { AdVideoCheck, CampaignService } from '@/src/api/CampaignService';
import { SocialMediaAgentService, type VideoDraft } from '@/src/api/SocialMediaAgentService';
import type { WizardCreativeChoice } from './WizardCreativeStep';

const PINK = '#C2185B';
const INK = '#1a0a12';
const MUTED = '#7a7270';
const LINE = '#ece8e6';
const OK = '#1a7f37';
const AMBER = '#9a3412';
const RED = '#b91c1c';

export type GoogleVideoPlacement = 'display' | 'demand_gen' | 'pmax';
type UploadChoice = Extract<WizardCreativeChoice, { creative_source: 'upload' }>;

/** Placements that also show a picture beside the video. */
export const needsPicture = (p: GoogleVideoPlacement) => p !== 'demand_gen';

/** A Google video the owner can't continue with yet: still being checked, or it can't run here. */
export function googleVideoBlocked(c: WizardCreativeChoice | null, placement: GoogleVideoPlacement | null): boolean {
  if (!placement || !c || c.creative_source !== 'upload') return false;
  if (!c.is_video && !c.youtube_video_id) return false;
  if (!c.video_check) return true;
  if (!c.video_check.ok) return true;
  return needsPicture(placement) && !c.video_still_url;
}

function errorText(e: unknown, fallback: string): string {
  const d = (e as { response?: { data?: { detail?: unknown } } })?.response?.data?.detail;
  return typeof d === 'string' && d ? d : fallback;
}

function duration(s: number): string {
  const t = Math.round(s || 0);
  return `${Math.floor(t / 60)}:${String(t % 60).padStart(2, '0')}`;
}

function Facts({ check }: { check: AdVideoCheck }) {
  return (
    <div style={{ display: 'grid', gap: 3, marginTop: 6 }}>
      {check.facts.map((f, i) => (
        <span
          key={i}
          style={{
            fontSize: 12.5,
            lineHeight: 1.45,
            color: f.tone === 'ok' ? OK : f.tone === 'warn' ? AMBER : RED,
            fontWeight: f.tone === 'block' ? 700 : 500,
          }}
        >
          {f.tone === 'ok' ? '✓ ' : '! '}
          {f.text}
        </span>
      ))}
    </div>
  );
}

function Frame({ src, video, wide, seconds }: { src?: string; video?: boolean; wide?: boolean; seconds?: number }) {
  return (
    <div
      style={{
        position: 'relative',
        borderRadius: 9,
        overflow: 'hidden',
        background: '#1c1c1c',
        aspectRatio: wide ? '16 / 9' : '9 / 16',
        width: '100%',
      }}
    >
      {src &&
        (video ? (
          <video
            src={src}
            muted
            playsInline
            preload="metadata"
            style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
          />
        ) : (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={src} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
        ))}
      <span
        aria-hidden
        style={{
          position: 'absolute',
          left: '50%',
          top: '50%',
          transform: 'translate(-50%,-50%)',
          width: 34,
          height: 34,
          borderRadius: '50%',
          background: 'rgba(255,255,255,.94)',
          boxShadow: '0 1px 4px rgba(0,0,0,.25)',
          display: 'grid',
          placeItems: 'center',
        }}
      >
        <span
          style={{
            borderLeft: '11px solid #0f0f0f',
            borderTop: '7px solid transparent',
            borderBottom: '7px solid transparent',
            marginLeft: 3,
          }}
        />
      </span>
      {seconds ? (
        <span
          style={{
            position: 'absolute',
            right: 5,
            bottom: 5,
            background: 'rgba(0,0,0,.78)',
            color: '#fff',
            fontSize: 10,
            fontWeight: 600,
            padding: '1px 4px',
            borderRadius: 3,
          }}
        >
          {duration(seconds)}
        </span>
      ) : null}
    </div>
  );
}

const panel: React.CSSProperties = {
  border: `1px solid ${LINE}`,
  borderRadius: 12,
  padding: 14,
  background: '#fff',
  display: 'grid',
  gap: 12,
  marginTop: -2,
};

const linkBtn = (grey = false): React.CSSProperties => ({
  background: 'none',
  border: 'none',
  padding: 0,
  fontSize: 12.5,
  fontWeight: grey ? 600 : 700,
  color: grey ? MUTED : PINK,
  cursor: 'pointer',
  fontFamily: 'inherit',
});

/** The picture shown beside the video on Display and Everywhere: a still, or the owner's photo. */
function PicturePicker({
  value,
  stills,
  onChange,
}: {
  value: string | undefined;
  stills: string[];
  onChange: (url: string) => void;
}) {
  const [own, setOwn] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const input = useRef<HTMLInputElement>(null);
  const all = [...stills, ...own];
  return (
    <div style={{ borderTop: `1px solid ${LINE}`, paddingTop: 12, display: 'grid', gap: 8 }}>
      <div style={{ fontSize: 12.5, fontWeight: 700, color: INK }}>Google also shows a picture</div>
      <div style={{ fontSize: 12, color: MUTED, lineHeight: 1.5 }}>
        Jane uses a still from your video. Pick another, or add your own photo.
      </div>
      <div
        role="radiogroup"
        aria-label="Picture shown beside the video"
        style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}
      >
        {all.map((url, i) => (
          <button
            key={url}
            type="button"
            role="radio"
            aria-checked={value === url}
            aria-label={i < stills.length ? `Still ${i + 1} from your video` : 'Your photo'}
            onClick={() => onChange(url)}
            style={{
              width: 60,
              aspectRatio: '1 / 1',
              borderRadius: 8,
              padding: 0,
              cursor: 'pointer',
              border: `1px solid ${LINE}`,
              outline: value === url ? `2px solid ${PINK}` : 'none',
              outlineOffset: 1,
              background: `center/cover no-repeat url(${url}) #2a1d22`,
            }}
          />
        ))}
        <button
          type="button"
          onClick={() => input.current?.click()}
          disabled={busy}
          style={{
            width: 60,
            aspectRatio: '1 / 1',
            borderRadius: 8,
            border: `1px dashed ${LINE}`,
            background: '#fff',
            color: MUTED,
            fontSize: 11,
            fontWeight: 600,
            cursor: 'pointer',
            fontFamily: 'inherit',
          }}
        >
          {busy ? '…' : '+ Photo'}
        </button>
        <input
          ref={input}
          type="file"
          accept="image/*"
          style={{ display: 'none' }}
          onChange={async (e) => {
            const file = e.target.files?.[0];
            e.target.value = '';
            if (!file) return;
            setBusy(true);
            setErr('');
            try {
              const { url } = await CampaignService.uploadMedia(file);
              setOwn((o) => [...o, url]);
              onChange(url);
            } catch (er) {
              setErr(errorText(er, "Couldn't upload that photo. Try again."));
            } finally {
              setBusy(false);
            }
          }}
        />
      </div>
      {err && <span style={{ fontSize: 12, color: RED }}>{err}</span>}
    </div>
  );
}

/** An uploaded or saved video: Jane checks it, and for Display/Everywhere the picture beside it. */
export function VideoCheckPanel({
  value,
  placement,
  onChange,
  onReplace,
  onRemove,
}: {
  value: UploadChoice;
  placement: GoogleVideoPlacement;
  onChange: (next: UploadChoice) => void;
  onReplace?: () => void;
  onRemove: () => void;
}) {
  const [error, setError] = useState('');
  const [attempt, setAttempt] = useState(0);
  const key = `${value.reference_image_url}|${placement}`;
  useEffect(() => {
    // Already checked for this placement (coming back to this step, or a resumed draft): keep it.
    if (attempt === 0 && value.video_check && value.video_checked_for === placement) return;
    let alive = true;
    setError('');
    onChange({ ...value, video_check: undefined });
    CampaignService.checkAdVideo({ video_url: value.reference_image_url, placement })
      .then((check) => {
        if (!alive) return;
        onChange({
          ...value,
          video_check: check,
          video_checked_for: placement,
          video_still_url:
            value.video_still_url && check.stills.includes(value.video_still_url)
              ? value.video_still_url
              : (check.stills[0] ?? value.video_still_url),
        });
      })
      .catch((e) => alive && setError(errorText(e, "Jane couldn't check that video just now.")));
    return () => {
      alive = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, attempt]);

  const check = value.video_check;
  const name = value.video_title || (value.video_source === 'library' ? 'Your saved video' : 'Your video');
  return (
    <div style={panel}>
      <div style={{ display: 'grid', gridTemplateColumns: '108px minmax(0,1fr)', gap: 12, alignItems: 'start' }}>
        <Frame src={value.reference_image_url} video wide={check ? !check.upright : false} seconds={check?.duration} />
        <div style={{ minWidth: 0 }}>
          <div style={{ fontSize: 13.5, fontWeight: 700, color: INK, wordBreak: 'break-word' }}>{name}</div>
          {!check && !error && (
            <div style={{ fontSize: 12.5, color: MUTED, marginTop: 6 }}>Jane is checking your video…</div>
          )}
          {error && (
            <div style={{ fontSize: 12.5, color: RED, marginTop: 6 }}>
              {error}{' '}
              <button type="button" style={linkBtn()} onClick={() => setAttempt((n) => n + 1)}>
                Try again
              </button>
            </div>
          )}
          {check && <Facts check={check} />}
          {check?.ok && (
            <div style={{ fontSize: 12, color: MUTED, marginTop: 8, lineHeight: 1.5 }}>
              Jane puts it on YouTube as unlisted for your ad. It won&apos;t appear on any channel.
            </div>
          )}
          <div style={{ display: 'flex', gap: 14, marginTop: 8 }}>
            {onReplace && (
              <button type="button" style={linkBtn()} onClick={onReplace}>
                Replace
              </button>
            )}
            <button type="button" style={linkBtn(true)} onClick={onRemove}>
              Remove
            </button>
          </div>
        </div>
      </div>
      {check?.ok && needsPicture(placement) && (
        <PicturePicker
          value={value.video_still_url}
          stills={check.stills}
          onChange={(url) => onChange({ ...value, video_still_url: url })}
        />
      )}
    </div>
  );
}

/** A video already on YouTube: paste the link, Jane checks it can run. */
export function YouTubeLinkPanel({
  value,
  placement,
  onChange,
}: {
  value: UploadChoice | null;
  placement: GoogleVideoPlacement;
  onChange: (next: WizardCreativeChoice) => void;
}) {
  const [link, setLink] = useState(value?.youtube_video_id ? `https://youtu.be/${value.youtube_video_id}` : '');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const check = value?.video_source === 'youtube' ? value.video_check : undefined;
  // The placement changed since this link was checked: its rules may differ, so check again.
  useEffect(() => {
    if (value?.video_source === 'youtube' && value.video_check && value.video_checked_for !== placement) void run();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [placement]);

  const run = async () => {
    if (!link.trim()) return;
    setBusy(true);
    setError('');
    try {
      const c = await CampaignService.checkAdVideo({ youtube_link: link.trim(), placement });
      const thumb = c.thumbnail_url ?? '';
      onChange({
        creative_source: 'upload',
        reference_image_url: thumb,
        previewUrl: thumb,
        is_video: false,
        video_source: 'youtube',
        youtube_video_id: c.video_id,
        video_title: c.title,
        video_check: c,
        video_checked_for: placement,
        video_still_url:
          value?.video_still_url && value.youtube_video_id === c.video_id ? value.video_still_url : thumb,
      });
    } catch (e) {
      setError(errorText(e, "Jane couldn't check that link just now. Try again."));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div style={panel}>
      <label htmlFor="wz-youtube-link" style={{ fontSize: 12.5, fontWeight: 700, color: INK }}>
        YouTube link
      </label>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        <input
          id="wz-youtube-link"
          value={link}
          inputMode="url"
          placeholder="youtube.com/watch?v=… or youtu.be/…"
          onChange={(e) => setLink(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && void run()}
          style={{
            flex: '1 1 220px',
            minWidth: 0,
            border: `1px solid ${LINE}`,
            borderRadius: 9,
            padding: '9px 11px',
            fontSize: 13,
            fontFamily: 'inherit',
          }}
        />
        <button
          type="button"
          onClick={() => void run()}
          disabled={busy || !link.trim()}
          style={{
            border: `1px solid ${PINK}`,
            color: PINK,
            background: '#fff',
            borderRadius: 9,
            padding: '8px 14px',
            fontSize: 12.5,
            fontWeight: 700,
            cursor: busy || !link.trim() ? 'default' : 'pointer',
            opacity: busy || !link.trim() ? 0.6 : 1,
            fontFamily: 'inherit',
          }}
        >
          {busy ? 'Checking…' : 'Check'}
        </button>
      </div>
      {error && <div style={{ fontSize: 12.5, color: RED, lineHeight: 1.5 }}>{error}</div>}
      {!check && !error && (
        <div style={{ fontSize: 12, color: MUTED, lineHeight: 1.5 }}>
          The video must be public or unlisted. Private videos can&apos;t run as ads.
        </div>
      )}
      {check && value && (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: '132px minmax(0,1fr)', gap: 12, alignItems: 'start' }}>
            <Frame src={check.thumbnail_url} wide seconds={check.duration} />
            <div style={{ minWidth: 0 }}>
              <div style={{ fontSize: 13.5, fontWeight: 700, color: INK, wordBreak: 'break-word' }}>
                {check.title || 'Your YouTube video'}
              </div>
              <Facts check={check} />
            </div>
          </div>
          {check.ok && needsPicture(placement) && (
            <PicturePicker
              value={value.video_still_url}
              stills={check.stills}
              onChange={(url) => onChange({ ...value, video_still_url: url })}
            />
          )}
        </>
      )}
    </div>
  );
}

/** A video already made in Uri's Video studio. */
export function VideoLibraryPanel({
  value,
  onChange,
}: {
  value: UploadChoice | null;
  onChange: (next: WizardCreativeChoice) => void;
}) {
  const [videos, setVideos] = useState<VideoDraft[] | null>(null);
  const [error, setError] = useState('');
  useEffect(() => {
    SocialMediaAgentService.listVideoDrafts()
      .then((r) => setVideos((r.responseData ?? []).filter((v) => v.video_url)))
      .catch(() => setError("Couldn't load your videos. Try again."));
  }, []);
  return (
    <div style={panel}>
      {!videos && !error && <span style={{ fontSize: 12.5, color: MUTED }}>Loading your videos…</span>}
      {error && <span style={{ fontSize: 12.5, color: RED }}>{error}</span>}
      {videos?.length === 0 && (
        <span style={{ fontSize: 12.5, color: MUTED, lineHeight: 1.5 }}>
          No saved videos yet. Make one in Content Studio → Video, or upload a video instead.
        </span>
      )}
      {videos && videos.length > 0 && (
        <div
          role="radiogroup"
          aria-label="Your videos"
          style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(104px, 1fr))', gap: 8 }}
        >
          {videos.map((v) => {
            const on = value?.video_source === 'library' && value.reference_image_url === v.video_url;
            return (
              <button
                key={v.id}
                type="button"
                role="radio"
                aria-checked={on}
                onClick={() =>
                  onChange({
                    creative_source: 'upload',
                    reference_image_url: v.video_url,
                    previewUrl: v.video_url,
                    is_video: true,
                    video_source: 'library',
                    video_title: (v.content || '').split('\n')[0].slice(0, 60) || 'Your saved video',
                  })
                }
                style={{
                  border: on ? `2px solid ${PINK}` : `1px solid ${LINE}`,
                  borderRadius: 10,
                  background: '#fff',
                  padding: 0,
                  overflow: 'hidden',
                  cursor: 'pointer',
                  textAlign: 'left',
                  fontFamily: 'inherit',
                }}
              >
                <Frame src={v.video_url} video />
                <span style={{ display: 'block', padding: '6px 7px', fontSize: 11.5, color: INK, lineHeight: 1.3 }}>
                  {(v.content || 'Saved video').split('\n')[0].slice(0, 40)}
                  <span style={{ display: 'block', color: MUTED, fontSize: 10.5 }}>
                    {new Date(v.created_at).toLocaleDateString(undefined, { day: 'numeric', month: 'short' })}
                  </span>
                </span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
