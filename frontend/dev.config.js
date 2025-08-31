// Development configuration for GeoVAN
module.exports = {
  // Frontend configuration
  frontend: {
    port: 3000,
    host: 'localhost',
    protocol: 'http'
  },
  
  // Backend configuration
  backend: {
    port: 8080,
    host: 'localhost',
    protocol: 'http',
    websocketPort: 8081,
    websocketHost: 'localhost',
    websocketProtocol: 'ws'
  },
  
  // IoT Server configuration
  iotServer: {
    port: 8080,
    host: 'localhost',
    protocol: 'http',
    websocketProtocol: 'ws'
  },
  
  // Development URLs
  urls: {
    frontend: 'http://localhost:3000',
    backend: 'http://localhost:8080',
    websocket: 'ws://localhost:8081',
    iotServer: 'http://localhost:8080'
  },
  
  // Feature flags for development
  features: {
    enableMockData: true,
    enableRealTimeUpdates: true,
    enableMap: true,
    enableAnalytics: true,
    enableSecurity: true
  },
  
  // Logging configuration
  logging: {
    level: 'info',
    enableConsole: true,
    enableFile: false
  }
};
