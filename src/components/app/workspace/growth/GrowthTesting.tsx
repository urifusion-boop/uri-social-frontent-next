'use client';

import { GrowthStage, GrowthStructure, GrowthTesting as Testing } from '@/src/api/GrowthService';
import { Card, Chip } from '../personality/ui';
import { STAGES, STRUCTURE_LABELS, VERDICT_TONE, naira } from './format';

export function StageTrack({ stage }: { stage: GrowthStage }) {
  const at = STAGES.findIndex(([k]) => k === stage);
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: 6 }}>
      {STAGES.map(([key, label, desc], i) => (
        <div
          key={key}
          style={{
            borderRadius: 10,
            padding: '8px 10px',
            background: i === at ? 'rgba(194,24,91,.08)' : '#fafafa',
            border: `1px solid ${i === at ? 'rgba(173,20,87,.35)' : 'transparent'}`,
            opacity: i > at ? 0.55 : 1,
          }}
        >
          <div style={{ fontSize: 12.5, fontWeight: 800, color: i === at ? '#AD1457' : '#1a1a1a' }}>
            {i < at ? '✓ ' : ''}
            {label}
          </div>
          <div style={{ fontSize: 11, color: '#777' }}>{desc}</div>
        </div>
      ))}
    </div>
  );
}

export function StructureSummary({ s }: { s: GrowthStructure }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4, fontSize: 12.5, color: '#333' }}>
      <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
        <strong>
          {s.concepts} concept{s.concepts === 1 ? '' : 's'} · {STRUCTURE_LABELS[s.structure]}
        </strong>
        {s.budget_too_small && <Chip tone="amber">Budget too small to judge</Chip>}
      </div>
      <div style={{ color: '#555' }}>{s.why}</div>
      {(s.spend_to_judge_per_concept_ngn || s.days_to_judge) && !s.budget_too_small && (
        <div style={{ fontSize: 11.5, color: '#888' }}>
          {s.spend_to_judge_per_concept_ngn
            ? `Each concept needs about ${naira(s.spend_to_judge_per_concept_ngn)} to be judged`
            : ''}
          {s.days_to_judge ? ` · about ${s.days_to_judge} day${s.days_to_judge === 1 ? '' : 's'} at this budget` : ''}.
        </div>
      )}
    </div>
  );
}

export function GrowthTesting({ testing, adNames }: { testing: Testing; adNames: Record<string, string> }) {
  return (
    <Card
      title="Testing: explore, validate, scale"
      desc="Each ad is judged against your target, and only once it has spent enough to be judged fairly."
    >
      <StageTrack stage={testing.stage} />
      <div style={{ fontSize: 12.5, color: '#333' }}>
        {testing.why} <strong>Next:</strong> {testing.next}
      </div>
      {testing.verdicts.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {testing.verdicts.map((v) => {
            const label = v.attributes?.concept || adNames[v.ad_id] || v.ad_id;
            return (
              <div
                key={v.ad_id}
                style={{ background: '#fafafa', borderRadius: 10, padding: '8px 12px', fontSize: 12.5 }}
              >
                <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                  <span style={{ fontWeight: 700, flex: 1, minWidth: 140 }}>{label}</span>
                  <span style={{ color: '#666' }}>
                    {naira(v.spend_ngn)} · {v.results} {v.metric === 'orders' ? 'orders' : 'conv'}
                    {v.cost_per_result_ngn ? ` · ${naira(v.cost_per_result_ngn)} each` : ''}
                  </span>
                  <Chip tone={VERDICT_TONE[v.status]}>{v.status}</Chip>
                </div>
                <div style={{ color: '#777', marginTop: 3 }}>{v.reason}</div>
              </div>
            );
          })}
        </div>
      )}
      {testing.next_round && (
        <div style={{ borderTop: '1px solid rgba(0,0,0,.06)', paddingTop: 10 }}>
          <div style={{ fontSize: 11.5, color: '#999', marginBottom: 4 }}>
            Next round at {naira(testing.next_round.daily_budget_ngn)} a day for a week
          </div>
          <StructureSummary s={testing.next_round} />
        </div>
      )}
    </Card>
  );
}
