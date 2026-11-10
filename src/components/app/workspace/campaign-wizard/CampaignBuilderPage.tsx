/**
 * The real top-level page behind "New Campaign Builder" — previously that nav entry
 * dropped straight into step 1 of CampaignWizard with no way to see what you'd
 * already launched, the one thing the old chat flow's "Campaign Manager" tab (see
 * CampaignsPage.tsx's tab === 'manage', CampaignCard) already did well. Reuses that
 * exact same CampaignRow data (CampaignService.listCampaigns) and that exact same
 * card — pause/resume, delete, targeting edit, all of it — rather than rebuilding
 * any of it, so this list behaves identically to the one in the page being retired.
 *
 * Owns the switch between "looking at your campaigns" and "building one": the
 * wizard is only ever mounted while actually creating, and unmounts the moment you
 * leave it (Cancel, or "Create another campaign" after a launch) — so every new
 * CampaignWizard instance starts from a clean slate for free, no manual reset
 * logic needed.
 */
'use client';
import { useCallback, useEffect, useRef, useState } from 'react';
import { CampaignCard, uid } from '../CampaignsPage';
import { CampaignRow, CampaignService, DraftSummary } from '@/src/api/CampaignService';
import { ToastService } from '@/src/utils/toast.util';
import { ToastTypeEnum } from '@/src/models/enum-models/ToastTypeEnum';
import CampaignWizard from './CampaignWizard';

const PINK = '#C2185B';

function extractErrorMessage(e: unknown, fallback: string): string {
  const obj = e as { response?: { data?: { detail?: unknown } }; data?: { detail?: unknown } } | null;
  const detail = obj?.response?.data?.detail ?? obj?.data?.detail;
  if (typeof detail === 'string' && detail) return detail;
  if (e instanceof Error && e.message) return e.message;
  return fallback;
}

export default function CampaignBuilderPage({
  pendingDraft,
  onDraftConsumed,
}: {
  /** "Use in Campaign Builder" from the Creatives library — skip the list and land
   *  straight in the wizard with this draft preloaded, same as before. */
  pendingDraft?: DraftSummary | null;
  onDraftConsumed?: () => void;
}) {
  const [mode, setMode] = useState<'list' | 'wizard'>(pendingDraft ? 'wizard' : 'list');
  // Forces a fresh CampaignWizard mount every time "+ New Campaign" is clicked —
  // without this, clicking it twice in a row (list -> wizard -> list -> wizard)
  // would reuse the same component instance and its stale state.
  const wizardKey = useRef(0);

  const [campaigns, setCampaigns] = useState<CampaignRow[]>([]);
  const [loading, setLoading] = useState(true);
  const loadedOnce = useRef(false);

  const load = useCallback(async () => {
    if (!loadedOnce.current) setLoading(true);
    try {
      const res = await CampaignService.listCampaigns();
      setCampaigns(res.campaigns || []);
      loadedOnce.current = true;
    } catch (e) {
      if (loadedOnce.current) {
        ToastService.showToast(extractErrorMessage(e, "Couldn't refresh your campaigns."), ToastTypeEnum.Error);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (mode === 'list') void load();
  }, [mode, load]);

  const startWizard = () => {
    wizardKey.current += 1;
    setMode('wizard');
  };
  const backToList = () => {
    setMode('list');
  };

  if (mode === 'wizard') {
    return (
      <CampaignWizard
        key={wizardKey.current}
        onBack={backToList}
        pendingDraft={pendingDraft}
        onDraftConsumed={onDraftConsumed}
      />
    );
  }

  return (
    <div style={{ minHeight: '100%', background: 'linear-gradient(180deg, #FCE4EC 0%, #FBF8F7 40%, #FAFAF8 100%)' }}>
      <div style={{ maxWidth: 900, margin: '0 auto', padding: '18px 20px 28px' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 16 }}>
          <div>
            <h2 style={{ margin: 0, fontSize: 18, fontWeight: 800, color: '#1a0a12' }}>Campaigns</h2>
            <p style={{ margin: '2px 0 0', fontSize: 12.5, color: '#7a7270' }}>
              Everything you&rsquo;ve launched or paused. Start, stop, or change who a running one targets.
            </p>
          </div>
          <button
            type="button"
            onClick={startWizard}
            style={{
              flexShrink: 0,
              border: 'none',
              background: PINK,
              color: '#fff',
              borderRadius: 10,
              padding: '10px 18px',
              fontSize: 13.5,
              fontWeight: 800,
              cursor: 'pointer',
              whiteSpace: 'nowrap',
            }}
          >
            + New Campaign
          </button>
        </div>

        {loading ? (
          <div
            style={{
              background: '#fff',
              border: '1px solid #ece8e6',
              borderRadius: 16,
              padding: 40,
              textAlign: 'center',
            }}
          >
            <p style={{ color: '#9a9090', fontSize: 13, margin: 0 }}>Loading your campaigns…</p>
          </div>
        ) : campaigns.length === 0 ? (
          <div
            style={{
              background: '#fff',
              border: '1px solid #ece8e6',
              borderRadius: 16,
              padding: '48px 24px',
              textAlign: 'center',
            }}
          >
            <p style={{ fontSize: 14, color: '#7a7270', margin: '0 0 14px' }}>
              You haven&rsquo;t launched a campaign yet.
            </p>
            <button
              type="button"
              onClick={startWizard}
              style={{
                border: 'none',
                background: PINK,
                color: '#fff',
                borderRadius: 10,
                padding: '10px 20px',
                fontSize: 13.5,
                fontWeight: 800,
                cursor: 'pointer',
              }}
            >
              + New Campaign
            </button>
          </div>
        ) : (
          <>
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 10 }}>
              <button
                type="button"
                onClick={() => void load()}
                style={{
                  border: '1px solid #ece8e6',
                  background: '#fff',
                  borderRadius: 8,
                  padding: '6px 12px',
                  fontSize: 12,
                  color: '#555',
                  cursor: 'pointer',
                }}
              >
                Refresh
              </button>
            </div>
            <div style={{ display: 'grid', gap: 12 }}>
              {campaigns.map((c) => (
                <CampaignCard key={c.campaign_id || uid()} c={c} onChanged={load} />
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
