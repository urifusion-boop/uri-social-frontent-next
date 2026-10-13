'use client';

import { CampaignService } from '@/src/api/CampaignService';
import { ToastTypeEnum } from '@/src/models/enum-models/ToastTypeEnum';
import { ToastService } from '@/src/utils/toast.util';
import { useEffect, useState } from 'react';
import { FaGoogle } from 'react-icons/fa';

const BLUE = '#4285F4';
const SIGNUP_URL = 'https://ads.google.com/home/';

export const formatGoogleId = (id?: string) => {
  const d = (id ?? '').replace(/\D/g, '');
  return d.length === 10 ? `${d.slice(0, 3)}-${d.slice(3, 6)}-${d.slice(6)}` : (id ?? '');
};

const errorDetail = (err: unknown, fallback: string) => {
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
    ToastService.showToast(errorDetail(err, 'Could not open Google sign-in. Try again.'), ToastTypeEnum.Error);
    return false;
  }
};

type Account = { customer_id: string; name: string; currency_code: string };
type Way = '' | 'no_account' | 'customer_id';

const linkBtn: React.CSSProperties = {
  border: 'none',
  background: 'none',
  padding: 0,
  color: BLUE,
  fontSize: 12,
  fontWeight: 600,
  cursor: 'pointer',
  fontFamily: 'var(--wf)',
  textAlign: 'left',
};
const solidBtn = (disabled = false): React.CSSProperties => ({
  display: 'inline-flex',
  alignItems: 'center',
  gap: 8,
  padding: '8px 14px',
  borderRadius: 9,
  border: 'none',
  background: BLUE,
  color: '#fff',
  fontSize: 12.5,
  fontWeight: 700,
  cursor: disabled ? 'default' : 'pointer',
  fontFamily: 'var(--wf)',
  opacity: disabled ? 0.6 : 1,
  whiteSpace: 'nowrap',
});
const input: React.CSSProperties = {
  flex: '1 1 200px',
  minWidth: 0,
  padding: '8px 10px',
  borderRadius: 8,
  border: '1px solid #cfd8ea',
  fontSize: 13,
  fontFamily: 'var(--wf)',
  outline: 'none',
};
const box: React.CSSProperties = {
  marginTop: 10,
  padding: '11px 12px',
  background: '#fff',
  border: '1px solid #dbe6fb',
  borderRadius: 10,
};

interface Props {
  /** Reload the page's connection statuses. */
  onChanged: () => void;
  /** false = URI can't create accounts for brands yet (Google's rule for new manager accounts). */
  canCreate?: boolean | null;
}

/**
 * Choosing the Google Ads account, in plain words and three ways:
 *  1. Continue with Google — sign in, pick the account by name. No ID to look
 *     up and nothing to approve in Google Ads (we approve on your behalf).
 *  2. I don't have a Google Ads account — make one in two minutes, come back.
 *  3. Enter my Customer ID — for when someone else owns the Google login.
 */
const GoogleAdsChooser = ({ onChanged, canCreate }: Props) => {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [signedIn, setSignedIn] = useState(false);
  const [others, setOthers] = useState(0);
  const [busy, setBusy] = useState('');
  const [note, setNote] = useState('');
  const [way, setWay] = useState<Way>('');
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
      setNote(errorDetail(err, 'Could not link that account. Try again.'));
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
      setNote(errorDetail(err, 'Could not send the request. Check the number and try again.'));
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
      const detail = errorDetail(err, '');
      // Google doesn't let a new manager account create accounts for others yet —
      // not something to retry; show the make-your-own steps instead.
      if (detail === 'google_ads_mcc_not_eligible_to_create') setCreateRefused(true);
      else setNote('Could not create the account. Please try again.');
    } finally {
      setBusy('');
    }
  };

  return (
    <div style={{ fontFamily: 'var(--wf)' }}>
      <div style={{ fontSize: 13, fontWeight: 700, color: '#1f2937' }}>Give URI permission to run your Google ads</div>
      <div style={{ fontSize: 12, color: '#666', margin: '2px 0 10px', lineHeight: 1.5 }}>
        Sign in with the Google account you use for Google Ads and pick your account. No ID to look up. URI can create
        and manage ads for you; your billing and your login stay yours, and you can disconnect any time.
      </div>

      {accounts.length > 0 ? (
        <div>
          <div style={{ fontSize: 11.5, fontWeight: 700, color: '#6b7280', marginBottom: 6 }}>
            CHOOSE YOUR GOOGLE ADS ACCOUNT
          </div>
          <div style={{ display: 'grid', gap: 6, gridTemplateColumns: 'repeat(auto-fill, minmax(230px, 1fr))' }}>
            {accounts.map((a) => (
              <button
                key={a.customer_id}
                type="button"
                disabled={!!busy}
                onClick={() => pick(a)}
                style={{
                  textAlign: 'left',
                  padding: '9px 12px',
                  borderRadius: 9,
                  border: `1.5px solid ${busy === a.customer_id ? BLUE : '#dbe6fb'}`,
                  background: '#fff',
                  cursor: busy ? 'default' : 'pointer',
                  fontFamily: 'var(--wf)',
                  opacity: busy && busy !== a.customer_id ? 0.55 : 1,
                }}
              >
                <div style={{ fontSize: 13, fontWeight: 700, color: '#111' }}>
                  {busy === a.customer_id ? 'Linking…' : a.name || 'Google Ads account'}
                </div>
                <div style={{ fontSize: 11.5, color: '#6b7280' }}>
                  {formatGoogleId(a.customer_id)}
                  {a.currency_code ? ` · ${a.currency_code}` : ''}
                </div>
              </button>
            ))}
          </div>
        </div>
      ) : (
        <button type="button" onClick={signIn} disabled={!!busy} style={solidBtn(!!busy)}>
          <FaGoogle size={14} />
          {busy === 'signin' ? 'Opening Google…' : 'Continue with Google'}
        </button>
      )}

      {signedIn && accounts.length === 0 && (
        <div style={{ fontSize: 12, color: '#a15c00', marginTop: 9, lineHeight: 1.5 }}>
          We didn&apos;t find a Google Ads account on that Google login
          {others > 0 ? ' (only manager or closed accounts)' : ''}. Try the Google account you use for Google Ads, or
          see &ldquo;I don&apos;t have a Google Ads account&rdquo; below.
        </div>
      )}

      <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', marginTop: 12 }}>
        {accounts.length > 0 && (
          <button type="button" style={linkBtn} disabled={!!busy} onClick={signIn}>
            Use a different Google login
          </button>
        )}
        <button
          type="button"
          style={linkBtn}
          aria-expanded={way === 'no_account'}
          onClick={() => setWay(way === 'no_account' ? '' : 'no_account')}
        >
          I don&apos;t have a Google Ads account
        </button>
        <button
          type="button"
          style={linkBtn}
          aria-expanded={way === 'customer_id'}
          onClick={() => setWay(way === 'customer_id' ? '' : 'customer_id')}
        >
          Enter my Customer ID instead
        </button>
      </div>

      {way === 'no_account' && (
        <div style={box}>
          {!createBlocked && (
            <div style={{ marginBottom: 12 }}>
              <div style={{ fontSize: 12.5, fontWeight: 700, color: '#1f2937' }}>Let URI create one for you</div>
              <div style={{ fontSize: 12, color: '#666', margin: '2px 0 7px' }}>
                A new Google Ads account in naira, ready straight away.
              </div>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
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
                  style={solidBtn(!!busy || !accountName.trim())}
                  disabled={!!busy || !accountName.trim()}
                  onClick={createForMe}
                >
                  {busy === 'create' ? 'Creating…' : 'Create my account'}
                </button>
              </div>
              <div style={{ fontSize: 11.5, color: '#9ca3af', margin: '10px 0 0' }}>Or make it yourself:</div>
            </div>
          )}
          <div style={{ fontSize: 12.5, fontWeight: 700, color: '#1f2937' }}>
            Make a Google Ads account — about two minutes
          </div>
          <ol
            style={{
              fontSize: 12,
              color: '#555',
              margin: '6px 0 10px',
              paddingLeft: 18,
              lineHeight: 1.65,
              listStyle: 'decimal',
            }}
          >
            <li>
              Open{' '}
              <a href={SIGNUP_URL} target="_blank" rel="noreferrer" style={{ color: BLUE }}>
                ads.google.com
              </a>{' '}
              and press <b>Start now</b>, signed in with your business Google account.
            </li>
            <li>
              If it asks you to build a campaign straight away, look for <b>Skip</b> or <b>Switch to Expert Mode</b> →{' '}
              <b>Create an account without a campaign</b>. You don&apos;t need to make an ad — URI does that.
            </li>
            <li>
              Choose your country, time zone and currency (naira if you&apos;ll pay in naira — this can&apos;t be
              changed later), and confirm.
            </li>
            <li>Come back here and press Continue with Google.</li>
          </ol>
          <button type="button" onClick={signIn} disabled={!!busy} style={solidBtn(!!busy)}>
            <FaGoogle size={14} />
            I&apos;ve made it — Continue with Google
          </button>
        </div>
      )}

      {way === 'customer_id' && (
        <div style={box}>
          <div style={{ fontSize: 12.5, fontWeight: 700, color: '#1f2937' }}>Enter your Google Ads Customer ID</div>
          <div style={{ fontSize: 12, color: '#666', margin: '2px 0 7px', lineHeight: 1.5 }}>
            Use this if someone else holds the Google login. It&apos;s the 10-digit number at the top right of Google
            Ads, like 123-456-7890. We&apos;ll send a request that an admin of that account approves.
          </div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <input
              value={customerId}
              onChange={(e) => setCustomerId(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && linkById()}
              placeholder="123-456-7890"
              inputMode="numeric"
              aria-label="Google Ads Customer ID"
              maxLength={14}
              style={input}
            />
            <button
              type="button"
              style={solidBtn(!!busy || !customerId.trim())}
              disabled={!!busy || !customerId.trim()}
              onClick={linkById}
            >
              {busy === 'id' ? 'Sending…' : 'Send request'}
            </button>
          </div>
        </div>
      )}

      {note && (
        <div role="status" style={{ fontSize: 12, color: '#c62828', marginTop: 9 }}>
          {note}
        </div>
      )}
    </div>
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
