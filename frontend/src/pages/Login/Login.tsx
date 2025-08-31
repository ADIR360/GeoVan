import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Card,
  CardContent,
  TextField,
  Button,
  Typography,
  Alert,
  CircularProgress,
  InputAdornment,
  IconButton,
  FormControl,
  InputLabel,
  OutlinedInput,
} from '@mui/material';
import {
  Security as SecurityIcon,
  Visibility,
  VisibilityOff,
  Person as PersonIcon,
  Lock as LockIcon,
} from '@mui/icons-material';
import { useAuth } from '../../contexts/AuthContext';

const Login: React.FC = () => {
  const navigate = useNavigate();
  const { login, isAuthenticated, isLoading } = useAuth();
  const [credentials, setCredentials] = useState({
    username: '',
    password: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/dashboard');
    }
  }, [isAuthenticated, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (!credentials.username || !credentials.password) {
      setError('Please enter both username and password');
      return;
    }

    setIsLoggingIn(true);
    try {
      const result = await login(credentials.username, credentials.password);
      if (result.success) {
        navigate('/dashboard');
      } else {
        setError(result.message);
      }
    } catch (error) {
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleDemoLogin = () => {
    setCredentials({
      username: 'root',
      password: 'root'
    });
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        bgcolor: 'background.default',
        p: 2,
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      }}
    >
      <Card sx={{ 
        maxWidth: 450, 
        width: '100%',
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
        borderRadius: 3,
      }}>
        <CardContent sx={{ p: 4 }}>
          <Box sx={{ textAlign: 'center', mb: 4 }}>
            <Box sx={{ 
              display: 'flex', 
              justifyContent: 'center', 
              mb: 2,
              '& svg': { fontSize: 60, color: 'primary.main' }
            }}>
              <SecurityIcon />
            </Box>
            <Typography variant="h4" gutterBottom sx={{ fontWeight: 600 }}>
              GeoVAN
            </Typography>
            <Typography variant="body1" color="text.secondary">
              VANET Security Platform
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
              Secure Vehicle Network Management
            </Typography>
          </Box>

          {error && (
            <Alert severity="error" sx={{ mb: 3 }}>
              {error}
            </Alert>
          )}

          <form onSubmit={handleSubmit}>
            <TextField
              fullWidth
              label="Username"
              variant="outlined"
              margin="normal"
              value={credentials.username}
              onChange={(e) => setCredentials({ ...credentials, username: e.target.value })}
              required
              disabled={isLoggingIn}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <PersonIcon color="action" />
                  </InputAdornment>
                ),
              }}
              sx={{ mb: 2 }}
            />
            
            <FormControl fullWidth variant="outlined" margin="normal" sx={{ mb: 3 }}>
              <InputLabel htmlFor="outlined-adornment-password">Password</InputLabel>
              <OutlinedInput
                id="outlined-adornment-password"
                type={showPassword ? 'text' : 'password'}
                value={credentials.password}
                onChange={(e) => setCredentials({ ...credentials, password: e.target.value })}
                required
                disabled={isLoggingIn}
                startAdornment={
                  <InputAdornment position="start">
                    <LockIcon color="action" />
                  </InputAdornment>
                }
                endAdornment={
                  <InputAdornment position="end">
                    <IconButton
                      aria-label="toggle password visibility"
                      onClick={() => setShowPassword(!showPassword)}
                      edge="end"
                      disabled={isLoggingIn}
                    >
                      {showPassword ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                }
                label="Password"
              />
            </FormControl>

            <Button
              type="submit"
              fullWidth
              variant="contained"
              size="large"
              disabled={isLoggingIn || isLoading}
              sx={{ 
                mt: 2, 
                mb: 2,
                height: 48,
                fontSize: '1.1rem',
                fontWeight: 600,
              }}
            >
              {isLoggingIn ? (
                <CircularProgress size={24} color="inherit" />
              ) : (
                'Sign In'
              )}
            </Button>
          </form>

          <Box sx={{ mt: 3, textAlign: 'center' }}>
            <Button
              variant="outlined"
              size="small"
              onClick={handleDemoLogin}
              disabled={isLoggingIn}
              sx={{ mb: 2 }}
            >
              Use Demo Credentials
            </Button>
            <Typography variant="body2" color="text.secondary">
              Demo Credentials: root / root
            </Typography>
          </Box>

          <Box sx={{ mt: 3, p: 2, bgcolor: 'background.default', borderRadius: 2 }}>
            <Typography variant="body2" color="text.secondary" align="center">
              <strong>System Status:</strong> All systems operational
            </Typography>
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
};

export default Login;
