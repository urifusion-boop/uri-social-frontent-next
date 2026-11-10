/**
 * Step 1 of the wizard — same data source as the chat flow's ObjectivePicker
 * (CampaignService.getObjectives), with the mockup's "Get more X" phrasing, colored
 * icon badges and 3-up layout instead of the chat version's compact, monochrome one.
 * Still exactly the 5 real, launchable objectives the backend returns — see DISPLAY's
 * own comment below for why there's no separate 6th "likes/comments/shares" card.
 */
'use client';
import { Megaphone, MousePointerClick, MessageCircle, Users, ShoppingCart, LucideIcon } from 'lucide-react';
import { useEffect, useState } from 'react';

import { CampaignObjectiveChoice, CampaignService } from '@/src/api/CampaignService';

const PINK = '#C2185B';

// The backend only ever returns these 5 — "Followers" and a separate
// likes/comments/shares "Engagement" are deliberately NOT offered because neither
// can actually launch (see objectives.py's own "Only what launches is offered").
// "engagement" here really means Click-to-WhatsApp messaging (its own blurb says so),
// so it's styled and labeled as that rather than as generic "Engagement".
const DISPLAY: Record<string, { label: string; icon: LucideIcon; tint: string; fg: string }> = {
  sales: { label: 'Get more sales', icon: ShoppingCart, tint: '#FDE7EF', fg: '#C2185B' },
  leads: { label: 'Get more leads', icon: Users, tint: '#EEE7FB', fg: '#6D3FC2' },
  traffic: { label: 'Get more traffic', icon: MousePointerClick, tint: '#E6F0FD', fg: '#2563C2' },
  awareness: { label: 'Increase brand awareness', icon: Megaphone, tint: '#FDF1DC', fg: '#B5790A' },
  engagement: { label: 'Get more messages', icon: MessageCircle, tint: '#E6F0FD', fg: '#2563C2' },
};

export interface WizardObjectiveValue {
  value: string;
  label: string;
  blurb: string;
  caveat: string;
}

export default function WizardObjectiveStep({
  selected,
  onPick,
  platform = 'meta',
}: {
  selected: string;
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

  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(3, 1fr)',
        gap: 10,
      }}
    >
      {choices.map((c) => {
        const display = DISPLAY[c.value] ?? { label: c.label, icon: Megaphone, tint: '#f6f3f2', fg: '#8a8080' };
        const Icon = display.icon;
        const isOn = selected === c.value;
        return (
          <button
            key={c.value}
            type="button"
            data-testid={`wizard-objective-${c.value}`}
            aria-pressed={isOn}
            onClick={() => onPick({ value: c.value, label: c.label, blurb: c.blurb, caveat: c.caveat })}
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
                background: display.tint,
                color: display.fg,
              }}
            >
              <Icon size={16} strokeWidth={2} />
            </span>
            <span style={{ fontSize: 13, fontWeight: 800, color: '#1a0a12' }}>{display.label}</span>
            <span style={{ fontSize: 11.5, color: '#7a7270', lineHeight: 1.4 }}>{c.blurb}</span>
            {isOn && c.caveat && (
              <span style={{ fontSize: 11, color: '#9a6a00', lineHeight: 1.4, marginTop: 1 }}>{c.caveat}</span>
            )}
          </button>
        );
      })}
    </div>
  );
}
