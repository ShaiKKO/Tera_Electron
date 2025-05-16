/**
 * TerraFlux - Electron Settings Test
 * 
 * This script is used for testing the settings functionality directly within Electron.
 * It loads the actual settings manager and handlers to test the real implementation
 * without launching the full application.
 */

const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const fs = require('fs');
const url = require('url');

// Import settings manager and handlers
const SettingsManager = require('./electron/config/settings-manager');
const { registerSettingsHandlers } = require('./electron/ipc/handlers/settings-handlers');
const { registerAppHandlers } = require('./electron/ipc/handlers/app-handlers');
const { registerWindowHandlers } = require('./electron/ipc/handlers/window-handlers');
const protocol = require('./electron/ipc/protocol');

// Global reference to the window object
let mainWindow;

/**
 * Create the main application window
 */
function createWindow() {
  // Create the browser window
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'electron/preload.js')
    }
  });

  // Load the settings panel directly
  const startUrl = url.format({
    pathname: path.join(__dirname, 'src/index.html'),
    protocol: 'file:',
    slashes: true,
    hash: '/settings'
  });

  mainWindow.loadURL(startUrl);

  // Open DevTools for debugging
  mainWindow.webContents.openDevTools();

  // Register protocol handlers
  protocol.registerProtocolHandlers(ipcMain);
  
  // Register IPC handlers
  registerSettingsHandlers(ipcMain, SettingsManager);
  registerAppHandlers(ipcMain);
  registerWindowHandlers(ipcMain);

  // Handle window close
  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  // Log when settings are loaded
  mainWindow.webContents.on('did-finish-load', () => {
    console.log('Settings panel loaded successfully');
    console.log('-------------------------------------');
    console.log('Current settings:', JSON.stringify(SettingsManager.getAllSettings(), null, 2));
    console.log('-------------------------------------');
    console.log('Test mode: Changes will be saved to the actual settings file');
  });
}

/**
 * Initialize the application
 */
app.whenReady().then(() => {
  console.log('Starting TerraFlux Settings Test');
  
  // Create main window when ready
  createWindow();

  // On macOS, re-create window when the dock icon is clicked
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

/**
 * Quit when all windows are closed, except on macOS
 */
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

/**
 * Print debug info about the environment
 */
console.log(`Electron Version: ${process.versions.electron}`);
console.log(`Chrome Version: ${process.versions.chrome}`);
console.log(`Node.js Version: ${process.versions.node}`);
console.log(`App Path: ${app.getAppPath()}`);
console.log(`Settings Path: ${SettingsManager.getSettingsPath()}`);
