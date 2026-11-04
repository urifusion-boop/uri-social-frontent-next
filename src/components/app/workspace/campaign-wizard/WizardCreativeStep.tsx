/**
 * Step 4 — how the ad's image/video gets made. Maps directly onto the backend's own
 * `creative_source` contract (CampaignService.ContinueChoice / ContinueChoice at
 * CampaignsPage.tsx:119) — generate/upload/draft are each a real, already-supported
 * path, so this step produces exactly what planFromMessage expects without any new
 * backend work. "Recomposite" (keep the real product, build a new scene) is left to
 * the chat flow for now — it's a refinement move on an existing image, which doesn't
 * fit a fresh wizard run.
 */
'use client';
import { useEffect, useState } from 'react';
import { CampaignService, DraftSummary } from '@/src/api/CampaignService';

const PINK = '#C2185B';

export type WizardCreativeChoice =
  | { creative_source: 'generate' }
  | { creative_source: 'upload'; reference_image_url: string; is_video: boolean; previewUrl: string }
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
}: {
  value: WizardCreativeChoice | null;
  onChange: (next: WizardCreativeChoice) => void;
}) {
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const [drafts, setDrafts] = useState<DraftSummary[] | null>(null);
  const [draftsLoading, setDraftsLoading] = useState(false);
  const [showDrafts, setShowDrafts] = useState(false);

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
      onChange({ creative_source: 'upload', reference_image_url: url, is_video, previewUrl: url });
    } catch {
      setUploadError("Couldn't upload that file — try again.");
    } finally {
      setUploading(false);
    }
  };

  useEffect(() => {
    if (mode === 'draft') loadDrafts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode]);

  return (
    <div>
      <h3 style={{ margin: '0 0 4px', fontSize: 16, fontWeight: 800, color: '#1a0a12' }}>Creative</h3>
      <p style={{ margin: '0 0 18px', fontSize: 13, color: '#7a7270' }}>
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
