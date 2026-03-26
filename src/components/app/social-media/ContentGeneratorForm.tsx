'use client';

import { GenerateContentPayload, SocialMediaAgentService } from '@/src/api/SocialMediaAgentService';
import { ToastTypeEnum } from '@/src/models/enum-models/ToastTypeEnum';
import { ToastService } from '@/src/utils/toast.util';
import { Box, Button, Checkbox, CircularProgress, FormControlLabel, FormGroup, IconButton, Switch, TextField, Tooltip, Typography } from '@mui/material';
import { useRef, useState } from 'react';
import { FaFacebook, FaInstagram, FaLinkedin, FaTwitter } from 'react-icons/fa';
import { MdClose, MdImage, MdInfoOutline, MdUpload } from 'react-icons/md';

const PLATFORMS = [
  { key: 'facebook', label: 'Facebook', icon: <FaFacebook size={16} color="#1877F2" /> },
  { key: 'instagram', label: 'Instagram', icon: <FaInstagram size={16} color="#E1306C" /> },
  { key: 'twitter', label: 'Twitter / X', icon: <FaTwitter size={16} color="#1DA1F2" /> },
  { key: 'linkedin', label: 'LinkedIn', icon: <FaLinkedin size={16} color="#0A66C2" /> },
];

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

  const togglePlatform = (key: string) => setSelectedPlatforms((prev) => (prev.includes(key) ? prev.filter((p) => p !== key) : [...prev, key]));

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

  const handleGenerate = async () => {
    if (seedContent.trim().length < 10) {
      ToastService.showToast('Seed content must be at least 10 characters', ToastTypeEnum.Error);
      return;
    }
    if (selectedPlatforms.length === 0) {
      ToastService.showToast('Select at least one platform', ToastTypeEnum.Error);
      return;
    }

    setLoading(true);
    try {
      const payload: GenerateContentPayload = {
        seed_content: seedContent.trim(),
        platforms: selectedPlatforms,
        include_images: includeImages,
      };
      if (referenceImage) {
        payload.reference_image = referenceImage;
      }
      const response = await SocialMediaAgentService.generateContent(payload);

      if (response.status) {
        ToastService.showToast('Content generated! Check your Drafts tab.', ToastTypeEnum.Success);
        onGenerated();
      } else {
        ToastService.showToast(response.responseMessage || 'Generation failed', ToastTypeEnum.Error);
      }
    } catch (err: any) {
      ToastService.showToast(err?.data?.responseMessage || 'Generation failed', ToastTypeEnum.Error);
    } finally {
      setLoading(false);
    }
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
        inputProps={{ maxLength: 5000 }}
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
        Upload a photo to give the AI visual context — e.g. a birthday photo, product shot, or event image. The AI will analyse it and write more specific, niche content.
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
          <Box sx={{ width: 36, height: 36, borderRadius: '8px', background: '#F3F4F6', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
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
            control={<Checkbox checked={selectedPlatforms.includes(key)} onChange={() => togglePlatform(key)} size="small" sx={{ '&.Mui-checked': { color: '#CD1B78' } }} />}
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
          <Box sx={{ width: 36, height: 36, borderRadius: '8px', background: includeImages ? '#CD1B78' : '#F3F4F6', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <MdImage size={20} color={includeImages ? '#fff' : '#9CA3AF'} />
          </Box>
          <Box>
            <Typography fontSize="14px" fontWeight={600} color="#111827">
              Include AI-generated image
            </Typography>
            <Typography fontSize="12px" color="#6B7280">
              {referenceImage ? 'Generate an image inspired by your reference photo' : 'Generate a relevant image alongside the post copy'}
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
    </Box>
  );
};

export default ContentGeneratorForm;
