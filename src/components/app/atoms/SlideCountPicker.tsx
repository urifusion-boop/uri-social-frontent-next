'use client';

import { Box, Typography } from '@mui/material';

// 10 is Instagram's carousel limit; the backend clamps every carousel path to 2-10.
export const CAROUSEL_SLIDE_OPTIONS = [2, 3, 4, 5, 6, 7, 8, 9, 10];

interface SlideCountPickerProps {
  value: number;
  onChange: (n: number) => void;
  label?: string;
  disabled?: boolean;
  // Defaults to every option (2-10, Instagram's platform limit). A caller
  // with its own tighter business rule (e.g. the Content Calendar's
  // "carousels never exceed 3 slides") passes a narrower list instead of
  // this component silently offering choices that rule doesn't allow.
  options?: number[];
}

/** "Number of slides: 2 3 4 … 10" — the carousel slide-count selector used across the app. */
const SlideCountPicker = ({
  value,
  onChange,
  label = 'Number of slides:',
  disabled = false,
  options = CAROUSEL_SLIDE_OPTIONS,
}: SlideCountPickerProps) => (
  <Box display="flex" alignItems="center" flexWrap="wrap" gap={1}>
    <Typography fontSize="13px" color="#374151" fontWeight={500}>
      {label}
    </Typography>
    {options.map((n) => (
      <Box
        key={n}
        role="button"
        aria-pressed={value === n}
        onClick={() => !disabled && onChange(n)}
        sx={{
          width: 32,
          height: 32,
          borderRadius: '6px',
          border: '1px solid',
          borderColor: value === n ? '#CD1B78' : '#E5E7EB',
          background: value === n ? '#FDF2F8' : '#fff',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: disabled ? 'not-allowed' : 'pointer',
          opacity: disabled ? 0.5 : 1,
          userSelect: 'none',
        }}
      >
        <Typography fontSize="13px" fontWeight={600} color={value === n ? '#CD1B78' : '#374151'}>
          {n}
        </Typography>
      </Box>
    ))}
  </Box>
);

export default SlideCountPicker;
