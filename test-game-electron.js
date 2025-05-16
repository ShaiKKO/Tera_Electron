/**
 * TerraFlux - Game Integration Test for Electron
 * 
 * This script demonstrates the integration between the Electron process
 * and the game engine running in the renderer process.
 */

const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const fs = require('fs');
const { log } = require('./electron/error-handling/logger');

// Keep a global reference to prevent garbage collection
let mainWindow;

// Game state tracking
let gameState = {
  state: 'uninitialized',
  lastStats: null,
  errors: []
};

/**
 * Create the main application window
 */
function createMainWindow() {
  // Create browser window
  mainWindow = new BrowserWindow({
    width: 1024,
    height: 768,
    title: 'TerraFlux Game Test',
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'electron/preload.js')
    }
  });

  // Load HTML content
  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>TerraFlux Game Test</title>
      <style>
        body {
          font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
          padding: 0;
          margin: 0;
          background-color: #f5f5f5;
          color: #333;
          overflow: hidden;
        }
        #controls {
          padding: 10px;
          background-color: #333;
          color: white;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        button {
          background-color: #4CAF50;
          color: white;
          border: none;
          padding: 8px 16px;
          margin: 0 5px;
          border-radius: 4px;
          cursor: pointer;
          transition: background-color 0.3s;
        }
        button:hover {
          background-color: #45a049;
        }
        #status {
          padding: 10px;
          background-color: #eee;
          border-bottom: 1px solid #ddd;
          display: flex;
          justify-content: space-between;
        }
        #game-container {
          margin: 20px auto;
          width: 800px;
          height: 600px;
          border: 1px solid #ddd;
          background-color: #f0f0f0;
          position: relative;
        }
        #stats {
          position: absolute;
          top: 10px;
          left: 10px;
          background-color: rgba(0,0,0,0.5);
          color: white;
          padding: 5px 10px;
          border-radius: 4px;
          font-family: monospace;
          font-size: 12px;
          pointer-events: none;
        }
      </style>
    </head>
    <body>
      <div id="controls">
        <span>TerraFlux Game Test</span>
        <div>
          <button id="restart">Restart Game</button>
          <button id="toggle-debug">Toggle Debug</button>
          <button id="add-entity">Add Entity</button>
          <button id="clear-entities">Clear Entities</button>
        </div>
      </div>
      <div id="status">
        <div id="game-status">Game State: Initializing...</div>
        <div id="fps">FPS: --</div>
      </div>
      <div id="game-container">
        <div id="stats"></div>
      </div>

      <script>
        // Wait for game module to be available
        document.addEventListener('DOMContentLoaded', () => {
          const statusEl = document.getElementById('game-status');
          const fpsEl = document.getElementById('fps');
          const statsEl = document.getElementById('stats');

          // Track when the game has loaded
          let gameLoaded = false;
          let moduleCheckInterval = setInterval(() => {
            if (window.game) {
              clearInterval(moduleCheckInterval);
              gameLoaded = true;
              initializeControls();
              statusEl.textContent = 'Game State: Module loaded, awaiting initialization';
            }
          }, 100);

          // Initialize UI controls
          function initializeControls() {
            document.getElementById('restart').addEventListener('click', () => {
              console.log('Restarting game...');
              window.location.reload();
            });

            document.getElementById('toggle-debug').addEventListener('click', () => {
              if (window.game) {
                window.game.debug = !window.game.debug;
                console.log('Debug mode:', window.game.debug);
                window.electron.sendGameLog('Debug mode toggled: ' + window.game.debug);
              }
            });

            document.getElementById('add-entity').addEventListener('click', () => {
              if (window.gameExample) {
                const { entityManager } = window.game;
                const entity = entityManager.createEntity({ name: 'Random Entity' });
                const x = Math.random() * 760;
                const y = Math.random() * 560;
                const vx = (Math.random() - 0.5) * 200;
                const vy = (Math.random() - 0.5) * 200;
                
                entityManager.addComponent(entity.id, new window.PositionComponent(x, y));
                entityManager.addComponent(entity.id, new window.VelocityComponent(vx, vy));
                
                console.log('Added entity:', entity.name);
                window.electron.sendGameLog('Added entity: ' + entity.name);
              }
            });

            document.getElementById('clear-entities').addEventListener('click', () => {
              if (window.gameExample && window.game) {
                const { entityManager } = window.game;
                const entities = entityManager.getEntities();
                entities.forEach(entity => {
                  if (!entity.hasTag('player')) {
                    entityManager.destroyEntity(entity.id);
                  }
                });
                
                console.log('Cleared non-player entities');
                window.electron.sendGameLog('Cleared non-player entities');
              }
            });
          }

          // Update UI with game stats
          function updateStats(stats) {
            if (!stats) return;
            
            if (fpsEl) {
              fpsEl.textContent = \`FPS: \${stats.fps.toFixed(1)}\`;
            }
            
            if (statsEl) {
              statsEl.innerHTML = \`
                FPS: \${stats.fps.toFixed(1)}<br>
                Entities: \${stats.entityCount || 0}<br>
                Frame: \${stats.totalFrames}<br>
                Delta: \${(stats.deltaTime * 1000).toFixed(2)}ms
              \`;
            }
          }

          // Handle game state updates
          window.electron.onMessage('game:state', (state) => {
            statusEl.textContent = \`Game State: \${state}\`;
          });

          // Handle game stats updates
          window.electron.onMessage('game:stats', (stats) => {
            updateStats(stats);
          });
          
          // Handle game error messages
          window.electron.onMessage('game:error', (error) => {
            console.error('Game error:', error);
            statusEl.textContent = \`Game Error: \${error}\`;
            statusEl.style.color = 'red';
          });
        });
      </script>
    </body>
    </html>
  `;

  // Create a temporary HTML file
  const tempHtmlPath = path.join(__dirname, 'temp-game-test.html');
  fs.writeFileSync(tempHtmlPath, htmlContent);

  // Load the temporary HTML file
  mainWindow.loadFile(tempHtmlPath);

  // Initialize game when window is ready
  mainWindow.webContents.on('did-finish-load', () => {
    // Send game settings to renderer
    mainWindow.webContents.send('game:init', {
      debug: true,
      targetFPS: 60
    });
    
    log.info('Game test window loaded and initialized');
  });

  // Dev tools
  mainWindow.webContents.openDevTools();

  // Cleanup temp file when window is closed
  mainWindow.on('closed', () => {
    try {
      if (fs.existsSync(tempHtmlPath)) {
        fs.unlinkSync(tempHtmlPath);
      }
    } catch (err) {
      console.error('Error removing temp file:', err);
    }
    
    mainWindow = null;
  });
}

// App initialization
app.whenReady().then(() => {
  // Set up IPC event handlers
  setupIpcHandlers();
  
  // Create window
  createMainWindow();
  
  // macOS specific behavior
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createMainWindow();
    }
  });
});

// Quit app when all windows are closed (except on macOS)
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

/**
 * Set up IPC event handlers
 */
function setupIpcHandlers() {
  // Game state updates
  ipcMain.on('game:state', (event, state) => {
    gameState.state = state;
    log.info(`Game state updated: ${state}`);
    
    // Forward to all renderer processes
    BrowserWindow.getAllWindows().forEach(window => {
      if (!window.isDestroyed()) {
        window.webContents.send('game:state', state);
      }
    });
  });
  
  // Game stats updates
  ipcMain.on('game:stats', (event, stats) => {
    gameState.lastStats = stats;
    
    // Forward to all renderer processes
    BrowserWindow.getAllWindows().forEach(window => {
      if (!window.isDestroyed()) {
        window.webContents.send('game:stats', stats);
      }
    });
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
    
    // Forward to all renderer processes
    BrowserWindow.getAllWindows().forEach(window => {
      if (!window.isDestroyed()) {
        window.webContents.send('game:error', error);
      }
    });
  });
}
