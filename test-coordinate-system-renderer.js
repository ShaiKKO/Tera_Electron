/**
 * TerraFlux - Coordinate System and Rendering Test
 * 
 * This script demonstrates the integration between the coordinate system
 * and the rendering system using proper Electron architecture.
 */

const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const fs = require('fs');
// Use simple console logging instead of the project logger to avoid errors
const log = {
  info: (message) => console.log(`[INFO] ${message}`),
  error: (message) => console.error(`[ERROR] ${message}`)
};

// Keep a global reference to prevent garbage collection
let mainWindow;

/**
 * Create the main application window
 */
function createMainWindow() {
  // Create browser window
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 720,
    title: 'TerraFlux Coordinate System Test',
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'electron/preload.js')
    }
  });

  // Generate HTML content for the test window
  const htmlContent = generateHtmlContent();

  // Create a temporary HTML file
  const tempHtmlPath = path.join(__dirname, 'temp-coordinate-test.html');
  fs.writeFileSync(tempHtmlPath, htmlContent);

  // Load the temporary HTML file
  mainWindow.loadFile(tempHtmlPath);

  // Initialize the renderer when window is ready
  mainWindow.webContents.on('did-finish-load', () => {
    // Trigger game initialization in the renderer
    mainWindow.webContents.send('renderer:init', {
      debug: true,
      enableEffects: true,
      showGrid: true,
      showHex: true
    });
    
    log.info('Coordinate system test window loaded and initialized');
  });

  // Open DevTools in development
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

/**
 * Generate HTML content for the test window
 */
function generateHtmlContent() {
  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>TerraFlux Coordinate System Test</title>
  <style>
    body {
      font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
      padding: 0;
      margin: 0;
      background-color: #1a1a2e;
      color: #f0f0f0;
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
      background-color: #333;
      border-bottom: 1px solid #444;
      display: flex;
      justify-content: space-between;
    }
    #render-container {
      width: 100%;
      height: calc(100vh - 90px);
      position: relative;
      overflow: hidden;
    }
    #stats {
      position: absolute;
      top: 10px;
      left: 10px;
      background-color: rgba(0,0,0,0.7);
      color: white;
      padding: 5px 10px;
      border-radius: 4px;
      font-family: monospace;
      font-size: 12px;
      pointer-events: none;
    }
    #coordinate-info {
      position: absolute;
      bottom: 10px;
      right: 10px;
      background-color: rgba(0,0,0,0.7);
      color: white;
      padding: 5px 10px;
      border-radius: 4px;
      font-family: monospace;
      font-size: 12px;
    }
    .debug-overlay {
      position: absolute;
      top: 10px;
      right: 10px;
      background-color: rgba(0, 0, 0, 0.7);
      color: #ffffff;
      padding: 10px;
      border-radius: 5px;
      font-family: monospace;
      font-size: 12px;
      max-height: 300px;
      overflow-y: auto;
      max-width: 500px;
    }
  </style>
</head>
<body>
  <div id="controls">
    <span>TerraFlux Coordinate System Test</span>
    <div>
      <button id="toggle-grid">Toggle Grid</button>
      <button id="toggle-hex">Toggle Hex</button>
      <button id="toggle-debug">Toggle Debug</button>
      <button id="toggle-effects">Toggle Effects</button>
      <button id="cycle-view">Cycle View</button>
    </div>
  </div>
  <div id="status">
    <div id="render-status">Renderer: Initializing...</div>
    <div id="fps">FPS: --</div>
  </div>
  <div id="render-container">
    <div id="stats"></div>
    <div id="coordinate-info">Position: x: --, y: -- | Hex: q: --, r: --</div>
  </div>
  <div class="debug-overlay">
    <div id="debug-messages"></div>
  </div>

  <script>
    // Wait for game module to be available
    document.addEventListener('DOMContentLoaded', () => {
      const statusEl = document.getElementById('render-status');
      const fpsEl = document.getElementById('fps');
      const statsEl = document.getElementById('stats');
      const coordEl = document.getElementById('coordinate-info');
      const debugEl = document.getElementById('debug-messages');

      // Forward console logs to the debug overlay
      const originalConsoleLog = console.log;
      console.log = function() {
        originalConsoleLog.apply(console, arguments);
        
        const args = Array.from(arguments);
        const msg = document.createElement('div');
        msg.textContent = args.join(' ');
        
        debugEl.appendChild(msg);
        
        // Limit number of debug messages
        while (debugEl.children.length > 20) {
          debugEl.removeChild(debugEl.firstChild);
        }
        
        // Auto-scroll to bottom
        debugEl.parentElement.scrollTop = debugEl.parentElement.scrollHeight;
      };

      // Initialize controls when game is ready
      let gameReady = false;
      
      function initializeControls() {
        document.getElementById('toggle-grid').addEventListener('click', () => {
          window.electron.sendMessage('coordinate:toggleGrid');
        });

        document.getElementById('toggle-hex').addEventListener('click', () => {
          window.electron.sendMessage('coordinate:toggleHex');
        });

        document.getElementById('toggle-debug').addEventListener('click', () => {
          window.electron.sendMessage('coordinate:toggleDebug');
        });

        document.getElementById('toggle-effects').addEventListener('click', () => {
          window.electron.sendMessage('coordinate:toggleEffects');
        });

        document.getElementById('cycle-view').addEventListener('click', () => {
          window.electron.sendMessage('coordinate:cycleView');
        });
        
        // Track mouse movement
        document.getElementById('render-container').addEventListener('mousemove', (event) => {
          const containerRect = event.currentTarget.getBoundingClientRect();
          const x = event.clientX - containerRect.left;
          const y = event.clientY - containerRect.top;
          window.electron.sendMessageNoResponse('coordinate:mouseMove', { x, y });
        });
      }

      // Listen for renderer initialization
      window.electron.onMessage('renderer:init', () => {
        statusEl.textContent = 'Renderer: Ready';
        initializeControls();
        gameReady = true;
      });

      // Listen for coordinate updates
      window.electron.onMessage('coordinate:update', (data) => {
        if (coordEl) {
          coordEl.textContent = "Position: x: " + data.x.toFixed(0) + ", y: " + data.y.toFixed(0) + " | Hex: q: " + data.q + ", r: " + data.r;
        }
      });

      // Listen for FPS updates
      window.electron.onMessage('renderer:stats', (stats) => {
        if (fpsEl) {
          fpsEl.textContent = "FPS: " + stats.fps.toFixed(1);
        }
        
        if (statsEl) {
          statsEl.innerHTML = 
            "FPS: " + stats.fps.toFixed(1) + "<br>" +
            "Entities: " + (stats.entityCount || 0) + "<br>" +
            "Draw calls: " + (stats.drawCalls || 0) + "<br>" +
            "Render time: " + (stats.renderTime ? stats.renderTime.toFixed(2) + 'ms' : '-');
        }
      });
      
      // Listen for renderer status updates
      window.electron.onMessage('renderer:status', (status) => {
        statusEl.textContent = 'Renderer: ' + status;
      });
      
      // Listen for renderer errors
      window.electron.onMessage('renderer:error', (error) => {
        console.error('Renderer error:', error);
        statusEl.textContent = 'Renderer Error: ' + error;
        statusEl.style.color = 'red';
      });
    });
  </script>
</body>
</html>`;
}

// App initialization
app.whenReady().then(() => {
  // Set up IPC handlers
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
  // Common IPC channel for all messages
  ipcMain.handle('ipc-message', async (event, request) => {
    const { type, payload, correlationId, responseRequired } = request;
    
    try {
      log.info(`Received IPC message: ${type}`);
      
      // Handle different message types
      switch (type) {
        case 'coordinate:toggleGrid':
          mainWindow.webContents.send('coordinate:action', { type: 'toggleGrid' });
          log.info('Toggled grid visualization');
          return { success: true, message: 'Grid toggled' };
          
        case 'coordinate:toggleHex':
          mainWindow.webContents.send('coordinate:action', { type: 'toggleHex' });
          log.info('Toggled hex visualization');
          return { success: true, message: 'Hex toggled' };
          
        case 'coordinate:toggleDebug':
          mainWindow.webContents.send('coordinate:action', { type: 'toggleDebug' });
          log.info('Toggled debug visualization');
          return { success: true, message: 'Debug toggled' };
          
        case 'coordinate:toggleEffects':
          mainWindow.webContents.send('coordinate:action', { type: 'toggleEffects' });
          log.info('Toggled special effects');
          return { success: true, message: 'Effects toggled' };
          
        case 'coordinate:cycleView':
          mainWindow.webContents.send('coordinate:action', { type: 'cycleView' });
          log.info('Cycled view mode');
          return { success: true, message: 'View cycled' };
          
        case 'coordinate:mouseMove':
          // Forward to renderer process
          if (mainWindow && !mainWindow.isDestroyed()) {
            mainWindow.webContents.send('coordinate:mouseMove', payload);
          }
          // No response needed for mouse movement
          return null;
          
        default:
          log.info(`Unhandled message type: ${type}`);
          return { success: false, error: `Unhandled message type: ${type}` };
      }
    } catch (error) {
      log.error(`Error handling IPC message ${type}: ${error.message}`);
      return { success: false, error: error.message };
    }
  });
  
  // Direct channel for logs (fallback)
  ipcMain.on('renderer:log', (event, message) => {
    log.info(`Renderer: ${message}`);
  });
  
  // Direct channel for errors (fallback)
  ipcMain.on('renderer:error', (event, error) => {
    log.error(`Renderer error: ${error}`);
    
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.send('renderer:error', error);
    }
  });
}
