/**
 * Step 3 — budget and duration. Like Audience, there's no structured budget field on
 * the backend; the Review step folds this into the one composed message so Jane's NL
 * parsing picks up `budget_ngn` reliably (the same "Budget: ₦X" phrasing a real client
 * types in the chat flow today).
 */
'use client';

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
}: {
  value: WizardBudgetValue;
  onChange: (next: WizardBudgetValue) => void;
}) {
  return (
    <div>
      <h3 style={{ margin: '0 0 4px', fontSize: 16, fontWeight: 800, color: '#1a0a12' }}>Budget</h3>
      <p style={{ margin: '0 0 18px', fontSize: 13, color: '#7a7270' }}>
        What do you want to spend, and over how many days?
      </p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16, maxWidth: 420 }}>
        <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <span style={{ fontSize: 12.5, fontWeight: 700, color: '#1a0a12' }}>Total budget (₦)</span>
          <input
            type="number"
            min={0}
            inputMode="numeric"
            value={value.amountNgn}
            onChange={(e) => onChange({ ...value, amountNgn: e.target.value === '' ? '' : Number(e.target.value) })}
            placeholder="e.g. 15000"
            style={inputStyle}
          />
        </label>
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
      </div>
    </div>
  );
}
