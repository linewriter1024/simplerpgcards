# Multi-stage build for RPG Cards application
FROM node:20-alpine AS build

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./
COPY backend/package*.json ./backend/
COPY frontend/package*.json ./frontend/

# Install dependencies
RUN npm run install:all

# Copy source code
COPY backend/ ./backend/
COPY frontend/ ./frontend/

# Build backend
WORKDIR /app/backend
RUN npm run build

# Build frontend for production
WORKDIR /app/frontend
RUN npm run build -- --configuration=docker

# Production stage
FROM node:20-alpine

# Install nginx for serving frontend and proxying API requests
RUN apk add --no-cache nginx wget

# Create app directory
WORKDIR /app

# Copy built backend
COPY --from=build /app/backend/dist ./backend/dist
COPY --from=build /app/backend/package*.json ./backend/
COPY --from=build /app/backend/node_modules ./backend/node_modules

# Copy built frontend
COPY --from=build /app/frontend/dist/rpg-cards-frontend ./frontend/dist

# Copy nginx configuration template
COPY docker/nginx.conf.template /etc/nginx/nginx.conf.template

# Copy startup script
COPY docker/start.sh /start.sh
COPY docker/healthcheck.sh /healthcheck.sh
RUN chmod +x /start.sh /healthcheck.sh

# Create directory for nginx logs and pid
RUN mkdir -p /var/log/nginx /var/lib/nginx/tmp /run/nginx

# Expose port (will be configurable via startup script)
EXPOSE 8080

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
    CMD /healthcheck.sh

# Set default command
ENTRYPOINT ["/start.sh"]
CMD ["0.0.0.0", "8080"]
