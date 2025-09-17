#!/bin/bash

# RPG Cards Docker Build Script

set -e

echo "Building RPG Cards Docker container..."

# Build the Docker image
docker build -t rpg-cards .

echo "Docker image built successfully!"
echo ""
echo "To run the container:"
echo "  ./docker-run.sh <frontend_host> <frontend_port> <data_directory>"
echo "  Example: ./docker-run.sh 0.0.0.0 8080 ./data"
