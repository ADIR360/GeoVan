# GeoVAN Development Setup Guide

## 🚀 Quick Start

### Option 1: Single Command (Recommended)
```bash
# Install all dependencies and start both servers
npm run install:all
npm run dev
```

### Option 2: Using Scripts
```bash
# On macOS/Linux
./start-dev.sh

# On Windows
start-dev.bat
```

### Option 3: Manual Start
```bash
# Terminal 1: Start Backend
cd local-backend
npm install
npm run dev:all

# Terminal 2: Start Frontend
cd frontend
npm install
npm run dev:frontend-only
```

## 🔧 What's Fixed

### 1. Map Rendering Issues ✅
- Added Leaflet CSS import: `import 'leaflet/dist/leaflet.css';`
- Fixed map container dimensions and styling
- Improved map initialization and tile loading

### 2. DOM Nesting Warning ✅
- Fixed `<div>` inside `<p>` warning in ListItemText
- Created custom `VehicleSecondaryInfo` component to avoid nesting issues
- Used proper React patterns for secondary content

### 3. Unknown Message Type ✅
- Added support for `vehicles_update` message type in vehicleService
- Backend sends `vehicles_update` and frontend now handles it correctly
- Improved message handling to avoid console warnings

### 4. Unified Development Scripts ✅
- Created `start-dev.sh` for macOS/Linux
- Created `start-dev.bat` for Windows
- Added root `package.json` with concurrent scripts
- Single command to start both backend and frontend

## 🌐 Access Points

Once started, access the system at:

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:8081
- **WebSocket Server**: ws://localhost:8080

## 📁 Project Structure

```
VANET/
├── frontend/                 # React + TypeScript frontend
│   ├── src/
│   │   ├── pages/VehicleMap/ # Vehicle tracking map
│   │   ├── services/         # API and WebSocket services
│   │   └── config/           # Environment configuration
│   └── package.json
├── local-backend/            # Node.js backend
│   ├── server.js             # REST API server
│   ├── vehicleWebSocket.js   # WebSocket server
│   └── package.json
├── start-dev.sh              # macOS/Linux startup script
├── start-dev.bat             # Windows startup script
├── package.json              # Root package.json
└── DEV_SETUP.md              # This file
```

## 🛠️ Development Commands

### Root Level
```bash
npm run dev              # Start both servers concurrently
npm run dev:backend      # Start only backend
npm run dev:frontend     # Start only frontend
npm run install:all      # Install all dependencies
npm run build            # Build frontend for production
```

### Frontend
```bash
cd frontend
npm run dev              # Start development server
npm run build            # Build for production
npm run lint             # Run ESLint
npm run test             # Run tests
```

### Backend
```bash
cd local-backend
npm run dev:all          # Start both REST API and WebSocket
npm run start            # Start only REST API
npm run websocket        # Start only WebSocket
```

## 🔍 Troubleshooting

### Map Still Shows Grey
1. Check browser console for errors
2. Ensure Leaflet CSS is loaded
3. Verify map container has proper dimensions
4. Check if tile server is accessible

### WebSocket Connection Issues
1. Verify backend WebSocket server is running on port 8080
2. Check frontend environment configuration
3. Ensure no firewall blocking the connection

### Build Errors
1. Run `npm run install:all` to ensure all dependencies are installed
2. Check Node.js version (requires >=18.0.0)
3. Clear node_modules and reinstall if needed

## 🚗 Vehicle Data

The system generates realistic vehicle data including:
- GPS coordinates and movement simulation
- Vehicle status (active, warning, error, offline)
- Sensor data (speed, fuel, battery, temperature)
- Security metrics (trust score, certificates)
- Network performance data

## 🔐 Security Features

- Real-time vehicle tracking
- Trust score monitoring
- Certificate validation
- Network security metrics
- Emergency vehicle alerts

## 📱 Responsive Design

The frontend is fully responsive and works on:
- Desktop browsers
- Tablets
- Mobile devices
- Touch interfaces

## 🚀 Production Deployment

For production deployment:
1. Build frontend: `npm run build`
2. Deploy backend to production server
3. Update environment variables
4. Configure reverse proxy if needed

## 📞 Support

If you encounter issues:
1. Check the browser console for errors
2. Verify all services are running
3. Check network connectivity
4. Review this documentation

---

**Happy Coding! 🎉**
