/**
 * Step 1 of the wizard — the PRD's (URI Product Evolution, WS5) two plain-language
 * questions: "What do you want to achieve?" and "Where should customers contact you?".
 *
 * Each goal is a business outcome the owner recognises, mapped onto one of the real,
 * launchable objectives the backend returns (CampaignService.getObjectives), plus the
 * follow-up the objective needs (desired_action) and, where the goal already implies
 * it, the destination. The owner never sees Meta's own objective names.
 */
'use client';
import { Megaphone, MousePointerClick, MessageCircle, Users, ShoppingCart, Store, LucideIcon } from 'lucide-react';
import { useEffect, useState } from 'react';

import { CampaignObjectiveChoice, CampaignService } from '@/src/api/CampaignService';
import { useIsMobile } from '@/src/hooks/useIsMobile';

const PINK = '#C2185B';

export type ContactChannel = 'whatsapp' | 'instagram_dm' | 'website';

interface Goal {
  id: string;
  label: string;
  blurb: string;
  objective: string;
  desiredAction?: string;
  /** The goal already says where customers go — no second question. */
  fixedDestination?: ContactChannel;
  /** Goals that reach people without sending them anywhere skip the contact question. */
  noContact?: boolean;
  icon: LucideIcon;
  tint: string;
  fg: string;
}

export const GOALS: Goal[] = [
  { id: 'customers', label: 'Get more customers', blurb: 'Reach people likely to buy from you.', objective: 'sales',
    icon: Store, tint: '#FDE7EF', fg: '#C2185B' },
  { id: 'leads', label: 'Generate leads', blurb: 'Collect enquiries from interested people.', objective: 'leads',
    icon: Users, tint: '#EEE7FB', fg: '#6D3FC2' },
  { id: 'sell', label: 'Sell more products', blurb: 'Get people to buy what you sell.', objective: 'sales',
    desiredAction: 'purchase', icon: ShoppingCart, tint: '#FDE7EF', fg: '#C2185B' },
  { id: 'whatsapp', label: 'Receive WhatsApp enquiries', blurb: 'Get people messaging you on WhatsApp.',
    objective: 'engagement', desiredAction: 'send_message', fixedDestination: 'whatsapp',
    icon: MessageCircle, tint: '#E3F6EA', fg: '#1E8E4E' },
  { id: 'website', label: 'Drive website visits', blurb: 'Send people to your website.', objective: 'traffic',
    desiredAction: 'visit_site', fixedDestination: 'website', icon: MousePointerClick, tint: '#E6F0FD', fg: '#2563C2' },
  { id: 'awareness', label: 'Get my business known', blurb: 'Show your business to as many people as possible.',
    objective: 'awareness', noContact: true, icon: Megaphone, tint: '#FDF1DC', fg: '#B5790A' },
];

const CONTACTS: { id: ContactChannel; label: string; field: string; placeholder: string }[] = [
  { id: 'whatsapp', label: 'WhatsApp', field: 'Your WhatsApp number', placeholder: 'e.g. 0803 123 4567' },
  { id: 'instagram_dm', label: 'Instagram DM', field: 'Your Instagram handle', placeholder: 'e.g. @yourbusiness' },
  { id: 'website', label: 'Website', field: 'Your website link', placeholder: 'e.g. yourbusiness.com' },
];

/** The goal behind a saved objective — older drafts and duplicates only carry the objective. */
export function goalFor(value: { goal?: string; value: string } | null | undefined): Goal | undefined {
  if (!value) return undefined;
  return GOALS.find((g) => g.id === value.goal) ?? GOALS.find((g) => g.objective === value.value);
}

/** Whether the step has everything it needs: a goal and, where the goal asks, a contact channel. */
export function objectiveComplete(value: WizardObjectiveValue | null): boolean {
  if (!value) return false;
  const goal = goalFor(value);
  if (!goal || goal.noContact || goal.fixedDestination) return true;
  return Boolean(value.destination_type);
}

export interface WizardObjectiveValue {
  value: string;
  label: string;
  blurb: string;
  caveat: string;
  /** Which PRD goal was picked (GOALS[].id). */
  goal?: string;
  desired_action?: string;
  /** "Where should customers contact you?" — blank means Jane uses the brand's saved choice. */
  destination_type?: ContactChannel;
  /** The number, handle or link for destination_type. Blank keeps what the brand already has. */
  destination_value?: string;
}

export default function WizardObjectiveStep({
  value,
  onPick,
  platform = 'meta',
}: {
  value: WizardObjectiveValue | null;
  onPick: (choice: WizardObjectiveValue) => void;
  /** Mirrors the chat flow's own `ObjectivePicker` call exactly — objectives'
   *  blurbs/caveats legitimately differ by platform (CampaignService.getObjectives
   *  hits /jane-ads/objectives?platform=...). Objective is step 1, before Platform
   *  is chosen, so this is 'meta' on first visit same as the chat page's own
   *  default; revisiting this step after picking TikTok on Platform refetches with
   *  TikTok's own set. */
  platform?: 'meta' | 'tiktok';
}) {
  const [choices, setChoices] = useState<CampaignObjectiveChoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);
  const isMobile = useIsMobile();

  useEffect(() => {
    let alive = true;
    setLoading(true);
    setFailed(false);
    CampaignService.getObjectives(platform)
      .then((c) => {
        if (alive) setChoices(c);
      })
      .catch(() => {
        if (alive) setFailed(true);
      })
      .finally(() => {
        if (alive) setLoading(false);
      });
    return () => {
      alive = false;
    };
  }, [platform]);

  if (loading) {
    return <p style={{ fontSize: 13, color: '#8a8080' }}>Loading objectives…</p>;
  }
  if (failed || !choices.length) {
    return <p style={{ fontSize: 13, color: '#b91c1c' }}>Couldn't load campaign objectives — try again shortly.</p>;
  }

  const available = new Map(choices.map((c) => [c.value, c]));
  const goals = GOALS.filter((g) => available.has(g.objective));
  const current = goalFor(value);
  const contacts = CONTACTS.filter((c) => !(platform === 'tiktok' && c.id === 'instagram_dm'));
  const channel: ContactChannel | undefined = current?.fixedDestination ?? value?.destination_type;
  const channelInfo = CONTACTS.find((c) => c.id === channel);

  const pickGoal = (g: Goal) => {
    const c = available.get(g.objective)!;
    // A channel already chosen carries over to the new goal; a goal that names its own wins.
    const nextChannel = g.noContact ? undefined : (g.fixedDestination ?? value?.destination_type);
    onPick({
      value: g.objective,
      label: g.label,
      blurb: c.blurb,
      caveat: c.caveat,
      goal: g.id,
      desired_action: g.desiredAction,
      destination_type: nextChannel,
      destination_value: nextChannel && nextChannel === value?.destination_type ? value?.destination_value : '',
    });
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
      <div>
        <p style={{ fontSize: 13.5, fontWeight: 800, color: '#1a0a12', margin: '0 0 10px' }}>What do you want to achieve?</p>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: isMobile ? 'minmax(0, 1fr)' : 'repeat(3, 1fr)',
            gap: 10,
          }}
        >
          {goals.map((g) => {
            const Icon = g.icon;
            const isOn = current?.id === g.id;
            return (
              <button
                key={g.id}
                type="button"
                data-testid={`wizard-goal-${g.id}`}
                aria-pressed={isOn}
                onClick={() => pickGoal(g)}
                style={{
                  position: 'relative',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 6,
                  textAlign: 'left',
                  border: isOn ? `1.5px solid ${PINK}` : '1px solid #ece8e6',
                  background: isOn ? 'rgba(194,24,91,.05)' : '#fff',
                  borderRadius: 12,
                  padding: '12px 14px',
                  cursor: 'pointer',
                  transition: 'border-color .12s ease, background .12s ease, box-shadow .12s ease',
                  boxShadow: isOn ? '0 2px 8px rgba(194,24,91,.14)' : 'none',
                }}
              >
                {isOn && (
                  <span
                    style={{
                      position: 'absolute',
                      top: 10,
                      right: 10,
                      width: 17,
                      height: 17,
                      borderRadius: '50%',
                      background: PINK,
                      color: '#fff',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: 10,
                      fontWeight: 800,
                    }}
                  >
                    ✓
                  </span>
                )}
                <span
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: 32,
                    height: 32,
                    borderRadius: 9,
                    background: g.tint,
                    color: g.fg,
                  }}
                >
                  <Icon size={16} strokeWidth={2} />
                </span>
                <span style={{ fontSize: 13, fontWeight: 800, color: '#1a0a12' }}>{g.label}</span>
                <span style={{ fontSize: 11.5, color: '#7a7270', lineHeight: 1.4 }}>{g.blurb}</span>
                {isOn && available.get(g.objective)?.caveat && (
                  <span style={{ fontSize: 11, color: '#9a6a00', lineHeight: 1.4, marginTop: 1 }}>
                    {available.get(g.objective)?.caveat}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {current && !current.noContact && value && (
        <div data-testid="wizard-contact">
          <p style={{ fontSize: 13.5, fontWeight: 800, color: '#1a0a12', margin: '0 0 10px' }}>
            Where should customers contact you?
          </p>
          {!current.fixedDestination && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 10 }}>
              {contacts.map((c) => {
                const on = channel === c.id;
                return (
                  <button
                    key={c.id}
                    type="button"
                    data-testid={`wizard-contact-${c.id}`}
                    aria-pressed={on}
                    onClick={() => onPick({ ...value, destination_type: c.id, destination_value: '' })}
                    style={{
                      border: on ? `1.5px solid ${PINK}` : '1px solid #ece8e6',
                      background: on ? 'rgba(194,24,91,.05)' : '#fff',
                      color: '#1a0a12',
                      borderRadius: 999,
                      padding: '7px 14px',
                      fontSize: 12.5,
                      fontWeight: 700,
                      cursor: 'pointer',
                    }}
                  >
                    {c.label}
                  </button>
                );
              })}
            </div>
          )}
          {channelInfo && (
            <label style={{ display: 'flex', flexDirection: 'column', gap: 5, maxWidth: 420 }}>
              <span style={{ fontSize: 12, fontWeight: 700, color: '#4a3f3c' }}>{channelInfo.field}</span>
              <input
                data-testid="wizard-contact-value"
                value={value.destination_value ?? ''}
                placeholder={channelInfo.placeholder}
                onChange={(e) => onPick({ ...value, destination_type: channelInfo.id, destination_value: e.target.value })}
                style={{
                  border: '1px solid #e4dedb',
                  borderRadius: 10,
                  padding: '9px 12px',
                  fontSize: 13,
                  outline: 'none',
                }}
              />
              <span style={{ fontSize: 11, color: '#8a8080' }}>
                Leave it blank to use the one you&rsquo;ve already saved with URI.
              </span>
            </label>
          )}
        </div>
      )}
    </div>
  );
}
