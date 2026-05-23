'use client';

import { AuthService } from '@/src/api/AuthService';
import posthog from 'posthog-js';
import { Box, Button, CircularProgress, TextField, Typography, Alert, Fade, Collapse } from '@mui/material';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { MdOutlineCampaign, MdCheckCircle, MdError, MdLockReset } from 'react-icons/md';

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [emailError, setEmailError] = useState('');

  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email.trim()) {
      setEmailError('Email is required');
      return false;
    }
    if (!emailRegex.test(email)) {
      setEmailError('Please enter a valid email address');
      return false;
    }
    setEmailError('');
    return true;
  };

  const handleSubmit = async () => {
    setError('');
    setSuccess('');

    if (!validateEmail(email)) {
      return;
    }

    setLoading(true);
    try {
      const res = await AuthService.forgotPassword({ email });

      if (!res.status) {
        setError(res.responseMessage || 'Failed to send reset code. Please try again.');
        return;
      }

      setSuccess('If an account exists with this email, a password reset code has been sent. Please check your inbox.');
      posthog.capture('password_reset_requested', { email });

      // Redirect to reset password page after 2 seconds
      setTimeout(() => {
        router.push(`/reset-password?email=${encodeURIComponent(email)}`);
      }, 2000);
    } catch (err: unknown) {
      const e = err as {
        data?: { detail?: string; responseMessage?: string };
        message?: string;
        response?: { data?: { detail?: string } };
      };
      const detail =
        e?.response?.data?.detail ||
        e?.data?.detail ||
        e?.data?.responseMessage ||
        e?.message ||
        'Failed to send reset code.';
      setError(detail);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #FDF2F8 0%, #F9FAFB 100%)',
        px: 2,
        py: { xs: 10, sm: 12 },
      }}
    >
      <Fade in timeout={500}>
        <Box
          sx={{
            background: '#fff',
            borderRadius: '16px',
            p: { xs: 2.5, md: 3 },
            maxWidth: 440,
            width: '100%',
            boxShadow: '0 8px 32px rgba(0,0,0,0.08)',
            my: 'auto',
          }}
        >
          {/* Header */}
          <Box display="flex" alignItems="center" gap={1.5} mb={3}>
            <Box
              sx={{
                backgroundColor: '#CD1B78',
                p: '8px',
                borderRadius: '10px',
                display: 'flex',
                boxShadow: '0 4px 12px rgba(205, 27, 120, 0.3)',
              }}
            >
              <MdOutlineCampaign size={24} color="#fff" />
            </Box>
            <Box>
              <Typography fontWeight={800} fontSize="20px" color="#111827">
                URI Agent
              </Typography>
              <Typography fontSize="12px" color="#6B7280" fontWeight={500}>
                Password Recovery
              </Typography>
            </Box>
          </Box>

          {/* Lock Icon */}
          <Box display="flex" justifyContent="center" mb={2}>
            <Box
              sx={{
                backgroundColor: '#FDF2F8',
                p: 2.5,
                borderRadius: '50%',
                display: 'inline-flex',
              }}
            >
              <MdLockReset size={48} color="#CD1B78" />
            </Box>
          </Box>

          {/* Title */}
          <Typography fontWeight={700} fontSize="24px" color="#111827" textAlign="center" mb={1}>
            Forgot Password?
          </Typography>
          <Typography fontSize="14px" color="#6B7280" textAlign="center" mb={3}>
            No worries! Enter your email address and we'll send you a code to reset your password.
          </Typography>

          {/* Success Message */}
          <Collapse in={!!success}>
            <Alert
              icon={<MdCheckCircle fontSize={18} />}
              severity="success"
              sx={{ mb: 1.5, borderRadius: '8px', fontWeight: 500, fontSize: '13px', py: 0.5 }}
            >
              {success}
            </Alert>
          </Collapse>

          {/* Error Message */}
          <Collapse in={!!error}>
            <Alert
              icon={<MdError fontSize={18} />}
              severity="error"
              sx={{ mb: 1.5, borderRadius: '8px', fontWeight: 500, fontSize: '13px', py: 0.5 }}
              onClose={() => setError('')}
            >
              {error}
            </Alert>
          </Collapse>

          {/* Form */}
          <Box
            component="form"
            onSubmit={(e) => {
              e.preventDefault();
              handleSubmit();
            }}
          >
            {/* Email */}
            <TextField
              label="Email Address"
              type="email"
              fullWidth
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                if (emailError) validateEmail(e.target.value);
              }}
              onBlur={() => validateEmail(email)}
              onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
              error={!!emailError}
              helperText={emailError}
              sx={{
                mb: 2,
                '& .MuiOutlinedInput-root': {
                  borderRadius: '10px',
                  '&.Mui-focused fieldset': { borderColor: '#CD1B78' },
                },
                '& .MuiInputLabel-root.Mui-focused': { color: '#CD1B78' },
              }}
            />

            {/* Submit Button */}
            <Button
              type="submit"
              variant="contained"
              fullWidth
              disabled={loading || !!success}
              startIcon={loading ? <CircularProgress size={18} color="inherit" /> : null}
              sx={{
                background: 'linear-gradient(135deg, #CD1B78 0%, #A01560 100%)',
                textTransform: 'none',
                fontWeight: 600,
                fontSize: '16px',
                py: 1.5,
                borderRadius: '10px',
                boxShadow: '0 4px 14px rgba(205, 27, 120, 0.35)',
                '&:hover': {
                  background: 'linear-gradient(135deg, #A01560 0%, #7D1049 100%)',
                  boxShadow: '0 6px 20px rgba(205, 27, 120, 0.45)',
                },
                '&:disabled': {
                  background: '#E5E7EB',
                  color: '#9CA3AF',
                },
              }}
            >
              Send Reset Code
            </Button>
          </Box>

          {/* Back to Login */}
          <Typography fontSize="13px" color="#6B7280" textAlign="center" mt={2.5}>
            Remember your password?{' '}
            <Typography
              component="span"
              fontSize="13px"
              color="#CD1B78"
              fontWeight={600}
              sx={{ cursor: 'pointer', '&:hover': { textDecoration: 'underline' } }}
              onClick={() => router.push('/login')}
            >
              Sign in
            </Typography>
          </Typography>
        </Box>
      </Fade>
    </Box>
  );
}
