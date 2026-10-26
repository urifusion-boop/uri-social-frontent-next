'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  AnswerValue,
  AssessmentQuestion,
  AssessmentState,
  BrandVoiceService,
  VoiceProfile,
} from '@/src/api/BrandVoiceService';
import { Btn, Card, Chip, FONT, PINK, PINK_SOFT, errorText, inputStyle } from './ui';

/*
 * Voice discovery (PRD §4–5): one question per screen, autosaved as you go so it can
 * be left and resumed. Follow-ups and "which matters more?" questions appear as
 * earlier answers unlock them; the profile is generated as a draft at the end.
 */

const isAnswered = (v: AnswerValue | undefined) =>
  v !== undefined && v !== '' && !(Array.isArray(v) && v.every((x) => !x));

export function PersonalityAssessment({
  currentProfileId,
  onGenerated,
}: {
  currentProfileId?: string;
  onGenerated: (p: VoiceProfile) => void;
}) {
  const [state, setState] = useState<AssessmentState | null>(null);
  const [index, setIndex] = useState(0);
  const [value, setValue] = useState<AnswerValue | undefined>(undefined);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [replaceCurrent, setReplaceCurrent] = useState(Boolean(currentProfileId));

  const flow: AssessmentQuestion[] = useMemo(
    () => (state ? [...state.questions, ...state.follow_ups, ...state.conflicts] : []),
    [state]
  );

  useEffect(() => {
    let cancelled = false;
    BrandVoiceService.getAssessment()
      .then((s) => {
        if (cancelled) return;
        setState(s);
        const all = [...s.questions, ...s.follow_ups, ...s.conflicts];
        const first = all.findIndex((q) => !isAnswered(s.answers[q.id]));
        setIndex(first === -1 ? all.length - 1 : first);
      })
      .catch((e) => !cancelled && setError(errorText(e, "Couldn't load the questions. Try again.")));
    return () => {
      cancelled = true;
    };
  }, []);

  const q = flow[index];
  useEffect(() => {
    if (!q || !state) return;
    const saved = state.answers[q.id];
    setValue(saved ?? (q.type === 'slider' ? 50 : q.type === 'multi' ? [] : q.type === 'examples' ? [] : ''));
  }, [q, state]);

  if (error && !state) return <div style={{ color: '#C62828', fontSize: 13 }}>{error}</div>;
  if (!state || !q) return <div style={{ color: '#999', fontSize: 13 }}>Loading questions…</div>;

  const section = state.sections.find((s) => s.id === q.section)?.title ?? 'One more thing';
  const progress = Math.round((state.answered / Math.max(1, state.total)) * 100);
  const last = index >= flow.length - 1;

  async function save(next: number) {
    if (!q) return;
    setError('');
    const changed = JSON.stringify(value) !== JSON.stringify(state?.answers[q.id]);
    if (changed && isAnswered(value)) {
      setBusy(true);
      try {
        const s = await BrandVoiceService.saveAnswers({ [q.id]: value as AnswerValue });
        setState(s);
      } catch (e) {
        setError(errorText(e, "Couldn't save that answer. Try again."));
        setBusy(false);
        return;
      }
      setBusy(false);
    }
    setIndex(Math.max(0, next));
  }

  async function finish() {
    await save(index);
    setBusy(true);
    setError('');
    try {
      const p = await BrandVoiceService.generate(replaceCurrent ? currentProfileId : undefined);
      onGenerated(p);
    } catch (e) {
      const detail = (
        e as { response?: { data?: { detail?: { conflicts?: unknown[]; missing_required?: string[] } } } }
      )?.response?.data?.detail;
      const fresh = await BrandVoiceService.getAssessment().catch(() => null);
      if (fresh) {
        setState(fresh);
        const all = [...fresh.questions, ...fresh.follow_ups, ...fresh.conflicts];
        const target = detail?.conflicts?.length
          ? fresh.questions.length + fresh.follow_ups.length
          : all.findIndex((x) => fresh.missing_required.includes(x.id));
        if (target >= 0) setIndex(target);
      }
      setError(errorText(e, "Couldn't build the profile right now. Try again."));
    }
    setBusy(false);
  }

  const canNext = !q.required || isAnswered(value);

  return (
    <Card>
      <div>
        <div
          style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11.5, color: '#999', marginBottom: 6 }}
        >
          <span style={{ fontWeight: 700, color: q.section === 'conflict' ? '#B26A00' : PINK }}>
            {q.section === 'conflict' ? 'Which matters more?' : section}
          </span>
          <span>
            {index + 1} of {flow.length} · {progress}% answered
          </span>
        </div>
        <div style={{ height: 6, borderRadius: 3, background: '#f0f0f0', overflow: 'hidden' }}>
          <div style={{ width: `${progress}%`, height: '100%', background: PINK, transition: 'width .2s' }} />
        </div>
      </div>

      <div style={{ fontSize: 17, fontWeight: 800, color: '#1a1a1a', lineHeight: 1.35 }}>
        {q.text}
        {!q.required && <span style={{ fontSize: 12, fontWeight: 600, color: '#aaa' }}> · optional</span>}
      </div>

      <QuestionInput q={q} value={value} onChange={setValue} />

      {error && <div style={{ color: '#C62828', fontSize: 12.5 }}>{error}</div>}

      {currentProfileId && last && (
        <label style={{ display: 'flex', gap: 8, alignItems: 'center', fontSize: 12.5, color: '#555' }}>
          <input type="checkbox" checked={replaceCurrent} onChange={(e) => setReplaceCurrent(e.target.checked)} />
          Update my current profile&apos;s draft (untick to create a separate profile)
        </label>
      )}

      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        <Btn kind="ghost" onClick={() => save(index - 1)} disabled={busy || index === 0}>
          Back
        </Btn>
        {!q.required && !last && (
          <Btn kind="ghost" onClick={() => setIndex(index + 1)} disabled={busy}>
            Skip
          </Btn>
        )}
        <div style={{ flex: 1 }} />
        {last ? (
          <Btn onClick={finish} disabled={busy || !canNext}>
            {busy ? 'Building…' : 'Generate my Brand Voice'}
          </Btn>
        ) : (
          <Btn onClick={() => save(index + 1)} disabled={busy || !canNext}>
            {busy ? 'Saving…' : 'Next'}
          </Btn>
        )}
      </div>
      <div style={{ fontSize: 11.5, color: '#aaa' }}>
        Answers save as you go, so you can leave and pick up where you stopped.
      </div>
    </Card>
  );
}

function QuestionInput({
  q,
  value,
  onChange,
}: {
  q: AssessmentQuestion;
  value: AnswerValue | undefined;
  onChange: (v: AnswerValue) => void;
}) {
  if (q.type === 'single') {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {q.options?.map((o) => {
          const on = value === o.value;
          return (
            <button
              key={o.value}
              type="button"
              onClick={() => onChange(o.value)}
              style={{
                textAlign: 'left',
                padding: '11px 14px',
                borderRadius: 10,
                border: on ? '1.5px solid #E91E63' : '1px solid rgba(0,0,0,.12)',
                background: on ? PINK_SOFT : '#fff',
                color: on ? PINK : '#333',
                fontWeight: on ? 700 : 600,
                fontSize: 13.5,
                fontFamily: FONT,
                cursor: 'pointer',
              }}
            >
              {o.label}
            </button>
          );
        })}
      </div>
    );
  }
  if (q.type === 'multi') {
    const picked = Array.isArray(value) ? value : [];
    const full = Boolean(q.max_select && picked.length >= q.max_select);
    return (
      <div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
          {q.options?.map((o) => {
            const on = picked.includes(o.value);
            return (
              <Chip
                key={o.value}
                active={on}
                onClick={() =>
                  onChange(on ? picked.filter((x) => x !== o.value) : full ? picked : [...picked, o.value])
                }
              >
                {on ? '✓ ' : ''}
                {o.label}
              </Chip>
            );
          })}
        </div>
        {q.max_select && (
          <div style={{ fontSize: 11.5, color: '#999', marginTop: 8 }}>
            Pick up to {q.max_select} · {picked.length} chosen
          </div>
        )}
      </div>
    );
  }
  if (q.type === 'slider') {
    const n = typeof value === 'number' ? value : 50;
    return (
      <div>
        <input
          type="range"
          min={0}
          max={100}
          value={n}
          onChange={(e) => onChange(Number(e.target.value))}
          aria-label={q.text}
          style={{ width: '100%', accentColor: PINK }}
        />
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: '#777' }}>
          <span>{q.low}</span>
          <span style={{ fontWeight: 800, color: PINK }}>{n}</span>
          <span>{q.high}</span>
        </div>
      </div>
    );
  }
  if (q.type === 'examples') {
    const items = Array.isArray(value) ? value : [];
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {q.prompts?.map((prompt, i) => (
          <label key={prompt} style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
            <span style={{ fontSize: 12.5, color: '#555' }}>
              Customer: <em>&ldquo;{prompt}&rdquo;</em>
            </span>
            <textarea
              rows={2}
              value={items[i] ?? ''}
              placeholder="Your reply…"
              onChange={(e) => {
                const next = [...items];
                while (next.length < (q.prompts?.length ?? 0)) next.push('');
                next[i] = e.target.value;
                onChange(next);
              }}
              style={{ ...inputStyle, resize: 'vertical' }}
            />
          </label>
        ))}
      </div>
    );
  }
  return (
    <textarea
      rows={q.id === 'q42' ? 7 : 3}
      value={typeof value === 'string' ? value : ''}
      placeholder={q.placeholder}
      onChange={(e) => onChange(e.target.value)}
      style={{ ...inputStyle, resize: 'vertical' }}
    />
  );
}
