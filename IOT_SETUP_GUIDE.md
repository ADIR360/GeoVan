# 🚗 GeoVAN IoT Vehicle Node Setup Guide

## Overview

This guide will help you set up Raspberry Pi devices as real vehicle tracking nodes for the GeoVAN system. Each Pi will collect actual GPS data and sensor readings, then transmit them to the central server.

## 🚀 **ONE-COMMAND INSTALLATION (RECOMMENDED)**

### Quick Start
```bash
# Download and run the one-command installer
curl -sSL https://raw.githubusercontent.com/your-repo/geovan-iot/main/iot-vehicle-node/install.sh | bash

# Or download first, then run
wget https://raw.githubusercontent.com/your-repo/geovan-iot/main/iot-vehicle-node/install.sh
chmod +x install.sh
./install.sh
```

**That's it!** The script will automatically:
- ✅ Update your Raspberry Pi
- ✅ Install all dependencies
- ✅ Configure GPS and sensors
- ✅ Set up the vehicle node service
- ✅ Start sending data to your server
- ✅ Configure firewall and security

## 🛠️ Hardware Requirements

### Required Components
- **Raspberry Pi 3/4** (4GB RAM recommended)
- **GPS Module** (NEO-6M, NEO-8M, or similar)
- **MicroSD Card** (32GB+ Class 10)
- **Power Supply** (5V/3A for Pi 4)
- **WiFi connectivity** (built-in or USB dongle)

### Optional Sensors
- **Temperature Sensor** (DS18B20, DHT22)
- **Accelerometer** (MPU6050)
- **Compass** (HMC5883L)
- **Pressure Sensor** (BMP280)
- **Humidity Sensor** (DHT22)

### GPS Module Setup
```
GPS Module → Raspberry Pi
VCC       → 3.3V
GND       → GND
TX        → GPIO14 (UART0_TXD)
RX        → GPIO15 (UART0_RXD)
```

## 📋 Prerequisites

### 1. Raspberry Pi OS Installation
```bash
# Download Raspberry Pi Imager
# Flash Raspberry Pi OS Lite to microSD card
# Enable SSH and set hostname during setup
```

### 2. Network Configuration
```bash
# Connect to WiFi or Ethernet
# Note the IP address for SSH access
# Ensure internet connectivity for package installation
```

## 🔧 **Automated Setup Options**

### Option 1: One-Command Installer (Easiest)
```bash
curl -sSL https://raw.githubusercontent.com/your-repo/geovan-iot/main/iot-vehicle-node/install.sh | bash
```

### Option 2: Python Auto-Setup
```bash
# Download auto_setup.py
wget https://raw.githubusercontent.com/your-repo/geovan-iot/main/iot-vehicle-node/auto_setup.py

# Run with your server URL
python3 auto_setup.py "https://your-vercel-app.vercel.app"
```

### Option 3: Manual Setup
```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install dependencies
sudo apt install -y python3 python3-pip gpsd gpsd-clients i2c-tools

# Enable interfaces
sudo raspi-config nonint do_i2c 0
sudo raspi-config nonint do_spi 0
sudo raspi-config nonint do_serial 0

# Configure GPS daemon
sudo systemctl enable gpsd
sudo systemctl start gpsd
```

## 🎯 **What Happens During Auto-setup**

1. **System Update**: Updates all packages
2. **Dependency Installation**: Installs Python, GPS, sensors, networking tools
3. **Interface Configuration**: Enables I2C, SPI, and Serial interfaces
4. **GPS Setup**: Configures and tests GPS daemon
5. **Vehicle Node Creation**: Sets up Python environment and installs packages
6. **Configuration**: Creates config.json with your settings
7. **Service Creation**: Creates systemd service for auto-start
8. **Firewall Setup**: Configures security settings
9. **Connection Test**: Tests connection to your server
10. **Service Start**: Starts the vehicle node automatically

## 📡 Testing & Calibration

### 1. Test GPS Connection
```bash
# Check GPS status
gpspipe -w -n 10

# Expected output should show GPS data
# If no data, check connections and GPS module power
```

### 2. Test I2C Sensors
```bash
# Scan for I2C devices
i2cdetect -y 1

# Expected output shows connected sensor addresses
# Common addresses:
# 0x48 - ADS1115 (ADC)
# 0x68 - MPU6050 (Accelerometer)
# 0x1E - HMC5883L (Compass)
```

### 3. Calibrate Sensors
```bash
cd ~/geovan-vehicle-node
./calibrate_sensors.sh
```

## 🚗 Running the Vehicle Node

### 1. **Automatic (Recommended)**
The service starts automatically on boot:
```bash
# Check if running
sudo systemctl status geovan-vehicle

# View logs
journalctl -u geovan-vehicle -f
```

### 2. Manual Start (for testing)
```bash
cd ~/geovan-vehicle-node
source venv/bin/activate
python vehicle_node.py --vehicle-id "PI-001" --server-url "https://your-app.vercel.app"
```

### 3. Monitor Operation
```bash
# View real-time logs
tail -f vehicle_PI-001.log

# Check system status
./monitor.sh

# View service logs
journalctl -u geovan-vehicle -f
```

## 🔍 Troubleshooting

### GPS Issues
```bash
# Check GPS daemon status
sudo systemctl status gpsd

# Test GPS connection
gpspipe -w -n 5

# Check serial port
ls -l /dev/ttyAMA0

# Restart GPS daemon
sudo systemctl restart gpsd
```

### Sensor Issues
```bash
# Check I2C bus
i2cdetect -y 1

# Check sensor connections
# Verify power (3.3V) and ground connections
# Check I2C pull-up resistors
```

### Network Issues
```bash
# Check WiFi connection
iwconfig

# Test internet connectivity
ping 8.8.8.8

# Check DNS resolution
nslookup google.com
```

### Service Issues
```bash
# Check service status
sudo systemctl status geovan-vehicle

# View detailed logs
journalctl -u geovan-vehicle --no-pager -l

# Restart service
sudo systemctl restart geovan-vehicle
```

## 📊 Data Validation

### 1. Check Data Quality
```bash
# Monitor incoming data
tail -f vehicle_PI-001.log | grep "Data collected"

# Expected output:
# 2024-01-01 12:00:00 - INFO - Data collected: active at 40.712800, -74.006000
```

### 2. Verify Server Communication
```bash
# Check transmission logs
tail -f vehicle_PI-001.log | grep "transmitted"

# Expected output:
# 2024-01-01 12:00:00 - INFO - Data transmitted successfully
```

### 3. Monitor System Resources
```bash
# Check CPU and memory usage
htop

# Check disk usage
df -h

# Check temperature
vcgencmd measure_temp
```

## 🌐 Deployment to Vercel

### 1. Frontend Deployment
```bash
# Install Vercel CLI
npm i -g vercel

# Deploy frontend
cd frontend
vercel --prod
```

### 2. Update IoT Server URL
```bash
# Update config.json with Vercel URL
nano ~/geovan-vehicle-node/config.json

# Change server_url to your Vercel deployment
"server_url": "https://your-app.vercel.app"
```

### 3. Test Remote Connection
```bash
# Test API endpoint
curl https://your-app.vercel.app/api/health

# Expected response:
# {"success":true,"message":"GeoVAN IoT Server Running",...}
```

## 🔒 Security Considerations

### 1. Network Security
```bash
# Enable firewall
sudo ufw enable
sudo ufw allow ssh
sudo ufw allow 80
sudo ufw allow 443

# Check firewall status
sudo ufw status
```

### 2. Data Encryption
- All data is transmitted over HTTPS/WSS
- Vehicle data includes checksums for integrity
- Consider implementing JWT authentication for production

### 3. Physical Security
- Secure the Raspberry Pi in the vehicle
- Use tamper-evident enclosures
- Consider GPS jamming detection

## 📈 Performance Optimization

### 1. Update Intervals
```json
{
  "sensor_update_interval": 1,    // 1 second for sensors
  "transmission_interval": 5      // 5 seconds for server updates
}
```

### 2. Memory Management
```bash
# Monitor memory usage
free -h

# Optimize Python memory usage
# The service automatically restarts if memory issues occur
```

### 3. Network Optimization
```bash
# Check network latency
ping your-server.vercel.app

# Optimize WiFi settings
# Use 5GHz WiFi when possible
# Position WiFi antenna for best signal
```

## 🔄 Updates & Maintenance

### 1. Update Vehicle Node
```bash
cd ~/geovan-vehicle-node
./update.sh
```

### 2. Backup Configuration
```bash
./backup.sh
```

### 3. Monitor Logs
```bash
# Rotate logs to prevent disk full
sudo logrotate -f /etc/logrotate.conf

# Check log sizes
du -sh ~/geovan-vehicle-node/*.log
```

## 📞 Support & Monitoring

### 1. Health Checks
```bash
# Run comprehensive health check
./monitor.sh

# Check all services
sudo systemctl status geovan-vehicle gpsd ntp
```

### 2. Emergency Procedures
```bash
# Stop vehicle node
sudo systemctl stop geovan-vehicle

# Restart all services
sudo systemctl restart geovan-vehicle gpsd

# Check for errors
journalctl -u geovan-vehicle --since "1 hour ago"
```

### 3. Contact Information
- **Documentation**: Check this guide and main README
- **Issues**: Report via GitHub Issues
- **Community**: Join discussions for help

## 🎯 Next Steps

1. **Deploy Multiple Nodes**: Set up additional Raspberry Pi devices
2. **Custom Sensors**: Add vehicle-specific sensors (OBD-II, CAN bus)
3. **Advanced Analytics**: Implement machine learning for anomaly detection
4. **Mobile App**: Create companion mobile application
5. **Integration**: Connect with existing fleet management systems

---

## 🚀 **Quick Installation Summary**

```bash
# 1. Download and run installer
curl -sSL https://raw.githubusercontent.com/your-repo/geovan-iot/main/iot-vehicle-node/install.sh | bash

# 2. Enter your Vercel app URL when prompted

# 3. Wait for automatic setup (10-15 minutes)

# 4. Your Pi is now a vehicle node!
```

**🚗 Your IoT vehicle node is now ready to provide real-time tracking data!**

*For additional support, refer to the main GeoVAN documentation.*
