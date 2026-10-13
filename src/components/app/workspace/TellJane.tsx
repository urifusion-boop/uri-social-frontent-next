'use client';

import {
  BrandProfileData,
  BrandProfileService,
  PlaybookChangeLog,
  PlaybookFieldChange,
  PlaybookInstruction,
  PlaybookInstructResult,
  PlaybookSuggestion,
} from '@/src/api/BrandProfileService';
import { ToastTypeEnum } from '@/src/models/enum-models/ToastTypeEnum';
import { ToastService } from '@/src/utils/toast.util';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { C, font, GRADIENT, pill, PlaybookPanel, usePanelOpen } from './PlaybookPanel';

/* ── Look ─────────────────────────────────────────────────────────────── */

const OPEN_KEY = 'uri_tell_jane_open';

const EXAMPLES = [
  'Keep my captions short and never use emojis',
  "Always end posts with 'Order on WhatsApp'",
  'Be more formal on LinkedIn',
  "Stop using the word 'amazing'",
  'Mention free delivery in Lekki whenever it fits',
  'Start every caption with a question',
];

const SCOPES: { key: string; label: string; hint: string }[] = [
  { key: 'all', label: 'Everywhere', hint: 'Posts, ads, blog, video and replies' },
  { key: 'posts', label: 'Posts', hint: 'Captions, carousels and your calendar' },
  { key: 'ads', label: 'Ads', hint: 'Ad copy' },
  { key: 'blog', label: 'Blog', hint: 'Blog posts' },
  { key: 'video', label: 'Video', hint: 'Scripts and voice-overs' },
  { key: 'replies', label: 'Replies', hint: 'Answers to customer messages' },
];
const PLATFORM_LABELS: Record<string, string> = {
  instagram: 'Instagram',
  facebook: 'Facebook',
  linkedin: 'LinkedIn',
  twitter: 'X',
  tiktok: 'TikTok',
  pinterest: 'Pinterest',
  youtube: 'YouTube',
};

type Tab = 'tell' | 'remembers' | 'suggestions' | 'history';

const button = (kind: 'primary' | 'ghost' | 'quiet' = 'ghost'): React.CSSProperties => ({
  ...font,
  padding: kind === 'quiet' ? '4px 9px' : '6px 12px',
  borderRadius: 9,
  border: kind === 'primary' ? 'none' : `1px solid ${kind === 'ghost' ? '#F0C9D9' : C.line}`,
  background: kind === 'primary' ? GRADIENT : '#fff',
  color: kind === 'primary' ? '#fff' : kind === 'ghost' ? C.pink : C.muted,
  fontSize: 12,
  fontWeight: 700,
  cursor: 'pointer',
  boxShadow: kind === 'primary' ? '0 4px 14px rgba(194,24,91,.25)' : 'none',
  transition: 'transform .15s ease, box-shadow .15s ease, opacity .15s',
  whiteSpace: 'nowrap',
});

const errorText = (err: unknown, fallback: string): string => {
  const e = err as { response?: { data?: { detail?: string } } };
  return e?.response?.data?.detail || fallback;
};

const when = (iso?: string | null): string => {
  if (!iso) return '';
  const d = new Date(iso.endsWith('Z') ? iso : `${iso}Z`);
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleString(undefined, { day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' });
};

/* ── Small pieces ─────────────────────────────────────────────────────── */

const Avatar = ({ size = 34 }: { size?: number }) => (
  <div
    aria-hidden
    style={{
      width: size,
      height: size,
      borderRadius: '50%',
      background: GRADIENT,
      color: '#fff',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontWeight: 800,
      fontSize: size * 0.42,
      flexShrink: 0,
      boxShadow: '0 0 0 3px #FCE4EC',
      position: 'relative',
    }}
  >
    J
    <span
      style={{
        position: 'absolute',
        right: -1,
        bottom: -1,
        width: size * 0.28,
        height: size * 0.28,
        borderRadius: '50%',
        background: '#22C55E',
        border: '2px solid #fff',
      }}
    />
  </div>
);

const Empty = ({ title, text }: { title: string; text: string }) => (
  <div style={{ textAlign: 'center', padding: '18px 12px', color: C.muted }}>
    <div style={{ fontSize: 13.5, fontWeight: 700, color: C.body, marginBottom: 4 }}>{title}</div>
    <div style={{ fontSize: 12.5, lineHeight: 1.6, maxWidth: 420, margin: '0 auto' }}>{text}</div>
  </div>
);

type Summary = {
  changes: PlaybookFieldChange[];
  added: { id: string; text: string }[];
  removed: { id: string; text: string }[];
};

/** What one update changed: each setting old → new, then what Jane will / no longer remember. */
const ChangeList = ({ r }: { r: Summary }) => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
    {r.changes.map((c) => (
      <div
        key={c.field}
        style={{
          display: 'grid',
          gridTemplateColumns: 'minmax(110px, 160px) 1fr',
          gap: 10,
          alignItems: 'baseline',
          fontSize: 12.5,
        }}
      >
        <span style={{ color: C.muted, fontWeight: 600 }}>{c.label}</span>
        <span style={{ overflowWrap: 'anywhere' }}>
          {c.before !== '—' && (
            <span style={{ color: C.faint, textDecoration: 'line-through', marginRight: 6 }}>{c.before}</span>
          )}
          <span style={pill('#FCE4EC', C.pink)}>{c.after}</span>
        </span>
      </div>
    ))}
    {r.added.map((i) => (
      <div key={i.id} style={{ display: 'flex', gap: 8, fontSize: 12.5, color: C.body, overflowWrap: 'anywhere' }}>
        <span style={pill(C.greenBg, C.green)}>Remembers</span>
        <span>{i.text}</span>
      </div>
    ))}
    {r.removed.map((i) => (
      <div key={i.id} style={{ display: 'flex', gap: 8, fontSize: 12.5, color: C.muted, overflowWrap: 'anywhere' }}>
        <span style={pill(C.redBg, C.red)}>Forgot</span>
        <span style={{ textDecoration: 'line-through' }}>{i.text}</span>
      </div>
    ))}
  </div>
);

/* ── The panel ────────────────────────────────────────────────────────── */

interface Props {
  profile?: BrandProfileData | null;
  onProfileUpdate?: (p: BrandProfileData) => void;
  /** Just the box and the answer — for use next to the content creator. */
  compact?: boolean;
  /** Shown instead of the box, e.g. while the Playbook is being edited by hand. */
  disabledReason?: string;
  source?: 'playbook' | 'create' | 'drafts';
}

/**
 * Jane's Playbook assistant. Collapsed: one bar saying what she remembers and
 * what she's noticed. Expanded: tell her what you want in your own words, see
 * everything she remembers (by where it applies), her suggestions from how you
 * work, and the history of changes — every one undoable.
 */
const TellJane = ({ profile, onProfileUpdate, compact = false, disabledReason, source = 'playbook' }: Props) => {
  const [open, toggle] = usePanelOpen(OPEN_KEY);
  const [tab, setTab] = useState<Tab>('tell');
  const [text, setText] = useState('');
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<PlaybookInstructResult | null>(null);
  const [undone, setUndone] = useState<Record<string, boolean>>({});
  const [instructions, setInstructions] = useState<PlaybookInstruction[]>([]);
  const [history, setHistory] = useState<PlaybookChangeLog[]>([]);
  const [suggestions, setSuggestions] = useState<PlaybookSuggestion[]>([]);
  const [working, setWorking] = useState('');

  const refresh = useCallback(() => {
    if (compact) return;
    BrandProfileService.getInstructions().then((d) => {
      setInstructions(d.instructions);
      setHistory(d.history);
    });
    BrandProfileService.getSuggestions().then(setSuggestions);
  }, [compact]);

  useEffect(() => {
    refresh();
  }, [refresh, profile?.playbook_instructions]);

  const grouped = useMemo(
    () =>
      SCOPES.map((s) => ({
        ...s,
        items: instructions.filter((i) => (i.applies_to?.length ? i.applies_to : ['posts']).includes(s.key)),
      })).filter((g) => g.items.length > 0),
    [instructions]
  );

  const submit = async () => {
    const said = text.trim();
    if (said.length < 3 || busy) return;
    setBusy(true);
    setResult(null);
    try {
      const r = await BrandProfileService.instruct(said, source);
      setResult(r);
      if (r.change_id) {
        onProfileUpdate?.(r.profile);
        setText('');
        refresh();
      }
    } catch (err) {
      ToastService.showToast(errorText(err, 'Jane could not update your Playbook. Try again.'), ToastTypeEnum.Error);
    } finally {
      setBusy(false);
    }
  };

  const undo = async (changeId: string) => {
    setWorking(changeId);
    try {
      const r = await BrandProfileService.undoInstruct(changeId);
      onProfileUpdate?.(r.profile);
      setUndone((u) => ({ ...u, [changeId]: true }));
      ToastService.showToast(
        r.skipped.length ? 'Undone — except settings you changed again since.' : 'Undone — back as it was.',
        ToastTypeEnum.Success
      );
      refresh();
    } catch (err) {
      ToastService.showToast(errorText(err, 'Could not undo that change.'), ToastTypeEnum.Error);
    } finally {
      setWorking('');
    }
  };

  const forget = async (i: PlaybookInstruction) => {
    setWorking(i.id);
    try {
      const left = await BrandProfileService.deleteInstruction(i.id);
      setInstructions(left);
      if (profile) onProfileUpdate?.({ ...profile, playbook_instructions: left });
    } catch (err) {
      ToastService.showToast(errorText(err, 'Could not remove it.'), ToastTypeEnum.Error);
    } finally {
      setWorking('');
    }
  };

  const applySuggestion = async (s: PlaybookSuggestion) => {
    setWorking(s.id);
    try {
      const res = await BrandProfileService.applySuggestion(s.id);
      if (res.status && res.responseData) {
        onProfileUpdate?.(res.responseData);
        ToastService.showToast('Playbook updated', ToastTypeEnum.Success);
      }
    } catch (err) {
      ToastService.showToast(errorText(err, 'Could not apply it.'), ToastTypeEnum.Error);
    } finally {
      setWorking('');
      refresh();
    }
  };

  const dismissSuggestion = async (s: PlaybookSuggestion) => {
    setWorking(s.id);
    try {
      await BrandProfileService.dismissSuggestion(s.id);
      setSuggestions((prev) => prev.filter((x) => x.id !== s.id));
    } catch {
      ToastService.showToast('Could not dismiss it.', ToastTypeEnum.Error);
    } finally {
      setWorking('');
    }
  };

  /* ── Composer + Jane's answer (shared by both modes) ── */
  const composer = disabledReason ? (
    <div
      style={{
        ...font,
        fontSize: 12.5,
        color: C.amber,
        background: C.amberBg,
        border: '1px solid #FDE68A',
        borderRadius: 10,
        padding: '10px 12px',
      }}
    >
      {disabledReason}
    </div>
  ) : (
    <div>
      <div
        style={{
          position: 'relative',
          borderRadius: 14,
          background: '#fff',
          border: `1.5px solid ${text ? '#F0C9D9' : C.line}`,
          boxShadow: text ? '0 0 0 4px rgba(194,24,91,.06)' : 'none',
          transition: 'border-color .2s, box-shadow .2s',
        }}
      >
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) submit();
          }}
          maxLength={2000}
          rows={2}
          placeholder={`Tell Jane what you want… e.g. "${EXAMPLES[0]}. On LinkedIn be more formal."`}
          aria-label="Tell Jane what you want"
          style={{
            ...font,
            width: '100%',
            boxSizing: 'border-box',
            padding: '10px 12px 40px',
            border: 'none',
            borderRadius: 14,
            fontSize: 13,
            lineHeight: 1.5,
            resize: 'vertical',
            outline: 'none',
            background: 'transparent',
            color: C.ink,
          }}
        />
        <div
          style={{
            position: 'absolute',
            left: 14,
            right: 10,
            bottom: 8,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 8,
            pointerEvents: 'none',
          }}
        >
          <span style={{ fontSize: 11, color: C.faint }}>
            {text.length > 0 ? `${text.length}/2000` : ''}
            <span className="pb-wide">{text.length > 0 ? ' · ' : ''}Ctrl + Enter</span>
          </span>
          <button
            type="button"
            onClick={submit}
            disabled={busy || text.trim().length < 3}
            style={{
              ...button('primary'),
              pointerEvents: 'auto',
              opacity: busy || text.trim().length < 3 ? 0.55 : 1,
              cursor: busy || text.trim().length < 3 ? 'default' : 'pointer',
            }}
          >
            {busy ? 'Updating…' : 'Update Playbook'}
          </button>
        </div>
      </div>
      {!compact && !text && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 10, alignItems: 'center' }}>
          <span style={{ fontSize: 11.5, color: C.faint, fontWeight: 600, marginRight: 2 }}>Try</span>
          {EXAMPLES.map((ex) => (
            <button
              key={ex}
              type="button"
              onClick={() => setText(ex)}
              style={{
                ...font,
                padding: '3px 9px',
                borderRadius: 999,
                border: `1px solid ${C.line}`,
                background: '#fff',
                color: C.body,
                fontSize: 11,
                cursor: 'pointer',
              }}
            >
              {ex}
            </button>
          ))}
        </div>
      )}
    </div>
  );

  const answer = result && (
    <div style={{ display: 'flex', gap: 10, marginTop: 12, alignItems: 'flex-start' }} role="status">
      <Avatar size={28} />
      <div
        style={{
          flex: 1,
          minWidth: 0,
          background: result.change_id ? '#fff' : C.soft,
          border: `1px solid ${result.change_id ? '#D1FAE5' : C.line}`,
          borderRadius: '4px 14px 14px 14px',
          padding: '9px 12px',
        }}
      >
        <div style={{ fontSize: 13, color: C.ink, lineHeight: 1.55, marginBottom: result.change_id ? 10 : 0 }}>
          {result.reply}
        </div>
        {result.change_id && <ChangeList r={result} />}
        {result.change_id && (
          <div style={{ marginTop: 10, display: 'flex', gap: 8, alignItems: 'center' }}>
            {undone[result.change_id] ? (
              <span style={pill('#F3F4F6', C.muted)}>Undone</span>
            ) : (
              <button
                type="button"
                style={button('quiet')}
                disabled={working === result.change_id}
                onClick={() => undo(result.change_id as string)}
              >
                {working === result.change_id ? 'Undoing…' : 'Undo'}
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );

  /* ── Compact: just the composer, for the content creator ── */
  if (compact) {
    return (
      <div
        style={{
          ...font,
          background: '#fff',
          borderRadius: 14,
          border: `1px solid ${C.line}`,
          padding: 14,
          marginBottom: 16,
        }}
      >
        <div style={{ display: 'flex', gap: 10, alignItems: 'center', marginBottom: 10 }}>
          <Avatar size={28} />
          <div>
            <div style={{ fontSize: 13, fontWeight: 800, color: C.ink }}>Tell Jane how you want your posts</div>
            <div style={{ fontSize: 11.5, color: C.muted }}>Saved to your Brand Playbook and used from now on.</div>
          </div>
        </div>
        {composer}
        {answer}
      </div>
    );
  }

  /* ── Full panel ── */
  const tabs: { key: Tab; label: string; count?: number }[] = [
    { key: 'tell', label: 'Tell Jane' },
    { key: 'remembers', label: 'Remembers', count: instructions.length },
    { key: 'suggestions', label: 'Suggestions', count: suggestions.length },
    { key: 'history', label: 'History', count: history.length },
  ];

  const summary = [
    instructions.length ? `Remembering ${instructions.length} instruction${instructions.length === 1 ? '' : 's'}` : '',
    history[0] ? `last change ${when(history[0].created_at)}` : '',
  ]
    .filter(Boolean)
    .join(' · ');

  return (
    <PlaybookPanel
      id="tell-jane-panel"
      open={open}
      onToggle={toggle}
      icon={<Avatar size={32} />}
      title="Tell Jane what you want"
      tags={
        <span className="pb-wide" style={pill('#FCE4EC', C.pink)}>
          AI
        </span>
      }
      subtitle={summary || 'Describe it in your own words — Jane updates your Playbook and remembers it everywhere.'}
      badges={
        suggestions.length > 0 && (
          <span
            title={`${suggestions.length} suggestion${suggestions.length === 1 ? '' : 's'} from Jane`}
            style={{ ...pill(C.amberBg, C.amber), border: '1px solid #FDE68A', flexShrink: 0 }}
          >
            {suggestions.length}
            <span className="pb-wide">&nbsp;suggestion{suggestions.length === 1 ? '' : 's'}</span>
          </span>
        )
      }
    >
      {/* Tabs */}
      <div
        role="tablist"
        aria-label="Jane"
        style={{
          display: 'flex',
          gap: 4,
          padding: 4,
          margin: '10px 0 12px',
          background: '#F6F3F1',
          borderRadius: 11,
          overflowX: 'auto',
          width: 'fit-content',
          maxWidth: '100%',
        }}
      >
        {tabs.map((t) => {
          const active = tab === t.key;
          return (
            <button
              key={t.key}
              type="button"
              role="tab"
              aria-selected={active}
              onClick={() => setTab(t.key)}
              style={{
                ...font,
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                padding: '5px 11px',
                borderRadius: 7,
                border: 'none',
                background: active ? '#fff' : 'transparent',
                color: active ? C.ink : C.muted,
                fontSize: 12.5,
                fontWeight: 700,
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                boxShadow: active ? '0 1px 4px rgba(17,24,39,.08)' : 'none',
              }}
            >
              {t.label}
              {!!t.count && (
                <span
                  style={{
                    ...pill(active ? '#FCE4EC' : '#ECE8E5', active ? C.pink : C.muted),
                    padding: '0 7px',
                  }}
                >
                  {t.count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Tell Jane */}
      {tab === 'tell' && (
        <div role="tabpanel">
          {composer}
          {answer}
        </div>
      )}

      {/* Remembers — grouped by where it applies */}
      {tab === 'remembers' && (
        <div role="tabpanel">
          {grouped.length === 0 ? (
            <Empty
              title="Nothing remembered yet"
              text="Anything you tell Jane that isn't a Playbook setting — how to start captions, what to always mention, how to sign off replies — is kept here and followed everywhere it applies."
            />
          ) : (
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
                gap: 10,
              }}
            >
              {grouped.map((g) => (
                <div key={g.key} style={{ border: `1px solid ${C.line}`, borderRadius: 10, padding: '9px 10px 3px' }}>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginBottom: 6 }}>
                    <span style={{ fontSize: 12.5, fontWeight: 800, color: C.ink }}>{g.label}</span>
                    <span style={{ fontSize: 11, color: C.faint }}>{g.hint}</span>
                  </div>
                  {g.items.map((i) => (
                    <div
                      key={`${g.key}-${i.id}`}
                      style={{
                        display: 'flex',
                        gap: 8,
                        alignItems: 'flex-start',
                        padding: '8px 0',
                        borderTop: `1px solid ${C.line}`,
                      }}
                    >
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 13, color: C.body, lineHeight: 1.5, overflowWrap: 'anywhere' }}>
                          {i.text}
                        </div>
                        {(i.platforms ?? []).length > 0 && (
                          <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', marginTop: 4 }}>
                            {(i.platforms ?? []).map((p) => (
                              <span key={p} style={pill('#FCE4EC', C.pink)}>
                                {PLATFORM_LABELS[p] ?? p}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                      <button
                        type="button"
                        aria-label={`Stop following: ${i.text}`}
                        title="Stop following this"
                        disabled={working === i.id}
                        onClick={() => forget(i)}
                        style={{
                          border: 'none',
                          background: '#F6F3F1',
                          color: C.muted,
                          width: 24,
                          height: 24,
                          borderRadius: 7,
                          fontSize: 15,
                          lineHeight: '24px',
                          cursor: 'pointer',
                          flexShrink: 0,
                        }}
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Suggestions — "Jane noticed" */}
      {tab === 'suggestions' && (
        <div role="tabpanel">
          {suggestions.length === 0 ? (
            <Empty
              title="No suggestions right now"
              text="Jane watches how you edit her drafts and when your posts do best. When she spots a pattern, she'll suggest a Playbook change here — nothing changes unless you apply it."
            />
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {suggestions.map((s) => (
                <div
                  key={s.id}
                  style={{
                    border: '1px solid #FDE68A',
                    background: 'linear-gradient(180deg, #FFFBEB 0%, #fff 100%)',
                    borderRadius: 12,
                    padding: '12px 14px',
                  }}
                >
                  <div style={{ fontSize: 13.5, fontWeight: 800, color: C.ink }}>{s.title}</div>
                  <div style={{ fontSize: 12.5, color: C.muted, margin: '3px 0 6px', lineHeight: 1.5 }}>
                    {s.evidence}
                  </div>
                  <div style={{ fontSize: 12.5, color: C.body, marginBottom: 10 }}>{s.change}</div>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button
                      type="button"
                      style={button('primary')}
                      disabled={working === s.id}
                      onClick={() => applySuggestion(s)}
                    >
                      {working === s.id ? 'Working…' : 'Apply'}
                    </button>
                    <button
                      type="button"
                      style={button('quiet')}
                      disabled={working === s.id}
                      onClick={() => dismissSuggestion(s)}
                    >
                      Not now
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* History — a timeline, each undoable */}
      {tab === 'history' && (
        <div role="tabpanel">
          {history.length === 0 ? (
            <Empty
              title="No changes yet"
              text="Every update you make by telling Jane shows here, with exactly what changed — and a way to undo it."
            />
          ) : (
            <ol style={{ listStyle: 'none', margin: 0, padding: 0, position: 'relative' }}>
              <span
                aria-hidden
                style={{ position: 'absolute', left: 6, top: 6, bottom: 6, width: 2, background: C.line }}
              />
              {history.map((h) => {
                const isUndone = Boolean(h.undone_at) || undone[h.id];
                return (
                  <li key={h.id} style={{ position: 'relative', paddingLeft: 22, paddingBottom: 12 }}>
                    <span
                      aria-hidden
                      style={{
                        position: 'absolute',
                        left: 1,
                        top: 4,
                        width: 12,
                        height: 12,
                        borderRadius: '50%',
                        background: isUndone ? '#D1D5DB' : GRADIENT,
                        boxShadow: '0 0 0 3px #fff',
                      }}
                    />
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                      <span style={{ fontSize: 11.5, color: C.faint, fontWeight: 600 }}>{when(h.created_at)}</span>
                      {isUndone && <span style={pill('#F3F4F6', C.muted)}>Undone</span>}
                    </div>
                    <div
                      style={{
                        fontSize: 13,
                        color: C.ink,
                        fontWeight: 600,
                        margin: '3px 0 8px',
                        overflowWrap: 'anywhere',
                        opacity: isUndone ? 0.6 : 1,
                      }}
                    >
                      “{h.text}”
                    </div>
                    <div
                      style={{
                        background: C.soft,
                        border: `1px solid ${C.line}`,
                        borderRadius: 10,
                        padding: '10px 12px',
                        opacity: isUndone ? 0.6 : 1,
                      }}
                    >
                      <ChangeList r={h} />
                    </div>
                    {!isUndone && (
                      <button
                        type="button"
                        style={{ ...button('quiet'), marginTop: 8 }}
                        disabled={working === h.id}
                        onClick={() => undo(h.id)}
                      >
                        {working === h.id ? 'Undoing…' : 'Undo'}
                      </button>
                    )}
                  </li>
                );
              })}
            </ol>
          )}
        </div>
      )}
    </PlaybookPanel>
  );
};

export default TellJane;
