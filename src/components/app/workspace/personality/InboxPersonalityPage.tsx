'use client';

import { useCallback, useEffect, useState } from 'react';
import {
  BrandVoiceService,
  VoiceAuditEntry,
  VoiceCatalog,
  VoiceInsights,
  VoiceProfile,
  VoiceVersion,
} from '@/src/api/BrandVoiceService';
import { PersonalityAdvanced } from './PersonalityAdvanced';
import { PersonalityAssessment } from './PersonalityAssessment';
import { PersonalityLearn } from './PersonalityLearn';
import { PersonalityPlayground } from './PersonalityPlayground';
import { Btn, Card, Chip, FONT, PINK, PINK_SOFT, TRAIT_NAMES, errorText, statusOf, when } from './ui';

/*
 * Brand Voice (Personality PRD): how the inbox agent sounds. Three ways in (a
 * template, the assessment, the business's own replies) all land on one editable
 * draft profile, which an admin publishes. Customers only ever hear a published
 * version; every publish is kept and any one can be restored.
 */

type Tab = 'overview' | 'templates' | 'assessment' | 'learn' | 'playground' | 'advanced' | 'history';

const TABS: { id: Tab; label: string }[] = [
  { id: 'overview', label: 'Overview' },
  { id: 'templates', label: 'Templates' },
  { id: 'assessment', label: 'Discover my voice' },
  { id: 'learn', label: 'Learn from conversations' },
  { id: 'playground', label: 'Playground' },
  { id: 'advanced', label: 'Advanced' },
  { id: 'history', label: 'History' },
];

const NEEDS_PROFILE: Tab[] = ['learn', 'playground', 'advanced', 'history'];

const AUDIT_LABELS: Record<string, string> = {
  created: 'Created',
  edited: 'Edited draft',
  published: 'Published',
  rolled_back: 'Rolled back',
  archived: 'Archived',
};

export function InboxPersonalityPage({ isMobile }: { isMobile: boolean }) {
  const [tab, setTab] = useState<Tab>('overview');
  const [catalog, setCatalog] = useState<VoiceCatalog | null>(null);
  const [profiles, setProfiles] = useState<VoiceProfile[]>([]);
  const [activeId, setActiveId] = useState('');
  const [canPublish, setCanPublish] = useState(false);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState('');

  const load = useCallback(async () => {
    const [cat, ov] = await Promise.all([BrandVoiceService.catalog(), BrandVoiceService.overview()]);
    setCatalog(cat);
    setProfiles(ov.profiles);
    setCanPublish(ov.can_publish);
    setActiveId((prev) => (ov.profiles.some((p) => p.id === prev) ? prev : (ov.profiles[0]?.id ?? '')));
  }, []);

  useEffect(() => {
    load().catch((e) => setError(errorText(e, "Couldn't load Brand Voice. Try again.")));
  }, [load]);

  const profile = profiles.find((p) => p.id === activeId);

  function upsert(p: VoiceProfile) {
    setProfiles((prev) => {
      const exists = prev.some((x) => x.id === p.id);
      const next = exists ? prev.map((x) => (x.id === p.id ? p : x)) : [...prev, p];
      return p.is_default ? next.map((x) => (x.id === p.id ? x : { ...x, is_default: false })) : next;
    });
    setActiveId(p.id);
  }

  async function applyTemplate(templateId: string) {
    setBusy(templateId);
    setError('');
    try {
      const p = profile
        ? await BrandVoiceService.updateProfile(profile.id, { template_id: templateId, apply_template: true })
        : await BrandVoiceService.createProfile(templateId);
      upsert(p);
      setTab('playground');
    } catch (e) {
      setError(errorText(e, "Couldn't use that template."));
    }
    setBusy('');
  }

  async function newProfile(templateId: string) {
    setBusy(`new:${templateId}`);
    try {
      upsert(await BrandVoiceService.createProfile(templateId));
      setTab('playground');
    } catch (e) {
      setError(errorText(e, "Couldn't create that profile."));
    }
    setBusy('');
  }

  async function publish() {
    if (!profile) return;
    setBusy('publish');
    setError('');
    try {
      upsert(await BrandVoiceService.publish(profile.id));
    } catch (e) {
      setError(errorText(e, "Couldn't publish. Try again."));
    }
    setBusy('');
  }

  if (!catalog) {
    return (
      <div style={{ padding: 24, color: error ? '#C62828' : '#999', fontSize: 13, fontFamily: FONT }}>
        {error || 'Loading Brand Voice…'}
      </div>
    );
  }

  return (
    <div
      style={{
        padding: isMobile ? 14 : 24,
        display: 'flex',
        flexDirection: 'column',
        gap: 16,
        maxWidth: 820,
        margin: '0 auto',
        boxSizing: 'border-box',
        fontFamily: FONT,
      }}
    >
      <div style={{ display: 'flex', gap: 6, overflowX: 'auto', paddingBottom: 2 }}>
        {TABS.map((t) => {
          const locked = NEEDS_PROFILE.includes(t.id) && !profile;
          return (
            <button
              key={t.id}
              type="button"
              disabled={locked}
              onClick={() => setTab(t.id)}
              title={locked ? 'Pick a template or take the assessment first' : undefined}
              style={{
                padding: '7px 12px',
                borderRadius: 999,
                border: tab === t.id ? '1px solid #E91E63' : '1px solid rgba(0,0,0,.1)',
                background: tab === t.id ? PINK_SOFT : '#fff',
                color: locked ? '#ccc' : tab === t.id ? PINK : '#555',
                fontSize: 12.5,
                fontWeight: 700,
                fontFamily: FONT,
                cursor: locked ? 'not-allowed' : 'pointer',
                whiteSpace: 'nowrap',
              }}
            >
              {t.label}
            </button>
          );
        })}
      </div>

      {profiles.length > 1 && (
        <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap', fontSize: 12.5, color: '#666' }}>
          Editing:
          {profiles.map((p) => (
            <Chip key={p.id} active={p.id === activeId} onClick={() => setActiveId(p.id)}>
              {p.name}
              {p.is_default ? ' · default' : ''}
              {p.departments.length ? ` · ${p.departments.join(', ')}` : ''}
            </Chip>
          ))}
        </div>
      )}

      {error && <div style={{ color: '#C62828', fontSize: 12.5 }}>{error}</div>}

      {tab === 'overview' && (
        <Overview
          profile={profile}
          canPublish={canPublish}
          busy={busy}
          onPublish={publish}
          onGo={setTab}
          onProfileChange={upsert}
        />
      )}

      {tab === 'templates' && (
        <Card
          title="Start from a template"
          desc={
            profile
              ? 'Applying a template resets the traits and language of your draft. Everything else you set stays.'
              : 'Pick the closest style; every setting stays editable.'
          }
        >
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(230px, 1fr))', gap: 12 }}>
            {catalog.templates.map((t) => (
              <div
                key={t.id}
                style={{
                  border: profile?.template_id === t.id ? '1.5px solid #E91E63' : '1px solid rgba(0,0,0,.1)',
                  borderRadius: 12,
                  padding: 14,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 8,
                }}
              >
                <div style={{ fontWeight: 800, fontSize: 14, color: '#1a1a1a' }}>{t.name}</div>
                <div style={{ fontSize: 12.5, color: '#555' }}>{t.voice}</div>
                <div style={{ fontSize: 11.5, color: '#999' }}>For {t.suitable_for.toLowerCase()}</div>
                <div
                  style={{
                    fontSize: 12.5,
                    color: '#333',
                    background: '#f7f7f7',
                    borderRadius: 10,
                    padding: '8px 10px',
                    fontStyle: 'italic',
                  }}
                >
                  &ldquo;{t.example}&rdquo;
                </div>
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 'auto' }}>
                  <Btn small onClick={() => applyTemplate(t.id)} disabled={busy !== ''}>
                    {busy === t.id ? 'Applying…' : profile ? 'Apply to draft' : 'Use this'}
                  </Btn>
                  {profile && canPublish && (
                    <Btn small kind="ghost" onClick={() => newProfile(t.id)} disabled={busy !== ''}>
                      New profile
                    </Btn>
                  )}
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {tab === 'assessment' && (
        <PersonalityAssessment
          currentProfileId={profile?.id}
          onGenerated={(p) => {
            upsert(p);
            setTab('overview');
          }}
        />
      )}

      {tab === 'learn' && profile && <PersonalityLearn profile={profile} catalog={catalog} onProfileChange={upsert} />}
      {tab === 'playground' && profile && (
        <PersonalityPlayground profile={profile} catalog={catalog} onProfileChange={upsert} />
      )}
      {tab === 'advanced' && profile && (
        <PersonalityAdvanced profile={profile} catalog={catalog} canPublish={canPublish} onProfileChange={upsert} />
      )}
      {tab === 'history' && profile && <History profile={profile} canPublish={canPublish} onProfileChange={upsert} />}
    </div>
  );
}

function Overview({
  profile,
  canPublish,
  busy,
  onPublish,
  onGo,
  onProfileChange,
}: {
  profile?: VoiceProfile;
  canPublish: boolean;
  busy: string;
  onPublish: () => void;
  onGo: (t: Tab) => void;
  onProfileChange: (p: VoiceProfile) => void;
}) {
  if (!profile) {
    return (
      <Card
        title="Give your inbox agent a voice"
        desc="Choose how URI sounds when it replies to your customers. Facts still come only from your FAQs and Brand Playbook."
      >
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12 }}>
          {[
            { tab: 'templates' as Tab, title: 'Choose a template', text: 'Eight ready-made styles. Two minutes.' },
            {
              tab: 'assessment' as Tab,
              title: 'Discover my brand voice',
              text: 'Answer questions about how you talk to customers.',
            },
            {
              tab: 'templates' as Tab,
              title: 'Learn from my conversations',
              text: 'Start from a template, then teach URI from replies you have sent.',
            },
          ].map((o) => (
            <button
              key={o.title}
              type="button"
              onClick={() => onGo(o.tab)}
              style={{
                textAlign: 'left',
                border: '1px solid rgba(0,0,0,.1)',
                borderRadius: 12,
                padding: 14,
                background: '#fff',
                cursor: 'pointer',
                fontFamily: FONT,
              }}
            >
              <div style={{ fontWeight: 800, fontSize: 14, color: PINK }}>{o.title}</div>
              <div style={{ fontSize: 12.5, color: '#666', marginTop: 4 }}>{o.text}</div>
            </button>
          ))}
        </div>
      </Card>
    );
  }

  const status = statusOf(profile);
  const top = Object.entries(profile.traits)
    .sort((a, b) => Math.abs(b[1] - 50) - Math.abs(a[1] - 50))
    .slice(0, 6);
  const language =
    (profile.language.default === 'en-NG' ? 'Nigerian English' : 'Standard English') +
    (profile.language.allowed.includes('pcm') ? ' · Pidgin when the customer uses it' : '');

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <Card title={profile.name} desc={profile.summary} right={<Chip tone={status.tone}>{status.text}</Chip>}>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {top.map(([k, v]) => (
            <Chip key={k} tone="pink">
              {TRAIT_NAMES[k] ?? k} {v}
            </Chip>
          ))}
        </div>
        <div style={{ fontSize: 12.5, color: '#555' }}>
          <strong>Language:</strong> {language}
        </div>
        {(profile.departments.length > 0 || profile.is_default) && (
          <div style={{ fontSize: 12.5, color: '#555' }}>
            <strong>Answers:</strong>{' '}
            {[profile.is_default ? 'everything by default' : '', ...profile.departments].filter(Boolean).join(', ')}
          </div>
        )}
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <Btn kind="secondary" onClick={() => onGo('playground')}>
            Test
          </Btn>
          <Btn kind="ghost" onClick={() => onGo('advanced')}>
            Edit
          </Btn>
          <Btn kind="ghost" onClick={() => onGo('history')}>
            History
          </Btn>
          <div style={{ flex: 1 }} />
          {canPublish ? (
            <Btn
              onClick={onPublish}
              disabled={busy === 'publish' || (Boolean(profile.active_version) && !profile.has_unpublished_changes)}
            >
              {busy === 'publish' ? 'Publishing…' : profile.active_version ? 'Publish changes' : 'Publish'}
            </Btn>
          ) : (
            <span style={{ fontSize: 12, color: '#999' }}>An admin publishes changes.</span>
          )}
        </div>
        {!profile.active_version && (
          <div style={{ fontSize: 12, color: '#7A4B00' }}>
            Not live yet: replies use your Brand Playbook&apos;s voice until you publish.
          </div>
        )}
      </Card>
      <InsightsCard onProfileChange={onProfileChange} />
    </div>
  );
}

function InsightsCard({ onProfileChange }: { onProfileChange: (p: VoiceProfile) => void }) {
  const [data, setData] = useState<VoiceInsights | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    BrandVoiceService.insights()
      .then(setData)
      .catch(() => setData(null));
  }, []);

  if (!data) return null;
  const m = data.metrics;

  async function decide(id: string, accept: boolean) {
    try {
      const updated = await BrandVoiceService.decideSuggestion(id, accept);
      setData((prev) => (prev ? { ...prev, suggestions: prev.suggestions.filter((s) => s.id !== id) } : prev));
      if (updated) onProfileChange(updated);
    } catch (e) {
      setError(errorText(e, "Couldn't save that."));
    }
  }

  return (
    <Card title="How it's landing" desc="The last 30 days of drafts and what your team did with them.">
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: 10 }}>
        {[
          ['Drafts', m.drafts],
          ['Auto-sent', m.auto_sent],
          ['Sent as written', m.sent_as_is],
          ['Edited first', m.edited],
          ['Accepted rate', m.accepted_rate === null ? '—' : `${Math.round(m.accepted_rate * 100)}%`],
        ].map(([label, value]) => (
          <div key={String(label)} style={{ background: '#fafafa', borderRadius: 10, padding: '10px 12px' }}>
            <div style={{ fontSize: 11.5, color: '#999' }}>{label}</div>
            <div style={{ fontSize: 18, fontWeight: 800, color: '#1a1a1a' }}>{value}</div>
          </div>
        ))}
      </div>
      {data.suggestions.map((s) => (
        <div
          key={s.id}
          style={{
            border: '1px solid #F5D9A8',
            background: '#FFF7E6',
            borderRadius: 10,
            padding: '10px 12px',
            display: 'flex',
            gap: 10,
            alignItems: 'center',
            flexWrap: 'wrap',
          }}
        >
          <div style={{ flex: 1, minWidth: 200 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: '#7A4B00' }}>{s.title}</div>
            <div style={{ fontSize: 12, color: '#7A4B00' }}>
              {s.evidence}. Suggested:{' '}
              {Object.entries(s.change)
                .map(([k, v]) => `${TRAIT_NAMES[k] ?? k} ${Number(v) > 0 ? '+' : ''}${v}`)
                .join(', ')}{' '}
              (goes to your draft; publish to make it live).
            </div>
          </div>
          <Btn small onClick={() => decide(s.id, true)}>
            Apply to draft
          </Btn>
          <Btn small kind="ghost" onClick={() => decide(s.id, false)}>
            Dismiss
          </Btn>
        </div>
      ))}
      {error && <div style={{ color: '#C62828', fontSize: 12.5 }}>{error}</div>}
    </Card>
  );
}

function History({
  profile,
  canPublish,
  onProfileChange,
}: {
  profile: VoiceProfile;
  canPublish: boolean;
  onProfileChange: (p: VoiceProfile) => void;
}) {
  const [versions, setVersions] = useState<VoiceVersion[]>([]);
  const [audit, setAudit] = useState<VoiceAuditEntry[]>([]);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(0);

  useEffect(() => {
    BrandVoiceService.versions(profile.id)
      .then((r) => {
        setVersions(r.versions);
        setAudit(r.audit);
      })
      .catch((e) => setError(errorText(e, "Couldn't load the history.")));
  }, [profile.id, profile.active_version]);

  async function restore(v: number) {
    setBusy(v);
    setError('');
    try {
      onProfileChange(await BrandVoiceService.rollback(profile.id, v));
    } catch (e) {
      setError(errorText(e, "Couldn't roll back."));
    }
    setBusy(0);
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <Card
        title="Published versions"
        desc="Restoring publishes that version again as the newest one. Nothing is deleted."
      >
        {versions.length === 0 && <div style={{ fontSize: 12.5, color: '#999' }}>Not published yet.</div>}
        {versions.map((v) => (
          <div
            key={v.version}
            style={{ display: 'flex', gap: 10, alignItems: 'center', fontSize: 13, flexWrap: 'wrap' }}
          >
            <Chip tone={v.version === profile.active_version ? 'green' : 'grey'}>v{v.version}</Chip>
            <span style={{ fontWeight: 700 }}>{v.name}</span>
            <span style={{ color: '#999' }}>{when(v.published_at)}</span>
            {v.note && <span style={{ color: '#777' }}>· {v.note}</span>}
            <div style={{ flex: 1 }} />
            {canPublish && v.version !== profile.active_version && (
              <Btn small kind="ghost" onClick={() => restore(v.version)} disabled={busy !== 0}>
                {busy === v.version ? 'Restoring…' : 'Restore'}
              </Btn>
            )}
          </div>
        ))}
        {error && <div style={{ color: '#C62828', fontSize: 12.5 }}>{error}</div>}
      </Card>
      <Card title="Change log">
        {audit.map((a, i) => (
          <div key={i} style={{ display: 'flex', gap: 10, fontSize: 12.5, color: '#555' }}>
            <span style={{ color: '#999', minWidth: 110 }}>{when(a.at)}</span>
            <span style={{ fontWeight: 700 }}>{AUDIT_LABELS[a.action] ?? a.action}</span>
            <span style={{ color: '#888' }}>
              {Array.isArray(a.detail.fields) ? (a.detail.fields as string[]).join(', ') : ''}
              {a.detail.version ? `v${String(a.detail.version)}` : ''}
              {a.detail.method && a.action !== 'published' ? ` · via ${String(a.detail.method)}` : ''}
            </span>
          </div>
        ))}
      </Card>
    </div>
  );
}
