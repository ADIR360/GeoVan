# 🚗 GeoVAN Development Guide

## 🚀 Quick Start

### Option 1: One Command (Recommended)
```bash
# From the frontend directory
npm run dev
```

This will automatically start:
- ✅ **Frontend** on `http://localhost:3000`
- ✅ **Backend API** on `http://localhost:8080`
- ✅ **WebSocket Server** on `ws://localhost:8081`

### Option 2: Using Startup Scripts
```bash
# Unix/Linux/macOS
./dev-start.sh

# Windows
dev-start.bat
```

### Option 3: Manual Start
```bash
# Terminal 1: Start Backend
cd ../local-backend
npm run dev:all

# Terminal 2: Start Frontend
cd frontend
npm run dev:frontend-only
```

## 📁 Project Structure

```
VANET/
├── frontend/                 # React Frontend
│   ├── src/                 # Source code
│   ├── package.json         # Frontend dependencies
│   └── dev-start.sh         # Development startup script
├── local-backend/           # Node.js Backend
│   ├── server.js            # REST API server
│   ├── vehicleWebSocket.js  # WebSocket server
│   └── package.json         # Backend dependencies
└── iot-vehicle-node/        # Raspberry Pi IoT nodes
```

## 🔧 Development Scripts

### Frontend Scripts
```bash
npm run dev                    # Start both frontend and backend
npm run dev:frontend          # Start only frontend
npm run dev:backend           # Start only backend
npm run build                 # Build for production
npm run preview               # Preview production build
npm run test                  # Run tests
npm run storybook             # Start Storybook
```

### Backend Scripts
```bash
cd ../local-backend
npm run dev                    # Start REST API server
npm run websocket             # Start WebSocket server
npm run dev:all               # Start both servers
```

## 🌐 Development URLs

| Service | URL | Description |
|---------|-----|-------------|
| **Frontend** | `http://localhost:3000` | React application |
| **Backend API** | `http://localhost:8080` | REST API endpoints |
| **WebSocket** | `ws://localhost:8081` | Real-time data |
| **IoT Server** | `http://localhost:8080` | IoT device endpoints |

## 📊 Available API Endpoints

### REST API (`http://localhost:8080`)
- `GET /api/health` - Server health check
- `GET /api/vehicles` - Get all vehicles
- `GET /api/vehicle/:id` - Get specific vehicle
- `POST /api/vehicle/update` - Update vehicle data
- `GET /api/analytics` - Get analytics data

### WebSocket (`ws://localhost:8081`)
- `vehicles_initial` - Initial vehicle data
- `vehicles_update` - Real-time vehicle updates
- `analytics_update` - Real-time analytics

## 🔍 Troubleshooting

### Common Issues

#### 1. Port Already in Use
```bash
# Check what's using the port
lsof -i :3000  # Frontend
lsof -i :8080  # Backend
lsof -i :8081  # WebSocket

# Kill the process
kill -9 <PID>
```

#### 2. Backend Not Starting
```bash
# Check backend dependencies
cd ../local-backend
npm install

# Check if ports are available
netstat -an | grep 8080
```

#### 3. Frontend Can't Connect to Backend
```bash
# Check backend is running
curl http://localhost:8080/api/health

# Check CORS settings in backend
# Ensure backend allows requests from localhost:3000
```

#### 4. WebSocket Connection Issues
```bash
# Check WebSocket server
curl -I http://localhost:8081

# Check browser console for WebSocket errors
```

### Development Commands

#### Start Fresh
```bash
# Stop all processes
pkill -f "vite\|node"

# Clear ports
npx kill-port 3000 8080 8081

# Start again
npm run dev
```

#### Check Logs
```bash
# Frontend logs (in terminal)
npm run dev:frontend

# Backend logs (in terminal)
npm run dev:backend

# WebSocket logs (in terminal)
npm run websocket
```

## 🚀 Production Deployment

### Build Frontend
```bash
npm run build
```

### Deploy to Vercel
```bash
npm install -g vercel
vercel --prod
```

### Environment Variables
Create `.env.local` for production:
```env
VITE_IOT_SERVER_URL=https://your-vercel-app.vercel.app
VITE_API_BASE_URL=https://your-vercel-app.vercel.app
VITE_WS_URL=wss://your-vercel-app.vercel.app
```

## 📱 IoT Device Setup

### Raspberry Pi Setup
```bash
# On Raspberry Pi
curl -sSL https://raw.githubusercontent.com/your-repo/geovan-iot/main/iot-vehicle-node/install.sh | bash
```

### Update IoT Server URL
```bash
# Edit config.json on Pi
nano ~/geovan-vehicle-node/config.json

# Change server_url to your Vercel deployment
"server_url": "https://your-app.vercel.app"
```

## 🎯 Development Tips

1. **Use Browser DevTools** - Check Network tab for API calls
2. **Monitor Console** - Watch for WebSocket connection status
3. **Check Backend Logs** - Monitor API requests and responses
4. **Use Postman/Insomnia** - Test API endpoints independently
5. **Enable Source Maps** - Better debugging experience

## 🔗 Useful Links

- **Frontend**: http://localhost:3000
- **Backend Health**: http://localhost:8080/api/health
- **API Docs**: Check backend code for endpoint details
- **Storybook**: http://localhost:6006 (if running)

---

**🚗 Happy Developing! Your GeoVAN system is now running with both frontend and backend!**
