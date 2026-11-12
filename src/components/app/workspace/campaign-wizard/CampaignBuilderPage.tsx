/**
 * The real top-level page behind the sidebar's "Campaigns" entry (nav id
 * 'campaign-wizard' — named "New Campaign Builder" while the old chat-driven
 * 'campaigns' page was still a visible, reachable-for-comparison tab; that page is
 * now hidden from the menu, so this took back the plain name). Previously that nav
 * entry dropped straight into step 1 of CampaignWizard with no way to see what you'd
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
import { useIsMobile } from '@/src/hooks/useIsMobile';
import { CampaignCard, PLATFORM_CHOICES, uid } from '../CampaignsPage';
import { CampaignRow, CampaignService, DraftSummary } from '@/src/api/CampaignService';
import { ToastService } from '@/src/utils/toast.util';
import { ToastTypeEnum } from '@/src/models/enum-models/ToastTypeEnum';
import CampaignWizard from './CampaignWizard';
import {
  deleteWizardDraft,
  fetchRemoteWizardDrafts,
  loadWizardDrafts,
  mergeWizardDrafts,
  WizardDraft,
} from './wizardDraft';

const PINK = '#C2185B';

function extractErrorMessage(e: unknown, fallback: string): string {
  const obj = e as { response?: { data?: { detail?: unknown } }; data?: { detail?: unknown } } | null;
  const detail = obj?.response?.data?.detail ?? obj?.data?.detail;
  if (typeof detail === 'string' && detail) return detail;
  if (e instanceof Error && e.message) return e.message;
  return fallback;
}

export function platformLabel(draft: WizardDraft): string {
  if (draft.platform.mode === 'single') {
    return PLATFORM_CHOICES.find((p) => p.value === draft.platform.single)?.label ?? 'a platform';
  }
  // Live-reported: this draft was left right after switching to "Multiple
  // platforms" mode but before actually picking any — multi is genuinely []
  // (the wizard won't let Next past Platform with fewer than 2, but leaving
  // via "All campaigns"/closing the tab mid-pick still autosaves exactly
  // where it was). "0 platforms" read like a bug rather than the real,
  // honest "nothing picked yet" state it is.
  const n = draft.platform.multi.length;
  if (n === 0) return 'no platform picked yet';
  return n === 1 ? '1 platform' : `${n} platforms`;
}

/** The first generated image this draft has, if Jane got that far — a photo
 *  does more to say "this is the ad you already built" than any text summary. */
export function draftThumbnail(draft: WizardDraft): string | undefined {
  if (draft.results?.single?.creative?.image_url) return draft.results.single.creative.image_url;
  for (const r of Object.values(draft.results?.multi ?? {})) {
    if (r?.creative?.image_url) return r.creative.image_url;
  }
  return undefined;
}

export function draftHasPlan(draft: WizardDraft): boolean {
  return Boolean(draft.results?.single) || Object.keys(draft.results?.multi ?? {}).length > 0;
}

export default function CampaignBuilderPage({
  pendingDraft,
  onDraftConsumed,
  pendingResumeDraft,
  onResumeDraftConsumed,
}: {
  /** "Use in Campaign Builder" from the Creatives library — skip the list and land
   *  straight in the wizard with this draft preloaded, same as before. */
  pendingDraft?: DraftSummary | null;
  onDraftConsumed?: () => void;
  /** "Resume" clicked from the Overview page — same hand-off shape as pendingDraft
   *  above, so it lands straight in the wizard on THIS exact draft instead of on
   *  the list (live-reported: Overview's Resume used to just open the list, making
   *  the user click Resume a second time once they got there). */
  pendingResumeDraft?: WizardDraft | null;
  onResumeDraftConsumed?: () => void;
}) {
  const [mode, setMode] = useState<'list' | 'wizard'>(pendingDraft || pendingResumeDraft ? 'wizard' : 'list');
  // Forces a fresh CampaignWizard mount every time "+ New Campaign" is clicked —
  // without this, clicking it twice in a row (list -> wizard -> list -> wizard)
  // would reuse the same component instance and its stale state.
  const wizardKey = useRef(0);
  // "Duplicate" on a CampaignCard — the chat flow's own equivalent
  // (duplicateThread) needs a thread_id this list's CampaignRow data doesn't have,
  // so instead of resending a reconstructed text brief for Jane to replan from
  // scratch, this seeds the wizard's own steps directly from the row's fields —
  // same "tweak and relaunch" starting point, in the wizard's own vocabulary.
  const [pendingDuplicate, setPendingDuplicate] = useState<CampaignRow | null>(null);
  // Every autosaved unfinished run (wizardDraft.ts) — read fresh every time the
  // list page is actually shown, since that's exactly when a run from a moment
  // ago (Cancel, a closed tab, "All campaigns" mid-build) would have just landed
  // here. Live-reported: a single slot silently discarded an earlier unfinished
  // run the moment a second one started — every draft now keeps its own slot.
  const [drafts, setDrafts] = useState<WizardDraft[]>([]);
  const [pendingResume, setPendingResume] = useState<WizardDraft | null>(pendingResumeDraft ?? null);

  const [campaigns, setCampaigns] = useState<CampaignRow[]>([]);
  const [loading, setLoading] = useState(true);
  const loadedOnce = useRef(false);
  const isMobile = useIsMobile();

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
    if (!pendingResumeDraft) return;
    wizardKey.current += 1;
    setPendingResume(pendingResumeDraft);
    setMode('wizard');
    onResumeDraftConsumed?.();
    // Runs once per hand-off — onResumeDraftConsumed clears pendingResumeDraft
    // right after, so this can't re-fire from its own effect.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pendingResumeDraft]);

  useEffect(() => {
    if (mode !== 'list') return;
    void load();
    const local = loadWizardDrafts();
    setDrafts(local);
    // Checked in the background, never blocking this page on a round trip — only
    // merged in once it lands (a different device's drafts, or this browser's
    // own copy having been cleared).
    void fetchRemoteWizardDrafts().then((remote) => {
      if (remote.length) setDrafts((current) => mergeWizardDrafts(current, remote));
    });
  }, [mode, load]);

  const startWizard = () => {
    wizardKey.current += 1;
    setMode('wizard');
  };
  const backToList = () => {
    setMode('list');
  };
  const duplicate = (c: CampaignRow) => {
    setPendingDuplicate(c);
    startWizard();
  };
  const resume = (d: WizardDraft) => {
    setPendingResume(d);
    startWizard();
  };
  const discardDraft = (id: string) => {
    deleteWizardDraft(id);
    setDrafts((current) => current.filter((d) => d.id !== id));
  };

  if (mode === 'wizard') {
    return (
      <CampaignWizard
        key={wizardKey.current}
        onBack={backToList}
        pendingDraft={pendingDraft}
        onDraftConsumed={onDraftConsumed}
        pendingDuplicate={pendingDuplicate}
        onDuplicateConsumed={() => setPendingDuplicate(null)}
        pendingResume={pendingResume}
        onResumeConsumed={() => setPendingResume(null)}
      />
    );
  }

  return (
    <div style={{ minHeight: '100%', background: 'linear-gradient(180deg, #FCE4EC 0%, #FBF8F7 40%, #FAFAF8 100%)' }}>
      <div style={{ maxWidth: 900, margin: '0 auto', padding: isMobile ? '14px 12px 28px' : '18px 20px 28px' }}>
        <div
          style={{
            display: 'flex',
            flexDirection: isMobile ? 'column' : 'row',
            alignItems: isMobile ? 'stretch' : 'flex-start',
            justifyContent: 'space-between',
            gap: 12,
            marginBottom: 16,
          }}
        >
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
              width: isMobile ? '100%' : undefined,
            }}
          >
            + New Campaign
          </button>
        </div>

        {drafts.length > 0 && (
          <div style={{ marginBottom: 20 }}>
            <p style={{ margin: '0 0 10px', fontSize: 12.5, fontWeight: 800, color: '#1a0a12' }}>
              {drafts.length === 1
                ? 'You have an unfinished campaign'
                : `You have ${drafts.length} unfinished campaigns`}
            </p>
            <div style={{ display: 'grid', gap: 10 }}>
              {drafts.map((d) => {
                const thumb = draftThumbnail(d);
                const hasPlan = draftHasPlan(d);
                return (
                  <div
                    key={d.id}
                    style={{
                      display: 'flex',
                      flexDirection: isMobile ? 'column' : 'row',
                      alignItems: isMobile ? 'stretch' : 'center',
                      gap: 12,
                      background: '#FCE7F3',
                      border: '1px solid #f5c2d8',
                      borderRadius: 14,
                      padding: '12px 16px',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, minWidth: 0 }}>
                      {thumb ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={thumb}
                          alt=""
                          style={{ width: 44, height: 44, borderRadius: 10, objectFit: 'cover', flexShrink: 0 }}
                        />
                      ) : (
                        <div
                          style={{
                            width: 44,
                            height: 44,
                            borderRadius: 10,
                            background: '#fff',
                            border: '1px solid #f5c2d8',
                            flexShrink: 0,
                          }}
                        />
                      )}
                      <div style={{ minWidth: 0, flex: 1 }}>
                        <p style={{ margin: 0, fontSize: 13, fontWeight: 800, color: '#1a0a12' }}>
                          {d.objective.label || d.objective.value} on {platformLabel(d)}
                        </p>
                        <p style={{ margin: '2px 0 0', fontSize: 12, color: '#7a7270' }}>
                          {d.audience.city ? `${d.audience.city} · ` : ''}
                          {hasPlan ? 'Ad already built — ready to review' : 'Still filling in the details'}
                        </p>
                      </div>
                    </div>
                    <div
                      style={{
                        display: 'flex',
                        gap: 8,
                        flexShrink: 0,
                        justifyContent: isMobile ? 'flex-end' : undefined,
                      }}
                    >
                      <button
                        type="button"
                        onClick={() => discardDraft(d.id)}
                        style={{
                          border: 'none',
                          background: 'none',
                          color: '#7a7270',
                          fontSize: 12.5,
                          fontWeight: 700,
                          cursor: 'pointer',
                          padding: '8px 4px',
                        }}
                      >
                        Discard
                      </button>
                      <button
                        type="button"
                        onClick={() => resume(d)}
                        style={{
                          border: 'none',
                          background: PINK,
                          color: '#fff',
                          borderRadius: 9,
                          padding: '8px 16px',
                          fontSize: 12.5,
                          fontWeight: 800,
                          cursor: 'pointer',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        Resume
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

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
                <CampaignCard key={c.campaign_id || uid()} c={c} onChanged={load} onDuplicate={duplicate} />
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
