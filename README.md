# 🐍 Multiplayer Snake Game

A real-time multiplayer Snake game built with Node.js, Express, and Socket.io. Challenge your friends in this classic arcade game with modern web technologies!

## 🎮 Features

- **Real-time Multiplayer**: Play with a friend in real-time using WebSocket connections
- **Room System**: Create or join rooms with custom room IDs
- **Beautiful UI**: Modern, responsive design with smooth animations
- **Cross-platform**: Works on desktop and mobile devices
- **Live Scoring**: Real-time score updates and winner announcements
- **Collision Detection**: Accurate collision detection for walls, food, and other snakes
- **Smooth Controls**: Use arrow keys or WASD for movement

## 🚀 How to Play

1. Enter your name and optionally a room ID (leave empty for random)
2. Share the room ID with your friend
3. Once both players join, the game starts automatically
4. Use arrow keys or WASD to control your snake
5. Eat food (yellow circles) to grow and score points
6. Avoid walls and other snakes
7. Last snake standing wins!

## 🏗️ Architecture

This application is split into two separate services for deployment flexibility:

- **Backend** (`/backend`): Node.js/Express API server with Socket.io for real-time communication
- **Frontend** (`/frontend`): Static HTML/CSS/JavaScript client served via Express

## 🛠️ Local Development

### Prerequisites

- Node.js (version 18 or higher)
- npm

### Installation

1. Clone the repository:
```bash
git clone <your-repo-url>
cd multiplayer-snake-game
```

2. Install and start the backend:
```bash
cd backend
npm install
npm run dev
```

3. In a new terminal, install and start the frontend:
```bash
cd frontend
npm install
npm start
```

4. Open your browser and navigate to `http://localhost:8080`

The frontend will automatically connect to the backend running on `http://localhost:3000`.

## 🌐 Deployment on Render

This project is configured for automatic deployment of both frontend and backend services using the included `render.yaml` file.

### Automatic Deployment

1. **Fork this repository** to your GitHub account

2. **Create a new service** on [Render](https://render.com):
   - Go to your Render dashboard
   - Click "New" → "Blueprint"
   - Connect your GitHub repository
   - Select the forked repository

3. **Configure the services**:
   Render will automatically create two services based on `render.yaml`:
   - **Backend**: `multiplayer-snake-backend` - API server with Socket.io
   - **Frontend**: `multiplayer-snake-frontend` - Static site client

4. **Update URLs**:
   After deployment, update the backend URL in `frontend/game.js`:
   ```javascript
   // Replace 'your-backend-app.onrender.com' with your actual backend URL
   const backendUrl = 'https://your-actual-backend-app.onrender.com';
   ```

5. **Deploy**:
   - Click "Deploy" on the blueprint
   - Both services will be deployed automatically
   - You'll get separate URLs for frontend and backend

### Service URLs

After deployment, you'll have:
- **Frontend**: `https://your-frontend-app.onrender.com` (main game interface)
- **Backend**: `https://your-backend-app.onrender.com` (API server)

### Environment Variables

The backend automatically receives the frontend URL via Render's service linking. No manual configuration needed!

## 📁 Project Structure

```
multiplayer-snake-game/
├── backend/                    # Backend API Server
│   ├── server.js              # Express server and Socket.io setup
│   ├── package.json           # Backend dependencies
│   └── README.md              # Backend documentation
├── frontend/                   # Frontend Client
│   ├── index.html             # Main HTML file
│   ├── style.css              # Styles and responsive design
│   ├── game.js                # Client-side game logic
│   ├── server.js              # Static file server for production
│   ├── package.json           # Frontend dependencies
│   └── README.md              # Frontend documentation
├── render.yaml                # Render deployment configuration
├── package.json               # Root package.json (legacy)
└── README.md                  # This file
```

## 🎯 Game Logic

### Server Side
- **Room Management**: Creates and manages game rooms for up to 2 players
- **Game State**: Handles snake movement, collision detection, and food generation
- **Real-time Updates**: Broadcasts game state to all players in a room
- **Player Management**: Handles player connections, disconnections, and scoring

### Client Side
- **Canvas Rendering**: Smooth 60 FPS game rendering with HTML5 Canvas
- **Input Handling**: Responsive keyboard controls with prevention of reverse moves
- **UI Management**: Screen transitions and real-time score updates
- **Socket Communication**: Real-time communication with the game server

## 🎨 Customization

### Colors
You can modify player colors in `backend/server.js`:
```javascript
const colors = ['#ff6b6b', '#4ecdc4']; // Player 1: Red, Player 2: Teal
```

### Game Speed
Adjust game speed in `backend/server.js`:
```javascript
this.gameLoop = setInterval(() => {
    this.updateGame();
}, 150); // 150ms = ~6.7 FPS, decrease for faster gameplay
```

### Canvas Size
Modify canvas and grid size in both `backend/server.js` and `frontend/game.js`:
```javascript
const GRID_SIZE = 20;
const CANVAS_SIZE = 600;
```

## 🐛 Troubleshooting

### Common Issues

1. **Server won't start**:
   - Make sure Node.js is installed
   - Run `npm install` to install dependencies
   - Check if port 3000 is available

2. **Players can't connect**:
   - Ensure both players are using the same room ID
   - Check your internet connection
   - Verify the server is running

3. **Game feels laggy**:
   - This is normal on the free Render plan
   - Consider upgrading to a paid plan for better performance
   - Reduce game update frequency in the code

### Performance Tips

- The free Render plan may have cold starts and limited resources
- For production use, consider upgrading to a paid plan
- You can optimize by reducing the game update frequency
- Consider using a CDN for static assets

## 📄 License

This project is open source and available under the [MIT License](LICENSE).

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📞 Support

If you encounter any issues or have questions, please create an issue in the GitHub repository.

---

**Enjoy the game! 🐍🎮**
