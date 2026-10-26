'use client';

import { useState } from 'react';
import { GrowthMode, GrowthPolicy, GrowthService } from '@/src/api/GrowthService';
import { Btn, Card, Chip, errorText, inputStyle } from '../personality/ui';
import { ACTION_LABELS } from './format';

const MODES: { id: GrowthMode; title: string; text: string }[] = [
  { id: 'advisory', title: 'Advise me', text: 'URI watches and recommends. You make every change.' },
  { id: 'approval', title: 'Ask me first', text: 'URI prepares the change; it runs when you approve it.' },
  {
    id: 'autonomous',
    title: 'Act within my limits',
    text: 'URI makes the changes you allow on its own, inside your caps, and tells you each time.',
  },
];

export function GrowthAutomation({
  policy,
  canChange,
  actions,
  onSaved,
}: {
  policy: GrowthPolicy;
  canChange: boolean;
  actions: string[];
  onSaved: (p: GrowthPolicy) => void;
}) {
  const [draft, setDraft] = useState<GrowthPolicy>(policy);
  const [confirm, setConfirm] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const switchingToAuto = draft.mode === 'autonomous' && policy.mode !== 'autonomous';

  async function save() {
    setBusy(true);
    setError('');
    try {
      onSaved(await GrowthService.savePolicy({ ...draft, confirm_autonomous: confirm }));
      setConfirm(false);
    } catch (e) {
      setError(errorText(e, "Couldn't save the automation settings."));
    }
    setBusy(false);
  }

  function num(key: keyof GrowthPolicy, label: string, hint: string, suffix = '') {
    return (
      <label style={{ display: 'flex', flexDirection: 'column', gap: 4, fontSize: 12.5, color: '#444' }}>
        <span style={{ fontWeight: 700 }}>{label}</span>
        <input
          type="number"
          min={0}
          disabled={!canChange}
          value={Number(draft[key] ?? 0)}
          onChange={(e) => setDraft({ ...draft, [key]: Number(e.target.value) })}
          style={inputStyle}
        />
        <span style={{ fontSize: 11, color: '#999' }}>
          {hint}
          {suffix}
        </span>
      </label>
    );
  }

  return (
    <Card
      title="Automation controls"
      desc="How much URI may do on its own. Nothing changes a campaign without your say-so unless you turn on 'Act within my limits'."
    >
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 10 }}>
        {MODES.map((m) => (
          <button
            key={m.id}
            type="button"
            disabled={!canChange}
            onClick={() => setDraft({ ...draft, mode: m.id })}
            style={{
              textAlign: 'left',
              borderRadius: 12,
              padding: 12,
              border: draft.mode === m.id ? '1.5px solid #E91E63' : '1px solid rgba(0,0,0,.1)',
              background: draft.mode === m.id ? 'rgba(194,24,91,.06)' : '#fff',
              cursor: canChange ? 'pointer' : 'default',
              fontFamily: 'inherit',
            }}
          >
            <div style={{ fontWeight: 800, fontSize: 13.5, color: '#1a1a1a' }}>{m.title}</div>
            <div style={{ fontSize: 12, color: '#666', marginTop: 4 }}>{m.text}</div>
          </button>
        ))}
      </div>

      {draft.mode === 'autonomous' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <div style={{ fontSize: 12.5, fontWeight: 700, color: '#444' }}>URI may do these on its own</div>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {actions.map((a) => {
              const on = draft.allowed_actions.includes(a);
              return (
                <Chip
                  key={a}
                  active={on}
                  onClick={
                    canChange
                      ? () =>
                          setDraft({
                            ...draft,
                            allowed_actions: on
                              ? draft.allowed_actions.filter((x) => x !== a)
                              : [...draft.allowed_actions, a],
                          })
                      : undefined
                  }
                >
                  {ACTION_LABELS[a] ?? a}
                </Chip>
              );
            })}
          </div>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12 }}>
        {num('max_daily_budget_ngn', 'Daily budget cap (₦)', '0 = URI never raises above the launch budget on its own')}
        {num('max_increase_pct_7d', 'Most increase in 7 days (%)', 'Across all budget changes')}
        {num('min_spend_before_pause_ngn', 'Spend before a pause (₦)', 'URI won’t suggest pausing before this')}
        {num('cooldown_hours', 'Wait between changes (hours)', 'Lets results come in before the next change')}
      </div>

      {switchingToAuto && (
        <label style={{ display: 'flex', gap: 8, alignItems: 'flex-start', fontSize: 12.5, color: '#7A4B00' }}>
          <input type="checkbox" checked={confirm} onChange={(e) => setConfirm(e.target.checked)} />I authorise URI to
          make the selected changes to my campaigns on its own, within these limits. I can turn this off or use the
          emergency stop at any time.
        </label>
      )}

      {error && <div style={{ color: '#C62828', fontSize: 12.5 }}>{error}</div>}
      {canChange ? (
        <div>
          <Btn onClick={save} disabled={busy || (switchingToAuto && !confirm)}>
            {busy ? 'Saving…' : 'Save'}
          </Btn>
        </div>
      ) : (
        <div style={{ fontSize: 12, color: '#999' }}>Only an admin can change automation settings.</div>
      )}
    </Card>
  );
}
