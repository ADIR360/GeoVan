const express = require('express');
const cors = require('cors');
const WebSocket = require('ws');
const http = require('http');
const path = require('path');

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.static('public'));

// In-memory storage for real vehicle data
const vehicles = new Map();
const vehicleConnections = new Map();
const analyticsSubscribers = new Set();

// Vehicle data validation
const validateVehicleData = (data) => {
  const required = ['id', 'position', 'velocity', 'sensors', 'security', 'network'];
  return required.every(field => data.hasOwnProperty(field)) &&
         data.position.lat !== 0 && data.position.lng !== 0;
};

// Calculate vehicle analytics
const calculateAnalytics = () => {
  const vehicleArray = Array.from(vehicles.values());
  const activeVehicles = vehicleArray.filter(v => v.status === 'active');
  
  return {
    totalVehicles: vehicleArray.length,
    activeVehicles: activeVehicles.length,
    averageSpeed: activeVehicles.reduce((sum, v) => sum + v.velocity.speed, 0) / activeVehicles.length || 0,
    totalDistance: activeVehicles.reduce((sum, v) => sum + v.velocity.speed * 0.000277778, 0),
    fuelEfficiency: activeVehicles.reduce((sum, v) => sum + (v.sensors.fuel || 0), 0) / activeVehicles.length || 0,
    securityIncidents: vehicleArray.filter(v => !v.security.certificateValid).length,
    networkPerformance: activeVehicles.reduce((sum, v) => sum + (100 - (v.network.latency || 0) / 2), 0) / activeVehicles.length || 0,
    systemHealth: activeVehicles.reduce((sum, v) => sum + v.security.trustScore, 0) / activeVehicles.length || 0,
  };
};

// Broadcast to all WebSocket clients
const broadcastToClients = (message) => {
  wss.clients.forEach(client => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(JSON.stringify(message));
    }
  });
};

// API Routes
app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    message: 'GeoVAN IoT Server Running',
    timestamp: new Date().toISOString(),
    vehicles: vehicles.size,
    connections: wss.clients.size
  });
});

// Get all vehicles
app.get('/api/vehicles', (req, res) => {
  const vehicleArray = Array.from(vehicles.values());
  res.json({
    success: true,
    data: vehicleArray,
    timestamp: new Date().toISOString(),
    count: vehicleArray.length
  });
});

// Get specific vehicle
app.get('/api/vehicle/:id', (req, res) => {
  const vehicle = vehicles.get(req.params.id);
  if (vehicle) {
    res.json({
      success: true,
      data: vehicle,
      timestamp: new Date().toISOString()
    });
  } else {
    res.status(404).json({
      success: false,
      message: 'Vehicle not found'
    });
  }
});

// Update vehicle data (from IoT devices)
app.post('/api/vehicle/update', (req, res) => {
  try {
    const { vehicle_id, data, timestamp, checksum } = req.body;
    
    if (!vehicle_id || !data) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields'
      });
    }

    // Validate vehicle data
    if (!validateVehicleData(data)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid vehicle data format'
      });
    }

    // Update vehicle data
    const vehicle = {
      ...data,
      lastUpdate: new Date().toISOString(),
      iotData: {
        receivedAt: new Date().toISOString(),
        checksum: checksum,
        source: 'iot-device'
      }
    };

    vehicles.set(vehicle_id, vehicle);

    // Broadcast update to WebSocket clients
    broadcastToClients({
      type: 'vehicle_update',
      data: vehicle
    });

    // Update analytics
    const analytics = calculateAnalytics();
    broadcastToClients({
      type: 'analytics_update',
      data: analytics
    });

    res.json({
      success: true,
      message: 'Vehicle data updated successfully',
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error updating vehicle:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
});

// Get analytics
app.get('/api/analytics', (req, res) => {
  const analytics = calculateAnalytics();
  res.json({
    success: true,
    data: analytics,
    timestamp: new Date().toISOString()
  });
});

// Vehicle status management
app.post('/api/vehicle/:id/status', (req, res) => {
  const { status } = req.body;
  const vehicle = vehicles.get(req.params.id);
  
  if (!vehicle) {
    return res.status(404).json({
      success: false,
      message: 'Vehicle not found'
    });
  }

  vehicle.status = status;
  vehicle.lastUpdate = new Date().toISOString();

  // Broadcast status update
  broadcastToClients({
    type: 'vehicle_status_update',
    data: { id: req.params.id, status }
  });

  res.json({
    success: true,
    message: 'Vehicle status updated',
    data: { id: req.params.id, status }
  });
});

// Emergency alert endpoint
app.post('/api/emergency', (req, res) => {
  const { vehicle_id, alert_type, location, description } = req.body;
  
  const emergencyAlert = {
    id: `emergency-${Date.now()}`,
    vehicle_id,
    alert_type,
    location,
    description,
    timestamp: new Date().toISOString(),
    status: 'active'
  };

  // Broadcast emergency alert
  broadcastToClients({
    type: 'emergency_alert',
    data: emergencyAlert
  });

  res.json({
    success: true,
    message: 'Emergency alert created',
    data: emergencyAlert
  });
});

// WebSocket connection handling
wss.on('connection', (ws, req) => {
  console.log('New WebSocket connection established');
  
  // Send initial data
  const vehicleArray = Array.from(vehicles.values());
  ws.send(JSON.stringify({
    type: 'vehicles_initial',
    data: vehicleArray
  }));

  const analytics = calculateAnalytics();
  ws.send(JSON.stringify({
    type: 'analytics_initial',
    data: analytics
  }));

  // Handle incoming messages
  ws.on('message', (message) => {
    try {
      const data = JSON.parse(message);
      
      switch (data.type) {
        case 'subscribe_analytics':
          analyticsSubscribers.add(ws);
          break;
          
        case 'unsubscribe_analytics':
          analyticsSubscribers.delete(ws);
          break;
          
        case 'get_vehicle':
          const vehicle = vehicles.get(data.vehicle_id);
          if (vehicle) {
            ws.send(JSON.stringify({
              type: 'vehicle_data',
              data: vehicle
            }));
          }
          break;
          
        default:
          console.log('Unknown message type:', data.type);
      }
    } catch (error) {
      console.error('Error parsing WebSocket message:', error);
    }
  });

  // Handle client disconnect
  ws.on('close', () => {
    console.log('WebSocket connection closed');
    analyticsSubscribers.delete(ws);
  });

  ws.on('error', (error) => {
    console.error('WebSocket error:', error);
    analyticsSubscribers.delete(ws);
  });
});

// Periodic analytics updates
setInterval(() => {
  const analytics = calculateAnalytics();
  analyticsSubscribers.forEach(client => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(JSON.stringify({
        type: 'analytics_update',
        data: analytics
      }));
    }
  });
}, 5000);

// Data persistence (save to file every 5 minutes)
setInterval(() => {
  try {
    const fs = require('fs');
    const data = {
      vehicles: Array.from(vehicles.entries()),
      timestamp: new Date().toISOString()
    };
    
    fs.writeFileSync(
      path.join(__dirname, 'vehicle_data.json'),
      JSON.stringify(data, null, 2)
    );
    
    console.log('Vehicle data saved to file');
  } catch (error) {
    console.error('Error saving vehicle data:', error);
  }
}, 5 * 60 * 1000);

// Load saved data on startup
try {
  const fs = require('fs');
  const dataFile = path.join(__dirname, 'vehicle_data.json');
  
  if (fs.existsSync(dataFile)) {
    const savedData = JSON.parse(fs.readFileSync(dataFile, 'utf8'));
    savedData.vehicles.forEach(([id, vehicle]) => {
      vehicles.set(id, vehicle);
    });
    console.log(`Loaded ${vehicles.size} vehicles from saved data`);
  }
} catch (error) {
  console.error('Error loading saved vehicle data:', error);
}

// Start server
const PORT = process.env.PORT || 8080;
server.listen(PORT, () => {
  console.log(`🚗 GeoVAN IoT Server running on http://localhost:${PORT}`);
  console.log(`📡 WebSocket server ready for IoT connections`);
  console.log(`🌐 API endpoints available at /api/*`);
  console.log(`📊 Real-time vehicle tracking enabled`);
});

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\n🛑 Shutting down GeoVAN IoT Server...');
  
  // Save final data
  try {
    const fs = require('fs');
    const data = {
      vehicles: Array.from(vehicles.entries()),
      timestamp: new Date().toISOString()
    };
    
    fs.writeFileSync(
      path.join(__dirname, 'vehicle_data.json'),
      JSON.stringify(data, null, 2)
    );
  } catch (error) {
    console.error('Error saving final data:', error);
  }
  
  wss.close(() => {
    server.close(() => {
      console.log('✅ Server shutdown complete');
      process.exit(0);
    });
  });
});
