// Game constants
const GRID_SIZE = 20;
const CANVAS_SIZE = 600;

// Game state
let socket;
let currentScreen = 'welcome';
let gameData = null;
let currentPlayer = null;
let currentRoom = null;
let isSinglePlayer = false;
let gameInterval = null;
let aiSnake = null;

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
    singlePlayerButton: document.getElementById('singlePlayerButton'),
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

// Canvas context
const ctx = elements.gameCanvas.getContext('2d');

// Initialize the game
function init() {
    // Initialize socket connection to backend
    const backendUrl = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
        ? 'http://localhost:3000'  // Development backend
        : 'https://multiplayer-snake-backend.onrender.com';  // Production backend
    
    console.log('Connecting to backend:', backendUrl);
    console.log('Current hostname:', window.location.hostname);
    
    socket = io(backendUrl, {
        transports: ['websocket', 'polling'],
        withCredentials: true,
        reconnection: true,
        reconnectionAttempts: 5,
        reconnectionDelay: 1000
    });
    
    // Set up event listeners
    setupEventListeners();
    setupSocketListeners();
    
    // Show welcome screen
    showScreen('welcome');
}

// Set up DOM event listeners
function setupEventListeners() {
    // Join game button
    elements.joinButton.addEventListener('click', joinGame);
    
    // Single player button
    elements.singlePlayerButton.addEventListener('click', startSinglePlayer);
    
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
        console.log('Connected to server');
        console.log('Socket ID:', socket.id);
        elements.errorMessage.style.display = 'none';
    });
    
    socket.on('connect_error', (error) => {
        console.error('Connection error:', error.message);
        console.error('Error type:', error.type);
        showError(`Failed to connect to server: ${error.message}. Please check if the backend is running.`);
    });
    
    socket.on('disconnect', (reason) => {
        console.log('Disconnected from server:', reason);
        if (reason === 'io server disconnect') {
            showError('Server disconnected you. Please refresh the page.');
        } else if (reason === 'transport close') {
            showError('Connection lost. Attempting to reconnect...');
        } else {
            showError('Connection lost. Please refresh the page.');
        }
    });
    
    socket.on('reconnect', (attemptNumber) => {
        console.log('Reconnected after', attemptNumber, 'attempts');
        showError('Reconnected to server!');
        setTimeout(() => {
            elements.errorMessage.style.display = 'none';
        }, 3000);
    });
    
    socket.on('reconnect_attempt', (attemptNumber) => {
        console.log('Reconnection attempt #', attemptNumber);
    });
    
    socket.on('reconnect_failed', () => {
        console.error('Failed to reconnect');
        showError('Failed to reconnect to server. Please refresh the page.');
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
    const playerName = elements.playerName.value.trim();
    const roomId = elements.roomId.value.trim() || generateRoomId();
    
    console.log('Attempting to join game:', { playerName, roomId });
    
    if (!playerName) {
        showError('Please enter your name');
        return;
    }
    
    // Check if socket is connected
    if (!socket || !socket.connected) {
        console.error('Socket is not connected');
        showError('Not connected to server. Please wait a moment and try again.');
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
    
    showScreen('waiting');
}

// Leave room function
function leaveRoom() {
    if (isSinglePlayer) {
        // Stop single player game
        if (gameInterval) {
            clearInterval(gameInterval);
        }
        isSinglePlayer = false;
    } else {
        // Disconnect from multiplayer
        socket.disconnect();
        socket.connect();
    }
    
    currentRoom = null;
    currentPlayer = null;
    gameData = null;
    
    showScreen('welcome');
}

// Play again function
function playAgain() {
    if (isSinglePlayer) {
        // Reset single player game
        initSinglePlayerGame();
        showScreen('game');
        startGameLoop();
    } else if (currentRoom && currentPlayer) {
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
    isSinglePlayer = false;
    
    if (gameInterval) {
        clearInterval(gameInterval);
    }
    
    showScreen('welcome');
}

// Generate random room ID
function generateRoomId() {
    return Math.random().toString(36).substr(2, 6).toUpperCase();
}

// Start single player game
function startSinglePlayer() {
    const playerName = elements.playerName.value.trim();
    
    if (!playerName) {
        showError('Please enter your name');
        return;
    }
    
    isSinglePlayer = true;
    currentPlayer = playerName;
    
    // Initialize single player game
    initSinglePlayerGame();
    
    // Show game screen directly
    showScreen('game');
    
    // Start the game loop
    startGameLoop();
}

// Initialize single player game data
function initSinglePlayerGame() {
    gameData = {
        players: [
            {
                id: 'player1',
                name: currentPlayer,
                snake: [{x: 5, y: 10}],
                direction: {x: 1, y: 0},
                score: 0,
                alive: true,
                color: '#ff6b6b'
            },
            {
                id: 'ai',
                name: 'AI Snake',
                snake: [{x: 25, y: 10}],
                direction: {x: -1, y: 0},
                score: 0,
                alive: true,
                color: '#4ecdc4'
            }
        ],
        food: generateFood(),
        gameState: 'playing'
    };
    
    // Update display
    elements.player1Name.textContent = gameData.players[0].name;
    elements.player2Name.textContent = gameData.players[1].name;
    elements.player1Points.textContent = '0';
    elements.player2Points.textContent = '0';
    elements.gameRoomId.textContent = 'Single Player';
}

// Generate food position
function generateFood() {
    let food;
    do {
        food = {
            x: Math.floor(Math.random() * 30),
            y: Math.floor(Math.random() * 30)
        };
    } while (isPositionOccupied(food));
    return food;
}

// Check if position is occupied by any snake
function isPositionOccupied(pos) {
    if (!gameData || !gameData.players) return false;
    
    for (let player of gameData.players) {
        for (let segment of player.snake) {
            if (segment.x === pos.x && segment.y === pos.y) {
                return true;
            }
        }
    }
    return false;
}

// Start game loop for single player
function startGameLoop() {
    if (gameInterval) {
        clearInterval(gameInterval);
    }
    
    gameInterval = setInterval(() => {
        if (gameData && gameData.gameState === 'playing') {
            updateSinglePlayerGame();
            renderGame();
        }
    }, 100); // 10 FPS
}

// Update single player game state
function updateSinglePlayerGame() {
    // Update player snake
    updateSnake(gameData.players[0]);
    
    // Update AI snake
    updateAISnake(gameData.players[1]);
    
    // Check collisions
    checkCollisions();
    
    // Update scores display
    updateGameDisplay();
    
    // Check game over
    checkGameOver();
}

// Update snake position
function updateSnake(player) {
    if (!player.alive) return;
    
    const head = {...player.snake[0]};
    head.x += player.direction.x;
    head.y += player.direction.y;
    
    // Check wall collision
    if (head.x < 0 || head.x >= 30 || head.y < 0 || head.y >= 30) {
        player.alive = false;
        return;
    }
    
    // Check self collision
    for (let segment of player.snake) {
        if (head.x === segment.x && head.y === segment.y) {
            player.alive = false;
            return;
        }
    }
    
    // Add new head
    player.snake.unshift(head);
    
    // Check food collision
    if (head.x === gameData.food.x && head.y === gameData.food.y) {
        player.score += 10;
        gameData.food = generateFood();
    } else {
        // Remove tail if no food eaten
        player.snake.pop();
    }
}

// Update AI snake with simple AI
function updateAISnake(aiPlayer) {
    if (!aiPlayer.alive) return;
    
    const head = aiPlayer.snake[0];
    const food = gameData.food;
    
    // Simple AI: move towards food
    let newDirection = {...aiPlayer.direction};
    
    // Horizontal movement
    if (food.x < head.x && aiPlayer.direction.x !== 1) {
        newDirection = {x: -1, y: 0};
    } else if (food.x > head.x && aiPlayer.direction.x !== -1) {
        newDirection = {x: 1, y: 0};
    } 
    // Vertical movement
    else if (food.y < head.y && aiPlayer.direction.y !== 1) {
        newDirection = {x: 0, y: -1};
    } else if (food.y > head.y && aiPlayer.direction.y !== -1) {
        newDirection = {x: 0, y: 1};
    }
    
    // Check if new direction is safe
    const testHead = {
        x: head.x + newDirection.x,
        y: head.y + newDirection.y
    };
    
    if (!isMoveSafe(testHead, aiPlayer)) {
        // Try alternative moves
        const alternatives = [
            {x: 0, y: -1}, {x: 1, y: 0}, {x: 0, y: 1}, {x: -1, y: 0}
        ];
        
        for (let alt of alternatives) {
            if ((alt.x !== -aiPlayer.direction.x || alt.y !== -aiPlayer.direction.y)) {
                const altHead = {
                    x: head.x + alt.x,
                    y: head.y + alt.y
                };
                if (isMoveSafe(altHead, aiPlayer)) {
                    newDirection = alt;
                    break;
                }
            }
        }
    }
    
    aiPlayer.direction = newDirection;
    updateSnake(aiPlayer);
}

// Check if move is safe for AI
function isMoveSafe(pos, player) {
    // Check walls
    if (pos.x < 0 || pos.x >= 30 || pos.y < 0 || pos.y >= 30) {
        return false;
    }
    
    // Check collision with any snake (including self)
    for (let p of gameData.players) {
        for (let segment of p.snake) {
            if (pos.x === segment.x && pos.y === segment.y) {
                return false;
            }
        }
    }
    
    return true;
}

// Check collisions between snakes
function checkCollisions() {
    const player1 = gameData.players[0];
    const player2 = gameData.players[1];
    
    if (!player1.alive || !player2.alive) return;
    
    // Check if players collide with each other
    const p1Head = player1.snake[0];
    const p2Head = player2.snake[0];
    
    // Check player1 head collision with player2 body
    for (let segment of player2.snake) {
        if (p1Head.x === segment.x && p1Head.y === segment.y) {
            player1.alive = false;
        }
    }
    
    // Check player2 head collision with player1 body
    for (let segment of player1.snake) {
        if (p2Head.x === segment.x && p2Head.y === segment.y) {
            player2.alive = false;
        }
    }
}

// Check if game is over
function checkGameOver() {
    const alivePlayers = gameData.players.filter(p => p.alive);
    
    if (alivePlayers.length <= 1) {
        gameData.gameState = 'gameOver';
        clearInterval(gameInterval);
        
        // Show game over screen
        showGameOverScreen();
    }
}

// Show game over screen for single player
function showGameOverScreen() {
    const winner = gameData.players.find(p => p.alive);
    const player = gameData.players[0];
    
    if (winner && winner.id === 'player1') {
        elements.gameOverTitle.textContent = '🎉 You Win!';
    } else if (player.score > gameData.players[1].score) {
        elements.gameOverTitle.textContent = '😊 Good Game!';
    } else {
        elements.gameOverTitle.textContent = '😢 Game Over!';
    }
    
    elements.gameOverStats.innerHTML = `
        <p><strong>${player.name}:</strong> ${player.score} points</p>
        <p><strong>AI Snake:</strong> ${gameData.players[1].score} points</p>
    `;
    
    showScreen('gameOver');
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
        
        if (isSinglePlayer) {
            // In single player mode, update direction directly
            const player = gameData.players[0];
            // Prevent 180 degree turns
            if ((direction.x !== -player.direction.x || direction.y !== -player.direction.y) &&
                (direction.x !== player.direction.x || direction.y !== player.direction.y)) {
                player.direction = direction;
            }
        } else {
            // In multiplayer mode, emit to server
            socket.emit('changeDirection', direction);
        }
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
    
    // Update title and add haptic feedback
    if (alivePlayers.length === 0) {
        elements.gameOverTitle.textContent = '💥 It\'s a Tie!';
        addHapticFeedback('medium');
    } else if (winner.name === currentPlayer) {
        elements.gameOverTitle.textContent = '🎉 You Won!';
        addHapticFeedback('success');
    } else {
        elements.gameOverTitle.textContent = '💀 You Lost!';
        addHapticFeedback('heavy');
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
    
    // Add haptic feedback for errors
    addHapticFeedback('error');
    
    // Auto-hide after 5 seconds
    setTimeout(() => {
        hideError();
    }, 5000);
}

// Hide error message
function hideError() {
    elements.errorMessage.classList.remove('show');
}

// Enhanced touch controls for mobile devices
function setupTouchControls() {
    let touchStartX = 0;
    let touchStartY = 0;
    let touchStartTime = 0;
    let isSwipeDetected = false;
    
    // Prevent default touch behaviors on game canvas
    elements.gameCanvas.addEventListener('touchstart', handleTouchStart, { passive: false });
    elements.gameCanvas.addEventListener('touchmove', handleTouchMove, { passive: false });
    elements.gameCanvas.addEventListener('touchend', handleTouchEnd, { passive: false });
    
    // Also add touch controls to the entire game screen for better accessibility
    const gameScreen = document.getElementById('gameScreen');
    gameScreen.addEventListener('touchstart', handleTouchStart, { passive: false });
    gameScreen.addEventListener('touchmove', handleTouchMove, { passive: false });
    gameScreen.addEventListener('touchend', handleTouchEnd, { passive: false });
    
    function handleTouchStart(e) {
        // Prevent zoom, scroll, and other default behaviors
        e.preventDefault();
        
        const touch = e.touches[0];
        touchStartX = touch.clientX;
        touchStartY = touch.clientY;
        touchStartTime = Date.now();
        isSwipeDetected = false;
        
        // Visual feedback - add a subtle highlight
        if (e.target === elements.gameCanvas) {
            elements.gameCanvas.style.filter = 'brightness(1.1)';
        }
    }
    
    function handleTouchMove(e) {
        e.preventDefault();
        
        // Detect if user is swiping (not just tapping)
        const touch = e.touches[0];
        const deltaX = Math.abs(touch.clientX - touchStartX);
        const deltaY = Math.abs(touch.clientY - touchStartY);
        
        if (deltaX > 10 || deltaY > 10) {
            isSwipeDetected = true;
        }
    }
    
    function handleTouchEnd(e) {
        e.preventDefault();
        
        // Remove visual feedback
        if (e.target === elements.gameCanvas) {
            elements.gameCanvas.style.filter = '';
        }
        
        if (currentScreen !== 'game' || !gameData || gameData.gameState !== 'playing') {
            return;
        }
        
        const touch = e.changedTouches[0];
        const deltaX = touch.clientX - touchStartX;
        const deltaY = touch.clientY - touchStartY;
        const touchDuration = Date.now() - touchStartTime;
        
        // Improved swipe detection
        const minSwipeDistance = 25; // Reduced for better sensitivity
        const maxTouchDuration = 500; // Maximum time for a swipe gesture
        
        // Only process swipes that are within reasonable time and distance
        if (touchDuration < maxTouchDuration && isSwipeDetected) {
            let direction = null;
            
            // Determine swipe direction with improved logic
            if (Math.abs(deltaX) > Math.abs(deltaY)) {
                // Horizontal swipe
                if (Math.abs(deltaX) > minSwipeDistance) {
                    direction = deltaX > 0 ? { x: 1, y: 0 } : { x: -1, y: 0 };
                }
            } else {
                // Vertical swipe
                if (Math.abs(deltaY) > minSwipeDistance) {
                    direction = deltaY > 0 ? { x: 0, y: 1 } : { x: 0, y: -1 };
                }
            }
            
            if (direction) {
                if (isSinglePlayer) {
                    // In single player mode, update direction directly
                    const player = gameData.players[0];
                    // Prevent 180 degree turns
                    if ((direction.x !== -player.direction.x || direction.y !== -player.direction.y) &&
                        (direction.x !== player.direction.x || direction.y !== player.direction.y)) {
                        player.direction = direction;
                    }
                } else {
                    // In multiplayer mode, emit to server
                    socket.emit('changeDirection', direction);
                }
                
                // Enhanced haptic feedback
                addHapticFeedback('light');
                
                // Visual feedback for direction change
                showDirectionFeedback(direction);
            }
        }
    }
}

// Show visual feedback for direction changes
function showDirectionFeedback(direction) {
    const feedback = document.createElement('div');
    feedback.className = 'direction-feedback';
    
    // Determine arrow based on direction
    let arrow = '';
    if (direction.x === 1) arrow = '→';
    else if (direction.x === -1) arrow = '←';
    else if (direction.y === 1) arrow = '↓';
    else if (direction.y === -1) arrow = '↑';
    
    feedback.textContent = arrow;
    feedback.style.cssText = `
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        font-size: 3rem;
        color: #4ecdc4;
        pointer-events: none;
        z-index: 1000;
        animation: directionPulse 0.5s ease-out;
        text-shadow: 2px 2px 4px rgba(0,0,0,0.3);
    `;
    
    document.body.appendChild(feedback);
    
    // Remove after animation
    setTimeout(() => {
        if (feedback.parentNode) {
            feedback.parentNode.removeChild(feedback);
        }
    }, 500);
}

// Create on-screen directional buttons for mobile
function createMobileControls() {
    // Check if we're on a mobile device
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) || 
                    (navigator.maxTouchPoints && navigator.maxTouchPoints > 2);
    
    if (!isMobile) return;
    
    const gameScreen = document.getElementById('gameScreen');
    const controlsContainer = document.createElement('div');
    controlsContainer.className = 'mobile-controls';
    controlsContainer.innerHTML = `
        <div class="control-pad">
            <button class="control-btn up-btn" data-direction="up">↑</button>
            <div class="horizontal-controls">
                <button class="control-btn left-btn" data-direction="left">←</button>
                <button class="control-btn right-btn" data-direction="right">→</button>
            </div>
            <button class="control-btn down-btn" data-direction="down">↓</button>
        </div>
    `;
    
    // Insert before game controls
    const gameControls = gameScreen.querySelector('.game-controls');
    gameScreen.insertBefore(controlsContainer, gameControls);
    
    // Add event listeners to control buttons
    const controlButtons = controlsContainer.querySelectorAll('.control-btn');
    controlButtons.forEach(button => {
        button.addEventListener('touchstart', (e) => {
            e.preventDefault();
            e.stopPropagation();
            
            if (currentScreen !== 'game' || !gameData || gameData.gameState !== 'playing') {
                return;
            }
            
            const direction = button.dataset.direction;
            let directionVector = null;
            
            switch (direction) {
                case 'up': directionVector = { x: 0, y: -1 }; break;
                case 'down': directionVector = { x: 0, y: 1 }; break;
                case 'left': directionVector = { x: -1, y: 0 }; break;
                case 'right': directionVector = { x: 1, y: 0 }; break;
            }
            
            if (directionVector) {
                if (isSinglePlayer) {
                    // In single player mode, update direction directly
                    const player = gameData.players[0];
                    // Prevent 180 degree turns
                    if ((directionVector.x !== -player.direction.x || directionVector.y !== -player.direction.y) &&
                        (directionVector.x !== player.direction.x || directionVector.y !== player.direction.y)) {
                        player.direction = directionVector;
                    }
                } else {
                    // In multiplayer mode, emit to server
                    socket.emit('changeDirection', directionVector);
                }
                
                // Visual feedback
                button.classList.add('pressed');
                setTimeout(() => button.classList.remove('pressed'), 200);
                
                // Enhanced haptic feedback
                addHapticFeedback('light');
            }
        });
        
        // Prevent context menu on long press
        button.addEventListener('contextmenu', (e) => e.preventDefault());
    });
}

// Initialize the game when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    init();
    setupTouchControls();
    createMobileControls();
    adjustCanvasSize();
    optimizeTouchArea();
    preventZoomGestures();
    enhanceMobileUI();
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
    adjustCanvasSize();
});

// Adjust canvas size for mobile devices
function adjustCanvasSize() {
    const canvas = elements.gameCanvas;
    const container = canvas.parentElement;
    
    // Get the container's available width
    const containerWidth = container.clientWidth;
    const maxCanvasSize = Math.min(containerWidth - 40, 600); // 20px padding on each side
    
    // Update canvas display size while maintaining aspect ratio
    canvas.style.width = maxCanvasSize + 'px';
    canvas.style.height = maxCanvasSize + 'px';
    
    // Ensure the canvas maintains its internal resolution
    const scale = maxCanvasSize / CANVAS_SIZE;
    canvas.style.imageRendering = scale < 1 ? 'pixelated' : 'auto';
}

// Optimize touch area for better mobile interaction
function optimizeTouchArea() {
    const canvas = elements.gameCanvas;
    
    // Add padding around canvas for easier touch interaction
    canvas.style.padding = '10px';
    canvas.style.margin = '10px';
    
    // Improve visual feedback for touch
    canvas.style.transition = 'filter 0.1s ease';
}

// Prevent zoom gestures and improve mobile experience
function preventZoomGestures() {
    // Prevent pinch-to-zoom
    document.addEventListener('gesturestart', (e) => e.preventDefault());
    document.addEventListener('gesturechange', (e) => e.preventDefault());
    document.addEventListener('gestureend', (e) => e.preventDefault());
    
    // Prevent double-tap zoom on specific elements
    const preventZoomElements = [
        elements.gameCanvas,
        document.querySelector('.mobile-controls'),
        document.querySelector('.game-container')
    ];
    
    preventZoomElements.forEach(element => {
        if (element) {
            element.addEventListener('touchend', (e) => {
                // Prevent default only for game-related elements during gameplay
                if (currentScreen === 'game') {
                    e.preventDefault();
                }
            });
        }
    });
    
    // Add meta tag to prevent zoom if not already present
    const viewport = document.querySelector('meta[name=viewport]');
    if (viewport && !viewport.content.includes('user-scalable=no')) {
        viewport.content += ', user-scalable=no';
    }
}

// Add haptic feedback support
function addHapticFeedback(type = 'light') {
    // Modern Vibration API
    if (navigator.vibrate) {
        switch (type) {
            case 'light':
                navigator.vibrate(25);
                break;
            case 'medium':
                navigator.vibrate(50);
                break;
            case 'heavy':
                navigator.vibrate([50, 25, 50]);
                break;
            case 'error':
                navigator.vibrate([100, 50, 100, 50, 100]);
                break;
            case 'success':
                navigator.vibrate([25, 25, 25]);
                break;
        }
    }
    
    // iOS Haptic Feedback (if available)
    if (window.DeviceMotionEvent && typeof DeviceMotionEvent.requestPermission === 'function') {
        // This is a basic implementation - iOS haptic feedback requires more complex setup
        console.log('iOS haptic feedback would trigger here');
    }
}

// Enhanced mobile UI improvements
function enhanceMobileUI() {
    // Add mobile-specific classes to body
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) || 
                    (navigator.maxTouchPoints && navigator.maxTouchPoints > 2);
    
    if (isMobile) {
        document.body.classList.add('mobile-device');
        
        // Improve button sizes for touch
        const buttons = document.querySelectorAll('.btn');
        buttons.forEach(button => {
            button.style.minHeight = '50px';
            button.style.minWidth = '120px';
        });
        
        // Improve input field sizes
        const inputs = document.querySelectorAll('input');
        inputs.forEach(input => {
            input.style.minHeight = '50px';
            input.style.fontSize = '16px'; // Prevents zoom on iOS
        });
        
        // Add visual indicators for touch interactions
        const touchElements = document.querySelectorAll('.btn, .control-btn, input');
        touchElements.forEach(element => {
            element.addEventListener('touchstart', () => {
                element.style.transform = 'scale(0.98)';
            });
            
            element.addEventListener('touchend', () => {
                element.style.transform = '';
            });
        });
    }
}