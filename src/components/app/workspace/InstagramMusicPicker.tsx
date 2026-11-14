'use client';

import { useEffect, useRef, useState } from 'react';
import { InstagramAudioChoice, InstagramAudioTrack, SocialMediaAgentService } from '@/src/api/SocialMediaAgentService';

const PRIMARY = '#CD1B78';
const DARK = '#0d0e0f';
const GREY = '#6B7280';
const BORDER = '#E5E7EB';

// Instagram's default for both is full volume; a Reel that already has speech wants the music under it.
const DEFAULT_MUSIC_VOLUME = 70;
const DEFAULT_VIDEO_VOLUME = 100;
const SEARCH_DEBOUNCE_MS = 400;
const VOLUME_SAVE_DEBOUNCE_MS = 600;

interface Props {
  draftId: string;
  value: InstagramAudioChoice | null | undefined;
  /** Called after the choice is saved on the draft. */
  onChange: (choice: InstagramAudioChoice | null) => void;
  disabled?: boolean;
}

function minutesAndSeconds(total: number): string {
  const m = Math.floor(total / 60);
  const s = String(total % 60).padStart(2, '0');
  return `${m}:${s}`;
}

/** The HTTP client rejects with the response itself, so the server's message is at err.data.detail. */
function serverMessage(err: unknown, fallback: string): string {
  const detail = (err as { data?: { detail?: unknown } })?.data?.detail;
  return typeof detail === 'string' && detail ? detail : fallback;
}

/**
 * Music for an Instagram Reel, picked from Instagram's licensed catalogue. Reels only: Instagram's API has no audio
 * option for images, carousels or Stories. The choice is saved on the draft and posted with the Reel.
 */
const InstagramMusicPicker = ({ draftId, value, onChange, disabled }: Props) => {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [tracks, setTracks] = useState<InstagramAudioTrack[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [playingId, setPlayingId] = useState<string | null>(null);
  // The sliders move freely; the draft is saved shortly after they stop.
  const [musicVolume, setMusicVolume] = useState(value?.audio_volume ?? DEFAULT_MUSIC_VOLUME);
  const [videoVolume, setVideoVolume] = useState(value?.video_volume ?? DEFAULT_VIDEO_VOLUME);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const searchSeq = useRef(0);
  const volumeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const stopPreview = () => {
    audioRef.current?.pause();
    audioRef.current = null;
    setPlayingId(null);
  };

  // Stop any preview and any pending volume save when this unmounts.
  useEffect(
    () => () => {
      audioRef.current?.pause();
      if (volumeTimer.current) clearTimeout(volumeTimer.current);
    },
    []
  );

  // Trending when the box is empty; otherwise the search, once typing pauses. A slow earlier answer is ignored.
  useEffect(() => {
    if (!open) return;
    const seq = ++searchSeq.current;
    const timer = setTimeout(
      async () => {
        setLoading(true);
        setError(null);
        try {
          const res = await SocialMediaAgentService.searchInstagramAudio(query);
          if (seq !== searchSeq.current) return;
          setTracks(res.responseData?.tracks ?? []);
        } catch (err) {
          if (seq !== searchSeq.current) return;
          setTracks([]);
          setError(serverMessage(err, "Couldn't load music right now. Please try again."));
        } finally {
          if (seq === searchSeq.current) setLoading(false);
        }
      },
      query ? SEARCH_DEBOUNCE_MS : 0
    );
    return () => clearTimeout(timer);
  }, [open, query]);

  const save = async (choice: InstagramAudioChoice | null) => {
    setSaving(true);
    setError(null);
    try {
      const res = await SocialMediaAgentService.setInstagramAudio(draftId, choice);
      if (!res.status) throw new Error(res.responseMessage);
      onChange(choice);
      return true;
    } catch (err) {
      setError(serverMessage(err, "Couldn't save the music choice. Please try again."));
      return false;
    } finally {
      setSaving(false);
    }
  };

  const choose = async (track: InstagramAudioTrack) => {
    stopPreview();
    const ok = await save({
      audio_id: track.audio_id,
      title: track.title,
      artist: track.artist,
      audio_volume: musicVolume,
      video_volume: videoVolume,
    });
    if (ok) setOpen(false);
  };

  const remove = async () => {
    stopPreview();
    await save(null);
  };

  const scheduleVolumeSave = (music: number, video: number) => {
    if (!value) return;
    if (volumeTimer.current) clearTimeout(volumeTimer.current);
    volumeTimer.current = setTimeout(() => {
      save({ ...value, audio_volume: music, video_volume: video });
    }, VOLUME_SAVE_DEBOUNCE_MS);
  };

  const togglePreview = (track: InstagramAudioTrack) => {
    if (!track.preview_url) return;
    if (playingId === track.audio_id) {
      stopPreview();
      return;
    }
    stopPreview();
    const audio = new Audio(track.preview_url);
    audio.onended = () => setPlayingId((id) => (id === track.audio_id ? null : id));
    audio.onerror = () => {
      setPlayingId(null);
      setError("Couldn't play that preview.");
    };
    audioRef.current = audio;
    setPlayingId(track.audio_id);
    audio.play().catch(() => {
      setPlayingId(null);
      setError("Couldn't play that preview.");
    });
  };

  const sliderRow = (
    label: string,
    hint: string,
    current: number,
    set: (n: number) => void,
    onDone: (n: number) => void
  ) => (
    <label style={{ display: 'block', marginTop: 8 }}>
      <span style={{ fontSize: 11.5, color: DARK, fontWeight: 600 }}>
        {label} <span style={{ color: GREY, fontWeight: 400 }}>— {hint}</span>
      </span>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <input
          type="range"
          min={1}
          max={100}
          value={current}
          disabled={disabled || saving}
          onChange={(e) => {
            const n = Number(e.target.value);
            set(n);
            onDone(n);
          }}
          style={{ flex: 1, accentColor: PRIMARY }}
        />
        <span style={{ fontSize: 11.5, color: GREY, width: 32, textAlign: 'right' }}>{current}%</span>
      </div>
    </label>
  );

  return (
    <div
      style={{
        border: `1px solid ${BORDER}`,
        borderRadius: 8,
        padding: '10px 12px',
        marginBottom: 12,
        background: '#FAFAFA',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
        <span style={{ fontSize: 12, fontWeight: 700, color: DARK }}>♪ Music</span>
        {value ? (
          <span style={{ fontSize: 12, color: DARK, flex: 1, minWidth: 0 }}>
            {value.title}
            {value.artist ? <span style={{ color: GREY }}> — {value.artist}</span> : null}
          </span>
        ) : (
          <span style={{ fontSize: 12, color: GREY, flex: 1 }}>None — the Reel posts with its own sound</span>
        )}
        <button
          type="button"
          disabled={disabled || saving}
          onClick={() => {
            if (open) stopPreview();
            setOpen(!open);
          }}
          style={{
            fontSize: 11.5,
            fontWeight: 700,
            color: PRIMARY,
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            fontFamily: 'inherit',
          }}
        >
          {open ? 'Close' : value ? 'Change' : 'Add music'}
        </button>
        {value && (
          <button
            type="button"
            disabled={disabled || saving}
            onClick={remove}
            style={{
              fontSize: 11.5,
              color: GREY,
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              fontFamily: 'inherit',
            }}
          >
            Remove
          </button>
        )}
      </div>

      {value && (
        <>
          {sliderRow('Music volume', 'how loud the track is', musicVolume, setMusicVolume, (n) =>
            scheduleVolumeSave(n, videoVolume)
          )}
          {sliderRow(
            "Reel's own sound",
            'turn down speech or sound already in the video',
            videoVolume,
            setVideoVolume,
            (n) => scheduleVolumeSave(musicVolume, n)
          )}
        </>
      )}

      {open && (
        <div style={{ marginTop: 10 }}>
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search Instagram's music…"
            aria-label="Search music"
            style={{
              width: '100%',
              boxSizing: 'border-box',
              padding: '7px 10px',
              fontSize: 12.5,
              border: `1px solid ${BORDER}`,
              borderRadius: 6,
              fontFamily: 'inherit',
            }}
          />
          <p style={{ fontSize: 11, color: GREY, margin: '6px 0' }}>
            {`${query ? 'Results' : 'Trending'} from Instagram's licensed library. Instagram doesn't let us preview the finished Reel with the track, so what you hear here is the track alone.`}
          </p>

          {loading && <p style={{ fontSize: 12, color: GREY, margin: '6px 0' }}>Loading…</p>}
          {!loading && !error && tracks.length === 0 && (
            <p style={{ fontSize: 12, color: GREY, margin: '6px 0' }}>No music found. Try another search.</p>
          )}

          <div style={{ maxHeight: 260, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 4 }}>
            {tracks.map((t) => (
              <div
                key={t.audio_id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  padding: '6px 8px',
                  background: '#fff',
                  border: `1px solid ${BORDER}`,
                  borderRadius: 6,
                }}
              >
                <button
                  type="button"
                  onClick={() => togglePreview(t)}
                  disabled={!t.preview_url}
                  aria-label={playingId === t.audio_id ? `Stop preview of ${t.title}` : `Play preview of ${t.title}`}
                  title={t.preview_url ? '' : 'No preview available'}
                  style={{
                    width: 28,
                    height: 28,
                    borderRadius: '50%',
                    border: `1px solid ${BORDER}`,
                    background: '#fff',
                    cursor: t.preview_url ? 'pointer' : 'not-allowed',
                    opacity: t.preview_url ? 1 : 0.4,
                    color: PRIMARY,
                  }}
                >
                  {playingId === t.audio_id ? '■' : '▶'}
                </button>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div
                    style={{
                      fontSize: 12.5,
                      color: DARK,
                      fontWeight: 600,
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                    }}
                  >
                    {t.title}
                  </div>
                  <div style={{ fontSize: 11, color: GREY }}>
                    {t.artist}
                    {t.duration_seconds ? ` · ${minutesAndSeconds(t.duration_seconds)}` : ''}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => choose(t)}
                  disabled={saving || disabled}
                  style={{
                    fontSize: 11.5,
                    fontWeight: 700,
                    color: '#fff',
                    background: value?.audio_id === t.audio_id ? '#9CA3AF' : PRIMARY,
                    border: 'none',
                    borderRadius: 6,
                    padding: '5px 10px',
                    cursor: 'pointer',
                    fontFamily: 'inherit',
                  }}
                >
                  {value?.audio_id === t.audio_id ? 'Selected' : 'Use'}
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {error && (
        <p role="alert" style={{ fontSize: 12, color: '#DC2626', margin: '8px 0 0' }}>
          {error}
        </p>
      )}
    </div>
  );
};

export default InstagramMusicPicker;
