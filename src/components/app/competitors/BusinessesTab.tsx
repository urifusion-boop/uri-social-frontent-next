'use client';

import { Competitor, CompetitorList, CompetitorService } from '@/src/api/CompetitorService';
import { useState } from 'react';
import { btn, C, card, errorText, font, input, linkLabel, Notice, pill, Steps } from './ui';

interface Props {
  data: CompetitorList | null;
  loading: boolean;
  discovering: boolean;
  onDiscover: (force: boolean) => void;
  onChange: (next: CompetitorList) => void;
  onSeeAds: (competitorId: string) => void;
  onOpenPlaybook: () => void;
  adCounts: Record<string, number>;
}

/** Who the business is up against: Jane's suggestions to confirm, the ones kept, and adding one. */
export default function BusinessesTab({ data, loading, discovering, onDiscover, onChange, onSeeAds, onOpenPlaybook, adCounts }: Props) {
  const [adding, setAdding] = useState(false);
  const suggested = data?.suggested ?? [];
  const active = data?.active ?? [];
  const job = data?.discovery;
  const failed = job?.status === 'failed';
  const thin = failed && job?.error?.code === 'playbook_thin';
  const empty = !loading && !suggested.length && !active.length;

  const replace = (c: Competitor) => {
    if (!data) return;
    const rest = (l: Competitor[]) => l.filter((x) => x.id !== c.id);
    onChange({
      ...data,
      suggested: c.status === 'suggested' ? [...rest(data.suggested), c] : rest(data.suggested),
      active: c.status === 'active' ? [...rest(data.active), c] : rest(data.active),
      removed_count: data.removed_count + (c.status === 'removed' ? 1 : 0),
    });
  };

  if (loading && !data) return <div style={{ minHeight: 200 }} aria-busy="true" />;

  return (
    <div style={{ ...font, display: 'flex', flexDirection: 'column', gap: 18 }}>
      {discovering && job && (
        <div style={card}>
          <div style={{ fontSize: 15, fontWeight: 800, color: C.ink }}>Looking for businesses like yours</div>
          <Steps steps={job.steps} />
          <div style={{ fontSize: 12.5, color: C.muted }}>This takes about a minute. You can leave; the bell will tell you what Jane found.</div>
        </div>
      )}

      {failed && !discovering && (
        <Notice>
          {job?.error?.message}{' '}
          {thin ? (
            <button type="button" onClick={onOpenPlaybook} style={btn('link')}>
              Open your Brand Playbook
            </button>
          ) : (
            <button type="button" onClick={() => onDiscover(false)} style={btn('link')}>
              Try again
            </button>
          )}
        </Notice>
      )}

      {empty && !discovering && !failed && (
        <div style={{ ...card, alignItems: 'center', textAlign: 'center', padding: '28px 18px', gap: 10 }}>
          <div style={{ fontSize: 17, fontWeight: 800, color: C.ink }}>Find businesses like yours</div>
          <div style={{ fontSize: 13.5, color: C.muted, maxWidth: 460, lineHeight: 1.55 }}>
            Jane searches the web using your Brand Playbook — what you sell and where — and checks every business she finds is real.
            You decide which ones count.
          </div>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', justifyContent: 'center' }}>
            <button type="button" onClick={() => onDiscover(false)} style={btn('primary')}>
              Find my competitors
            </button>
            <button type="button" onClick={() => setAdding(true)} style={btn('ghost')}>
              Add one I know
            </button>
          </div>
        </div>
      )}

      {suggested.length > 0 && (
        <section style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <div>
            <div style={{ fontSize: 15, fontWeight: 800, color: C.ink }}>Are these your competitors?</div>
            <div style={{ fontSize: 12.5, color: C.muted }}>Keep the ones that are. Tell Jane why the others aren&apos;t, and she won&apos;t suggest them again.</div>
          </div>
          <Grid>
            {suggested.map((c) => (
              <CompetitorCard key={c.id} c={c} reasons={data?.reasons ?? []} onChanged={replace} suggestion />
            ))}
          </Grid>
        </section>
      )}

      {(active.length > 0 || adding) && (
        <section style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, flexWrap: 'wrap' }}>
            <div>
              <div style={{ fontSize: 15, fontWeight: 800, color: C.ink }}>Your competitors</div>
              <div style={{ fontSize: 12.5, color: C.muted }}>Jane keeps these in mind in your posts and ads, and never names them.</div>
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              {!adding && (
                <button type="button" onClick={() => setAdding(true)} style={btn('ghost')}>
                  + Add a competitor
                </button>
              )}
              {!discovering && (
                <button type="button" onClick={() => onDiscover(true)} style={btn('quiet')}>
                  Look again
                </button>
              )}
            </div>
          </div>
          {adding && <AddForm onDone={() => setAdding(false)} onAdded={replace} />}
          <Grid>
            {active.map((c) => (
              <CompetitorCard key={c.id} c={c} reasons={data?.reasons ?? []} onChanged={replace} adCount={adCounts[c.id] ?? 0} onSeeAds={() => onSeeAds(c.id)} />
            ))}
          </Grid>
        </section>
      )}

    </div>
  );
}

function Grid({ children }: { children: React.ReactNode }) {
  return <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 10 }}>{children}</div>;
}

function CompetitorCard({
  c,
  reasons,
  onChanged,
  suggestion = false,
  adCount = 0,
  onSeeAds,
}: {
  c: Competitor;
  reasons: { value: string; label: string }[];
  onChanged: (c: Competitor) => void;
  suggestion?: boolean;
  adCount?: number;
  onSeeAds?: () => void;
}) {
  const [asking, setAsking] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const act = async (fn: () => Promise<Competitor>) => {
    setBusy(true);
    setError('');
    try {
      onChanged(await fn());
    } catch (e) {
      setError(errorText(e, "That didn't save. Try again."));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div style={{ ...card, borderColor: suggestion ? '#F3C6D8' : C.line }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8, alignItems: 'flex-start' }}>
        <div style={{ minWidth: 0 }}>
          <div style={{ fontSize: 14.5, fontWeight: 800, color: C.ink }}>{c.name}</div>
          {c.location && <div style={{ fontSize: 12, color: C.muted }}>{c.location}</div>}
        </div>
        {suggestion ? (
          <span style={pill(c.kind === 'direct' ? '#FDF2F7' : C.soft, c.kind === 'direct' ? C.pink : C.muted)}>
            {c.kind === 'direct' ? 'Direct' : 'Similar'}
          </span>
        ) : (
          <div role="radiogroup" aria-label={`How ${c.name} competes`} style={{ display: 'flex', border: `1px solid ${C.line}`, borderRadius: 999, overflow: 'hidden', flexShrink: 0 }}>
            {(['direct', 'similar'] as const).map((k) => (
              <button
                key={k}
                type="button"
                role="radio"
                aria-checked={c.kind === k}
                disabled={busy}
                onClick={() => c.kind !== k && void act(() => CompetitorService.setKind(c.id, k))}
                style={{ ...font, border: 'none', padding: '3px 9px', fontSize: 11, fontWeight: 700, cursor: 'pointer', background: c.kind === k ? C.pink : '#fff', color: c.kind === k ? '#fff' : C.muted }}
              >
                {k === 'direct' ? 'Direct' : 'Similar'}
              </button>
            ))}
          </div>
        )}
      </div>
      {(c.what_they_sell || c.description) && (
        <div style={{ fontSize: 13, color: C.body, lineHeight: 1.45 }}>{c.what_they_sell || c.description}</div>
      )}
      {c.why && <div style={{ fontSize: 12.5, color: C.muted, lineHeight: 1.45 }}>{c.why}</div>}
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', fontSize: 12 }}>
        {c.website && (
          <a href={c.website} target="_blank" rel="noopener noreferrer" style={{ color: C.pink, fontWeight: 600 }}>
            {linkLabel(c.website)}
          </a>
        )}
        {c.instagram && (
          <a href={`https://instagram.com/${c.instagram}`} target="_blank" rel="noopener noreferrer" style={{ color: C.pink, fontWeight: 600 }}>
            @{c.instagram}
          </a>
        )}
        {!c.website && !c.instagram && c.source_url && (
          <a href={c.source_url} target="_blank" rel="noopener noreferrer" style={{ color: C.muted }}>
            Where Jane found it
          </a>
        )}
      </div>
      {error && <div style={{ fontSize: 12, color: C.red }}>{error}</div>}
      {asking ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: C.body }}>Why not?</div>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {reasons.map((r) => (
              <button key={r.value} type="button" disabled={busy} onClick={() => void act(() => CompetitorService.remove(c.id, r.value))} style={{ ...btn('ghost', busy), padding: '4px 10px', fontSize: 12 }}>
                {r.label}
              </button>
            ))}
            <button type="button" onClick={() => setAsking(false)} style={btn('quiet')}>
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap', marginTop: 'auto' }}>
          {suggestion ? (
            <>
              <button type="button" disabled={busy} onClick={() => void act(() => CompetitorService.keep(c.id))} style={btn('primary', busy)}>
                Keep
              </button>
              <button type="button" disabled={busy} onClick={() => setAsking(true)} style={btn('quiet')}>
                Not a competitor
              </button>
            </>
          ) : (
            <>
              {onSeeAds && (
                <button type="button" onClick={onSeeAds} style={btn('ghost')}>
                  {adCount ? `Their ads (${adCount})` : 'Add their ads'}
                </button>
              )}
              <button type="button" disabled={busy} onClick={() => setAsking(true)} style={btn('quiet')}>
                Remove
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
}

function AddForm({ onDone, onAdded }: { onDone: () => void; onAdded: (c: Competitor) => void }) {
  const [name, setName] = useState('');
  const [link, setLink] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError("Add the business's name.");
      return;
    }
    setBusy(true);
    setError('');
    const isIg = /instagram\.com|^@/.test(link.trim());
    try {
      onAdded(await CompetitorService.add({ name: name.trim(), website: isIg ? '' : link.trim(), instagram: isIg ? link.trim() : '' }));
      onDone();
    } catch (err) {
      setError(errorText(err, "That didn't save. Try again."));
    } finally {
      setBusy(false);
    }
  };

  return (
    <form onSubmit={submit} style={{ ...card, flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 8 }}>
      <input id="cmp-add-name" aria-label="Business name" placeholder="Business name" value={name} onChange={(e) => setName(e.target.value)} style={{ ...input, flex: '1 1 180px' }} autoFocus />
      <input id="cmp-add-link" aria-label="Website or Instagram" placeholder="Website or @instagram (optional)" value={link} onChange={(e) => setLink(e.target.value)} style={{ ...input, flex: '1 1 220px' }} />
      <button type="submit" disabled={busy} style={btn('primary', busy)}>
        {busy ? 'Adding…' : 'Add'}
      </button>
      <button type="button" onClick={onDone} style={btn('quiet')}>
        Cancel
      </button>
      {error && <div style={{ flexBasis: '100%', fontSize: 12, color: C.red }}>{error}</div>}
    </form>
  );
}
