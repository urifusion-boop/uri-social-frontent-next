'use client';

import { AuthService } from '@/src/api/AuthService';
import { useAuth } from '@/src/providers/AuthProvider';
import { Box, Button, CircularProgress, Tab, Tabs, TextField, Typography } from '@mui/material';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useState } from 'react';
import { MdOutlineCampaign } from 'react-icons/md';

function LoginPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { saveUserTokens, saveUserDetails } = useAuth();
  const [tab, setTab] = useState<'login' | 'signup'>(
    searchParams.get('tab') === 'signup' ? 'signup' : 'login'
  );
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async () => {
    setError('');
    if (!email.trim() || !password.trim()) {
      setError('Email and password are required.');
      return;
    }
    setLoading(true);
    try {
      const res =
        tab === 'login'
          ? await AuthService.loginApi({ email, password })
          : await AuthService.signupApi({ email, password, first_name: firstName, last_name: lastName });

      if (!res.status || !res.responseData) {
        setError(res.responseMessage || 'Authentication failed.');
        return;
      }

      const { accessToken, userId, email: userEmail, firstName: fName, lastName: lName } = res.responseData;
      saveUserTokens({ accessToken, refreshToken: '' });
      saveUserDetails({ userId, email: userEmail, firstName: fName, lastName: lName });
      router.push('/workspace');
    } catch (err: unknown) {
      const e = err as { data?: { detail?: string }; message?: string };
      const detail = e?.data?.detail || e?.message || 'Something went wrong.';
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
      }}
    >
      <Box
        sx={{
          background: '#fff',
          borderRadius: '16px',
          p: 4,
          maxWidth: 440,
          width: '100%',
          boxShadow: '0 8px 32px rgba(0,0,0,0.08)',
        }}
      >
        <Box display="flex" alignItems="center" gap={1.5} mb={3}>
          <Box sx={{ backgroundColor: '#CD1B78', p: '8px', borderRadius: '10px', display: 'flex' }}>
            <MdOutlineCampaign size={24} color="#fff" />
          </Box>
          <Box>
            <Typography fontWeight={800} fontSize="20px" color="#111827">
              URI Agent
            </Typography>
            <Typography fontSize="12px" color="#6B7280">
              Social Media Manager
            </Typography>
          </Box>
        </Box>

        <Tabs
          value={tab}
          onChange={(_, v) => {
            setTab(v);
            setError('');
          }}
          sx={{ mb: 3, '& .MuiTab-root': { textTransform: 'none', fontWeight: 600 } }}
        >
          <Tab label="Sign In" value="login" />
          <Tab label="Create Account" value="signup" />
        </Tabs>

        {error && (
          <Box sx={{ background: '#FEE2E2', borderRadius: '8px', p: 1.5, mb: 2 }}>
            <Typography fontSize="13px" color="#991B1B">
              {error}
            </Typography>
          </Box>
        )}

        {tab === 'signup' && (
          <Box display="flex" gap={2} mb={2}>
            <TextField label="First Name" fullWidth value={firstName} onChange={(e) => setFirstName(e.target.value)} />
            <TextField label="Last Name" fullWidth value={lastName} onChange={(e) => setLastName(e.target.value)} />
          </Box>
        )}

        <TextField
          label="Email"
          type="email"
          fullWidth
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          sx={{ mb: 2 }}
        />
        <TextField
          label="Password"
          type="password"
          fullWidth
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
          sx={{ mb: 3 }}
        />

        <Button
          variant="contained"
          fullWidth
          onClick={handleSubmit}
          disabled={loading}
          startIcon={loading ? <CircularProgress size={16} color="inherit" /> : null}
          sx={{
            background: 'linear-gradient(135deg, #CD1B78 0%, #A01560 100%)',
            textTransform: 'none',
            fontWeight: 600,
            py: 1.5,
            boxShadow: '0 4px 12px rgba(205, 27, 120, 0.3)',
            '&:hover': { background: 'linear-gradient(135deg, #A01560 0%, #7D1049 100%)' },
          }}
        >
          {tab === 'login' ? 'Sign In' : 'Create Account'}
        </Button>
      </Box>
    </Box>
  );
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginPageContent />
    </Suspense>
  );
}
