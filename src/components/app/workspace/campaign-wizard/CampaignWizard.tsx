/**
 * A step-by-step alternative to the chat-driven Campaign Manager (CampaignsPage.tsx),
 * built alongside it — not replacing it — so both are reachable for comparison. Same
 * backend underneath (there's no structured audience/budget endpoint, so steps 2-3
 * collect real fields and the Review step composes them into the one message
 * planFromMessage already takes); this is a new presentation layer, not a new
 * integration. See the plan at ~/.claude/plans/lovely-prancing-seahorse.md.
 */
'use client';
import { useEffect, useState } from 'react';
import type { DraftSummary } from '@/src/api/CampaignService';
import { useIsMobile } from '@/src/hooks/useIsMobile';
import WizardObjectiveStep, { WizardObjectiveValue } from './WizardObjectiveStep';
import WizardPlatformStep, { WizardPlatformValue } from './WizardPlatformStep';
import WizardAudienceStep, { WizardAudienceValue } from './WizardAudienceStep';
import WizardBudgetStep, { WizardBudgetValue } from './WizardBudgetStep';
import WizardCreativeStep, { WizardCreativeChoice } from './WizardCreativeStep';
import WizardReviewStep from './WizardReviewStep';

const PINK = '#C2185B';

type StepKey = 'objective' | 'platform' | 'audience' | 'budget' | 'creative' | 'review';
const STEPS: { key: StepKey; label: string }[] = [
  { key: 'objective', label: 'Objective' },
  { key: 'platform', label: 'Platform' },
  { key: 'audience', label: 'Audience' },
  { key: 'budget', label: 'Budget' },
  { key: 'creative', label: 'Creative' },
  { key: 'review', label: 'Review' },
];

const DEFAULT_PLATFORM: WizardPlatformValue = { mode: 'single', single: '', multi: [] };

export default function CampaignWizard({
  onBack,
  pendingDraft,
  onDraftConsumed,
}: {
  onBack: () => void;
  /** "Use in Campaign Builder" from the Creatives library lands here — same
   *  one-shot hand-off pattern as WorkspaceDashboard's pendingResumeVideo. */
  pendingDraft?: DraftSummary | null;
  onDraftConsumed?: () => void;
}) {
  const isMobile = useIsMobile();
  const [stepIndex, setStepIndex] = useState(0);
  const step = STEPS[stepIndex].key;

  const [objective, setObjective] = useState<WizardObjectiveValue | null>(null);
  const [platform, setPlatform] = useState<WizardPlatformValue>(DEFAULT_PLATFORM);
  const [audience, setAudience] = useState<WizardAudienceValue>({ description: '', city: '' });
  const [budget, setBudget] = useState<WizardBudgetValue>({ amountNgn: '', days: 7 });
  const [creative, setCreative] = useState<WizardCreativeChoice | null>(null);
  const [prefilledFromLibrary, setPrefilledFromLibrary] = useState(false);
  // Bumped on every "Create another campaign" so WizardReviewStep (keyed on it)
  // fully remounts — a fresh plan/launch cycle, not the previous one's state
  // carried over by a component React would otherwise just re-render in place.
  const [reviewKey, setReviewKey] = useState(0);

  useEffect(() => {
    if (!pendingDraft) return;
    setCreative({ creative_source: 'draft', draft_id: pendingDraft.draft_id, previewUrl: pendingDraft.image_url });
    setPrefilledFromLibrary(true);
    onDraftConsumed?.();
    // Runs once per hand-off — onDraftConsumed clears pendingDraft right after, so
    // this can't re-fire from its own effect.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pendingDraft]);

  const canAdvance = (): boolean => {
    if (step === 'objective') return Boolean(objective);
    if (step === 'platform') return platform.mode === 'single' || platform.multi.length >= 2;
    if (step === 'audience') return Boolean(audience.description.trim() && audience.city.trim());
    if (step === 'budget') return typeof budget.amountNgn === 'number' && budget.amountNgn > 0;
    if (step === 'creative') return Boolean(creative);
    return true;
  };

  const goNext = () => setStepIndex((i) => Math.min(i + 1, STEPS.length - 1));
  const goBack = () => (stepIndex === 0 ? onBack() : setStepIndex((i) => i - 1));

  // Same brief-clearing job the chat flow's own onLaunched does (CampaignsPage.tsx:
  // "Campaign is live — this brief is done. Clear it so the next message starts a
  // fresh campaign") — here that means resetting every step's state and going back
  // to step 1, without leaving this page the way the old onLaunched={onBack} did.
  const createAnother = () => {
    setObjective(null);
    setPlatform(DEFAULT_PLATFORM);
    setAudience({ description: '', city: '' });
    setBudget({ amountNgn: '', days: 7 });
    setCreative(null);
    setPrefilledFromLibrary(false);
    setReviewKey((k) => k + 1);
    setStepIndex(0);
  };

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
          <h2 style={{ margin: 0, fontSize: 18, fontWeight: 800, color: '#1a0a12' }}>Create Campaign</h2>
          <p style={{ margin: '2px 0 0', fontSize: 12.5, color: '#7a7270' }}>
            Launch ads across multiple platforms and reach the right audience.
          </p>
          {prefilledFromLibrary && (
            <p style={{ margin: '8px 0 0', fontSize: 12, color: PINK, fontWeight: 600 }}>
              ✓ Using the creative you picked from your library — it's already set on the Creative step.
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
          {STEPS.map((s, i) => {
            const isDone = i < stepIndex;
            const isActive = i === stepIndex;
            return (
              <div key={s.key} style={{ display: 'flex', alignItems: 'center', flex: isMobile ? '0 0 auto' : 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
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
                    {s.label}
                  </span>
                </div>
                {i < STEPS.length - 1 && !isMobile && (
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
          {step === 'objective' && <WizardObjectiveStep selected={objective?.value ?? ''} onPick={setObjective} />}
          {step === 'platform' && <WizardPlatformStep value={platform} onChange={setPlatform} />}
          {step === 'audience' && <WizardAudienceStep value={audience} onChange={setAudience} />}
          {step === 'budget' && (
            <WizardBudgetStep
              value={budget}
              onChange={setBudget}
              platformCount={platform.mode === 'multi' ? Math.max(platform.multi.length, 1) : 1}
            />
          )}
          {step === 'creative' && <WizardCreativeStep value={creative} onChange={setCreative} />}
          {step === 'review' && objective && creative && (
            <WizardReviewStep
              key={reviewKey}
              objective={objective}
              audience={audience}
              budget={{ ...budget, amountNgn: typeof budget.amountNgn === 'number' ? budget.amountNgn : 0 }}
              creative={creative}
              platform={platform}
              onCreateAnother={createAnother}
            />
          )}
        </div>

        {/* Footer nav — the Review step owns its own Launch button inside ResultCard,
          so this footer stops being shown once a plan is in progress there. */}
        {step !== 'review' && (
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
          </div>
        )}
      </div>
    </div>
  );
}
