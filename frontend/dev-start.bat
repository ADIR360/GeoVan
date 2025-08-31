@echo off
REM GeoVAN Development Startup Script for Windows
REM This script starts both frontend and backend for development

echo 🚗 Starting GeoVAN Development Environment...
echo ==============================================

REM Check if we're in the right directory
if not exist "package.json" (
    echo ❌ Error: Please run this script from the frontend directory
    pause
    exit /b 1
)

REM Check if local-backend exists
if not exist "..\local-backend" (
    echo ❌ Error: local-backend directory not found
    echo Please ensure the local-backend directory exists in the parent directory
    pause
    exit /b 1
)

REM Check if backend dependencies are installed
if not exist "..\local-backend\node_modules" (
    echo 📦 Installing backend dependencies...
    cd ..\local-backend
    call npm install
    cd ..\frontend
)

REM Check if frontend dependencies are installed
if not exist "node_modules" (
    echo 📦 Installing frontend dependencies...
    call npm install
)

echo ✅ Dependencies checked
echo 🌐 Starting development servers...

REM Start both frontend and backend
echo 🚀 Running: npm run dev
call npm run dev

pause
