'use client';

import { SocialMediaAgentService } from '@/src/api/SocialMediaAgentService';
import { ToastTypeEnum } from '@/src/models/enum-models/ToastTypeEnum';
import { ToastService } from '@/src/utils/toast.util';
import CloseIcon from '@mui/icons-material/Close';
import { Alert, Box, Button, Dialog, DialogActions, DialogContent, DialogTitle, IconButton, TextField, Typography } from '@mui/material';
import { useState } from 'react';
import { MdOutlineCampaign } from 'react-icons/md';

interface ConnectFacebookModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const ConnectFacebookModal = ({ open, onClose, onSuccess }: ConnectFacebookModalProps) => {
  const [pageAccessToken, setPageAccessToken] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async () => {
    if (!pageAccessToken.trim()) {
      setError('Page access token is required');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await SocialMediaAgentService.connectFacebookToken({
        platform: 'facebook',
        page_access_token: pageAccessToken.trim(),
      });

      if (response.status) {
        ToastService.showToast('Facebook page connected successfully!', ToastTypeEnum.Success);
        onSuccess();
        handleClose();
      } else {
        setError(response.responseMessage || 'Failed to connect Facebook page');
      }
    } catch (err: any) {
      setError(err?.data?.responseMessage || 'Failed to connect Facebook page');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setPageAccessToken('');
    setError('');
    onClose();
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        <Box display="flex" alignItems="center" justifyContent="space-between">
          <Box display="flex" alignItems="center" gap={1.5}>
            <Box
              sx={{
                width: 40,
                height: 40,
                borderRadius: '10px',
                background: 'linear-gradient(135deg, #1877F2 0%, #0D5FD9 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 3px 10px rgba(24, 119, 242, 0.3)',
              }}
            >
              <MdOutlineCampaign color="#fff" size={20} />
            </Box>
            <Typography variant="h6" fontWeight={600}>
              Connect Facebook Page
            </Typography>
          </Box>
          <IconButton onClick={handleClose} size="small">
            <CloseIcon />
          </IconButton>
        </Box>
      </DialogTitle>

      <DialogContent>
        <Box sx={{ pt: 1 }}>
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          <TextField
            label="Page Access Token"
            placeholder="Paste your Facebook page access token here"
            fullWidth
            multiline
            rows={4}
            value={pageAccessToken}
            onChange={(e) => setPageAccessToken(e.target.value)}
            required
            sx={{ mb: 2 }}
          />

          <Box
            sx={{
              p: 2,
              background: '#EFF6FF',
              borderRadius: '10px',
              border: '1px solid #BFDBFE',
            }}
          >
            <Typography fontSize="12px" color="#1D4ED8" fontWeight={600} mb={0.5}>
              HOW TO GET YOUR TOKEN
            </Typography>
            <Typography fontSize="11px" color="#374151" lineHeight={1.7}>
              1. Go to{' '}
              <a href="https://developers.facebook.com/tools/explorer/" target="_blank" rel="noopener noreferrer" style={{ color: '#1877F2' }}>
                Graph API Explorer
              </a>
              <br />
              2. Select your Facebook App and the Page you want to connect
              <br />
              3. Add permissions: <strong>pages_manage_posts</strong>, <strong>pages_read_engagement</strong>
              <br />
              4. Click <strong>Generate Access Token</strong> and copy it here
            </Typography>
          </Box>
        </Box>
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 3 }}>
        <Button onClick={handleClose} variant="outlined" sx={{ textTransform: 'none' }}>
          Cancel
        </Button>
        <Button
          onClick={handleSubmit}
          variant="contained"
          disabled={loading || !pageAccessToken.trim()}
          sx={{
            background: 'linear-gradient(135deg, #1877F2 0%, #0D5FD9 100%)',
            textTransform: 'none',
            fontWeight: 600,
            boxShadow: '0 4px 12px rgba(24, 119, 242, 0.3)',
            '&:hover': {
              background: 'linear-gradient(135deg, #0D5FD9 0%, #1877F2 100%)',
            },
          }}
        >
          {loading ? 'Connecting...' : 'Connect Page'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ConnectFacebookModal;
