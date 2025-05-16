/**
 * TerraFlux - Game IPC Handlers
 * 
 * Handles IPC communication between the Electron main process and the game
 * running in the renderer process.
 */

const { ipcMain, BrowserWindow } = require('electron');
const { log } = require('../../error-handling/logger');
const { createGenericHandler } = require('./index');

// Game state tracking
const gameState = {
  state: 'uninitialized',
  lastStats: null,
  errors: [],
  windows: new Set()
};

/**
 * Register game handlers for a window
 * @param {BrowserWindow} window - Electron browser window instance
 */
function registerGameWindow(window) {
  if (!window || window.isDestroyed()) return;
  
  // Track this window for game state updates
  gameState.windows.add(window.id);
  
  // Clean up when window is closed
  window.once('closed', () => {
    gameState.windows.delete(window.id);
  });
  
  // Initialize the game in the renderer process
  initializeGame(window);
}

/**
 * Initialize game in a window
 * @param {BrowserWindow} window - Electron browser window instance
 * @param {Object} config - Game configuration
 */
function initializeGame(window, config = {}) {
  if (!window || window.isDestroyed()) return;
  
  // Default game configuration
  const gameConfig = {
    debug: true,
    targetFPS: 60,
    ...config
  };
  
  // Send initialization event to renderer
  window.webContents.send('game:init', gameConfig);
  log.info(`Game initialization sent to window ${window.id}`);
}

/**
 * Send game state to all game windows
 * @param {string} channel - IPC channel
 * @param {any} data - Data to send
 */
function broadcastToGameWindows(channel, data) {
  BrowserWindow.getAllWindows().forEach(window => {
    if (!window.isDestroyed() && gameState.windows.has(window.id)) {
      window.webContents.send(channel, data);
    }
  });
}

/**
 * Register all game IPC handlers
 */
function registerGameHandlers() {
  // Game state updates
  ipcMain.on('game:state', (event, state) => {
    gameState.state = state;
    log.info(`Game state updated: ${state}`);
    
    // Forward to all game windows
    broadcastToGameWindows('game:state', state);
  });
  
  // Game stats updates
  ipcMain.on('game:stats', (event, stats) => {
    gameState.lastStats = stats;
    
    // Forward to all game windows
    broadcastToGameWindows('game:stats', stats);
  });
  
  // Game log messages
  ipcMain.on('game:log', (event, message) => {
    log.info(`Game: ${message}`);
  });
  
  // Game errors
  ipcMain.on('game:error', (event, error) => {
    gameState.errors.push({
      time: new Date(),
      error
    });
    
    log.error(`Game error: ${error}`);
    
    // Forward to all game windows
    broadcastToGameWindows('game:error', error);
  });
  
  // Register structured IPC handlers for game commands
  registerStructuredHandlers();
}

/**
 * Register structured IPC handlers using the standard protocol format
 */
function registerStructuredHandlers() {
  // Get current game state
  createGenericHandler('game:get-state', async (payload) => {
    return {
      state: gameState.state,
      stats: gameState.lastStats,
      errors: gameState.errors.slice(-10) // Return only the 10 most recent errors
    };
  });
  
  // Reset game
  createGenericHandler('game:reset', async (payload, sender) => {
    const window = BrowserWindow.fromWebContents(sender);
    if (window) {
      initializeGame(window, payload);
    }
    
    return { success: true };
  });
}

module.exports = {
  registerGameHandlers,
  registerGameWindow,
  initializeGame,
  gameState
};
