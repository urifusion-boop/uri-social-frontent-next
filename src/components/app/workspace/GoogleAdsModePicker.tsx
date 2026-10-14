'use client';

/**
 * How this brand's Google ads run — the brand's own choice:
 *  • Run by URI: in URI's Google Ads account. Nothing to connect; the URI wallet
 *    pays for everything and URI pays Google.
 *  • My own Google Ads account: Google bills the brand's card for the ad spend;
 *    the URI wallet pays only URI's fee.
 */

import { CampaignService } from '@/src/api/CampaignService';
import { ToastTypeEnum } from '@/src/models/enum-models/ToastTypeEnum';
import { ToastService } from '@/src/utils/toast.util';
import { useState } from 'react';
import { G, googleErrorDetail } from './GoogleAdsChooser';

type Mode = 'uri' | 'own';

interface Props {
  mode: Mode;
  /** A URI account is ready for this brand. */
  uriReady: boolean;
  /** The brand's own account is linked and ready. */
  ownReady: boolean;
  onChanged: () => void;
}

const font: React.CSSProperties = { fontFamily: 'var(--wf)' };

const Pill = ({ ok, children }: { ok: boolean; children: React.ReactNode }) => (
  <span
    style={{
      fontSize: 10.5,
      fontWeight: 800,
      padding: '2px 8px',
      borderRadius: 999,
      background: ok ? G.greenSoft : G.amberSoft,
      color: ok ? G.green : G.amber,
      whiteSpace: 'nowrap',
    }}
  >
    {children}
  </span>
);

export default function GoogleAdsModePicker({ mode, uriReady, ownReady, onChanged }: Props) {
  const [saving, setSaving] = useState<Mode | ''>('');
  const [note, setNote] = useState('');

  const choose = async (next: Mode) => {
    if (next === mode || saving) return;
    setSaving(next);
    setNote('');
    try {
      const r = await CampaignService.googleSetMode(next);
      ToastService.showToast(
        next === 'uri'
          ? r.ready
            ? 'Your Google ads will run by URI — nothing to connect.'
            : 'Saved. Google ads run by URI are being set up — we’ll be ready soon.'
          : r.ready
            ? 'Your Google ads will run in your own Google Ads account.'
            : 'Saved. Now connect your Google Ads account below.',
        r.ready ? ToastTypeEnum.Success : ToastTypeEnum.Warning
      );
      onChanged();
    } catch (err) {
      setNote(googleErrorDetail(err, 'Couldn’t save that. Try again.'));
    } finally {
      setSaving('');
    }
  };

  const options: {
    value: Mode;
    title: string;
    tag?: string;
    lines: string[];
    status: React.ReactNode;
  }[] = [
    {
      value: 'uri',
      title: 'Run by URI',
      tag: 'Recommended',
      lines: [
        'Nothing to connect — Jane runs your ads in URI’s Google Ads account.',
        'You pay only from your URI wallet. No Google bill.',
      ],
      status: uriReady ? <Pill ok>Ready</Pill> : <Pill ok={false}>Being set up</Pill>,
    },
    {
      value: 'own',
      title: 'My own Google Ads account',
      lines: [
        'Your ads run in your account, and you see them in Google Ads too.',
        'Google bills your card for the ad spend; your URI wallet pays only URI’s fee.',
      ],
      status: ownReady ? <Pill ok>Connected</Pill> : <Pill ok={false}>Not connected</Pill>,
    },
  ];

  return (
    <div style={{ ...font, marginBottom: 12 }}>
      <div style={{ fontSize: 10.5, fontWeight: 800, color: G.faint, letterSpacing: 0.6, marginBottom: 8 }}>
        HOW SHOULD YOUR GOOGLE ADS RUN?
      </div>
      <div
        role="radiogroup"
        aria-label="How your Google ads run"
        style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 10 }}
      >
        {options.map((o) => {
          // The one just clicked shows as chosen straight away; it reverts if saving fails.
          const on = (saving || mode) === o.value;
          return (
            <button
              key={o.value}
              type="button"
              role="radio"
              aria-checked={on}
              disabled={!!saving}
              onClick={() => choose(o.value)}
              style={{
                ...font,
                textAlign: 'left',
                padding: '12px 14px',
                borderRadius: 12,
                border: `1.5px solid ${on ? G.blue : G.line}`,
                background: on ? '#fff' : '#fbfcff',
                boxShadow: on ? '0 4px 14px rgba(26,115,232,.12)' : 'none',
                cursor: saving ? 'default' : 'pointer',
                opacity: saving && saving !== o.value ? 0.6 : 1,
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span
                  aria-hidden
                  style={{
                    width: 16,
                    height: 16,
                    borderRadius: '50%',
                    border: `2px solid ${on ? G.blue : G.faint}`,
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}
                >
                  {on && <span style={{ width: 8, height: 8, borderRadius: '50%', background: G.blue }} />}
                </span>
                <span style={{ fontSize: 13.5, fontWeight: 800, color: G.ink }}>{o.title}</span>
                {o.tag && (
                  <span
                    style={{
                      fontSize: 10,
                      fontWeight: 800,
                      color: G.blue,
                      background: G.blueSoft,
                      padding: '1px 7px',
                      borderRadius: 999,
                    }}
                  >
                    {o.tag}
                  </span>
                )}
                <span style={{ marginLeft: 'auto' }}>
                  {saving === o.value ? <Pill ok={false}>Saving…</Pill> : o.status}
                </span>
              </div>
              <ul
                style={{
                  margin: '8px 0 0 24px',
                  padding: 0,
                  listStyle: 'disc',
                  color: G.muted,
                  fontSize: 12,
                  lineHeight: 1.5,
                }}
              >
                {o.lines.map((l) => (
                  <li key={l}>{l}</li>
                ))}
              </ul>
            </button>
          );
        })}
      </div>
      {mode === 'uri' && !uriReady && (
        <div
          style={{
            marginTop: 10,
            fontSize: 12,
            color: G.amber,
            background: G.amberSoft,
            borderRadius: 8,
            padding: '8px 10px',
            lineHeight: 1.5,
          }}
        >
          Google ads run by URI are being set up and will be ready soon. Want to start now? Choose{' '}
          <b>My own Google Ads account</b> and connect it.
        </div>
      )}
      {note && (
        <div role="alert" style={{ marginTop: 8, fontSize: 12.5, color: G.red }}>
          {note}
        </div>
      )}
    </div>
  );
}
