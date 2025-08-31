const express = require('express');
const cors = require('cors');
const app = express();
const PORT = 8080;

// Middleware
app.use(cors());
app.use(express.json());

// Mock data for development
let mockData = {
  vehicles: 1247,
  securityScore: 94.2,
  responseTime: 0.8,
  alerts: 3,
  cpuUsage: 23,
  memoryUsage: 67,
  networkLoad: 45,
  activeConnections: 1200,
};

// Update mock data every 5 seconds
setInterval(() => {
  mockData = {
    vehicles: Math.floor(Math.random() * 500) + 1000,
    securityScore: Math.floor(Math.random() * 10) + 90,
    responseTime: Math.random() * 2 + 0.5,
    alerts: Math.floor(Math.random() * 5) + 1,
    cpuUsage: Math.random() * 30 + 20,
    memoryUsage: Math.random() * 40 + 50,
    networkLoad: Math.random() * 50 + 30,
    activeConnections: Math.floor(Math.random() * 200) + 800,
  };
}, 5000);

// Routes
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

app.get('/api/dashboard', (req, res) => {
  res.json({
    success: true,
    data: mockData,
    timestamp: new Date().toISOString()
  });
});

app.get('/api/vehicles', (req, res) => {
  const vehicles = Array.from({ length: 50 }, (_, i) => ({
    id: i + 1,
    name: `Vehicle-${String(i + 1).padStart(3, '0')}`,
    status: Math.random() > 0.1 ? 'active' : 'warning',
    location: `Location-${i + 1}`,
    speed: Math.floor(Math.random() * 100) + 20,
    trust: Math.floor(Math.random() * 20) + 80,
    lastUpdate: new Date(Date.now() - Math.random() * 60000).toISOString()
  }));
  
  res.json({
    success: true,
    data: vehicles,
    timestamp: new Date().toISOString()
  });
});

app.get('/api/analytics', (req, res) => {
  const analytics = {
    totalVehicles: mockData.vehicles,
    averageSpeed: 45.2,
    securityIncidents: 2,
    networkLatency: mockData.responseTime,
    systemUptime: 99.8,
    dataThroughput: '2.4 GB/s'
  };
  
  res.json({
    success: true,
    data: analytics,
    timestamp: new Date().toISOString()
  });
});

// Error handling
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ 
    success: false, 
    error: 'Something went wrong!' 
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ 
    success: false, 
    error: 'Route not found' 
  });
});

app.listen(PORT, () => {
  console.log(`🚀 Local Backend running on http://localhost:${PORT}`);
  console.log(`📊 Dashboard: http://localhost:${PORT}/api/dashboard`);
  console.log(`🚗 Vehicles: http://localhost:${PORT}/api/vehicles`);
  console.log(`📈 Analytics: http://localhost:${PORT}/api/analytics`);
  console.log(`💚 Health: http://localhost:${PORT}/api/health`);
});
