'use client';

import { GenerateContentPayload, SocialMediaAgentService } from '@/src/api/SocialMediaAgentService';
import { BillingService } from '@/src/api/BillingService';
import { BrandProfileService } from '@/src/api/BrandProfileService';
import { getStyle } from '@/src/data/styleLibrary';
import posthog from 'posthog-js';
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
  Menu,
  MenuItem,
  Switch,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material';
import { useRef, useState, useEffect } from 'react';
import { FaFacebook, FaInstagram, FaLinkedin, FaTwitter } from 'react-icons/fa';
import { MdAdd, MdClose, MdImage, MdInfoOutline, MdUpload } from 'react-icons/md';
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
const MAX_REFERENCE_IMAGES = 10;

interface ReferenceImage {
  dataUrl: string;
  name: string;
}

interface ContentGeneratorFormProps {
  onGenerated: () => void;
  requireEmailVerification: (callback?: () => void) => boolean;
}

function _friendlyGenerationError(msg?: string): string {
  if (!msg) return 'Something went wrong — if the issue persists, contact support.';
  const lower = msg.toLowerCase();
  if (
    lower.includes('rate limit') ||
    lower.includes('quota') ||
    lower.includes('temporarily unavailable') ||
    lower.includes('unavailable')
  )
    return 'We are experiencing high demand right now, please try again in a few minutes — if the issue persists, contact support.';
  if (lower.includes('failed for all platforms'))
    return 'We are experiencing high demand right now, please try again in a few minutes — if the issue persists, contact support.';
  if (lower.includes('timeout') || lower.includes('timed out'))
    return 'We are experiencing high demand right now, please try again in a few minutes — if the issue persists, contact support.';
  if (lower.includes('authentication') || lower.includes('configuration error'))
    return 'Something went wrong — if the issue persists, contact support.';
  return 'Something went wrong — if the issue persists, contact support.';
}

const ContentGeneratorForm = ({ onGenerated, requireEmailVerification }: ContentGeneratorFormProps) => {
  const [seedContent, setSeedContent] = useState('');
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>(['facebook']);
  const [includeImages, setIncludeImages] = useState(false);
  const [loading, setLoading] = useState(false);
  const [referenceImages, setReferenceImages] = useState<ReferenceImage[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [postType, setPostType] = useState<'feed' | 'carousel' | 'story'>('feed');
  const [numSlides, setNumSlides] = useState(3);
  const [isDragging, setIsDragging] = useState(false);
  // Carousel slide -> reference image assignment. Empty map = auto-cycle (image 1 -> slide 1, etc.)
  const [manualSlideAssignment, setManualSlideAssignment] = useState(false);
  const [slideImageOverrides, setSlideImageOverrides] = useState<Record<number, number | null>>({});
  const [assignMenu, setAssignMenu] = useState<{ anchorEl: HTMLElement; slideIndex: number } | null>(null);
  const [useCustomCta, setUseCustomCta] = useState(false);
  const [customCta, setCustomCta] = useState('');

  // One-time visual style override, picked from the brand's saved profile
  // styles. Carousel: cycles per slide in the order selected here. Single
  // post: uses the first one picked. Not saved back to the brand playbook.
  const [profileStyles, setProfileStyles] = useState<string[]>([]);
  const [useStyleOverride, setUseStyleOverride] = useState(false);
  const [selectedOverrideStyles, setSelectedOverrideStyles] = useState<string[]>([]);

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

  const showPostTypeSelector = selectedPlatforms.some((p) => p === 'instagram' || p === 'facebook' || p === 'linkedin');

  // Reset post type to feed if selector is hidden (no Instagram/Facebook selected)
  useEffect(() => {
    if (!showPostTypeSelector && postType !== 'feed') {
      setPostType('feed');
    }
  }, [showPostTypeSelector, postType]);

  // Which reference image (index) a given carousel slide will use: manual override
  // if one was set, otherwise the default 1:1 cycle (image 1 -> slide 1, image 2 ->
  // slide 2, wrapping around if there are fewer images than slides).
  const slideImageIndex = (slideIndex: number): number | null => {
    if (referenceImages.length === 0) return null;
    if (slideIndex in slideImageOverrides) return slideImageOverrides[slideIndex];
    return slideIndex % referenceImages.length;
  };

  const toggleManualSlideAssignment = () => {
    setManualSlideAssignment((prev) => {
      if (prev) setSlideImageOverrides({}); // turning off -> revert to plain auto-cycle
      return !prev;
    });
  };

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
    if (referenceImages.length >= MAX_REFERENCE_IMAGES) {
      ToastService.showToast(`You can attach up to ${MAX_REFERENCE_IMAGES} reference images`, ToastTypeEnum.Error);
      return false;
    }
    const reader = new FileReader();
    reader.onload = () => {
      setReferenceImages((prev) => [...prev, { dataUrl: reader.result as string, name: file.name }]);
      if (showSuccessToast) {
        ToastService.showToast('Image uploaded successfully', ToastTypeEnum.Success);
      }
    };
    reader.readAsDataURL(file);
    return true;
  };

  const processImageFiles = (files: File[]) => {
    const room = MAX_REFERENCE_IMAGES - referenceImages.length;
    if (room <= 0) {
      ToastService.showToast(`You can attach up to ${MAX_REFERENCE_IMAGES} reference images`, ToastTypeEnum.Error);
      return;
    }
    files.slice(0, room).forEach((file) => processImageFile(file));
    if (files.length > room) {
      ToastService.showToast(
        `Only the first ${room} image(s) were added (max ${MAX_REFERENCE_IMAGES})`,
        ToastTypeEnum.Warning
      );
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;
    processImageFiles(files);
    // Reset so the same file(s) can be re-uploaded
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
      processImageFiles(files);
    }
  };

  const removeReferenceImageAt = (index: number) => {
    setReferenceImages((prev) => prev.filter((_, i) => i !== index));
    // Index shifts on removal — simplest safe behaviour is to fall back to
    // auto-cycle assignment rather than risk a stale/incorrect slide mapping.
    setSlideImageOverrides({});
  };

  // Add paste event listener
  useEffect(() => {
    BrandProfileService.get()
      .then((res) => setProfileStyles(res.responseData?.style_selections ?? []))
      .catch(() => setProfileStyles([]));
  }, []);

  useEffect(() => {
    const handleGlobalPaste = (e: ClipboardEvent) => {
      // Only handle paste if focus isn't in a text field, so we don't hijack normal text paste
      if (
        referenceImages.length < MAX_REFERENCE_IMAGES &&
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
  }, [referenceImages]);

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
        ...(useCustomCta && customCta.trim() ? { override_cta: customCta.trim() } : {}),
        ...(useStyleOverride && selectedOverrideStyles.length > 0 ? { style_override: selectedOverrideStyles } : {}),
      };
      if (referenceImages.length > 0) {
        payload.reference_images = referenceImages.map((img) => img.dataUrl);
        if (postType === 'carousel') {
          payload.slide_image_map = Array.from({ length: numSlides }, (_, i) => slideImageIndex(i));
        }
      }
      const response = await SocialMediaAgentService.generateContent(payload);

      if (response.status) {
        ToastService.showToast('Content generated! Check your Drafts tab.', ToastTypeEnum.Success);
        posthog.capture('content_generated', {
          platforms: selectedPlatforms,
          post_type: postType,
          include_images: includeImages,
          reference_image_count: referenceImages.length,
          manual_slide_assignment: postType === 'carousel' ? manualSlideAssignment : undefined,
          ...(postType === 'carousel' ? { num_slides: numSlides } : {}),
        });
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
          posthog.capture('out_of_credits', { source: 'content_generation' });
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
    // Check email verification FIRST before anything else
    const canProceed = requireEmailVerification();
    if (!canProceed) {
      return; // Modal will show, user can verify and come back
    }

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
        Reference images{' '}
        <Typography component="span" fontSize="12px" color="#9CA3AF" fontWeight={400}>
          (optional)
        </Typography>
      </Typography>
      <Typography fontSize="12px" color="#6B7280" mb={1.5}>
        Upload, drag & drop, or paste (Ctrl+V) up to {MAX_REFERENCE_IMAGES} photos to give the AI visual context — e.g.
        product shots, event images, or reference photos.
        {postType === 'carousel' && ' For carousels, each image is used on its own slide.'}
      </Typography>

      {referenceImages.length > 0 && (
        <Box display="flex" flexWrap="wrap" gap={1.25} mb={1.5}>
          {referenceImages.map((img, index) => (
            <Box
              key={index}
              sx={{
                position: 'relative',
                width: 72,
                height: 72,
                flexShrink: 0,
              }}
            >
              <Box
                sx={{
                  width: '100%',
                  height: '100%',
                  borderRadius: '8px',
                  overflow: 'hidden',
                  border: '1px solid #E5E7EB',
                }}
              >
                <Box
                  component="img"
                  src={img.dataUrl}
                  alt={img.name}
                  sx={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                />
                <Box
                  sx={{
                    position: 'absolute',
                    top: 2,
                    left: 2,
                    background: 'rgba(17,24,39,0.65)',
                    color: '#fff',
                    fontSize: '10px',
                    fontWeight: 700,
                    borderRadius: '4px',
                    px: 0.5,
                    lineHeight: '16px',
                  }}
                >
                  {index + 1}
                </Box>
              </Box>
              <IconButton
                size="small"
                onClick={() => removeReferenceImageAt(index)}
                sx={{
                  position: 'absolute',
                  top: -6,
                  right: -6,
                  background: '#fff',
                  boxShadow: '0 1px 4px rgba(0,0,0,0.25)',
                  width: 20,
                  height: 20,
                  '&:hover': { background: '#FDF2F8' },
                }}
              >
                <MdClose size={13} color="#6B7280" />
              </IconButton>
            </Box>
          ))}
          {referenceImages.length < MAX_REFERENCE_IMAGES && (
            <Box
              onClick={() => fileInputRef.current?.click()}
              onDragEnter={handleDragEnter}
              onDragLeave={handleDragLeave}
              onDragOver={handleDragOver}
              onDrop={handleDrop}
              sx={{
                width: 72,
                height: 72,
                borderRadius: '8px',
                border: isDragging ? '1.5px solid #CD1B78' : '1.5px dashed #E5E7EB',
                background: isDragging ? '#FDF2F8' : '#FAFAFA',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                flexShrink: 0,
                transition: 'all 0.15s',
                '&:hover': { borderColor: '#CD1B78', background: '#FDF2F8' },
              }}
            >
              <MdAdd size={22} color={isDragging ? '#CD1B78' : '#9CA3AF'} />
            </Box>
          )}
        </Box>
      )}

      {referenceImages.length === 0 && (
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
              {isDragging ? 'Drop images here' : 'Click, drag, or paste image(s)'}
            </Typography>
            <Typography fontSize="12px" color="#9CA3AF">
              JPG, PNG, WEBP up to 10MB each
            </Typography>
          </Box>
        </Box>
      )}
      {referenceImages.length > 0 && <Box mb={3} />}

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        multiple
        style={{ display: 'none' }}
        onChange={handleFileChange}
      />

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

          {/* Slide <-> reference image assignment */}
          {postType === 'carousel' && referenceImages.length > 0 && (
            <Box
              mt={1.5}
              sx={{ background: '#F9FAFB', border: '1px solid #E5E7EB', borderRadius: '8px', px: 1.5, py: 1.25 }}
            >
              <Box display="flex" alignItems="center" justifyContent="space-between" flexWrap="wrap" gap={1}>
                <Typography fontSize="12px" color="#4B5563">
                  {manualSlideAssignment
                    ? 'Click a slide below to choose which reference image it uses.'
                    : `By default, your images cycle across slides: ${Array.from(
                        { length: numSlides },
                        (_, i) => `Slide ${i + 1} → Image ${(slideImageIndex(i) ?? 0) + 1}`
                      ).join(', ')}.`}
                </Typography>
                <Button
                  size="small"
                  onClick={toggleManualSlideAssignment}
                  sx={{
                    textTransform: 'none',
                    fontSize: '12px',
                    fontWeight: 600,
                    color: '#CD1B78',
                    minWidth: 0,
                    px: 1,
                  }}
                >
                  {manualSlideAssignment ? 'Use default (auto)' : 'Customize per slide'}
                </Button>
              </Box>

              {manualSlideAssignment && (
                <Box display="flex" flexWrap="wrap" gap={1} mt={1}>
                  {Array.from({ length: numSlides }, (_, slideIndex) => {
                    const imgIdx = slideImageIndex(slideIndex);
                    const img = imgIdx !== null ? referenceImages[imgIdx] : null;
                    return (
                      <Box
                        key={slideIndex}
                        onClick={(e) => setAssignMenu({ anchorEl: e.currentTarget, slideIndex })}
                        sx={{
                          width: 76,
                          cursor: 'pointer',
                          borderRadius: '8px',
                          border: '1px solid #E5E7EB',
                          background: '#fff',
                          overflow: 'hidden',
                          flexShrink: 0,
                          '&:hover': { borderColor: '#CD1B78' },
                        }}
                      >
                        <Box
                          sx={{
                            width: '100%',
                            height: 56,
                            background: img ? 'transparent' : '#F3F4F6',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                          }}
                        >
                          {img ? (
                            <Box
                              component="img"
                              src={img.dataUrl}
                              alt={img.name}
                              sx={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                            />
                          ) : (
                            <MdClose size={16} color="#9CA3AF" />
                          )}
                        </Box>
                        <Typography fontSize="10px" fontWeight={600} color="#374151" textAlign="center" py={0.5}>
                          Slide {slideIndex + 1}
                        </Typography>
                      </Box>
                    );
                  })}
                </Box>
              )}
            </Box>
          )}
        </Box>
      )}

      {/* Per-slide reference image picker */}
      <Menu anchorEl={assignMenu?.anchorEl} open={!!assignMenu} onClose={() => setAssignMenu(null)}>
        <MenuItem
          onClick={() => {
            if (assignMenu) setSlideImageOverrides((prev) => ({ ...prev, [assignMenu.slideIndex]: null }));
            setAssignMenu(null);
          }}
        >
          No image for this slide
        </MenuItem>
        {referenceImages.map((img, index) => (
          <MenuItem
            key={index}
            onClick={() => {
              if (assignMenu) setSlideImageOverrides((prev) => ({ ...prev, [assignMenu.slideIndex]: index }));
              setAssignMenu(null);
            }}
            sx={{ display: 'flex', alignItems: 'center', gap: 1 }}
          >
            <Box
              component="img"
              src={img.dataUrl}
              alt={img.name}
              sx={{ width: 28, height: 28, objectFit: 'cover', borderRadius: '4px' }}
            />
            <Typography fontSize="13px">Image {index + 1}</Typography>
          </MenuItem>
        ))}
      </Menu>

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
                  : referenceImages.length > 0
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

      {/* Custom CTA for this generation only */}
      {includeImages && (
        <Box
          sx={{
            mt: 2,
            mb: 2,
            p: 2.5,
            borderRadius: '12px',
            border: '1px solid #E9D5FF',
            background: 'linear-gradient(135deg, #FEFCFF 0%, #FAF5FF 100%)',
            boxShadow: '0 1px 3px rgba(124, 58, 237, 0.08)',
          }}
        >
          <FormControlLabel
            control={
              <Checkbox
                checked={useCustomCta}
                onChange={(e) => setUseCustomCta(e.target.checked)}
                sx={{
                  color: '#CD1B78',
                  '&.Mui-checked': { color: '#CD1B78' },
                  padding: '4px',
                }}
              />
            }
            label={
              <Box display="flex" alignItems="center" gap={0.5}>
                <Typography fontSize="14px" fontWeight={600} color="#4B5563">
                  Use custom CTA for this generation only
                </Typography>
                <Tooltip
                  title="This CTA will be used only for this image generation and won't be saved to your brand playbook"
                  arrow
                  placement="top"
                >
                  <Box component="span" sx={{ display: 'flex', alignItems: 'center', cursor: 'help' }}>
                    <MdInfoOutline size={16} color="#9CA3AF" />
                  </Box>
                </Tooltip>
              </Box>
            }
            sx={{ mb: useCustomCta ? 1.5 : 0 }}
          />
          {useCustomCta && (
            <Box sx={{ pl: 4 }}>
              <TextField
                fullWidth
                size="small"
                placeholder="e.g., Flash Sale - 50% Off Today!"
                value={customCta}
                onChange={(e) => setCustomCta(e.target.value)}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    backgroundColor: '#FFFFFF',
                    borderRadius: '8px',
                    fontSize: '14px',
                    '& fieldset': {
                      borderColor: '#E5E7EB',
                    },
                    '&:hover fieldset': {
                      borderColor: '#CD1B78',
                    },
                    '&.Mui-focused fieldset': {
                      borderColor: '#CD1B78',
                      borderWidth: '2px',
                    },
                  },
                  '& .MuiInputBase-input': {
                    padding: '10px 14px',
                  },
                }}
              />
            </Box>
          )}
        </Box>
      )}

      {/* Visual style override for this generation only */}
      {includeImages && profileStyles.length > 0 && (
        <Box
          sx={{
            mt: 2,
            mb: 2,
            p: 2.5,
            borderRadius: '12px',
            border: '1px solid #E9D5FF',
            background: 'linear-gradient(135deg, #FEFCFF 0%, #FAF5FF 100%)',
            boxShadow: '0 1px 3px rgba(124, 58, 237, 0.08)',
          }}
        >
          <FormControlLabel
            control={
              <Checkbox
                checked={useStyleOverride}
                onChange={(e) => {
                  setUseStyleOverride(e.target.checked);
                  if (!e.target.checked) setSelectedOverrideStyles([]);
                }}
                sx={{
                  color: '#CD1B78',
                  '&.Mui-checked': { color: '#CD1B78' },
                  padding: '4px',
                }}
              />
            }
            label={
              <Box display="flex" alignItems="center" gap={0.5}>
                <Typography fontSize="14px" fontWeight={600} color="#4B5563">
                  Use specific styles for this generation only
                </Typography>
                <Tooltip
                  title={
                    postType === 'carousel'
                      ? "Pick which of your brand's visual styles to use. Each slide cycles through your picks in the order selected — this generation only, won't change your brand playbook."
                      : "Pick which of your brand's visual styles to use for this image — this generation only, won't change your brand playbook."
                  }
                  arrow
                  placement="top"
                >
                  <Box component="span" sx={{ display: 'flex', alignItems: 'center', cursor: 'help' }}>
                    <MdInfoOutline size={16} color="#9CA3AF" />
                  </Box>
                </Tooltip>
              </Box>
            }
            sx={{ mb: useStyleOverride ? 1.5 : 0 }}
          />
          {useStyleOverride && (
            <Box sx={{ pl: 4 }}>
              <Box display="flex" flexWrap="wrap" gap={1.25}>
                {profileStyles.map((slug) => {
                  const style = getStyle(slug);
                  const pickOrder = selectedOverrideStyles.indexOf(slug);
                  const active = pickOrder !== -1;
                  return (
                    <Box
                      key={slug}
                      onClick={() =>
                        setSelectedOverrideStyles((prev) =>
                          prev.includes(slug) ? prev.filter((s) => s !== slug) : [...prev, slug]
                        )
                      }
                      sx={{
                        position: 'relative',
                        width: 84,
                        cursor: 'pointer',
                      }}
                    >
                      <Box
                        sx={{
                          width: 84,
                          height: 56,
                          borderRadius: '8px',
                          overflow: 'hidden',
                          border: active ? '2px solid #CD1B78' : '1px solid #E5E7EB',
                          position: 'relative',
                          background: style
                            ? `linear-gradient(135deg, ${style.gradient[0]}, ${style.gradient[1]})`
                            : '#F3F4F6',
                        }}
                      >
                        {style?.image && (
                          <Box
                            component="img"
                            src={style.image}
                            alt={style.name}
                            sx={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                          />
                        )}
                        {active && (
                          <Box
                            sx={{
                              position: 'absolute',
                              top: 2,
                              left: 2,
                              background: 'rgba(205,27,120,0.9)',
                              color: '#fff',
                              fontSize: '10px',
                              fontWeight: 700,
                              borderRadius: '4px',
                              px: 0.5,
                              lineHeight: '16px',
                            }}
                          >
                            {pickOrder + 1}
                          </Box>
                        )}
                      </Box>
                      <Typography
                        fontSize="11px"
                        fontWeight={active ? 700 : 500}
                        color={active ? '#CD1B78' : '#6B7280'}
                        sx={{
                          mt: 0.5,
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {style?.name ?? slug}
                      </Typography>
                    </Box>
                  );
                })}
              </Box>
              {postType === 'carousel' && selectedOverrideStyles.length > 0 && (
                <Typography fontSize="11.5px" color="#9CA3AF" sx={{ mt: 1 }}>
                  Slides will cycle through these {selectedOverrideStyles.length} style
                  {selectedOverrideStyles.length !== 1 ? 's' : ''} in the order picked (numbered above).
                </Typography>
              )}
            </Box>
          )}
        </Box>
      )}

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
