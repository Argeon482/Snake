# Multiplayer Snake Game - Frontend

This is the frontend client for the multiplayer Snake game. It's a static HTML/CSS/JavaScript application that connects to the backend API via Socket.io.

## Features

- Responsive game interface
- Real-time multiplayer gameplay
- Room creation and joining
- Game statistics and scoring
- Mobile-friendly controls

## Development

For local development, you can serve the files using any static server:

```bash
# Using Node.js (recommended for consistency with production)
npm install
npm start

# Or using Python
python3 -m http.server 8080

# Or using any other static server
```

The frontend will automatically connect to:
- `http://localhost:3000` in development
- The production backend URL when deployed

## Production

The frontend includes a simple Express server for production deployment:

```bash
npm install
npm start
```

## Configuration

The backend URL is automatically determined based on the environment:

- **Development**: `http://localhost:3000`
- **Production**: `https://multiplayer-snake-backend.onrender.com`

To change the production backend URL, update the `backendUrl` variable in `game.js`.

## Deployment on Render

This frontend is configured to deploy automatically via the root `render.yaml` file. It will:

1. Install dependencies
2. Start the Express static server
3. Serve all static files (HTML, CSS, JS)
4. Provide health checks for monitoring

## Files

- `index.html` - Main game interface
- `game.js` - Game logic and Socket.io client
- `style.css` - Game styling
- `server.js` - Production static server