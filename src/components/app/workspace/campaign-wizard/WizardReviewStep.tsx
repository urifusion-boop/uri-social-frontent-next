/**
 * Step 6 — the only step that actually talks to the backend. Composes everything
 * collected in steps 1-5 into the one message planFromMessage takes, then reuses the
 * chat flow's own ResultCard (CampaignsPage.tsx) for everything that can happen next:
 * a follow-up question (choose_plan_variant / choose_destination / need_whatsapp /
 * need_more / advise), a connection guard, or the final editable plan + Launch button.
 * Re-exercising the exact same component the chat flow already relies on, rather than
 * re-implementing its branching, is what keeps this step this short.
 *
 * Two things this step owns that the chat flow doesn't need to:
 *  - Single vs multi-platform (step 2's own choice) decides whether this renders one
 *    ResultCard or one per selected platform, each an independent plan/launch through
 *    the exact same planFromMessage call, fired in parallel — same pattern as the chat
 *    flow's sendMultiPlatform, just one call per platform instead of one per message.
 *  - A visible "working"/"error" state for every call AFTER the first one. Live-reported
 *    stuck bug: the original version gated its loading/error UI on `!result`, which is
 *    only true before the very first response — so a follow-up call that was slow, or
 *    failed outright, showed nothing at all once a plan already existed on screen. The
 *    button you'd just clicked kept saying "Selected" forever with no way to tell if it
 *    was still working, had failed, or needed a retry.
 */
'use client';
import { useEffect, useRef, useState } from 'react';
import {
  AdFormat,
  AssetAttestation,
  CampaignService,
  CreativeProvenanceInput,
  LaunchFromMessageResult,
  PlanVariant,
} from '@/src/api/CampaignService';
import { QuickReplyChips, ResultCard, uid } from '../CampaignsPage';
import { useCreativePaths, VideoWhoPrompt } from '../CreativePathControls';
import type { GooglePlacement } from '../GooglePlacementPreview';
import type { WizardObjectiveValue } from './WizardObjectiveStep';
import type { WizardAudienceValue } from './WizardAudienceStep';
import type { WizardBudgetValue } from './WizardBudgetStep';
import type { WizardCreativeChoice } from './WizardCreativeStep';
import type { MultiWizardPlatform, WizardPlatformValue } from './WizardPlatformStep';
import WizardAssetAttestation from './WizardAssetAttestation';
import { WizardReviewSnapshot } from './wizardDraft';

const PINK = '#C2185B';

type PlanFromMessagePayload = Parameters<typeof CampaignService.planFromMessage>[0];

function extractErrorMessage(e: unknown, fallback: string): string {
  const obj = e as { response?: { data?: { detail?: unknown } }; data?: { detail?: unknown } } | null;
  const detail = obj?.response?.data?.detail ?? obj?.data?.detail;
  if (typeof detail === 'string' && detail) return detail;
  if (e instanceof Error && e.message) return e.message;
  return fallback;
}

function creativePayload(creative: WizardCreativeChoice): Partial<PlanFromMessagePayload> {
  if (creative.creative_source === 'upload') {
    // TikTok Carousel Ads — base photo is slide 1, same as CampaignsPage.tsx's own
    // carouselImageUrls composition; only sent once there's a real carousel (2+
    // slides), same >= 2 gate the chat flow uses.
    const carouselUrls =
      creative.carouselExtraUrls && creative.carouselExtraUrls.length > 0
        ? [creative.reference_image_url, ...creative.carouselExtraUrls]
        : undefined;
    return {
      creative_source: 'upload',
      reference_image_url: creative.reference_image_url,
      is_video: creative.is_video,
      ...(carouselUrls ? { carousel_image_urls: carouselUrls } : {}),
      ...(creative.asset_attestation ? { asset_attestation: creative.asset_attestation } : {}),
    };
  }
  if (creative.creative_source === 'draft') {
    return { creative_source: 'draft', draft_id: creative.draft_id };
  }
  return { creative_source: 'generate' };
}

/** A stage bucketed into what it means for a status dot / tab ordering — not a new
 *  backend concept, just grouping LaunchFromMessageResult['stage'] the same way the
 *  mockup's tabs needed to. */
type PlatformStatus = 'ready' | 'decide' | 'attn' | 'launched';
function statusForStage(stage: LaunchFromMessageResult['stage']): PlatformStatus {
  if (stage === 'launched') return 'launched';
  if (stage === 'planned') return 'ready';
  if (stage === 'choose_plan_variant') return 'decide';
  return 'attn';
}
const STATUS_DOT: Record<PlatformStatus, string> = {
  ready: '#15803d',
  decide: PINK,
  attn: '#a15c00',
  launched: '#15803d',
};

const PLATFORM_LABEL: Record<MultiWizardPlatform, string> = {
  meta: 'Instagram & Facebook',
  tiktok: 'TikTok',
  google: 'Google',
};

/** Live-reported: resuming a draft mid-negotiation (a follow-up question already
 *  asked, not yet a finished plan) drops you back into just that one open
 *  question with nothing above it — this step has never kept a visible history
 *  of the turns that already happened, unlike the old chat page's own scrolling
 *  transcript. Rather than build that transcript (a much bigger change, and a
 *  risk to ResultCard's single-result assumptions), a compact recap of what's
 *  already decided — the exact inputs this plan was built from, all of them
 *  already sitting in this step's own props — answers the same "what did I
 *  already set up?" question without it. */
function RecapStrip({
  objective,
  platform,
  audience,
  budget,
  creative,
}: {
  objective: WizardObjectiveValue;
  platform: WizardPlatformValue;
  audience: WizardAudienceValue;
  budget: WizardBudgetValue;
  creative: WizardCreativeChoice;
}) {
  const platformText =
    platform.mode === 'multi'
      ? platform.multi.map((p) => PLATFORM_LABEL[p]).join(', ')
      : platform.single
        ? PLATFORM_LABEL[platform.single as MultiWizardPlatform]
        : "Jane's pick";
  const creativeText =
    creative.creative_source === 'generate'
      ? 'Jane-generated creative'
      : creative.creative_source === 'draft'
        ? 'Creative from a past draft'
        : creative.is_video
          ? 'Your uploaded video'
          : 'Your uploaded photo';
  const items = [
    objective.label || objective.value,
    platformText,
    audience.city.trim() || null,
    typeof budget.amountNgn === 'number' && budget.amountNgn > 0
      ? `₦${budget.amountNgn.toLocaleString()} over ${budget.days}d`
      : null,
    creativeText,
  ].filter((x): x is string => Boolean(x));

  return (
    <div
      style={{
        display: 'flex',
        flexWrap: 'wrap',
        alignItems: 'center',
        gap: 6,
        marginBottom: 14,
        paddingBottom: 12,
        borderBottom: '1px solid #ece8e6',
      }}
    >
      <span style={{ fontSize: 10.5, fontWeight: 700, color: '#9a9090', textTransform: 'uppercase', marginRight: 2 }}>
        So far
      </span>
      {items.map((it, i) => (
        <span key={i} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span
            style={{
              fontSize: 12,
              fontWeight: 700,
              color: '#1a0a12',
              background: '#faf7f6',
              border: '1px solid #ece8e6',
              borderRadius: 999,
              padding: '3px 10px',
              whiteSpace: 'nowrap',
            }}
          >
            {it}
          </span>
          {i < items.length - 1 && <span style={{ color: '#d8d2cf', fontSize: 11 }}>·</span>}
        </span>
      ))}
    </div>
  );
}

// TikTok rejects an ad group under its own daily floor and says so in plain words
// (router.py's _tiktok_budget_too_low_message) — but as a free-text `need_more`
// question, not a field flagged "missing", so ResultCard's own budget quick-replies
// never fire for it (those are gated on understood.missing, and the budget here was
// understood fine, just too small for this one platform). One extra chip, reusing
// the exact same onQuickReply path every other quick-reply already uses, turns
// that into a single click instead of typing a number back.
function tiktokFloorChip(result: LaunchFromMessageResult): string | null {
  if (result.stage !== 'need_more') return null;
  const m = /at least ₦([\d,]+)/.exec(result.question || '');
  return m ? m[1] : null;
}

interface SlotState {
  result: LaunchFromMessageResult | null;
  loading: boolean; // true only before the first response for this slot
  working: boolean; // true while a FOLLOW-UP call is in flight (result already exists)
  error: string;
}
const emptySlot = (): SlotState => ({ result: null, loading: true, working: false, error: '' });

export default function WizardReviewStep({
  objective,
  audience,
  budget,
  creative,
  platform,
  googlePlacement,
  onCreateAnother,
  onStatusChange,
  initialResults,
  onResultsChange,
  onAnyLaunched,
}: {
  objective: WizardObjectiveValue;
  audience: WizardAudienceValue;
  budget: WizardBudgetValue;
  creative: WizardCreativeChoice;
  platform: WizardPlatformValue;
  /** Where on Google, set on the dedicated Google placement step (shown only when
   *  Google's in play) — mirrors the chat flow's googlePlacementRef exactly. */
  googlePlacement: GooglePlacement;
  /** Returns to the campaigns list (CampaignBuilderPage), which just launched this
   *  exact campaign into — unmounting this wizard, so the NEXT "+ New Campaign"
   *  mounts a completely fresh one. Lets someone launch campaigns back to back
   *  without ever leaving the Campaign Builder section. */
  onCreateAnother: () => void;
  /** Fires with true once every selected platform has reached 'planned' or
   *  'launched' — nothing left to decide — and false again if a later edit (e.g.
   *  switching platform) reopens a question. Lets the parent stepper's last pip
   *  read "Finalize" while still deciding and "Review" only once there's really
   *  just a look-over-and-launch left to do. */
  onStatusChange?: (ready: boolean) => void;
  /** Resuming a saved draft that already got this far — the exact plan/creative
   *  Jane built last time, so this picks the conversation back up instead of
   *  firing a brand-new planFromMessage call that could generate something
   *  different from the same inputs. Undefined/empty means a genuinely fresh
   *  run, same as before this existed. */
  initialResults?: WizardReviewSnapshot;
  /** Fires on every result change (single or multi) so the parent can keep the
   *  autosaved draft's snapshot current — the thing initialResults restores. */
  onResultsChange?: (snapshot: WizardReviewSnapshot) => void;
  /** Fires once there's nothing left unlaunched (the one platform, or every
   *  platform in a multi-platform run) — the parent's cue to stop offering this
   *  draft as "resume", since there's nothing unfinished left to resume. */
  onAnyLaunched?: () => void;
}) {
  const isMulti = platform.mode === 'multi' && platform.multi.length >= 2;
  const platforms: MultiWizardPlatform[] = isMulti ? platform.multi : [];
  const [adFormats, setAdFormats] = useState<AdFormat[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  // Which button opened the (shared) hidden file input — "Upload my own" vs "Use my
  // product photo" on the mid-flow choose_creative_source card — so the file picked
  // back is tagged with the right creative_source, not always 'upload'. Mirrors
  // CampaignsPage.tsx's own uploadForChoiceRef.
  const uploadForRef = useRef<'upload' | 'recompose'>('upload');
  const startedRef = useRef(false); // guards React Strict Mode's double-invoked mount effect

  const message = `${audience.description.trim()} in ${audience.city.trim()}. Budget: ₦${budget.amountNgn} over ${budget.days} days.`;
  // Which creative paths (AI video / filmed video) are open for this brand+brief —
  // same hook the chat flow's own ChooseCreativeSource card uses, so the wizard's
  // mid-flow card gets the exact same options instead of always hiding them.
  const creativePaths = useCreativePaths(message);

  useEffect(() => {
    CampaignService.getAdFormats()
      .then((r) => setAdFormats(r.formats))
      .catch(() => setAdFormats([]));
  }, []);

  // ===================== single platform =====================
  const [slot, setSlot] = useState<SlotState>(() =>
    initialResults?.single ? { result: initialResults.single, loading: false, working: false, error: '' } : emptySlot()
  );
  const chosenVariantRef = useRef<{ variant: PlanVariant; variantGroupId: string } | null>(null);
  const ownAudienceRef = useRef<string | null>(null);
  // "What does this photo actually show?" — asked for any real photo picked via the
  // mid-flow choose_creative_source card (upload or recompose), same as every other
  // real-photo entry point. See WizardAssetAttestation.tsx.
  const [pendingAttestation, setPendingAttestation] = useState<{ url: string; forRecompose: boolean } | null>(null);
  const resolveAttestation = (asset_attestation: AssetAttestation | undefined) => {
    const pending = pendingAttestation;
    if (!pending) return;
    setPendingAttestation(null);
    void submitSingle(
      pending.forRecompose
        ? { creative_source: 'recomposite', reference_image_url: pending.url, asset_attestation }
        : { creative_source: 'upload', reference_image_url: pending.url, is_video: false, asset_attestation }
    );
  };
  // Same gate for a real video — "who's in it?" — only reachable via "Upload my
  // own" (recompose is image-only, rejected before this point).
  const [pendingVideoWho, setPendingVideoWho] = useState<string | null>(null);
  const resolveVideoWho = (provenance?: CreativeProvenanceInput) => {
    const url = pendingVideoWho;
    if (!url) return;
    setPendingVideoWho(null);
    void submitSingle({ creative_source: 'upload', reference_image_url: url, is_video: true, ...(provenance ?? {}) });
  };

  const submitSingle = async (extra: Partial<PlanFromMessagePayload> = {}) => {
    const isFirst = !slot.result;
    setSlot((s) => ({ ...s, loading: isFirst, working: !isFirst, error: '' }));
    try {
      const res = await CampaignService.planFromMessage({
        objective: objective.value,
        message,
        ...(platform.single ? { preferred_platform: platform.single } : {}),
        ...(platform.single === 'google' ? { google_placement: googlePlacement } : {}),
        ...creativePayload(creative),
        ...(chosenVariantRef.current
          ? {
              selected_plan_variant: chosenVariantRef.current.variant,
              variant_group_id: chosenVariantRef.current.variantGroupId,
            }
          : {}),
        ...(ownAudienceRef.current ? { target_audience: ownAudienceRef.current } : {}),
        ...extra,
      } as PlanFromMessagePayload);
      setSlot({ result: res, loading: false, working: false, error: '' });
    } catch (e) {
      const msg = extractErrorMessage(e, "We're experiencing some difficulties — please try again in a little while.");
      setSlot((s) => ({ ...s, loading: false, working: false, error: msg }));
    }
  };

  // ===================== multi platform =====================
  const [slots, setSlots] = useState<Partial<Record<MultiWizardPlatform, SlotState>>>(() => {
    const seeded: Partial<Record<MultiWizardPlatform, SlotState>> = {};
    for (const [p, result] of Object.entries(initialResults?.multi ?? {})) {
      if (result) seeded[p as MultiWizardPlatform] = { result, loading: false, working: false, error: '' };
    }
    return seeded;
  });
  const multiRefs = useRef<
    Record<
      string,
      { chosenVariant: { variant: PlanVariant; variantGroupId: string } | null; ownAudience: string | null }
    >
  >({});
  const campaignGroupId = useRef(uid());
  const [activeTab, setActiveTab] = useState<MultiWizardPlatform | null>(null);
  // Same attestation gate as the single-platform path, scoped to whichever tab the
  // upload/recompose was started from.
  const [multiPendingAttestation, setMultiPendingAttestation] = useState<{
    platform: MultiWizardPlatform;
    url: string;
    forRecompose: boolean;
  } | null>(null);
  // Same "who's in it?" gate as single-platform, scoped to whichever tab started it.
  const [multiPendingVideoWho, setMultiPendingVideoWho] = useState<{
    platform: MultiWizardPlatform;
    url: string;
  } | null>(null);

  const submitMulti = async (p: MultiWizardPlatform, extra: Partial<PlanFromMessagePayload> = {}) => {
    const refs = (multiRefs.current[p] ??= { chosenVariant: null, ownAudience: null });
    const prior = slots[p];
    const isFirst = !prior?.result;
    setSlots((s) => ({ ...s, [p]: { result: prior?.result ?? null, loading: isFirst, working: !isFirst, error: '' } }));
    try {
      const perPlatformBudget = typeof budget.amountNgn === 'number' ? budget.amountNgn / platforms.length : 0;
      const res = await CampaignService.planFromMessage({
        objective: objective.value,
        message,
        preferred_platform: p,
        budget_ngn_override: perPlatformBudget,
        days_override: budget.days,
        campaign_group_id: campaignGroupId.current,
        ...(p === 'google' ? { google_placement: googlePlacement } : {}),
        ...creativePayload(creative),
        ...(refs.chosenVariant
          ? { selected_plan_variant: refs.chosenVariant.variant, variant_group_id: refs.chosenVariant.variantGroupId }
          : {}),
        ...(refs.ownAudience ? { target_audience: refs.ownAudience } : {}),
        ...extra,
      } as PlanFromMessagePayload);
      setSlots((s) => ({ ...s, [p]: { result: res, loading: false, working: false, error: '' } }));
    } catch (e) {
      const msg = extractErrorMessage(e, "We're experiencing some difficulties — please try again in a little while.");
      setSlots((s) => ({ ...s, [p]: { result: prior?.result ?? null, loading: false, working: false, error: msg } }));
    }
  };

  const resolveMultiAttestation = (asset_attestation: AssetAttestation | undefined) => {
    const pending = multiPendingAttestation;
    if (!pending) return;
    setMultiPendingAttestation(null);
    void submitMulti(
      pending.platform,
      pending.forRecompose
        ? { creative_source: 'recomposite', reference_image_url: pending.url, asset_attestation }
        : { creative_source: 'upload', reference_image_url: pending.url, is_video: false, asset_attestation }
    );
  };

  const resolveMultiVideoWho = (provenance?: CreativeProvenanceInput) => {
    const pending = multiPendingVideoWho;
    if (!pending) return;
    setMultiPendingVideoWho(null);
    void submitMulti(pending.platform, {
      creative_source: 'upload',
      reference_image_url: pending.url,
      is_video: true,
      ...(provenance ?? {}),
    });
  };

  useEffect(() => {
    if (startedRef.current) return;
    startedRef.current = true;
    if (isMulti) {
      setActiveTab(platforms[0]);
      // A platform already seeded from a resumed draft (initialResults) picks
      // the conversation back up where it was instead of firing a fresh call —
      // only the ones with nothing saved start from scratch.
      platforms.forEach((p) => {
        if (!initialResults?.multi?.[p]) void submitMulti(p);
      });
    } else if (!initialResults?.single) {
      void submitSingle();
    }
    // Runs once, on entry to this step — every later call is a user-driven follow-up.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const decided = (stage: LaunchFromMessageResult['stage'] | undefined) => stage === 'planned' || stage === 'launched';
  const ready = isMulti
    ? platforms.length > 0 && platforms.every((p) => decided(slots[p]?.result?.stage))
    : decided(slot.result?.stage);

  useEffect(() => {
    onStatusChange?.(ready);
  }, [ready, onStatusChange]);

  // Keeps the autosaved draft's snapshot current — whatever's actually on
  // screen right now, so a resume later picks up from here, not from scratch.
  useEffect(() => {
    if (!onResultsChange) return;
    if (isMulti) {
      const multi: Partial<Record<MultiWizardPlatform, LaunchFromMessageResult>> = {};
      for (const p of platforms) {
        if (slots[p]?.result) multi[p] = slots[p]!.result!;
      }
      onResultsChange({ multi });
    } else {
      onResultsChange({ single: slot.result });
    }
    // platforms is derived fresh from platform/isMulti every render; including
    // the whole array would re-fire this on every render for no reason.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isMulti, slot.result, slots, onResultsChange]);

  const launchedCount = isMulti
    ? platforms.filter((p) => slots[p]?.result?.stage === 'launched').length
    : slot.result?.stage === 'launched'
      ? 1
      : 0;

  // ---- shared pieces ----
  const workingBanner = (label: string) => (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        background: '#fdf2f8',
        border: '1px solid #f6c9dd',
        borderRadius: 10,
        padding: '10px 13px',
        marginBottom: 14,
        fontSize: 12.5,
        color: '#8a1249',
        fontWeight: 600,
      }}
    >
      <span
        style={{
          width: 15,
          height: 15,
          borderRadius: '50%',
          border: '2px solid #f6c9dd',
          borderTopColor: PINK,
          flexShrink: 0,
          animation: 'wizard-spin .8s linear infinite',
        }}
      />
      <style>{`@keyframes wizard-spin { to { transform: rotate(360deg); } }`}</style>
      {label}
    </div>
  );

  const errorBanner = (message: string, onRetry: () => void) => (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 10,
        background: '#fef2f2',
        border: '1px solid #f3c7c7',
        borderRadius: 10,
        padding: '11px 14px',
        marginBottom: 14,
        fontSize: 12.5,
        color: '#991b1b',
      }}
    >
      <span>{message}</span>
      <button
        type="button"
        onClick={onRetry}
        style={{
          border: '1.5px solid #991b1b',
          background: '#fff',
          color: '#991b1b',
          borderRadius: 8,
          padding: '6px 12px',
          fontSize: 11.5,
          fontWeight: 800,
          flexShrink: 0,
        }}
      >
        Try again
      </button>
    </div>
  );

  // ============================= render =============================

  if (!isMulti) {
    if (slot.loading) return <p style={{ fontSize: 13.5, color: '#7a7270' }}>Building your campaign plan…</p>;
    if (slot.error && !slot.result) {
      return (
        <div>
          <p style={{ fontSize: 13.5, color: '#b91c1c', marginBottom: 10 }}>{slot.error}</p>
          <button
            type="button"
            onClick={() => void submitSingle()}
            style={{
              border: `1.5px solid ${PINK}`,
              background: '#fff',
              color: PINK,
              borderRadius: 10,
              padding: '8px 16px',
              fontSize: 13,
              fontWeight: 700,
              cursor: 'pointer',
            }}
          >
            Try again
          </button>
        </div>
      );
    }
    if (!slot.result) return null;
    const result = slot.result;
    const tiktokFloor = platform.single === 'tiktok' ? tiktokFloorChip(result) : null;

    return (
      <div>
        <RecapStrip objective={objective} platform={platform} audience={audience} budget={budget} creative={creative} />
        {slot.working && workingBanner('Updating your plan…')}
        {slot.error && slot.result && errorBanner(slot.error, () => void submitSingle())}
        <div
          className={slot.working ? 'wizard-dim' : ''}
          style={slot.working ? { opacity: 0.5, pointerEvents: 'none' } : undefined}
        >
          <p style={{ margin: '0 0 14px', fontSize: 12.5, color: '#7a7270' }}>
            {ready
              ? "Here's what Jane's put together — adjust anything before you launch."
              : 'A couple of quick questions to finish this plan before you review it.'}
          </p>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*,video/*"
            style={{ display: 'none' }}
            onChange={async (e) => {
              const file = e.target.files?.[0];
              e.target.value = '';
              if (!file) return;
              const { url, is_video } = await CampaignService.uploadMedia(file);
              if (uploadForRef.current === 'recompose') {
                if (is_video) {
                  setSlot((s) => ({
                    ...s,
                    error: 'Recompositing works with a photo, not a video — please choose an image.',
                  }));
                  return;
                }
                setPendingAttestation({ url, forRecompose: true });
                return;
              }
              if (!is_video) {
                setPendingAttestation({ url, forRecompose: false });
                return;
              }
              setPendingVideoWho(url);
            }}
          />
          <ResultCard
            result={result}
            adFormats={adFormats}
            onResultChange={(r) => setSlot((s) => ({ ...s, result: r }))}
            onLaunched={() => {
              // The autosaved draft is done once something real has launched from
              // it — "Create another campaign" (below) is still the explicit,
              // user-chosen way back to a fresh wizard; this only stops a finished
              // run from being offered as "resume" on the list page.
              onAnyLaunched?.();
            }}
            onQuickReply={(text) => void submitSingle({ message: `${message} ${text}` })}
            onTopUp={() => window.open('/workspace/?tab=campaigns', '_blank')}
            onSubmitWhatsapp={(number) => void submitSingle({ whatsapp_number: number })}
            onSubmitMetaConnectionWhatsapp={async (number) => {
              await CampaignService.setWhatsapp(number);
              void submitSingle({ whatsapp_number: number });
            }}
            onChooseGenerate={() => void submitSingle({ creative_source: 'generate' })}
            onChooseConcepts={(n) => void submitSingle({ creative_source: 'generate', concepts: n })}
            onChooseUpload={() => {
              uploadForRef.current = 'upload';
              fileInputRef.current?.click();
            }}
            onChooseRecomposite={() => {
              uploadForRef.current = 'recompose';
              fileInputRef.current?.click();
            }}
            onChooseDraft={(draftId) => void submitSingle({ creative_source: 'draft', draft_id: draftId })}
            onChooseAiVideo={(url, provenance: CreativeProvenanceInput) =>
              void submitSingle({ creative_source: 'upload', reference_image_url: url, is_video: true, ...provenance })
            }
            creativePaths={creativePaths}
            briefText={message}
            onChooseVariants={(variants, groupId) => {
              ownAudienceRef.current = null;
              chosenVariantRef.current = { variant: variants[0], variantGroupId: groupId };
              void submitSingle({ selected_plan_variant: variants[0], variant_group_id: groupId });
            }}
            onChooseOwnAudience={(text) => {
              const audienceText = text.trim();
              chosenVariantRef.current = null;
              ownAudienceRef.current = audienceText;
              void submitSingle({ target_audience: audienceText });
            }}
            onChooseDestination={(answer) => void submitSingle(answer as Partial<PlanFromMessagePayload>)}
            onPickPlatform={(p) => void submitSingle({ preferred_platform: p || undefined })}
          />
          {pendingAttestation && (
            <WizardAssetAttestation previewUrl={pendingAttestation.url} onAnswer={resolveAttestation} />
          )}
          {pendingVideoWho && (
            <div style={{ background: '#faf7f6', border: '1px solid #ece8e6', borderRadius: 12, padding: 12 }}>
              <p style={{ margin: '0 0 10px', fontSize: 12.5, fontWeight: 700, color: '#1a0a12' }}>
                Who&rsquo;s in this video?
              </p>
              <VideoWhoPrompt info={creativePaths} onAnswer={resolveVideoWho} />
            </div>
          )}
          {tiktokFloor && (
            <QuickReplyChips
              chips={[`Use ₦${tiktokFloor} instead`]}
              onPick={() => void submitSingle({ message: `${message} ${tiktokFloor}` })}
            />
          )}
        </div>
        {launchedCount > 0 && (
          <div style={{ marginTop: 18, paddingTop: 16, borderTop: '1px solid #ece8e6', textAlign: 'center' }}>
            <button
              type="button"
              onClick={onCreateAnother}
              style={{
                border: 'none',
                background: PINK,
                color: '#fff',
                borderRadius: 10,
                padding: '10px 20px',
                fontSize: 13,
                fontWeight: 800,
                cursor: 'pointer',
              }}
            >
              + Create another campaign
            </button>
          </div>
        )}
      </div>
    );
  }

  // ---- multi-platform ----
  const active = activeTab ?? platforms[0];
  const activeSlot = slots[active];
  const allLaunched = platforms.every((p) => slots[p]?.result?.stage === 'launched');

  return (
    <div>
      <RecapStrip objective={objective} platform={platform} audience={audience} budget={budget} creative={creative} />
      <div
        style={{
          display: 'flex',
          gap: 6,
          marginBottom: 16,
          borderBottom: '1px solid #ece8e6',
          overflowX: 'auto',
        }}
      >
        {platforms.map((p) => {
          const st = slots[p];
          const status: PlatformStatus = st?.result ? statusForStage(st.result.stage) : st?.error ? 'attn' : 'decide';
          return (
            <button
              key={p}
              type="button"
              onClick={() => setActiveTab(p)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 7,
                padding: '10px 14px',
                border: 'none',
                background: 'none',
                fontSize: 12.5,
                fontWeight: 700,
                color: p === active ? '#1a0a12' : '#7a7270',
                borderBottom: p === active ? `2px solid ${PINK}` : '2px solid transparent',
                cursor: 'pointer',
                marginBottom: -1,
                whiteSpace: 'nowrap',
                flexShrink: 0,
              }}
            >
              <span style={{ width: 7, height: 7, borderRadius: '50%', background: STATUS_DOT[status] }} />
              {PLATFORM_LABEL[p]}
            </button>
          );
        })}
      </div>

      {launchedCount > 0 && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: 10,
            background: '#ecfdf5',
            border: '1px solid #bbf0cf',
            borderRadius: 10,
            padding: '10px 14px',
            marginBottom: 16,
            fontSize: 12.5,
            color: '#15803d',
            fontWeight: 700,
          }}
        >
          <span>
            {launchedCount} of {platforms.length} launched{allLaunched ? ' — all set.' : ', paused until you say go.'}
          </span>
          <button
            type="button"
            onClick={onCreateAnother}
            style={{
              border: 'none',
              background: PINK,
              color: '#fff',
              borderRadius: 9,
              padding: '7px 15px',
              fontSize: 12,
              fontWeight: 800,
              cursor: 'pointer',
              flexShrink: 0,
            }}
          >
            + Create another campaign
          </button>
        </div>
      )}

      {!activeSlot || activeSlot.loading ? (
        <p style={{ fontSize: 13.5, color: '#7a7270' }}>Building the {PLATFORM_LABEL[active]} plan…</p>
      ) : activeSlot.error && !activeSlot.result ? (
        <div>
          <p style={{ fontSize: 13.5, color: '#b91c1c', marginBottom: 10 }}>{activeSlot.error}</p>
          <button
            type="button"
            onClick={() => void submitMulti(active)}
            style={{
              border: `1.5px solid ${PINK}`,
              background: '#fff',
              color: PINK,
              borderRadius: 10,
              padding: '8px 16px',
              fontSize: 13,
              fontWeight: 700,
              cursor: 'pointer',
            }}
          >
            Try again
          </button>
        </div>
      ) : activeSlot.result ? (
        <div>
          {activeSlot.working && workingBanner(`Updating the ${PLATFORM_LABEL[active]} plan…`)}
          {activeSlot.error && errorBanner(activeSlot.error, () => void submitMulti(active))}
          <div style={activeSlot.working ? { opacity: 0.5, pointerEvents: 'none' } : undefined}>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*,video/*"
              style={{ display: 'none' }}
              onChange={async (e) => {
                const file = e.target.files?.[0];
                e.target.value = '';
                if (!file) return;
                const { url, is_video } = await CampaignService.uploadMedia(file);
                if (uploadForRef.current === 'recompose') {
                  if (is_video) {
                    setSlots((s) => ({
                      ...s,
                      [active]: {
                        ...s[active]!,
                        error: 'Recompositing works with a photo, not a video — please choose an image.',
                      },
                    }));
                    return;
                  }
                  setMultiPendingAttestation({ platform: active, url, forRecompose: true });
                  return;
                }
                if (!is_video) {
                  setMultiPendingAttestation({ platform: active, url, forRecompose: false });
                  return;
                }
                setMultiPendingVideoWho({ platform: active, url });
              }}
            />
            <ResultCard
              result={activeSlot.result}
              adFormats={adFormats}
              onResultChange={(r) => setSlots((s) => ({ ...s, [active]: { ...s[active]!, result: r } }))}
              onLaunched={() => {
                // Only once EVERY selected platform has launched — clearing on the
                // first one would stop offering the still-unfinished others as
                // "resume" while they're still genuinely in progress.
                const others = platforms.filter((p) => p !== active);
                if (others.every((p) => slots[p]?.result?.stage === 'launched')) onAnyLaunched?.();
              }}
              onQuickReply={(text) => void submitMulti(active, { message: `${message} ${text}` })}
              onTopUp={() => window.open('/workspace/?tab=campaigns', '_blank')}
              onSubmitWhatsapp={(number) => void submitMulti(active, { whatsapp_number: number })}
              onSubmitMetaConnectionWhatsapp={async (number) => {
                await CampaignService.setWhatsapp(number);
                void submitMulti(active, { whatsapp_number: number });
              }}
              onChooseGenerate={() => void submitMulti(active, { creative_source: 'generate' })}
              onChooseConcepts={(n) => void submitMulti(active, { creative_source: 'generate', concepts: n })}
              onChooseUpload={() => {
                uploadForRef.current = 'upload';
                fileInputRef.current?.click();
              }}
              onChooseRecomposite={() => {
                uploadForRef.current = 'recompose';
                fileInputRef.current?.click();
              }}
              onChooseDraft={(draftId) => void submitMulti(active, { creative_source: 'draft', draft_id: draftId })}
              onChooseAiVideo={(url, provenance: CreativeProvenanceInput) =>
                void submitMulti(active, {
                  creative_source: 'upload',
                  reference_image_url: url,
                  is_video: true,
                  ...provenance,
                })
              }
              creativePaths={creativePaths}
              briefText={message}
              onChooseVariants={(variants, groupId) => {
                const refs = (multiRefs.current[active] ??= { chosenVariant: null, ownAudience: null });
                refs.ownAudience = null;
                refs.chosenVariant = { variant: variants[0], variantGroupId: groupId };
                void submitMulti(active, { selected_plan_variant: variants[0], variant_group_id: groupId });
              }}
              onChooseOwnAudience={(text) => {
                const refs = (multiRefs.current[active] ??= { chosenVariant: null, ownAudience: null });
                const audienceText = text.trim();
                refs.chosenVariant = null;
                refs.ownAudience = audienceText;
                void submitMulti(active, { target_audience: audienceText });
              }}
              onChooseDestination={(answer) => void submitMulti(active, answer as Partial<PlanFromMessagePayload>)}
            />
            {multiPendingAttestation?.platform === active && (
              <WizardAssetAttestation previewUrl={multiPendingAttestation.url} onAnswer={resolveMultiAttestation} />
            )}
            {multiPendingVideoWho?.platform === active && (
              <div style={{ background: '#faf7f6', border: '1px solid #ece8e6', borderRadius: 12, padding: 12 }}>
                <p style={{ margin: '0 0 10px', fontSize: 12.5, fontWeight: 700, color: '#1a0a12' }}>
                  Who&rsquo;s in this video?
                </p>
                <VideoWhoPrompt info={creativePaths} onAnswer={resolveMultiVideoWho} />
              </div>
            )}
            {active === 'tiktok' &&
              tiktokFloorChip(activeSlot.result) &&
              (() => {
                const floor = tiktokFloorChip(activeSlot.result!)!;
                return (
                  <QuickReplyChips
                    chips={[`Use ₦${floor} instead`]}
                    onPick={() => void submitMulti(active, { message: `${message} ${floor}` })}
                  />
                );
              })()}
          </div>
        </div>
      ) : null}
    </div>
  );
}
