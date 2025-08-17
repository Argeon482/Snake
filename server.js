const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app);

// Configure socket.io for production
const io = socketIo(server, {
    cors: {
        origin: process.env.NODE_ENV === 'production' 
            ? false  // Same origin in production
            : "http://localhost:3000",
        methods: ["GET", "POST"]
    },
    transports: ['websocket', 'polling']  // Ensure both transports are available
});

const PORT = process.env.PORT || 3000;
const NODE_ENV = process.env.NODE_ENV || 'development';

// Serve static files
app.use(express.static(path.join(__dirname, 'public')));

// Health check endpoint for Render
app.get('/health', (req, res) => {
    res.status(200).json({ 
        status: 'healthy',
        uptime: process.uptime(),
        timestamp: new Date().toISOString(),
        environment: NODE_ENV
    });
});

// Game state
const gameRooms = new Map();
const GRID_SIZE = 20;
const CANVAS_SIZE = 600;

class GameRoom {
    constructor(roomId) {
        this.roomId = roomId;
        this.players = new Map();
        this.gameState = 'waiting'; // waiting, playing, gameOver
        this.food = this.generateFood();
        this.gameLoop = null;
    }

    addPlayer(socketId, playerName) {
        const playerNumber = this.players.size + 1;
        if (playerNumber > 2) return false; // Max 2 players

        const startPositions = [
            { x: 5, y: 15 }, // Player 1
            { x: 25, y: 15 } // Player 2
        ];

        const colors = ['#ff6b6b', '#4ecdc4'];

        const player = {
            id: socketId,
            name: playerName,
            number: playerNumber,
            snake: [startPositions[playerNumber - 1]],
            direction: { x: 1, y: 0 },
            color: colors[playerNumber - 1],
            score: 0,
            alive: true
        };

        this.players.set(socketId, player);
        return true;
    }

    removePlayer(socketId) {
        this.players.delete(socketId);
        if (this.players.size === 0) {
            this.stopGame();
        }
    }

    generateFood() {
        return {
            x: Math.floor(Math.random() * (CANVAS_SIZE / GRID_SIZE)),
            y: Math.floor(Math.random() * (CANVAS_SIZE / GRID_SIZE))
        };
    }

    startGame() {
        if (this.players.size === 2 && this.gameState === 'waiting') {
            this.gameState = 'playing';
            this.gameLoop = setInterval(() => {
                this.updateGame();
            }, 150);
        }
    }

    updateGame() {
        if (this.gameState !== 'playing') return;

        let alivePlayers = 0;
        
        for (let [socketId, player] of this.players) {
            if (!player.alive) continue;

            // Move snake
            const head = { ...player.snake[0] };
            head.x += player.direction.x;
            head.y += player.direction.y;

            // Check wall collision
            if (head.x < 0 || head.x >= CANVAS_SIZE / GRID_SIZE || 
                head.y < 0 || head.y >= CANVAS_SIZE / GRID_SIZE) {
                player.alive = false;
                continue;
            }

            // Check self collision
            if (player.snake.some(segment => segment.x === head.x && segment.y === head.y)) {
                player.alive = false;
                continue;
            }

            // Check collision with other player
            for (let [otherSocketId, otherPlayer] of this.players) {
                if (otherSocketId !== socketId && otherPlayer.alive) {
                    if (otherPlayer.snake.some(segment => segment.x === head.x && segment.y === head.y)) {
                        player.alive = false;
                        break;
                    }
                }
            }

            if (!player.alive) continue;

            player.snake.unshift(head);

            // Check food collision
            if (head.x === this.food.x && head.y === this.food.y) {
                player.score += 10;
                this.food = this.generateFood();
            } else {
                player.snake.pop();
            }

            alivePlayers++;
        }

        // Check game over conditions
        if (alivePlayers <= 1) {
            this.gameState = 'gameOver';
            this.stopGame();
        }
    }

    stopGame() {
        if (this.gameLoop) {
            clearInterval(this.gameLoop);
            this.gameLoop = null;
        }
    }

    changeDirection(socketId, newDirection) {
        const player = this.players.get(socketId);
        if (!player || !player.alive) return;

        // Prevent reverse direction
        const currentDir = player.direction;
        if ((newDirection.x === -currentDir.x && newDirection.y === currentDir.y) ||
            (newDirection.y === -currentDir.y && newDirection.x === currentDir.x)) {
            return;
        }

        player.direction = newDirection;
    }

    getGameData() {
        return {
            players: Array.from(this.players.values()),
            food: this.food,
            gameState: this.gameState
        };
    }
}

// Socket.io connection handling
io.on('connection', (socket) => {
    console.log('User connected:', socket.id);

    socket.on('joinRoom', (data) => {
        const { roomId, playerName } = data;
        
        if (!gameRooms.has(roomId)) {
            gameRooms.set(roomId, new GameRoom(roomId));
        }

        const room = gameRooms.get(roomId);
        const joined = room.addPlayer(socket.id, playerName);

        if (joined) {
            socket.join(roomId);
            socket.roomId = roomId;
            
            io.to(roomId).emit('playerJoined', {
                players: Array.from(room.players.values()),
                playerCount: room.players.size
            });

            // Start game if 2 players
            if (room.players.size === 2) {
                room.startGame();
            }

            // Send initial game state
            socket.emit('gameState', room.getGameData());
        } else {
            socket.emit('roomFull');
        }
    });

    socket.on('changeDirection', (direction) => {
        if (socket.roomId) {
            const room = gameRooms.get(socket.roomId);
            if (room) {
                room.changeDirection(socket.id, direction);
            }
        }
    });

    socket.on('disconnect', () => {
        console.log('User disconnected:', socket.id);
        
        if (socket.roomId) {
            const room = gameRooms.get(socket.roomId);
            if (room) {
                room.removePlayer(socket.id);
                
                if (room.players.size === 0) {
                    gameRooms.delete(socket.roomId);
                } else {
                    io.to(socket.roomId).emit('playerLeft', {
                        players: Array.from(room.players.values()),
                        playerCount: room.players.size
                    });
                }
            }
        }
    });
});

// Game update broadcast
setInterval(() => {
    for (let [roomId, room] of gameRooms) {
        if (room.gameState === 'playing') {
            io.to(roomId).emit('gameState', room.getGameData());
        }
    }
}, 100);

server.listen(PORT, () => {
    console.log(`🐍 Snake Game Server running on port ${PORT}`);
    console.log(`📍 Environment: ${NODE_ENV}`);
    console.log(`🎮 Game rooms: ${gameRooms.size}`);
    if (NODE_ENV === 'production') {
        console.log('🚀 Running in production mode');
    }
});

// Graceful shutdown
process.on('SIGTERM', () => {
    console.log('SIGTERM received, shutting down gracefully...');
    server.close(() => {
        console.log('Server closed');
        process.exit(0);
    });
});