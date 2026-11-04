/**
 * Step 5 — the only step that actually talks to the backend. Composes everything
 * collected in steps 1-4 into the one message planFromMessage takes, then reuses the
 * chat flow's own ResultCard (CampaignsPage.tsx) for everything that can happen next:
 * a follow-up question (choose_plan_variant / choose_destination / need_whatsapp /
 * need_more / advise), a connection guard, or the final editable plan + Launch button.
 * Re-exercising the exact same component the chat flow already relies on, rather than
 * re-implementing its branching, is what keeps this step this short.
 */
'use client';
import { useEffect, useRef, useState } from 'react';
import { AdFormat, CampaignService, LaunchFromMessageResult, PlanVariant } from '@/src/api/CampaignService';
import { ResultCard } from '../CampaignsPage';
import type { WizardObjectiveValue } from './WizardObjectiveStep';
import type { WizardAudienceValue } from './WizardAudienceStep';
import type { WizardBudgetValue } from './WizardBudgetStep';
import type { WizardCreativeChoice } from './WizardCreativeStep';

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
    return {
      creative_source: 'upload',
      reference_image_url: creative.reference_image_url,
      is_video: creative.is_video,
    };
  }
  if (creative.creative_source === 'draft') {
    return { creative_source: 'draft', draft_id: creative.draft_id };
  }
  return { creative_source: 'generate' };
}

export default function WizardReviewStep({
  objective,
  audience,
  budget,
  creative,
  onLaunched,
}: {
  objective: WizardObjectiveValue;
  audience: WizardAudienceValue;
  budget: WizardBudgetValue;
  creative: WizardCreativeChoice;
  onLaunched: () => void;
}) {
  const [result, setResult] = useState<LaunchFromMessageResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [adFormats, setAdFormats] = useState<AdFormat[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  // Same "has to ride along on every later call or the backend re-asks" pattern as the
  // chat flow's own chosenVariantRef/ownAudienceRef (CampaignsPage.tsx:365-369) — the
  // backend has no server-side memory of a prior turn's choice.
  const chosenVariantRef = useRef<{ variant: PlanVariant; variantGroupId: string } | null>(null);
  const ownAudienceRef = useRef<string | null>(null);

  const message = `${audience.description.trim()} in ${audience.city.trim()}. Budget: ₦${budget.amountNgn} over ${budget.days} days.`;

  const submitPlan = async (extra: Partial<PlanFromMessagePayload> = {}) => {
    setLoading(true);
    setError('');
    try {
      const res = await CampaignService.planFromMessage({
        objective: objective.value,
        message,
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
      setResult(res);
    } catch (e) {
      setError(extractErrorMessage(e, "We're experiencing some difficulties — please try again in a little while."));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    CampaignService.getAdFormats()
      .then((r) => setAdFormats(r.formats))
      .catch(() => setAdFormats([]));
    void submitPlan();
    // Runs once, on entry to this step — every later call is a user-driven follow-up.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (loading && !result) {
    return <p style={{ fontSize: 13.5, color: '#7a7270' }}>Building your campaign plan…</p>;
  }

  if (error && !result) {
    return (
      <div>
        <p style={{ fontSize: 13.5, color: '#b91c1c', marginBottom: 10 }}>{error}</p>
        <button
          type="button"
          onClick={() => void submitPlan()}
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

  if (!result) return null;

  return (
    <div>
      <h3 style={{ margin: '0 0 4px', fontSize: 16, fontWeight: 800, color: '#1a0a12' }}>Review</h3>
      <p style={{ margin: '0 0 18px', fontSize: 13, color: '#7a7270' }}>
        Here's what Jane's put together — adjust anything before you launch.
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
          void submitPlan({ creative_source: 'upload', reference_image_url: url, is_video });
        }}
      />
      <ResultCard
        result={result}
        adFormats={adFormats}
        onResultChange={setResult}
        onLaunched={onLaunched}
        onQuickReply={(text) => void submitPlan({ message: `${message} ${text}` })}
        // Topping up the wallet is a separate Wallet tab the wizard doesn't own —
        // same gap the chat flow would have if it weren't embedded in that page's
        // own tab switcher. A direct link is the honest equivalent here.
        onTopUp={() => window.open('/workspace/?tab=campaigns', '_blank')}
        onSubmitWhatsapp={(number) => void submitPlan({ whatsapp_number: number })}
        onSubmitMetaConnectionWhatsapp={async (number) => {
          await CampaignService.setWhatsapp(number);
          void submitPlan({ whatsapp_number: number });
        }}
        // Fallback-only: creative_source is always sent on the first call above, so
        // choose_creative_source shouldn't normally come back at all.
        onChooseGenerate={() => void submitPlan({ creative_source: 'generate' })}
        onChooseUpload={() => fileInputRef.current?.click()}
        onChooseRecomposite={() => fileInputRef.current?.click()}
        onChooseDraft={(draftId) => void submitPlan({ creative_source: 'draft', draft_id: draftId })}
        onChooseVariants={(variants, groupId) => {
          ownAudienceRef.current = null;
          chosenVariantRef.current = { variant: variants[0], variantGroupId: groupId };
          void submitPlan({ selected_plan_variant: variants[0], variant_group_id: groupId });
        }}
        onChooseOwnAudience={(text) => {
          const audienceText = text.trim();
          chosenVariantRef.current = null;
          ownAudienceRef.current = audienceText;
          void submitPlan({ target_audience: audienceText });
        }}
        onChooseDestination={(answer) => void submitPlan(answer as Partial<PlanFromMessagePayload>)}
      />
    </div>
  );
}
