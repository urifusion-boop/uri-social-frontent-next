/**
 * The first thing Jane asks: which of Meta's campaign objectives this ad is for.
 *
 * She used to infer it from a goal chip ("Get me more sales") and pick the Meta
 * objective herself — so every campaign came out as Engagement or Traffic, and a client
 * who had asked for sales opened Ads Manager to "Objective: Engagement". The objective
 * decides what Meta's delivery system optimises toward, which makes it the most
 * consequential setting on a campaign and the wrong one to guess.
 *
 * These are Meta's own objectives in Meta's own words, so what is chosen here is what
 * Ads Manager shows later.
 *
 * The caveat ("without tracking on your site, Meta optimises for taps rather than
 * confirmed purchases") appears on the SELECTED card only. Showing all of them at once
 * turned the picker into a wall of warnings nobody reads; showing it on the one being
 * chosen puts it where the decision is actually made.
 */
import {
  Megaphone, MousePointerClick, MessageCircle, Filter, ShoppingBag, Users, LucideIcon,
} from 'lucide-react';
import React, { useEffect, useState } from 'react';

import { CampaignObjectiveChoice, CampaignService } from '@/src/api/CampaignService';

const PINK = '#C2185B';

// Meta's own iconography for these, as closely as lucide allows — the picker should
// feel like the thing it mirrors.
const ICONS: Record<string, LucideIcon> = {
  awareness: Megaphone,
  traffic: MousePointerClick,
  engagement: MessageCircle,
  leads: Filter,
  sales: ShoppingBag,
  followers: Users,
};

type Props = {
  selected: string;
  onPick: (value: string) => void;
};

export default function ObjectivePicker({ selected, onPick }: Props) {
  const [choices, setChoices] = useState<CampaignObjectiveChoice[]>([]);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let alive = true;
    CampaignService.getObjectives()
      .then((c) => { if (alive) setChoices(c); })
      .catch(() => { if (alive) setFailed(true); });
    return () => { alive = false; };
  }, []);

  // Never block the conversation on this. If the list cannot load, Jane falls back to
  // the objective the goal implies, which is exactly what she did before.
  if (failed || !choices.length) return null;

  const chosen = choices.find((c) => c.value === selected);

  return (
    <div data-testid="objective-picker" style={{ margin: '2px 0 12px' }}>
      <p style={{ margin: '0 0 8px', fontSize: 12.5, fontWeight: 600, color: '#555' }}>
        What should this ad do for you?
      </p>

      {/* Three across, not six. auto-fit across a full-width chat column squeezed all
          six into one row, so every blurb wrapped to four lines and the cards came out
          ragged and unreadable. A 3-column cap keeps each card wide enough for its
          text to breathe and makes the two rows line up. */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(212px, 1fr))',
          gap: 8,
          maxWidth: 720,
        }}
      >
        {choices.map((c) => {
          const Icon = ICONS[c.value] ?? Megaphone;
          const isOn = selected === c.value;
          return (
            <button
              key={c.value}
              type="button"
              data-testid={`objective-${c.value}`}
              aria-pressed={isOn}
              onClick={() => onPick(c.value)}
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: 6,
                textAlign: 'left',
                border: isOn ? `1.5px solid ${PINK}` : '1px solid #ece8e6',
                background: isOn ? 'rgba(194,24,91,.05)' : '#fff',
                borderRadius: 12,
                padding: '11px 13px',
                cursor: 'pointer',
                transition: 'border-color .12s ease, background .12s ease',
                boxShadow: isOn ? '0 1px 3px rgba(194,24,91,.10)' : 'none',
              }}
            >
              {/* Icon and label on ONE line. Side-by-side with a wrapping blurb left the
                  icon floating against a tall block of text. */}
              <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: 26,
                    height: 26,
                    flexShrink: 0,
                    borderRadius: 8,
                    background: isOn ? PINK : '#f6f3f2',
                    color: isOn ? '#fff' : '#8a8080',
                  }}
                >
                  <Icon size={14} strokeWidth={2} />
                </span>
                <span style={{ fontSize: 13.5, fontWeight: 700, color: isOn ? PINK : '#1a0a12' }}>
                  {c.label}
                </span>
              </span>
              <span style={{ fontSize: 11.5, color: '#7a7270', lineHeight: 1.45 }}>
                {c.blurb}
              </span>
            </button>
          );
        })}
      </div>

      {chosen?.caveat && (
        <div
          data-testid={`objective-caveat-${chosen.value}`}
          style={{
            marginTop: 8,
            background: '#fff8ec',
            border: '1px solid #f0e0c0',
            borderRadius: 9,
            padding: '7px 10px',
          }}
        >
          <p style={{ margin: 0, fontSize: 11.5, color: '#8a5a00', lineHeight: 1.4 }}>
            {chosen.caveat}
          </p>
        </div>
      )}
    </div>
  );
}
