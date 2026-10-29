'use client';

import { useEffect, useState } from 'react';
import { Box, Button } from '@mui/material';
import { MdArrowBack, MdArrowForward } from 'react-icons/md';
import { useContentWizardState } from './useContentWizardState';
import StepPlatformFormat from './StepPlatformFormat';
import StepBrief from './StepBrief';
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
  onExit: () => void;
}

export default function ContentWizard({ onGenerated, requireEmailVerification, onExit }: ContentWizardProps) {
  const [step, setStep] = useState(0);
  const wizard = useContentWizardState(requireEmailVerification);

  // Auto-advance to Review once a generation succeeds (generatedDrafts goes
  // from null to a real, possibly-empty array only on a successful response).
  useEffect(() => {
    if (wizard.generatedDrafts !== null && step === 2) setStep(3);
  }, [wizard.generatedDrafts, step]);

  const canGoNext = step === 0 ? wizard.selectedPlatforms.length > 0 : step === 1 ? wizard.isValid : false; // step 2 (Generate) and step 3 (Review) drive their own progression

  return (
    <Box sx={{ maxWidth: 1100, width: '100%' }}>
      <Box display="flex" alignItems="center" justifyContent="space-between" mb={2.5} flexWrap="wrap" gap={1}>
        <Box display="flex" alignItems="center" gap={1} flexWrap="wrap">
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
        <Button
          size="small"
          onClick={onExit}
          sx={{ textTransform: 'none', fontSize: '12.5px', color: '#9CA3AF', fontWeight: 600 }}
        >
          Switch to classic form
        </Button>
      </Box>

      <Box display="flex" gap={3} alignItems="flex-start" flexWrap="wrap">
        <Box sx={{ flex: '1 1 480px', minWidth: 0 }}>
          {step === 0 && <StepPlatformFormat wizard={wizard} />}
          {step === 1 && <StepBrief wizard={wizard} />}
          {step === 2 && <StepGenerate wizard={wizard} />}
          {step === 3 && (
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

        {step < 3 && (
          <Box sx={{ flex: '0 0 300px', position: { md: 'sticky' }, top: 16 }}>
            <PreviewPanel wizard={wizard} />
          </Box>
        )}
      </Box>
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
