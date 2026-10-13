'use client';

import { CampaignService } from '@/src/api/CampaignService';
import { ToastTypeEnum } from '@/src/models/enum-models/ToastTypeEnum';
import { ToastService } from '@/src/utils/toast.util';
import { useEffect, useState } from 'react';

const BLUE = '#4285F4';

const formatId = (id?: string) => {
  const d = (id ?? '').replace(/\D/g, '');
  return d.length === 10 ? `${d.slice(0, 3)}-${d.slice(3, 6)}-${d.slice(6)}` : (id ?? '');
};

const errorDetail = (err: unknown, fallback: string) => {
  const e = err as { data?: { detail?: string }; response?: { data?: { detail?: string } } };
  return e?.data?.detail ?? e?.response?.data?.detail ?? fallback;
};

const btn = (kind: 'primary' | 'plain' | 'danger' = 'plain'): React.CSSProperties => ({
  padding: '5px 11px',
  borderRadius: 7,
  border: kind === 'primary' ? 'none' : `1px solid ${kind === 'danger' ? '#f3c7c7' : '#e3e1dd'}`,
  background: kind === 'primary' ? BLUE : '#fff',
  color: kind === 'primary' ? '#fff' : kind === 'danger' ? '#c62828' : '#444',
  fontSize: 11.5,
  fontWeight: 600,
  cursor: 'pointer',
  fontFamily: 'var(--wf)',
  whiteSpace: 'nowrap',
});

interface Props {
  /** manager_link_pending | manager_link_declined | manager_link_refused | ready | no_whatsapp */
  state: string;
  customerId?: string;
  accountName?: string;
  /** URI's manager account ID, as shown in Google Ads (123-456-7890). */
  managerId?: string;
  /** Why Google refused, when it did. */
  detail?: string;
  /** URI created this account for the brand — it can't be swapped out here. */
  createdByUri?: boolean;
  /** Reload the page's connection statuses (after anything changed). */
  onChanged: () => void;
}

/**
 * Everything under the Google Ads card once an account has been chosen:
 * waiting for the owner to accept the link (with the exact steps, and a
 * "Check again" that really asks Google), declined, refused, or linked —
 * plus Change account and Disconnect.
 */
const GoogleAdsLinkPanel = ({ state, customerId, accountName, managerId, detail, createdByUri, onChanged }: Props) => {
  const [busy, setBusy] = useState('');
  const [note, setNote] = useState('');
  const [confirm, setConfirm] = useState<'' | 'change' | 'disconnect'>('');

  // While waiting, keep asking Google quietly so the card turns to "Linked" by
  // itself the moment the request is accepted — no need to come back and press
  // Check again. Stops after ten minutes; the button still works after that.
  useEffect(() => {
    if (state !== 'manager_link_pending') return;
    let tries = 0;
    const timer = setInterval(async () => {
      tries += 1;
      if (tries > 50) return clearInterval(timer);
      if (document.hidden) return;
      try {
        const s = await CampaignService.getGoogleConnectionStatus(true);
        if (s.state !== 'manager_link_pending') {
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
    }, 12000);
    return () => clearInterval(timer);
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
        ToastService.showToast(
          'Not accepted yet. Accept the request in Google Ads, then press Check again.',
          ToastTypeEnum.Warning
        );
      } else if (s.state === 'ready') {
        ToastService.showToast(
          `Google Ads linked${s.account_name ? ` — ${s.account_name}` : ''}.`,
          ToastTypeEnum.Success
        );
      } else if (s.state === 'manager_link_declined') {
        ToastService.showToast('The link request was declined or removed in Google Ads.', ToastTypeEnum.Error);
      }
      onChanged();
    } catch (err) {
      setNote(errorDetail(err, 'Could not check right now. Try again in a minute.'));
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
      else ToastService.showToast('Link request sent again — accept it in Google Ads.', ToastTypeEnum.Success);
      onChanged();
    } catch (err) {
      setNote(errorDetail(err, 'Could not send the request. Try again.'));
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
      setNote(errorDetail(err, 'Could not do that right now. Try again.'));
    } finally {
      setBusy('');
    }
  };

  const tone = pending
    ? { bg: '#fffaf0', fg: '#a15c00' }
    : linked
      ? { bg: '#f6faff', fg: '#1a56b0' }
      : { bg: '#fff5f5', fg: '#c62828' };

  return (
    <div
      style={{
        padding: '11px 16px',
        background: tone.bg,
        borderRadius: '0 0 12px 12px',
        border: `1.5px solid ${BLUE}44`,
        borderTop: 'none',
        fontFamily: 'var(--wf)',
      }}
    >
      <div
        style={{
          display: 'flex',
          gap: 12,
          alignItems: 'flex-start',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
        }}
      >
        <div style={{ minWidth: 0, flex: '1 1 260px' }}>
          <div style={{ fontSize: 12.5, fontWeight: 700, color: tone.fg }}>
            {pending && 'One step left: approve URI in your Google Ads account'}
            {declined && 'URI no longer has permission on this Google Ads account'}
            {refused && 'Google would not link this account'}
            {linked && (accountName ? `Linked — ${accountName}` : 'Linked to your Google Ads account')}
          </div>
          {customerId && (
            <div style={{ fontSize: 11.5, color: '#666', marginTop: 2 }}>
              Google Ads account <b>{formatId(customerId)}</b>
            </div>
          )}
          {pending && (
            <ol
              style={{
                fontSize: 11.5,
                color: '#555',
                margin: '7px 0 0',
                paddingLeft: 18,
                lineHeight: 1.6,
                listStyle: 'decimal',
              }}
            >
              <li>
                Open{' '}
                <a
                  href="https://ads.google.com/aw/accountaccess/managers"
                  target="_blank"
                  rel="noreferrer"
                  style={{ color: BLUE }}
                >
                  Google Ads → Admin → Access and security → Managers
                </a>{' '}
                (signed in as an admin of account {formatId(customerId)}).
              </li>
              <li>
                Find the request from <b>URI{managerId ? ` (${managerId})` : ''}</b> and click <b>Accept</b>.
              </li>
              <li>That&apos;s it — this page updates by itself within a few seconds.</li>
            </ol>
          )}
          {declined && (
            <div style={{ fontSize: 11.5, color: '#555', marginTop: 5 }}>
              The request was declined or cancelled, or URI was removed as a manager in Google Ads. Send the request
              again, or choose a different account.
            </div>
          )}
          {refused && detail && <div style={{ fontSize: 11.5, color: '#555', marginTop: 5 }}>{detail}</div>}
          {note && (
            <div role="status" style={{ fontSize: 11.5, color: tone.fg, marginTop: 6 }}>
              {note}
            </div>
          )}
        </div>

        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center' }}>
          {(pending || linked) && (
            <button type="button" style={btn(pending ? 'primary' : 'plain')} disabled={!!busy} onClick={check}>
              {busy === 'check' ? 'Checking…' : 'Check again'}
            </button>
          )}
          {(declined || refused) && customerId && (
            <button type="button" style={btn('primary')} disabled={!!busy} onClick={resend}>
              {busy === 'resend' ? 'Sending…' : 'Send request again'}
            </button>
          )}
          {!createdByUri && (
            <button type="button" style={btn()} disabled={!!busy} onClick={() => setConfirm('change')}>
              Change account
            </button>
          )}
          {!createdByUri && (
            <button type="button" style={btn('danger')} disabled={!!busy} onClick={() => setConfirm('disconnect')}>
              Disconnect
            </button>
          )}
        </div>
      </div>

      {confirm && (
        <div
          role="alertdialog"
          aria-label={confirm === 'disconnect' ? 'Disconnect Google Ads' : 'Change Google Ads account'}
          style={{
            marginTop: 10,
            padding: '9px 11px',
            background: '#fff',
            border: '1px solid #e3e1dd',
            borderRadius: 9,
            display: 'flex',
            gap: 10,
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
          }}
        >
          <span style={{ fontSize: 11.5, color: '#444', flex: '1 1 240px' }}>
            {confirm === 'disconnect'
              ? 'Disconnect Google Ads from this brand?'
              : 'Stop using this Google Ads account and choose another?'}{' '}
            {pending
              ? 'The pending request will be withdrawn.'
              : linked
                ? 'URI will be removed as a manager of this account in Google Ads.'
                : ''}
          </span>
          <span style={{ display: 'flex', gap: 6 }}>
            <button type="button" style={btn()} disabled={!!busy} onClick={() => setConfirm('')}>
              Cancel
            </button>
            <button
              type="button"
              style={btn('danger')}
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
    </div>
  );
};

export default GoogleAdsLinkPanel;
