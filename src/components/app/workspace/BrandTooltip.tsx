'use client';

import React from 'react';
import { Tooltip } from '@mui/material';

export const BrandTooltip = (props: React.ComponentProps<typeof Tooltip>) => (
  <Tooltip
    enterTouchDelay={0}
    leaveTouchDelay={3000}
    {...props}
    componentsProps={{
      ...props.componentsProps,
      tooltip: {
        sx: {
          background: 'linear-gradient(135deg,#1a0a12 0%,#2d0d1e 100%)',
          color: '#fff',
          fontSize: 12,
          fontWeight: 500,
          lineHeight: 1.45,
          padding: '8px 12px',
          borderRadius: '8px',
          maxWidth: 220,
          boxShadow: '0 8px 28px rgba(194,24,91,.30),0 2px 8px rgba(0,0,0,.25)',
          border: '1px solid rgba(194,24,91,.28)',
          fontFamily: 'var(--wf,sans-serif)',
        },
        ...((props.componentsProps?.tooltip as object) ?? {}),
      },
      arrow: {
        sx: {
          color: '#1a0a12',
          '&::before': { border: '1px solid rgba(194,24,91,.28)' },
        },
        ...((props.componentsProps?.arrow as object) ?? {}),
      },
    }}
  />
);

export default BrandTooltip;
