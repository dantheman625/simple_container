# Simple Container Demo

A demo application with two Node.js services running in Docker containers:

## Services

### Web App (Port 3000)
- Express.js server serving a static UI
- Modern responsive interface with a button to request random numbers
- Makes HTTP requests to the API service (uses `http://api-app:3001` inside containers)

### API App (Port 3001)
- Simple Express.js API with no UI
- Provides a `/random` endpoint that returns a random number between 1-100 **and stores each value in MongoDB**
- `/health` endpoint for monitoring
- CORS enabled to allow requests from the web app
- Uses Mongoose ODM, connects via `MONGO_URI` environment variable

### MongoDB
- Runs as a separate container on the same Docker network
- Persists data in a named volume (`mongo-data`)
- The API service saves each generated number with a timestamp

## Getting Started

### Prerequisites
- Docker
- Docker Compose

### Running the Application

1. Navigate to the project directory:
```bash
cd /Users/daniellocher/ProgrammingProjects/simple_container
```

2. Start both services using Docker Compose:
```bash
docker-compose up
```

The services will be built automatically on first run. Subsequent runs will use cached images unless you force a rebuild with `--build`.

3. Open your browser and navigate to:
```
http://localhost:3000
```

4. Click the "Get Random Number" button to fetch a random number from the API

### API Endpoints

- `GET /random` - Returns a random number between 1-100
  ```json
  { "number": 45 }
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
├── web-app/
│   ├── Dockerfile
│   ├── package.json
│   ├── server.js
│   └── public/
│       └── index.html
├── api-app/
│   ├── Dockerfile
│   ├── package.json
│   └── server.js
└── docker-compose.yml
```

## Features

- **Service-to-Service Communication**: Web app communicates with API through Docker network
- **Containerized**: Both applications run in separate Docker containers
- **Easy Setup**: Single command to start both services
- **Modern UI**: Beautiful, responsive interface for the web application
