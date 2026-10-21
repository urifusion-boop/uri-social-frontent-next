'use client';

import { useCallback, useEffect, useState } from 'react';
import { GrowthAction, GrowthService } from '@/src/api/GrowthService';
import { Btn, Card, Chip, errorText } from '../personality/ui';
import { ACTION_LABELS, ago } from './format';

const VERDICT_TONE: Record<string, 'green' | 'amber' | 'grey'> = {
  improved: 'green',
  worse: 'amber',
  inconclusive: 'grey',
};

function describe(state?: Record<string, unknown>): string {
  if (!state) return '—';
  return Object.entries(state)
    .filter(([, v]) => v !== null && v !== undefined && v !== '')
    .map(([k, v]) => `${k.replace(/_/g, ' ')}: ${String(v)}`)
    .join(', ');
}

export function GrowthHistory({ canChange }: { canChange: boolean }) {
  const [actions, setActions] = useState<GrowthAction[]>([]);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState('');

  const load = useCallback(async () => {
    try {
      setActions((await GrowthService.history()).actions);
    } catch (e) {
      setError(errorText(e, "Couldn't load the history."));
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function undo(a: GrowthAction) {
    setBusy(a.action_id);
    setError('');
    try {
      await GrowthService.undo(a.action_id);
      await load();
    } catch (e) {
      setError(errorText(e, "Couldn't undo that."));
    }
    setBusy('');
  }

  return (
    <Card
      title="Optimization history"
      desc="Every change to your campaigns: who made it, what Meta reported before and after, and the measured result. Results are associations, not proof."
    >
      {error && <div style={{ color: '#C62828', fontSize: 12.5 }}>{error}</div>}
      {actions.length === 0 && <div style={{ fontSize: 12.5, color: '#999' }}>No changes yet.</div>}
      {actions.map((a) => (
        <div
          key={a.action_id}
          style={{
            borderBottom: '1px solid rgba(0,0,0,.06)',
            paddingBottom: 10,
            display: 'flex',
            flexDirection: 'column',
            gap: 4,
          }}
        >
          <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap', fontSize: 13 }}>
            <strong>{ACTION_LABELS[a.action_type] ?? a.action_type}</strong>
            <Chip tone={a.status === 'executed' ? 'green' : a.status === 'failed' ? 'amber' : 'grey'}>{a.status}</Chip>
            <span style={{ color: '#999', fontSize: 11.5 }}>
              {a.actor === 'uri' ? 'by URI (automatic)' : a.mode === 'manual' ? 'done by you' : 'approved by you'} ·{' '}
              {ago(a.executed_at)}
            </span>
            <div style={{ flex: 1 }} />
            {canChange && a.status === 'executed' && a.mode !== 'manual' && a.mode !== 'undo' && (
              <Btn small kind="ghost" onClick={() => undo(a)} disabled={busy !== ''}>
                {busy === a.action_id ? 'Undoing…' : 'Undo'}
              </Btn>
            )}
          </div>
          {a.requested_change && <div style={{ fontSize: 12.5, color: '#444' }}>{a.requested_change}</div>}
          {a.before_state && (
            <div style={{ fontSize: 11.5, color: '#888' }}>
              Before: {describe(a.before_state)} → After: {describe(a.after_state)}
            </div>
          )}
          {a.error && <div style={{ fontSize: 11.5, color: '#C62828' }}>{a.error}</div>}
          {a.evaluation ? (
            <div style={{ fontSize: 12, color: '#555' }}>
              <Chip tone={VERDICT_TONE[a.evaluation.verdict] ?? 'grey'}>{a.evaluation.verdict}</Chip>{' '}
              {a.evaluation.before !== null && a.evaluation.after !== null
                ? `${a.evaluation.metric.replace(/_/g, ' ')}: ${a.evaluation.before} → ${a.evaluation.after}. `
                : ''}
              {a.evaluation.note}
            </div>
          ) : (
            a.status === 'executed' && (
              <div style={{ fontSize: 11.5, color: '#999' }}>Result measured after its window.</div>
            )
          )}
        </div>
      ))}
    </Card>
  );
}
