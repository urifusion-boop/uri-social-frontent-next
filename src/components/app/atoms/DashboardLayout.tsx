'use client';

import { useAuth } from '@/src/providers/AuthProvider';
import { Box, AppBar, Toolbar, Typography, IconButton } from '@mui/material';
import { useRouter } from 'next/navigation';
import { ReactNode } from 'react';
import { MdOutlineCampaign, MdSettings, MdLogout } from 'react-icons/md';

interface DashboardLayoutProps {
  children: ReactNode;
  excludeHeader?: boolean;
}

const DashboardLayout = ({ children, excludeHeader = false }: DashboardLayoutProps) => {
  const { logoutUser } = useAuth();
  const router = useRouter();

  return (
    <Box sx={{ minHeight: '100vh', backgroundColor: '#FAFAFA' }}>
      {!excludeHeader && (
        <AppBar position="fixed" sx={{ backgroundColor: '#fff', boxShadow: '0 1px 4px rgba(0,0,0,0.08)', zIndex: 1200 }}>
          <Toolbar sx={{ justifyContent: 'space-between' }}>
            <Box display="flex" alignItems="center" gap={1} sx={{ cursor: 'pointer' }} onClick={() => router.push('/workspace')}>
              <Box sx={{ backgroundColor: '#CD1B78', p: '6px', borderRadius: '8px', display: 'flex' }}>
                <MdOutlineCampaign size={20} color="#fff" />
              </Box>
              <Typography fontWeight={700} color="#111827" fontSize="16px">
                URI Agent
              </Typography>
            </Box>
            <Box display="flex" gap={1}>
              <IconButton onClick={() => router.push('/settings/social-accounts')} size="small" title="Social Accounts">
                <MdSettings size={20} color="#6B7280" />
              </IconButton>
              <IconButton onClick={logoutUser} size="small" title="Logout">
                <MdLogout size={20} color="#6B7280" />
              </IconButton>
            </Box>
          </Toolbar>
        </AppBar>
      )}
      <Box sx={{ pt: excludeHeader ? 0 : '64px' }}>{children}</Box>
    </Box>
  );
};

export default DashboardLayout;
