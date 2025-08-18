// Game constants
const GRID_SIZE = 20;
const CANVAS_SIZE = 600;

// Game state
let socket;
let currentScreen = 'welcome';
let gameData = null;
let currentPlayer = null;
let currentRoom = null;

// DOM elements
const screens = {
    welcome: document.getElementById('welcomeScreen'),
    waiting: document.getElementById('waitingScreen'),
    game: document.getElementById('gameScreen'),
    gameOver: document.getElementById('gameOverScreen')
};

const elements = {
    playerName: document.getElementById('playerName'),
    roomId: document.getElementById('roomId'),
    joinButton: document.getElementById('joinButton'),
    leaveRoomButton: document.getElementById('leaveRoomButton'),
    currentRoomId: document.getElementById('currentRoomId'),
    gameRoomId: document.getElementById('gameRoomId'),
    player1Status: document.getElementById('player1Status'),
    player2Status: document.getElementById('player2Status'),
    player1Name: document.getElementById('player1Name'),
    player2Name: document.getElementById('player2Name'),
    player1Points: document.getElementById('player1Points'),
    player2Points: document.getElementById('player2Points'),
    gameCanvas: document.getElementById('gameCanvas'),
    gameOverTitle: document.getElementById('gameOverTitle'),
    gameOverStats: document.getElementById('gameOverStats'),
    playAgainButton: document.getElementById('playAgainButton'),
    newRoomButton: document.getElementById('newRoomButton'),
    errorMessage: document.getElementById('errorMessage'),
    errorText: document.getElementById('errorText'),
    closeError: document.getElementById('closeError')
};

// Canvas context - wrap in try-catch to prevent errors
let ctx;
try {
    ctx = elements.gameCanvas ? elements.gameCanvas.getContext('2d') : null;
    console.log('Canvas context initialized:', !!ctx);
} catch (error) {
    console.error('Error initializing canvas context:', error);
    ctx = null;
}

// Initialize the game
function init() {
    console.log('Initializing game...');
    
    // Check if all required elements exist
    console.log('Checking DOM elements...');
    for (const [key, element] of Object.entries(elements)) {
        if (!element) {
            console.error(`Element not found: ${key}`);
        } else {
            console.log(`Element found: ${key}`);
        }
    }
    
    // Initialize socket connection
    console.log('Initializing socket connection...');
    socket = io();
    
    // Set up event listeners
    console.log('Setting up event listeners...');
    setupEventListeners();
    setupSocketListeners();
    
    // Show welcome screen
    console.log('Showing welcome screen...');
    showScreen('welcome');
}

// Set up DOM event listeners
function setupEventListeners() {
    // Join game button
    console.log('Setting up join button event listener');
    console.log('Join button element:', elements.joinButton);
    elements.joinButton.addEventListener('click', (e) => {
        console.log('Join button clicked!');
        alert('Join button was clicked!'); // Temporary visual feedback
        e.preventDefault();
        joinGame();
    });
    
    // Leave room button
    elements.leaveRoomButton.addEventListener('click', leaveRoom);
    
    // Play again button
    elements.playAgainButton.addEventListener('click', playAgain);
    
    // New room button
    elements.newRoomButton.addEventListener('click', newRoom);
    
    // Close error button
    elements.closeError.addEventListener('click', hideError);
    
    // Enter key in input fields
    elements.playerName.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') joinGame();
    });
    
    elements.roomId.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') joinGame();
    });
    
    // Keyboard controls for game
    document.addEventListener('keydown', handleKeyPress);
}

// Set up Socket.io event listeners
function setupSocketListeners() {
    socket.on('connect', () => {
        console.log('Connected to server with socket ID:', socket.id);
    });
    
    socket.on('connect_error', (error) => {
        console.error('Connection error:', error);
        showError('Failed to connect to server. Please try again.');
    });
    
    socket.on('disconnect', () => {
        console.log('Disconnected from server');
        showError('Connection lost. Please refresh the page.');
    });
    
    socket.on('playerJoined', (data) => {
        updatePlayersList(data.players);
        
        if (data.playerCount === 2) {
            showScreen('game');
        }
    });
    
    socket.on('playerLeft', (data) => {
        updatePlayersList(data.players);
        
        if (currentScreen === 'game') {
            showScreen('waiting');
            showError('The other player left the game.');
        }
    });
    
    socket.on('gameState', (data) => {
        gameData = data;
        
        if (data.gameState === 'playing') {
            updateGameDisplay();
            renderGame();
        } else if (data.gameState === 'gameOver') {
            showGameOver();
        }
    });
    
    socket.on('roomFull', () => {
        showError('Room is full. Please try a different room.');
    });
    
    socket.on('error', (message) => {
        showError(message);
    });
}

// Join game function
function joinGame() {
    console.log('joinGame function called');
    alert('joinGame function was called!'); // Temporary visual feedback
    
    const playerName = elements.playerName.value.trim();
    const roomId = elements.roomId.value.trim() || generateRoomId();
    
    console.log('Player name:', playerName);
    console.log('Room ID:', roomId);
    console.log('Socket connected:', socket.connected);
    
    if (!playerName) {
        showError('Please enter your name');
        return;
    }
    
    currentRoom = roomId;
    currentPlayer = playerName;
    
    console.log('Emitting joinRoom event');
    socket.emit('joinRoom', {
        roomId: roomId,
        playerName: playerName
    });
    
    elements.currentRoomId.textContent = roomId;
    elements.gameRoomId.textContent = roomId;
    
    console.log('Switching to waiting screen');
    showScreen('waiting');
}

// Leave room function
function leaveRoom() {
    socket.disconnect();
    socket.connect();
    
    currentRoom = null;
    currentPlayer = null;
    gameData = null;
    
    showScreen('welcome');
}

// Play again function
function playAgain() {
    if (currentRoom && currentPlayer) {
        socket.emit('joinRoom', {
            roomId: currentRoom,
            playerName: currentPlayer
        });
        
        showScreen('waiting');
    }
}

// New room function
function newRoom() {
    elements.roomId.value = '';
    currentRoom = null;
    currentPlayer = null;
    gameData = null;
    
    showScreen('welcome');
}

// Generate random room ID
function generateRoomId() {
    return Math.random().toString(36).substr(2, 6).toUpperCase();
}

// Show screen function
function showScreen(screenName) {
    // Hide all screens
    Object.values(screens).forEach(screen => {
        screen.classList.remove('active');
    });
    
    // Show target screen
    screens[screenName].classList.add('active');
    currentScreen = screenName;
}

// Update players list
function updatePlayersList(players) {
    const player1Slot = elements.player1Status;
    const player2Slot = elements.player2Status;
    
    // Reset slots
    player1Slot.classList.remove('connected');
    player2Slot.classList.remove('connected');
    player1Slot.querySelector('.player-name').textContent = 'Waiting...';
    player2Slot.querySelector('.player-name').textContent = 'Waiting...';
    
    // Update with current players
    players.forEach((player, index) => {
        const slot = index === 0 ? player1Slot : player2Slot;
        slot.classList.add('connected');
        slot.querySelector('.player-name').textContent = player.name;
    });
}

// Update game display (scores)
function updateGameDisplay() {
    if (!gameData || !gameData.players) return;
    
    gameData.players.forEach((player, index) => {
        if (index === 0) {
            elements.player1Name.textContent = player.name;
            elements.player1Points.textContent = player.score;
        } else if (index === 1) {
            elements.player2Name.textContent = player.name;
            elements.player2Points.textContent = player.score;
        }
    });
}

// Render game on canvas
function renderGame() {
    if (!gameData) return;
    
    // Clear canvas
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);
    
    // Draw grid (optional, for visual appeal)
    ctx.strokeStyle = '#222';
    ctx.lineWidth = 1;
    for (let i = 0; i <= CANVAS_SIZE; i += GRID_SIZE) {
        ctx.beginPath();
        ctx.moveTo(i, 0);
        ctx.lineTo(i, CANVAS_SIZE);
        ctx.stroke();
        
        ctx.beginPath();
        ctx.moveTo(0, i);
        ctx.lineTo(CANVAS_SIZE, i);
        ctx.stroke();
    }
    
    // Draw food
    if (gameData.food) {
        ctx.fillStyle = '#ffeb3b';
        ctx.fillRect(
            gameData.food.x * GRID_SIZE + 2,
            gameData.food.y * GRID_SIZE + 2,
            GRID_SIZE - 4,
            GRID_SIZE - 4
        );
    }
    
    // Draw players
    gameData.players.forEach((player) => {
        if (!player.alive) return;
        
        ctx.fillStyle = player.color;
        
        player.snake.forEach((segment, index) => {
            // Make head slightly different
            if (index === 0) {
                ctx.fillStyle = player.color;
                ctx.fillRect(
                    segment.x * GRID_SIZE + 1,
                    segment.y * GRID_SIZE + 1,
                    GRID_SIZE - 2,
                    GRID_SIZE - 2
                );
                
                // Draw eyes on head
                ctx.fillStyle = '#fff';
                ctx.fillRect(
                    segment.x * GRID_SIZE + 4,
                    segment.y * GRID_SIZE + 4,
                    3, 3
                );
                ctx.fillRect(
                    segment.x * GRID_SIZE + GRID_SIZE - 7,
                    segment.y * GRID_SIZE + 4,
                    3, 3
                );
            } else {
                ctx.fillStyle = player.color;
                ctx.globalAlpha = 0.8 - (index * 0.05); // Fade tail
                ctx.fillRect(
                    segment.x * GRID_SIZE + 2,
                    segment.y * GRID_SIZE + 2,
                    GRID_SIZE - 4,
                    GRID_SIZE - 4
                );
            }
        });
        
        ctx.globalAlpha = 1; // Reset alpha
    });
}

// Handle keyboard input
function handleKeyPress(event) {
    if (currentScreen !== 'game' || !gameData || gameData.gameState !== 'playing') {
        return;
    }
    
    let direction = null;
    
    switch (event.key) {
        case 'ArrowUp':
        case 'w':
        case 'W':
            direction = { x: 0, y: -1 };
            break;
        case 'ArrowDown':
        case 's':
        case 'S':
            direction = { x: 0, y: 1 };
            break;
        case 'ArrowLeft':
        case 'a':
        case 'A':
            direction = { x: -1, y: 0 };
            break;
        case 'ArrowRight':
        case 'd':
        case 'D':
            direction = { x: 1, y: 0 };
            break;
    }
    
    if (direction) {
        event.preventDefault();
        socket.emit('changeDirection', direction);
    }
}

// Show game over screen
function showGameOver() {
    if (!gameData || !gameData.players) return;
    
    // Determine winner
    const alivePlayers = gameData.players.filter(player => player.alive);
    const winner = gameData.players.reduce((prev, current) => 
        (prev.score > current.score) ? prev : current
    );
    
    // Update title
    if (alivePlayers.length === 0) {
        elements.gameOverTitle.textContent = '💥 It\'s a Tie!';
    } else if (winner.name === currentPlayer) {
        elements.gameOverTitle.textContent = '🎉 You Won!';
    } else {
        elements.gameOverTitle.textContent = '💀 You Lost!';
    }
    
    // Update stats
    elements.gameOverStats.innerHTML = '';
    
    gameData.players
        .sort((a, b) => b.score - a.score)
        .forEach((player) => {
            const scoreDiv = document.createElement('div');
            scoreDiv.className = 'final-score';
            if (player.score === winner.score) {
                scoreDiv.classList.add('winner');
            }
            
            scoreDiv.innerHTML = `
                <span style="display: flex; align-items: center; gap: 10px;">
                    <span class="player-color" style="width: 20px; height: 20px; background: ${player.color}; border-radius: 3px;"></span>
                    ${player.name}
                </span>
                <span>${player.score} points</span>
            `;
            
            elements.gameOverStats.appendChild(scoreDiv);
        });
    
    showScreen('gameOver');
}

// Show error message
function showError(message) {
    elements.errorText.textContent = message;
    elements.errorMessage.classList.add('show');
    
    // Auto-hide after 5 seconds
    setTimeout(() => {
        hideError();
    }, 5000);
}

// Hide error message
function hideError() {
    elements.errorMessage.classList.remove('show');
}

// Touch controls for mobile (optional enhancement)
function setupTouchControls() {
    let touchStartX = 0;
    let touchStartY = 0;
    
    elements.gameCanvas.addEventListener('touchstart', (e) => {
        e.preventDefault();
        const touch = e.touches[0];
        touchStartX = touch.clientX;
        touchStartY = touch.clientY;
    });
    
    elements.gameCanvas.addEventListener('touchend', (e) => {
        e.preventDefault();
        
        if (currentScreen !== 'game' || !gameData || gameData.gameState !== 'playing') {
            return;
        }
        
        const touch = e.changedTouches[0];
        const deltaX = touch.clientX - touchStartX;
        const deltaY = touch.clientY - touchStartY;
        
        const minSwipeDistance = 30;
        
        if (Math.abs(deltaX) > Math.abs(deltaY)) {
            // Horizontal swipe
            if (Math.abs(deltaX) > minSwipeDistance) {
                if (deltaX > 0) {
                    socket.emit('changeDirection', { x: 1, y: 0 }); // Right
                } else {
                    socket.emit('changeDirection', { x: -1, y: 0 }); // Left
                }
            }
        } else {
            // Vertical swipe
            if (Math.abs(deltaY) > minSwipeDistance) {
                if (deltaY > 0) {
                    socket.emit('changeDirection', { x: 0, y: 1 }); // Down
                } else {
                    socket.emit('changeDirection', { x: 0, y: -1 }); // Up
                }
            }
        }
    });
}

// Initialize the game when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    init();
    setupTouchControls();
});

// Handle page visibility changes
document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
        // Page is hidden, you might want to pause the game or show a message
        console.log('Page hidden');
    } else {
        // Page is visible again
        console.log('Page visible');
    }
});

// Handle window resize for responsive canvas
window.addEventListener('resize', () => {
    // You could implement canvas resizing logic here if needed
    // For now, CSS handles the responsive behavior
});