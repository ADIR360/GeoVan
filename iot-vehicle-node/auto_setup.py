#!/usr/bin/env python3
"""
GeoVAN Auto-Setup for Raspberry Pi
Automatically configures everything and starts the vehicle node
"""

import os
import sys
import subprocess
import json
import time
import requests
from pathlib import Path

class AutoSetup:
    def __init__(self):
        self.vehicle_id = self.get_vehicle_id()
        self.server_url = "https://your-vercel-app.vercel.app"  # Update this
        self.setup_dir = Path.home() / "geovan-vehicle-node"
        
    def get_vehicle_id(self):
        """Generate unique vehicle ID from hostname"""
        hostname = os.uname().nodename
        if 'pi' in hostname.lower():
            return f"PI-{hostname.split('-')[-1] if '-' in hostname else '001'}"
        return f"PI-{int(time.time()) % 1000:03d}"
    
    def run_command(self, command, check=True):
        """Run shell command"""
        try:
            result = subprocess.run(command, shell=True, check=check, 
                                 capture_output=True, text=True)
            return result.returncode == 0, result.stdout, result.stderr
        except subprocess.CalledProcessError as e:
            return False, e.stdout, e.stderr
    
    def update_system(self):
        """Update Raspberry Pi system"""
        print("🔄 Updating system packages...")
        success, _, _ = self.run_command("sudo apt update && sudo apt upgrade -y")
        if success:
            print("✅ System updated successfully")
        else:
            print("⚠️ System update failed, continuing...")
    
    def install_dependencies(self):
        """Install required packages"""
        print("📦 Installing dependencies...")
        packages = [
            "python3", "python3-pip", "gpsd", "gpsd-clients", 
            "i2c-tools", "python3-smbus", "python3-dev",
            "build-essential", "libssl-dev", "libffi-dev",
            "python3-setuptools", "python3-wheel", "git",
            "curl", "wget", "vim", "htop", "ntp", "ntpdate",
            "hostapd", "dnsmasq", "ufw"
        ]
        
        for package in packages:
            print(f"Installing {package}...")
            success, _, _ = self.run_command(f"sudo apt install -y {package}")
            if not success:
                print(f"⚠️ Failed to install {package}")
    
    def enable_interfaces(self):
        """Enable required hardware interfaces"""
        print("🔌 Enabling hardware interfaces...")
        
        # Enable I2C
        self.run_command("sudo raspi-config nonint do_i2c 0")
        
        # Enable SPI
        self.run_command("sudo raspi-config nonint do_spi 0")
        
        # Enable Serial
        self.run_command("sudo raspi-config nonint do_serial 0")
        
        print("✅ Hardware interfaces enabled")
    
    def setup_gps(self):
        """Configure GPS daemon"""
        print("📍 Setting up GPS...")
        
        # Configure GPS daemon
        self.run_command("sudo systemctl enable gpsd")
        self.run_command("sudo systemctl start gpsd")
        
        # Test GPS
        print("Testing GPS connection...")
        success, _, _ = self.run_command("gpspipe -w -n 5", check=False)
        if success:
            print("✅ GPS working correctly")
        else:
            print("⚠️ GPS not responding, check connections")
    
    def create_vehicle_node(self):
        """Create vehicle node directory and files"""
        print("📁 Creating vehicle node...")
        
        # Create directory
        self.setup_dir.mkdir(exist_ok=True)
        os.chdir(self.setup_dir)
        
        # Create virtual environment
        print("Creating Python virtual environment...")
        self.run_command("python3 -m venv venv")
        
        # Activate and install packages
        pip_cmd = str(self.setup_dir / "venv" / "bin" / "pip")
        packages = [
            "requests", "pynmea2", "smbus2", "psutil", "flask",
            "flask-cors", "paho-mqtt", "cryptography", "pyjwt"
        ]
        
        for package in packages:
            self.run_command(f"{pip_cmd} install {package}")
        
        print("✅ Vehicle node created")
    
    def create_config(self):
        """Create configuration file"""
        print("⚙️ Creating configuration...")
        
        config = {
            "vehicle_id": self.vehicle_id,
            "server_url": self.server_url,
            "gps_device": "/dev/ttyAMA0",
            "gps_baudrate": 9600,
            "sensor_update_interval": 1,
            "transmission_interval": 5,
            "log_level": "INFO",
            "emergency_contact": "",
            "vehicle_info": {
                "make": "Custom",
                "model": "IoT Node",
                "year": 2024,
                "license_plate": f"PI-{self.vehicle_id}",
                "driver_id": f"driver-{self.vehicle_id}"
            }
        }
        
        with open(self.setup_dir / "config.json", "w") as f:
            json.dump(config, f, indent=2)
        
        print("✅ Configuration created")
    
    def create_service(self):
        """Create systemd service"""
        print("🔧 Creating systemd service...")
        
        service_content = f"""[Unit]
Description=GeoVAN IoT Vehicle Node
After=network.target gpsd.service
Wants=gpsd.service

[Service]
Type=simple
User=pi
WorkingDirectory={self.setup_dir}
Environment=PATH={self.setup_dir}/venv/bin
ExecStart={self.setup_dir}/venv/bin/python vehicle_node.py
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
"""
        
        with open("/tmp/geovan-vehicle.service", "w") as f:
            f.write(service_content)
        
        self.run_command("sudo mv /tmp/geovan-vehicle.service /etc/systemd/system/")
        self.run_command("sudo systemctl daemon-reload")
        
        print("✅ Systemd service created")
    
    def setup_firewall(self):
        """Configure firewall"""
        print("🔥 Setting up firewall...")
        
        self.run_command("sudo ufw --force enable")
        self.run_command("sudo ufw allow ssh")
        self.run_command("sudo ufw allow 80")
        self.run_command("sudo ufw allow 443")
        
        print("✅ Firewall configured")
    
    def test_connection(self):
        """Test connection to server"""
        print("🌐 Testing server connection...")
        
        try:
            response = requests.get(f"{self.server_url}/api/health", timeout=10)
            if response.status_code == 200:
                print("✅ Server connection successful")
                return True
            else:
                print(f"⚠️ Server returned status {response.status_code}")
                return False
        except Exception as e:
            print(f"❌ Server connection failed: {e}")
            return False
    
    def start_service(self):
        """Start the vehicle node service"""
        print("🚀 Starting vehicle node service...")
        
        self.run_command("sudo systemctl start geovan-vehicle")
        self.run_command("sudo systemctl enable geovan-vehicle")
        
        # Wait a moment and check status
        time.sleep(3)
        success, output, _ = self.run_command("sudo systemctl status geovan-vehicle")
        
        if success and "active (running)" in output:
            print("✅ Vehicle node service started successfully")
            return True
        else:
            print("❌ Failed to start vehicle node service")
            return False
    
    def run(self):
        """Run the complete setup"""
        print("🚗 Starting GeoVAN Auto-Setup...")
        print(f"Vehicle ID: {self.vehicle_id}")
        print(f"Server URL: {self.server_url}")
        print("=" * 50)
        
        try:
            # Step 1: Update system
            self.update_system()
            
            # Step 2: Install dependencies
            self.install_dependencies()
            
            # Step 3: Enable interfaces
            self.enable_interfaces()
            
            # Step 4: Setup GPS
            self.setup_gps()
            
            # Step 5: Create vehicle node
            self.create_vehicle_node()
            
            # Step 6: Create configuration
            self.create_config()
            
            # Step 7: Create service
            self.create_service()
            
            # Step 8: Setup firewall
            self.setup_firewall()
            
            # Step 9: Test connection
            if not self.test_connection():
                print("⚠️ Server connection failed, but continuing...")
            
            # Step 10: Start service
            if self.start_service():
                print("\n🎉 Setup completed successfully!")
                print(f"Vehicle node {self.vehicle_id} is now running")
                print(f"Check status: sudo systemctl status geovan-vehicle")
                print(f"View logs: journalctl -u geovan-vehicle -f")
            else:
                print("\n❌ Setup completed with errors")
                print("Check logs for details")
                
        except Exception as e:
            print(f"\n❌ Setup failed: {e}")
            return False
        
        return True

if __name__ == "__main__":
    setup = AutoSetup()
    success = setup.run()
    
    if success:
        print("\n🚗 Your Raspberry Pi is now a GeoVAN vehicle node!")
        print("It will automatically start on boot and send data to the server.")
    else:
        print("\n❌ Setup failed. Please check the errors above.")
        sys.exit(1)
