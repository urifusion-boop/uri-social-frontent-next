'use client';

import { SocialConnectionService } from '@/src/api/SocialConnectionService';
import DashboardLayout from '@/src/components/app/atoms/DashboardLayout';
import { Box, Button, CircularProgress, Typography } from '@mui/material';
import { useEffect, useState, type KeyboardEvent } from 'react';
import { FaCheckCircle, FaWhatsapp } from 'react-icons/fa';
import PhoneInput, { isValidPhoneNumber } from 'react-phone-number-input';
import 'react-phone-number-input/style.css';

type PageState = 'loading' | 'idle' | 'connected' | 'submitting' | 'disconnecting';

export default function WhatsAppConnectionPage() {
  const [pageState, setPageState] = useState<PageState>('loading');
  // E.164 string (e.g. "+2348012345678") or undefined while empty — the shape
  // react-phone-number-input's <PhoneInput> value/onChange expects. Real
  // per-country validation via libphonenumber-js (Google's own metadata),
  // not a hand-maintained country list/regex.
  const [phone, setPhone] = useState<string | undefined>(undefined);
  const [connectedPhone, setConnectedPhone] = useState('');
  const [connectedAt, setConnectedAt] = useState('');
  const [error, setError] = useState('');

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
    if (!phone) return;
    if (!isValidPhoneNumber(phone)) {
      setError("That doesn't look like a valid phone number — double-check the digits.");
      return;
    }
    setError('');
    setPageState('submitting');
    try {
      const res = await SocialConnectionService.whatsappConnect(phone);
      const detail = (res as unknown as { detail?: string }).detail;

      if (res.status) {
        const connected = res.responseData?.phone ?? phone;
        setConnectedPhone(connected);
        setPageState('connected');
      } else {
        // /whatsapp/connect only returns a "linked" conflict when the number
        // belongs to a DIFFERENT account — resubmitting your own already-linked
        // number succeeds normally (res.status true) instead of hitting this
        // branch at all, so there's no case here that should be treated as
        // success (this used to match "already linked"/"already connected" and
        // silently show Connected for a number that was actually rejected).
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
      setPhone(undefined);
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
            <Box
              sx={{
                background: '#fff',
                borderRadius: '16px',
                p: 3,
                boxShadow: '0 2px 12px rgba(0,0,0,0.06)',
                border: '1px solid #E5E7EB',
              }}
            >
              <Box display="flex" alignItems="center" gap={1.5} mb={2.5}>
                <Box
                  sx={{
                    width: 48,
                    height: 48,
                    borderRadius: '12px',
                    background: '#E8F9EF',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <FaWhatsapp size={26} color="#25D366" />
                </Box>
                <Box flex={1}>
                  <Box display="flex" alignItems="center" gap={1}>
                    <Typography fontWeight={700} fontSize="15px" color="#111827">
                      {connectedPhone}
                    </Typography>
                    <Box
                      sx={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 0.5,
                        background: '#ECFDF5',
                        px: 1,
                        py: 0.25,
                        borderRadius: '6px',
                      }}
                    >
                      <FaCheckCircle size={11} color="#10B981" />
                      <Typography fontSize="11px" fontWeight={600} color="#10B981">
                        Connected
                      </Typography>
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
                  Message <strong>+234 707 630 7855</strong> on WhatsApp to interact with your URI Agent.
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
            <Box
              sx={{
                background: '#fff',
                borderRadius: '16px',
                p: 3,
                boxShadow: '0 2px 12px rgba(0,0,0,0.06)',
                border: '1px solid #E5E7EB',
              }}
            >
              <Typography fontWeight={700} fontSize="15px" color="#111827" mb={0.5}>
                Connect your WhatsApp number
              </Typography>
              <Typography fontSize="13px" color="#6B7280" mb={2.5}>
                Enter your WhatsApp phone number to receive notifications and interact with your URI Agent.
              </Typography>

              <Box
                mb={1.5}
                sx={{
                  '& .PhoneInput': { display: 'flex', alignItems: 'center', gap: 1 },
                  '& .PhoneInputCountry': {
                    padding: '0 8px',
                    borderRadius: '10px',
                    border: `1px solid ${error ? '#EF4444' : '#E5E7EB'}`,
                    background: '#fff',
                  },
                  '& .PhoneInputInput': {
                    flex: 1,
                    minWidth: 0,
                    padding: '8.5px 12px',
                    borderRadius: '10px',
                    border: `1px solid ${error ? '#EF4444' : '#E5E7EB'}`,
                    fontSize: '13px',
                    outline: 'none',
                    fontFamily: 'inherit',
                  },
                }}
              >
                <PhoneInput
                  international
                  defaultCountry="NG"
                  value={phone}
                  onChange={(value: string | undefined) => {
                    setPhone(value);
                    setError('');
                  }}
                  disabled={pageState === 'submitting'}
                  placeholder="Enter phone number"
                  numberInputProps={{
                    onKeyDown: (e: KeyboardEvent) => e.key === 'Enter' && handleConnect(),
                    'aria-label': 'WhatsApp phone number',
                  }}
                />
              </Box>

              {error && (
                <Box
                  sx={{
                    background: '#FEF2F2',
                    borderRadius: '8px',
                    px: 1.5,
                    py: 1,
                    mb: 1.5,
                    border: '1px solid #FECACA',
                  }}
                >
                  <Typography fontSize="12.5px" color="#DC2626">
                    {error}
                  </Typography>
                </Box>
              )}

              <Button
                variant="contained"
                fullWidth
                onClick={handleConnect}
                disabled={!phone || pageState === 'submitting'}
                startIcon={
                  pageState === 'submitting' ? <CircularProgress size={14} color="inherit" /> : <FaWhatsapp size={15} />
                }
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
