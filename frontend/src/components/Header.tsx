// src/components/Header.tsx

import React, { useState } from 'react';
import {
  AppBar,
  Toolbar,
  Typography,
  IconButton,
  Box,
  Tooltip,
  Button,
  Avatar,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  Divider,
  useTheme,
} from '@mui/material';
import {
  LightMode as LightModeIcon,
  DarkMode as DarkModeIcon,
  MusicNote as MusicNoteIcon,
  Login as LoginIcon,
  Logout as LogoutIcon,
  AccountCircle as AccountCircleIcon,
} from '@mui/icons-material';
import { useThemeContext } from '../contexts/ThemeContext';
import { useAuth } from '../contexts/AuthContext';

interface HeaderProps {
  onOpenAuth?: () => void;
}

const Header: React.FC<HeaderProps> = ({ onOpenAuth }) => {
  const { mode, toggleTheme } = useThemeContext();
  const { user, signOut } = useAuth();
  const theme = useTheme();
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

  const getUserInitials = () => {
    if (!user) return '';
    const name = user.email?.split('@')[0] || 'User';
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
        </Box>

        {/* Action Buttons */}
        <Box display="flex" alignItems="center" gap={1}>
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
                    fontFamily: theme.typography.fontFamily,
                    '& .MuiAvatar-root': {
                      width: 24,
                      height: 24,
                      ml: -0.5,
                      mr: 1,
                    },
                    '& .MuiMenuItem-root': {
                      fontFamily: theme.typography.fontFamily,
                      fontSize: theme.typography.body2.fontSize,
                      fontWeight: theme.typography.body2.fontWeight,
                    },
                    '& .MuiTypography-root': {
                      fontFamily: theme.typography.fontFamily,
                    },
                    '& .MuiListItemText-primary': {
                      fontFamily: theme.typography.fontFamily,
                      fontSize: theme.typography.body2.fontSize,
                      fontWeight: theme.typography.body2.fontWeight,
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
                    <Typography 
                      variant="body2" 
                      noWrap
                      sx={{ 
                        fontFamily: theme.typography.fontFamily,
                        fontSize: theme.typography.body2.fontSize,
                        fontWeight: theme.typography.body2.fontWeight
                      }}
                    >
                      {user.email}
                    </Typography>
                  </ListItemText>
                </MenuItem>

                <Divider />

                {/* Sign Out */}
                <MenuItem onClick={handleSignOut}>
                  <ListItemIcon>
                    <LogoutIcon />
                  </ListItemIcon>
                  <ListItemText 
                    primaryTypographyProps={{
                      sx: {
                        fontFamily: theme.typography.fontFamily,
                        fontSize: theme.typography.body2.fontSize,
                        fontWeight: theme.typography.body2.fontWeight
                      }
                    }}
                  >
                    Sign Out
                  </ListItemText>
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