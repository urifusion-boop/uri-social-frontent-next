'use client';

/**
 * Records — the Campaign Inspector and Bucket Explorer (CI-SPEC-01 §4.1, §4.2).
 *
 * ADMIN ONLY, and deliberately not reachable from any client-facing surface (§4.5):
 * it shows other businesses' reasoning and performance, which exposing would create
 * an obligation nobody wants and a comparison that helps nobody. The nav item is
 * hidden unless /jane-ads/admin/access says yes, and every endpoint re-checks
 * server-side — the hidden item is convenience, not the control.
 *
 * The threshold discipline (§2.4) is enforced by the API, not here: below ten
 * campaigns the bucket returns no rows at all, so this renders the count and the
 * message it was given rather than inventing a chart. What it must never do is
 * present a number without the sample size beside it, which is why every figure on
 * this screen is shown next to its campaign count.
 */

import { useCallback, useEffect, useState } from 'react';
import {
  CampaignService,
  type BucketView,
  type CampaignRecord,
  type DigestView,
} from '@/src/api/CampaignService';

const PINK = '#C2185B';
const AMBER = '#a15c00';

const naira = (n: number | null | undefined) =>
  typeof n === 'number' ? `₦${Math.round(n).toLocaleString()}` : '—';
const pct = (n: number | null | undefined) =>
  typeof n === 'number' ? `${Math.round(n * 100)}%` : '—';

/** What a sample size licenses (§2.4) — always shown, never implied. */
function ThresholdBadge({ state, campaigns }: { state: string; campaigns: number }) {
  const label: Record<string, string> = {
    insufficient: 'too few to compare',
    observation_only: 'internal observation only',
    may_bias_defaults: 'enough to bias defaults',
    claimable: 'enough to state as fact',
  };
  const colour = state === 'claimable' ? '#1a7f37' : state === 'insufficient' ? AMBER : '#555';
  return (
    <span style={{ fontSize: 11.5, color: colour }}>
      {campaigns} campaigns — {label[state] || state}
    </span>
  );
}

export default function RecordsPanel() {
  const [tab, setTab] = useState<'records' | 'buckets' | 'digest'>('records');
  const [records, setRecords] = useState<CampaignRecord[]>([]);
  const [open, setOpen] = useState<CampaignRecord | null>(null);
  const [bucket, setBucket] = useState<BucketView | null>(null);
  const [digest, setDigest] = useState<DigestView | null>(null);
  const [category, setCategory] = useState('');
  const [city, setCity] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [backfilling, setBackfilling] = useState(false);

  const loadRecords = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      setRecords((await CampaignService.listCampaignRecords()).records || []);
    } catch {
      setError('Could not load records.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (tab === 'records') loadRecords();
    if (tab === 'digest') CampaignService.getDigest().then(setDigest).catch(() => setDigest(null));
  }, [tab, loadRecords]);

  const loadBucket = async () => {
    setLoading(true);
    setError('');
    try {
      setBucket(await CampaignService.getBucket({ business_category: category, city }));
    } catch {
      setError('Could not load that bucket.');
    } finally {
      setLoading(false);
    }
  };

  const backfill = async () => {
    setBackfilling(true);
    try {
      const out = await CampaignService.backfillRecordResults();
      setError(`Backfill: ${out.filled} filled, ${out.failed} failed.`);
      await loadRecords();
    } catch {
      setError('Backfill failed.');
    } finally {
      setBackfilling(false);
    }
  };

  return (
    <div style={{ flex: 1, overflowY: 'auto', padding: '18px 16px', maxWidth: 900 }}>
      <div style={{ display: 'flex', gap: 8, marginBottom: 14, flexWrap: 'wrap' }}>
        {(
          [
            ['records', 'Campaigns'],
            ['buckets', 'Buckets'],
            ['digest', 'What changed'],
          ] as const
        ).map(([t, label]) => (
          <button key={t} type="button" onClick={() => setTab(t)} style={tabBtn(tab === t)}>
            {label}
          </button>
        ))}
        <div style={{ flex: 1 }} />
        <button type="button" onClick={backfill} disabled={backfilling} style={ghostBtn}>
          {backfilling ? 'Pulling…' : 'Pull results from Meta'}
        </button>
      </div>

      {error && <div style={{ fontSize: 12, color: AMBER, marginBottom: 10 }}>{error}</div>}
      {loading && <div style={{ fontSize: 12.5, color: '#888' }}>Loading…</div>}

      {tab === 'records' && !open && (
        <>
          {records.length === 0 && !loading && (
            <div style={muted}>
              No records yet. One is written for every campaign launched from now on —
              campaigns that ran before this shipped cannot get one.
            </div>
          )}
          {records.map((r) => (
            <button key={r.campaign_id} type="button" onClick={() => setOpen(r)} style={rowBtn}>
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10 }}>
                <span style={{ fontWeight: 600, fontSize: 13 }}>
                  {r.context?.business_category || '—'} · {r.context?.city || '—'}
                </span>
                <span style={{ fontSize: 11.5, color: '#888' }}>
                  {r.created_at ? new Date(r.created_at).toLocaleDateString() : ''}
                </span>
              </div>
              <div style={{ fontSize: 11.5, color: '#666', marginTop: 3 }}>
                {naira(r.budget?.stated_ngn)} · {r.context?.budget_tier} ·{' '}
                {r.strategy?.plans_generated?.length || 0} plans generated
                {r.strategy?.recommendation_diverged && (
                  <span style={{ color: AMBER }}> · client overrode the recommendation</span>
                )}
                {r.exploration && <span style={{ color: PINK }}> · exploration</span>}
              </div>
            </button>
          ))}
        </>
      )}

      {tab === 'records' && open && <RecordDetail record={open} onBack={() => setOpen(null)} />}

      {tab === 'buckets' && (
        <>
          <div style={{ display: 'flex', gap: 8, marginBottom: 12, flexWrap: 'wrap' }}>
            <input
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              placeholder="category, e.g. home goods"
              style={input}
            />
            <input
              value={city}
              onChange={(e) => setCity(e.target.value)}
              placeholder="city, e.g. lagos"
              style={input}
            />
            <button type="button" onClick={loadBucket} style={btn}>
              Look
            </button>
          </div>
          {bucket && <BucketDetail view={bucket} />}
        </>
      )}

      {tab === 'digest' && digest && (
        <section style={card}>
          <div style={label}>Last {digest.window_days} days · {digest.campaigns} campaigns</div>
          {digest.items.length === 0 ? (
            // §4.3 — a digest that fires regardless of whether anything happened gets
            // ignored within a month. Nothing to report IS the report.
            <div style={muted}>Nothing crossed a threshold or moved materially.</div>
          ) : (
            digest.items.map((i, idx) => (
              <div key={idx} style={{ fontSize: 13, marginTop: 8, lineHeight: 1.5 }}>
                · {i.text}
              </div>
            ))
          )}
        </section>
      )}
    </div>
  );
}

function RecordDetail({ record, onBack }: { record: CampaignRecord; onBack: () => void }) {
  const s = record.strategy || ({} as CampaignRecord['strategy']);
  return (
    <div>
      <button type="button" onClick={onBack} style={ghostBtn}>
        ← All campaigns
      </button>

      <section style={card}>
        <div style={label}>Where the money went</div>
        <div style={{ fontSize: 13, marginTop: 4 }}>
          {naira(record.budget?.stated_ngn)} stated → {naira(record.budget?.effective_spend_ngn)} of
          ads + {naira(record.budget?.service_fee_ngn)} fee · {record.budget?.duration_days} days
        </div>
      </section>

      <section style={card}>
        <div style={label}>What Jane decided</div>
        <Line k="Areas" v={(s.geo_pockets || []).join(', ') || '—'} />
        <Line k="Strategy" v={record.context?.geo_strategy || '—'} />
        <Line k="Sends people to" v={record.context?.conversion_location || '—'} />
        <Line k="Corpus" v={`${s.corpus_coverage} · ${(s.corpus_records_cited || []).length} records cited`} />
      </section>

      <section style={card}>
        <div style={label}>Plans she generated</div>
        {(s.plans_generated || []).length === 0 ? (
          <div style={muted}>
            No variant picker was shown for this campaign, so there were no alternatives
            to reject.
          </div>
        ) : (
          (s.plans_generated || []).map((p) => {
            const chosen = s.plan_selected?.rank === p.rank;
            return (
              <div key={p.rank} style={{ marginTop: 8, fontSize: 12.5 }}>
                <span style={{ fontWeight: 600 }}>#{p.rank}</span>{' '}
                {p.recommended && <span style={{ color: '#1a7f37' }}>recommended </span>}
                {chosen && <span style={{ color: PINK }}>← client chose this </span>}
                <div style={{ color: '#666', marginTop: 2 }}>{p.who_its_for}</div>
              </div>
            );
          })
        )}
        {s.recommendation_diverged && (
          <div style={{ fontSize: 11.5, color: AMBER, marginTop: 10 }}>
            The client did not take the recommendation — the clearest signal that the
            ranking disagrees with them.
          </div>
        )}
      </section>

      <section style={card}>
        <div style={label}>What the client changed</div>
        {(record.modifications || []).length === 0 ? (
          <div style={muted}>Nothing — Jane was right first time.</div>
        ) : (
          (record.modifications || []).map((m, i) => (
            <div key={i} style={{ fontSize: 12.5, marginTop: 6 }}>
              <strong>{m.field}</strong>: {String(m.from)} → {String(m.to)}
            </div>
          ))
        )}
      </section>

      <section style={card}>
        <div style={label}>Results</div>
        {record.results ? (
          <pre style={{ fontSize: 11.5, margin: 0, whiteSpace: 'pre-wrap' }}>
            {JSON.stringify(record.results, null, 1)}
          </pre>
        ) : (
          <div style={muted}>
            Not pulled yet — use “Pull results from Meta”. Results are recoverable at any
            time; the decisions above are not, which is why they are captured live.
          </div>
        )}
      </section>
    </div>
  );
}

function BucketDetail({ view }: { view: BucketView }) {
  const h = view.headline;
  const c = view.comparison;
  return (
    <>
      <section style={card}>
        <div style={label}>This bucket</div>
        <div style={{ marginTop: 4 }}>
          <ThresholdBadge state={h.threshold_state} campaigns={h.campaigns} />
        </div>
        <div style={{ fontSize: 13, marginTop: 8, lineHeight: 1.7 }}>
          <Line k="Cost per conversation (median)" v={naira(h.median_cost_per_conversation_ngn)} />
          <Line k="Repeat rate" v={pct(h.repeat_rate)} />
          <Line k="Plan accepted first time" v={pct(h.plan_acceptance_rate)} />
          <Line k="Client overrode the recommendation" v={pct(h.recommendation_divergence_rate)} />
          <Line k="Exploration share" v={pct(h.exploration_share)} />
        </div>
      </section>

      <section style={card}>
        <div style={label}>By {c.dimension.replace('_', ' ')}</div>
        {/* Below the floor the API returns no rows at all — §2.4 requires a claim
            below threshold be impossible to surface, not merely discouraged. */}
        {c.rows.length === 0 ? (
          <div style={{ fontSize: 12.5, color: AMBER, marginTop: 6, lineHeight: 1.5 }}>
            {c.message || `${c.campaigns} campaigns — too few to rank.`}
          </div>
        ) : (
          c.rows.map((r) => (
            <div key={r.value} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12.5, marginTop: 6 }}>
              <span>
                {r.value}{' '}
                <span style={{ color: '#888' }}>
                  ({r.campaigns} campaign{r.campaigns === 1 ? '' : 's'})
                </span>
                {!r.sufficient && <span style={{ color: AMBER }}> · too few to rely on</span>}
              </span>
              <span style={{ fontWeight: 600 }}>{naira(r.median_cost_per_conversation_ngn)}</span>
            </div>
          ))
        )}
      </section>
    </>
  );
}

function Line({ k, v }: { k: string; v: string }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, fontSize: 12.5, marginTop: 4 }}>
      <span style={{ color: '#777' }}>{k}</span>
      <span style={{ fontWeight: 600, textAlign: 'right' }}>{v}</span>
    </div>
  );
}

const card: React.CSSProperties = {
  background: '#fff', border: '1px solid #ece8e5', borderRadius: 12,
  padding: '14px 16px', marginBottom: 12,
};
const label: React.CSSProperties = {
  fontSize: 11, fontWeight: 700, color: '#888', textTransform: 'uppercase', letterSpacing: 0.4,
};
const muted: React.CSSProperties = { fontSize: 12.5, color: '#777', marginTop: 6, lineHeight: 1.55 };
const btn: React.CSSProperties = {
  background: PINK, color: '#fff', border: 'none', borderRadius: 20,
  padding: '8px 16px', fontSize: 12.5, fontWeight: 600, cursor: 'pointer',
};
const ghostBtn: React.CSSProperties = {
  background: '#fff', color: '#555', border: '1px solid #e0dcd9', borderRadius: 16,
  padding: '6px 14px', fontSize: 12, cursor: 'pointer', marginBottom: 10,
};
const rowBtn: React.CSSProperties = {
  display: 'block', width: '100%', textAlign: 'left', background: '#fff',
  border: '1px solid #ece8e5', borderRadius: 10, padding: '10px 12px',
  marginBottom: 8, cursor: 'pointer',
};
const input: React.CSSProperties = {
  border: '1.5px solid #e0e0e0', borderRadius: 8, padding: '8px 12px', fontSize: 12.5, flex: 1, minWidth: 140,
};
const tabBtn = (active: boolean): React.CSSProperties => ({
  background: active ? '#fff' : 'transparent',
  color: active ? PINK : '#888',
  border: active ? '1px solid #ece8e5' : '1px solid transparent',
  borderRadius: 8, padding: '7px 14px', fontSize: 12.5, fontWeight: 600, cursor: 'pointer',
});
