'use client';

import { FONT_STYLES, GOOGLE_FONTS_URL, FontStyle } from '@/src/data/fontLibrary';
import { CustomFontAnalysis, CustomFontEntry } from '@/src/api/BrandProfileService';
import { Box, Typography } from '@mui/material';
import { useState } from 'react';
import { FaCheckCircle, FaFont } from 'react-icons/fa';
import { MdCloudUpload } from 'react-icons/md';
import CustomFontUploader from './CustomFontUploader';

interface CustomFontUploadData {
  fontUrl: string;
  filename: string;
  analysis: CustomFontAnalysis;
  promptDirective: string;
}

interface FontPickerGalleryProps {
  selected: string;
  onChange: (slug: string) => void;
  /** This slot's own gallery of previously-uploaded fonts — a new upload is ADDED
   * here, never replaces a prior one. */
  customFonts?: CustomFontEntry[];
  /** Which custom font (by url) is currently active for this slot, if any — empty
   * means this slot is using its library font (`selected` above) instead. */
  selectedCustomFontUrl?: string;
  onSelectCustomFont?: (url: string) => void;
  onCustomFontUpload?: (data: CustomFontUploadData) => void;
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

function CustomFontCard({
  font,
  isSelected,
  onSelect,
  primary,
}: {
  font: CustomFontEntry;
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
      <Box
        sx={{
          height: 88,
          background: isSelected ? `${primary}08` : '#f9f9fb',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          position: 'relative',
          borderBottom: '1px solid #f0eef8',
        }}
      >
        <FaFont size={26} color={isSelected ? primary : '#9CA3AF'} />
        {isSelected && (
          <Box sx={{ position: 'absolute', top: 8, right: 8 }}>
            <FaCheckCircle size={18} color={primary} style={{ filter: 'drop-shadow(0 0 3px rgba(255,255,255,0.8))' }} />
          </Box>
        )}
      </Box>
      <Box sx={{ background: '#fff', p: 1.5 }}>
        <Typography
          sx={{
            fontSize: 12.5,
            fontWeight: 700,
            color: '#0d0e0f',
            lineHeight: 1.2,
            mb: 0.5,
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
          }}
        >
          {font.filename}
        </Typography>
        <Typography sx={{ fontSize: 11, color: '#6B7280', lineHeight: 1.4 }}>
          {font.analysis?.overall_feel || 'Custom upload'}
        </Typography>
      </Box>
    </Box>
  );
}

function UploadTile({ onClick, primary }: { onClick: () => void; primary: string }) {
  return (
    <Box
      component="button"
      onClick={onClick}
      sx={{
        border: `2px dashed ${primary}44`,
        borderRadius: '12px',
        cursor: 'pointer',
        background: `${primary}05`,
        p: 0,
        width: '100%',
        height: '100%',
        minHeight: 138,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 0.5,
        transition: 'all 0.2s',
        '&:hover': { borderColor: `${primary}77`, background: `${primary}08` },
      }}
    >
      <MdCloudUpload size={22} color={primary} />
      <Typography sx={{ fontSize: 11.5, fontWeight: 600, color: primary }}>Upload font</Typography>
    </Box>
  );
}

export default function FontPickerGallery({
  selected,
  onChange,
  customFonts = [],
  selectedCustomFontUrl,
  onSelectCustomFont,
  onCustomFontUpload,
}: FontPickerGalleryProps) {
  const primary = '#CD1B78';
  const [showUploader, setShowUploader] = useState(false);

  const customFontActive = Boolean(selectedCustomFontUrl);

  const toggleLibrary = (slug: string) => {
    onSelectCustomFont?.(''); // picking a library font deselects any custom font
    onChange(selected === slug ? '' : slug);
  };

  const toggleCustom = (url: string) => {
    onChange(''); // picking a custom font deselects any library font
    onSelectCustomFont?.(selectedCustomFontUrl === url ? '' : url);
  };

  const handleFontAnalyzed = (data: CustomFontUploadData) => {
    setShowUploader(false);
    onCustomFontUpload?.(data);
  };

  return (
    <Box>
      {/* Load Google Fonts */}
      <style>{`@import url('${GOOGLE_FONTS_URL}');`}</style>

      {/* Your custom fonts — accumulates across uploads, never discards a prior one */}
      {(customFonts.length > 0 || showUploader) && (
        <Box sx={{ mb: 3 }}>
          <Typography
            sx={{ fontSize: 11, fontWeight: 700, color: '#999', textTransform: 'uppercase', letterSpacing: 0.5, mb: 1 }}
          >
            Your Custom Fonts
          </Typography>
          {showUploader ? (
            <CustomFontUploader onFontAnalyzed={handleFontAnalyzed} onCancel={() => setShowUploader(false)} />
          ) : (
            <Box
              sx={{
                display: 'grid',
                gridTemplateColumns: { xs: 'repeat(2, 1fr)', sm: 'repeat(3, 1fr)' },
                gap: 1.5,
              }}
            >
              {customFonts.map((font) => (
                <CustomFontCard
                  key={font.url}
                  font={font}
                  isSelected={selectedCustomFontUrl === font.url}
                  onSelect={() => toggleCustom(font.url)}
                  primary={primary}
                />
              ))}
              <UploadTile onClick={() => setShowUploader(true)} primary={primary} />
            </Box>
          )}
        </Box>
      )}

      {/* First-time upload prompt — shown until at least one custom font exists */}
      {customFonts.length === 0 && !showUploader && (
        <Box
          component="button"
          onClick={() => setShowUploader(true)}
          sx={{
            width: '100%',
            border: `2px dashed ${primary}33`,
            borderRadius: '16px',
            p: 3,
            mb: 3,
            textAlign: 'center',
            cursor: 'pointer',
            background: `${primary}05`,
            transition: 'all 0.2s',
            '&:hover': { borderColor: `${primary}77`, background: `${primary}08` },
          }}
        >
          <MdCloudUpload size={32} color={primary} style={{ marginBottom: 8 }} />
          <Typography sx={{ fontSize: 14, fontWeight: 600, color: '#0d0e0f', mb: 0.5 }}>
            Upload Your Own Font
          </Typography>
          <Typography sx={{ fontSize: 12, color: '#6B7280' }}>
            Use your brand&apos;s proprietary font • .ttf or .otf files
          </Typography>
        </Box>
      )}

      {/* Library fonts grid */}
      <Typography
        sx={{ fontSize: 11, fontWeight: 700, color: '#999', textTransform: 'uppercase', letterSpacing: 0.5, mb: 1 }}
      >
        Library Fonts
      </Typography>
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: 'repeat(2, 1fr)', sm: 'repeat(3, 1fr)' },
          gap: 1.5,
          opacity: customFontActive ? 0.5 : 1,
          pointerEvents: customFontActive ? 'none' : 'auto',
        }}
      >
        {FONT_STYLES.map((font) => (
          <FontCard
            key={font.slug}
            font={font}
            isSelected={!customFontActive && selected === font.slug}
            onSelect={() => toggleLibrary(font.slug)}
            primary={primary}
          />
        ))}
      </Box>
    </Box>
  );
}
