#!/bin/bash

# GeoVAN Development Startup Script
# This script starts both frontend and backend for development

echo "🚗 Starting GeoVAN Development Environment..."
echo "=============================================="

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ Error: Please run this script from the frontend directory"
    exit 1
fi

# Check if local-backend exists
if [ ! -d "../local-backend" ]; then
    echo "❌ Error: local-backend directory not found"
    echo "Please ensure the local-backend directory exists in the parent directory"
    exit 1
fi

# Check if backend dependencies are installed
if [ ! -d "../local-backend/node_modules" ]; then
    echo "📦 Installing backend dependencies..."
    cd ../local-backend
    npm install
    cd ../frontend
fi

# Check if frontend dependencies are installed
if [ ! -d "node_modules" ]; then
    echo "📦 Installing frontend dependencies..."
    npm install
fi

echo "✅ Dependencies checked"
echo "🌐 Starting development servers..."

# Start both frontend and backend
echo "🚀 Running: npm run dev"
npm run dev
