import React from 'react';
import { Box, useMediaQuery, useTheme } from '@mui/material';
import { styled } from '@mui/material/styles';

interface LayoutProps {
  children: React.ReactNode;
  sidebarOpen: boolean;
  onSidebarToggle: () => void;
}

const MainContent = styled(Box, {
  shouldForwardProp: (prop) => prop !== 'sidebarOpen' && prop !== 'isMobile',
})<{ sidebarOpen: boolean; isMobile: boolean }>(({ theme, sidebarOpen, isMobile }) => ({
  flexGrow: 1,
  transition: theme.transitions.create(['margin', 'width'], {
    easing: theme.transitions.easing.sharp,
    duration: theme.transitions.duration.leavingScreen,
  }),
  ...(sidebarOpen && !isMobile && {
    marginLeft: 240,
    width: `calc(100% - 240px)`,
  }),
  ...(isMobile && {
    marginLeft: 0,
    width: '100%',
  }),
}));

const Layout: React.FC<LayoutProps> = ({ children, sidebarOpen }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh' }}>
      <MainContent 
        sidebarOpen={sidebarOpen} 
        isMobile={isMobile}
        component="main"
      >
        {children}
      </MainContent>
    </Box>
  );
};

export default Layout;
