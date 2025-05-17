/**
 * TerraFlux - World Map System Test Runner
 * 
 * This script launches the Electron application for testing the World Map system.
 * It loads the test environment with appropriate preload scripts and development tools.
 */

const path = require('path');
const { app, BrowserWindow, ipcMain, dialog, screen } = require('electron');
const fs = require('fs');

// Import window state from window manager
const WindowState = require('./electron/window-manager/window-state');

// Import error handling
const errorHandling = require('./electron/error-handling');

// Import file system utilities
const fileSystem = require('./electron/file-system');

// Set environment flags
process.env.TERRAFLUX_TEST_MODE = 'true';
process.env.TERRAFLUX_TEST_TYPE = 'world-map';

// Default save location for test data
const TEST_DATA_DIR = path.join(app.getPath('userData'), 'test-data', 'world-map');

// Create test data directory if it doesn't exist
if (!fs.existsSync(TEST_DATA_DIR)) {
  fs.mkdirSync(TEST_DATA_DIR, { recursive: true });
}

// Handle creating/removing shortcuts on Windows when installing/uninstalling
if (require('electron-squirrel-startup')) {
  app.quit();
}

// Keep a global reference of the window object
let mainWindow;

// Create the browser window
const createWindow = () => {
  try {
    console.log('Creating window...');
    
    // Get saved window state
    const windowState = WindowState.create('world-map-test', {
      width: 1200,
      height: 800,
      minWidth: 800,
      minHeight: 600
    });
    
    // Create the browser window
    mainWindow = new BrowserWindow({
      x: windowState.x,
      y: windowState.y,
      width: windowState.width || 1200,
      height: windowState.height || 800,
      webPreferences: {
        preload: path.join(__dirname, 'electron', 'preload-world-test.js'),
        contextIsolation: true,
        nodeIntegration: false,
        webSecurity: false, // Allow loading local files
      },
      title: 'TerraFlux - World Map System Test',
      backgroundColor: '#333333',
      show: false, // Don't show until ready-to-show
    });
    
    // Add error handlers
    mainWindow.webContents.on('did-fail-load', (event, errorCode, errorDescription) => {
      console.error('Failed to load:', errorCode, errorDescription);
    });
    
    mainWindow.on('unresponsive', () => {
      console.error('Window became unresponsive');
    });
    
    // Only load DevTools in non-production environments
    mainWindow.webContents.openDevTools({ mode: 'detach' });
    
    // Save window state
    windowState.track(mainWindow);
    
    console.log('Checking for HTML file...');
    if (fs.existsSync('./index.html')) {
      console.log('Loading HTML file: index.html');
      mainWindow.loadFile('index.html');
    } else if (fs.existsSync('./temp-world-test.html')) {
      console.log('Loading HTML file: temp-world-test.html');
      // First make sure the HTML file references the bundle
      const content = fs.readFileSync('./temp-world-test.html', 'utf8');
      if (!content.includes('test-world-map-renderer.bundle.js')) {
        console.log('Adding script reference to HTML...');
        const updatedContent = content.replace(
          '</head>',
          '<script src="test-world-map-renderer.bundle.js"></script></head>'
        );
        fs.writeFileSync('./temp-world-test.html', updatedContent);
      }
      mainWindow.loadFile('temp-world-test.html');
    } else {
      console.error('Could not find HTML file to load');
      
      // Create a simple HTML file as fallback
      const fallbackHtml = `<!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>TerraFlux - World Map Test</title>
        <style>
          body { background-color: #222; color: #fff; font-family: Arial, sans-serif; text-align: center; padding: 30px; }
          h1 { color: #0f0; }
          pre { background: #333; padding: 10px; text-align: left; overflow: auto; }
        </style>
        <script src="test-world-map-renderer.bundle.js"></script>
      </head>
      <body>
        <h1>TerraFlux World Map Test</h1>
        <div id="app-container"></div>
      </body>
      </html>`;
      
      const fallbackPath = path.join(__dirname, 'world-map-fallback.html');
      fs.writeFileSync(fallbackPath, fallbackHtml);
      console.log('Created fallback HTML at:', fallbackPath);
      mainWindow.loadFile(fallbackPath);
    }
    
    // Show window when ready
    mainWindow.once('ready-to-show', () => {
      console.log('Window ready to show');
      mainWindow.show();
      mainWindow.focus();
    });
    
    mainWindow.webContents.on('dom-ready', () => {
      console.log('DOM is ready');
    });
    
  } catch (error) {
    console.error('Error creating window:', error);
  }
};

// Create the window when Electron is ready
app.whenReady().then(() => {
  createWindow();
  
  // Setup IPC handlers for world map testing
  setupIPCHandlers();
  
  app.on('activate', () => {
    // On macOS it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

// Quit when all windows are closed, except on macOS
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// Setup IPC handlers for world map testing
function setupIPCHandlers() {
  // Handle saving world test data
  ipcMain.handle('world:save-test', async (event, data) => {
    try {
      const defaultPath = path.join(TEST_DATA_DIR, 'terraflux-world-test.json');
      
      // Ask the user where to save the file
      const { canceled, filePath } = await dialog.showSaveDialog({
        title: 'Save World Test Data',
        defaultPath: defaultPath,
        filters: [
          { name: 'JSON Files', extensions: ['json'] }
        ]
      });
      
      if (canceled) {
        return {
          success: false,
          error: 'User canceled the save operation'
        };
      }
      
      // Save the data to the chosen file
      await fs.promises.writeFile(filePath, JSON.stringify(data, null, 2));
      
      return {
        success: true,
        path: filePath
      };
    } catch (error) {
      console.error('Error saving world test data:', error);
      return {
        success: false,
        error: error.message || 'Error saving world test data'
      };
    }
  });
  
  // Handle loading world test data
  ipcMain.handle('world:load-test', async (event) => {
    try {
      // Ask the user which file to load
      const { canceled, filePaths } = await dialog.showOpenDialog({
        title: 'Load World Test Data',
        defaultPath: TEST_DATA_DIR,
        filters: [
          { name: 'JSON Files', extensions: ['json'] }
        ],
        properties: ['openFile']
      });
      
      if (canceled || filePaths.length === 0) {
        return {
          success: false,
          error: 'User canceled the load operation'
        };
      }
      
      // Load the data from the chosen file
      const filePath = filePaths[0];
      const fileData = await fs.promises.readFile(filePath, 'utf8');
      const worldData = JSON.parse(fileData);
      
      return {
        success: true,
        data: worldData,
        path: filePath
      };
    } catch (error) {
      console.error('Error loading world test data:', error);
      return {
        success: false,
        error: error.message || 'Error loading world test data'
      };
    }
  });
  
  // Handle logging from renderer
  ipcMain.handle('log', async (event, level, ...args) => {
    const logFn = console[level] || console.log;
    logFn(`[World Map Test] `, ...args);
  });
}
