#!/bin/sh

# RPG Cards Docker Container Startup Script
# Usage: docker run -v <host_data_dir>:/data <image> <frontend_host> <frontend_port>

set -e

# Parse arguments
FRONTEND_HOST=${1:-"0.0.0.0"}
FRONTEND_PORT=${2:-"8080"}

# The database will always be at /data/simplerpgcards.db inside the container
DATABASE_PATH="/data/simplerpgcards.db"

echo "Starting RPG Cards container with:"
echo "  Frontend Host: $FRONTEND_HOST"
echo "  Frontend Port: $FRONTEND_PORT"
echo "  Database File: $DATABASE_PATH"

# Validate arguments
if [ -z "$FRONTEND_HOST" ] || [ -z "$FRONTEND_PORT" ]; then
    echo "Error: Missing required arguments"
    echo "Usage: docker run -v <host_data_dir>:/data <image> <frontend_host> <frontend_port>"
    echo "Example: docker run -v /home/user/mydata:/data rpg-cards 0.0.0.0 8080"
    exit 1
fi

# Validate port is a number
if ! echo "$FRONTEND_PORT" | grep -qE '^[0-9]+$'; then
    echo "Error: Port must be a number"
    exit 1
fi

# Check if database directory exists, create if not
if [ ! -d "/data" ]; then
    echo "ERROR: /data directory not found. Make sure you mounted a host directory to /data"
    exit 1
fi

# Create database file if it doesn't exist
if [ ! -f "$DATABASE_PATH" ]; then
    echo "Database file doesn't exist, it will be created automatically by the backend"
fi

# Set up environment variables for the backend
export SRC_HOST="127.0.0.1"
export SRC_PORT="3000"
export SRC_DATABASE_PATH="$DATABASE_PATH"
export NODE_ENV="production"

# Update frontend environment to point to the current host/port
FRONTEND_DIST_DIR="/app/frontend/dist"
if [ -f "$FRONTEND_DIST_DIR/main."*.js ]; then
    # Update the API URL in the built frontend files to use relative paths
    # This ensures the frontend always connects to the same host it's served from
    find "$FRONTEND_DIST_DIR" -name "main.*.js" -exec sed -i 's|http://localhost:7713/api|/api|g' {} \;
    find "$FRONTEND_DIST_DIR" -name "main.*.js" -exec sed -i 's|http://localhost:3000/api|/api|g' {} \;
    echo "Updated frontend API URLs to use relative paths"
fi

# Generate nginx configuration from template
sed "s/FRONTEND_PORT/$FRONTEND_PORT/g" /etc/nginx/nginx.conf.template > /etc/nginx/nginx.conf

echo "Generated nginx configuration for port $FRONTEND_PORT"

# Create log files for capturing output
mkdir -p /var/log/rpg-cards
BACKEND_LOG="/var/log/rpg-cards/backend.log"
NGINX_ACCESS_LOG="/var/log/rpg-cards/nginx-access.log"
NGINX_ERROR_LOG="/var/log/rpg-cards/nginx-error.log"

# Function to prefix and forward logs
prefix_logs() {
    local prefix="$1"
    local logfile="$2"
    tail -f "$logfile" 2>/dev/null | while read line; do
        echo "[$prefix] $line"
    done &
}

echo "Starting backend server..."
cd /app/backend

# Start backend and redirect output to log file
node dist/app.js > "$BACKEND_LOG" 2>&1 &
BACKEND_PID=$!

# Start tailing backend logs with prefix
prefix_logs "BACKEND" "$BACKEND_LOG"

# Wait a moment for backend to start
sleep 3

# Check if backend started successfully
if ! kill -0 $BACKEND_PID 2>/dev/null; then
    echo "Error: Backend failed to start"
    exit 1
fi

echo "Backend started successfully (PID: $BACKEND_PID)"

echo "Starting nginx web server..."

# Start nginx in background mode and redirect logs
nginx -g "daemon off;" > "$NGINX_ACCESS_LOG" 2> "$NGINX_ERROR_LOG" &
NGINX_PID=$!

# Start tailing nginx logs with prefixes
prefix_logs "NGINX-ACCESS" "$NGINX_ACCESS_LOG"
prefix_logs "NGINX-ERROR" "$NGINX_ERROR_LOG"

echo "Nginx started successfully (PID: $NGINX_PID)"
echo "All services running. Logs will appear below:"
echo "----------------------------------------"

# Function to cleanup on exit
cleanup() {
    echo ""
    echo "Received shutdown signal. Shutting down services..."
    
    # Kill background processes immediately
    if [ ! -z "$BACKEND_PID" ]; then
        kill $BACKEND_PID 2>/dev/null || true
    fi
    if [ ! -z "$NGINX_PID" ]; then
        kill $NGINX_PID 2>/dev/null || true
    fi
    
    # Give processes a moment to shut down gracefully
    sleep 1
    
    # Force kill if still running
    if [ ! -z "$BACKEND_PID" ]; then
        kill -9 $BACKEND_PID 2>/dev/null || true
    fi
    if [ ! -z "$NGINX_PID" ]; then
        kill -9 $NGINX_PID 2>/dev/null || true
    fi
    
    echo "All services stopped."
    exit 0
}

# Set up signal handlers for immediate shutdown
trap cleanup INT TERM

# Wait for all background processes
wait
