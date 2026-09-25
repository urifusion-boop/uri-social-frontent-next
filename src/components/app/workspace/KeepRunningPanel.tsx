/**
 * "Keep it running" — extend a campaign past the date it was set to end.
 *
 * Users top up and carry on running an ad that works, and until now the only way to do
 * that was to start a brand-new campaign: new plan, new creative, and a learning phase
 * back at zero. Extending keeps the campaign, the creative and everything the platform
 * has learned about who responds. Meta and TikTok both handled since 2026-09-25 — on
 * TikTok this also raises the ad group's total budget alongside its end date (TikTok's
 * budget is a lifetime figure for the whole schedule, not Meta's daily one, so the end
 * date alone wouldn't buy more delivery), which the caller (extend-quote/extend
 * endpoints) already accounts for — this panel just shows whatever the server quotes.
 *
 * The rule this surface follows: the client sees the exact cost and the exact new end
 * date BEFORE anything is charged. The quote is fetched first, the confirm button
 * carries the figure in its own label, and a wallet that cannot cover it says so with
 * the shortfall rather than failing at the click.
 */
import { CalendarPlus } from 'lucide-react';
import React, { useCallback, useEffect, useState } from 'react';

const PINK = '#C2185B';

import { CampaignService, ExtendQuote } from '@/src/api/CampaignService';

type Props = {
  campaignId: string;
  /** Which provider this campaign runs on — used only for the "keeps everything
   * X has learned" copy below. Defaults to Meta's wording when omitted, so any
   * existing caller that hasn't been updated to pass this still reads correctly. */
  platform?: 'meta' | 'tiktok';
  onClose: () => void;
  onExtended?: () => void;
};

const DAY_CHOICES = [3, 7, 14, 30];

function naira(n: number): string {
  return `₦${Math.round(n).toLocaleString()}`;
}

function onDate(iso?: string | null): string {
  if (!iso) return '—';
  const d = new Date(iso);
  return Number.isNaN(d.getTime())
    ? '—'
    : d.toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' });
}

/** The server's own sentence, which is the only useful thing in these responses —
 *  "₦19,250 needed to run 7 more days … your wallet has ₦1,000. Top up first."
 *
 *  http.config.ts rejects with `error.response`, NOT the AxiosError, so the detail sits
 *  at e.data.detail. Reading only e.response.data.detail showed the generic fallback
 *  for every refusal, hiding the shortfall the client needs in order to act. */
function errorText(e: unknown, fallback: string): string {
  const obj = e as { response?: { data?: { detail?: unknown } }; data?: { detail?: unknown } } | null;
  const detail = obj?.response?.data?.detail ?? obj?.data?.detail;
  if (typeof detail === 'string' && detail) return detail;
  if (e instanceof Error && e.message) return e.message;
  return fallback;
}

export default function KeepRunningPanel({ campaignId, platform, onClose, onExtended }: Props) {
  const platformLabel = platform === 'tiktok' ? 'TikTok' : 'Meta';
  const [days, setDays] = useState(7);
  const [quote, setQuote] = useState<ExtendQuote | null>(null);
  const [loading, setLoading] = useState(true);
  const [working, setWorking] = useState(false);
  const [error, setError] = useState('');
  const [done, setDone] = useState<{ until: string; charged: number } | null>(null);

  const load = useCallback(
    async (forDays: number) => {
      setLoading(true);
      setError('');
      try {
        setQuote(await CampaignService.getExtendQuote(campaignId, forDays));
      } catch (e) {
        setQuote(null);
        setError(errorText(e, 'Could not price this extension.'));
      } finally {
        setLoading(false);
      }
    },
    [campaignId]
  );

  useEffect(() => {
    if (!done) void load(days);
  }, [load, days, done]);

  const extend = async () => {
    if (!quote || working) return;
    setWorking(true);
    setError('');
    try {
      const res = await CampaignService.extendCampaign(campaignId, days);
      setDone({ until: res.end_time || quote.new_end_time, charged: res.charged_ngn });
      // NOT onExtended() here. Refreshing the list flips the parent into its loading
      // state, which unmounts every card — including this panel — so the confirmation
      // the client just paid for would flash and vanish. The refresh happens on close
      // instead, by which point they have read it.
    } catch (e) {
      setError(errorText(e, 'Could not extend the campaign.'));
    } finally {
      setWorking(false);
    }
  };

  const shortfall = quote && !quote.affordable ? quote.total_due_ngn - quote.wallet_balance_ngn : 0;

  return (
    <div
      data-testid="keep-running-panel"
      style={{ border: '1px solid #e6e6e6', borderRadius: 12, padding: '14px 16px', background: '#fff', marginTop: 10 }}
    >
      <div style={{ display: 'flex', alignItems: 'center', marginBottom: 8 }}>
        <p
          style={{
            margin: 0,
            fontSize: 13.5,
            fontWeight: 700,
            color: '#222',
            display: 'flex',
            alignItems: 'center',
            gap: 6,
          }}
        >
          <CalendarPlus size={15} strokeWidth={2} />
          Keep it running
        </p>
        <button
          type="button"
          onClick={() => {
            if (done) onExtended?.();
            onClose();
          }}
          style={{
            marginLeft: 'auto',
            border: 'none',
            background: 'transparent',
            cursor: 'pointer',
            fontSize: 13,
            color: '#888',
          }}
        >
          {done ? 'Done' : 'Close'}
        </button>
      </div>

      {done ? (
        <div
          style={{ background: '#f6fbf6', border: '1px solid #cde9cd', borderRadius: 8, padding: '10px 12px' }}
          data-testid="keep-running-done"
        >
          <p style={{ margin: '0 0 3px', fontSize: 12.5, fontWeight: 700, color: '#2e7d32' }}>
            Running until {onDate(done.until)}
          </p>
          <p style={{ margin: 0, fontSize: 12, color: '#33691e' }}>
            {naira(done.charged)} taken from your wallet. Same campaign and same ad — it keeps everything{' '}
            {platformLabel} has learned. It runs until that date unless you pause it.
          </p>
        </div>
      ) : (
        <>
          <p style={{ margin: '0 0 10px', fontSize: 12, color: '#666' }}>
            Carries on the same campaign and the same ad, so it keeps everything {platformLabel} has learned about who
            responds. Starting a new campaign instead begins that from scratch.
          </p>

          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 12 }}>
            {DAY_CHOICES.map((d) => (
              <button
                key={d}
                type="button"
                data-testid={`extend-days-${d}`}
                onClick={() => setDays(d)}
                style={{
                  fontSize: 12.5,
                  fontWeight: 700,
                  padding: '6px 14px',
                  borderRadius: 18,
                  border: d === days ? `1.5px solid ${PINK}` : '1px solid #ddd',
                  background: d === days ? PINK : '#fff',
                  color: d === days ? '#fff' : '#555',
                  cursor: 'pointer',
                }}
              >
                {d} days
              </button>
            ))}
          </div>

          {loading && <p style={{ margin: 0, fontSize: 12.5, color: '#666' }}>Pricing it…</p>}

          {quote && !loading && (
            <div data-testid="extend-quote" style={{ borderTop: '1px solid #f2f2f2', paddingTop: 10 }}>
              {[
                ['Daily spend', naira(quote.daily_ngn)],
                ['For', `${quote.days} more day${quote.days === 1 ? '' : 's'}`],
                ['Runs until', onDate(quote.new_end_time)],
                ['Cost', naira(quote.total_due_ngn)],
                ['Wallet', naira(quote.wallet_balance_ngn)],
              ].map(([label, value]) => (
                <div key={label} style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0' }}>
                  <span style={{ fontSize: 12, color: '#666' }}>{label}</span>
                  <span style={{ fontSize: 12.5, fontWeight: 600, color: '#222' }}>{value}</span>
                </div>
              ))}
            </div>
          )}

          {quote && !quote.affordable && (
            <div
              style={{
                marginTop: 10,
                background: '#fff8ec',
                border: '1px solid #f0e0c0',
                borderRadius: 8,
                padding: '8px 10px',
              }}
            >
              <p style={{ margin: 0, fontSize: 12, color: '#8a5a00' }} data-testid="extend-shortfall">
                {naira(shortfall)} short. Top up your wallet, or choose fewer days.
              </p>
            </div>
          )}

          {error && (
            <p data-testid="extend-error" style={{ margin: '10px 0 0', fontSize: 12, color: '#b3261e' }}>
              {error}
            </p>
          )}

          <button
            type="button"
            data-testid="extend-confirm"
            onClick={() => void extend()}
            disabled={!quote || !quote.affordable || working || loading}
            style={{
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 7,
              marginTop: 12,
              border: 'none',
              borderRadius: 10,
              padding: '10px 14px',
              fontWeight: 700,
              fontSize: 13,
              cursor: quote && quote.affordable && !working ? 'pointer' : 'default',
              background: quote && quote.affordable && !working ? PINK : '#eee',
              color: quote && quote.affordable && !working ? '#fff' : '#999',
            }}
          >
            {working
              ? 'Extending…'
              : quote
                ? `Keep running ${quote.days} more days · ${naira(quote.total_due_ngn)}`
                : 'Keep running'}
          </button>
          <p style={{ margin: '6px 0 0', fontSize: 11, color: '#999' }}>
            Charged only once {platformLabel} confirms the new end date.
          </p>
        </>
      )}
    </div>
  );
}
