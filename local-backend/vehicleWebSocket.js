const WebSocket = require('ws');
const http = require('http');
const server = http.createServer();
const wss = new WebSocket.Server({ server });

// Vehicle data simulation
let vehicles = new Map();
let vehicleId = 1;

// Generate realistic vehicle data
const generateVehicle = () => {
  const makes = ['Tesla', 'BMW', 'Mercedes', 'Audi', 'Ford', 'Toyota', 'Honda'];
  const models = ['Model S', 'X5', 'C-Class', 'A4', 'Mustang', 'Camry', 'Civic'];
  const cities = [
    { name: 'New York', lat: 40.7128, lng: -74.0060 },
    { name: 'Los Angeles', lat: 34.0522, lng: -118.2437 },
    { name: 'Chicago', lat: 41.8781, lng: -87.6298 },
    { name: 'Houston', lat: 29.7604, lng: -95.3698 },
    { name: 'Phoenix', lat: 33.4484, lng: -112.0740 },
  ];

  const city = cities[Math.floor(Math.random() * cities.length)];
  
  return {
    id: `vehicle-${vehicleId++}`,
    name: `Vehicle-${vehicleId}`,
    status: Math.random() > 0.1 ? 'active' : 'warning',
    position: {
      lat: city.lat + (Math.random() - 0.5) * 0.1,
      lng: city.lng + (Math.random() - 0.5) * 0.1,
      accuracy: Math.random() * 5 + 1,
    },
    velocity: {
      speed: Math.random() * 80 + 20,
      heading: Math.random() * 360,
      acceleration: (Math.random() - 0.5) * 2,
    },
    metadata: {
      make: makes[Math.floor(Math.random() * makes.length)],
      model: models[Math.floor(Math.random() * models.length)],
      year: 2018 + Math.floor(Math.random() * 6),
      licensePlate: generateLicensePlate(),
      driverId: `driver-${Math.floor(Math.random() * 1000)}`,
      emergencyVehicle: Math.random() > 0.95,
      autonomousLevel: Math.floor(Math.random() * 6),
    },
    sensors: {
      temperature: 20 + Math.random() * 30,
      fuel: Math.random() * 100,
      battery: Math.random() * 100,
      engineRPM: Math.random() * 3000 + 1000,
      tirePressure: Array.from({ length: 4 }, () => 30 + Math.random() * 10),
    },
    security: {
      trustScore: 70 + Math.random() * 30,
      certificateValid: Math.random() > 0.1,
      lastSignature: generateSignature(),
      encryptionLevel: ['AES-128', 'AES-256', 'ChaCha20'][Math.floor(Math.random() * 3)],
    },
    network: {
      signalStrength: Math.random() * 100,
      connectionType: ['4G', '5G', 'WiFi', 'Satellite'][Math.floor(Math.random() * 4)],
      latency: Math.random() * 100 + 10,
      bandwidth: Math.random() * 100 + 50,
    },
    timestamp: new Date(),
    lastUpdate: new Date(),
  };
};

const generateLicensePlate = () => {
  const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const numbers = '0123456789';
  let plate = '';
  
  for (let i = 0; i < 3; i++) {
    plate += letters[Math.floor(Math.random() * letters.length)];
  }
  plate += ' ';
  for (let i = 0; i < 3; i++) {
    plate += numbers[Math.floor(Math.random() * numbers.length)];
  }
  
  return plate;
};

const generateSignature = () => {
  return Array.from({ length: 64 }, () => 
    Math.floor(Math.random() * 16).toString(16)
  ).join('');
};

// Initialize vehicles
for (let i = 0; i < 50; i++) {
  const vehicle = generateVehicle();
  vehicles.set(vehicle.id, vehicle);
}

// Update vehicle positions and data
const updateVehicles = () => {
  vehicles.forEach((vehicle) => {
    if (vehicle.status === 'active') {
      // Simulate movement
      const speedMPS = vehicle.velocity.speed * 0.277778; // km/h to m/s
      const timeDelta = 1; // 1 second
      
      // Update position based on speed and heading
      const latDelta = (speedMPS * timeDelta * Math.cos(vehicle.velocity.heading * Math.PI / 180)) / 111320;
      const lngDelta = (speedMPS * timeDelta * Math.sin(vehicle.velocity.heading * Math.PI / 180)) / (111320 * Math.cos(vehicle.position.lat * Math.PI / 180));
      
      vehicle.position.lat += latDelta;
      vehicle.position.lng += lngDelta;
      
      // Update other dynamic values
      vehicle.velocity.speed += vehicle.velocity.acceleration * timeDelta;
      vehicle.velocity.speed = Math.max(0, Math.min(120, vehicle.velocity.speed));
      
      vehicle.sensors.fuel -= Math.random() * 0.1;
      vehicle.sensors.battery -= Math.random() * 0.05;
      vehicle.sensors.temperature += (Math.random() - 0.5) * 0.5;
      
      vehicle.network.latency += (Math.random() - 0.5) * 2;
      vehicle.network.latency = Math.max(5, Math.min(200, vehicle.network.latency));
      
      vehicle.lastUpdate = new Date();
      
      // Random status changes
      if (Math.random() > 0.995) {
        vehicle.status = 'warning';
      } else if (vehicle.status === 'warning' && Math.random() > 0.8) {
        vehicle.status = 'active';
      }
    }
  });
};

// WebSocket connection handling
wss.on('connection', (ws) => {
  console.log('New WebSocket connection established');
  
  // Send initial vehicle data
  ws.send(JSON.stringify({
    type: 'vehicles_initial',
    data: Array.from(vehicles.values())
  }));

  // Send vehicle updates every second
  const interval = setInterval(() => {
    if (ws.readyState === WebSocket.OPEN) {
      updateVehicles();
      
      // Send all vehicle updates
      ws.send(JSON.stringify({
        type: 'vehicles_update',
        data: Array.from(vehicles.values())
      }));

      // Send analytics data
      const vehicleArray = Array.from(vehicles.values());
      const activeVehicles = vehicleArray.filter(v => v.status === 'active');
      
      const analytics = {
        totalVehicles: vehicleArray.length,
        activeVehicles: activeVehicles.length,
        averageSpeed: activeVehicles.reduce((sum, v) => sum + v.velocity.speed, 0) / activeVehicles.length || 0,
        totalDistance: activeVehicles.reduce((sum, v) => sum + v.velocity.speed * 0.000277778, 0),
        fuelEfficiency: activeVehicles.reduce((sum, v) => sum + v.sensors.fuel, 0) / activeVehicles.length || 0,
        securityIncidents: vehicleArray.filter(v => !v.security.certificateValid).length,
        networkPerformance: activeVehicles.reduce((sum, v) => sum + (100 - v.network.latency / 2), 0) / activeVehicles.length || 0,
        systemHealth: activeVehicles.reduce((sum, v) => sum + v.security.trustScore, 0) / activeVehicles.length || 0,
      };

      ws.send(JSON.stringify({
        type: 'analytics_update',
        data: analytics
      }));
    }
  }, 1000);

  // Handle incoming messages
  ws.on('message', (message) => {
    try {
      const data = JSON.parse(message);
      
      switch (data.type) {
        case 'get_vehicle':
          const vehicle = vehicles.get(data.vehicleId);
          if (vehicle) {
            ws.send(JSON.stringify({
              type: 'vehicle_data',
              data: vehicle
            }));
          }
          break;
          
        case 'update_vehicle_status':
          const targetVehicle = vehicles.get(data.vehicleId);
          if (targetVehicle) {
            targetVehicle.status = data.status;
            targetVehicle.lastUpdate = new Date();
            
            // Broadcast update to all clients
            wss.clients.forEach((client) => {
              if (client.readyState === WebSocket.OPEN) {
                client.send(JSON.stringify({
                  type: 'vehicle_status_update',
                  data: { id: data.vehicleId, status: data.status }
                }));
              }
            });
          }
          break;
          
        default:
          console.log('Unknown message type:', data.type);
      }
    } catch (error) {
      console.error('Error parsing message:', error);
    }
  });

  // Handle client disconnect
  ws.on('close', () => {
    console.log('WebSocket connection closed');
    clearInterval(interval);
  });

  ws.on('error', (error) => {
    console.error('WebSocket error:', error);
    clearInterval(interval);
  });
});

// Start server
const PORT = 8081;
server.listen(PORT, () => {
  console.log(`🚗 Vehicle WebSocket Server running on ws://localhost:${PORT}`);
  console.log(`📊 Broadcasting real-time vehicle data to ${wss.clients.size} clients`);
});

// Handle server shutdown
process.on('SIGINT', () => {
  console.log('\n🛑 Shutting down Vehicle WebSocket Server...');
  wss.close(() => {
    server.close(() => {
      console.log('✅ Server shutdown complete');
      process.exit(0);
    });
  });
});
