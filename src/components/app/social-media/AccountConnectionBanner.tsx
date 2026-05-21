'use client';

import { Alert, Box, Button, IconButton } from '@mui/material';
import { FaFacebook, FaInstagram, FaLinkedin } from 'react-icons/fa';
import CloseIcon from '@mui/icons-material/Close';
import { useState, useEffect } from 'react';

interface AccountConnectionBannerProps {
  onConnect: () => void;
}

export default function AccountConnectionBanner({ onConnect }: AccountConnectionBannerProps) {
  const [dismissed, setDismissed] = useState(true);

  useEffect(() => {
    // Check if banner was dismissed recently (within 7 days)
    const dismissedAt = localStorage.getItem('accountBannerDismissedAt');
    if (dismissedAt) {
      const daysSinceDismiss = (Date.now() - parseInt(dismissedAt)) / (1000 * 60 * 60 * 24);
      if (daysSinceDismiss < 7) {
        return; // Keep dismissed
      }
    }
    setDismissed(false);
  }, []);

  if (dismissed) return null;

  const handleDismiss = () => {
    setDismissed(true);
    localStorage.setItem('accountBannerDismissedAt', Date.now().toString());
  };

  return (
    <Alert
      severity="info"
      icon={false}
      sx={{
        mb: 3,
        borderRadius: '12px',
        backgroundColor: '#EFF6FF',
        border: '1px solid #BFDBFE',
        '& .MuiAlert-message': { width: '100%', p: 0 },
      }}
      action={
        <IconButton size="small" onClick={handleDismiss} sx={{ mt: -0.5 }}>
          <CloseIcon fontSize="small" />
        </IconButton>
      }
    >
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
        {/* Platform icons */}
        <Box sx={{ display: 'flex', gap: 0.5, alignItems: 'center', flexShrink: 0 }}>
          <Box
            sx={{
              width: 32,
              height: 32,
              borderRadius: '6px',
              backgroundColor: '#fff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <FaFacebook size={16} color="#1877F2" />
          </Box>
          <Box
            sx={{
              width: 32,
              height: 32,
              borderRadius: '6px',
              backgroundColor: '#fff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <FaInstagram size={16} color="#E4405F" />
          </Box>
          <Box
            sx={{
              width: 32,
              height: 32,
              borderRadius: '6px',
              backgroundColor: '#fff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <FaLinkedin size={16} color="#0A66C2" />
          </Box>
        </Box>

        {/* Text content */}
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Box sx={{ fontWeight: 600, fontSize: 14, color: '#1E40AF', mb: 0.25 }}>Connect your social accounts</Box>
          <Box sx={{ fontSize: 13, color: '#1E3A8A' }}>Publish directly to Facebook, Instagram, and LinkedIn</Box>
        </Box>

        {/* CTA Button */}
        <Button
          size="small"
          variant="contained"
          onClick={onConnect}
          sx={{
            textTransform: 'none',
            fontSize: 13,
            fontWeight: 600,
            px: 2.5,
            backgroundColor: '#CD1B78',
            color: '#fff',
            borderRadius: '8px',
            flexShrink: 0,
            '&:hover': { backgroundColor: '#A0145E' },
          }}
        >
          Connect Now
        </Button>
      </Box>
    </Alert>
  );
}
