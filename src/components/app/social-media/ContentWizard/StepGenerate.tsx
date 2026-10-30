'use client';

import { Box, Button, CircularProgress, Typography } from '@mui/material';
import OutOfCreditsModal from '../../atoms/OutOfCreditsModal';
import LowCreditWarning from '../../atoms/LowCreditWarning';
import ConfirmDialog from '../../workspace/ConfirmDialog';
import { ToastService } from '@/src/utils/toast.util';
import { ToastTypeEnum } from '@/src/models/enum-models/ToastTypeEnum';
import { ContentWizardState } from './useContentWizardState';

const PINK = '#CD1B78';

export default function StepGenerate({ wizard }: { wizard: ContentWizardState }) {
  const isUpload = wizard.contentSource === 'upload';
  const platformLabel = wizard.selectedPlatforms.join(', ') || 'none selected';
  const formatLabel =
    wizard.postType === 'carousel'
      ? `Carousel (${wizard.numSlides} slides)`
      : wizard.postType === 'story'
        ? 'Story'
        : 'Feed Post';

  return (
    <Box>
      <Typography fontSize="15px" fontWeight={700} color="#111827" mb={2}>
        {isUpload ? 'Ready to write your caption' : 'Ready to generate'}
      </Typography>

      <Box sx={{ border: '1px solid #E5E7EB', borderRadius: '10px', p: 2, mb: 3 }}>
        <Row label="Platforms" value={platformLabel} />
        <Row label="Format" value={formatLabel} />
        {isUpload ? (
          <>
            <Row label="Files uploaded" value={String(wizard.uploadedFiles.length)} />
            <Row label="Context" value={wizard.uploadContextText.trim() ? 'Added' : 'None'} last />
          </>
        ) : (
          <>
            <Row label="AI image" value={wizard.includeImages ? 'Included' : 'Text only'} />
            <Row label="Reference images" value={String(wizard.referenceImages.length)} />
            <Row label="Brief length" value={`${wizard.charCount} characters`} last />
          </>
        )}
      </Box>

      <Button
        variant="contained"
        onClick={isUpload ? wizard.handleGenerateFromUpload : wizard.handleGenerate}
        disabled={wizard.loading || !(isUpload ? wizard.isUploadValid : wizard.isValid)}
        startIcon={wizard.loading ? <CircularProgress size={16} color="inherit" /> : null}
        sx={{
          background: `linear-gradient(135deg, ${PINK} 0%, #A01560 100%)`,
          textTransform: 'none',
          fontWeight: 600,
          px: 4,
          py: 1.25,
          boxShadow: '0 4px 12px rgba(205, 27, 120, 0.3)',
          '&:hover': { background: `linear-gradient(135deg, #A01560 0%, ${PINK} 100%)` },
        }}
      >
        {wizard.loading ? 'Generating...' : isUpload ? 'Generate Caption' : 'Generate Content'}
      </Button>

      <OutOfCreditsModal
        open={wizard.outOfCreditsOpen}
        onClose={() => wizard.setOutOfCreditsOpen(false)}
        onRedeemed={wizard.refreshCredits}
      />
      <LowCreditWarning
        open={wizard.lowCreditWarningOpen}
        onClose={() => wizard.setLowCreditWarningOpen(false)}
        creditsRemaining={wizard.creditsRemaining}
      />

      <ConfirmDialog
        isOpen={wizard.noImageConfirmOpen}
        title="Generate without an image?"
        message="You haven't enabled the image generator. Your post will be text-only. Do you want to continue, or go back and turn on the image toggle?"
        confirmText="Yes, text only"
        cancelText="Add an image"
        confirmColor={PINK}
        onConfirm={() => {
          wizard.setNoImageConfirmOpen(false);
          wizard.doGenerate();
        }}
        onCancel={() => {
          wizard.setNoImageConfirmOpen(false);
          ToastService.showToast('Turn on the image toggle to include an AI-generated image.', ToastTypeEnum.Warning);
        }}
      />

      <ConfirmDialog
        isOpen={wizard.incompleteProfileOpen}
        title="⚠️ Improve Your Brand Consistency"
        message={
          wizard.incompleteProfileData ? (
            <Box>
              <Typography variant="body1" gutterBottom>
                Your brand profile is incomplete. Missing:{' '}
                <strong>{wizard.incompleteProfileData.missing_fields?.join(', ')}</strong>
              </Typography>
              {wizard.incompleteProfileData.implications &&
                Object.entries(wizard.incompleteProfileData.implications).map(([field, implication]) => (
                  <Typography key={field} variant="body2" color="text.secondary" sx={{ ml: 2, mb: 1 }}>
                    • {implication}
                  </Typography>
                ))}
              <Typography variant="body2" sx={{ mt: 2, fontWeight: 500 }}>
                Complete your brand profile for best results, or continue with safe defaults.
              </Typography>
            </Box>
          ) : (
            'Your brand profile is incomplete. Complete it for better brand consistency.'
          )
        }
        confirmText="Complete Profile"
        cancelText="Generate Anyway"
        confirmColor={PINK}
        onConfirm={() => {
          wizard.setIncompleteProfileOpen(false);
          window.location.href = '/app?tab=playbook';
        }}
        onCancel={() => {
          wizard.setIncompleteProfileOpen(false);
          wizard.doGenerate(true);
        }}
      />
    </Box>
  );
}

function Row({ label, value, last }: { label: string; value: string; last?: boolean }) {
  return (
    <Box
      display="flex"
      justifyContent="space-between"
      sx={{ py: 1, borderBottom: last ? 'none' : '1px solid #F3F4F6' }}
    >
      <Typography fontSize="13px" color="#6B7280">
        {label}
      </Typography>
      <Typography fontSize="13px" fontWeight={600} color="#111827">
        {value}
      </Typography>
    </Box>
  );
}
