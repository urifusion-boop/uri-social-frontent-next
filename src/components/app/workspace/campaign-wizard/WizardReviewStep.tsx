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
 *  - Several audience plans picked on one ad's plan card become several ads (one per
 *    plan, each its own campaign, all running at once) with that ad's budget split
 *    evenly between them — see answerAudience. Every ad, whatever made it, is one
 *    PlanRun with its own tab.
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
import { QuickReplyChips, ResultCard, ResultCardLaunchOutcome, ResultCardLaunchState, uid } from '../CampaignsPage';
import { useCreativePaths, VideoWhoPrompt } from '../CreativePathControls';
import type { GooglePlacement } from '../GooglePlacementPreview';
import type { WizardObjectiveValue } from './WizardObjectiveStep';
import type { WizardAudienceValue } from './WizardAudienceStep';
import type { WizardBudgetValue } from './WizardBudgetStep';
import type { WizardCreativeChoice } from './WizardCreativeStep';
import type { MultiWizardPlatform, WizardPlatformValue } from './WizardPlatformStep';
import WizardAssetAttestation from './WizardAssetAttestation';
import { WizardPlanSnapshot, WizardReviewChoice, WizardReviewSnapshot } from './wizardDraft';
import { EventBus, EVENTS } from '@/src/services/EventBus';

const PINK = '#C2185B';

type PlanFromMessagePayload = Parameters<typeof CampaignService.planFromMessage>[0];

/** The goal step's answers, as planFromMessage fields. Instagram DMs only exist on Meta,
 *  so on TikTok or Google that answer is left for Jane to ask about instead. */
function goalPayload(objective: WizardObjectiveValue, onPlatform: string): Partial<PlanFromMessagePayload> {
  const out: Partial<PlanFromMessagePayload> = {};
  if (objective.desired_action) out.desired_action = objective.desired_action;
  const dest = objective.destination_type;
  if (dest && !(dest === 'instagram_dm' && (onPlatform === 'tiktok' || onPlatform === 'google'))) {
    out.destination_type = dest;
    if (objective.destination_value?.trim()) out.destination_value = objective.destination_value.trim();
  }
  return out;
}

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
      // Meta runs every extra photo as another ad in the same campaign; other platforms ignore it.
      ...(creative.carouselExtraUrls && creative.carouselExtraUrls.length > 0 && !creative.is_video
        ? { extra_image_urls: creative.carouselExtraUrls }
        : {}),
      ...(creative.asset_attestation ? { asset_attestation: creative.asset_attestation } : {}),
      ...(creative.vsg01_format_id ? { vsg01_format_id: creative.vsg01_format_id } : {}),
    };
  }
  if (creative.creative_source === 'draft') {
    return { creative_source: 'draft', draft_id: creative.draft_id };
  }
  if (creative.creative_source === 'existing_post') {
    return {
      creative_source: 'existing_post',
      reference_image_url: creative.previewUrl,
      is_video: creative.is_video,
      existing_post_platform: creative.post_platform,
      existing_post_id: creative.post_id,
      existing_post_caption: creative.caption,
    };
  }
  return {
    creative_source: 'generate',
    ...(creative.concepts ? { concepts: creative.concepts } : {}),
    // The Style step's pick; empty means Jane chooses.
    ...(creative.vsg01_format_id ? { vsg01_format_id: creative.vsg01_format_id } : {}),
  };
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
  styleText,
}: {
  objective: WizardObjectiveValue;
  platform: WizardPlatformValue;
  audience: WizardAudienceValue;
  budget: WizardBudgetValue;
  creative: WizardCreativeChoice;
  /** "Style: Event Promo" (or "Style: Jane chooses") once the Style step has been answered. */
  styleText?: string | null;
}) {
  const platformText =
    platform.mode === 'multi'
      ? platform.multi.map((p) => PLATFORM_LABEL[p]).join(', ')
      : platform.single
        ? PLATFORM_LABEL[platform.single as MultiWizardPlatform]
        : "Jane's pick";
  const creativeText =
    creative.creative_source === 'generate'
      ? creative.concepts && creative.concepts >= 2
        ? `${creative.concepts} ad concepts (Meta tests)`
        : 'Jane-generated creative'
      : creative.creative_source === 'draft'
        ? 'Creative from a past draft'
        : creative.creative_source === 'existing_post'
          ? `Your ${creative.post_platform === 'instagram' ? 'Instagram' : 'Facebook'} post`
          : creative.is_video
            ? 'Your uploaded video'
            : (creative.carouselExtraUrls?.length ?? 0) > 0
              ? `Your ${1 + (creative.carouselExtraUrls?.length ?? 0)} uploaded photos`
              : 'Your uploaded photo';
  const items = [
    objective.label || objective.value,
    platformText,
    audience.city.trim() || null,
    typeof budget.amountNgn === 'number' && budget.amountNgn > 0
      ? `₦${budget.amountNgn.toLocaleString()} over ${budget.days}d`
      : null,
    creativeText,
    styleText || null,
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
              maxWidth: '100%',
              overflowWrap: 'anywhere',
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
const restoredSlot = (result: LaunchFromMessageResult | null | undefined): SlotState =>
  result ? { result, loading: false, working: false, error: '' } : emptySlot();

/** The one ad of a single-platform run (a multi-platform run keys its first ad per platform by the platform). */
const SINGLE_KEY = 'single';
/** An extra audience plan split off `parentKey`'s ad — stable, so a resumed draft finds it again. */
const extraPlanKey = (parentKey: string, rank: number) => `${parentKey}~plan${rank}`;

/** One ad this step builds: its own planFromMessage conversation, from the first call to
 *  its own Launch button. One in a single-platform run, one per platform in a
 *  multi-platform run, and one more beside it for every extra audience plan picked on
 *  that ad's "choose a plan" card. */
interface PlanRun {
  key: string;
  /** The ad this extra audience plan was split off. */
  parent?: string;
  /** null in a single-platform run (platform.single, or Jane's pick). */
  platform: MultiWizardPlatform | null;
  /** This ad's budget when it's a share of the total — one platform of several, or one
   *  audience plan of several. null sends no override (the message's own budget). */
  share: number | null;
  /** Resent on every call — see WizardReviewChoice for why. */
  choice: { variant: PlanVariant; variantGroupId: string } | null;
  ownAudience: string | null;
  slot: SlotState;
}

function choiceFrom(c?: WizardReviewChoice): PlanRun['choice'] {
  return c?.variant && c.variantGroupId ? { variant: c.variant, variantGroupId: c.variantGroupId } : null;
}

/** The ads to show on entry: a resumed draft's own (when they still match this run's
 *  platforms — CampaignWizard drops saved results whenever an input changes, so this is
 *  a guard, not the usual path), else one per platform, else the one single ad. */
function initialRuns(
  isMulti: boolean,
  platforms: MultiWizardPlatform[],
  amountNgn: number,
  saved?: WizardReviewSnapshot
): PlanRun[] {
  const plans = saved?.plans;
  const fits =
    !!plans &&
    plans.length > 0 &&
    (isMulti
      ? plans.every((p) => p.platform && platforms.includes(p.platform)) &&
        platforms.every((p) => plans.some((s) => s.key === p))
      : plans.every((p) => !p.platform) && plans.some((p) => p.key === SINGLE_KEY));
  if (fits) {
    return plans.map((p) => ({
      key: p.key,
      ...(p.parent ? { parent: p.parent } : {}),
      platform: p.platform ?? null,
      share: p.share ?? null,
      choice: choiceFrom(p.choice),
      ownAudience: p.choice?.ownAudience ?? null,
      slot: restoredSlot(p.result),
    }));
  }
  if (isMulti) {
    const share = amountNgn / platforms.length;
    return platforms.map((p) => ({
      key: p,
      platform: p,
      share,
      choice: choiceFrom(saved?.multiChoice?.[p]),
      ownAudience: saved?.multiChoice?.[p]?.ownAudience ?? null,
      slot: restoredSlot(saved?.multi?.[p]),
    }));
  }
  return [
    {
      key: SINGLE_KEY,
      platform: null,
      share: null,
      choice: choiceFrom(saved?.singleChoice),
      ownAudience: saved?.singleChoice?.ownAudience ?? null,
      slot: restoredSlot(saved?.single),
    },
  ];
}

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
  onChangeStyle,
  onChangeCreative,
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
  /** Back to the Style step ("Change style" beside the style the ad was made in). */
  onChangeStyle?: () => void;
  /** Back to the Creative step (TikTok's "needs a video" answer: use 2+ photos instead). */
  onChangeCreative?: () => void;
}) {
  const isMulti = platform.mode === 'multi' && platform.multi.length >= 2;
  const platforms: MultiWizardPlatform[] = isMulti ? platform.multi : [];
  // The style picked on the Style step, when this ad came out in a different one (that style's
  // content couldn't be built for this ad), so the card says so instead of silently differing.
  const chosenStyle =
    creative.creative_source === 'draft' || creative.creative_source === 'existing_post'
      ? ''
      : creative.vsg01_format_id || '';
  const styleFallbackFrom = (r: LaunchFromMessageResult | null | undefined) => {
    const used = r?.creative?.vsg01_format_id;
    return chosenStyle && used && used !== chosenStyle ? chosenStyle : undefined;
  };
  const [adFormats, setAdFormats] = useState<AdFormat[]>([]);
  const styleText =
    creative.creative_source === 'draft' ||
    creative.creative_source === 'existing_post' ||
    creative.vsg01_format_id === undefined
      ? null
      : creative.vsg01_format_id === ''
        ? 'Style: Jane chooses'
        : `Style: ${adFormats.find((f) => f.format_id === creative.vsg01_format_id)?.name ?? 'your pick'}`;
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

  // ===================== the ads being built =====================
  // One PlanRun per ad (see PlanRun). Kept in a ref as well as state: a submit reads the
  // run's chosen audience the moment it's called, often right after a pick just changed it,
  // which a state value from the last render wouldn't have yet.
  const totalNgn = typeof budget.amountNgn === 'number' ? budget.amountNgn : 0;
  const [runs, setRunsState] = useState<PlanRun[]>(() => initialRuns(isMulti, platforms, totalNgn, initialResults));
  const runsRef = useRef<PlanRun[]>(runs);
  const commitRuns = (next: PlanRun[]) => {
    runsRef.current = next;
    setRunsState(next);
  };
  const patchRun = (key: string, fn: (r: PlanRun) => PlanRun) =>
    commitRuns(runsRef.current.map((r) => (r.key === key ? fn(r) : r)));
  const patchSlot = (key: string, slot: Partial<SlotState>) =>
    patchRun(key, (r) => ({ ...r, slot: { ...r.slot, ...slot } }));

  const campaignGroupId = useRef(uid());
  const [activeKey, setActiveKey] = useState<string>(() => runs[0]?.key ?? 'single');
  // "What does this photo actually show?" — asked for any real photo picked via the
  // mid-flow choose_creative_source card (upload or recompose), same as every other
  // real-photo entry point. See WizardAssetAttestation.tsx. Scoped to the ad it was
  // started from.
  const [pendingAttestation, setPendingAttestation] = useState<{
    key: string;
    url: string;
    forRecompose: boolean;
  } | null>(null);
  // Same gate for a real video — "who's in it?" — only reachable via "Upload my
  // own" (recompose is image-only, rejected before this point).
  const [pendingVideoWho, setPendingVideoWho] = useState<{ key: string; url: string } | null>(null);

  const submitRun = async (key: string, extra: Partial<PlanFromMessagePayload> = {}) => {
    const run = runsRef.current.find((r) => r.key === key);
    if (!run) return;
    const isFirst = !run.slot.result;
    patchSlot(key, { loading: isFirst, working: !isFirst, error: '' });
    const onPlatform = run.platform ?? platform.single;
    try {
      const res = await CampaignService.planFromMessage({
        objective: objective.value,
        message,
        ...goalPayload(objective, onPlatform),
        ...(onPlatform ? { preferred_platform: onPlatform } : {}),
        ...(onPlatform === 'google' ? { google_placement: googlePlacement } : {}),
        // This ad's share of the total — one platform of several, or one audience plan of several.
        ...(run.share != null ? { budget_ngn_override: run.share, days_override: budget.days } : {}),
        ...(isMulti ? { campaign_group_id: campaignGroupId.current } : {}),
        ...creativePayload(creative),
        ...(run.choice
          ? { selected_plan_variant: run.choice.variant, variant_group_id: run.choice.variantGroupId }
          : {}),
        ...(run.ownAudience ? { target_audience: run.ownAudience } : {}),
        ...extra,
      } as PlanFromMessagePayload);
      patchSlot(key, { result: res, loading: false, working: false, error: '' });
      // A finished plan carries an ad Jane made (a credit) — let the header badge re-read.
      if (res.stage === 'planned') EventBus.emit(EVENTS.CREDIT_CONSUMED, { amount: 1, operation: 'ad_plan' });
    } catch (e) {
      const msg = extractErrorMessage(e, "We're experiencing some difficulties — please try again in a little while.");
      patchSlot(key, { loading: false, working: false, error: msg });
    }
  };

  /** Answers the audience question on one ad. Live-reported (staging, 2026-11-24): picking
   *  two audience plans built only the first — "when I build two ads, should I not expect
   *  that it generates two graphics/ads that will run simultaneously?". Every plan picked
   *  now gets its own ad: the first continues this run, each other one starts its own run
   *  right beside it, and the budget this run had is split evenly between them — what the
   *  plan cards already promised ("₦X if run alone, or ₦Y alongside another"). Answering
   *  again (one plan, or the client's own audience) folds the extra plans back in; any
   *  that already launched are live campaigns, so they stay, with their share. */
  const answerAudience = (
    key: string,
    answer: { variants: PlanVariant[]; groupId: string } | { ownAudience: string }
  ) => {
    const run = runsRef.current.find((r) => r.key === key);
    if (!run) return;
    const variants = 'variants' in answer ? answer.variants : [];
    if ('variants' in answer && variants.length === 0) return;
    const siblings = runsRef.current.filter((r) => r.parent === key);
    const live = siblings.filter((r) => r.slot.result?.stage === 'launched');
    const liveKeys = new Set(live.map((r) => r.key));
    const pool =
      run.share != null
        ? run.share * (1 + siblings.length) - live.reduce((sum, r) => sum + (r.share ?? 0), 0)
        : totalNgn > 0
          ? totalNgn
          : null;
    const extraVariants = variants.slice(1).filter((v) => !liveKeys.has(extraPlanKey(key, v.rank)));
    const count = 1 + extraVariants.length;
    // Unchanged from before when nothing was ever split: no override, the message's own budget.
    const share =
      count === 1 && siblings.length === 0
        ? run.share
        : pool != null
          ? Math.round((pool / count) * 100) / 100
          : run.share;
    const choiceFor = (v: PlanVariant) => ({ variant: v, variantGroupId: 'groupId' in answer ? answer.groupId : '' });
    const extras: PlanRun[] = extraVariants.map((v) => ({
      key: extraPlanKey(key, v.rank),
      parent: key,
      platform: run.platform,
      share,
      choice: choiceFor(v),
      ownAudience: null,
      slot: emptySlot(),
    }));
    const next: PlanRun[] = [];
    for (const r of runsRef.current) {
      if (r.parent === key && !liveKeys.has(r.key)) continue;
      if (r.key === key) {
        next.push({
          ...r,
          share,
          choice: variants[0] ? choiceFor(variants[0]) : null,
          ownAudience: 'ownAudience' in answer ? answer.ownAudience : null,
        });
        next.push(...extras);
      } else next.push(r);
    }
    commitRuns(next);
    if (!next.some((r) => r.key === activeKey)) setActiveKey(key);
    void submitRun(key);
    extras.forEach((r) => void submitRun(r.key));
  };

  /** Where a tap goes is the business's answer, not the audience's — so the audience plans
   *  split off the same pick, all asking it at once, take it from whichever one is answered
   *  instead of each asking again. Only those still waiting on that exact question. */
  const answerDestination = (key: string, answer: Partial<PlanFromMessagePayload>) => {
    const run = runsRef.current.find((r) => r.key === key);
    if (!run) return;
    const root = run.parent ?? run.key;
    const waiting = runsRef.current.filter(
      (r) =>
        r.key !== key &&
        (r.key === root || r.parent === root) &&
        r.slot.result?.stage === 'choose_destination' &&
        !r.slot.working
    );
    void submitRun(key, answer);
    waiting.forEach((r) => void submitRun(r.key, answer));
  };

  const resolveAttestation = (asset_attestation: AssetAttestation | undefined) => {
    const pending = pendingAttestation;
    if (!pending) return;
    setPendingAttestation(null);
    void submitRun(
      pending.key,
      pending.forRecompose
        ? { creative_source: 'recomposite', reference_image_url: pending.url, asset_attestation }
        : { creative_source: 'upload', reference_image_url: pending.url, is_video: false, asset_attestation }
    );
  };

  const resolveVideoWho = (provenance?: CreativeProvenanceInput) => {
    const pending = pendingVideoWho;
    if (!pending) return;
    setPendingVideoWho(null);
    void submitRun(pending.key, {
      creative_source: 'upload',
      reference_image_url: pending.url,
      is_video: true,
      ...(provenance ?? {}),
    });
  };

  useEffect(() => {
    if (startedRef.current) return;
    startedRef.current = true;
    // An ad already seeded from a resumed draft (initialResults) picks the
    // conversation back up where it was instead of firing a fresh call — only
    // the ones with nothing saved start from scratch.
    runsRef.current.forEach((r) => {
      if (!r.slot.result) void submitRun(r.key);
    });
    // Runs once, on entry to this step — every later call is a user-driven follow-up.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const decided = (stage: LaunchFromMessageResult['stage'] | undefined) => stage === 'planned' || stage === 'launched';
  const ready = runs.length > 0 && runs.every((r) => decided(r.slot.result?.stage));

  useEffect(() => {
    onStatusChange?.(ready);
  }, [ready, onStatusChange]);

  // Keeps the autosaved draft's snapshot current — whatever's actually on
  // screen right now, so a resume later picks up from here, not from scratch.
  // Carries each ad's chosen plan/own audience alongside the result itself:
  // Jane's /plan-from-message call is stateless (every call resends the full
  // picture), so resuming past the question that set them and answering the
  // NEXT one would otherwise send neither, and the backend would reopen the
  // already-settled audience — including, confusingly, re-asking about creative.
  // `plans` holds every ad; single/multi stay filled from the first ad of each
  // platform for the readers that only know those (the draft list's thumbnail).
  useEffect(() => {
    if (!onResultsChange) return;
    const choiceOf = (r: PlanRun): WizardReviewChoice | undefined =>
      r.choice || r.ownAudience
        ? {
            variant: r.choice?.variant,
            variantGroupId: r.choice?.variantGroupId,
            ownAudience: r.ownAudience ?? undefined,
          }
        : undefined;
    const plans: WizardPlanSnapshot[] = runs.map((r) => ({
      key: r.key,
      ...(r.parent ? { parent: r.parent } : {}),
      platform: r.platform,
      share: r.share,
      result: r.slot.result,
      choice: choiceOf(r),
    }));
    if (isMulti) {
      const multi: Partial<Record<MultiWizardPlatform, LaunchFromMessageResult>> = {};
      const multiChoice: Partial<Record<MultiWizardPlatform, WizardReviewChoice>> = {};
      for (const r of runs) {
        if (!r.platform || r.key !== r.platform) continue;
        if (r.slot.result) multi[r.platform] = r.slot.result;
        const c = choiceOf(r);
        if (c) multiChoice[r.platform] = c;
      }
      onResultsChange({ multi, multiChoice, plans });
    } else {
      const first = runs.find((r) => r.key === SINGLE_KEY);
      onResultsChange({ single: first?.slot.result ?? null, singleChoice: first ? choiceOf(first) : undefined, plans });
    }
  }, [isMulti, runs, onResultsChange]);

  const launchedCount = runs.filter((r) => r.slot.result?.stage === 'launched').length;
  // What each ad's card reports about launching (see ResultCardLaunchState), and its own launch.
  const [launchStates, setLaunchStates] = useState<Record<string, ResultCardLaunchState>>({});
  const launchers = useRef<Record<string, () => Promise<ResultCardLaunchOutcome>>>({});
  const [launchAll, setLaunchAll] = useState<{
    running: boolean;
    current: string | null;
    index: number;
    total: number;
    failed: string[];
  } | null>(null);
  // The mid-flow "Upload a video" for TikTok's needs-a-video answer takes a video only.
  const videoOnlyRef = useRef(false);

  // ---- shared pieces ----
  // Live-reported: clicking a button near the bottom of a long card (e.g. "Use
  // this" on the destination question) dimmed everything with no visible sign
  // anything was happening — this banner was only ever rendered at the very
  // top of the card, off-screen above wherever the user had actually scrolled
  // to. Sticky keeps it pinned in view regardless of scroll position, right
  // where the click just happened.
  const workingBanner = (label: string) => (
    <div
      style={{
        position: 'sticky',
        top: 8,
        zIndex: 5,
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
        boxShadow: '0 4px 14px rgba(0,0,0,.08)',
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

  const active = runs.find((r) => r.key === activeKey) ?? runs[0];
  const activeSlot = active?.slot;
  const showTabs = runs.length > 1;
  const allLaunched = launchedCount === runs.length;
  // A platform (or the one single-platform run) whose budget is split between audience plans.
  const isSplit = (r: PlanRun) => runs.filter((o) => o.platform === r.platform).length > 1;
  const planName = (r: PlanRun) => {
    const rank = r.choice?.variant.rank;
    const where = r.platform ? PLATFORM_LABEL[r.platform] : '';
    if (!isSplit(r) || !rank) return where || 'Your ad';
    return where ? `${where} · Plan ${rank}` : `Plan ${rank}`;
  };
  const planWho = (r: PlanRun) => {
    const who = isSplit(r) ? r.choice?.variant.who_its_for?.trim() : '';
    return who ? who.charAt(0).toUpperCase() + who.slice(1) : '';
  };
  const buildingText = (r: PlanRun) =>
    !showTabs
      ? 'Building your campaign plan…'
      : isSplit(r)
        ? `Building ${planName(r)}…`
        : `Building the ${planName(r)} plan…`;
  const updatingText = (r: PlanRun) =>
    !showTabs ? 'Updating your plan…' : isSplit(r) ? `Updating ${planName(r)}…` : `Updating the ${planName(r)} plan…`;

  // Exactly as before for a single-platform run with one ad: nothing on screen until the first answer.
  if (!isMulti && !showTabs && activeSlot) {
    if (activeSlot.loading) return <p style={{ fontSize: 13.5, color: '#7a7270' }}>Building your campaign plan…</p>;
    if (activeSlot.error && !activeSlot.result) {
      return (
        <div>
          <p style={{ fontSize: 13.5, color: '#b91c1c', marginBottom: 10 }}>{activeSlot.error}</p>
          <button
            type="button"
            onClick={() => void submitRun(active.key)}
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
    if (!activeSlot.result) return null;
  }

  // How each split budget was divided — said once, up front, so two ads costing half each
  // never reads as the budget having silently shrunk.
  const splitNotes: string[] = [];
  for (const where of Array.from(new Set(runs.map((r) => r.platform)))) {
    const group = runs.filter((r) => r.platform === where);
    if (group.length < 2) continue;
    const each = group[0].share;
    const total = group.reduce((sum, r) => sum + (r.share ?? 0), 0);
    const money =
      each != null && total > 0
        ? ` — ₦${Math.round(each).toLocaleString()} each of ${where ? 'its' : 'your'} ₦${Math.round(total).toLocaleString()}`
        : '';
    splitNotes.push(
      where
        ? `${PLATFORM_LABEL[where]}: ${group.length} audience plans, a separate ad for each${money}.`
        : `${group.length} audience plans, a separate ad for each, all running at the same time${money}.`
    );
  }

  const renderRun = (r: PlanRun) => {
    const st = r.slot;
    const where = r.platform ?? platform.single;
    const floor = st.result && where === 'tiktok' ? tiktokFloorChip(st.result) : null;
    if (!st.result && !st.error) return <p style={{ fontSize: 13.5, color: '#7a7270' }}>{buildingText(r)}</p>;
    if (st.error && !st.result) {
      return (
        <div>
          <p style={{ fontSize: 13.5, color: '#b91c1c', marginBottom: 10 }}>{st.error}</p>
          <button
            type="button"
            onClick={() => void submitRun(r.key)}
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
    if (!st.result) return null;
    const result = st.result;
    return (
      <div>
        {st.working && workingBanner(updatingText(r))}
        {st.error && errorBanner(st.error, () => void submitRun(r.key))}
        <div
          className={st.working ? 'wizard-dim' : ''}
          style={st.working ? { opacity: 0.5, pointerEvents: 'none' } : undefined}
        >
          {!isMulti && (
            <p style={{ margin: '0 0 14px', fontSize: 12.5, color: '#7a7270' }}>
              {decided(result.stage)
                ? "Here's what Jane's put together — adjust anything before you launch."
                : 'A couple of quick questions to finish this plan before you review it.'}
            </p>
          )}
          <ResultCard
            result={result}
            adFormats={adFormats}
            formatFallbackFrom={styleFallbackFrom(result)}
            onChangeStyle={onChangeStyle}
            onResultChange={(next) => patchSlot(r.key, { result: next })}
            onLaunched={() => {
              // The autosaved draft is done only once EVERY ad has launched —
              // clearing it on the first would stop offering the still-unfinished
              // others as "resume" while they're genuinely in progress. "Create
              // another campaign" stays the explicit way back to a fresh wizard.
              const others = runsRef.current.filter((o) => o.key !== r.key);
              if (others.every((o) => o.slot.result?.stage === 'launched')) onAnyLaunched?.();
            }}
            onLaunchState={(state) => setLaunchStates((prev) => ({ ...prev, [r.key]: state }))}
            registerLaunch={(launch) => {
              if (launch) launchers.current[r.key] = launch;
              else delete launchers.current[r.key];
            }}
            onQuickReply={(text) => void submitRun(r.key, { message: `${message} ${text}` })}
            onTopUp={() => window.open('/workspace/?tab=campaigns', '_blank')}
            onSubmitWhatsapp={(number) => void submitRun(r.key, { whatsapp_number: number })}
            onSubmitMetaConnectionWhatsapp={async (number) => {
              await CampaignService.setWhatsapp(number);
              void submitRun(r.key, { whatsapp_number: number });
            }}
            onChooseGenerate={() => void submitRun(r.key, { creative_source: 'generate' })}
            onChooseConcepts={(n) => void submitRun(r.key, { creative_source: 'generate', concepts: n })}
            onChooseUpload={() => {
              uploadForRef.current = 'upload';
              videoOnlyRef.current = false;
              fileInputRef.current?.click();
            }}
            onChooseRecomposite={() => {
              uploadForRef.current = 'recompose';
              videoOnlyRef.current = false;
              fileInputRef.current?.click();
            }}
            onChooseDraft={(draftId) => void submitRun(r.key, { creative_source: 'draft', draft_id: draftId })}
            onChooseAiVideo={(url, provenance: CreativeProvenanceInput) =>
              void submitRun(r.key, {
                creative_source: 'upload',
                reference_image_url: url,
                is_video: true,
                ...provenance,
              })
            }
            creativePaths={creativePaths}
            briefText={message}
            onChooseVariants={(variants, groupId) => answerAudience(r.key, { variants, groupId })}
            onChooseOwnAudience={(text) => answerAudience(r.key, { ownAudience: text.trim() })}
            onChooseDestination={(answer) => answerDestination(r.key, answer as Partial<PlanFromMessagePayload>)}
            onPickPlatform={!isMulti ? (p) => void submitRun(r.key, { preferred_platform: p || undefined }) : undefined}
          />
          {/* Live-found on staging: TikTok's "needs a video" answer ends with "send your
              message again" — there is no message box in the wizard, so it was a dead end.
              The two real ways forward, as buttons. */}
          {result.stage === 'tiktok_needs_video' && (
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', margin: '10px 0 0 40px' }}>
              <button
                type="button"
                onClick={() => {
                  uploadForRef.current = 'upload';
                  videoOnlyRef.current = true;
                  fileInputRef.current?.click();
                }}
                style={{
                  border: 'none',
                  background: PINK,
                  color: '#fff',
                  borderRadius: 10,
                  padding: '9px 16px',
                  fontSize: 12.5,
                  fontWeight: 800,
                  cursor: 'pointer',
                }}
              >
                Upload a video
              </button>
              {onChangeCreative && (
                <button
                  type="button"
                  onClick={onChangeCreative}
                  style={{
                    border: `1.5px solid ${PINK}`,
                    background: '#fff',
                    color: PINK,
                    borderRadius: 10,
                    padding: '8px 15px',
                    fontSize: 12.5,
                    fontWeight: 700,
                    cursor: 'pointer',
                  }}
                >
                  Use 2+ photos instead
                </button>
              )}
            </div>
          )}
          {pendingAttestation?.key === r.key && (
            <WizardAssetAttestation previewUrls={[pendingAttestation.url]} onAnswer={resolveAttestation} />
          )}
          {pendingVideoWho?.key === r.key && (
            <div style={{ background: '#faf7f6', border: '1px solid #ece8e6', borderRadius: 12, padding: 12 }}>
              <p style={{ margin: '0 0 10px', fontSize: 12.5, fontWeight: 700, color: '#1a0a12' }}>
                Who&rsquo;s in this video?
              </p>
              <VideoWhoPrompt info={creativePaths} onAnswer={resolveVideoWho} />
            </div>
          )}
          {floor && (
            <QuickReplyChips
              chips={[`Use ₦${floor} instead`]}
              onPick={() => void submitRun(r.key, { message: `${message} ${floor}` })}
            />
          )}
        </div>
      </div>
    );
  };

  // ---- Launch all ----
  // Every ad not yet launched, launched one after another through its own card's launch
  // (the same checks, errors and long-video follow-up as its own button). One at a time,
  // not all at once: the backend checks the wallet before a launch and charges after it,
  // so parallel launches could each pass the check and together overdraw it.
  const pendingRuns = runs.filter((r) => r.slot.result?.stage !== 'launched');
  const notReady = pendingRuns.filter((r) => !launchStates[r.key]?.ready);
  const totalDue = pendingRuns.reduce((sum, r) => sum + (launchStates[r.key]?.dueNgn ?? 0), 0);
  const balance = runs.map((r) => launchStates[r.key]?.balanceNgn).find((b): b is number => typeof b === 'number');
  const short = balance !== undefined && totalDue > balance;
  const naira = (n: number) => `₦${Math.round(n).toLocaleString()}`;
  const runLaunchAll = async () => {
    if (launchAll?.running) return;
    const queue = runsRef.current
      .filter((r) => r.slot.result?.stage !== 'launched' && launchStates[r.key]?.ready)
      .map((r) => r.key);
    const failed: string[] = [];
    for (let i = 0; i < queue.length; i++) {
      setLaunchAll({ running: true, current: queue[i], index: i, total: queue.length, failed: [] });
      const launch = launchers.current[queue[i]];
      const outcome = launch ? await launch() : 'skipped';
      if (outcome === 'failed' || outcome === 'skipped') failed.push(queue[i]);
    }
    setLaunchAll({ running: false, current: null, index: queue.length, total: queue.length, failed });
  };
  const barButton = (label: string, onClick: () => void, primary: boolean, disabled = false) => (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      style={{
        border: primary ? 'none' : `1.5px solid ${PINK}`,
        background: disabled ? '#eee' : primary ? `linear-gradient(135deg,${PINK},#8E1545)` : '#fff',
        color: disabled ? '#999' : primary ? '#fff' : PINK,
        borderRadius: 10,
        padding: primary ? '10px 18px' : '9px 15px',
        fontSize: 13,
        fontWeight: 800,
        cursor: disabled ? 'default' : 'pointer',
        flexShrink: 0,
        whiteSpace: 'nowrap',
      }}
    >
      {label}
    </button>
  );
  const failedRuns = (launchAll && !launchAll.running ? launchAll.failed : [])
    .map((k) => runs.find((r) => r.key === k))
    .filter((r): r is PlanRun => Boolean(r) && r!.slot.result?.stage !== 'launched');
  const launchAllBar =
    showTabs && pendingRuns.length > 0 ? (
      <div
        style={{
          position: 'sticky',
          bottom: 12,
          zIndex: 6,
          marginTop: 18,
          background: '#fff',
          border: '1px solid #ece8e6',
          borderRadius: 12,
          padding: '12px 14px',
          boxShadow: '0 6px 20px rgba(0,0,0,.10)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 12,
          fontSize: 12.5,
          color: '#4a4240',
        }}
      >
        {launchAll?.running ? (
          <>
            <span style={{ fontWeight: 700, color: '#1a0a12' }}>
              Launching {planName(runs.find((r) => r.key === launchAll.current) ?? runs[0])} — {launchAll.index + 1} of{' '}
              {launchAll.total}…
            </span>
            {barButton('Launching…', () => {}, true, true)}
          </>
        ) : failedRuns.length > 0 ? (
          <>
            <span style={{ color: '#991b1b', fontWeight: 700 }}>
              {failedRuns.map((r) => planName(r)).join(', ')} didn&rsquo;t launch — open{' '}
              {failedRuns.length > 1 ? 'them' : 'it'} to see why. Nothing was charged for{' '}
              {failedRuns.length > 1 ? 'those' : 'it'}.
            </span>
            <span style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {failedRuns[0].key !== active?.key &&
                barButton(`Open ${planName(failedRuns[0])}`, () => setActiveKey(failedRuns[0].key), false)}
              {barButton(
                'Try again',
                () => void runLaunchAll(),
                true,
                !failedRuns.some((r) => launchStates[r.key]?.ready)
              )}
            </span>
          </>
        ) : notReady.length > 0 ? (
          <>
            <span>
              <strong style={{ color: '#1a0a12' }}>
                {pendingRuns.length - notReady.length} of {pendingRuns.length} ready to launch.
              </strong>{' '}
              {planName(notReady[0])}{' '}
              {notReady[0].slot.result?.stage === 'planned'
                ? 'needs a look before it can launch'
                : notReady[0].slot.result
                  ? 'still has a question to answer'
                  : 'is still being built'}
              {notReady.length > 1 ? ` (and ${notReady.length - 1} more)` : ''} — then launch them all together.
            </span>
            {notReady[0].key !== active?.key
              ? barButton(`Go to ${planName(notReady[0])}`, () => setActiveKey(notReady[0].key), false)
              : barButton(`Launch all ${pendingRuns.length}`, () => {}, true, true)}
          </>
        ) : short ? (
          <>
            <span>
              <strong style={{ color: '#1a0a12' }}>All {pendingRuns.length} ready.</strong> Together they need{' '}
              <strong>{naira(totalDue)}</strong> in your wallet — you have {naira(balance!)}.
            </span>
            {barButton('Top up wallet', () => window.open('/workspace/?tab=campaigns', '_blank'), false)}
          </>
        ) : (
          <>
            <span>
              <strong style={{ color: '#1a0a12' }}>
                {pendingRuns.length === 1
                  ? `${planName(pendingRuns[0])} is ready.`
                  : launchedCount > 0
                    ? `The other ${pendingRuns.length} are ready.`
                    : `All ${pendingRuns.length} ads are ready.`}
              </strong>
              {totalDue > 0 && (
                <>
                  {' '}
                  <strong>{naira(totalDue)}</strong>
                  {' from your wallet in total.'}
                </>
              )}
            </span>
            {barButton(
              pendingRuns.length === 1
                ? `Launch ${planName(pendingRuns[0])}`
                : launchedCount > 0
                  ? `Launch the other ${pendingRuns.length}`
                  : `Launch all ${pendingRuns.length}`,
              () => void runLaunchAll(),
              true
            )}
          </>
        )}
      </div>
    ) : null;

  return (
    <div>
      <RecapStrip
        objective={objective}
        platform={platform}
        audience={audience}
        budget={budget}
        creative={creative}
        styleText={styleText}
      />
      {splitNotes.length > 0 && (
        <div
          style={{
            background: '#faf7f6',
            border: '1px solid #ece8e6',
            borderRadius: 10,
            padding: '9px 13px',
            marginBottom: 14,
            fontSize: 12.5,
            color: '#4a4240',
            lineHeight: 1.5,
          }}
        >
          {splitNotes.map((n) => (
            <div key={n}>{n}</div>
          ))}
        </div>
      )}
      {showTabs && (
        <div
          style={{
            display: 'flex',
            gap: 6,
            marginBottom: 16,
            borderBottom: '1px solid #ece8e6',
            overflowX: 'auto',
          }}
        >
          {runs.map((r) => {
            const st = r.slot;
            const status: PlatformStatus = launchStates[r.key]?.error
              ? 'attn'
              : st.result
                ? statusForStage(st.result.stage)
                : st.error
                  ? 'attn'
                  : 'decide';
            const who = planWho(r);
            const isActive = r.key === active?.key;
            return (
              <button
                key={r.key}
                type="button"
                onClick={() => setActiveKey(r.key)}
                title={who || undefined}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 7,
                  padding: '10px 14px',
                  border: 'none',
                  background: 'none',
                  fontSize: 12.5,
                  fontWeight: 700,
                  color: isActive ? '#1a0a12' : '#7a7270',
                  borderBottom: isActive ? `2px solid ${PINK}` : '2px solid transparent',
                  cursor: 'pointer',
                  marginBottom: -1,
                  whiteSpace: 'nowrap',
                  flexShrink: 0,
                }}
              >
                <span style={{ width: 7, height: 7, borderRadius: '50%', background: STATUS_DOT[status] }} />
                {planName(r)}
                {who && (
                  <span
                    style={{
                      fontWeight: 600,
                      color: '#9a9090',
                      maxWidth: 170,
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                    }}
                  >
                    {who}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      )}

      {showTabs && launchedCount > 0 && (
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
            {launchedCount} of {runs.length} launched{allLaunched ? ' — all set.' : ', paused until you say go.'}
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

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*,video/*"
        style={{ display: 'none' }}
        onChange={async (e) => {
          const file = e.target.files?.[0];
          e.target.value = '';
          if (!file || !active) return;
          const key = active.key;
          if (videoOnlyRef.current && !file.type.startsWith('video/')) {
            patchSlot(key, {
              error: 'TikTok needs a video here — choose a video file, or change the creative to 2+ photos.',
            });
            return;
          }
          const { url, is_video } = await CampaignService.uploadMedia(file);
          if (uploadForRef.current === 'recompose') {
            if (is_video) {
              patchSlot(key, {
                error: 'Recompositing works with a photo, not a video — please choose an image.',
              });
              return;
            }
            setPendingAttestation({ key, url, forRecompose: true });
            return;
          }
          if (!is_video) {
            setPendingAttestation({ key, url, forRecompose: false });
            return;
          }
          setPendingVideoWho({ key, url });
        }}
      />
      {/* Every ad stays mounted, the inactive ones hidden: switching tabs used to remount the
          card and throw away edits not yet saved, and "Launch all" needs each card's own
          launch (and its plan checks) available whichever tab is open. */}
      {runs.map((r) => (
        <div key={r.key} style={r.key === active?.key ? undefined : { display: 'none' }}>
          {renderRun(r)}
        </div>
      ))}

      {launchAllBar}

      {!showTabs && launchedCount > 0 && (
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
