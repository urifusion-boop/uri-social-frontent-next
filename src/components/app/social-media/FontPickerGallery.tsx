'use client';

import { FONT_STYLES, GOOGLE_FONTS_URL, FontStyle } from '@/src/data/fontLibrary';
import { Box, Typography } from '@mui/material';
import { useState } from 'react';
import { FaCheckCircle } from 'react-icons/fa';

interface FontPickerGalleryProps {
  selected: string;
  onChange: (slug: string) => void;
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

export default function FontPickerGallery({ selected, onChange }: FontPickerGalleryProps) {
  const primary = '#CD1B78';

  const toggle = (slug: string) => {
    onChange(selected === slug ? '' : slug);
  };

  return (
    <Box>
      {/* Load Google Fonts */}
      <style>{`@import url('${GOOGLE_FONTS_URL}');`}</style>

      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: 'repeat(2, 1fr)', sm: 'repeat(3, 1fr)' },
          gap: 1.5,
        }}
      >
        {FONT_STYLES.map((font) => (
          <FontCard
            key={font.slug}
            font={font}
            isSelected={selected === font.slug}
            onSelect={() => toggle(font.slug)}
            primary={primary}
          />
        ))}
      </Box>
    </Box>
  );
}
