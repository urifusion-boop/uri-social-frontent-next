/**
 * Campaign Manager — change who an already-running campaign targets.
 *
 * This is the Campaign Management PRD's "Audience or geography edit" row (§19) and
 * nothing else from that document, for a campaign already running on Meta or TikTok
 * (TikTok gained real support 2026-09-25). On Meta: interests, age, gender, placement
 * and locations. On TikTok: locations, age and gender only — no interests/placement
 * equivalent exists there. Budget, schedule, objective and bid strategy are separate
 * action families on both platforms and the API refuses them.
 *
 * Deliberately NOT in Jane's chat. Editing a live ad is an operation on something that
 * already exists and is already spending, not a conversation about something to build.
 *
 * Three things this surface has to be honest about, because the API is:
 *
 * · A delivering ad set loses its learning when targeting changes. We cannot prevent
 *   that, so it is said before the client opens the form, not after they save.
 * · A save is verified by reading the ad set back. Until that returns, nothing claims
 *   success — "submitted" and "in effect" are different states.
 * · If somebody edited the campaign in Ads Manager since this screen loaded, the save
 *   is refused and the client is told to reload. We do not overwrite their work.
 */
import { AlertTriangle, Check, Pencil } from 'lucide-react';
import React, { useCallback, useEffect, useState } from 'react';

const PINK = '#C2185B';

import { CampaignService, PlanField } from '@/src/api/CampaignService';

/** The API's own `detail` carries the useful sentence — a 409 explains that someone
 * edited the campaign elsewhere, and an unknown write says whether it landed. Showing
 * a generic fallback instead would throw away the only thing worth reading. */
function errorText(e: unknown, fallback: string): string {
  const obj = e as { response?: { data?: { detail?: unknown } }; data?: { detail?: unknown } } | null;
  const detail = obj?.response?.data?.detail ?? obj?.data?.detail;
  if (typeof detail === 'string' && detail) return detail;
  if (e instanceof Error && e.message) return e.message;
  return fallback;
}

type Props = {
  campaignId: string;
  campaignName: string;
  /** Which provider this campaign runs on — TikTok gained real live-targeting-edit
   * support 2026-09-25 (location/gender/age only, no interests/placement, which
   * have no TikTok equivalent). Defaults to Meta's wording when omitted, so any
   * existing caller that hasn't been updated to pass this still reads correctly. */
  platform?: 'meta' | 'tiktok';
  onClose: () => void;
  onSaved?: () => void;
};

const LABELS: Record<string, string> = {
  interests: 'the interests',
  gender: 'the gender',
  age_min: 'the minimum age',
  age_max: 'the maximum age',
  placement: 'where it shows',
  locations: 'the locations',
};

function spoken(keys: string[]): string {
  const words = keys.map((k) => LABELS[k] ?? k);
  if (words.length <= 1) return words[0] ?? '';
  return `${words.slice(0, -1).join(', ')} and ${words[words.length - 1]}`;
}

function shown(field: PlanField): string {
  if (Array.isArray(field.value)) return field.value.length ? field.value.join(', ') : '—';
  if (field.option_labels && typeof field.value === 'string') {
    return field.option_labels[field.value] ?? field.value;
  }
  if (field.value === null || field.value === '') return '—';
  return String(field.value);
}

function asText(field: PlanField): string {
  if (Array.isArray(field.value)) return field.value.join(', ');
  return field.value === null ? '' : String(field.value);
}

export default function LiveTargetingEditor({ campaignId, campaignName, platform, onClose, onSaved }: Props) {
  const platformLabel = platform === 'tiktok' ? 'TikTok' : 'Meta';
  const [data, setData] = useState<{
    fields: PlanField[];
    baseline: string;
    delivering: boolean;
    warning: string;
  } | null>(null);
  const [editing, setEditing] = useState<string | null>(null);
  const [draft, setDraft] = useState('');
  const [pending, setPending] = useState<Record<string, unknown>>({});
  const [saving, setSaving] = useState(false);
  const [rejected, setRejected] = useState<string[]>([]);
  const [savedFields, setSavedFields] = useState<string[] | null>(null);
  const [loadError, setLoadError] = useState('');

  const load = useCallback(async () => {
    setLoadError('');
    try {
      const live = await CampaignService.getLiveTargeting(campaignId);
      setData({
        fields: live.fields,
        baseline: live.baseline,
        delivering: live.delivering,
        warning: live.learning_warning,
      });
    } catch (e) {
      setLoadError(errorText(e, `Could not read this campaign from ${platformLabel}.`));
    }
  }, [campaignId, platformLabel]);

  useEffect(() => {
    void load();
  }, [load]);

  const stage = (field: PlanField) => {
    const value =
      field.type === 'list'
        ? draft
            .split(',')
            .map((x) => x.trim())
            .filter(Boolean)
        : draft;
    setPending((prev) => ({ ...prev, [field.key]: value }));
    setData((prev) =>
      prev
        ? {
            ...prev,
            fields: prev.fields.map((f) => (f.key === field.key ? { ...f, value: value as PlanField['value'] } : f)),
          }
        : prev
    );
    setEditing(null);
  };

  const save = async () => {
    if (!data || !Object.keys(pending).length) return;
    setSaving(true);
    setRejected([]);
    setSavedFields(null);
    try {
      const result = await CampaignService.saveLiveTargeting(campaignId, pending, data.baseline);
      setData((prev) => (prev ? { ...prev, fields: result.fields, baseline: result.baseline } : prev));
      setRejected(result.rejected || []);
      setPending({});
      if (result.applied?.length && result.verified) {
        setSavedFields(result.applied);
        onSaved?.();
      }
    } catch (e) {
      // A 409 means someone edited it elsewhere; the message already says to reload.
      setRejected([errorText(e, 'Could not save the change.')]);
      setPending({});
      await load();
    } finally {
      setSaving(false);
    }
  };

  const dirty = Object.keys(pending).length > 0;

  return (
    <div
      style={{ border: '1px solid #e6e6e6', borderRadius: 12, padding: '14px 16px', background: '#fff', marginTop: 10 }}
    >
      <div style={{ display: 'flex', alignItems: 'center', marginBottom: 8 }}>
        <p style={{ margin: 0, fontSize: 13.5, fontWeight: 700, color: '#222' }}>Who this campaign targets</p>
        <button
          type="button"
          onClick={onClose}
          style={{
            marginLeft: 'auto',
            border: 'none',
            background: 'transparent',
            cursor: 'pointer',
            fontSize: 13,
            color: '#888',
          }}
        >
          Close
        </button>
      </div>

      {loadError && <p style={{ margin: '0 0 8px', fontSize: 12.5, color: '#b3261e' }}>{loadError}</p>}

      {data?.delivering && data.warning && (
        <div
          style={{
            background: '#fff8ec',
            border: '1px solid #f0e0c0',
            borderRadius: 8,
            padding: '8px 10px',
            marginBottom: 10,
          }}
        >
          <p
            style={{
              margin: '0 0 3px',
              fontSize: 12,
              fontWeight: 700,
              color: '#8a5a00',
              display: 'flex',
              alignItems: 'center',
              gap: 6,
            }}
          >
            <AlertTriangle size={13} strokeWidth={2.5} style={{ flexShrink: 0 }} />
            <span>This campaign is running right now</span>
          </p>
          <p style={{ margin: 0, fontSize: 11.5, color: '#8a5a00' }}>{data.warning}</p>
          <p style={{ margin: '4px 0 0', fontSize: 11.5, color: '#8a5a00' }}>
            Pausing it first, editing, then resuming avoids paying for that twice.
          </p>
        </div>
      )}

      {savedFields && (
        <div
          style={{
            background: '#f6fbf6',
            border: '1px solid #cde9cd',
            borderRadius: 8,
            padding: '8px 10px',
            marginBottom: 10,
          }}
        >
          <p
            style={{
              margin: 0,
              fontSize: 12.5,
              color: '#2e7d32',
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              gap: 6,
            }}
          >
            <Check size={14} strokeWidth={2.5} style={{ flexShrink: 0 }} />
            <span>
              {spoken(savedFields)} updated on {platformLabel} — checked and confirmed, not just submitted.
            </span>
          </p>
        </div>
      )}

      {!data && !loadError && (
        <p style={{ margin: 0, fontSize: 12.5, color: '#666' }}>Reading the campaign from {platformLabel}…</p>
      )}

      {data?.fields.map((field) => (
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
          <div style={{ width: 128, flexShrink: 0 }}>
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
                ) : (
                  <input
                    value={draft}
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
                    onClick={() => stage(field)}
                    style={{
                      fontSize: 12,
                      padding: '4px 10px',
                      borderRadius: 6,
                      border: 'none',
                      background: PINK,
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
              <span style={{ fontSize: 13, color: '#222', wordBreak: 'break-word' }}>
                {shown(field)}
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
                onClick={() => {
                  setEditing(field.key);
                  setDraft(asText(field));
                  setSavedFields(null);
                }}
                style={{
                  border: 'none',
                  background: 'transparent',
                  cursor: 'pointer',
                  padding: 2,
                  color: '#888',
                  display: 'inline-flex',
                  alignItems: 'center',
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
          <p style={{ margin: '0 0 4px', fontSize: 12, fontWeight: 700, color: '#b3261e' }}>Not changed</p>
          {rejected.map((r) => (
            <p key={r} style={{ margin: '2px 0 0', fontSize: 12, color: '#8a3a33' }}>
              {r}
            </p>
          ))}
        </div>
      )}

      {data && (
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
              background: PINK,
              color: '#fff',
              cursor: dirty && !saving ? 'pointer' : 'default',
              opacity: dirty && !saving ? 1 : 0.45,
            }}
          >
            {saving ? `Applying on ${platformLabel}…` : 'Apply to the live campaign'}
          </button>
          <span style={{ fontSize: 11.5, color: '#888' }}>
            Budget, schedule and objective can&rsquo;t be changed after launch.
          </span>
        </div>
      )}

      <p style={{ margin: '8px 0 0', fontSize: 11, color: '#aaa' }}>{campaignName}</p>
    </div>
  );
}
