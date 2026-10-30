'use client';

import { useEffect, useState } from 'react';
import { Box, Button, Typography } from '@mui/material';
import { MdArrowBack, MdArrowForward } from 'react-icons/md';
import { useContentWizardState } from './useContentWizardState';
import StepPlatformFormat from './StepPlatformFormat';
import StepContent from './StepContent';
import StepGenerate from './StepGenerate';
import StepReviewSchedule from './StepReviewSchedule';
import PreviewPanel from './PreviewPanel';

const PINK = '#CD1B78';

const STEPS = [
  { label: 'Platform & Format' },
  { label: 'Your Brief' },
  { label: 'Generate' },
  { label: 'Review & Schedule' },
];

type StepState = 'current' | 'done' | 'todo';

interface ContentWizardProps {
  onGenerated: () => void;
  requireEmailVerification: (callback?: () => void) => boolean;
}

export default function ContentWizard({ onGenerated, requireEmailVerification }: ContentWizardProps) {
  const [step, setStep] = useState(0);
  const wizard = useContentWizardState(requireEmailVerification);

  // Auto-advance to Review once a generation succeeds (generatedDrafts goes
  // from null to a real, possibly-empty array only on a successful response).
  useEffect(() => {
    if (wizard.generatedDrafts !== null && step === 2) setStep(3);
  }, [wizard.generatedDrafts, step]);

  const canGoNext =
    step === 0
      ? wizard.selectedPlatforms.length > 0
      : step === 1
        ? wizard.contentSource === 'prompt'
          ? wizard.isValid
          : wizard.isUploadValid
        : false; // step 2 (Generate) and step 3 (Review) drive their own progression

  return (
    <Box sx={{ maxWidth: 1100, width: '100%' }}>
      {/* Compact header — phones only: a progress bar instead of 4 pills,
          which have nowhere to go on a ~340px-wide screen without wrapping
          into a ragged two-line mess. */}
      <Box sx={{ display: { xs: 'block', sm: 'none' }, mb: 2.5 }}>
        <Typography fontSize="13px" fontWeight={700} color="#111827" mb={1}>
          Step {step + 1} of {STEPS.length} · {STEPS[step].label}
        </Typography>
        <Box sx={{ height: 5, borderRadius: 999, background: '#E5E7EB', overflow: 'hidden' }}>
          <Box
            sx={{
              height: '100%',
              width: `${((step + 1) / STEPS.length) * 100}%`,
              background: PINK,
              transition: 'width .2s',
            }}
          />
        </Box>
      </Box>

      {step < 3 ? (
        <Box display="flex" flexDirection={{ xs: 'column', md: 'row' }} gap={3} alignItems="flex-start">
          <Box sx={{ flex: { xs: '1 1 100%', md: '1 1 480px' }, width: '100%', minWidth: 0 }}>
            {/* Full header — tablet and up: the step pills. Lives at the top
                of this column (not full-width above both columns) so its top
                edge lines up with the Preview column's top edge. */}
            <Box
              sx={{
                display: { xs: 'none', sm: 'flex' },
                alignItems: 'center',
                mb: 2.5,
                flexWrap: 'wrap',
                gap: 1,
              }}
            >
              {STEPS.map((s, i) => {
                const state: StepState = i === step ? 'current' : i < step ? 'done' : 'todo';
                return (
                  <Box key={s.label} display="flex" alignItems="center" gap={1}>
                    {i > 0 && <Box sx={{ width: 16, height: 1, background: i <= step ? PINK : '#E5E7EB' }} />}
                    <StepPill label={s.label} index={i} state={state} onClick={() => i < step && setStep(i)} />
                  </Box>
                );
              })}
            </Box>

            {step === 0 && <StepPlatformFormat wizard={wizard} />}
            {step === 1 && <StepContent wizard={wizard} />}
            {step === 2 && <StepGenerate wizard={wizard} />}
          </Box>

          <Box
            sx={{
              flex: { xs: '1 1 100%', md: '0 0 300px' },
              width: { xs: '100%', md: 300 },
              // The page body's own top padding (set in WorkspaceDashboard's
              // dedicated-page wrapper) leaves a gap above this column that
              // the left column also has — but the approved design has this
              // card's top border touch the header's divider line directly,
              // so only this column cancels that padding out.
              mt: { xs: '-12px', sm: '-20px' },
            }}
          >
            <Box
              sx={{
                border: '1px solid #E5E7EB',
                borderRadius: '16px',
                background: '#FAFAFA',
                boxShadow: '0 1px 3px rgba(20,16,14,.06)',
                pt: 0.75,
                px: 2,
                pb: 2,
                // Always its own natural height — stretching this to match
                // the left column (which the previous height:'100%' + the
                // row's alignItems:'stretch' both did) looks fine only when
                // the two columns happen to be close in height. The upload
                // step and a brief with several reference images are both
                // much taller than the preview, which turned this card into
                // a big dead gray block. Same compact card on every step.
              }}
            >
              <PreviewPanel wizard={wizard} />
            </Box>
          </Box>
        </Box>
      ) : (
        <StepReviewSchedule wizard={wizard} onGenerated={onGenerated} onStartOver={() => setStep(0)} />
      )}

      {step < 2 && (
        <Box display="flex" justifyContent="space-between" mt={3}>
          <Button
            onClick={() => setStep((s) => Math.max(0, s - 1))}
            disabled={step === 0}
            startIcon={<MdArrowBack size={15} />}
            sx={{ textTransform: 'none', fontWeight: 600, color: '#6B7280' }}
          >
            Back
          </Button>
          <Button
            variant="contained"
            onClick={() => setStep((s) => s + 1)}
            disabled={!canGoNext}
            endIcon={<MdArrowForward size={15} />}
            sx={{
              background: `linear-gradient(135deg, ${PINK} 0%, #A01560 100%)`,
              textTransform: 'none',
              fontWeight: 600,
              '&:hover': { background: `linear-gradient(135deg, #A01560 0%, ${PINK} 100%)` },
            }}
          >
            Next
          </Button>
        </Box>
      )}
    </Box>
  );
}

function StepPill({
  label,
  index,
  state,
  onClick,
}: {
  label: string;
  index: number;
  state: StepState;
  onClick: () => void;
}) {
  return (
    <Box
      component="button"
      type="button"
      onClick={onClick}
      disabled={state === 'todo'}
      sx={{
        display: 'flex',
        alignItems: 'center',
        gap: 0.75,
        border: '1px solid',
        borderColor: state === 'current' ? PINK : '#E5E7EB',
        borderRadius: '999px',
        background: state === 'current' ? '#FDF2F8' : '#fff',
        px: 1.5,
        py: 0.6,
        cursor: state === 'done' ? 'pointer' : 'default',
        fontFamily: 'inherit',
      }}
    >
      <Box
        sx={{
          width: 18,
          height: 18,
          borderRadius: '50%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '10.5px',
          fontWeight: 700,
          background: state === 'todo' ? '#F3F4F6' : PINK,
          color: state === 'todo' ? '#9CA3AF' : '#fff',
        }}
      >
        {state === 'done' ? '✓' : index + 1}
      </Box>
      <Box
        component="span"
        sx={{
          fontSize: '12.5px',
          fontWeight: state === 'current' ? 700 : 500,
          color: state === 'current' ? PINK : state === 'done' ? '#374151' : '#9CA3AF',
        }}
      >
        {label}
      </Box>
    </Box>
  );
}
