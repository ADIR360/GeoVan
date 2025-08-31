import React, { useState, useEffect, useRef } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  useTheme,
  useMediaQuery,
  Chip,
  IconButton,
  Tooltip,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Divider,
  Alert,
  CircularProgress,
} from '@mui/material';
import {
  DirectionsCar as CarIcon,
  LocationOn as LocationIcon,
  Refresh as RefreshIcon,
  Fullscreen as FullscreenIcon,
  Warning as WarningIcon,
  Error as ErrorIcon,
  CheckCircle as CheckIcon,
  Satellite as SatelliteIcon,
  Traffic as TrafficIcon,
} from '@mui/icons-material';
import { MapContainer, TileLayer, Marker, Popup, Circle } from 'react-leaflet';
import L from 'leaflet';
import { vehicleService, Vehicle, VehicleCluster } from '../../services/vehicleService';

// Import Leaflet CSS for proper map rendering
import 'leaflet/dist/leaflet.css';

// Fix for Leaflet markers in React
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Custom vehicle markers
const createVehicleIcon = (status: Vehicle['status'], emergency: boolean) => {
  const colors = {
    active: '#4caf50',
    warning: '#ff9800',
    error: '#f44336',
    offline: '#9e9e9e',
  };

  const iconHtml = `
    <div style="
      background-color: ${colors[status]};
      width: 20px;
      height: 20px;
      border-radius: 50%;
      border: 3px solid white;
      box-shadow: 0 2px 4px rgba(0,0,0,0.3);
      ${emergency ? 'animation: pulse 1s infinite;' : ''}
    "></div>
    <style>
      @keyframes pulse {
        0% { transform: scale(1); }
        50% { transform: scale(1.2); }
        100% { transform: scale(1); }
      }
    </style>
  `;

  return L.divIcon({
    html: iconHtml,
    className: 'vehicle-marker',
    iconSize: [20, 20],
    iconAnchor: [10, 10],
  });
};

// Custom secondary content component to avoid DOM nesting issues
const VehicleSecondaryInfo: React.FC<{ vehicle: Vehicle }> = ({ vehicle }) => (
  <div>
    <div style={{ fontSize: '0.75rem', lineHeight: '1.2' }}>
      {vehicle.velocity.speed.toFixed(1)} km/h • {vehicle.metadata.make} {vehicle.metadata.model}
    </div>
    <div style={{ fontSize: '0.75rem', lineHeight: '1.2', color: 'rgba(0, 0, 0, 0.6)' }}>
      Trust: {vehicle.security.trustScore.toFixed(1)}%
    </div>
  </div>
);

// Map component with real-time updates
const VehicleMapComponent: React.FC = () => {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [clusters] = useState<VehicleCluster[]>([]);
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null);
  const [mapCenter, setMapCenter] = useState([30.3165, 78.0322]); // Dehradun, Uttarakhand, India
  const [zoom, setZoom] = useState(12);
  const [filters, setFilters] = useState({
    showActive: true,
    showWarning: true,
    showError: true,
    showOffline: false,
    showEmergency: true,
  });
  const [mapType, setMapType] = useState<'satellite' | 'traffic' | 'street'>('satellite');
  const [loading, setLoading] = useState(true);
  const [connectionStatus, setConnectionStatus] = useState<'connected' | 'connecting' | 'disconnected'>('disconnected');
  const mapRef = useRef<L.Map | null>(null);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  useEffect(() => {
    const unsubscribe = vehicleService.subscribeToVehicles((updatedVehicles) => {
      setVehicles(updatedVehicles);
      setLoading(false);
      
      // Update map center based on active vehicles
      if (updatedVehicles.length > 0) {
        const activeVehicles = updatedVehicles.filter(v => v.status === 'active');
        if (activeVehicles.length > 0) {
          const avgLat = activeVehicles.reduce((sum, v) => sum + v.position.lat, 0) / activeVehicles.length;
          const avgLng = activeVehicles.reduce((sum, v) => sum + v.position.lng, 0) / activeVehicles.length;
          
          // Only update if we have valid coordinates (not 0,0)
          if (avgLat !== 0 && avgLng !== 0) {
            setMapCenter([avgLat, avgLng]);
            setZoom(14);
          }
        } else {
          // No active vehicles, focus on Dehradun
          setMapCenter([30.3165, 78.0322]); // Dehradun, Uttarakhand, India
          setZoom(12);
        }
      } else {
        // No vehicles at all, focus on Dehradun
        setMapCenter([30.3165, 78.0322]); // Dehradun, Uttarakhand, India
        setZoom(12);
      }
    });

    // Monitor connection status
    const checkConnection = () => {
      const status = vehicleService.getConnectionStatus();
      setConnectionStatus(status);
    };

    const connectionInterval = setInterval(checkConnection, 5000);
    checkConnection(); // Initial check

    return () => {
      unsubscribe();
      clearInterval(connectionInterval);
    };
  }, []);

  const filteredVehicles = vehicles.filter(vehicle => {
    if (!filters.showActive && vehicle.status === 'active') return false;
    if (!filters.showWarning && vehicle.status === 'warning') return false;
    if (!filters.showError && vehicle.status === 'error') return false;
    if (!filters.showOffline && vehicle.status === 'offline') return false;
    if (!filters.showEmergency && vehicle.metadata.emergencyVehicle) return false;
    return true;
  });

  const handleVehicleClick = (vehicle: Vehicle) => {
    setSelectedVehicle(vehicle);
    if (vehicle.position.lat !== 0 && vehicle.position.lng !== 0) {
      setMapCenter([vehicle.position.lat, vehicle.position.lng]);
      setZoom(16);
    }
  };



  const getStatusColor = (status: Vehicle['status']) => {
    switch (status) {
      case 'active': return 'success';
      case 'warning': return 'warning';
      case 'error': return 'error';
      case 'offline': return 'default';
      default: return 'default';
    }
  };

  const getStatusIcon = (status: Vehicle['status']) => {
    switch (status) {
      case 'active': return <CheckIcon />;
      case 'warning': return <WarningIcon />;
      case 'error': return <ErrorIcon />;
      case 'offline': return <LocationIcon />;
      default: return <LocationIcon />;
    }
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
    } else {
      document.exitFullscreen();
    }
  };

  const getMapTileUrl = () => {
    switch (mapType) {
      case 'satellite':
        return 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}';
      case 'traffic':
        return 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
      case 'street':
        return 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
      default:
        return 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}';
    }
  };

  const getMapAttribution = () => {
    switch (mapType) {
      case 'satellite':
        return '&copy; <a href="https://www.esri.com/">Esri</a> &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community';
      case 'traffic':
      case 'street':
        return '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors';
      default:
        return '';
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
        <CircularProgress size={60} />
      </Box>
    );
  }

  return (
    <Box sx={{ p: { xs: 2, md: 3 }, pt: { xs: 8, md: 10 } }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4">
          Real-Time Vehicle Tracking
        </Typography>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Tooltip title="Refresh">
            <IconButton color="primary" onClick={() => window.location.reload()}>
              <RefreshIcon />
            </IconButton>
          </Tooltip>
          <Tooltip title="Fullscreen">
            <IconButton color="primary" onClick={toggleFullscreen}>
              <FullscreenIcon />
            </IconButton>
          </Tooltip>
        </Box>
      </Box>

      {/* Connection Status */}
      <Box sx={{ mb: 2 }}>
        <Alert 
          severity={connectionStatus === 'connected' ? 'success' : connectionStatus === 'connecting' ? 'warning' : 'error'}
          icon={connectionStatus === 'connected' ? <CheckIcon /> : <WarningIcon />}
        >
          {connectionStatus === 'connected' ? 'Connected to IoT Server' : 
           connectionStatus === 'connecting' ? 'Connecting to IoT Server...' : 
           'Disconnected from IoT Server'}
        </Alert>
      </Box>

      {/* Map Type Selector */}
      <Box sx={{ mb: 3 }}>
        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
          <Chip
            label="Satellite"
            color={mapType === 'satellite' ? 'primary' : 'default'}
            onClick={() => setMapType('satellite')}
            icon={<SatelliteIcon />}
            variant={mapType === 'satellite' ? 'filled' : 'outlined'}
          />
          <Chip
            label="Traffic"
            color={mapType === 'traffic' ? 'primary' : 'default'}
            onClick={() => setMapType('traffic')}
            icon={<TrafficIcon />}
            variant={mapType === 'traffic' ? 'filled' : 'outlined'}
          />
          <Chip
            label="Street"
            color={mapType === 'street' ? 'primary' : 'default'}
            onClick={() => setMapType('street')}
            variant={mapType === 'street' ? 'filled' : 'outlined'}
          />
        </Box>
      </Box>

      <Grid container spacing={3}>
        {/* Map */}
        <Grid item xs={12} lg={8}>
          <Card sx={{ height: isMobile ? 400 : 600 }}>
            <CardContent sx={{ p: 0, height: '100%' }}>
              <MapContainer
                center={mapCenter as [number, number]}
                zoom={zoom}
                style={{ height: '100%', width: '100%' }}
                ref={mapRef}
                zoomControl={true}
                scrollWheelZoom={true}
                doubleClickZoom={true}
                boxZoom={true}
                keyboard={true}
                dragging={true}
                touchZoom={true}
              >
                <TileLayer
                  url={getMapTileUrl()}
                  attribution={getMapAttribution()}
                  maxZoom={19}
                />
                
                {/* Vehicle Markers */}
                {filteredVehicles.map((vehicle) => {
                  // Only show vehicles with valid coordinates
                  if (vehicle.position.lat === 0 && vehicle.position.lng === 0) {
                    return null;
                  }
                  
                  return (
                    <Marker
                      key={vehicle.id}
                      position={[vehicle.position.lat, vehicle.position.lng]}
                      icon={createVehicleIcon(vehicle.status, vehicle.metadata.emergencyVehicle)}
                      eventHandlers={{
                        click: () => handleVehicleClick(vehicle),
                      }}
                    >
                      <Popup>
                        <Box sx={{ minWidth: 200 }}>
                          <Typography variant="h6" gutterBottom>
                            {vehicle.name}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            {vehicle.metadata.make} {vehicle.metadata.model} ({vehicle.metadata.year})
                          </Typography>
                          <Typography variant="body2">
                            Speed: {vehicle.velocity.speed.toFixed(1)} km/h
                          </Typography>
                          <Typography variant="body2">
                            Trust Score: {vehicle.security.trustScore.toFixed(1)}%
                          </Typography>
                          <Typography variant="body2">
                            GPS Accuracy: {vehicle.position.accuracy.toFixed(1)}m
                          </Typography>
                          {vehicle.position.altitude && (
                            <Typography variant="body2">
                              Altitude: {vehicle.position.altitude.toFixed(1)}m
                            </Typography>
                          )}
                          <Chip
                            label={vehicle.status}
                            color={getStatusColor(vehicle.status) as any}
                            size="small"
                            sx={{ mt: 1 }}
                          />
                        </Box>
                      </Popup>
                    </Marker>
                  );
                })}

                {/* Vehicle Clusters */}
                {clusters.map((cluster) => (
                  <Circle
                    key={cluster.id}
                    center={[cluster.center.lat, cluster.center.lng]}
                    radius={cluster.density * 100}
                    pathOptions={{
                      color: cluster.riskLevel === 'high' ? '#f44336' : 
                             cluster.riskLevel === 'medium' ? '#ff9800' : '#4caf50',
                      fillColor: cluster.riskLevel === 'high' ? '#f44336' : 
                                cluster.riskLevel === 'medium' ? '#ff9800' : '#4caf50',
                      fillOpacity: 0.2,
                    }}
                  >
                    <Popup>
                      <Typography variant="h6">Vehicle Cluster</Typography>
                      <Typography>Density: {cluster.density}</Typography>
                      <Typography>Risk Level: {cluster.riskLevel}</Typography>
                    </Popup>
                  </Circle>
                ))}
              </MapContainer>
            </CardContent>
          </Card>
        </Grid>

        {/* Vehicle List and Details */}
        <Grid item xs={12} lg={4}>
          <Grid container spacing={2}>
            {/* Filters */}
            <Grid item xs={12}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Filters
                  </Typography>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                    <Chip
                      label="Active"
                      color={filters.showActive ? 'primary' : 'default'}
                      onClick={() => setFilters(prev => ({ ...prev, showActive: !prev.showActive }))}
                      size="small"
                    />
                    <Chip
                      label="Warning"
                      color={filters.showWarning ? 'warning' : 'default'}
                      onClick={() => setFilters(prev => ({ ...prev, showWarning: !prev.showWarning }))}
                      size="small"
                    />
                    <Chip
                      label="Error"
                      color={filters.showError ? 'error' : 'default'}
                      onClick={() => setFilters(prev => ({ ...prev, showError: !prev.showError }))}
                      size="small"
                    />
                    <Chip
                      label="Emergency"
                      color={filters.showEmergency ? 'error' : 'default'}
                      onClick={() => setFilters(prev => ({ ...prev, showEmergency: !prev.showEmergency }))}
                      size="small"
                    />
                  </Box>
                </CardContent>
              </Card>
            </Grid>

            {/* Vehicle List */}
            <Grid item xs={12}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Active Vehicles ({filteredVehicles.length})
                  </Typography>
                  {filteredVehicles.length === 0 ? (
                    <Box sx={{ textAlign: 'center', py: 3 }}>
                      <LocationIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
                      <Typography variant="body2" color="text.secondary">
                        No active vehicles
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        Map focused on Dehradun, Uttarakhand, India
                      </Typography>
                    </Box>
                  ) : (
                    <List sx={{ maxHeight: 300, overflow: 'auto' }}>
                      {filteredVehicles.slice(0, 10).map((vehicle) => (
                        <ListItem
                          key={vehicle.id}
                          button
                          selected={selectedVehicle?.id === vehicle.id}
                          onClick={() => handleVehicleClick(vehicle)}
                          sx={{ mb: 1, borderRadius: 1 }}
                        >
                          <ListItemIcon>
                            <CarIcon color={getStatusColor(vehicle.status) as any} />
                          </ListItemIcon>
                          <ListItemText
                            primary={vehicle.name}
                            secondary={<VehicleSecondaryInfo vehicle={vehicle} />}
                          />
                          {vehicle.metadata.emergencyVehicle && (
                            <Chip label="EMERGENCY" color="error" size="small" />
                          )}
                        </ListItem>
                      ))}
                    </List>
                  )}
                </CardContent>
              </Card>
            </Grid>

            {/* Selected Vehicle Details */}
            {selectedVehicle && (
              <Grid item xs={12}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      Vehicle Details
                    </Typography>
                    <Box sx={{ mb: 2 }}>
                      <Typography variant="subtitle1" gutterBottom>
                        {selectedVehicle.name}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {selectedVehicle.metadata.make} {selectedVehicle.metadata.model} ({selectedVehicle.metadata.year})
                      </Typography>
                      <Typography variant="body2">
                        License: {selectedVehicle.metadata.licensePlate}
                      </Typography>
                    </Box>

                    <Divider sx={{ my: 2 }} />

                    <Grid container spacing={2}>
                      <Grid item xs={6}>
                        <Typography variant="caption" color="text.secondary">
                          Speed
                        </Typography>
                        <Typography variant="h6">
                          {selectedVehicle.velocity.speed.toFixed(1)} km/h
                        </Typography>
                      </Grid>
                      <Grid item xs={6}>
                        <Typography variant="caption" color="text.secondary">
                          Trust Score
                        </Typography>
                        <Typography variant="h6">
                          {selectedVehicle.security.trustScore.toFixed(1)}%
                        </Typography>
                      </Grid>
                      <Grid item xs={6}>
                        <Typography variant="caption" color="text.secondary">
                          GPS Accuracy
                        </Typography>
                        <Typography variant="h6">
                          {selectedVehicle.position.accuracy.toFixed(1)}m
                        </Typography>
                      </Grid>
                      <Grid item xs={6}>
                        <Typography variant="caption" color="text.secondary">
                          Network Latency
                        </Typography>
                        <Typography variant="h6">
                          {selectedVehicle.network.latency.toFixed(1)}ms
                        </Typography>
                      </Grid>
                    </Grid>

                    <Box sx={{ mt: 2 }}>
                      <Chip
                        icon={getStatusIcon(selectedVehicle.status)}
                        label={selectedVehicle.status}
                        color={getStatusColor(selectedVehicle.status) as any}
                        sx={{ mr: 1 }}
                      />
                      {selectedVehicle.metadata.emergencyVehicle && (
                        <Chip label="EMERGENCY" color="error" />
                      )}
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            )}
          </Grid>
        </Grid>
      </Grid>
    </Box>
  );
};

export default VehicleMapComponent;
