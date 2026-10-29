'use client';

import { useEffect, useRef, useState } from 'react';
import {
  Box,
  Button,
  Checkbox,
  CircularProgress,
  FormControlLabel,
  IconButton,
  Menu,
  MenuItem,
  Switch,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material';
import { MdAdd, MdClose, MdImage, MdInfoOutline, MdUpload } from 'react-icons/md';
import { V3Service } from '@/src/api/V3Service';
import { getStyle } from '@/src/data/styleLibrary';
import TellJane from '../../workspace/TellJane';
import { ContentWizardState, MAX_REFERENCE_IMAGES } from './useContentWizardState';

const PINK = '#CD1B78';

export default function StepBrief({ wizard }: { wizard: ContentWizardState }) {
  const [showTellJane, setShowTellJane] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [assignMenu, setAssignMenu] = useState<{ anchorEl: HTMLElement; slideIndex: number } | null>(null);
  const [v3, setV3] = useState<{ use_v3_prompts: boolean; prompt_system: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Re-fetched on this step mounting, not just once — fixes the old form's
  // gap where toggling V3 on the Playbook page never reflected back here
  // without a hard reload.
  useEffect(() => {
    V3Service.getStatus()
      .then((res) => res.responseData && setV3(res.responseData))
      .catch(() => {});
  }, []);

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) wizard.processImageFiles(files);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;
    wizard.processImageFiles(files);
    e.target.value = '';
  };

  return (
    <Box>
      {v3 && (
        <Box
          display="flex"
          alignItems="center"
          gap={1}
          mb={2}
          sx={{ background: '#F9FAFB', border: '1px solid #E5E7EB', borderRadius: '8px', px: 1.5, py: 1 }}
        >
          <Typography fontSize="12px" fontWeight={600} color={v3.use_v3_prompts ? PINK : '#6B7280'}>
            {v3.use_v3_prompts ? '✨ V3 Enabled' : 'V2 Standard'}
          </Typography>
          <Typography fontSize="11.5px" color="#9CA3AF">
            {v3.prompt_system} prompt system
          </Typography>
          <Typography
            component="a"
            href="/workspace?tab=playbook"
            sx={{ ml: 'auto', fontSize: '12px', fontWeight: 600, color: PINK, textDecoration: 'none' }}
          >
            {v3.use_v3_prompts ? 'Manage' : 'Enable V3'}
          </Typography>
        </Box>
      )}

      <Box display="flex" alignItems="center" gap={0.75} mb={1}>
        <Typography fontSize="14px" color="#374151" fontWeight={500}>
          Your Brief
        </Typography>
        <Tooltip
          title="Give the AI a topic, idea, URL, or existing text to work from. The more context you provide, the more on-brand and specific the output will be."
          arrow
        >
          <Box component="span" sx={{ display: 'inline-flex', cursor: 'help' }}>
            <MdInfoOutline size={15} color="#9CA3AF" />
          </Box>
        </Tooltip>
        <span style={{ marginLeft: 'auto' }}>
          <Button
            size="small"
            onClick={() => wizard.handleExpand()}
            disabled={wizard.expanding || wizard.seedContent.trim().length < 3}
            startIcon={wizard.expanding ? <CircularProgress size={13} color="inherit" /> : <span aria-hidden>✨</span>}
            sx={{
              textTransform: 'none',
              fontSize: '12.5px',
              fontWeight: 600,
              borderRadius: '999px',
              px: 1.5,
              color: PINK,
              background: 'rgba(205,27,120,0.08)',
              '&:hover': { background: 'rgba(205,27,120,0.14)' },
            }}
          >
            {wizard.expanding ? 'Expanding…' : 'Expand with Jane'}
          </Button>
        </span>
      </Box>
      <TextField
        placeholder="Describe the topic, share a link, or paste existing content to repurpose..."
        fullWidth
        multiline
        rows={6}
        value={wizard.seedContent}
        onChange={(e) => wizard.setSeedContent(e.target.value)}
        disabled={wizard.expanding}
        slotProps={{ htmlInput: { maxLength: 5000 } }}
        helperText={`${wizard.charCount}/5000 characters (min 10)`}
        sx={{ mb: 1 }}
      />
      {wizard.ideaBeforeExpand !== null && (
        <Box
          display="flex"
          alignItems="center"
          flexWrap="wrap"
          gap={1}
          mb={1}
          sx={{ fontSize: '12px', color: '#6B7280' }}
        >
          <span>
            ✨ Expanded with your Brand Playbook
            {wizard.expandedFrom.length ? ` (${wizard.expandedFrom.slice(0, 4).join(', ')})` : ''} — edit anything
            before generating.
          </span>
          <Typography
            component="button"
            type="button"
            onClick={wizard.undoExpand}
            sx={{
              border: 0,
              background: 'none',
              p: 0,
              cursor: 'pointer',
              fontSize: '12px',
              fontWeight: 600,
              color: PINK,
            }}
          >
            Undo
          </Typography>
          {wizard.settingsChangedSinceExpand && (
            <Box
              component="span"
              sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.75, color: '#92400E', width: '100%' }}
            >
              You changed the post settings since Jane expanded this.
              <Typography
                component="button"
                type="button"
                onClick={() => wizard.handleExpand(wizard.ideaBeforeExpand ?? undefined)}
                sx={{
                  border: 0,
                  background: 'none',
                  p: 0,
                  cursor: 'pointer',
                  fontSize: '12px',
                  fontWeight: 700,
                  color: PINK,
                }}
              >
                Re-expand for the new settings
              </Typography>
            </Box>
          )}
        </Box>
      )}

      {showTellJane ? (
        <TellJane compact source="create" />
      ) : (
        <Box mb={2.5}>
          <Typography
            component="button"
            type="button"
            onClick={() => setShowTellJane(true)}
            sx={{
              border: 'none',
              background: 'none',
              p: 0,
              cursor: 'pointer',
              fontSize: '12.5px',
              fontWeight: 600,
              color: PINK,
            }}
          >
            Want every post written a certain way? Tell Jane once →
          </Typography>
        </Box>
      )}

      <Typography fontSize="14px" color="#374151" mb={1} fontWeight={500}>
        Reference images{' '}
        <Typography component="span" fontSize="12px" color="#9CA3AF" fontWeight={400}>
          (optional)
        </Typography>
      </Typography>
      <Typography fontSize="12px" color="#6B7280" mb={1.5}>
        Upload, drag & drop, or paste (Ctrl+V) up to {MAX_REFERENCE_IMAGES} photos to give the AI visual context.
        {wizard.postType === 'carousel' && ' For carousels, each image is used on its own slide.'}
      </Typography>

      {wizard.referenceImages.length > 0 && (
        <Box display="flex" flexWrap="wrap" gap={1.25} mb={1.5}>
          {wizard.referenceImages.map((img, index) => (
            <Box key={index} sx={{ position: 'relative', width: 72, height: 72, flexShrink: 0 }}>
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
                {!img.included && <Box sx={{ position: 'absolute', inset: 0, background: 'rgba(255,255,255,0.6)' }} />}
              </Box>
              {wizard.postType !== 'carousel' && (
                <Checkbox
                  size="small"
                  checked={img.included}
                  onChange={(e) => wizard.updateReferenceImageAt(index, { included: e.target.checked })}
                  title={img.included ? 'Included in generation — click to exclude' : 'Excluded — click to include'}
                  sx={{
                    position: 'absolute',
                    bottom: -6,
                    left: -6,
                    p: 0.25,
                    background: '#fff',
                    borderRadius: '4px',
                    boxShadow: '0 1px 4px rgba(0,0,0,0.25)',
                    '& .MuiSvgIcon-root': { fontSize: 16 },
                    '&.Mui-checked': { color: PINK },
                  }}
                />
              )}
              <IconButton
                size="small"
                onClick={() => wizard.removeReferenceImageAt(index)}
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
          {wizard.referenceImages.length < MAX_REFERENCE_IMAGES && (
            <Box
              onClick={() => fileInputRef.current?.click()}
              onDragEnter={(e) => {
                e.preventDefault();
                setIsDragging(true);
              }}
              onDragLeave={(e) => {
                e.preventDefault();
                setIsDragging(false);
              }}
              onDragOver={(e) => e.preventDefault()}
              onDrop={handleDrop}
              sx={{
                width: 72,
                height: 72,
                borderRadius: '8px',
                border: isDragging ? `1.5px solid ${PINK}` : '1.5px dashed #E5E7EB',
                background: isDragging ? '#FDF2F8' : '#FAFAFA',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                flexShrink: 0,
                '&:hover': { borderColor: PINK, background: '#FDF2F8' },
              }}
            >
              <MdAdd size={22} color={isDragging ? PINK : '#9CA3AF'} />
            </Box>
          )}
        </Box>
      )}

      {wizard.postType !== 'carousel' && wizard.referenceImages.length > 1 && (
        <Box
          sx={{
            background: wizard.isCombineMode ? '#FDF2F8' : '#F9FAFB',
            border: `1px solid ${wizard.isCombineMode ? '#F3D9E8' : '#E5E7EB'}`,
            borderRadius: '8px',
            px: 1.5,
            py: 1.25,
            mb: 1.5,
          }}
        >
          <Typography
            fontSize="12px"
            fontWeight={600}
            color={wizard.isCombineMode ? '#9D174D' : '#4B5563'}
            mb={wizard.isCombineMode ? 1 : 0}
          >
            {wizard.isCombineMode
              ? `Combining ${wizard.includedCount} images into one generation`
              : wizard.includedCount === 1
                ? '1 image selected — used as the main reference'
                : 'Tick the images you want used, or leave more than one ticked to combine them'}
          </Typography>
          {wizard.isCombineMode && (
            <Box display="flex" flexDirection="column" gap={1}>
              {wizard.referenceImages.map((img, index) =>
                img.included ? (
                  <Box key={index} display="flex" alignItems="center" gap={1}>
                    <Box
                      component="img"
                      src={img.dataUrl}
                      alt={img.name}
                      sx={{ width: 32, height: 32, borderRadius: '4px', objectFit: 'cover', flexShrink: 0 }}
                    />
                    <TextField
                      size="small"
                      placeholder={`What is image ${index + 1}? (optional)`}
                      value={img.label ?? ''}
                      onChange={(e) => wizard.updateReferenceImageAt(index, { label: e.target.value })}
                      sx={{ flex: 1, '& .MuiInputBase-input': { fontSize: '12px', py: 0.75 } }}
                    />
                    <Box
                      component="label"
                      sx={{ display: 'flex', alignItems: 'center', gap: 0.5, cursor: 'pointer', flexShrink: 0 }}
                    >
                      <Checkbox
                        size="small"
                        checked={img.removeBackground ?? false}
                        onChange={(e) => wizard.updateReferenceImageAt(index, { removeBackground: e.target.checked })}
                        sx={{ p: 0.25, '& .MuiSvgIcon-root': { fontSize: 16 }, '&.Mui-checked': { color: PINK } }}
                      />
                      <Typography fontSize="11px" color="#6B7280" sx={{ whiteSpace: 'nowrap' }}>
                        Remove background
                      </Typography>
                    </Box>
                  </Box>
                ) : null
              )}
            </Box>
          )}
        </Box>
      )}

      {wizard.postType === 'carousel' && wizard.referenceImages.length > 0 && (
        <Box
          sx={{ background: '#F9FAFB', border: '1px solid #E5E7EB', borderRadius: '8px', px: 1.5, py: 1.25, mb: 1.5 }}
        >
          <Box display="flex" alignItems="center" justifyContent="space-between" flexWrap="wrap" gap={1}>
            <Typography fontSize="12px" color="#4B5563">
              {wizard.manualSlideAssignment
                ? 'Click a slide below to choose which reference image it uses.'
                : `By default, your images cycle across slides: ${Array.from(
                    { length: wizard.numSlides },
                    (_, i) => `Slide ${i + 1} → Image ${(wizard.slideImageIndex(i) ?? 0) + 1}`
                  ).join(', ')}.`}
            </Typography>
            <Button
              size="small"
              onClick={wizard.toggleManualSlideAssignment}
              sx={{ textTransform: 'none', fontSize: '12px', fontWeight: 600, color: PINK, minWidth: 0, px: 1 }}
            >
              {wizard.manualSlideAssignment ? 'Use default (auto)' : 'Customize per slide'}
            </Button>
          </Box>
          {wizard.manualSlideAssignment && (
            <Box display="flex" flexWrap="wrap" gap={1} mt={1}>
              {Array.from({ length: wizard.numSlides }, (_, slideIndex) => {
                const imgIdx = wizard.slideImageIndex(slideIndex);
                const img = imgIdx !== null ? wizard.referenceImages[imgIdx] : null;
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
                      '&:hover': { borderColor: PINK },
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

      {wizard.referenceImages.length === 0 && (
        <Box
          onClick={() => fileInputRef.current?.click()}
          onDragEnter={(e) => {
            e.preventDefault();
            setIsDragging(true);
          }}
          onDragLeave={(e) => {
            e.preventDefault();
            setIsDragging(false);
          }}
          onDragOver={(e) => e.preventDefault()}
          onDrop={handleDrop}
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 1.5,
            border: isDragging ? `1.5px solid ${PINK}` : '1.5px dashed #E5E7EB',
            borderRadius: '10px',
            px: 2,
            py: 1.75,
            mb: 2.5,
            cursor: 'pointer',
            background: isDragging ? '#FDF2F8' : '#FAFAFA',
            '&:hover': { borderColor: PINK, background: '#FDF2F8' },
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
            }}
          >
            <MdUpload size={20} color={isDragging ? PINK : '#9CA3AF'} />
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
      {wizard.referenceImages.length > 0 && <Box mb={2.5} />}

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        multiple
        style={{ display: 'none' }}
        onChange={handleFileChange}
      />

      <Menu anchorEl={assignMenu?.anchorEl} open={!!assignMenu} onClose={() => setAssignMenu(null)}>
        <MenuItem
          onClick={() => {
            if (assignMenu) wizard.setSlideImageOverrides((prev) => ({ ...prev, [assignMenu.slideIndex]: null }));
            setAssignMenu(null);
          }}
        >
          No image for this slide
        </MenuItem>
        {wizard.referenceImages.map((img, index) => (
          <MenuItem
            key={index}
            onClick={() => {
              if (assignMenu) wizard.setSlideImageOverrides((prev) => ({ ...prev, [assignMenu.slideIndex]: index }));
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
          borderColor: wizard.includeImages ? PINK : '#E5E7EB',
          borderRadius: '10px',
          px: 2,
          py: 1.5,
          mb: 2.5,
          background: wizard.includeImages ? '#FDF2F8' : '#fff',
          cursor: 'pointer',
          gap: 1,
        }}
        onClick={() => wizard.setIncludeImages(!wizard.includeImages)}
      >
        <Box display="flex" alignItems="center" gap={1.5} sx={{ flex: 1, minWidth: 0 }}>
          <Box
            sx={{
              width: 36,
              height: 36,
              borderRadius: '8px',
              background: wizard.includeImages ? PINK : '#F3F4F6',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <MdImage size={20} color={wizard.includeImages ? '#fff' : '#9CA3AF'} />
          </Box>
          <Box>
            <Typography fontSize="14px" fontWeight={600} color="#111827">
              Include AI-generated image
            </Typography>
            <Typography fontSize="12px" color="#6B7280">
              {wizard.postType === 'carousel'
                ? 'Generate an image for each carousel slide'
                : wizard.postType === 'story'
                  ? 'Generate a vertical 9:16 image for the story'
                  : wizard.referenceImages.length > 0
                    ? 'Generate an image inspired by your reference photo'
                    : 'Generate a relevant image alongside the post copy'}
            </Typography>
          </Box>
        </Box>
        <Switch
          checked={wizard.includeImages}
          onChange={(e) => {
            e.stopPropagation();
            wizard.setIncludeImages(e.target.checked);
          }}
          sx={{
            '& .MuiSwitch-switchBase.Mui-checked': { color: PINK },
            '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': { backgroundColor: PINK },
          }}
        />
      </Box>

      {wizard.includeImages && (
        <Box
          sx={{
            mt: 2,
            mb: 2,
            p: 2.5,
            borderRadius: '12px',
            border: '1px solid #E9D5FF',
            background: 'linear-gradient(135deg, #FEFCFF 0%, #FAF5FF 100%)',
          }}
        >
          <FormControlLabel
            control={
              <Checkbox
                checked={wizard.useCustomCta}
                onChange={(e) => wizard.setUseCustomCta(e.target.checked)}
                sx={{ color: PINK, '&.Mui-checked': { color: PINK }, padding: '4px' }}
              />
            }
            label={
              <Typography fontSize="14px" fontWeight={600} color="#4B5563">
                Use custom CTA for this generation only
              </Typography>
            }
            sx={{ mb: wizard.useCustomCta ? 1.5 : 0 }}
          />
          {wizard.useCustomCta && (
            <Box sx={{ pl: 4 }}>
              <TextField
                fullWidth
                size="small"
                placeholder="e.g., Flash Sale - 50% Off Today!"
                value={wizard.customCta}
                onChange={(e) => wizard.setCustomCta(e.target.value)}
              />
            </Box>
          )}
        </Box>
      )}

      {wizard.includeImages && wizard.profileStyles.length > 0 && (
        <Box
          sx={{
            mt: 2,
            mb: 2,
            p: 2.5,
            borderRadius: '12px',
            border: '1px solid #E9D5FF',
            background: 'linear-gradient(135deg, #FEFCFF 0%, #FAF5FF 100%)',
          }}
        >
          <FormControlLabel
            control={
              <Checkbox
                checked={wizard.useStyleOverride}
                onChange={(e) => {
                  wizard.setUseStyleOverride(e.target.checked);
                  if (!e.target.checked) wizard.setSelectedOverrideStyles([]);
                }}
                sx={{ color: PINK, '&.Mui-checked': { color: PINK }, padding: '4px' }}
              />
            }
            label={
              <Typography fontSize="14px" fontWeight={600} color="#4B5563">
                Use specific styles for this generation only
              </Typography>
            }
            sx={{ mb: wizard.useStyleOverride ? 1.5 : 0 }}
          />
          {wizard.useStyleOverride && (
            <Box sx={{ pl: 4 }}>
              <Box display="flex" flexWrap="wrap" gap={1.25}>
                {wizard.profileStyles.map((slug) => {
                  const style = getStyle(slug);
                  const pickOrder = wizard.selectedOverrideStyles.indexOf(slug);
                  const active = pickOrder !== -1;
                  return (
                    <Box
                      key={slug}
                      onClick={() =>
                        wizard.setSelectedOverrideStyles(
                          wizard.selectedOverrideStyles.includes(slug)
                            ? wizard.selectedOverrideStyles.filter((s) => s !== slug)
                            : [...wizard.selectedOverrideStyles, slug]
                        )
                      }
                      sx={{ position: 'relative', width: 84, cursor: 'pointer' }}
                    >
                      <Box
                        sx={{
                          width: 84,
                          height: 56,
                          borderRadius: '8px',
                          overflow: 'hidden',
                          border: active ? `2px solid ${PINK}` : '1px solid #E5E7EB',
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
                        color={active ? PINK : '#6B7280'}
                        sx={{ mt: 0.5, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
                      >
                        {style?.name ?? slug}
                      </Typography>
                    </Box>
                  );
                })}
              </Box>
            </Box>
          )}
        </Box>
      )}
    </Box>
  );
}
