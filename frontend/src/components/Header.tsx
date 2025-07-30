// src/components/Header.tsx

import React, { useState } from 'react';
import {
  AppBar,
  Toolbar,
  Typography,
  IconButton,
  Box,
  Tooltip,
  Chip,
  Button,
  Avatar,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  Divider,
} from '@mui/material';
import {
  LightMode as LightModeIcon,
  DarkMode as DarkModeIcon,
  MusicNote as MusicNoteIcon,
  Refresh as RefreshIcon,
  Login as LoginIcon,
  Logout as LogoutIcon,
  Person as PersonIcon,
  AccountCircle as AccountCircleIcon,
} from '@mui/icons-material';
import { useThemeContext } from '../contexts/ThemeContext';
import { useAuth } from '../contexts/AuthContext';

interface HeaderProps {
  totalSongs?: number;
  onRefresh?: () => void;
  refreshing?: boolean;
  onOpenAuth?: () => void;
}

const Header: React.FC<HeaderProps> = ({
  totalSongs = 0,
  onRefresh,
  refreshing = false,
  onOpenAuth,
}) => {
  const { mode, toggleTheme } = useThemeContext();
  const { user, signOut } = useAuth();
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);

  const handleUserMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleUserMenuClose = () => {
    setAnchorEl(null);
  };

  const handleSignOut = async () => {
    try {
      await signOut();
      handleUserMenuClose();
    } catch (error) {
      console.error('Sign out error:', error);
    }
  };

  const getUserDisplayName = () => {
    if (!user) return '';
    return user.email?.split('@')[0] || 'User';
  };

  const getUserInitials = () => {
    if (!user) return '';
    const name = getUserDisplayName();
    return name.charAt(0).toUpperCase();
  };

  return (
    <AppBar position="sticky" elevation={2}>
      <Toolbar>
        {/* Logo and Title */}
        <Box display="flex" alignItems="center" flexGrow={1}>
          <MusicNoteIcon sx={{ mr: 2, fontSize: 28 }} />
          <Typography variant="h6" component="div" sx={{ fontWeight: 600 }}>
            Music Recommendation System
          </Typography>
          
          {/* Songs Count Badge */}
          {totalSongs > 0 && (
            <Chip
              label={`${totalSongs} songs`}
              size="small"
              color="secondary"
              sx={{ ml: 2 }}
            />
          )}
        </Box>

        {/* Action Buttons */}
        <Box display="flex" alignItems="center" gap={1}>
          {/* Refresh Button */}
          {onRefresh && (
            <Tooltip title="Refresh data">
              <IconButton
                color="inherit"
                onClick={onRefresh}
                disabled={refreshing}
                sx={{
                  animation: refreshing ? 'spin 1s linear infinite' : 'none',
                  '@keyframes spin': {
                    '0%': {
                      transform: 'rotate(0deg)',
                    },
                    '100%': {
                      transform: 'rotate(360deg)',
                    },
                  },
                }}
              >
                <RefreshIcon />
              </IconButton>
            </Tooltip>
          )}

          {/* Theme Toggle */}
          <Tooltip title={`Switch to ${mode === 'light' ? 'dark' : 'light'} mode`}>
            <IconButton
              color="inherit"
              onClick={toggleTheme}
              sx={{
                transition: 'transform 0.3s ease-in-out',
                '&:hover': {
                  transform: 'rotate(180deg)',
                },
              }}
            >
              {mode === 'light' ? <DarkModeIcon /> : <LightModeIcon />}
            </IconButton>
          </Tooltip>

          {/* Authentication Section */}
          {user ? (
            <>
              {/* User Menu */}
              <Tooltip title="Account settings">
                <IconButton
                  color="inherit"
                  onClick={handleUserMenuOpen}
                  sx={{ ml: 1 }}
                >
                  <Avatar sx={{ width: 32, height: 32, bgcolor: 'secondary.main' }}>
                    {getUserInitials()}
                  </Avatar>
                </IconButton>
              </Tooltip>

              <Menu
                anchorEl={anchorEl}
                open={Boolean(anchorEl)}
                onClose={handleUserMenuClose}
                onClick={handleUserMenuClose}
                PaperProps={{
                  elevation: 3,
                  sx: {
                    mt: 1.5,
                    minWidth: 200,
                    '& .MuiAvatar-root': {
                      width: 24,
                      height: 24,
                      ml: -0.5,
                      mr: 1,
                    },
                  },
                }}
                transformOrigin={{ horizontal: 'right', vertical: 'top' }}
                anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
              >
                {/* User Info */}
                <MenuItem disabled>
                  <ListItemIcon>
                    <AccountCircleIcon />
                  </ListItemIcon>
                  <ListItemText>
                    <Typography variant="body2" noWrap>
                      {user.email}
                    </Typography>
                  </ListItemText>
                </MenuItem>

                <Divider />

                {/* Profile Option */}
                <MenuItem onClick={handleUserMenuClose}>
                  <ListItemIcon>
                    <PersonIcon />
                  </ListItemIcon>
                  <ListItemText>My Profile</ListItemText>
                </MenuItem>

                <Divider />

                {/* Sign Out */}
                <MenuItem onClick={handleSignOut}>
                  <ListItemIcon>
                    <LogoutIcon />
                  </ListItemIcon>
                  <ListItemText>Sign Out</ListItemText>
                </MenuItem>
              </Menu>
            </>
          ) : (
            /* Sign In Button */
            <Button
              color="inherit"
              startIcon={<LoginIcon />}
              onClick={onOpenAuth}
              sx={{ ml: 1 }}
            >
              Sign In
            </Button>
          )}
        </Box>
      </Toolbar>
    </AppBar>
  );
};

export default Header;