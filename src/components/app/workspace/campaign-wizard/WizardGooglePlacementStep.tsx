/**
 * Google-only step, inserted right after Platform whenever a single Google
 * campaign is picked there. Mirrors the chat flow's own PLATFORM row exactly —
 * same GooglePlacementPicker component (GooglePlacementPreview.tsx), same four
 * placements, same default ('search') — just promoted to its own full step
 * instead of a small picker tucked under the platform chips. Purely client-side:
 * nothing here calls the backend, it only decides what google_placement ends up
 * as on the Finalize/Review step's planFromMessage call.
 */
'use client';
import { GOOGLE_PLACEMENTS, GooglePlacement, GooglePlacementPicker, placementLabel } from '../GooglePlacementPreview';

export default function WizardGooglePlacementStep({
  value,
  onChange,
  previewImageUrl,
}: {
  value: GooglePlacement;
  onChange: (p: GooglePlacement) => void;
  previewImageUrl?: string;
}) {
  return (
    <div>
      <p style={{ margin: '0 0 12px', fontSize: 12.5, color: '#7a7270' }}>
        This campaign will run on {placementLabel(value)}.{' '}
        {GOOGLE_PLACEMENTS.find((g) => g.value === value)?.where ?? ''} Pick where:
      </p>
      <GooglePlacementPicker
        value={value}
        onChange={onChange}
        ad={{
          headline: 'Your headline here',
          text: 'A short line about what you offer and why to tap.',
          imageUrl: previewImageUrl,
          business: 'Your business',
        }}
      />
    </div>
  );
}
