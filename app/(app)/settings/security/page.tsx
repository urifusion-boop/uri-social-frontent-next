'use client';

import DashboardLayout from '@/src/components/app/atoms/DashboardLayout';
import { AuthService } from '@/src/api/AuthService';
import { useState } from 'react';
import { Shield, Eye, EyeOff } from 'lucide-react';
import { TextField, Button, Alert, Box, Typography, InputAdornment, IconButton } from '@mui/material';
import { useRouter } from 'next/navigation';

export default function SecurityPage() {
  const router = useRouter();
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showOldPassword, setShowOldPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleChangePassword = async () => {
    setError('');
    setSuccess('');

    // Validation
    if (!oldPassword || !newPassword || !confirmPassword) {
      setError('All fields are required.');
      return;
    }

    if (newPassword.length < 8) {
      setError('New password must be at least 8 characters long.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('New passwords do not match.');
      return;
    }

    if (oldPassword === newPassword) {
      setError('New password must be different from current password.');
      return;
    }

    setLoading(true);

    try {
      const res = await AuthService.changePassword({
        old_password: oldPassword,
        new_password: newPassword,
      });

      if (!res.status) {
        setError(res.responseMessage || 'Failed to change password.');
        setLoading(false);
        return;
      }

      setSuccess('Password changed successfully!');
      setOldPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setLoading(false);

      setTimeout(() => {
        router.push('/settings');
      }, 2000);
    } catch (err: unknown) {
      const error = err as { response?: { data?: { detail?: string } } };
      setError(error.response?.data?.detail || 'Failed to change password. Please try again.');
      setLoading(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-2xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <button
              onClick={() => router.push('/settings')}
              className="text-sm text-gray-600 hover:text-[#CD1B78] mb-4 flex items-center gap-2"
            >
              ← Back to Settings
            </button>
            <div className="flex items-center gap-3 mb-2">
              <Shield className="w-8 h-8 text-[#CD1B78]" />
              <h1 className="text-3xl font-bold text-gray-900">Security</h1>
            </div>
            <p className="text-gray-600">Manage your password and account security</p>
          </div>

          {/* Change Password Card */}
          <div className="bg-white rounded-xl p-8 border border-gray-200 shadow-sm">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">Change Password</h2>

            {error && (
              <Alert severity="error" sx={{ mb: 3 }}>
                {error}
              </Alert>
            )}

            {success && (
              <Alert severity="success" sx={{ mb: 3 }}>
                {success}
              </Alert>
            )}

            <Box display="flex" flexDirection="column" gap={3}>
              {/* Current Password */}
              <TextField
                label="Current Password"
                type={showOldPassword ? 'text' : 'password'}
                fullWidth
                value={oldPassword}
                onChange={(e) => setOldPassword(e.target.value)}
                disabled={loading}
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton onClick={() => setShowOldPassword(!showOldPassword)} edge="end" size="small">
                        {showOldPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    '&.Mui-focused fieldset': {
                      borderColor: '#CD1B78',
                      borderWidth: '1px',
                    },
                  },
                  '& .MuiInputLabel-root.Mui-focused': {
                    color: '#CD1B78',
                  },
                }}
              />

              {/* New Password */}
              <TextField
                label="New Password"
                type={showNewPassword ? 'text' : 'password'}
                fullWidth
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                disabled={loading}
                helperText="Must be at least 8 characters"
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton onClick={() => setShowNewPassword(!showNewPassword)} edge="end" size="small">
                        {showNewPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    '&.Mui-focused fieldset': {
                      borderColor: '#CD1B78',
                      borderWidth: '1px',
                    },
                  },
                  '& .MuiInputLabel-root.Mui-focused': {
                    color: '#CD1B78',
                  },
                }}
              />

              {/* Confirm New Password */}
              <TextField
                label="Confirm New Password"
                type={showConfirmPassword ? 'text' : 'password'}
                fullWidth
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                disabled={loading}
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton onClick={() => setShowConfirmPassword(!showConfirmPassword)} edge="end" size="small">
                        {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    '&.Mui-focused fieldset': {
                      borderColor: '#CD1B78',
                      borderWidth: '1px',
                    },
                  },
                  '& .MuiInputLabel-root.Mui-focused': {
                    color: '#CD1B78',
                  },
                }}
              />

              {/* Submit Button */}
              <Button
                fullWidth
                onClick={handleChangePassword}
                disabled={loading}
                sx={{
                  mt: 2,
                  height: '44px',
                  backgroundColor: '#CD1B78',
                  color: 'white',
                  fontWeight: 600,
                  fontSize: '15px',
                  textTransform: 'none',
                  borderRadius: '8px',
                  '&:hover': {
                    backgroundColor: '#A01560',
                  },
                  '&:disabled': {
                    backgroundColor: '#E5E7EB',
                    color: '#9CA3AF',
                  },
                }}
              >
                {loading ? 'Changing Password...' : 'Change Password'}
              </Button>
            </Box>

            {/* Security Tips */}
            <div className="mt-8 pt-6 border-t border-gray-200">
              <Typography variant="body2" fontWeight={600} color="text.secondary" mb={2}>
                Password Security Tips
              </Typography>
              <ul className="text-sm text-gray-600 space-y-1.5 ml-4">
                <li>• Use at least 8 characters with a mix of letters, numbers, and symbols</li>
                <li>• Don't reuse passwords from other accounts</li>
                <li>• Change your password regularly</li>
                <li>• Never share your password with anyone</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
