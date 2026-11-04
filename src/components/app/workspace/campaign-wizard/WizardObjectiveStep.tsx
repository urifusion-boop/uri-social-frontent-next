/**
 * Step 1 of the wizard — same data source as the chat flow's ObjectivePicker
 * (CampaignService.getObjectives), but full-size cards matching the approved mockup
 * instead of the compact 3-column chat-bubble version. Six of Meta's own objectives,
 * in Meta's own words, so what's chosen here is what Ads Manager shows later.
 */
'use client';
import { Megaphone, MousePointerClick, MessageCircle, Filter, ShoppingBag, Users, LucideIcon } from 'lucide-react';
import { useEffect, useState } from 'react';

import { CampaignObjectiveChoice, CampaignService } from '@/src/api/CampaignService';

const PINK = '#C2185B';

const ICONS: Record<string, LucideIcon> = {
  awareness: Megaphone,
  traffic: MousePointerClick,
  engagement: MessageCircle,
  leads: Filter,
  sales: ShoppingBag,
  followers: Users,
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
}: {
  selected: string;
  onPick: (choice: WizardObjectiveValue) => void;
}) {
  const [choices, setChoices] = useState<CampaignObjectiveChoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let alive = true;
    CampaignService.getObjectives('meta')
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
  }, []);

  if (loading) {
    return <p style={{ fontSize: 13, color: '#8a8080' }}>Loading objectives…</p>;
  }
  if (failed || !choices.length) {
    return <p style={{ fontSize: 13, color: '#b91c1c' }}>Couldn't load campaign objectives — try again shortly.</p>;
  }

  return (
    <div>
      <h3 style={{ margin: '0 0 4px', fontSize: 16, fontWeight: 800, color: '#1a0a12' }}>Objective</h3>
      <p style={{ margin: '0 0 18px', fontSize: 13, color: '#7a7270' }}>What should this campaign do for you?</p>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: 12,
        }}
      >
        {choices.map((c) => {
          const Icon = ICONS[c.value] ?? Megaphone;
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
                gap: 10,
                textAlign: 'left',
                border: isOn ? `1.5px solid ${PINK}` : '1px solid #ece8e6',
                background: isOn ? 'rgba(194,24,91,.05)' : '#fff',
                borderRadius: 14,
                padding: '16px 16px 14px',
                cursor: 'pointer',
                transition: 'border-color .12s ease, background .12s ease, box-shadow .12s ease',
                boxShadow: isOn ? '0 2px 8px rgba(194,24,91,.14)' : '0 1px 2px rgba(0,0,0,.03)',
              }}
            >
              {isOn && (
                <span
                  style={{
                    position: 'absolute',
                    top: 12,
                    right: 12,
                    width: 20,
                    height: 20,
                    borderRadius: '50%',
                    background: PINK,
                    color: '#fff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 12,
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
                  width: 38,
                  height: 38,
                  borderRadius: 10,
                  background: isOn ? PINK : '#f6f3f2',
                  color: isOn ? '#fff' : '#8a8080',
                }}
              >
                <Icon size={19} strokeWidth={2} />
              </span>
              <span style={{ fontSize: 14.5, fontWeight: 800, color: isOn ? PINK : '#1a0a12' }}>{c.label}</span>
              <span style={{ fontSize: 12.5, color: '#7a7270', lineHeight: 1.5 }}>{c.blurb}</span>
              {isOn && c.caveat && (
                <span style={{ fontSize: 11.5, color: '#9a6a00', lineHeight: 1.45, marginTop: 2 }}>{c.caveat}</span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
