export interface Vehicle {
  id: string;
  name: string;
  status: 'active' | 'warning' | 'error' | 'offline';
  position: {
    lat: number;
    lng: number;
    accuracy: number;
    altitude?: number;
  };
  velocity: {
    speed: number;
    heading: number;
    acceleration: number;
  };
  metadata: {
    make: string;
    model: string;
    year: number;
    licensePlate: string;
    driverId: string;
    emergencyVehicle: boolean;
    autonomousLevel: number;
  };
  sensors: {
    temperature: number;
    fuel?: number;
    battery?: number;
    engineRPM?: number;
    tirePressure?: number[];
    humidity?: number;
    pressure?: number;
    accelerometer?: { x: number; y: number; z: number };
    compass?: { x: number; y: number; z: number };
  };
  security: {
    trustScore: number;
    certificateValid: boolean;
    lastSignature: string;
    encryptionLevel: 'AES-128' | 'AES-256' | 'ChaCha20';
  };
  network: {
    signalStrength: number;
    connectionType: '4G' | '5G' | 'WiFi' | 'Satellite';
    latency: number;
    bandwidth: number;
    ssid?: string;
    localIP?: string;
  };
  timestamp: Date;
  lastUpdate: Date;
  iotData?: {
    receivedAt: string;
    checksum: string;
    source: string;
  };
  hardware?: {
    cpu_temp: number;
    memory_usage: number;
    disk_usage: number;
  };
}

export interface VehicleCluster {
  id: string;
  center: { lat: number; lng: number };
  vehicles: string[];
  density: number;
  averageSpeed: number;
  riskLevel: 'low' | 'medium' | 'high';
}

export interface VehicleAnalytics {
  totalVehicles: number;
  activeVehicles: number;
  averageSpeed: number;
  totalDistance: number;
  fuelEfficiency: number;
  securityIncidents: number;
  networkPerformance: number;
  systemHealth: number;
}

import { config } from '../config/env';

class VehicleService {
  private socket: WebSocket | null = null;
  private vehicles: Map<string, Vehicle> = new Map();
  private clusters: Map<string, VehicleCluster> = new Map();
  private listeners: Set<(vehicles: Vehicle[]) => void> = new Set();
  private analyticsListeners: Set<(analytics: VehicleAnalytics) => void> = new Set();
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private serverUrl: string;

  constructor() {
    // Use config for server URL
    this.serverUrl = config.IOT_SERVER_URL;
    this.maxReconnectAttempts = config.MAX_RECONNECT_ATTEMPTS;
    this.initializeWebSocket();
  }

  private initializeWebSocket() {
    try {
      // Check if we have a valid server URL
      if (!this.serverUrl || this.serverUrl === 'http://localhost:8081') {
        console.log('No valid IoT server URL configured, skipping WebSocket connection');
        return;
      }

      // Don't initialize if already connected
      if (this.socket && this.socket.readyState === WebSocket.OPEN) {
        console.log('WebSocket already connected, skipping initialization');
        return;
      }

      // Connect to IoT server WebSocket
      const wsUrl = this.serverUrl.replace('http', 'ws');
      console.log('Attempting to connect to WebSocket:', wsUrl);
      
      this.socket = new WebSocket(wsUrl);

      this.socket.onopen = () => {
        console.log('Connected to GeoVAN IoT server');
        this.reconnectAttempts = 0;
        
        // Send initial connection message
        if (this.socket && this.socket.readyState === WebSocket.OPEN) {
          this.socket.send(JSON.stringify({
            type: 'client_connected',
            clientId: 'geovan-frontend',
            timestamp: new Date().toISOString()
          }));
        }
      };

      this.socket.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data);
          this.handleMessage(message);
        } catch (error) {
          console.error('Error parsing WebSocket message:', error);
        }
      };

      this.socket.onclose = (event) => {
        console.log('Disconnected from IoT server:', event.code, event.reason);
        
        // Only attempt to reconnect if it's not a clean close and we haven't exceeded max attempts
        if (event.code !== 1000 && this.reconnectAttempts < this.maxReconnectAttempts) {
          this.attemptReconnect();
        } else if (this.reconnectAttempts >= this.maxReconnectAttempts) {
          console.error('Max reconnection attempts reached. Manual reconnection required.');
        }
      };

      this.socket.onerror = (error) => {
        console.error('WebSocket error:', error);
      };
    } catch (error) {
      console.error('Failed to initialize WebSocket:', error);
      this.attemptReconnect();
    }
  }

  private handleMessage(message: any) {
    switch (message.type) {
      case 'vehicles_initial':
        this.updateVehiclesFromServer(message.data);
        break;
      case 'vehicles_update':
        this.updateVehiclesFromServer(message.data);
        break;
      case 'vehicle_update':
        this.updateVehicleFromServer(message.data);
        break;
      case 'analytics_initial':
      case 'analytics_update':
        this.updateAnalyticsFromServer(message.data);
        break;
      case 'vehicle_status_update':
        this.updateVehicleStatus(message.data.id, message.data.status);
        break;
      case 'emergency_alert':
        this.handleEmergencyAlert(message.data);
        break;
      default:
        console.log('Unknown message type:', message.type);
    }
  }

  private updateVehiclesFromServer(vehiclesData: Vehicle[]) {
    vehiclesData.forEach(vehicle => {
      // Convert string timestamps to Date objects
      if (typeof vehicle.timestamp === 'string') {
        vehicle.timestamp = new Date(vehicle.timestamp);
      }
      if (typeof vehicle.lastUpdate === 'string') {
        vehicle.lastUpdate = new Date(vehicle.lastUpdate);
      }
      
      this.vehicles.set(vehicle.id, vehicle);
    });
    this.notifyListeners();
  }

  private updateVehicleFromServer(vehicleData: Vehicle) {
    // Convert string timestamps to Date objects
    if (typeof vehicleData.timestamp === 'string') {
      vehicleData.timestamp = new Date(vehicleData.timestamp);
    }
    if (typeof vehicleData.lastUpdate === 'string') {
      vehicleData.lastUpdate = new Date(vehicleData.lastUpdate);
    }
    
    this.vehicles.set(vehicleData.id, vehicleData);
    this.notifyListeners();
  }

  private updateAnalyticsFromServer(analyticsData: VehicleAnalytics) {
    this.analyticsListeners.forEach(listener => listener(analyticsData));
  }

  private handleEmergencyAlert(alertData: any) {
    console.log('Emergency alert received:', alertData);
    // You can implement emergency alert handling here
    // For example, show notifications, update UI, etc.
  }

  private attemptReconnect() {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      console.log(`Attempting to reconnect... (${this.reconnectAttempts}/${this.maxReconnectAttempts})`);
      
      setTimeout(() => {
        this.initializeWebSocket();
      }, 2000 * this.reconnectAttempts);
    } else {
      console.error('Max reconnection attempts reached. System will not receive real-time updates.');
    }
  }

  // Public API
  public getVehicles(): Vehicle[] {
    return Array.from(this.vehicles.values());
  }

  public getVehicle(id: string): Vehicle | undefined {
    return this.vehicles.get(id);
  }

  public getClusters(): VehicleCluster[] {
    return Array.from(this.clusters.values());
  }

  public subscribeToVehicles(callback: (vehicles: Vehicle[]) => void): () => void {
    this.listeners.add(callback);
    callback(this.getVehicles()); // Initial call
    
    return () => {
      this.listeners.delete(callback);
    };
  }

  public subscribeToAnalytics(callback: (analytics: VehicleAnalytics) => void): () => void {
    this.analyticsListeners.add(callback);
    
    return () => {
      this.analyticsListeners.delete(callback);
    };
  }

  public updateVehicleStatus(id: string, status: Vehicle['status']) {
    const vehicle = this.vehicles.get(id);
    if (vehicle) {
      vehicle.status = status;
      vehicle.lastUpdate = new Date();
      this.notifyListeners();
      
      // Send update to server if connected
      if (this.socket && this.socket.readyState === WebSocket.OPEN) {
        this.socket.send(JSON.stringify({
          type: 'update_vehicle_status',
          vehicleId: id,
          status: status
        }));
      }
    }
  }

  public async fetchVehiclesFromAPI(): Promise<Vehicle[]> {
    try {
      const apiUrl = this.serverUrl.replace('ws://', 'http://').replace('wss://', 'https://');
      const response = await fetch(`${apiUrl}/api/vehicles`);
      
      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          // Convert string timestamps to Date objects
          result.data.forEach((vehicle: Vehicle) => {
            if (typeof vehicle.timestamp === 'string') {
              vehicle.timestamp = new Date(vehicle.timestamp);
            }
            if (typeof vehicle.lastUpdate === 'string') {
              vehicle.lastUpdate = new Date(vehicle.lastUpdate);
            }
          });
          
          return result.data;
        }
      }
      
      throw new Error(`Failed to fetch vehicles: ${response.status}`);
    } catch (error) {
      console.error('Error fetching vehicles from API:', error);
      return [];
    }
  }

  public async fetchAnalyticsFromAPI(): Promise<VehicleAnalytics | null> {
    try {
      const apiUrl = this.serverUrl.replace('ws://', 'http://').replace('wss://', 'https://');
      const response = await fetch(`${apiUrl}/api/analytics`);
      
      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          return result.data;
        }
      }
      
      throw new Error(`Failed to fetch analytics: ${response.status}`);
    } catch (error) {
      console.error('Error fetching analytics from API:', error);
      return null;
    }
  }

  public disconnect() {
    if (this.socket) {
      this.socket.close();
    }
  }

  public getConnectionStatus(): 'connected' | 'connecting' | 'disconnected' {
    if (!this.socket) return 'disconnected';
    
    switch (this.socket.readyState) {
      case WebSocket.CONNECTING:
        return 'connecting';
      case WebSocket.OPEN:
        return 'connected';
      default:
        return 'disconnected';
    }
  }

  private notifyListeners() {
    const vehicleArray = Array.from(this.vehicles.values());
    this.listeners.forEach(listener => listener(vehicleArray));
  }
}

export const vehicleService = new VehicleService();
