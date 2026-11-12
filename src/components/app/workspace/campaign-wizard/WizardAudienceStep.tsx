/**
 * Step 2 — who this campaign is for. The backend has no structured audience-targeting
 * endpoint (Jane extracts audience/geo from one free-text message), so this collects it
 * as two real fields instead of a single chat message — the Review step composes them
 * into the one message planFromMessage actually takes.
 */
'use client';

export interface WizardAudienceValue {
  description: string;
  city: string;
}

const inputStyle: React.CSSProperties = {
  width: '100%',
  border: '1px solid #ece8e6',
  borderRadius: 10,
  padding: '10px 12px',
  fontSize: 13.5,
  color: '#1a0a12',
  fontFamily: 'inherit',
};

export default function WizardAudienceStep({
  value,
  onChange,
}: {
  value: WizardAudienceValue;
  onChange: (next: WizardAudienceValue) => void;
}) {
  return (
    <div>
      <p style={{ margin: '0 0 14px', fontSize: 12.5, color: '#7a7270' }}>
        Tell Jane who you're trying to reach — she'll turn this into a targeting strategy.
      </p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14, maxWidth: 560 }}>
        <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <span style={{ fontSize: 12.5, fontWeight: 700, color: '#1a0a12' }}>
            What are you promoting, and who's it for?
          </span>
          <textarea
            value={value.description}
            onChange={(e) => onChange({ ...value, description: e.target.value })}
            placeholder="e.g. My bakery's custom birthday cakes — mostly young professionals planning a celebration"
            rows={4}
            style={{ ...inputStyle, resize: 'vertical', lineHeight: 1.5 }}
          />
        </label>
        <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <span style={{ fontSize: 12.5, fontWeight: 700, color: '#1a0a12' }}>Which city or area?</span>
          <input
            type="text"
            value={value.city}
            onChange={(e) => onChange({ ...value, city: e.target.value })}
            placeholder="e.g. Lekki, Lagos"
            style={inputStyle}
          />
        </label>
      </div>
    </div>
  );
}
