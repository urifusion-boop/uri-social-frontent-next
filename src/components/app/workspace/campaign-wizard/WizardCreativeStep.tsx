/**
 * Step 4 — how the ad's image/video gets made. Maps directly onto the backend's own
 * `creative_source` contract (CampaignService.ContinueChoice / ContinueChoice at
 * CampaignsPage.tsx:119) — generate/upload/draft are each a real, already-supported
 * path, so this step produces exactly what planFromMessage expects without any new
 * backend work. "Recomposite" (keep the real product, build a new scene) is a
 * follow-up choice Jane offers mid-conversation, never an initial attach-time option
 * even in the chat flow — see WizardReviewStep.tsx, which reuses it via ResultCard.
 */
'use client';
import { useEffect, useRef, useState } from 'react';
import { useFeatures } from '@/src/hooks/useFeatures';
import MakeFromPicture from '@/src/components/app/competitors/MakeFromPicture';
import {
  AssetAttestation,
  CampaignService,
  CreativeProvenanceInput,
  DraftSummary,
  ExistingPost,
  PlannedAd,
} from '@/src/api/CampaignService';
import { useCreativePaths, VideoWhoPrompt } from '../CreativePathControls';
import WizardAssetAttestation from './WizardAssetAttestation';

const PINK = '#C2185B';
// Meta tests at most this many ads in one campaign (backend concepts.MAX_ADS).
const META_MAX_PHOTOS = 6;

export type WizardCreativeChoice =
  | {
      creative_source: 'generate';
      // "Make several ads" — Meta-only (see this file's own isMeta gate below),
      // mirrors the chat flow's onChooseConcepts/ContinueChoice.concepts exactly.
      // Backend (_concepts_allowed, router.py) clamps to 1 for any other platform
      // regardless of what's sent, so there's no client-side validation to duplicate.
      concepts?: number;
      /** The Style step's pick (an ad format id); '' = "Let Jane choose for me". */
      vsg01_format_id?: string;
      /** Several ads: what each says and its style ('' = Jane's pick), from the Style step. */
      ads?: PlannedAd[];
      /** Several ads: how their styles were chosen on the Style step. */
      style_mode?: 'jane' | 'same' | 'mine';
    }
  | ({
      creative_source: 'upload';
      reference_image_url: string;
      is_video: boolean;
      previewUrl: string;
      // The client's other photos, after reference_image_url (photo 1). TikTok runs
      // them as Carousel Ad slides (mirrors CampaignsPage.tsx's own carouselExtraUrls);
      // Meta runs each as another ad in the same campaign (extra_image_urls).
      carouselExtraUrls?: string[];
      // What the photo actually shows, per VSG-01 v3 §1.2/§6 — collected right
      // after upload, same as the chat flow; undefined for "Skip" or for a video
      // (attestation is a photo-only question there too).
      asset_attestation?: AssetAttestation;
      /** The Style step's pick (an ad format id); '' = "Let Jane choose for me". */
      vsg01_format_id?: string;
    } & Partial<CreativeProvenanceInput>) // "who's in this video" — video uploads only
  | { creative_source: 'draft'; draft_id: string; previewUrl: string }
  | {
      creative_source: 'existing_post';
      post_platform: 'instagram' | 'facebook';
      post_id: string;
      caption: string;
      is_video: boolean;
      previewUrl: string;
    };

/** TikTok runs a video, or 2+ photos as a carousel — there is no single-image TikTok ad.
 *  Anything else picked for a TikTok-only run reached Review and stopped at "TikTok needs
 *  a video", with nothing in the wizard to answer it with (live-found on staging). */
export function creativeFitsTikTok(c: WizardCreativeChoice | null): boolean {
  if (!c || c.creative_source !== 'upload') return false;
  return c.is_video || (c.carouselExtraUrls?.length ?? 0) >= 1;
}

const TIKTOK_IMAGE_ONLY = 'TikTok runs a video or 2+ photos, so this one can’t run there — upload your own instead.';

function OptionCard({
  title,
  subtitle,
  isOn,
  onClick,
  children,
  disabledReason,
}: {
  title: string;
  subtitle: string;
  isOn: boolean;
  onClick: () => void;
  children?: React.ReactNode;
  /** Shown instead of a click when this option can't work for this campaign. */
  disabledReason?: string;
}) {
  return (
    <button
      type="button"
      onClick={disabledReason ? undefined : onClick}
      disabled={Boolean(disabledReason)}
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'flex-start',
        gap: 4,
        textAlign: 'left',
        border: isOn ? `1.5px solid ${PINK}` : '1px solid #ece8e6',
        background: isOn ? 'rgba(194,24,91,.05)' : '#fff',
        borderRadius: 12,
        padding: '14px 16px',
        cursor: disabledReason ? 'default' : 'pointer',
        opacity: disabledReason ? 0.6 : 1,
        width: '100%',
      }}
    >
      <span style={{ fontSize: 13.5, fontWeight: 800, color: isOn ? PINK : '#1a0a12' }}>{title}</span>
      <span style={{ fontSize: 12, color: '#7a7270', lineHeight: 1.45 }}>{subtitle}</span>
      {disabledReason && (
        <span style={{ fontSize: 11.5, color: '#a15c00', fontWeight: 600, lineHeight: 1.45 }}>{disabledReason}</span>
      )}
      {children}
    </button>
  );
}

export default function WizardCreativeStep({
  value,
  onChange,
  isTikTok = false,
  isMeta = false,
  metaBudget = null,
}: {
  value: WizardCreativeChoice | null;
  onChange: (next: WizardCreativeChoice) => void;
  /** Mirrors the chat flow's own `preferredPlatformUi === 'tiktok'` gate on the
   *  carousel picker — single-platform TikTok only, same scope as the old page
   *  (it never offers carousel slides in multi-platform mode either). */
  isTikTok?: boolean;
  /** Gates "Make several ads" (Meta's dynamic-creative test) — true when Meta is
   *  one of the platforms this plan will actually run on, single or multi mode.
   *  Mirrors the backend's own Meta-only restriction (_concepts_allowed). */
  isMeta?: boolean;
  /** The Meta share of the budget, so "Make several ads" can say what the budget table
   *  (PRD WS5) recommends for it. */
  metaBudget?: { amountNgn: number; days: number } | null;
}) {
  const [uploading, setUploading] = useState(false);
  const [postsOpen, setPostsOpen] = useState(false);
  const [postPlatform, setPostPlatform] = useState<'instagram' | 'facebook'>('instagram');
  const [posts, setPosts] = useState<Record<string, ExistingPost[] | string>>({});
  const [testOpen, setTestOpen] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const [carouselUploading, setCarouselUploading] = useState(false);
  const [drafts, setDrafts] = useState<DraftSummary[] | null>(null);
  const [draftsLoading, setDraftsLoading] = useState(false);
  const [showDrafts, setShowDrafts] = useState(false);
  // A real (non-video) photo waits here for "what does this show?" before it
  // actually becomes the chosen creative — same gate the chat flow applies to
  // every real-photo entry point (CampaignsPage.tsx's pendingAssetAttestation).
  const [pendingAttestation, setPendingAttestation] = useState<string[] | null>(null);
  // Same idea for a real video — "who's in it?" (CampaignsPage.tsx's pendingVideoWho).
  const [pendingVideoWho, setPendingVideoWho] = useState<string | null>(null);
  const creativePaths = useCreativePaths('');
  const { flags } = useFeatures();
  // "Start from an ad I like" (PRD WS4): a screenshot → Jane's own version → this campaign's ad.
  const [likedAd, setLikedAd] = useState<File | null>(null);
  const likedInput = useRef<HTMLInputElement | null>(null);

  // What the PRD's budget table recommends for this budget: how many ads, in how many ad sets.
  const [recommended, setRecommended] = useState<{ ads: number; ad_sets: number; why: string } | null>(null);
  const budgetKey = metaBudget ? `${metaBudget.amountNgn}:${metaBudget.days}` : '';
  useEffect(() => {
    if (!isMeta || !metaBudget || metaBudget.amountNgn <= 0) {
      setRecommended(null);
      return;
    }
    let alive = true;
    CampaignService.getBudgetStructure(metaBudget.amountNgn, metaBudget.days)
      .then((r) => alive && setRecommended(r.ads >= 2 ? r : null))
      .catch(() => alive && setRecommended(null));
    return () => {
      alive = false;
    };
    // budgetKey stands in for metaBudget's fields.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isMeta, budgetKey]);

  const mode = value?.creative_source ?? null;
  const isTestMode = value?.creative_source === 'generate' && typeof value.concepts === 'number' && value.concepts >= 2;

  const loadPosts = (platform: 'instagram' | 'facebook') => {
    setPostsOpen(true);
    setPostPlatform(platform);
    if (posts[platform] !== undefined) return;
    CampaignService.listExistingPosts(platform)
      .then((list) => setPosts((prev) => ({ ...prev, [platform]: list })))
      .catch((e: { response?: { data?: { detail?: string } } }) =>
        setPosts((prev) => ({
          ...prev,
          [platform]: e?.response?.data?.detail || "Couldn't load your posts. Try again.",
        }))
      );
  };

  const loadDrafts = () => {
    setShowDrafts(true);
    if (drafts !== null) return;
    setDraftsLoading(true);
    CampaignService.listDrafts()
      .then((r) => setDrafts(r.drafts))
      .catch(() => setDrafts([]))
      .finally(() => setDraftsLoading(false));
  };

  // Several photos can run together: Meta as separate ads in one campaign, TikTok as a
  // carousel. Other platforms use one photo or video, as before.
  const allowsSeveral = isMeta || isTikTok;
  const maxPhotos = isTikTok && !isMeta ? 35 : META_MAX_PHOTOS;

  const describeUploadError = (err: unknown) => {
    const e = err as { message?: string; response?: { data?: { detail?: string } } };
    const known = e?.response?.data?.detail || (e && !e.response ? e.message : '');
    return known && known.length < 200 ? known : "Couldn't upload that file — try again.";
  };

  /** Several photos picked at once (or more added later): uploaded in parallel, a video
   *  or a failed file is skipped with a note, the rest kept in the order picked. */
  const handlePhotos = async (files: File[]) => {
    const current =
      value?.creative_source === 'upload' && !value.is_video
        ? [value.reference_image_url, ...(value.carouselExtraUrls ?? [])]
        : [];
    const room = Math.max(0, maxPhotos - current.length);
    const toUpload = files.slice(0, room);
    const dropped = files.length - toUpload.length;
    setUploadError('');
    if (!toUpload.length) {
      setUploadError(`That's the most this campaign can use — ${maxPhotos} photos.`);
      return;
    }
    setUploading(true);
    try {
      const results = await Promise.allSettled(toUpload.map((file) => CampaignService.uploadMedia(file)));
      const urls: string[] = [];
      let videos = 0;
      let failed = 0;
      let firstError = '';
      for (const r of results) {
        if (r.status !== 'fulfilled') {
          failed += 1;
          firstError = firstError || describeUploadError(r.reason);
        } else if (r.value.is_video) videos += 1;
        else urls.push(r.value.url);
      }
      if (urls.length && current.length && value?.creative_source === 'upload') {
        // Adding to photos already chosen — they were already described, so no new question.
        onChange({ ...value, carouselExtraUrls: [...(value.carouselExtraUrls ?? []), ...urls] });
      } else if (urls.length) {
        setPendingAttestation(urls);
      }
      const notes: string[] = [];
      if (dropped > 0) notes.push(`${dropped} skipped — ${maxPhotos} photos is the most this campaign can use`);
      if (videos > 0) notes.push(`${videos} video${videos > 1 ? 's' : ''} skipped — pick one video on its own`);
      if (failed > 0) notes.push(failed === toUpload.length ? firstError : `${failed} failed to upload`);
      if (notes.length) setUploadError(notes.join('; ') + (notes[notes.length - 1].endsWith('.') ? '' : '.'));
    } finally {
      setUploading(false);
    }
  };

  const handleFiles = (files: File[]) => {
    if (!files.length) return;
    if (files.length === 1 || !allowsSeveral) {
      const already = value?.creative_source === 'upload' && !value.is_video;
      if (already && allowsSeveral && files[0].type.startsWith('image/')) void handlePhotos(files);
      else void handleUpload(files[0]);
      return;
    }
    void handlePhotos(files);
  };

  const removePhoto = (i: number) => {
    if (value?.creative_source !== 'upload') return;
    const all = [value.reference_image_url, ...(value.carouselExtraUrls ?? [])].filter((_, idx) => idx !== i);
    if (!all.length) {
      onChange({ creative_source: 'generate' });
      return;
    }
    onChange({ ...value, reference_image_url: all[0], previewUrl: all[0], carouselExtraUrls: all.slice(1) });
  };

  const handleUpload = async (file: File) => {
    setUploadError('');
    setUploading(true);
    try {
      const { url, is_video } = await CampaignService.uploadMedia(file);
      if (is_video) {
        setPendingVideoWho(url);
      } else {
        setPendingAttestation([url]);
      }
    } catch (err) {
      // Say why when we know (too large, connection dropped, refused) — a bare
      // "try again" gave the person, and us, nothing to go on.
      const e = err as { message?: string; response?: { data?: { detail?: string } } };
      const known = e?.response?.data?.detail || (e && !e.response ? e.message : '');
      setUploadError(known && known.length < 200 ? known : "Couldn't upload that file — try again.");
    } finally {
      setUploading(false);
    }
  };

  const resolveAttestation = (asset_attestation: AssetAttestation | undefined) => {
    const urls = pendingAttestation;
    if (!urls?.length) return;
    setPendingAttestation(null);
    onChange({
      creative_source: 'upload',
      reference_image_url: urls[0],
      is_video: false,
      previewUrl: urls[0],
      ...(urls.length > 1 ? { carouselExtraUrls: urls.slice(1) } : {}),
      asset_attestation,
    });
  };

  const resolveVideoWho = (provenance?: CreativeProvenanceInput) => {
    const url = pendingVideoWho;
    if (!url) return;
    setPendingVideoWho(null);
    onChange({
      creative_source: 'upload',
      reference_image_url: url,
      is_video: true,
      previewUrl: url,
      ...(provenance ?? {}),
    });
  };

  useEffect(() => {
    if (mode === 'draft') loadDrafts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode]);

  // TikTok Carousel Ads — extra slides beyond the base photo. Same direct-upload
  // shape as CampaignsPage.tsx's handleCarouselExtraFileChosen: multi-select
  // uploads every picked file in parallel and adds every good photo in one go,
  // caps the carousel at 35 slides total (base photo included), and skips a
  // stray video rather than failing the whole batch.
  const addCarouselSlides = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    e.target.value = '';
    if (!files.length || value?.creative_source !== 'upload') return;
    const existing = value.carouselExtraUrls ?? [];

    const remainingSlots = Math.max(0, 35 - 1 - existing.length);
    const toUpload = files.slice(0, remainingSlots);
    const dropped = files.length - toUpload.length;

    setUploadError('');
    if (!toUpload.length) {
      setUploadError("This carousel is already at TikTok's 35-photo limit.");
      return;
    }

    setCarouselUploading(true);
    try {
      const results = await Promise.allSettled(toUpload.map((file) => CampaignService.uploadMedia(file)));
      const uploaded: string[] = [];
      let videoSkipped = 0;
      let failed = 0;
      for (const result of results) {
        if (result.status !== 'fulfilled') {
          failed += 1;
          continue;
        }
        if (result.value.is_video) {
          videoSkipped += 1;
          continue;
        }
        uploaded.push(result.value.url);
      }
      if (uploaded.length) onChange({ ...value, carouselExtraUrls: [...existing, ...uploaded] });

      const notes: string[] = [];
      if (dropped > 0) notes.push(`${dropped} skipped — TikTok carousels max out at 35 photos`);
      if (videoSkipped > 0) notes.push(`${videoSkipped} skipped — carousel slides are photos, not video`);
      if (failed > 0) notes.push(`${failed} failed to upload`);
      if (notes.length) setUploadError(notes.join('; ') + '.');
    } finally {
      setCarouselUploading(false);
    }
  };

  const removeCarouselSlide = (i: number) => {
    if (value?.creative_source !== 'upload') return;
    onChange({ ...value, carouselExtraUrls: (value.carouselExtraUrls ?? []).filter((_, idx) => idx !== i) });
  };

  return (
    <div>
      <p style={{ margin: '0 0 14px', fontSize: 12.5, color: '#7a7270' }}>
        How should this ad's image or video come together?
      </p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10, maxWidth: 480 }}>
        <OptionCard
          title="Let Jane generate it"
          subtitle="On-brand AI creative built from your objective and audience — no asset needed."
          isOn={mode === 'generate' && !isTestMode}
          onClick={() => onChange({ creative_source: 'generate' })}
          disabledReason={isTikTok ? TIKTOK_IMAGE_ONLY : undefined}
        />
        {isMeta && (
          // A sibling block, not nested inside OptionCard's own <button> — same
          // reason the carousel picker below is a sibling: a <button> can't
          // legally contain the number-pill <button>s.
          <div
            style={{
              border: isTestMode ? `1.5px solid ${PINK}` : '1px solid #ece8e6',
              background: isTestMode ? 'rgba(194,24,91,.05)' : '#fff',
              borderRadius: 12,
              padding: '14px 16px',
              width: '100%',
            }}
          >
            <button
              type="button"
              onClick={() => setTestOpen(true)}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'flex-start',
                gap: 4,
                textAlign: 'left',
                background: 'none',
                border: 'none',
                padding: 0,
                width: '100%',
                cursor: 'pointer',
              }}
            >
              <span style={{ fontSize: 13.5, fontWeight: 800, color: isTestMode ? PINK : '#1a0a12' }}>
                Make several ads
              </span>
              <span style={{ fontSize: 12, color: '#7a7270', lineHeight: 1.45 }}>
                Different styles, Meta finds the best — 1 credit each.
              </span>
              {recommended && (
                <span
                  data-testid="wizard-recommended-ads"
                  style={{ fontSize: 12, color: '#1E8E4E', fontWeight: 700, lineHeight: 1.45 }}
                >
                  For your budget: {recommended.ads} ads
                  {recommended.ad_sets > 1 ? ` across ${recommended.ad_sets} ad sets` : ' in one ad set'}.
                </span>
              )}
            </button>
            {(testOpen || isTestMode) && (
              <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 8, marginTop: 10 }}>
                <span style={{ fontSize: 12.5, color: '#555', fontWeight: 700 }}>How many ads should Jane make?</span>
                {[2, 3, 4, 5, 6].map((n) => {
                  const picked = value?.creative_source === 'generate' && value.concepts === n;
                  return (
                    <button
                      key={n}
                      type="button"
                      aria-label={`Make ${n} ads`}
                      aria-pressed={picked}
                      onClick={() =>
                        onChange({
                          creative_source: 'generate',
                          concepts: n,
                          // Keep the Style step's choices for the ads that remain.
                          ...(value?.creative_source === 'generate' && value.ads
                            ? { ads: value.ads, style_mode: value.style_mode }
                            : {}),
                        })
                      }
                      style={{
                        minWidth: 36,
                        padding: '6px 10px',
                        borderRadius: 10,
                        border: picked ? `1.5px solid ${PINK}` : '1px solid #ece8e6',
                        background: picked ? 'rgba(194,24,91,.08)' : '#fff',
                        color: PINK,
                        fontWeight: 700,
                        fontSize: 13,
                        cursor: 'pointer',
                      }}
                    >
                      {n}
                      {recommended?.ads === n && (
                        <span style={{ display: 'block', fontSize: 9.5, fontWeight: 700, color: '#1E8E4E' }}>
                          Best fit
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        )}
        <OptionCard
          title="Upload my own"
          subtitle="Use a photo or video you already have."
          isOn={mode === 'upload'}
          onClick={() => document.getElementById('wizard-creative-upload-input')?.click()}
        >
          <input
            id="wizard-creative-upload-input"
            type="file"
            accept="image/*,video/*"
            multiple={allowsSeveral}
            style={{ display: 'none' }}
            onChange={(e) => {
              const files = Array.from(e.target.files ?? []);
              e.target.value = '';
              handleFiles(files);
            }}
          />
          {allowsSeveral && mode !== 'upload' && (
            <span style={{ fontSize: 11.5, color: '#9a9290' }}>You can pick several photos at once.</span>
          )}
          {uploading && <span style={{ fontSize: 12, color: '#7a7270' }}>Uploading…</span>}
          {uploadError && <span style={{ fontSize: 12, color: '#b91c1c' }}>{uploadError}</span>}
          {mode === 'upload' && value?.creative_source === 'upload' && !uploading && (
            <span style={{ fontSize: 12, color: PINK, fontWeight: 700 }}>
              {value.is_video
                ? 'Video uploaded ✓'
                : (value.carouselExtraUrls?.length ?? 0) > 0
                  ? `${1 + (value.carouselExtraUrls?.length ?? 0)} photos uploaded ✓`
                  : 'Image uploaded ✓'}
            </span>
          )}
        </OptionCard>
        {pendingAttestation && (
          <WizardAssetAttestation previewUrls={pendingAttestation} onAnswer={resolveAttestation} />
        )}
        {/* The chosen media itself — every photo (or the video), so the person sees exactly
            what will run. A sibling of the card above, which is a <button> and can't hold
            the remove/add buttons. TikTok keeps its own carousel strip below. */}
        {mode === 'upload' && value?.creative_source === 'upload' && !isTikTok && (
          <div style={{ marginTop: -2 }}>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {(value.is_video
                ? [value.reference_image_url]
                : [value.reference_image_url, ...(value.carouselExtraUrls ?? [])]
              ).map((url, i) => (
                <div
                  key={url + i}
                  style={{
                    position: 'relative',
                    width: 76,
                    height: 76,
                    borderRadius: 10,
                    overflow: 'hidden',
                    border: '1px solid #ece8e6',
                    background: '#f6f5f3',
                  }}
                >
                  {value.is_video ? (
                    <video src={url} muted playsInline style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  ) : (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={url}
                      alt={`Photo ${i + 1}`}
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                  )}
                  {!value.is_video && (value.carouselExtraUrls?.length ?? 0) > 0 && (
                    <span
                      style={{
                        position: 'absolute',
                        left: 4,
                        bottom: 4,
                        background: 'rgba(26,10,18,.72)',
                        color: '#fff',
                        fontSize: 10,
                        fontWeight: 700,
                        borderRadius: 6,
                        padding: '1px 5px',
                      }}
                    >
                      Ad {i + 1}
                    </span>
                  )}
                  <button
                    type="button"
                    aria-label={`Remove ${value.is_video ? 'video' : `photo ${i + 1}`}`}
                    onClick={() => removePhoto(i)}
                    style={{
                      position: 'absolute',
                      top: 4,
                      right: 4,
                      width: 20,
                      height: 20,
                      borderRadius: '50%',
                      border: 'none',
                      background: 'rgba(255,255,255,.92)',
                      color: PINK,
                      fontSize: 13,
                      lineHeight: '20px',
                      padding: 0,
                      cursor: 'pointer',
                    }}
                  >
                    ×
                  </button>
                </div>
              ))}
              {allowsSeveral && !value.is_video && 1 + (value.carouselExtraUrls?.length ?? 0) < maxPhotos && (
                <button
                  type="button"
                  onClick={() => document.getElementById('wizard-creative-upload-input')?.click()}
                  disabled={uploading}
                  style={{
                    width: 76,
                    height: 76,
                    borderRadius: 10,
                    border: '1.5px dashed #e0b8c9',
                    background: '#fff',
                    color: PINK,
                    fontSize: 11.5,
                    fontWeight: 700,
                    cursor: uploading ? 'default' : 'pointer',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 2,
                  }}
                >
                  <span style={{ fontSize: 20, lineHeight: 1 }}>+</span>
                  {uploading ? 'Uploading…' : 'Add photos'}
                </button>
              )}
            </div>
            {isMeta && !value.is_video && (value.carouselExtraUrls?.length ?? 0) > 0 && (
              <p style={{ margin: '6px 0 0', fontSize: 11.5, color: '#7a7270' }}>
                Each photo runs as its own ad in this campaign — Meta shows people the one that works best.
              </p>
            )}
          </div>
        )}
        {pendingVideoWho && (
          <div
            style={{
              background: '#faf7f6',
              border: '1px solid #ece8e6',
              borderRadius: 12,
              padding: 12,
              marginTop: -4,
            }}
          >
            <p style={{ margin: '0 0 10px', fontSize: 12.5, fontWeight: 700, color: '#1a0a12' }}>
              Who&rsquo;s in this video?
            </p>
            <VideoWhoPrompt info={creativePaths} onAnswer={resolveVideoWho} />
          </div>
        )}
        {/* TikTok Carousel Ads — only once a real base photo is attached and TikTok
            is the chosen platform; a video makes this irrelevant (TikTok already
            accepts that directly), and Meta has no carousel path here. Kept as a
            sibling, not nested inside the OptionCard button above, which is itself
            a <button> — a <button> can't legally contain other buttons (and this
            one needs its own "+ Add" and "×" buttons). */}
        {isTikTok &&
          mode === 'upload' &&
          value?.creative_source === 'upload' &&
          !value.is_video &&
          !(value.carouselExtraUrls?.length ?? 0) && (
            <p style={{ margin: '-2px 0 0', fontSize: 12, color: '#a15c00', fontWeight: 600 }}>
              Add at least one more photo — TikTok runs photos as a carousel of 2 or more (or upload a video).
            </p>
          )}
        {isTikTok && mode === 'upload' && value?.creative_source === 'upload' && !value.is_video && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'center', marginTop: -4 }}>
            <input
              id="wizard-carousel-upload-input"
              type="file"
              accept="image/png,image/jpeg,image/webp"
              multiple
              style={{ display: 'none' }}
              onChange={(e) => void addCarouselSlides(e)}
            />
            <button
              type="button"
              onClick={() => document.getElementById('wizard-carousel-upload-input')?.click()}
              disabled={carouselUploading}
              title="TikTok Carousel Ads need 2+ photos — select as many as you want at once"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                background: '#f6f5f3',
                border: '1px solid #e0dcd9',
                borderRadius: 20,
                padding: '6px 12px',
                fontSize: 12.5,
                fontWeight: 600,
                color: '#555',
                cursor: carouselUploading ? 'default' : 'pointer',
              }}
            >
              + {carouselUploading ? 'Uploading…' : 'Add carousel photos'}
            </button>
            {(value.carouselExtraUrls ?? []).map((url, i) => (
              <div
                key={url + i}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  background: '#fce4ec',
                  border: '1px solid #f5c2d8',
                  borderRadius: 20,
                  padding: '4px 6px 4px 4px',
                }}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={url} alt="" style={{ width: 22, height: 22, borderRadius: '50%', objectFit: 'cover' }} />
                <span style={{ fontSize: 12, color: PINK, fontWeight: 600 }}>Slide {i + 2}</span>
                <button
                  type="button"
                  onClick={() => removeCarouselSlide(i)}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: PINK,
                    cursor: 'pointer',
                    fontSize: 13,
                    padding: '0 4px',
                    lineHeight: 1,
                  }}
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        )}
        {flags.competitors && (
          <OptionCard
            title="Start from an ad I like"
            subtitle="Add a screenshot of an ad you liked. Jane makes your own version of the idea, in your brand."
            isOn={false}
            onClick={() => likedInput.current?.click()}
            disabledReason={isTikTok ? TIKTOK_IMAGE_ONLY : undefined}
          >
            <input
              ref={likedInput}
              type="file"
              accept="image/*"
              hidden
              aria-label="Screenshot of an ad you liked"
              onChange={(e) => {
                const f = e.target.files?.[0];
                e.target.value = '';
                if (f) setLikedAd(f);
              }}
            />
          </OptionCard>
        )}
        {likedAd && (
          <MakeFromPicture
            file={likedAd}
            from="builder"
            onClose={() => setLikedAd(null)}
            onUseInCampaign={(draft) => {
              setLikedAd(null);
              onChange({ creative_source: 'draft', draft_id: draft.draft_id, previewUrl: draft.image_url });
            }}
          />
        )}
        {isMeta && (
          <OptionCard
            title="Use a post you've already published"
            subtitle="Run an Instagram or Facebook post you made yourself. It keeps its likes and comments."
            isOn={mode === 'existing_post'}
            onClick={() => loadPosts(postPlatform)}
          >
            {postsOpen && (
              <div style={{ marginTop: 8, width: '100%' }} onClick={(e) => e.stopPropagation()}>
                <div style={{ display: 'flex', gap: 6, marginBottom: 8 }}>
                  {(['instagram', 'facebook'] as const).map((pf) => (
                    <button
                      key={pf}
                      type="button"
                      onClick={() => loadPosts(pf)}
                      style={{
                        padding: '5px 12px',
                        borderRadius: 999,
                        fontSize: 12,
                        fontWeight: 700,
                        cursor: 'pointer',
                        border: postPlatform === pf ? `1.5px solid ${PINK}` : '1px solid #ece8e6',
                        background: postPlatform === pf ? 'rgba(194,24,91,.05)' : '#fff',
                        color: postPlatform === pf ? PINK : '#1a0a12',
                      }}
                    >
                      {pf === 'instagram' ? 'Instagram' : 'Facebook'}
                    </button>
                  ))}
                </div>
                {posts[postPlatform] === undefined && (
                  <span style={{ fontSize: 12, color: '#7a7270' }}>Loading your posts…</span>
                )}
                {typeof posts[postPlatform] === 'string' && (
                  <span style={{ fontSize: 12, color: '#b3261e' }}>{posts[postPlatform] as string}</span>
                )}
                {Array.isArray(posts[postPlatform]) && (posts[postPlatform] as ExistingPost[]).length === 0 && (
                  <span style={{ fontSize: 12, color: '#7a7270' }}>No posts found on this account.</span>
                )}
                {Array.isArray(posts[postPlatform]) && (posts[postPlatform] as ExistingPost[]).length > 0 && (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 6 }}>
                    {(posts[postPlatform] as ExistingPost[]).map((p) => {
                      const isSelected = value?.creative_source === 'existing_post' && value.post_id === p.post_id;
                      return (
                        <button
                          key={p.post_id}
                          type="button"
                          onClick={() =>
                            onChange({
                              creative_source: 'existing_post',
                              post_platform: p.platform,
                              post_id: p.post_id,
                              caption: p.text,
                              is_video: p.is_video,
                              previewUrl: p.image_url,
                            })
                          }
                          style={{
                            padding: 0,
                            border: isSelected ? `2px solid ${PINK}` : '1px solid #ece8e6',
                            borderRadius: 8,
                            overflow: 'hidden',
                            cursor: 'pointer',
                            aspectRatio: '1',
                            background: `center/cover no-repeat url(${p.image_url})`,
                          }}
                          aria-label={p.text ? `Use post: ${p.text.slice(0, 60)}` : 'Use this post'}
                        />
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </OptionCard>
        )}
        <OptionCard
          title="Use a past draft"
          subtitle="Reuse an image from something you've already created."
          isOn={mode === 'draft'}
          onClick={loadDrafts}
          disabledReason={isTikTok ? TIKTOK_IMAGE_ONLY : undefined}
        >
          {showDrafts && (
            <div style={{ marginTop: 8, width: '100%' }}>
              {draftsLoading && <span style={{ fontSize: 12, color: '#7a7270' }}>Loading drafts…</span>}
              {!draftsLoading && drafts?.length === 0 && (
                <span style={{ fontSize: 12, color: '#7a7270' }}>No drafts yet — try another option.</span>
              )}
              {!draftsLoading && drafts && drafts.length > 0 && (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 6 }}>
                  {drafts.map((d) => {
                    const isSelected = value?.creative_source === 'draft' && value.draft_id === d.draft_id;
                    return (
                      <button
                        key={d.draft_id}
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onChange({ creative_source: 'draft', draft_id: d.draft_id, previewUrl: d.image_url });
                        }}
                        style={{
                          padding: 0,
                          border: isSelected ? `2px solid ${PINK}` : '1px solid #ece8e6',
                          borderRadius: 8,
                          overflow: 'hidden',
                          cursor: 'pointer',
                          aspectRatio: '1',
                          background: `center/cover no-repeat url(${d.image_url})`,
                        }}
                        aria-label={`Use draft from ${d.created_at}`}
                      />
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </OptionCard>
      </div>
    </div>
  );
}
