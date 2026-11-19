'use client';

import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { BookOpenCheck, Bot, Clock, Megaphone, MessageCircle, Pencil, Siren, Trash2 } from 'lucide-react';
import {
  InboxService,
  type InboxAgentSettings,
  type InboxConversationDTO,
  type InboxKnowledgeEntry,
} from '@/src/api/InboxService';
import { MSG_MUTED } from './MessagingHeader';
import { Box, Btn, Col, Field, Label, Muted, Pane, Pill, Title, Toggle, apiError } from './ui';

type AutomationId = 'dm' | 'comments' | 'away' | 'faq' | 'alerts' | 'ad_welcome';

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const DAY_NAMES: Record<string, string> = {
  Mon: 'Monday',
  Tue: 'Tuesday',
  Wed: 'Wednesday',
  Thu: 'Thursday',
  Fri: 'Friday',
  Sat: 'Saturday',
  Sun: 'Sunday',
};
// Always sent to a person, whatever the settings (the agent's own exclusions).
const NEVER_AUTOMATED = ['Payment disputes', 'Refunds', 'Safety concerns', 'Legal threats', 'Ambiguous stock or price'];

/** Turning a channel on turns auto-replies on; turning the last one off turns them off. */
function withChannel(s: InboxAgentSettings, channel: 'dm' | 'comment', on: boolean): InboxAgentSettings {
  const channels = { ...s.auto_reply_channels, [channel]: on };
  return {
    ...s,
    auto_reply_channels: channels,
    auto_reply_enabled: on ? true : s.auto_reply_enabled && (channels.dm || channels.comment),
  };
}

function fmtTime(t: string): string {
  const [h, m] = t.split(':').map(Number);
  const ap = h >= 12 ? 'pm' : 'am';
  return `${((h + 11) % 12) + 1}${m ? `:${String(m).padStart(2, '0')}` : ''}${ap}`;
}

function hoursText(open: string, close: string): string {
  return open === '00:00' && (close === '23:59' || close === '00:00')
    ? 'all day'
    : `${fmtTime(open)}–${fmtTime(close)}`;
}

const TONE = {
  pink: { bg: '#FDEEF4', fg: '#D0145C' },
  amber: { bg: '#FFF4E5', fg: '#B26A00' },
  blue: { bg: '#EAF2FF', fg: '#2563EB' },
  green: { bg: '#E7F7EE', fg: '#15803D' },
  red: { bg: '#FDECEA', fg: '#C62828' },
  grey: { bg: '#F3F2EF', fg: '#777' },
};

export default function AutomationsPage({ isMobile }: { isMobile: boolean }) {
  const [settings, setSettings] = useState<InboxAgentSettings | null>(null);
  const [faqs, setFaqs] = useState<InboxKnowledgeEntry[]>([]);
  const [convs, setConvs] = useState<InboxConversationDTO[]>([]);
  const [selected, setSelected] = useState<AutomationId>('away');
  const [draft, setDraft] = useState<InboxAgentSettings | null>(null);
  const [status, setStatus] = useState('');
  const [error, setError] = useState('');
  const [faqQ, setFaqQ] = useState('');
  const [faqA, setFaqA] = useState('');
  const [faqEditing, setFaqEditing] = useState<string | null>(null);
  const [emails, setEmails] = useState('');

  useEffect(() => {
    Promise.all([InboxService.getAgentSettings(), InboxService.listKnowledge()])
      .then(([s, k]) => {
        setSettings(s);
        setDraft(s);
        setFaqs(k);
        setEmails((s.alert_emails ?? []).join(', '));
      })
      .catch(() => setError("Couldn't load your automations."));
    InboxService.listConversations({ limit: 200 })
      .then(setConvs)
      .catch(() => undefined);
  }, []);

  const save = async (next: InboxAgentSettings, okMessage = 'Saved') => {
    setStatus('Saving…');
    try {
      const saved = await InboxService.saveAgentSettings(next);
      setSettings(saved);
      setDraft(saved);
      setStatus(okMessage);
    } catch (e) {
      setStatus('');
      setError(apiError(e, "Couldn't save."));
    }
  };

  const handedToYou = useMemo(() => convs.filter((c) => c.needs_human && c.status !== 'resolved').length, [convs]);

  if (!settings || !draft)
    return (
      <div style={{ padding: 28 }}>
        <Muted>{error || 'Loading…'}</Muted>
      </div>
    );

  const away = settings.away_message ?? { enabled: false, text: '' };
  const welcome = settings.ad_lead_welcome ?? { enabled: false, text: '' };
  const hours = settings.business_hours;
  const openDays = DAYS.filter((d) => hours.days[d]);
  const hoursLine =
    openDays.length === 0
      ? 'Always closed'
      : `${openDays.length === 7 ? 'Every day' : `${openDays[0]}–${openDays[openDays.length - 1]}`}, ${hoursText(hours.open, hours.close)}`;

  const cards: {
    id: AutomationId;
    icon: ReactNode;
    tone: keyof typeof TONE;
    title: string;
    desc: string;
    state: string;
    on: boolean;
    meta: string;
    toggle?: (v: boolean) => void;
  }[] = [
    {
      id: 'dm',
      icon: <Bot size={17} />,
      tone: 'pink',
      title: 'Auto-reply to DMs',
      desc: 'Jane answers direct messages by herself, in your brand voice, when she is sure.',
      on: settings.auto_reply_enabled && settings.auto_reply_channels.dm,
      state: settings.auto_reply_enabled && settings.auto_reply_channels.dm ? 'Auto-send' : 'Off',
      meta: `Sure at ${settings.confidence_threshold}%+`,
      toggle: (v) => save(withChannel(settings, 'dm', v)),
    },
    {
      id: 'comments',
      icon: <MessageCircle size={17} />,
      tone: 'amber',
      title: 'Reply to comments',
      desc: 'Jane drafts replies to public comments for you to approve, or sends them herself.',
      on: settings.auto_reply_enabled && settings.auto_reply_channels.comment,
      state: settings.auto_reply_enabled && settings.auto_reply_channels.comment ? 'Auto-send' : 'Draft only',
      meta: 'Public replies',
      toggle: (v) => save(withChannel(settings, 'comment', v)),
    },
    {
      id: 'away',
      icon: <Clock size={17} />,
      tone: 'blue',
      title: 'Away message',
      desc: 'Sent outside business hours, so no one waits in silence.',
      on: away.enabled,
      state: away.enabled ? 'Out of hours' : 'Off',
      meta: hoursLine,
      toggle: (v) => save({ ...settings, away_message: { ...away, enabled: v } }),
    },
    {
      id: 'faq',
      icon: <BookOpenCheck size={17} />,
      tone: 'green',
      title: 'FAQ answers',
      desc: 'Your own answers, the only facts Jane may send without review.',
      on: faqs.some((f) => f.approved),
      state: `${faqs.length} answer${faqs.length === 1 ? '' : 's'}`,
      meta: `${faqs.filter((f) => f.approved).length} approved`,
    },
    {
      id: 'alerts',
      icon: <Siren size={17} />,
      tone: 'red',
      title: 'Escalation alerts',
      desc: 'When a customer is waiting for a person, you are emailed and sent a WhatsApp.',
      on: true,
      state: 'Alerts on',
      meta: `${(settings.alert_emails ?? []).length + 1} recipient${settings.alert_emails?.length ? 's' : ''}`,
    },
    {
      id: 'ad_welcome',
      icon: <Megaphone size={17} />,
      tone: welcome.enabled ? 'pink' : 'grey',
      title: 'Ad lead welcome',
      desc: 'First reply to people who message you from your ads.',
      on: welcome.enabled,
      state: welcome.enabled ? 'On' : 'Off',
      meta: welcome.enabled ? 'Sent once per lead' : 'Not set up',
      toggle: (v) => save({ ...settings, ad_lead_welcome: { ...welcome, enabled: v } }),
    },
  ];

  const sel = cards.find((c) => c.id === selected)!;
  const setDraftHours = (h: Partial<InboxAgentSettings['business_hours']>) =>
    setDraft({ ...draft, business_hours: { ...draft.business_hours, ...h } });

  const saveFaq = async () => {
    if (!faqQ.trim() || !faqA.trim()) return;
    try {
      if (faqEditing) {
        const entry = faqs.find((f) => f.id === faqEditing)!;
        await InboxService.updateKnowledge({ ...entry, question: faqQ.trim(), answer: faqA.trim() });
        setFaqs(faqs.map((f) => (f.id === faqEditing ? { ...f, question: faqQ.trim(), answer: faqA.trim() } : f)));
      } else {
        const id = await InboxService.createKnowledge({ question: faqQ.trim(), answer: faqA.trim(), approved: true });
        setFaqs([...faqs, { id, question: faqQ.trim(), answer: faqA.trim(), approved: true }]);
      }
      setFaqQ('');
      setFaqA('');
      setFaqEditing(null);
      setStatus('Saved');
    } catch (e) {
      setError(apiError(e, "Couldn't save the answer."));
    }
  };

  const detailHead = (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
      <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
        <div
          style={{
            width: 34,
            height: 34,
            borderRadius: 9,
            background: TONE[sel.tone].bg,
            color: TONE[sel.tone].fg,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {sel.icon}
        </div>
        <Title sub={sel.meta}>{sel.title}</Title>
      </div>
      {sel.toggle && <Toggle on={sel.on} onChange={sel.toggle} label={sel.title} />}
    </div>
  );

  const detail = (
    <>
      {detailHead}
      {selected === 'dm' && (
        <>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 16 }}>
            <div>
              <Label>Auto-replies</Label>
              <Muted>Off — nothing sends itself; Jane only drafts.</Muted>
            </div>
            <Toggle on={draft.auto_reply_enabled} onChange={(v) => setDraft({ ...draft, auto_reply_enabled: v })} />
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 16 }}>
            <Label>How sure Jane must be</Label>
            <span style={{ color: '#D0145C', fontWeight: 700, fontSize: 13 }}>{draft.confidence_threshold}%</span>
          </div>
          <input
            type="range"
            min={50}
            max={99}
            value={draft.confidence_threshold}
            onChange={(e) => setDraft({ ...draft, confidence_threshold: Number(e.target.value) })}
            style={{ width: '100%', accentColor: '#E0156B', marginTop: 6 }}
          />
          <Muted>Below this, a reply is drafted for you to check instead of sent.</Muted>
          <Label style={{ marginTop: 16 }}>Always sent to you, never automated</Label>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 6 }}>
            {NEVER_AUTOMATED.map((t) => (
              <Pill key={t} fg="#5C5460" bg="#F3F2EF">
                {t}
              </Pill>
            ))}
          </div>
          <Btn style={{ marginTop: 16 }} onClick={() => save(draft)}>
            Save changes
          </Btn>
        </>
      )}
      {selected === 'comments' && (
        <>
          <Muted style={{ marginTop: 14 }}>
            Comments are public: everyone on the post sees the reply. With this off, Jane drafts a reply on each comment
            and it waits in your inbox for you to send.
          </Muted>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 14 }}>
            <Label>Let Jane send comment replies herself</Label>
            <Toggle
              on={draft.auto_reply_channels.comment}
              onChange={(v) => setDraft(withChannel(draft, 'comment', v))}
            />
          </div>
          <Btn style={{ marginTop: 16 }} onClick={() => save(draft)}>
            Save changes
          </Btn>
        </>
      )}
      {selected === 'away' && (
        <>
          <Label style={{ marginTop: 16 }}>Business hours · {draft.business_hours.timezone.replace('_', ' ')}</Label>
          <div style={{ marginTop: 6 }}>
            {DAYS.map((d) => {
              const on = draft.business_hours.days[d];
              const own = draft.business_hours.day_hours?.[d];
              const open = own?.open ?? draft.business_hours.open;
              const close = own?.close ?? draft.business_hours.close;
              const setDay = (o: string, c: string) => {
                const dh = { ...(draft.business_hours.day_hours ?? {}) };
                if (o === draft.business_hours.open && c === draft.business_hours.close) delete dh[d];
                else dh[d] = { open: o, close: c };
                setDraftHours({ day_hours: dh });
              };
              return (
                <div
                  key={d}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '4px 0',
                    fontSize: 12.5,
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <Toggle
                      on={on}
                      onChange={(v) => setDraftHours({ days: { ...draft.business_hours.days, [d]: v } })}
                      label={DAY_NAMES[d]}
                    />
                    <span style={{ width: 78 }}>{DAY_NAMES[d]}</span>
                  </div>
                  {on ? (
                    <span style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
                      <input
                        type="time"
                        value={open}
                        onChange={(e) => setDay(e.target.value, close)}
                        style={{
                          border: '1px solid #ECE6EA',
                          borderRadius: 7,
                          fontSize: 12,
                          padding: '3px 4px',
                          width: 78,
                          fontFamily: 'inherit',
                        }}
                      />
                      –
                      <input
                        type="time"
                        value={close}
                        onChange={(e) => setDay(open, e.target.value)}
                        style={{
                          border: '1px solid #ECE6EA',
                          borderRadius: 7,
                          fontSize: 12,
                          padding: '3px 4px',
                          width: 78,
                          fontFamily: 'inherit',
                        }}
                      />
                    </span>
                  ) : (
                    <span style={{ color: MSG_MUTED }}>Closed</span>
                  )}
                </div>
              );
            })}
          </div>
          <Label style={{ marginTop: 12 }}>Message sent out of hours</Label>
          <Field
            multiline
            value={draft.away_message?.text ?? ''}
            onChange={(v) =>
              setDraft({ ...draft, away_message: { enabled: draft.away_message?.enabled ?? false, text: v } })
            }
            style={{ marginTop: 6 }}
          />
          <Muted style={{ marginTop: 4 }}>
            <Pill fg="#D0145C" bg="#FDEBF2">
              {'{first_name}'}
            </Pill>{' '}
            is replaced with the customer&apos;s first name. Sent once per closed stretch, on DMs only.
          </Muted>
          <Btn style={{ marginTop: 14 }} onClick={() => save(draft)}>
            Save changes
          </Btn>
        </>
      )}
      {selected === 'ad_welcome' && (
        <>
          <Label style={{ marginTop: 16 }}>Welcome message</Label>
          <Field
            multiline
            value={draft.ad_lead_welcome?.text ?? ''}
            onChange={(v) =>
              setDraft({ ...draft, ad_lead_welcome: { enabled: draft.ad_lead_welcome?.enabled ?? false, text: v } })
            }
            style={{ marginTop: 6 }}
          />
          <Muted style={{ marginTop: 4 }}>
            Sent once, on the first message from someone who came from one of your ads. Jane still answers their
            question after it.
          </Muted>
          <Btn style={{ marginTop: 14 }} onClick={() => save(draft)}>
            Save changes
          </Btn>
        </>
      )}
      {selected === 'faq' && (
        <>
          <Muted style={{ marginTop: 12 }}>Only approved answers can be sent automatically.</Muted>
          <div style={{ marginTop: 8 }}>
            {faqs.map((f) => (
              <div
                key={f.id}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  gap: 10,
                  padding: '9px 0',
                  borderBottom: '1px dashed #EFE6EA',
                }}
              >
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontWeight: 700, fontSize: 12.5 }}>{f.question}</div>
                  <Muted>{f.answer}</Muted>
                </div>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexShrink: 0 }}>
                  <Toggle
                    on={f.approved}
                    label="Approved"
                    onChange={async (v) => {
                      await InboxService.updateKnowledge({ ...f, approved: v });
                      setFaqs(faqs.map((x) => (x.id === f.id ? { ...x, approved: v } : x)));
                    }}
                  />
                  <button
                    type="button"
                    aria-label="Edit"
                    onClick={() => {
                      setFaqEditing(f.id);
                      setFaqQ(f.question);
                      setFaqA(f.answer);
                    }}
                    style={{ border: 'none', background: 'none', cursor: 'pointer', color: MSG_MUTED }}
                  >
                    <Pencil size={14} />
                  </button>
                  <button
                    type="button"
                    aria-label="Delete"
                    onClick={async () => {
                      await InboxService.deleteKnowledge(f.id);
                      setFaqs(faqs.filter((x) => x.id !== f.id));
                    }}
                    style={{ border: 'none', background: 'none', cursor: 'pointer', color: MSG_MUTED }}
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            ))}
            {faqs.length === 0 && (
              <Muted>No answers yet. Add the questions customers ask most — hours, delivery, how to order.</Muted>
            )}
          </div>
          <Field
            value={faqQ}
            onChange={setFaqQ}
            placeholder="Question, e.g. Do you deliver outside Lagos?"
            style={{ marginTop: 12 }}
          />
          <Field
            multiline
            value={faqA}
            onChange={setFaqA}
            placeholder="Your answer, exactly as a customer should hear it"
            style={{ marginTop: 8 }}
          />
          <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
            <Btn onClick={saveFaq} disabled={!faqQ.trim() || !faqA.trim()}>
              {faqEditing ? 'Save answer' : 'Add answer'}
            </Btn>
            {faqEditing && (
              <Btn
                kind="outline"
                onClick={() => {
                  setFaqEditing(null);
                  setFaqQ('');
                  setFaqA('');
                }}
              >
                Cancel
              </Btn>
            )}
          </div>
        </>
      )}
      {selected === 'alerts' && (
        <>
          <Muted style={{ marginTop: 12 }}>
            The account owner is always alerted. Add up to 5 more addresses, separated by commas.
          </Muted>
          <Field
            value={emails}
            onChange={setEmails}
            placeholder="support@yourbusiness.com, manager@yourbusiness.com"
            style={{ marginTop: 8 }}
          />
          <Btn
            style={{ marginTop: 10 }}
            onClick={() => {
              const list = emails
                .split(',')
                .map((e) => e.trim())
                .filter(Boolean);
              if (list.length > 5) {
                setError('Add up to 5 addresses.');
                return;
              }
              save({ ...settings, alert_emails: list });
            }}
          >
            Save
          </Btn>
          <Label style={{ marginTop: 16 }}>Always sent to a person</Label>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 6 }}>
            {NEVER_AUTOMATED.map((t) => (
              <Pill key={t} fg="#5C5460" bg="#F3F2EF">
                {t}
              </Pill>
            ))}
          </div>
        </>
      )}
      {status && <Muted style={{ marginTop: 10, color: status === 'Saved' ? '#15803D' : MSG_MUTED }}>{status}</Muted>}
      {error && <Muted style={{ marginTop: 6, color: '#C62828' }}>{error}</Muted>}
    </>
  );

  const stats = [
    {
      label: 'Auto-replies',
      value: settings.auto_reply_enabled ? 'On' : 'Off',
      sub: settings.auto_reply_enabled ? `when ${settings.confidence_threshold}%+ sure` : 'Jane drafts only',
    },
    { label: 'Handed to you', value: String(handedToYou), sub: 'waiting for a person' },
    { label: 'FAQ answers', value: String(faqs.filter((f) => f.approved).length), sub: 'approved for Jane' },
    { label: 'Never automated', value: `${NEVER_AUTOMATED.length} topics`, sub: 'always sent to you' },
  ];

  const grid = (
    <>
      <Title sub="What Jane does on her own, and when she hands over to you.">Automations</Title>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: isMobile ? '1fr 1fr' : 'repeat(4, 1fr)',
          gap: 10,
          marginTop: 14,
        }}
      >
        {stats.map((s) => (
          <Box key={s.label} style={{ padding: '12px 14px' }}>
            <div style={{ fontSize: 11, color: MSG_MUTED }}>{s.label}</div>
            <div style={{ fontSize: 21, fontWeight: 700, marginTop: 3 }}>{s.value}</div>
            <div style={{ fontSize: 11, color: MSG_MUTED, marginTop: 2 }}>{s.sub}</div>
          </Box>
        ))}
      </div>
      <div
        style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(3, 1fr)', gap: 12, marginTop: 14 }}
      >
        {cards.map((c) => (
          <div
            key={c.id}
            role="button"
            tabIndex={0}
            onClick={() => setSelected(c.id)}
            onKeyDown={(e) => e.key === 'Enter' && setSelected(c.id)}
            style={{ cursor: 'pointer', display: 'flex' }}
          >
            <Box
              selected={selected === c.id}
              style={{ padding: '13px 14px', flex: 1, display: 'flex', flexDirection: 'column' }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <div
                  style={{
                    width: 34,
                    height: 34,
                    borderRadius: 9,
                    background: TONE[c.tone].bg,
                    color: TONE[c.tone].fg,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  {c.icon}
                </div>
                {c.toggle && (
                  <span onClick={(e) => e.stopPropagation()}>
                    <Toggle on={c.on} onChange={c.toggle} label={c.title} />
                  </span>
                )}
              </div>
              <div style={{ fontWeight: 700, fontSize: 13.5, marginTop: 10 }}>{c.title}</div>
              <div style={{ color: MSG_MUTED, fontSize: 11.8, lineHeight: 1.45, marginTop: 3 }}>{c.desc}</div>
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginTop: 'auto',
                  paddingTop: 9,
                  gap: 6,
                }}
              >
                <Pill fg={TONE[c.tone].fg} bg={TONE[c.tone].bg}>
                  {c.state}
                </Pill>
                <span
                  style={{
                    fontSize: 11,
                    color: MSG_MUTED,
                    textAlign: 'right',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    minWidth: 0,
                  }}
                >
                  {c.meta}
                </span>
              </div>
            </Box>
          </div>
        ))}
      </div>
    </>
  );

  if (isMobile) {
    return (
      <div style={{ padding: 14, display: 'flex', flexDirection: 'column', gap: 12 }}>
        <Pane style={{ display: 'block', padding: 14 }}>{grid}</Pane>
        <Pane style={{ display: 'block', padding: 14 }}>{detail}</Pane>
      </div>
    );
  }
  return (
    <div style={{ padding: '0 28px 28px' }}>
      <Pane style={{ minHeight: 560 }}>
        <Col style={{ flex: 1, minWidth: 0, padding: '18px 20px' }}>{grid}</Col>
        <Col style={{ width: 340, flexShrink: 0, padding: '18px 18px', background: '#FFFCFD', borderRight: 'none' }}>
          {detail}
        </Col>
      </Pane>
    </div>
  );
}
