'use client';

import { useEffect, useRef, useState } from 'react';
import { InboxService } from '@/src/api/InboxService';

/*
 * Connect WhatsApp to the inbox with Meta's Embedded Signup: the business logs in with
 * Facebook, picks or creates its WhatsApp Business account and confirms the number in
 * Meta's own popup. Meta posts the account and number ids back to this window and
 * returns a code; the backend exchanges it and registers the number as a channel.
 */

type FbLogin = (cb: (r: { authResponse?: { code?: string } | null }) => void, opts: Record<string, unknown>) => void;
type FbSdk = { init: (o: Record<string, unknown>) => void; login: FbLogin };

declare global {
  interface Window {
    FB?: FbSdk;
    fbAsyncInit?: () => void;
  }
}

function loadSdk(appId: string, version: string): Promise<FbSdk> {
  return new Promise((resolve, reject) => {
    if (window.FB) {
      resolve(window.FB);
      return;
    }
    window.fbAsyncInit = () => {
      window.FB?.init({ appId, autoLogAppEvents: true, xfbml: false, version });
      if (window.FB) resolve(window.FB);
    };
    const s = document.createElement('script');
    s.src = 'https://connect.facebook.net/en_US/sdk.js';
    s.async = true;
    s.defer = true;
    s.crossOrigin = 'anonymous';
    s.onerror = () => reject(new Error("Couldn't load Facebook's sign-in."));
    document.body.appendChild(s);
  });
}

function errorText(e: unknown, fallback: string): string {
  const d = (e as { response?: { data?: { detail?: unknown } } })?.response?.data?.detail;
  return typeof d === 'string' ? d : e instanceof Error ? e.message : fallback;
}

export function WhatsAppConnect({
  onConnected,
  onClose,
}: {
  onConnected: (label: string) => void;
  onClose: () => void;
}) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [keepApp, setKeepApp] = useState(true);
  const [manual, setManual] = useState(false);
  const [waba, setWaba] = useState('');
  const [phone, setPhone] = useState('');
  const [token, setToken] = useState('');
  const session = useRef<{ waba_id?: string; phone_number_id?: string }>({});

  useEffect(() => {
    function onMessage(ev: MessageEvent) {
      if (!/facebook\.com$/.test(new URL(ev.origin).hostname)) return;
      try {
        const data = typeof ev.data === 'string' ? JSON.parse(ev.data) : ev.data;
        if (data?.type === 'WA_EMBEDDED_SIGNUP' && data.data) {
          session.current = { waba_id: data.data.waba_id, phone_number_id: data.data.phone_number_id };
          if (data.event === 'CANCEL') setBusy(false);
        }
      } catch {
        /* not Meta's signup message */
      }
    }
    window.addEventListener('message', onMessage);
    return () => window.removeEventListener('message', onMessage);
  }, []);

  async function finish(body: Record<string, unknown>) {
    const res = await InboxService.connectWhatsApp(body);
    onConnected(res.connected.name || res.connected.display_phone_number);
  }

  async function start() {
    setBusy(true);
    setError('');
    try {
      const cfg = await InboxService.whatsappConfig();
      if (!cfg.available) {
        setError("WhatsApp sign-up isn't switched on yet. Use 'Connect by ID' for URI's own numbers.");
        setBusy(false);
        return;
      }
      const FB = await loadSdk(cfg.app_id, cfg.graph_version);
      FB.login(
        (r) => {
          const code = r.authResponse?.code;
          const { waba_id, phone_number_id } = session.current;
          if (!code || !waba_id || !phone_number_id) {
            setError('WhatsApp sign-up was closed before it finished.');
            setBusy(false);
            return;
          }
          finish({ code, waba_id, phone_number_id, coexistence: keepApp })
            .catch((e) => setError(errorText(e, "Couldn't connect that number.")))
            .finally(() => setBusy(false));
        },
        {
          config_id: cfg.config_id,
          response_type: 'code',
          override_default_response_type: true,
          extras: {
            setup: {},
            sessionInfoVersion: '3',
            ...(keepApp ? { featureType: 'whatsapp_business_app_onboarding' } : {}),
          },
        }
      );
    } catch (e) {
      setError(errorText(e, "Couldn't start WhatsApp sign-up."));
      setBusy(false);
    }
  }

  async function connectById() {
    setBusy(true);
    setError('');
    try {
      await finish({
        waba_id: waba.trim(),
        phone_number_id: phone.trim(),
        access_token: token.trim(),
        coexistence: keepApp,
      });
    } catch (e) {
      setError(errorText(e, "Couldn't connect that number."));
    }
    setBusy(false);
  }

  const input = {
    border: '1px solid rgba(0,0,0,.15)',
    borderRadius: 8,
    padding: '8px 10px',
    fontSize: 13,
    width: '100%',
    boxSizing: 'border-box' as const,
  };

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,.35)',
        zIndex: 1000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 16,
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: '#fff',
          borderRadius: 14,
          padding: 20,
          width: '100%',
          maxWidth: 440,
          display: 'flex',
          flexDirection: 'column',
          gap: 12,
        }}
      >
        <div style={{ fontSize: 16, fontWeight: 800, color: '#1a1a1a' }}>Connect WhatsApp</div>
        <div style={{ fontSize: 12.5, color: '#555', lineHeight: 1.5 }}>
          Customers who message your WhatsApp number will appear in this inbox, and URI can reply for you. You’ll log in
          with Facebook and confirm your number with a code.
        </div>
        <label style={{ display: 'flex', gap: 8, fontSize: 12.5, color: '#333', alignItems: 'flex-start' }}>
          <input type="checkbox" checked={keepApp} onChange={(e) => setKeepApp(e.target.checked)} />
          Keep using this number in the WhatsApp Business app on my phone too
        </label>
        {!manual ? (
          <button
            type="button"
            onClick={start}
            disabled={busy}
            style={{
              background: '#25D366',
              color: '#fff',
              border: 'none',
              borderRadius: 10,
              padding: '11px 14px',
              fontWeight: 800,
              fontSize: 14,
              cursor: busy ? 'default' : 'pointer',
              opacity: busy ? 0.7 : 1,
            }}
          >
            {busy ? 'Connecting…' : 'Continue with Facebook'}
          </button>
        ) : (
          <>
            <input
              style={input}
              placeholder="WhatsApp Business Account ID"
              value={waba}
              onChange={(e) => setWaba(e.target.value)}
            />
            <input
              style={input}
              placeholder="Phone number ID"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
            />
            <input
              style={input}
              type="password"
              placeholder="Access token (from Meta's API Setup or a system user)"
              value={token}
              onChange={(e) => setToken(e.target.value)}
            />
            <button
              type="button"
              onClick={connectById}
              disabled={busy || !waba.trim() || !phone.trim()}
              style={{
                background: '#25D366',
                color: '#fff',
                border: 'none',
                borderRadius: 10,
                padding: '10px 14px',
                fontWeight: 800,
                cursor: 'pointer',
                opacity: busy || !waba.trim() || !phone.trim() ? 0.6 : 1,
              }}
            >
              {busy ? 'Connecting…' : 'Connect number'}
            </button>
          </>
        )}
        {error && <div style={{ fontSize: 12.5, color: '#C62828' }}>{error}</div>}
        <button
          type="button"
          onClick={() => setManual((m) => !m)}
          style={{
            background: 'none',
            border: 'none',
            color: '#888',
            fontSize: 11.5,
            cursor: 'pointer',
            textAlign: 'left',
          }}
        >
          {manual ? '← Back to Facebook sign-up' : 'Connect by ID (numbers in URI’s own business accounts)'}
        </button>
      </div>
    </div>
  );
}
