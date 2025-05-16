/**
 * TerraFlux - Window Factory
 * 
 * This module is responsible for creating browser windows with consistent
 * configuration and default settings.
 */

const { BrowserWindow, screen } = require('electron');
const path = require('path');
const os = require('os');
const errorHandler = require('../error-handling');

// Default window options
const DEFAULT_OPTIONS = {
  width: 1024,
  height: 768,
  show: false,
  frame: true,
  transparent: false,
  webPreferences: {
    nodeIntegration: false,
    contextIsolation: true,
    enableRemoteModule: false,
    sandbox: true,
    spellcheck: true,
    devTools: process.env.NODE_ENV === 'development'
  }
};

/**
 * Creates a browser window with the specified options
 * @param {Object} options - Options to override defaults
 * @returns {BrowserWindow} Created window instance
 */
function create(options = {}) {
  try {
    // Merge default options with provided options
    const windowOptions = { ...DEFAULT_OPTIONS, ...options };
    
    // Ensure window is on screen (handle multi-monitor setup)
    ensureWindowOnScreen(windowOptions);
    
    // Create the browser window
    const window = new BrowserWindow(windowOptions);
    
    // Set up window event handlers
    setupWindowEventHandlers(window);
    
    return window;
  } catch (error) {
    errorHandler.handleError({
      code: 'WINDOW_CREATION_FAILED',
      message: 'Failed to create browser window',
      details: error,
      severity: 'ERROR'
    });
    
    // Return a fallback window with minimal functionality
    return createFallbackWindow(options);
  }
}

/**
 * Ensures that window position is on a visible screen
 * @param {Object} options - Window options with x, y coordinates
 */
function ensureWindowOnScreen(options) {
  // Check if x and y are specified
  if (typeof options.x === 'number' && typeof options.y === 'number') {
    const displays = screen.getAllDisplays();
    
    // Check if the window would be visible on any display
    const isVisible = displays.some(display => {
      const bounds = display.bounds;
      return (
        options.x >= bounds.x && options.y >= bounds.y &&
        options.x < bounds.x + bounds.width &&
        options.y < bounds.y + bounds.height
      );
    });
    
    // If not visible on any display, reset position
    if (!isVisible) {
      const primaryDisplay = screen.getPrimaryDisplay();
      const { width, height } = primaryDisplay.workAreaSize;
      
      // Center on primary display
      delete options.x;
      delete options.y;
      
      // Set dimensions to fit within primary display
      options.width = Math.min(options.width || DEFAULT_OPTIONS.width, width * 0.9);
      options.height = Math.min(options.height || DEFAULT_OPTIONS.height, height * 0.9);
    }
  }
}

/**
 * Sets up common window event handlers
 * @param {BrowserWindow} window - Window to set up handlers for
 */
function setupWindowEventHandlers(window) {
  // Handle crashes and errors
  window.webContents.on('crashed', (event) => {
    errorHandler.handleError({
      code: 'RENDERER_CRASHED',
      message: 'The renderer process crashed',
      details: event,
      severity: 'ERROR'
    });
  });
  
  window.webContents.on('did-fail-load', (event, errorCode, errorDescription) => {
    if (errorCode !== -3) { // Ignore ERR_ABORTED which happens on redirects
      errorHandler.handleError({
        code: 'PAGE_LOAD_FAILED',
        message: `Failed to load page: ${errorDescription}`,
        details: { errorCode, errorDescription },
        severity: 'WARNING'
      });
    }
  });

  // Log console messages from renderer
  if (process.env.NODE_ENV === 'development') {
    window.webContents.on('console-message', (event, level, message, line, sourceId) => {
      const levels = ['log', 'warning', 'error', 'info'];
      const prefix = sourceId ? `[${path.basename(sourceId)}:${line}]` : '';
      console[levels[level] || 'log'](`${prefix} ${message}`);
    });
  }
}

/**
 * Creates a minimal fallback window when the main window creation fails
 * @param {Object} options - Original window options
 * @returns {BrowserWindow} Fallback window
 */
function createFallbackWindow(options) {
  const fallbackOptions = {
    width: 800,
    height: 600,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true
    },
    title: options.title || 'TerraFlux',
    show: true
  };
  
  return new BrowserWindow(fallbackOptions);
}

module.exports = {
  create,
  DEFAULT_OPTIONS
};
