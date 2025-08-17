# Multiplayer Snake Game - Backend

This is the backend API server for the multiplayer Snake game. It handles game logic, room management, and real-time communication via Socket.io.

## Features

- Real-time multiplayer game sessions
- Room-based game management
- Socket.io for real-time communication
- RESTful health check endpoint
- CORS configuration for separate frontend deployment

## Environment Variables

- `PORT` - Server port (default: 3000)
- `NODE_ENV` - Environment (development/production)
- `FRONTEND_URL` - Frontend URL for CORS (required in production)

## Development

```bash
npm install
npm run dev  # Uses nodemon for auto-restart
```

## Production

```bash
npm install
npm start
```

## API Endpoints

- `GET /health` - Health check endpoint
- Socket.io events for game communication

## Deployment on Render

This backend is configured to deploy automatically via the root `render.yaml` file. It will:

1. Install dependencies
2. Start the server on the assigned port
3. Configure CORS for the frontend service
4. Provide health checks for monitoring