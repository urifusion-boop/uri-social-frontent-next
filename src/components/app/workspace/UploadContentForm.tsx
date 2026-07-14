'use client';

import { SocialMediaAgentService } from '@/src/api/SocialMediaAgentService';
import { BillingService } from '@/src/api/BillingService';
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
  IconButton,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material';
import { useRef, useState, useEffect } from 'react';
import { FaFacebook, FaInstagram, FaLinkedin, FaTwitter } from 'react-icons/fa';
import { MdChevronLeft, MdChevronRight, MdClose, MdImage, MdInfoOutline, MdUpload, MdVideocam } from 'react-icons/md';
import OutOfCreditsModal from '../atoms/OutOfCreditsModal';
import LowCreditWarning from '../atoms/LowCreditWarning';

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
  { key: 'carousel', label: 'Carousel', icon: '🎠', subtitle: '2–5 swipeable slides' },
  { key: 'story', label: 'Story', icon: '📱', subtitle: '24-hour full-screen story' },
];

interface UploadContentFormProps {
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
  if (lower.includes('timeout') || lower.includes('timed out'))
    return 'We are experiencing high demand right now, please try again in a few minutes — if the issue persists, contact support.';
  return 'Something went wrong — if the issue persists, contact support.';
}

const UploadContentForm = ({ onGenerated, requireEmailVerification }: UploadContentFormProps) => {
  const [contextText, setContextText] = useState('');
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>(['facebook']);
  const [loading, setLoading] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<Array<{ file: File; preview: string }>>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [postType, setPostType] = useState<'feed' | 'carousel' | 'story'>('feed');
  const [isDragging, setIsDragging] = useState(false);

  // Overlay options
  const [addLogo, setAddLogo] = useState(false);
  const [addCTA, setAddCTA] = useState(false);
  const [customCTA, setCustomCTA] = useState('');
  const [logoPositionOverride, setLogoPositionOverride] = useState('');

  // Billing modals
  const [outOfCreditsOpen, setOutOfCreditsOpen] = useState(false);
  const [lowCreditWarningOpen, setLowCreditWarningOpen] = useState(false);
  const [creditsRemaining, setCreditsRemaining] = useState<number>(0);

  const showPostTypeSelector = selectedPlatforms.some((p) => p === 'instagram' || p === 'facebook' || p === 'linkedin');

  // Reset post type to feed if selector is hidden
  useEffect(() => {
    if (!showPostTypeSelector && postType !== 'feed') {
      setPostType('feed');
    }
  }, [showPostTypeSelector, postType]);

  // Disable carousel if less than 2 images uploaded
  useEffect(() => {
    if (postType === 'carousel' && uploadedFiles.length < 2) {
      setPostType('feed');
    }
  }, [uploadedFiles.length, postType]);

  const togglePlatform = (key: string) =>
    setSelectedPlatforms((prev) => (prev.includes(key) ? prev.filter((p) => p !== key) : [...prev, key]));

  const processFile = (file: File): boolean => {
    // Check if it's image or video
    const isImage = file.type.startsWith('image/');
    const isVideo = file.type.startsWith('video/');

    if (!isImage && !isVideo) {
      ToastService.showToast('Please upload an image or video file', ToastTypeEnum.Error);
      return false;
    }

    // Size limits
    if (isImage && file.size > 10 * 1024 * 1024) {
      ToastService.showToast('Image must be under 10MB', ToastTypeEnum.Error);
      return false;
    }
    if (isVideo && file.size > 100 * 1024 * 1024) {
      ToastService.showToast('Video must be under 100MB', ToastTypeEnum.Error);
      return false;
    }

    // If video, only allow 1 file
    if (isVideo && uploadedFiles.length > 0) {
      ToastService.showToast('Only one video can be uploaded at a time', ToastTypeEnum.Error);
      return false;
    }

    // If image, max 5 for carousel
    if (isImage && uploadedFiles.length >= 5) {
      ToastService.showToast('Maximum 5 images allowed', ToastTypeEnum.Error);
      return false;
    }

    // If already have video, can't add more
    if (uploadedFiles.length > 0 && uploadedFiles[0].file.type.startsWith('video/')) {
      ToastService.showToast('Remove video first to upload images', ToastTypeEnum.Error);
      return false;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setUploadedFiles((prev) => [...prev, { file, preview: reader.result as string }]);
    };
    reader.readAsDataURL(file);
    return true;
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    Array.from(files).forEach(processFile);
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

    const files = e.dataTransfer.files;
    if (!files) return;
    Array.from(files).forEach(processFile);
  };

  const removeFile = (index: number) => {
    setUploadedFiles((prev) => prev.filter((_, i) => i !== index));
  };

  // Carousel slide order = upload order, sent to the backend 1:1 (each image
  // becomes exactly one slide). This lets the user fix that order directly
  // instead of having to remove and re-add images to resequence them.
  const moveFile = (index: number, direction: -1 | 1) => {
    setUploadedFiles((prev) => {
      const target = index + direction;
      if (target < 0 || target >= prev.length) return prev;
      const next = [...prev];
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });
  };

  // Check credits before generation
  useEffect(() => {
    const checkCredits = async () => {
      try {
        const balance = await BillingService.getCreditBalance();
        setCreditsRemaining(balance.credits_remaining);
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
      // Convert files to base64 for upload
      const mediaBase64Array = uploadedFiles.map((uf) => uf.preview);

      const payload = {
        uploaded_media: mediaBase64Array,
        context_text: contextText.trim(),
        platforms: selectedPlatforms,
        post_type: postType,
        add_logo: addLogo,
        add_cta: addCTA,
        custom_cta: customCTA.trim(),
        logo_position_override: logoPositionOverride,
      };

      const response = await SocialMediaAgentService.uploadUserContent(payload);

      if (response.status) {
        ToastService.showToast('Caption generated! Check your Drafts tab.', ToastTypeEnum.Success);
        posthog.capture('user_content_uploaded', {
          platforms: selectedPlatforms,
          post_type: postType,
          num_files: uploadedFiles.length,
          has_context: !!contextText.trim(),
        });
        onGenerated();

        // Emit credit consumed event
        EventBus.emit(EVENTS.CREDIT_CONSUMED, {
          amount: 0.5,
          operation: 'upload_content',
        });

        // Update credits
        const balance = await BillingService.getCreditBalance();
        setCreditsRemaining(balance.credits_remaining);

        // Reset form
        setUploadedFiles([]);
        setContextText('');
      } else {
        if (response.responseCode === 402) {
          posthog.capture('out_of_credits', { source: 'upload_content' });
          setOutOfCreditsOpen(true);
        } else {
          ToastService.showToast(_friendlyGenerationError(response.responseMessage), ToastTypeEnum.Error);
        }
      }
    } catch (err: unknown) {
      const error = err as { response?: { status?: number; data?: { responseMessage?: string } } };
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
    console.log('🔵 Generate button clicked!');
    console.log('Uploaded files:', uploadedFiles.length);
    console.log('Selected platforms:', selectedPlatforms);

    // Check email verification first
    if (!requireEmailVerification()) {
      console.log('❌ Email verification required');
      return;
    }

    if (uploadedFiles.length === 0) {
      console.log('❌ No files uploaded');
      ToastService.showToast('Please upload at least one image or video', ToastTypeEnum.Error);
      return;
    }

    if (selectedPlatforms.length === 0) {
      console.log('❌ No platforms selected');
      ToastService.showToast('Please select at least one platform', ToastTypeEnum.Error);
      return;
    }

    console.log('✅ Starting content generation...');
    await doGenerate();
  };

  const hasVideo = uploadedFiles.length > 0 && uploadedFiles[0].file.type.startsWith('video/');

  return (
    <Box>
      {/* Upload Zone */}
      <Box
        onDragEnter={handleDragEnter}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        sx={{
          border: isDragging ? '2px dashed #CD1B78' : '2px dashed #E5E7EB',
          borderRadius: 3,
          padding: 4,
          textAlign: 'center',
          backgroundColor: isDragging ? 'rgba(205, 27, 120, 0.05)' : '#FAFAFA',
          cursor: 'pointer',
          transition: 'all 0.2s',
          marginBottom: 2,
        }}
        onClick={() => fileInputRef.current?.click()}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*,video/*"
          multiple
          onChange={handleFileChange}
          style={{ display: 'none' }}
        />
        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1 }}>
          {hasVideo ? <MdVideocam size={48} color="#CD1B78" /> : <MdImage size={48} color="#CD1B78" />}
          <Typography sx={{ fontSize: 15, fontWeight: 600, color: '#111' }}>
            Drop your {hasVideo ? 'video' : 'images'} here or click to browse
          </Typography>
          <Typography sx={{ fontSize: 13, color: '#6B7280' }}>
            Images (JPG, PNG) up to 10MB • Videos (MP4) up to 100MB
          </Typography>
          <Typography sx={{ fontSize: 12, color: '#9CA3AF' }}>
            {hasVideo ? '1 video only' : 'Maximum 5 images for carousel'}
          </Typography>
        </Box>
      </Box>

      {/* Uploaded Files Preview */}
      {uploadedFiles.length > 0 && (
        <Box sx={{ marginBottom: 2 }}>
          {postType === 'carousel' && uploadedFiles.length > 1 && (
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 0.75,
                marginBottom: 1.5,
                padding: '8px 12px',
                borderRadius: 1.5,
                backgroundColor: 'rgba(205, 27, 120, 0.06)',
                border: '1px solid rgba(205, 27, 120, 0.2)',
              }}
            >
              <MdInfoOutline size={16} color="#CD1B78" />
              <Typography sx={{ fontSize: 12.5, color: '#111', fontWeight: 500 }}>
                This is your carousel's slide order — use the ‹ › buttons below each photo to rearrange them.
              </Typography>
            </Box>
          )}
          <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
            {uploadedFiles.map((uf, idx) => {
              const isVideo = uf.file.type.startsWith('video/');
              const canReorder = !isVideo && uploadedFiles.length > 1;
              return (
                <Box key={idx} sx={{ width: 110 }}>
                  <Box
                    sx={{
                      position: 'relative',
                      width: 110,
                      height: 110,
                      borderRadius: 2,
                      overflow: 'hidden',
                      border: '2px solid #E5E7EB',
                    }}
                  >
                    {isVideo ? (
                      <video src={uf.preview} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    ) : (
                      <img
                        src={uf.preview}
                        alt={`Upload ${idx + 1}`}
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      />
                    )}
                    <Typography
                      sx={{
                        position: 'absolute',
                        top: 6,
                        left: 6,
                        backgroundColor: '#CD1B78',
                        color: '#fff',
                        fontSize: 11,
                        fontWeight: 700,
                        padding: '3px 8px',
                        borderRadius: 1,
                      }}
                    >
                      {postType === 'carousel' ? `Slide ${idx + 1}` : `${idx + 1} of ${uploadedFiles.length}`}
                    </Typography>
                    <IconButton
                      onClick={() => removeFile(idx)}
                      sx={{
                        position: 'absolute',
                        top: 4,
                        right: 4,
                        backgroundColor: 'rgba(0,0,0,0.6)',
                        color: '#fff',
                        padding: '4px',
                        '&:hover': { backgroundColor: 'rgba(0,0,0,0.8)' },
                      }}
                    >
                      <MdClose size={16} />
                    </IconButton>
                  </Box>
                  {/* Reorder controls live BELOW the thumbnail, not on top of it — always
                      legible regardless of what's in the photo. */}
                  {canReorder && (
                    <Box
                      sx={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: 0.5,
                        marginTop: 0.5,
                        padding: '4px 6px',
                        borderRadius: 1.5,
                        backgroundColor: '#F3F4F6',
                        border: '1px solid #E5E7EB',
                      }}
                    >
                      <IconButton
                        onClick={() => moveFile(idx, -1)}
                        disabled={idx === 0}
                        size="small"
                        sx={{
                          color: '#374151',
                          padding: '2px',
                          '&:hover': { backgroundColor: '#E5E7EB' },
                          '&.Mui-disabled': { color: '#D1D5DB' },
                        }}
                      >
                        <MdChevronLeft size={20} />
                      </IconButton>
                      <Typography sx={{ fontSize: 11, color: '#6B7280', fontWeight: 500 }}>Move</Typography>
                      <IconButton
                        onClick={() => moveFile(idx, 1)}
                        disabled={idx === uploadedFiles.length - 1}
                        size="small"
                        sx={{
                          color: '#374151',
                          padding: '2px',
                          '&:hover': { backgroundColor: '#E5E7EB' },
                          '&.Mui-disabled': { color: '#D1D5DB' },
                        }}
                      >
                        <MdChevronRight size={20} />
                      </IconButton>
                    </Box>
                  )}
                </Box>
              );
            })}
          </Box>
        </Box>
      )}

      {/* Context Text Input */}
      <Box sx={{ marginBottom: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, marginBottom: 1 }}>
          <Typography sx={{ fontSize: 13, fontWeight: 600, color: '#111' }}>
            Tell us about this content (optional)
          </Typography>
          <Tooltip title="Provide context to help AI write better captions. E.g., 'Promoting our new product launch' or 'Behind-the-scenes from workshop'">
            <Box sx={{ display: 'flex', alignItems: 'center', cursor: 'help' }}>
              <MdInfoOutline size={16} color="#9CA3AF" />
            </Box>
          </Tooltip>
        </Box>
        <TextField
          fullWidth
          multiline
          rows={3}
          value={contextText}
          onChange={(e) => setContextText(e.target.value)}
          placeholder="E.g., 'Promoting our new summer collection' or 'Customer testimonial for our service'"
          sx={{
            '& .MuiOutlinedInput-root': {
              fontSize: 13,
              '& fieldset': { borderColor: '#E5E7EB' },
              '&:hover fieldset': { borderColor: '#CD1B78' },
              '&.Mui-focused fieldset': { borderColor: '#CD1B78' },
            },
          }}
        />
      </Box>

      {/* Overlay Options */}
      {!hasVideo && uploadedFiles.length > 0 && (
        <Box sx={{ marginBottom: 2 }}>
          <Typography sx={{ fontSize: 13, fontWeight: 600, color: '#111', marginBottom: 1 }}>
            Overlay Options (Optional)
          </Typography>
          <Box
            sx={{
              padding: 2,
              backgroundColor: '#F9FAFB',
              borderRadius: 2,
              border: '1px solid #E5E7EB',
            }}
          >
            <FormControlLabel
              control={
                <Checkbox
                  checked={addLogo}
                  onChange={(e) => setAddLogo(e.target.checked)}
                  sx={{
                    color: '#CD1B78',
                    '&.Mui-checked': { color: '#CD1B78' },
                  }}
                />
              }
              label={
                <Box>
                  <Typography sx={{ fontSize: 13, fontWeight: 600 }}>Add my brand logo</Typography>
                  <Typography sx={{ fontSize: 11, color: '#6B7280' }}>
                    AI will find the best position to avoid covering content
                  </Typography>
                </Box>
              }
            />

            {addLogo && (
              <Box sx={{ marginTop: 1.5, marginLeft: 4 }}>
                <Typography sx={{ fontSize: 12, fontWeight: 600, color: '#111', marginBottom: 0.5 }}>
                  Logo Position (Optional)
                </Typography>
                <select
                  value={logoPositionOverride}
                  onChange={(e) => setLogoPositionOverride(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    fontSize: '13px',
                    border: '1px solid #E5E7EB',
                    borderRadius: '6px',
                    backgroundColor: '#fff',
                    cursor: 'pointer',
                  }}
                >
                  <option value="">Auto (AI will choose best position)</option>
                  <option value="top_left">Top Left</option>
                  <option value="top_center">Top Center</option>
                  <option value="top_right">Top Right</option>
                  <option value="bottom_left">Bottom Left</option>
                  <option value="bottom_center">Bottom Center</option>
                  <option value="bottom_right">Bottom Right</option>
                </select>
                <Typography sx={{ fontSize: 11, color: '#9CA3AF', marginTop: 0.5 }}>
                  Leave as "Auto" to let AI choose the position that won't cover important content
                </Typography>
              </Box>
            )}

            {/* CTA overlay temporarily hidden - quality issues with text rendering */}
            {false && (
              <>
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={addCTA}
                      onChange={(e) => setAddCTA(e.target.checked)}
                      sx={{
                        color: '#CD1B78',
                        '&.Mui-checked': { color: '#CD1B78' },
                      }}
                    />
                  }
                  label={
                    <Box>
                      <Typography sx={{ fontSize: 13, fontWeight: 600 }}>Add CTA overlay</Typography>
                      <Typography sx={{ fontSize: 11, color: '#6B7280' }}>
                        AI will add CTA text in the best position without covering content
                      </Typography>
                    </Box>
                  }
                />

                {addCTA && (
                  <Box sx={{ marginTop: 1.5, marginLeft: 4 }}>
                    <TextField
                      fullWidth
                      size="small"
                      value={customCTA}
                      onChange={(e) => setCustomCTA(e.target.value)}
                      placeholder="Custom CTA (or leave blank for default)"
                      sx={{
                        '& .MuiOutlinedInput-root': {
                          fontSize: 13,
                          backgroundColor: '#fff',
                          '& fieldset': { borderColor: '#E5E7EB' },
                          '&:hover fieldset': { borderColor: '#CD1B78' },
                          '&.Mui-focused fieldset': { borderColor: '#CD1B78' },
                        },
                      }}
                    />
                    <Typography sx={{ fontSize: 11, color: '#9CA3AF', marginTop: 0.5 }}>
                      Leave blank to use your default CTA from brand profile
                    </Typography>
                  </Box>
                )}
              </>
            )}
          </Box>
        </Box>
      )}

      {/* Platform Selection */}
      <Box sx={{ marginBottom: 2 }}>
        <Typography sx={{ fontSize: 13, fontWeight: 600, color: '#111', marginBottom: 1 }}>Select Platforms</Typography>
        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
          {PLATFORMS.map((platform) => (
            <FormControlLabel
              key={platform.key}
              control={
                <Checkbox
                  checked={selectedPlatforms.includes(platform.key)}
                  onChange={() => togglePlatform(platform.key)}
                  sx={{
                    color: '#CD1B78',
                    '&.Mui-checked': { color: '#CD1B78' },
                  }}
                />
              }
              label={
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
                  {platform.icon}
                  <Typography sx={{ fontSize: 13 }}>{platform.label}</Typography>
                </Box>
              }
            />
          ))}
        </Box>
      </Box>

      {/* Post Type Selection */}
      {showPostTypeSelector && !hasVideo && (
        <Box sx={{ marginBottom: 2 }}>
          <Typography sx={{ fontSize: 13, fontWeight: 600, color: '#111', marginBottom: 1 }}>Post Type</Typography>
          <Box sx={{ display: 'flex', gap: 1.5 }}>
            {POST_TYPES.map((type) => {
              const isDisabled = type.key === 'carousel' && uploadedFiles.length < 2;
              return (
                <Box
                  key={type.key}
                  onClick={() => !isDisabled && setPostType(type.key)}
                  sx={{
                    flex: 1,
                    padding: 2,
                    borderRadius: 2,
                    border: postType === type.key ? '2px solid #CD1B78' : '1.5px solid #E5E7EB',
                    backgroundColor: postType === type.key ? 'rgba(205, 27, 120, 0.05)' : '#fff',
                    cursor: isDisabled ? 'not-allowed' : 'pointer',
                    opacity: isDisabled ? 0.5 : 1,
                    transition: 'all 0.15s',
                  }}
                >
                  <Typography sx={{ fontSize: 24, marginBottom: 0.5 }}>{type.icon}</Typography>
                  <Typography sx={{ fontSize: 13, fontWeight: 600, color: '#111' }}>{type.label}</Typography>
                  <Typography sx={{ fontSize: 11, color: '#6B7280' }}>{type.subtitle}</Typography>
                  {isDisabled && (
                    <Typography sx={{ fontSize: 10, color: '#EF4444', marginTop: 0.5 }}>Upload 2+ images</Typography>
                  )}
                </Box>
              );
            })}
          </Box>
        </Box>
      )}

      {/* Generate Button */}
      <Button
        fullWidth
        variant="contained"
        onClick={handleGenerate}
        disabled={loading || uploadedFiles.length === 0}
        sx={{
          background: 'linear-gradient(135deg, #CD1B78 0%, #A01560 100%)',
          color: '#fff',
          fontWeight: 600,
          fontSize: 14,
          padding: '12px',
          borderRadius: 2,
          textTransform: 'none',
          '&:hover': {
            background: 'linear-gradient(135deg, #B01869 0%, #8B1350 100%)',
          },
          '&:disabled': {
            background: '#E5E7EB',
            color: '#9CA3AF',
          },
        }}
      >
        {loading ? (
          <>
            <CircularProgress size={20} sx={{ color: '#fff', marginRight: 1 }} />
            Generating Caption...
          </>
        ) : (
          'Generate Caption'
        )}
      </Button>

      {/* Modals */}
      <OutOfCreditsModal open={outOfCreditsOpen} onClose={() => setOutOfCreditsOpen(false)} />
      <LowCreditWarning
        open={lowCreditWarningOpen}
        onClose={() => setLowCreditWarningOpen(false)}
        creditsRemaining={creditsRemaining}
      />
    </Box>
  );
};

export default UploadContentForm;
