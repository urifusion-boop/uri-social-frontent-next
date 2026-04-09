'use client';

import { useAuth } from '@/src/providers/AuthProvider';
import { Box, Menu, MenuItem, Avatar, Typography, Divider, ListItemIcon } from '@mui/material';
import { useState, MouseEvent } from 'react';
import { MdPerson, MdLogout, MdSettings, MdAccountCircle } from 'react-icons/md';
import { useRouter } from 'next/navigation';

const UserProfileMenu = () => {
  const { userDetails, logoutUser } = useAuth();
  const router = useRouter();
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const open = Boolean(anchorEl);

  const handleClick = (event: MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleProfile = () => {
    router.push('/profile');
    handleClose();
  };

  const handleSettings = () => {
    router.push('/workspace?tab=settings');
    handleClose();
  };

  const handleLogout = () => {
    handleClose();
    logoutUser();
  };

  // Get user initials for avatar
  const getInitials = () => {
    const firstName = userDetails?.firstName || '';
    const lastName = userDetails?.lastName || '';
    if (firstName && lastName) {
      return `${firstName[0]}${lastName[0]}`.toUpperCase();
    }
    if (firstName) return firstName[0].toUpperCase();
    if (userDetails?.email) return userDetails.email[0].toUpperCase();
    return 'U';
  };

  // Get display name
  const getDisplayName = () => {
    const firstName = userDetails?.firstName || '';
    const lastName = userDetails?.lastName || '';
    if (firstName && lastName) {
      return `${firstName} ${lastName}`;
    }
    if (firstName) return firstName;
    if (lastName) return lastName;
    return userDetails?.email?.split('@')[0] || 'User';
  };

  if (!userDetails) {
    return null;
  }

  return (
    <>
      <Box
        onClick={handleClick}
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 1,
          cursor: 'pointer',
          padding: '6px 12px',
          borderRadius: '12px',
          transition: 'all 0.2s ease',
          '&:hover': {
            backgroundColor: '#F3F4F6',
          },
        }}
      >
        <Avatar
          sx={{
            width: 36,
            height: 36,
            backgroundColor: '#CD1B78',
            fontSize: '14px',
            fontWeight: 600,
          }}
        >
          {getInitials()}
        </Avatar>
        <Box sx={{ display: { xs: 'none', md: 'block' } }}>
          <Typography fontSize="14px" fontWeight={600} color="#111827" lineHeight={1.2}>
            {getDisplayName()}
          </Typography>
          <Typography fontSize="12px" color="#6B7280" lineHeight={1.2}>
            {userDetails.email}
          </Typography>
        </Box>
      </Box>

      <Menu
        anchorEl={anchorEl}
        open={open}
        onClose={handleClose}
        onClick={handleClose}
        PaperProps={{
          elevation: 0,
          sx: {
            overflow: 'visible',
            filter: 'drop-shadow(0px 4px 12px rgba(0,0,0,0.1))',
            mt: 1.5,
            borderRadius: '12px',
            minWidth: 240,
            '& .MuiAvatar-root': {
              width: 32,
              height: 32,
              ml: -0.5,
              mr: 1,
            },
            '&:before': {
              content: '""',
              display: 'block',
              position: 'absolute',
              top: 0,
              right: 14,
              width: 10,
              height: 10,
              bgcolor: 'background.paper',
              transform: 'translateY(-50%) rotate(45deg)',
              zIndex: 0,
            },
          },
        }}
        transformOrigin={{ horizontal: 'right', vertical: 'top' }}
        anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
      >
        {/* User Info Header */}
        <Box sx={{ px: 2, py: 1.5 }}>
          <Typography fontSize="14px" fontWeight={600} color="#111827">
            {getDisplayName()}
          </Typography>
          <Typography fontSize="13px" color="#6B7280">
            {userDetails.email}
          </Typography>
        </Box>

        <Divider />

        {/* Menu Items */}
        <MenuItem onClick={handleProfile} sx={{ py: 1.5, px: 2 }}>
          <ListItemIcon>
            <MdAccountCircle size={20} color="#6B7280" />
          </ListItemIcon>
          <Typography fontSize="14px">My Profile</Typography>
        </MenuItem>

        <MenuItem onClick={handleSettings} sx={{ py: 1.5, px: 2 }}>
          <ListItemIcon>
            <MdSettings size={20} color="#6B7280" />
          </ListItemIcon>
          <Typography fontSize="14px">Settings</Typography>
        </MenuItem>

        <Divider />

        <MenuItem onClick={handleLogout} sx={{ py: 1.5, px: 2, color: '#DC2626' }}>
          <ListItemIcon>
            <MdLogout size={20} color="#DC2626" />
          </ListItemIcon>
          <Typography fontSize="14px" color="#DC2626" fontWeight={500}>
            Logout
          </Typography>
        </MenuItem>
      </Menu>
    </>
  );
};

export default UserProfileMenu;
