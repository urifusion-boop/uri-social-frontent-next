/**
 * A step-by-step alternative to the chat-driven Campaign Manager (CampaignsPage.tsx),
 * built alongside it — not replacing it — so both are reachable for comparison. Same
 * backend underneath (there's no structured audience/budget endpoint, so steps 2-3
 * collect real fields and the Review step composes them into the one message
 * planFromMessage already takes); this is a new presentation layer, not a new
 * integration. See the plan at ~/.claude/plans/lovely-prancing-seahorse.md.
 */
'use client';
import { useEffect, useRef, useState } from 'react';
import type { CampaignRow, DraftSummary } from '@/src/api/CampaignService';
import { useIsMobile } from '@/src/hooks/useIsMobile';
import { uid } from '../CampaignsPage';
import { GooglePlacement } from '../GooglePlacementPreview';
import WizardObjectiveStep, { WizardObjectiveValue } from './WizardObjectiveStep';
import WizardPlatformStep, { WizardPlatformValue } from './WizardPlatformStep';
import WizardGooglePlacementStep from './WizardGooglePlacementStep';
import WizardAudienceStep, { WizardAudienceValue } from './WizardAudienceStep';
import WizardBudgetStep, { WizardBudgetValue } from './WizardBudgetStep';
import WizardCreativeStep, { WizardCreativeChoice } from './WizardCreativeStep';
import WizardReviewStep from './WizardReviewStep';
import { deleteWizardDraft, saveWizardDraft, WizardDraft, WizardReviewSnapshot } from './wizardDraft';

const PINK = '#C2185B';

type StepKey = 'objective' | 'platform' | 'googlePlacement' | 'audience' | 'budget' | 'creative' | 'review';

const usesGoogle = (platform: WizardPlatformValue) =>
  platform.mode === 'single' ? platform.single === 'google' : platform.multi.includes('google');

/** The step list depends on what was picked in Platform — "Google placement" only
 *  exists at all once Google is actually in play, same as the chat flow only ever
 *  shows its own placement picker once Google is the preferred platform. Steps are
 *  tracked by key rather than index everywhere below, precisely so this list can
 *  grow/shrink as platform changes without corrupting where "current" points. */
function buildSteps(platform: WizardPlatformValue): { key: StepKey; label: string }[] {
  const steps: { key: StepKey; label: string }[] = [
    { key: 'objective', label: 'Objective' },
    { key: 'platform', label: 'Platform' },
  ];
  if (usesGoogle(platform)) steps.push({ key: 'googlePlacement', label: 'Google placement' });
  steps.push(
    { key: 'audience', label: 'Audience' },
    { key: 'budget', label: 'Budget' },
    { key: 'creative', label: 'Creative' },
    // Label flips from "Finalize" to "Review" once there's nothing left to decide —
    // see reviewReady below. Review is meant to be the stage where you look things
    // over and launch, not where follow-up questions (destination, audience variant,
    // a connection problem) keep getting asked; while any of that is still open this
    // step reads as "Finalize" instead, so it stops looking like Review is stuck.
    { key: 'review', label: 'Finalize' }
  );
  return steps;
}

const DEFAULT_PLATFORM: WizardPlatformValue = { mode: 'single', single: '', multi: [], touched: false };

export default function CampaignWizard({
  onBack,
  pendingDraft,
  onDraftConsumed,
  pendingDuplicate,
  onDuplicateConsumed,
  pendingResume,
  onResumeConsumed,
}: {
  onBack: () => void;
  /** "Use in Campaign Builder" from the Creatives library lands here — same
   *  one-shot hand-off pattern as WorkspaceDashboard's pendingResumeVideo. */
  pendingDraft?: DraftSummary | null;
  onDraftConsumed?: () => void;
  /** "Duplicate" on a launched campaign (CampaignBuilderPage) — seeds Objective,
   *  Platform, Audience and Budget from it so the run starts "tweak and relaunch"
   *  instead of blank, same spirit as the chat flow's own duplicateThread. Creative
   *  is deliberately left for the person to choose fresh, same as duplicateThread
   *  resetting it there too — reusing the old ad's exact asset without re-asking
   *  attestation isn't a sound default. */
  pendingDuplicate?: CampaignRow | null;
  onDuplicateConsumed?: () => void;
  /** "Resume" on the list page's draft banner — a full rehydrate of a previously
   *  autosaved run (wizardDraft.ts), unlike pendingDuplicate's partial seed from a
   *  CampaignRow. Lands on step 1 with everything already filled in, same pattern. */
  pendingResume?: WizardDraft | null;
  onResumeConsumed?: () => void;
}) {
  const isMobile = useIsMobile();
  // One id per wizard instance, for the whole run's life — resuming a saved
  // draft reuses ITS id (so autosave keeps updating that same slot instead of
  // creating a second one); starting fresh mints a new one.
  const draftId = useRef(pendingResume?.id ?? uid()).current;
  const [stepKey, setStepKey] = useState<StepKey>('objective');

  const [objective, setObjective] = useState<WizardObjectiveValue | null>(null);
  const [platform, setPlatform] = useState<WizardPlatformValue>(DEFAULT_PLATFORM);
  const [googlePlacement, setGooglePlacement] = useState<GooglePlacement>('search');
  const [audience, setAudience] = useState<WizardAudienceValue>({ description: '', city: '' });
  const [budget, setBudget] = useState<WizardBudgetValue>({ amountNgn: '', days: 7 });
  const [creative, setCreative] = useState<WizardCreativeChoice | null>(null);
  const [prefilledFromLibrary, setPrefilledFromLibrary] = useState(false);
  // Flips once every selected platform has a finished, launch-ready plan with no
  // open question left — see the STEPS comment above.
  const [reviewReady, setReviewReady] = useState(false);
  // Every step key visited this run stays a free, two-way jump (click the pip, Back
  // button) — a Set of keys rather than "every index up to N", because the step
  // list itself can grow/shrink (Google placement) as platform changes.
  const [reachedKeys, setReachedKeys] = useState<Set<StepKey>>(new Set(['objective']));
  useEffect(() => {
    setReachedKeys((prev) => (prev.has(stepKey) ? prev : new Set(prev).add(stepKey)));
  }, [stepKey]);

  const steps = buildSteps(platform);
  // Live-reported bug: changing platform on the way back through (say Meta ->
  // Google) inserts a new, never-visited "Google placement" step ahead of
  // Audience/Budget/Creative/Review — steps that WERE already visited under the
  // old platform and so stayed freely jumpable. Jumping straight to any of them
  // skipped Google placement entirely, silently launching on whatever it
  // defaulted to (Search) with no chance to pick. The fix: a step is only a free
  // jump if every step before it in the CURRENT list has also been visited, not
  // just the step itself — so a newly-inserted gap blocks everything past it
  // until it's actually been seen, exactly like it was never free to skip on a
  // first run through either.
  const firstUnvisitedIndex = (() => {
    const i = steps.findIndex((s) => !reachedKeys.has(s.key));
    return i === -1 ? steps.length : i;
  })();
  const stepIndex = Math.max(
    steps.findIndex((s) => s.key === stepKey),
    0
  );
  const step = steps[stepIndex].key;

  useEffect(() => {
    if (!pendingDraft) return;
    setCreative({ creative_source: 'draft', draft_id: pendingDraft.draft_id, previewUrl: pendingDraft.image_url });
    setPrefilledFromLibrary(true);
    onDraftConsumed?.();
    // Runs once per hand-off — onDraftConsumed clears pendingDraft right after, so
    // this can't re-fire from its own effect.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pendingDraft]);

  const [prefilledFromDuplicate, setPrefilledFromDuplicate] = useState(false);
  useEffect(() => {
    if (!pendingDuplicate) return;
    const c = pendingDuplicate;
    // Only `.value` of this ever reaches the backend (WizardReviewStep sends
    // objective.value alone) — label/blurb/caveat are cosmetic and get filled back
    // in correctly once WizardObjectiveStep fetches the real list and finds this
    // value already selected, so a placeholder here is harmless.
    setObjective({ value: c.goal, label: c.goal, blurb: '', caveat: '' });
    setPlatform({ mode: 'single', single: c.platform, multi: [], touched: true });
    setAudience({ description: c.primary_text || c.headline || '', city: c.city || '' });
    setBudget({ amountNgn: c.budget_ngn ?? '', days: 7 });
    setPrefilledFromDuplicate(true);
    onDuplicateConsumed?.();
    // Runs once per hand-off, same reasoning as the pendingDraft effect above.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pendingDuplicate]);

  const [resumed, setResumed] = useState(false);
  // Whatever plan/creative Jane had already built, if this draft got that far —
  // seeds WizardReviewStep so resuming shows the ad that's actually there
  // instead of generating a fresh (possibly different) one from the same inputs.
  const [results, setResults] = useState<WizardReviewSnapshot | undefined>(undefined);
  // Tracks which {objective, platform, ...} combination `results` actually
  // belongs to — if those fields change later (went back and edited Audience
  // after already reaching Finalize once), the saved plan no longer matches
  // what's being asked for and must not be autosaved as if it still does.
  const lastResultsKeyRef = useRef<string | null>(null);
  const skipNextInvalidationRef = useRef(false);
  useEffect(() => {
    if (!pendingResume) return;
    setObjective(pendingResume.objective);
    setPlatform(pendingResume.platform);
    setGooglePlacement(pendingResume.googlePlacement);
    setAudience(pendingResume.audience);
    setBudget(pendingResume.budget);
    setCreative(pendingResume.creative);
    setResults(pendingResume.results);
    // The invalidation effect below must not see this as "the fields changed
    // out from under the saved plan" — it's the plan's own fields arriving.
    lastResultsKeyRef.current = JSON.stringify({
      objective: pendingResume.objective,
      platform: pendingResume.platform,
      googlePlacement: pendingResume.googlePlacement,
      audience: pendingResume.audience,
      budget: pendingResume.budget,
      creative: pendingResume.creative,
    });
    skipNextInvalidationRef.current = true;
    // Landed on Finalize/Review before and built something there — go straight
    // back to it (marking every earlier step reached) rather than making
    // "resume" mean "click Next six times again through what's already filled in".
    const hadReachedReview =
      pendingResume.results?.single || Object.keys(pendingResume.results?.multi ?? {}).length > 0;
    if (hadReachedReview) {
      setReachedKeys(new Set(buildSteps(pendingResume.platform).map((s) => s.key)));
      setStepKey('review');
    }
    setResumed(true);
    onResumeConsumed?.();
    // Runs once per hand-off, same reasoning as the pendingDraft effect above.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pendingResume]);

  const resultsKey = JSON.stringify({ objective, platform, googlePlacement, audience, budget, creative });
  useEffect(() => {
    if (skipNextInvalidationRef.current) {
      // The resume effect just set both `results` and this same key together —
      // this run is that arrival landing, not a later edit, so leave both alone.
      skipNextInvalidationRef.current = false;
      return;
    }
    if (lastResultsKeyRef.current !== null && lastResultsKeyRef.current !== resultsKey) {
      setResults(undefined);
    }
    lastResultsKeyRef.current = resultsKey;
  }, [resultsKey]);

  // Autosave — only once there's something worth coming back to (an objective
  // picked is the same "real progress" bar the list page's resume banner implies).
  // Debounced inside saveWizardDraft itself, so this effect firing on every
  // keystroke (the audience textarea) costs nothing extra here.
  useEffect(() => {
    if (!objective) return;
    saveWizardDraft(draftId, { objective, platform, googlePlacement, audience, budget, creative, results });
  }, [draftId, objective, platform, googlePlacement, audience, budget, creative, results]);

  const canAdvance = (): boolean => {
    if (step === 'objective') return Boolean(objective);
    if (step === 'platform') return platform.mode === 'single' ? platform.touched : platform.multi.length >= 2;
    if (step === 'audience') return Boolean(audience.description.trim() && audience.city.trim());
    if (step === 'budget') return typeof budget.amountNgn === 'number' && budget.amountNgn > 0;
    if (step === 'creative') return Boolean(creative);
    return true;
  };

  const goNext = () => setStepKey(steps[Math.min(stepIndex + 1, steps.length - 1)].key);
  const goBack = () => (stepIndex === 0 ? onBack() : setStepKey(steps[stepIndex - 1].key));

  return (
    // Same dedicated-page gradient as Content Studio's Library/Calendar/Auto/Video
    // pages (WorkspaceDashboard.tsx's own dedicatedPageActive background) — this page
    // isn't rendered inside that same wrapper (it's its own top-level nav entry), so
    // it needs to carry that background itself to read as part of the same family.
    <div
      style={{
        minHeight: '100%',
        background: 'linear-gradient(180deg, #FCE4EC 0%, #FBF8F7 40%, #FAFAF8 100%)',
      }}
    >
      <div
        style={{
          maxWidth: 900,
          margin: '0 auto',
          padding: isMobile ? '14px 12px 28px' : '18px 20px 28px',
        }}
      >
        <div style={{ marginBottom: 14 }}>
          <button
            type="button"
            onClick={onBack}
            style={{
              border: 'none',
              background: 'none',
              padding: 0,
              marginBottom: 6,
              fontSize: 12,
              fontWeight: 700,
              color: '#7a7270',
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 4,
            }}
          >
            ← All campaigns
          </button>
          <h2 style={{ margin: 0, fontSize: 18, fontWeight: 800, color: '#1a0a12' }}>Create Campaign</h2>
          <p style={{ margin: '2px 0 0', fontSize: 12.5, color: '#7a7270' }}>
            Launch ads across multiple platforms and reach the right audience.
          </p>
          {prefilledFromLibrary && (
            <p style={{ margin: '8px 0 0', fontSize: 12, color: PINK, fontWeight: 600 }}>
              ✓ Using the creative you picked from your library — it's already set on the Creative step.
            </p>
          )}
          {prefilledFromDuplicate && (
            <p style={{ margin: '8px 0 0', fontSize: 12, color: PINK, fontWeight: 600 }}>
              ✓ Started from that campaign — review each step and pick a creative, then relaunch.
            </p>
          )}
          {resumed && (
            <p style={{ margin: '8px 0 0', fontSize: 12, color: PINK, fontWeight: 600 }}>
              ✓ Picked up where you left off.
            </p>
          )}
        </div>

        {/* Stepper */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: isMobile ? 4 : 10,
            marginBottom: 16,
            overflowX: isMobile ? 'auto' : undefined,
          }}
        >
          {steps.map((s, i) => {
            const isActive = s.key === stepKey;
            // Any step already reached this run is a free jump both ways — the
            // point being able to come straight back to Finalize/Review after
            // changing something earlier, without re-clicking Next through every
            // step in between. "Done" follows the same rule (not just "comes
            // before the current step"), so jumping backward from Finalize to
            // Platform doesn't make Audience/Budget/Creative look unfilled when
            // they aren't.
            const reachable = reachedKeys.has(s.key) && !isActive && i <= firstUnvisitedIndex;
            const isDone = reachable;
            const label = s.key === 'review' ? (reviewReady ? 'Review' : 'Finalize') : s.label;
            return (
              <div key={s.key} style={{ display: 'flex', alignItems: 'center', flex: isMobile ? '0 0 auto' : 1 }}>
                <button
                  type="button"
                  onClick={() => reachable && setStepKey(s.key)}
                  disabled={!reachable}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 7,
                    border: 'none',
                    background: 'none',
                    padding: 0,
                    cursor: reachable ? 'pointer' : 'default',
                  }}
                >
                  <span
                    style={{
                      width: 24,
                      height: 24,
                      borderRadius: '50%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: 12,
                      fontWeight: 800,
                      flexShrink: 0,
                      background: isActive || isDone ? PINK : '#ece8e6',
                      color: isActive || isDone ? '#fff' : '#9a9090',
                    }}
                  >
                    {isDone ? '✓' : i + 1}
                  </span>
                  <span
                    style={{
                      fontSize: 12.5,
                      fontWeight: isActive ? 800 : 600,
                      color: isActive ? PINK : isDone ? '#1a0a12' : '#9a9090',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {label}
                  </span>
                </button>
                {i < steps.length - 1 && !isMobile && (
                  <span style={{ flex: 1, height: 1, background: isDone ? PINK : '#ece8e6', margin: '0 10px' }} />
                )}
              </div>
            );
          })}
        </div>

        {/* Step body */}
        <div
          style={{
            background: '#fff',
            border: '1px solid #ece8e6',
            borderRadius: 16,
            padding: isMobile ? 14 : 18,
          }}
        >
          {step === 'objective' && (
            <WizardObjectiveStep
              selected={objective?.value ?? ''}
              onPick={setObjective}
              platform={platform.mode === 'single' && platform.single === 'tiktok' ? 'tiktok' : 'meta'}
            />
          )}
          {step === 'platform' && <WizardPlatformStep value={platform} onChange={setPlatform} />}
          {step === 'googlePlacement' && (
            <WizardGooglePlacementStep
              value={googlePlacement}
              onChange={setGooglePlacement}
              previewImageUrl={creative && creative.creative_source !== 'generate' ? creative.previewUrl : undefined}
            />
          )}
          {step === 'audience' && <WizardAudienceStep value={audience} onChange={setAudience} />}
          {step === 'budget' && (
            <WizardBudgetStep
              value={budget}
              onChange={setBudget}
              platformCount={platform.mode === 'multi' ? Math.max(platform.multi.length, 1) : 1}
            />
          )}
          {step === 'creative' && (
            <WizardCreativeStep
              value={creative}
              onChange={setCreative}
              isTikTok={platform.mode === 'single' && platform.single === 'tiktok'}
            />
          )}
          {step === 'review' && objective && creative && (
            <WizardReviewStep
              // Remounts (and re-asks Jane from scratch) whenever anything the plan is
              // actually built from changes — e.g. coming back from Platform having
              // switched Meta to Google. Visiting this step again with nothing changed
              // keeps the same key, so it does NOT needlessly redo Jane's work or lose
              // an in-progress plan just because you looked at an earlier step.
              key={JSON.stringify({ objective, platform, googlePlacement, audience, budget, creative })}
              objective={objective}
              audience={audience}
              budget={{ ...budget, amountNgn: typeof budget.amountNgn === 'number' ? budget.amountNgn : 0 }}
              creative={creative}
              platform={platform}
              googlePlacement={googlePlacement}
              // CampaignBuilderPage unmounts this whole wizard and mounts a fresh
              // one on "+ New Campaign" — so returning to the list (onBack) is all
              // "create another" needs; no manual state reset required here.
              onCreateAnother={onBack}
              onStatusChange={setReviewReady}
              initialResults={results}
              onResultsChange={setResults}
              onAnyLaunched={() => deleteWizardDraft(draftId)}
            />
          )}
        </div>

        {/* Footer nav — Back always works, including from Finalize/Review (the one
          place it was missing before: there was no way off that step except closing
          the wizard entirely). Next disappears on review since there's no step after
          it — the Launch button inside ResultCard is this step's own "next". */}
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 14 }}>
          <button
            type="button"
            onClick={goBack}
            style={{
              border: '1px solid #ece8e6',
              background: '#fff',
              color: '#1a0a12',
              borderRadius: 10,
              padding: '10px 20px',
              fontSize: 13.5,
              fontWeight: 700,
              cursor: 'pointer',
            }}
          >
            {stepIndex === 0 ? 'Cancel' : 'Back'}
          </button>
          {step !== 'review' && (
            <button
              type="button"
              disabled={!canAdvance()}
              onClick={goNext}
              style={{
                border: 'none',
                background: canAdvance() ? PINK : '#f0c6d6',
                color: '#fff',
                borderRadius: 10,
                padding: '10px 22px',
                fontSize: 13.5,
                fontWeight: 700,
                cursor: canAdvance() ? 'pointer' : 'not-allowed',
              }}
            >
              Next →
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
