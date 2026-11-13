/**
 * Step 2 — what's being advertised, and who it's for. The backend has no structured
 * audience-targeting endpoint (Jane extracts audience/geo from one free-text message), so the
 * Review step composes these into the one message planFromMessage takes.
 *
 * PRD WS5 "What are you advertising? Retrieve products and services from the brand playbook":
 * the products in the Brand Playbook are offered as cards, with who-it's-for and the area filled
 * from the Playbook too, so most people confirm instead of typing. Picking a product (rather
 * than describing it freely) is also what keeps the plan, the copy and the picture about the
 * same thing. "Something else" keeps the free description, and can add it to the Playbook.
 */
'use client';

import { BrandProfileData, BrandProfileService } from '@/src/api/BrandProfileService';
import { trackEvent } from '@/lib/analytics';
import { useEffect, useRef, useState } from 'react';

export interface WizardAudienceValue {
  description: string;
  city: string;
  /** The Playbook product picked (kept for drafts saved before several could be picked). */
  product?: string;
  /** The Playbook products picked — one, or a few to test (the description is composed from them). */
  products?: string[];
  /** Who the product is for, when a product was picked. */
  who?: string;
}

const PINK = '#C2185B';
const inputStyle: React.CSSProperties = {
  width: '100%',
  border: '1px solid #ece8e6',
  borderRadius: 10,
  padding: '10px 12px',
  fontSize: 13.5,
  color: '#1a0a12',
  fontFamily: 'inherit',
};
const labelText: React.CSSProperties = { fontSize: 12.5, fontWeight: 700, color: '#1a0a12' };

/** "Airport runs (from ₦25,000)" → name and price shown on the card. */
function splitProduct(p: string): { name: string; price: string } {
  const m = p.match(/^(.*?)\s*[([]([^)\]]*\d[^)\]]*)[)\]]\s*$/);
  return m ? { name: m[1].trim(), price: m[2].trim() } : { name: p.trim(), price: '' };
}

const MAX_PRODUCTS = 3;

/** "A", "A and B", "A, B and C". */
export function listProducts(products: string[]): string {
  const p = products.map((x) => x.trim()).filter(Boolean);
  return p.length <= 1 ? (p[0] ?? '') : `${p.slice(0, -1).join(', ')} and ${p[p.length - 1]}`;
}

export function composeDescription(product: string, who: string): string {
  const p = product.trim();
  const w = who.trim();
  if (!p) return w;
  return w ? `${p} — for ${w}` : p;
}

export default function WizardAudienceStep({
  value,
  onChange,
  fromPlaybook = true,
}: {
  value: WizardAudienceValue;
  onChange: (next: WizardAudienceValue) => void;
  /** Playbook products and pre-filling are rolled out in stages; off, this is the plain description step. */
  fromPlaybook?: boolean;
}) {
  const [profile, setProfile] = useState<BrandProfileData | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [saveToPlaybook, setSaveToPlaybook] = useState(false);
  const [savedToPlaybook, setSavedToPlaybook] = useState('');
  const prefilled = useRef(false);

  useEffect(() => {
    let alive = true;
    BrandProfileService.get()
      .then((r) => alive && setProfile(r.status ? (r.responseData ?? null) : null))
      .catch(() => undefined)
      .finally(() => alive && setLoaded(true));
    return () => {
      alive = false;
    };
  }, []);

  const products = fromPlaybook ? (profile?.key_products_services ?? []).filter(Boolean).slice(0, 12) : [];
  const playbookWho = fromPlaybook ? (profile?.ideal_customer_profile || '').trim() : '';
  const playbookArea = fromPlaybook ? (profile?.customer_location || '').trim() : '';
  const picked = value.products ?? (value.product ? [value.product] : []);
  const custom = picked.length === 0;

  // Fill who-it's-for and the area from the Playbook once, without overwriting anything typed.
  useEffect(() => {
    if (!loaded || prefilled.current) return;
    prefilled.current = true;
    const next = { ...value };
    if (!next.city && playbookArea) next.city = playbookArea;
    if (!next.description && products.length && !next.product && !next.products?.length) {
      next.products = [products[0]];
      next.who = playbookWho;
      next.description = composeDescription(products[0], playbookWho);
    }
    if (next.city !== value.city || next.products !== value.products) onChange(next);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loaded]);

  const [limitNote, setLimitNote] = useState(false);
  const pick = (product: string) => {
    const who = value.who ?? playbookWho;
    const has = picked.includes(product);
    if (!has && picked.length >= MAX_PRODUCTS) {
      setLimitNote(true);
      return;
    }
    setLimitNote(false);
    const next = has ? picked.filter((p) => p !== product) : [...picked, product];
    if (!has) trackEvent('builder_product_picked', { count: next.length });
    onChange({ ...value, product: undefined, products: next, who, description: composeDescription(listProducts(next), who) });
  };
  const pickCustom = () =>
    onChange({ ...value, product: undefined, products: [], who: undefined, description: '' });

  const addToPlaybook = async (checked: boolean) => {
    setSaveToPlaybook(checked);
    const name = value.description.split('—')[0].trim();
    if (!checked || !name || savedToPlaybook === name) return;
    try {
      await BrandProfileService.save({ key_products_services: [...(profile?.key_products_services ?? []), name] });
      setSavedToPlaybook(name);
    } catch {
      setSaveToPlaybook(false);
    }
  };

  return (
    <div>
      <p style={{ margin: '0 0 14px', fontSize: 12.5, color: '#7a7270' }}>
        Tell Jane what you&apos;re advertising and who it&apos;s for — she&apos;ll turn this into a targeting strategy.
      </p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16, maxWidth: 620 }}>
        {products.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <span style={labelText}>What are you advertising?</span>
            <span style={{ fontSize: 11.5, color: '#7a7270', marginTop: -4 }}>
              From your Brand Playbook. Pick one, or up to {MAX_PRODUCTS} to test in one campaign.
            </span>
            <div role="group" aria-label="What are you advertising?" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: 8 }}>
              {products.map((p) => {
                const { name, price } = splitProduct(p);
                const on = picked.includes(p);
                return (
                  <button
                    key={p}
                    type="button"
                    role="checkbox"
                    aria-checked={on}
                    onClick={() => pick(p)}
                    style={cardStyle(on)}
                  >
                    <span style={{ fontSize: 13, fontWeight: 700, color: '#1a0a12' }}>{name}</span>
                    {price && <span style={{ fontSize: 11.5, color: '#7a7270' }}>{price}</span>}
                  </button>
                );
              })}
              <button type="button" role="checkbox" aria-checked={custom} onClick={pickCustom} style={{ ...cardStyle(custom), borderStyle: custom ? 'solid' : 'dashed' }}>
                <span style={{ fontSize: 13, fontWeight: 700, color: '#1a0a12' }}>Something else</span>
                <span style={{ fontSize: 11.5, color: '#7a7270' }}>Describe it</span>
              </button>
            </div>
            {limitNote && (
              <span role="status" style={{ fontSize: 11.5, color: '#9a5b00' }}>
                Up to {MAX_PRODUCTS} at a time — untick one to swap it.
              </span>
            )}
          </div>
        )}

        {custom ? (
          <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <span style={labelText}>
              {products.length ? 'What is it, and who is it for?' : "What are you promoting, and who's it for?"}
            </span>
            <textarea
              value={value.description}
              onChange={(e) => onChange({ ...value, description: e.target.value })}
              placeholder="e.g. My bakery's custom birthday cakes — mostly young professionals planning a celebration"
              rows={4}
              style={{ ...inputStyle, resize: 'vertical', lineHeight: 1.5 }}
            />
            {fromPlaybook && loaded && profile && value.description.trim().length > 2 && (
              <label style={{ display: 'flex', alignItems: 'center', gap: 7, fontSize: 12, color: '#7a7270', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={saveToPlaybook}
                  onChange={(e) => void addToPlaybook(e.target.checked)}
                  style={{ accentColor: PINK }}
                />
                {savedToPlaybook ? `Added “${savedToPlaybook}” to your Playbook` : 'Also add this to my Playbook’s products'}
              </label>
            )}
            {fromPlaybook && loaded && !products.length && (
              <span style={{ fontSize: 11.5, color: '#7a7270' }}>
                Tip: add your products to your Brand Playbook and you can pick them here next time.
              </span>
            )}
          </label>
        ) : (
          <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <span style={labelText}>Who is it for?</span>
            <input
              type="text"
              value={value.who ?? ''}
              onChange={(e) =>
                onChange({ ...value, who: e.target.value, description: composeDescription(listProducts(picked), e.target.value) })
              }
              placeholder="e.g. Companies moving staff daily, travellers going to the airport"
              style={inputStyle}
            />
            {playbookWho && value.who === playbookWho && (
              <span style={{ fontSize: 11.5, color: '#7a7270' }}>From your Playbook. Change it for this campaign if you like.</span>
            )}
          </label>
        )}

        <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <span style={labelText}>Which city or area?</span>
          <input
            type="text"
            value={value.city}
            onChange={(e) => onChange({ ...value, city: e.target.value })}
            placeholder="e.g. Lekki, Lagos"
            style={inputStyle}
          />
        </label>
      </div>
    </div>
  );
}

const cardStyle = (on: boolean): React.CSSProperties => ({
  textAlign: 'left',
  border: on ? `1.5px solid ${PINK}` : '1px solid #ece8e6',
  boxShadow: on ? '0 0 0 3px rgba(194,24,91,.10)' : 'none',
  background: '#fff',
  borderRadius: 12,
  padding: '10px 12px',
  cursor: 'pointer',
  display: 'flex',
  flexDirection: 'column',
  gap: 2,
  fontFamily: 'inherit',
});
