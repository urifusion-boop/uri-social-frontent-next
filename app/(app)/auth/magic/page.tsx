'use client';

import { AuthService } from '@/src/api/AuthService';
import { useAuth } from '@/src/providers/AuthProvider';
import { Box, CircularProgress, Typography, Alert, Button } from '@mui/material';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useEffect, useState } from 'react';
import posthog from 'posthog-js';
import { MdCheckCircle, MdError } from 'react-icons/md';

function MagicLinkContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { saveUserDetails, saveUserTokens } = useAuth();

  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('Authenticating...');
  const [redirectUrl, setRedirectUrl] = useState('/dashboard');
  const [hasVerified, setHasVerified] = useState(false);

  useEffect(() => {
    const token = searchParams.get('token');

    if (!token) {
      setStatus('error');
      setMessage('Invalid magic link. No authentication token provided.');
      return;
    }

    // Prevent duplicate verification requests
    if (hasVerified) {
      return;
    }
    setHasVerified(true);

    // Verify magic link
    AuthService.verifyMagicLink(token)
      .then((res) => {
        if (!res.status || !res.responseData) {
          setStatus('error');
          setMessage(res.responseMessage || 'Authentication failed. Please try again.');
          return;
        }

        const { accessToken, userId, email, firstName, lastName, redirect_url } = res.responseData;

        // Save tokens and user details (same as regular login)
        saveUserTokens({ accessToken: accessToken as string, refreshToken: '' });
        saveUserDetails({
          userId,
          email: email as string,
          firstName: firstName as string,
          lastName: lastName as string,
        });

        // Track successful magic link login
        posthog.capture('magic_link_login_completed', {
          user_id: userId,
          redirect_url: redirect_url || '/dashboard',
        });

        setStatus('success');
        setMessage('Authentication successful! Redirecting...');
        setRedirectUrl(redirect_url || '/dashboard');

        // Redirect after 1 second
        setTimeout(() => {
          router.push(redirect_url || '/dashboard');
        }, 1000);
      })
      .catch((error) => {
        console.error('Magic link verification error:', error);

        // Parse error message
        let errorMessage = 'Authentication failed. Please try again.';

        if (error.response?.data?.detail) {
          const detail = error.response.data.detail;
          if (detail.includes('expired')) {
            errorMessage = 'This magic link has expired. Please request a new one from WhatsApp.';
          } else if (detail.includes('already been used')) {
            errorMessage = 'This magic link has already been used. Please request a new one from WhatsApp.';
          } else if (detail.includes('Invalid')) {
            errorMessage = 'Invalid magic link. Please request a new one from WhatsApp.';
          } else {
            errorMessage = detail;
          }
        }

        setStatus('error');
        setMessage(errorMessage);

        // Track failed magic link login
        posthog.capture('magic_link_login_failed', {
          error: errorMessage,
        });
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        bgcolor: '#f5f5f5',
        p: 3,
      }}
    >
      <Box
        sx={{
          maxWidth: 500,
          width: '100%',
          bgcolor: 'white',
          borderRadius: 3,
          boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
          p: 4,
          textAlign: 'center',
        }}
      >
        {status === 'loading' && (
          <>
            <CircularProgress sx={{ color: '#CD1B78', mb: 3 }} size={60} />
            <Typography variant="h5" gutterBottom fontWeight={600}>
              Authenticating...
            </Typography>
            <Typography color="text.secondary">Please wait while we verify your magic link.</Typography>
          </>
        )}

        {status === 'success' && (
          <>
            <Box
              sx={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: 80,
                height: 80,
                borderRadius: '50%',
                bgcolor: '#E8F5E9',
                mb: 3,
              }}
            >
              <MdCheckCircle size={48} color="#4CAF50" />
            </Box>
            <Typography variant="h5" gutterBottom fontWeight={600}>
              Welcome Back!
            </Typography>
            <Typography color="text.secondary" sx={{ mb: 2 }}>
              {message}
            </Typography>
          </>
        )}

        {status === 'error' && (
          <>
            <Box
              sx={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: 80,
                height: 80,
                borderRadius: '50%',
                bgcolor: '#FFEBEE',
                mb: 3,
              }}
            >
              <MdError size={48} color="#F44336" />
            </Box>
            <Typography variant="h5" gutterBottom fontWeight={600}>
              Authentication Failed
            </Typography>
            <Alert severity="error" sx={{ mt: 2, mb: 3, textAlign: 'left' }}>
              {message}
            </Alert>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <Button
                variant="contained"
                onClick={() => router.push('/login')}
                sx={{
                  bgcolor: '#CD1B78',
                  '&:hover': { bgcolor: '#A01560' },
                  textTransform: 'none',
                  fontWeight: 600,
                  py: 1.5,
                }}
              >
                Go to Login
              </Button>
              <Typography variant="body2" color="text.secondary">
                Or contact us on WhatsApp for a new magic link
              </Typography>
            </Box>
          </>
        )}
      </Box>

      {/* Footer */}
      <Typography variant="caption" color="text.secondary" sx={{ mt: 4 }}>
        Secured by Uri Social • Enterprise-grade authentication
      </Typography>
    </Box>
  );
}

export default function MagicLinkPage() {
  return (
    <Suspense
      fallback={
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="100vh">
          <CircularProgress sx={{ color: '#CD1B78' }} />
        </Box>
      }
    >
      <MagicLinkContent />
    </Suspense>
  );
}
