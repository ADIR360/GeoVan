import { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Provider } from 'react-redux';
import { store } from './store/store';
import { SocketProvider } from './contexts/SocketContext';
import { AuthProvider } from './contexts/AuthContext';
import { ThemeProvider } from './contexts/ThemeContext';
import Layout from './components/Layout/Layout';
import Sidebar from './components/Layout/Sidebar';
import Header from './components/Layout/Header';
import Dashboard from './pages/Dashboard/Dashboard';
import VehicleMap from './pages/VehicleMap/VehicleMap';
import Analytics from './pages/Analytics/Analytics';
import Security from './pages/Security/Security';
import Alerts from './pages/Alerts/Alerts';
import Settings from './pages/Settings/Settings';
import Login from './pages/Login/Login';
import ProtectedRoute from './components/Auth/ProtectedRoute';
import { Box } from '@mui/material';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      gcTime: 10 * 60 * 1000, // 10 minutes
      retry: 3,
      refetchOnWindowFocus: false,
    },
  },
});

function App() {
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const handleSidebarToggle = () => {
    setSidebarOpen(!sidebarOpen);
  };

  return (
    <Provider store={store}>
      <QueryClientProvider client={queryClient}>
        <ThemeProvider>
          <AuthProvider>
            <SocketProvider>
              <Router>
                <Routes>
                  <Route path="/" element={<Navigate to="/login" replace />} />
                  <Route path="/login" element={<Login />} />
                  <Route
                    path="/*"
                    element={
                      <ProtectedRoute>
                        <Layout sidebarOpen={sidebarOpen} onSidebarToggle={handleSidebarToggle}>
                          <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
                          <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
                            <Header sidebarOpen={sidebarOpen} onSidebarToggle={handleSidebarToggle} />
                            <Box component="main" sx={{ flex: 1, overflow: 'auto' }}>
                              <Routes>
                                <Route path="/dashboard" element={<Dashboard />} />
                                <Route path="/map" element={<VehicleMap />} />
                                <Route path="/analytics" element={<Analytics />} />
                                <Route path="/security" element={<Security />} />
                                <Route path="/alerts" element={<Alerts />} />
                                <Route path="/settings" element={<Settings />} />
                                <Route path="*" element={<Navigate to="/dashboard" replace />} />
                              </Routes>
                            </Box>
                          </Box>
                        </Layout>
                      </ProtectedRoute>
                    }
                  />
                </Routes>
              </Router>
            </SocketProvider>
          </AuthProvider>
        </ThemeProvider>
      </QueryClientProvider>
    </Provider>
  );
}

export default App;
