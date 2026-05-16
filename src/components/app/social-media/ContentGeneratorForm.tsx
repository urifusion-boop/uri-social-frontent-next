'use client';

import { GenerateContentPayload, SocialMediaAgentService } from '@/src/api/SocialMediaAgentService';
import { BillingService } from '@/src/api/BillingService';
import { ToastTypeEnum } from '@/src/models/enum-models/ToastTypeEnum';
import { ToastService } from '@/src/utils/toast.util';
import { EventBus, EVENTS } from '@/src/services/EventBus';
import {
  Box,
  Button,
  Checkbox,
  CircularProgress,
  FormControlLabel,
  FormGroup,
  IconButton,
  Switch,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material';
import { useRef, useState, useEffect } from 'react';
import { FaFacebook, FaInstagram, FaLinkedin, FaTwitter } from 'react-icons/fa';
import { MdClose, MdImage, MdInfoOutline, MdUpload } from 'react-icons/md';
import OutOfCreditsModal from '../atoms/OutOfCreditsModal';
import LowCreditWarning from '../atoms/LowCreditWarning';
import ConfirmDialog from '../workspace/ConfirmDialog';

const PLATFORMS = [
  { key: 'facebook', label: 'Facebook', icon: <FaFacebook size={16} color="#1877F2" /> },
  { key: 'instagram', label: 'Instagram', icon: <FaInstagram size={16} color="#E1306C" /> },
  { key: 'twitter', label: 'Twitter / X', icon: <FaTwitter size={16} color="#1DA1F2" /> },
  { key: 'linkedin', label: 'LinkedIn', icon: <FaLinkedin size={16} color="#0A66C2" /> },
];

const POST_TYPES: Array<{
  key: 'feed' | 'carousel' | 'story';
  label: string;
  icon: string;
  subtitle: string;
}> = [
  { key: 'feed', label: 'Feed Post', icon: '📄', subtitle: 'Standard single post' },
  { key: 'carousel', label: 'Carousel', icon: '🎠', subtitle: '3–5 swipeable slides' },
  { key: 'story', label: 'Story', icon: '📱', subtitle: '24-hour full-screen story' },
];

const NUM_SLIDES_OPTIONS = [2, 3, 4, 5];

interface ContentGeneratorFormProps {
  onGenerated: () => void;
}

function _friendlyGenerationError(msg?: string): string {
  if (!msg) return 'Something went wrong. Please try again.';
  const lower = msg.toLowerCase();
  if (
    lower.includes('rate limit') ||
    lower.includes('quota') ||
    lower.includes('temporarily unavailable') ||
    lower.includes('unavailable')
  )
    return 'Our AI service is temporarily at capacity. Please wait a moment and try again.';
  if (lower.includes('failed for all platforms'))
    return 'Content generation failed. Please try again — if the issue persists, contact support.';
  if (lower.includes('timeout') || lower.includes('timed out')) return 'The request took too long. Please try again.';
  if (lower.includes('authentication') || lower.includes('configuration error'))
    return 'A service configuration error occurred. Please contact support.';
  return 'Content generation failed. Please try again.';
}

const ContentGeneratorForm = ({ onGenerated }: ContentGeneratorFormProps) => {
  const [seedContent, setSeedContent] = useState('');
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>(['facebook']);
  const [includeImages, setIncludeImages] = useState(false);
  const [loading, setLoading] = useState(false);
  const [referenceImage, setReferenceImage] = useState<string | null>(null);
  const [referenceImageName, setReferenceImageName] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [postType, setPostType] = useState<'feed' | 'carousel' | 'story'>('feed');
  const [numSlides, setNumSlides] = useState(3);
  const [isDragging, setIsDragging] = useState(false);

  // Billing modals
  const [outOfCreditsOpen, setOutOfCreditsOpen] = useState(false);
  const [lowCreditWarningOpen, setLowCreditWarningOpen] = useState(false);
  const [creditsRemaining, setCreditsRemaining] = useState<number>(0);

  const imageModel = 'openai/gpt-image-2';

  // No-image confirmation
  const [noImageConfirmOpen, setNoImageConfirmOpen] = useState(false);

  // OPTION 1: Incomplete brand profile modal
  const [incompleteProfileOpen, setIncompleteProfileOpen] = useState(false);
  const [incompleteProfileData, setIncompleteProfileData] = useState<{
    missing_fields?: string[];
    implications?: Record<string, string>;
    can_proceed?: boolean;
  } | null>(null);

  const showPostTypeSelector = selectedPlatforms.some((p) => p === 'instagram' || p === 'facebook');

  // Reset post type to feed if selector is hidden (no Instagram/Facebook selected)
  useEffect(() => {
    if (!showPostTypeSelector && postType !== 'feed') {
      setPostType('feed');
    }
  }, [showPostTypeSelector, postType]);

  const togglePlatform = (key: string) =>
    setSelectedPlatforms((prev) => (prev.includes(key) ? prev.filter((p) => p !== key) : [...prev, key]));

  const processImageFile = (file: File, showSuccessToast: boolean = false) => {
    if (!file.type.startsWith('image/')) {
      ToastService.showToast('Please upload an image file', ToastTypeEnum.Error);
      return false;
    }
    if (file.size > 10 * 1024 * 1024) {
      ToastService.showToast('Image must be under 10MB', ToastTypeEnum.Error);
      return false;
    }
    const reader = new FileReader();
    reader.onload = () => {
      setReferenceImage(reader.result as string);
      setReferenceImageName(file.name);
      if (showSuccessToast) {
        ToastService.showToast('Image uploaded successfully', ToastTypeEnum.Success);
      }
    };
    reader.readAsDataURL(file);
    return true;
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    processImageFile(file);
    // Reset so same file can be re-uploaded
    e.target.value = '';
  };

  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      processImageFile(files[0]);
    }
  };

  const removeReferenceImage = () => {
    setReferenceImage(null);
    setReferenceImageName('');
  };

  // Add paste event listener
  useEffect(() => {
    const handleGlobalPaste = (e: ClipboardEvent) => {
      // Only handle paste if the reference image upload area is visible and no image is selected
      if (
        !referenceImage &&
        document.activeElement?.tagName !== 'TEXTAREA' &&
        document.activeElement?.tagName !== 'INPUT'
      ) {
        const items = Array.from(e.clipboardData?.items || []);
        const imageItem = items.find((item) => item.type.startsWith('image/'));

        if (imageItem) {
          e.preventDefault();
          const file = imageItem.getAsFile();
          if (file) {
            // Create a proper filename for pasted images
            const timestamp = new Date().getTime();
            const extension = file.type.split('/')[1] || 'png';
            const renamedFile = new File([file], `pasted-image-${timestamp}.${extension}`, { type: file.type });

            processImageFile(renamedFile, true);
          }
        }
      }
    };

    window.addEventListener('paste', handleGlobalPaste);
    return () => window.removeEventListener('paste', handleGlobalPaste);
  }, [referenceImage]);

  // Check credits before generation
  useEffect(() => {
    const checkCredits = async () => {
      try {
        const balance = await BillingService.getCreditBalance();
        setCreditsRemaining(balance.credits_remaining);
        // PRD 7.3: Show low credit warning when credits <= 3
        if (balance.low_credit_warning && balance.credits_remaining > 0 && balance.credits_remaining <= 3) {
          setLowCreditWarningOpen(true);
        }
      } catch (error) {
        console.error('Failed to check credits:', error);
      }
    };
    checkCredits();
  }, []);

  const doGenerate = async (acknowledgedIncomplete = false) => {
    setLoading(true);
    try {
      const payload: GenerateContentPayload = {
        seed_content: seedContent.trim(),
        platforms: selectedPlatforms,
        include_images: includeImages,
        ...(includeImages ? { image_model: imageModel } : {}),
        post_type: postType,
        ...(postType === 'carousel' ? { num_slides: numSlides } : {}),
        acknowledged_incomplete_profile: acknowledgedIncomplete,
      };
      if (referenceImage) {
        payload.reference_image = referenceImage;
      }
      const response = await SocialMediaAgentService.generateContent(payload);

      if (response.status) {
        ToastService.showToast('Content generated! Check your Drafts tab.', ToastTypeEnum.Success);
        onGenerated();

        // Emit credit consumed event - AuthProvider will auto-refresh balance
        EventBus.emit(EVENTS.CREDIT_CONSUMED, {
          amount: 1,
          operation: 'content_generation',
        });

        // Also update local state
        const balance = await BillingService.getCreditBalance();
        setCreditsRemaining(balance.credits_remaining);
      } else {
        // Handle incomplete brand profile (Option 1: Progressive Enforcement)
        if (response.responseCode === 'INCOMPLETE_PROFILE') {
          setIncompleteProfileData(
            response.responseData as {
              missing_fields?: string[];
              implications?: Record<string, string>;
              can_proceed?: boolean;
            } | null
          );
          setIncompleteProfileOpen(true);
        }
        // PRD Section 8: Handle 402 Payment Required
        else if (response.responseCode === 402) {
          setOutOfCreditsOpen(true);
        } else {
          ToastService.showToast(_friendlyGenerationError(response.responseMessage), ToastTypeEnum.Error);
        }
      }
    } catch (err: unknown) {
      const error = err as { response?: { status?: number; data?: { responseMessage?: string } } };
      // PRD Section 8: Handle 402 Payment Required from API
      if (error?.response?.status === 402) {
        setOutOfCreditsOpen(true);
      } else {
        ToastService.showToast(_friendlyGenerationError(error?.response?.data?.responseMessage), ToastTypeEnum.Error);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGenerate = async () => {
    if (seedContent.trim().length < 10) {
      ToastService.showToast('Seed content must be at least 10 characters', ToastTypeEnum.Error);
      return;
    }
    if (selectedPlatforms.length === 0) {
      ToastService.showToast('Select at least one platform', ToastTypeEnum.Error);
      return;
    }

    // PRD Section 8: Check if user has credits before generating
    try {
      const canGenerate = await BillingService.canGenerateContent();
      if (!canGenerate.can_generate || canGenerate.blocked) {
        setOutOfCreditsOpen(true);
        return;
      }
    } catch (error) {
      console.error('Credit check failed:', error);
    }

    if (!includeImages) {
      setNoImageConfirmOpen(true);
      return;
    }

    await doGenerate();
  };

  const charCount = seedContent.length;
  const isValid = charCount >= 10 && charCount <= 5000 && selectedPlatforms.length > 0;

  return (
    <Box sx={{ maxWidth: 700, width: '100%' }}>
      <Box display="flex" alignItems="center" gap={0.75} mb={1}>
        <Typography fontSize="14px" color="#374151" fontWeight={500}>
          What do you want to post about?
        </Typography>
        <Tooltip
          title="Give the AI a topic, idea, URL, or existing text to work from. The more context you provide, the more on-brand and specific the output will be."
          arrow
          enterTouchDelay={0}
          leaveTouchDelay={3000}
        >
          <Box component="span" sx={{ display: 'inline-flex', cursor: 'help' }} aria-label="Seed content help">
            <MdInfoOutline size={15} color="#9CA3AF" />
          </Box>
        </Tooltip>
      </Box>
      <TextField
        placeholder="Describe the topic, share a link, or paste existing content to repurpose..."
        fullWidth
        multiline
        rows={6}
        value={seedContent}
        onChange={(e) => setSeedContent(e.target.value)}
        slotProps={{ htmlInput: { maxLength: 5000 } }}
        helperText={`${charCount}/5000 characters (min 10)`}
        sx={{ mb: 3 }}
      />

      {/* Reference image upload */}
      <Typography fontSize="14px" color="#374151" mb={1} fontWeight={500}>
        Reference image{' '}
        <Typography component="span" fontSize="12px" color="#9CA3AF" fontWeight={400}>
          (optional)
        </Typography>
      </Typography>
      <Typography fontSize="12px" color="#6B7280" mb={1.5}>
        Upload, drag & drop, or paste (Ctrl+V) a photo to give the AI visual context — e.g. a product shot, event image,
        or reference photo.
      </Typography>

      {referenceImage ? (
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 2,
            border: '1px solid #CD1B78',
            borderRadius: '10px',
            px: 2,
            py: 1.5,
            mb: 3,
            background: '#FDF2F8',
          }}
        >
          <Box
            component="img"
            src={referenceImage}
            alt="Reference"
            sx={{ width: 56, height: 56, objectFit: 'cover', borderRadius: '6px', flexShrink: 0 }}
          />
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography fontSize="13px" fontWeight={600} color="#111827" noWrap>
              {referenceImageName}
            </Typography>
            <Typography fontSize="12px" color="#6B7280">
              The AI will use this image as visual context
            </Typography>
          </Box>
          <IconButton size="small" onClick={removeReferenceImage} sx={{ flexShrink: 0 }}>
            <MdClose size={18} color="#6B7280" />
          </IconButton>
        </Box>
      ) : (
        <Box
          onClick={() => fileInputRef.current?.click()}
          onDragEnter={handleDragEnter}
          onDragLeave={handleDragLeave}
          onDragOver={handleDragOver}
          onDrop={handleDrop}
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 1.5,
            border: isDragging ? '1.5px solid #CD1B78' : '1.5px dashed #E5E7EB',
            borderRadius: '10px',
            px: 2,
            py: 1.75,
            mb: 3,
            cursor: 'pointer',
            background: isDragging ? '#FDF2F8' : '#FAFAFA',
            transition: 'all 0.15s',
            '&:hover': { borderColor: '#CD1B78', background: '#FDF2F8' },
          }}
        >
          <Box
            sx={{
              width: 36,
              height: 36,
              borderRadius: '8px',
              background: isDragging ? '#FBE0F0' : '#F3F4F6',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
              transition: 'all 0.15s',
            }}
          >
            <MdUpload size={20} color={isDragging ? '#CD1B78' : '#9CA3AF'} />
          </Box>
          <Box>
            <Typography fontSize="13px" fontWeight={600} color="#374151">
              {isDragging ? 'Drop image here' : 'Click, drag, or paste image'}
            </Typography>
            <Typography fontSize="12px" color="#9CA3AF">
              JPG, PNG, WEBP up to 10MB
            </Typography>
          </Box>
        </Box>
      )}

      <input ref={fileInputRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleFileChange} />

      <Box display="flex" alignItems="center" gap={0.75} mb={1}>
        <Typography fontSize="14px" color="#374151" fontWeight={500}>
          Target Platforms
        </Typography>
        <Tooltip
          title="Select which platforms to generate posts for. Each platform gets its own optimised caption, hashtags, and formatting."
          arrow
          enterTouchDelay={0}
          leaveTouchDelay={3000}
        >
          <Box component="span" sx={{ display: 'inline-flex', cursor: 'help' }} aria-label="Target platforms help">
            <MdInfoOutline size={15} color="#9CA3AF" />
          </Box>
        </Tooltip>
      </Box>
      <FormGroup row sx={{ mb: 3, gap: 1, flexWrap: 'wrap' }}>
        {PLATFORMS.map(({ key, label, icon }) => (
          <FormControlLabel
            key={key}
            control={
              <Checkbox
                checked={selectedPlatforms.includes(key)}
                onChange={() => togglePlatform(key)}
                size="small"
                sx={{ '&.Mui-checked': { color: '#CD1B78' } }}
              />
            }
            label={
              <Box display="flex" alignItems="center" gap={0.75}>
                {icon}
                <Typography fontSize="13px" fontWeight={500}>
                  {label}
                </Typography>
              </Box>
            }
            sx={{
              border: '1px solid',
              borderColor: selectedPlatforms.includes(key) ? '#CD1B78' : '#E5E7EB',
              borderRadius: '8px',
              px: 1.5,
              py: 0.5,
              mr: 0,
              background: selectedPlatforms.includes(key) ? '#FDF2F8' : 'transparent',
            }}
          />
        ))}
      </FormGroup>

      {/* Post type selector — only for Instagram/Facebook */}
      {showPostTypeSelector && (
        <Box mb={3}>
          <Typography fontSize="14px" color="#374151" mb={1} fontWeight={500}>
            Post Format
          </Typography>
          <Box display="flex" gap={1} flexWrap="wrap">
            {POST_TYPES.map(({ key, label, icon, subtitle }) => {
              const active = postType === key;
              const disabled = key === 'story';
              return (
                <Box
                  key={key}
                  onClick={() => !disabled && setPostType(key)}
                  sx={{
                    border: '1px solid',
                    borderColor: active ? '#CD1B78' : '#E5E7EB',
                    borderRadius: '10px',
                    px: 2,
                    py: 1.25,
                    cursor: disabled ? 'not-allowed' : 'pointer',
                    background: disabled ? '#F9FAFB' : active ? '#FDF2F8' : '#fff',
                    flex: { xs: '1 1 calc(33% - 8px)', sm: '0 0 auto' },
                    minWidth: { xs: 0, sm: 120 },
                    userSelect: 'none',
                    opacity: disabled ? 0.45 : 1,
                    transition: 'all 0.15s',
                    position: 'relative',
                  }}
                >
                  <Typography fontSize="20px" lineHeight={1} mb={0.5}>
                    {icon}
                  </Typography>
                  <Typography fontSize="13px" fontWeight={600} color={active ? '#CD1B78' : '#111827'}>
                    {label}
                  </Typography>
                  <Typography fontSize="11px" color="#6B7280">
                    {disabled ? 'Coming soon' : subtitle}
                  </Typography>
                </Box>
              );
            })}
          </Box>

          {/* Story note */}
          {postType === 'story' && (
            <Box
              mt={1.5}
              sx={{ background: '#FEF3C7', border: '1px solid #FDE68A', borderRadius: '8px', px: 1.5, py: 1 }}
            >
              <Typography fontSize="12px" color="#92400E">
                Stories use a 9:16 vertical image format (1080 × 1920 px).
              </Typography>
            </Box>
          )}

          {/* Carousel num_slides selector */}
          {postType === 'carousel' && (
            <Box mt={1.5} display="flex" alignItems="center" gap={1}>
              <Typography fontSize="13px" color="#374151" fontWeight={500}>
                Number of slides:
              </Typography>
              {NUM_SLIDES_OPTIONS.map((n) => (
                <Box
                  key={n}
                  onClick={() => setNumSlides(n)}
                  sx={{
                    width: 32,
                    height: 32,
                    borderRadius: '6px',
                    border: '1px solid',
                    borderColor: numSlides === n ? '#CD1B78' : '#E5E7EB',
                    background: numSlides === n ? '#FDF2F8' : '#fff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    userSelect: 'none',
                  }}
                >
                  <Typography fontSize="13px" fontWeight={600} color={numSlides === n ? '#CD1B78' : '#374151'}>
                    {n}
                  </Typography>
                </Box>
              ))}
            </Box>
          )}
        </Box>
      )}

      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: { xs: 'wrap', sm: 'nowrap' },
          border: '1px solid',
          borderColor: includeImages ? '#CD1B78' : '#E5E7EB',
          borderRadius: '10px',
          px: 2,
          py: 1.5,
          mb: 3,
          background: includeImages ? '#FDF2F8' : '#fff',
          cursor: 'pointer',
          gap: 1,
        }}
        onClick={() => setIncludeImages((v) => !v)}
      >
        <Box display="flex" alignItems="center" gap={1.5} sx={{ flex: 1, minWidth: 0 }}>
          <Box
            sx={{
              width: 36,
              height: 36,
              borderRadius: '8px',
              background: includeImages ? '#CD1B78' : '#F3F4F6',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <MdImage size={20} color={includeImages ? '#fff' : '#9CA3AF'} />
          </Box>
          <Box>
            <Typography fontSize="14px" fontWeight={600} color="#111827">
              Include AI-generated image
            </Typography>
            <Typography fontSize="12px" color="#6B7280">
              {postType === 'carousel'
                ? 'Generate an image for each carousel slide'
                : postType === 'story'
                  ? 'Generate a vertical 9:16 image for the story'
                  : referenceImage
                    ? 'Generate an image inspired by your reference photo'
                    : 'Generate a relevant image alongside the post copy'}
            </Typography>
          </Box>
        </Box>
        <Box display="flex" alignItems="center" gap={1}>
          <Tooltip
            title="Uses an image generation model. Adds a few extra seconds to generation time."
            arrow
            enterTouchDelay={0}
            leaveTouchDelay={3000}
          >
            <Box sx={{ display: 'flex', cursor: 'help' }}>
              <MdInfoOutline size={16} color="#9CA3AF" />
            </Box>
          </Tooltip>
          <Switch
            checked={includeImages}
            onChange={(e) => {
              e.stopPropagation();
              setIncludeImages(e.target.checked);
            }}
            sx={{
              '& .MuiSwitch-switchBase.Mui-checked': { color: '#CD1B78' },
              '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': { backgroundColor: '#CD1B78' },
            }}
          />
        </Box>
      </Box>

      <Tooltip
        title={
          !isValid
            ? 'Add at least 10 characters and select at least one platform to generate'
            : 'URI Agent will create platform-optimised posts based on your seed content and brand profile. Drafts appear in the Drafts tab for your review.'
        }
        arrow
        enterTouchDelay={0}
        leaveTouchDelay={3000}
      >
        <span>
          <Button
            variant="contained"
            onClick={handleGenerate}
            disabled={loading || !isValid}
            startIcon={loading ? <CircularProgress size={16} color="inherit" /> : null}
            sx={{
              background: 'linear-gradient(135deg, #CD1B78 0%, #A01560 100%)',
              textTransform: 'none',
              fontWeight: 600,
              px: 4,
              py: 1.25,
              boxShadow: '0 4px 12px rgba(205, 27, 120, 0.3)',
              '&:hover': { background: 'linear-gradient(135deg, #A01560 0%, #CD1B78 100%)' },
            }}
          >
            {loading ? 'Generating...' : 'Generate Content'}
          </Button>
        </span>
      </Tooltip>

      {/* Billing Modals */}
      <OutOfCreditsModal open={outOfCreditsOpen} onClose={() => setOutOfCreditsOpen(false)} />
      <LowCreditWarning
        open={lowCreditWarningOpen}
        onClose={() => setLowCreditWarningOpen(false)}
        creditsRemaining={creditsRemaining}
      />

      {/* No-image confirmation */}
      <ConfirmDialog
        isOpen={noImageConfirmOpen}
        title="Generate without an image?"
        message="You haven't enabled the image generator. Your post will be text-only. Do you want to continue, or go back and turn on the image toggle?"
        confirmText="Yes, text only"
        cancelText="Add an image"
        confirmColor="#CD1B78"
        onConfirm={() => {
          setNoImageConfirmOpen(false);
          doGenerate();
        }}
        onCancel={() => {
          setNoImageConfirmOpen(false);
          ToastService.showToast('Turn on the image toggle to include an AI-generated image.', ToastTypeEnum.Warning);
        }}
      />

      {/* OPTION 1: Incomplete brand profile warning */}
      <ConfirmDialog
        isOpen={incompleteProfileOpen}
        title="⚠️ Improve Your Brand Consistency"
        message={
          incompleteProfileData ? (
            <Box>
              <Typography variant="body1" gutterBottom>
                Your brand profile is incomplete. Missing:{' '}
                <strong>{incompleteProfileData.missing_fields?.join(', ')}</strong>
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 2, mb: 2 }}>
                <strong>What this means:</strong>
              </Typography>
              {incompleteProfileData.implications &&
                Object.entries(incompleteProfileData.implications).map(([field, implication]) => (
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
        confirmColor="#CD1B78"
        onConfirm={() => {
          setIncompleteProfileOpen(false);
          // Navigate to Brand Playbook tab
          window.location.href = '/app?tab=playbook';
        }}
        onCancel={() => {
          setIncompleteProfileOpen(false);
          // User acknowledged - generate with fallbacks
          doGenerate(true);
        }}
      />
    </Box>
  );
};

export default ContentGeneratorForm;
