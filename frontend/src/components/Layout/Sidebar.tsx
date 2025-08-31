import React from 'react';
import {
  Drawer,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  ListItemButton,
  Box,
  Typography,
  Divider,
  IconButton,
  useMediaQuery,
  useTheme,
  Toolbar,
} from '@mui/material';
import {
  Dashboard as DashboardIcon,
  Map as MapIcon,
  Analytics as AnalyticsIcon,
  Security as SecurityIcon,
  Notifications as NotificationsIcon,
  Settings as SettingsIcon,
  Close as CloseIcon,
  Shield as ShieldIcon,
} from '@mui/icons-material';
import { useNavigate, useLocation } from 'react-router-dom';

const drawerWidth = 240;

const menuItems = [
  { 
    text: 'Dashboard', 
    icon: <DashboardIcon />, 
    path: '/dashboard',
    description: 'System overview and metrics'
  },
  { 
    text: 'Vehicle Map', 
    icon: <MapIcon />, 
    path: '/map',
    description: 'Real-time vehicle tracking'
  },
  { 
    text: 'Analytics', 
    icon: <AnalyticsIcon />, 
    path: '/analytics',
    description: 'Data insights and trends'
  },
  { 
    text: 'Security', 
    icon: <SecurityIcon />, 
    path: '/security',
    description: 'Security status and threats'
  },
  { 
    text: 'Alerts', 
    icon: <NotificationsIcon />, 
    path: '/alerts',
    description: 'System notifications'
  },
  { 
    text: 'Settings', 
    icon: <SettingsIcon />, 
    path: '/settings',
    description: 'System configuration'
  },
];

interface SidebarProps {
  open: boolean;
  onClose: () => void;
  variant?: 'permanent' | 'persistent' | 'temporary';
}

const Sidebar: React.FC<SidebarProps> = ({ open, onClose }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  const handleNavigation = (path: string) => {
    navigate(path);
    if (isMobile) {
      onClose();
    }
  };

  const drawerContent = (
    <>
      <Toolbar sx={{ 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'space-between',
        px: 2,
        minHeight: 64
      }}>
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <ShieldIcon sx={{ fontSize: 32, color: 'primary.main', mr: 1 }} />
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 'bold', lineHeight: 1 }}>
              GeoVAN
            </Typography>
            <Typography variant="caption" color="text.secondary" sx={{ lineHeight: 1 }}>
              VANET Security Platform
            </Typography>
          </Box>
        </Box>
        {isMobile && (
          <IconButton onClick={onClose} size="small">
            <CloseIcon />
          </IconButton>
        )}
      </Toolbar>
      
      <Divider />
      
      <List sx={{ pt: 1, px: 1 }}>
        {menuItems.map((item) => (
          <ListItem key={item.text} disablePadding sx={{ mb: 0.5 }}>
            <ListItemButton
              selected={location.pathname === item.path}
              onClick={() => handleNavigation(item.path)}
              sx={{
                borderRadius: 2,
                '&.Mui-selected': {
                  backgroundColor: 'primary.main',
                  color: 'primary.contrastText',
                  '&:hover': {
                    backgroundColor: 'primary.dark',
                  },
                  '& .MuiListItemIcon-root': {
                    color: 'inherit',
                  },
                },
                '&:hover': {
                  backgroundColor: 'action.hover',
                },
              }}
            >
              <ListItemIcon
                sx={{
                  color: location.pathname === item.path ? 'inherit' : 'text.secondary',
                  minWidth: 40,
                }}
              >
                {item.icon}
              </ListItemIcon>
              <ListItemText 
                primary={item.text} 
                secondary={item.description}
                primaryTypographyProps={{
                  fontSize: '0.875rem',
                  fontWeight: location.pathname === item.path ? 600 : 400,
                }}
                secondaryTypographyProps={{
                  fontSize: '0.75rem',
                  color: location.pathname === item.path ? 'inherit' : 'text.secondary',
                }}
              />
            </ListItemButton>
          </ListItem>
        ))}
      </List>
    </>
  );

  if (isMobile) {
    return (
      <Drawer
        variant="temporary"
        open={open}
        onClose={onClose}
        ModalProps={{
          keepMounted: true, // Better open performance on mobile.
        }}
        sx={{
          display: { xs: 'block', md: 'none' },
          '& .MuiDrawer-paper': {
            boxSizing: 'border-box',
            width: drawerWidth,
            backgroundColor: 'background.paper',
            borderRight: '1px solid',
            borderColor: 'divider',
          },
        }}
      >
        {drawerContent}
      </Drawer>
    );
  }

  return (
    <Drawer
      variant="permanent"
      sx={{
        display: { xs: 'none', md: 'block' },
        width: drawerWidth,
        flexShrink: 0,
        '& .MuiDrawer-paper': {
          width: drawerWidth,
          boxSizing: 'border-box',
          backgroundColor: 'background.paper',
          borderRight: '1px solid',
          borderColor: 'divider',
        },
      }}
    >
      {drawerContent}
    </Drawer>
  );
};

export default Sidebar;
