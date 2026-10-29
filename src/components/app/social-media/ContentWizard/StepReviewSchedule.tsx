'use client';

import { Box, Button, Typography } from '@mui/material';
import DraftCard from '../DraftCard';
import { ContentWizardState } from './useContentWizardState';

const PINK = '#CD1B78';

interface StepReviewScheduleProps {
  wizard: ContentWizardState;
  onGenerated: () => void;
  onStartOver: () => void;
}

export default function StepReviewSchedule({ wizard, onGenerated, onStartOver }: StepReviewScheduleProps) {
  const drafts = wizard.generatedDrafts ?? [];

  if (drafts.length === 0) {
    return (
      <Box sx={{ border: '1px solid #E5E7EB', borderRadius: '10px', p: 3, textAlign: 'center' }}>
        <Typography fontSize="14px" color="#6B7280" mb={2}>
          Generation finished but returned no drafts to review — check the Drafts tab, or try again.
        </Typography>
        <Button onClick={onStartOver} sx={{ textTransform: 'none', fontWeight: 600, color: PINK }}>
          Start over
        </Button>
      </Box>
    );
  }

  return (
    <Box>
      <Typography fontSize="15px" fontWeight={700} color="#111827" mb={0.5}>
        Review & Schedule
      </Typography>
      <Typography fontSize="12.5px" color="#6B7280" mb={2.5}>
        {drafts.length} {drafts.length === 1 ? 'post' : 'posts'} generated — edit, then Publish Now, Schedule, or Save
        as Draft for each one below.
      </Typography>

      <Box display="flex" flexDirection="column" gap={2} mb={3}>
        {drafts.map((draft) => (
          <DraftCard key={draft.id ?? draft.draft_id} draft={draft} onRefresh={wizard.refreshGeneratedDrafts} />
        ))}
      </Box>

      <Box display="flex" gap={1.5}>
        <Button onClick={onStartOver} sx={{ textTransform: 'none', fontWeight: 600, color: '#6B7280' }}>
          Create another
        </Button>
        <Button
          variant="contained"
          onClick={onGenerated}
          sx={{
            background: `linear-gradient(135deg, ${PINK} 0%, #A01560 100%)`,
            textTransform: 'none',
            fontWeight: 600,
            '&:hover': { background: `linear-gradient(135deg, #A01560 0%, ${PINK} 100%)` },
          }}
        >
          Done — go to Drafts
        </Button>
      </Box>
    </Box>
  );
}
