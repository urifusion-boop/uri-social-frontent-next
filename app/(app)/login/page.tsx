'use client';

import { AuthService } from '@/src/api/AuthService';
import { BrandProfileService } from '@/src/api/BrandProfileService';
import { useAuth } from '@/src/providers/AuthProvider';
import {
  Box,
  Button,
  CircularProgress,
  Tab,
  Tabs,
  TextField,
  Typography,
  Alert,
  IconButton,
  InputAdornment,
  Fade,
  Collapse,
} from '@mui/material';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useState, useEffect, useRef } from 'react';
import { MdOutlineCampaign, MdVisibility, MdVisibilityOff, MdCheckCircle, MdError } from 'react-icons/md';

// Helper function to get user-friendly error messages
const getErrorMessage = (error: string, isLogin: boolean): string => {
  const errorLower = error.toLowerCase();

  // Handle specific error cases
  if (errorLower.includes('401') || errorLower.includes('invalid email or password')) {
    return 'Invalid email or password. Please check your credentials and try again.';
  }
  if (errorLower.includes('409') || errorLower.includes('already exists')) {
    return 'An account with this email already exists. Please login instead.';
  }
  if (errorLower.includes('403') || errorLower.includes('forbidden')) {
    return 'Access forbidden. Please check your credentials.';
  }
  if (errorLower.includes('404') || errorLower.includes('not found')) {
    return isLogin
      ? 'Account not found. Please check your email or create a new account.'
      : 'Service temporarily unavailable. Please try again.';
  }
  if (errorLower.includes('500') || errorLower.includes('internal server')) {
    return 'Server error occurred. Please try again in a moment.';
  }
  if (errorLower.includes('network') || errorLower.includes('connection')) {
    return 'Network error. Please check your internet connection.';
  }
  if (errorLower.includes('timeout')) {
    return 'Request timed out. Please try again.';
  }

  // Return the original error if no specific match
  return error || 'Something went wrong. Please try again.';
};

function LoginPageContent() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // Mount on client side only
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="100vh">
        <CircularProgress sx={{ color: '#CD1B78' }} />
      </Box>
    );
  }

  return <LoginContent />;
}

function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { saveUserTokens, saveUserDetails } = useAuth();
  const [tab, setTab] = useState<'login' | 'signup'>(searchParams.get('tab') === 'signup' ? 'signup' : 'login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');

  // Handle Google OAuth callback — fires when Google redirects back with ?code=
  const googleCallbackFired = useRef(false);
  useEffect(() => {
    const code = searchParams.get('code');
    if (!code || googleCallbackFired.current) return;
    // Mark immediately — prevents Strict Mode double-fire and refresh re-use
    googleCallbackFired.current = true;
    // Strip ?code= from the URL right away so a page refresh won't re-submit the spent code
    window.history.replaceState({}, document.title, window.location.pathname);
    const redirectUri = window.location.origin + '/login';
    setGoogleLoading(true);
    AuthService.googleAuth(code, redirectUri)
      .then(async (res) => {
        if (!res.status || !res.responseData) {
          setError(res.responseMessage || 'Google sign-in failed. Please try again.');
          return;
        }
        const { accessToken, userId, email: userEmail, firstName: fName, lastName: lName } = res.responseData;
        saveUserTokens({ accessToken, refreshToken: '' });
        saveUserDetails({ userId, email: userEmail, firstName: fName, lastName: lName });
        setSuccess('Signed in with Google! Redirecting...');
        const onboardingDone = await BrandProfileService.isOnboardingDone();
        setTimeout(() => router.push(onboardingDone ? '/workspace' : '/social-media/brand-setup'), 1000);
      })
      .catch(() => setError('Google sign-in failed. Please try again.'))
      .finally(() => setGoogleLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleGoogleSignIn = () => {
    const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
    if (!clientId) {
      setError('Google sign-in is not configured yet.');
      return;
    }
    const redirectUri = encodeURIComponent(window.location.origin + '/login');
    const scope = encodeURIComponent('openid email profile');
    window.location.href = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${clientId}&redirect_uri=${redirectUri}&response_type=code&scope=${scope}&access_type=offline&prompt=select_account`;
  };

  // Validate email format
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

  // Validate password
  const validatePassword = (password: string): boolean => {
    if (!password.trim()) {
      setPasswordError('Password is required');
      return false;
    }
    if (tab === 'signup' && password.length < 6) {
      setPasswordError('Password must be at least 6 characters');
      return false;
    }
    setPasswordError('');
    return true;
  };

  const handleSubmit = async () => {
    setError('');
    setSuccess('');

    // Validate inputs
    const isEmailValid = validateEmail(email);
    const isPasswordValid = validatePassword(password);

    if (!isEmailValid || !isPasswordValid) {
      return;
    }

    setLoading(true);
    try {
      const res =
        tab === 'login'
          ? await AuthService.loginApi({ email, password })
          : await AuthService.signupApi({ email, password, first_name: firstName, last_name: lastName });

      if (!res.status || !res.responseData) {
        setError(getErrorMessage(res.responseMessage || 'Authentication failed', tab === 'login'));
        return;
      }

      const { accessToken, userId, email: userEmail, firstName: fName, lastName: lName } = res.responseData;
      saveUserTokens({ accessToken, refreshToken: '' });
      saveUserDetails({ userId, email: userEmail, firstName: fName, lastName: lName });

      setSuccess(tab === 'login' ? 'Login successful! Redirecting...' : 'Account created successfully! Redirecting...');

      const onboardingDone = await BrandProfileService.isOnboardingDone();
      setTimeout(() => {
        router.push(onboardingDone ? '/workspace' : '/social-media/brand-setup');
      }, 1000);
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
        'Something went wrong.';
      setError(getErrorMessage(detail, tab === 'login'));
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
        py: 4,
      }}
    >
      <Fade in timeout={500}>
        <Box
          sx={{
            background: '#fff',
            borderRadius: '20px',
            p: { xs: 3, md: 4 },
            maxWidth: 480,
            width: '100%',
            boxShadow: '0 10px 40px rgba(0,0,0,0.1)',
          }}
        >
          {/* Header */}
          <Box display="flex" alignItems="center" gap={1.5} mb={4}>
            <Box
              sx={{
                backgroundColor: '#CD1B78',
                p: '10px',
                borderRadius: '12px',
                display: 'flex',
                boxShadow: '0 4px 12px rgba(205, 27, 120, 0.3)',
              }}
            >
              <MdOutlineCampaign size={28} color="#fff" />
            </Box>
            <Box>
              <Typography fontWeight={800} fontSize="22px" color="#111827">
                URI Agent
              </Typography>
              <Typography fontSize="13px" color="#6B7280" fontWeight={500}>
                Social Media Manager
              </Typography>
            </Box>
          </Box>

          {/* Tabs */}
          <Tabs
            value={tab}
            onChange={(_, v) => {
              setTab(v);
              setError('');
              setSuccess('');
              setEmailError('');
              setPasswordError('');
            }}
            sx={{
              mb: 3,
              '& .MuiTab-root': {
                textTransform: 'none',
                fontWeight: 600,
                fontSize: '15px',
                minWidth: 120,
              },
              '& .Mui-selected': { color: '#CD1B78' },
              '& .MuiTabs-indicator': { backgroundColor: '#CD1B78', height: 3 },
            }}
          >
            <Tab label="Sign In" value="login" />
            <Tab label="Create Account" value="signup" />
          </Tabs>

          {/* Success Message */}
          <Collapse in={!!success}>
            <Alert
              icon={<MdCheckCircle fontSize={20} />}
              severity="success"
              sx={{ mb: 2, borderRadius: '10px', fontWeight: 500 }}
            >
              {success}
            </Alert>
          </Collapse>

          {/* Error Message */}
          <Collapse in={!!error}>
            <Alert
              icon={<MdError fontSize={20} />}
              severity="error"
              sx={{ mb: 2, borderRadius: '10px', fontWeight: 500 }}
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
            {/* Name fields for signup */}
            {tab === 'signup' && (
              <Fade in timeout={300}>
                <Box display="flex" gap={2} mb={2}>
                  <TextField
                    label="First Name"
                    fullWidth
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        borderRadius: '10px',
                        '&.Mui-focused fieldset': { borderColor: '#CD1B78' },
                      },
                      '& .MuiInputLabel-root.Mui-focused': { color: '#CD1B78' },
                    }}
                  />
                  <TextField
                    label="Last Name"
                    fullWidth
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        borderRadius: '10px',
                        '&.Mui-focused fieldset': { borderColor: '#CD1B78' },
                      },
                      '& .MuiInputLabel-root.Mui-focused': { color: '#CD1B78' },
                    }}
                  />
                </Box>
              </Fade>
            )}

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

            {/* Password */}
            <TextField
              label="Password"
              type={showPassword ? 'text' : 'password'}
              fullWidth
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                if (passwordError) validatePassword(e.target.value);
              }}
              onBlur={() => validatePassword(password)}
              onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
              error={!!passwordError}
              helperText={passwordError || (tab === 'signup' ? 'Minimum 6 characters' : '')}
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
                mb: 3,
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
              {tab === 'login' ? 'Sign In' : 'Create Account'}
            </Button>
          </Box>

          {/* Divider */}
          <Box display="flex" alignItems="center" gap={1.5} my={2.5}>
            <Box sx={{ flex: 1, height: '1px', background: '#E5E7EB' }} />
            <Typography fontSize="12px" color="#9CA3AF" fontWeight={500}>or continue with</Typography>
            <Box sx={{ flex: 1, height: '1px', background: '#E5E7EB' }} />
          </Box>

          {/* Google Button */}
          <Button
            fullWidth
            variant="outlined"
            disabled={googleLoading || !!success}
            onClick={handleGoogleSignIn}
            startIcon={
              googleLoading ? (
                <CircularProgress size={18} sx={{ color: '#4285F4' }} />
              ) : (
                <svg width="18" height="18" viewBox="0 0 18 18">
                  <path fill="#4285F4" d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615z"/>
                  <path fill="#34A853" d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z"/>
                  <path fill="#FBBC05" d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332z"/>
                  <path fill="#EA4335" d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z"/>
                </svg>
              )
            }
            sx={{
              textTransform: 'none',
              fontWeight: 600,
              fontSize: '15px',
              py: 1.4,
              borderRadius: '10px',
              borderColor: '#E5E7EB',
              color: '#374151',
              background: '#fff',
              '&:hover': { borderColor: '#D1D5DB', background: '#F9FAFB' },
            }}
          >
            {tab === 'login' ? 'Sign in with Google' : 'Sign up with Google'}
          </Button>

          {/* Footer text */}
          {tab === 'login' && (
            <Typography fontSize="13px" color="#6B7280" textAlign="center" mt={3}>
              Don't have an account?{' '}
              <Typography
                component="span"
                fontSize="13px"
                color="#CD1B78"
                fontWeight={600}
                sx={{ cursor: 'pointer', '&:hover': { textDecoration: 'underline' } }}
                onClick={() => setTab('signup')}
              >
                Sign up
              </Typography>
            </Typography>
          )}

          {tab === 'signup' && (
            <Typography fontSize="13px" color="#6B7280" textAlign="center" mt={3}>
              Already have an account?{' '}
              <Typography
                component="span"
                fontSize="13px"
                color="#CD1B78"
                fontWeight={600}
                sx={{ cursor: 'pointer', '&:hover': { textDecoration: 'underline' } }}
                onClick={() => setTab('login')}
              >
                Sign in
              </Typography>
            </Typography>
          )}
        </Box>
      </Fade>
    </Box>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <LoginPageContent />
    </Suspense>
  );
}
