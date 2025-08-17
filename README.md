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

## 🛠️ Local Development

### Prerequisites

- Node.js (version 14 or higher)
- npm

### Installation

1. Clone the repository:
```bash
git clone <your-repo-url>
cd multiplayer-snake-game
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm run dev
```

4. Open your browser and navigate to `http://localhost:3000`

## 🌐 Deployment on Render

### Automatic Deployment

1. **Fork this repository** to your GitHub account

2. **Create a new Web Service** on [Render](https://render.com):
   - Go to your Render dashboard
   - Click "New" → "Web Service"
   - Connect your GitHub repository
   - Select the forked repository

3. **Configure the service**:
   - **Name**: `multiplayer-snake-game` (or your preferred name)
   - **Environment**: `Node`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - **Plan**: Free (or paid for better performance)

4. **Deploy**:
   - Click "Create Web Service"
   - Render will automatically deploy your application
   - You'll get a URL like `https://your-app-name.onrender.com`

### Manual Deployment

If you prefer to deploy manually:

1. Install the Render CLI:
```bash
npm install -g @render/cli
```

2. Login to Render:
```bash
render login
```

3. Create a `render.yaml` file (optional):
```yaml
services:
  - type: web
    name: multiplayer-snake-game
    env: node
    buildCommand: npm install
    startCommand: npm start
    plan: free
```

4. Deploy:
```bash
render deploy
```

## 📁 Project Structure

```
multiplayer-snake-game/
├── public/
│   ├── index.html      # Main HTML file
│   ├── style.css       # Styles and responsive design
│   └── game.js         # Client-side game logic
├── server.js           # Express server and Socket.io setup
├── package.json        # Dependencies and scripts
└── README.md          # This file
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
You can modify player colors in `server.js`:
```javascript
const colors = ['#ff6b6b', '#4ecdc4']; // Player 1: Red, Player 2: Teal
```

### Game Speed
Adjust game speed in `server.js`:
```javascript
this.gameLoop = setInterval(() => {
    this.updateGame();
}, 150); // 150ms = ~6.7 FPS, decrease for faster gameplay
```

### Canvas Size
Modify canvas and grid size in both `server.js` and `game.js`:
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
