import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  Chip,
  IconButton,
  Tooltip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  LinearProgress,
  Alert,
  Button,
  CircularProgress,
} from '@mui/material';
import {
  Speed as SpeedIcon,
  Security as SecurityIcon,
  DirectionsCar as CarIcon,
  Warning as WarningIcon,
  Refresh as RefreshIcon,
  Fullscreen as FullscreenIcon,
} from '@mui/icons-material';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
} from 'recharts';
import { vehicleService, VehicleAnalytics, Vehicle } from '../../services/vehicleService';

const Analytics: React.FC = () => {
  const [analytics, setAnalytics] = useState<VehicleAnalytics | null>(null);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [timeRange, setTimeRange] = useState<'1h' | '24h' | '7d' | '30d'>('24h');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    try {
      setError(null);
      const [vehiclesData, analyticsData] = await Promise.all([
        vehicleService.fetchVehiclesFromAPI(),
        vehicleService.fetchAnalyticsFromAPI()
      ]);
      
      setVehicles(vehiclesData);
      if (analyticsData) {
        setAnalytics(analyticsData);
      }
    } catch (err) {
      setError('Failed to load analytics data. Please check your connection.');
      console.error('Analytics data loading error:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await loadData();
    } finally {
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [loadData]);

  useEffect(() => {
    const unsubscribeAnalytics = vehicleService.subscribeToAnalytics((data) => {
      setAnalytics(data);
    });

    const unsubscribeVehicles = vehicleService.subscribeToVehicles((data) => {
      setVehicles(data);
    });

    return () => {
      unsubscribeAnalytics();
      unsubscribeVehicles();
    };
  }, []);

  // Generate time series data for charts based on real vehicle data
  const generateTimeSeriesData = () => {
    if (vehicles.length === 0) return [];
    
    const data = [];
    const now = new Date();
    const hours = timeRange === '1h' ? 1 : timeRange === '24h' ? 24 : timeRange === '7d' ? 168 : 720;
    
    for (let i = hours; i >= 0; i--) {
      const time = new Date(now.getTime() - i * (timeRange === '1h' ? 60 * 60 * 1000 : timeRange === '24h' ? 60 * 60 * 1000 : 24 * 60 * 60 * 1000));
      const activeVehicles = vehicles.filter(v => v.status === 'active');
      
      data.push({
        time: time.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
        vehicles: activeVehicles.length,
        speed: activeVehicles.length > 0 
          ? activeVehicles.reduce((sum, v) => sum + v.velocity.speed, 0) / activeVehicles.length
          : 0,
        trust: activeVehicles.length > 0
          ? activeVehicles.reduce((sum, v) => sum + v.security.trustScore, 0) / activeVehicles.length
          : 0,
        incidents: analytics?.securityIncidents || 0,
        network: activeVehicles.length > 0
          ? activeVehicles.reduce((sum, v) => sum + (100 - v.network.latency / 2), 0) / activeVehicles.length
          : 0,
      });
    }
    return data;
  };

  // Generate vehicle performance data based on real vehicle data
  const generateVehiclePerformanceData = () => {
    if (vehicles.length === 0) return [];
    
    return vehicles.slice(0, 10).map(vehicle => ({
      name: vehicle.name,
      speed: vehicle.velocity.speed,
      trust: vehicle.security.trustScore,
      fuel: vehicle.sensors.fuel || 0,
      battery: vehicle.sensors.battery || 0,
      network: 100 - vehicle.network.latency / 2,
    }));
  };

  // Generate security metrics based on real vehicle data
  const generateSecurityData = () => {
    if (vehicles.length === 0) return [];
    
    const validCertificates = vehicles.filter(v => v.security.certificateValid).length;
    const highTrust = vehicles.filter(v => v.security.trustScore > 90).length;
    const mediumTrust = vehicles.filter(v => v.security.trustScore > 70 && v.security.trustScore <= 90).length;
    const lowTrust = vehicles.filter(v => v.security.trustScore <= 70).length;

    return [
      { name: 'Valid Certificates', value: validCertificates, color: '#4caf50' },
      { name: 'High Trust', value: highTrust, color: '#2196f3' },
      { name: 'Medium Trust', value: mediumTrust, color: '#ff9800' },
      { name: 'Low Trust', value: lowTrust, color: '#f44336' },
    ];
  };

  // Generate network performance data based on real vehicle data
  const generateNetworkData = () => {
    if (vehicles.length === 0) return [];
    
    const connectionTypes = ['4G', '5G', 'WiFi', 'Satellite'];
    const data = connectionTypes.map(type => ({
      type,
      vehicles: vehicles.filter(v => v.network.connectionType === type).length,
      avgLatency: vehicles
        .filter(v => v.network.connectionType === type)
        .reduce((sum, v) => sum + v.network.latency, 0) / 
        Math.max(vehicles.filter(v => v.network.connectionType === type).length, 1),
    }));

    return data;
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
        <CircularProgress size={60} />
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ p: { xs: 2, md: 3 }, pt: { xs: 8, md: 10 } }}>
        <Alert 
          severity="error" 
          action={
            <Button color="inherit" size="small" onClick={loadData}>
              Retry
            </Button>
          }
        >
          {error}
        </Alert>
      </Box>
    );
  }

  if (!analytics) {
    return (
      <Box sx={{ p: { xs: 2, md: 3 }, pt: { xs: 8, md: 10 } }}>
        <Alert severity="warning">
          No analytics data available. Please check your system configuration.
        </Alert>
      </Box>
    );
  }

  const timeSeriesData = generateTimeSeriesData();
  const vehiclePerformanceData = generateVehiclePerformanceData();
  const securityData = generateSecurityData();
  const networkData = generateNetworkData();

  return (
    <Box sx={{ p: { xs: 2, md: 3 }, pt: { xs: 8, md: 10 } }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4">
          Vehicle Analytics Dashboard
        </Typography>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Tooltip title="Refresh">
            <IconButton 
              color="primary" 
              onClick={handleRefresh}
              disabled={refreshing}
            >
              {refreshing ? <CircularProgress size={20} /> : <RefreshIcon />}
            </IconButton>
          </Tooltip>
          <Tooltip title="Fullscreen">
            <IconButton color="primary">
              <FullscreenIcon />
            </IconButton>
          </Tooltip>
        </Box>
      </Box>

      {/* Time Range Selector */}
      <Box sx={{ mb: 3 }}>
        <Box sx={{ display: 'flex', gap: 1 }}>
          {(['1h', '24h', '7d', '30d'] as const).map((range) => (
            <Chip
              key={range}
              label={range}
              color={timeRange === range ? 'primary' : 'default'}
              onClick={() => setTimeRange(range)}
              variant={timeRange === range ? 'filled' : 'outlined'}
            />
          ))}
        </Box>
      </Box>

      {/* Key Metrics */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography color="text.secondary" gutterBottom>
                    Total Vehicles
                  </Typography>
                  <Typography variant="h4">
                    {analytics.totalVehicles}
                  </Typography>
                  <Chip
                    label={`${analytics.activeVehicles} active`}
                    color="success"
                    size="small"
                    sx={{ mt: 1 }}
                  />
                </Box>
                <CarIcon sx={{ fontSize: 40, color: 'primary.main' }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography color="text.secondary" gutterBottom>
                    Average Speed
                  </Typography>
                  <Typography variant="h4">
                    {analytics.averageSpeed.toFixed(1)}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    km/h
                  </Typography>
                </Box>
                <SpeedIcon sx={{ fontSize: 40, color: 'success.main' }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography color="text.secondary" gutterBottom>
                    System Health
                  </Typography>
                  <Typography variant="h4">
                    {analytics.systemHealth.toFixed(1)}%
                  </Typography>
                  <LinearProgress
                    variant="determinate"
                    value={analytics.systemHealth}
                    sx={{ mt: 1, height: 8, borderRadius: 4 }}
                  />
                </Box>
                <SecurityIcon sx={{ fontSize: 40, color: 'success.main' }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography color="text.secondary" gutterBottom>
                    Security Incidents
                  </Typography>
                  <Typography variant="h4">
                    {analytics.securityIncidents}
                  </Typography>
                  <Chip
                    label="Monitor"
                    color={analytics.securityIncidents > 0 ? 'warning' : 'success'}
                    size="small"
                    sx={{ mt: 1 }}
                  />
                </Box>
                <WarningIcon sx={{ fontSize: 40, color: analytics.securityIncidents > 0 ? 'warning.main' : 'success.main' }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Charts */}
      <Grid container spacing={3}>
        {/* Time Series Chart */}
        <Grid item xs={12} lg={8}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                System Performance Over Time
              </Typography>
              {timeSeriesData.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={timeSeriesData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="time" />
                    <YAxis />
                    <RechartsTooltip />
                    <Line type="monotone" dataKey="vehicles" stroke="#2196f3" strokeWidth={2} />
                    <Line type="monotone" dataKey="speed" stroke="#4caf50" strokeWidth={2} />
                    <Line type="monotone" dataKey="trust" stroke="#ff9800" strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <Box sx={{ height: 300, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Typography color="text.secondary">No data available for chart</Typography>
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Security Distribution */}
        <Grid item xs={12} lg={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Security Trust Distribution
              </Typography>
              {securityData.length > 0 ? (
                <>
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={securityData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={80}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        {securityData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <RechartsTooltip />
                    </PieChart>
                  </ResponsiveContainer>
                  <Box sx={{ display: 'flex', justifyContent: 'space-around', mt: 2 }}>
                    {securityData.map((item) => (
                      <Box key={item.name} sx={{ textAlign: 'center' }}>
                        <Box sx={{ width: 12, height: 12, bgcolor: item.color, borderRadius: '50%', mx: 'auto', mb: 1 }} />
                        <Typography variant="caption" color="text.secondary">
                          {item.name}
                        </Typography>
                      </Box>
                    ))}
                  </Box>
                </>
              ) : (
                <Box sx={{ height: 300, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Typography color="text.secondary">No security data available</Typography>
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Vehicle Performance Table */}
        <Grid item xs={12} lg={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Top Vehicle Performance
              </Typography>
              {vehiclePerformanceData.length > 0 ? (
                <TableContainer component={Paper} variant="outlined">
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>Vehicle</TableCell>
                        <TableCell align="right">Speed (km/h)</TableCell>
                        <TableCell align="right">Trust (%)</TableCell>
                        <TableCell align="right">Network (%)</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {vehiclePerformanceData.map((vehicle) => (
                        <TableRow key={vehicle.name}>
                          <TableCell component="th" scope="row">
                            {vehicle.name}
                          </TableCell>
                          <TableCell align="right">{vehicle.speed.toFixed(1)}</TableCell>
                          <TableCell align="right">{vehicle.trust.toFixed(1)}</TableCell>
                          <TableCell align="right">{vehicle.network.toFixed(1)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              ) : (
                <Box sx={{ height: 200, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Typography color="text.secondary">No vehicle performance data available</Typography>
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Network Performance */}
        <Grid item xs={12} lg={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Network Performance by Type
              </Typography>
              {networkData.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={networkData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="type" />
                    <YAxis />
                    <RechartsTooltip />
                    <Bar dataKey="vehicles" fill="#2196f3" />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <Box sx={{ height: 300, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Typography color="text.secondary">No network data available</Typography>
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* System Health Radar */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                System Health Overview
              </Typography>
              {analytics && vehicles.length > 0 ? (
                <ResponsiveContainer width="100%" height={400}>
                  <RadarChart data={[
                    {
                      metric: 'Vehicle Count',
                      value: (analytics.activeVehicles / analytics.totalVehicles) * 100,
                      fullMark: 100,
                    },
                    {
                      metric: 'Speed',
                      value: (analytics.averageSpeed / 120) * 100,
                      fullMark: 100,
                    },
                    {
                      metric: 'Security',
                      value: analytics.systemHealth,
                      fullMark: 100,
                    },
                    {
                      metric: 'Network',
                      value: analytics.networkPerformance,
                      fullMark: 100,
                    },
                    {
                      metric: 'Fuel Efficiency',
                      value: analytics.fuelEfficiency,
                      fullMark: 100,
                    },
                  ]}>
                    <PolarGrid />
                    <PolarAngleAxis dataKey="metric" />
                    <PolarRadiusAxis angle={30} domain={[0, 100]} />
                    <Radar name="System Health" dataKey="value" stroke="#2196f3" fill="#2196f3" fillOpacity={0.3} />
                    <RechartsTooltip />
                  </RadarChart>
                </ResponsiveContainer>
              ) : (
                <Box sx={{ height: 400, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Typography color="text.secondary">No system health data available</Typography>
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default Analytics;
