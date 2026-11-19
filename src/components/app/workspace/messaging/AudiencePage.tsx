'use client';

import { useEffect, useMemo, useState } from 'react';
import { Download, MessageCircle, Search } from 'lucide-react';
import {
  InboxService,
  type AudiencePerson,
  type AudienceResult,
  type AudienceSegment,
  type DeskNote,
} from '@/src/api/InboxService';
import { MSG_MUTED } from './MessagingHeader';
import { PlatformBadge, PLATFORM_LABEL, initialsOf, avatarColor } from './platform';
import { tagLook } from './SettingsPage';
import { Box, Btn, Col, Field, Label, Muted, NavRow, Pane, Pill, apiError } from './ui';

const SEGMENTS: { id: AudienceSegment; label: string }[] = [
  { id: 'all', label: 'All contacts' },
  { id: 'new', label: 'New this week' },
  { id: 'leads', label: 'Leads' },
  { id: 'customers', label: 'Customers' },
  { id: 'ads', label: 'Ad leads' },
  { id: 'follow_up', label: 'Needs follow-up' },
];

const STAGE_LOOK: Record<AudiencePerson['stage'], { label: string; bg: string; fg: string }> = {
  contact: { label: 'New', bg: '#EAF2FF', fg: '#2563EB' },
  lead: { label: 'Lead', bg: '#FFF4E5', fg: '#B26A00' },
  customer: { label: 'Customer', bg: '#E7F7EE', fg: '#15803D' },
};

export function ago(iso: string | null): string {
  if (!iso) return '';
  const s = (Date.now() - new Date(iso).getTime()) / 1000;
  if (s < 60) return 'now';
  if (s < 3600) return `${Math.floor(s / 60)}m`;
  if (s < 86400) return `${Math.floor(s / 3600)}h`;
  if (s < 86400 * 30) return `${Math.floor(s / 86400)}d`;
  return new Date(iso).toLocaleDateString(undefined, { day: 'numeric', month: 'short' });
}

function sourceLabel(p: AudiencePerson): string {
  if (p.from_ad) return 'From an ad';
  const [platform, kind] = p.source.split('_');
  return `${PLATFORM_LABEL[platform] ?? platform} ${kind === 'comment' ? 'comment' : 'DM'}`;
}

function exportCsv(people: AudiencePerson[]) {
  const rows = [
    ['Name', 'Channel', 'Stage', 'Tags', 'Came from', 'Conversations', 'Last activity'],
    ...people.map((p) => [
      p.name || 'Unknown contact',
      PLATFORM_LABEL[p.platform] ?? p.platform,
      STAGE_LOOK[p.stage].label,
      p.tags.join('; '),
      sourceLabel(p),
      String(p.conversations),
      p.last_activity_at ?? '',
    ]),
  ];
  const csv = rows.map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n');
  const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }));
  const a = document.createElement('a');
  a.href = url;
  a.download = 'audience.csv';
  a.click();
  URL.revokeObjectURL(url);
}

export default function AudiencePage({
  isMobile,
  onOpenConversation,
}: {
  isMobile: boolean;
  onOpenConversation: (conversationId: string) => void;
}) {
  const [segment, setSegment] = useState<AudienceSegment>('all');
  const [channel, setChannel] = useState('');
  const [query, setQuery] = useState('');
  const [tag, setTag] = useState('');
  const [data, setData] = useState<AudienceResult | null>(null);
  const [error, setError] = useState('');
  const [selected, setSelected] = useState<AudiencePerson | null>(null);
  const [notes, setNotes] = useState<DeskNote[] | null>(null);
  const [noteDraft, setNoteDraft] = useState('');

  useEffect(() => {
    let alive = true;
    const t = setTimeout(() => {
      InboxService.listAudience({ segment, channel: channel || undefined, q: query || undefined })
        .then((r) => {
          if (!alive) return;
          setData(r);
          setError('');
          setSelected((cur) => r.people.find((p) => p.contact_id === cur?.contact_id) ?? r.people[0] ?? null);
        })
        .catch(() => alive && setError("Couldn't load your audience."));
    }, 250);
    return () => {
      alive = false;
      clearTimeout(t);
    };
  }, [segment, channel, query]);

  // Notes live on a conversation; the person's latest conversation holds them.
  const latestConversation = selected?.conversation_ids[0];
  useEffect(() => {
    setNotes(null);
    if (!latestConversation) return;
    InboxService.getDesk(latestConversation)
      .then((d) => setNotes(d.notes))
      .catch(() => setNotes([]));
  }, [latestConversation]);

  const people = useMemo(
    () => (data?.people ?? []).filter((p) => !tag || p.tags.includes(tag)),
    [data, tag]
  );
  const allTags = useMemo(() => Array.from(new Set((data?.people ?? []).flatMap((p) => p.tags))).sort(), [data]);

  const addNote = async () => {
    if (!latestConversation || !noteDraft.trim()) return;
    try {
      const n = await InboxService.addNote(latestConversation, noteDraft.trim());
      setNotes((cur) => [n, ...(cur ?? [])]);
      setNoteDraft('');
    } catch (e) {
      setError(apiError(e, "Couldn't save the note."));
    }
  };

  const profile = selected && (
    <>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <PlatformBadge platform={selected.platform} size={48} initials={initialsOf(selected.name)} color={avatarColor(selected.contact_id)} />
        <div style={{ minWidth: 0 }}>
          <div style={{ fontWeight: 700, fontSize: 16 }}>{selected.name || 'Unknown contact'}</div>
          <div style={{ fontSize: 11, color: MSG_MUTED }}>
            {PLATFORM_LABEL[selected.platform] ?? selected.platform} · {selected.conversations} conversation
            {selected.conversations === 1 ? '' : 's'}
          </div>
        </div>
      </div>
      <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
        <Btn onClick={() => latestConversation && onOpenConversation(latestConversation)} style={{ height: 30 }}>
          <MessageCircle size={14} /> Open chat
        </Btn>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginTop: 14 }}>
        <Box style={{ padding: '9px 11px' }}>
          <div style={{ fontSize: 11, color: MSG_MUTED }}>Stage</div>
          <div style={{ fontWeight: 600, fontSize: 12.5, marginTop: 2, color: STAGE_LOOK[selected.stage].fg }}>
            {STAGE_LOOK[selected.stage].label}
            {selected.lead_value ? ` · ₦${selected.lead_value.toLocaleString()}` : ''}
          </div>
        </Box>
        <Box style={{ padding: '9px 11px' }}>
          <div style={{ fontSize: 11, color: MSG_MUTED }}>Came from</div>
          <div style={{ fontWeight: 600, fontSize: 12.5, marginTop: 2 }}>{sourceLabel(selected)}</div>
        </Box>
      </div>
      <Label style={{ marginTop: 14 }}>Tags</Label>
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 6 }}>
        {selected.tags.length ? (
          selected.tags.map((t) => {
            const l = tagLook(t);
            return (
              <Pill key={t} fg={l.fg} bg={l.bg}>
                {t}
              </Pill>
            );
          })
        ) : (
          <Muted>No tags yet — add them from the conversation.</Muted>
        )}
      </div>
      <Label style={{ marginTop: 14 }}>Activity</Label>
      <div style={{ marginTop: 4 }}>
        {selected.conversation_ids.slice(0, 5).map((id, i) => (
          <button
            key={id}
            type="button"
            onClick={() => onOpenConversation(id)}
            style={{ all: 'unset', cursor: 'pointer', display: 'flex', gap: 10, marginTop: 8, alignItems: 'center', fontSize: 12.5 }}
          >
            <span style={{ width: 8, height: 8, borderRadius: '50%', background: i === 0 ? '#E0156B' : '#C9C2C7' }} />
            {i === 0 ? 'Latest conversation' : `Earlier conversation ${i}`}
            {i === 0 && selected.last_activity_at ? <span style={{ color: MSG_MUTED }}> · {ago(selected.last_activity_at)} ago</span> : null}
          </button>
        ))}
      </div>
      <Label style={{ marginTop: 14 }}>Notes</Label>
      <div style={{ display: 'flex', gap: 6, marginTop: 6 }}>
        <Field value={noteDraft} onChange={setNoteDraft} placeholder="Add a note…" onEnter={addNote} />
        <Btn onClick={addNote} disabled={!noteDraft.trim()}>
          Add
        </Btn>
      </div>
      {(notes ?? []).map((n) => (
        <div key={n.id} style={{ marginTop: 8, fontSize: 12, background: '#FAF8F9', border: '1px solid #EFE8EC', borderRadius: 8, padding: '7px 10px' }}>
          {n.text}
          <div style={{ fontSize: 10.5, color: MSG_MUTED, marginTop: 3 }}>
            {n.author_name || 'Team'} · {ago(n.at)}
          </div>
        </div>
      ))}
    </>
  );

  const table = (
    <>
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8, flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', gap: 6 }}>
          <div style={{ position: 'relative', width: 200 }}>
            <Search size={15} color={MSG_MUTED} style={{ position: 'absolute', left: 11, top: 10 }} />
            <Field value={query} onChange={setQuery} placeholder="Search contacts…" style={{ paddingLeft: 32 }} />
          </div>
          <select
            value={tag}
            onChange={(e) => setTag(e.target.value)}
            aria-label="Filter by tag"
            style={{ height: 34, border: '1px solid #ECE6EA', borderRadius: 9, padding: '0 8px', fontSize: 12.5, fontFamily: 'inherit', background: '#fff' }}
          >
            <option value="">All tags</option>
            {allTags.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </div>
        <Btn kind="outline" onClick={() => exportCsv(people)} disabled={!people.length}>
          <Download size={14} /> Export
        </Btn>
      </div>
      <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: 12 }}>
        <thead>
          <tr>
            {['Contact', 'Stage', 'Tags', 'Came from', 'Last', 'Chats'].map((h) => (
              <th key={h} style={{ fontSize: 11, fontWeight: 600, color: '#8A8290', textAlign: 'left', padding: '9px 10px', borderBottom: '1px solid #F1EBEE', textTransform: 'uppercase', letterSpacing: 0.3 }}>
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {people.map((p) => {
            const st = STAGE_LOOK[p.stage];
            const sel = selected?.contact_id === p.contact_id;
            return (
              <tr key={p.contact_id} onClick={() => setSelected(p)} style={{ cursor: 'pointer', background: sel ? '#FDF3F7' : undefined }}>
                <td style={{ padding: '8px 10px', borderBottom: '1px solid #F6F1F3' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <PlatformBadge platform={p.platform} size={32} initials={initialsOf(p.name)} color={avatarColor(p.contact_id)} />
                    <span style={{ fontWeight: 600, fontSize: 12.5 }}>{p.name || 'Unknown contact'}</span>
                  </div>
                </td>
                <td style={{ padding: '8px 10px', borderBottom: '1px solid #F6F1F3' }}>
                  <Pill fg={st.fg} bg={st.bg}>{st.label}</Pill>
                </td>
                <td style={{ padding: '8px 10px', borderBottom: '1px solid #F6F1F3' }}>
                  {p.tags.slice(0, 2).map((t) => {
                    const l = tagLook(t);
                    return <Pill key={t} fg={l.fg} bg={l.bg} style={{ marginRight: 4 }}>{t}</Pill>;
                  })}
                </td>
                <td style={{ padding: '8px 10px', borderBottom: '1px solid #F6F1F3', fontSize: 12.5, color: MSG_MUTED }}>{sourceLabel(p)}</td>
                <td style={{ padding: '8px 10px', borderBottom: '1px solid #F6F1F3', fontSize: 12.5, color: MSG_MUTED }}>{ago(p.last_activity_at)}</td>
                <td style={{ padding: '8px 10px', borderBottom: '1px solid #F6F1F3', fontSize: 12.5 }}>{p.conversations}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
      {data && people.length === 0 && (
        <Muted style={{ textAlign: 'center', marginTop: 24 }}>
          {data.counts.all ? 'No one matches these filters.' : 'People appear here as customers message your connected accounts.'}
        </Muted>
      )}
      {error && <Muted style={{ color: '#C62828', marginTop: 10 }}>{error}</Muted>}
    </>
  );

  if (!data) return <div style={{ padding: 28 }}><Muted>{error || 'Loading…'}</Muted></div>;

  if (isMobile) {
    return (
      <div style={{ padding: 14, display: 'flex', flexDirection: 'column', gap: 12 }}>
        <div style={{ display: 'flex', gap: 6, overflowX: 'auto' }}>
          {SEGMENTS.map((s) => (
            <Btn key={s.id} kind={segment === s.id ? 'primary' : 'outline'} onClick={() => setSegment(s.id)} style={{ borderRadius: 999 }}>
              {s.label} {data.counts[s.id]}
            </Btn>
          ))}
        </div>
        <Pane style={{ display: 'block', padding: 12, overflowX: 'auto' }}>{table}</Pane>
        {selected && <Pane style={{ display: 'block', padding: 14 }}>{profile}</Pane>}
      </div>
    );
  }

  return (
    <div style={{ padding: '0 28px 28px' }}>
      <Pane style={{ minHeight: 560 }}>
        <Col style={{ width: 188, flexShrink: 0, paddingTop: 16 }}>
          <div style={{ padding: '0 20px 8px' }}>
            <Label>Segments</Label>
          </div>
          {SEGMENTS.map((s) => (
            <NavRow key={s.id} label={s.label} count={data.counts[s.id]} active={segment === s.id} onClick={() => setSegment(s.id)} />
          ))}
          <div style={{ height: 1, background: '#EFE9EC', margin: '12px 20px' }} />
          <div style={{ padding: '0 20px 8px' }}>
            <Label>Channels</Label>
          </div>
          {Object.entries(data.channels).map(([p, n]) => (
            <NavRow
              key={p}
              label={PLATFORM_LABEL[p] ?? p}
              icon={<PlatformBadge platform={p} size={15} plain />}
              count={n}
              active={channel === p}
              onClick={() => setChannel(channel === p ? '' : p)}
            />
          ))}
        </Col>
        <Col style={{ width: 640, flexShrink: 0, padding: 16 }}>{table}</Col>
        <Col style={{ flex: 1, padding: '16px 18px', background: '#FFFCFD', borderRight: 'none' }}>
          {profile ?? <Muted>Select a person to see their details.</Muted>}
        </Col>
      </Pane>
    </div>
  );
}
