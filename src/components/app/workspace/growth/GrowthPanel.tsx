'use client';

import { useCallback, useEffect, useState } from 'react';
import { GrowthCampaignHealth, GrowthPolicy, GrowthService } from '@/src/api/GrowthService';
import { Btn, Card, Chip, FONT, errorText } from '../personality/ui';
import { GrowthAutomation } from './GrowthAutomation';
import { GrowthCampaign } from './GrowthCampaign';
import { GrowthHistory } from './GrowthHistory';
import { ago, naira, pct } from './format';

/*
 * Growth Intelligence: what each campaign is doing, what's wrong with it, and what to
 * do next — with the business deciding how much URI may change on its own.
 */

type View = 'campaigns' | 'automation' | 'history';

const MODE_LABELS: Record<string, string> = {
  advisory: 'Advise me',
  approval: 'Ask me first',
  autonomous: 'Act within my limits',
};

export function GrowthPanel({ isMobile }: { isMobile: boolean }) {
  const [view, setView] = useState<View>('campaigns');
  const [campaigns, setCampaigns] = useState<GrowthCampaignHealth[] | null>(null);
  const [policy, setPolicy] = useState<GrowthPolicy | null>(null);
  const [canChange, setCanChange] = useState(false);
  const [autoActions, setAutoActions] = useState<string[]>([]);
  const [selected, setSelected] = useState('');
  const [error, setError] = useState('');
  const [stopping, setStopping] = useState(false);

  const load = useCallback(async () => {
    try {
      const [ov, pol] = await Promise.all([GrowthService.overview(), GrowthService.policy()]);
      setCampaigns(ov.campaigns);
      setPolicy(ov.policy);
      setCanChange(ov.can_change_policy);
      setAutoActions(pol.autonomous_actions);
    } catch (e) {
      setError(errorText(e, "Couldn't load Growth."));
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function toggleStop() {
    if (!policy) return;
    setStopping(true);
    try {
      setPolicy(await GrowthService.emergencyStop(!policy.emergency_stop));
    } catch (e) {
      setError(errorText(e, "Couldn't change the emergency stop."));
    }
    setStopping(false);
  }

  if (!campaigns || !policy) {
    return (
      <div style={{ padding: 24, fontSize: 13, color: error ? '#C62828' : '#999', fontFamily: FONT }}>
        {error || 'Loading Growth…'}
      </div>
    );
  }

  return (
    <div
      style={{
        padding: isMobile ? 14 : 24,
        display: 'flex',
        flexDirection: 'column',
        gap: 14,
        maxWidth: 960,
        margin: '0 auto',
        width: '100%',
        boxSizing: 'border-box',
        fontFamily: FONT,
        overflowY: 'auto',
      }}
    >
      <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
        {(
          [
            ['campaigns', 'Campaigns'],
            ['automation', 'Automation'],
            ['history', 'History'],
          ] as const
        ).map(([v, label]) => (
          <Chip
            key={v}
            active={view === v}
            onClick={() => {
              setView(v);
              setSelected('');
            }}
          >
            {label}
          </Chip>
        ))}
        <div style={{ flex: 1 }} />
        <Btn
          small
          kind="ghost"
          onClick={() => {
            setView('automation');
            setSelected('');
          }}
        >
          Mode: {MODE_LABELS[policy.mode]} ▾
        </Btn>
        {canChange && (
          <Btn small kind={policy.emergency_stop ? 'primary' : 'danger'} onClick={toggleStop} disabled={stopping}>
            {policy.emergency_stop ? 'Resume automation' : 'Emergency stop'}
          </Btn>
        )}
      </div>
      {policy.emergency_stop && (
        <div style={{ fontSize: 12.5, color: '#C62828', fontWeight: 700 }}>
          Emergency stop is on: URI won’t change any campaign on its own until you resume.
        </div>
      )}
      {error && <div style={{ fontSize: 12.5, color: '#C62828' }}>{error}</div>}

      {view === 'automation' && (
        <GrowthAutomation policy={policy} canChange={canChange} actions={autoActions} onSaved={setPolicy} />
      )}
      {view === 'history' && <GrowthHistory canChange={canChange} />}

      {view === 'campaigns' && selected && (
        <GrowthCampaign
          campaignId={selected}
          policy={policy}
          canApprove={canChange}
          onBack={() => {
            setSelected('');
            load();
          }}
        />
      )}

      {view === 'campaigns' && !selected && (
        <Card
          title="Campaign health"
          desc="URI checks each campaign hourly against its target or, without one, its own recent past."
        >
          {campaigns.length === 0 && (
            <div style={{ fontSize: 12.5, color: '#666' }}>Launch a campaign with Jane and it will appear here.</div>
          )}
          {campaigns.map((c) => (
            <button
              key={c.campaign_id}
              type="button"
              onClick={() => setSelected(c.campaign_id)}
              style={{
                textAlign: 'left',
                border: '1px solid rgba(0,0,0,.08)',
                borderRadius: 12,
                padding: 14,
                background: '#fff',
                cursor: 'pointer',
                display: 'flex',
                flexDirection: 'column',
                gap: 8,
                fontFamily: FONT,
              }}
            >
              <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                <div style={{ fontWeight: 800, fontSize: 14, color: '#1a1a1a', flex: 1 }}>{c.name}</div>
                {c.ended && <Chip tone="grey">Finished</Chip>}
                {c.open_issues > 0 ? (
                  <Chip tone="amber">{c.open_issues} to look at</Chip>
                ) : (
                  <Chip tone="green">On track</Chip>
                )}
              </div>
              <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', fontSize: 12.5, color: '#555' }}>
                <span>Spent {naira(c.totals.spend_ngn)}</span>
                <span>{c.totals.conversations} conversations</span>
                <span>{naira(c.totals.cost_per_conversation_ngn)} each</span>
                {c.result_vs_target !== null && (
                  <span style={{ color: c.result_vs_target > 1 ? '#C62828' : '#1B5E20' }}>
                    {c.result_vs_target > 1 ? 'Above' : 'Within'} target ({pct(c.result_vs_target, 0)} of it)
                  </span>
                )}
                {c.budget_used !== null && <span>Budget used {pct(c.budget_used, 0)}</span>}
              </div>
              <div style={{ fontSize: 11, color: c.last_error ? '#C62828' : '#999' }}>
                {c.last_error ? `Ad platform data failed: ${c.last_error}` : `Updated ${ago(c.last_updated)}`}
              </div>
            </button>
          ))}
        </Card>
      )}
    </div>
  );
}
