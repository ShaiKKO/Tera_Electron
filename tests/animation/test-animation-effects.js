/**
 * TerraFlux - Animation & Visual Effects Test
 * 
 * This script launches a test environment for the animation and visual effects system
 * in an Electron window.
 */

const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const fs = require('fs');
const { createLogger } = require('./electron/error-handling/logger');

// Initialize logger
const logger = createLogger('animation-test');

// Keep a global reference of the window object to avoid garbage collection
let mainWindow;

/**
 * Create the main application window
 */
async function createWindow() {
  logger.info('Creating animation test window');
  
  // Create the browser window
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    title: 'TerraFlux - Animation & Visual Effects Test',
    backgroundColor: '#111111',
    webPreferences: {
      preload: path.join(__dirname, 'electron/preload-animation-test.js'),
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: true,
      webSecurity: true
    }
  });
  
  // Load the test HTML file
  mainWindow.loadFile('temp-animation-test.html');
  
  // Open DevTools for debugging
  mainWindow.webContents.openDevTools({ mode: 'detach' });
  
  // Handle window closed event
  mainWindow.on('closed', () => {
    mainWindow = null;
  });
  
  logger.info('Animation test window created');
}

/**
 * Initialize the application
 */
async function initialize() {
  // Register IPC handlers for preload bridge
  registerIPCHandlers();
  
  // Create the application window
  await createWindow();
}

/**
 * Register IPC handlers for the preload bridge
 */
function registerIPCHandlers() {
  logger.info('Registering IPC handlers');
  
  // Logging handlers
  ipcMain.on('terraflux:log', (event, message) => {
    logger.info(`[Renderer] ${message}`);
  });
  
  ipcMain.on('terraflux:error', (event, message) => {
    logger.error(`[Renderer] ${message}`);
  });
  
  ipcMain.on('terraflux:warn', (event, message) => {
    logger.warn(`[Renderer] ${message}`);
  });
  
  // Window management
  ipcMain.handle('terraflux:openDevTools', () => {
    if (mainWindow) {
      mainWindow.webContents.openDevTools({ mode: 'detach' });
    }
    return true;
  });
  
  ipcMain.handle('terraflux:minimizeWindow', () => {
    if (mainWindow) {
      mainWindow.minimize();
    }
    return true;
  });
  
  ipcMain.handle('terraflux:maximizeWindow', () => {
    if (mainWindow) {
      if (mainWindow.isMaximized()) {
        mainWindow.unmaximize();
      } else {
        mainWindow.maximize();
      }
    }
    return true;
  });
  
  ipcMain.handle('terraflux:closeWindow', () => {
    if (mainWindow) {
      mainWindow.close();
    }
    return true;
  });
  
  ipcMain.handle('terraflux:quit', () => {
    app.quit();
    return true;
  });
  
  // Version information
  ipcMain.handle('terraflux:getVersion', () => {
    return app.getVersion();
  });
  
  // File system operations
  ipcMain.handle('terraflux:readFile', async (event, filePath) => {
    try {
      const data = await fs.promises.readFile(filePath, 'utf8');
      return data;
    } catch (error) {
      logger.error(`Failed to read file ${filePath}:`, error);
      throw error;
    }
  });
  
  ipcMain.handle('terraflux:writeFile', async (event, filePath, content) => {
    try {
      await fs.promises.writeFile(filePath, content, 'utf8');
      return true;
    } catch (error) {
      logger.error(`Failed to write file ${filePath}:`, error);
      throw error;
    }
  });
  
  ipcMain.handle('terraflux:getAppPath', () => {
    return app.getAppPath();
  });
  
  logger.info('IPC handlers registered');
}

// This method will be called when Electron has finished initialization
app.whenReady().then(initialize);

// Quit when all windows are closed
app.on('window-all-closed', () => {
  // On macOS applications keep their menu bar active until Cmd + Q is pressed
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  // On macOS re-create a window when dock icon is clicked and no other windows are open
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

// Log any unhandled errors or rejections
process.on('uncaughtException', (error) => {
  logger.error('Uncaught Exception:', error);
});

process.on('unhandledRejection', (reason) => {
  logger.error('Unhandled Promise Rejection:', reason);
});

// Log application start
logger.info('Animation & Visual Effects Test application started');
