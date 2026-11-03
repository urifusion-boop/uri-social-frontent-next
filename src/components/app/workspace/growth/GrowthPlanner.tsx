'use client';

import { useEffect, useState } from 'react';
import { GrowthExperiment, GrowthService, GrowthStructure, GrowthVerdictStatus } from '@/src/api/GrowthService';
import { Btn, Card, Chip, errorText, inputStyle } from '../personality/ui';
import { StructureSummary } from './GrowthTesting';
import { ago, naira, VERDICT_TONE } from './format';

const FILTERS: [GrowthVerdictStatus | '', string][] = [
  ['', 'All'],
  ['promising', 'Promising'],
  ['underperforming', 'Underperforming'],
  ['inconclusive', 'Inconclusive'],
];

export function GrowthPlanner() {
  return (
    <>
      <TestPlanner />
      <ExperimentLog />
    </>
  );
}

function TestPlanner() {
  const [daily, setDaily] = useState('');
  const [days, setDays] = useState('7');
  const [target, setTarget] = useState('');
  const [result, setResult] = useState<GrowthStructure | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  async function plan() {
    setBusy(true);
    setError('');
    try {
      setResult(
        await GrowthService.structure({
          daily_budget_ngn: Number(daily),
          days: Number(days) || 7,
          target_cost_ngn: Number(target) || undefined,
        })
      );
    } catch (e) {
      setError(errorText(e, "Couldn't work that out."));
    }
    setBusy(false);
  }

  const field = (label: string, value: string, set: (v: string) => void, placeholder: string) => (
    <label style={{ display: 'flex', flexDirection: 'column', gap: 4, fontSize: 12, color: '#555' }}>
      {label}
      <input
        type="number"
        min={0}
        value={value}
        placeholder={placeholder}
        onChange={(e) => set(e.target.value)}
        style={{ ...inputStyle, width: 140 }}
      />
    </label>
  );

  return (
    <Card
      title="Plan a test"
      desc="How many genuinely different ideas your budget can test, and how to set them up so each gets a fair chance."
    >
      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'flex-end' }}>
        {field('Daily budget (₦)', daily, setDaily, 'e.g. 6000')}
        {field('Days', days, setDays, '7')}
        {field('Most you’d pay per result (₦)', target, setTarget, 'e.g. 1500')}
        <Btn small onClick={plan} disabled={busy || !Number(daily)}>
          {busy ? 'Working…' : 'Plan it'}
        </Btn>
      </div>
      {!target && (
        <div style={{ fontSize: 11.5, color: '#999' }}>
          Without a target, URI can size the test to the budget but can’t say how much evidence each idea needs.
        </div>
      )}
      {error && <div style={{ fontSize: 12.5, color: '#C62828' }}>{error}</div>}
      {result && <StructureSummary s={result} />}
    </Card>
  );
}

function ExperimentLog() {
  const [filter, setFilter] = useState<GrowthVerdictStatus | ''>('');
  const [items, setItems] = useState<GrowthExperiment[] | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    setItems(null);
    GrowthService.experiments(filter || undefined)
      .then(setItems)
      .catch((e) => setError(errorText(e, "Couldn't load past tests.")));
  }, [filter]);

  return (
    <Card title="What we’ve learned" desc="Every ad URI has judged, with what it was testing and how it did.">
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
        {FILTERS.map(([k, label]) => (
          <Chip key={label} active={filter === k} onClick={() => setFilter(k)}>
            {label}
          </Chip>
        ))}
      </div>
      {error && <div style={{ fontSize: 12.5, color: '#C62828' }}>{error}</div>}
      {!items && !error && <div style={{ fontSize: 12.5, color: '#999' }}>Loading…</div>}
      {items?.length === 0 && (
        <div style={{ fontSize: 12.5, color: '#666' }}>
          Nothing yet. Ads appear here once a campaign has run and URI has checked it.
        </div>
      )}
      {items?.map((x) => {
        const what = [x.attributes?.concept, x.attributes?.hook, x.attributes?.format, x.attributes?.offer]
          .filter(Boolean)
          .join(' · ');
        return (
          <div
            key={`${x.campaign_id}:${x.ad_id}`}
            style={{ border: '1px solid rgba(0,0,0,.08)', borderRadius: 10, padding: '8px 12px', fontSize: 12.5 }}
          >
            <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
              <span style={{ fontWeight: 700, flex: 1, minWidth: 140 }}>{what || `Ad ${x.ad_id}`}</span>
              <span style={{ color: '#666' }}>
                {naira(x.spend_ngn)} · {x.results} {x.metric === 'orders' ? 'orders' : 'conv'}
                {x.cost_per_result_ngn ? ` · ${naira(x.cost_per_result_ngn)} each` : ''}
              </span>
              <Chip tone={VERDICT_TONE[x.status]}>{x.status}</Chip>
            </div>
            <div style={{ color: '#777', marginTop: 3 }}>
              {x.reason}{' '}
              <span style={{ color: '#aaa' }}>
                · {x.stage} · checked {ago(x.updated_at)}
              </span>
            </div>
          </div>
        );
      })}
    </Card>
  );
}
