'use client';

import {
  BrandProfileData,
  BrandProfileService,
  PlaybookChangeLog,
  PlaybookFieldChange,
  PlaybookInstruction,
  PlaybookInstructResult,
} from '@/src/api/BrandProfileService';
import { ToastTypeEnum } from '@/src/models/enum-models/ToastTypeEnum';
import { ToastService } from '@/src/utils/toast.util';
import { useCallback, useEffect, useState } from 'react';

const PINK = '#C2185B';

const EXAMPLES = [
  'Keep my captions short and never use emojis',
  "Always end posts with 'Order on WhatsApp'",
  'Be more formal on LinkedIn',
  "Stop using the word 'amazing'",
  'Mention free delivery in Lekki whenever it fits',
  'Start every caption with a question',
];

const SCOPE_LABELS: Record<string, string> = {
  all: 'Everywhere',
  posts: 'Posts',
  ads: 'Ads',
  blog: 'Blog',
  video: 'Video',
  replies: 'Replies to customers',
};
const PLATFORM_LABELS: Record<string, string> = {
  instagram: 'Instagram',
  facebook: 'Facebook',
  linkedin: 'LinkedIn',
  twitter: 'X',
  tiktok: 'TikTok',
  pinterest: 'Pinterest',
  youtube: 'YouTube',
};

const btn = (primary = false, small = false): React.CSSProperties => ({
  padding: small ? '4px 10px' : '8px 16px',
  borderRadius: 8,
  border: `1.5px solid ${PINK}`,
  background: primary ? PINK : '#fff',
  color: primary ? '#fff' : PINK,
  fontSize: small ? 12 : 13,
  fontWeight: 700,
  cursor: 'pointer',
  fontFamily: 'var(--wf)',
});

const chip: React.CSSProperties = {
  display: 'inline-block',
  padding: '2px 8px',
  borderRadius: 999,
  background: '#F3F4F6',
  color: '#4B5563',
  fontSize: 11,
  fontWeight: 600,
  marginRight: 4,
  marginTop: 4,
};

const errorText = (err: unknown, fallback: string): string => {
  const e = err as { response?: { data?: { detail?: string } } };
  return e?.response?.data?.detail || fallback;
};

const scopeChips = (i: PlaybookInstruction) => (
  <>
    {(i.applies_to?.length ? i.applies_to : ['posts']).map((s) => (
      <span key={s} style={chip}>
        {SCOPE_LABELS[s] ?? s}
      </span>
    ))}
    {(i.platforms ?? []).map((p) => (
      <span key={p} style={{ ...chip, background: '#FCE4EC', color: PINK }}>
        {PLATFORM_LABELS[p] ?? p}
      </span>
    ))}
  </>
);

/** What one update changed, in plain words. */
type Summary = {
  changes: PlaybookFieldChange[];
  added: { id: string; text: string }[];
  removed: { id: string; text: string }[];
};

const ChangeSummary = ({ r }: { r: Summary }) => (
  <div style={{ fontSize: 12.5, color: '#374151' }}>
    {r.changes.map((c) => (
      <div key={c.field} style={{ padding: '3px 0', overflowWrap: 'anywhere' }}>
        <b>{c.label}:</b> <span style={{ color: '#9CA3AF', textDecoration: 'line-through' }}>{c.before}</span> →{' '}
        <span style={{ color: '#111' }}>{c.after}</span>
      </div>
    ))}
    {r.added.map((i) => (
      <div key={i.id} style={{ padding: '3px 0', overflowWrap: 'anywhere' }}>
        <b>Will remember:</b> {i.text}
      </div>
    ))}
    {r.removed.map((i) => (
      <div key={i.id} style={{ padding: '3px 0', color: '#6B7280', overflowWrap: 'anywhere' }}>
        <b>No longer:</b> <span style={{ textDecoration: 'line-through' }}>{i.text}</span>
      </div>
    ))}
  </div>
);

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
 * "Tell Jane": the owner says what they want in their own words; Jane updates
 * the matching Playbook settings and remembers the rest for every post, ad,
 * blog, video and reply from then on. Every update can be undone.
 */
const TellJane = ({ profile, onProfileUpdate, compact = false, disabledReason, source = 'playbook' }: Props) => {
  const [text, setText] = useState('');
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<PlaybookInstructResult | null>(null);
  const [undone, setUndone] = useState<Record<string, boolean>>({});
  const [instructions, setInstructions] = useState<PlaybookInstruction[]>([]);
  const [history, setHistory] = useState<PlaybookChangeLog[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const [working, setWorking] = useState('');

  const refresh = useCallback(() => {
    if (compact) return;
    BrandProfileService.getInstructions().then((d) => {
      setInstructions(d.instructions);
      setHistory(d.history);
    });
  }, [compact]);

  useEffect(() => {
    refresh();
  }, [refresh, profile?.playbook_instructions]);

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
        r.skipped.length
          ? 'Undone — except settings you changed again since.'
          : 'Undone — your Playbook is back as it was.',
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

  return (
    <div
      style={{
        background: '#fff',
        borderRadius: 12,
        border: `1.5px solid ${compact ? '#F3D1DE' : PINK}`,
        padding: compact ? '12px 14px' : '16px 18px',
        marginBottom: compact ? 16 : 12,
      }}
    >
      <div style={{ fontSize: compact ? 13 : 15, fontWeight: 800, color: '#111' }}>Tell Jane what you want</div>
      <div style={{ fontSize: 12.5, color: '#6B7280', margin: '2px 0 10px' }}>
        {compact
          ? 'Say how you want your posts written. Jane saves it to your Brand Playbook and uses it from now on.'
          : 'Describe it in your own words — how your captions should read, what to always or never say, how to sound on each platform. Jane updates your Playbook and remembers it for every post, ad, blog and reply.'}
      </div>

      {disabledReason ? (
        <div style={{ fontSize: 12.5, color: '#92400E', background: '#FFFBEB', borderRadius: 8, padding: '8px 10px' }}>
          {disabledReason}
        </div>
      ) : (
        <>
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) submit();
            }}
            maxLength={2000}
            rows={compact ? 2 : 3}
            placeholder={`e.g. "${EXAMPLES[0]}. On LinkedIn be more formal."`}
            aria-label="Tell Jane what you want"
            style={{
              width: '100%',
              boxSizing: 'border-box',
              padding: '10px 12px',
              borderRadius: 9,
              border: '1.5px solid #e5e3df',
              fontSize: 13.5,
              fontFamily: 'var(--wf)',
              resize: 'vertical',
              outline: 'none',
              background: '#fafaf8',
            }}
          />
          {!compact && !text && (
            <div style={{ marginTop: 4 }}>
              {EXAMPLES.map((ex) => (
                <button
                  key={ex}
                  type="button"
                  onClick={() => setText(ex)}
                  style={{
                    ...chip,
                    border: '1px solid #E5E7EB',
                    background: '#fff',
                    cursor: 'pointer',
                    fontFamily: 'var(--wf)',
                  }}
                >
                  {ex}
                </button>
              ))}
            </div>
          )}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 10, flexWrap: 'wrap' }}>
            <button
              type="button"
              style={{ ...btn(true), opacity: busy || text.trim().length < 3 ? 0.6 : 1 }}
              disabled={busy || text.trim().length < 3}
              onClick={submit}
            >
              {busy ? 'Jane is updating…' : 'Update my Playbook'}
            </button>
            <span style={{ fontSize: 11.5, color: '#9CA3AF' }}>Ctrl + Enter</span>
          </div>
        </>
      )}

      {result && (
        <div
          role="status"
          style={{
            marginTop: 12,
            padding: '10px 12px',
            borderRadius: 9,
            background: result.change_id ? '#F0FDF4' : '#F9FAFB',
            border: `1px solid ${result.change_id ? '#BBF7D0' : '#E5E7EB'}`,
          }}
        >
          <div style={{ fontSize: 13, color: '#111', marginBottom: result.change_id ? 6 : 0 }}>{result.reply}</div>
          {result.change_id && <ChangeSummary r={result} />}
          {result.change_id && (
            <div style={{ marginTop: 8 }}>
              {undone[result.change_id] ? (
                <span style={{ fontSize: 12, color: '#6B7280' }}>Undone.</span>
              ) : (
                <button
                  type="button"
                  style={btn(false, true)}
                  disabled={working === result.change_id}
                  onClick={() => undo(result.change_id as string)}
                >
                  {working === result.change_id ? 'Undoing…' : 'Undo'}
                </button>
              )}
            </div>
          )}
        </div>
      )}

      {!compact && instructions.length > 0 && (
        <div style={{ marginTop: 14 }}>
          <div
            style={{
              fontSize: 11.5,
              fontWeight: 700,
              color: '#6B7280',
              textTransform: 'uppercase',
              letterSpacing: 0.6,
            }}
          >
            Jane remembers ({instructions.length})
          </div>
          {instructions.map((i) => (
            <div
              key={i.id}
              style={{
                display: 'flex',
                gap: 10,
                alignItems: 'flex-start',
                justifyContent: 'space-between',
                padding: '8px 0',
                borderTop: '1px solid #F3F4F6',
              }}
            >
              <div style={{ minWidth: 0 }}>
                <div style={{ fontSize: 13, color: '#111', overflowWrap: 'anywhere' }}>{i.text}</div>
                <div>{scopeChips(i)}</div>
              </div>
              <button
                type="button"
                aria-label={`Stop following: ${i.text}`}
                title="Stop following this"
                disabled={working === i.id}
                onClick={() => forget(i)}
                style={{
                  flexShrink: 0,
                  border: 'none',
                  background: 'none',
                  color: '#9CA3AF',
                  fontSize: 18,
                  lineHeight: 1,
                  cursor: 'pointer',
                  padding: 4,
                }}
              >
                ×
              </button>
            </div>
          ))}
        </div>
      )}

      {!compact && history.length > 0 && (
        <div style={{ marginTop: 10 }}>
          <button
            type="button"
            onClick={() => setShowHistory((v) => !v)}
            style={{
              border: 'none',
              background: 'none',
              padding: 0,
              color: PINK,
              fontSize: 12.5,
              fontWeight: 700,
              cursor: 'pointer',
              fontFamily: 'var(--wf)',
            }}
          >
            {showHistory ? 'Hide recent changes' : `Recent changes (${history.length})`}
          </button>
          {showHistory &&
            history.map((h) => {
              const isUndone = Boolean(h.undone_at) || undone[h.id];
              return (
                <div key={h.id} style={{ padding: '9px 0', borderTop: '1px solid #F3F4F6' }}>
                  <div style={{ fontSize: 12, color: '#9CA3AF' }}>
                    {new Date(h.created_at.endsWith('Z') ? h.created_at : `${h.created_at}Z`).toLocaleString()}
                    {isUndone && ' · undone'}
                  </div>
                  <div
                    style={{
                      fontSize: 13,
                      color: '#111',
                      fontStyle: 'italic',
                      margin: '2px 0 4px',
                      overflowWrap: 'anywhere',
                    }}
                  >
                    “{h.text}”
                  </div>
                  <ChangeSummary r={h} />
                  {!isUndone && (
                    <button
                      type="button"
                      style={{ ...btn(false, true), marginTop: 6 }}
                      disabled={working === h.id}
                      onClick={() => undo(h.id)}
                    >
                      {working === h.id ? 'Undoing…' : 'Undo'}
                    </button>
                  )}
                </div>
              );
            })}
        </div>
      )}
    </div>
  );
};

export default TellJane;
