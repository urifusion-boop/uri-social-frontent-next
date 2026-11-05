'use client';

import { SocialMediaAgentService, TikTokCreatorInfo, TikTokPostSettings } from '@/src/api/SocialMediaAgentService';
import { useEffect, useRef, useState, type CSSProperties } from 'react';
import { createPortal } from 'react-dom';

// "Post to TikTok" screen. Everything here follows TikTok's Content Sharing
// Guidelines ("Required UX Implementation"): creator info fetched fresh on open,
// nickname shown, no defaulted privacy level, interactions off by default and
// greyed out when the creator disabled them, commercial-content disclosure with
// its label messages, the Music Usage Confirmation consent line, a preview, and
// nothing is sent to TikTok until the user presses Post.

const PRIMARY = '#CD1B78';
const DARK = '#0d0e0f';
const GREY = '#6B7280';
const BORDER = '#E5E7EB';

// TikTok's limits: video titles 2200; photo titles 90 with a separate 4000-char description.
const MAX_VIDEO_TITLE_LENGTH = 2200;
const MAX_PHOTO_TITLE_LENGTH = 90;
const MAX_PHOTO_DESCRIPTION_LENGTH = 4000;

const MUSIC_USAGE_URL = 'https://www.tiktok.com/legal/page/global/music-usage-confirmation/en';
const BRANDED_CONTENT_POLICY_URL = 'https://www.tiktok.com/legal/page/global/bc-policy/en';

const PRIVACY_LABELS: Record<string, string> = {
  PUBLIC_TO_EVERYONE: 'Everyone',
  MUTUAL_FOLLOW_FRIENDS: 'Friends',
  FOLLOWER_OF_CREATOR: 'Followers',
  SELF_ONLY: 'Only me',
};

// What each option means for the people who can see the post, shown next to its name.
const PRIVACY_HELP: Record<string, string> = {
  PUBLIC_TO_EVERYONE: 'anyone on TikTok can see it',
  MUTUAL_FOLLOW_FRIENDS: 'only people you follow who follow you back',
  FOLLOWER_OF_CREATOR: 'only people who follow you',
  SELF_ONLY: 'only you can see it',
};
// Widest reach first. TikTok decides which options exist; this only orders them.
const PRIVACY_ORDER = ['PUBLIC_TO_EVERYONE', 'MUTUAL_FOLLOW_FRIENDS', 'FOLLOWER_OF_CREATOR', 'SELF_ONLY'];
const privacyRank = (o: string) => (PRIVACY_ORDER.includes(o) ? PRIVACY_ORDER.indexOf(o) : PRIVACY_ORDER.length);

const BRANDED_PRIVATE_NOTICE = 'Branded content visibility cannot be set to private.';
const COMMERCIAL_REQUIRED_NOTICE = 'You need to indicate if your content promotes yourself, a third party, or both.';

interface Props {
  // What's being posted. Photo posts (an image or carousel) differ from video: only
  // Comment applies (no Duet/Stitch), the title is capped at 90 with a separate
  // description, and there's no duration to check.
  media: { kind: 'video'; url: string } | { kind: 'photo'; urls: string[] };
  initialTitle: string;
  initialDescription?: string; // photo only
  onClose: () => void;
  onConfirm: (settings: TikTokPostSettings) => void;
}

const sectionLabel: CSSProperties = { fontSize: 14, fontWeight: 700, color: DARK, margin: '0 0 8px' };
const noteText: CSSProperties = { fontSize: 13, color: GREY, margin: '4px 0 0', lineHeight: 1.5 };
const linkStyle: CSSProperties = { color: PRIMARY, fontWeight: 600 };

export default function TikTokPostDialog({ media, initialTitle, initialDescription, onClose, onConfirm }: Props) {
  const isPhoto = media.kind === 'photo';
  const noun = isPhoto ? 'post' : 'video';
  const maxTitle = isPhoto ? MAX_PHOTO_TITLE_LENGTH : MAX_VIDEO_TITLE_LENGTH;
  const [info, setInfo] = useState<TikTokCreatorInfo | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  // True when TikTok answered "too many requests": a short wait, not a problem with the account.
  const [busy, setBusy] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const [videoDuration, setVideoDuration] = useState<number | null>(null);

  const [title, setTitle] = useState(initialTitle);
  const [description, setDescription] = useState(initialDescription ?? '');
  const [privacy, setPrivacy] = useState(''); // no default — the user must choose
  const [allowComment, setAllowComment] = useState(false);
  const [allowDuet, setAllowDuet] = useState(false);
  const [allowStitch, setAllowStitch] = useState(false);
  const [commercialOn, setCommercialOn] = useState(false);
  const [brandOrganic, setBrandOrganic] = useState(false);
  const [brandContent, setBrandContent] = useState(false);
  // Set when Post is pressed before the required "who can view" choice is made.
  const [showPrivacyError, setShowPrivacyError] = useState(false);
  const privacyRef = useRef<HTMLDivElement>(null);

  // Creator info is fetched every time this screen opens (it only mounts when
  // the user starts a TikTok post), never cached across posts.
  useEffect(() => {
    let cancelled = false;
    setLoadError(null);
    setBusy(false);
    SocialMediaAgentService.getTikTokCreatorInfo()
      .then((res) => {
        if (cancelled) return;
        if (res.status && res.responseData) setInfo(res.responseData);
        else setLoadError(res.responseMessage || "Couldn't load your TikTok account details.");
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        const failure = err as { status?: number; data?: { detail?: string } };
        setBusy(failure?.status === 429);
        setLoadError(failure?.data?.detail || "Couldn't load your TikTok account details. Please try again.");
      });
    return () => {
      cancelled = true;
    };
  }, [attempt]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  const options = [...(info?.privacy_level_options ?? [])].sort((a, b) => privacyRank(a) - privacyRank(b));
  const cannotPostNow = !!info && options.length === 0;
  const maxDuration = info?.max_video_post_duration_sec ?? null;
  const tooLong = maxDuration != null && videoDuration != null && videoDuration > maxDuration;
  const commercialMissing = commercialOn && !brandOrganic && !brandContent;
  const titleTooLong = title.length > maxTitle;
  const descriptionTooLong = isPhoto && description.length > MAX_PHOTO_DESCRIPTION_LENGTH;

  // Post is greyed out while something can't be fixed by pressing it. A missing privacy choice is not
  // one of those: pressing Post then takes the user to that field and says what is needed.
  const blocked = !info || cannotPostNow || tooLong || commercialMissing || titleTooLong || descriptionTooLong;
  const privacyMissing = !privacy;

  const allowed = [allowComment && 'comments', !isPhoto && allowDuet && 'duets', !isPhoto && allowStitch && 'stitches']
    .filter(Boolean)
    .join(', ');
  const summary = privacy
    ? `${PRIVACY_LABELS[privacy] ?? privacy} · ${allowed ? `${allowed} on` : 'interactions off'}`
    : `Pick who can view this ${noun} to continue`;

  const toggleCommercial = (on: boolean) => {
    setCommercialOn(on);
    if (!on) {
      setBrandOrganic(false);
      setBrandContent(false);
    }
  };

  const toggleBrandContent = (on: boolean) => {
    setBrandContent(on);
    // Branded content can't be private — clear a now-invalid choice so the user
    // has to pick again, instead of silently changing it for them.
    if (on && privacy === 'SELF_ONLY') setPrivacy('');
  };

  const label = (() => {
    if (!commercialOn) return null;
    if (brandContent) return "Your photo/video will be labeled as 'Paid partnership'.";
    if (brandOrganic) return "Your photo/video will be labeled as 'Promotional content'.";
    return null;
  })();

  const consent = brandContent ? (
    <>
      By posting, you agree to TikTok&apos;s{' '}
      <a href={BRANDED_CONTENT_POLICY_URL} target="_blank" rel="noopener noreferrer" style={linkStyle}>
        Branded Content Policy
      </a>{' '}
      and{' '}
      <a href={MUSIC_USAGE_URL} target="_blank" rel="noopener noreferrer" style={linkStyle}>
        Music Usage Confirmation
      </a>
      .
    </>
  ) : (
    <>
      By posting, you agree to TikTok&apos;s{' '}
      <a href={MUSIC_USAGE_URL} target="_blank" rel="noopener noreferrer" style={linkStyle}>
        Music Usage Confirmation
      </a>
      .
    </>
  );

  const handlePost = () => {
    if (blocked) return;
    if (privacyMissing) {
      setShowPrivacyError(true);
      privacyRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return;
    }
    onConfirm({
      title,
      description: isPhoto ? description : '',
      privacy_level: privacy,
      allow_comment: allowComment,
      allow_duet: !isPhoto && allowDuet,
      allow_stitch: !isPhoto && allowStitch,
      brand_organic: commercialOn && brandOrganic,
      brand_content: commercialOn && brandContent,
    });
  };

  const interaction = (
    key: string,
    text: string,
    checked: boolean,
    set: (v: boolean) => void,
    disabledByCreator: boolean
  ) => (
    <label
      key={key}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        fontSize: 14,
        color: disabledByCreator ? '#9CA3AF' : DARK,
        cursor: disabledByCreator ? 'not-allowed' : 'pointer',
      }}
    >
      <input
        type="checkbox"
        checked={checked}
        disabled={disabledByCreator}
        onChange={(e) => set(e.target.checked)}
        style={{ width: 16, height: 16, accentColor: PRIMARY }}
      />
      {text}
      {disabledByCreator && (
        <span style={{ fontSize: 12, color: '#9CA3AF' }}>(turned off in your TikTok settings)</span>
      )}
    </label>
  );

  // Rendered at the page root: this dialog is opened from inside list cards, and a
  // fixed overlay nested in a card can be trapped by an ancestor's transform/overflow.
  if (typeof document === 'undefined') return null;
  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Post to TikTok"
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 1000,
        background: 'rgba(13,14,15,0.55)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 16,
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      {/* The body scrolls; the header and the Post bar stay in view. */}
      <div
        style={{
          background: '#fff',
          borderRadius: 14,
          width: '100%',
          maxWidth: 560,
          maxHeight: 'calc(100vh - 32px)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          boxShadow: '0 20px 50px rgba(0,0,0,0.25)',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '18px 24px 12px',
          }}
        >
          <h2 style={{ fontSize: 20, fontWeight: 800, color: DARK, margin: 0 }}>Post to TikTok</h2>
          <button
            onClick={onClose}
            aria-label="Close"
            style={{ background: 'none', border: 'none', fontSize: 22, color: GREY, cursor: 'pointer' }}
          >
            ×
          </button>
        </div>

        <div style={{ flex: 1, minHeight: 0, overflowY: 'auto', padding: '0 24px 16px' }}>
          {!info && !loadError && <p style={{ fontSize: 14, color: GREY }}>Loading your TikTok account…</p>}

          {loadError && (
            <div
              style={{
                background: busy ? '#FFFBEB' : '#FEF2F2',
                border: `1px solid ${busy ? '#FDE68A' : '#FECACA'}`,
                borderRadius: 8,
                padding: '12px 14px',
              }}
            >
              <p style={{ fontSize: 14, color: busy ? '#92400E' : '#DC2626', margin: 0 }}>
                {busy ? `TikTok is busy right now. ${loadError}` : loadError}
              </p>
              <button
                onClick={() => setAttempt((n) => n + 1)}
                style={{
                  marginTop: 10,
                  padding: '6px 14px',
                  borderRadius: 8,
                  border: `1px solid ${busy ? '#F59E0B' : '#FCA5A5'}`,
                  background: '#fff',
                  color: busy ? '#92400E' : '#DC2626',
                  fontSize: 13,
                  fontWeight: 600,
                  cursor: 'pointer',
                  fontFamily: 'inherit',
                }}
              >
                Try again
              </button>
            </div>
          )}

          {info && (
            <>
              {/* Which account this will be posted to */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
                {info.creator_avatar_url && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={info.creator_avatar_url}
                    alt=""
                    width={36}
                    height={36}
                    style={{ borderRadius: '50%', objectFit: 'cover' }}
                  />
                )}
                <div>
                  <p style={{ fontSize: 12, color: GREY, margin: 0 }}>Posting to</p>
                  <p style={{ fontSize: 15, fontWeight: 700, color: DARK, margin: 0 }}>{info.creator_nickname}</p>
                </div>
              </div>

              {cannotPostNow && (
                <div
                  style={{
                    background: '#FEF2F2',
                    border: '1px solid #FECACA',
                    borderRadius: 8,
                    padding: '12px 14px',
                    marginBottom: 16,
                  }}
                >
                  <p style={{ fontSize: 14, color: '#DC2626', margin: 0 }}>
                    This TikTok account can&apos;t be posted to right now. Please try again later.
                  </p>
                </div>
              )}

              {/* Privacy — required, no default */}
              <div ref={privacyRef}>
                <p style={{ ...sectionLabel, display: 'flex', alignItems: 'center', gap: 8 }}>
                  Who can view this {noun}
                  <span style={{ fontSize: 11, fontWeight: 700, color: PRIMARY }}>Required</span>
                </p>
                <select
                  value={privacy}
                  onChange={(e) => {
                    setPrivacy(e.target.value);
                    setShowPrivacyError(false);
                  }}
                  aria-invalid={showPrivacyError && privacyMissing}
                  style={{
                    width: '100%',
                    border: `1.5px solid ${showPrivacyError && privacyMissing ? '#DC2626' : BORDER}`,
                    borderRadius: 8,
                    padding: '10px 12px',
                    fontSize: 14,
                    fontFamily: 'inherit',
                    background: '#fff',
                    color: privacy ? DARK : GREY,
                  }}
                >
                  <option value="" disabled>
                    Select who can view this {noun}
                  </option>
                  {options.map((o) => {
                    const privateBlocked = o === 'SELF_ONLY' && commercialOn && brandContent;
                    return (
                      <option
                        key={o}
                        value={o}
                        disabled={privateBlocked}
                        title={privateBlocked ? BRANDED_PRIVATE_NOTICE : undefined}
                      >
                        {PRIVACY_LABELS[o] ?? o}
                        {privateBlocked
                          ? ` — ${BRANDED_PRIVATE_NOTICE}`
                          : PRIVACY_HELP[o]
                            ? ` — ${PRIVACY_HELP[o]}`
                            : ''}
                      </option>
                    );
                  })}
                </select>
                {showPrivacyError && privacyMissing && (
                  <p style={{ ...noteText, color: '#DC2626' }}>Choose who can view this {noun} before you post.</p>
                )}
              </div>

              {/* Interactions — all off by default */}
              <p style={{ ...sectionLabel, marginTop: 14 }}>Allow users to</p>
              <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap' }}>
                {interaction('comment', 'Comment', allowComment, setAllowComment, info.comment_disabled)}
                {!isPhoto && interaction('duet', 'Duet', allowDuet, setAllowDuet, info.duet_disabled)}
                {!isPhoto && interaction('stitch', 'Stitch', allowStitch, setAllowStitch, info.stitch_disabled)}
              </div>

              {/* Preview */}
              <p style={{ ...sectionLabel, marginTop: 16 }}>Preview</p>
              {media.kind === 'video' ? (
                <video
                  src={media.url}
                  controls
                  playsInline
                  preload="metadata"
                  onLoadedMetadata={(e) => setVideoDuration(e.currentTarget.duration)}
                  style={{
                    width: '100%',
                    maxHeight: 200,
                    display: 'block',
                    background: '#000',
                    borderRadius: 10,
                    marginBottom: 6,
                  }}
                />
              ) : (
                <div style={{ display: 'flex', gap: 8, overflowX: 'auto', marginBottom: 6 }}>
                  {media.urls.map((u, i) => (
                    <div key={i} style={{ position: 'relative', flexShrink: 0 }}>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={u}
                        alt={`Photo ${i + 1} of ${media.urls.length}`}
                        style={{
                          height: 170,
                          width: 'auto',
                          maxWidth: media.urls.length === 1 ? '100%' : undefined,
                          objectFit: 'contain',
                          background: '#F3F4F6',
                          borderRadius: 10,
                          display: 'block',
                        }}
                      />
                      {/* Carousel order, with the cover (first photo) identified. */}
                      <span
                        style={{
                          position: 'absolute',
                          top: 8,
                          left: 8,
                          background: i === 0 ? PRIMARY : 'rgba(13,14,15,0.7)',
                          color: '#fff',
                          fontSize: 11,
                          fontWeight: 700,
                          borderRadius: 6,
                          padding: '2px 7px',
                        }}
                      >
                        {i === 0 ? (media.urls.length > 1 ? 'Cover · 1' : 'Cover') : i + 1}
                      </span>
                    </div>
                  ))}
                </div>
              )}
              {tooLong && (
                <p style={{ ...noteText, color: '#DC2626' }}>
                  This video is {Math.round(videoDuration ?? 0)}s long. This TikTok account can post videos up to{' '}
                  {maxDuration}s.
                </p>
              )}

              {/* Title (and, for photos, a separate description) */}
              <p style={{ ...sectionLabel, marginTop: 16 }}>Title</p>
              <textarea
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                rows={isPhoto ? 2 : 3}
                placeholder={`Add a title for your ${noun}`}
                style={{
                  width: '100%',
                  boxSizing: 'border-box',
                  border: `1.5px solid ${titleTooLong ? '#DC2626' : BORDER}`,
                  borderRadius: 8,
                  padding: '10px 12px',
                  fontSize: 14,
                  fontFamily: 'inherit',
                  resize: 'vertical',
                }}
              />
              <p style={{ ...noteText, color: titleTooLong ? '#DC2626' : GREY, textAlign: 'right' }}>
                {title.length}/{maxTitle}
              </p>

              {isPhoto && (
                <>
                  <p style={{ ...sectionLabel, marginTop: 8 }}>Description</p>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    rows={4}
                    placeholder="Add a description for your post"
                    style={{
                      width: '100%',
                      boxSizing: 'border-box',
                      border: `1.5px solid ${descriptionTooLong ? '#DC2626' : BORDER}`,
                      borderRadius: 8,
                      padding: '10px 12px',
                      fontSize: 14,
                      fontFamily: 'inherit',
                      resize: 'vertical',
                    }}
                  />
                  <p style={{ ...noteText, color: descriptionTooLong ? '#DC2626' : GREY, textAlign: 'right' }}>
                    {description.length}/{MAX_PHOTO_DESCRIPTION_LENGTH}
                  </p>
                </>
              )}

              {/* Commercial content disclosure — off by default */}
              <div style={{ borderTop: `1px solid ${BORDER}`, marginTop: 18, paddingTop: 14 }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={commercialOn}
                    onChange={(e) => toggleCommercial(e.target.checked)}
                    style={{ width: 16, height: 16, accentColor: PRIMARY }}
                  />
                  <span style={{ fontSize: 14, fontWeight: 700, color: DARK }}>Disclose {noun} content</span>
                </label>
                <p style={noteText}>
                  Turn on to disclose that this {noun} promotes goods or services in exchange for something of value.
                  Your {noun} could promote yourself, a third party, or both.
                </p>

                {commercialOn && (
                  <div style={{ marginTop: 10, display: 'flex', flexDirection: 'column', gap: 8 }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 14, cursor: 'pointer' }}>
                      <input
                        type="checkbox"
                        checked={brandOrganic}
                        onChange={(e) => setBrandOrganic(e.target.checked)}
                        style={{ width: 16, height: 16, accentColor: PRIMARY }}
                      />
                      Your brand
                    </label>
                    <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 14, cursor: 'pointer' }}>
                      <input
                        type="checkbox"
                        checked={brandContent}
                        onChange={(e) => toggleBrandContent(e.target.checked)}
                        style={{ width: 16, height: 16, accentColor: PRIMARY }}
                      />
                      Branded content
                    </label>
                    {label && <p style={{ ...noteText, color: DARK, fontWeight: 600, margin: 0 }}>{label}</p>}
                    {commercialMissing && (
                      <p style={{ ...noteText, color: '#DC2626', margin: 0 }}>{COMMERCIAL_REQUIRED_NOTICE}</p>
                    )}
                  </div>
                )}
              </div>

              {/* Consent + processing notice */}
              <p style={{ fontSize: 13, color: DARK, margin: '18px 0 6px', lineHeight: 1.5 }}>{consent}</p>
              <p style={{ ...noteText, margin: 0 }}>
                After you post, it may take a few minutes for your {noun} to finish processing and appear on your TikTok
                profile.
              </p>
            </>
          )}
        </div>

        {/* Always in view: what will be posted, and the buttons. */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            justifyContent: 'space-between',
            padding: '12px 24px',
            borderTop: `1px solid ${BORDER}`,
            background: '#fff',
          }}
        >
          <span style={{ fontSize: 13, color: info && privacyMissing ? GREY : DARK, minWidth: 0 }}>
            {info ? summary : ''}
          </span>
          <div style={{ display: 'flex', gap: 10, flexShrink: 0 }}>
            <button
              onClick={onClose}
              style={{
                padding: '10px 18px',
                borderRadius: 8,
                border: `1.5px solid ${BORDER}`,
                background: '#fff',
                color: DARK,
                fontSize: 14,
                fontWeight: 600,
                fontFamily: 'inherit',
                cursor: 'pointer',
              }}
            >
              Cancel
            </button>
            {/* The wrapper carries the hover text: browsers don't reliably show a
              tooltip on a disabled button itself. */}
            <span title={commercialMissing ? COMMERCIAL_REQUIRED_NOTICE : undefined}>
              <button
                onClick={handlePost}
                disabled={blocked}
                style={{
                  padding: '10px 22px',
                  borderRadius: 8,
                  border: 'none',
                  background: blocked ? '#E5E7EB' : PRIMARY,
                  color: blocked ? '#9CA3AF' : '#fff',
                  fontSize: 14,
                  fontWeight: 700,
                  fontFamily: 'inherit',
                  cursor: blocked ? 'not-allowed' : 'pointer',
                }}
              >
                Post
              </button>
            </span>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}
