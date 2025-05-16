/**
 * TerraFlux - Main Process Entry Point
 * 
 * This is the entry point for the Electron main process which handles:
 * - Application lifecycle management
 * - Window management
 * - IPC communication with renderer process
 * - File system operations
 * - Native OS integration
 */

const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('path');
const url = require('url');
const fs = require('fs');
const os = require('os');

// Import essential modules
const WindowManager = require('./window-manager');
const ipcModule = require('./ipc');
const ipcHandlers = require('./ipc/handlers');
const errorHandler = require('./error-handling');
const logger = require('./error-handling/logger');
const appMenu = require('./menu');
const fileSystem = require('./file-system');
const settingsManager = require('./config/settings-manager');

// Enable live reload for development
if (process.env.NODE_ENV === 'development') {
  try {
    require('electron-reloader')(module);
  } catch (_) {
    console.log('Electron reloader not available');
  }
}

// Keep global reference of mainWindow to avoid garbage collection
let mainWindow = null;

// Application constants
const APP_VERSION = app.getVersion();
const IS_DEV = process.env.NODE_ENV === 'development';
const APP_NAME = 'TerraFlux';

/**
 * Setup error handlers for graceful crash handling
 */
function setupErrorHandlers() {
  // Initialize error handler with logger
  errorHandler.initialize({
    logger: logger,
    showDialog: true,
    exitOnCritical: true
  });
  
  process.on('uncaughtException', (error) => {
    errorHandler.handleCriticalError(error, 'uncaughtException');
    app.quit();
  });

  process.on('unhandledRejection', (reason) => {
    errorHandler.handleError({
      code: 'UNHANDLED_REJECTION',
      message: reason?.message || 'Unhandled promise rejection',
      details: reason,
      severity: 'ERROR'
    });
  });
}

/**
 * Creates the main application window
 */
function createMainWindow() {
  try {
    // Create main window using WindowManager
    mainWindow = WindowManager.createMainWindow();

    // Log creation
    console.log('Main window created successfully');

    // Load the app from development server or production build
    const startUrl = process.env.ELECTRON_START_URL || url.format({
      pathname: path.join(__dirname, '../build/index.html'),
      protocol: 'file:',
      slashes: true
    });
    
    console.log('Loading URL:', startUrl);
    mainWindow.loadURL(startUrl);
  
    // Open DevTools in development
    if (IS_DEV) {
      mainWindow.webContents.openDevTools({ mode: 'detach' });
    }
  } catch (error) {
    console.error('Error creating main window:', error);
    logger.error('Failed to create main window', { error });
  }

  // Window event handlers
  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  mainWindow.on('unresponsive', () => {
    dialog.showMessageBox(mainWindow, {
      type: 'warning',
      title: 'Application Not Responding',
      message: 'TerraFlux is not responding. Wait for it to recover or restart the application.',
      buttons: ['Wait', 'Restart'],
      defaultId: 0
    }).then(({ response }) => {
      if (response === 1) {
        app.relaunch();
        app.exit();
      }
    });
  });

  // Initialize application menu
  appMenu.setup(mainWindow);

  return mainWindow;
}

/**
 * Register all IPC handlers
 */
function registerIpcHandlers() {
  // Get all handlers from our module
  const handlers = ipcHandlers.registerAllHandlers(mainWindow);
  
  // Initialize IPC system with handlers
  ipcModule.initialize(handlers);
  
  logger.info('IPC handlers registered successfully');
}

/**
 * Initialize settings manager
 * @returns {Promise<boolean>} Whether initialization was successful
 */
async function initializeSettings() {
  try {
    logger.info('Initializing settings manager...');
    const settings = await settingsManager.initialize();
    logger.info('Settings initialized successfully');
    return true;
  } catch (err) {
    logger.error('Failed to initialize settings manager:', err);
    return false;
  }
}

/**
 * Check for single instance lock and create window when ready
 */
const gotTheLock = app.requestSingleInstanceLock();

// Only allow one instance of the app
if (!gotTheLock) {
  app.quit();
} else {
  app.on('second-instance', (event, commandLine, workingDirectory) => {
    // If a second instance is opened, focus the main window
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore();
      mainWindow.focus();
    }
  });

  // App lifecycle event handlers
  app.on('ready', async () => {
    setupErrorHandlers();
    await initializeSettings();
    createMainWindow();
    registerIpcHandlers();
  });

  app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
      app.quit();
    }
  });

  app.on('activate', () => {
    if (mainWindow === null) {
      createMainWindow();
    }
  });

  // macOS: open file handler
  app.on('open-file', (event, filePath) => {
    event.preventDefault();
    if (mainWindow) {
      mainWindow.webContents.send('file-opened', filePath);
    } else {
      // Store the path to be opened when window is created
      app.openFilePath = filePath;
    }
  });
}

// Export for testing purposes
module.exports = {
  createMainWindow,
  getMainWindow: () => mainWindow
};
