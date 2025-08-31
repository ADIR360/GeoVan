import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  AppBar,
  Toolbar,
  Typography,
  Box,
  Chip,
  IconButton,
  Badge,
  useMediaQuery,
  Avatar,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  Divider,
  Tooltip,
} from '@mui/material';
import {
  Notifications as NotificationsIcon,
  Wifi as WifiIcon,
  Security as SecurityIcon,
  Menu as MenuIcon,
  Logout as LogoutIcon,
  Person as PersonIcon,
  Settings as SettingsIcon,
  Brightness4 as DarkModeIcon,
  Brightness7 as LightModeIcon,
  SignalWifiConnectedNoInternet4 as DisconnectedIcon,
} from '@mui/icons-material';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import { useSocket } from '../../contexts/SocketContext';

interface HeaderProps {
  onSidebarToggle: () => void;
  sidebarOpen: boolean;
}

const Header: React.FC<HeaderProps> = ({ onSidebarToggle, sidebarOpen }) => {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { isDarkMode, toggleTheme } = useTheme();
  const { connectionStatus, reconnect } = useSocket();
  const isMobile = useMediaQuery((theme: any) => theme.breakpoints.down('md'));

  const handleProfileMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleProfileMenuClose = () => {
    setAnchorEl(null);
  };

  const handleDarkModeToggle = () => {
    toggleTheme();
  };

  const handleLogout = () => {
    handleProfileMenuClose();
    logout();
  };

  const handleProfile = () => {
    handleProfileMenuClose();
    navigate('/settings');
  };

  const handleSettings = () => {
    handleProfileMenuClose();
    navigate('/settings');
  };

  const getConnectionStatusIcon = () => {
    switch (connectionStatus) {
      case 'connected':
        return <WifiIcon />;
      case 'connecting':
        return <WifiIcon />;
      case 'disconnected':
        return <DisconnectedIcon />;
      default:
        return <WifiIcon />;
    }
  };

  const getConnectionStatusColor = () => {
    switch (connectionStatus) {
      case 'connected':
        return 'success';
      case 'connecting':
        return 'warning';
      case 'disconnected':
        return 'error';
      default:
        return 'default';
    }
  };

  const getConnectionStatusLabel = () => {
    switch (connectionStatus) {
      case 'connected':
        return 'Online';
      case 'connecting':
        return 'Connecting...';
      case 'disconnected':
        return 'Offline';
      default:
        return 'Unknown';
    }
  };

  const getConnectionStatusTooltip = () => {
    switch (connectionStatus) {
      case 'connected':
        return 'WebSocket connected and stable. Real-time updates are active.';
      case 'connecting':
        return 'Attempting to establish WebSocket connection...';
      case 'disconnected':
        return 'WebSocket disconnected. Click to reconnect or check server configuration.';
      default:
        return 'Connection status unknown.';
    }
  };

  const isProfileMenuOpen = Boolean(anchorEl);

  return (
    <AppBar
      position="fixed"
      elevation={0}
      sx={{
        backgroundColor: 'background.paper',
        borderBottom: '1px solid',
        borderColor: 'divider',
        color: 'text.primary',
        zIndex: (theme: any) => theme.zIndex.drawer + 1,
        width: { md: `calc(100% - ${sidebarOpen ? 240 : 0}px)` },
        transition: (theme: any) => theme.transitions.create(['width', 'margin'], {
          easing: theme.transitions.easing.sharp,
          duration: theme.transitions.duration.leavingScreen,
        }),
      }}
    >
      <Toolbar sx={{ minHeight: 64 }}>
        {isMobile && (
          <IconButton
            color="inherit"
            aria-label="open drawer"
            edge="start"
            onClick={onSidebarToggle}
            sx={{ mr: 2 }}
          >
            <MenuIcon />
          </IconButton>
        )}

        <Typography variant="h6" component="div" sx={{ flexGrow: 1, display: { xs: 'none', sm: 'block' } }}>
          GeoVAN Dashboard
        </Typography>
        
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          {/* System Status Indicators */}
          <Box sx={{ display: { xs: 'none', sm: 'flex' }, gap: 1 }}>
            <Tooltip title={getConnectionStatusTooltip()}>
              <Chip
                icon={getConnectionStatusIcon()}
                label={getConnectionStatusLabel()}
                color={getConnectionStatusColor()}
                size="small"
                variant="outlined"
                sx={{ height: 28 }}
                onClick={connectionStatus === 'disconnected' ? reconnect : undefined}
                clickable={connectionStatus === 'disconnected'}
              />
            </Tooltip>
            
            <Chip
              icon={<SecurityIcon />}
              label="Secure"
              color="success"
              size="small"
              variant="outlined"
              sx={{ height: 28 }}
            />
          </Box>
          
          {/* Dark Mode Toggle */}
          <Tooltip title={`Switch to ${isDarkMode ? 'light' : 'dark'} mode`}>
            <IconButton color="inherit" onClick={handleDarkModeToggle} size="small">
              {isDarkMode ? <LightModeIcon /> : <DarkModeIcon />}
            </IconButton>
          </Tooltip>
          
          {/* Notifications */}
          <Tooltip title="Notifications">
            <IconButton color="inherit" size="small">
              <Badge badgeContent={3} color="error">
                <NotificationsIcon />
              </Badge>
            </IconButton>
          </Tooltip>
          
          {/* User Profile Menu */}
          <Tooltip title="User menu">
            <IconButton
              edge="end"
              aria-label="account of current user"
              aria-controls={isProfileMenuOpen ? 'account-menu' : undefined}
              aria-haspopup="true"
              aria-expanded={isProfileMenuOpen ? 'true' : undefined}
              onClick={handleProfileMenuOpen}
              color="inherit"
              size="small"
            >
              <Avatar sx={{ width: 32, height: 32, bgcolor: 'primary.main' }}>
                <PersonIcon />
              </Avatar>
            </IconButton>
          </Tooltip>
        </Box>
      </Toolbar>

      {/* Profile Menu */}
      <Menu
        anchorEl={anchorEl}
        id="account-menu"
        open={isProfileMenuOpen}
        onClose={handleProfileMenuClose}
        onClick={handleProfileMenuClose}
        transformOrigin={{ horizontal: 'right', vertical: 'top' }}
        anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
        PaperProps={{
          elevation: 3,
          sx: {
            minWidth: 200,
            mt: 1,
          },
        }}
      >
        <MenuItem onClick={handleProfile}>
          <ListItemIcon>
            <PersonIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText 
            primary={user?.username || 'User'} 
            secondary={user?.email || 'user@geovan.dev'} 
          />
        </MenuItem>
        
        <MenuItem onClick={handleSettings}>
          <ListItemIcon>
            <SettingsIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText primary="Settings" />
        </MenuItem>
        
        <Divider />
        
        <MenuItem onClick={handleLogout}>
          <ListItemIcon>
            <LogoutIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText primary="Logout" />
        </MenuItem>
      </Menu>
    </AppBar>
  );
};

export default Header;
