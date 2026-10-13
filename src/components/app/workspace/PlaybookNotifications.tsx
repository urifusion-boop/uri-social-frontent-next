'use client';

import { BrandProfileData, BrandProfileService } from '@/src/api/BrandProfileService';
import {
  ChannelKey,
  ChannelStatus,
  NotificationChannelsService,
  enableBrowserPush,
} from '@/src/api/NotificationChannelsService';
import { ToastTypeEnum } from '@/src/models/enum-models/ToastTypeEnum';
import { ToastService } from '@/src/utils/toast.util';
import { useCallback, useEffect, useState } from 'react';

// Same labels onboarding saves — the backend maps them to alerts and channels.
const EVENTS = [
  'Post ready for review',
  'Post published',
  'Weekly performance report',
  'Trending topic in your niche',
  'Content calendar needs refill',
  'Engagement spike detected',
];
const ALERT_CHANNELS: { label: string; key: ChannelKey }[] = [
  { label: 'Email', key: 'email' },
  { label: 'WhatsApp', key: 'whatsapp' },
  { label: 'SMS', key: 'sms' },
  { label: 'Push Notification', key: 'push' },
  { label: 'Slack', key: 'slack' },
  { label: 'Telegram', key: 'telegram' },
];
const APPROVAL_CHANNELS: { label: string; key: ChannelKey }[] = [
  { label: 'Dashboard', key: 'dashboard' },
  { label: 'WhatsApp', key: 'whatsapp' },
  { label: 'Email', key: 'email' },
  { label: 'Slack', key: 'slack' },
  { label: 'Telegram', key: 'telegram' },
];
const KEY_BY_LABEL: Record<string, ChannelKey> = Object.fromEntries(
  [...ALERT_CHANNELS, ...APPROVAL_CHANNELS].map((c) => [c.label, c.key])
);
const NAME: Record<ChannelKey, string> = {
  email: 'Email',
  dashboard: 'Dashboard',
  whatsapp: 'WhatsApp',
  sms: 'SMS',
  push: 'Browser push',
  slack: 'Slack',
  telegram: 'Telegram',
};

const label: React.CSSProperties = {
  fontSize: 11,
  fontWeight: 600,
  color: '#999',
  textTransform: 'uppercase',
  letterSpacing: 0.5,
  marginBottom: 6,
};
const btn = (primary = false): React.CSSProperties => ({
  padding: '6px 12px',
  borderRadius: 7,
  border: '1.5px solid #C2185B',
  background: primary ? '#C2185B' : '#fff',
  color: primary ? '#fff' : '#C2185B',
  fontSize: 12.5,
  fontWeight: 600,
  cursor: 'pointer',
  fontFamily: 'var(--wf)',
});

const Chip = ({ text, active, onClick }: { text: string; active: boolean; onClick: () => void }) => (
  <button
    type="button"
    onClick={onClick}
    style={{
      padding: '5px 11px',
      borderRadius: 20,
      border: `1.5px solid ${active ? '#C2185B' : '#e5e3df'}`,
      background: active ? 'rgba(194,24,91,.08)' : '#fff',
      color: active ? '#C2185B' : '#555',
      fontSize: 12.5,
      fontWeight: 600,
      cursor: 'pointer',
      fontFamily: 'var(--wf)',
    }}
  >
    {text}
  </button>
);

const toggle = (list: string[], v: string) => (list.includes(v) ? list.filter((x) => x !== v) : [...list, v]);

interface Props {
  profile: BrandProfileData | null;
  onProfileUpdate: (p: BrandProfileData) => void;
}

/** Brand Playbook → Notifications: which alerts, where they go, and connecting each channel. */
const PlaybookNotifications = ({ profile, onProfileUpdate }: Props) => {
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [events, setEvents] = useState<string[]>([]);
  const [channel, setChannel] = useState('');
  const [approvalChannels, setApprovalChannels] = useState<string[]>([]);
  const [slackUrl, setSlackUrl] = useState('');
  const [status, setStatus] = useState<ChannelStatus | null>(null);
  const [busy, setBusy] = useState<string>('');
  const [testResult, setTestResult] = useState<Record<string, { sent: boolean; error: string | null }> | null>(null);

  const reset = useCallback(() => {
    setEvents([...(profile?.notification_events ?? [])]);
    setChannel(profile?.notification_channel ?? '');
    setApprovalChannels([...(profile?.approval_channels ?? [])]);
    setSlackUrl(profile?.slack_webhook_url ?? '');
  }, [profile]);

  const refreshStatus = useCallback(() => {
    NotificationChannelsService.status().then(setStatus);
  }, []);

  useEffect(() => {
    reset();
  }, [reset]);
  useEffect(() => {
    refreshStatus();
  }, [refreshStatus]);

  const save = async () => {
    if (slackUrl && !slackUrl.startsWith('https://hooks.slack.com/')) {
      ToastService.showToast(
        'That isn’t a Slack webhook link (it starts with https://hooks.slack.com/).',
        ToastTypeEnum.Error
      );
      return;
    }
    setSaving(true);
    try {
      const updated: BrandProfileData = {
        ...profile,
        notification_events: events,
        notification_channel: channel,
        approval_channels: approvalChannels,
        slack_webhook_url: slackUrl,
      };
      const res = await BrandProfileService.save(updated);
      if (res.status) {
        onProfileUpdate(updated);
        setEditing(false);
        refreshStatus();
        ToastService.showToast('Notification settings saved', ToastTypeEnum.Success);
      } else {
        ToastService.showToast(res.responseMessage || 'Could not save', ToastTypeEnum.Error);
      }
    } catch {
      ToastService.showToast('Could not save', ToastTypeEnum.Error);
    } finally {
      setSaving(false);
    }
  };

  const connectTelegram = async () => {
    setBusy('telegram');
    try {
      const url = await NotificationChannelsService.telegramLink();
      if (url) {
        window.open(url, '_blank', 'noopener');
        ToastService.showToast('Press Start in Telegram, then come back and refresh.', ToastTypeEnum.Success);
      }
    } catch {
      ToastService.showToast('Telegram isn’t available yet.', ToastTypeEnum.Error);
    } finally {
      setBusy('');
    }
  };

  const disconnectTelegram = async () => {
    setBusy('telegram');
    try {
      await NotificationChannelsService.telegramDisconnect();
      refreshStatus();
    } finally {
      setBusy('');
    }
  };

  const enablePush = async () => {
    setBusy('push');
    try {
      const error = await enableBrowserPush();
      if (error) ToastService.showToast(error, ToastTypeEnum.Error);
      else ToastService.showToast('Push notifications are on for this browser', ToastTypeEnum.Success);
      refreshStatus();
    } catch {
      ToastService.showToast('Could not turn on push notifications.', ToastTypeEnum.Error);
    } finally {
      setBusy('');
    }
  };

  const sendTest = async () => {
    setBusy('test');
    setTestResult(null);
    try {
      const res = await NotificationChannelsService.sendTest();
      setTestResult(res.responseData ?? null);
    } catch (err: unknown) {
      const e = err as { response?: { data?: { detail?: string } } };
      ToastService.showToast(e?.response?.data?.detail || 'Test failed', ToastTypeEnum.Error);
    } finally {
      setBusy('');
    }
  };

  const shownEvents = editing ? events : (profile?.notification_events ?? []);
  const shownChannel = editing ? channel : (profile?.notification_channel ?? '');
  const shownApproval = editing ? approvalChannels : (profile?.approval_channels ?? []);
  const inUse = Array.from(
    new Set(
      [shownChannel, ...shownApproval]
        .map((l) => KEY_BY_LABEL[l])
        .filter((k): k is ChannelKey => !!k && k !== 'dashboard')
    )
  );

  const connection = (key: ChannelKey) => {
    const s = status?.[key];
    if (!s) return <span style={{ color: '#bbb' }}>Checking…</span>;
    if (!s.available) return <span style={{ color: '#B45309' }}>Not set up on URI’s side yet — contact support</span>;
    switch (key) {
      case 'email':
        return <span>{s.detail || 'No email on your account'}</span>;
      case 'whatsapp':
        return s.connected ? (
          <span>Sending to {s.detail}</span>
        ) : (
          <span style={{ color: '#B45309' }}>Link your WhatsApp number with Jane first</span>
        );
      case 'sms':
        return s.connected ? (
          <span>Sending to {s.detail}</span>
        ) : (
          <span style={{ color: '#B45309' }}>Add a phone number to your account</span>
        );
      case 'slack':
        return editing ? (
          <input
            value={slackUrl}
            onChange={(e) => setSlackUrl(e.target.value.trim())}
            placeholder="https://hooks.slack.com/services/…"
            style={{ width: '100%', padding: '6px 10px', borderRadius: 7, border: '1px solid #e5e3df', fontSize: 12.5 }}
          />
        ) : s.connected ? (
          <span>Connected to a Slack channel</span>
        ) : (
          <span style={{ color: '#B45309' }}>Edit and paste a Slack incoming-webhook link</span>
        );
      case 'telegram':
        return s.connected ? (
          <span>
            Connected{s.detail ? ` (${s.detail})` : ''}{' '}
            <button type="button" style={btn()} disabled={busy === 'telegram'} onClick={disconnectTelegram}>
              Disconnect
            </button>
          </span>
        ) : (
          <span style={{ display: 'flex', gap: 6 }}>
            <button type="button" style={btn(true)} disabled={busy === 'telegram'} onClick={connectTelegram}>
              Connect Telegram
            </button>
            <button type="button" style={btn()} onClick={refreshStatus}>
              Refresh
            </button>
          </span>
        );
      case 'push':
        return (
          <span style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            {s.connected && <span>On for {s.detail}</span>}
            <button type="button" style={btn(!s.connected)} disabled={busy === 'push'} onClick={enablePush}>
              {s.connected ? 'Add this browser' : 'Turn on for this browser'}
            </button>
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <div>
      <div style={{ marginBottom: 12 }}>
        <div style={label}>Notify me when…</div>
        {editing ? (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {EVENTS.map((e) => (
              <Chip key={e} text={e} active={events.includes(e)} onClick={() => setEvents((p) => toggle(p, e))} />
            ))}
          </div>
        ) : (
          <div style={{ fontSize: 13, color: shownEvents.length ? '#111' : '#bbb' }}>
            {shownEvents.length ? shownEvents.join(' · ') : 'Post ready and post published, by email (default)'}
          </div>
        )}
      </div>

      <div style={{ marginBottom: 12 }}>
        <div style={label}>Send alerts to</div>
        {editing ? (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {ALERT_CHANNELS.map((c) => (
              <Chip
                key={c.label}
                text={c.label}
                active={channel === c.label}
                onClick={() => setChannel(channel === c.label ? '' : c.label)}
              />
            ))}
          </div>
        ) : (
          <div style={{ fontSize: 13, color: shownChannel ? '#111' : '#bbb' }}>{shownChannel || 'Email'}</div>
        )}
      </div>

      <div style={{ marginBottom: 12 }}>
        <div style={label}>Posts ready for review also go to</div>
        {editing ? (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {APPROVAL_CHANNELS.map((c) => (
              <Chip
                key={c.label}
                text={c.label}
                active={approvalChannels.includes(c.label)}
                onClick={() => setApprovalChannels((p) => toggle(p, c.label))}
              />
            ))}
          </div>
        ) : (
          <div style={{ fontSize: 13, color: shownApproval.length ? '#111' : '#bbb' }}>
            {shownApproval.length ? shownApproval.join(' · ') : 'Dashboard'}
          </div>
        )}
      </div>

      {inUse.length > 0 && (
        <div style={{ marginBottom: 12 }}>
          <div style={label}>Connections</div>
          {inUse.map((key) => (
            <div
              key={key}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                padding: '8px 0',
                borderBottom: '1px solid #f3f1ee',
                fontSize: 12.5,
                color: '#333',
              }}
            >
              <span style={{ minWidth: 100, fontWeight: 600, color: '#888' }}>{NAME[key]}</span>
              <span style={{ flex: 1 }}>{connection(key)}</span>
            </div>
          ))}
        </div>
      )}

      {testResult && (
        <div style={{ fontSize: 12.5, marginBottom: 10 }}>
          {Object.entries(testResult).map(([key, r]) => (
            <div key={key} style={{ color: r.sent ? '#15803d' : '#B91C1C' }}>
              {r.sent ? '✓' : '✗'} {NAME[key as ChannelKey] ?? key}
              {r.error ? ` — ${r.error}` : ''}
            </div>
          ))}
        </div>
      )}

      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        {editing ? (
          <>
            <button type="button" style={btn(true)} disabled={saving} onClick={save}>
              {saving ? 'Saving…' : 'Save notifications'}
            </button>
            <button
              type="button"
              style={btn()}
              onClick={() => {
                reset();
                setEditing(false);
              }}
            >
              Cancel
            </button>
          </>
        ) : (
          <>
            <button type="button" style={btn()} onClick={() => setEditing(true)}>
              Edit notifications
            </button>
            <button type="button" style={btn()} disabled={busy === 'test'} onClick={sendTest}>
              {busy === 'test' ? 'Sending…' : 'Send a test'}
            </button>
          </>
        )}
      </div>
    </div>
  );
};

export default PlaybookNotifications;
