'use client';

import { ChangeEvent, useEffect, useState } from 'react';
import {
  BrandVoiceService,
  ExampleAnalysis,
  TraitKey,
  VoiceCatalog,
  VoiceExample,
  VoiceProfile,
} from '@/src/api/BrandVoiceService';
import { Btn, Card, Chip, PINK, TRAIT_NAMES, errorText, inputStyle } from './ui';

/*
 * Learning from real conversations (PRD §7). Examples come from a paste, a text
 * file, or replies the team already sent in the inbox; contact details are masked
 * on the way in. Imported examples start unapproved, and analysis only PROPOSES
 * trait changes, with the excerpt behind each, for the owner to accept.
 */

const SOURCE_LABELS: Record<string, string> = {
  paste: 'Pasted',
  upload: 'Uploaded',
  inbox: 'From your inbox',
  assessment: 'From the assessment',
  calibration: 'Your rewrite',
};

export function PersonalityLearn({
  profile,
  catalog,
  onProfileChange,
}: {
  profile: VoiceProfile;
  catalog: VoiceCatalog;
  onProfileChange: (p: VoiceProfile) => void;
}) {
  const [examples, setExamples] = useState<VoiceExample[]>([]);
  const [text, setText] = useState('');
  const [scenario, setScenario] = useState('');
  const [busy, setBusy] = useState('');
  const [error, setError] = useState('');
  const [note, setNote] = useState('');
  const [analysis, setAnalysis] = useState<ExampleAnalysis | null>(null);
  const [accept, setAccept] = useState<Partial<Record<TraitKey, boolean>>>({});

  useEffect(() => {
    BrandVoiceService.listExamples()
      .then(setExamples)
      .catch((e) => setError(errorText(e, "Couldn't load your examples.")));
  }, []);

  async function add(source: 'paste' | 'upload', body: string) {
    setBusy('add');
    setError('');
    try {
      const ex = await BrandVoiceService.addExample(body, source, scenario);
      setExamples((prev) => [ex, ...prev]);
      setText('');
    } catch (e) {
      setError(errorText(e, "Couldn't add that example."));
    }
    setBusy('');
  }

  function upload(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    if (file.size > 200_000) {
      setError('That file is too large. Paste a shorter excerpt instead.');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => add('upload', String(reader.result || ''));
    reader.readAsText(file);
  }

  async function importInbox() {
    setBusy('import');
    setError('');
    setNote('');
    try {
      const added = await BrandVoiceService.importFromInbox();
      setExamples((prev) => [...added, ...prev]);
      setNote(
        added.length
          ? `Added ${added.length} repl${added.length === 1 ? 'y' : 'ies'} your team wrote. Approve the ones that sound like you.`
          : 'No new replies written by your team were found in the inbox.'
      );
    } catch (e) {
      setError(errorText(e, "Couldn't read your inbox right now."));
    }
    setBusy('');
  }

  async function toggle(ex: VoiceExample) {
    try {
      const next = await BrandVoiceService.updateExample(ex.id, { approved: !ex.approved });
      setExamples((prev) => prev.map((x) => (x.id === ex.id ? next : x)));
    } catch (e) {
      setError(errorText(e, "Couldn't update that example."));
    }
  }

  async function remove(ex: VoiceExample) {
    try {
      await BrandVoiceService.deleteExample(ex.id);
      setExamples((prev) => prev.filter((x) => x.id !== ex.id));
    } catch (e) {
      setError(errorText(e, "Couldn't delete that example."));
    }
  }

  async function analyse() {
    setBusy('analyse');
    setError('');
    try {
      const out = await BrandVoiceService.analyze(profile.id);
      setAnalysis(out);
      setAccept(Object.fromEntries(Object.keys(out.proposed).map((k) => [k, true])));
    } catch (e) {
      setError(errorText(e, "Couldn't analyse the examples right now."));
    }
    setBusy('');
  }

  async function apply() {
    if (!analysis) return;
    const traits = Object.fromEntries(
      Object.entries(analysis.proposed)
        .filter(([k]) => accept[k as TraitKey])
        .map(([k, v]) => [k, v!.proposed])
    );
    setBusy('apply');
    try {
      onProfileChange(await BrandVoiceService.applyAnalysis(profile.id, traits));
      setAnalysis(null);
      setNote('Applied to your draft. Test it in the playground, then publish.');
    } catch (e) {
      setError(errorText(e, "Couldn't apply those changes."));
    }
    setBusy('');
  }

  const approved = examples.filter((e) => e.approved).length;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <Card
        title="Teach URI from real conversations"
        desc='Paste an exchange that sounds like you. Label lines "Customer:" and "Us:" so URI only learns from your side. Emails, phone and account numbers are masked automatically.'
      >
        <textarea
          rows={5}
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder={
            'Customer: Do you deliver to Lekki?\nUs: Yes we do! Delivery to Lekki is ₦2,500 and takes a day.'
          }
          style={{ ...inputStyle, resize: 'vertical' }}
        />
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
          <select
            value={scenario}
            onChange={(e) => setScenario(e.target.value)}
            style={{ ...inputStyle, width: 'auto' }}
            aria-label="Situation"
          >
            <option value="">Any situation</option>
            {catalog.scenarios.map((s) => (
              <option key={s.id} value={s.id}>
                {s.title}
              </option>
            ))}
          </select>
          <Btn onClick={() => add('paste', text)} disabled={!text.trim() || busy !== ''}>
            Add example
          </Btn>
          <label style={{ fontSize: 12.5, color: PINK, fontWeight: 700, cursor: 'pointer' }}>
            Upload a .txt file
            <input type="file" accept=".txt,.csv,text/plain" onChange={upload} style={{ display: 'none' }} />
          </label>
          <div style={{ flex: 1 }} />
          <Btn kind="secondary" onClick={importInbox} disabled={busy !== ''}>
            {busy === 'import' ? 'Reading…' : 'Import from my inbox'}
          </Btn>
        </div>
        {note && <div style={{ fontSize: 12.5, color: '#1B5E20' }}>{note}</div>}
        {error && <div style={{ fontSize: 12.5, color: '#C62828' }}>{error}</div>}
      </Card>

      <Card
        title={`Examples (${approved} approved)`}
        desc="Only approved examples shape the voice, and they shape tone only: facts always come from your FAQs."
        right={
          <Btn onClick={analyse} disabled={approved === 0 || busy !== ''}>
            {busy === 'analyse' ? 'Analysing…' : 'Analyse approved'}
          </Btn>
        }
      >
        {examples.length === 0 && <div style={{ fontSize: 12.5, color: '#999' }}>No examples yet.</div>}
        {examples.map((ex) => (
          <div
            key={ex.id}
            style={{
              border: '1px solid rgba(0,0,0,.08)',
              borderRadius: 10,
              padding: '10px 12px',
              display: 'flex',
              flexDirection: 'column',
              gap: 6,
              background: ex.approved ? '#fff' : '#fafafa',
            }}
          >
            <div style={{ display: 'flex', gap: 6, alignItems: 'center', flexWrap: 'wrap' }}>
              <Chip tone={ex.approved ? 'green' : 'amber'}>{ex.approved ? 'Approved' : 'Not approved'}</Chip>
              <Chip tone="grey">{SOURCE_LABELS[ex.source] ?? ex.source}</Chip>
              {ex.scenario && (
                <Chip tone="grey">{catalog.scenarios.find((s) => s.id === ex.scenario)?.title ?? ex.scenario}</Chip>
              )}
              <div style={{ flex: 1 }} />
              <Btn small kind={ex.approved ? 'ghost' : 'secondary'} onClick={() => toggle(ex)}>
                {ex.approved ? 'Unapprove' : 'Approve'}
              </Btn>
              <Btn small kind="danger" onClick={() => remove(ex)}>
                Delete
              </Btn>
            </div>
            {ex.customer_lines.length > 0 && (
              <div style={{ fontSize: 12, color: '#999' }}>Customer: {ex.customer_lines.join(' ')}</div>
            )}
            <div style={{ fontSize: 13, color: '#222', whiteSpace: 'pre-wrap' }}>{ex.brand_lines.join('\n')}</div>
          </div>
        ))}
      </Card>

      {analysis && (
        <Card
          title="What URI noticed"
          desc={`From ${analysis.examples_used} example${analysis.examples_used === 1 ? '' : 's'}. Tick what to apply to your draft.`}
        >
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {analysis.measured.avg_words !== undefined && (
              <Chip tone="grey">~{analysis.measured.avg_words} words a reply</Chip>
            )}
            {analysis.measured.emoji_per_reply !== undefined && (
              <Chip tone="grey">{analysis.measured.emoji_per_reply} emoji a reply</Chip>
            )}
            {analysis.measured.question_rate !== undefined && (
              <Chip tone="grey">{Math.round(analysis.measured.question_rate * 100)}% end with a question</Chip>
            )}
            {(analysis.measured.greetings ?? []).map((g) => (
              <Chip key={g} tone="grey">
                Opens with &ldquo;{g}&rdquo;
              </Chip>
            ))}
          </div>
          {analysis.tone_shifts && <div style={{ fontSize: 12.5, color: '#555' }}>{analysis.tone_shifts}</div>}
          {Object.keys(analysis.proposed).length === 0 && (
            <div style={{ fontSize: 12.5, color: '#555' }}>Your examples already match the current draft.</div>
          )}
          {Object.entries(analysis.proposed).map(([k, v]) => (
            <label key={k} style={{ display: 'flex', gap: 10, alignItems: 'flex-start', fontSize: 13 }}>
              <input
                type="checkbox"
                checked={Boolean(accept[k as TraitKey])}
                onChange={(e) => setAccept((prev) => ({ ...prev, [k]: e.target.checked }))}
                style={{ marginTop: 3 }}
              />
              <span>
                <strong>{TRAIT_NAMES[k] ?? k}</strong>: {v!.current} →{' '}
                <strong style={{ color: PINK }}>{v!.proposed}</strong>
                {v!.measured && <span style={{ color: '#999' }}> · counted</span>}
                {v!.evidence && <span style={{ display: 'block', color: '#777' }}>&ldquo;{v!.evidence}&rdquo;</span>}
              </span>
            </label>
          ))}
          <div style={{ display: 'flex', gap: 8 }}>
            <Btn onClick={apply} disabled={busy !== '' || !Object.values(accept).some(Boolean)}>
              Apply to draft
            </Btn>
            <Btn kind="ghost" onClick={() => setAnalysis(null)}>
              Discard
            </Btn>
          </div>
        </Card>
      )}
    </div>
  );
}
