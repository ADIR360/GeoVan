class GeoVANApp {
    constructor() {
        this.map = null;
        this.vehicles = new Map();
        this.vehicleMarkers = new Map();
        this.vehicleTrails = new Map();
        this.trailLines = new Map();
        this.selectedVehicle = null;
        this.ws = null;
        this.isConnected = false;
        this.messageCount = 0;
        this.lastMessageTime = Date.now();
        this.messageRate = 0;
        
        // Configuration
        this.config = {
            websocket: {
                url: `ws://${window.location.hostname}:8080`,
                reconnectInterval: 5000,
                maxReconnectAttempts: 10
            },
            map: {
                center: [28.7041, 77.1025], // Delhi
                zoom: 13,
                maxZoom: 18
            },
            trails: {
                maxLength: 20,
                fadeOut: true
            }
        };
        
        this.init();
    }
    
    init() {
        this.initMap();
        this.initWebSocket();
        this.initEventListeners();
        this.startMessageRateCounter();
    }
    
    initMap() {
        // Initialize Leaflet map
        this.map = L.map('map').setView(this.config.map.center, this.config.map.zoom);
        
        // Add OpenStreetMap tiles
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '© OpenStreetMap contributors',
            maxZoom: this.config.map.maxZoom
        }).addTo(this.map);
        
        // Add scale control
        L.control.scale().addTo(this.map);
        
        console.log('Map initialized');
    }
    
    initWebSocket() {
        this.connectWebSocket();
    }
    
    connectWebSocket() {
        try {
            this.updateConnectionStatus('connecting');
            this.ws = new WebSocket(this.config.websocket.url);
            
            this.ws.onopen = () => {
                console.log('WebSocket connected');
                this.isConnected = true;
                this.updateConnectionStatus('online');
                this.updateWSStatus('Connected');
            };
            
            this.ws.onmessage = (event) => {
                this.handleWebSocketMessage(event);
            };
            
            this.ws.onclose = () => {
                console.log('WebSocket disconnected');
                this.isConnected = false;
                this.updateConnectionStatus('offline');
                this.updateWSStatus('Disconnected');
                
                // Attempt to reconnect
                setTimeout(() => {
                    if (!this.isConnected) {
                        this.connectWebSocket();
                    }
                }, this.config.websocket.reconnectInterval);
            };
            
            this.ws.onerror = (error) => {
                console.error('WebSocket error:', error);
                this.updateConnectionStatus('offline');
                this.updateWSStatus('Error');
            };
            
        } catch (error) {
            console.error('Failed to create WebSocket connection:', error);
            this.updateConnectionStatus('offline');
            this.updateWSStatus('Failed');
        }
    }
    
    handleWebSocketMessage(event) {
        try {
            const message = JSON.parse(event.data);
            this.messageCount++;
            this.lastMessageTime = Date.now();
            
            switch (message.type) {
                case 'state_sync':
                    this.handleStateSync(message.data);
                    break;
                    
                case 'vehicle_update':
                    this.handleVehicleUpdate(message.data);
                    break;
                    
                case 'vehicle_trail':
                    this.handleVehicleTrail(message.data);
                    break;
                    
                case 'pong':
                    // Handle ping/pong for connection health
                    break;
                    
                default:
                    console.log('Unknown message type:', message.type);
            }
            
        } catch (error) {
            console.error('Error parsing WebSocket message:', error);
        }
    }
    
    handleStateSync(data) {
        console.log('Received state sync:', data);
        
        // Clear existing vehicles
        this.clearAllVehicles();
        
        // Add vehicles from sync
        if (data.vehicles) {
            data.vehicles.forEach(vehicle => {
                this.addVehicle(vehicle);
            });
        }
        
        // Add trails from sync
        if (data.trails) {
            Object.entries(data.trails).forEach(([vehicleId, trail]) => {
                this.updateVehicleTrail(vehicleId, trail);
            });
        }
        
        this.updateVehicleCount();
    }
    
    handleVehicleUpdate(data) {
        this.addVehicle(data);
        this.updateVehicleCount();
        this.updateLastUpdate();
    }
    
    handleVehicleTrail(data) {
        this.updateVehicleTrail(data.vehicleId, data.trail);
    }
    
    addVehicle(vehicleData) {
        const vehicleId = vehicleData.id;
        
        // Store vehicle data
        this.vehicles.set(vehicleId, vehicleData);
        
        // Create or update marker
        if (this.vehicleMarkers.has(vehicleId)) {
            this.updateVehicleMarker(vehicleId, vehicleData);
        } else {
            this.createVehicleMarker(vehicleId, vehicleData);
        }
        
        // Update vehicle list in sidebar
        this.updateVehicleList();
    }
    
    createVehicleMarker(vehicleId, vehicleData) {
        // Create custom vehicle icon
        const vehicleIcon = L.divIcon({
            className: 'vehicle-marker',
            html: `<div style="background: #667eea; width: 20px; height: 20px; border-radius: 50%; border: 2px solid white; box-shadow: 0 2px 8px rgba(0,0,0,0.3);"></div>`,
            iconSize: [20, 20],
            iconAnchor: [10, 10]
        });
        
        // Create marker
        const marker = L.marker([vehicleData.position.lat, vehicleData.position.lon], {
            icon: vehicleIcon,
            rotationAngle: vehicleData.heading || 0
        }).addTo(this.map);
        
        // Add click event
        marker.on('click', () => {
            this.selectVehicle(vehicleId);
        });
        
        // Store marker
        this.vehicleMarkers.set(vehicleId, marker);
        
        // Initialize trail
        this.vehicleTrails.set(vehicleId, []);
        this.trailLines.set(vehicleId, null);
        
        console.log(`Created marker for vehicle: ${vehicleId}`);
    }
    
    updateVehicleMarker(vehicleId, vehicleData) {
        const marker = this.vehicleMarkers.get(vehicleId);
        if (marker) {
            const newPos = [vehicleData.position.lat, vehicleData.position.lon];
            marker.setLatLng(newPos);
            
            // Update rotation if heading changed
            if (vehicleData.heading !== undefined) {
                marker.setRotationAngle(vehicleData.heading);
            }
            
            // Update trail
            this.updateVehicleTrail(vehicleId, vehicleData);
        }
    }
    
    updateVehicleTrail(vehicleId, vehicleData) {
        if (!this.vehicleTrails.has(vehicleId)) {
            this.vehicleTrails.set(vehicleId, []);
        }
        
        const trail = this.vehicleTrails.get(vehicleId);
        const newPoint = {
            lat: vehicleData.position.lat,
            lon: vehicleData.position.lon,
            timestamp: vehicleData.timestamp
        };
        
        trail.push(newPoint);
        
        // Limit trail length
        const maxLength = parseInt(document.getElementById('trail-length').value);
        if (trail.length > maxLength) {
            trail.splice(0, trail.length - maxLength);
        }
        
        // Update trail line on map
        this.updateTrailLine(vehicleId, trail);
    }
    
    updateTrailLine(vehicleId, trail) {
        if (trail.length < 2) return;
        
        // Remove existing trail line
        if (this.trailLines.has(vehicleId) && this.trailLines.get(vehicleId)) {
            this.map.removeLayer(this.trailLines.get(vehicleId));
        }
        
        // Create new trail line
        const coordinates = trail.map(point => [point.lat, point.lon]);
        const trailLine = L.polyline(coordinates, {
            color: '#667eea',
            weight: 3,
            opacity: 0.6,
            className: 'trail-line'
        }).addTo(this.map);
        
        this.trailLines.set(vehicleId, trailLine);
    }
    
    selectVehicle(vehicleId) {
        // Deselect previous vehicle
        if (this.selectedVehicle && this.vehicleMarkers.has(this.selectedVehicle)) {
            const prevMarker = this.vehicleMarkers.get(this.selectedVehicle);
            prevMarker.getElement().classList.remove('selected');
        }
        
        // Select new vehicle
        this.selectedVehicle = vehicleId;
        if (this.vehicleMarkers.has(vehicleId)) {
            const marker = this.vehicleMarkers.get(vehicleId);
            marker.getElement().classList.add('selected');
            
            // Center map on vehicle
            this.map.setView(marker.getLatLng(), this.map.getZoom());
            
            // Show vehicle details
            this.showVehicleDetails(vehicleId);
        }
        
        // Update vehicle list selection
        this.updateVehicleListSelection();
    }
    
    showVehicleDetails(vehicleId) {
        const vehicle = this.vehicles.get(vehicleId);
        if (!vehicle) return;
        
        const modal = document.getElementById('vehicle-modal');
        const modalTitle = document.getElementById('modal-title');
        const modalContent = document.getElementById('modal-content');
        
        modalTitle.textContent = `Vehicle: ${vehicleId}`;
        
        modalContent.innerHTML = `
            <div class="vehicle-detail">
                <div class="vehicle-detail-label">ID:</div>
                <div class="vehicle-detail-value">${vehicle.id}</div>
            </div>
            <div class="vehicle-detail">
                <div class="vehicle-detail-label">Position:</div>
                <div class="vehicle-detail-value">${vehicle.position.lat.toFixed(6)}, ${vehicle.position.lon.toFixed(6)}</div>
            </div>
            <div class="vehicle-detail">
                <div class="vehicle-detail-label">Speed:</div>
                <div class="vehicle-detail-value">${vehicle.speed.toFixed(1)} m/s (${(vehicle.speed * 3.6).toFixed(1)} km/h)</div>
            </div>
            <div class="vehicle-detail">
                <div class="vehicle-detail-label">Heading:</div>
                <div class="vehicle-detail-value">${vehicle.heading.toFixed(1)}°</div>
            </div>
            <div class="vehicle-detail">
                <div class="vehicle-detail-label">Timestamp:</div>
                <div class="vehicle-detail-value">${new Date(vehicle.timestamp).toLocaleString()}</div>
            </div>
            <div class="vehicle-detail">
                <div class="vehicle-detail-label">Sequence:</div>
                <div class="vehicle-detail-value">${vehicle.sequence}</div>
            </div>
        `;
        
        modal.style.display = 'block';
    }
    
    clearAllVehicles() {
        // Remove all markers
        this.vehicleMarkers.forEach(marker => {
            this.map.removeLayer(marker);
        });
        
        // Remove all trail lines
        this.trailLines.forEach(line => {
            if (line) {
                this.map.removeLayer(line);
            }
        });
        
        // Clear data structures
        this.vehicles.clear();
        this.vehicleMarkers.clear();
        this.vehicleTrails.clear();
        this.trailLines.clear();
        this.selectedVehicle = null;
        
        // Update UI
        this.updateVehicleList();
        this.updateVehicleCount();
    }
    
    updateVehicleList() {
        const vehicleList = document.getElementById('vehicle-list');
        
        if (this.vehicles.size === 0) {
            vehicleList.innerHTML = '<div class="no-vehicles">No vehicles connected</div>';
            return;
        }
        
        vehicleList.innerHTML = '';
        
        this.vehicles.forEach((vehicle, vehicleId) => {
            const vehicleItem = document.createElement('div');
            vehicleItem.className = 'vehicle-item';
            vehicleItem.dataset.vehicleId = vehicleId;
            
            vehicleItem.innerHTML = `
                <div class="vehicle-item-header">
                    <div class="vehicle-id">${vehicle.id}</div>
                    <div class="vehicle-speed">${vehicle.speed.toFixed(1)} m/s</div>
                </div>
                <div class="vehicle-position">
                    ${vehicle.position.lat.toFixed(4)}, ${vehicle.position.lon.toFixed(4)}
                </div>
            `;
            
            vehicleItem.addEventListener('click', () => {
                this.selectVehicle(vehicleId);
            });
            
            vehicleList.appendChild(vehicleItem);
        });
    }
    
    updateVehicleListSelection() {
        // Remove active class from all items
        document.querySelectorAll('.vehicle-item').forEach(item => {
            item.classList.remove('active');
        });
        
        // Add active class to selected vehicle
        if (this.selectedVehicle) {
            const selectedItem = document.querySelector(`[data-vehicle-id="${this.selectedVehicle}"]`);
            if (selectedItem) {
                selectedItem.classList.add('active');
            }
        }
    }
    
    updateVehicleCount() {
        const countElement = document.getElementById('vehicle-count');
        countElement.textContent = `${this.vehicles.size} vehicle${this.vehicles.size !== 1 ? 's' : ''}`;
    }
    
    updateConnectionStatus(status) {
        const statusElement = document.getElementById('connection-status');
        statusElement.className = `status-indicator ${status}`;
        statusElement.textContent = status.charAt(0).toUpperCase() + status.slice(1);
    }
    
    updateWSStatus(status) {
        document.getElementById('ws-status').textContent = status;
    }
    
    updateLastUpdate() {
        document.getElementById('last-update').textContent = new Date().toLocaleTimeString();
    }
    
    startMessageRateCounter() {
        setInterval(() => {
            const now = Date.now();
            const timeDiff = (now - this.lastMessageTime) / 1000;
            
            if (timeDiff > 0) {
                this.messageRate = this.messageCount / timeDiff;
                document.getElementById('msg-rate').textContent = this.messageRate.toFixed(1);
            }
            
            this.messageCount = 0;
            this.lastMessageTime = now;
        }, 1000);
    }
    
    initEventListeners() {
        // Trail length slider
        const trailLengthSlider = document.getElementById('trail-length');
        const trailLengthValue = document.getElementById('trail-length-value');
        
        trailLengthSlider.addEventListener('input', (e) => {
            const value = e.target.value;
            trailLengthValue.textContent = value;
            this.config.trails.maxLength = parseInt(value);
            
            // Update existing trails
            this.vehicleTrails.forEach((trail, vehicleId) => {
                if (trail.length > value) {
                    trail.splice(0, trail.length - value);
                    this.updateTrailLine(vehicleId, trail);
                }
            });
        });
        
        // Clear trails button
        document.getElementById('clear-trails').addEventListener('click', () => {
            this.clearAllTrails();
        });
        
        // Modal close button
        const modal = document.getElementById('vehicle-modal');
        const closeBtn = modal.querySelector('.close');
        
        closeBtn.addEventListener('click', () => {
            modal.style.display = 'none';
        });
        
        // Close modal when clicking outside
        window.addEventListener('click', (event) => {
            if (event.target === modal) {
                modal.style.display = 'none';
            }
        });
        
        // Update interval selector
        document.getElementById('update-interval').addEventListener('change', (e) => {
            const interval = parseInt(e.target.value);
            console.log(`Update interval changed to ${interval}ms`);
            // This could be used to control update frequency if needed
        });
    }
    
    clearAllTrails() {
        this.vehicleTrails.forEach((trail, vehicleId) => {
            trail.length = 0;
            if (this.trailLines.has(vehicleId) && this.trailLines.get(vehicleId)) {
                this.map.removeLayer(this.trailLines.get(vehicleId));
                this.trailLines.set(vehicleId, null);
            }
        });
    }
}

// Initialize app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    console.log('Initializing GeoVAN application...');
    window.geovanApp = new GeoVANApp();
});
