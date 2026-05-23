'use client';

import { AuthService } from '@/src/api/AuthService';
import posthog from 'posthog-js';
import {
  Box,
  Button,
  CircularProgress,
  TextField,
  Typography,
  Alert,
  Fade,
  Collapse,
  IconButton,
  InputAdornment,
} from '@mui/material';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useState } from 'react';
import { MdOutlineCampaign, MdCheckCircle, MdError, MdLockReset, MdVisibility, MdVisibilityOff } from 'react-icons/md';

function ResetPasswordContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email] = useState(searchParams.get('email') || '');
  const [code, setCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [codeError, setCodeError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [confirmPasswordError, setConfirmPasswordError] = useState('');

  const validateCode = (code: string): boolean => {
    if (!code.trim()) {
      setCodeError('Reset code is required');
      return false;
    }
    if (code.length !== 6 || !/^\d{6}$/.test(code)) {
      setCodeError('Please enter a valid 6-digit code');
      return false;
    }
    setCodeError('');
    return true;
  };

  const validatePassword = (password: string): boolean => {
    if (!password.trim()) {
      setPasswordError('New password is required');
      return false;
    }
    if (password.length < 6) {
      setPasswordError('Password must be at least 6 characters');
      return false;
    }
    setPasswordError('');
    return true;
  };

  const validateConfirmPassword = (password: string, confirm: string): boolean => {
    if (!confirm.trim()) {
      setConfirmPasswordError('Please confirm your password');
      return false;
    }
    if (password !== confirm) {
      setConfirmPasswordError('Passwords do not match');
      return false;
    }
    setConfirmPasswordError('');
    return true;
  };

  const handleSubmit = async () => {
    setError('');
    setSuccess('');

    if (!email) {
      setError('Email is required');
      return;
    }

    const isCodeValid = validateCode(code);
    const isPasswordValid = validatePassword(newPassword);
    const isConfirmValid = validateConfirmPassword(newPassword, confirmPassword);

    if (!isCodeValid || !isPasswordValid || !isConfirmValid) {
      return;
    }

    setLoading(true);
    try {
      const res = await AuthService.resetPassword({
        email,
        code,
        new_password: newPassword,
      });

      if (!res.status) {
        setError(res.responseMessage || 'Failed to reset password. Please try again.');
        return;
      }

      setSuccess('Password reset successfully! Redirecting to login...');
      posthog.capture('password_reset_completed', { email });

      setTimeout(() => {
        router.push('/login');
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
        'Failed to reset password.';
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
                Reset Password
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
            Reset Your Password
          </Typography>
          <Typography fontSize="14px" color="#6B7280" textAlign="center" mb={3}>
            Enter the code we sent to <strong>{email}</strong> and choose a new password.
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
            {/* Reset Code */}
            <TextField
              label="Reset Code"
              fullWidth
              value={code}
              onChange={(e) => {
                const value = e.target.value.replace(/\D/g, '').slice(0, 6);
                setCode(value);
                if (codeError && value) validateCode(value);
              }}
              onBlur={() => code && validateCode(code)}
              error={!!codeError}
              helperText={codeError || 'Enter the 6-digit code from your email'}
              placeholder="000000"
              inputProps={{
                maxLength: 6,
                style: { textAlign: 'center', fontSize: '20px', letterSpacing: '6px', fontWeight: 600 },
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

            {/* New Password */}
            <TextField
              label="New Password"
              type={showPassword ? 'text' : 'password'}
              fullWidth
              value={newPassword}
              onChange={(e) => {
                setNewPassword(e.target.value);
                if (passwordError) validatePassword(e.target.value);
                if (confirmPassword) validateConfirmPassword(e.target.value, confirmPassword);
              }}
              onBlur={() => validatePassword(newPassword)}
              error={!!passwordError}
              helperText={passwordError || 'Minimum 6 characters'}
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton onClick={() => setShowPassword(!showPassword)} edge="end" sx={{ color: '#6B7280' }}>
                      {showPassword ? <MdVisibilityOff size={20} /> : <MdVisibility size={20} />}
                    </IconButton>
                  </InputAdornment>
                ),
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

            {/* Confirm Password */}
            <TextField
              label="Confirm New Password"
              type={showConfirmPassword ? 'text' : 'password'}
              fullWidth
              value={confirmPassword}
              onChange={(e) => {
                setConfirmPassword(e.target.value);
                if (confirmPasswordError) validateConfirmPassword(newPassword, e.target.value);
              }}
              onBlur={() => validateConfirmPassword(newPassword, confirmPassword)}
              onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
              error={!!confirmPasswordError}
              helperText={confirmPasswordError}
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      edge="end"
                      sx={{ color: '#6B7280' }}
                    >
                      {showConfirmPassword ? <MdVisibilityOff size={20} /> : <MdVisibility size={20} />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
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
              Reset Password
            </Button>
          </Box>

          {/* Back to Login */}
          <Typography fontSize="13px" color="#6B7280" textAlign="center" mt={2.5}>
            <Typography
              component="span"
              fontSize="13px"
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

export default function ResetPasswordPage() {
  return (
    <Suspense
      fallback={
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="100vh">
          <CircularProgress sx={{ color: '#CD1B78' }} />
        </Box>
      }
    >
      <ResetPasswordContent />
    </Suspense>
  );
}
