'use client';

import { useCallback, useEffect, useState, type ReactNode } from 'react';
import { BellRing, Gauge, Mail, Plug, Tag, X } from 'lucide-react';
import { InboxService, type InboxAgentSettings, type OneboxUsage } from '@/src/api/InboxService';
import InboxConnectionsPage, { type ChannelConnection } from '../InboxConnectionsPage';
import { OneboxUsagePanel } from '../OneboxUsage';
import { MSG_MUTED, MSG_PINK } from './MessagingHeader';
import { Bar, Btn, Col, Field, Label, Muted, NavRow, Pane, Title, apiError } from './ui';

export type SettingsSection = 'channels' | 'usage' | 'tags' | 'alerts';

const TAG_LOOKS = [
  ['#FFF4E5', '#B26A00'],
  ['#FDEBF2', '#D0145C'],
  ['#F1EAFE', '#7C3AED'],
  ['#F3F2EF', '#5C5460'],
  ['#FDECEA', '#C62828'],
  ['#EAF2FF', '#2563EB'],
  ['#E7F7EE', '#15803D'],
];

export function tagLook(tag: string): { bg: string; fg: string } {
  let h = 0;
  for (const ch of tag) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  const [bg, fg] = TAG_LOOKS[h % TAG_LOOKS.length];
  return { bg, fg };
}

function TagChip({ tag, onRemove }: { tag: string; onRemove?: () => void }) {
  const { bg, fg } = tagLook(tag);
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 5,
        fontSize: 12,
        fontWeight: 500,
        padding: '3px 10px',
        borderRadius: 999,
        background: bg,
        color: fg,
      }}
    >
      {tag}
      {onRemove && (
        <button
          type="button"
          aria-label={`Remove ${tag}`}
          onClick={onRemove}
          style={{ border: 'none', background: 'none', padding: 0, cursor: 'pointer', color: fg, display: 'flex' }}
        >
          <X size={12} />
        </button>
      )}
    </span>
  );
}

function useTagPresets() {
  const [tags, setTags] = useState<string[] | null>(null);
  const [error, setError] = useState('');
  useEffect(() => {
    InboxService.getDeskPrefs()
      .then((p) => setTags(p.tag_presets))
      .catch(() => setError("Couldn't load your tags."));
  }, []);
  const save = async (next: string[]) => {
    const before = tags;
    setTags(next);
    try {
      setTags((await InboxService.saveDeskPrefs({ tag_presets: next })).tag_presets);
      setError('');
    } catch (e) {
      setTags(before);
      setError(apiError(e, "Couldn't save your tags."));
    }
  };
  return { tags, save, error };
}

function TagsEditor({ compact }: { compact?: boolean }) {
  const { tags, save, error } = useTagPresets();
  const [draft, setDraft] = useState('');
  const add = () => {
    const t = draft.trim();
    if (!t || !tags || tags.some((x) => x.toLowerCase() === t.toLowerCase())) return;
    save([...tags, t]);
    setDraft('');
  };
  if (!tags) return <Muted>{error || 'Loading…'}</Muted>;
  return (
    <div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: compact ? 8 : 12 }}>
        {tags.map((t) => (
          <TagChip key={t} tag={t} onRemove={() => save(tags.filter((x) => x !== t))} />
        ))}
        {tags.length === 0 && <Muted>No tags yet.</Muted>}
      </div>
      <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
        <Field value={draft} onChange={setDraft} placeholder="New tag…" onEnter={add} />
        <Btn onClick={add} disabled={!draft.trim()}>
          Add
        </Btn>
      </div>
      {error && <Muted style={{ color: '#C62828', marginTop: 6 }}>{error}</Muted>}
    </div>
  );
}

function AlertsEditor() {
  const [settings, setSettings] = useState<InboxAgentSettings | null>(null);
  const [emails, setEmails] = useState('');
  const [status, setStatus] = useState('');
  useEffect(() => {
    InboxService.getAgentSettings()
      .then((s) => {
        setSettings(s);
        setEmails((s.alert_emails ?? []).join(', '));
      })
      .catch(() => setStatus("Couldn't load your alert settings."));
  }, []);
  const save = async () => {
    if (!settings) return;
    const list = emails
      .split(',')
      .map((e) => e.trim())
      .filter(Boolean);
    if (list.length > 5) {
      setStatus('Add up to 5 addresses.');
      return;
    }
    setStatus('Saving…');
    try {
      const saved = await InboxService.saveAgentSettings({ ...settings, alert_emails: list });
      setSettings(saved);
      setEmails((saved.alert_emails ?? []).join(', '));
      setStatus('Saved');
    } catch (e) {
      setStatus(apiError(e, "Couldn't save."));
    }
  };
  if (!settings) return <Muted>{status || 'Loading…'}</Muted>;
  return (
    <div>
      <Muted style={{ marginTop: 2 }}>
        When a customer is waiting for a person, the account owner is emailed and sent a WhatsApp. Add up to 5 more
        addresses, separated by commas.
      </Muted>
      <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
        <Field value={emails} onChange={setEmails} placeholder="support@yourbusiness.com, manager@yourbusiness.com" />
        <Btn onClick={save}>Save</Btn>
      </div>
      {status && <Muted style={{ marginTop: 6, color: status === 'Saved' ? '#15803D' : MSG_MUTED }}>{status}</Muted>}
    </div>
  );
}

function UsageSummary({ onOpen }: { onOpen: () => void }) {
  const [usage, setUsage] = useState<OneboxUsage | null>(null);
  const [error, setError] = useState('');
  const load = useCallback(() => {
    InboxService.oneboxUsage()
      .then((r) => setUsage(r.usage))
      .catch(() => setError("Couldn't load your AI usage."));
  }, []);
  useEffect(load, [load]);
  if (!usage) return <Muted style={{ marginTop: 10 }}>{error || 'Loading…'}</Muted>;
  const color = usage.exhausted ? '#C62828' : usage.warning ? '#E65100' : undefined;
  const ends = usage.period_end
    ? new Date(usage.period_end).toLocaleDateString(undefined, { day: 'numeric', month: 'short' })
    : '';
  return (
    <>
      <Muted style={{ marginTop: 2 }}>
        {usage.status === 'trial' ? 'Free trial' : 'This period'}
        {ends ? ` · ${usage.status === 'trial' ? 'ends' : 'renews'} ${ends}` : ''}
      </Muted>
      <div style={{ border: '1px solid #F3E4EA', borderRadius: 14, background: '#fff', padding: 14, marginTop: 10 }}>
        <div style={{ fontSize: 24, fontWeight: 800 }}>
          {usage.used.toLocaleString()}
          <span style={{ fontSize: 12.5, fontWeight: 500, color: MSG_MUTED }}>
            {' '}
            / {usage.allowance.toLocaleString()}
          </span>
        </div>
        <Muted>AI conversations used</Muted>
        <div style={{ marginTop: 9 }}>
          <Bar percent={usage.percent_used} color={color} />
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, marginTop: 6 }}>
          <b>{Math.round(usage.percent_used)}% used</b>
          <span style={{ color: MSG_MUTED }}>{usage.remaining.toLocaleString()} remaining</span>
        </div>
        <Btn kind="outline" onClick={onOpen} style={{ width: '100%', marginTop: 11, borderRadius: 999, height: 30 }}>
          Change or renew plan
        </Btn>
      </div>
    </>
  );
}

/** Messaging › Settings (the gear): channels, AI usage and plan, tags, escalation alerts.
 *  Channels is today's Connections page (same cards, same connect/swap logic), embedded. */
export default function SettingsPage({
  isMobile,
  section,
  onSection,
  connections,
  onConnected,
  onChannelsChanged,
}: {
  isMobile: boolean;
  section: SettingsSection;
  onSection: (s: SettingsSection) => void;
  connections: ChannelConnection[];
  onConnected: (channelId: string, accountLabel: string) => void;
  onChannelsChanged: () => void;
}) {
  const healthy = connections.filter(
    (c) => c.approved && c.connected && c.tokenHealth !== 'expiring' && !c.warning
  ).length;
  const approved = connections.filter((c) => c.approved).length;
  const nav: { id: SettingsSection; label: string; icon: ReactNode }[] = [
    { id: 'channels', label: 'Channels', icon: <Plug size={15} /> },
    { id: 'usage', label: 'AI usage & plan', icon: <Gauge size={15} /> },
    { id: 'tags', label: 'Tags', icon: <Tag size={15} /> },
    { id: 'alerts', label: 'Escalation alerts', icon: <BellRing size={15} /> },
  ];

  const channels = (
    <>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
        <Title sub="Connect the accounts whose messages and comments come into your inbox.">Channels</Title>
        <span
          style={{
            fontSize: 11.5,
            fontWeight: 600,
            color: healthy === approved ? '#2E7D32' : '#B26A00',
            background: healthy === approved ? '#E8F7EF' : '#FFF4E5',
            padding: '5px 11px',
            borderRadius: 999,
            whiteSpace: 'nowrap',
          }}
        >
          ● {healthy} of {approved} healthy
        </span>
      </div>
      <div style={{ marginTop: 14 }}>
        <InboxConnectionsPage
          isMobile={isMobile}
          connections={connections}
          onConnected={onConnected}
          onChannelsChanged={onChannelsChanged}
          embedded
          columns={2}
        />
      </div>
    </>
  );

  const main =
    section === 'channels' ? (
      channels
    ) : section === 'usage' ? (
      <>
        <Title sub="Your AI conversations this period, and your plan.">AI usage &amp; plan</Title>
        <div style={{ marginTop: 14 }}>
          <OneboxUsagePanel isMobile={isMobile} embedded />
        </div>
      </>
    ) : section === 'tags' ? (
      <>
        <Title sub="Quick-add options shown in the conversation tag picker.">Tags</Title>
        <TagsEditor />
      </>
    ) : (
      <>
        <Title>Escalation alerts</Title>
        <AlertsEditor />
      </>
    );

  if (isMobile) {
    return (
      <div style={{ padding: 14 }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 12 }}>
          {nav.map((n) => (
            <Btn
              key={n.id}
              kind={section === n.id ? 'primary' : 'outline'}
              onClick={() => onSection(n.id)}
              style={{ borderRadius: 999 }}
            >
              {n.icon}
              {n.label}
            </Btn>
          ))}
        </div>
        <Pane style={{ display: 'block', padding: 14 }}>{main}</Pane>
      </div>
    );
  }

  return (
    <div style={{ padding: '0 28px 28px' }}>
      <Pane>
        <Col style={{ width: 188, flexShrink: 0, paddingTop: 16 }}>
          <div style={{ padding: '0 20px 8px' }}>
            <Label>Settings</Label>
          </div>
          {nav.map((n) => (
            <NavRow
              key={n.id}
              label={n.label}
              icon={n.icon}
              active={section === n.id}
              onClick={() => onSection(n.id)}
            />
          ))}
        </Col>
        <Col style={{ flex: 1, padding: '18px 20px', minWidth: 0 }}>{main}</Col>
        {section === 'channels' && (
          <Col style={{ width: 300, flexShrink: 0, padding: '18px 18px', background: '#FFFCFD', borderRight: 'none' }}>
            <Title>AI usage</Title>
            <UsageSummary onOpen={() => onSection('usage')} />
            <div style={{ marginTop: 18 }}>
              <Title>Tags</Title>
              <TagsEditor compact />
            </div>
            <div style={{ marginTop: 18 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <Mail size={14} color={MSG_PINK} />
                <Title>Escalation alerts</Title>
              </div>
              <AlertsEditor />
            </div>
          </Col>
        )}
      </Pane>
    </div>
  );
}
