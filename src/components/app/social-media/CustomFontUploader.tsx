'use client';

import { Box, Button, CircularProgress, Typography } from '@mui/material';
import { useState, useRef } from 'react';
import { FaUpload, FaCheckCircle, FaTimesCircle } from 'react-icons/fa';
import { MdCloudUpload } from 'react-icons/md';
import { SocialMediaAgentService } from '@/src/api/SocialMediaAgentService';
import { CustomVisualGuideService } from '@/src/api/CustomVisualGuideService';
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

interface CustomFontUploaderProps {
  onFontAnalyzed: (data: CustomFontUploadData) => void;
  onCancel: () => void;
}

export default function CustomFontUploader({ onFontAnalyzed, onCancel }: CustomFontUploaderProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState('');
  const [analysis, setAnalysis] = useState<CustomFontAnalysis | null>(null);
  const [promptDirective, setPromptDirective] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const primary = '#CD1B78';

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    const filename = file.name.toLowerCase();
    if (!filename.endsWith('.ttf') && !filename.endsWith('.otf')) {
      setError('Invalid file type. Please upload .ttf or .otf files only.');
      return;
    }

    // Validate file size (max 5MB)
    const sizeMB = file.size / (1024 * 1024);
    if (sizeMB > 5) {
      setError(`File too large (${sizeMB.toFixed(1)}MB). Maximum size is 5MB.`);
      return;
    }

    setSelectedFile(file);
    setError('');
  };

  const handleUpload = async () => {
    if (!selectedFile) return;

    try {
      setUploading(true);
      setUploadProgress(30);
      setError('');

      // Upload font file
      const uploadResponse = await SocialMediaAgentService.uploadCustomFont(selectedFile);

      if (!uploadResponse.status || !uploadResponse.responseData) {
        throw new Error('Upload failed');
      }

      setUploadProgress(60);
      const { font_url, filename } = uploadResponse.responseData;

      // Analyze font
      setUploading(false);
      setAnalyzing(true);

      const analysisResponse = await SocialMediaAgentService.analyzeCustomFont(font_url);

      if (!analysisResponse.status || !analysisResponse.responseData) {
        throw new Error('Analysis failed');
      }

      const { analysis: fontAnalysis, prompt_directive } = analysisResponse.responseData;

      setAnalysis(fontAnalysis);
      setPromptDirective(prompt_directive);
      setAnalyzing(false);
      setUploadProgress(100);

      // Notify parent component
      onFontAnalyzed({
        fontUrl: font_url,
        filename,
        analysis: fontAnalysis,
        promptDirective: prompt_directive,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed. Please try again.');
      setUploading(false);
      setAnalyzing(false);
      setUploadProgress(0);
    }
  };

  const isLoading = uploading || analyzing;

  return (
    <Box sx={{ width: '100%' }}>
      {/* File input (hidden) */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".ttf,.otf"
        style={{ display: 'none' }}
        onChange={handleFileSelect}
      />

      {/* Upload area */}
      {!selectedFile && !analysis && (
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
            '&:hover': {
              borderColor: `${primary}55`,
              background: `${primary}08`,
            },
          }}
        >
          <MdCloudUpload size={48} color={primary} style={{ marginBottom: 16 }} />
          <Typography sx={{ fontSize: 15, fontWeight: 600, color: '#0d0e0f', mb: 1 }}>
            Click to upload your custom font
          </Typography>
          <Typography sx={{ fontSize: 13, color: '#6B7280' }}>Upload .ttf or .otf files • Max 5MB</Typography>
        </Box>
      )}

      {/* Selected file */}
      {selectedFile && !analysis && (
        <Box
          sx={{
            border: `2px solid ${primary}22`,
            borderRadius: '16px',
            p: 3,
            background: '#fff',
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
            <FaUpload size={24} color={primary} />
            <Box sx={{ flex: 1 }}>
              <Typography sx={{ fontSize: 14, fontWeight: 600, color: '#0d0e0f' }}>{selectedFile.name}</Typography>
              <Typography sx={{ fontSize: 12, color: '#6B7280' }}>
                {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB
              </Typography>
            </Box>
          </Box>

          {/* Upload progress */}
          {isLoading && (
            <Box sx={{ mb: 2 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1 }}>
                <CircularProgress size={20} sx={{ color: primary }} />
                <Typography sx={{ fontSize: 13, color: '#6B7280' }}>
                  {uploading ? 'Uploading font...' : 'Analyzing font with AI...'}
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
                    width: `${uploadProgress}%`,
                    height: '100%',
                    background: primary,
                    transition: 'width 0.3s',
                  }}
                />
              </Box>
            </Box>
          )}

          {/* Error */}
          {error && (
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 1,
                p: 2,
                mb: 2,
                background: '#FEE2E2',
                borderRadius: '8px',
              }}
            >
              <FaTimesCircle color="#DC2626" />
              <Typography sx={{ fontSize: 13, color: '#DC2626' }}>{error}</Typography>
            </Box>
          )}

          {/* Actions */}
          {!isLoading && (
            <Box sx={{ display: 'flex', gap: 2 }}>
              <Button
                variant="contained"
                onClick={handleUpload}
                disabled={isLoading}
                sx={{
                  flex: 1,
                  background: primary,
                  color: '#fff',
                  textTransform: 'none',
                  fontWeight: 600,
                  '&:hover': { background: '#B01667' },
                }}
              >
                Upload & Analyze
              </Button>
              <Button
                variant="outlined"
                onClick={onCancel}
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
          )}
        </Box>
      )}

      {/* Analysis result */}
      {analysis && promptDirective && (
        <Box
          sx={{
            border: `2px solid ${primary}`,
            borderRadius: '16px',
            p: 3,
            background: `${primary}05`,
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
            <FaCheckCircle size={32} color={primary} />
            <Box>
              <Typography sx={{ fontSize: 16, fontWeight: 700, color: '#0d0e0f' }}>
                Font Analyzed Successfully!
              </Typography>
              <Typography sx={{ fontSize: 13, color: '#6B7280' }}>{selectedFile?.name}</Typography>
            </Box>
          </Box>

          <Box sx={{ mb: 3 }}>
            <Typography sx={{ fontSize: 13, fontWeight: 600, color: '#0d0e0f', mb: 1 }}>Font Description:</Typography>
            <Typography sx={{ fontSize: 13, color: '#374151', lineHeight: 1.6 }}>
              {analysis.overall_feel} • {analysis.font_category} • {analysis.stroke_weight}
            </Typography>
          </Box>

          <Box
            sx={{
              p: 2,
              background: '#fff',
              borderRadius: '8px',
              border: '1px solid #e5e7eb',
            }}
          >
            <Typography sx={{ fontSize: 12, color: '#6B7280', lineHeight: 1.6 }}>{promptDirective}</Typography>
          </Box>
        </Box>
      )}
    </Box>
  );
}
