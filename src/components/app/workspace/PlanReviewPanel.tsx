/**
 * The review step — the plan as lines a client can edit before their money moves.
 *
 * Until this existed, everything Jane decided was take-it-or-leave-it: the only way to
 * change one line was to argue with her in prose and hope the rest came back the same.
 * Each line here carries a pencil; you change it, save, and THAT is what launches.
 *
 * Two deliberate behaviours:
 *
 * · Derived lines (daily spend, destination) render without a pencil. They follow from
 *   other fields, and offering an edit we would silently ignore is its own kind of lie.
 *
 * · A rejected edit never discards the ones that were fine. The backend validates each
 *   field against the same machinery the launch uses and returns rejections per field,
 *   so a mistyped location cannot throw away a caption the client just wrote.
 */
import { Check, Pencil } from 'lucide-react';
import React, { useCallback, useEffect, useState } from 'react';

import { CampaignService, PlanField } from '@/src/api/CampaignService';

type Props = {
  planId: string;
  /** Hands the caller the refreshed plan payload so the card above can stop showing
   * Jane's original numbers once the client has changed them. */
  onSaved?: (refreshed: { plan_edited?: boolean; plan?: unknown; creative?: unknown; summary?: unknown }) => void;
  /** Unsaved edits mean the STORED plan is still Jane's — launching now would run the
   * un-edited ad while the panel shows the client's changes. The caller gates the
   * launch button on this. */
  onDirtyChange?: (dirty: boolean) => void;
};

const CARD: React.CSSProperties = {
  background: '#fff',
  border: '1px solid #e6e6e6',
  borderRadius: 12,
  padding: '14px 16px',
};

const FIELD_WORDS: Record<string, string> = {
  headline: 'the headline',
  caption: 'the caption',
  locations: 'the locations',
  interests: 'the interests',
  gender: 'the gender',
  placement: 'where it shows',
  age_min: 'the minimum age',
  age_max: 'the maximum age',
  budget_ngn: 'the budget',
  days: 'the duration',
};

/** "the caption and the budget", "the caption, the budget and the duration" — Jane
 * says what she changed in words, not as a list of field keys. */
function spokenList(keys: string[]): string {
  const words = keys.map((k) => FIELD_WORDS[k] ?? k);
  if (words.length <= 1) return words[0] ?? '';
  return `${words.slice(0, -1).join(', ')} and ${words[words.length - 1]}`;
}

function displayValue(field: PlanField): string {
  if (Array.isArray(field.value)) return field.value.length ? field.value.join(', ') : '—';
  if (field.option_labels && typeof field.value === 'string') {
    return field.option_labels[field.value] ?? field.value;
  }
  if (field.value === null || field.value === '') return '—';
  const raw = typeof field.value === 'number' ? field.value.toLocaleString() : String(field.value);
  return field.prefix ? `${field.prefix}${raw}` : raw;
}

function toEditText(field: PlanField): string {
  if (Array.isArray(field.value)) return field.value.join(', ');
  return field.value === null ? '' : String(field.value);
}

function parseEdit(field: PlanField, text: string): unknown {
  if (field.type === 'list') {
    return text
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);
  }
  if (field.type === 'number') return text.trim();
  return text;
}

export default function PlanReviewPanel({ planId, onSaved, onDirtyChange }: Props) {
  const [fields, setFields] = useState<PlanField[] | null>(null);
  const [editing, setEditing] = useState<string | null>(null);
  const [draft, setDraft] = useState('');
  const [pending, setPending] = useState<Record<string, unknown>>({});
  const [saving, setSaving] = useState(false);
  const [rejected, setRejected] = useState<string[]>([]);
  // After a save the panel steps OUT of the form and back into the conversation:
  // Jane reports what she rebuilt and asks what's next, rather than silently
  // updating a form the client then has to re-read to find their own changes.
  const [justSaved, setJustSaved] = useState<string[] | null>(null);
  const [loadError, setLoadError] = useState('');

  const load = useCallback(async () => {
    try {
      const data = await CampaignService.getPlanFields(planId);
      setFields(data.fields);
      setLoadError('');
    } catch {
      setLoadError('Could not load the ad details. You can still launch the plan as Jane built it.');
    }
  }, [planId]);

  useEffect(() => {
    void load();
  }, [load]);

  // Live-caught 2026-09-22: this was declared AFTER the loadError/!fields early
  // returns below, so React saw 7 hooks called while still loading (fields ===
  // null) and 8 once it resolved — a hook-count mismatch between renders, which
  // React hard-crashes on (error #310) rather than warns about. Every hook must
  // run unconditionally, before any early return; harmless to compute `dirty`
  // against the initial empty `pending` on the first render (dirty === false).
  const dirty = Object.keys(pending).length > 0;

  useEffect(() => {
    onDirtyChange?.(dirty);
  }, [dirty, onDirtyChange]);

  const startEdit = (field: PlanField) => {
    setEditing(field.key);
    setDraft(toEditText(field));
    setJustSaved(null);
  };

  const stageEdit = (field: PlanField) => {
    setPending((prev) => ({ ...prev, [field.key]: parseEdit(field, draft) }));
    // Optimistic only in the panel — nothing is committed until Save.
    setFields((prev) =>
      prev
        ? prev.map((f) =>
            f.key === field.key
              ? {
                  ...f,
                  value: (field.type === 'list'
                    ? draft
                        .split(',')
                        .map((s) => s.trim())
                        .filter(Boolean)
                    : draft) as PlanField['value'],
                }
              : f
          )
        : prev
    );
    setEditing(null);
  };

  const save = async () => {
    if (!Object.keys(pending).length) return;
    setSaving(true);
    setRejected([]);
    setJustSaved(null);
    try {
      const result = await CampaignService.savePlanFields(planId, pending);
      setFields(result.fields);
      setRejected(result.rejected || []);
      setPending({});
      if (result.applied?.length) {
        setJustSaved(result.applied);
        onSaved?.({
          plan_edited: result.plan_edited,
          plan: result.plan,
          creative: result.creative,
          summary: result.summary,
        });
      }
    } catch {
      setRejected(['Could not save those changes. Nothing was changed.']);
      // Re-read rather than trusting the optimistic values we just showed.
      await load();
      setPending({});
    } finally {
      setSaving(false);
    }
  };

  if (loadError) {
    return (
      <div style={{ ...CARD, borderColor: '#f0d2a8', background: '#fffaf2' }}>
        <p style={{ margin: 0, fontSize: 12.5, color: '#8a5a00' }}>{loadError}</p>
      </div>
    );
  }
  if (!fields) {
    return (
      <div style={CARD}>
        <p style={{ margin: 0, fontSize: 12.5, color: '#666' }}>Loading the ad details…</p>
      </div>
    );
  }

  if (justSaved) {
    return (
      <div style={{ ...CARD, borderColor: '#cde9cd', background: '#f6fbf6' }}>
        <p style={{ margin: '0 0 6px', fontSize: 13.5, fontWeight: 700, color: '#2e7d32', display: 'flex', alignItems: 'center', gap: 6 }}>
          <Check size={15} strokeWidth={2.5} style={{ flexShrink: 0 }} />
          <span>Rebuilt with your changes</span>
        </p>
        <p style={{ margin: '0 0 4px', fontSize: 12.5, color: '#33691e' }}>
          {/* Explicit {' '} — JSX drops the whitespace between an expression and the
              text after it once the line wraps, which ran the words together. */}
          I&rsquo;ve redone the plan using{' '}
          {spokenList(justSaved)}{' '}
          you changed. The reasoning and the reach estimate above are recalculated from
          your version — that&rsquo;s the ad that will run.
        </p>
        <p style={{ margin: '0 0 12px', fontSize: 12.5, color: '#33691e' }}>
          Want to change anything else, or shall we launch it?
        </p>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <button
            type="button"
            onClick={() => setJustSaved(null)}
            style={{
              fontSize: 13,
              fontWeight: 700,
              padding: '7px 14px',
              borderRadius: 8,
              border: '1px solid #cde9cd',
              background: '#fff',
              color: '#2e7d32',
              cursor: 'pointer',
            }}
          >
            Change something else
          </button>
          <span style={{ fontSize: 11.5, color: '#5a7a4a', alignSelf: 'center' }}>
            …or use the launch button above when you&rsquo;re happy.
          </span>
        </div>
      </div>
    );
  }

  return (
    <div style={CARD}>
      <p style={{ margin: '0 0 2px', fontSize: 13.5, fontWeight: 700, color: '#222' }}>
        Check the ad before it goes live
      </p>
      <p style={{ margin: '0 0 12px', fontSize: 12, color: '#666' }}>
        Change anything here and press Save. What you save is exactly what runs.
      </p>

      {fields.map((field) => (
        <div
          key={field.key}
          style={{
            display: 'flex',
            alignItems: 'flex-start',
            gap: 10,
            padding: '9px 0',
            borderTop: '1px solid #f2f2f2',
          }}
        >
          <div style={{ width: 132, flexShrink: 0 }}>
            <span style={{ fontSize: 12, color: '#666', fontWeight: 600 }}>{field.label}</span>
          </div>

          <div style={{ flex: 1, minWidth: 0 }}>
            {editing === field.key ? (
              <div>
                {field.type === 'select' ? (
                  <select
                    value={draft}
                    onChange={(e) => setDraft(e.target.value)}
                    style={{
                      width: '100%',
                      fontSize: 13,
                      padding: '6px 8px',
                      borderRadius: 7,
                      border: '1px solid #ccc',
                    }}
                  >
                    {(field.options || []).map((opt) => (
                      <option key={opt} value={opt}>
                        {field.option_labels?.[opt] ?? opt}
                      </option>
                    ))}
                  </select>
                ) : field.type === 'textarea' ? (
                  <textarea
                    value={draft}
                    maxLength={field.max_length}
                    onChange={(e) => setDraft(e.target.value)}
                    rows={3}
                    style={{
                      width: '100%',
                      fontSize: 13,
                      padding: '6px 8px',
                      borderRadius: 7,
                      border: '1px solid #ccc',
                      resize: 'vertical',
                    }}
                  />
                ) : (
                  <input
                    value={draft}
                    maxLength={field.max_length}
                    onChange={(e) => setDraft(e.target.value)}
                    style={{
                      width: '100%',
                      fontSize: 13,
                      padding: '6px 8px',
                      borderRadius: 7,
                      border: '1px solid #ccc',
                    }}
                  />
                )}
                {field.help && <p style={{ margin: '4px 0 0', fontSize: 11, color: '#888' }}>{field.help}</p>}
                <div style={{ display: 'flex', gap: 8, marginTop: 6 }}>
                  <button
                    type="button"
                    onClick={() => stageEdit(field)}
                    style={{
                      fontSize: 12,
                      padding: '4px 10px',
                      borderRadius: 6,
                      border: 'none',
                      background: '#222',
                      color: '#fff',
                      cursor: 'pointer',
                    }}
                  >
                    Done
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditing(null)}
                    style={{
                      fontSize: 12,
                      padding: '4px 10px',
                      borderRadius: 6,
                      border: '1px solid #ddd',
                      background: '#fff',
                      color: '#555',
                      cursor: 'pointer',
                    }}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <span
                style={{
                  fontSize: 13,
                  color: field.editable ? '#222' : '#888',
                  wordBreak: 'break-word',
                }}
              >
                {displayValue(field)}
                {pending[field.key] !== undefined && (
                  <em style={{ marginLeft: 6, fontSize: 11, color: '#a15c00', fontStyle: 'normal' }}>unsaved</em>
                )}
              </span>
            )}
          </div>

          <div style={{ width: 26, flexShrink: 0, textAlign: 'right' }}>
            {field.editable && editing !== field.key && (
              <button
                type="button"
                aria-label={`Edit ${field.label}`}
                title={`Edit ${field.label}`}
                onClick={() => startEdit(field)}
                style={{
                  border: 'none',
                  background: 'transparent',
                  cursor: 'pointer',
                  fontSize: 13,
                  padding: 2,
                  color: '#888',
                }}
              >
                <Pencil size={13} strokeWidth={2} />
              </button>
            )}
          </div>
        </div>
      ))}

      {rejected.length > 0 && (
        <div
          style={{
            marginTop: 10,
            background: '#fff5f5',
            border: '1px solid #f3cccc',
            borderRadius: 8,
            padding: '8px 10px',
          }}
        >
          <p style={{ margin: '0 0 4px', fontSize: 12, fontWeight: 700, color: '#b3261e' }}>Not saved</p>
          {rejected.map((reason) => (
            <p key={reason} style={{ margin: '2px 0 0', fontSize: 12, color: '#8a3a33' }}>
              {reason}
            </p>
          ))}
        </div>
      )}

      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 12 }}>
        <button
          type="button"
          onClick={() => void save()}
          disabled={!dirty || saving}
          style={{
            fontSize: 13,
            fontWeight: 700,
            padding: '7px 16px',
            borderRadius: 8,
            border: 'none',
            background: '#222',
            color: '#fff',
            cursor: dirty && !saving ? 'pointer' : 'default',
            opacity: dirty && !saving ? 1 : 0.45,
          }}
        >
          {saving ? 'Checking with Meta…' : 'Save changes'}
        </button>
        {dirty && !saving && (
          <span style={{ fontSize: 11.5, color: '#a15c00' }}>
            You have unsaved edits — they will not launch until you save.
          </span>
        )}
      </div>
    </div>
  );
}
