import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  Switch,
  FormControlLabel,
  TextField,
  Button,
  Divider,
  Alert,
  Snackbar,
  CircularProgress,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Chip,
  Accordion,
  AccordionSummary,
  AccordionDetails,
} from '@mui/material';
import {
  ExpandMore as ExpandMoreIcon,
  Save as SaveIcon,
  Security as SecurityIcon,
  Speed as SpeedIcon,
  Monitor as MonitorIcon,
  Refresh as RefreshIcon,
} from '@mui/icons-material';

interface SettingsState {
  security: {
    certificateValidation: boolean;
    messageSigning: boolean;
    encryption: boolean;
    anomalyDetection: boolean;
    jwtSecret: string;
  };
  performance: {
    maxConnections: number;
    cacheTTL: number;
    messageQueueSize: number;
    responseCaching: boolean;
    connectionPooling: boolean;
  };
  monitoring: {
    prometheusMetrics: boolean;
    grafanaDashboards: boolean;
    elkLogging: boolean;
    jaegerTracing: boolean;
    logLevel: string;
  };
}

const Settings: React.FC = () => {
  const [settings, setSettings] = useState<SettingsState>({
    security: {
      certificateValidation: true,
      messageSigning: true,
      encryption: true,
      anomalyDetection: false,
      jwtSecret: '••••••••••••••••••••••••••••••••',
    },
    performance: {
      maxConnections: 1000,
      cacheTTL: 300,
      messageQueueSize: 10000,
      responseCaching: true,
      connectionPooling: true,
    },
    monitoring: {
      prometheusMetrics: true,
      grafanaDashboards: true,
      elkLogging: true,
      jaegerTracing: false,
      logLevel: 'info',
    },
  });

  const [isSaving, setIsSaving] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [showError, setShowError] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Load settings from localStorage on component mount
  useEffect(() => {
    const savedSettings = localStorage.getItem('geovan-settings');
    if (savedSettings) {
      try {
        const parsed = JSON.parse(savedSettings);
        setSettings(parsed);
      } catch (error) {
        console.error('Failed to parse saved settings:', error);
      }
    }
  }, []);

  // Save settings to localStorage
  const saveSettings = async (section: keyof SettingsState) => {
    setIsSaving(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      localStorage.setItem('geovan-settings', JSON.stringify(settings));
      setShowSuccess(true);
      
      // Update specific section
      console.log(`Updated ${section} settings:`, settings[section]);
    } catch (error) {
      setErrorMessage('Failed to save settings. Please try again.');
      setShowError(true);
    } finally {
      setIsSaving(false);
    }
  };

  const handleSecurityChange = (key: keyof SettingsState['security'], value: boolean | string) => {
    setSettings(prev => ({
      ...prev,
      security: {
        ...prev.security,
        [key]: value,
      },
    }));
  };

  const handlePerformanceChange = (key: keyof SettingsState['performance'], value: boolean | number) => {
    setSettings(prev => ({
      ...prev,
      performance: {
        ...prev.performance,
        [key]: value,
      },
    }));
  };

  const handleMonitoringChange = (key: keyof SettingsState['monitoring'], value: boolean | string) => {
    setSettings(prev => ({
      ...prev,
      monitoring: {
        ...prev.monitoring,
        [key]: value,
      },
    }));
  };

  const resetToDefaults = () => {
    const defaultSettings: SettingsState = {
      security: {
        certificateValidation: true,
        messageSigning: true,
        encryption: true,
        anomalyDetection: false,
        jwtSecret: '••••••••••••••••••••••••••••••••',
      },
      performance: {
        maxConnections: 1000,
        cacheTTL: 300,
        messageQueueSize: 10000,
        responseCaching: true,
        connectionPooling: true,
      },
      monitoring: {
        prometheusMetrics: true,
        grafanaDashboards: true,
        elkLogging: true,
        jaegerTracing: false,
        logLevel: 'info',
      },
    };
    setSettings(defaultSettings);
    localStorage.removeItem('geovan-settings');
  };

  return (
    <Box sx={{ p: { xs: 2, md: 3 }, pt: { xs: 8, md: 10 } }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4">
          System Settings
        </Typography>
        <Button
          variant="outlined"
          startIcon={<RefreshIcon />}
          onClick={resetToDefaults}
          disabled={isSaving}
        >
          Reset to Defaults
        </Button>
      </Box>

      <Grid container spacing={3}>
        {/* Security Settings */}
        <Grid item xs={12} md={6}>
          <Accordion defaultExpanded>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <SecurityIcon sx={{ mr: 1, color: 'primary.main' }} />
              <Typography variant="h6">Security Settings</Typography>
            </AccordionSummary>
            <AccordionDetails>
              <Card variant="outlined">
                <CardContent>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={settings.security.certificateValidation}
                        onChange={(e) => handleSecurityChange('certificateValidation', e.target.checked)}
                        disabled={isSaving}
                      />
                    }
                    label="Enable Certificate Validation"
                    sx={{ mb: 2 }}
                  />
                  
                  <FormControlLabel
                    control={
                      <Switch
                        checked={settings.security.messageSigning}
                        onChange={(e) => handleSecurityChange('messageSigning', e.target.checked)}
                        disabled={isSaving}
                      />
                    }
                    label="Enable Message Signing"
                    sx={{ mb: 2 }}
                  />
                  
                  <FormControlLabel
                    control={
                      <Switch
                        checked={settings.security.encryption}
                        onChange={(e) => handleSecurityChange('encryption', e.target.checked)}
                        disabled={isSaving}
                      />
                    }
                    label="Enable Encryption"
                    sx={{ mb: 2 }}
                  />
                  
                  <FormControlLabel
                    control={
                      <Switch
                        checked={settings.security.anomalyDetection}
                        onChange={(e) => handleSecurityChange('anomalyDetection', e.target.checked)}
                        disabled={isSaving}
                      />
                    }
                    label="Enable Anomaly Detection"
                    sx={{ mb: 2 }}
                  />
                  
                  <Divider sx={{ my: 2 }} />
                  
                  <TextField
                    fullWidth
                    label="JWT Secret Key"
                    type="password"
                    variant="outlined"
                    margin="normal"
                    value={settings.security.jwtSecret}
                    onChange={(e) => handleSecurityChange('jwtSecret', e.target.value)}
                    disabled={isSaving}
                  />
                  
                  <Button
                    variant="contained"
                    startIcon={isSaving ? <CircularProgress size={20} /> : <SaveIcon />}
                    onClick={() => saveSettings('security')}
                    disabled={isSaving}
                    sx={{ mt: 2 }}
                    fullWidth
                  >
                    {isSaving ? 'Saving...' : 'Update Security Settings'}
                  </Button>
                </CardContent>
              </Card>
            </AccordionDetails>
          </Accordion>
        </Grid>

        {/* Performance Settings */}
        <Grid item xs={12} md={6}>
          <Accordion defaultExpanded>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <SpeedIcon sx={{ mr: 1, color: 'success.main' }} />
              <Typography variant="h6">Performance Settings</Typography>
            </AccordionSummary>
            <AccordionDetails>
              <Card variant="outlined">
                <CardContent>
                  <TextField
                    fullWidth
                    label="Max Concurrent Connections"
                    type="number"
                    variant="outlined"
                    margin="normal"
                    value={settings.performance.maxConnections}
                    onChange={(e) => handlePerformanceChange('maxConnections', parseInt(e.target.value) || 1000)}
                    disabled={isSaving}
                    inputProps={{ min: 100, max: 10000 }}
                  />
                  
                  <TextField
                    fullWidth
                    label="Cache TTL (seconds)"
                    type="number"
                    variant="outlined"
                    margin="normal"
                    value={settings.performance.cacheTTL}
                    onChange={(e) => handlePerformanceChange('cacheTTL', parseInt(e.target.value) || 300)}
                    disabled={isSaving}
                    inputProps={{ min: 60, max: 3600 }}
                  />
                  
                  <TextField
                    fullWidth
                    label="Message Queue Size"
                    type="number"
                    variant="outlined"
                    margin="normal"
                    value={settings.performance.messageQueueSize}
                    onChange={(e) => handlePerformanceChange('messageQueueSize', parseInt(e.target.value) || 10000)}
                    disabled={isSaving}
                    inputProps={{ min: 1000, max: 100000 }}
                  />
                  
                  <Divider sx={{ my: 2 }} />
                  
                  <FormControlLabel
                    control={
                      <Switch
                        checked={settings.performance.responseCaching}
                        onChange={(e) => handlePerformanceChange('responseCaching', e.target.checked)}
                        disabled={isSaving}
                      />
                    }
                    label="Enable Response Caching"
                    sx={{ mb: 2 }}
                  />
                  
                  <FormControlLabel
                    control={
                      <Switch
                        checked={settings.performance.connectionPooling}
                        onChange={(e) => handlePerformanceChange('connectionPooling', e.target.checked)}
                        disabled={isSaving}
                      />
                    }
                    label="Enable Connection Pooling"
                    sx={{ mb: 2 }}
                  />
                  
                  <Button
                    variant="contained"
                    startIcon={isSaving ? <CircularProgress size={20} /> : <SaveIcon />}
                    onClick={() => saveSettings('performance')}
                    disabled={isSaving}
                    sx={{ mt: 2 }}
                    fullWidth
                  >
                    {isSaving ? 'Saving...' : 'Update Performance Settings'}
                  </Button>
                </CardContent>
              </Card>
            </AccordionDetails>
          </Accordion>
        </Grid>

        {/* Monitoring Settings */}
        <Grid item xs={12}>
          <Accordion defaultExpanded>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <MonitorIcon sx={{ mr: 1, color: 'info.main' }} />
              <Typography variant="h6">Monitoring Settings</Typography>
            </AccordionSummary>
            <AccordionDetails>
              <Card variant="outlined">
                <CardContent>
                  <Grid container spacing={2} sx={{ mb: 3 }}>
                    <Grid item xs={12} md={6}>
                      <FormControlLabel
                        control={
                          <Switch
                            checked={settings.monitoring.prometheusMetrics}
                            onChange={(e) => handleMonitoringChange('prometheusMetrics', e.target.checked)}
                            disabled={isSaving}
                          />
                        }
                        label="Enable Prometheus Metrics"
                      />
                    </Grid>
                    <Grid item xs={12} md={6}>
                      <FormControlLabel
                        control={
                          <Switch
                            checked={settings.monitoring.grafanaDashboards}
                            onChange={(e) => handleMonitoringChange('grafanaDashboards', e.target.checked)}
                            disabled={isSaving}
                          />
                        }
                        label="Enable Grafana Dashboards"
                      />
                    </Grid>
                    <Grid item xs={12} md={6}>
                      <FormControlLabel
                        control={
                          <Switch
                            checked={settings.monitoring.elkLogging}
                            onChange={(e) => handleMonitoringChange('elkLogging', e.target.checked)}
                            disabled={isSaving}
                          />
                        }
                        label="Enable ELK Logging"
                      />
                    </Grid>
                    <Grid item xs={12} md={6}>
                      <FormControlLabel
                        control={
                          <Switch
                            checked={settings.monitoring.jaegerTracing}
                            onChange={(e) => handleMonitoringChange('jaegerTracing', e.target.checked)}
                            disabled={isSaving}
                          />
                        }
                        label="Enable Jaeger Tracing"
                      />
                    </Grid>
                  </Grid>
                  
                  <Divider sx={{ my: 2 }} />
                  
                  <FormControl fullWidth margin="normal">
                    <InputLabel>Log Level</InputLabel>
                    <Select
                      value={settings.monitoring.logLevel}
                      label="Log Level"
                      onChange={(e) => handleMonitoringChange('logLevel', e.target.value)}
                      disabled={isSaving}
                    >
                      <MenuItem value="debug">Debug</MenuItem>
                      <MenuItem value="info">Info</MenuItem>
                      <MenuItem value="warn">Warning</MenuItem>
                      <MenuItem value="error">Error</MenuItem>
                    </Select>
                  </FormControl>
                  
                  <Box sx={{ mt: 2, display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                    <Chip 
                      label={`Prometheus: ${settings.monitoring.prometheusMetrics ? 'Active' : 'Inactive'}`}
                      color={settings.monitoring.prometheusMetrics ? 'success' : 'default'}
                      size="small"
                    />
                    <Chip 
                      label={`Grafana: ${settings.monitoring.grafanaDashboards ? 'Active' : 'Inactive'}`}
                      color={settings.monitoring.grafanaDashboards ? 'success' : 'default'}
                      size="small"
                    />
                    <Chip 
                      label={`ELK: ${settings.monitoring.elkLogging ? 'Active' : 'Inactive'}`}
                      color={settings.monitoring.elkLogging ? 'success' : 'default'}
                      size="small"
                    />
                    <Chip 
                      label={`Jaeger: ${settings.monitoring.jaegerTracing ? 'Active' : 'Inactive'}`}
                      color={settings.monitoring.jaegerTracing ? 'success' : 'default'}
                      size="small"
                    />
                  </Box>
                  
                  <Button
                    variant="contained"
                    startIcon={isSaving ? <CircularProgress size={20} /> : <SaveIcon />}
                    onClick={() => saveSettings('monitoring')}
                    disabled={isSaving}
                    sx={{ mt: 3 }}
                    fullWidth
                  >
                    {isSaving ? 'Saving...' : 'Update Monitoring Settings'}
                  </Button>
                </CardContent>
              </Card>
            </AccordionDetails>
          </Accordion>
        </Grid>
      </Grid>

      {/* Success/Error Notifications */}
      <Snackbar
        open={showSuccess}
        autoHideDuration={4000}
        onClose={() => setShowSuccess(false)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert onClose={() => setShowSuccess(false)} severity="success" sx={{ width: '100%' }}>
          Settings saved successfully!
        </Alert>
      </Snackbar>

      <Snackbar
        open={showError}
        autoHideDuration={6000}
        onClose={() => setShowError(false)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert onClose={() => setShowError(false)} severity="error" sx={{ width: '100%' }}>
          {errorMessage}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default Settings;
