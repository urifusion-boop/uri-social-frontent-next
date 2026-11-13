'use client';

import { BrandProfileService } from '@/src/api/BrandProfileService';
import type { DraftSummary } from '@/src/api/CampaignService';
import { AdAnalysis, CompetitorAd, CompetitorService, Recreation } from '@/src/api/CompetitorService';
import { EventBus, EVENTS } from '@/src/services/EventBus';
import { useEffect, useRef, useState } from 'react';
import { btn, C, card, errorText, font, input, Notice } from './ui';

interface Props {
  ad: CompetitorAd;
  onClose: () => void;
  onUseInCampaign: (draft: DraftSummary) => void;
}

/**
 * "Make one like this": the reference on the left, this business's own versions on the right.
 * A focused full-screen view (not a pop-up) because comparing needs the width. The panel says
 * what is taken from the reference (the idea) and what isn't (its words, logo, people, prices).
 */
export default function AdComposer({ ad, onClose, onUseInCampaign }: Props) {
  const [products, setProducts] = useState<string[]>([]);
  const [product, setProduct] = useState('');
  const [count, setCount] = useState(3);
  const [rec, setRec] = useState<Recreation | null>(null);
  const [starting, setStarting] = useState(false);
  const [using, setUsing] = useState<number | null>(null);
  const [error, setError] = useState('');
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const a = ad.analysis as AdAnalysis;

  useEffect(() => {
    BrandProfileService.get()
      .then((r) => {
        const list = (r.status ? r.responseData?.key_products_services : []) ?? [];
        setProducts(list.filter(Boolean));
        if (list[0]) setProduct(list[0]);
      })
      .catch(() => undefined);
  }, []);

  // Escape closes. The handler reads the latest onClose from a ref, so a parent re-render (which
  // hands down a new onClose) never re-runs this effect — re-running its cleanup used to cancel
  // the check for the next version, leaving the page stuck at "1 of 3 ready".
  const closeRef = useRef(onClose);
  closeRef.current = onClose;
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && closeRef.current();
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('keydown', onKey);
      if (timer.current) clearTimeout(timer.current);
    };
  }, []);

  const follow = (r: Recreation) => {
    if (timer.current) clearTimeout(timer.current);
    if (r.status !== 'running') return;
    timer.current = setTimeout(async () => {
      try {
        const next = await CompetitorService.recreation(r.id);
        if (next.results.length > r.results.length) EventBus.emit(EVENTS.CREDIT_CONSUMED, { amount: next.results.length - r.results.length, operation: 'ad_recreate' });
        setRec(next);
        follow(next);
      } catch {
        follow(r);
      }
    }, r.poll_after_ms ?? 3000);
  };

  const make = async () => {
    setStarting(true);
    setError('');
    try {
      const r = await CompetitorService.recreate(ad.id, product, count);
      setRec(r);
      follow({ ...r, poll_after_ms: 2500 });
    } catch (e) {
      setError(errorText(e, "Jane couldn't start on that just now. Try again."));
    } finally {
      setStarting(false);
    }
  };

  const use = async (i: number) => {
    if (!rec) return;
    setUsing(i);
    setError('');
    try {
      onUseInCampaign(await CompetitorService.keepVersion(rec.id, i));
    } catch (e) {
      setError(errorText(e, "That didn't open in the campaign builder. Try again."));
      setUsing(null);
    }
  };

  const waiting = rec ? Math.max(0, rec.count - rec.results.length) : 0;

  return (
    <div role="dialog" aria-modal="true" aria-label="Make one like this" style={{ ...font, position: 'fixed', inset: 0, zIndex: 1300, background: '#FAF7F8', display: 'flex', flexDirection: 'column', paddingTop: 'env(safe-area-inset-top, 0px)' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, padding: '14px 20px', borderBottom: `1px solid ${C.line}`, background: '#fff' }}>
        <div style={{ minWidth: 0 }}>
          <div style={{ fontSize: 17, fontWeight: 800, color: C.ink }}>Make one like this</div>
          <div style={{ fontSize: 12.5, color: C.muted }}>Your own version of {ad.competitor_name ? `${ad.competitor_name}'s` : 'this'} ad idea, in your brand.</div>
        </div>
        <button type="button" onClick={onClose} style={btn('quiet')}>
          ✕ Close
        </button>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: 20 }}>
        <div style={{ maxWidth: 1100, margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 16, alignItems: 'start' }}>
          <div style={card}>
            <div style={{ fontSize: 10.5, fontWeight: 800, letterSpacing: '.1em', textTransform: 'uppercase', color: C.pink }}>The reference</div>
            <img src={ad.image_url} alt="" style={{ width: '100%', borderRadius: 10, border: `1px solid ${C.line}` }} />
            <div style={{ fontSize: 12.5, color: C.body, lineHeight: 1.5 }}>
              <b>Taken from it:</b> {[a.hook && `the hook (${a.hook})`, a.layout && 'the layout', ad.angle_label && `the ${ad.angle_label.toLowerCase()} angle`].filter(Boolean).join(', ') || 'the idea'}.
            </div>
            <div style={{ fontSize: 12.5, color: C.muted, lineHeight: 1.5 }}>
              <b>Not copied:</b> their words, logo, people or prices. Only offers you actually have are used.
            </div>
          </div>

          <div style={{ ...card, gridColumn: 'span 2', minWidth: 0 }} className="cmp-results">
            <style>{`@media (max-width: 640px){.cmp-results{grid-column: auto !important}}`}</style>
            {!rec ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div style={{ fontSize: 15, fontWeight: 800, color: C.ink }}>What should your version advertise?</div>
                {products.length > 0 ? (
                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                    {products.slice(0, 10).map((p) => (
                      <button key={p} type="button" aria-pressed={product === p} onClick={() => setProduct(p)} style={{ ...btn(product === p ? 'primary' : 'ghost'), padding: '5px 12px' }}>
                        {p}
                      </button>
                    ))}
                  </div>
                ) : null}
                <input id="cmp-recreate-product" aria-label="What to advertise" placeholder="Or type what to advertise" value={product} onChange={(e) => setProduct(e.target.value)} style={input} />
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', fontSize: 13, color: C.body }}>
                  How many versions?
                  {[1, 2, 3].map((n) => (
                    <button key={n} type="button" aria-pressed={count === n} onClick={() => setCount(n)} style={{ ...btn(count === n ? 'primary' : 'ghost'), padding: '4px 12px' }}>
                      {n}
                    </button>
                  ))}
                  <span style={{ color: C.muted, fontSize: 12 }}>
                    {count} content credit{count !== 1 ? 's' : ''}
                  </span>
                </div>
                {error && <Notice>{error}</Notice>}
                <div>
                  <button type="button" onClick={() => void make()} disabled={starting} style={btn('primary', starting)}>
                    {starting ? 'Starting…' : `Make my version${count !== 1 ? 's' : ''}`}
                  </button>
                </div>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                  <div style={{ fontSize: 15, fontWeight: 800, color: C.ink }}>For {rec.product || 'your business'}</div>
                  <div style={{ fontSize: 12.5, color: C.muted }} aria-live="polite">
                    {rec.status === 'running' ? `${rec.results.length} of ${rec.count} ready` : rec.status === 'failed' ? '' : 'All ready'}
                  </div>
                </div>
                {rec.status === 'failed' && <Notice>{rec.error || "Jane couldn't finish these. Try again shortly."}</Notice>}
                {error && <Notice>{error}</Notice>}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 10 }}>
                  {rec.results.map((r, i) => (
                    <div key={r.image_url} style={{ ...card, padding: 0, overflow: 'hidden', gap: 0 }}>
                      <img src={r.image_url} alt={r.headline} style={{ width: '100%', aspectRatio: '1 / 1', objectFit: 'cover', display: 'block' }} />
                      <div style={{ padding: '10px 12px', display: 'flex', flexDirection: 'column', gap: 6 }}>
                        <div style={{ fontSize: 13.5, fontWeight: 800, color: C.ink }}>{r.headline}</div>
                        <div style={{ fontSize: 12.5, color: C.muted, lineHeight: 1.45 }}>{r.primary_text}</div>
                        <button type="button" onClick={() => void use(i)} disabled={using !== null} style={btn('primary', using !== null)}>
                          {using === i ? 'Opening…' : 'Use in a campaign →'}
                        </button>
                      </div>
                    </div>
                  ))}
                  {rec.status === 'running' &&
                    Array.from({ length: waiting }).map((_, i) => (
                      <div key={`wait-${i}`} style={{ ...card, padding: 0, overflow: 'hidden', gap: 0 }}>
                        <div className="cmp-shimmer" style={{ width: '100%', aspectRatio: '1 / 1' }} />
                        <div style={{ padding: '10px 12px', fontSize: 12.5, color: C.muted }}>Making version {rec.results.length + i + 1}…</div>
                      </div>
                    ))}
                </div>
                <style>{`.cmp-shimmer{background:linear-gradient(90deg,#F1E8EC 0%,#F9F4F6 40%,#F1E8EC 80%);background-size:200% 100%;animation:cmpsh 1.4s linear infinite}
                  @keyframes cmpsh{to{background-position:-200% 0}}@media (prefers-reduced-motion: reduce){.cmp-shimmer{animation:none}}`}</style>
                {rec.status !== 'running' && (
                  <div>
                    <button type="button" onClick={() => setRec(null)} style={btn('ghost')}>
                      Make different versions
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
