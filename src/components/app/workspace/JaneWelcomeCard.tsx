'use client';

/**
 * Jane's Welcome Card Component
 * PRD: URI-Social-Jane-First-Message-PRD.pdf
 *
 * PRD Section 2: This Is Not a Welcome Message
 * "An offer, from someone who was clearly listening."
 *
 * Displays Jane's personalized first message with:
 * - Proof she was listening (references their business)
 * - Specific, timely hook (Nigerian seasonal context)
 * - Low-effort offer (one-tap yes)
 * - Clear next step
 */

import { useState } from 'react';
import { Box, Button, Card, Typography, Avatar, CircularProgress } from '@mui/material';
import { MdClose } from 'react-icons/md';
import { JaneFirstMessageResponse } from '@/src/api/JaneService';

interface JaneWelcomeCardProps {
  message: JaneFirstMessageResponse;
  onAccept: () => void;
  onDecline: () => void;
  isGenerating?: boolean;
}

const JaneWelcomeCard = ({ message, onAccept, onDecline, isGenerating = false }: JaneWelcomeCardProps) => {
  const [isVisible, setIsVisible] = useState(true);

  const handleDecline = () => {
    setIsVisible(false);
    // Small delay before calling onDecline so card fades out smoothly
    setTimeout(() => {
      onDecline();
    }, 300);
  };

  if (!isVisible) return null;

  return (
    <Card
      sx={{
        background: 'linear-gradient(135deg, #FFF5F8 0%, #FFF9FC 100%)',
        border: '2px solid #FECDD3',
        borderRadius: '16px',
        padding: '24px',
        marginBottom: '24px',
        position: 'relative',
        transition: 'opacity 0.3s ease',
        opacity: isVisible ? 1 : 0,
      }}
    >
      {/* Close button - PRD: Easy to decline, not pushy */}
      <Box
        onClick={handleDecline}
        sx={{
          position: 'absolute',
          top: 16,
          right: 16,
          cursor: 'pointer',
          color: '#9CA3AF',
          '&:hover': { color: '#6B7280' },
        }}
      >
        <MdClose size={20} />
      </Box>

      {/* Jane's Avatar */}
      <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2 }}>
        <Avatar
          sx={{
            width: 48,
            height: 48,
            background: 'linear-gradient(135deg, #CD1B78 0%, #A01560 100%)',
            fontSize: '20px',
            fontWeight: 700,
          }}
        >
          J
        </Avatar>

        <Box sx={{ flex: 1 }}>
          {/* Sender Name */}
          <Typography sx={{ fontSize: '14px', fontWeight: 600, color: '#CD1B78', marginBottom: '4px' }}>
            Jane
          </Typography>

          {/* PRD Section 4: The Message - warm, casual, short */}
          <Typography
            sx={{
              fontSize: '15px',
              lineHeight: 1.6,
              color: '#374151',
              marginBottom: '20px',
            }}
          >
            {message.message}
          </Typography>

          {/* PRD Section 4.4: One clear next step */}
          <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
            <Button
              onClick={onAccept}
              disabled={isGenerating}
              variant="contained"
              sx={{
                textTransform: 'none',
                fontSize: '14px',
                fontWeight: 600,
                padding: '10px 20px',
                borderRadius: '8px',
                background: 'linear-gradient(135deg, #CD1B78 0%, #A01560 100%)',
                '&:hover': {
                  background: 'linear-gradient(135deg, #A01560 0%, #CD1B78 100%)',
                },
                '&:disabled': {
                  background: '#E5E7EB',
                  color: '#9CA3AF',
                },
              }}
            >
              {isGenerating ? (
                <>
                  <CircularProgress size={16} sx={{ color: '#FFF', marginRight: '8px' }} />
                  Creating...
                </>
              ) : (
                <>Yes, make it ✨</>
              )}
            </Button>

            <Button
              onClick={handleDecline}
              disabled={isGenerating}
              variant="outlined"
              sx={{
                textTransform: 'none',
                fontSize: '14px',
                fontWeight: 600,
                padding: '10px 20px',
                borderRadius: '8px',
                borderColor: '#E5E7EB',
                color: '#6B7280',
                '&:hover': {
                  borderColor: '#CD1B78',
                  background: 'rgba(205, 27, 120, 0.04)',
                },
              }}
            >
              Maybe later
            </Button>
          </Box>

          {/* Suggested platforms hint */}
          {message.platforms_suggested && message.platforms_suggested.length > 0 && (
            <Typography
              sx={{
                fontSize: '12px',
                color: '#9CA3AF',
                marginTop: '12px',
              }}
            >
              I'll create this for {message.platforms_suggested.join(' + ')}
            </Typography>
          )}
        </Box>
      </Box>
    </Card>
  );
};

export default JaneWelcomeCard;
