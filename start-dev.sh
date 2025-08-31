#!/bin/bash

# GeoVAN Development Startup Script
# This script starts both the backend and frontend development servers

echo "🚀 Starting GeoVAN Development Environment..."

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js first."
    exit 1
fi

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    echo "❌ npm is not installed. Please install npm first."
    exit 1
fi

# Function to cleanup background processes
cleanup() {
    echo "🛑 Shutting down development servers..."
    kill $BACKEND_PID $FRONTEND_PID 2>/dev/null
    exit 0
}

# Set trap to cleanup on script exit
trap cleanup SIGINT SIGTERM

# Start backend server
echo "🔧 Starting backend server..."
cd local-backend
npm install
npm run dev:all &
BACKEND_PID=$!
cd ..

# Wait a moment for backend to start
sleep 3

# Start frontend server
echo "🎨 Starting frontend server..."
cd frontend
npm install
npm run dev:frontend-only &
FRONTEND_PID=$!
cd ..

echo "✅ Development environment started!"
echo "📊 Backend: http://localhost:8081"
echo "🔌 WebSocket: ws://localhost:8080"
echo "🌐 Frontend: http://localhost:3000"
echo ""
echo "Press Ctrl+C to stop all servers"

# Wait for both processes
wait
