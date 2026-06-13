# Simple Container Demo

A small Cyber-Physical System (CPS) demo combining a physical temperature sensor with a containerized application stack.

The application reads the current temperature from a (simulated) physical sensor, stores each reading in MongoDB, and displays it through a web UI.

Configuration is externalized using service-specific `.env` files and loaded by Docker Compose via `env_file`.

## Architecture Overview

This system spans two layers:

- **Physical / Integration layer (not containerized)**: `sensor-driver/` simulates the firmware/driver of a physical temperature sensor running natively on the edge device's host OS. It is intentionally **not part of the Docker Compose stack**.
- **Container layer (Docker Compose)**: `web-app`, `api-app`, and `mongo` form the digital, containerized part of the system, unchanged in structure from the original software-only demo.

`api-app` bridges the two layers: it queries the native sensor driver for the current reading (falling back to a synthetic random value if the driver is not running, so the containerized stack remains fully functional on its own).

## Services

### Sensor Driver (native, not containerized)
- Simulates a physical temperature sensor (e.g. a DS18B20 on a Raspberry Pi) and its driver software
- Runs directly on the host OS — represents the Asset/Integration layers of RAMI 4.0
- Exposes the latest reading on `http://localhost:5050/reading`
- See `sensor-driver/driver.js` for details

### Web App (Port 3000)
- Express.js server serving a static UI
- Modern responsive interface with a button to request the current sensor reading
- Makes HTTP requests to the API service (uses `http://api-app:3001` inside containers)

### API App (Port 3001)
- Simple Express.js API with no UI
- Provides a `/random` endpoint that returns the current temperature reading (sourced from the sensor driver, or a synthetic value as fallback) **and stores each value in MongoDB**
- `/health` endpoint for monitoring
- CORS enabled to allow requests from the web app
- Uses Mongoose ODM, connects via `MONGO_URI` environment variable

### MongoDB
- Runs as a separate container on the same Docker network
- Persists data in a named volume (`mongo-data`)
- The API service saves each reading with a timestamp

## Getting Started

### Prerequisites
- Docker
- Docker Compose
- Node.js (only if you want to run the native sensor driver)

### Running the Application

1. (Optional, for the full CPS demo) Start the native sensor driver in a separate terminal:
```bash
cd /{local_path_to_repo}/simple_container/sensor-driver
npm start
```
This represents software running directly on the edge device and is deliberately kept outside Docker.

2. Navigate to the project directory:
```bash
cd /{local_path_to_repo}/simple_container
```

3. Start the containerized services using Docker Compose:
```bash
docker-compose up
```

The services will be built automatically on first run. Subsequent runs will use cached images unless you force a rebuild with `--build`.

4. Open your browser and navigate to:
```
http://localhost:3000
```

5. Click the button to fetch the current temperature reading from the API

### API Endpoints

- `GET /random` - Returns the current temperature reading (from the physical sensor, or a synthetic fallback)
  ```json
  { "number": 22 }
  ```

- `GET /health` - Health check endpoint
  ```json
  { "status": "ok" }
  ```

### Stopping the Application

Press `Ctrl+C` in the terminal, or run:
```bash
docker-compose down
```

### Project Structure

```
simple_container/
├── sensor-driver/          # native, NOT containerized (physical/Integration layer)
│   ├── driver.js
│   └── package.json
├── web-app/
│   ├── Dockerfile
│   ├── .env
│   ├── package.json
│   ├── server.js
│   └── public/
│       └── index.html
├── api-app/
│   ├── Dockerfile
│   ├── .env
│   ├── package.json
│   └── server.js
└── docker-compose.yml
```

## Features

- **Physical-to-Digital Bridge**: A native sensor driver feeds readings into the containerized application, illustrating the boundary between the physical view and the container view
- **Service-to-Service Communication**: Web app communicates with API through Docker network
- **Containerized**: The digital part of the application runs in separate Docker containers
- **Easy Setup**: Single command to start the containerized services; the sensor driver runs independently
- **Modern UI**: Beautiful, responsive interface for the web application
