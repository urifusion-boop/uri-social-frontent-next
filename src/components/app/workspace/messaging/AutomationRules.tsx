'use client';

import { useEffect, useState } from 'react';
import { Pencil, Plus, Trash2 } from 'lucide-react';
import {
  InboxService,
  type AutomationRule,
  type AutomationRuleInput,
  type AutomationRuleKind,
  type RuleAdCampaign,
} from '@/src/api/InboxService';
import { MSG_MUTED } from './MessagingHeader';
import { Box, Btn, Field, Label, Muted, Pill, Toggle, apiError } from './ui';

const SECTIONS: { kind: AutomationRuleKind; label: string; blurb: string }[] = [
  { kind: 'comment', label: 'Comments', blurb: 'Reply publicly when a comment says something you care about.' },
  { kind: 'dm', label: 'Direct messages', blurb: 'Send a private answer when someone messages you about it.' },
  {
    kind: 'comment_to_dm',
    label: 'Comment to DM',
    blurb: 'Reply to a comment in public and send the details privately.',
  },
];

interface Draft {
  name: string;
  keywords: string;
  examples: string;
  any: boolean;
  publicReply: string;
  dm: string;
  platform: string;
  campaignId: string;
}

const EMPTY: Draft = {
  name: '',
  keywords: '',
  examples: '',
  any: false,
  publicReply: '',
  dm: '',
  platform: '',
  campaignId: '',
};

const lines = (text: string): string[] =>
  text
    .split(/[\n,]/)
    .map((t) => t.trim())
    .filter(Boolean);

function draftOf(rule: AutomationRule, campaigns: RuleAdCampaign[]): Draft {
  const campaign = campaigns.find((c) => c.ad_ids.some((a) => rule.ad_ids.includes(a)));
  return {
    name: rule.name,
    keywords: rule.match.keywords.join('\n'),
    examples: rule.match.examples.join('\n'),
    any: rule.match.any,
    publicReply: rule.public_reply,
    dm: rule.dm,
    platform: rule.platforms[0] ?? '',
    campaignId: campaign?.id ?? '',
  };
}

function inputOf(
  kind: AutomationRuleKind,
  d: Draft,
  enabled: boolean,
  campaigns: RuleAdCampaign[]
): AutomationRuleInput {
  const campaign = campaigns.find((c) => c.id === d.campaignId);
  return {
    kind,
    name: d.name.trim(),
    enabled,
    match: {
      keywords: lines(d.keywords),
      examples: d.examples
        .split('\n')
        .map((t) => t.trim())
        .filter(Boolean),
      any: d.any,
    },
    public_reply: d.publicReply.trim(),
    dm: d.dm.trim(),
    ad_ids: campaign?.ad_ids ?? [],
    platforms: d.platform ? [d.platform] : [],
  };
}

function summary(rule: AutomationRule): string {
  const words = rule.match.keywords.slice(0, 4).join(', ');
  if (words) return `When someone says: ${words}`;
  if (rule.match.examples.length) return `When someone asks: ${rule.match.examples[0]}`;
  return 'Any message from the ad';
}

function RuleEditor({
  kind,
  draft,
  campaigns,
  saving,
  onChange,
  onSave,
  onCancel,
}: {
  kind: AutomationRuleKind;
  draft: Draft;
  campaigns: RuleAdCampaign[];
  saving: boolean;
  onChange: (d: Draft) => void;
  onSave: () => void;
  onCancel: () => void;
}) {
  const set = (patch: Partial<Draft>) => onChange({ ...draft, ...patch });
  const select = {
    height: 34,
    borderRadius: 9,
    border: '1px solid #ECE6EA',
    padding: '0 10px',
    fontSize: 12.5,
    background: '#fff',
  } as const;
  return (
    <Box style={{ padding: 14, display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div>
        <Label>When someone writes…</Label>
        <Field
          multiline
          value={draft.keywords}
          onChange={(v) => set({ keywords: v })}
          placeholder={'One word or phrase per line, e.g.\nhow much\nprice'}
          style={{ minHeight: 64 }}
        />
      </div>
      <div>
        <Label>Or asks something like… (optional)</Label>
        <Field
          multiline
          value={draft.examples}
          onChange={(v) => set({ examples: v })}
          placeholder={'One example question per line. URI also catches other ways of asking it.'}
          style={{ minHeight: 52 }}
        />
      </div>
      {kind !== 'dm' && (
        <div>
          <Label>Public reply{kind === 'comment_to_dm' ? ' (optional)' : ''}</Label>
          <Field
            multiline
            value={draft.publicReply}
            onChange={(v) => set({ publicReply: v })}
            placeholder="Thanks for asking! We've sent you a DM."
          />
        </div>
      )}
      {kind !== 'comment' && (
        <div>
          <Label>Private message</Label>
          <Field
            multiline
            value={draft.dm}
            onChange={(v) => set({ dm: v })}
            placeholder="Hi {first_name}! It costs ₦25,000. Order here: https://…"
          />
          <Muted style={{ marginTop: 4 }}>Use {'{first_name}'} to greet them by name. Links are fine.</Muted>
        </div>
      )}
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
        <div style={{ flex: 1, minWidth: 150 }}>
          <Label>Where</Label>
          <select
            value={draft.platform}
            onChange={(e) => set({ platform: e.target.value })}
            style={{ ...select, width: '100%' }}
          >
            <option value="">Instagram and Facebook</option>
            <option value="instagram">Instagram only</option>
            <option value="facebook">Facebook only</option>
          </select>
        </div>
        <div style={{ flex: 1, minWidth: 150 }}>
          <Label>Only for an ad</Label>
          <select
            value={draft.campaignId}
            onChange={(e) => set({ campaignId: e.target.value, any: e.target.value ? draft.any : false })}
            style={{ ...select, width: '100%' }}
          >
            <option value="">Any (posts and all ads)</option>
            {campaigns.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
      </div>
      {draft.campaignId && (
        <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12.5 }}>
          <input type="checkbox" checked={draft.any} onChange={(e) => set({ any: e.target.checked })} />
          Reply to any message that comes from this ad
        </label>
      )}
      <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
        <Btn kind="outline" onClick={onCancel}>
          Cancel
        </Btn>
        <Btn onClick={onSave} disabled={saving}>
          {saving ? 'Saving…' : 'Save rule'}
        </Btn>
      </div>
    </Box>
  );
}

export function AutomationRules() {
  const [rules, setRules] = useState<AutomationRule[]>([]);
  const [campaigns, setCampaigns] = useState<RuleAdCampaign[]>([]);
  const [kind, setKind] = useState<AutomationRuleKind>('comment');
  const [editing, setEditing] = useState<string | 'new' | null>(null);
  const [draft, setDraft] = useState<Draft>(EMPTY);
  const [saving, setSaving] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    InboxService.listRules()
      .then(setRules)
      .catch(() => setError("Couldn't load your rules."));
    InboxService.listRuleAds()
      .then(setCampaigns)
      .catch(() => undefined);
  }, []);

  const shown = rules.filter((r) => r.kind === kind);
  const section = SECTIONS.find((s) => s.kind === kind)!;

  const startNew = () => {
    setDraft(EMPTY);
    setEditing('new');
    setError('');
  };
  const startEdit = (rule: AutomationRule) => {
    setDraft(draftOf(rule, campaigns));
    setEditing(rule.id);
    setError('');
  };
  const switchKind = (next: AutomationRuleKind) => {
    setKind(next);
    setEditing(null);
    setConfirmDelete(null);
  };

  const save = async () => {
    setSaving(true);
    setError('');
    try {
      if (editing === 'new') {
        const created = await InboxService.createRule(inputOf(kind, draft, true, campaigns));
        setRules((rs) => [...rs, created]);
      } else if (editing) {
        const current = rules.find((r) => r.id === editing);
        const updated = await InboxService.updateRule(
          editing,
          inputOf(kind, draft, current?.enabled ?? true, campaigns)
        );
        setRules((rs) => rs.map((r) => (r.id === updated.id ? updated : r)));
      }
      setEditing(null);
    } catch (e) {
      setError(apiError(e, "Couldn't save the rule."));
    } finally {
      setSaving(false);
    }
  };

  const toggle = async (rule: AutomationRule, enabled: boolean) => {
    setRules((rs) => rs.map((r) => (r.id === rule.id ? { ...r, enabled } : r)));
    try {
      await InboxService.updateRule(rule.id, { enabled });
    } catch (e) {
      setRules((rs) => rs.map((r) => (r.id === rule.id ? { ...r, enabled: !enabled } : r)));
      setError(apiError(e, "Couldn't change the rule."));
    }
  };

  const remove = async (id: string) => {
    try {
      await InboxService.deleteRule(id);
      setRules((rs) => rs.filter((r) => r.id !== id));
    } catch (e) {
      setError(apiError(e, "Couldn't delete the rule."));
    }
    setConfirmDelete(null);
  };

  return (
    <div style={{ marginTop: 22 }}>
      <div style={{ fontWeight: 700, fontSize: 15 }}>Your rules</div>
      <Muted style={{ marginTop: 2 }}>Rules answer first. When none fits, Jane handles the message as usual.</Muted>
      <div style={{ display: 'flex', gap: 8, marginTop: 12, flexWrap: 'wrap' }}>
        {SECTIONS.map((s) => {
          const count = rules.filter((r) => r.kind === s.kind).length;
          return (
            <Btn key={s.kind} kind={kind === s.kind ? 'primary' : 'outline'} onClick={() => switchKind(s.kind)}>
              {s.label}
              {count > 0 ? ` · ${count}` : ''}
            </Btn>
          );
        })}
      </div>
      <Muted style={{ marginTop: 10 }}>{section.blurb}</Muted>
      {error && <div style={{ color: '#C62828', fontSize: 12.5, marginTop: 8 }}>{error}</div>}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 9, marginTop: 10 }}>
        {shown.map((rule) =>
          editing === rule.id ? (
            <RuleEditor
              key={rule.id}
              kind={kind}
              draft={draft}
              campaigns={campaigns}
              saving={saving}
              onChange={setDraft}
              onSave={save}
              onCancel={() => setEditing(null)}
            />
          ) : (
            <Box key={rule.id} style={{ padding: '11px 13px' }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 700, fontSize: 13 }}>{rule.name}</div>
                  <div style={{ fontSize: 12, color: MSG_MUTED, marginTop: 2 }}>{summary(rule)}</div>
                  <div style={{ fontSize: 12, marginTop: 5, lineHeight: 1.45 }}>
                    {rule.public_reply && <div>Replies: “{rule.public_reply}”</div>}
                    {rule.dm && <div>DM: “{rule.dm}”</div>}
                  </div>
                  <div style={{ display: 'flex', gap: 6, marginTop: 6, flexWrap: 'wrap' }}>
                    {rule.ad_ids.length > 0 && (
                      <Pill fg="#B26A00" bg="#FFF4E5">
                        One ad
                      </Pill>
                    )}
                    {rule.platforms.length > 0 && (
                      <Pill fg="#2563EB" bg="#EAF2FF">
                        {rule.platforms[0] === 'instagram' ? 'Instagram' : 'Facebook'}
                      </Pill>
                    )}
                    <Pill fg="#777" bg="#F3F2EF">
                      Used {rule.fired_count} time{rule.fired_count === 1 ? '' : 's'}
                    </Pill>
                  </div>
                </div>
                <Toggle on={rule.enabled} onChange={(v) => toggle(rule, v)} label={`${rule.name} on or off`} />
                <Btn kind="ghost" onClick={() => startEdit(rule)} style={{ padding: '0 6px' }}>
                  <Pencil size={14} />
                </Btn>
                <Btn kind="ghost" onClick={() => setConfirmDelete(rule.id)} style={{ padding: '0 6px', color: '#999' }}>
                  <Trash2 size={14} />
                </Btn>
              </div>
              {confirmDelete === rule.id && (
                <div
                  style={{
                    marginTop: 9,
                    padding: '8px 10px',
                    background: '#FDECEA',
                    borderRadius: 8,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    fontSize: 12.5,
                  }}
                >
                  <span style={{ flex: 1 }}>Delete this rule? This can&rsquo;t be undone.</span>
                  <Btn kind="outline" onClick={() => setConfirmDelete(null)}>
                    Keep
                  </Btn>
                  <Btn kind="danger" onClick={() => remove(rule.id)}>
                    Delete
                  </Btn>
                </div>
              )}
            </Box>
          )
        )}
        {editing === 'new' && (
          <RuleEditor
            kind={kind}
            draft={draft}
            campaigns={campaigns}
            saving={saving}
            onChange={setDraft}
            onSave={save}
            onCancel={() => setEditing(null)}
          />
        )}
        {!shown.length && editing !== 'new' && <Muted>No rules here yet.</Muted>}
      </div>
      {editing === null && (
        <Btn kind="outline" onClick={startNew} style={{ marginTop: 10 }}>
          <Plus size={14} /> Add a rule
        </Btn>
      )}
    </div>
  );
}
