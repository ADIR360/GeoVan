#!/bin/bash

# GeoVAN IoT Vehicle Node Setup Script for Raspberry Pi
# This script sets up a Raspberry Pi to run as a vehicle tracking node

echo "🚗 Setting up GeoVAN IoT Vehicle Node on Raspberry Pi..."

# Update system
echo "📦 Updating system packages..."
sudo apt update && sudo apt upgrade -y

# Install required system packages
echo "🔧 Installing system dependencies..."
sudo apt install -y \
    python3 \
    python3-pip \
    python3-venv \
    git \
    gpsd \
    gpsd-clients \
    i2c-tools \
    python3-smbus \
    python3-dev \
    build-essential \
    libssl-dev \
    libffi-dev \
    python3-setuptools \
    python3-wheel \
    curl \
    wget \
    vim \
    htop \
    ntp \
    ntpdate \
    hostapd \
    dnsmasq \
    ufw

# Enable I2C interface
echo "🔌 Enabling I2C interface..."
sudo raspi-config nonint do_i2c 0

# Enable SPI interface (if needed for some sensors)
echo "🔌 Enabling SPI interface..."
sudo raspi-config nonint do_spi 0

# Enable serial interface for GPS
echo "🔌 Enabling serial interface for GPS..."
sudo raspi-config nonint do_serial 0

# Configure GPS daemon
echo "📍 Configuring GPS daemon..."
sudo systemctl enable gpsd
sudo systemctl start gpsd

# Create vehicle node directory
echo "📁 Creating vehicle node directory..."
mkdir -p ~/geovan-vehicle-node
cd ~/geovan-vehicle-node

# Create Python virtual environment
echo "🐍 Creating Python virtual environment..."
python3 -m venv venv
source venv/bin/activate

# Install Python packages
echo "📦 Installing Python dependencies..."
pip install --upgrade pip
pip install \
    requests \
    pynmea2 \
    smbus2 \
    psutil \
    flask \
    flask-cors \
    paho-mqtt \
    cryptography \
    pyjwt \
    redis \
    sqlite3

# Install GPS library
echo "📍 Installing GPS library..."
pip install gps

# Create configuration file
echo "⚙️ Creating configuration file..."
cat > config.json << EOF
{
    "vehicle_id": "PI-$(hostname | cut -d'-' -f2)",
    "server_url": "https://your-vercel-app.vercel.app",
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
        "license_plate": "PI-$(hostname | cut -d'-' -f2)",
        "driver_id": "driver-$(hostname | cut -d'-' -f2)"
    }
}
EOF

# Create systemd service
echo "🔧 Creating systemd service..."
sudo tee /etc/systemd/system/geovan-vehicle.service > /dev/null << EOF
[Unit]
Description=GeoVAN IoT Vehicle Node
After=network.target gpsd.service
Wants=gpsd.service

[Service]
Type=simple
User=pi
WorkingDirectory=/home/pi/geovan-vehicle-node
Environment=PATH=/home/pi/geovan-vehicle-node/venv/bin
ExecStart=/home/pi/geovan-vehicle-node/venv/bin/python vehicle_node.py
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
EOF

# Create startup script
echo "🚀 Creating startup script..."
cat > start_vehicle_node.sh << 'EOF'
#!/bin/bash
cd ~/geovan-vehicle-node
source venv/bin/activate
python vehicle_node.py --vehicle-id "$(hostname | cut -d'-' -f2)" --server-url "https://your-vercel-app.vercel.app"
EOF

chmod +x start_vehicle_node.sh

# Create monitoring script
echo "📊 Creating monitoring script..."
cat > monitor.sh << 'EOF'
#!/bin/bash
echo "=== GeoVAN Vehicle Node Status ==="
echo "Service Status:"
sudo systemctl status geovan-vehicle --no-pager -l
echo ""
echo "GPS Status:"
gpspipe -w -n 5 | head -20
echo ""
echo "I2C Devices:"
i2cdetect -y 1
echo ""
echo "System Resources:"
free -h
df -h
echo ""
echo "Network Status:"
iwconfig
echo ""
echo "Recent Logs:"
tail -20 vehicle_$(hostname | cut -d'-' -f2).log
EOF

chmod +x monitor.sh

# Create calibration script
echo "🎯 Creating calibration script..."
cat > calibrate_sensors.sh << 'EOF'
#!/bin/bash
echo "=== Sensor Calibration ==="
echo "This script will help calibrate your sensors."
echo "Follow the on-screen instructions."
echo ""

# GPS calibration
echo "GPS Calibration:"
echo "1. Place the GPS module in an open area"
echo "2. Wait for GPS lock (green LED should be steady)"
echo "3. Run: gpspipe -w -n 10"
echo ""

# Accelerometer calibration
echo "Accelerometer Calibration:"
echo "1. Place the device on a flat surface"
echo "2. Keep it still for 10 seconds"
echo "3. The sensor will auto-calibrate"
echo ""

# Compass calibration
echo "Compass Calibration:"
echo "1. Rotate the device slowly in all directions"
echo "2. Make figure-8 patterns"
echo "3. Continue for 30 seconds"
echo ""

echo "Calibration complete!"
EOF

chmod +x calibrate_sensors.sh

# Create WiFi configuration
echo "📶 Creating WiFi configuration..."
cat > wifi_setup.sh << 'EOF'
#!/bin/bash
echo "=== WiFi Setup ==="
echo "Enter WiFi SSID:"
read -r ssid
echo "Enter WiFi password:"
read -s password
echo ""

# Configure WiFi
sudo tee /etc/wpa_supplicant/wpa_supplicant.conf > /dev/null << WPAEOF
country=US
ctrl_interface=DIR=/var/run/wpa_supplicant GROUP=netdev
update_config=1

network={
    ssid="$ssid"
    psk="$password"
    key_mgmt=WPA-PSK
}
WPAEOF

echo "WiFi configured. Rebooting in 5 seconds..."
sleep 5
sudo reboot
EOF

chmod +x wifi_setup.sh

# Create backup script
echo "💾 Creating backup script..."
cat > backup.sh << 'EOF'
#!/bin/bash
echo "=== Creating Backup ==="
backup_dir="/home/pi/geovan-backup-$(date +%Y%m%d-%H%M%S)"
mkdir -p "$backup_dir"

# Backup configuration
cp config.json "$backup_dir/"
cp *.log "$backup_dir/" 2>/dev/null || true

# Backup logs
cp -r logs "$backup_dir/" 2>/dev/null || true

# Create archive
tar -czf "$backup_dir.tar.gz" "$backup_dir"
rm -rf "$backup_dir"

echo "Backup created: $backup_dir.tar.gz"
EOF

chmod +x backup.sh

# Create update script
echo "🔄 Creating update script..."
cat > update.sh << 'EOF'
#!/bin/bash
echo "=== Updating Vehicle Node ==="
cd ~/geovan-vehicle-node

# Backup current version
./backup.sh

# Pull latest code
git pull origin main

# Update dependencies
source venv/bin/activate
pip install -r requirements.txt

# Restart service
sudo systemctl restart geovan-vehicle

echo "Update complete!"
EOF

chmod +x update.sh

# Create requirements.txt
echo "📋 Creating requirements.txt..."
cat > requirements.txt << EOF
requests>=2.28.0
pynmea2>=1.18.0
smbus2>=0.4.2
psutil>=5.9.0
flask>=2.2.0
flask-cors>=3.0.10
paho-mqtt>=1.6.1
cryptography>=37.0.0
pyjwt>=2.6.0
redis>=4.3.0
gps>=3.19
EOF

# Create README
echo "📖 Creating README..."
cat > README.md << 'EOF'
# GeoVAN IoT Vehicle Node

This Raspberry Pi runs as a vehicle tracking node for the GeoVAN system.

## Quick Start

1. **Start the service:**
   ```bash
   sudo systemctl start geovan-vehicle
   sudo systemctl enable geovan-vehicle
   ```

2. **Check status:**
   ```bash
   ./monitor.sh
   ```

3. **Manual start:**
   ```bash
   ./start_vehicle_node.sh
   ```

## Configuration

Edit `config.json` to configure:
- Vehicle ID
- Server URL
- GPS settings
- Update intervals

## Troubleshooting

- **GPS issues:** Run `gpspipe -w -n 10` to test GPS
- **I2C issues:** Run `i2cdetect -y 1` to see connected devices
- **Service issues:** Check logs with `journalctl -u geovan-vehicle`

## Hardware Requirements

- Raspberry Pi 3/4
- GPS module (NEO-6M or similar)
- I2C sensors (optional)
- WiFi connectivity

## Support

Check the main GeoVAN documentation for more information.
EOF

# Set permissions
echo "🔐 Setting permissions..."
chmod 755 ~/geovan-vehicle-node
chown -R pi:pi ~/geovan-vehicle-node

# Enable firewall
echo "🔥 Configuring firewall..."
sudo ufw --force enable
sudo ufw allow ssh
sudo ufw allow 80
sudo ufw allow 443

# Configure NTP
echo "⏰ Configuring NTP..."
sudo systemctl enable ntp
sudo systemctl start ntp

# Final setup
echo "🎉 Setup complete!"
echo ""
echo "Next steps:"
echo "1. Edit config.json with your server URL"
echo "2. Connect GPS and sensors"
echo "3. Configure WiFi: ./wifi_setup.sh"
echo "4. Start service: sudo systemctl start geovan-vehicle"
echo "5. Monitor: ./monitor.sh"
echo ""
echo "Vehicle Node will be available at: PI-$(hostname | cut -d'-' -f2)"
echo "Logs will be saved to: vehicle_$(hostname | cut -d'-' -f2).log"

# Reboot prompt
echo ""
read -p "Reboot now to apply all changes? (y/n): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo "Rebooting in 5 seconds..."
    sleep 5
    sudo reboot
fi
