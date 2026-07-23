'use client';

import { CustomVisualGuideV2, CustomVisualGuideV2Service } from '@/src/api/CustomVisualGuideV2Service';
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
import { FaTimesCircle } from 'react-icons/fa';
import { MdCloudUpload, MdImage } from 'react-icons/md';
import CustomGuideV2PreviewCard from './CustomGuideV2PreviewCard';

interface UploadingImage {
  file: File;
  preview: string;
  status: 'uploading' | 'processing' | 'complete' | 'error';
  progress: number;
  error?: string;
  result?: CustomVisualGuideV2;
}

interface CustomGuideV2UploadModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess: (guides: CustomVisualGuideV2[]) => void;
  brandId?: string;
}

export default function CustomGuideV2UploadModal({ open, onClose, onSuccess, brandId }: CustomGuideV2UploadModalProps) {
  const [uploadingImages, setUploadingImages] = useState<UploadingImage[]>([]);
  const [guideName, setGuideName] = useState('');
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const primary = '#8B5CF6'; // Purple for V2

  const handleFileSelect = (files: FileList | null) => {
    if (!files || files.length === 0) return;

    const selectedFiles = Array.from(files);

    // Validate: max 3 images for V2 (style extraction is more intensive)
    if (uploadingImages.length + selectedFiles.length > 3) {
      ToastService.showToast(
        `You can upload a maximum of 3 style references at once. You selected ${selectedFiles.length}, but only ${3 - uploadingImages.length} slots available.`,
        ToastTypeEnum.Error
      );
      return;
    }

    // Validate each file
    const validFiles: File[] = [];
    for (const file of selectedFiles) {
      if (!file.type.startsWith('image/')) {
        ToastService.showToast(`${file.name} is not an image file`, ToastTypeEnum.Error);
        continue;
      }

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
      processImageUploadV2(upload);
    });
  };

  const processImageUploadV2 = async (upload: UploadingImage) => {
    const updateUpload = (updates: Partial<UploadingImage>) => {
      setUploadingImages((prev) => prev.map((u) => (u.preview === upload.preview ? { ...u, ...updates } : u)));
    };

    try {
      // Step 1: Upload image to Cloudinary
      updateUpload({ status: 'uploading', progress: 20 });
      const imageResponse = await CustomVisualGuideV2Service.uploadImageFile(upload.file);
      if (!imageResponse.status || !imageResponse.responseData) {
        throw new Error(imageResponse.responseMessage || 'Failed to upload image');
      }
      const imageUrl = imageResponse.responseData.url;

      // Step 2: Process with V2 service (GPT-4o Vision style extraction)
      updateUpload({ status: 'processing', progress: 50 });

      const name = guideName || upload.file.name.replace(/\.[^/.]+$/, '');

      const guideResponse = await CustomVisualGuideV2Service.uploadReferenceImageV2(imageUrl, name, brandId);
      if (!guideResponse.status || !guideResponse.responseData) {
        throw new Error(guideResponse.responseMessage || 'Failed to create V2 guide');
      }
      const guide = guideResponse.responseData;

      // Step 3: Complete
      updateUpload({ status: 'complete', progress: 100, result: guide });
      ToastService.showToast(`Style Guide "${guide.name}" created successfully!`, ToastTypeEnum.Success);
    } catch (error: unknown) {
      console.error('[V2Upload] Upload failed:', error);

      const err = error as {
        data?: { detail?: string };
        status?: number;
        response?: { data?: { detail?: string }; status?: number };
        message?: string;
      };

      let errorDetail = err.data?.detail || err.response?.data?.detail || err.message || 'Upload failed';
      errorDetail = errorDetail.replace(/^\d{3}:\s*/, '');

      const errorLower = errorDetail.toLowerCase();
      let userMessage = errorDetail;

      if (errorLower.includes('already uploaded') || errorLower.includes('duplicate')) {
        userMessage = "⚠️ You've already uploaded this image. Find it in your V2 Style Guides.";
      } else if (errorLower.includes('limit') || errorLower.includes('reached')) {
        userMessage = "⚠️ You've reached your V2 style guide limit. Please delete an existing guide.";
      } else if (errorLower.includes('failed to extract')) {
        userMessage = '🔍 Could not analyze this image style. Please try a different, clearer image.';
      }

      updateUpload({
        status: 'error',
        progress: 0,
        error: userMessage,
      });
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
    [handleFileSelect]
  );

  const handleClose = () => {
    const completedGuides = uploadingImages.filter((u) => u.status === 'complete' && u.result).map((u) => u.result!);

    if (completedGuides.length > 0) {
      onSuccess(completedGuides);
    }

    uploadingImages.forEach((u) => URL.revokeObjectURL(u.preview));
    setUploadingImages([]);
    setGuideName('');
    onClose();
  };

  const removeUpload = async (preview: string) => {
    const upload = uploadingImages.find((u) => u.preview === preview);

    // If the upload completed and has a guide ID, delete it from the backend
    if (upload?.status === 'complete' && upload.result?.id) {
      try {
        await CustomVisualGuideV2Service.archiveGuideV2(upload.result.id);
        ToastService.showToast('Style guide deleted successfully', ToastTypeEnum.Success);
      } catch (error) {
        console.error('Failed to delete guide:', error);
        ToastService.showToast('Failed to delete style guide', ToastTypeEnum.Error);
        return; // Don't remove from UI if backend deletion failed
      }
    }

    // Remove from upload list and clean up preview URL
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
                background: `linear-gradient(135deg, ${primary} 0%, #EC4899 100%)`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: `0 3px 10px ${primary}40`,
              }}
            >
              <MdImage color="#fff" size={20} />
            </Box>
            <Box>
              <Typography variant="h6" fontWeight={600}>
                Upload Style Reference (V2)
              </Typography>
              <Typography sx={{ fontSize: 12, color: '#6B7280', mt: 0.25 }}>
                Advanced style transfer with GPT-4o Vision
              </Typography>
            </Box>
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
              Style Guide Name (Optional)
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

          {/* Hidden file input */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            style={{ display: 'none' }}
            onChange={(e) => handleFileSelect(e.target.files)}
          />

          {/* Upload Area */}
          {uploadingImages.length === 0 && (
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
                {dragActive ? 'Drop your style reference here' : 'Drag & drop images or click to browse'}
              </Typography>
              <Typography sx={{ fontSize: 13, color: '#6B7280', mb: 1 }}>
                Upload 1-3 reference images • JPEG, PNG, WebP • Max 10MB each
              </Typography>
              <Typography sx={{ fontSize: 12, color: '#9CA3AF', fontStyle: 'italic' }}>
                GPT-4o Vision will analyze visual style, layout, colors, typography & create a style transfer guide
              </Typography>
            </Box>
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
                    <CustomGuideV2PreviewCard guide={upload.result} onRemove={() => removeUpload(upload.preview)} />
                  ) : (
                    <Box sx={{ display: 'flex', gap: 2 }}>
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
                          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        />
                      </Box>

                      <Box sx={{ flex: 1 }}>
                        <Typography sx={{ fontSize: 14, fontWeight: 600, color: '#0d0e0f', mb: 0.5 }}>
                          {upload.file.name}
                        </Typography>
                        <Typography sx={{ fontSize: 12, color: '#6B7280', mb: 1 }}>
                          {(upload.file.size / (1024 * 1024)).toFixed(2)} MB
                        </Typography>

                        {(upload.status === 'uploading' || upload.status === 'processing') && (
                          <Box>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1 }}>
                              <CircularProgress size={16} sx={{ color: primary }} />
                              <Typography sx={{ fontSize: 13, color: '#6B7280' }}>
                                {upload.status === 'uploading'
                                  ? 'Uploading image...'
                                  : 'GPT-4o analyzing style profile...'}
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

                      {upload.status === 'error' && (
                        <IconButton size="small" onClick={() => removeUpload(upload.preview)}>
                          <CloseIcon fontSize="small" />
                        </IconButton>
                      )}
                    </Box>
                  )}
                </Box>
              ))}

              {uploadingImages.length < 3 && !isUploading && (
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
                  + Add More Style References ({uploadingImages.length}/3)
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
                background: 'linear-gradient(135deg, #8B5CF620 0%, #EC489920 100%)',
                borderRadius: '10px',
                border: '1px solid #E9D5FF',
              }}
            >
              <Typography sx={{ fontSize: 12, color: '#374151', lineHeight: 1.6 }}>
                <strong>What's different in V2:</strong>
                <br />
                • GPT-4o Vision extracts comprehensive style profile (layout, colors, mood, typography)
                <br />
                • Style is transferred to your brand while excluding original identity elements
                <br />
                • Generation is driven entirely by that style description — never the reference photo itself
                <br />• Your brand's people and products are never copied from the reference — only the style is
              </Typography>
            </Box>
          )}

          {hasCompletedGuides && (
            <Box sx={{ mt: 3, display: 'flex', gap: 2 }}>
              <Button
                variant="contained"
                onClick={handleClose}
                disabled={isUploading}
                sx={{
                  flex: 1,
                  background: `linear-gradient(135deg, ${primary} 0%, #EC4899 100%)`,
                  color: '#fff',
                  textTransform: 'none',
                  fontWeight: 600,
                  borderRadius: '10px',
                  py: 1.5,
                  '&:hover': { opacity: 0.9 },
                }}
              >
                Done ({uploadingImages.filter((u) => u.status === 'complete').length} style guide
                {uploadingImages.filter((u) => u.status === 'complete').length > 1 ? 's' : ''} created)
              </Button>
            </Box>
          )}
        </Box>
      </DialogContent>
    </Dialog>
  );
}
