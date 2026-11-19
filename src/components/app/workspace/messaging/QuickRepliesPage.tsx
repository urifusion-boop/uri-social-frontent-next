'use client';

import { useEffect, useMemo, useState } from 'react';
import { BookOpen, Calendar, Link2, Plus, Search, ShoppingBag, Trash2, X, Zap } from 'lucide-react';
import {
  InboxService,
  type DeskPrefs,
  type QuickReply,
  type QuickReplyButton,
  type QuickReplyButtonKind,
} from '@/src/api/InboxService';
import { MSG_MUTED, MSG_PINK } from './MessagingHeader';
import { Box, Btn, Col, Field, Label, Muted, NavRow, Pane, Pill, Title, apiError } from './ui';

// A button is a link to the business's own page; DMs carry text, so it goes out as a
// tap-able "Label: address" line under the reply. The kind only picks the icon.
export const BUTTON_KIND_LABEL: Record<QuickReplyButtonKind, string> = {
  book: 'Book',
  buy: 'Buy',
  learn_more: 'Learn more',
  link: 'Link',
};

export function ButtonIcon({ kind, size = 13, color }: { kind: QuickReplyButtonKind; size?: number; color?: string }) {
  const Icon = kind === 'book' ? Calendar : kind === 'buy' ? ShoppingBag : kind === 'learn_more' ? BookOpen : Link2;
  return <Icon size={size} color={color} />;
}

/** The reply as it is sent: its text, then one "Label: address" line per button. */
export function replyWithButtons(text: string, buttons: { label: string; url: string }[]): string {
  const lines = buttons.filter((b) => b.label && b.url).map((b) => `${b.label}: ${b.url}`);
  return lines.length ? `${text}\n\n${lines.join('\n')}` : text;
}

/** "{first_name}" in a reply, filled in for the preview and when inserted into a chat. */
export function fillReply(text: string, firstName: string): string {
  return text.replace(/\{first_name\}/g, firstName || 'there');
}

const EMPTY: QuickReply = { id: '', title: '', text: '', shortcut: '', category: '', buttons: [], uses: 0 };

export default function QuickRepliesPage({ isMobile }: { isMobile: boolean }) {
  const [prefs, setPrefs] = useState<DeskPrefs | null>(null);
  const [error, setError] = useState('');
  const [category, setCategory] = useState('');
  const [query, setQuery] = useState('');
  const [editing, setEditing] = useState<QuickReply | null>(null);
  const [saving, setSaving] = useState(false);
  const [newCategory, setNewCategory] = useState<string | null>(null);

  useEffect(() => {
    InboxService.getDeskPrefs()
      .then((p) => {
        setPrefs(p);
        setEditing(p.quick_replies[0] ?? { ...EMPTY });
      })
      .catch(() => setError("Couldn't load your quick replies."));
  }, []);

  const replies = useMemo(() => {
    const all = [...(prefs?.quick_replies ?? [])].sort((a, b) => b.uses - a.uses);
    const q = query.trim().toLowerCase();
    return all.filter(
      (r) =>
        (!category || r.category === category) &&
        (!q || r.title.toLowerCase().includes(q) || r.shortcut.includes(q) || r.text.toLowerCase().includes(q))
    );
  }, [prefs, category, query]);

  const persist = async (change: Partial<DeskPrefs>, okMessage?: string) => {
    setSaving(true);
    try {
      const next = await InboxService.saveDeskPrefs(change);
      setPrefs(next);
      setError(okMessage ?? '');
      return next;
    } catch (e) {
      setError(apiError(e, "Couldn't save."));
      return null;
    } finally {
      setSaving(false);
    }
  };

  const saveReply = async () => {
    if (!prefs || !editing) return;
    if (!editing.title.trim() || !editing.text.trim()) {
      setError('Give the reply a title and a message.');
      return;
    }
    const exists = prefs.quick_replies.some((r) => r.id === editing.id && editing.id);
    const list = exists
      ? prefs.quick_replies.map((r) => (r.id === editing.id ? editing : r))
      : [...prefs.quick_replies, editing];
    const next = await persist({ quick_replies: list });
    if (next) {
      const saved = exists
        ? next.quick_replies.find((r) => r.id === editing.id)
        : next.quick_replies[next.quick_replies.length - 1];
      setEditing(saved ?? null);
    }
  };

  const deleteReply = async () => {
    if (!prefs || !editing?.id) return;
    const next = await persist({ quick_replies: prefs.quick_replies.filter((r) => r.id !== editing.id) });
    if (next) setEditing(next.quick_replies[0] ?? { ...EMPTY });
  };

  const addCategory = async () => {
    const c = (newCategory || '').trim();
    if (!prefs || !c || prefs.categories.includes(c)) return;
    if (await persist({ categories: [...prefs.categories, c] })) setNewCategory(null);
  };

  const setButton = (i: number, b: Partial<QuickReplyButton>) =>
    editing && setEditing({ ...editing, buttons: editing.buttons.map((x, j) => (j === i ? { ...x, ...b } : x)) });

  if (!prefs) return <div style={{ padding: 28 }}><Muted>{error || 'Loading…'}</Muted></div>;

  const counts = (c: string) => prefs.quick_replies.filter((r) => !c || r.category === c).length;
  const isNew = editing && !prefs.quick_replies.some((r) => r.id === editing.id && editing.id);

  const editor = editing && (
    <>
      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
        <Title>{isNew ? 'New reply' : 'Edit reply'}</Title>
        {!isNew && <span style={{ fontSize: 11, color: MSG_MUTED }}>Used {editing.uses} times</span>}
      </div>
      <Label style={{ marginTop: 12 }}>Title</Label>
      <Field value={editing.title} onChange={(v) => setEditing({ ...editing, title: v })} placeholder="e.g. Welcome" style={{ marginTop: 5 }} />
      <div style={{ display: 'flex', gap: 10, marginTop: 10 }}>
        <div style={{ flex: 1 }}>
          <Label>Shortcut</Label>
          <Field mono value={editing.shortcut} onChange={(v) => setEditing({ ...editing, shortcut: v.replace(/\s/g, '') })} placeholder="/hi" style={{ marginTop: 5 }} />
        </div>
        <div style={{ flex: 1 }}>
          <Label>Category</Label>
          <select
            value={editing.category}
            onChange={(e) => setEditing({ ...editing, category: e.target.value })}
            style={{ marginTop: 5, width: '100%', height: 34, border: '1px solid #ECE6EA', borderRadius: 9, padding: '0 8px', fontSize: 12.5, fontFamily: 'inherit', background: '#fff' }}
          >
            <option value="">No category</option>
            {prefs.categories.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>
      </div>
      <Label style={{ marginTop: 10 }}>Message</Label>
      <Field multiline value={editing.text} onChange={(v) => setEditing({ ...editing, text: v })} placeholder="Hi {first_name}! …" style={{ marginTop: 5 }} />
      <button
        type="button"
        onClick={() => setEditing({ ...editing, text: `${editing.text}{first_name}` })}
        style={{ marginTop: 6, border: 'none', background: '#FDEBF2', color: '#D0145C', fontSize: 11, padding: '2px 8px', borderRadius: 6, cursor: 'pointer' }}
      >
        + {'{first_name}'}
      </button>
      <Label style={{ marginTop: 12 }}>Buttons under the reply</Label>
      {editing.buttons.map((b, i) => (
        <div key={i} style={{ display: 'flex', gap: 6, marginTop: 6, alignItems: 'center' }}>
          <select
            value={b.kind}
            onChange={(e) => {
              const kind = e.target.value as QuickReplyButtonKind;
              setButton(i, { kind, label: b.label || BUTTON_KIND_LABEL[kind] });
            }}
            style={{ height: 30, border: '1px solid #ECE6EA', borderRadius: 8, fontSize: 12, background: '#fff', fontFamily: 'inherit' }}
          >
            {(Object.keys(BUTTON_KIND_LABEL) as QuickReplyButtonKind[]).map((k) => (
              <option key={k} value={k}>
                {BUTTON_KIND_LABEL[k]}
              </option>
            ))}
          </select>
          <Field value={b.label} onChange={(v) => setButton(i, { label: v })} placeholder="Button text" style={{ height: 30 }} />
          <Field value={b.url} onChange={(v) => setButton(i, { url: v })} placeholder="https://yourpage.com/book" style={{ height: 30 }} />
          <button
            type="button"
            aria-label="Remove button"
            onClick={() => setEditing({ ...editing, buttons: editing.buttons.filter((_, j) => j !== i) })}
            style={{ border: 'none', background: 'none', cursor: 'pointer', color: MSG_MUTED }}
          >
            <X size={14} />
          </button>
        </div>
      ))}
      {editing.buttons.length < 3 && (
        <Btn
          kind="outline"
          style={{ marginTop: 6, height: 28 }}
          onClick={() => setEditing({ ...editing, buttons: [...editing.buttons, { kind: 'book', label: 'Book now', url: '' }] })}
        >
          <Plus size={13} /> Add a button
        </Btn>
      )}
      {editing.buttons.length > 0 && (
        <Muted style={{ marginTop: 6 }}>Each button goes out as a tap-able link under the reply, on every network.</Muted>
      )}
      <Label style={{ marginTop: 12 }}>Preview</Label>
      <div style={{ display: 'flex', gap: 8, marginTop: 6, alignItems: 'flex-start' }}>
        <div style={{ width: 26, height: 26, borderRadius: '50%', background: '#26348B', color: '#fff', fontSize: 9.5, fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          ZP
        </div>
        <div>
          <div style={{ background: '#FCEEF4', borderRadius: 12, padding: '8px 12px', fontSize: 12.5, lineHeight: 1.45, whiteSpace: 'pre-wrap' }}>
            {fillReply(editing.text, 'Zino') || '…'}
          </div>
          {editing.buttons.length > 0 && (
            <div style={{ display: 'flex', gap: 6, marginTop: 6, flexWrap: 'wrap' }}>
              {editing.buttons.map((b, i) => (
                <span key={i} style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 11.5, fontWeight: 600, border: `1px solid ${i === 0 ? '#F6C9DB' : '#EFE7EB'}`, background: i === 0 ? '#FDF1F6' : '#fff', color: i === 0 ? '#D0145C' : '#2A2230', borderRadius: 8, padding: '4px 10px' }}>
                  <ButtonIcon kind={b.kind} size={12} color={i === 0 ? '#D0145C' : '#2A2230'} />
                  {b.label || '…'}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>
      <div style={{ display: 'flex', gap: 8, marginTop: 14 }}>
        <Btn onClick={saveReply} disabled={saving}>
          {saving ? 'Saving…' : 'Save reply'}
        </Btn>
        {!isNew && (
          <Btn kind="danger" onClick={deleteReply} disabled={saving}>
            <Trash2 size={13} /> Delete
          </Btn>
        )}
      </div>
      {error && <Muted style={{ marginTop: 8, color: '#C62828' }}>{error}</Muted>}
    </>
  );

  const list = (
    <>
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10 }}>
        <div style={{ position: 'relative', flex: 1, maxWidth: 300 }}>
          <Search size={15} color={MSG_MUTED} style={{ position: 'absolute', left: 11, top: 10 }} />
          <Field value={query} onChange={setQuery} placeholder="Search replies or shortcuts…" style={{ paddingLeft: 32 }} />
        </div>
        <Btn onClick={() => setEditing({ ...EMPTY, category })}>
          <Plus size={15} /> New reply
        </Btn>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: 12, marginTop: 14 }}>
        {replies.map((r) => (
          <button
            key={r.id}
            type="button"
            onClick={() => setEditing(r)}
            style={{ all: 'unset', cursor: 'pointer' }}
          >
            <Box selected={editing?.id === r.id} style={{ padding: '12px 13px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8 }}>
                <span style={{ fontWeight: 700, fontSize: 13 }}>{r.title}</span>
                {r.shortcut && <Pill fg="#5C5460" bg="#F6F2F4" style={{ fontFamily: 'ui-monospace, Menlo, monospace' }}>{r.shortcut}</Pill>}
              </div>
              <div style={{ color: MSG_MUTED, fontSize: 11.8, lineHeight: 1.45, marginTop: 5, height: 34, overflow: 'hidden' }}>{r.text}</div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8 }}>
                {r.category ? <Pill fg="#5C5460" bg="#F3F2EF">{r.category}</Pill> : <span />}
                <span style={{ fontSize: 11, color: MSG_MUTED }}>Used {r.uses}×</span>
              </div>
            </Box>
          </button>
        ))}
      </div>
      {replies.length === 0 && (
        <Muted style={{ marginTop: 20, textAlign: 'center' }}>
          {prefs.quick_replies.length ? 'No replies match.' : 'No quick replies yet — create your first one.'}
        </Muted>
      )}
      <div style={{ display: 'flex', alignItems: 'center', gap: 7, fontSize: 11, color: MSG_MUTED, marginTop: 14 }}>
        <Zap size={14} color={MSG_PINK} />
        Type <b style={{ color: '#2A2230', fontFamily: 'ui-monospace, Menlo, monospace' }}>/</b> in any chat to insert a quick reply.
      </div>
    </>
  );

  if (isMobile) {
    return (
      <div style={{ padding: 14, display: 'flex', flexDirection: 'column', gap: 12 }}>
        <Pane style={{ display: 'block', padding: 14 }}>{list}</Pane>
        <Pane style={{ display: 'block', padding: 14 }}>{editor}</Pane>
      </div>
    );
  }

  return (
    <div style={{ padding: '0 28px 28px' }}>
      <Pane style={{ minHeight: 560 }}>
        <Col style={{ width: 188, flexShrink: 0, paddingTop: 16 }}>
          <div style={{ padding: '0 20px 8px' }}>
            <Label>Categories</Label>
          </div>
          <NavRow label="All replies" count={counts('')} active={!category} onClick={() => setCategory('')} />
          {prefs.categories.map((c) => (
            <NavRow key={c} label={c} count={counts(c)} active={category === c} onClick={() => setCategory(c)} />
          ))}
          <div style={{ margin: '14px 20px 0' }}>
            {newCategory === null ? (
              <button type="button" onClick={() => setNewCategory('')} style={{ border: 'none', background: 'none', color: '#D0145C', fontWeight: 600, fontSize: 12, cursor: 'pointer', padding: 0 }}>
                + New category
              </button>
            ) : (
              <Field value={newCategory} onChange={setNewCategory} placeholder="Category name" onEnter={addCategory} />
            )}
          </div>
        </Col>
        <Col style={{ width: 578, flexShrink: 0, padding: '16px 18px' }}>{list}</Col>
        <Col style={{ flex: 1, padding: '16px 18px', background: '#FFFCFD', borderRight: 'none' }}>{editor}</Col>
      </Pane>
    </div>
  );
}
