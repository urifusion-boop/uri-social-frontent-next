'use client';

import { ReactElement } from 'react';
import { SocialConnection, SocialMediaAgentService } from '@/src/api/SocialMediaAgentService';
import { ToastTypeEnum } from '@/src/models/enum-models/ToastTypeEnum';
import { ToastService } from '@/src/utils/toast.util';
import { Box, Button, Chip, Typography } from '@mui/material';
import { useState } from 'react';
import { FaFacebook, FaInstagram, FaLinkedin, FaTwitter } from 'react-icons/fa';

interface ConnectedAccountCardProps {
  connection: SocialConnection;
  onDisconnect: () => void;
}

const platformConfig: Record<string, { icon: ReactElement; color: string; label: string }> = {
  facebook: { icon: <FaFacebook size={24} color="#1877F2" />, color: '#EFF6FF', label: 'Facebook' },
  instagram: { icon: <FaInstagram size={24} color="#E1306C" />, color: '#FFF0F6', label: 'Instagram' },
  twitter: { icon: <FaTwitter size={24} color="#1DA1F2" />, color: '#EFF6FF', label: 'Twitter / X' },
  linkedin: { icon: <FaLinkedin size={24} color="#0A66C2" />, color: '#EFF6FF', label: 'LinkedIn' },
};

const ConnectedAccountCard = ({ connection, onDisconnect }: ConnectedAccountCardProps) => {
  const [confirming, setConfirming] = useState(false);
  const [loading, setLoading] = useState(false);

  const config = platformConfig[connection.platform] ?? {
    icon: null,
    color: '#F3F4F6',
    label: connection.platform,
  };

  const handleDisconnect = async () => {
    if (!confirming) {
      setConfirming(true);
      return;
    }

    setLoading(true);
    try {
      const response = await SocialMediaAgentService.disconnectPlatform(connection.platform);
      if (response.status) {
        ToastService.showToast('Account disconnected', ToastTypeEnum.Success);
        onDisconnect();
      } else {
        ToastService.showToast(response.responseMessage || 'Disconnect failed', ToastTypeEnum.Error);
      }
    } catch {
      ToastService.showToast('Disconnect failed', ToastTypeEnum.Error);
    } finally {
      setLoading(false);
      setConfirming(false);
    }
  };

  return (
    <Box
      sx={{
        border: '1px solid #E5E7EB',
        borderRadius: '12px',
        p: 2.5,
        background: '#fff',
        display: 'flex',
        alignItems: 'center',
        gap: 2,
        boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
      }}
    >
      <Box
        sx={{
          width: 48,
          height: 48,
          borderRadius: '10px',
          background: config.color,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
        }}
      >
        {config.icon}
      </Box>

      <Box flex={1} minWidth={0}>
        <Typography fontWeight={600} fontSize="15px" color="#111827" noWrap>
          {connection.page_name || config.label}
        </Typography>
        {connection.fan_count !== undefined && (
          <Typography fontSize="12px" color="#6B7280">
            {connection.fan_count.toLocaleString()} followers
          </Typography>
        )}
      </Box>

      <Chip
        label={connection.status === 'active' ? 'Active' : 'Expired'}
        size="small"
        sx={{
          background: connection.status === 'active' ? '#D1FAE5' : '#FEE2E2',
          color: connection.status === 'active' ? '#065F46' : '#991B1B',
          fontWeight: 600,
          fontSize: '11px',
        }}
      />

      <Button onClick={handleDisconnect} variant="outlined" size="small" disabled={loading} color={confirming ? 'error' : 'inherit'} sx={{ textTransform: 'none', minWidth: 100, flexShrink: 0 }}>
        {loading ? 'Removing...' : confirming ? 'Confirm?' : 'Disconnect'}
      </Button>
    </Box>
  );
};

export default ConnectedAccountCard;
