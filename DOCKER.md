# RPG Cards Docker Container

This Docker container packages both the frontend and backend of the RPG Cards application into a single, easy-to-deploy container.

## Features

- **All-in-one**: Contains both Angular frontend and Node.js backend
- **Configurable**: Accepts host, port, and database path as runtime arguments
- **Nginx proxy**: Frontend served by nginx with API requests proxied to backend
- **Volume mounting**: Database can be mounted from host system for persistence
- **Production optimized**: Built with production configurations and optimizations

## Building the Container

```bash
# Build the Docker image
docker build -t rpg-cards .

# Or use the convenience script
./docker-build.sh
```

## Running the Container

### Quick Start with Scripts

```bash
# Build the image
./docker-build.sh

# Run with custom settings (runs in foreground)
./docker-run.sh 0.0.0.0 8080 /home/user/mydata

# The run script accepts three arguments:
# 1. Frontend host (e.g., 0.0.0.0, 127.0.0.1)
# 2. Frontend port (e.g., 8080, 3000)
# 3. Data directory path on host machine
```

### Manual Docker Commands

The container accepts two arguments when running:

1. **Frontend Host** - The host interface to bind the web server to (e.g., `0.0.0.0`, `127.0.0.1`)
2. **Frontend Port** - The port number to serve the web application on

You must also mount a host directory to `/data` inside the container where the database will be stored. The container will automatically create/use a file named `simplerpgcards.db` inside the mounted directory.

**Important**: You must also mount the host directory to `/data` inside the container using Docker's `-v` flag.

### Argument Pattern

```bash
docker run -v <host_directory>:/data <image> <frontend_host> <frontend_port>
```

Simple and clean - you only specify the host directory once in the volume mount.

### Basic Usage

```bash
# Run with default settings (host: 0.0.0.0, port: 8080)
docker run -p 8080:8080 -v /home/user/mydata:/data rpg-cards 0.0.0.0 8080

# Run with custom host and port
docker run -p 3000:3000 -v /home/user/mydata:/data rpg-cards 0.0.0.0 3000

# Run on localhost only with different data directory
docker run -p 8080:8080 -v /opt/rpgdata:/data rpg-cards 127.0.0.1 8080
```

### Volume Mounting

To persist your data, you must mount a host directory where the database will be stored:

```bash
# Mount host directory for database persistence
# The database file simplerpgcards.db will be created in the mounted directory
docker run -p 8080:8080 \
  -v /path/on/host/to/database/directory:/data \
  rpg-cards 0.0.0.0 8080
```

### Complete Example

```bash
# Create a directory for the database on your host
mkdir -p ./rpg-data

# Run the container with volume mounting
docker run -d \
  --name rpg-cards-app \
  -p 8080:8080 \
  -v $(pwd)/rpg-data:/data \
  rpg-cards 0.0.0.0 8080
```

## Signal Handling and Foreground Operation

The `./docker-run.sh` script runs the container in the foreground and properly handles signals:

- **Ctrl+C** will gracefully stop the container
- Uses `--rm` flag to automatically remove container when stopped
- Uses `exec` to ensure proper signal propagation
- Container logs are displayed directly in the terminal

For background operation, use the manual docker commands with `-d` flag or docker-compose.

## Container Architecture

- **Nginx** serves the Angular frontend and proxies API requests
- **Node.js backend** runs on internal port 3000
- **SQLite database** can be mounted from host for persistence
- **Environment variables** configured automatically based on arguments

## Health Check

The container exposes a health check endpoint at `/health` that you can use to monitor the application status.

```bash
curl http://localhost:8080/health
```

## Logs

View container logs:

```bash
# View real-time logs
docker logs -f rpg-cards-app

# View recent logs
docker logs --tail 50 rpg-cards-app
```

## Development vs Production

This container is configured for production use with:
- Optimized Angular build
- Production Node.js settings
- Nginx for efficient static file serving
- Security headers configured

## Troubleshooting

### Port Already in Use
If you get a port binding error, either:
- Use a different port: `-p 8081:8080`
- Stop the service using the port
- Use `docker ps` to check if container is already running

### Database Permissions
Ensure the mounted directory has proper permissions:
```bash
chmod 755 /path/to/database/directory
```

### Memory Issues
If the build fails due to memory constraints:
```bash
# Increase Docker memory limit or use multi-stage build optimizations
docker build --memory=4g -t rpg-cards .
```

## Environment Variables

The container sets these environment variables automatically:
- `SRC_HOST`: Backend host (127.0.0.1)
- `SRC_PORT`: Backend port (3000)
- `SRC_DATABASE_PATH`: Database file path (`/data/simplerpgcards.db`)
- `NODE_ENV`: Set to production

Note: The database is always at `/data/simplerpgcards.db` inside the container, regardless of where you mount the host directory from.

## Security Considerations

- Database is only accessible from within the container unless explicitly mounted
- Backend runs on internal network interface
- Nginx configured with security headers
- No unnecessary ports exposed

## Stopping the Container

```bash
# Stop the container
docker stop rpg-cards-app

# Remove the container
docker rm rpg-cards-app
```
