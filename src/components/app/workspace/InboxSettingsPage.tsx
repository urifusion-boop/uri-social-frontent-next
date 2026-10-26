'use client';

import { ReactNode, useEffect, useState } from 'react';
import { InboxKnowledgeEntry, InboxService } from '@/src/api/InboxService';

/*
 * Inbox settings — per PRD §4.3: business hours, the automation policy for
 * opt-in auto-replies (confidence threshold, channels, and the categories that
 * always require a human no matter the confidence score), the FAQ knowledge
 * base replies are grounded in, plus the saved replies and tag presets used
 * elsewhere in Inbox. Hours, policy and FAQs are saved to the backend, which
 * is what actually gates an auto-reply; saved replies and tags are lifted into
 * InboxDashboard's own state.
 */

const DEMO_INBOX = process.env.NEXT_PUBLIC_INBOX_DEMO === 'true';
const TIMEZONE = 'Africa/Lagos';

const FONT = "'Urbanist', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif";

const I = ({ n, s = 18, c = 'currentColor' }: { n: string; s?: number; c?: string }) => {
  const p: Record<string, ReactNode> = {
    check: <polyline points="20 6 9 17 4 12" />,
    x: (
      <>
        <line x1="18" y1="6" x2="6" y2="18" />
        <line x1="6" y1="6" x2="18" y2="18" />
      </>
    ),
    plus: (
      <>
        <line x1="12" y1="5" x2="12" y2="19" />
        <line x1="5" y1="12" x2="19" y2="12" />
      </>
    ),
    trash: (
      <>
        <polyline points="3 6 5 6 21 6" />
        <path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" />
      </>
    ),
    edit: (
      <>
        <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" />
        <path d="M18.5 2.5a2.12 2.12 0 013 3L12 15l-4 1 1-4 9.5-9.5z" />
      </>
    ),
    lock: (
      <>
        <rect x="3" y="11" width="18" height="11" rx="2" />
        <path d="M7 11V7a5 5 0 0110 0v4" />
      </>
    ),
  };
  return (
    <svg
      width={s}
      height={s}
      viewBox="0 0 24 24"
      fill="none"
      stroke={c}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      style={{ flexShrink: 0, display: 'block' }}
    >
      {p[n]}
    </svg>
  );
};

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

// Per §4.3: these always require a human, regardless of confidence — not a
// setting anyone can turn off.
const ALWAYS_EXCLUDED = ['Payment disputes', 'Refunds', 'Safety concerns', 'Legal threats', 'Ambiguous stock or price'];

interface SavedReply {
  label: string;
  text: string;
}

function SectionCard({ title, desc, children }: { title: string; desc?: string; children: ReactNode }) {
  return (
    <div
      style={{
        background: '#fff',
        border: '1px solid rgba(0,0,0,.08)',
        borderRadius: 14,
        padding: '18px 20px',
        display: 'flex',
        flexDirection: 'column',
        gap: 14,
      }}
    >
      <div>
        <div style={{ fontSize: 14.5, fontWeight: 800, color: '#1a1a1a' }}>{title}</div>
        {desc && <div style={{ fontSize: 12, color: '#888', marginTop: 3, lineHeight: 1.5 }}>{desc}</div>}
      </div>
      {children}
    </div>
  );
}

function Toggle({ on, onClick }: { on: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      onClick={onClick}
      style={{
        width: 40,
        height: 22,
        borderRadius: 11,
        border: 'none',
        background: on ? '#AD1457' : 'rgba(0,0,0,.15)',
        position: 'relative',
        cursor: 'pointer',
        flex: '0 0 auto',
        padding: 0,
      }}
    >
      <span
        style={{
          position: 'absolute',
          top: 2,
          left: on ? 20 : 2,
          width: 18,
          height: 18,
          borderRadius: '50%',
          background: '#fff',
          transition: 'left .15s',
          boxShadow: '0 1px 3px rgba(0,0,0,.3)',
        }}
      />
    </button>
  );
}

export default function InboxSettingsPage({
  isMobile,
  savedReplies,
  onSavedRepliesChange,
  tagPresets,
  onTagPresetsChange,
}: {
  isMobile: boolean;
  savedReplies: SavedReply[];
  onSavedRepliesChange: (next: SavedReply[]) => void;
  tagPresets: string[];
  onTagPresetsChange: (next: string[]) => void;
}) {
  const [openDays, setOpenDays] = useState<Record<string, boolean>>({
    Mon: true,
    Tue: true,
    Wed: true,
    Thu: true,
    Fri: true,
    Sat: true,
    Sun: false,
  });
  const [openTime, setOpenTime] = useState('09:00');
  const [closeTime, setCloseTime] = useState('18:00');

  const [autoReplyEnabled, setAutoReplyEnabled] = useState(false);
  const [confidenceThreshold, setConfidenceThreshold] = useState(90);
  const [alertEmails, setAlertEmails] = useState('');
  const [autoDm, setAutoDm] = useState(true);
  const [autoComments, setAutoComments] = useState(false);
  const [timezone, setTimezone] = useState(TIMEZONE);
  const [settingsLoaded, setSettingsLoaded] = useState(DEMO_INBOX);
  const [saveState, setSaveState] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');

  const [faqs, setFaqs] = useState<InboxKnowledgeEntry[]>([]);
  const [faqError, setFaqError] = useState('');
  const [newQuestion, setNewQuestion] = useState('');
  const [newAnswer, setNewAnswer] = useState('');
  const [editingFaq, setEditingFaq] = useState<InboxKnowledgeEntry | null>(null);

  useEffect(() => {
    if (DEMO_INBOX) return;
    let cancelled = false;
    (async () => {
      try {
        const [settings, entries] = await Promise.all([InboxService.getAgentSettings(), InboxService.listKnowledge()]);
        if (cancelled) return;
        setOpenDays(settings.business_hours.days);
        setOpenTime(settings.business_hours.open);
        setCloseTime(settings.business_hours.close);
        setTimezone(settings.business_hours.timezone);
        setAutoReplyEnabled(settings.auto_reply_enabled);
        setConfidenceThreshold(settings.confidence_threshold);
        setAutoDm(settings.auto_reply_channels.dm);
        setAutoComments(settings.auto_reply_channels.comment);
        setAlertEmails((settings.alert_emails ?? []).join(', '));
        setFaqs(entries);
        setSettingsLoaded(true);
      } catch {
        if (!cancelled) setSaveState('error');
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  // "Saved" stops being true the moment anything changes again.
  useEffect(() => {
    setSaveState((prev) => (prev === 'saved' ? 'idle' : prev));
  }, [openDays, openTime, closeTime, autoReplyEnabled, confidenceThreshold, autoDm, autoComments, alertEmails]);

  async function saveAgentSettings() {
    if (DEMO_INBOX) return;
    setSaveState('saving');
    try {
      await InboxService.saveAgentSettings({
        auto_reply_enabled: autoReplyEnabled,
        confidence_threshold: confidenceThreshold,
        auto_reply_channels: { dm: autoDm, comment: autoComments },
        business_hours: { timezone, days: openDays, open: openTime, close: closeTime },
        alert_emails: alertEmails
          .split(/[\s,;]+/)
          .map((e) => e.trim())
          .filter(Boolean),
      });
      setSaveState('saved');
    } catch {
      setSaveState('error');
    }
  }

  async function addFaq() {
    const question = newQuestion.trim();
    const answer = newAnswer.trim();
    if (!question || !answer || DEMO_INBOX) return;
    setFaqError('');
    try {
      const id = await InboxService.createKnowledge({ question, answer, approved: true });
      setFaqs((prev) => [...prev, { id, question, answer, approved: true }]);
      setNewQuestion('');
      setNewAnswer('');
    } catch {
      setFaqError("Couldn't save that FAQ. Try again.");
    }
  }

  async function saveFaq(entry: InboxKnowledgeEntry) {
    if (!entry.question.trim() || !entry.answer.trim()) return;
    setFaqError('');
    try {
      await InboxService.updateKnowledge(entry);
      setFaqs((prev) => prev.map((f) => (f.id === entry.id ? entry : f)));
      setEditingFaq(null);
    } catch {
      setFaqError("Couldn't save that FAQ. Try again.");
    }
  }

  async function removeFaq(id: string) {
    setFaqError('');
    try {
      await InboxService.deleteKnowledge(id);
      setFaqs((prev) => prev.filter((f) => f.id !== id));
    } catch {
      setFaqError("Couldn't delete that FAQ. Try again.");
    }
  }

  const [newReplyLabel, setNewReplyLabel] = useState('');
  const [newReplyText, setNewReplyText] = useState('');
  const [editingIdx, setEditingIdx] = useState<number | null>(null);
  const [editLabel, setEditLabel] = useState('');
  const [editText, setEditText] = useState('');

  const [newTag, setNewTag] = useState('');

  function addReply() {
    if (!newReplyLabel.trim() || !newReplyText.trim()) return;
    onSavedRepliesChange([...savedReplies, { label: newReplyLabel.trim(), text: newReplyText.trim() }]);
    setNewReplyLabel('');
    setNewReplyText('');
  }

  function removeReply(idx: number) {
    onSavedRepliesChange(savedReplies.filter((_, i) => i !== idx));
  }

  function startEdit(idx: number) {
    setEditingIdx(idx);
    setEditLabel(savedReplies[idx].label);
    setEditText(savedReplies[idx].text);
  }

  function saveEdit() {
    if (editingIdx === null) return;
    const next = savedReplies.slice();
    next[editingIdx] = {
      label: editLabel.trim() || savedReplies[editingIdx].label,
      text: editText.trim() || savedReplies[editingIdx].text,
    };
    onSavedRepliesChange(next);
    setEditingIdx(null);
  }

  function addTagPreset() {
    const trimmed = newTag.trim();
    if (!trimmed || tagPresets.includes(trimmed)) return;
    onTagPresetsChange([...tagPresets, trimmed]);
    setNewTag('');
  }

  function removeTagPreset(tag: string) {
    onTagPresetsChange(tagPresets.filter((t) => t !== tag));
  }

  const inputStyle: React.CSSProperties = {
    border: '1px solid rgba(0,0,0,.12)',
    borderRadius: 8,
    padding: '8px 10px',
    fontSize: 13,
    fontFamily: FONT,
    outline: 'none',
  };

  return (
    <div
      style={{
        padding: isMobile ? 14 : 24,
        display: 'flex',
        flexDirection: 'column',
        gap: 16,
        maxWidth: 720,
        margin: '0 auto',
        boxSizing: 'border-box',
      }}
    >
      <SectionCard
        title="Business hours"
        desc={`Auto-replies only fire inside these hours (${timezone.replace('_', ' ')} time) — outside them, everything waits for a human.`}
      >
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
          {DAYS.map((d) => (
            <button
              key={d}
              type="button"
              onClick={() => setOpenDays((prev) => ({ ...prev, [d]: !prev[d] }))}
              style={{
                padding: '7px 12px',
                borderRadius: 8,
                border: openDays[d] ? '1px solid #E91E63' : '1px solid rgba(0,0,0,.1)',
                background: openDays[d] ? 'rgba(194,24,91,.08)' : '#fff',
                color: openDays[d] ? '#AD1457' : '#999',
                fontSize: 12.5,
                fontWeight: 700,
                cursor: 'pointer',
                fontFamily: FONT,
              }}
            >
              {d}
            </button>
          ))}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
          <label
            style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12.5, color: '#444', fontWeight: 600 }}
          >
            Open
            <input type="time" value={openTime} onChange={(e) => setOpenTime(e.target.value)} style={inputStyle} />
          </label>
          <label
            style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12.5, color: '#444', fontWeight: 600 }}
          >
            Close
            <input type="time" value={closeTime} onChange={(e) => setCloseTime(e.target.value)} style={inputStyle} />
          </label>
        </div>
      </SectionCard>

      <SectionCard
        title="Auto-reply policy"
        desc="When on, URI replies to every message itself: questions, interest, greetings, thanks and complaints. Facts come only from your approved FAQs and Brand Playbook. Anything below the confidence threshold, or in an excluded category, goes to a person instead."
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <div style={{ fontSize: 13, fontWeight: 700, color: '#1a1a1a' }}>Enable opt-in auto-replies</div>
            <div style={{ fontSize: 11.5, color: '#999', marginTop: 2 }}>
              Off by default — nothing sends itself until you turn this on.
            </div>
          </div>
          <Toggle on={autoReplyEnabled} onClick={() => setAutoReplyEnabled((v) => !v)} />
        </div>

        <div style={{ opacity: autoReplyEnabled ? 1 : 0.5 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
            <span style={{ fontSize: 12.5, fontWeight: 700, color: '#444' }}>Confidence threshold</span>
            <span style={{ fontSize: 12.5, fontWeight: 800, color: '#AD1457' }}>{confidenceThreshold}%</span>
          </div>
          <input
            type="range"
            min={50}
            max={99}
            value={confidenceThreshold}
            disabled={!autoReplyEnabled}
            onChange={(e) => setConfidenceThreshold(Number(e.target.value))}
            style={{ width: '100%', accentColor: '#AD1457' }}
          />
          <div style={{ fontSize: 11, color: '#999', marginTop: 4 }}>
            Below this, a suggestion is drafted for review instead of sent automatically.
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, opacity: autoReplyEnabled ? 1 : 0.5 }}>
          {[
            {
              label: 'Direct messages',
              hint: 'Instagram and Messenger DMs, inside the 24-hour reply window.',
              on: autoDm,
              toggle: () => setAutoDm((v) => !v),
            },
            {
              label: 'Public comments',
              hint: 'Everyone on the post sees these replies, so this is off by default.',
              on: autoComments,
              toggle: () => setAutoComments((v) => !v),
            },
          ].map((row) => (
            <div key={row.label} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <div style={{ fontSize: 12.5, fontWeight: 700, color: '#444' }}>{row.label}</div>
                <div style={{ fontSize: 11, color: '#999', marginTop: 2 }}>{row.hint}</div>
              </div>
              <Toggle on={row.on} onClick={() => autoReplyEnabled && row.toggle()} />
            </div>
          ))}
        </div>

        <div>
          <div style={{ fontSize: 12.5, fontWeight: 700, color: '#444' }}>Also email escalations to</div>
          <div style={{ fontSize: 11, color: '#999', marginTop: 2, marginBottom: 6 }}>
            When a customer is waiting for a person, the account owner is emailed and sent a WhatsApp. Add up to 5 more
            addresses, separated by commas.
          </div>
          <input
            type="text"
            value={alertEmails}
            onChange={(e) => setAlertEmails(e.target.value)}
            placeholder="e.g. support@yourbusiness.com, manager@yourbusiness.com"
            style={{
              width: '100%',
              boxSizing: 'border-box',
              border: '1px solid rgba(0,0,0,.12)',
              borderRadius: 8,
              padding: '8px 10px',
              fontSize: 13,
              fontFamily: 'inherit',
            }}
          />
        </div>

        <div
          style={{
            fontSize: 11.5,
            color: '#7A4B00',
            lineHeight: 1.55,
            background: '#FFF7E6',
            border: '1px solid #F5D9A8',
            borderRadius: 10,
            padding: '10px 12px',
          }}
        >
          <div style={{ fontWeight: 700, marginBottom: 4 }}>Why some messages still ask you to send</div>
          Turning auto-replies on doesn&apos;t mean every message sends itself. URI only sends a reply it&apos;s sure is
          right, and drafts the rest for you to check, with the reason shown in the conversation. That happens when:
          <ul style={{ margin: '6px 0 0', paddingLeft: 18 }}>
            <li>
              the customer asks something no approved FAQ below answers, or URI is less sure than your confidence
              threshold
            </li>
            <li>it looks like spam</li>
            <li>it&apos;s about a refund, payment dispute, safety, a legal threat or an unclear price or stock</li>
            <li>someone on your team has been assigned, or replied in the last 24 hours</li>
            <li>it&apos;s outside your business hours, or past Meta&apos;s 24-hour reply window</li>
            <li>10 auto-replies have gone out in this conversation in the last hour, which looks like another bot</li>
          </ul>
          <div style={{ marginTop: 6 }}>
            Adding FAQs for the questions you get most is the quickest way to auto-reply to more of them.
          </div>
        </div>

        <div>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              fontSize: 11,
              fontWeight: 800,
              letterSpacing: '.04em',
              textTransform: 'uppercase',
              color: '#999',
              marginBottom: 8,
            }}
          >
            <I n="lock" s={12} c="#999" />
            Always excluded — never automated
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {ALWAYS_EXCLUDED.map((cat) => (
              <div key={cat} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12.5, color: '#666' }}>
                <div
                  style={{
                    width: 16,
                    height: 16,
                    borderRadius: 4,
                    background: '#e8e8ea',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <I n="check" s={11} c="#999" />
                </div>
                {cat}
              </div>
            ))}
          </div>
        </div>
      </SectionCard>

      {!DEMO_INBOX && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, justifyContent: 'flex-end' }}>
          <span style={{ fontSize: 12, color: saveState === 'error' ? '#C62828' : '#2E7D32' }}>
            {saveState === 'saved'
              ? 'Saved'
              : saveState === 'error'
                ? "Couldn't load or save these settings. Try again."
                : ''}
          </span>
          <button
            type="button"
            onClick={saveAgentSettings}
            disabled={!settingsLoaded || saveState === 'saving'}
            style={{
              padding: '9px 18px',
              borderRadius: 8,
              border: 'none',
              background: settingsLoaded ? '#AD1457' : 'rgba(0,0,0,.15)',
              color: '#fff',
              fontSize: 13,
              fontWeight: 700,
              cursor: settingsLoaded ? 'pointer' : 'default',
              fontFamily: FONT,
            }}
          >
            {saveState === 'saving' ? 'Saving…' : 'Save hours and auto-reply policy'}
          </button>
        </div>
      )}

      {!DEMO_INBOX && (
        <SectionCard
          title="FAQ answers"
          desc="The facts URI's suggested replies and auto-replies are allowed to use. Only approved answers can be sent automatically — your Brand Playbook is used for drafts, but always reviewed."
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {faqs.length === 0 && (
              <div style={{ fontSize: 12.5, color: '#999' }}>
                No FAQs yet. Add the questions customers ask most — opening hours, delivery areas and fees, how to book
                or order.
              </div>
            )}
            {faqs.map((f) =>
              editingFaq?.id === f.id ? (
                <div
                  key={f.id}
                  style={{
                    border: '1px solid rgba(194,24,91,.3)',
                    borderRadius: 10,
                    padding: 10,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 8,
                  }}
                >
                  <input
                    value={editingFaq.question}
                    onChange={(e) => setEditingFaq({ ...editingFaq, question: e.target.value })}
                    style={inputStyle}
                    aria-label="Question"
                  />
                  <textarea
                    value={editingFaq.answer}
                    onChange={(e) => setEditingFaq({ ...editingFaq, answer: e.target.value })}
                    rows={3}
                    style={{ ...inputStyle, resize: 'vertical' }}
                    aria-label="Answer"
                  />
                  <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                    <button
                      type="button"
                      onClick={() => setEditingFaq(null)}
                      style={{ ...inputStyle, background: '#fff', cursor: 'pointer', fontWeight: 700 }}
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={() => saveFaq(editingFaq)}
                      style={{
                        ...inputStyle,
                        border: 'none',
                        background: '#AD1457',
                        color: '#fff',
                        cursor: 'pointer',
                        fontWeight: 700,
                      }}
                    >
                      Save
                    </button>
                  </div>
                </div>
              ) : (
                <div
                  key={f.id}
                  style={{
                    border: '1px solid rgba(0,0,0,.08)',
                    borderRadius: 10,
                    padding: '10px 12px',
                    display: 'flex',
                    gap: 10,
                    alignItems: 'flex-start',
                  }}
                >
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 12.5, fontWeight: 700, color: '#333' }}>{f.question}</div>
                    <div style={{ fontSize: 12.5, color: '#666', marginTop: 2, whiteSpace: 'pre-wrap' }}>
                      {f.answer}
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, flex: '0 0 auto' }}>
                    <span style={{ fontSize: 11, color: f.approved ? '#2E7D32' : '#999', fontWeight: 700 }}>
                      {f.approved ? 'Approved' : 'Draft only'}
                    </span>
                    <Toggle on={f.approved} onClick={() => saveFaq({ ...f, approved: !f.approved })} />
                    <button
                      type="button"
                      aria-label={`Edit ${f.question}`}
                      onClick={() => setEditingFaq(f)}
                      style={{ border: 'none', background: 'none', cursor: 'pointer', padding: 4 }}
                    >
                      <I n="edit" s={14} c="#888" />
                    </button>
                    <button
                      type="button"
                      aria-label={`Delete ${f.question}`}
                      onClick={() => removeFaq(f.id)}
                      style={{ border: 'none', background: 'none', cursor: 'pointer', padding: 4 }}
                    >
                      <I n="trash" s={14} c="#888" />
                    </button>
                  </div>
                </div>
              )
            )}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <input
              value={newQuestion}
              onChange={(e) => setNewQuestion(e.target.value)}
              placeholder="Question, e.g. Do you deliver outside Lagos?"
              style={inputStyle}
            />
            <textarea
              value={newAnswer}
              onChange={(e) => setNewAnswer(e.target.value)}
              placeholder="Your answer, exactly as a customer should hear it"
              rows={3}
              style={{ ...inputStyle, resize: 'vertical' }}
            />
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, justifyContent: 'flex-end' }}>
              {faqError && <span style={{ fontSize: 12, color: '#C62828' }}>{faqError}</span>}
              <button
                type="button"
                onClick={addFaq}
                disabled={!newQuestion.trim() || !newAnswer.trim()}
                style={{
                  padding: '8px 14px',
                  borderRadius: 8,
                  border: 'none',
                  background: newQuestion.trim() && newAnswer.trim() ? '#AD1457' : 'rgba(0,0,0,.15)',
                  color: '#fff',
                  fontSize: 12.5,
                  fontWeight: 700,
                  cursor: newQuestion.trim() && newAnswer.trim() ? 'pointer' : 'default',
                  fontFamily: FONT,
                }}
              >
                Add FAQ
              </button>
            </div>
          </div>
        </SectionCard>
      )}

      <SectionCard title="Saved replies" desc="Shown in the composer's quick-insert menu.">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {savedReplies.map((r, idx) =>
            editingIdx === idx ? (
              <div
                key={idx}
                style={{
                  border: '1px solid rgba(194,24,91,.3)',
                  borderRadius: 10,
                  padding: 10,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 8,
                }}
              >
                <input
                  value={editLabel}
                  onChange={(e) => setEditLabel(e.target.value)}
                  placeholder="Label"
                  style={inputStyle}
                />
                <textarea
                  value={editText}
                  onChange={(e) => setEditText(e.target.value)}
                  placeholder="Reply text"
                  rows={2}
                  style={{ ...inputStyle, resize: 'vertical' }}
                />
                <div style={{ display: 'flex', gap: 8 }}>
                  <button
                    type="button"
                    onClick={saveEdit}
                    style={{
                      padding: '6px 14px',
                      borderRadius: 7,
                      border: 'none',
                      background: '#AD1457',
                      color: '#fff',
                      fontSize: 12,
                      fontWeight: 700,
                      cursor: 'pointer',
                      fontFamily: FONT,
                    }}
                  >
                    Save
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditingIdx(null)}
                    style={{
                      padding: '6px 14px',
                      borderRadius: 7,
                      border: '1px solid rgba(0,0,0,.12)',
                      background: '#fff',
                      fontSize: 12,
                      fontWeight: 700,
                      color: '#444',
                      cursor: 'pointer',
                      fontFamily: FONT,
                    }}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <div
                key={idx}
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: 10,
                  border: '1px solid rgba(0,0,0,.08)',
                  borderRadius: 10,
                  padding: '10px 12px',
                }}
              >
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 12.5, fontWeight: 700, color: '#333' }}>{r.label}</div>
                  <div style={{ fontSize: 11.5, color: '#888', marginTop: 2 }}>{r.text}</div>
                </div>
                <button
                  type="button"
                  aria-label={`Edit ${r.label}`}
                  onClick={() => startEdit(idx)}
                  style={{
                    width: 28,
                    height: 28,
                    border: 'none',
                    background: 'transparent',
                    color: '#888',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    flex: '0 0 auto',
                  }}
                >
                  <I n="edit" s={14} />
                </button>
                <button
                  type="button"
                  aria-label={`Delete ${r.label}`}
                  onClick={() => removeReply(idx)}
                  style={{
                    width: 28,
                    height: 28,
                    border: 'none',
                    background: 'transparent',
                    color: '#C62828',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    flex: '0 0 auto',
                  }}
                >
                  <I n="trash" s={14} />
                </button>
              </div>
            )
          )}
        </div>
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 8,
            paddingTop: 8,
            borderTop: '1px dashed rgba(0,0,0,.1)',
          }}
        >
          <input
            value={newReplyLabel}
            onChange={(e) => setNewReplyLabel(e.target.value)}
            placeholder="New reply label..."
            style={inputStyle}
          />
          <textarea
            value={newReplyText}
            onChange={(e) => setNewReplyText(e.target.value)}
            placeholder="Reply text..."
            rows={2}
            style={{ ...inputStyle, resize: 'vertical' }}
          />
          <button
            type="button"
            onClick={addReply}
            disabled={!newReplyLabel.trim() || !newReplyText.trim()}
            style={{
              alignSelf: 'flex-start',
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              padding: '7px 14px',
              borderRadius: 8,
              border: 'none',
              background: newReplyLabel.trim() && newReplyText.trim() ? '#AD1457' : '#d9a9bc',
              color: '#fff',
              fontSize: 12.5,
              fontWeight: 700,
              cursor: newReplyLabel.trim() && newReplyText.trim() ? 'pointer' : 'default',
              fontFamily: FONT,
            }}
          >
            <I n="plus" s={12} c="#fff" />
            Add saved reply
          </button>
        </div>
      </SectionCard>

      <SectionCard title="Tag presets" desc="Quick-add options shown in the conversation tag picker.">
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
          {tagPresets.map((t) => (
            <span
              key={t}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                fontSize: 12,
                fontWeight: 700,
                padding: '5px 8px 5px 12px',
                borderRadius: 14,
                background: 'rgba(194,24,91,.08)',
                color: '#AD1457',
              }}
            >
              {t}
              <button
                type="button"
                aria-label={`Remove ${t}`}
                onClick={() => removeTagPreset(t)}
                style={{
                  width: 18,
                  height: 18,
                  border: 'none',
                  background: 'rgba(194,24,91,.15)',
                  borderRadius: '50%',
                  color: '#AD1457',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  padding: 0,
                }}
              >
                <I n="x" s={10} />
              </button>
            </span>
          ))}
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <input
            value={newTag}
            onChange={(e) => setNewTag(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') addTagPreset();
            }}
            placeholder="New tag preset..."
            style={{ ...inputStyle, flex: 1 }}
          />
          <button
            type="button"
            onClick={addTagPreset}
            disabled={!newTag.trim()}
            style={{
              padding: '8px 16px',
              borderRadius: 8,
              border: 'none',
              background: newTag.trim() ? '#AD1457' : '#d9a9bc',
              color: '#fff',
              fontSize: 12.5,
              fontWeight: 700,
              cursor: newTag.trim() ? 'pointer' : 'default',
              fontFamily: FONT,
            }}
          >
            Add
          </button>
        </div>
      </SectionCard>
    </div>
  );
}
