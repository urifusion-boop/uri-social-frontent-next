'use client';

import { CampaignService } from '@/src/api/CampaignService';
import { AdAnalysis, AdList, Competitor, CompetitorAd, CompetitorService } from '@/src/api/CompetitorService';
import { Drawer } from '@mui/material';
import { useCallback, useEffect, useRef, useState } from 'react';
import { btn, C, card, errorText, font, input, linkLabel, Notice, pill } from './ui';

interface Props {
  competitors: Competitor[];
  competitorId: string;
  onCompetitorChange: (id: string) => void;
  onMakeOneLikeThis: (ad: CompetitorAd) => void;
  onCounts: (counts: Record<string, number>) => void;
}

const PLATFORMS = ['instagram', 'facebook', 'tiktok', 'other'];

/**
 * Ads the owner has seen from competitors. Uri can't pull competitor ads automatically yet, so
 * owners save the ones they notice; Jane reads each one and can make the business's own version.
 */
export default function TheirAdsTab({ competitors, competitorId, onCompetitorChange, onMakeOneLikeThis, onCounts }: Props) {
  const [list, setList] = useState<AdList | null>(null);
  const [angle, setAngle] = useState('');
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState('');
  const [adding, setAdding] = useState(false);
  const [open, setOpen] = useState<CompetitorAd | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const load = useCallback(async () => {
    setError('');
    try {
      const l = await CompetitorService.ads({ competitor_id: competitorId || undefined, angle: angle || undefined });
      setList(l);
      if (!competitorId && !angle) {
        const counts: Record<string, number> = {};
        for (const a of l.ads) if (a.competitor_id) counts[a.competitor_id] = (counts[a.competitor_id] ?? 0) + 1;
        onCounts(counts);
      }
    } catch (e) {
      setError(errorText(e, "Couldn't load the ads. Try again."));
    } finally {
      setLoading(false);
    }
  }, [competitorId, angle, onCounts]);

  useEffect(() => {
    setLoading(true);
    void load();
  }, [load]);

  // Keep checking while Jane is still reading a newly saved ad.
  useEffect(() => {
    if (timer.current) clearTimeout(timer.current);
    if (list?.ads.some((a) => a.status === 'analyzing')) timer.current = setTimeout(() => void load(), 4000);
    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
  }, [list, load]);

  useEffect(() => {
    if (open && list) {
      const fresh = list.ads.find((a) => a.id === open.id);
      if (fresh && fresh.status !== open.status) setOpen(fresh);
    }
  }, [list, open]);

  const more = async () => {
    if (!list?.next_before) return;
    setLoadingMore(true);
    try {
      const next = await CompetitorService.ads({ competitor_id: competitorId || undefined, angle: angle || undefined, before: list.next_before });
      setList({ ...next, ads: [...list.ads, ...next.ads] });
    } catch (e) {
      setError(errorText(e, "Couldn't load more ads."));
    } finally {
      setLoadingMore(false);
    }
  };

  const ads = list?.ads ?? [];
  const filtered = Boolean(competitorId || angle);

  return (
    <div style={{ ...font, display: 'flex', flexDirection: 'column', gap: 14 }}>
      <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
          <select aria-label="Competitor" value={competitorId} onChange={(e) => onCompetitorChange(e.target.value)} style={{ ...input, padding: '7px 10px', fontSize: 12.5 }}>
            <option value="">All competitors</option>
            {competitors.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {(list?.angles ?? []).filter((a) => a.value !== 'other').map((a) => (
              <button key={a.value} type="button" aria-pressed={angle === a.value} onClick={() => setAngle(angle === a.value ? '' : a.value)} style={{ ...btn(angle === a.value ? 'primary' : 'ghost'), padding: '4px 10px', fontSize: 11.5 }}>
                {a.label}
              </button>
            ))}
          </div>
        </div>
        {!adding && (
          <button type="button" onClick={() => setAdding(true)} style={btn('primary')}>
            + Add an ad you&apos;ve seen
          </button>
        )}
      </div>

      {adding && (
        <AddAdForm
          competitors={competitors}
          defaultCompetitor={competitorId}
          onDone={() => setAdding(false)}
          onSaved={(ad) => {
            setList((l) => ({ ...(l ?? { next_before: null, angles: [] }), ads: [ad, ...(l?.ads ?? [])] }));
            setAdding(false);
          }}
        />
      )}

      {error && <Notice>{error}</Notice>}

      {!loading && !ads.length && !adding && (
        <div style={{ ...card, alignItems: 'center', textAlign: 'center', padding: '28px 18px', gap: 10 }}>
          <div style={{ fontSize: 16, fontWeight: 800, color: C.ink }}>{filtered ? 'No ads here yet' : 'Save ads you see from competitors'}</div>
          <div style={{ fontSize: 13.5, color: C.muted, maxWidth: 480, lineHeight: 1.55 }}>
            Take a screenshot of a competitor&apos;s ad on Instagram, Facebook or TikTok and add it here. Jane reads it — the angle, the hook,
            the offer and why it works — and can make your own version of the idea in your brand.
          </div>
          <button type="button" onClick={() => setAdding(true)} style={btn('primary')}>
            + Add an ad you&apos;ve seen
          </button>
        </div>
      )}

      {ads.length > 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(190px, 1fr))', gap: 10 }}>
          {ads.map((a) => (
            <button key={a.id} type="button" onClick={() => setOpen(a)} style={{ ...card, padding: 0, overflow: 'hidden', cursor: 'pointer', textAlign: 'left', gap: 0 }}>
              <img src={a.image_url} alt={a.analysis && 'headline' in a.analysis ? a.analysis.headline : 'Competitor ad'} loading="lazy" style={{ width: '100%', aspectRatio: '1 / 1', objectFit: 'cover', background: C.soft, display: 'block' }} />
              <div style={{ padding: '8px 10px', display: 'flex', flexDirection: 'column', gap: 3 }}>
                <span style={{ fontSize: 12.5, fontWeight: 700, color: C.ink }}>{a.competitor_name || 'Competitor ad'}</span>
                {a.status === 'analyzing' ? (
                  <span style={{ fontSize: 11.5, color: C.amber }}>Jane is reading it…</span>
                ) : a.status === 'failed' ? (
                  <span style={{ fontSize: 11.5, color: C.red }}>Couldn&apos;t read it</span>
                ) : (
                  <span style={{ fontSize: 11.5, color: C.muted }}>{a.angle_label}{a.platform ? ` · ${a.platform}` : ''}</span>
                )}
              </div>
            </button>
          ))}
        </div>
      )}

      {list?.next_before && (
        <div style={{ textAlign: 'center' }}>
          <button type="button" onClick={() => void more()} disabled={loadingMore} style={btn('ghost', loadingMore)}>
            {loadingMore ? 'Loading…' : 'Show more'}
          </button>
        </div>
      )}

      <Drawer anchor="right" open={Boolean(open)} onClose={() => setOpen(null)} PaperProps={{ sx: { width: { xs: '100%', sm: 440 } } }}>
        {open && (
          <AdDetail
            ad={open}
            onClose={() => setOpen(null)}
            onMake={() => {
              onMakeOneLikeThis(open);
              setOpen(null);
            }}
            onDeleted={() => {
              setList((l) => (l ? { ...l, ads: l.ads.filter((x) => x.id !== open.id) } : l));
              setOpen(null);
            }}
          />
        )}
      </Drawer>
    </div>
  );
}

function AdDetail({ ad, onClose, onMake, onDeleted }: { ad: CompetitorAd; onClose: () => void; onMake: () => void; onDeleted: () => void }) {
  const [confirm, setConfirm] = useState(false);
  const [busy, setBusy] = useState(false);
  const a = ad.analysis as AdAnalysis;
  const rows: [string, string | undefined][] = [
    ['Main words', a.headline],
    ['What grabs attention', a.hook],
    ['Problem it speaks to', a.customer_problem],
    ['Offer', a.offer],
    ['What it asks people to do', a.cta],
    ['Layout', a.layout],
  ];
  const remove = async () => {
    setBusy(true);
    try {
      await CompetitorService.deleteAd(ad.id);
      onDeleted();
    } finally {
      setBusy(false);
    }
  };
  return (
    <div style={{ ...font, display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 18px', borderBottom: `1px solid ${C.line}` }}>
        <div>
          <div style={{ fontSize: 16, fontWeight: 800, color: C.ink }}>{ad.competitor_name || 'Competitor ad'}</div>
          <div style={{ fontSize: 12, color: C.muted }}>{[ad.platform, ad.angle_label].filter(Boolean).join(' · ')}</div>
        </div>
        <button type="button" onClick={onClose} aria-label="Close" style={btn('quiet')}>
          ✕
        </button>
      </div>
      <div style={{ padding: 18, overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: 14 }}>
        <img src={ad.image_url} alt="" style={{ width: '100%', borderRadius: 12, border: `1px solid ${C.line}` }} />
        {ad.status === 'analyzing' && <Notice tone="pink">Jane is reading this ad. It takes a few seconds.</Notice>}
        {ad.status === 'failed' && <Notice>{ad.error || "Jane couldn't read this ad."}</Notice>}
        {ad.status === 'ready' && (
          <>
            {a.why_it_works && (
              <div>
                <div style={{ fontSize: 10.5, fontWeight: 800, letterSpacing: '.1em', textTransform: 'uppercase', color: C.pink, marginBottom: 4 }}>Why it works</div>
                <div style={{ fontSize: 14, color: C.ink, lineHeight: 1.55 }}>{a.why_it_works}</div>
              </div>
            )}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {rows.filter(([, v]) => v).map(([k, v]) => (
                <div key={k}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: C.faint, textTransform: 'uppercase', letterSpacing: '.05em' }}>{k}</div>
                  <div style={{ fontSize: 13, color: C.body }}>{v}</div>
                </div>
              ))}
            </div>
          </>
        )}
        {ad.link && (
          <a href={ad.link} target="_blank" rel="noopener noreferrer" style={{ fontSize: 12.5, color: C.pink }}>
            {linkLabel(ad.link)}
          </a>
        )}
        {ad.note && <div style={{ fontSize: 12.5, color: C.muted }}>Your note: {ad.note}</div>}
      </div>
      <div style={{ padding: '12px 18px', borderTop: `1px solid ${C.line}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
        {confirm ? (
          <span style={{ display: 'flex', gap: 6, alignItems: 'center', fontSize: 12.5, color: C.body }}>
            Delete this ad?
            <button type="button" disabled={busy} onClick={() => void remove()} style={btn('ghost', busy)}>
              Delete
            </button>
            <button type="button" onClick={() => setConfirm(false)} style={btn('quiet')}>
              Keep
            </button>
          </span>
        ) : (
          <button type="button" onClick={() => setConfirm(true)} style={btn('quiet')}>
            Delete
          </button>
        )}
        <button type="button" disabled={ad.status !== 'ready'} onClick={onMake} style={btn('primary', ad.status !== 'ready')}>
          Make one like this
        </button>
      </div>
    </div>
  );
}

function AddAdForm({
  competitors,
  defaultCompetitor,
  onDone,
  onSaved,
}: {
  competitors: Competitor[];
  defaultCompetitor: string;
  onDone: () => void;
  onSaved: (ad: CompetitorAd) => void;
}) {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState('');
  const [competitorId, setCompetitorId] = useState(defaultCompetitor);
  const [platform, setPlatform] = useState('instagram');
  const [link, setLink] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => () => {
    if (preview) URL.revokeObjectURL(preview);
  }, [preview]);

  const pick = (f: File | undefined) => {
    if (!f) return;
    if (!f.type.startsWith('image/')) {
      setError('Add a picture of the ad — a screenshot works.');
      return;
    }
    setError('');
    setFile(f);
    setPreview(URL.createObjectURL(f));
  };

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) {
      setError('Add a picture of the ad — a screenshot works.');
      return;
    }
    setBusy(true);
    setError('');
    try {
      const { url } = await CampaignService.uploadMedia(file);
      onSaved(await CompetitorService.saveAd({ image_url: url, competitor_id: competitorId || undefined, platform, link: link.trim() }));
    } catch (err) {
      setError(errorText(err, "That didn't save. Try again."));
    } finally {
      setBusy(false);
    }
  };

  return (
    <form onSubmit={save} style={{ ...card, gap: 12 }}>
      <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap' }}>
        <label
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => {
            e.preventDefault();
            pick(e.dataTransfer.files?.[0]);
          }}
          style={{ width: 150, height: 150, borderRadius: 12, border: `1.5px dashed ${preview ? C.line : C.pink}`, display: 'flex', alignItems: 'center', justifyContent: 'center', textAlign: 'center', cursor: 'pointer', overflow: 'hidden', background: C.soft, flexShrink: 0 }}
        >
          {preview ? (
            <img src={preview} alt="The ad you picked" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          ) : (
            <span style={{ fontSize: 12.5, color: C.pink, fontWeight: 700, padding: 10 }}>Add the ad&apos;s picture or screenshot</span>
          )}
          <input id="cmp-ad-file" type="file" accept="image/*" hidden onChange={(e) => pick(e.target.files?.[0])} aria-label="Ad picture" />
        </label>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, flex: '1 1 240px', minWidth: 0 }}>
          <select aria-label="Whose ad is it?" value={competitorId} onChange={(e) => setCompetitorId(e.target.value)} style={input}>
            <option value="">Whose ad is it? (optional)</option>
            {competitors.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {PLATFORMS.map((p) => (
              <button key={p} type="button" aria-pressed={platform === p} onClick={() => setPlatform(p)} style={{ ...btn(platform === p ? 'primary' : 'ghost'), padding: '4px 10px', fontSize: 11.5, textTransform: 'capitalize' }}>
                {p}
              </button>
            ))}
          </div>
          <input id="cmp-ad-link" aria-label="Link to the ad" placeholder="Link to the ad (optional)" value={link} onChange={(e) => setLink(e.target.value)} style={input} />
        </div>
      </div>
      {error && <div style={{ fontSize: 12.5, color: C.red }}>{error}</div>}
      <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
        <button type="button" onClick={onDone} style={btn('quiet')}>
          Cancel
        </button>
        <button type="submit" disabled={busy} style={btn('primary', busy)}>
          {busy ? 'Saving…' : 'Save ad'}
        </button>
      </div>
      <span style={{ ...pill(C.soft, C.muted), alignSelf: 'flex-start' }}>Saved ads stay private to your brand.</span>
    </form>
  );
}
