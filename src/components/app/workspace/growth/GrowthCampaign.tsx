'use client';

import { useCallback, useEffect, useState } from 'react';
import {
  GrowthCampaignDetail,
  GrowthDiagnosis,
  GrowthPolicy,
  GrowthRecommendation,
  GrowthService,
} from '@/src/api/GrowthService';
import { Btn, Card, Chip, errorText, inputStyle } from '../personality/ui';
import { ACTION_LABELS, CONFIDENCE_TONE, ago, naira, pct } from './format';

export function GrowthCampaign({
  campaignId,
  policy,
  canApprove,
  onBack,
}: {
  campaignId: string;
  policy: GrowthPolicy;
  canApprove: boolean;
  onBack: () => void;
}) {
  const [data, setData] = useState<GrowthCampaignDetail | null>(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState('');
  const [notice, setNotice] = useState('');

  const load = useCallback(async () => {
    try {
      setData(await GrowthService.campaign(campaignId));
    } catch (e) {
      setError(errorText(e, "Couldn't load this campaign."));
    }
  }, [campaignId]);

  useEffect(() => {
    load();
  }, [load]);

  async function refresh() {
    setBusy('refresh');
    setError('');
    try {
      const r = await GrowthService.refresh(campaignId);
      setNotice(
        r.findings
          ? `Checked: ${r.findings} thing${r.findings === 1 ? '' : 's'} to look at.`
          : 'Checked: nothing needs attention.'
      );
      await load();
    } catch (e) {
      setError(errorText(e, "Couldn't refresh from Meta."));
    }
    setBusy('');
  }

  async function act(rec: GrowthRecommendation, kind: 'approve' | 'rejected' | 'done') {
    setBusy(rec.id);
    setError('');
    try {
      if (kind === 'approve') {
        const a = await GrowthService.approve(rec.id);
        setNotice(
          a.status === 'executed'
            ? 'Done, and confirmed with Meta.'
            : a.status === 'unverified'
              ? 'Sent to Meta, but it hasn’t confirmed the change yet.'
              : `Meta refused the change: ${a.error ?? 'unknown error'}`
        );
      } else {
        await GrowthService.decide(rec.id, kind);
        setNotice(kind === 'done' ? 'Marked done. URI will measure the result.' : 'Dismissed.');
      }
      await load();
    } catch (e) {
      setError(errorText(e, "Couldn't do that."));
    }
    setBusy('');
  }

  if (!data) {
    return <div style={{ padding: 16, fontSize: 13, color: error ? '#C62828' : '#999' }}>{error || 'Loading…'}</div>;
  }

  const t = data.totals;
  const open = data.diagnoses.filter((d) => d.status === 'open');
  const recsFor = (d: GrowthDiagnosis) => data.recommendations.filter((r) => r.diagnosis_id === d.id);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
        <Btn kind="ghost" small onClick={onBack}>
          ← All campaigns
        </Btn>
        <div style={{ fontWeight: 800, fontSize: 16, color: '#1a1a1a', flex: 1 }}>{data.name}</div>
        <span style={{ fontSize: 11.5, color: data.health.last_error ? '#C62828' : '#999' }}>
          {data.health.last_error
            ? `Meta data failed: ${data.health.last_error}`
            : `Updated ${ago(data.health.last_updated)}`}
        </span>
        <Btn small kind="secondary" onClick={refresh} disabled={busy !== ''}>
          {busy === 'refresh' ? 'Checking…' : 'Check now'}
        </Btn>
      </div>
      {notice && <div style={{ fontSize: 12.5, color: '#1B5E20' }}>{notice}</div>}
      {error && <div style={{ fontSize: 12.5, color: '#C62828' }}>{error}</div>}

      <Card title="Campaign health" desc={`Last 28 days · ${data.health.attribution} · source: Meta Insights`}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: 10 }}>
          {[
            ['Spent', naira(t.spend_ngn)],
            ['Conversations', String(t.conversations)],
            ['Cost per conversation', naira(t.cost_per_conversation_ngn)],
            ['Target', data.goal.target_cpl_ngn ? naira(data.goal.target_cpl_ngn) : 'Not set'],
            ['Click-through', pct(t.ctr, 2)],
            ['Frequency', t.frequency ? t.frequency.toFixed(1) : '—'],
          ].map(([l, v]) => (
            <div key={l} style={{ background: '#fafafa', borderRadius: 10, padding: '10px 12px' }}>
              <div style={{ fontSize: 11.5, color: '#999' }}>{l}</div>
              <div style={{ fontSize: 17, fontWeight: 800, color: '#1a1a1a' }}>{v}</div>
            </div>
          ))}
        </div>
        <GoalEditor campaignId={campaignId} target={data.goal.target_cpl_ngn ?? null} onSaved={load} />
      </Card>

      <ChangePanel data={data} canChange={canApprove} onChanged={load} onNotice={setNotice} />

      <Card
        title={open.length ? `What needs attention (${open.length})` : 'Nothing needs attention'}
        desc="Causes are URI's best hypotheses from the evidence, with how confident it is. They aren't proven."
      >
        {open.length === 0 && (
          <div style={{ fontSize: 12.5, color: '#666' }}>
            URI checks this campaign every hour and will tell you when something changes meaningfully.
          </div>
        )}
        {open.map((d) => (
          <Diagnosis
            key={d.id}
            d={d}
            recs={recsFor(d)}
            policy={policy}
            canApprove={canApprove}
            busy={busy}
            onAct={act}
          />
        ))}
      </Card>

      <Card
        title="Leads from this campaign"
        desc="Conversations that started from this campaign's ads. Mark them Qualified, Converted or Lost in Customer Messages."
      >
        {!data.leads.available ? (
          <div style={{ fontSize: 12.5, color: '#666' }}>No conversations from this campaign's ads yet.</div>
        ) : (
          <>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              {Object.entries(data.leads.by_stage).map(([s, n]) => (
                <Chip key={s} tone={s === 'converted' ? 'green' : s === 'lost' ? 'grey' : 'pink'}>
                  {s} {n}
                </Chip>
              ))}
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 10 }}>
              {[
                ['Qualified rate', pct(data.leads.qualified_rate, 0)],
                ['Cost per lead', naira(data.leads.cost_per_lead_ngn)],
                ['Cost per qualified lead', naira(data.leads.cost_per_qualified_lead_ngn)],
                ['Cost per customer', naira(data.leads.customer_acquisition_cost_ngn)],
                ['Revenue recorded', naira(data.leads.revenue_ngn)],
                ['Return on ad spend', data.leads.roas ? `${data.leads.roas}×` : '—'],
              ].map(([l, v]) => (
                <div key={l} style={{ fontSize: 12.5 }}>
                  <div style={{ color: '#999', fontSize: 11.5 }}>{l}</div>
                  <div style={{ fontWeight: 800, color: '#1a1a1a' }}>{v}</div>
                </div>
              ))}
            </div>
            {data.leads.note && <div style={{ fontSize: 12, color: '#7A4B00' }}>{data.leads.note}</div>}
            {data.follow_ups.waiting > 0 && (
              <div style={{ fontSize: 12.5, color: '#C62828', fontWeight: 700 }}>
                {data.follow_ups.waiting} lead{data.follow_ups.waiting === 1 ? ' is' : 's are'} waiting for a reply
                (oldest {Math.round(data.follow_ups.oldest_hours)}h).
              </div>
            )}
          </>
        )}
      </Card>

      {data.creative_test && (
        <Card title="Creative test" desc={data.creative_test.reason}>
          {data.creative_test.variants.map((v) => (
            <div key={v.ad_id} style={{ display: 'flex', gap: 10, fontSize: 12.5, flexWrap: 'wrap' }}>
              <Chip tone={data.creative_test?.winner === v.ad_id ? 'green' : 'grey'}>v{v.version}</Chip>
              <span style={{ flex: 1 }}>{Object.values(v.attributes ?? {}).join(' · ') || v.ad_id}</span>
              <span>{v.conversations} conv</span>
              <span>{naira(v.cost_per_conversation_ngn)} each</span>
              {!v.enough_data && <span style={{ color: '#999' }}>needs more delivery</span>}
            </div>
          ))}
        </Card>
      )}

      <Card title="Rest of the campaign (estimate)">
        {data.forecast.available ? (
          <>
            <div style={{ fontSize: 13.5, color: '#1a1a1a' }}>
              Likely <strong>{data.forecast.conversations_range?.[0]}</strong>–
              <strong>{data.forecast.conversations_range?.[1]}</strong> more conversations over the remaining{' '}
              {data.forecast.remaining_days} days, spending about {naira(data.forecast.spend_estimate_ngn)}.
            </div>
            <ul style={{ margin: 0, paddingLeft: 18, fontSize: 11.5, color: '#888' }}>
              {data.forecast.assumptions?.map((a) => (
                <li key={a}>{a}</li>
              ))}
            </ul>
          </>
        ) : (
          <div style={{ fontSize: 12.5, color: '#666' }}>{data.forecast.reason}</div>
        )}
      </Card>
    </div>
  );
}

function Diagnosis({
  d,
  recs,
  policy,
  canApprove,
  busy,
  onAct,
}: {
  d: GrowthDiagnosis;
  recs: GrowthRecommendation[];
  policy: GrowthPolicy;
  canApprove: boolean;
  busy: string;
  onAct: (r: GrowthRecommendation, k: 'approve' | 'rejected' | 'done') => void;
}) {
  return (
    <div
      style={{
        border: `1px solid ${d.severity === 'high' ? 'rgba(198,40,40,.35)' : 'rgba(0,0,0,.1)'}`,
        borderRadius: 12,
        padding: 14,
        display: 'flex',
        flexDirection: 'column',
        gap: 10,
      }}
    >
      <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
        <div style={{ fontWeight: 800, fontSize: 14, color: '#1a1a1a', flex: 1 }}>{d.title}</div>
        <Chip tone={CONFIDENCE_TONE[d.confidence]}>{d.confidence} confidence</Chip>
        {d.window && (
          <span style={{ fontSize: 11, color: '#999' }}>
            {d.window.recent[0]} – {d.window.recent[1]} vs the week before
          </span>
        )}
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        {d.hypotheses.map((h) => (
          <div key={h.cause} style={{ fontSize: 12.5, color: '#333' }}>
            <strong>Likely:</strong> {h.cause} <span style={{ color: '#999' }}>({h.confidence})</span>
            <div style={{ color: '#666', marginTop: 2 }}>{h.why}</div>
          </div>
        ))}
        {d.alternatives.length > 0 && (
          <div style={{ fontSize: 12, color: '#888' }}>Could also be: {d.alternatives.join(' ')}</div>
        )}
        {d.market_signals.map((m) => (
          <div key={m.headline} style={{ fontSize: 12, color: '#0E7490' }}>
            Market signal ({m.source}): {m.headline}. <em>{m.label}</em>
          </div>
        ))}
      </div>
      {recs
        .filter((r) => ['proposed', 'failed', 'executed', 'unverified', 'done'].includes(r.status))
        .map((r) => (
          <div
            key={r.id}
            style={{
              background: '#fafafa',
              borderRadius: 10,
              padding: '10px 12px',
              display: 'flex',
              flexDirection: 'column',
              gap: 6,
            }}
          >
            <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
              <span style={{ fontWeight: 800, fontSize: 13, color: '#AD1457' }}>
                {ACTION_LABELS[r.action_type] ?? r.action_type}
              </span>
              {r.status !== 'proposed' && <Chip tone={r.status === 'failed' ? 'amber' : 'green'}>{r.status}</Chip>}
            </div>
            <div style={{ fontSize: 12.5, color: '#333' }}>{r.summary}</div>
            <div style={{ fontSize: 11.5, color: '#777' }}>
              Aim: {r.expected_goal}. Risk: {r.risk} Measured by {r.success_metric.toLowerCase()} over{' '}
              {r.eval_window_days} days.
            </div>
            {r.history?.text && <div style={{ fontSize: 11.5, color: '#0E7490' }}>{r.history.text}</div>}
            {r.status === 'proposed' && (
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                {r.executable ? (
                  canApprove ? (
                    <Btn small onClick={() => onAct(r, 'approve')} disabled={busy !== ''}>
                      {busy === r.id ? 'Applying…' : policy.mode === 'advisory' ? 'Do it for me' : 'Approve'}
                    </Btn>
                  ) : (
                    <span style={{ fontSize: 11.5, color: '#999' }}>An admin approves changes.</span>
                  )
                ) : (
                  <Btn small kind="secondary" onClick={() => onAct(r, 'done')} disabled={busy !== ''}>
                    I’ve done this
                  </Btn>
                )}
                <Btn small kind="ghost" onClick={() => onAct(r, 'rejected')} disabled={busy !== ''}>
                  Dismiss
                </Btn>
              </div>
            )}
          </div>
        ))}
    </div>
  );
}

function GoalEditor({
  campaignId,
  target,
  onSaved,
}: {
  campaignId: string;
  target: number | null;
  onSaved: () => void;
}) {
  const [value, setValue] = useState(target ? String(target) : '');
  const [saving, setSaving] = useState(false);
  return (
    <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap', fontSize: 12.5, color: '#555' }}>
      Target cost per conversation (₦)
      <input
        type="number"
        min={0}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        style={{ ...inputStyle, width: 120 }}
        placeholder="e.g. 500"
      />
      <Btn
        small
        kind="ghost"
        disabled={saving}
        onClick={async () => {
          setSaving(true);
          await GrowthService.setGoal(campaignId, { target_cpl_ngn: Number(value) || null }).catch(() => undefined);
          setSaving(false);
          onSaved();
        }}
      >
        {saving ? 'Saving…' : 'Save target'}
      </Btn>
      {!target && (
        <span style={{ color: '#999' }}>Without a target, URI compares against this campaign’s own past.</span>
      )}
    </div>
  );
}

function ChangePanel({
  data,
  canChange,
  onChanged,
  onNotice,
}: {
  data: GrowthCampaignDetail;
  canChange: boolean;
  onChanged: () => Promise<void>;
  onNotice: (s: string) => void;
}) {
  const c = data.controls;
  const [budget, setBudget] = useState(c?.daily_budget_ngn ? String(c.daily_budget_ngn) : '');
  const [busy, setBusy] = useState('');
  const [error, setError] = useState('');
  if (!c) return null;
  const running = (c.status || '').toUpperCase() === 'ACTIVE';

  async function run(
    key: string,
    action: 'pause_ad' | 'resume_ad' | 'pause_campaign' | 'resume_campaign' | 'set_daily_budget',
    params: { ad_id?: string; to_ngn?: number } = {}
  ) {
    setBusy(key);
    setError('');
    try {
      const a = await GrowthService.change(data.campaign_id, action, params);
      onNotice(
        a.status === 'executed'
          ? `${a.requested_change} — confirmed on Meta. Ads Manager shows the same.`
          : a.status === 'unverified'
            ? `${a.requested_change} — sent to Meta, not confirmed yet.`
            : `Meta refused: ${a.error ?? 'unknown error'}`
      );
      await onChanged();
    } catch (e) {
      setError(errorText(e, "Couldn't make that change."));
    }
    setBusy('');
  }

  return (
    <Card
      title="Make a change"
      desc="Changes apply to the live campaign on Meta, are read back to confirm, and appear in History where you can undo them."
      right={
        c.ads_manager_url ? (
          <a
            href={c.ads_manager_url}
            target="_blank"
            rel="noreferrer"
            style={{ fontSize: 12.5, color: '#AD1457', fontWeight: 700 }}
          >
            Open in Ads Manager ↗
          </a>
        ) : undefined
      }
    >
      {c.error && (
        <div style={{ fontSize: 12.5, color: '#C62828' }}>Couldn’t read the campaign from Meta: {c.error}</div>
      )}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', fontSize: 13 }}>
        <strong>Campaign</strong>
        <Chip tone={running ? 'green' : 'grey'}>{(c.status || 'unknown').toLowerCase().replace(/_/g, ' ')}</Chip>
        <div style={{ flex: 1 }} />
        {canChange && (
          <Btn
            small
            kind={running ? 'danger' : 'primary'}
            disabled={busy !== ''}
            onClick={() => run('campaign', running ? 'pause_campaign' : 'resume_campaign')}
          >
            {busy === 'campaign' ? 'Updating…' : running ? 'Pause campaign' : 'Resume campaign'}
          </Btn>
        )}
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', fontSize: 13 }}>
        <strong>Daily budget</strong>
        <span style={{ color: '#666' }}>now {naira(c.daily_budget_ngn)}</span>
        <div style={{ flex: 1 }} />
        {canChange && (
          <>
            <input
              type="number"
              min={1}
              value={budget}
              onChange={(e) => setBudget(e.target.value)}
              style={{ ...inputStyle, width: 120 }}
            />
            <Btn
              small
              kind="secondary"
              disabled={busy !== '' || !Number(budget) || Number(budget) === c.daily_budget_ngn}
              onClick={() => run('budget', 'set_daily_budget', { to_ngn: Number(budget) })}
            >
              {busy === 'budget' ? 'Updating…' : 'Set budget'}
            </Btn>
          </>
        )}
      </div>
      {c.ads.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <strong style={{ fontSize: 13 }}>Ads</strong>
          {c.ads.map((ad) => {
            const on = (ad.status || '').toUpperCase() === 'ACTIVE';
            return (
              <div
                key={ad.id}
                style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12.5, flexWrap: 'wrap' }}
              >
                <span style={{ flex: 1, minWidth: 160 }}>{ad.name}</span>
                <Chip tone={on ? 'green' : 'grey'}>{(ad.status || '').toLowerCase()}</Chip>
                {canChange && (
                  <Btn
                    small
                    kind="ghost"
                    disabled={busy !== ''}
                    onClick={() => run(`ad:${ad.id}`, on ? 'pause_ad' : 'resume_ad', { ad_id: ad.id })}
                  >
                    {busy === `ad:${ad.id}` ? 'Updating…' : on ? 'Pause ad' : 'Turn on'}
                  </Btn>
                )}
              </div>
            );
          })}
        </div>
      )}
      {error && <div style={{ fontSize: 12.5, color: '#C62828' }}>{error}</div>}
    </Card>
  );
}
