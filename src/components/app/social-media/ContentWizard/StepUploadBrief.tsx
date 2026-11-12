'use client';

import { useRef, useState } from 'react';
import {
  Box,
  Button,
  Checkbox,
  FormControlLabel,
  IconButton,
  Menu,
  MenuItem,
  TextField,
  Typography,
} from '@mui/material';
import { MdChevronLeft, MdChevronRight, MdClose, MdImage, MdInfoOutline, MdVideocam } from 'react-icons/md';
import SlideCountPicker from '../../atoms/SlideCountPicker';
import { ContentWizardState } from './useContentWizardState';

const PINK = '#CD1B78';

// Platform(s) and post format already came from step 1 — this step only
// collects what's genuinely specific to "post my own media": the files
// themselves, optional context for the caption, and (for images) the logo
// overlay + carousel slide assignment, ported from the old standalone
// UploadContentForm with its platform/post-type pickers removed since
// they're redundant with step 1 now.
export default function StepUploadBrief({ wizard }: { wizard: ContentWizardState }) {
  const [isDragging, setIsDragging] = useState(false);
  const [assignMenu, setAssignMenu] = useState<{ anchorEl: HTMLElement; slideIndex: number } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { uploadedFiles, hasUploadedVideo, postType, numSlides } = wizard;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    wizard.addUploadFiles(Array.from(files));
    e.target.value = '';
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    if (e.dataTransfer.files) wizard.addUploadFiles(Array.from(e.dataTransfer.files));
  };

  return (
    <Box>
      <Box
        onDragEnter={(e) => {
          e.preventDefault();
          setIsDragging(true);
        }}
        onDragOver={(e) => e.preventDefault()}
        onDragLeave={(e) => {
          e.preventDefault();
          setIsDragging(false);
        }}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        sx={{
          border: isDragging ? `1.5px solid ${PINK}` : '1.5px dashed #E5E7EB',
          borderRadius: '12px',
          p: 3,
          textAlign: 'center',
          background: isDragging ? '#FDF2F8' : '#FAFAFA',
          cursor: 'pointer',
          transition: 'all 0.15s',
          mb: 2,
        }}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*,video/*"
          multiple
          onChange={handleFileChange}
          style={{ display: 'none' }}
        />
        <Box display="flex" flexDirection="column" alignItems="center" gap={1}>
          {hasUploadedVideo ? <MdVideocam size={36} color={PINK} /> : <MdImage size={36} color={PINK} />}
          <Typography fontSize="14px" fontWeight={600} color="#111827">
            Drop your {hasUploadedVideo ? 'video' : 'images'} here or click to browse
          </Typography>
          <Typography fontSize="12px" color="#6B7280">
            Images (JPG, PNG) up to 10MB · Videos (MP4) up to 100MB
          </Typography>
          <Typography fontSize="11px" color="#9CA3AF">
            {hasUploadedVideo ? '1 video only' : 'Maximum 10 images for carousel'}
          </Typography>
        </Box>
      </Box>

      {uploadedFiles.length > 0 && (
        <Box mb={2}>
          {postType === 'carousel' && uploadedFiles.length > 1 && (
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 0.75,
                mb: 1.5,
                px: 1.5,
                py: 1,
                borderRadius: '8px',
                background: 'rgba(205,27,120,.06)',
                border: '1px solid rgba(205,27,120,.2)',
              }}
            >
              <MdInfoOutline size={15} color={PINK} />
              <Typography fontSize="12px" color="#111827">
                Photos are used in this order — use the ‹ › buttons to rearrange them, and pick which photo goes on each
                slide below.
              </Typography>
            </Box>
          )}
          <Box display="flex" gap={1.5} flexWrap="wrap">
            {uploadedFiles.map((uf, idx) => {
              const isVideo = uf.file.type.startsWith('video/');
              const canReorder = !isVideo && uploadedFiles.length > 1;
              return (
                <Box key={idx} sx={{ width: 96 }}>
                  <Box
                    sx={{
                      position: 'relative',
                      width: 96,
                      height: 96,
                      borderRadius: canReorder ? '10px 10px 0 0' : '10px',
                      overflow: 'hidden',
                      border: '1.5px solid #E5E7EB',
                      borderBottom: canReorder ? 'none' : '1.5px solid #E5E7EB',
                    }}
                  >
                    {isVideo ? (
                      <Box
                        component="video"
                        src={uf.preview}
                        sx={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      />
                    ) : (
                      <Box
                        component="img"
                        src={uf.preview}
                        alt={`Upload ${idx + 1}`}
                        sx={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      />
                    )}
                    <IconButton
                      onClick={() => wizard.removeUploadFile(idx)}
                      size="small"
                      sx={{
                        position: 'absolute',
                        top: 4,
                        right: 4,
                        background: 'rgba(0,0,0,.6)',
                        color: '#fff',
                        p: '3px',
                        '&:hover': { background: 'rgba(0,0,0,.8)' },
                      }}
                    >
                      <MdClose size={14} />
                    </IconButton>
                  </Box>
                  {canReorder && (
                    <Box
                      sx={{
                        display: 'flex',
                        background: '#FDF2F8',
                        border: '1.5px solid #E5E7EB',
                        borderTop: '1px solid #F3D4E4',
                        borderRadius: '0 0 10px 10px',
                        overflow: 'hidden',
                      }}
                    >
                      <IconButton
                        onClick={() => wizard.moveUploadFile(idx, -1)}
                        disabled={idx === 0}
                        size="small"
                        sx={{ flex: 1, borderRadius: 0, color: PINK, py: '2px' }}
                      >
                        <MdChevronLeft size={16} />
                      </IconButton>
                      <IconButton
                        onClick={() => wizard.moveUploadFile(idx, 1)}
                        disabled={idx === uploadedFiles.length - 1}
                        size="small"
                        sx={{ flex: 1, borderRadius: 0, color: PINK, py: '2px' }}
                      >
                        <MdChevronRight size={16} />
                      </IconButton>
                    </Box>
                  )}
                </Box>
              );
            })}
          </Box>
        </Box>
      )}

      <Box mb={2}>
        <Typography fontSize="13px" fontWeight={600} color="#111827" mb={0.75}>
          Tell us about this content (optional)
        </Typography>
        <TextField
          fullWidth
          multiline
          rows={3}
          value={wizard.uploadContextText}
          onChange={(e) => wizard.setUploadContextText(e.target.value)}
          placeholder="E.g., 'Promoting our new summer collection' or 'Customer testimonial for our service'"
          sx={{ '& .MuiOutlinedInput-root': { fontSize: '13px' } }}
        />
      </Box>

      {!hasUploadedVideo && uploadedFiles.length > 0 && (
        <Box mb={2} sx={{ p: 2, borderRadius: '10px', border: '1px solid #E5E7EB', background: '#F9FAFB' }}>
          <FormControlLabel
            control={
              <Checkbox
                checked={wizard.addLogo}
                onChange={(e) => wizard.setAddLogo(e.target.checked)}
                sx={{ color: PINK, '&.Mui-checked': { color: PINK } }}
              />
            }
            label={
              <Box>
                <Typography fontSize="13px" fontWeight={600}>
                  Add my brand logo
                </Typography>
                <Typography fontSize="11px" color="#6B7280">
                  AI will find the best position to avoid covering content
                </Typography>
              </Box>
            }
          />
          {wizard.addLogo && (
            <Box mt={1.5} ml={4}>
              <Typography fontSize="12px" fontWeight={600} color="#111827" mb={0.5}>
                Logo Position (optional)
              </Typography>
              <select
                value={wizard.logoPositionOverride}
                onChange={(e) => wizard.setLogoPositionOverride(e.target.value)}
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  fontSize: 13,
                  border: '1px solid #E5E7EB',
                  borderRadius: 6,
                  background: '#fff',
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
            </Box>
          )}
        </Box>
      )}

      {postType === 'carousel' && !hasUploadedVideo && uploadedFiles.length > 1 && (
        <Box mb={2}>
          <SlideCountPicker value={numSlides} onChange={wizard.setNumSlides} />
          <Box
            mt={1.5}
            sx={{ background: '#F9FAFB', border: '1px solid #E5E7EB', borderRadius: '8px', px: 1.5, py: 1.25 }}
          >
            <Box display="flex" alignItems="center" justifyContent="space-between" flexWrap="wrap" gap={1}>
              <Typography fontSize="12px" color="#4B5563">
                {wizard.uploadManualSlideAssignment
                  ? 'Click a slide below to choose which photo it uses.'
                  : `By default, your photos cycle across slides: ${Array.from(
                      { length: numSlides },
                      (_, i) => `Slide ${i + 1} → Photo ${wizard.uploadSlideImageIndex(i) + 1}`
                    ).join(', ')}.`}
              </Typography>
              <Button
                size="small"
                onClick={wizard.toggleUploadManualSlideAssignment}
                sx={{ textTransform: 'none', fontSize: '12px', fontWeight: 600, color: PINK, minWidth: 0, px: 1 }}
              >
                {wizard.uploadManualSlideAssignment ? 'Use default (auto)' : 'Customize per slide'}
              </Button>
            </Box>

            {wizard.uploadManualSlideAssignment && (
              <Box display="flex" flexWrap="wrap" gap={1} mt={1}>
                {Array.from({ length: numSlides }, (_, slideIndex) => {
                  const photo = uploadedFiles[wizard.uploadSlideImageIndex(slideIndex)];
                  return (
                    <Box
                      key={slideIndex}
                      onClick={(e) => setAssignMenu({ anchorEl: e.currentTarget, slideIndex })}
                      sx={{
                        width: 72,
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
                        component="img"
                        src={photo?.preview}
                        alt={`Slide ${slideIndex + 1}`}
                        sx={{ width: '100%', height: 52, objectFit: 'cover', display: 'block' }}
                      />
                      <Typography fontSize="10px" fontWeight={600} color="#374151" textAlign="center" py={0.5}>
                        Slide {slideIndex + 1}
                      </Typography>
                    </Box>
                  );
                })}
              </Box>
            )}
          </Box>

          <Menu anchorEl={assignMenu?.anchorEl} open={!!assignMenu} onClose={() => setAssignMenu(null)}>
            {uploadedFiles.map((uf, index) => (
              <MenuItem
                key={index}
                onClick={() => {
                  if (assignMenu) {
                    wizard.setUploadSlideImageOverrides((prev) => ({ ...prev, [assignMenu.slideIndex]: index }));
                  }
                  setAssignMenu(null);
                }}
                sx={{ display: 'flex', alignItems: 'center', gap: 1 }}
              >
                <Box
                  component="img"
                  src={uf.preview}
                  alt={`Photo ${index + 1}`}
                  sx={{ width: 26, height: 26, objectFit: 'cover', borderRadius: '4px' }}
                />
                <Typography fontSize="13px">Photo {index + 1}</Typography>
              </MenuItem>
            ))}
          </Menu>
        </Box>
      )}
    </Box>
  );
}
