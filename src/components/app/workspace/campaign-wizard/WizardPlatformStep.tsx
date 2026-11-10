/**
 * Step 2 of the wizard — where this campaign runs. New: the wizard previously had
 * no platform control at all (Jane always picked silently, the chat flow's only
 * equivalent). Mirrors the chat flow's own PLATFORM chips (CampaignsPage.tsx's
 * PLATFORM_CHOICES for single mode, selectedPlatformsMulti for multi mode) so the
 * two surfaces stay backed by the exact same choices and the exact same backend
 * fields — this step only decides what preferred_platform / budget_ngn_override
 * end up as on the Review step's planFromMessage call, nothing else changes.
 */
'use client';
import { Sparkles, Instagram, Music2, Search, LucideIcon } from 'lucide-react';
import { PLATFORM_CHOICES } from '../CampaignsPage';

const PINK = '#C2185B';

export type WizardPlatformMode = 'single' | 'multi';
export type SingleWizardPlatform = '' | 'meta' | 'tiktok' | 'google';
export type MultiWizardPlatform = 'meta' | 'tiktok' | 'google';

export interface WizardPlatformValue {
  mode: WizardPlatformMode;
  single: SingleWizardPlatform;
  multi: MultiWizardPlatform[];
}

const ICON: Record<string, { Icon: LucideIcon; tint: string; fg: string }> = {
  '': { Icon: Sparkles, tint: '#EEE7FB', fg: '#6D3FC2' },
  meta: { Icon: Instagram, tint: '#FDE7EF', fg: '#C2185B' },
  tiktok: { Icon: Music2, tint: '#111827', fg: '#fff' },
  google: { Icon: Search, tint: '#E6F0FD', fg: '#2563C2' },
};

export default function WizardPlatformStep({
  value,
  onChange,
}: {
  value: WizardPlatformValue;
  onChange: (next: WizardPlatformValue) => void;
}) {
  const setMode = (mode: WizardPlatformMode) => onChange({ ...value, mode });
  const pickSingle = (p: SingleWizardPlatform) => onChange({ ...value, single: p });
  const toggleMulti = (p: MultiWizardPlatform) => {
    const has = value.multi.includes(p);
    onChange({ ...value, multi: has ? value.multi.filter((x) => x !== p) : [...value.multi, p] });
  };

  const cards = value.mode === 'single' ? PLATFORM_CHOICES : PLATFORM_CHOICES.filter((c) => c.value !== '');

  return (
    <div>
      <div
        style={{
          display: 'inline-flex',
          background: '#f7f5f8',
          border: '1px solid #ece8e6',
          borderRadius: 11,
          padding: 3,
          marginBottom: 16,
        }}
      >
        {(['single', 'multi'] as const).map((m) => (
          <button
            key={m}
            type="button"
            onClick={() => setMode(m)}
            style={{
              border: 'none',
              background: value.mode === m ? '#fff' : 'transparent',
              color: value.mode === m ? PINK : '#7a7270',
              borderRadius: 8,
              padding: '7px 15px',
              fontSize: 12.5,
              fontWeight: 700,
              cursor: 'pointer',
              boxShadow: value.mode === m ? '0 1px 2px rgba(0,0,0,.06)' : 'none',
            }}
          >
            {m === 'single' ? 'One platform' : 'Multiple platforms'}
          </button>
        ))}
      </div>

      <p style={{ margin: '0 0 14px', fontSize: 12.5, color: '#7a7270' }}>
        {value.mode === 'single'
          ? 'Where should this campaign run?'
          : 'Jane plans and launches each one separately, from this same brief.'}
      </p>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 10 }}>
        {cards.map((c) => {
          const { Icon, tint, fg } = ICON[c.value] ?? ICON[''];
          const isOn =
            value.mode === 'single' ? value.single === c.value : value.multi.includes(c.value as MultiWizardPlatform);
          return (
            <button
              key={c.value || 'auto'}
              type="button"
              data-testid={`wizard-platform-${c.value || 'auto'}`}
              aria-pressed={isOn}
              title={c.hint}
              onClick={() =>
                value.mode === 'single' ? pickSingle(c.value) : toggleMulti(c.value as MultiWizardPlatform)
              }
              style={{
                position: 'relative',
                display: 'flex',
                flexDirection: 'column',
                gap: 6,
                textAlign: 'left',
                border: isOn ? `1.5px solid ${PINK}` : '1px solid #ece8e6',
                background: isOn ? 'rgba(194,24,91,.05)' : '#fff',
                borderRadius: 12,
                padding: '13px 14px',
                cursor: 'pointer',
                boxShadow: isOn ? '0 2px 8px rgba(194,24,91,.14)' : 'none',
              }}
            >
              {isOn && (
                <span
                  style={{
                    position: 'absolute',
                    top: 10,
                    right: 10,
                    width: 17,
                    height: 17,
                    borderRadius: value.mode === 'multi' ? 5 : '50%',
                    background: PINK,
                    color: '#fff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 10,
                    fontWeight: 800,
                  }}
                >
                  ✓
                </span>
              )}
              <span
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: 32,
                  height: 32,
                  borderRadius: 9,
                  background: tint,
                  color: fg,
                }}
              >
                <Icon size={16} strokeWidth={2} />
              </span>
              <span style={{ fontSize: 13, fontWeight: 800, color: '#1a0a12' }}>{c.label}</span>
              <span style={{ fontSize: 11.5, color: '#7a7270', lineHeight: 1.4 }}>{c.hint}</span>
            </button>
          );
        })}
      </div>

      {value.mode === 'multi' && (
        <div
          style={{
            fontSize: 11.5,
            color: '#7a7270',
            background: '#f7f5f8',
            borderRadius: 9,
            padding: '8px 11px',
            marginTop: 14,
          }}
        >
          {value.multi.length === 0 ? (
            'Pick at least 2 platforms to run this on.'
          ) : value.multi.length === 1 ? (
            'Pick one more — multi-platform needs at least 2.'
          ) : (
            <>
              <b>{value.multi.length} platforms selected.</b> You&rsquo;ll set one total budget next — Jane splits it
              evenly and shows the per-platform amount before anything launches.
            </>
          )}
        </div>
      )}
    </div>
  );
}
