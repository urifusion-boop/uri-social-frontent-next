'use client';

import { CampaignService } from '@/src/api/CampaignService';
import { ToastTypeEnum } from '@/src/models/enum-models/ToastTypeEnum';
import { ToastService } from '@/src/utils/toast.util';
import { useEffect, useState } from 'react';
import { FaGoogle } from 'react-icons/fa';

const BLUE = '#4285F4';

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

interface Props {
  /** Reload the page's connection statuses. */
  onChanged: () => void;
}

/**
 * The easy way to choose a Google Ads account: sign in with Google and pick
 * it by name — no Customer ID to find, and nothing to accept in Google Ads
 * (we accept on your behalf). Shown while no account is chosen yet.
 */
const GoogleAdsChooser = ({ onChanged }: Props) => {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [signedIn, setSignedIn] = useState(false);
  const [others, setOthers] = useState(0);
  const [busy, setBusy] = useState('');
  const [note, setNote] = useState('');

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
          'Request sent. An admin of that Google Ads account needs to accept it — steps are below.',
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

  return (
    <div style={{ marginBottom: 12, fontFamily: 'var(--wf)' }}>
      <div style={{ fontSize: 13, fontWeight: 700, color: '#1f2937' }}>Give URI permission to run your Google ads</div>
      <div style={{ fontSize: 12, color: '#666', margin: '2px 0 10px', lineHeight: 1.5 }}>
        Sign in with the Google account you use for Google Ads and pick your account. That&apos;s it — no ID to look up.
        URI can create and manage ads for you; your billing and login stay yours, and you can disconnect any time.
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
          <button
            type="button"
            onClick={signIn}
            disabled={!!busy}
            style={{
              marginTop: 8,
              border: 'none',
              background: 'none',
              padding: 0,
              color: BLUE,
              fontSize: 11.5,
              fontWeight: 600,
              cursor: 'pointer',
              fontFamily: 'var(--wf)',
            }}
          >
            Use a different Google login
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={signIn}
          disabled={!!busy}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 8,
            padding: '9px 16px',
            borderRadius: 9,
            border: 'none',
            background: BLUE,
            color: '#fff',
            fontSize: 13,
            fontWeight: 700,
            cursor: busy ? 'default' : 'pointer',
            fontFamily: 'var(--wf)',
            opacity: busy ? 0.7 : 1,
          }}
        >
          <FaGoogle size={14} />
          {busy === 'signin' ? 'Opening Google…' : 'Continue with Google'}
        </button>
      )}

      {signedIn && accounts.length === 0 && (
        <div style={{ fontSize: 12, color: '#a15c00', marginTop: 9, lineHeight: 1.5 }}>
          We didn&apos;t find a Google Ads account on that Google login
          {others > 0 ? ' (only manager or closed accounts)' : ''}. Sign in with the Google account you use for Google
          Ads, or{' '}
          <a href="https://ads.google.com/home/" target="_blank" rel="noreferrer" style={{ color: BLUE }}>
            create a Google Ads account
          </a>{' '}
          first — it takes a couple of minutes.
        </div>
      )}
      {note && (
        <div role="status" style={{ fontSize: 12, color: '#c62828', marginTop: 8 }}>
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
export const GoogleAdsReturn = ({ onChanged }: Props) => {
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const outcome = params.get('google');
    if (!outcome) return;
    const reason = params.get('reason') || '';
    if (outcome === 'linked')
      ToastService.showToast('Google Ads linked. You are ready to run Google ads.', ToastTypeEnum.Success);
    else if (outcome === 'pending') {
      ToastService.showToast(
        reason || 'Request sent. An admin of that Google Ads account needs to accept it — steps are below.',
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
