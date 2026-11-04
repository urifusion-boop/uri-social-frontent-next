/**
 * A step-by-step alternative to the chat-driven Campaign Manager (CampaignsPage.tsx),
 * built alongside it — not replacing it — so both are reachable for comparison. Same
 * backend underneath (there's no structured audience/budget endpoint, so steps 2-3
 * collect real fields and the Review step composes them into the one message
 * planFromMessage already takes); this is a new presentation layer, not a new
 * integration. See the plan at ~/.claude/plans/lovely-prancing-seahorse.md.
 */
'use client';
import { useState } from 'react';
import { useIsMobile } from '@/src/hooks/useIsMobile';
import WizardObjectiveStep, { WizardObjectiveValue } from './WizardObjectiveStep';
import WizardAudienceStep, { WizardAudienceValue } from './WizardAudienceStep';
import WizardBudgetStep, { WizardBudgetValue } from './WizardBudgetStep';
import WizardCreativeStep, { WizardCreativeChoice } from './WizardCreativeStep';
import WizardReviewStep from './WizardReviewStep';

const PINK = '#C2185B';

type StepKey = 'objective' | 'audience' | 'budget' | 'creative' | 'review';
const STEPS: { key: StepKey; label: string }[] = [
  { key: 'objective', label: 'Objective' },
  { key: 'audience', label: 'Audience' },
  { key: 'budget', label: 'Budget' },
  { key: 'creative', label: 'Creative' },
  { key: 'review', label: 'Review' },
];

export default function CampaignWizard({ onBack }: { onBack: () => void }) {
  const isMobile = useIsMobile();
  const [stepIndex, setStepIndex] = useState(0);
  const step = STEPS[stepIndex].key;

  const [objective, setObjective] = useState<WizardObjectiveValue | null>(null);
  const [audience, setAudience] = useState<WizardAudienceValue>({ description: '', city: '' });
  const [budget, setBudget] = useState<WizardBudgetValue>({ amountNgn: '', days: 7 });
  const [creative, setCreative] = useState<WizardCreativeChoice | null>(null);

  const canAdvance = (): boolean => {
    if (step === 'objective') return Boolean(objective);
    if (step === 'audience') return Boolean(audience.description.trim() && audience.city.trim());
    if (step === 'budget') return typeof budget.amountNgn === 'number' && budget.amountNgn > 0;
    if (step === 'creative') return Boolean(creative);
    return true;
  };

  const goNext = () => setStepIndex((i) => Math.min(i + 1, STEPS.length - 1));
  const goBack = () => (stepIndex === 0 ? onBack() : setStepIndex((i) => i - 1));

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
          {step === 'audience' && <WizardAudienceStep value={audience} onChange={setAudience} />}
          {step === 'budget' && <WizardBudgetStep value={budget} onChange={setBudget} />}
          {step === 'creative' && <WizardCreativeStep value={creative} onChange={setCreative} />}
          {step === 'review' && objective && creative && (
            <WizardReviewStep
              objective={objective}
              audience={audience}
              budget={{ ...budget, amountNgn: typeof budget.amountNgn === 'number' ? budget.amountNgn : 0 }}
              creative={creative}
              onLaunched={onBack}
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
