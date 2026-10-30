'use client';

import { useEffect, useState } from 'react';
import { Box, Button, Dialog, DialogContent, DialogTitle, IconButton, Typography } from '@mui/material';
import { MdClose } from 'react-icons/md';
import { ContentDraft, SocialMediaAgentService } from '@/src/api/SocialMediaAgentService';
import DraftCard from '../DraftCard';
import GeneratedContentCard from '../GeneratedContentCard';
import { ContentWizardState } from './useContentWizardState';

const PINK = '#CD1B78';

interface StepReviewScheduleProps {
  wizard: ContentWizardState;
  onGenerated: () => void;
  onStartOver: () => void;
}

export default function StepReviewSchedule({ wizard, onGenerated, onStartOver }: StepReviewScheduleProps) {
  const drafts = wizard.generatedDrafts ?? [];
  const [connectedPlatforms, setConnectedPlatforms] = useState<string[] | null>(null);
  const [editingDraft, setEditingDraft] = useState<ContentDraft | null>(null);

  useEffect(() => {
    SocialMediaAgentService.getConnections()
      .then((res) => setConnectedPlatforms(res.responseData?.connected_platforms ?? []))
      .catch(() => setConnectedPlatforms([]));
  }, []);

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
        Generated Content ({drafts.length} {drafts.length === 1 ? 'platform' : 'platforms'})
      </Typography>
      <Typography fontSize="12.5px" color="#6B7280" mb={2.5}>
        Review and customize your content for each platform. You can edit, schedule or post directly.
      </Typography>

      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', sm: 'repeat(auto-fill, minmax(220px, 1fr))' },
          gap: 2,
          mb: 3,
        }}
      >
        {drafts.map((draft) => (
          <GeneratedContentCard
            key={draft.id ?? draft.draft_id}
            draft={draft}
            connectedPlatforms={connectedPlatforms}
            onEdit={setEditingDraft}
            onRefresh={wizard.refreshGeneratedDrafts}
          />
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

      <Dialog open={!!editingDraft} onClose={() => setEditingDraft(null)} maxWidth="md" fullWidth>
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', pb: 1 }}>
          <Typography fontSize="15px" fontWeight={700}>
            Edit post
          </Typography>
          <IconButton size="small" onClick={() => setEditingDraft(null)}>
            <MdClose size={18} />
          </IconButton>
        </DialogTitle>
        <DialogContent sx={{ p: 2, pt: 0 }}>
          {editingDraft && (
            <DraftCard
              draft={editingDraft}
              onRefresh={() => {
                wizard.refreshGeneratedDrafts();
              }}
            />
          )}
        </DialogContent>
      </Dialog>
    </Box>
  );
}
