/**
 * Step 3 — budget and duration. Like Audience, there's no structured budget field on
 * the backend; the Review step folds this into the one composed message so Jane's NL
 * parsing picks up `budget_ngn` reliably (the same "Budget: ₦X" phrasing a real client
 * types in the chat flow today).
 */
'use client';

import { trackEvent } from '@/lib/analytics';
import { BudgetOption, CampaignService } from '@/src/api/CampaignService';
import { useEffect, useState } from 'react';

export interface WizardBudgetValue {
  amountNgn: number | '';
  days: number;
}

const DURATION_OPTIONS = [3, 7, 14, 30];

const inputStyle: React.CSSProperties = {
  width: '100%',
  border: '1px solid #ece8e6',
  borderRadius: 10,
  padding: '10px 12px',
  fontSize: 13.5,
  color: '#1a0a12',
  fontFamily: 'inherit',
};

export default function WizardBudgetStep({
  value,
  onChange,
  // Set when the Platform step (2) has multi-platform mode on with 2+ platforms
  // picked — shows the even split live, same number the Review step's
  // budget_ngn_override will actually use, so there's no surprise later.
  platformCount = 1,
  // Which platforms the campaign runs on, for the suggested amounts ('' = Jane picks → Meta's rules).
  platforms = ['meta'],
  suggest = true,
}: {
  value: WizardBudgetValue;
  onChange: (next: WizardBudgetValue) => void;
  platformCount?: number;
  platforms?: string[];
  /** Suggested amounts are rolled out in stages; off, the step is the plain amount box. */
  suggest?: boolean;
}) {
  const suggested = useBudgetSuggestions(suggest ? platforms : [], value.days, suggest);
  const perPlatform =
    platformCount > 1 && typeof value.amountNgn === 'number' && value.amountNgn > 0
      ? Math.round(value.amountNgn / platformCount)
      : null;
  return (
    <div>
      <p style={{ margin: '0 0 14px', fontSize: 12.5, color: '#7a7270' }}>
        {platformCount > 1
          ? `What's the total spend across all ${platformCount} platforms, and over how many days?`
          : 'What do you want to spend, and over how many days?'}
      </p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14, maxWidth: 560 }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <span style={{ fontSize: 12.5, fontWeight: 700, color: '#1a0a12' }}>How many days should it run?</span>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {DURATION_OPTIONS.map((d) => {
              const isOn = value.days === d;
              return (
                <button
                  key={d}
                  type="button"
                  onClick={() => onChange({ ...value, days: d })}
                  style={{
                    border: isOn ? '1.5px solid #C2185B' : '1px solid #ece8e6',
                    background: isOn ? 'rgba(194,24,91,.08)' : '#fff',
                    color: isOn ? '#C2185B' : '#1a0a12',
                    borderRadius: 999,
                    padding: '7px 16px',
                    fontSize: 13,
                    fontWeight: 700,
                    cursor: 'pointer',
                  }}
                >
                  {d} days
                </button>
              );
            })}
          </div>
        </div>
        {suggested.options.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <span style={{ fontSize: 12.5, fontWeight: 700, color: '#1a0a12' }}>Suggested</span>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 8 }}>
              {suggested.options.map((o) => {
                const isOn = value.amountNgn === o.amount_ngn;
                return (
                  <button
                    key={o.label}
                    type="button"
                    onClick={() => {
                      trackEvent('budget_suggestion_picked', { label: o.label, recommended: o.recommended, ads: o.ads, days: o.days });
                      onChange({ ...value, amountNgn: o.amount_ngn });
                    }}
                    title={o.detail}
                    aria-pressed={isOn}
                    style={{
                      textAlign: 'left',
                      border: isOn ? '1.5px solid #C2185B' : '1px solid #ece8e6',
                      boxShadow: isOn ? '0 0 0 3px rgba(194,24,91,.10)' : 'none',
                      background: '#fff',
                      borderRadius: 12,
                      padding: '10px 12px',
                      cursor: 'pointer',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 3,
                      fontFamily: 'inherit',
                    }}
                  >
                    <span style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                      <span style={{ fontSize: 15, fontWeight: 800, color: '#1a0a12' }}>
                        ₦{o.amount_ngn.toLocaleString()}
                      </span>
                      {o.recommended && (
                        <span
                          style={{
                            fontSize: 10,
                            fontWeight: 800,
                            textTransform: 'uppercase',
                            letterSpacing: '.06em',
                            color: '#C2185B',
                            background: 'rgba(194,24,91,.08)',
                            borderRadius: 6,
                            padding: '2px 6px',
                          }}
                        >
                          Recommended
                        </span>
                      )}
                    </span>
                    <span style={{ fontSize: 12, color: '#1a0a12', fontWeight: 600 }}>{o.what}</span>
                    <span style={{ fontSize: 11.5, color: '#7a7270', lineHeight: 1.4 }}>{o.detail}</span>
                  </button>
                );
              })}
            </div>
            {suggested.note && <span style={{ fontSize: 11.5, color: '#7a7270' }}>{suggested.note}</span>}
          </div>
        )}
        <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <span style={{ fontSize: 12.5, fontWeight: 700, color: '#1a0a12' }}>
            {suggested.options.length > 0
              ? platformCount > 1
                ? 'Or type a total (₦)'
                : 'Or type your own amount (₦)'
              : platformCount > 1
                ? 'Total budget (₦)'
                : 'Budget (₦)'}
          </span>
          <input
            type="number"
            min={0}
            inputMode="numeric"
            value={value.amountNgn}
            onChange={(e) => onChange({ ...value, amountNgn: e.target.value === '' ? '' : Number(e.target.value) })}
            placeholder="e.g. 15000"
            style={inputStyle}
          />
          {perPlatform != null && (
            <span
              style={{ fontSize: 11.5, color: '#7a7270', background: '#f7f5f8', borderRadius: 9, padding: '7px 10px' }}
            >
              <b style={{ color: '#1a0a12' }}>{platformCount} platforms selected</b> → ₦{perPlatform.toLocaleString()}{' '}
              per platform.
            </span>
          )}
        </label>
      </div>
    </div>
  );
}

/** Suggested amounts for the platforms picked. Several platforms: each tier is the sum of every
 * platform's tier, since the total is split evenly across them. A failed lookup just shows none. */
function useBudgetSuggestions(platforms: string[], days: number, enabled = true) {
  const [state, setState] = useState<{ options: BudgetOption[]; note: string }>({ options: [], note: '' });
  const key = `${platforms.join(',')}|${days}|${enabled}`;
  useEffect(() => {
    let alive = true;
    if (!enabled) {
      setState({ options: [], note: '' });
      return;
    }
    const list = platforms.length ? platforms : ['meta'];
    Promise.all(list.map((p) => CampaignService.getBudgetSuggestions(p || 'meta', days)))
      .then((all) => {
        if (!alive) return;
        if (all.length === 1) {
          setState({ options: all[0].options, note: all[0].note });
          return;
        }
        const tiers = Math.min(...all.map((a) => a.options.length));
        const options = Array.from({ length: tiers }, (_, i) => {
          const parts = all.map((a) => a.options[i]);
          return {
            ...parts[0],
            amount_ngn: parts.reduce((sum, o) => sum + o.amount_ngn, 0),
            what: `Across ${all.length} platforms`,
            detail: parts.map((o, j) => `${list[j] || 'meta'}: ₦${o.amount_ngn.toLocaleString()}`).join(' · '),
          };
        });
        setState({ options, note: all.find((a) => a.note)?.note ?? '' });
      })
      .catch(() => alive && setState({ options: [], note: '' }));
    return () => {
      alive = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);
  return state;
}
