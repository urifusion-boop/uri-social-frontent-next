/**
 * "What does this photo actually show?" — asked after every real (non-video) photo
 * upload, same compliance check the chat flow always runs (CampaignsPage.tsx's
 * pendingAssetAttestation/resolveAssetAttestation, VSG-01 v3 §1.2/§6) before the
 * photo is used in an ad. Same four answers, same AssetAttestation values sent back
 * on asset_attestation — redesigned as a flat inline card instead of a chat bubble
 * to match the rest of the wizard's step language.
 */
'use client';
import { AssetAttestation } from '@/src/api/CampaignService';

const PINK = '#C2185B';

const CHOICES: { value: AssetAttestation | undefined; label: string; primary: boolean }[] = [
  { value: 'product_photo', label: '📦 My real product', primary: true },
  { value: 'real_customer_photo', label: '🙋 A real customer (I have their permission)', primary: true },
  { value: 'owner_photo', label: '🧑🏾 Me or my team', primary: true },
  { value: undefined, label: 'Skip', primary: false },
];

export default function WizardAssetAttestation({
  previewUrls,
  onAnswer,
}: {
  /** One photo, or several picked together — asked once for the whole set. */
  previewUrls: string[];
  onAnswer: (value: AssetAttestation | undefined) => void;
}) {
  const several = previewUrls.length > 1;
  return (
    <div
      style={{
        display: 'flex',
        gap: 12,
        alignItems: 'flex-start',
        background: '#faf7f6',
        border: '1px solid #ece8e6',
        borderRadius: 12,
        padding: 12,
        marginTop: 8,
      }}
    >
      <div style={{ display: 'flex', flexShrink: 0 }}>
        {previewUrls.slice(0, 3).map((url, i) => (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            key={url + i}
            src={url}
            alt=""
            style={{
              width: 44,
              height: 44,
              borderRadius: 8,
              objectFit: 'cover',
              marginLeft: i ? -18 : 0,
              border: '2px solid #faf7f6',
            }}
          />
        ))}
        {previewUrls.length > 3 && (
          <span style={{ alignSelf: 'center', marginLeft: 4, fontSize: 11.5, fontWeight: 700, color: '#7a7270' }}>
            +{previewUrls.length - 3}
          </span>
        )}
      </div>
      <div style={{ minWidth: 0 }}>
        <p style={{ margin: '0 0 8px', fontSize: 12.5, fontWeight: 700, color: '#1a0a12' }}>
          {several
            ? `What do these ${previewUrls.length} photos actually show?`
            : 'What does this photo actually show?'}
        </p>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
          {CHOICES.map((c) => (
            <button
              key={c.label}
              type="button"
              onClick={() => onAnswer(c.value)}
              style={{
                border: c.primary ? 'none' : `1.5px solid ${PINK}`,
                background: c.primary ? `linear-gradient(135deg,${PINK},#8E1545)` : '#fff',
                color: c.primary ? '#fff' : PINK,
                borderRadius: 10,
                padding: '8px 13px',
                fontSize: 12.5,
                fontWeight: 700,
                cursor: 'pointer',
              }}
            >
              {c.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
