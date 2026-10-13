'use client';

import { BrandProfileData, BrandProfileService, PlaybookHealthData } from '@/src/api/BrandProfileService';
import { ToastTypeEnum } from '@/src/models/enum-models/ToastTypeEnum';
import { ToastService } from '@/src/utils/toast.util';
import { useState } from 'react';
import { C, font, pill, PlaybookPanel, usePanelOpen } from './PlaybookPanel';

const colorFor = (score: number) => (score >= 75 ? '#15803d' : score >= 50 ? '#B45309' : '#B91C1C');
const tintFor = (score: number) => (score >= 75 ? '#ECFDF5' : score >= 50 ? '#FFFBEB' : '#FEF2F2');

/** The score as a ring, with the number in the middle. */
const Ring = ({ score, size = 38 }: { score: number; size?: number }) => {
  const stroke = 4;
  const r = (size - stroke) / 2;
  const circ = 2 * Math.PI * r;
  const color = colorFor(score);
  return (
    <div style={{ position: 'relative', width: size, height: size, flexShrink: 0 }} aria-hidden>
      <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#F1EEEB" strokeWidth={stroke} />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={color}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circ}
          strokeDashoffset={circ * (1 - Math.max(0, Math.min(100, score)) / 100)}
          style={{ transition: 'stroke-dashoffset .6s ease' }}
        />
      </svg>
      <span
        style={{
          position: 'absolute',
          inset: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: size * 0.29,
          fontWeight: 800,
          color,
          letterSpacing: -0.3,
        }}
      >
        {score}
      </span>
    </div>
  );
};

type Suggestion = PlaybookHealthData['suggestions'][number];

/**
 * Settings simple enough to fill straight from the card. They save into the
 * very same Playbook field the editor below uses. Anything else (logo,
 * colours, styles, dates, choices, posting times...) opens the editor at
 * the right section instead.
 */
const QUICK_FILL: Record<string, { kind: 'text' | 'long' | 'list'; placeholder: string }> = {
  brand_name: { kind: 'text', placeholder: 'Your brand name' },
  product_description: {
    kind: 'long',
    placeholder: 'What your business does, for whom, and what makes it worth buying…',
  },
  key_products_services: { kind: 'list', placeholder: 'e.g. Jollof bowls — press Enter after each' },
  tagline: { kind: 'text', placeholder: 'e.g. Hot jollof. No stories.' },
  website: { kind: 'text', placeholder: 'https://…' },
  price_range: { kind: 'text', placeholder: 'e.g. Mid-range, ₦5,000–₦15,000' },
  unique_selling_proposition: { kind: 'long', placeholder: 'What you do that others don’t…' },
  business_priorities: { kind: 'list', placeholder: 'e.g. Grow repeat orders — press Enter after each' },
  voice_sample: { kind: 'long', placeholder: 'Paste a caption or message you wrote that sounds like you…' },
  content_pillars: { kind: 'list', placeholder: 'e.g. Behind the scenes — press Enter after each' },
  ideal_customer_profile: { kind: 'long', placeholder: 'Who buys from you most — age, job, what they care about…' },
  customer_pain_points: { kind: 'list', placeholder: 'e.g. No time to cook — press Enter after each' },
  customer_needs: { kind: 'list', placeholder: 'e.g. Fast delivery — press Enter after each' },
  customer_objections: { kind: 'list', placeholder: 'e.g. Too expensive — press Enter after each' },
  why_customers_choose_us: { kind: 'long', placeholder: 'What customers say when they recommend you…' },
  common_questions: { kind: 'list', placeholder: 'e.g. Do you deliver to Lekki? — press Enter after each' },
  words_to_avoid: { kind: 'list', placeholder: 'e.g. cheap — press Enter after each' },
  competitor_handles: { kind: 'list', placeholder: 'e.g. @competitor — press Enter after each' },
  cta_styles: { kind: 'list', placeholder: 'e.g. Order on WhatsApp — press Enter after each' },
  default_link: { kind: 'text', placeholder: 'https://… (where “order now” should send people)' },
};

const smallBtn = (primary = false): React.CSSProperties => ({
  ...font,
  padding: '4px 10px',
  borderRadius: 7,
  border: primary ? 'none' : '1px solid #F0C9D9',
  background: primary ? C.pink : '#fff',
  color: primary ? '#fff' : C.pink,
  fontSize: 11.5,
  fontWeight: 700,
  cursor: 'pointer',
  whiteSpace: 'nowrap',
});

const inputStyle: React.CSSProperties = {
  ...font,
  width: '100%',
  boxSizing: 'border-box',
  padding: '7px 9px',
  borderRadius: 8,
  border: `1px solid ${C.line}`,
  fontSize: 12.5,
  color: C.ink,
  outline: 'none',
  background: '#fff',
};

interface CardProps {
  s: Suggestion;
  index: number;
  canFill: boolean;
  onJump: (section: string) => void;
  onSave: (key: string, value: string | string[]) => Promise<boolean>;
}

/** One "add next" card: what's missing, why it matters, and how to fill it. */
const AddNextCard = ({ s, index, canFill, onJump, onSave }: CardProps) => {
  const quick = QUICK_FILL[s.key];
  const [filling, setFilling] = useState(false);
  const [text, setText] = useState('');
  const [items, setItems] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);

  const addItem = () => {
    const parts = text
      .split(/[,\n]/)
      .map((t) => t.trim())
      .filter(Boolean);
    if (!parts.length) return;
    setItems((prev) => [...prev, ...parts.filter((x) => !prev.some((p) => p.toLowerCase() === x.toLowerCase()))]);
    setText('');
  };

  const value: string | string[] =
    quick?.kind === 'list' ? [...items, ...(text.trim() ? [text.trim()] : [])] : text.trim();
  const ready = Array.isArray(value) ? value.length > 0 : value.length > 0;

  const save = async () => {
    if (!ready || saving) return;
    setSaving(true);
    const ok = await onSave(s.key, value);
    setSaving(false);
    if (ok) {
      setFilling(false);
      setText('');
      setItems([]);
    }
  };

  return (
    <li
      style={{
        display: 'flex',
        gap: 10,
        padding: '9px 10px',
        border: `1px solid ${filling ? '#F0C9D9' : C.line}`,
        borderRadius: 10,
        background: index === 0 || filling ? C.soft : '#fff',
        transition: 'border-color .2s, background .2s',
      }}
    >
      <span
        aria-hidden
        style={{
          width: 20,
          height: 20,
          borderRadius: '50%',
          flexShrink: 0,
          background: index === 0 ? C.pink : '#F1EEEB',
          color: index === 0 ? '#fff' : C.muted,
          fontSize: 10.5,
          fontWeight: 800,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          marginTop: 1,
        }}
      >
        {index + 1}
      </span>
      <div style={{ minWidth: 0, flex: 1 }}>
        <div style={{ fontSize: 12.5, fontWeight: 800, color: C.ink }}>
          {s.label} <span style={{ fontWeight: 500, color: C.faint }}>· {s.section}</span>
        </div>
        <div style={{ fontSize: 12, color: C.body, lineHeight: 1.45, margin: '2px 0 6px' }}>{s.why}</div>
        <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', alignItems: 'center' }}>
          <span style={{ fontSize: 10.5, color: C.faint, marginRight: 2 }}>Improves</span>
          {s.improves.map((job) => (
            <span key={job} style={pill('#FCE4EC', C.pink)}>
              {job}
            </span>
          ))}
        </div>

        {filling && quick ? (
          <div style={{ marginTop: 9 }}>
            {quick.kind === 'long' && (
              <textarea
                autoFocus
                rows={3}
                value={text}
                maxLength={2000}
                onChange={(e) => setText(e.target.value)}
                placeholder={quick.placeholder}
                aria-label={s.label}
                style={{ ...inputStyle, resize: 'vertical', lineHeight: 1.5 }}
              />
            )}
            {quick.kind === 'text' && (
              <input
                autoFocus
                value={text}
                maxLength={300}
                onChange={(e) => setText(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && save()}
                placeholder={quick.placeholder}
                aria-label={s.label}
                style={inputStyle}
              />
            )}
            {quick.kind === 'list' && (
              <>
                {items.length > 0 && (
                  <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', marginBottom: 6 }}>
                    {items.map((it) => (
                      <span key={it} style={{ ...pill('#fff', C.body), border: `1px solid ${C.line}` }}>
                        {it}
                        <button
                          type="button"
                          aria-label={`Remove ${it}`}
                          onClick={() => setItems((prev) => prev.filter((x) => x !== it))}
                          style={{
                            border: 'none',
                            background: 'none',
                            color: C.faint,
                            cursor: 'pointer',
                            padding: 0,
                            fontSize: 13,
                            lineHeight: 1,
                          }}
                        >
                          ×
                        </button>
                      </span>
                    ))}
                  </div>
                )}
                <input
                  autoFocus
                  value={text}
                  maxLength={200}
                  onChange={(e) => setText(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ',') {
                      e.preventDefault();
                      addItem();
                    }
                  }}
                  onBlur={addItem}
                  placeholder={quick.placeholder}
                  aria-label={s.label}
                  style={inputStyle}
                />
              </>
            )}
            <div style={{ display: 'flex', gap: 6, marginTop: 7, alignItems: 'center' }}>
              <button
                type="button"
                style={{ ...smallBtn(true), opacity: ready && !saving ? 1 : 0.5 }}
                disabled={!ready || saving}
                onClick={save}
              >
                {saving ? 'Saving…' : 'Save to Playbook'}
              </button>
              <button
                type="button"
                style={{ ...smallBtn(), border: 'none', color: C.muted }}
                onClick={() => setFilling(false)}
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <div style={{ display: 'flex', gap: 6, marginTop: 8, flexWrap: 'wrap' }}>
            {quick && canFill && (
              <button type="button" style={smallBtn(true)} onClick={() => setFilling(true)}>
                Fill here
              </button>
            )}
            <button type="button" style={smallBtn()} onClick={() => onJump(s.section)}>
              Go to field →
            </button>
          </div>
        )}
      </div>
    </li>
  );
};

/** Brand Playbook → strength: a score, what to add next (and what it improves), and a voice preview. */
interface Props {
  health: PlaybookHealthData | null;
  profile?: BrandProfileData | null;
  onProfileUpdate?: (p: BrandProfileData) => void;
  /** The Playbook is being edited by hand: filling from a card would be overwritten by that Save. */
  editing?: boolean;
  /** Open the editor at a section ("Go to field"). */
  onJump?: (section: string) => void;
}

const PlaybookHealth = ({ health, profile, onProfileUpdate, editing = false, onJump }: Props) => {
  const [open, toggle] = usePanelOpen('uri_pb_strength_open');
  const [previewing, setPreviewing] = useState(false);
  const [preview, setPreview] = useState<{ caption: string; banned_words_used: string[] } | null>(null);

  if (!health) return null;
  const color = colorFor(health.score);
  const next = health.suggestions.length;

  // "Fill here": saves into the same Playbook field the editor uses. The page
  // re-reads the strength after the profile changes, so the card drops off.
  const saveField = async (key: string, value: string | string[]): Promise<boolean> => {
    try {
      const res = await BrandProfileService.save({ [key]: value } as Partial<BrandProfileData>);
      if (!res.status) {
        ToastService.showToast(res.responseMessage || 'Could not save it', ToastTypeEnum.Error);
        return false;
      }
      onProfileUpdate?.({ ...(profile ?? {}), ...(res.responseData ?? {}), [key]: value } as BrandProfileData);
      ToastService.showToast('Saved to your Playbook — Jane uses it from now on.', ToastTypeEnum.Success);
      return true;
    } catch (err: unknown) {
      const e = err as { response?: { data?: { detail?: string } } };
      ToastService.showToast(e?.response?.data?.detail || 'Could not save it', ToastTypeEnum.Error);
      return false;
    }
  };

  const runPreview = async () => {
    setPreviewing(true);
    try {
      const res = await BrandProfileService.previewVoice('instagram');
      if (res.status && res.responseData) setPreview(res.responseData);
      else ToastService.showToast(res.responseMessage || 'Could not write a preview', ToastTypeEnum.Error);
    } catch (err: unknown) {
      const e = err as { response?: { data?: { detail?: string } } };
      ToastService.showToast(e?.response?.data?.detail || 'Could not write a preview', ToastTypeEnum.Error);
    } finally {
      setPreviewing(false);
    }
  };

  const previewButton = (
    <button
      type="button"
      onClick={runPreview}
      disabled={previewing}
      style={{
        ...font,
        padding: '6px 11px',
        borderRadius: 8,
        border: '1px solid #F0C9D9',
        background: '#fff',
        color: C.pink,
        fontSize: 12,
        fontWeight: 700,
        cursor: previewing ? 'default' : 'pointer',
        opacity: previewing ? 0.6 : 1,
        whiteSpace: 'nowrap',
      }}
    >
      {previewing ? 'Writing…' : 'Preview Jane’s voice'}
    </button>
  );

  return (
    <PlaybookPanel
      id="pb-strength-panel"
      open={open}
      onToggle={toggle}
      icon={<Ring score={health.score} />}
      title="Playbook strength"
      tags={<span style={pill(tintFor(health.score), color)}>{health.level}</span>}
      subtitle={
        <>
          {health.filled} of {health.total} settings filled
          {next > 0 ? ` · ${next} to add next` : ' · nothing important missing'}
          <span className="pb-wide"> · the more Jane knows, the less she guesses</span>
        </>
      }
      actions={previewButton}
      below={
        preview && (
          <div style={{ padding: '0 12px 12px' }}>
            <div
              style={{
                position: 'relative',
                padding: '10px 32px 10px 12px',
                borderRadius: 10,
                background: '#FDF2F8',
                border: '1px solid #F3D4E4',
                fontSize: 12.5,
                lineHeight: 1.55,
                color: C.ink,
                whiteSpace: 'pre-wrap',
              }}
            >
              <div
                style={{
                  fontSize: 10,
                  fontWeight: 800,
                  color: C.pink,
                  textTransform: 'uppercase',
                  letterSpacing: 0.6,
                  marginBottom: 4,
                }}
              >
                Sample Instagram caption from your saved Playbook
              </div>
              {preview.caption}
              {preview.banned_words_used.length > 0 && (
                <div style={{ fontSize: 11.5, color: C.red, marginTop: 6 }}>
                  This sample used words you asked Jane to avoid: {preview.banned_words_used.join(', ')}
                </div>
              )}
              <button
                type="button"
                aria-label="Close preview"
                onClick={() => setPreview(null)}
                style={{
                  position: 'absolute',
                  top: 6,
                  right: 6,
                  border: 'none',
                  background: 'transparent',
                  color: C.faint,
                  fontSize: 16,
                  lineHeight: 1,
                  cursor: 'pointer',
                  padding: 4,
                }}
              >
                ×
              </button>
            </div>
          </div>
        )
      }
    >
      {/* Overall bar, for a quick read */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, margin: '10px 0 12px' }}>
        <div style={{ flex: 1, height: 5, borderRadius: 3, background: '#F1EEEB', overflow: 'hidden' }}>
          <div
            style={{
              width: `${health.score}%`,
              height: '100%',
              background: color,
              borderRadius: 3,
              transition: 'width .6s ease',
            }}
          />
        </div>
        <span style={{ fontSize: 11.5, fontWeight: 700, color }}>{health.score}%</span>
      </div>

      {next === 0 ? (
        <div style={{ fontSize: 12.5, color: C.muted, padding: '4px 0 2px' }}>
          Everything that matters most is filled in. Keep Business Pulse fresh so Jane knows what&apos;s happening now.
        </div>
      ) : (
        <>
          <div
            style={{
              fontSize: 10.5,
              fontWeight: 800,
              color: C.faint,
              textTransform: 'uppercase',
              letterSpacing: 0.6,
              marginBottom: 8,
            }}
          >
            Add next — biggest improvement first
          </div>
          <ol
            style={{
              listStyle: 'none',
              margin: 0,
              padding: 0,
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
              gap: 8,
            }}
          >
            {health.suggestions.map((sug, i) => (
              <AddNextCard
                key={sug.key}
                s={sug}
                index={i}
                canFill={!editing && !!onProfileUpdate}
                onJump={(section) => onJump?.(section)}
                onSave={saveField}
              />
            ))}
          </ol>
        </>
      )}
    </PlaybookPanel>
  );
};

export default PlaybookHealth;
