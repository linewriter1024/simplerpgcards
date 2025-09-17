#!/bin/bash

# RPG Cards Docker Run Script
# Usage: ./docker-run.sh <frontend_host> <frontend_port> <data_directory>

set -e

# Parse arguments
FRONTEND_HOST=${1}
FRONTEND_PORT=${2}
DATA_DIR=${3}

# Validate arguments
if [ -z "$FRONTEND_HOST" ] || [ -z "$FRONTEND_PORT" ] || [ -z "$DATA_DIR" ]; then
    echo "Error: Missing required arguments"
    echo "Usage: ./docker-run.sh <frontend_host> <frontend_port> <data_directory>"
    echo "Example: ./docker-run.sh 0.0.0.0 8080 ./data"
    echo ""
    echo "Arguments:"
    echo "  frontend_host  - Interface to bind to (e.g., 0.0.0.0, 127.0.0.1)"
    echo "  frontend_port  - Port number for the web interface"
    echo "  data_directory - Path to directory where simplerpgcards.db will be stored"
    exit 1
fi

# Validate port is a number
if ! echo "$FRONTEND_PORT" | grep -qE '^[0-9]+$'; then
    echo "Error: Port must be a number"
    exit 1
fi

# Convert data directory to absolute path
DATA_DIR=$(realpath "$DATA_DIR")

# Create data directory if it doesn't exist
mkdir -p "$DATA_DIR"

echo "Starting RPG Cards container with:"
echo "  Frontend Host: $FRONTEND_HOST"
echo "  Frontend Port: $FRONTEND_PORT"
echo "  Data Directory: $DATA_DIR"
echo "  Database File: $DATA_DIR/simplerpgcards.db"
echo ""
echo "Press Ctrl+C to stop the container"
echo ""

# Run the container in foreground with exec
exec docker run --rm \
  --name rpg-cards-app \
  -p "$FRONTEND_PORT:$FRONTEND_PORT" \
  -v "$DATA_DIR:/data" \
  rpg-cards "$FRONTEND_HOST" "$FRONTEND_PORT"
