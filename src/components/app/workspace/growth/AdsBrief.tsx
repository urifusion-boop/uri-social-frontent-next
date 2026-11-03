'use client';

import { useEffect, useState } from 'react';
import { AdsBrief as Brief, AdsBriefResponse, CampaignService } from '@/src/api/CampaignService';
import { Btn, Card, Chip, errorText, inputStyle } from '../personality/ui';

const TRACKING_LABELS: Record<string, string> = {
  none: 'No tracking',
  messages_only: 'Chats only (WhatsApp / DMs)',
  website_pixel: 'Website visits tracked',
  website_purchases: 'Website purchases tracked',
};

const TEXTS: [keyof Brief, string, string][] = [
  ['success_definition', 'What counts as success', 'e.g. 20 orders a week at ₦3,000 or less each'],
  ['qualified_lead_definition', 'What makes a good lead', 'e.g. asks for price and is in Lagos'],
  ['assets_available', 'Photos and videos you have', 'e.g. product photos, a kitchen video'],
  ['customer_data', 'Customer data you hold', 'e.g. 300 WhatsApp customers, an email list'],
  ['previous_results', 'What worked before', 'e.g. price posts did well; boosted videos did not'],
];

/*
 * The brand's standing ads brief: facts about the business every plan is checked
 * against before launch — where it delivers, places to avoid, formats it refuses.
 */
export function AdsBrief() {
  const [data, setData] = useState<AdsBriefResponse | null>(null);
  const [draft, setDraft] = useState<Brief | null>(null);
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    CampaignService.getAdsBrief()
      .then((d) => {
        setData(d);
        setDraft(d.brief);
      })
      .catch((e) => setError(errorText(e, "Couldn't load your ads brief.")));
  }, []);

  if (!data || !draft) {
    return <div style={{ fontSize: 13, color: error ? '#C62828' : '#999' }}>{error || 'Loading…'}</div>;
  }

  const set = <K extends keyof Brief>(k: K, v: Brief[K]) => setDraft({ ...draft, [k]: v });
  const list = (k: 'service_area' | 'excluded_locations') => draft[k].join(', ');
  const toggle = (c: string) =>
    set(
      'constraints',
      draft.constraints.includes(c) ? draft.constraints.filter((x) => x !== c) : [...draft.constraints, c]
    );

  async function save() {
    if (!draft) return;
    setSaving(true);
    setError('');
    try {
      const saved = await CampaignService.saveAdsBrief(draft);
      setDraft(saved);
      setNotice('Saved. Every new plan is checked against this before it launches.');
    } catch (e) {
      setError(errorText(e, "Couldn't save your brief."));
    }
    setSaving(false);
  }

  const label = (text: string) => <div style={{ fontSize: 12, color: '#555', fontWeight: 700 }}>{text}</div>;

  return (
    <Card
      title="Your ads brief"
      desc="Saved once for this brand. Jane plans with it, and a plan that goes against it can't launch until it's fixed."
    >
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 12 }}>
        <div>
          {label('Where you deliver or serve')}
          <input
            style={{ ...inputStyle, width: '100%' }}
            value={list('service_area')}
            placeholder="e.g. Surulere, Yaba, Lagos Island"
            onChange={(e) => set('service_area', e.target.value.split(','))}
          />
        </div>
        <div>
          {label('Never target')}
          <input
            style={{ ...inputStyle, width: '100%' }}
            value={list('excluded_locations')}
            placeholder="e.g. Ikorodu"
            onChange={(e) => set('excluded_locations', e.target.value.split(','))}
          />
        </div>
      </div>
      <div>
        {label('What Jane must not do')}
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 4 }}>
          {Object.entries(data.constraint_options).map(([k, text]) => (
            <Chip key={k} active={draft.constraints.includes(k)} onClick={() => toggle(k)}>
              {text}
            </Chip>
          ))}
        </div>
      </div>
      <div>
        {label('What your website or chats can track')}
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 4 }}>
          {data.tracking_options.map((t) => (
            <Chip key={t} active={draft.tracking === t} onClick={() => set('tracking', t as Brief['tracking'])}>
              {TRACKING_LABELS[t] ?? t}
            </Chip>
          ))}
        </div>
      </div>
      {TEXTS.map(([k, text, placeholder]) => (
        <div key={k}>
          {label(text)}
          <input
            style={{ ...inputStyle, width: '100%' }}
            value={String(draft[k] ?? '')}
            placeholder={placeholder}
            onChange={(e) => set(k, e.target.value as never)}
          />
        </div>
      ))}
      <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
        <Btn small onClick={save} disabled={saving}>
          {saving ? 'Saving…' : 'Save brief'}
        </Btn>
        {notice && <span style={{ fontSize: 12.5, color: '#1B5E20' }}>{notice}</span>}
        {error && <span style={{ fontSize: 12.5, color: '#C62828' }}>{error}</span>}
      </div>
    </Card>
  );
}
