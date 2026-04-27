'use client';

import { getStylesForIndustry, StyleTemplate } from '@/src/data/styleLibrary';
import { Box, Typography } from '@mui/material';
import { FaCheckCircle } from 'react-icons/fa';

const MAX_SELECTIONS = 3;

interface StylePickerGalleryProps {
  industry: string;
  selected: string[];
  onChange: (slugs: string[]) => void;
}

function StyleCard({
  style,
  isSelected,
  onToggle,
  primary,
}: {
  style: StyleTemplate;
  isSelected: boolean;
  onToggle: () => void;
  primary: string;
}) {
  const [from, to] = style.gradient;
  return (
    <Box
      component="button"
      onClick={onToggle}
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
      {/* Gradient swatch */}
      <Box
        sx={{
          height: 80,
          background: `linear-gradient(135deg, ${from}, ${to})`,
          position: 'relative',
        }}
      >
        {isSelected && (
          <Box sx={{ position: 'absolute', top: 8, right: 8 }}>
            <FaCheckCircle size={20} color={primary} style={{ filter: 'drop-shadow(0 0 3px rgba(255,255,255,0.8))' }} />
          </Box>
        )}
      </Box>

      {/* Info */}
      <Box sx={{ background: '#fff', p: 1.5 }}>
        <Typography sx={{ fontSize: 13, fontWeight: 700, color: '#0d0e0f', lineHeight: 1.2, mb: 0.5 }}>
          {style.name}
        </Typography>
        <Typography sx={{ fontSize: 11.5, color: '#6B7280', lineHeight: 1.4 }}>{style.description}</Typography>
      </Box>
    </Box>
  );
}

export default function StylePickerGallery({ industry, selected, onChange }: StylePickerGalleryProps) {
  const primary = '#CD1B78';
  const styles = getStylesForIndustry(industry || 'general_other');

  const toggle = (slug: string) => {
    if (selected.includes(slug)) {
      onChange(selected.filter((s) => s !== slug));
    } else if (selected.length >= MAX_SELECTIONS) {
      // silently enforce limit — caller should show guidance
      return;
    } else {
      onChange([...selected, slug]);
    }
  };

  return (
    <Box>
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: 'repeat(2, 1fr)', sm: 'repeat(3, 1fr)' },
          gap: 1.5,
        }}
      >
        {styles.map((style) => (
          <StyleCard
            key={style.slug}
            style={style}
            isSelected={selected.includes(style.slug)}
            onToggle={() => toggle(style.slug)}
            primary={primary}
          />
        ))}
      </Box>

      {selected.length >= MAX_SELECTIONS && (
        <Typography sx={{ fontSize: 11.5, color: '#9CA3AF', mt: 1.5, textAlign: 'center' }}>
          3 of 3 styles selected — deselect one to swap
        </Typography>
      )}
    </Box>
  );
}
