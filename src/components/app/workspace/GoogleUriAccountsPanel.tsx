'use client';

/**
 * Admin: URI's own Google Ads accounts for "Run by URI". Each business that runs
 * Google ads by URI gets one of these; this is where staff add new ones (created
 * in Google Ads under URI's manager account, paid by URI's card), see how many are
 * free, and which business uses each.
 */

import { CampaignService, GoogleUriAccount } from '@/src/api/CampaignService';
import { useCallback, useEffect, useRef, useState } from 'react';

const PINK = '#AD1457';
const formatId = (id: string) => {
  const d = (id || '').replace(/\D/g, '');
  return d.length === 10 ? `${d.slice(0, 3)}-${d.slice(3, 6)}-${d.slice(6)}` : id;
};
const errText = (e: unknown, fallback: string): string => {
  const x = e as { data?: { detail?: unknown }; response?: { data?: { detail?: unknown }; status?: number } };
  const d = x?.data?.detail ?? x?.response?.data?.detail;
  return typeof d === 'string' ? d : fallback;
};
const statusOf = (e: unknown) => (e as { response?: { status?: number }; status?: number })?.response?.status;

const Chip = ({ label, value, tone }: { label: string; value: number; tone: 'ok' | 'warn' | 'plain' }) => (
  <div
    style={{
      flex: '1 1 150px',
      padding: '12px 14px',
      borderRadius: 12,
      background: tone === 'ok' ? '#ECFDF5' : tone === 'warn' ? '#FFF8EB' : '#fff',
      border: '1px solid rgba(0,0,0,.07)',
    }}
  >
    <div
      style={{ fontSize: 22, fontWeight: 800, color: tone === 'ok' ? '#15803D' : tone === 'warn' ? '#A15C00' : '#111' }}
    >
      {value}
    </div>
    <div style={{ fontSize: 12, color: '#666', marginTop: 2 }}>{label}</div>
  </div>
);

export default function GoogleUriAccountsPanel() {
  const [accounts, setAccounts] = useState<GoogleUriAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [denied, setDenied] = useState(false);
  const [loadError, setLoadError] = useState('');
  const [newId, setNewId] = useState('');
  const [busy, setBusy] = useState<'' | 'add' | 'create'>('');
  const [note, setNote] = useState<{ ok: boolean; text: string } | null>(null);
  const [showHow, setShowHow] = useState(false);
  const loadedRef = useRef(false);

  const load = useCallback(async () => {
    if (!loadedRef.current) setLoading(true);
    setLoadError('');
    try {
      setAccounts((await CampaignService.adminGoogleUriAccounts()).accounts);
      loadedRef.current = true;
    } catch (e) {
      if (statusOf(e) === 403) setDenied(true);
      else setLoadError(errText(e, 'Couldn’t load the accounts. Try again.'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const add = async () => {
    const digits = newId.replace(/\D/g, '');
    if (digits.length !== 10) {
      setNote({ ok: false, text: 'A Google Ads account ID has 10 digits, like 123-456-7890.' });
      return;
    }
    setBusy('add');
    setNote(null);
    try {
      const { account } = await CampaignService.adminAddGoogleUriAccount(digits);
      setNote({ ok: true, text: `${account.name || formatId(account.customer_id)} is ready for new businesses.` });
      setNewId('');
      load();
    } catch (e) {
      setNote({ ok: false, text: errText(e, 'Couldn’t add that account. Try again.') });
    } finally {
      setBusy('');
    }
  };

  const createAuto = async () => {
    setBusy('create');
    setNote(null);
    try {
      const { account } = await CampaignService.adminCreateGoogleUriAccount(`URI - Ads ${accounts.length + 1}`);
      setNote({
        ok: true,
        text: account.billing_ready
          ? `Created ${account.name} (${formatId(account.customer_id)}) and set up its billing — it’s ready.`
          : `Created ${account.name} (${formatId(account.customer_id)}). Add URI’s payment method to it in Google Ads → Billing, then add its ID above to mark it ready.`,
      });
      load();
    } catch (e) {
      setNote({ ok: false, text: errText(e, 'Couldn’t create an account. Try again.') });
    } finally {
      setBusy('');
    }
  };

  if (denied) {
    return (
      <div style={{ padding: 40, textAlign: 'center', color: '#666', fontSize: 13.5 }}>
        Only Jane Ads admins can manage URI&rsquo;s Google Ads accounts.
      </div>
    );
  }

  const free = accounts.filter((a) => !a.brand_id && a.billing_ready).length;
  const inUse = accounts.filter((a) => a.brand_id).length;
  const waiting = accounts.filter((a) => !a.billing_ready).length;

  return (
    <div style={{ display: 'grid', gap: 16 }}>
      <div>
        <h3 style={{ margin: 0, fontSize: 17, fontWeight: 800, color: '#111' }}>
          Google Ads accounts for &ldquo;Run by URI&rdquo;
        </h3>
        <p style={{ margin: '4px 0 0', fontSize: 13, color: '#666', lineHeight: 1.5, maxWidth: 760 }}>
          Each business that runs Google ads by URI gets one of these accounts, owned and paid for by URI. When none are
          free, new businesses see &ldquo;being set up&rdquo; until you add one.
        </p>
      </div>

      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
        <Chip label="Free and ready" value={free} tone={free > 1 ? 'ok' : 'warn'} />
        <Chip label="In use by a business" value={inUse} tone="plain" />
        <Chip label="Waiting for a payment method" value={waiting} tone={waiting ? 'warn' : 'plain'} />
      </div>

      {!loading && free <= 1 && (
        <div
          style={{
            fontSize: 12.5,
            color: '#A15C00',
            background: '#FFF8EB',
            borderRadius: 10,
            padding: '10px 12px',
            lineHeight: 1.5,
          }}
        >
          {free === 0
            ? 'No free accounts — new businesses can’t start Google ads by URI yet. Add one below.'
            : 'Only one free account left. Add a few more so no business waits.'}
        </div>
      )}

      <div style={{ background: '#fff', border: '1px solid rgba(0,0,0,.08)', borderRadius: 12, padding: 16 }}>
        <div style={{ fontSize: 13.5, fontWeight: 700, color: '#111' }}>Add an account</div>
        <div style={{ fontSize: 12.5, color: '#777', marginTop: 2 }}>
          Paste the 10-digit ID of an account you created in Google Ads under URI&rsquo;s manager account
          (221-539-1819). URI checks it with Google before using it.
        </div>
        <div style={{ display: 'flex', gap: 8, marginTop: 10, flexWrap: 'wrap' }}>
          <input
            value={newId}
            onChange={(e) => setNewId(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && add()}
            placeholder="123-456-7890"
            aria-label="Google Ads account ID"
            style={{
              flex: '1 1 200px',
              padding: '9px 12px',
              borderRadius: 9,
              border: '1.5px solid #e0dcd9',
              fontSize: 14,
            }}
          />
          <button
            type="button"
            onClick={add}
            disabled={!!busy}
            style={{
              padding: '9px 18px',
              borderRadius: 9,
              border: 'none',
              background: busy ? '#ddd' : PINK,
              color: '#fff',
              fontWeight: 700,
              cursor: busy ? 'default' : 'pointer',
            }}
          >
            {busy === 'add' ? 'Checking with Google…' : 'Add'}
          </button>
          <button
            type="button"
            onClick={createAuto}
            disabled={!!busy}
            title="Ask Google to create a blank account under URI's manager account"
            style={{
              padding: '9px 14px',
              borderRadius: 9,
              border: `1.5px solid ${PINK}`,
              background: '#fff',
              color: PINK,
              fontWeight: 700,
              cursor: busy ? 'default' : 'pointer',
            }}
          >
            {busy === 'create' ? 'Asking Google…' : 'Create one automatically'}
          </button>
        </div>
        {note && (
          <div
            role={note.ok ? 'status' : 'alert'}
            style={{ marginTop: 10, fontSize: 12.5, color: note.ok ? '#15803D' : '#C62828', lineHeight: 1.5 }}
          >
            {note.text}
          </div>
        )}
        <button
          type="button"
          onClick={() => setShowHow((v) => !v)}
          aria-expanded={showHow}
          style={{
            marginTop: 10,
            background: 'none',
            border: 'none',
            padding: 0,
            color: PINK,
            fontWeight: 700,
            fontSize: 12.5,
            cursor: 'pointer',
          }}
        >
          {showHow ? 'Hide' : 'How to create an account in Google Ads'}
        </button>
        {showHow && (
          <ol style={{ margin: '8px 0 0 18px', padding: 0, fontSize: 12.5, color: '#444', lineHeight: 1.7 }}>
            <li>At ads.google.com, open URI AD ACCOUNT (221-539-1819).</li>
            <li>Accounts → the blue + → Create new account.</li>
            <li>
              Name it (e.g. &ldquo;URI – Ads 2&rdquo;); Country Nigeria, time zone Lagos, currency NGN (can&rsquo;t be
              changed later).
            </li>
            <li>For payment, choose URI&rsquo;s existing payments profile. Skip creating a campaign.</li>
            <li>Copy its 10-digit ID and add it here.</li>
          </ol>
        )}
      </div>

      <div style={{ background: '#fff', border: '1px solid rgba(0,0,0,.08)', borderRadius: 12, overflow: 'hidden' }}>
        {loading ? (
          <div style={{ padding: 40, textAlign: 'center', color: '#888', fontSize: 13 }}>Loading…</div>
        ) : loadError ? (
          <div style={{ padding: 24, textAlign: 'center', color: '#C62828', fontSize: 13 }}>
            {loadError}{' '}
            <button
              type="button"
              onClick={load}
              style={{ background: 'none', border: 'none', color: PINK, fontWeight: 700, cursor: 'pointer' }}
            >
              Try again
            </button>
          </div>
        ) : accounts.length === 0 ? (
          <div style={{ padding: 40, textAlign: 'center', color: '#888', fontSize: 13 }}>
            No accounts yet. Add the first one above.
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead>
                <tr
                  style={{
                    background: '#faf9f8',
                    textAlign: 'left',
                    color: '#777',
                    fontSize: 11.5,
                    letterSpacing: 0.3,
                  }}
                >
                  <th style={{ padding: '10px 14px' }}>ACCOUNT</th>
                  <th style={{ padding: '10px 14px' }}>CURRENCY</th>
                  <th style={{ padding: '10px 14px' }}>PAYMENT METHOD</th>
                  <th style={{ padding: '10px 14px' }}>USED BY</th>
                  <th style={{ padding: '10px 14px' }}>ADDED</th>
                </tr>
              </thead>
              <tbody>
                {accounts.map((a) => (
                  <tr key={a.customer_id} style={{ borderTop: '1px solid rgba(0,0,0,.06)' }}>
                    <td style={{ padding: '10px 14px' }}>
                      <div style={{ fontWeight: 700, color: '#111' }}>{a.name || 'Unnamed account'}</div>
                      <div style={{ color: '#888', fontSize: 12 }}>{formatId(a.customer_id)}</div>
                    </td>
                    <td style={{ padding: '10px 14px' }}>{a.currency_code || '—'}</td>
                    <td style={{ padding: '10px 14px' }}>
                      <span
                        style={{
                          fontSize: 11.5,
                          fontWeight: 700,
                          padding: '2px 8px',
                          borderRadius: 999,
                          background: a.billing_ready ? '#ECFDF5' : '#FFF8EB',
                          color: a.billing_ready ? '#15803D' : '#A15C00',
                        }}
                      >
                        {a.billing_ready ? 'Ready' : 'Missing — add in Google Ads'}
                      </span>
                    </td>
                    <td
                      style={{
                        padding: '10px 14px',
                        color: a.brand_id ? '#111' : '#15803D',
                        fontWeight: a.brand_id ? 500 : 700,
                      }}
                    >
                      {a.brand_id ? a.brand_name || 'A business' : 'Free'}
                    </td>
                    <td style={{ padding: '10px 14px', color: '#888' }}>
                      {a.added_at
                        ? new Date(a.added_at).toLocaleDateString(undefined, {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric',
                          })
                        : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
