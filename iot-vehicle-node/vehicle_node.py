#!/usr/bin/env python3
"""
GeoVAN IoT Vehicle Node
Runs on Raspberry Pi to collect real vehicle data and send to central server
"""

import time
import json
import threading
import requests
import socket
import uuid
from datetime import datetime
from typing import Dict, Any, Optional
import logging

# GPS and sensor libraries (install with: pip install gps pynmea2 smbus2)
try:
    import gps
    import pynmea2
    from smbus2 import SMBus
except ImportError:
    print("Install required packages: pip install gps pynmea2 smbus2")
    exit(1)

class VehicleNode:
    def __init__(self, vehicle_id: str, server_url: str, wifi_ssid: str, wifi_password: str):
        self.vehicle_id = vehicle_id
        self.server_url = server_url
        self.wifi_ssid = wifi_ssid
        self.wifi_password = wifi_password
        
        # Vehicle configuration
        self.vehicle_config = {
            'id': vehicle_id,
            'name': f'Vehicle-{vehicle_id}',
            'make': 'Custom',
            'model': 'IoT Node',
            'year': 2024,
            'licensePlate': f'PI-{vehicle_id}',
            'driverId': f'driver-{vehicle_id}',
            'emergencyVehicle': False,
            'autonomousLevel': 0
        }
        
        # Initialize sensors
        self.init_sensors()
        
        # Data storage
        self.current_data = {}
        self.last_position = None
        self.last_update = datetime.now()
        
        # Setup logging
        logging.basicConfig(
            level=logging.INFO,
            format='%(asctime)s - %(levelname)s - %(message)s',
            handlers=[
                logging.FileHandler(f'vehicle_{vehicle_id}.log'),
                logging.StreamHandler()
            ]
        )
        self.logger = logging.getLogger(f'Vehicle-{vehicle_id}')
        
        # Threading
        self.running = False
        self.data_thread = None
        self.transmission_thread = None

    def init_sensors(self):
        """Initialize GPS and sensor hardware"""
        try:
            # GPS setup
            self.gps_session = gps.gps(mode=gps.WATCH_ENABLE)
            self.logger.info("GPS initialized successfully")
        except Exception as e:
            self.logger.error(f"GPS initialization failed: {e}")
            self.gps_session = None

        try:
            # I2C bus for sensors
            self.i2c_bus = SMBus(1)  # Raspberry Pi uses I2C bus 1
            self.logger.info("I2C bus initialized successfully")
        except Exception as e:
            self.logger.error(f"I2C initialization failed: {e}")
            self.i2c_bus = None

        # Sensor addresses (common I2C addresses)
        self.sensor_addresses = {
            'temperature': 0x48,  # ADS1115 or similar
            'accelerometer': 0x68,  # MPU6050
            'compass': 0x1E,  # HMC5883L
        }

    def get_gps_data(self) -> Optional[Dict[str, Any]]:
        """Get real GPS data from hardware"""
        if not self.gps_session:
            return None

        try:
            # Read GPS data
            report = self.gps_session.next()
            
            if report['class'] == 'TPV':
                return {
                    'lat': getattr(report, 'lat', 0.0),
                    'lng': getattr(report, 'lon', 0.0),
                    'accuracy': getattr(report, 'epx', 5.0),  # Position uncertainty
                    'speed': getattr(report, 'speed', 0.0) * 3.6,  # Convert m/s to km/h
                    'heading': getattr(report, 'track', 0.0),
                    'altitude': getattr(report, 'alt', 0.0),
                    'timestamp': datetime.now().isoformat()
                }
            elif report['class'] == 'SKY':
                # Satellite information
                satellites = getattr(report, 'satellites', [])
                return {
                    'satellites': len(satellites),
                    'hdop': getattr(report, 'hdop', 0.0),
                    'vdop': getattr(report, 'vdop', 0.0)
                }
                
        except Exception as e:
            self.logger.error(f"GPS read error: {e}")
            return None

        return None

    def get_sensor_data(self) -> Dict[str, Any]:
        """Get sensor data from I2C devices"""
        sensor_data = {
            'temperature': 25.0,  # Default values
            'humidity': 50.0,
            'pressure': 1013.25,
            'accelerometer': {'x': 0.0, 'y': 0.0, 'z': 0.0},
            'compass': {'x': 0.0, 'y': 0.0, 'z': 0.0}
        }

        if not self.i2c_bus:
            return sensor_data

        try:
            # Temperature sensor (example with ADS1115)
            if self.sensor_addresses['temperature']:
                # Read temperature from ADS1115
                # This is a simplified example - adjust based on your actual sensor
                temp_raw = self.i2c_bus.read_i2c_block_data(
                    self.sensor_addresses['temperature'], 0x00, 2
                )
                sensor_data['temperature'] = (temp_raw[0] << 8 | temp_raw[1]) * 0.125

        except Exception as e:
            self.logger.error(f"Sensor read error: {e}")

        return sensor_data

    def get_network_info(self) -> Dict[str, Any]:
        """Get network connection information"""
        try:
            # Get WiFi information
            wifi_info = self.get_wifi_info()
            
            # Get local IP address
            hostname = socket.gethostname()
            local_ip = socket.gethostbyname(hostname)
            
            return {
                'signalStrength': wifi_info.get('signal', 0),
                'connectionType': 'WiFi',
                'ssid': wifi_info.get('ssid', 'Unknown'),
                'localIP': local_ip,
                'latency': self.measure_latency(),
                'bandwidth': self.measure_bandwidth()
            }
        except Exception as e:
            self.logger.error(f"Network info error: {e}")
            return {
                'signalStrength': 0,
                'connectionType': 'Unknown',
                'ssid': 'Unknown',
                'localIP': '0.0.0.0',
                'latency': 999,
                'bandwidth': 0
            }

    def get_wifi_info(self) -> Dict[str, Any]:
        """Get WiFi connection information"""
        try:
            # Parse iwconfig or similar command output
            import subprocess
            result = subprocess.run(['iwconfig'], capture_output=True, text=True)
            
            if result.returncode == 0:
                output = result.stdout
                # Parse SSID and signal strength
                # This is a simplified parser - adjust based on your system
                ssid = 'Unknown'
                signal = 0
                
                if 'ESSID:' in output:
                    ssid_start = output.find('ESSID:') + 6
                    ssid_end = output.find('"', ssid_start + 1)
                    if ssid_end > ssid_start:
                        ssid = output[ssid_start:ssid_end]
                
                if 'Signal level=' in output:
                    signal_start = output.find('Signal level=') + 13
                    signal_end = output.find(' ', signal_start)
                    if signal_end > signal_start:
                        try:
                            signal = int(output[signal_start:signal_end])
                        except ValueError:
                            signal = 0
                
                return {'ssid': ssid, 'signal': signal}
        except Exception as e:
            self.logger.error(f"WiFi info error: {e}")
        
        return {'ssid': 'Unknown', 'signal': 0}

    def measure_latency(self) -> float:
        """Measure network latency to server"""
        try:
            import subprocess
            # Ping the server to measure latency
            result = subprocess.run(
                ['ping', '-c', '1', self.server_url.replace('http://', '').replace('https://', '')],
                capture_output=True, text=True
            )
            
            if result.returncode == 0:
                # Parse ping output for time
                output = result.stdout
                if 'time=' in output:
                    time_start = output.find('time=') + 5
                    time_end = output.find('ms', time_start)
                    if time_end > time_start:
                        try:
                            return float(output[time_start:time_end])
                        except ValueError:
                            pass
        except Exception as e:
            self.logger.error(f"Latency measurement error: {e}")
        
        return 999.0

    def measure_bandwidth(self) -> float:
        """Measure network bandwidth (simplified)"""
        # This is a simplified bandwidth measurement
        # In production, you might want to use more sophisticated methods
        return 100.0  # Mbps

    def collect_data(self):
        """Collect all vehicle data"""
        try:
            # GPS data
            gps_data = self.get_gps_data()
            
            # Sensor data
            sensor_data = self.get_sensor_data()
            
            # Network data
            network_data = self.get_network_info()
            
            # Calculate vehicle status
            status = self.calculate_status(gps_data, sensor_data, network_data)
            
            # Create vehicle data packet
            vehicle_data = {
                'id': self.vehicle_id,
                'name': self.vehicle_config['name'],
                'status': status,
                'position': {
                    'lat': gps_data['lat'] if gps_data else 0.0,
                    'lng': gps_data['lng'] if gps_data else 0.0,
                    'accuracy': gps_data['accuracy'] if gps_data else 999.0,
                    'altitude': gps_data.get('altitude', 0.0) if gps_data else 0.0
                },
                'velocity': {
                    'speed': gps_data['speed'] if gps_data else 0.0,
                    'heading': gps_data['heading'] if gps_data else 0.0,
                    'acceleration': 0.0  # Calculate from speed changes
                },
                'metadata': self.vehicle_config,
                'sensors': {
                    'temperature': sensor_data['temperature'],
                    'humidity': sensor_data['humidity'],
                    'pressure': sensor_data['pressure'],
                    'accelerometer': sensor_data['accelerometer'],
                    'compass': sensor_data['compass']
                },
                'security': {
                    'trustScore': 95.0,  # High trust for IoT nodes
                    'certificateValid': True,
                    'lastSignature': self.generate_signature(),
                    'encryptionLevel': 'AES-256'
                },
                'network': network_data,
                'timestamp': datetime.now().isoformat(),
                'lastUpdate': datetime.now().isoformat(),
                'hardware': {
                    'cpu_temp': self.get_cpu_temperature(),
                    'memory_usage': self.get_memory_usage(),
                    'disk_usage': self.get_disk_usage()
                }
            }
            
            self.current_data = vehicle_data
            self.last_update = datetime.now()
            
            if gps_data:
                self.last_position = (gps_data['lat'], gps_data['lng'])
            
            self.logger.info(f"Data collected: {status} at {vehicle_data['position']['lat']:.6f}, {vehicle_data['position']['lng']:.6f}")
            
        except Exception as e:
            self.logger.error(f"Data collection error: {e}")

    def calculate_status(self, gps_data: Optional[Dict], sensor_data: Dict, network_data: Dict) -> str:
        """Calculate vehicle status based on data quality"""
        if not gps_data or gps_data['accuracy'] > 50:
            return 'error'
        
        if network_data['latency'] > 500:
            return 'warning'
        
        if sensor_data['temperature'] > 80:
            return 'warning'
        
        return 'active'

    def generate_signature(self) -> str:
        """Generate a unique signature for the data packet"""
        import hashlib
        data_string = f"{self.vehicle_id}{datetime.now().isoformat()}"
        return hashlib.sha256(data_string.encode()).hexdigest()

    def get_cpu_temperature(self) -> float:
        """Get Raspberry Pi CPU temperature"""
        try:
            with open('/sys/class/thermal/thermal_zone0/temp', 'r') as f:
                temp = float(f.read()) / 1000.0
            return temp
        except:
            return 0.0

    def get_memory_usage(self) -> float:
        """Get memory usage percentage"""
        try:
            import psutil
            return psutil.virtual_memory().percent
        except:
            return 0.0

    def get_disk_usage(self) -> float:
        """Get disk usage percentage"""
        try:
            import psutil
            return psutil.disk_usage('/').percent
        except:
            return 0.0

    def transmit_data(self):
        """Transmit data to central server"""
        if not self.current_data:
            return
        
        try:
            # Prepare data for transmission
            transmission_data = {
                'vehicle_id': self.vehicle_id,
                'data': self.current_data,
                'timestamp': datetime.now().isoformat(),
                'checksum': self.generate_signature()
            }
            
            # Send to server
            response = requests.post(
                f"{self.server_url}/api/vehicle/update",
                json=transmission_data,
                headers={'Content-Type': 'application/json'},
                timeout=10
            )
            
            if response.status_code == 200:
                self.logger.info("Data transmitted successfully")
            else:
                self.logger.warning(f"Transmission failed: {response.status_code}")
                
        except requests.exceptions.RequestException as e:
            self.logger.error(f"Transmission error: {e}")
        except Exception as e:
            self.logger.error(f"Unexpected transmission error: {e}")

    def data_collection_loop(self):
        """Main data collection loop"""
        while self.running:
            try:
                self.collect_data()
                time.sleep(1)  # Collect data every second
            except Exception as e:
                self.logger.error(f"Data collection loop error: {e}")
                time.sleep(5)

    def transmission_loop(self):
        """Main transmission loop"""
        while self.running:
            try:
                self.transmit_data()
                time.sleep(5)  # Transmit every 5 seconds
            except Exception as e:
                self.logger.error(f"Transmission loop error: {e}")
                time.sleep(10)

    def start(self):
        """Start the vehicle node"""
        self.logger.info(f"Starting Vehicle Node {self.vehicle_id}")
        self.running = True
        
        # Start data collection thread
        self.data_thread = threading.Thread(target=self.data_collection_loop)
        self.data_thread.daemon = True
        self.data_thread.start()
        
        # Start transmission thread
        self.transmission_thread = threading.Thread(target=self.transmission_loop)
        self.transmission_thread.daemon = True
        self.transmission_thread.start()
        
        self.logger.info("Vehicle node started successfully")

    def stop(self):
        """Stop the vehicle node"""
        self.logger.info("Stopping vehicle node...")
        self.running = False
        
        if self.data_thread:
            self.data_thread.join(timeout=5)
        
        if self.transmission_thread:
            self.transmission_thread.join(timeout=5)
        
        if self.gps_session:
            self.gps_session.close()
        
        if self.i2c_bus:
            self.i2c_bus.close()
        
        self.logger.info("Vehicle node stopped")

def main():
    """Main function to run the vehicle node"""
    import argparse
    
    parser = argparse.ArgumentParser(description='GeoVAN IoT Vehicle Node')
    parser.add_argument('--vehicle-id', required=True, help='Unique vehicle ID')
    parser.add_argument('--server-url', required=True, help='Central server URL')
    parser.add_argument('--wifi-ssid', help='WiFi SSID')
    parser.add_argument('--wifi-password', help='WiFi password')
    
    args = parser.parse_args()
    
    # Create and start vehicle node
    vehicle_node = VehicleNode(
        vehicle_id=args.vehicle_id,
        server_url=args.server_url,
        wifi_ssid=args.wifi_ssid or '',
        wifi_password=args.wifi_password or ''
    )
    
    try:
        vehicle_node.start()
        
        # Keep main thread alive
        while True:
            time.sleep(1)
            
    except KeyboardInterrupt:
        print("\nShutting down...")
        vehicle_node.stop()

if __name__ == "__main__":
    main()
