'use client';

import { useEffect, useState } from 'react';
import { PublicFormsService } from '@/src/api/PublicFormsService';

const INK = 'hsl(330 40% 7%)';
const BORDER = 'hsl(0 0% 7%)';
const MAGENTA = 'hsl(340 74% 42%)';
const CREAM = 'hsl(12 100% 98%)';

const BUDGETS = ['Not running ads yet', 'Under ₦50,000', '₦50,000 – ₦200,000', '₦200,000 – ₦500,000', 'Above ₦500,000'];

const GOALS = ['More messages', 'More sales', 'More followers', 'More store or website visits'];

const UTM_KEYS = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content'] as const;

const emptyForm = { business: '', whatsapp: '', sells: '', budget: '', goal: '' };

const fieldStyle = {
  border: `3px solid ${INK}`,
  backgroundColor: CREAM,
  color: INK,
};

/** Ad pixels are optional and loaded outside this app, so only fire them if they are on the page. */
function trackLead() {
  const w = window as unknown as {
    fbq?: (...args: unknown[]) => void;
    ttq?: { track?: (event: string) => void };
  };
  if (typeof w.fbq === 'function') w.fbq('track', 'Lead');
  if (w.ttq?.track) w.ttq.track('SubmitForm');
}

export default function AdsAuditForm() {
  const [form, setForm] = useState(emptyForm);
  const [honeypot, setHoneypot] = useState('');
  const [utm, setUtm] = useState<Record<string, string>>({});
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  // Keep the UTM tags from the ad link so every lead shows which ad produced it.
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const found: Record<string, string> = {};
    UTM_KEYS.forEach((key) => {
      const value = params.get(key);
      if (value) found[key] = value.slice(0, 100);
    });
    setUtm(found);
  }, []);

  const set = (key: keyof typeof emptyForm) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm((prev) => ({ ...prev, [key]: e.target.value }));

  const focusStyle = (e: React.FocusEvent<HTMLElement>) => ((e.target as HTMLElement).style.borderColor = MAGENTA);
  const blurStyle = (e: React.FocusEvent<HTMLElement>) => ((e.target as HTMLElement).style.borderColor = INK);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (sending) return;
    setError(null);

    const data = {
      business: form.business.trim(),
      whatsapp: form.whatsapp.trim(),
      sells: form.sells.trim(),
      budget: form.budget,
      goal: form.goal,
    };
    if (!data.business || !data.whatsapp || !data.sells || !data.budget || !data.goal) {
      setError('Please fill in every field.');
      return;
    }
    const digits = data.whatsapp.replace(/\D/g, '');
    if (digits.length < 10 || digits.length > 14) {
      setError('Enter a valid WhatsApp number.');
      return;
    }

    setSending(true);
    try {
      await PublicFormsService.submitAdsLead({ ...data, ...utm, page: '/ads', website: honeypot });
      trackLead();
      setDone(true);
      setForm(emptyForm);
    } catch (err) {
      setError(PublicFormsService.errorMessage(err, "We couldn't send that. Check your connection and try again."));
    } finally {
      setSending(false);
    }
  };

  const labelClass = 'text-sm font-black uppercase block mb-1';
  const inputClass = 'w-full rounded-lg px-4 py-2.5 text-sm font-bold focus:outline-none';

  return (
    <div
      id="audit"
      className="p-6 scroll-mt-24"
      style={{
        backgroundColor: 'hsl(0 0% 100%)',
        border: `3px solid ${BORDER}`,
        borderRadius: '8px',
        boxShadow: `6px 6px 0px ${BORDER}`,
      }}
    >
      {done ? (
        <div className="text-center py-6" role="status">
          <h2 className="text-2xl font-black uppercase mb-3" style={{ color: 'hsl(142 60% 28%)' }}>
            Received ✓
          </h2>
          <p className="text-sm font-bold" style={{ color: 'hsl(330 40% 7% / 0.7)' }}>
            We&apos;ll message you on WhatsApp shortly with your audit and a time for a quick demo.
          </p>
        </div>
      ) : (
        <>
          <h2 className="text-xl font-black uppercase mb-1" style={{ color: INK }}>
            Get your free ad audit
          </h2>
          <p className="text-sm font-bold mb-5" style={{ color: 'hsl(0 0% 40%)' }}>
            Send us your details. We&apos;ll tell you what&apos;s wasting money in your ads.
          </p>

          <form className="space-y-4" onSubmit={handleSubmit} noValidate>
            {/* Honeypot: invisible to people, bots fill it in and get dropped server-side. */}
            <input
              type="text"
              name="website"
              tabIndex={-1}
              autoComplete="off"
              aria-hidden="true"
              value={honeypot}
              onChange={(e) => setHoneypot(e.target.value)}
              style={{ position: 'absolute', left: '-9999px', width: 1, height: 1, opacity: 0 }}
            />

            <div>
              <label htmlFor="ads-business" className={labelClass} style={{ color: INK }}>
                Business name
              </label>
              <input
                id="ads-business"
                type="text"
                required
                maxLength={150}
                autoComplete="organization"
                value={form.business}
                onChange={set('business')}
                className={inputClass}
                style={fieldStyle}
                onFocus={focusStyle}
                onBlur={blurStyle}
              />
            </div>

            <div>
              <label htmlFor="ads-whatsapp" className={labelClass} style={{ color: INK }}>
                WhatsApp number
              </label>
              <input
                id="ads-whatsapp"
                type="tel"
                inputMode="tel"
                required
                maxLength={30}
                placeholder="0801 234 5678"
                autoComplete="tel"
                value={form.whatsapp}
                onChange={set('whatsapp')}
                className={inputClass}
                style={fieldStyle}
                onFocus={focusStyle}
                onBlur={blurStyle}
              />
            </div>

            <div>
              <label htmlFor="ads-sells" className={labelClass} style={{ color: INK }}>
                What do you sell?
              </label>
              <input
                id="ads-sells"
                type="text"
                required
                maxLength={200}
                placeholder="e.g. women's fashion, jollof catering"
                value={form.sells}
                onChange={set('sells')}
                className={inputClass}
                style={fieldStyle}
                onFocus={focusStyle}
                onBlur={blurStyle}
              />
            </div>

            <div>
              <label htmlFor="ads-budget" className={labelClass} style={{ color: INK }}>
                Monthly ad budget
              </label>
              <select
                id="ads-budget"
                required
                value={form.budget}
                onChange={set('budget')}
                className={inputClass}
                style={fieldStyle}
                onFocus={focusStyle}
                onBlur={blurStyle}
              >
                <option value="">Select</option>
                {BUDGETS.map((b) => (
                  <option key={b} value={b}>
                    {b}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="ads-goal" className={labelClass} style={{ color: INK }}>
                Your main goal
              </label>
              <select
                id="ads-goal"
                required
                value={form.goal}
                onChange={set('goal')}
                className={inputClass}
                style={fieldStyle}
                onFocus={focusStyle}
                onBlur={blurStyle}
              >
                <option value="">Select</option>
                {GOALS.map((g) => (
                  <option key={g} value={g}>
                    {g}
                  </option>
                ))}
              </select>
            </div>

            {error && (
              <p role="alert" className="text-sm font-bold" style={{ color: 'hsl(0 70% 45%)' }}>
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={sending}
              className="px-6 py-3 rounded-lg text-sm w-full font-bold uppercase transition-all disabled:opacity-60 disabled:cursor-not-allowed"
              style={{
                backgroundColor: MAGENTA,
                color: 'hsl(0 0% 100%)',
                border: `3px solid ${BORDER}`,
                boxShadow: `4px 4px 0px ${BORDER}`,
                letterSpacing: '0.5px',
              }}
            >
              {sending ? 'Sending...' : 'Get my free audit'}
            </button>
            <p className="text-xs font-bold text-center" style={{ color: 'hsl(0 0% 40%)' }}>
              We reply on WhatsApp. No spam.
            </p>
          </form>
        </>
      )}
    </div>
  );
}
