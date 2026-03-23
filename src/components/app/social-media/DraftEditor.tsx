'use client';

import { ContentDraft, SocialMediaAgentService } from '@/src/api/SocialMediaAgentService';
import { ToastTypeEnum } from '@/src/models/enum-models/ToastTypeEnum';
import { ToastService } from '@/src/utils/toast.util';
import { Box, Button, TextField } from '@mui/material';
import { useState } from 'react';

interface DraftEditorProps {
  draft: ContentDraft;
  onSaved: (updated: ContentDraft) => void;
  onCancel: () => void;
}

const DraftEditor = ({ draft, onSaved, onCancel }: DraftEditorProps) => {
  const [content, setContent] = useState(draft.content);
  const [hashtagInput, setHashtagInput] = useState((draft.hashtags ?? []).join(', '));
  const [loading, setLoading] = useState(false);

  const handleSave = async () => {
    const hashtags = hashtagInput
      .split(',')
      .map((h) => h.trim().replace(/^#/, ''))
      .filter(Boolean);

    setLoading(true);
    try {
      const response = await SocialMediaAgentService.refineContent({
        draft_id: draft.draft_id ?? draft.id ?? '',
        refinements: { content, hashtags },
      });

      if (response.status && response.responseData) {
        ToastService.showToast('Draft updated', ToastTypeEnum.Success);
        onSaved(response.responseData);
      } else {
        ToastService.showToast(response.responseMessage || 'Save failed', ToastTypeEnum.Error);
      }
    } catch (err: any) {
      ToastService.showToast(err?.data?.responseMessage || 'Save failed', ToastTypeEnum.Error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ mt: 1.5 }}>
      <TextField label="Content" fullWidth multiline rows={5} value={content} onChange={(e) => setContent(e.target.value)} sx={{ mb: 2 }} />
      <TextField
        label="Hashtags (comma-separated)"
        fullWidth
        value={hashtagInput}
        onChange={(e) => setHashtagInput(e.target.value)}
        placeholder="marketing, socialmedia, growth"
        helperText="Enter without # — they will be added automatically"
        sx={{ mb: 2 }}
      />
      <Box display="flex" gap={1}>
        <Button
          variant="contained"
          onClick={handleSave}
          disabled={loading || !content.trim()}
          sx={{
            background: '#CD1B78',
            textTransform: 'none',
            fontWeight: 600,
            '&:hover': { background: '#A01560' },
          }}
        >
          {loading ? 'Saving...' : 'Save Changes'}
        </Button>
        <Button variant="outlined" onClick={onCancel} disabled={loading} sx={{ textTransform: 'none' }}>
          Cancel
        </Button>
      </Box>
    </Box>
  );
};

export default DraftEditor;
