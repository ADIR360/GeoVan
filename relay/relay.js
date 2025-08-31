const mqtt = require('mqtt');
const WebSocket = require('ws');
const protobuf = require('protobufjs');

class GeoVANRelay {
    constructor() {
        this.mqttClient = null;
        this.wss = null;
        this.connectedClients = new Set();
        this.vehiclePositions = new Map(); // Store latest position per vehicle
        this.vehicleTrails = new Map();    // Store trail history per vehicle
        
        // Configuration
        this.config = {
            mqtt: {
                broker: process.env.MQTT_BROKER || 'mqtt://localhost:1883',
                topic: process.env.MQTT_TOPIC || 'geovan/positions',
                clientId: 'geovan-relay-' + Math.random().toString(16).substr(2, 8)
            },
            websocket: {
                port: process.env.WS_PORT || 8080
            },
            trails: {
                maxPoints: 50  // Keep last 50 positions per vehicle
            }
        };
    }

    async start() {
        console.log('Starting GeoVAN Relay...');
        console.log(`MQTT Broker: ${this.config.mqtt.broker}`);
        console.log(`MQTT Topic: ${this.config.mqtt.topic}`);
        console.log(`WebSocket Port: ${this.config.websocket.port}`);

        // Load protobuf schema
        try {
            this.protoRoot = await protobuf.load('proto/geovan.proto');
            this.VehiclePosition = this.protoRoot.lookupType('geovan.VehiclePosition');
            console.log('Protobuf schema loaded successfully');
        } catch (error) {
            console.error('Failed to load protobuf schema:', error.message);
            console.log('Falling back to raw message forwarding');
            this.protoRoot = null;
        }

        // Start MQTT client
        await this.startMQTT();
        
        // Start WebSocket server
        await this.startWebSocket();
        
        console.log('GeoVAN Relay started successfully');
    }

    async startMQTT() {
        return new Promise((resolve, reject) => {
            this.mqttClient = mqtt.connect(this.config.mqtt.broker, {
                clientId: this.config.mqtt.clientId,
                clean: true,
                reconnectPeriod: 1000,
                connectTimeout: 30000
            });

            this.mqttClient.on('connect', () => {
                console.log('Connected to MQTT broker');
                
                // Subscribe to vehicle positions topic
                this.mqttClient.subscribe(this.config.mqtt.topic, (err) => {
                    if (err) {
                        console.error('Failed to subscribe to MQTT topic:', err);
                        reject(err);
                    } else {
                        console.log(`Subscribed to MQTT topic: ${this.config.mqtt.topic}`);
                        resolve();
                    }
                });
            });

            this.mqttClient.on('message', (topic, message) => {
                this.handleMQTTMessage(topic, message);
            });

            this.mqttClient.on('error', (error) => {
                console.error('MQTT error:', error);
            });

            this.mqttClient.on('close', () => {
                console.log('MQTT connection closed');
            });
        });
    }

    async startWebSocket() {
        return new Promise((resolve) => {
            this.wss = new WebSocket.Server({ port: this.config.websocket.port });
            
            this.wss.on('connection', (ws, req) => {
                console.log(`New WebSocket connection from ${req.socket.remoteAddress}`);
                this.handleWebSocketConnection(ws);
            });

            this.wss.on('listening', () => {
                console.log(`WebSocket server listening on port ${this.config.websocket.port}`);
                resolve();
            });
        });
    }

    handleMQTTMessage(topic, message) {
        try {
            let vehicleData;
            
            if (this.protoRoot) {
                // Try to decode protobuf message
                try {
                    const decoded = this.VehiclePosition.decode(message);
                    vehicleData = {
                        id: decoded.id,
                        position: {
                            lat: decoded.pos.lat,
                            lon: decoded.pos.lon
                        },
                        speed: decoded.speed,
                        heading: decoded.heading,
                        timestamp: decoded.timestamp,
                        sequence: decoded.seq
                    };
                } catch (protoError) {
                    console.warn('Failed to decode protobuf message:', protoError.message);
                    return;
                }
            } else {
                // Fallback: try to parse as JSON
                try {
                    vehicleData = JSON.parse(message.toString());
                } catch (jsonError) {
                    console.warn('Failed to parse message as JSON:', jsonError.message);
                    return;
                }
            }

            // Update vehicle position
            this.updateVehiclePosition(vehicleData);
            
            // Broadcast to all connected WebSocket clients
            this.broadcastToClients({
                type: 'vehicle_update',
                data: vehicleData
            });

        } catch (error) {
            console.error('Error handling MQTT message:', error);
        }
    }

    updateVehiclePosition(vehicleData) {
        const vehicleId = vehicleData.id;
        
        // Update current position
        this.vehiclePositions.set(vehicleId, vehicleData);
        
        // Update trail
        if (!this.vehicleTrails.has(vehicleId)) {
            this.vehicleTrails.set(vehicleId, []);
        }
        
        const trail = this.vehicleTrails.get(vehicleId);
        trail.push({
            lat: vehicleData.position.lat,
            lon: vehicleData.position.lon,
            timestamp: vehicleData.timestamp
        });
        
        // Keep only the last N points
        if (trail.length > this.config.trails.maxPoints) {
            trail.splice(0, trail.length - this.config.trails.maxPoints);
        }
    }

    handleWebSocketConnection(ws) {
        this.connectedClients.add(ws);
        
        // Send current state to new client
        const currentState = {
            type: 'state_sync',
            data: {
                vehicles: Array.from(this.vehiclePositions.values()),
                trails: Object.fromEntries(this.vehicleTrails)
            }
        };
        ws.send(JSON.stringify(currentState));

        ws.on('message', (message) => {
            try {
                const data = JSON.parse(message);
                this.handleWebSocketMessage(ws, data);
            } catch (error) {
                console.error('Error parsing WebSocket message:', error);
            }
        });

        ws.on('close', () => {
            console.log('WebSocket client disconnected');
            this.connectedClients.delete(ws);
        });

        ws.on('error', (error) => {
            console.error('WebSocket error:', error);
            this.connectedClients.delete(ws);
        });
    }

    handleWebSocketMessage(ws, message) {
        switch (message.type) {
            case 'ping':
                ws.send(JSON.stringify({ type: 'pong', timestamp: Date.now() }));
                break;
                
            case 'get_vehicle_trail':
                const trail = this.vehicleTrails.get(message.vehicleId) || [];
                ws.send(JSON.stringify({
                    type: 'vehicle_trail',
                    vehicleId: message.vehicleId,
                    trail: trail
                }));
                break;
                
            default:
                console.log('Unknown WebSocket message type:', message.type);
        }
    }

    broadcastToClients(message) {
        const messageStr = JSON.stringify(message);
        this.connectedClients.forEach((client) => {
            if (client.readyState === WebSocket.OPEN) {
                try {
                    client.send(messageStr);
                } catch (error) {
                    console.error('Error sending to WebSocket client:', error);
                }
            }
        });
    }

    stop() {
        console.log('Stopping GeoVAN Relay...');
        
        if (this.mqttClient) {
            this.mqttClient.end();
        }
        
        if (this.wss) {
            this.wss.close();
        }
        
        console.log('GeoVAN Relay stopped');
    }
}

// Handle graceful shutdown
process.on('SIGINT', () => {
    console.log('\nReceived SIGINT, shutting down gracefully...');
    if (global.relay) {
        global.relay.stop();
    }
    process.exit(0);
});

process.on('SIGTERM', () => {
    console.log('\nReceived SIGTERM, shutting down gracefully...');
    if (global.relay) {
        global.relay.stop();
    }
    process.exit(0);
});

// Start the relay
if (require.main === module) {
    const relay = new GeoVANRelay();
    global.relay = relay;
    
    relay.start().catch((error) => {
        console.error('Failed to start relay:', error);
        process.exit(1);
    });
}

module.exports = GeoVANRelay;
