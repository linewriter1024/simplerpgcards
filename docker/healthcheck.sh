#!/bin/sh

# Health check script for RPG Cards container
# Returns 0 if healthy, 1 if unhealthy

# Check if nginx is running
if ! pgrep nginx > /dev/null; then
    echo "ERROR: nginx is not running"
    exit 1
fi

# Check if backend is running
if ! pgrep node > /dev/null; then
    echo "ERROR: Node.js backend is not running"
    exit 1
fi

# Check if backend is responding
if ! wget --quiet --tries=1 --spider "http://127.0.0.1:3000/health" 2>/dev/null; then
    echo "ERROR: Backend health check failed"
    exit 1
fi

# Check if frontend is serving
if ! wget --quiet --tries=1 --spider "http://127.0.0.1:8080/health" 2>/dev/null; then
    echo "ERROR: Frontend health check failed"
    exit 1
fi

echo "OK: All services are healthy"
exit 0
