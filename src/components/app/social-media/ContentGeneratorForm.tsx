'use client';

import { GenerateContentPayload, SocialMediaAgentService } from '@/src/api/SocialMediaAgentService';
import { BillingService } from '@/src/api/BillingService';
import { ToastTypeEnum } from '@/src/models/enum-models/ToastTypeEnum';
import { ToastService } from '@/src/utils/toast.util';
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

  // Billing modals
  const [outOfCreditsOpen, setOutOfCreditsOpen] = useState(false);
  const [lowCreditWarningOpen, setLowCreditWarningOpen] = useState(false);
  const [creditsRemaining, setCreditsRemaining] = useState<number>(0);

  // Image model picker
  const [imageModel, setImageModel] = useState<string>('');

  // No-image confirmation
  const [noImageConfirmOpen, setNoImageConfirmOpen] = useState(false);

  const showPostTypeSelector = selectedPlatforms.some((p) => p === 'instagram' || p === 'facebook');

  // Reset post type to feed if selector is hidden (no Instagram/Facebook selected)
  useEffect(() => {
    if (!showPostTypeSelector && postType !== 'feed') {
      setPostType('feed');
    }
  }, [showPostTypeSelector, postType]);

  const togglePlatform = (key: string) =>
    setSelectedPlatforms((prev) => (prev.includes(key) ? prev.filter((p) => p !== key) : [...prev, key]));

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      ToastService.showToast('Please upload an image file', ToastTypeEnum.Error);
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      ToastService.showToast('Image must be under 10MB', ToastTypeEnum.Error);
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      setReferenceImage(reader.result as string);
      setReferenceImageName(file.name);
    };
    reader.readAsDataURL(file);
    // Reset so same file can be re-uploaded
    e.target.value = '';
  };

  const removeReferenceImage = () => {
    setReferenceImage(null);
    setReferenceImageName('');
  };

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

  const doGenerate = async () => {
    setLoading(true);
    try {
      const payload: GenerateContentPayload = {
        seed_content: seedContent.trim(),
        platforms: selectedPlatforms,
        include_images: includeImages,
        ...(includeImages && imageModel ? { image_model: imageModel } : {}),
        post_type: postType,
        ...(postType === 'carousel' ? { num_slides: numSlides } : {}),
      };
      if (referenceImage) {
        payload.reference_image = referenceImage;
      }
      const response = await SocialMediaAgentService.generateContent(payload);

      if (response.status) {
        ToastService.showToast('Content generated! Check your Drafts tab.', ToastTypeEnum.Success);
        onGenerated();
        // Refresh credit count
        const balance = await BillingService.getCreditBalance();
        setCreditsRemaining(balance.credits_remaining);
      } else {
        // PRD Section 8: Handle 402 Payment Required
        if (response.responseCode === 402) {
          setOutOfCreditsOpen(true);
        } else {
          ToastService.showToast(response.responseMessage || 'Generation failed', ToastTypeEnum.Error);
        }
      }
    } catch (err: unknown) {
      const error = err as { response?: { status?: number; data?: { responseMessage?: string } } };
      // PRD Section 8: Handle 402 Payment Required from API
      if (error?.response?.status === 402) {
        setOutOfCreditsOpen(true);
      } else {
        ToastService.showToast(error?.response?.data?.responseMessage || 'Generation failed', ToastTypeEnum.Error);
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
    <Box sx={{ maxWidth: 700 }}>
      <Typography fontSize="14px" color="#374151" mb={1} fontWeight={500}>
        What do you want to post about?
      </Typography>
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
        Upload a photo to give the AI visual context — e.g. a birthday photo, product shot, or event image. The AI will
        analyse it and write more specific, niche content.
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
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 1.5,
            border: '1.5px dashed #E5E7EB',
            borderRadius: '10px',
            px: 2,
            py: 1.75,
            mb: 3,
            cursor: 'pointer',
            background: '#FAFAFA',
            transition: 'all 0.15s',
            '&:hover': { borderColor: '#CD1B78', background: '#FDF2F8' },
          }}
        >
          <Box
            sx={{
              width: 36,
              height: 36,
              borderRadius: '8px',
              background: '#F3F4F6',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <MdUpload size={20} color="#9CA3AF" />
          </Box>
          <Box>
            <Typography fontSize="13px" fontWeight={600} color="#374151">
              Upload reference image
            </Typography>
            <Typography fontSize="12px" color="#9CA3AF">
              JPG, PNG, WEBP up to 10MB
            </Typography>
          </Box>
        </Box>
      )}

      <input ref={fileInputRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleFileChange} />

      <Typography fontSize="14px" color="#374151" mb={1} fontWeight={500}>
        Target Platforms
      </Typography>
      <FormGroup row sx={{ mb: 3, gap: 1 }}>
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
              const disabled = false;
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
                    minWidth: 120,
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
                    {subtitle}
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
          border: '1px solid',
          borderColor: includeImages ? '#CD1B78' : '#E5E7EB',
          borderRadius: '10px',
          px: 2,
          py: 1.5,
          mb: 3,
          background: includeImages ? '#FDF2F8' : '#fff',
          cursor: 'pointer',
        }}
        onClick={() => setIncludeImages((v) => !v)}
      >
        <Box display="flex" alignItems="center" gap={1.5}>
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
          <Tooltip title="Uses an image generation model. Adds a few extra seconds to generation time." arrow>
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

      {/* Image model picker — only visible when image toggle is on */}
      {includeImages && (
        <Box sx={{ mt: 1.5 }}>
          <Typography fontSize="12px" fontWeight={600} color="#374151" mb={0.75}>
            Image model
          </Typography>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
            {[
              { value: '', label: 'Default (Imagen 4 Ultra)', sub: 'Current production model' },
              { value: 'fal-ai/flux-pro/v1.1', label: 'FLUX Pro v1.1', sub: 'Best fal.ai quality' },
              { value: 'fal-ai/flux/dev', label: 'FLUX Dev', sub: 'Faster · lower cost' },
              { value: 'fal-ai/ideogram/v3', label: 'Ideogram v3', sub: 'Best for text in images' },
            ].map((m) => (
              <Box
                key={m.value}
                onClick={() => setImageModel(m.value)}
                sx={{
                  px: 1.5,
                  py: 1,
                  borderRadius: 2,
                  border: '1.5px solid',
                  borderColor: imageModel === m.value ? '#CD1B78' : '#E5E7EB',
                  background: imageModel === m.value ? '#FDF2F8' : '#fff',
                  cursor: 'pointer',
                  transition: 'all 0.15s',
                  '&:hover': { borderColor: '#CD1B78' },
                }}
              >
                <Typography fontSize="12px" fontWeight={600} color={imageModel === m.value ? '#CD1B78' : '#374151'}>
                  {m.label}
                </Typography>
                <Typography fontSize="11px" color="#9CA3AF">
                  {m.sub}
                </Typography>
              </Box>
            ))}
          </Box>
        </Box>
      )}

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
    </Box>
  );
};

export default ContentGeneratorForm;
