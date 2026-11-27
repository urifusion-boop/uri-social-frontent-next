'use client';

import { trackEvent } from '@/lib/analytics';
import { BrandIntelService, Finding, FindingValue, WebsiteRead } from '@/src/api/BrandIntelService';
import type { BrandProfileData } from '@/src/api/BrandProfileService';
import { C, font, GRADIENT, pill } from '@/src/components/app/workspace/PlaybookPanel';
import { useMemo, useState } from 'react';
import { getFont, GOOGLE_FONTS_URL } from '@/src/data/fontLibrary';
import { getStyle } from '@/src/data/styleLibrary';
import { errorText } from './useWebsiteRead';

type Mode = 'onboarding' | 'sheet';

interface Props {
  read: WebsiteRead;
  mode: Mode;
  onApplied: (updates: Partial<BrandProfileData>, applied: string[]) => void;
  onSkip?: () => void;
  skipLabel?: string;
}

/** Where a read came from, in words: "your Instagram", "your Facebook Page" or "your website". */
export function readSourceName(read: Pick<WebsiteRead, 'site' | 'url'> | null | undefined): string {
  const where = `${read?.site ?? ''} ${read?.url ?? ''}`.toLowerCase();
  if (where.includes('instagram.com')) return 'your Instagram';
  if (where.includes('facebook.com')) return 'your Facebook Page';
  return 'your website';
}

const SECTION_ORDER = [
  'Brand Identity',
  'Business Details',
  'Audience',
  'Brand Voice',
  'Brand Colors',
  'Visual Style',
  'Typography',
  'Content Strategy',
  'Call to Action',
  'Language & Region',
];
const FONT_KEYS = ['primary_font', 'secondary_font'];
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
  const source = readSourceName(read);
  const actionable = all.filter((f) => f.status !== 'same');
  const matching = all.filter((f) => f.status === 'same');
  const [selected, setSelected] = useState<Set<string>>(
    () =>
      new Set(all.filter((f) => f.selected || (mode === 'onboarding' && f.status === 'different')).map((f) => f.key))
  );
  const [edits, setEdits] = useState<Record<string, FindingValue>>({});
  const [editing, setEditing] = useState<string | null>(null);
  // The words in a box still open for editing. Pressing Use without "Done" keeps them, rather
  // than silently saving Jane's original (found testing on staging 2026-11-15).
  const [openDraft, setOpenDraft] = useState<FindingValue | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [showMatching, setShowMatching] = useState(false);

  const sections = useMemo(() => {
    const by: Record<string, Finding[]> = {};
    for (const f of actionable) (by[f.section] ??= []).push(f);
    return Object.entries(by).sort(
      ([a], [b]) => (SECTION_ORDER.indexOf(a) + 1 || 99) - (SECTION_ORDER.indexOf(b) + 1 || 99)
    );
  }, [actionable]);

  const toggle = (key: string) =>
    setSelected((s) => {
      const n = new Set(s);
      if (n.has(key)) n.delete(key);
      else n.add(key);
      return n;
    });

  const pendingEdit = editing && openDraft !== null && filled(openDraft) ? { [editing]: tidy(openDraft) } : {};
  const allEdits: Record<string, FindingValue> = { ...edits, ...pendingEdit };
  const chosen = actionable.filter((f) => selected.has(f.key) || f.key in pendingEdit).map((f) => f.key);
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
        Object.fromEntries(Object.entries(allEdits).filter(([k]) => chosen.includes(k)))
      );
      trackEvent('website_read_applied', {
        applied: out.applied.length,
        offered: actionable.length,
        edited: Object.keys(allEdits).filter((k) => chosen.includes(k)).length,
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
          {all.length ? `Your Playbook already matches ${source}.` : `We couldn't find business details on ${source}.`}
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
        Found {all.length} things on {read.site ?? source}.
        {mode === 'sheet' && ' Tap anything to change it. Nothing in your Playbook changes until you press Use.'}
      </div>
      <div
        style={{
          fontSize: 12.5,
          color: C.body,
          background: C.soft,
          borderRadius: 10,
          padding: '8px 12px',
          lineHeight: 1.5,
        }}
      >
        <b>Ticked</b> = goes into your Playbook. <b>Unticked</b> = left out
        {actionable.some((f) => f.status === 'different') ? ', and what you have now stays as it is' : ''}.
      </div>

      {sections.map(([section, items]) => (
        <div key={section} style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <div
            style={{
              fontSize: 10.5,
              fontWeight: 800,
              letterSpacing: '.1em',
              textTransform: 'uppercase',
              color: C.pink,
            }}
          >
            {section}
          </div>
          {items.map((f) => (
            <FindingRow
              key={f.key}
              f={f}
              source={source}
              on={selected.has(f.key)}
              onToggle={() => toggle(f.key)}
              edit={edits[f.key]}
              editing={editing === f.key}
              onEdit={() => {
                setEditing(f.key);
                setOpenDraft(null);
              }}
              onDraft={setOpenDraft}
              onEditDone={(v) => {
                setEditing(null);
                setOpenDraft(null);
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
            style={{
              ...font,
              background: 'none',
              border: 'none',
              padding: 0,
              color: C.muted,
              fontSize: 12.5,
              cursor: 'pointer',
            }}
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
        <div
          role="alert"
          style={{ background: C.amberBg, color: C.amber, borderRadius: 10, padding: '9px 12px', fontSize: 13 }}
        >
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
  source,
  on,
  onToggle,
  edit,
  editing,
  onEdit,
  onEditDone,
  onDraft,
}: {
  f: Finding;
  /** "your Instagram", "your Facebook Page" or "your website". */
  source: string;
  on: boolean;
  onToggle: () => void;
  edit?: FindingValue;
  editing: boolean;
  onEdit: () => void;
  onEditDone: (v?: FindingValue) => void;
  /** Every change while editing, so the panel can keep an edit not yet confirmed with Done. */
  onDraft?: (v: FindingValue) => void;
}) {
  const [draft, setDraft] = useState<FindingValue>(() => edit ?? f.found);
  const kind = editorFor(f);
  const editable = kind !== null;
  const shown: FindingValue = edit ?? f.found;
  const change = (v: FindingValue) => {
    setDraft(v);
    onDraft?.(v);
  };

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
            <span style={pill('#FDF2F7', C.pink)}>
              {typeof edit === 'string' && kind === 'text' ? 'Your words' : 'Changed by you'}
            </span>
          ) : f.basis === 'stated' ? (
            <span style={pill(C.greenBg, C.green)} title={f.page || undefined}>
              From {source}
            </span>
          ) : (
            <span style={pill(C.amberBg, C.amber)}>Jane&apos;s guess · check this</span>
          )}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          {editable && !editing && (
            <button
              type="button"
              onClick={onEdit}
              style={{
                ...quietBtn,
                padding: 0,
                fontSize: 12,
                fontWeight: 700,
                color: C.pink,
                textDecoration: 'underline',
                textUnderlineOffset: 3,
              }}
            >
              Edit
            </button>
          )}
          <label
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              fontSize: 12,
              color: on ? C.pink : C.muted,
              cursor: 'pointer',
              fontWeight: 700,
            }}
          >
            <input
              type="checkbox"
              checked={on}
              onChange={onToggle}
              style={{ accentColor: C.pink, width: 16, height: 16 }}
            />
            {f.status === 'different' && f.merge ? 'Add' : 'Use'}
          </label>
        </div>
      </div>

      {editing ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {kind === 'text' && typeof draft === 'string' && (
            <textarea
              value={draft}
              onChange={(e) => change(e.target.value)}
              rows={Math.min(5, Math.max(2, Math.ceil(draft.length / 60)))}
              autoFocus
              aria-label={`Edit ${f.label}`}
              style={{
                ...font,
                width: '100%',
                border: `1.5px solid ${C.pink}`,
                borderRadius: 10,
                padding: '8px 10px',
                fontSize: 13.5,
                color: C.ink,
                resize: 'vertical',
              }}
            />
          )}
          {kind === 'list' && Array.isArray(draft) && (
            <ListEditor label={f.label} items={draft} suggestions={SUGGESTED[f.key] ?? []} onChange={change} />
          )}
          {kind === 'colors' && Array.isArray(draft) && <ColorsEditor colors={draft} onChange={change} />}
          {kind === 'logo' && typeof draft === 'string' && <LogoEditor url={draft} onChange={change} />}
          <div style={{ display: 'flex', gap: 6, alignItems: 'center', flexWrap: 'wrap' }}>
            <button
              type="button"
              disabled={!filled(draft)}
              onClick={() => onEditDone(filled(draft) ? tidy(draft) : undefined)}
              style={{ ...primaryBtn(false, true), opacity: filled(draft) ? 1 : 0.5 }}
            >
              Done
            </button>
            <button type="button" onClick={() => onEditDone(undefined)} style={quietBtn}>
              Cancel
            </button>
            {!filled(draft) && (
              <span style={{ fontSize: 12, color: C.muted }}>Nothing left — untick it instead to leave it out.</span>
            )}
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
          <span style={{ color: C.body }}>{summary(f.current, f.key)}</span>
        </div>
      )}
    </div>
  );
}

type EditorKind = 'text' | 'list' | 'colors' | 'logo';

/** How a suggestion is changed here. Styles and fonts are chosen from a library, in the Playbook's
 * own picker; the website address is what was read. */
function editorFor(f: Finding): EditorKind | null {
  if (f.key === 'website' || f.key === 'style_selections' || FONT_KEYS.includes(f.key)) return null;
  if (f.key === 'logo_url') return typeof f.found === 'string' ? 'logo' : null;
  if (f.key === 'brand_colors') return Array.isArray(f.found) ? 'colors' : null;
  if (Array.isArray(f.found)) return 'list';
  if (typeof f.found === 'string') return 'text';
  return null;
}

/** The Playbook's own options, offered as quick additions while editing a list. */
const SUGGESTED: Record<string, string[]> = {
  cta_styles: [
    'Link in bio',
    'Shop now',
    'DM us',
    'Book a call',
    'Learn more',
    'Sign up',
    'Download',
    'Visit our website',
  ],
  content_pillars: [
    'Behind the Scenes',
    'Product Highlights',
    'Tips & Education',
    'Customer Stories',
    'Promotions',
    'Team & Culture',
    'Industry News',
    'Trending & Seasonal',
  ],
  preferred_formats: [
    'Single Image',
    'Carousel',
    'Short Video / Reel',
    'Stories',
    'Text Only',
    'Infographic',
    'Meme / Humor',
    'Live / Q&A',
  ],
};

function filled(v: FindingValue | null): boolean {
  if (typeof v === 'string') return !!v.trim();
  if (Array.isArray(v)) return v.some((x) => String(x).trim());
  return !!v;
}

function tidy(v: FindingValue): FindingValue {
  if (typeof v === 'string') return v.trim();
  if (Array.isArray(v)) return Array.from(new Set(v.map((x) => String(x).trim()).filter(Boolean)));
  return v;
}

const chip: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: 6,
  background: C.soft,
  border: `1px solid ${C.line}`,
  borderRadius: 8,
  padding: '3px 6px 3px 9px',
  fontSize: 12.5,
};
const xBtn: React.CSSProperties = {
  ...font,
  border: 'none',
  background: 'none',
  cursor: 'pointer',
  color: C.muted,
  fontSize: 14,
  lineHeight: 1,
  padding: '0 2px',
};
const smallInput: React.CSSProperties = {
  ...font,
  border: `1.5px solid ${C.line}`,
  borderRadius: 8,
  padding: '6px 9px',
  fontSize: 13,
  minWidth: 0,
};

function ListEditor({
  label,
  items,
  suggestions,
  onChange,
}: {
  label: string;
  items: string[];
  suggestions: string[];
  onChange: (v: string[]) => void;
}) {
  const [adding, setAdding] = useState('');
  const add = (v: string) => {
    const t = v.trim();
    if (t && !items.some((x) => x.toLowerCase() === t.toLowerCase())) onChange([...items, t]);
    setAdding('');
  };
  const more = suggestions.filter((s) => !items.some((x) => x.toLowerCase() === s.toLowerCase()));
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
        {items.map((x) => (
          <span key={x} style={chip}>
            {x}
            <button
              type="button"
              aria-label={`Remove ${x}`}
              onClick={() => onChange(items.filter((y) => y !== x))}
              style={xBtn}
            >
              ×
            </button>
          </span>
        ))}
      </div>
      <div style={{ display: 'flex', gap: 6 }}>
        <input
          value={adding}
          onChange={(e) => setAdding(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              add(adding);
            }
          }}
          placeholder="Add your own"
          aria-label={`Add to ${label}`}
          autoFocus
          style={{ ...smallInput, flex: 1 }}
        />
        <button
          type="button"
          onClick={() => add(adding)}
          disabled={!adding.trim()}
          style={{ ...quietBtn, opacity: adding.trim() ? 1 : 0.5 }}
        >
          Add
        </button>
      </div>
      {more.length > 0 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, alignItems: 'center' }}>
          <span style={{ fontSize: 11.5, color: C.muted }}>Quick add:</span>
          {more.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => add(s)}
              style={{ ...chip, cursor: 'pointer', color: C.pink, borderStyle: 'dashed', padding: '3px 9px' }}
            >
              + {s}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function ColorsEditor({ colors, onChange }: { colors: string[]; onChange: (v: string[]) => void }) {
  const set = (i: number, c: string) => onChange(colors.map((x, j) => (j === i ? c : x)));
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      {colors.map((c, i) => (
        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <input
            type="color"
            value={/^#[0-9a-f]{6}$/i.test(c) ? c : '#000000'}
            onChange={(e) => set(i, e.target.value.toUpperCase())}
            aria-label={`Colour ${i + 1}`}
            style={{
              width: 34,
              height: 30,
              border: `1px solid ${C.line}`,
              borderRadius: 6,
              padding: 0,
              background: 'none',
              cursor: 'pointer',
            }}
          />
          <input
            value={c}
            onChange={(e) =>
              set(
                i,
                e.target.value
                  .trim()
                  .replace(/^([0-9a-f])/i, '#$1')
                  .toUpperCase()
              )
            }
            aria-label={`Colour ${i + 1} code`}
            maxLength={7}
            style={{ ...smallInput, width: 96, borderColor: /^#[0-9a-f]{6}$/i.test(c) ? C.line : C.red }}
          />
          <button
            type="button"
            aria-label={`Remove colour ${c}`}
            onClick={() => onChange(colors.filter((_, j) => j !== i))}
            style={xBtn}
          >
            ×
          </button>
        </div>
      ))}
      {colors.length < 6 && (
        <div>
          <button
            type="button"
            onClick={() => onChange([...colors, '#000000'])}
            style={{ ...quietBtn, color: C.pink, fontWeight: 700 }}
          >
            + Add a colour
          </button>
        </div>
      )}
      {colors.some((c) => !/^#[0-9a-f]{6}$/i.test(c)) && (
        <div style={{ fontSize: 12, color: C.red }}>Use a colour code like #C2185B.</div>
      )}
    </div>
  );
}

function LogoEditor({ url, onChange }: { url: string; onChange: (v: string) => void }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
      {url && (
        <img
          src={url}
          alt="Logo"
          style={{
            maxWidth: 120,
            maxHeight: 64,
            objectFit: 'contain',
            borderRadius: 8,
            border: `1px solid ${C.line}`,
            background: '#fff',
            padding: 6,
          }}
        />
      )}
      <label
        style={{
          ...quietBtn,
          color: C.pink,
          fontWeight: 700,
          cursor: busy ? 'default' : 'pointer',
          border: `1.5px dashed ${C.pink}`,
          borderRadius: 10,
          padding: '8px 12px',
        }}
      >
        {busy ? 'Uploading…' : 'Upload a different logo'}
        <input
          type="file"
          accept="image/png,image/jpeg,image/webp"
          disabled={busy}
          style={{ display: 'none' }}
          onChange={async (e) => {
            const file = e.target.files?.[0];
            e.target.value = '';
            if (!file) return;
            setBusy(true);
            setError('');
            try {
              onChange(await BrandIntelService.uploadLogo(file));
            } catch (err) {
              setError(errorText(err, "That logo didn't upload. Try a PNG or JPG under 5 MB."));
            } finally {
              setBusy(false);
            }
          }}
        />
      </label>
      {error && <div style={{ fontSize: 12, color: C.red, width: '100%' }}>{error}</div>}
    </div>
  );
}

function Value({ k, v }: { k: string; v: FindingValue }) {
  if (k === 'logo_url' && typeof v === 'string') {
    return (
      <img
        src={v}
        alt="Logo Jane found"
        style={{
          maxWidth: 160,
          maxHeight: 80,
          objectFit: 'contain',
          borderRadius: 8,
          border: `1px solid ${C.line}`,
          background: '#fff',
          padding: 6,
        }}
      />
    );
  }
  if (k === 'style_selections' && Array.isArray(v)) {
    return (
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        {v.map((slug) => {
          const st = getStyle(slug);
          return (
            <div
              key={slug}
              style={{
                width: 132,
                border: `1px solid ${C.line}`,
                borderRadius: 10,
                overflow: 'hidden',
                background: '#fff',
              }}
            >
              <StylePicture image={st?.image} gradient={st?.gradient} />
              <div style={{ padding: '6px 8px' }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: C.ink }}>{st?.name ?? slug}</div>
                {st?.description && (
                  <div style={{ fontSize: 11, color: C.muted, lineHeight: 1.35 }}>{st.description}</div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    );
  }
  if (FONT_KEYS.includes(k) && typeof v === 'string') {
    const font = getFont(v);
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        <link rel="stylesheet" href={GOOGLE_FONTS_URL} />
        <span style={{ fontFamily: font?.fontFamily, fontSize: 20, color: C.ink }}>{font?.previewText ?? v}</span>
        <span style={{ fontSize: 12, color: C.muted }}>
          {font?.name ?? v}
          {font?.description ? ` — ${font.description}` : ''}
        </span>
      </div>
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
          <span
            key={x}
            style={{
              background: C.soft,
              border: `1px solid ${C.line}`,
              borderRadius: 8,
              padding: '3px 9px',
              fontSize: 12.5,
            }}
          >
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
            <b>{NETWORK_LABELS[net] ?? net}</b> ·{' '}
            <span style={{ color: C.muted }}>{String(url).replace(/^https?:\/\/(www\.)?/, '')}</span>
          </span>
        ))}
      </div>
    );
  }
  return <>{String(v)}</>;
}

/** A style's preview picture, or its colours when the picture can't be loaded (many of the
 * library's pictures were hosted on Cloudinary, which no longer serves them). */
function StylePicture({ image, gradient }: { image?: string; gradient?: [string, string] }) {
  const [broken, setBroken] = useState(false);
  const fill = gradient ? `linear-gradient(135deg, ${gradient[0]}, ${gradient[1]})` : C.soft;
  if (!image || broken) return <div style={{ height: 64, background: fill }} />;
  return (
    <img
      src={image}
      alt=""
      onError={() => setBroken(true)}
      style={{ width: '100%', height: 64, objectFit: 'cover', display: 'block', background: fill }}
    />
  );
}

function summary(v: FindingValue, key = ''): string {
  if (key === 'style_selections' && Array.isArray(v)) v = v.map((x) => getStyle(x)?.name ?? x);
  if (FONT_KEYS.includes(key) && typeof v === 'string') v = getFont(v)?.name ?? v;
  if (Array.isArray(v)) return v.slice(0, 4).join(', ') + (v.length > 4 ? ` +${v.length - 4} more` : '');
  if (v && typeof v === 'object')
    return Object.keys(v)
      .map((n) => NETWORK_LABELS[n] ?? n)
      .join(', ');
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
