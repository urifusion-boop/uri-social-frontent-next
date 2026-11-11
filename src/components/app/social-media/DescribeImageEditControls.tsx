'use client';

import { useState } from 'react';
import { Button, CircularProgress, Dialog, DialogActions, DialogContent, DialogTitle, Typography } from '@mui/material';
import TextField from '@mui/material/TextField';
import { MdEdit } from 'react-icons/md';
import { SocialMediaAgentService } from '@/src/api/SocialMediaAgentService';
import { ToastService } from '@/src/utils/toast.util';
import { ToastTypeEnum } from '@/src/models/enum-models/ToastTypeEnum';
import { EventBus, EVENTS } from '@/src/services/EventBus';

interface ImageEditResult {
  image_url: string;
  version: number;
  slide_index?: number | null;
}

interface DescribeImageEditControlsProps {
  draftId: string;
  /** Current image for this draft/slide — used for the OCR text-extract shortcut. */
  imageUrl?: string;
  /** Current version number, for the "(v2)"/Undo affordance — same as DraftCard's currentImageVersion. */
  currentVersion?: number;
  /** 0-based slide index for a carousel edit; omitted for a single-image draft. */
  slideIndex?: number;
  disabled?: boolean;
  onUpdated: (result: ImageEditResult) => void;
}

// The "describe what you want changed" image edit — ported from DraftCard.tsx's
// Text/Edit Image buttons so it's available wherever a draft can be edited, not
// just the classic (now nav-less) Drafts tab that originally had it. Kept as its
// own component instead of copy-pasted twice because GeneratedDraftEditor and
// DraftDetailView both need the exact same dialog/undo/credit-warning behavior.
export default function DescribeImageEditControls({
  draftId,
  imageUrl,
  currentVersion,
  slideIndex,
  disabled,
  onUpdated,
}: DescribeImageEditControlsProps) {
  const [editOpen, setEditOpen] = useState(false);
  const [feedback, setFeedback] = useState('');
  const [forceCategory, setForceCategory] = useState<
    'text_edit' | 'style_edit' | 'content_edit' | 'full_redesign' | undefined
  >(undefined);
  const [editLoading, setEditLoading] = useState(false);
  const [creditWarningOpen, setCreditWarningOpen] = useState(false);
  const [creditWarningData, setCreditWarningData] = useState<{
    message?: string;
    credits_required?: number;
  } | null>(null);
  const [undoLoading, setUndoLoading] = useState(false);

  const runEdit = async (fb: string, category?: typeof forceCategory) => {
    setEditLoading(true);
    EventBus.emit(EVENTS.IMAGE_EDIT_STARTED, { draftId });
    try {
      const response = await SocialMediaAgentService.editDraftImage(draftId, fb, category, slideIndex);
      if (response.status) {
        const data = response.responseData;
        if (
          response.responseCode === 'credit_warning' ||
          response.responseCode === 'confirm_redesign' ||
          response.responseCode === 'content_edit_warning' ||
          response.responseCode === 'suggest_edit_first'
        ) {
          setCreditWarningData(data ?? null);
          setCreditWarningOpen(true);
          return;
        }
        if (data) {
          onUpdated({ image_url: data.image_url, version: data.version, slide_index: data.slide_index });
          setEditOpen(false);
          setFeedback('');
          EventBus.emit(EVENTS.IMAGE_EDIT_COMPLETED, { draftId, imageUrl: data.image_url, version: data.version });
          EventBus.emit(EVENTS.CREDIT_CONSUMED, { amount: data.credits_consumed || 1, operation: 'image_edit' });
          ToastService.showToast(data.message || 'Image edited successfully!', ToastTypeEnum.Success);
        }
      } else {
        EventBus.emit(EVENTS.IMAGE_EDIT_FAILED, { draftId, error: response.responseMessage || 'Edit failed' });
        ToastService.showToast(response.responseMessage || 'Edit failed', ToastTypeEnum.Error);
      }
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Edit failed';
      EventBus.emit(EVENTS.IMAGE_EDIT_FAILED, { draftId, error: message });
      ToastService.showToast(message, ToastTypeEnum.Error);
    } finally {
      setEditLoading(false);
    }
  };

  const handleUndo = async () => {
    setUndoLoading(true);
    try {
      const response = await SocialMediaAgentService.undoDraftImage(draftId, slideIndex);
      if (response.status && response.responseData) {
        const data = response.responseData;
        onUpdated({ image_url: data.image_url, version: data.version, slide_index: data.slide_index });
        ToastService.showToast(data.message || 'Reverted to previous version', ToastTypeEnum.Success);
      } else {
        ToastService.showToast(response.responseMessage || 'Undo failed', ToastTypeEnum.Error);
      }
    } catch (error: unknown) {
      ToastService.showToast(error instanceof Error ? error.message : 'Undo failed', ToastTypeEnum.Error);
    } finally {
      setUndoLoading(false);
    }
  };

  const openTextEdit = async () => {
    setFeedback('Extracting text from image...');
    setForceCategory('text_edit');
    setEditOpen(true);
    try {
      if (imageUrl) {
        const response = await SocialMediaAgentService.extractImageText(imageUrl);
        const extracted = response.status ? response.responseData?.text : undefined;
        setFeedback(extracted && extracted !== 'No text found' ? extracted : '');
      } else {
        setFeedback('');
      }
    } catch {
      setFeedback('');
    }
  };

  const openFreeEdit = () => {
    setFeedback('');
    setForceCategory(undefined);
    setEditOpen(true);
  };

  const btnSx = {
    textTransform: 'none' as const,
    fontWeight: 700,
    fontSize: '12.5px',
    color: '#7C3AED',
    border: '1px solid #E9D5FF',
    borderRadius: '8px',
    background: '#FEFCFF',
  };

  return (
    <>
      <Button
        size="small"
        startIcon={<MdEdit size={14} />}
        disabled={disabled || editLoading}
        onClick={openTextEdit}
        sx={btnSx}
      >
        Edit Text
      </Button>
      <Button
        size="small"
        startIcon={<MdEdit size={14} />}
        disabled={disabled || editLoading}
        onClick={openFreeEdit}
        sx={btnSx}
      >
        Describe Edit
      </Button>
      {currentVersion && currentVersion > 1 && (
        <Button
          size="small"
          disabled={disabled || editLoading || undoLoading}
          onClick={handleUndo}
          sx={{ textTransform: 'none', fontWeight: 700, fontSize: '12.5px', color: '#6B7280' }}
        >
          {undoLoading ? 'Undoing…' : '↩ Undo'}
        </Button>
      )}

      <Dialog open={editOpen} onClose={() => !editLoading && setEditOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ fontSize: '15px', fontWeight: 600 }}>Edit Image</DialogTitle>
        <DialogContent>
          <Typography fontSize="12px" color="#6B7280" mb={1.5}>
            {/* Live-reported (Gloria, staging): this description always said
             * "describe what you want to change" even when the field below is
             * pre-filled with the image's actual current text (the "Edit Text"
             * entry point) — a real sentence to edit directly, not a change to
             * describe. Each entry point now gets wording that matches what's
             * actually in the box. */}
            {forceCategory === 'text_edit'
              ? "This is the text currently on the image — edit it directly: fix a word, change a price, or delete a line you don't want."
              : 'Describe what you want to change. For example: "Change price to ₦5,000", "Make background darker", "Add our phone number"'}
          </Typography>
          <TextField
            autoFocus
            fullWidth
            multiline
            rows={3}
            placeholder={forceCategory === 'text_edit' ? 'The image’s text' : 'What would you like to change?'}
            value={feedback}
            onChange={(e) => setFeedback(e.target.value)}
            disabled={editLoading || feedback === 'Extracting text from image...'}
          />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3, gap: 1 }}>
          <Button
            onClick={() => {
              setEditOpen(false);
              setFeedback('');
            }}
            disabled={editLoading}
            sx={{ textTransform: 'none', fontSize: '13px' }}
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            disabled={!feedback.trim() || editLoading || feedback === 'Extracting text from image...'}
            onClick={() => runEdit(feedback, forceCategory)}
            startIcon={editLoading ? <CircularProgress size={16} color="inherit" /> : null}
            sx={{
              textTransform: 'none',
              fontSize: '13px',
              background: '#CD1B78',
              '&:hover': { background: '#A01560' },
            }}
          >
            {editLoading ? 'Editing…' : 'Edit Image'}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={creditWarningOpen} onClose={() => setCreditWarningOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Credit Required</DialogTitle>
        <DialogContent>
          <Typography fontSize="13px" mb={2}>
            {creditWarningData?.message}
          </Typography>
          <Typography fontSize="12px" color="#6B7280">
            Credits Required: {creditWarningData?.credits_required || 1}
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCreditWarningOpen(false)} sx={{ textTransform: 'none' }}>
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={() => {
              setCreditWarningOpen(false);
              runEdit(feedback, forceCategory);
            }}
            sx={{ textTransform: 'none', background: '#CD1B78', '&:hover': { background: '#A01560' } }}
          >
            Proceed
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
