@echo off
REM GeoVAN Development Startup Script for Windows
REM This script starts both the backend and frontend development servers

echo 🚀 Starting GeoVAN Development Environment...

REM Check if Node.js is installed
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Node.js is not installed. Please install Node.js first.
    pause
    exit /b 1
)

REM Check if npm is installed
npm --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ npm is not installed. Please install npm first.
    pause
    exit /b 1
)

REM Start backend server
echo 🔧 Starting backend server...
cd local-backend
start "Backend Server" cmd /k "npm install && npm run dev:all"
cd ..

REM Wait a moment for backend to start
timeout /t 3 /nobreak >nul

REM Start frontend server
echo 🎨 Starting frontend server...
cd frontend
start "Frontend Server" cmd /k "npm install && npm run dev:frontend-only"
cd ..

echo ✅ Development environment started!
echo 📊 Backend: http://localhost:8081
echo 🔌 WebSocket: ws://localhost:8080
echo 🌐 Frontend: http://localhost:3000
echo.
echo Both servers are running in separate windows.
echo Close the windows to stop the servers.
echo.
pause
