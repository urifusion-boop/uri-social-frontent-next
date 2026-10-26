'use client';

import { useEffect, useState } from 'react';
import { BrandVoiceService, PreviewReply, VoiceCatalog, VoiceProfile } from '@/src/api/BrandVoiceService';
import { Btn, Card, Chip, FONT, PINK, errorText, inputStyle, when } from './ui';

/*
 * Calibration playground (PRD §8): sample replies in the DRAFT voice, against the
 * business's real FAQs. A rating nudges the draft and redrafts that scenario so the
 * two can be compared side by side. Nothing here is ever sent to a customer.
 */

interface Compared {
  before: string;
  after: PreviewReply | null;
  label: string;
}

export function PersonalityPlayground({
  profile,
  catalog,
  onProfileChange,
}: {
  profile: VoiceProfile;
  catalog: VoiceCatalog;
  onProfileChange: (p: VoiceProfile) => void;
}) {
  const [picked, setPicked] = useState<string[]>(catalog.scenarios.map((s) => s.id));
  const [message, setMessage] = useState('');
  const [kind, setKind] = useState<'dm' | 'comment'>('dm');
  const [language, setLanguage] = useState<'en' | 'pcm'>('en');
  const [replies, setReplies] = useState<PreviewReply[]>([]);
  const [compared, setCompared] = useState<Record<string, Compared>>({});
  const [rewriting, setRewriting] = useState<string | null>(null);
  const [rewrite, setRewrite] = useState('');
  const [busy, setBusy] = useState<string>('');
  const [error, setError] = useState('');
  const [history, setHistory] = useState<{ label_text: string; scenario_id: string; at: string }[]>([]);

  useEffect(() => {
    BrandVoiceService.calibrationHistory(profile.id)
      .then(setHistory)
      .catch(() => setHistory([]));
  }, [profile.id, compared]);

  async function run(custom: boolean) {
    setBusy('preview');
    setError('');
    setCompared({});
    try {
      const out = await BrandVoiceService.preview({
        profileId: profile.id,
        scenarioIds: custom ? undefined : picked,
        message: custom ? message : '',
        kind,
        language,
      });
      setReplies(out);
    } catch (e) {
      setError(errorText(e, "Couldn't write sample replies right now. Try again."));
    }
    setBusy('');
  }

  async function rate(r: PreviewReply, label: string, text = '') {
    setBusy(`${r.scenario_id}:${label}`);
    setError('');
    try {
      const out = await BrandVoiceService.calibrate({
        profileId: profile.id,
        scenarioId: r.scenario_id,
        reply: r.reply,
        label,
        rewrite: text,
      });
      onProfileChange(out.profile);
      setCompared((prev) => ({
        ...prev,
        [r.scenario_id]: { before: out.before, after: out.after, label: catalog.feedback_labels[label] ?? label },
      }));
      setRewriting(null);
      setRewrite('');
    } catch (e) {
      setError(errorText(e, "Couldn't save that rating. Try again."));
    }
    setBusy('');
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <Card
        title="Test your voice"
        desc="Sample replies use your draft voice and your real FAQs. Rate them and URI adjusts the draft; customers keep hearing the published version until you publish again."
      >
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
          {catalog.scenarios.map((s) => (
            <Chip
              key={s.id}
              active={picked.includes(s.id)}
              onClick={() =>
                setPicked((prev) => (prev.includes(s.id) ? prev.filter((x) => x !== s.id) : [...prev, s.id]))
              }
            >
              {s.title}
            </Chip>
          ))}
        </div>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
          <select
            value={kind}
            onChange={(e) => setKind(e.target.value as 'dm' | 'comment')}
            style={{ ...inputStyle, width: 'auto' }}
            aria-label="Channel"
          >
            <option value="dm">Direct message</option>
            <option value="comment">Public comment</option>
          </select>
          <select
            value={language}
            onChange={(e) => setLanguage(e.target.value as 'en' | 'pcm')}
            style={{ ...inputStyle, width: 'auto' }}
            aria-label="Customer language"
          >
            <option value="en">Customer writes English</option>
            <option value="pcm">Customer writes Pidgin</option>
          </select>
          <Btn onClick={() => run(false)} disabled={busy !== '' || picked.length === 0}>
            {busy === 'preview' ? 'Writing…' : `Write ${picked.length} sample${picked.length === 1 ? '' : 's'}`}
          </Btn>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <input
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Or type your own customer message…"
            style={inputStyle}
          />
          <Btn kind="secondary" onClick={() => run(true)} disabled={busy !== '' || !message.trim()}>
            Try it
          </Btn>
        </div>
        {error && <div style={{ color: '#C62828', fontSize: 12.5 }}>{error}</div>}
      </Card>

      {replies.map((r) => {
        const c = compared[r.scenario_id];
        return (
          <Card key={r.scenario_id} title={r.title} right={<Chip tone="grey">{r.situation_label}</Chip>}>
            <div style={{ fontSize: 12.5, color: '#666' }}>
              Customer: <em>&ldquo;{r.message}&rdquo;</em>
            </div>
            {c ? (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 10 }}>
                <Bubble title="Before" text={c.before} muted />
                <Bubble title={`After · ${c.label}`} text={c.after?.reply ?? 'Saved. No redraft needed.'} />
              </div>
            ) : (
              <Bubble title={`URI · ${r.confidence}% sure`} text={r.reply || '(no reply drafted)'} />
            )}
            {r.banned_words.length > 0 && (
              <div style={{ fontSize: 12, color: '#C62828' }}>Used a banned word: {r.banned_words.join(', ')}</div>
            )}
            {r.sources.length > 0 && (
              <div style={{ fontSize: 11.5, color: '#999' }}>
                Facts from: {r.sources.map((s) => s.label).join(' · ')}
              </div>
            )}
            {rewriting === r.scenario_id ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <textarea
                  rows={3}
                  value={rewrite}
                  onChange={(e) => setRewrite(e.target.value)}
                  placeholder="Write it exactly the way you'd send it"
                  style={{ ...inputStyle, resize: 'vertical' }}
                />
                <div style={{ display: 'flex', gap: 8 }}>
                  <Btn small onClick={() => rate(r, 'rewrite', rewrite)} disabled={!rewrite.trim() || busy !== ''}>
                    Save as an example
                  </Btn>
                  <Btn small kind="ghost" onClick={() => setRewriting(null)}>
                    Cancel
                  </Btn>
                </div>
              </div>
            ) : (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {Object.entries(catalog.feedback_labels).map(([key, label]) => (
                  <button
                    key={key}
                    type="button"
                    disabled={busy !== '' || !r.reply}
                    onClick={() =>
                      key === 'rewrite' ? (setRewriting(r.scenario_id), setRewrite(r.reply)) : rate(r, key)
                    }
                    style={{
                      borderRadius: 999,
                      padding: '4px 10px',
                      fontSize: 12,
                      fontWeight: 600,
                      fontFamily: FONT,
                      cursor: 'pointer',
                      border: key === 'sounds_like_us' ? '1px solid #A5D6A7' : '1px solid rgba(0,0,0,.12)',
                      background: key === 'sounds_like_us' ? '#E8F5E9' : '#fff',
                      color: key === 'sounds_like_us' ? '#1B5E20' : '#444',
                      opacity: busy === `${r.scenario_id}:${key}` ? 0.5 : 1,
                    }}
                  >
                    {label}
                  </button>
                ))}
              </div>
            )}
          </Card>
        );
      })}

      {history.length > 0 && (
        <Card title="Calibration history" desc="Every rating is kept, with the profile version it was made against.">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {history.slice(0, 12).map((h, i) => (
              <div key={i} style={{ display: 'flex', gap: 10, fontSize: 12.5, color: '#555' }}>
                <span style={{ color: '#999', minWidth: 110 }}>{when(h.at)}</span>
                <span style={{ fontWeight: 700, color: PINK }}>{h.label_text}</span>
                <span>{catalog.scenarios.find((s) => s.id === h.scenario_id)?.title ?? 'Custom message'}</span>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}

function Bubble({ title, text, muted }: { title: string; text: string; muted?: boolean }) {
  return (
    <div
      style={{
        background: muted ? '#f6f6f6' : 'rgba(194,24,91,.05)',
        border: muted ? '1px solid rgba(0,0,0,.06)' : '1px solid rgba(194,24,91,.18)',
        borderRadius: 12,
        padding: '10px 12px',
      }}
    >
      <div style={{ fontSize: 11, fontWeight: 700, color: muted ? '#999' : PINK, marginBottom: 4 }}>{title}</div>
      <div style={{ fontSize: 13.5, color: muted ? '#777' : '#1a1a1a', lineHeight: 1.5, whiteSpace: 'pre-wrap' }}>
        {text}
      </div>
    </div>
  );
}
