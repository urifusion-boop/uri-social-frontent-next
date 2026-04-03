'use client';

import { SocialConnectionService } from '@/src/api/SocialConnectionService';
import DashboardLayout from '@/src/components/app/atoms/DashboardLayout';
import {
  Box,
  Button,
  CircularProgress,
  MenuItem,
  Select,
  TextField,
  Typography,
} from '@mui/material';
import { useEffect, useState } from 'react';
import { FaCheckCircle, FaWhatsapp } from 'react-icons/fa';

type PageState = 'loading' | 'idle' | 'connected' | 'submitting' | 'disconnecting';

const COUNTRY_CODES = [
  { code: '+1',   flag: '🇺🇸', label: 'US' },
  { code: '+44',  flag: '🇬🇧', label: 'GB' },
  { code: '+234', flag: '🇳🇬', label: 'NG' },
  { code: '+27',  flag: '🇿🇦', label: 'ZA' },
  { code: '+254', flag: '🇰🇪', label: 'KE' },
  { code: '+233', flag: '🇬🇭', label: 'GH' },
  { code: '+49',  flag: '🇩🇪', label: 'DE' },
  { code: '+33',  flag: '🇫🇷', label: 'FR' },
  { code: '+91',  flag: '🇮🇳', label: 'IN' },
  { code: '+86',  flag: '🇨🇳', label: 'CN' },
  { code: '+55',  flag: '🇧🇷', label: 'BR' },
  { code: '+52',  flag: '🇲🇽', label: 'MX' },
  { code: '+971', flag: '🇦🇪', label: 'AE' },
  { code: '+966', flag: '🇸🇦', label: 'SA' },
];

export default function WhatsAppConnectionPage() {
  const [pageState, setPageState] = useState<PageState>('loading');
  const [countryCode, setCountryCode] = useState('+234');
  const [localNumber, setLocalNumber] = useState('');
  const [connectedPhone, setConnectedPhone] = useState('');
  const [connectedAt, setConnectedAt] = useState('');
  const [error, setError] = useState('');

  const fullPhone = `${countryCode}${localNumber.replace(/^0+/, '')}`;

  useEffect(() => {
    const check = async () => {
      try {
        const res = await SocialConnectionService.whatsappStatus();
        if (res?.responseData?.linked) {
          setConnectedPhone(res.responseData.phone ?? '');
          setConnectedAt(res.responseData.linked_at ?? '');
          setPageState('connected');
        } else {
          setPageState('idle');
        }
      } catch {
        setPageState('idle');
      }
    };
    check();
  }, []);

  const handleConnect = async () => {
    if (!localNumber.trim()) return;
    setError('');
    setPageState('submitting');
    try {
      const res = await SocialConnectionService.whatsappConnect(fullPhone);
      const detail = (res as unknown as { detail?: string }).detail;

      if (res.status) {
        const phone = res.responseData?.phone ?? fullPhone;
        setConnectedPhone(phone);
        setPageState('connected');
      } else if (detail?.toLowerCase().includes('already linked') || detail?.toLowerCase().includes('already connected')) {
        setConnectedPhone(fullPhone);
        setPageState('connected');
      } else {
        const msg = detail?.toLowerCase().includes('another account')
          ? 'This number is already linked to another account.'
          : detail || res.responseMessage || 'Failed to connect. Please try again.';
        setError(msg);
        setPageState('idle');
      }
    } catch {
      setError('Something went wrong. Please try again.');
      setPageState('idle');
    }
  };

  const handleDisconnect = async () => {
    setPageState('disconnecting');
    try {
      await SocialConnectionService.whatsappDisconnect();
    } finally {
      setConnectedPhone('');
      setConnectedAt('');
      setLocalNumber('');
      setPageState('idle');
    }
  };

  const formatConnectedAt = (iso: string) => {
    if (!iso) return '';
    try {
      return new Date(iso).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' });
    } catch {
      return '';
    }
  };

  return (
    <DashboardLayout>
      <Box sx={{ backgroundColor: '#FAFAFA', minHeight: '100vh' }}>
        {/* Header */}
        <Box sx={{ backgroundColor: '#fff', pt: '52px', pb: '24px', px: 3, borderBottom: '1px solid #E5E7EB' }}>
          <Box display="flex" alignItems="center" gap={1.5}>
            <Box sx={{ backgroundColor: '#25D366', p: '8px', borderRadius: '8px', display: 'flex' }}>
              <FaWhatsapp size={24} color="#fff" />
            </Box>
            <Box>
              <Typography fontWeight={800} fontSize="24px" color="#111827" lineHeight={1}>
                WhatsApp
              </Typography>
              <Typography fontSize="13px" color="#6B7280" mt={0.25}>
                Receive AI-generated draft notifications via WhatsApp
              </Typography>
            </Box>
          </Box>
        </Box>

        {/* Content */}
        <Box sx={{ px: 3, py: 4, maxWidth: 520 }}>
          {pageState === 'loading' && (
            <Box display="flex" justifyContent="center" py={8}>
              <CircularProgress sx={{ color: '#25D366' }} />
            </Box>
          )}

          {/* ── CONNECTED STATE ── */}
          {(pageState === 'connected' || pageState === 'disconnecting') && (
            <Box sx={{ background: '#fff', borderRadius: '16px', p: 3, boxShadow: '0 2px 12px rgba(0,0,0,0.06)', border: '1px solid #E5E7EB' }}>
              <Box display="flex" alignItems="center" gap={1.5} mb={2.5}>
                <Box sx={{ width: 48, height: 48, borderRadius: '12px', background: '#E8F9EF', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <FaWhatsapp size={26} color="#25D366" />
                </Box>
                <Box flex={1}>
                  <Box display="flex" alignItems="center" gap={1}>
                    <Typography fontWeight={700} fontSize="15px" color="#111827">
                      {connectedPhone}
                    </Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, background: '#ECFDF5', px: 1, py: 0.25, borderRadius: '6px' }}>
                      <FaCheckCircle size={11} color="#10B981" />
                      <Typography fontSize="11px" fontWeight={600} color="#10B981">Connected</Typography>
                    </Box>
                  </Box>
                  {connectedAt && (
                    <Typography fontSize="12px" color="#9CA3AF" mt={0.25}>
                      Connected {formatConnectedAt(connectedAt)}
                    </Typography>
                  )}
                </Box>
              </Box>

              <Box sx={{ background: '#F0FDF4', borderRadius: '10px', p: 2, mb: 2.5, border: '1px solid #BBF7D0' }}>
                <Typography fontSize="13px" color="#166534" fontWeight={500}>
                  Message <strong>+1 415 523 8886</strong> on WhatsApp to interact with your URI Agent.
                </Typography>
              </Box>

              <Button
                variant="outlined"
                fullWidth
                onClick={handleDisconnect}
                disabled={pageState === 'disconnecting'}
                startIcon={pageState === 'disconnecting' ? <CircularProgress size={14} color="inherit" /> : null}
                sx={{
                  borderColor: '#E5E7EB',
                  color: '#6B7280',
                  textTransform: 'none',
                  fontWeight: 600,
                  borderRadius: '10px',
                  py: 1.25,
                  '&:hover': { borderColor: '#EF4444', color: '#EF4444', background: '#FEF2F2' },
                }}
              >
                Disconnect WhatsApp
              </Button>
            </Box>
          )}

          {/* ── IDLE / SUBMITTING STATE ── */}
          {(pageState === 'idle' || pageState === 'submitting') && (
            <Box sx={{ background: '#fff', borderRadius: '16px', p: 3, boxShadow: '0 2px 12px rgba(0,0,0,0.06)', border: '1px solid #E5E7EB' }}>
              <Typography fontWeight={700} fontSize="15px" color="#111827" mb={0.5}>
                Connect your WhatsApp number
              </Typography>
              <Typography fontSize="13px" color="#6B7280" mb={2.5}>
                Enter your WhatsApp phone number to receive notifications and interact with your URI Agent.
              </Typography>

              <Box display="flex" gap={1} mb={1.5}>
                <Select
                  value={countryCode}
                  onChange={(e) => setCountryCode(e.target.value)}
                  size="small"
                  disabled={pageState === 'submitting'}
                  sx={{
                    width: 110,
                    borderRadius: '10px',
                    fontSize: '13px',
                    flexShrink: 0,
                    '& .MuiOutlinedInput-notchedOutline': { borderColor: '#E5E7EB' },
                  }}
                  renderValue={(v) => {
                    const c = COUNTRY_CODES.find((x) => x.code === v);
                    return c ? `${c.flag} ${c.code}` : v;
                  }}
                >
                  {COUNTRY_CODES.map((c) => (
                    <MenuItem key={c.code} value={c.code} sx={{ fontSize: '13px' }}>
                      {c.flag} {c.code} {c.label}
                    </MenuItem>
                  ))}
                </Select>

                <TextField
                  placeholder="8012345678"
                  value={localNumber}
                  onChange={(e) => {
                    setLocalNumber(e.target.value.replace(/[^\d]/g, ''));
                    setError('');
                  }}
                  onKeyDown={(e) => e.key === 'Enter' && handleConnect()}
                  disabled={pageState === 'submitting'}
                  size="small"
                  fullWidth
                  inputProps={{ inputMode: 'tel' }}
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      borderRadius: '10px',
                      fontSize: '13px',
                      '& fieldset': { borderColor: error ? '#EF4444' : '#E5E7EB' },
                    },
                  }}
                />
              </Box>

              {error && (
                <Box sx={{ background: '#FEF2F2', borderRadius: '8px', px: 1.5, py: 1, mb: 1.5, border: '1px solid #FECACA' }}>
                  <Typography fontSize="12.5px" color="#DC2626">{error}</Typography>
                </Box>
              )}

              <Button
                variant="contained"
                fullWidth
                onClick={handleConnect}
                disabled={!localNumber.trim() || pageState === 'submitting'}
                startIcon={pageState === 'submitting' ? <CircularProgress size={14} color="inherit" /> : <FaWhatsapp size={15} />}
                sx={{
                  background: 'linear-gradient(135deg, #25D366 0%, #1DA851 100%)',
                  textTransform: 'none',
                  fontWeight: 600,
                  borderRadius: '10px',
                  py: 1.25,
                  boxShadow: '0 4px 12px rgba(37,211,102,0.3)',
                  '&:hover': { background: 'linear-gradient(135deg, #1DA851 0%, #128C42 100%)' },
                  '&:disabled': { background: '#D1D5DB', boxShadow: 'none' },
                }}
              >
                {pageState === 'submitting' ? 'Connecting...' : 'Connect WhatsApp'}
              </Button>
            </Box>
          )}
        </Box>
      </Box>
    </DashboardLayout>
  );
}
