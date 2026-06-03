'use client';

import { AuthService } from '@/src/api/AuthService';
import { BrandProfileService } from '@/src/api/BrandProfileService';
import { useAuth } from '@/src/providers/AuthProvider';
import posthog from 'posthog-js';
import { Box, Button, CircularProgress, TextField, Typography, Alert, Fade, Collapse } from '@mui/material';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useState, useEffect } from 'react';
import { MdOutlineCampaign, MdCheckCircle, MdError, MdEmail } from 'react-icons/md';

function VerifyEmailContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { saveUserTokens, saveUserDetails, userDetails } = useAuth();
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [resendSuccess, setResendSuccess] = useState('');
  const [codeError, setCodeError] = useState('');
  const [autoSent, setAutoSent] = useState(false);

  // Get email from URL params or logged-in user
  const email = searchParams.get('email') || userDetails?.email || '';

  const validateCode = (code: string): boolean => {
    if (!code.trim()) {
      setCodeError('Verification code is required');
      return false;
    }
    if (code.length !== 6 || !/^\d{6}$/.test(code)) {
      setCodeError('Please enter a valid 6-digit code');
      return false;
    }
    setCodeError('');
    return true;
  };

  const handleVerify = async () => {
    setError('');
    setSuccess('');
    setResendSuccess('');

    if (!email) {
      setError('Email is required');
      return;
    }

    if (!validateCode(code)) {
      return;
    }

    setLoading(true);
    try {
      const res = await AuthService.verifyEmail({ email, code });

      if (!res.status || !res.responseData) {
        setError(res.responseMessage || 'Verification failed. Please try again.');
        return;
      }

      const {
        accessToken,
        userId,
        email: userEmail,
        firstName,
        lastName,
        trial,
      } = res.responseData as unknown as Record<string, unknown>;

      // Save tokens and user details
      saveUserTokens({ accessToken: accessToken as string, refreshToken: '' });
      const userDto: Record<string, unknown> = { userId, email: userEmail, firstName, lastName };
      if (trial && typeof trial === 'object') {
        const t = trial as Record<string, unknown>;
        userDto.isTrial = t.is_trial;
        userDto.trialActive = t.trial_active;
        userDto.trialCreditsRemaining = t.credits_remaining;
        userDto.trialDaysRemaining = t.days_remaining;
        userDto.trialEndDate = t.trial_end_date;
      }
      saveUserDetails(userDto as unknown as Parameters<typeof saveUserDetails>[0]);

      setSuccess('Email verified successfully! Redirecting to setup...');
      posthog.identify(String(userId), { email: userEmail as string, name: `${firstName} ${lastName}`.trim() });
      posthog.capture('email_verified', { method: 'code' });

      // Redirect to onboarding after verification
      setTimeout(async () => {
        const onboardingDone = await BrandProfileService.isOnboardingDone();
        router.push(onboardingDone ? '/workspace' : '/social-media/brand-setup');
      }, 1500);
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
        'Verification failed.';
      setError(detail);
    } finally {
      setLoading(false);
    }
  };

  const handleResendCode = async () => {
    setError('');
    setSuccess('');
    setResendSuccess('');

    if (!email) {
      setError('Email is required');
      return;
    }

    setResendLoading(true);
    try {
      const res = await AuthService.resendVerification({ email });

      if (!res.status) {
        setError(res.responseMessage || 'Failed to resend code. Please try again.');
        return;
      }

      setResendSuccess('✅ Code sent! Check your inbox and spam/junk folder.');
      posthog.capture('verification_code_resent', { email });
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
        'Failed to resend code.';
      setError(detail);
    } finally {
      setResendLoading(false);
    }
  };

  // Auto-send verification code when page loads
  useEffect(() => {
    if (email && !autoSent) {
      setAutoSent(true);
      // Send verification code automatically
      AuthService.resendVerification({ email })
        .then((res) => {
          if (res.status) {
            setResendSuccess('Verification code sent to your email!');
          }
        })
        .catch(() => {
          // Silently fail, user can still click resend
        });
    }
  }, [email, autoSent]);

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #FDF2F8 0%, #F9FAFB 100%)',
        px: 2,
        py: 4,
      }}
    >
      <Fade in timeout={500}>
        <Box
          sx={{
            background: '#fff',
            borderRadius: '16px',
            p: { xs: 1.5, md: 2 },
            maxWidth: 440,
            width: '100%',
            boxShadow: '0 8px 32px rgba(0,0,0,0.08)',
            my: 'auto',
          }}
        >
          {/* Header */}
          <Box display="flex" alignItems="center" gap={1.5} mb={1.5}>
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
                Email Verification
              </Typography>
            </Box>
          </Box>

          {/* Email Icon */}
          <Box display="flex" justifyContent="center" mb={1}>
            <Box
              sx={{
                backgroundColor: '#FDF2F8',
                p: 1.5,
                borderRadius: '50%',
                display: 'inline-flex',
              }}
            >
              <MdEmail size={36} color="#CD1B78" />
            </Box>
          </Box>

          {/* Title */}
          <Typography fontWeight={700} fontSize="20px" color="#111827" textAlign="center" mb={0.3}>
            Verify Your Email
          </Typography>
          <Typography fontSize="12px" color="#6B7280" textAlign="center" mb={0.5}>
            We've sent a 6-digit code to <strong>{email}</strong>. Please enter it below to verify your account.
          </Typography>

          {/* Spam Folder Notice */}
          <Alert
            severity="warning"
            icon={<MdEmail fontSize={18} />}
            sx={{
              mb: 1.5,
              borderRadius: '8px',
              fontSize: '12px',
              backgroundColor: '#FEF3C7',
              border: '1px solid #FCD34D',
              '& .MuiAlert-icon': { color: '#F59E0B' },
              '& .MuiAlert-message': { color: '#78350F', fontWeight: 500 },
            }}
          >
            📧 Can't find the code? <strong>Check your spam/junk folder!</strong>
          </Alert>

          {/* Success Message */}
          <Collapse in={!!success}>
            <Alert
              icon={<MdCheckCircle fontSize={16} />}
              severity="success"
              sx={{ mb: 1.2, borderRadius: '8px', fontWeight: 500, fontSize: '11px', py: 0.2 }}
            >
              {success}
            </Alert>
          </Collapse>

          {/* Resend Success Message */}
          <Collapse in={!!resendSuccess}>
            <Alert
              icon={<MdCheckCircle fontSize={16} />}
              severity="info"
              sx={{ mb: 1.2, borderRadius: '8px', fontWeight: 500, fontSize: '11px', py: 0.2 }}
            >
              {resendSuccess}
            </Alert>
          </Collapse>

          {/* Error Message */}
          <Collapse in={!!error}>
            <Alert
              icon={<MdError fontSize={16} />}
              severity="error"
              sx={{ mb: 1.2, borderRadius: '8px', fontWeight: 500, fontSize: '11px', py: 0.2 }}
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
              handleVerify();
            }}
          >
            {/* Verification Code */}
            <TextField
              label="Verification Code"
              fullWidth
              value={code}
              onChange={(e) => {
                const value = e.target.value.replace(/\D/g, '').slice(0, 6);
                setCode(value);
                if (codeError && value) validateCode(value);
              }}
              onBlur={() => code && validateCode(code)}
              onKeyDown={(e) => e.key === 'Enter' && handleVerify()}
              error={!!codeError}
              helperText={codeError || 'Enter the 6-digit code from your email'}
              placeholder="000000"
              inputProps={{
                maxLength: 6,
                style: { textAlign: 'center', fontSize: '24px', letterSpacing: '8px', fontWeight: 600 },
              }}
              sx={{
                mb: 1.5,
                '& .MuiOutlinedInput-root': {
                  borderRadius: '10px',
                  '&.Mui-focused fieldset': { borderColor: '#CD1B78' },
                },
                '& .MuiInputLabel-root.Mui-focused': { color: '#CD1B78' },
              }}
            />

            {/* Verify Button */}
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
                fontSize: '15px',
                py: 1.2,
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
              Verify Email
            </Button>
          </Box>

          {/* Divider */}
          <Box display="flex" alignItems="center" gap={1.5} my={1.5}>
            <Box sx={{ flex: 1, height: '1px', background: '#E5E7EB' }} />
          </Box>

          {/* Resend Code */}
          <Box textAlign="center">
            <Typography fontSize="12px" color="#6B7280" mb={0.8}>
              Didn't receive the code?
            </Typography>
            <Button
              variant="text"
              disabled={resendLoading || !!success}
              onClick={handleResendCode}
              startIcon={resendLoading ? <CircularProgress size={16} sx={{ color: '#CD1B78' }} /> : null}
              sx={{
                textTransform: 'none',
                fontWeight: 600,
                fontSize: '13px',
                color: '#CD1B78',
                '&:hover': {
                  backgroundColor: '#FDF2F8',
                },
              }}
            >
              Resend Code
            </Button>
          </Box>

          {/* Back to Login */}
          <Typography fontSize="12px" color="#6B7280" textAlign="center" mt={1.5}>
            <Typography
              component="span"
              fontSize="12px"
              color="#CD1B78"
              fontWeight={600}
              sx={{ cursor: 'pointer', '&:hover': { textDecoration: 'underline' } }}
              onClick={() => router.push('/login')}
            >
              Back to Sign In
            </Typography>
          </Typography>
        </Box>
      </Fade>
    </Box>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense
      fallback={
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="100vh">
          <CircularProgress sx={{ color: '#CD1B78' }} />
        </Box>
      }
    >
      <VerifyEmailContent />
    </Suspense>
  );
}
