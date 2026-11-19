'use client';

import { useEffect, useMemo, useState, type CSSProperties } from 'react';
import { BookOpen, Calendar, Link2, Pencil, Plus, Search, ShoppingBag, Trash2, X, Zap } from 'lucide-react';
import {
  InboxService,
  type DeskPrefs,
  type QuickReply,
  type QuickReplyButton,
  type QuickReplyButtonKind,
} from '@/src/api/InboxService';
import { MSG_MUTED, MSG_PINK } from './MessagingHeader';
import { PlatformBadge, avatarColor, initialsOf } from './platform';
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

const catIcon: CSSProperties = {
  border: 'none',
  background: 'none',
  padding: 4,
  cursor: 'pointer',
  color: MSG_MUTED,
  display: 'flex',
  borderRadius: 6,
};

const EMPTY: QuickReply = { id: '', title: '', text: '', shortcut: '', category: '', buttons: [], uses: 0 };

export default function QuickRepliesPage({ isMobile }: { isMobile: boolean }) {
  const [prefs, setPrefs] = useState<DeskPrefs | null>(null);
  const [error, setError] = useState('');
  const [category, setCategory] = useState('');
  const [query, setQuery] = useState('');
  const [editing, setEditing] = useState<QuickReply | null>(null);
  const [saving, setSaving] = useState(false);
  const [newCategory, setNewCategory] = useState<string | null>(null);
  const [renaming, setRenaming] = useState<{ from: string; to: string } | null>(null);
  const [flash, setFlash] = useState(false);
  // The preview shows the reply as your newest real customer would get it.
  const [sample, setSample] = useState<{ name: string; platform: string } | null>(null);
  useEffect(() => {
    InboxService.listConversations({ limit: 1 })
      .then((c) => c[0] && setSample({ name: c[0].contact_name || '', platform: c[0].platform }))
      .catch(() => undefined);
  }, []);

  const startNewReply = () => {
    setEditing({ ...EMPTY, category });
    setError('');
    setFlash(true);
    window.setTimeout(() => setFlash(false), 700);
    window.setTimeout(() => {
      const el = document.getElementById('qr-title') as HTMLInputElement | null;
      el?.focus();
      el?.scrollIntoView({ block: 'center', behavior: 'smooth' });
    }, 30);
  };

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

  // Renaming keeps every reply in the category; deleting leaves its replies uncategorised.
  const renameCategory = async () => {
    if (!prefs || !renaming) return;
    const to = renaming.to.trim();
    if (!to || to === renaming.from) return setRenaming(null);
    if (prefs.categories.includes(to)) return setError(`There's already a category called ${to}.`);
    const next = await persist({
      categories: prefs.categories.map((c) => (c === renaming.from ? to : c)),
      quick_replies: prefs.quick_replies.map((r) => (r.category === renaming.from ? { ...r, category: to } : r)),
    });
    if (next) {
      if (category === renaming.from) setCategory(to);
      if (editing?.category === renaming.from) setEditing({ ...editing, category: to });
      setRenaming(null);
    }
  };
  const deleteCategory = async (c: string) => {
    if (!prefs) return;
    const n = prefs.quick_replies.filter((r) => r.category === c).length;
    if (
      !window.confirm(
        n ? `Delete "${c}"? Its ${n} repl${n === 1 ? 'y stays' : 'ies stay'}, without a category.` : `Delete "${c}"?`
      )
    )
      return;
    if (await persist({ categories: prefs.categories.filter((x) => x !== c) })) {
      if (category === c) setCategory('');
      if (editing?.category === c) setEditing({ ...editing, category: '' });
      setRenaming(null);
    }
  };

  const setButton = (i: number, b: Partial<QuickReplyButton>) =>
    editing && setEditing({ ...editing, buttons: editing.buttons.map((x, j) => (j === i ? { ...x, ...b } : x)) });

  if (!prefs)
    return (
      <div style={{ padding: 28 }}>
        <Muted>{error || 'Loading…'}</Muted>
      </div>
    );

  const counts = (c: string) => prefs.quick_replies.filter((r) => !c || r.category === c).length;
  const isNew = editing && !prefs.quick_replies.some((r) => r.id === editing.id && editing.id);

  const editor = editing && (
    <>
      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
        <Title>{isNew ? 'New reply' : 'Edit reply'}</Title>
        {!isNew && <span style={{ fontSize: 11, color: MSG_MUTED }}>Used {editing.uses} times</span>}
      </div>
      <Label style={{ marginTop: 12 }}>Title</Label>
      <Field
        id="qr-title"
        value={editing.title}
        onChange={(v) => setEditing({ ...editing, title: v })}
        placeholder="e.g. Welcome"
        style={{ marginTop: 5 }}
      />
      <div style={{ display: 'flex', gap: 10, marginTop: 10 }}>
        <div style={{ flex: 1 }}>
          <Label>Shortcut</Label>
          <Field
            mono
            value={editing.shortcut}
            onChange={(v) => setEditing({ ...editing, shortcut: v.replace(/\s/g, '') })}
            placeholder="/hi"
            style={{ marginTop: 5 }}
          />
        </div>
        <div style={{ flex: 1 }}>
          <Label>Category</Label>
          <select
            value={editing.category}
            onChange={(e) => setEditing({ ...editing, category: e.target.value })}
            style={{
              marginTop: 5,
              width: '100%',
              height: 34,
              border: '1px solid #ECE6EA',
              borderRadius: 9,
              padding: '0 8px',
              fontSize: 12.5,
              fontFamily: 'inherit',
              background: '#fff',
            }}
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
      <Field
        multiline
        value={editing.text}
        onChange={(v) => setEditing({ ...editing, text: v })}
        placeholder="Hi {first_name}! …"
        style={{ marginTop: 5 }}
      />
      <button
        type="button"
        onClick={() => setEditing({ ...editing, text: `${editing.text}{first_name}` })}
        style={{
          marginTop: 6,
          border: 'none',
          background: '#FDEBF2',
          color: '#D0145C',
          fontSize: 11,
          padding: '2px 8px',
          borderRadius: 6,
          cursor: 'pointer',
        }}
      >
        + {'{first_name}'}
      </button>
      <Label style={{ marginTop: 12 }}>Buttons under the reply</Label>
      {editing.buttons.map((b, i) => (
        <div key={i} style={{ marginTop: 8, padding: 8, border: '1px solid #F1EBEE', borderRadius: 10 }}>
          <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
            <select
              value={b.kind}
              onChange={(e) => {
                const kind = e.target.value as QuickReplyButtonKind;
                setButton(i, { kind, label: b.label || BUTTON_KIND_LABEL[kind] });
              }}
              style={{
                height: 30,
                border: '1px solid #ECE6EA',
                borderRadius: 8,
                fontSize: 12,
                background: '#fff',
                fontFamily: 'inherit',
              }}
            >
              {(Object.keys(BUTTON_KIND_LABEL) as QuickReplyButtonKind[]).map((k) => (
                <option key={k} value={k}>
                  {BUTTON_KIND_LABEL[k]}
                </option>
              ))}
            </select>
            <Field
              value={b.label}
              onChange={(v) => setButton(i, { label: v })}
              placeholder="Button text"
              style={{ height: 30 }}
            />
            <button
              type="button"
              aria-label="Remove button"
              onClick={() => setEditing({ ...editing, buttons: editing.buttons.filter((_, j) => j !== i) })}
              style={{ border: 'none', background: 'none', cursor: 'pointer', color: MSG_MUTED }}
            >
              <X size={14} />
            </button>
          </div>
          <Field
            value={b.url}
            onChange={(v) => setButton(i, { url: v })}
            placeholder="https://yourpage.com/book"
            style={{ height: 30, marginTop: 6 }}
          />
        </div>
      ))}
      {editing.buttons.length < 3 && (
        <Btn
          kind="outline"
          style={{ marginTop: 6, height: 28 }}
          onClick={() =>
            setEditing({ ...editing, buttons: [...editing.buttons, { kind: 'book', label: 'Book now', url: '' }] })
          }
        >
          <Plus size={13} /> Add a button
        </Btn>
      )}
      {editing.buttons.length > 0 && (
        <Muted style={{ marginTop: 6 }}>
          Each button goes out as a tap-able link under the reply, on every network.
        </Muted>
      )}
      <Label style={{ marginTop: 12 }}>
        Preview{' '}
        <span style={{ fontWeight: 400, color: MSG_MUTED }}>
          · as {sample?.name ? sample.name.split(' ')[0] : 'a customer'} would get it
        </span>
      </Label>
      <div style={{ display: 'flex', gap: 8, marginTop: 6, alignItems: 'flex-start' }}>
        <PlatformBadge
          platform={sample?.platform || 'instagram'}
          size={26}
          initials={initialsOf(sample?.name || 'Customer')}
          color={avatarColor(sample?.name || 'Customer')}
        />
        <div>
          <div
            style={{
              background: '#FCEEF4',
              borderRadius: 12,
              padding: '8px 12px',
              fontSize: 12.5,
              lineHeight: 1.45,
              whiteSpace: 'pre-wrap',
            }}
          >
            {fillReply(editing.text, (sample?.name || '').split(' ')[0]) || '…'}
          </div>
          {editing.buttons.length > 0 && (
            <div style={{ display: 'flex', gap: 6, marginTop: 6, flexWrap: 'wrap' }}>
              {editing.buttons.map((b, i) => (
                <span
                  key={i}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 5,
                    fontSize: 11.5,
                    fontWeight: 600,
                    border: `1px solid ${i === 0 ? '#F6C9DB' : '#EFE7EB'}`,
                    background: i === 0 ? '#FDF1F6' : '#fff',
                    color: i === 0 ? '#D0145C' : '#2A2230',
                    borderRadius: 8,
                    padding: '4px 10px',
                  }}
                >
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
          <Field
            value={query}
            onChange={setQuery}
            placeholder="Search replies or shortcuts…"
            style={{ paddingLeft: 32 }}
          />
        </div>
        <Btn onClick={startNewReply}>
          <Plus size={15} /> New reply
        </Btn>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: 12, marginTop: 14 }}>
        {replies.map((r) => (
          <button key={r.id} type="button" onClick={() => setEditing(r)} style={{ all: 'unset', cursor: 'pointer' }}>
            <Box selected={editing?.id === r.id} style={{ padding: '12px 13px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8 }}>
                <span style={{ fontWeight: 700, fontSize: 13 }}>{r.title}</span>
                {r.shortcut && (
                  <Pill fg="#5C5460" bg="#F6F2F4" style={{ fontFamily: 'ui-monospace, Menlo, monospace' }}>
                    {r.shortcut}
                  </Pill>
                )}
              </div>
              <div
                style={{
                  color: MSG_MUTED,
                  fontSize: 11.8,
                  lineHeight: 1.45,
                  marginTop: 5,
                  height: 34,
                  overflow: 'hidden',
                }}
              >
                {r.text}
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8 }}>
                {r.category ? (
                  <Pill fg="#5C5460" bg="#F3F2EF">
                    {r.category}
                  </Pill>
                ) : (
                  <span />
                )}
                <span style={{ fontSize: 11, color: MSG_MUTED }}>Used {r.uses}×</span>
              </div>
            </Box>
          </button>
        ))}
      </div>
      {replies.length === 0 && (
        <Muted style={{ marginTop: 20, textAlign: 'center' }}>
          {prefs.quick_replies.length
            ? 'No replies match.'
            : 'No quick replies yet — write your first one on the right.'}
        </Muted>
      )}
      <div style={{ display: 'flex', alignItems: 'center', gap: 7, fontSize: 11, color: MSG_MUTED, marginTop: 14 }}>
        <Zap size={14} color={MSG_PINK} />
        Type <b style={{ color: '#2A2230', fontFamily: 'ui-monospace, Menlo, monospace' }}>/</b> in any chat to insert a
        quick reply.
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
          {prefs.categories.map((c) =>
            renaming?.from === c ? (
              <div key={c} style={{ margin: '0 8px 2px', display: 'flex', gap: 4, alignItems: 'center' }}>
                <Field
                  value={renaming.to}
                  onChange={(v) => setRenaming({ from: c, to: v })}
                  onEnter={renameCategory}
                  style={{ height: 30 }}
                />
                <button
                  type="button"
                  aria-label="Delete category"
                  title="Delete category"
                  onClick={() => deleteCategory(c)}
                  style={catIcon}
                >
                  <Trash2 size={13} />
                </button>
                <button type="button" aria-label="Cancel" onClick={() => setRenaming(null)} style={catIcon}>
                  <X size={13} />
                </button>
              </div>
            ) : (
              <div key={c} className="qr-cat" style={{ position: 'relative' }}>
                <NavRow label={c} count={counts(c)} active={category === c} onClick={() => setCategory(c)} />
                <button
                  type="button"
                  aria-label={`Rename or delete ${c}`}
                  title="Rename or delete"
                  className="qr-cat-edit"
                  onClick={() => setRenaming({ from: c, to: c })}
                  style={{ ...catIcon, position: 'absolute', right: 34, top: 7 }}
                >
                  <Pencil size={12} />
                </button>
              </div>
            )
          )}
          <style>{`.qr-cat .qr-cat-edit{opacity:0}.qr-cat:hover .qr-cat-edit,.qr-cat-edit:focus{opacity:1}`}</style>
          <div style={{ margin: '14px 20px 0' }}>
            {newCategory === null ? (
              <button
                type="button"
                onClick={() => setNewCategory('')}
                style={{
                  border: 'none',
                  background: 'none',
                  color: '#D0145C',
                  fontWeight: 600,
                  fontSize: 12,
                  cursor: 'pointer',
                  padding: 0,
                }}
              >
                + New category
              </button>
            ) : (
              <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
                <Field
                  autoFocus
                  value={newCategory}
                  onChange={setNewCategory}
                  placeholder="Category name"
                  onEnter={addCategory}
                  onEscape={() => setNewCategory(null)}
                  onBlur={() => !newCategory.trim() && setNewCategory(null)}
                  style={{ height: 30 }}
                />
                <button
                  type="button"
                  aria-label="Cancel new category"
                  onClick={() => setNewCategory(null)}
                  style={catIcon}
                >
                  <X size={14} />
                </button>
              </div>
            )}
          </div>
        </Col>
        <Col style={{ flex: 1, minWidth: 0, padding: '16px 18px' }}>{list}</Col>
        <Col
          style={{
            width: 360,
            flexShrink: 0,
            padding: '16px 18px',
            background: flash ? '#FDEEF4' : '#FFFCFD',
            transition: 'background .4s',
            borderRight: 'none',
          }}
        >
          {editor}
        </Col>
      </Pane>
    </div>
  );
}
