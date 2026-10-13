'use client';

import { CampaignService } from '@/src/api/CampaignService';
import { ToastTypeEnum } from '@/src/models/enum-models/ToastTypeEnum';
import { ToastService } from '@/src/utils/toast.util';
import { ReactNode, useEffect, useState } from 'react';
import { FcGoogle } from 'react-icons/fc';

/* ── Shared look for the Google Ads connection (chooser + link panel) ───── */

export const G = {
  blue: '#1A73E8',
  blueSoft: '#EEF4FF',
  ink: '#111827',
  body: '#374151',
  muted: '#6B7280',
  faint: '#9CA3AF',
  line: '#E3E9F5',
  panel: '#F7FAFF',
  green: '#15803D',
  greenSoft: '#ECFDF5',
  amber: '#A15C00',
  amberSoft: '#FFF8EB',
  red: '#C62828',
  redSoft: '#FEF2F2',
};
const SIGNUP_URL = 'https://ads.google.com/home/';
const font: React.CSSProperties = { fontFamily: 'var(--wf)' };

export const formatGoogleId = (id?: string) => {
  const d = (id ?? '').replace(/\D/g, '');
  return d.length === 10 ? `${d.slice(0, 3)}-${d.slice(3, 6)}-${d.slice(6)}` : (id ?? '');
};

export const googleErrorDetail = (err: unknown, fallback: string) => {
  const e = err as { data?: { detail?: string }; response?: { data?: { detail?: string } } };
  return e?.data?.detail ?? e?.response?.data?.detail ?? fallback;
};

/** Send the browser to Google to sign in; it comes back to Connected Accounts. */
export const continueWithGoogle = async (): Promise<boolean> => {
  try {
    const { auth_url } = await CampaignService.googleSigninStart(window.location.origin);
    if (!auth_url) return false;
    window.location.href = auth_url;
    return true;
  } catch (err) {
    ToastService.showToast(googleErrorDetail(err, 'Could not open Google sign-in. Try again.'), ToastTypeEnum.Error);
    return false;
  }
};

export const gBtn = (kind: 'primary' | 'plain' | 'danger' = 'plain', disabled = false): React.CSSProperties => ({
  ...font,
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: 7,
  padding: '7px 12px',
  borderRadius: 8,
  border: kind === 'primary' ? 'none' : `1px solid ${kind === 'danger' ? '#F3C7C7' : G.line}`,
  background: kind === 'primary' ? G.blue : '#fff',
  color: kind === 'primary' ? '#fff' : kind === 'danger' ? G.red : G.body,
  fontSize: 12.5,
  fontWeight: 700,
  cursor: disabled ? 'default' : 'pointer',
  opacity: disabled ? 0.55 : 1,
  whiteSpace: 'nowrap',
  boxShadow: kind === 'primary' ? '0 4px 12px rgba(26,115,232,.25)' : 'none',
  transition: 'opacity .15s, box-shadow .15s',
});

/** The white "Continue with Google" button, as Google's own guidelines draw it. */
export const GoogleButton = ({
  label,
  busy,
  onClick,
  disabled,
}: {
  label: string;
  busy?: boolean;
  onClick: () => void;
  disabled?: boolean;
}) => (
  <button
    type="button"
    onClick={onClick}
    disabled={disabled || busy}
    style={{
      ...font,
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
      padding: '7px 14px',
      borderRadius: 9,
      border: `1px solid #DADCE0`,
      background: '#fff',
      color: '#1F1F1F',
      fontSize: 12.5,
      fontWeight: 700,
      cursor: disabled || busy ? 'default' : 'pointer',
      opacity: disabled ? 0.6 : 1,
      boxShadow: '0 1px 2px rgba(60,64,67,.18), 0 2px 8px rgba(60,64,67,.08)',
      whiteSpace: 'nowrap',
    }}
  >
    <FcGoogle size={16} />
    {busy ? 'Opening Google…' : label}
  </button>
);

/** Where you are: done steps get a tick, the current one is filled. */
export const GoogleSteps = ({ steps, current }: { steps: string[]; current: number }) => (
  <ol
    aria-label="Progress"
    style={{ ...font, listStyle: 'none', display: 'flex', alignItems: 'center', gap: 6, margin: 0, padding: 0 }}
  >
    {steps.map((label, i) => {
      const done = i < current;
      const now = i === current;
      return (
        <li
          key={label}
          aria-current={now ? 'step' : undefined}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            minWidth: 0,
            flex: i < steps.length - 1 ? '1 1 0' : '0 1 auto',
          }}
        >
          <span
            style={{
              width: 17,
              height: 17,
              borderRadius: '50%',
              flexShrink: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 9.5,
              fontWeight: 800,
              background: done ? G.green : now ? G.blue : '#fff',
              color: done || now ? '#fff' : G.faint,
              border: done || now ? 'none' : `1.5px solid ${G.line}`,
            }}
          >
            {done ? '✓' : i + 1}
          </span>
          <span
            style={{
              fontSize: 11,
              fontWeight: now ? 800 : 600,
              color: now ? G.ink : done ? G.green : G.faint,
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}
          >
            {label}
          </span>
          {i < steps.length - 1 && (
            <span style={{ flex: 1, height: 2, minWidth: 10, borderRadius: 2, background: done ? G.green : G.line }} />
          )}
        </li>
      );
    })}
  </ol>
);

export const GoogleShell = ({ children }: { children: ReactNode }) => (
  <div
    className="gads"
    style={{
      ...font,
      padding: '12px 14px 14px',
      background: G.panel,
      borderRadius: '0 0 12px 12px',
      border: `1.5px solid ${G.blue}33`,
      borderTop: 'none',
    }}
  >
    <style>{`
      .gads .gads-tile:hover { border-color: ${G.blue}; box-shadow: 0 4px 14px rgba(26,115,232,.10); }
      .gads .gads-acct:hover { border-color: ${G.blue}; }
      @media (max-width: 640px) { .gads .gads-hero { grid-template-columns: 1fr !important; } .gads .gads-wide { display: none; } }
    `}</style>
    {children}
  </div>
);

const Tick = ({ title, children }: { title: string; children: ReactNode }) => (
  <li style={{ display: 'flex', gap: 8, alignItems: 'flex-start', minWidth: 0 }}>
    <span
      aria-hidden
      style={{
        width: 16,
        height: 16,
        borderRadius: '50%',
        background: G.greenSoft,
        color: G.green,
        fontSize: 9.5,
        fontWeight: 900,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
        marginTop: 1,
      }}
    >
      ✓
    </span>
    <span style={{ minWidth: 0 }}>
      <span style={{ display: 'block', fontSize: 12, fontWeight: 700, color: G.ink }}>{title}</span>
      <span style={{ display: 'block', fontSize: 11.5, color: G.muted, lineHeight: 1.4 }}>{children}</span>
    </span>
  </li>
);

/**
 * Shown next to "Continue with Google" until Google has verified URI's sign-in
 * app. Without it people meet Google's red "hasn't verified this app" screen
 * cold and, reasonably, stop.
 */
export const UnverifiedNote = () => {
  const [open, setOpen] = useState(false);
  return (
    <div
      style={{
        ...font,
        marginTop: 12,
        paddingTop: 10,
        borderTop: `1px dashed ${G.line}`,
        fontSize: 11.5,
        color: G.muted,
        lineHeight: 1.5,
        textAlign: 'left',
      }}
    >
      <span style={{ color: G.amber, fontWeight: 700 }}>Heads up</span>
      <span style={{ margin: '0 6px', color: G.faint }}>·</span>
      Google shows a &ldquo;hasn&apos;t verified this app&rdquo; screen first while it reviews URI&apos;s sign-in.
      It&apos;s safe to continue.{' '}
      <button
        type="button"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        style={{
          ...font,
          border: 'none',
          background: 'none',
          padding: 0,
          color: G.blue,
          fontSize: 11.5,
          fontWeight: 700,
          cursor: 'pointer',
        }}
      >
        {open ? 'Hide' : 'How to continue'}
      </button>
      {open && (
        <div
          style={{
            marginTop: 7,
            padding: '8px 10px',
            borderRadius: 8,
            background: G.amberSoft,
            color: G.amber,
            fontSize: 11.5,
          }}
        >
          On Google&apos;s screen click <b>Advanced</b>, then <b>Go to URI Social</b>. Prefer to skip that screen? Use
          your Customer ID instead (below).
        </div>
      )}
    </div>
  );
};

type Account = { customer_id: string; name: string; currency_code: string };
type Way = '' | 'no_account' | 'customer_id';

const input: React.CSSProperties = {
  ...font,
  flex: '1 1 200px',
  minWidth: 0,
  padding: '7px 10px',
  borderRadius: 8,
  border: `1px solid ${G.line}`,
  fontSize: 12.5,
  outline: 'none',
  background: '#fff',
};

interface Props {
  /** Reload the page's connection statuses. */
  onChanged: () => void;
  /** false = URI can't create accounts for brands yet (Google's rule for new manager accounts). */
  canCreate?: boolean | null;
  /** false while Google hasn't verified URI's sign-in app yet (it shows a warning screen). */
  signinVerified?: boolean;
}

/**
 * Choosing the Google Ads account, in plain words and three ways:
 *  1. Continue with Google — sign in, pick the account by name. No ID to look
 *     up and nothing to approve in Google Ads (we approve on your behalf).
 *  2. I don't have a Google Ads account — make one in two minutes, come back.
 *  3. Enter my Customer ID — for when someone else owns the Google login.
 */
const GoogleAdsChooser = ({ onChanged, canCreate, signinVerified }: Props) => {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [signedIn, setSignedIn] = useState(false);
  const [others, setOthers] = useState(0);
  const [busy, setBusy] = useState('');
  const [note, setNote] = useState('');
  const [wayChosen, setWay] = useState<Way | null>(null);
  const [customerId, setCustomerId] = useState('');
  const [accountName, setAccountName] = useState('');
  const [createRefused, setCreateRefused] = useState(false);
  const createBlocked = canCreate === false || createRefused;

  useEffect(() => {
    CampaignService.googleSigninAccounts()
      .then((r) => {
        setAccounts(r.accounts ?? []);
        setSignedIn(!!r.signed_in);
        setOthers(r.other_accounts ?? 0);
      })
      .catch(() => undefined);
  }, []);

  const signIn = async () => {
    setBusy('signin');
    const leaving = await continueWithGoogle();
    if (!leaving) setBusy('');
  };

  const pick = async (a: Account) => {
    setBusy(a.customer_id);
    setNote('');
    try {
      const r = await CampaignService.googleSigninSelect(a.customer_id);
      if (r.state === 'ready') {
        ToastService.showToast(
          `Google Ads linked — ${r.account_name || a.name || 'your account'}.`,
          ToastTypeEnum.Success
        );
      } else if (r.state === 'manager_link_pending' && r.auto_accepted) {
        // We approved it with their sign-in; Google just hasn't caught up yet.
        ToastService.showToast(
          'Approved — Google is finishing the link. This page will show Linked in a few seconds.',
          ToastTypeEnum.Success
        );
      } else if (r.state === 'manager_link_pending') {
        ToastService.showToast(
          'Request sent. An admin of that Google Ads account needs to approve it — steps are below.',
          ToastTypeEnum.Warning
        );
      } else if (r.detail) {
        setNote(r.detail);
      }
      onChanged();
    } catch (err) {
      setNote(googleErrorDetail(err, 'Could not link that account. Try again.'));
    } finally {
      setBusy('');
    }
  };

  const linkById = async () => {
    if (!customerId.trim()) return;
    setBusy('id');
    setNote('');
    try {
      const r = await CampaignService.googleLinkExistingAccount(customerId.trim());
      if (r.manager_link_status === 'refused') {
        setNote(r.detail || 'Google would not link that account.');
      } else if (r.manager_link_status === 'active') {
        ToastService.showToast('Google Ads linked.', ToastTypeEnum.Success);
      } else {
        ToastService.showToast('Request sent — one approval left, steps are below.', ToastTypeEnum.Success);
      }
      setCustomerId('');
      onChanged();
    } catch (err) {
      setNote(googleErrorDetail(err, 'Could not send the request. Check the number and try again.'));
    } finally {
      setBusy('');
    }
  };

  const createForMe = async () => {
    if (!accountName.trim()) return;
    setBusy('create');
    setNote('');
    try {
      await CampaignService.googleCreateAccount(accountName.trim());
      ToastService.showToast('Your Google Ads account is ready.', ToastTypeEnum.Success);
      onChanged();
    } catch (err) {
      // Google doesn't let a new manager account create accounts for others yet —
      // not something to retry; show the make-your-own steps instead.
      if (googleErrorDetail(err, '') === 'google_ads_mcc_not_eligible_to_create') setCreateRefused(true);
      else setNote('Could not create the account. Please try again.');
    } finally {
      setBusy('');
    }
  };

  const picking = accounts.length > 0;
  // Both other routes start closed, so the panel stays small until one is wanted.
  const way: Way = wayChosen ?? '';
  const sub: React.CSSProperties = {
    marginTop: 8,
    padding: '11px 13px',
    background: '#fff',
    border: `1px solid ${G.line}`,
    borderRadius: 10,
  };
  const tile = (key: Way, title: string, text: string, icon: string) => {
    const active = way === key;
    return (
      <button
        type="button"
        className="gads-tile"
        aria-expanded={active}
        onClick={() => setWay(active ? '' : key)}
        style={{
          ...font,
          flex: '1 1 230px',
          display: 'flex',
          alignItems: 'center',
          gap: 9,
          textAlign: 'left',
          padding: '7px 10px',
          borderRadius: 10,
          border: `1px solid ${active ? G.blue : G.line}`,
          background: active ? G.blueSoft : '#fff',
          cursor: 'pointer',
          transition: 'border-color .15s, box-shadow .15s, background .15s',
        }}
      >
        <span
          aria-hidden
          style={{
            width: 24,
            height: 24,
            borderRadius: 7,
            background: active ? '#fff' : G.blueSoft,
            color: G.blue,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 13,
            fontWeight: 800,
            flexShrink: 0,
          }}
        >
          {icon}
        </span>
        <span style={{ minWidth: 0, flex: 1, fontSize: 12.5, color: G.ink, fontWeight: 700 }}>
          {title}
          <span className="gads-wide" style={{ fontWeight: 500, color: G.muted }}>
            {' '}
            · {text}
          </span>
        </span>
        <span
          aria-hidden
          style={{
            color: G.faint,
            fontSize: 13,
            transform: active ? 'rotate(90deg)' : 'none',
            transition: 'transform .2s',
          }}
        >
          ›
        </span>
      </button>
    );
  };

  return (
    <GoogleShell>
      <GoogleSteps steps={['Sign in with Google', 'Pick your account', 'Ready to run ads']} current={picking ? 1 : 0} />

      {/* The main way */}
      <div
        style={{
          marginTop: 12,
          padding: '16px 18px',
          borderRadius: 12,
          background: '#fff',
          border: `1px solid ${G.line}`,
          boxShadow: '0 4px 16px rgba(26,115,232,.06)',
        }}
      >
        <div
          className="gads-hero"
          style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) auto', gap: 14, alignItems: 'center' }}
        >
          <div style={{ minWidth: 0 }}>
            <div style={{ fontSize: 13.5, fontWeight: 800, color: G.ink }}>
              {picking ? 'Which Google Ads account should URI use?' : 'Give URI permission to run your Google ads'}
            </div>
            <div style={{ fontSize: 12, color: G.muted, marginTop: 3, lineHeight: 1.45 }}>
              {picking
                ? 'These are the accounts your Google login can use. Pick one and it’s linked.'
                : 'Sign in with the Google account you use for Google Ads, then pick your account. That’s all.'}
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            {!picking && signinVerified !== false && (
              <span className="gads-wide" style={{ fontSize: 11, color: G.faint }}>
                About 20 seconds
              </span>
            )}
            <GoogleButton
              label={picking ? 'Use a different Google login' : 'Continue with Google'}
              busy={busy === 'signin'}
              disabled={!!busy && busy !== 'signin'}
              onClick={signIn}
            />
          </div>
        </div>

        {!picking && (
          <ul
            style={{
              listStyle: 'none',
              margin: '14px 0 0',
              padding: '12px 0 0',
              borderTop: `1px solid ${G.line}`,
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))',
              gap: '10px 18px',
            }}
          >
            <Tick title="Nothing to look up">No Customer ID, and nothing to approve in Google Ads.</Tick>
            <Tick title="You stay in control">URI creates and manages your ads. Billing and login stay yours.</Tick>
            <Tick title="Leave any time">Disconnect in one click.</Tick>
          </ul>
        )}

        {picking && (
          <div
            style={{
              display: 'grid',
              gap: 7,
              gridTemplateColumns: 'repeat(auto-fill, minmax(210px, 1fr))',
              marginTop: 10,
            }}
          >
            {accounts.map((a) => (
              <button
                key={a.customer_id}
                type="button"
                className="gads-acct"
                disabled={!!busy}
                onClick={() => pick(a)}
                style={{
                  ...font,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 9,
                  textAlign: 'left',
                  padding: '8px 10px',
                  borderRadius: 10,
                  border: `1px solid ${busy === a.customer_id ? G.blue : G.line}`,
                  background: busy === a.customer_id ? G.blueSoft : '#fff',
                  cursor: busy ? 'default' : 'pointer',
                  opacity: busy && busy !== a.customer_id ? 0.5 : 1,
                  transition: 'border-color .15s',
                }}
              >
                <span
                  aria-hidden
                  style={{
                    width: 26,
                    height: 26,
                    borderRadius: '50%',
                    background: G.blueSoft,
                    color: G.blue,
                    fontWeight: 800,
                    fontSize: 12,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}
                >
                  {(a.name || 'G').trim().charAt(0).toUpperCase()}
                </span>
                <span style={{ minWidth: 0 }}>
                  <span
                    style={{
                      display: 'block',
                      fontSize: 12.5,
                      fontWeight: 800,
                      color: G.ink,
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                    }}
                  >
                    {busy === a.customer_id ? 'Linking…' : a.name || 'Google Ads account'}
                  </span>
                  <span style={{ display: 'block', fontSize: 11, color: G.muted }}>
                    {formatGoogleId(a.customer_id)}
                    {a.currency_code ? ` · ${a.currency_code}` : ''}
                  </span>
                </span>
              </button>
            ))}
          </div>
        )}

        {signinVerified === false && !picking && <UnverifiedNote />}

        {signedIn && !picking && (
          <div
            role="status"
            style={{
              marginTop: 8,
              padding: '6px 10px',
              borderRadius: 8,
              background: G.amberSoft,
              border: '1px solid #F5E1B5',
              fontSize: 11.5,
              color: G.amber,
              lineHeight: 1.45,
            }}
          >
            We didn&apos;t find a Google Ads account on that Google login
            {others > 0 ? ' (only manager or closed accounts)' : ''}. Try the Google account you use for Google Ads, or
            use &ldquo;I don&apos;t have a Google Ads account&rdquo; below.
          </div>
        )}
      </div>

      {/* The other two ways */}
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center', marginTop: 12 }}>
        <span style={{ fontSize: 10, fontWeight: 800, color: G.faint, letterSpacing: 0.6 }}>OTHER WAYS</span>
        {tile('no_account', 'I don’t have a Google Ads account', 'make one in two minutes', '+')}
        {tile('customer_id', 'Enter my Customer ID', 'if someone else holds the Google login', '#')}
      </div>

      {way === 'no_account' && (
        <div style={sub}>
          {!createBlocked && (
            <div style={{ paddingBottom: 10, marginBottom: 10, borderBottom: `1px solid ${G.line}` }}>
              <div style={{ fontSize: 12.5, fontWeight: 800, color: G.ink }}>
                Let URI create one for you{' '}
                <span style={{ fontWeight: 500, color: G.muted }}>· in naira, ready straight away</span>
              </div>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 6 }}>
                <input
                  value={accountName}
                  onChange={(e) => setAccountName(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && createForMe()}
                  placeholder="Your business name"
                  aria-label="Business name for the new Google Ads account"
                  maxLength={80}
                  style={input}
                />
                <button
                  type="button"
                  style={gBtn('primary', !!busy || !accountName.trim())}
                  disabled={!!busy || !accountName.trim()}
                  onClick={createForMe}
                >
                  {busy === 'create' ? 'Creating…' : 'Create my account'}
                </button>
              </div>
            </div>
          )}
          <div style={{ fontSize: 12.5, fontWeight: 800, color: G.ink, marginBottom: 6 }}>
            {createBlocked ? 'Make a Google Ads account — about two minutes' : 'Or make it yourself'}
          </div>
          <ol style={{ listStyle: 'none', margin: 0, padding: 0, display: 'grid', gap: 5 }}>
            {[
              <>
                Open{' '}
                <a href={SIGNUP_URL} target="_blank" rel="noreferrer" style={{ color: G.blue, fontWeight: 700 }}>
                  ads.google.com
                </a>{' '}
                and press <b>Start now</b>, signed in with your business Google account.
              </>,
              <>
                If it asks you to build a campaign straight away, choose <b>Skip</b> or <b>Switch to Expert Mode</b> →{' '}
                <b>Create an account without a campaign</b>. You don&apos;t need to make an ad — URI does that.
              </>,
              <>
                Choose your country, time zone and currency (naira if you&apos;ll pay in naira — it can&apos;t be
                changed later), and confirm.
              </>,
              <>Come back here and continue with Google.</>,
            ].map((step, i) => (
              <li key={i} style={{ display: 'flex', gap: 8, fontSize: 12, color: G.body, lineHeight: 1.45 }}>
                <span
                  aria-hidden
                  style={{
                    width: 17,
                    height: 17,
                    borderRadius: '50%',
                    background: G.blueSoft,
                    color: G.blue,
                    fontSize: 9.5,
                    fontWeight: 800,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                    marginTop: 1,
                  }}
                >
                  {i + 1}
                </span>
                <span>{step}</span>
              </li>
            ))}
          </ol>
          <div style={{ marginTop: 9 }}>
            <GoogleButton label="I’ve made it — Continue with Google" busy={busy === 'signin'} onClick={signIn} />
          </div>
        </div>
      )}

      {way === 'customer_id' && (
        <div style={sub}>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
            <label htmlFor="gads-customer-id" style={{ fontSize: 12.5, fontWeight: 800, color: G.ink }}>
              Google Ads Customer ID
            </label>
            <input
              id="gads-customer-id"
              value={customerId}
              onChange={(e) => setCustomerId(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && linkById()}
              placeholder="123-456-7890"
              inputMode="numeric"
              maxLength={14}
              style={{ ...input, flex: '1 1 160px' }}
            />
            <button
              type="button"
              style={gBtn('primary', !!busy || !customerId.trim())}
              disabled={!!busy || !customerId.trim()}
              onClick={linkById}
            >
              {busy === 'id' ? 'Sending…' : 'Send request'}
            </button>
          </div>
          <div style={{ fontSize: 11.5, color: G.muted, marginTop: 6, lineHeight: 1.45 }}>
            It&apos;s the 10-digit number at the top right of Google Ads. We&apos;ll send a request that an admin of
            that account approves — this page updates by itself when they do.
          </div>
        </div>
      )}

      {note && (
        <div
          role="alert"
          style={{
            marginTop: 8,
            padding: '7px 10px',
            borderRadius: 8,
            background: G.redSoft,
            border: '1px solid #F3C7C7',
            fontSize: 12,
            color: G.red,
          }}
        >
          {note}
        </div>
      )}
    </GoogleShell>
  );
};

/**
 * Renders nothing: reads how the Google sign-in ended (?google=…) once, tells
 * the user, tidies the address bar and reloads the statuses.
 */
export const GoogleAdsReturn = ({ onChanged }: { onChanged: () => void }) => {
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const outcome = params.get('google');
    if (!outcome) return;
    const reason = params.get('reason') || '';
    if (outcome === 'linked') {
      ToastService.showToast('Google Ads linked. You are ready to run Google ads.', ToastTypeEnum.Success);
    } else if (outcome === 'finishing') {
      ToastService.showToast(
        'Approved — Google is finishing the link. This page will show Linked in a few seconds.',
        ToastTypeEnum.Success
      );
    } else if (outcome === 'pending') {
      ToastService.showToast(
        reason || 'Request sent. An admin of that Google Ads account needs to approve it — steps are below.',
        ToastTypeEnum.Warning
      );
    } else if (outcome === 'error') {
      ToastService.showToast(reason || 'Google sign-in did not complete. Try again.', ToastTypeEnum.Error);
    }
    params.delete('google');
    params.delete('reason');
    const rest = params.toString();
    window.history.replaceState(null, '', `${window.location.pathname}${rest ? `?${rest}` : ''}`);
    onChanged();
    // run once on arrival
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return null;
};

export default GoogleAdsChooser;
