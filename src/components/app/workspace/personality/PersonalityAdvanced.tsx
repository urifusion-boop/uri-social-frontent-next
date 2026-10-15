'use client';

import { useEffect, useState } from 'react';
import { BrandVoiceService, TraitKey, VoiceCatalog, VoiceLanguage, VoiceProfile } from '@/src/api/BrandVoiceService';
import { Btn, Card, Chip, TRAIT_NAMES, TraitSlider, errorText, inputStyle } from './ui';

/*
 * Advanced mode (PRD §14): every trait, language rule, phrase list and channel
 * variation, edited on the DRAFT. Which profile answers which department is an
 * admin-only rule.
 */

const COMMENT_TRAITS: TraitKey[] = ['formality', 'verbosity', 'emoji', 'humour'];

const lines = (v: string) =>
  v
    .split('\n')
    .map((x) => x.trim())
    .filter(Boolean);

export function PersonalityAdvanced({
  profile,
  catalog,
  canPublish,
  onProfileChange,
}: {
  profile: VoiceProfile;
  catalog: VoiceCatalog;
  canPublish: boolean;
  onProfileChange: (p: VoiceProfile) => void;
}) {
  const [draft, setDraft] = useState<VoiceProfile>(profile);
  const [preferred, setPreferred] = useState(profile.style.preferred_phrases.join('\n'));
  const [banned, setBanned] = useState(profile.style.banned_phrases.join('\n'));
  const [commentOverride, setCommentOverride] = useState(Object.keys(profile.channel_overrides.comment).length > 0);
  const [state, setState] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [error, setError] = useState('');

  useEffect(() => {
    setDraft(profile);
    setPreferred(profile.style.preferred_phrases.join('\n'));
    setBanned(profile.style.banned_phrases.join('\n'));
    setCommentOverride(Object.keys(profile.channel_overrides.comment).length > 0);
  }, [profile]);

  const setTrait = (k: TraitKey, v: number) => setDraft((d) => ({ ...d, traits: { ...d.traits, [k]: v } }));
  const setLang = (patch: Partial<VoiceLanguage>) => setDraft((d) => ({ ...d, language: { ...d.language, ...patch } }));
  const pidginOn = draft.language.allowed.includes('pcm');

  async function save() {
    setState('saving');
    setError('');
    const fields: Partial<VoiceProfile> = {
      name: draft.name,
      summary: draft.summary,
      traits: draft.traits,
      language: draft.language,
      style: { ...draft.style, preferred_phrases: lines(preferred), banned_phrases: lines(banned) },
      channel_overrides: {
        dm: {},
        comment: commentOverride
          ? Object.fromEntries(COMMENT_TRAITS.map((k) => [k, draft.channel_overrides.comment[k] ?? draft.traits[k]]))
          : {},
      },
    };
    if (canPublish) {
      fields.departments = draft.departments;
      fields.is_default = draft.is_default;
    }
    try {
      onProfileChange(await BrandVoiceService.updateProfile(profile.id, fields));
      setState('saved');
    } catch (e) {
      setError(errorText(e, "Couldn't save the draft. Try again."));
      setState('error');
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <Card title="Name and summary">
        <input
          value={draft.name}
          onChange={(e) => setDraft({ ...draft, name: e.target.value })}
          style={inputStyle}
          aria-label="Profile name"
        />
        <textarea
          rows={2}
          value={draft.summary}
          onChange={(e) => setDraft({ ...draft, summary: e.target.value })}
          style={{ ...inputStyle, resize: 'vertical' }}
          aria-label="Summary"
        />
      </Card>

      <Card
        title="Traits"
        desc="0 to 100. These set the base voice; URI still softens it for complaints and other situations."
      >
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16 }}>
          {catalog.traits.map((k) => (
            <TraitSlider
              key={k}
              label={TRAIT_NAMES[k] ?? k}
              low={catalog.trait_labels[k][0]}
              high={catalog.trait_labels[k][1]}
              value={draft.traits[k]}
              onChange={(v) => setTrait(k, v)}
            />
          ))}
        </div>
      </Card>

      <Card title="Language" desc="Replies are in standard English unless you turn other options on here.">
        <label
          style={{ display: 'flex', flexDirection: 'column', gap: 5, fontSize: 12.5, fontWeight: 700, color: '#444' }}
        >
          Default
          <select
            value={draft.language.default}
            onChange={(e) => {
              const def = e.target.value as 'en' | 'en-NG';
              setLang({ default: def, allowed: Array.from(new Set([def, ...draft.language.allowed])) });
            }}
            style={inputStyle}
          >
            <option value="en">Standard English</option>
            <option value="en-NG">Nigerian English</option>
          </select>
        </label>
        <label style={{ display: 'flex', gap: 8, alignItems: 'center', fontSize: 13 }}>
          <input
            type="checkbox"
            checked={pidginOn}
            onChange={(e) =>
              setLang({
                allowed: e.target.checked
                  ? [...draft.language.allowed, 'pcm']
                  : draft.language.allowed.filter((a) => a !== 'pcm'),
                pidgin: e.target.checked ? 'light' : 'english',
              })
            }
          />
          Allow Pidgin when the customer writes in Pidgin
        </label>
        {pidginOn && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, paddingLeft: 24 }}>
            <select
              value={draft.language.pidgin}
              onChange={(e) => setLang({ pidgin: e.target.value as VoiceLanguage['pidgin'] })}
              style={inputStyle}
              aria-label="When the customer writes Pidgin"
            >
              <option value="switch">Reply in Pidgin</option>
              <option value="light">English with a light touch of Pidgin</option>
              <option value="ask">Reply in English and ask which they prefer</option>
              <option value="english">Stay in English</option>
            </select>
            {draft.language.pidgin === 'switch' && (
              <select
                value={draft.language.pidgin_degree}
                onChange={(e) => setLang({ pidgin_degree: e.target.value as VoiceLanguage['pidgin_degree'] })}
                style={inputStyle}
                aria-label="How much Pidgin"
              >
                <option value="light">Light, easy to read</option>
                <option value="moderate">Moderate</option>
                <option value="full">Full Pidgin</option>
              </select>
            )}
            <label style={{ display: 'flex', gap: 8, alignItems: 'center', fontSize: 13 }}>
              <input
                type="checkbox"
                checked={draft.language.pidgin_review}
                onChange={(e) => setLang({ pidgin_review: e.target.checked })}
              />
              Hold Pidgin replies for a person to check before sending
            </label>
          </div>
        )}
      </Card>

      <Card title="Words and phrases" desc="One per line. Banned phrases also stop a reply from auto-sending.">
        <label style={{ fontSize: 12.5, fontWeight: 700, color: '#444' }}>
          Phrases you like
          <textarea
            rows={3}
            value={preferred}
            onChange={(e) => setPreferred(e.target.value)}
            style={{ ...inputStyle, marginTop: 5, resize: 'vertical' }}
          />
        </label>
        <label style={{ fontSize: 12.5, fontWeight: 700, color: '#444' }}>
          Never say
          <textarea
            rows={3}
            value={banned}
            onChange={(e) => setBanned(e.target.value)}
            style={{ ...inputStyle, marginTop: 5, resize: 'vertical' }}
          />
        </label>
      </Card>

      <Card
        title="Public comments"
        desc="Comments are seen by everyone. Give them their own settings if they need a different tone."
      >
        <label style={{ display: 'flex', gap: 8, alignItems: 'center', fontSize: 13 }}>
          <input type="checkbox" checked={commentOverride} onChange={(e) => setCommentOverride(e.target.checked)} />
          Use different settings for comments
        </label>
        {commentOverride && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16 }}>
            {COMMENT_TRAITS.map((k) => (
              <TraitSlider
                key={k}
                label={TRAIT_NAMES[k] ?? k}
                low={catalog.trait_labels[k][0]}
                high={catalog.trait_labels[k][1]}
                value={draft.channel_overrides.comment[k] ?? draft.traits[k]}
                onChange={(v) =>
                  setDraft((d) => ({
                    ...d,
                    channel_overrides: { ...d.channel_overrides, comment: { ...d.channel_overrides.comment, [k]: v } },
                  }))
                }
              />
            ))}
          </div>
        )}
      </Card>

      <Card
        title="Which messages this voice answers"
        desc={
          canPublish
            ? 'With several profiles, give sales or support its own voice. The default answers everything else.'
            : 'Only an admin can change this.'
        }
      >
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <Chip
            active={draft.is_default}
            onClick={canPublish ? () => setDraft({ ...draft, is_default: !draft.is_default }) : undefined}
          >
            Default
          </Chip>
          {(['sales', 'support'] as const).map((d) => (
            <Chip
              key={d}
              active={draft.departments.includes(d)}
              onClick={
                canPublish
                  ? () =>
                      setDraft({
                        ...draft,
                        departments: draft.departments.includes(d)
                          ? draft.departments.filter((x) => x !== d)
                          : [...draft.departments, d],
                      })
                  : undefined
              }
            >
              {d === 'sales' ? 'Sales: buying, booking, product questions' : 'Support: help and complaints'}
            </Chip>
          ))}
        </div>
      </Card>

      <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
        <Btn onClick={save} disabled={state === 'saving'}>
          {state === 'saving' ? 'Saving…' : 'Save draft'}
        </Btn>
        <Btn kind="ghost" onClick={() => setDraft(profile)}>
          Discard changes
        </Btn>
        {state === 'saved' && (
          <span style={{ fontSize: 12.5, color: '#1B5E20' }}>Saved to draft. Publish to make it live.</span>
        )}
        {error && <span style={{ fontSize: 12.5, color: '#C62828' }}>{error}</span>}
      </div>
    </div>
  );
}
