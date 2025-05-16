/**
 * TerraFlux - Window Manager
 * 
 * This module exports the window manager functionality to:
 * - Create and configure application windows
 * - Manage window state (position, size, etc.)
 * - Handle window-specific events
 */

const WindowFactory = require('./window-factory');
const WindowState = require('./window-state');

/**
 * Creates the main application window
 * @returns {BrowserWindow} The created main window
 */
function createMainWindow() {
  // Get saved state for main window
  const mainWindowState = WindowState.create('main', {
    width: 1280,
    height: 800,
    minWidth: 800,
    minHeight: 600
  });

  // Create main window with saved state
  const window = WindowFactory.create({
    title: 'TerraFlux',
    x: mainWindowState.x,
    y: mainWindowState.y,
    width: mainWindowState.width,
    height: mainWindowState.height,
    minWidth: mainWindowState.minWidth,
    minHeight: mainWindowState.minHeight,
    show: false,
    backgroundColor: '#2e2c29',
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: require('path').join(__dirname, '../preload.js')
    }
  });

  // Track window state changes
  mainWindowState.track(window);
  
  // Show window when ready to avoid flickering
  window.once('ready-to-show', () => {
    window.show();
    window.focus();
  });

  return window;
}

/**
 * Creates settings window
 * @returns {BrowserWindow} The created settings window
 */
function createSettingsWindow(parentWindow) {
  const settingsWindowState = WindowState.create('settings', {
    width: 800,
    height: 600,
    minWidth: 600,
    minHeight: 500
  });

  const window = WindowFactory.create({
    title: 'TerraFlux Settings',
    parent: parentWindow,
    modal: true,
    x: settingsWindowState.x,
    y: settingsWindowState.y,
    width: settingsWindowState.width,
    height: settingsWindowState.height,
    minWidth: settingsWindowState.minWidth,
    minHeight: settingsWindowState.minHeight,
    show: false,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: require('path').join(__dirname, '../preload.js')
    }
  });

  // Track window state changes
  settingsWindowState.track(window);

  window.once('ready-to-show', () => {
    window.show();
    window.focus();
  });

  return window;
}

module.exports = {
  createMainWindow,
  createSettingsWindow
};
