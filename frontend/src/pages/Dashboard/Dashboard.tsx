import React, { useState, useEffect } from 'react';
import {
  Grid,
  Card,
  CardContent,
  Typography,
  Box,
  LinearProgress,
  Chip,
  useTheme,
  IconButton,
  Tooltip,
  CircularProgress,
} from '@mui/material';
import {
  DirectionsCar as CarIcon,
  Security as SecurityIcon,
  Speed as SpeedIcon,
  Warning as WarningIcon,
  Refresh as RefreshIcon,
  NetworkCheck as NetworkIcon,
  Memory as MemoryIcon,
  Storage as StorageIcon,
} from '@mui/icons-material';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { vehicleService, VehicleAnalytics, Vehicle } from '../../services/vehicleService';
import { useSocket } from '../../contexts/SocketContext';

const Dashboard: React.FC = () => {
  const theme = useTheme();
  const [analytics, setAnalytics] = useState<VehicleAnalytics | null>(null);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribeAnalytics = vehicleService.subscribeToAnalytics((data) => {
      setAnalytics(data);
      setLoading(false);
    });

    const unsubscribeVehicles = vehicleService.subscribeToVehicles((data) => {
      setVehicles(data);
    });

    return () => {
      unsubscribeAnalytics();
      unsubscribeVehicles();
    };
  }, []);

  // Generate chart data based on real vehicle data
  const generateChartData = () => {
    const now = new Date();
    const data = [];
    
    for (let i = 0; i < 24; i++) {
      const time = new Date(now.getTime() - (23 - i) * 60 * 60 * 1000);
      const activeVehicles = vehicles.filter(v => v.status === 'active');
      
      data.push({
        time: time.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
        vehicles: activeVehicles.length,
        securityScore: activeVehicles.reduce((sum, v) => sum + v.security.trustScore, 0) / Math.max(activeVehicles.length, 1),
        responseTime: activeVehicles.reduce((sum, v) => sum + v.network.latency, 0) / Math.max(activeVehicles.length, 1),
      });
    }
    
    return data;
  };

  if (loading || !analytics) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
        <CircularProgress size={60} />
      </Box>
    );
  }

  const stats = [
    {
      title: 'Active Vehicles',
      value: analytics.activeVehicles.toLocaleString(),
      change: '+12%',
      icon: <CarIcon sx={{ fontSize: 40, color: 'primary.main' }} />,
      color: 'primary',
    },
    {
      title: 'Security Score',
      value: `${analytics.systemHealth.toFixed(1)}%`,
      change: '+2.1%',
      icon: <SecurityIcon sx={{ fontSize: 40, color: 'success.main' }} />,
      color: 'success',
    },
    {
      title: 'Avg Response Time',
      value: `${(vehicles.reduce((sum, v) => sum + v.network.latency, 0) / Math.max(vehicles.length, 1)).toFixed(1)}ms`,
      change: '-15%',
      icon: <SpeedIcon sx={{ fontSize: 40, color: 'info.main' }} />,
      color: 'info',
    },
    {
      title: 'Security Incidents',
      value: analytics.securityIncidents.toString(),
      change: analytics.securityIncidents > 0 ? '!' : '-2',
      icon: <WarningIcon sx={{ fontSize: 40, color: 'warning.main' }} />,
      color: 'warning',
    },
  ];

  const performanceData = [
    { name: 'CPU Usage', value: Math.random() * 30 + 20, color: theme.palette.primary.main },
    { name: 'Memory Usage', value: Math.random() * 40 + 50, color: theme.palette.secondary.main },
    { name: 'Network Load', value: Math.random() * 50 + 30, color: theme.palette.info.main },
  ];

  const chartData = generateChartData();

  return (
    <Box sx={{ p: { xs: 2, md: 3 }, pt: { xs: 8, md: 10 } }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4">
          Dashboard Overview
        </Typography>
        <Tooltip title="Refresh Data">
          <IconButton color="primary" size="small">
            <RefreshIcon />
          </IconButton>
        </Tooltip>
      </Box>
      
      {/* Stats Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        {stats.map((stat) => (
          <Grid item xs={12} sm={6} md={3} key={stat.title}>
            <Card sx={{ height: '100%' }}>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Box>
                    <Typography color="text.secondary" gutterBottom>
                      {stat.title}
                    </Typography>
                    <Typography variant="h4" component="div">
                      {stat.value}
                    </Typography>
                    <Chip
                      label={stat.change}
                      color={stat.color as any}
                      size="small"
                      sx={{ mt: 1 }}
                    />
                  </Box>
                  {stat.icon}
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Charts and Performance */}
      <Grid container spacing={3}>
        {/* Performance Chart */}
        <Grid item xs={12} lg={8}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                System Performance (24h)
              </Typography>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="time" />
                  <YAxis />
                  <RechartsTooltip />
                  <Line type="monotone" dataKey="vehicles" stroke={theme.palette.primary.main} strokeWidth={2} />
                  <Line type="monotone" dataKey="securityScore" stroke={theme.palette.success.main} strokeWidth={2} />
                  <Line type="monotone" dataKey="responseTime" stroke={theme.palette.info.main} strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Grid>

        {/* Performance Metrics */}
        <Grid item xs={12} lg={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                System Resources
              </Typography>
              
              <Box sx={{ mb: 3 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Typography variant="body2">CPU Usage</Typography>
                  <Typography variant="body2">{performanceData[0].value.toFixed(1)}%</Typography>
                </Box>
                <LinearProgress 
                  variant="determinate" 
                  value={performanceData[0].value} 
                  sx={{ height: 8, borderRadius: 4 }} 
                />
              </Box>
              
              <Box sx={{ mb: 3 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Typography variant="body2">Memory Usage</Typography>
                  <Typography variant="body2">{performanceData[1].value.toFixed(1)}%</Typography>
                </Box>
                <LinearProgress 
                  variant="determinate" 
                  value={performanceData[1].value} 
                  sx={{ height: 8, borderRadius: 4 }} 
                />
              </Box>
              
              <Box sx={{ mb: 3 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Typography variant="body2">Network Load</Typography>
                  <Typography variant="body2">{performanceData[2].value.toFixed(1)}%</Typography>
                </Box>
                <LinearProgress 
                  variant="determinate" 
                  value={performanceData[2].value} 
                  sx={{ height: 8, borderRadius: 4 }} 
                />
              </Box>

              <Box sx={{ mt: 3, p: 2, bgcolor: 'background.default', borderRadius: 1 }}>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  Active Connections
                </Typography>
                <Typography variant="h6" color="primary.main">
                  {vehicles.length.toLocaleString()}
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Resource Distribution */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Resource Distribution
              </Typography>
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie
                    data={performanceData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {performanceData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <RechartsTooltip />
                </PieChart>
              </ResponsiveContainer>
              <Box sx={{ display: 'flex', justifyContent: 'space-around', mt: 2 }}>
                {performanceData.map((item) => (
                  <Box key={item.name} sx={{ textAlign: 'center' }}>
                    <Box sx={{ width: 12, height: 12, bgcolor: item.color, borderRadius: '50%', mx: 'auto', mb: 1 }} />
                    <Typography variant="caption" color="text.secondary">
                      {item.name}
                    </Typography>
                  </Box>
                ))}
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Network Status */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Network Status
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <NetworkIcon sx={{ mr: 1, color: 'success.main' }} />
                <Typography variant="body1">All Systems Operational</Typography>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <MemoryIcon sx={{ mr: 1, color: 'info.main' }} />
                <Typography variant="body1">Cache Performance: Excellent</Typography>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <StorageIcon sx={{ mr: 1, color: 'warning.main' }} />
                <Typography variant="body1">Storage: 67% Used</Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default Dashboard;
