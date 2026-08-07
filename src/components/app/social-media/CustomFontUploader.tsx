'use client';

import { Box, Button, CircularProgress, Typography } from '@mui/material';
import { useState, useRef } from 'react';
import { FaCheckCircle, FaFileUpload, FaTimesCircle } from 'react-icons/fa';
import { MdCloudUpload } from 'react-icons/md';
import { SocialMediaAgentService } from '@/src/api/SocialMediaAgentService';
import { ToastService } from '@/src/utils/toast.util';
import { ToastTypeEnum } from '@/src/models/enum-models/ToastTypeEnum';

interface CustomFontAnalysis {
  font_category: string;
  stroke_weight: string;
  stroke_contrast: string;
  letter_shape: string;
  terminals: string;
  x_height: string;
  letter_spacing: string;
  special_features: string[];
  overall_feel: string;
}

interface CustomFontUploadData {
  fontUrl: string;
  filename: string;
  analysis: CustomFontAnalysis;
  promptDirective: string;
}

type FileStatus = 'pending' | 'uploading' | 'analyzing' | 'done' | 'error';

interface CustomFontUploaderProps {
  /** Fires once per file, as soon as that individual file finishes — so a caller
   * managing a gallery can append fonts progressively rather than waiting for the
   * whole batch. */
  onFontAnalyzed: (data: CustomFontUploadData) => void;
  /** Fires once, after every selected file has either succeeded or failed. */
  onAllDone: () => void;
  onCancel: () => void;
}

export default function CustomFontUploader({ onFontAnalyzed, onAllDone, onCancel }: CustomFontUploaderProps) {
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [statuses, setStatuses] = useState<Record<string, FileStatus>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [processing, setProcessing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const primary = '#CD1B78';

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files ?? []);
    if (files.length === 0) return;

    const valid: File[] = [];
    const rejectionErrors: Record<string, string> = {};
    for (const file of files) {
      const filename = file.name.toLowerCase();
      if (!filename.endsWith('.ttf') && !filename.endsWith('.otf')) {
        rejectionErrors[file.name] = 'Invalid file type — .ttf or .otf only.';
        continue;
      }
      const sizeMB = file.size / (1024 * 1024);
      if (sizeMB > 5) {
        rejectionErrors[file.name] = `Too large (${sizeMB.toFixed(1)}MB) — max 5MB.`;
        continue;
      }
      valid.push(file);
    }
    setErrors(rejectionErrors);
    setSelectedFiles(valid);
    setStatuses({});
    if (Object.keys(rejectionErrors).length > 0) {
      ToastService.showToast(
        `${Object.keys(rejectionErrors).length} file(s) skipped — see details below.`,
        ToastTypeEnum.Error
      );
    }
  };

  const handleUploadAll = async () => {
    if (selectedFiles.length === 0) return;
    setProcessing(true);
    setStatuses(Object.fromEntries(selectedFiles.map((f) => [f.name, 'pending' as FileStatus])));

    for (const file of selectedFiles) {
      setStatuses((prev) => ({ ...prev, [file.name]: 'uploading' }));
      try {
        const uploadResponse = await SocialMediaAgentService.uploadCustomFont(file);
        if (!uploadResponse.status || !uploadResponse.responseData) {
          throw new Error('Upload failed');
        }
        const { font_url, filename } = uploadResponse.responseData;

        setStatuses((prev) => ({ ...prev, [file.name]: 'analyzing' }));
        const analysisResponse = await SocialMediaAgentService.analyzeCustomFont(font_url);
        if (!analysisResponse.status || !analysisResponse.responseData) {
          throw new Error('Analysis failed');
        }
        const { analysis, prompt_directive } = analysisResponse.responseData;

        setStatuses((prev) => ({ ...prev, [file.name]: 'done' }));
        onFontAnalyzed({ fontUrl: font_url, filename, analysis, promptDirective: prompt_directive });
      } catch (err) {
        setStatuses((prev) => ({ ...prev, [file.name]: 'error' }));
        setErrors((prev) => ({
          ...prev,
          [file.name]: err instanceof Error ? err.message : 'Upload failed. Please try again.',
        }));
      }
    }

    setProcessing(false);
    onAllDone();
  };

  const removeFile = (name: string) => {
    setSelectedFiles((prev) => prev.filter((f) => f.name !== name));
    setErrors((prev) => {
      const next = { ...prev };
      delete next[name];
      return next;
    });
  };

  const statusIcon = (status: FileStatus | undefined) => {
    if (status === 'uploading' || status === 'analyzing') return <CircularProgress size={16} sx={{ color: primary }} />;
    if (status === 'done') return <FaCheckCircle size={16} color={primary} />;
    if (status === 'error') return <FaTimesCircle size={16} color="#DC2626" />;
    return <FaFileUpload size={16} color="#9CA3AF" />;
  };

  const statusLabel = (status: FileStatus | undefined) => {
    if (status === 'uploading') return 'Uploading…';
    if (status === 'analyzing') return 'Analyzing with AI…';
    if (status === 'done') return 'Done';
    if (status === 'error') return 'Failed';
    return null;
  };

  return (
    <Box sx={{ width: '100%' }}>
      <input
        ref={fileInputRef}
        type="file"
        accept=".ttf,.otf"
        multiple
        style={{ display: 'none' }}
        onChange={handleFileSelect}
      />

      {/* Upload area */}
      {selectedFiles.length === 0 && (
        <Box
          onClick={() => fileInputRef.current?.click()}
          sx={{
            border: `2px dashed ${primary}22`,
            borderRadius: '16px',
            p: 4,
            textAlign: 'center',
            cursor: 'pointer',
            background: `${primary}05`,
            transition: 'all 0.2s',
            '&:hover': { borderColor: `${primary}55`, background: `${primary}08` },
          }}
        >
          <MdCloudUpload size={48} color={primary} style={{ marginBottom: 16 }} />
          <Typography sx={{ fontSize: 15, fontWeight: 600, color: '#0d0e0f', mb: 1 }}>
            Click to upload your custom fonts
          </Typography>
          <Typography sx={{ fontSize: 13, color: '#6B7280' }}>
            Select one or more • .ttf or .otf files • Max 5MB each
          </Typography>
        </Box>
      )}

      {/* Selected files list */}
      {selectedFiles.length > 0 && (
        <Box sx={{ border: `2px solid ${primary}22`, borderRadius: '16px', p: 3, background: '#fff' }}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5, mb: 2 }}>
            {selectedFiles.map((file) => (
              <Box
                key={file.name}
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1.5,
                  p: 1.5,
                  borderRadius: '10px',
                  background: '#f9f9fb',
                }}
              >
                {statusIcon(statuses[file.name])}
                <Box sx={{ flex: 1, minWidth: 0 }}>
                  <Typography
                    sx={{
                      fontSize: 13,
                      fontWeight: 600,
                      color: '#0d0e0f',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                    }}
                  >
                    {file.name}
                  </Typography>
                  <Typography sx={{ fontSize: 11.5, color: statuses[file.name] === 'error' ? '#DC2626' : '#6B7280' }}>
                    {statusLabel(statuses[file.name]) ??
                      errors[file.name] ??
                      `${(file.size / (1024 * 1024)).toFixed(2)} MB`}
                  </Typography>
                </Box>
                {!processing && (
                  <Button
                    onClick={() => removeFile(file.name)}
                    sx={{ minWidth: 0, p: 0.5, color: '#9CA3AF', '&:hover': { color: '#DC2626' } }}
                  >
                    <FaTimesCircle size={14} />
                  </Button>
                )}
              </Box>
            ))}
          </Box>

          {Object.keys(errors).length > 0 && !processing && (
            <Box
              sx={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: 1,
                p: 2,
                mb: 2,
                background: '#FEE2E2',
                borderRadius: '8px',
              }}
            >
              <FaTimesCircle color="#DC2626" style={{ marginTop: 2, flexShrink: 0 }} />
              <Typography sx={{ fontSize: 12.5, color: '#DC2626' }}>
                {Object.entries(errors)
                  .filter(([name]) => !selectedFiles.find((f) => f.name === name) || statuses[name] === 'error')
                  .map(([name, msg]) => `${name}: ${msg}`)
                  .join(' • ')}
              </Typography>
            </Box>
          )}

          <Box sx={{ display: 'flex', gap: 2 }}>
            <Button
              variant="contained"
              onClick={handleUploadAll}
              disabled={processing || selectedFiles.length === 0}
              sx={{
                flex: 1,
                background: primary,
                color: '#fff',
                textTransform: 'none',
                fontWeight: 600,
                '&:hover': { background: '#B01667' },
              }}
            >
              {processing
                ? 'Uploading…'
                : `Upload & Analyze ${selectedFiles.length > 1 ? `${selectedFiles.length} Fonts` : 'Font'}`}
            </Button>
            <Button
              variant="outlined"
              onClick={onCancel}
              disabled={processing}
              sx={{
                textTransform: 'none',
                fontWeight: 600,
                borderColor: '#ddd',
                color: '#6B7280',
                '&:hover': { borderColor: '#bbb', background: '#f9f9f9' },
              }}
            >
              Cancel
            </Button>
          </Box>
        </Box>
      )}
    </Box>
  );
}
