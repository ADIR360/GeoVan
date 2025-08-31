#!/bin/bash

# GeoVAN System Test Script
# This script helps test the complete GeoVAN system

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
MQTT_BROKER="localhost"
MQTT_PORT="1883"
WS_PORT="8080"
BUILD_DIR="build"
VEHICLE_COUNT=3
TEST_DURATION=60

echo -e "${BLUE}🚗 GeoVAN System Test Script${NC}"
echo "=================================="

# Function to check if a command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Function to check if a port is open
port_open() {
    nc -z localhost $1 2>/dev/null
}

# Function to wait for a service to be ready
wait_for_service() {
    local service_name=$1
    local port=$2
    local max_wait=30
    local wait_time=0
    
    echo -n "Waiting for $service_name to be ready..."
    while ! port_open $port && [ $wait_time -lt $max_wait ]; do
        sleep 1
        wait_time=$((wait_time + 1))
        echo -n "."
    done
    
    if port_open $port; then
        echo -e " ${GREEN}✓${NC}"
    else
        echo -e " ${RED}✗${NC}"
        echo -e "${RED}Error: $service_name not ready after ${max_wait}s${NC}"
        exit 1
    fi
}

# Check prerequisites
echo -e "\n${YELLOW}Checking prerequisites...${NC}"

# Check if mosquitto is installed
if ! command_exists mosquitto; then
    echo -e "${RED}Error: mosquitto not found. Please install it first.${NC}"
    echo "On macOS: brew install mosquitto"
    echo "On Ubuntu: sudo apt install mosquitto"
    exit 1
fi

# Check if Node.js is installed
if ! command_exists node; then
    echo -e "${RED}Error: Node.js not found. Please install it first.${NC}"
    echo "On macOS: brew install node"
    echo "On Ubuntu: curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash - && sudo apt-get install -y nodejs"
    exit 1
fi

# Check if vehicle_agent exists
if [ ! -f "$BUILD_DIR/vehicle_agent" ]; then
    echo -e "${RED}Error: vehicle_agent not found. Please build it first:${NC}"
    echo "mkdir -p build && cd build && cmake .. && make"
    exit 1
fi

echo -e "${GREEN}All prerequisites met!${NC}"

# Start MQTT broker
echo -e "\n${YELLOW}Starting MQTT broker...${NC}"
mosquitto -p $MQTT_PORT &
MOSQUITTO_PID=$!
echo "Mosquitto started with PID: $MOSQUITTO_PID"

# Wait for MQTT broker
wait_for_service "MQTT Broker" $MQTT_PORT

# Install Node.js dependencies if needed
if [ ! -d "relay/node_modules" ]; then
    echo -e "\n${YELLOW}Installing Node.js dependencies...${NC}"
    cd relay
    npm install
    cd ..
fi

# Start WebSocket relay
echo -e "\n${YELLOW}Starting WebSocket relay...${NC}"
cd relay
npm start &
RELAY_PID=$!
cd ..
echo "WebSocket relay started with PID: $RELAY_PID"

# Wait for WebSocket relay
wait_for_service "WebSocket Relay" $WS_PORT

# Start vehicle agents
echo -e "\n${YELLOW}Starting vehicle agents...${NC}"
VEHICLE_PIDS=()

for i in $(seq 1 $VEHICLE_COUNT); do
    vehicle_id="test-vehicle-$i"
    echo "Starting $vehicle_id..."
    
    # Start vehicle agent in background
    $BUILD_DIR/vehicle_agent --id $vehicle_id --interval 2000 &
    VEHICLE_PIDS+=($!)
    
    echo "$vehicle_id started with PID: ${VEHICLE_PIDS[-1]}"
done

echo -e "\n${GREEN}All services started successfully!${NC}"
echo "=================================="
echo -e "${BLUE}System Status:${NC}"
echo "MQTT Broker: Running (PID: $MOSQUITTO_PID)"
echo "WebSocket Relay: Running (PID: $RELAY_PID)"
echo "Vehicle Agents: ${#VEHICLE_PIDS[@]} running"

echo -e "\n${BLUE}Test Instructions:${NC}"
echo "1. Open web/index.html in your browser"
echo "2. Or serve with: cd web && python3 -m http.server 8000"
echo "3. Navigate to http://localhost:8000"
echo "4. You should see $VEHICLE_COUNT vehicles moving on the map"
echo "5. Click on vehicles to see details"
echo "6. Adjust trail length and other controls in the sidebar"

echo -e "\n${YELLOW}Test will run for ${TEST_DURATION} seconds...${NC}"
echo "Press Ctrl+C to stop early"

# Function to cleanup on exit
cleanup() {
    echo -e "\n${YELLOW}Cleaning up...${NC}"
    
    # Stop vehicle agents
    for pid in "${VEHICLE_PIDS[@]}"; do
        if kill -0 $pid 2>/dev/null; then
            echo "Stopping vehicle agent (PID: $pid)"
            kill $pid
        fi
    done
    
    # Stop WebSocket relay
    if kill -0 $RELAY_PID 2>/dev/null; then
        echo "Stopping WebSocket relay (PID: $RELAY_PID)"
        kill $RELAY_PID
    fi
    
    # Stop MQTT broker
    if kill -0 $MOSQUITTO_PID 2>/dev/null; then
        echo "Stopping MQTT broker (PID: $MOSQUITTO_PID)"
        kill $MOSQUITTO_PID
    fi
    
    echo -e "${GREEN}Cleanup complete!${NC}"
    exit 0
}

# Set trap to cleanup on exit
trap cleanup SIGINT SIGTERM

# Wait for test duration
echo -e "\n${GREEN}Test running... Press Ctrl+C to stop${NC}"
sleep $TEST_DURATION

# Cleanup
cleanup
