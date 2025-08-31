// Environment configuration for Vite
export const config = {
  // IoT Server URL - can be overridden by environment variables
  IOT_SERVER_URL: (import.meta as any).env?.VITE_IOT_SERVER_URL || 'ws://localhost:8080',
  
  // API Base URL
  API_BASE_URL: (import.meta as any).env?.VITE_API_BASE_URL || 'http://localhost:8081',
  
  // WebSocket URL
  WS_URL: (import.meta as any).env?.VITE_WS_URL || 'ws://localhost:8080',
  
  // App Environment
  NODE_ENV: (import.meta as any).env?.MODE || 'development',
  
  // Feature Flags
  ENABLE_ANALYTICS: (import.meta as any).env?.VITE_ENABLE_ANALYTICS !== 'false',
  ENABLE_MAP: (import.meta as any).env?.VITE_ENABLE_MAP !== 'false',
  ENABLE_REALTIME: (import.meta as any).env?.VITE_ENABLE_REALTIME !== 'false',
  
  // Map Configuration
  DEFAULT_MAP_CENTER: {
    lat: 30.3165, // Dehradun, Uttarakhand, India
    lng: 78.0322,
  },
  DEFAULT_MAP_ZOOM: 12,
  
  // Update Intervals
  VEHICLE_UPDATE_INTERVAL: 5000, // 5 seconds
  ANALYTICS_UPDATE_INTERVAL: 10000, // 10 seconds
  
  // Connection Settings
  MAX_RECONNECT_ATTEMPTS: 5,
  RECONNECT_DELAY: 2000, // 2 seconds
};
