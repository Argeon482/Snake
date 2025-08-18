// Test script to simulate join button functionality
const jsdom = require('jsdom');
const { JSDOM } = jsdom;
const fs = require('fs');

// Read the HTML and JS files
const html = fs.readFileSync('/workspace/public/index.html', 'utf8');
const gameJS = fs.readFileSync('/workspace/public/game.js', 'utf8');

// Create a DOM environment
const dom = new JSDOM(html, {
    url: 'http://localhost:3000',
    resources: 'usable',
    runScripts: 'dangerously'
});

const { window } = dom;
const { document } = window;

// Add console methods for debugging
global.console = console;
window.console = console;

// Mock Socket.io
window.io = () => {
    const mockSocket = {
        connected: false,
        id: 'test-socket-id',
        on: (event, callback) => {
            console.log(`Socket event listener added: ${event}`);
            if (event === 'connect') {
                setTimeout(() => {
                    mockSocket.connected = true;
                    callback();
                }, 100);
            }
        },
        emit: (event, data) => {
            console.log(`Socket event emitted: ${event}`, data);
        },
        connect: () => {
            console.log('Socket connect called');
            mockSocket.connected = true;
        },
        disconnect: () => {
            console.log('Socket disconnect called');
            mockSocket.connected = false;
        }
    };
    return mockSocket;
};

// Execute the game JavaScript
const script = document.createElement('script');
script.textContent = gameJS;
document.head.appendChild(script);

// Wait for DOM content loaded
setTimeout(() => {
    console.log('Testing join button functionality...');
    
    // Check if elements exist
    const joinButton = document.getElementById('joinButton');
    const playerNameInput = document.getElementById('playerName');
    const roomIdInput = document.getElementById('roomId');
    
    console.log('Elements found:');
    console.log('- joinButton:', !!joinButton);
    console.log('- playerName:', !!playerNameInput);
    console.log('- roomId:', !!roomIdInput);
    
    if (joinButton && playerNameInput) {
        // Set a test player name
        playerNameInput.value = 'TestPlayer';
        
        // Simulate button click
        console.log('Simulating button click...');
        const clickEvent = new window.Event('click', { bubbles: true });
        joinButton.dispatchEvent(clickEvent);
        
        console.log('Button click simulation completed');
    } else {
        console.error('Required elements not found!');
    }
}, 500);