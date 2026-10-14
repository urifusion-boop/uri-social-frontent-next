'use client';

/**
 * Admin: URI's own Google Ads accounts for "Run by URI". Each business that runs
 * Google ads by URI gets one of these; staff add new ones (created in Google Ads
 * under URI's manager account, paid by URI's card), see how many are free, and
 * which business uses each.
 */

import { CampaignService, GoogleUriAccount } from '@/src/api/CampaignService';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

const C = {
  pink: '#C2185B',
  pinkDeep: '#8E1545',
  pinkSoft: 'rgba(194,24,91,.07)',
  ink: '#1a0a12',
  body: '#4a4046',
  muted: '#8a8085',
  line: 'rgba(26,10,18,.08)',
  green: '#1e7e34',
  greenSoft: 'rgba(30,126,52,.09)',
  amber: '#b45309',
  amberSoft: 'rgba(245,158,11,.12)',
  red: '#c62828',
};
const grad = `linear-gradient(135deg, ${C.pink}, ${C.pinkDeep})`;
const font: React.CSSProperties = { fontFamily: 'var(--wf)' };
const MANAGER_ID = '221-539-1819';

const formatId = (raw: string) => {
  const d = (raw || '').replace(/\D/g, '').slice(0, 10);
  if (d.length <= 3) return d;
  if (d.length <= 6) return `${d.slice(0, 3)}-${d.slice(3)}`;
  return `${d.slice(0, 3)}-${d.slice(3, 6)}-${d.slice(6)}`;
};
const errText = (e: unknown, fallback: string): string => {
  const x = e as { data?: { detail?: unknown }; response?: { data?: { detail?: unknown } } };
  const d = x?.data?.detail ?? x?.response?.data?.detail;
  return typeof d === 'string' ? d : fallback;
};
const statusOf = (e: unknown) => (e as { response?: { status?: number } })?.response?.status;

type Filter = 'all' | 'free' | 'in_use' | 'waiting';

const Pill = ({ tone, children }: { tone: 'green' | 'amber' | 'pink' | 'grey'; children: React.ReactNode }) => {
  const t = {
    green: [C.greenSoft, C.green],
    amber: [C.amberSoft, C.amber],
    pink: [C.pinkSoft, C.pink],
    grey: ['rgba(0,0,0,.05)', C.muted],
  }[tone];
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 5,
        fontSize: 11,
        fontWeight: 700,
        padding: '3px 8px',
        borderRadius: 999,
        background: t[0],
        color: t[1],
        whiteSpace: 'nowrap',
      }}
    >
      <span style={{ width: 6, height: 6, borderRadius: '50%', background: t[1] }} />
      {children}
    </span>
  );
};

const IconBtn = ({
  title,
  onClick,
  children,
  disabled,
}: {
  title: string;
  onClick: () => void;
  children: React.ReactNode;
  disabled?: boolean;
}) => (
  <button
    type="button"
    title={title}
    aria-label={title}
    onClick={onClick}
    disabled={disabled}
    className="gua-icon"
    style={{
      width: 28,
      height: 28,
      borderRadius: 8,
      border: `1px solid ${C.line}`,
      background: '#fff',
      color: C.muted,
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
      cursor: disabled ? 'default' : 'pointer',
      flexShrink: 0,
    }}
  >
    {children}
  </button>
);

const svg = (d: React.ReactNode, s = 14) => (
  <svg
    width={s}
    height={s}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={2}
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    {d}
  </svg>
);
const IcRefresh = svg(
  <>
    <polyline points="23 4 23 10 17 10" />
    <path d="M20.49 15a9 9 0 11-2.12-9.36L23 10" />
  </>
);
const IcCopy = svg(
  <>
    <rect x="9" y="9" width="13" height="13" rx="2" />
    <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" />
  </>,
  13
);
const IcOpen = svg(
  <>
    <path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6" />
    <polyline points="15 3 21 3 21 9" />
    <line x1="10" y1="14" x2="21" y2="3" />
  </>,
  13
);

export default function GoogleUriAccountsPanel() {
  const [accounts, setAccounts] = useState<GoogleUriAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [denied, setDenied] = useState(false);
  const [loadError, setLoadError] = useState('');
  const [newId, setNewId] = useState('');
  const [busy, setBusy] = useState<'' | 'add' | 'create'>('');
  const [note, setNote] = useState<{ ok: boolean; text: string } | null>(null);
  const [showHow, setShowHow] = useState(false);
  const [filter, setFilter] = useState<Filter>('all');
  const [copied, setCopied] = useState('');
  const loadedRef = useRef(false);

  const load = useCallback(async () => {
    if (loadedRef.current) setRefreshing(true);
    else setLoading(true);
    setLoadError('');
    try {
      setAccounts((await CampaignService.adminGoogleUriAccounts()).accounts);
      loadedRef.current = true;
    } catch (e) {
      if (statusOf(e) === 403) setDenied(true);
      else setLoadError(errText(e, 'Couldn’t load the accounts. Try again.'));
    } finally {
      setLoading(false);
      setRefreshing(false);
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
          ? `Created ${account.name} (${formatId(account.customer_id)}) with billing — it’s ready.`
          : `Created ${account.name} (${formatId(account.customer_id)}). Add URI’s payment method in Google Ads → Billing, then add its ID here.`,
      });
      load();
    } catch (e) {
      setNote({ ok: false, text: errText(e, 'Couldn’t create an account. Try again.') });
    } finally {
      setBusy('');
    }
  };

  const copy = async (id: string) => {
    try {
      await navigator.clipboard.writeText(formatId(id));
      setCopied(id);
      setTimeout(() => setCopied(''), 1500);
    } catch {
      /* clipboard blocked — nothing to do */
    }
  };

  const counts = useMemo(
    () => ({
      free: accounts.filter((a) => !a.brand_id && a.billing_ready).length,
      inUse: accounts.filter((a) => a.brand_id).length,
      waiting: accounts.filter((a) => !a.billing_ready && !a.brand_id).length,
      total: accounts.length,
    }),
    [accounts]
  );
  const shown = accounts.filter((a) =>
    filter === 'free'
      ? !a.brand_id && a.billing_ready
      : filter === 'in_use'
        ? !!a.brand_id
        : filter === 'waiting'
          ? !a.billing_ready && !a.brand_id
          : true
  );

  if (denied) {
    return (
      <div style={{ ...font, padding: 40, textAlign: 'center', color: C.muted, fontSize: 13.5 }}>
        Only Jane Ads admins can manage URI&rsquo;s Google Ads accounts.
      </div>
    );
  }

  const pct = (n: number) => (counts.total ? `${(n / counts.total) * 100}%` : '0%');
  const low = !loading && !loadError && counts.free <= 1;

  return (
    <div className="gua" style={{ ...font, display: 'grid', gap: 12, color: C.ink }}>
      <style>{`
        .gua .gua-icon:hover:not(:disabled) { border-color: ${C.pink}; color: ${C.pink}; }
        .gua .gua-row:hover { background: rgba(194,24,91,.025); }
        .gua .gua-chip:hover { border-color: ${C.pink}; }
        .gua input:focus { outline: none; border-color: ${C.pink}; box-shadow: 0 0 0 3px rgba(194,24,91,.12); }
        @keyframes gua-spin { to { transform: rotate(360deg); } }
      `}</style>

      {/* Header + capacity, one card */}
      <div
        style={{
          background: '#fff',
          border: `1px solid ${C.line}`,
          borderRadius: 14,
          padding: '14px 16px',
          boxShadow: '0 1px 2px rgba(26,10,18,.04)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
          <div
            aria-hidden
            style={{
              width: 36,
              height: 36,
              borderRadius: 10,
              background: grad,
              color: '#fff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 900,
              fontSize: 17,
              boxShadow: '0 4px 12px rgba(194,24,91,.25)',
            }}
          >
            G
          </div>
          <div style={{ flex: '1 1 260px', minWidth: 0 }}>
            <div style={{ fontSize: 15, fontWeight: 800, letterSpacing: -0.2 }}>Run by URI — Google Ads accounts</div>
            <div style={{ fontSize: 12, color: C.muted, marginTop: 1 }}>
              One per business, owned and paid for by URI. With none free, new businesses see &ldquo;being set
              up&rdquo;.
            </div>
          </div>
          <span
            style={{
              fontSize: 11,
              color: C.muted,
              border: `1px solid ${C.line}`,
              borderRadius: 999,
              padding: '3px 9px',
            }}
          >
            Manager <b style={{ color: C.body, fontWeight: 700 }}>{MANAGER_ID}</b>
          </span>
          <IconBtn title="Refresh" onClick={load} disabled={refreshing || loading}>
            <span
              style={{ display: 'inline-flex', animation: refreshing ? 'gua-spin .8s linear infinite' : undefined }}
            >
              {IcRefresh}
            </span>
          </IconBtn>
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))',
            gap: 0,
            marginTop: 14,
          }}
        >
          {[
            { label: 'Free & ready', value: counts.free, color: C.green },
            { label: 'In use', value: counts.inUse, color: C.pink },
            { label: 'Need payment', value: counts.waiting, color: C.amber },
            { label: 'Total', value: counts.total, color: C.ink },
          ].map((s, i) => (
            <div key={s.label} style={{ padding: '2px 14px', borderLeft: i ? `1px solid ${C.line}` : 'none' }}>
              <div style={{ fontSize: 22, fontWeight: 800, color: s.color, lineHeight: 1.1 }}>
                {loading ? '–' : s.value}
              </div>
              <div style={{ fontSize: 11.5, color: C.muted, marginTop: 2 }}>{s.label}</div>
            </div>
          ))}
        </div>

        <div
          aria-label="Account capacity"
          style={{
            display: 'flex',
            height: 6,
            borderRadius: 999,
            overflow: 'hidden',
            background: 'rgba(0,0,0,.05)',
            marginTop: 12,
          }}
        >
          <div style={{ width: pct(counts.inUse), background: grad }} />
          <div style={{ width: pct(counts.free), background: C.green }} />
          <div style={{ width: pct(counts.waiting), background: '#f59e0b' }} />
        </div>

        {low && (
          <div style={{ marginTop: 10, display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: C.amber }}>
            <Pill tone="amber">{counts.free === 0 ? 'No free accounts' : 'Running low'}</Pill>
            {counts.free === 0
              ? 'New businesses can’t start Google ads by URI yet — add an account below.'
              : 'Only one free account left. Add a few more so no business waits.'}
          </div>
        )}
      </div>

      {/* Add */}
      <div style={{ background: '#fff', border: `1px solid ${C.line}`, borderRadius: 14, padding: '12px 14px' }}>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
          <div style={{ position: 'relative', flex: '1 1 220px' }}>
            <span
              style={{
                position: 'absolute',
                left: 11,
                top: '50%',
                transform: 'translateY(-50%)',
                fontSize: 12,
                color: C.muted,
                fontWeight: 700,
              }}
            >
              ID
            </span>
            <input
              value={newId}
              onChange={(e) => setNewId(formatId(e.target.value))}
              onKeyDown={(e) => e.key === 'Enter' && add()}
              placeholder="123-456-7890"
              inputMode="numeric"
              aria-label="Google Ads account ID"
              style={{
                ...font,
                width: '100%',
                boxSizing: 'border-box',
                padding: '8px 12px 8px 34px',
                borderRadius: 10,
                border: `1.5px solid ${C.line}`,
                fontSize: 13.5,
                letterSpacing: 0.4,
                transition: 'border-color .15s, box-shadow .15s',
              }}
            />
          </div>
          <button
            type="button"
            onClick={add}
            disabled={!!busy}
            style={{
              ...font,
              padding: '8px 16px',
              borderRadius: 10,
              border: 'none',
              background: busy ? '#e5e0e2' : grad,
              color: busy ? C.muted : '#fff',
              fontWeight: 700,
              fontSize: 13,
              cursor: busy ? 'default' : 'pointer',
              boxShadow: busy ? 'none' : '0 3px 10px rgba(194,24,91,.22)',
            }}
          >
            {busy === 'add' ? 'Checking with Google…' : 'Add account'}
          </button>
          <button
            type="button"
            onClick={createAuto}
            disabled={!!busy}
            title="Ask Google to create a blank account under URI's manager account. Works once Google allows it."
            style={{
              ...font,
              padding: '8px 13px',
              borderRadius: 10,
              border: `1.5px solid ${C.line}`,
              background: '#fff',
              color: C.pink,
              fontWeight: 700,
              fontSize: 13,
              cursor: busy ? 'default' : 'pointer',
            }}
          >
            {busy === 'create' ? 'Asking Google…' : 'Create automatically'}
          </button>
          <button
            type="button"
            onClick={() => setShowHow((v) => !v)}
            aria-expanded={showHow}
            style={{
              ...font,
              background: 'none',
              border: 'none',
              color: C.muted,
              fontSize: 12,
              fontWeight: 600,
              cursor: 'pointer',
              padding: '4px 2px',
            }}
          >
            {showHow ? 'Hide steps' : 'How to create one ↓'}
          </button>
        </div>

        {note && (
          <div
            role={note.ok ? 'status' : 'alert'}
            style={{
              marginTop: 10,
              fontSize: 12.5,
              lineHeight: 1.5,
              padding: '7px 10px',
              borderRadius: 9,
              background: note.ok ? C.greenSoft : 'rgba(198,40,40,.07)',
              color: note.ok ? C.green : C.red,
            }}
          >
            {note.text}
          </div>
        )}

        {showHow && (
          <ol
            style={{
              listStyle: 'none',
              margin: '12px 0 0',
              padding: 0,
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))',
              gap: 8,
            }}
          >
            {[
              ['Open the manager', `ads.google.com → URI AD ACCOUNT (${MANAGER_ID}).`],
              ['New account', 'Accounts → blue + → Create new account.'],
              ['Settings', 'Nigeria · Lagos time · currency NGN (can’t change later).'],
              ['Billing', 'Use URI’s existing payments profile. Skip the campaign.'],
              ['Add it here', 'Copy its 10-digit ID and paste it above.'],
            ].map(([t, d], i) => (
              <li
                key={t}
                style={{ background: '#fbf8f9', border: `1px solid ${C.line}`, borderRadius: 10, padding: '9px 10px' }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                  <span
                    style={{
                      width: 18,
                      height: 18,
                      borderRadius: '50%',
                      background: grad,
                      color: '#fff',
                      fontSize: 10.5,
                      fontWeight: 800,
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                    }}
                  >
                    {i + 1}
                  </span>
                  <span style={{ fontSize: 12, fontWeight: 700 }}>{t}</span>
                </div>
                <div style={{ fontSize: 11.5, color: C.muted, marginTop: 4, lineHeight: 1.45 }}>{d}</div>
              </li>
            ))}
          </ol>
        )}
      </div>

      {/* List */}
      <div style={{ background: '#fff', border: `1px solid ${C.line}`, borderRadius: 14, overflow: 'hidden' }}>
        <div
          style={{
            display: 'flex',
            gap: 6,
            padding: '10px 12px',
            borderBottom: `1px solid ${C.line}`,
            flexWrap: 'wrap',
          }}
        >
          {(
            [
              ['all', `All ${counts.total}`],
              ['free', `Free ${counts.free}`],
              ['in_use', `In use ${counts.inUse}`],
              ['waiting', `Need payment ${counts.waiting}`],
            ] as [Filter, string][]
          ).map(([v, label]) => {
            const on = filter === v;
            return (
              <button
                key={v}
                type="button"
                className="gua-chip"
                onClick={() => setFilter(v)}
                aria-pressed={on}
                style={{
                  ...font,
                  padding: '4px 11px',
                  borderRadius: 999,
                  border: `1px solid ${on ? C.pink : C.line}`,
                  background: on ? C.pinkSoft : '#fff',
                  color: on ? C.pink : C.body,
                  fontSize: 12,
                  fontWeight: 700,
                  cursor: 'pointer',
                }}
              >
                {label}
              </button>
            );
          })}
        </div>

        {loading ? (
          <div style={{ padding: 16, display: 'grid', gap: 8 }}>
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                style={{ height: 38, borderRadius: 9, background: 'linear-gradient(90deg,#f6f2f4,#fbf8f9,#f6f2f4)' }}
              />
            ))}
          </div>
        ) : loadError ? (
          <div style={{ padding: 22, textAlign: 'center', color: C.red, fontSize: 13 }}>
            {loadError}{' '}
            <button
              type="button"
              onClick={load}
              style={{ ...font, background: 'none', border: 'none', color: C.pink, fontWeight: 700, cursor: 'pointer' }}
            >
              Try again
            </button>
          </div>
        ) : shown.length === 0 ? (
          <div style={{ padding: 28, textAlign: 'center', color: C.muted, fontSize: 13 }}>
            {accounts.length === 0 ? 'No accounts yet — add the first one above.' : 'Nothing here for this filter.'}
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead>
                <tr style={{ textAlign: 'left', color: C.muted, fontSize: 10.5, letterSpacing: 0.5 }}>
                  {['ACCOUNT', 'CURRENCY', 'PAYMENT', 'USED BY', 'ADDED', ''].map((h) => (
                    <th key={h} style={{ padding: '9px 14px', fontWeight: 800 }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {shown.map((a) => (
                  <tr key={a.customer_id} className="gua-row" style={{ borderTop: `1px solid ${C.line}` }}>
                    <td style={{ padding: '9px 14px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <span
                          aria-hidden
                          style={{
                            width: 30,
                            height: 30,
                            borderRadius: 9,
                            background: C.pinkSoft,
                            color: C.pink,
                            fontWeight: 800,
                            fontSize: 12,
                            display: 'inline-flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            flexShrink: 0,
                          }}
                        >
                          {(a.name || 'G')
                            .replace(/^URI\s*[-–]\s*/i, '')
                            .charAt(0)
                            .toUpperCase()}
                        </span>
                        <div style={{ minWidth: 0 }}>
                          <div style={{ fontWeight: 700, whiteSpace: 'nowrap' }}>{a.name || 'Unnamed account'}</div>
                          <div
                            style={{ display: 'flex', alignItems: 'center', gap: 5, color: C.muted, fontSize: 11.5 }}
                          >
                            <span style={{ fontVariantNumeric: 'tabular-nums', letterSpacing: 0.3 }}>
                              {formatId(a.customer_id)}
                            </span>
                            <button
                              type="button"
                              onClick={() => copy(a.customer_id)}
                              title="Copy ID"
                              aria-label="Copy account ID"
                              style={{
                                background: 'none',
                                border: 'none',
                                padding: 0,
                                color: copied === a.customer_id ? C.green : C.muted,
                                cursor: 'pointer',
                                display: 'inline-flex',
                              }}
                            >
                              {copied === a.customer_id ? '✓' : IcCopy}
                            </button>
                          </div>
                        </div>
                      </div>
                    </td>
                    <td style={{ padding: '9px 14px' }}>
                      <span
                        style={{
                          fontSize: 11.5,
                          fontWeight: 700,
                          color: C.body,
                          border: `1px solid ${C.line}`,
                          borderRadius: 6,
                          padding: '2px 6px',
                        }}
                      >
                        {a.currency_code || '—'}
                      </span>
                    </td>
                    <td style={{ padding: '9px 14px' }}>
                      {a.billing_ready ? <Pill tone="green">Ready</Pill> : <Pill tone="amber">Add in Google Ads</Pill>}
                    </td>
                    <td style={{ padding: '9px 14px', maxWidth: 220 }}>
                      {a.brand_id ? (
                        <span
                          style={{
                            fontWeight: 600,
                            color: C.ink,
                            display: 'block',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                          }}
                        >
                          {a.brand_name || 'A business'}
                        </span>
                      ) : a.billing_ready ? (
                        <Pill tone="pink">Free</Pill>
                      ) : (
                        <Pill tone="grey">Not usable yet</Pill>
                      )}
                    </td>
                    <td style={{ padding: '9px 14px', color: C.muted, whiteSpace: 'nowrap' }}>
                      {a.added_at
                        ? new Date(a.added_at).toLocaleDateString(undefined, {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric',
                          })
                        : '—'}
                    </td>
                    <td style={{ padding: '9px 14px', textAlign: 'right' }}>
                      <a
                        href={`https://ads.google.com/aw/overview?__c=${a.customer_id.replace(/\D/g, '')}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        title="Open in Google Ads"
                        aria-label="Open in Google Ads"
                        className="gua-icon"
                        style={{
                          width: 28,
                          height: 28,
                          borderRadius: 8,
                          border: `1px solid ${C.line}`,
                          color: C.muted,
                          display: 'inline-flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        {IcOpen}
                      </a>
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
