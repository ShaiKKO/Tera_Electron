/**
 * TerraFlux - Settings System Test App
 * 
 * This script tests the Config System with basic settings operations.
 * It shows how to interact with the settings manager and verify its functionality.
 */

const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const settingsManager = require('./electron/config/settings-manager');
const ipcHandler = require('./electron/ipc/index');
const logger = require('./electron/error-handling/logger');

// Keep a global reference of the window object to prevent auto-garbage collection
let mainWindow;

// Create the browser window
function createWindow() {
  // Initialize the settings manager before creating the window
  settingsManager.initialize().then(initialSettings => {
    logger.info('Settings initialized successfully', { initialSettings });
    
    mainWindow = new BrowserWindow({
      width: 1000,
      height: 800,
      webPreferences: {
        nodeIntegration: false, // For security
        contextIsolation: true, // For security
        preload: path.join(__dirname, 'electron/preload.js'), // Use our preload script
      },
      show: false, // Don't show until ready-to-show
    });

    // Register IPC handlers
    ipcHandler.setupIpcHandlers(ipcMain, mainWindow);
    
    // Load the test HTML file for settings testing
    mainWindow.loadFile('src/index.html');
    
    // Show window when ready
    mainWindow.once('ready-to-show', () => {
      mainWindow.show();
      mainWindow.webContents.openDevTools(); // Open DevTools for debugging
    });

    // Handle window closure
    mainWindow.on('closed', () => {
      mainWindow = null;
    });
    
    // Log some test settings operations
    testSettingsOperations().catch(err => {
      logger.error('Error during settings test operations:', err);
    });
  }).catch(err => {
    logger.error('Failed to initialize settings:', err);
  });
}

// Run through a series of test operations on the settings manager
async function testSettingsOperations() {
  try {
    // Show the full current settings
    const allSettings = await settingsManager.getSettings();
    logger.info('All current settings:', allSettings);
    
    // Get specific settings
    const theme = await settingsManager.getSetting('ui.theme');
    const autosave = await settingsManager.getSetting('game.gameplay.autosave');
    logger.info('Current specific settings:', { theme, autosave });
    
    // Modify some settings
    logger.info('Modifying settings...');
    await settingsManager.setSetting('ui.theme', 'dark');
    await settingsManager.setSetting('game.audio.masterVolume', 0.5);
    
    // Get the updated settings
    const updatedSettings = await settingsManager.getSettings();
    logger.info('Updated settings:', updatedSettings);
    
    // Reset a specific setting
    logger.info('Resetting masterVolume setting...');
    await settingsManager.resetSetting('game.audio.masterVolume');
    
    // Check if the setting was reset
    const resetVolume = await settingsManager.getSetting('game.audio.masterVolume');
    logger.info('After reset, masterVolume =', resetVolume);
    
    logger.info('Settings test operations completed successfully.');
  } catch (error) {
    logger.error('Error in settings operations:', error);
    throw error;
  }
}

// App events
app.on('ready', createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (mainWindow === null) {
    createWindow();
  }
});
