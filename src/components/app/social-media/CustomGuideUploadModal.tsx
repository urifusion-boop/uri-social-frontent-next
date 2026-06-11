'use client';

import { CustomVisualGuide, CustomVisualGuideService } from '@/src/api/CustomVisualGuideService';
import { ToastService } from '@/src/utils/toast.util';
import { ToastTypeEnum } from '@/src/models/enum-models/ToastTypeEnum';
import CloseIcon from '@mui/icons-material/Close';
import {
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogContent,
  DialogTitle,
  IconButton,
  TextField,
  Typography,
} from '@mui/material';
import { useState, useRef, useCallback } from 'react';
import { FaCheckCircle, FaTimesCircle } from 'react-icons/fa';
import { MdCloudUpload, MdImage } from 'react-icons/md';
import CustomGuidePreviewCard from './CustomGuidePreviewCard';

interface UploadingImage {
  file: File;
  preview: string;
  status: 'uploading' | 'processing' | 'complete' | 'error';
  progress: number;
  error?: string;
  result?: CustomVisualGuide;
}

interface CustomGuideUploadModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess: (guides: CustomVisualGuide[]) => void;
  brandId?: string;
}

export default function CustomGuideUploadModal({ open, onClose, onSuccess, brandId }: CustomGuideUploadModalProps) {
  const [uploadingImages, setUploadingImages] = useState<UploadingImage[]>([]);
  const [guideName, setGuideName] = useState('');
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const primary = '#CD1B78';

  const handleFileSelect = (files: FileList | null) => {
    if (!files || files.length === 0) return;

    const selectedFiles = Array.from(files);

    // Validate: max 5 images total
    if (uploadingImages.length + selectedFiles.length > 5) {
      ToastService.showToast(
        `You can upload a maximum of 5 images at once. You selected ${selectedFiles.length}, but only ${5 - uploadingImages.length} slots available.`,
        ToastTypeEnum.Error
      );
      return;
    }

    // Validate each file
    const validFiles: File[] = [];
    for (const file of selectedFiles) {
      // Check file type
      if (!file.type.startsWith('image/')) {
        ToastService.showToast(`${file.name} is not an image file`, ToastTypeEnum.Error);
        continue;
      }

      // Check file size (max 10MB)
      const sizeMB = file.size / (1024 * 1024);
      if (sizeMB > 10) {
        ToastService.showToast(
          `${file.name} is too large (${sizeMB.toFixed(1)}MB). Maximum size is 10MB.`,
          ToastTypeEnum.Error
        );
        continue;
      }

      validFiles.push(file);
    }

    if (validFiles.length === 0) return;

    // Add to uploading queue
    const newUploads: UploadingImage[] = validFiles.map((file) => ({
      file,
      preview: URL.createObjectURL(file),
      status: 'uploading',
      progress: 0,
    }));

    setUploadingImages((prev) => [...prev, ...newUploads]);

    // Start uploading each file
    newUploads.forEach((upload) => {
      processImageUpload(upload);
    });
  };

  const processImageUpload = async (upload: UploadingImage) => {
    const updateUpload = (updates: Partial<UploadingImage>) => {
      setUploadingImages((prev) => prev.map((u) => (u.preview === upload.preview ? { ...u, ...updates } : u)));
    };

    try {
      // Step 1: Upload image to Cloudinary
      updateUpload({ status: 'uploading', progress: 20 });
      const imageResponse = await CustomVisualGuideService.uploadImageFile(upload.file);
      if (!imageResponse.status || !imageResponse.responseData) {
        throw new Error(imageResponse.responseMessage || 'Failed to upload image');
      }
      const imageUrl = imageResponse.responseData.url;

      // Step 2: Process reference image (9-step pipeline)
      updateUpload({ status: 'processing', progress: 50 });

      // Generate name from filename if not provided
      const name = guideName || upload.file.name.replace(/\.[^/.]+$/, '');

      const guideResponse = await CustomVisualGuideService.uploadReferenceImage(imageUrl, name, brandId);
      if (!guideResponse.status || !guideResponse.responseData) {
        throw new Error(guideResponse.responseMessage || 'Failed to create guide');
      }
      const guide = guideResponse.responseData;

      // Step 3: Complete
      updateUpload({ status: 'complete', progress: 100, result: guide });
      ToastService.showToast(`Guide "${guide.name}" created successfully!`, ToastTypeEnum.Success);
    } catch (error: unknown) {
      console.error('[CustomGuideUploadModal] Upload failed:', error);
      const err = error as { response?: { data?: { detail?: string }; status?: number }; message?: string };

      // Check if it's a duplicate error (409 Conflict)
      const errorDetail = err.response?.data?.detail || err.message || 'Upload failed';
      const isDuplicate = err.response?.status === 409 || errorDetail.includes('already uploaded');

      updateUpload({
        status: 'error',
        progress: 0,
        error: errorDetail,
      });

      if (isDuplicate) {
        ToastService.showToast(
          "⚠️ You've already uploaded this image. Find it in Brand Playbook → Custom Guides section.",
          ToastTypeEnum.Warning
        );
      } else {
        ToastService.showToast(errorDetail, ToastTypeEnum.Error);
      }
    }
  };

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setDragActive(false);
      handleFileSelect(e.dataTransfer.files);
    },
    [uploadingImages.length]
  );

  const handleClose = () => {
    // Get completed guides
    const completedGuides = uploadingImages.filter((u) => u.status === 'complete' && u.result).map((u) => u.result!);

    if (completedGuides.length > 0) {
      onSuccess(completedGuides);
    }

    // Clean up
    uploadingImages.forEach((u) => URL.revokeObjectURL(u.preview));
    setUploadingImages([]);
    setGuideName('');
    onClose();
  };

  const removeUpload = (preview: string) => {
    setUploadingImages((prev) => {
      const upload = prev.find((u) => u.preview === preview);
      if (upload) {
        URL.revokeObjectURL(upload.preview);
      }
      return prev.filter((u) => u.preview !== preview);
    });
  };

  const isUploading = uploadingImages.some((u) => u.status === 'uploading' || u.status === 'processing');
  const hasCompletedGuides = uploadingImages.some((u) => u.status === 'complete');

  return (
    <Dialog open={open} onClose={isUploading ? undefined : handleClose} maxWidth="md" fullWidth>
      <DialogTitle>
        <Box display="flex" alignItems="center" justifyContent="space-between">
          <Box display="flex" alignItems="center" gap={1.5}>
            <Box
              sx={{
                width: 40,
                height: 40,
                borderRadius: '10px',
                background: `linear-gradient(135deg, ${primary} 0%, #9B1460 100%)`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: `0 3px 10px ${primary}40`,
              }}
            >
              <MdImage color="#fff" size={20} />
            </Box>
            <Typography variant="h6" fontWeight={600}>
              Upload Custom Visual Guide
            </Typography>
          </Box>
          <IconButton onClick={handleClose} size="small" disabled={isUploading}>
            <CloseIcon />
          </IconButton>
        </Box>
      </DialogTitle>

      <DialogContent>
        <Box sx={{ py: 2 }}>
          {/* Guide Name Input */}
          <Box sx={{ mb: 3 }}>
            <Typography sx={{ fontSize: 13, fontWeight: 600, color: '#0d0e0f', mb: 1 }}>
              Guide Name (Optional)
            </Typography>
            <TextField
              fullWidth
              size="small"
              placeholder="e.g., Summer Campaign Style"
              value={guideName}
              onChange={(e) => setGuideName(e.target.value)}
              disabled={isUploading}
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: '10px',
                },
              }}
            />
            <Typography sx={{ fontSize: 12, color: '#6B7280', mt: 0.5 }}>
              If left blank, filename will be used
            </Typography>
          </Box>

          {/* Upload Area */}
          {uploadingImages.length === 0 && (
            <>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                multiple
                style={{ display: 'none' }}
                onChange={(e) => handleFileSelect(e.target.files)}
              />

              <Box
                onDragEnter={handleDrag}
                onDragOver={handleDrag}
                onDragLeave={handleDrag}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                sx={{
                  border: `2px dashed ${dragActive ? primary : `${primary}22`}`,
                  borderRadius: '16px',
                  p: 6,
                  textAlign: 'center',
                  cursor: 'pointer',
                  background: dragActive ? `${primary}10` : `${primary}05`,
                  transition: 'all 0.2s',
                  '&:hover': {
                    borderColor: `${primary}55`,
                    background: `${primary}08`,
                  },
                }}
              >
                <MdCloudUpload size={64} color={primary} style={{ marginBottom: 16 }} />
                <Typography sx={{ fontSize: 16, fontWeight: 600, color: '#0d0e0f', mb: 1 }}>
                  {dragActive ? 'Drop your images here' : 'Drag & drop images or click to browse'}
                </Typography>
                <Typography sx={{ fontSize: 13, color: '#6B7280', mb: 1 }}>
                  Upload 1-5 reference images • JPEG, PNG, WebP • Max 10MB each
                </Typography>
                <Typography sx={{ fontSize: 12, color: '#9CA3AF', fontStyle: 'italic' }}>
                  We'll analyze visual style, typography, and create a custom guide for you
                </Typography>
              </Box>
            </>
          )}

          {/* Uploading Images */}
          {uploadingImages.length > 0 && (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              {uploadingImages.map((upload) => (
                <Box
                  key={upload.preview}
                  sx={{
                    border: `2px solid ${
                      upload.status === 'complete' ? '#10B981' : upload.status === 'error' ? '#EF4444' : `${primary}22`
                    }`,
                    borderRadius: '12px',
                    p: 2,
                    background: '#fff',
                  }}
                >
                  {upload.status === 'complete' && upload.result ? (
                    // Show preview card for completed guides
                    <CustomGuidePreviewCard guide={upload.result} onRemove={() => removeUpload(upload.preview)} />
                  ) : (
                    // Show upload progress
                    <Box sx={{ display: 'flex', gap: 2 }}>
                      {/* Image Preview */}
                      <Box
                        sx={{
                          width: 80,
                          height: 80,
                          borderRadius: '8px',
                          overflow: 'hidden',
                          flexShrink: 0,
                        }}
                      >
                        <img
                          src={upload.preview}
                          alt="Preview"
                          style={{
                            width: '100%',
                            height: '100%',
                            objectFit: 'cover',
                          }}
                        />
                      </Box>

                      {/* Status */}
                      <Box sx={{ flex: 1 }}>
                        <Typography sx={{ fontSize: 14, fontWeight: 600, color: '#0d0e0f', mb: 0.5 }}>
                          {upload.file.name}
                        </Typography>
                        <Typography sx={{ fontSize: 12, color: '#6B7280', mb: 1 }}>
                          {(upload.file.size / (1024 * 1024)).toFixed(2)} MB
                        </Typography>

                        {/* Progress */}
                        {(upload.status === 'uploading' || upload.status === 'processing') && (
                          <Box>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1 }}>
                              <CircularProgress size={16} sx={{ color: primary }} />
                              <Typography sx={{ fontSize: 13, color: '#6B7280' }}>
                                {upload.status === 'uploading'
                                  ? 'Uploading image...'
                                  : 'Analyzing visual style & typography...'}
                              </Typography>
                            </Box>
                            <Box
                              sx={{
                                width: '100%',
                                height: 4,
                                background: '#f0f0f0',
                                borderRadius: 2,
                                overflow: 'hidden',
                              }}
                            >
                              <Box
                                sx={{
                                  width: `${upload.progress}%`,
                                  height: '100%',
                                  background: primary,
                                  transition: 'width 0.3s',
                                }}
                              />
                            </Box>
                          </Box>
                        )}

                        {/* Error */}
                        {upload.status === 'error' && (
                          <Box
                            sx={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: 1,
                              p: 1.5,
                              background: '#FEE2E2',
                              borderRadius: '8px',
                            }}
                          >
                            <FaTimesCircle color="#DC2626" size={16} />
                            <Typography sx={{ fontSize: 13, color: '#DC2626' }}>{upload.error}</Typography>
                          </Box>
                        )}
                      </Box>

                      {/* Remove button */}
                      {upload.status === 'error' && (
                        <IconButton size="small" onClick={() => removeUpload(upload.preview)}>
                          <CloseIcon fontSize="small" />
                        </IconButton>
                      )}
                    </Box>
                  )}
                </Box>
              ))}

              {/* Add more button */}
              {uploadingImages.length < 5 && !isUploading && (
                <Button
                  variant="outlined"
                  onClick={() => fileInputRef.current?.click()}
                  sx={{
                    textTransform: 'none',
                    fontWeight: 600,
                    borderColor: '#ddd',
                    color: primary,
                    borderRadius: '10px',
                    py: 1.5,
                    '&:hover': {
                      borderColor: primary,
                      background: `${primary}05`,
                    },
                  }}
                >
                  + Add More Images ({uploadingImages.length}/5)
                </Button>
              )}
            </Box>
          )}

          {/* Info message */}
          {uploadingImages.length === 0 && (
            <Box
              sx={{
                mt: 3,
                p: 2,
                background: '#F3F4F6',
                borderRadius: '10px',
                border: '1px solid #E5E7EB',
              }}
            >
              <Typography sx={{ fontSize: 12, color: '#374151', lineHeight: 1.6 }}>
                <strong>What happens next:</strong>
                <br />
                • We'll analyze your image's visual style (colors, lighting, composition)
                <br />
                • Extract typography characteristics and match to available fonts
                <br />
                • Create a custom guide you can use for future content generation
                <br />• Processing takes ~10-20 seconds per image
              </Typography>
            </Box>
          )}

          {/* Action buttons */}
          {hasCompletedGuides && (
            <Box sx={{ mt: 3, display: 'flex', gap: 2 }}>
              <Button
                variant="contained"
                onClick={handleClose}
                disabled={isUploading}
                sx={{
                  flex: 1,
                  background: primary,
                  color: '#fff',
                  textTransform: 'none',
                  fontWeight: 600,
                  borderRadius: '10px',
                  py: 1.5,
                  '&:hover': { background: '#B01667' },
                }}
              >
                Done ({uploadingImages.filter((u) => u.status === 'complete').length} guides created)
              </Button>
            </Box>
          )}
        </Box>
      </DialogContent>
    </Dialog>
  );
}
