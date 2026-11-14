'use client';

import { trackEvent } from '@/lib/analytics';
import { BrandIntelService, Finding, FindingValue, WebsiteRead } from '@/src/api/BrandIntelService';
import type { BrandProfileData } from '@/src/api/BrandProfileService';
import { C, font, GRADIENT, pill } from '@/src/components/app/workspace/PlaybookPanel';
import { useMemo, useState } from 'react';
import { errorText } from './useWebsiteRead';

type Mode = 'onboarding' | 'sheet';

interface Props {
  read: WebsiteRead;
  mode: Mode;
  onApplied: (updates: Partial<BrandProfileData>, applied: string[]) => void;
  onSkip?: () => void;
  skipLabel?: string;
}

const SECTION_ORDER = ['Brand Identity', 'Business Details', 'Audience', 'Brand Voice', 'Brand Colors', 'Language & Region'];
const NETWORK_LABELS: Record<string, string> = {
  instagram: 'Instagram',
  facebook: 'Facebook',
  tiktok: 'TikTok',
  x: 'X',
  linkedin: 'LinkedIn',
  youtube: 'YouTube',
  whatsapp: 'WhatsApp',
};

/**
 * What Jane found on the website, laid out like the Playbook. Every value says where it came
 * from. New findings start ticked; anything that would change what the owner already wrote starts
 * unticked, so nothing of theirs is replaced unless they choose it. Lists and links are added to
 * what's there, never replacing it.
 */
export default function WebsiteFindings({ read, mode, onApplied, onSkip, skipLabel }: Props) {
  const all = useMemo(() => read.findings ?? [], [read.findings]);
  const actionable = all.filter((f) => f.status !== 'same');
  const matching = all.filter((f) => f.status === 'same');
  const [selected, setSelected] = useState<Set<string>>(
    () => new Set(all.filter((f) => f.selected || (mode === 'onboarding' && f.status === 'different')).map((f) => f.key))
  );
  const [edits, setEdits] = useState<Record<string, string>>({});
  const [editing, setEditing] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [showMatching, setShowMatching] = useState(false);

  const sections = useMemo(() => {
    const by: Record<string, Finding[]> = {};
    for (const f of actionable) (by[f.section] ??= []).push(f);
    return Object.entries(by).sort(
      ([a], [b]) =>
        (SECTION_ORDER.indexOf(a) + 1 || 99) - (SECTION_ORDER.indexOf(b) + 1 || 99)
    );
  }, [actionable]);

  const toggle = (key: string) =>
    setSelected((s) => {
      const n = new Set(s);
      if (n.has(key)) n.delete(key);
      else n.add(key);
      return n;
    });

  const chosen = actionable.filter((f) => selected.has(f.key)).map((f) => f.key);
  const guesses = actionable.filter((f) => f.basis === 'inferred' && selected.has(f.key)).length;

  const apply = async () => {
    if (!read.job_id) return;
    if (!chosen.length) {
      onSkip?.();
      return;
    }
    setSaving(true);
    setError('');
    try {
      const out = await BrandIntelService.apply(
        read.job_id,
        chosen,
        Object.fromEntries(Object.entries(edits).filter(([k]) => chosen.includes(k)))
      );
      trackEvent('website_read_applied', {
        applied: out.applied.length,
        offered: actionable.length,
        edited: Object.keys(edits).filter((k) => chosen.includes(k)).length,
        guesses_kept: guesses,
        guesses_unticked: actionable.filter((f) => f.basis === 'inferred' && !selected.has(f.key)).length,
      });
      onApplied(out.profile_updates, out.applied);
    } catch (e) {
      setError(errorText(e, "We couldn't save that to your Playbook. Your choices are still here — try again."));
    } finally {
      setSaving(false);
    }
  };

  if (!actionable.length) {
    return (
      <div style={{ ...font, display: 'flex', flexDirection: 'column', gap: 12 }}>
        <div style={{ fontSize: 15, fontWeight: 700, color: C.ink }}>
          {all.length ? 'Your Playbook already matches your website.' : "We couldn't find business details on your website."}
        </div>
        <div style={{ fontSize: 13, color: C.muted }}>
          {all.length
            ? `Everything we found (${all.length} things) is already in your Playbook.`
            : 'It may be mostly images, or very short. You can fill your Playbook in a few short steps instead.'}
        </div>
        {onSkip && (
          <div>
            <button type="button" onClick={onSkip} style={primaryBtn(false)}>
              {skipLabel ?? 'Continue'}
            </button>
          </div>
        )}
      </div>
    );
  }

  return (
    <div style={{ ...font, display: 'flex', flexDirection: 'column', gap: 14 }}>
      <div style={{ fontSize: 13, color: C.muted }}>
        Found {all.length} things on {read.site ?? 'your website'}.
        {mode === 'sheet' && ' Tap anything to change it. Nothing in your Playbook changes until you press Use.'}
      </div>

      {sections.map(([section, items]) => (
        <div key={section} style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <div style={{ fontSize: 10.5, fontWeight: 800, letterSpacing: '.1em', textTransform: 'uppercase', color: C.pink }}>
            {section}
          </div>
          {items.map((f) => (
            <FindingRow
              key={f.key}
              f={f}
              on={selected.has(f.key)}
              onToggle={() => toggle(f.key)}
              edit={edits[f.key]}
              editing={editing === f.key}
              onEdit={() => setEditing(f.key)}
              onEditDone={(v) => {
                setEditing(null);
                if (v !== undefined) {
                  setEdits((e) => ({ ...e, [f.key]: v }));
                  setSelected((s) => new Set(s).add(f.key));
                }
              }}
            />
          ))}
        </div>
      ))}

      {matching.length > 0 && (
        <div>
          <button
            type="button"
            onClick={() => setShowMatching((v) => !v)}
            style={{ ...font, background: 'none', border: 'none', padding: 0, color: C.muted, fontSize: 12.5, cursor: 'pointer' }}
          >
            {showMatching ? '▾' : '▸'} {matching.length} already match your Playbook
          </button>
          {showMatching && (
            <div style={{ marginTop: 6, display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {matching.map((f) => (
                <span key={f.key} style={pill(C.greenBg, C.green)}>
                  ✓ {f.label}
                </span>
              ))}
            </div>
          )}
        </div>
      )}

      {error && (
        <div role="alert" style={{ background: C.amberBg, color: C.amber, borderRadius: 10, padding: '9px 12px', fontSize: 13 }}>
          {error}
        </div>
      )}

      <div
        style={{
          position: 'sticky',
          bottom: 0,
          background: '#fff',
          borderTop: `1px solid ${C.line}`,
          padding: '12px 0 4px',
          display: 'flex',
          gap: 10,
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
        }}
      >
        <div style={{ fontSize: 12.5, color: C.muted }}>
          {chosen.length} selected
          {guesses > 0 && ` · ${guesses} ${guesses === 1 ? 'is a guess' : 'are guesses'} — worth a look`}
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          {onSkip && (
            <button type="button" onClick={onSkip} disabled={saving} style={quietBtn}>
              {skipLabel ?? 'Not now'}
            </button>
          )}
          <button type="button" onClick={apply} disabled={saving} style={primaryBtn(saving)}>
            {saving
              ? 'Saving…'
              : mode === 'onboarding'
                ? chosen.length
                  ? 'Looks right — continue'
                  : 'Continue without these'
                : chosen.length
                  ? `Use ${chosen.length}`
                  : 'Close'}
          </button>
        </div>
      </div>
    </div>
  );
}

function FindingRow({
  f,
  on,
  onToggle,
  edit,
  editing,
  onEdit,
  onEditDone,
}: {
  f: Finding;
  on: boolean;
  onToggle: () => void;
  edit?: string;
  editing: boolean;
  onEdit: () => void;
  onEditDone: (v?: string) => void;
}) {
  const [draft, setDraft] = useState(typeof f.found === 'string' ? (edit ?? f.found) : '');
  const editable = typeof f.found === 'string' && f.key !== 'website' && f.key !== 'logo_url';
  const shown: FindingValue = edit ?? f.found;

  return (
    <div
      style={{
        border: `1.5px solid ${on ? '#F0C9D9' : C.line}`,
        background: on ? '#fff' : C.soft,
        borderRadius: 12,
        padding: '10px 12px',
        display: 'flex',
        flexDirection: 'column',
        gap: 7,
        transition: 'border-color .15s, background .15s',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, justifyContent: 'space-between', flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0, flexWrap: 'wrap' }}>
          <span style={{ fontSize: 12, fontWeight: 700, color: C.body }}>{f.label}</span>
          {edit !== undefined ? (
            <span style={pill('#FDF2F7', C.pink)}>Your words</span>
          ) : f.basis === 'stated' ? (
            <span style={pill(C.greenBg, C.green)} title={f.page || undefined}>
              From your website
            </span>
          ) : (
            <span style={pill(C.amberBg, C.amber)}>Jane&apos;s guess · check this</span>
          )}
        </div>
        <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: on ? C.pink : C.muted, cursor: 'pointer', fontWeight: 700 }}>
          <input type="checkbox" checked={on} onChange={onToggle} style={{ accentColor: C.pink, width: 16, height: 16 }} />
          {on ? (f.status === 'different' && f.merge ? 'Add' : 'Use') : 'Skip'}
        </label>
      </div>

      {editing ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <textarea
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            rows={Math.min(5, Math.max(2, Math.ceil(draft.length / 60)))}
            autoFocus
            aria-label={`Edit ${f.label}`}
            style={{ ...font, width: '100%', border: `1.5px solid ${C.pink}`, borderRadius: 10, padding: '8px 10px', fontSize: 13.5, color: C.ink, resize: 'vertical' }}
          />
          <div style={{ display: 'flex', gap: 6 }}>
            <button type="button" onClick={() => onEditDone(draft.trim() || undefined)} style={primaryBtn(false, true)}>
              Done
            </button>
            <button type="button" onClick={() => onEditDone(undefined)} style={quietBtn}>
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <div
          onClick={editable ? onEdit : undefined}
          role={editable ? 'button' : undefined}
          tabIndex={editable ? 0 : undefined}
          onKeyDown={(e) => editable && (e.key === 'Enter' || e.key === ' ') && onEdit()}
          title={editable ? 'Tap to change' : undefined}
          style={{ cursor: editable ? 'text' : 'default', fontSize: 13.5, color: C.ink, lineHeight: 1.5 }}
        >
          <Value k={f.key} v={shown} />
        </div>
      )}

      {f.status === 'different' && f.current && (
        <div style={{ fontSize: 12, color: C.muted, lineHeight: 1.45 }}>
          {f.merge ? 'Added to what you have now: ' : 'Yours now: '}
          <span style={{ color: C.body }}>{summary(f.current)}</span>
        </div>
      )}
    </div>
  );
}

function Value({ k, v }: { k: string; v: FindingValue }) {
  if (k === 'logo_url' && typeof v === 'string') {
    return (
      <img
        src={v}
        alt="Logo found on your website"
        style={{ maxWidth: 160, maxHeight: 80, objectFit: 'contain', borderRadius: 8, border: `1px solid ${C.line}`, background: '#fff', padding: 6 }}
      />
    );
  }
  if (k === 'brand_colors' && Array.isArray(v)) {
    return (
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        {v.map((c) => (
          <span key={c} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 12, color: C.muted }}>
            <span style={{ width: 20, height: 20, borderRadius: 6, background: c, border: `1px solid ${C.line}` }} />
            {c}
          </span>
        ))}
      </div>
    );
  }
  if (Array.isArray(v)) {
    return (
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
        {v.map((x) => (
          <span key={x} style={{ background: C.soft, border: `1px solid ${C.line}`, borderRadius: 8, padding: '3px 9px', fontSize: 12.5 }}>
            {x}
          </span>
        ))}
      </div>
    );
  }
  if (v && typeof v === 'object') {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
        {Object.entries(v).map(([net, url]) => (
          <span key={net} style={{ fontSize: 12.5 }}>
            <b>{NETWORK_LABELS[net] ?? net}</b> · <span style={{ color: C.muted }}>{String(url).replace(/^https?:\/\/(www\.)?/, '')}</span>
          </span>
        ))}
      </div>
    );
  }
  return <>{String(v)}</>;
}

function summary(v: FindingValue): string {
  if (Array.isArray(v)) return v.slice(0, 4).join(', ') + (v.length > 4 ? ` +${v.length - 4} more` : '');
  if (v && typeof v === 'object') return Object.keys(v).map((n) => NETWORK_LABELS[n] ?? n).join(', ');
  const s = String(v);
  return s.length > 140 ? `${s.slice(0, 140)}…` : s;
}

const primaryBtn = (busy: boolean, small = false): React.CSSProperties => ({
  ...font,
  border: 'none',
  borderRadius: 20,
  padding: small ? '6px 14px' : '10px 20px',
  background: GRADIENT,
  color: '#fff',
  fontWeight: 700,
  fontSize: small ? 12 : 13.5,
  cursor: busy ? 'default' : 'pointer',
  opacity: busy ? 0.7 : 1,
  boxShadow: '0 4px 14px rgba(194,24,91,.25)',
});

const quietBtn: React.CSSProperties = {
  ...font,
  background: 'none',
  border: 'none',
  color: C.muted,
  fontSize: 13,
  fontWeight: 600,
  cursor: 'pointer',
  padding: '8px 6px',
};
