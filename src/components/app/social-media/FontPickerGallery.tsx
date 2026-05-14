'use client';

import { FONT_STYLES, GOOGLE_FONTS_URL, FontStyle } from '@/src/data/fontLibrary';
import { Box, Typography } from '@mui/material';
import { useState } from 'react';
import { FaCheckCircle } from 'react-icons/fa';
import { MdCloudUpload } from 'react-icons/md';
import CustomFontUploader from './CustomFontUploader';

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

interface FontPickerGalleryProps {
  selected: string;
  onChange: (slug: string) => void;
  customFontEnabled?: boolean;
  customFontFilename?: string;
  customFontAnalysis?: CustomFontAnalysis;
  onCustomFontUpload?: (data: CustomFontUploadData) => void;
  onUseCustomFont?: () => void;
  onUseLibraryFont?: () => void;
}

function FontCard({
  font,
  isSelected,
  onSelect,
  primary,
}: {
  font: FontStyle;
  isSelected: boolean;
  onSelect: () => void;
  primary: string;
}) {
  return (
    <Box
      component="button"
      onClick={onSelect}
      sx={{
        position: 'relative',
        border: isSelected ? `2.5px solid ${primary}` : '2.5px solid transparent',
        borderRadius: '12px',
        overflow: 'hidden',
        cursor: 'pointer',
        background: 'none',
        p: 0,
        textAlign: 'left',
        transition: 'transform 0.15s, box-shadow 0.15s',
        boxShadow: isSelected ? `0 0 0 2px #fff, 0 0 0 4px ${primary}` : '0 2px 8px rgba(0,0,0,0.10)',
        '&:hover': {
          transform: 'translateY(-2px)',
          boxShadow: isSelected ? `0 4px 16px ${primary}55` : '0 6px 18px rgba(0,0,0,0.16)',
        },
        width: '100%',
      }}
    >
      {/* Font preview */}
      <Box
        sx={{
          height: 88,
          background: isSelected ? `${primary}08` : '#f9f9fb',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          px: 2,
          position: 'relative',
          borderBottom: '1px solid #f0eef8',
        }}
      >
        <Typography
          sx={{
            fontFamily: font.fontFamily,
            fontSize: font.slug === 'bold_condensed' ? 22 : font.slug === 'script_flow' ? 20 : 18,
            color: '#0d0e0f',
            lineHeight: 1.2,
            textAlign: 'center',
            letterSpacing:
              font.slug === 'minimal_light' ? '0.08em' : font.slug === 'bold_condensed' ? '-0.01em' : 'normal',
          }}
        >
          {font.previewText}
        </Typography>
        {isSelected && (
          <Box sx={{ position: 'absolute', top: 8, right: 8 }}>
            <FaCheckCircle size={18} color={primary} style={{ filter: 'drop-shadow(0 0 3px rgba(255,255,255,0.8))' }} />
          </Box>
        )}
      </Box>

      {/* Info */}
      <Box sx={{ background: '#fff', p: 1.5 }}>
        <Typography sx={{ fontSize: 13, fontWeight: 700, color: '#0d0e0f', lineHeight: 1.2, mb: 0.5 }}>
          {font.name}
        </Typography>
        <Typography sx={{ fontSize: 11.5, color: '#6B7280', lineHeight: 1.4 }}>{font.description}</Typography>
      </Box>
    </Box>
  );
}

export default function FontPickerGallery({
  selected,
  onChange,
  customFontEnabled,
  customFontFilename,
  customFontAnalysis,
  onCustomFontUpload,
  onUseCustomFont,
  onUseLibraryFont,
}: FontPickerGalleryProps) {
  const primary = '#CD1B78';
  const [showUploader, setShowUploader] = useState(false);

  const toggle = (slug: string) => {
    onChange(selected === slug ? '' : slug);
  };

  const handleFontAnalyzed = (data: CustomFontUploadData) => {
    setShowUploader(false);
    onCustomFontUpload?.(data);
  };

  return (
    <Box>
      {/* Load Google Fonts */}
      <style>{`@import url('${GOOGLE_FONTS_URL}');`}</style>

      {/* Custom font status card (if font is uploaded) */}
      {customFontFilename && !showUploader && (
        <Box
          sx={{
            mb: 3,
            p: 3,
            border: customFontEnabled ? `2.5px solid ${primary}` : '2px solid #e5e7eb',
            borderRadius: '16px',
            background: customFontEnabled ? `${primary}05` : '#fff',
            boxShadow: customFontEnabled ? `0 0 0 2px #fff, 0 0 0 4px ${primary}` : '0 2px 8px rgba(0,0,0,0.10)',
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
            {customFontEnabled && <FaCheckCircle size={24} color={primary} />}
            <Box sx={{ flex: 1 }}>
              <Typography sx={{ fontSize: 14, fontWeight: 700, color: '#0d0e0f' }}>
                {customFontEnabled ? '✓ Custom Font Active' : '📤 Custom Font Available'}
              </Typography>
              <Typography sx={{ fontSize: 12, color: '#6B7280', mt: 0.5 }}>{customFontFilename}</Typography>
            </Box>
          </Box>

          {customFontAnalysis && (
            <Typography sx={{ fontSize: 12, color: '#374151', mb: 2 }}>
              {customFontAnalysis.overall_feel} • {customFontAnalysis.font_category} •{' '}
              {customFontAnalysis.stroke_weight}
            </Typography>
          )}

          <Box sx={{ display: 'flex', gap: 2 }}>
            {!customFontEnabled && (
              <button
                onClick={onUseCustomFont}
                style={{
                  flex: 1,
                  padding: '10px 16px',
                  background: primary,
                  color: '#fff',
                  border: 'none',
                  borderRadius: '8px',
                  fontWeight: 600,
                  fontSize: 13,
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                }}
              >
                Use Custom Font
              </button>
            )}
            {customFontEnabled && (
              <button
                onClick={onUseLibraryFont}
                style={{
                  flex: 1,
                  padding: '10px 16px',
                  background: '#fff',
                  color: '#6B7280',
                  border: '2px solid #e5e7eb',
                  borderRadius: '8px',
                  fontWeight: 600,
                  fontSize: 13,
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                }}
              >
                Use Library Font
              </button>
            )}
            <button
              onClick={() => setShowUploader(true)}
              style={{
                padding: '10px 16px',
                background: '#fff',
                color: '#6B7280',
                border: '2px solid #e5e7eb',
                borderRadius: '8px',
                fontWeight: 600,
                fontSize: 13,
                cursor: 'pointer',
                transition: 'all 0.2s',
              }}
            >
              Replace Font
            </button>
          </Box>
        </Box>
      )}

      {/* Upload custom font card (if no custom font exists or user wants to upload new one) */}
      {(!customFontFilename || showUploader) && (
        <Box sx={{ mb: 3 }}>
          {!showUploader ? (
            <Box
              component="button"
              onClick={() => setShowUploader(true)}
              sx={{
                width: '100%',
                border: `2px dashed ${primary}33`,
                borderRadius: '16px',
                p: 3,
                textAlign: 'center',
                cursor: 'pointer',
                background: `${primary}05`,
                transition: 'all 0.2s',
                '&:hover': {
                  borderColor: `${primary}77`,
                  background: `${primary}08`,
                },
              }}
            >
              <MdCloudUpload size={32} color={primary} style={{ marginBottom: 8 }} />
              <Typography sx={{ fontSize: 14, fontWeight: 600, color: '#0d0e0f', mb: 0.5 }}>
                Upload Your Own Font
              </Typography>
              <Typography sx={{ fontSize: 12, color: '#6B7280' }}>
                Use your brand's proprietary font • .ttf or .otf files
              </Typography>
            </Box>
          ) : (
            <CustomFontUploader onFontAnalyzed={handleFontAnalyzed} onCancel={() => setShowUploader(false)} />
          )}
        </Box>
      )}

      {/* Library fonts grid */}
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: 'repeat(2, 1fr)', sm: 'repeat(3, 1fr)' },
          gap: 1.5,
          opacity: customFontEnabled ? 0.5 : 1,
          pointerEvents: customFontEnabled ? 'none' : 'auto',
        }}
      >
        {FONT_STYLES.map((font) => (
          <FontCard
            key={font.slug}
            font={font}
            isSelected={!customFontEnabled && selected === font.slug}
            onSelect={() => toggle(font.slug)}
            primary={primary}
          />
        ))}
      </Box>
    </Box>
  );
}
