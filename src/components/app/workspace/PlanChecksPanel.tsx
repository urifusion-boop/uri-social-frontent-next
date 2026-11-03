'use client';

import { useEffect, useState } from 'react';
import { CampaignService, PlanChecks } from '@/src/api/CampaignService';

export interface PlanChecksState {
  blocked: boolean;
  allowOutOfArea: boolean;
  canLaunch: boolean;
}

/*
 * What a plan launches as (campaign → ad set → ad), and anything in it that conflicts
 * with the brand's ads brief — shown before the client approves it. Blocking issues
 * disable Launch; a service-area block can be overridden by confirming delivery there.
 */
export function PlanChecksPanel({
  planId,
  refreshKey,
  onState,
}: {
  planId: string;
  refreshKey?: string;
  onState: (s: PlanChecksState) => void;
}) {
  const [checks, setChecks] = useState<PlanChecks | null>(null);
  const [override, setOverride] = useState(false);

  useEffect(() => {
    let live = true;
    CampaignService.planChecks(planId)
      .then((c) => live && setChecks(c))
      .catch(() => live && setChecks(null));
    return () => {
      live = false;
    };
  }, [planId, refreshKey]);

  useEffect(() => {
    if (!checks) {
      onState({ blocked: false, allowOutOfArea: false, canLaunch: true });
      return;
    }
    const hard = checks.blocking.filter((b) => !(override && b.overridable));
    onState({ blocked: hard.length > 0, allowOutOfArea: override, canLaunch: checks.can_launch });
  }, [checks, override, onState]);

  if (!checks) return null;
  const s = checks.structure;
  const overridable = checks.blocking.some((b) => b.overridable);

  return (
    <div
      style={{
        background: '#fafafa',
        border: '1px solid #eee',
        borderRadius: 10,
        padding: '10px 12px',
        margin: '0 0 12px',
        fontSize: 12.5,
        lineHeight: 1.5,
        display: 'flex',
        flexDirection: 'column',
        gap: 6,
      }}
    >
      <div>
        <strong>How it launches:</strong> {s.campaigns} campaign · {s.ad_sets} ad set · {s.ads_per_ad_set} ad, ₦
        {Math.round(s.daily_ngn).toLocaleString()} a day ({s.budget_type}) for {s.days} day{s.days === 1 ? '' : 's'}.
        <div style={{ color: '#777' }}>{s.why}</div>
      </div>
      {checks.issues.map((i) => (
        <div key={i.code + i.message} style={{ color: i.level === 'block' ? '#B71C1C' : '#7a4a00' }}>
          {i.level === 'block' ? '⛔' : '⚠️'} {i.message}
        </div>
      ))}
      {overridable && (
        <label style={{ display: 'flex', gap: 6, alignItems: 'center', color: '#333', cursor: 'pointer' }}>
          <input type="checkbox" checked={override} onChange={(e) => setOverride(e.target.checked)} />I can deliver to
          these places — launch anyway
        </label>
      )}
      {checks.brief_missing.length > 0 && (
        <div style={{ color: '#999', fontSize: 11.5 }}>
          Your ads brief doesn&rsquo;t say {checks.brief_missing.join(', ')} yet, so Jane&rsquo;s plan rests on more
          assumptions. Add them under Growth → Brief.
        </div>
      )}
      {!checks.can_launch && (
        <div style={{ color: '#B71C1C' }}>Only an agency admin can launch this campaign for this brand.</div>
      )}
    </div>
  );
}
