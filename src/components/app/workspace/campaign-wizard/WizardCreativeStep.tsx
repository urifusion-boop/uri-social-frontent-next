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
import { useEffect, useState } from 'react';
import { AssetAttestation, CampaignService, CreativeProvenanceInput, DraftSummary } from '@/src/api/CampaignService';
import { useCreativePaths, VideoWhoPrompt } from '../CreativePathControls';
import WizardAssetAttestation from './WizardAssetAttestation';

const PINK = '#C2185B';

export type WizardCreativeChoice =
  | { creative_source: 'generate' }
  | ({
      creative_source: 'upload';
      reference_image_url: string;
      is_video: boolean;
      previewUrl: string;
      // TikTok Carousel Ads only — extra slides beyond the base photo
      // (reference_image_url is reused as slide 1), mirrors CampaignsPage.tsx's
      // own carouselExtraUrls exactly.
      carouselExtraUrls?: string[];
      // What the photo actually shows, per VSG-01 v3 §1.2/§6 — collected right
      // after upload, same as the chat flow; undefined for "Skip" or for a video
      // (attestation is a photo-only question there too).
      asset_attestation?: AssetAttestation;
    } & Partial<CreativeProvenanceInput>) // "who's in this video" — video uploads only
  | { creative_source: 'draft'; draft_id: string; previewUrl: string };

function OptionCard({
  title,
  subtitle,
  isOn,
  onClick,
  children,
}: {
  title: string;
  subtitle: string;
  isOn: boolean;
  onClick: () => void;
  children?: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
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
        cursor: 'pointer',
        width: '100%',
      }}
    >
      <span style={{ fontSize: 13.5, fontWeight: 800, color: isOn ? PINK : '#1a0a12' }}>{title}</span>
      <span style={{ fontSize: 12, color: '#7a7270', lineHeight: 1.45 }}>{subtitle}</span>
      {children}
    </button>
  );
}

export default function WizardCreativeStep({
  value,
  onChange,
  isTikTok = false,
}: {
  value: WizardCreativeChoice | null;
  onChange: (next: WizardCreativeChoice) => void;
  /** Mirrors the chat flow's own `preferredPlatformUi === 'tiktok'` gate on the
   *  carousel picker — single-platform TikTok only, same scope as the old page
   *  (it never offers carousel slides in multi-platform mode either). */
  isTikTok?: boolean;
}) {
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const [carouselUploading, setCarouselUploading] = useState(false);
  const [drafts, setDrafts] = useState<DraftSummary[] | null>(null);
  const [draftsLoading, setDraftsLoading] = useState(false);
  const [showDrafts, setShowDrafts] = useState(false);
  // A real (non-video) photo waits here for "what does this show?" before it
  // actually becomes the chosen creative — same gate the chat flow applies to
  // every real-photo entry point (CampaignsPage.tsx's pendingAssetAttestation).
  const [pendingAttestation, setPendingAttestation] = useState<string | null>(null);
  // Same idea for a real video — "who's in it?" (CampaignsPage.tsx's pendingVideoWho).
  const [pendingVideoWho, setPendingVideoWho] = useState<string | null>(null);
  const creativePaths = useCreativePaths('');

  const mode = value?.creative_source ?? null;

  const loadDrafts = () => {
    setShowDrafts(true);
    if (drafts !== null) return;
    setDraftsLoading(true);
    CampaignService.listDrafts()
      .then((r) => setDrafts(r.drafts))
      .catch(() => setDrafts([]))
      .finally(() => setDraftsLoading(false));
  };

  const handleUpload = async (file: File) => {
    setUploadError('');
    setUploading(true);
    try {
      const { url, is_video } = await CampaignService.uploadMedia(file);
      if (is_video) {
        setPendingVideoWho(url);
      } else {
        setPendingAttestation(url);
      }
    } catch {
      setUploadError("Couldn't upload that file — try again.");
    } finally {
      setUploading(false);
    }
  };

  const resolveAttestation = (asset_attestation: AssetAttestation | undefined) => {
    const url = pendingAttestation;
    if (!url) return;
    setPendingAttestation(null);
    onChange({
      creative_source: 'upload',
      reference_image_url: url,
      is_video: false,
      previewUrl: url,
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
          isOn={mode === 'generate'}
          onClick={() => onChange({ creative_source: 'generate' })}
        />
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
            style={{ display: 'none' }}
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) void handleUpload(file);
              e.target.value = '';
            }}
          />
          {uploading && <span style={{ fontSize: 12, color: '#7a7270' }}>Uploading…</span>}
          {uploadError && <span style={{ fontSize: 12, color: '#b91c1c' }}>{uploadError}</span>}
          {mode === 'upload' && value?.creative_source === 'upload' && !uploading && (
            <span style={{ fontSize: 12, color: PINK, fontWeight: 700 }}>
              {value.is_video ? 'Video uploaded ✓' : 'Image uploaded ✓'}
            </span>
          )}
        </OptionCard>
        {pendingAttestation && <WizardAssetAttestation previewUrl={pendingAttestation} onAnswer={resolveAttestation} />}
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
        <OptionCard
          title="Use a past draft"
          subtitle="Reuse an image from something you've already created."
          isOn={mode === 'draft'}
          onClick={loadDrafts}
        >
          {showDrafts && (
            <div style={{ marginTop: 8, width: '100%' }}>
              {draftsLoading && <span style={{ fontSize: 12, color: '#7a7270' }}>Loading drafts…</span>}
              {!draftsLoading && drafts?.length === 0 && (
                <span style={{ fontSize: 12, color: '#7a7270' }}>No drafts yet — try another option.</span>
              )}
              {!draftsLoading && drafts && drafts.length > 0 && (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(64px, 1fr))', gap: 6 }}>
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
