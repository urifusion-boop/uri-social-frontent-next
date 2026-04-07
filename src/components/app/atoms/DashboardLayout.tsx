'use client';

import { useAuth } from '@/src/providers/AuthProvider';
import { Box, AppBar, Toolbar, Typography } from '@mui/material';
import { useRouter } from 'next/navigation';
import { ReactNode } from 'react';
import { MdOutlineCampaign } from 'react-icons/md';
import UserProfileMenu from './UserProfileMenu';
import CreditDisplay from './CreditDisplay';

interface DashboardLayoutProps {
  children: ReactNode;
  excludeHeader?: boolean;
}

const DashboardLayout = ({ children, excludeHeader = false }: DashboardLayoutProps) => {
  const { isAuthenticated } = useAuth();
  const router = useRouter();

  return (
    <Box sx={{ minHeight: '100vh', backgroundColor: '#FAFAFA' }}>
      {!excludeHeader && (
        <AppBar
          position="fixed"
          sx={{ backgroundColor: '#fff', boxShadow: '0 1px 4px rgba(0,0,0,0.08)', zIndex: 1200 }}
        >
          <Toolbar sx={{ justifyContent: 'space-between' }}>
            {/* Logo/Brand */}
            <Box
              display="flex"
              alignItems="center"
              gap={1}
              sx={{
                cursor: 'pointer',
                transition: 'opacity 0.2s',
                '&:hover': { opacity: 0.8 },
              }}
              onClick={() => router.push('/social-media')}
            >
              <Box sx={{ backgroundColor: '#CD1B78', p: '6px', borderRadius: '8px', display: 'flex' }}>
                <MdOutlineCampaign size={20} color="#fff" />
              </Box>
              <Typography fontWeight={700} color="#111827" fontSize="16px">
                URI Agent
              </Typography>
            </Box>

            {/* Credit Display & User Profile Menu */}
            <Box display="flex" alignItems="center" gap={2}>
              {isAuthenticated && <CreditDisplay />}
              {isAuthenticated && <UserProfileMenu />}
            </Box>
          </Toolbar>
        </AppBar>
      )}
      <Box sx={{ pt: excludeHeader ? 0 : '64px' }}>{children}</Box>
    </Box>
  );
};

export default DashboardLayout;
