'use client';

import { CampaignService } from '@/src/api/CampaignService';
import { ToastTypeEnum } from '@/src/models/enum-models/ToastTypeEnum';
import { ToastService } from '@/src/utils/toast.util';
import { useEffect, useState } from 'react';
import {
  continueWithGoogle,
  formatGoogleId,
  G,
  gBtn,
  GoogleButton,
  googleErrorDetail,
  GoogleShell,
  GoogleSteps,
  UnverifiedNote,
} from './GoogleAdsChooser';

interface Props {
  /** manager_link_pending | manager_link_declined | manager_link_refused | ready */
  state: string;
  customerId?: string;
  accountName?: string;
  currency?: string;
  /** URI's manager account ID, as shown in Google Ads (123-456-7890). */
  managerId?: string;
  /** Why Google refused, when it did. */
  detail?: string;
  /** URI created this account for the brand — it can't be swapped out here. */
  createdByUri?: boolean;
  /** false while Google hasn't verified URI's sign-in app yet (it shows a warning screen). */
  signinVerified?: boolean;
  /** We already approved it with the owner's sign-in; Google is just finishing. Nothing to do. */
  finishing?: boolean;
  /** Reload the page's connection statuses (after anything changed). */
  onChanged: () => void;
}

const chip = (bg: string, color: string): React.CSSProperties => ({
  display: 'inline-flex',
  alignItems: 'center',
  gap: 5,
  padding: '2px 9px',
  borderRadius: 999,
  background: bg,
  color,
  fontSize: 11,
  fontWeight: 800,
  whiteSpace: 'nowrap',
});

/**
 * Everything under the Google Ads card once an account has been chosen:
 * linked (the account, with change / disconnect), one approval left (the
 * fastest way plus the exact steps and a picture — and it notices by itself
 * when it's done), or the request ended / was refused.
 */
const GoogleAdsLinkPanel = ({
  state,
  customerId,
  accountName,
  currency,
  managerId,
  detail,
  createdByUri,
  signinVerified,
  finishing,
  onChanged,
}: Props) => {
  const [busy, setBusy] = useState('');
  const [note, setNote] = useState('');
  const [confirm, setConfirm] = useState<'' | 'change' | 'disconnect'>('');

  // While waiting, keep asking Google quietly so the card turns to "Linked" by
  // itself the moment the request is approved — no need to come back and press
  // Check again. Stops after ten minutes; the button still works after that.
  useEffect(() => {
    if (state !== 'manager_link_pending') return;
    let tries = 0;
    let stopped = false;
    const look = async () => {
      tries += 1;
      if (stopped || tries > 55) return clearInterval(timer);
      if (document.hidden) return;
      try {
        const s = await CampaignService.getGoogleConnectionStatus(true);
        if (s.state !== 'manager_link_pending' && !stopped) {
          stopped = true;
          clearInterval(timer);
          if (s.state === 'ready') {
            ToastService.showToast(
              `Google Ads linked${s.account_name ? ` — ${s.account_name}` : ''}.`,
              ToastTypeEnum.Success
            );
          }
          onChanged();
        }
      } catch {
        // a quiet check: try again next time
      }
    };
    const timer = setInterval(look, 12000);
    // Look early too: right after an approval Google is usually done within seconds.
    const early = [3000, 7000].map((ms) => setTimeout(look, ms));
    return () => {
      stopped = true;
      clearInterval(timer);
      early.forEach(clearTimeout);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state]);

  const pending = state === 'manager_link_pending';
  const declined = state === 'manager_link_declined';
  const refused = state === 'manager_link_refused';
  const linked = state === 'ready' || state === 'no_whatsapp';
  if (!pending && !declined && !refused && !linked) return null;

  const check = async () => {
    setBusy('check');
    setNote('');
    try {
      const s = await CampaignService.getGoogleConnectionStatus(true);
      // Toasts, not an inline note: reloading the statuses redraws this panel.
      if (s.sync_error) ToastService.showToast(s.sync_error, ToastTypeEnum.Warning);
      else if (s.state === 'manager_link_pending') {
        ToastService.showToast('Not approved yet. Approve it in Google Ads, then check again.', ToastTypeEnum.Warning);
      } else if (s.state === 'ready') {
        ToastService.showToast(
          `Google Ads is linked${s.account_name ? ` — ${s.account_name}` : ''}.`,
          ToastTypeEnum.Success
        );
      } else if (s.state === 'manager_link_declined') {
        ToastService.showToast('URI no longer has permission on this Google Ads account.', ToastTypeEnum.Error);
      }
      onChanged();
    } catch (err) {
      setNote(googleErrorDetail(err, 'Could not check right now. Try again in a minute.'));
    } finally {
      setBusy('');
    }
  };

  const resend = async () => {
    if (!customerId) return;
    setBusy('resend');
    setNote('');
    try {
      const r = await CampaignService.googleLinkExistingAccount(customerId);
      if (r.manager_link_status === 'refused') setNote(r.detail || 'Google would not accept the request.');
      else ToastService.showToast('Request sent again — approve it in Google Ads.', ToastTypeEnum.Success);
      onChanged();
    } catch (err) {
      setNote(googleErrorDetail(err, 'Could not send the request. Try again.'));
    } finally {
      setBusy('');
    }
  };

  const release = async (remove: boolean) => {
    setBusy(remove ? 'disconnect' : 'change');
    setNote('');
    try {
      const r = remove ? await CampaignService.googleDisconnect() : await CampaignService.googleChangeAccount();
      ToastService.showToast(
        r.google_note || (remove ? 'Google Ads disconnected.' : 'Choose the Google Ads account to use.'),
        r.google_note ? ToastTypeEnum.Warning : ToastTypeEnum.Success
      );
      setConfirm('');
      onChanged();
    } catch (err) {
      setNote(googleErrorDetail(err, 'Could not do that right now. Try again.'));
    } finally {
      setBusy('');
    }
  };

  const signIn = async () => {
    setBusy('signin');
    if (!(await continueWithGoogle())) setBusy('');
  };

  const name = accountName || 'Google Ads account';
  const status = linked ? chip(G.greenSoft, G.green) : pending ? chip(G.amberSoft, G.amber) : chip(G.redSoft, G.red);

  return (
    <GoogleShell>
      <GoogleSteps
        steps={['Account chosen', 'Approve URI in Google Ads', 'Ready to run ads']}
        current={linked ? 3 : 1}
      />

      {/* The account */}
      <div
        style={{
          marginTop: 12,
          padding: '14px 16px',
          borderRadius: 14,
          background: '#fff',
          border: `1px solid ${linked ? '#CDEBD8' : G.line}`,
          boxShadow: '0 6px 24px rgba(26,115,232,.07)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
          <span
            aria-hidden
            style={{
              width: 40,
              height: 40,
              borderRadius: 11,
              background: linked ? G.greenSoft : G.blueSoft,
              color: linked ? G.green : G.blue,
              fontSize: 17,
              fontWeight: 800,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            {name.trim().charAt(0).toUpperCase()}
          </span>
          <div style={{ flex: '1 1 200px', minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
              <span style={{ fontSize: 14.5, fontWeight: 800, color: G.ink }}>{name}</span>
              <span style={status}>
                <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'currentColor' }} />
                {linked
                  ? 'Linked'
                  : pending && finishing
                    ? 'Approved — finishing'
                    : pending
                      ? 'One approval left'
                      : refused
                        ? 'Not linked'
                        : 'Permission ended'}
              </span>
            </div>
            <div style={{ fontSize: 12, color: G.muted, marginTop: 2 }}>
              {customerId ? formatGoogleId(customerId) : ''}
              {currency ? ` · billed in ${currency}` : ''}
              {linked && ' · your billing and login stay yours'}
            </div>
          </div>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {(pending || linked) && (
              <button type="button" style={gBtn('plain', !!busy)} disabled={!!busy} onClick={check}>
                {busy === 'check' ? 'Checking…' : 'Check again'}
              </button>
            )}
            {(declined || refused) && customerId && (
              <button type="button" style={gBtn('primary', !!busy)} disabled={!!busy} onClick={resend}>
                {busy === 'resend' ? 'Sending…' : 'Send request again'}
              </button>
            )}
            {!createdByUri && (
              <button
                type="button"
                style={gBtn('plain', !!busy)}
                disabled={!!busy}
                onClick={() => setConfirm('change')}
              >
                Change account
              </button>
            )}
            {!createdByUri && (
              <button
                type="button"
                style={gBtn('danger', !!busy)}
                disabled={!!busy}
                onClick={() => setConfirm('disconnect')}
              >
                Disconnect
              </button>
            )}
          </div>
        </div>

        {linked && (
          <div
            style={{
              marginTop: 12,
              padding: '10px 12px',
              borderRadius: 10,
              background: G.greenSoft,
              fontSize: 12.5,
              color: '#14532D',
              lineHeight: 1.5,
            }}
          >
            Jane can now run Google Search ads for you — shown to people searching for what you sell.{' '}
            <a href="/workspace/?tab=campaigns" style={{ color: G.green, fontWeight: 800 }}>
              Create a campaign →
            </a>
          </div>
        )}

        {(declined || refused) && (
          <div style={{ marginTop: 12, fontSize: 12.5, color: G.body, lineHeight: 1.5 }}>
            {refused
              ? detail || 'Google would not let URI link this account.'
              : 'The request was declined or cancelled, or URI was removed as a manager in Google Ads. Send the request again, or choose a different account.'}
          </div>
        )}

        {pending && finishing && (
          <div
            role="status"
            style={{
              marginTop: 12,
              padding: '10px 12px',
              borderRadius: 10,
              background: G.blueSoft,
              fontSize: 12.5,
              color: G.body,
              lineHeight: 1.5,
            }}
          >
            <b>Approved.</b> Google is finishing the link — nothing for you to do. This turns to Linked by itself in a
            few seconds.
          </div>
        )}

        {pending && !finishing && (
          <div style={{ marginTop: 14, paddingTop: 14, borderTop: `1px solid ${G.line}` }}>
            <div style={{ display: 'grid', gap: 16, gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))' }}>
              <div>
                <div style={{ fontSize: 10.5, fontWeight: 800, color: G.blue, letterSpacing: 0.6 }}>
                  APPROVE IT IN GOOGLE ADS
                </div>
                <ol
                  style={{
                    fontSize: 12.5,
                    color: G.body,
                    margin: '6px 0 0',
                    paddingLeft: 18,
                    lineHeight: 1.7,
                    listStyle: 'decimal',
                  }}
                >
                  <li>
                    Open{' '}
                    <a
                      href="https://ads.google.com/aw/accountaccess/managers"
                      target="_blank"
                      rel="noreferrer"
                      style={{ color: G.blue, fontWeight: 700 }}
                    >
                      Admin → Access and security → Managers
                    </a>
                    .
                  </li>
                  <li>
                    Find <b>URI{managerId ? ` (${managerId})` : ''}</b> and click <b>Accept</b>.
                  </li>
                  <li>That&apos;s it — this page updates by itself.</li>
                </ol>
                {/* What that page looks like, so they know what to press. */}
                <div
                  aria-label="What you will see in Google Ads"
                  style={{
                    marginTop: 9,
                    border: `1px solid ${G.line}`,
                    borderRadius: 9,
                    background: '#fff',
                    overflow: 'hidden',
                    fontSize: 11,
                  }}
                >
                  <div style={{ padding: '6px 10px', background: '#F6F7F9', color: '#5F6368', fontWeight: 700 }}>
                    Access and security · <span style={{ color: G.blue }}>Managers</span>
                  </div>
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: 8,
                      padding: '8px 10px',
                      borderTop: `1px solid ${G.line}`,
                    }}
                  >
                    <span style={{ color: '#202124' }}>
                      <b>URI</b>
                      {managerId ? ` · ${managerId}` : ''}
                    </span>
                    <span style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                      <span
                        style={{
                          padding: '3px 10px',
                          borderRadius: 4,
                          background: G.blue,
                          color: '#fff',
                          fontWeight: 700,
                          boxShadow: '0 0 0 3px rgba(26,115,232,.22)',
                        }}
                      >
                        Accept
                      </span>
                      <span style={{ color: '#5F6368' }}>Decline</span>
                    </span>
                  </div>
                </div>
              </div>
              <div>
                <div style={{ fontSize: 10.5, fontWeight: 800, color: G.faint, letterSpacing: 0.6 }}>
                  OR LET URI APPROVE IT FOR YOU
                </div>
                <div style={{ fontSize: 12.5, color: G.body, lineHeight: 1.5, margin: '6px 0 10px' }}>
                  Sign in with the Google account that manages{' '}
                  {customerId ? formatGoogleId(customerId) : 'this account'} and it&apos;s approved for you.
                </div>
                <GoogleButton
                  label="Continue with Google"
                  busy={busy === 'signin'}
                  disabled={!!busy}
                  onClick={signIn}
                />
                {signinVerified === false && <UnverifiedNote />}
              </div>
            </div>
          </div>
        )}

        {confirm && (
          <div
            role="alertdialog"
            aria-label={confirm === 'disconnect' ? 'Disconnect Google Ads' : 'Change Google Ads account'}
            style={{
              marginTop: 12,
              padding: '10px 12px',
              background: G.redSoft,
              border: '1px solid #F3C7C7',
              borderRadius: 10,
              display: 'flex',
              gap: 10,
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
            }}
          >
            <span style={{ fontSize: 12.5, color: G.body, flex: '1 1 240px', lineHeight: 1.5 }}>
              <b>
                {confirm === 'disconnect'
                  ? 'Disconnect Google Ads from this brand?'
                  : 'Stop using this account and choose another?'}
              </b>{' '}
              {pending
                ? 'The pending request will be withdrawn.'
                : linked
                  ? 'URI will be removed as a manager of this account in Google Ads. Your account and its ads are not deleted.'
                  : ''}
            </span>
            <span style={{ display: 'flex', gap: 6 }}>
              <button type="button" style={gBtn('plain', !!busy)} disabled={!!busy} onClick={() => setConfirm('')}>
                Cancel
              </button>
              <button
                type="button"
                style={gBtn('danger', !!busy)}
                disabled={!!busy}
                onClick={() => release(confirm === 'disconnect')}
              >
                {busy === 'change' || busy === 'disconnect'
                  ? 'Working…'
                  : confirm === 'disconnect'
                    ? 'Yes, disconnect'
                    : 'Yes, change'}
              </button>
            </span>
          </div>
        )}

        {note && (
          <div role="alert" style={{ marginTop: 10, fontSize: 12.5, color: G.red }}>
            {note}
          </div>
        )}
      </div>
    </GoogleShell>
  );
};

export default GoogleAdsLinkPanel;
