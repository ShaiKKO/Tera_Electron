/**
 * TerraFlux - Window State
 * 
 * This module manages window state persistence between application sessions,
 * including position, dimensions, and other state properties.
 */

const { screen } = require('electron');
const path = require('path');
const fs = require('fs');
const Store = require('electron-store');

// Window state data store using electron-store
// Create a store for window state (safely handling any initialization errors)
let windowStateStore;
try {
  windowStateStore = new Store({
    name: 'window-state',
    defaults: {}
  });
} catch (error) {
  console.error('Failed to create window state store:', error);
  windowStateStore = {
    get: () => null,
    set: () => null,
    delete: () => null,
    clear: () => null
  };
}

/**
 * Creates a window state manager for a specific window
 * @param {string} windowName - Unique identifier for the window
 * @param {Object} defaultState - Default window state
 * @returns {Object} Window state manager
 */
function create(windowName, defaultState = {}) {
  if (!windowName) {
    throw new Error('Window name is required for window state management');
  }
  
  // Default window state
  const DEFAULT_STATE = {
    width: 800,
    height: 600,
    minWidth: 400,
    minHeight: 300,
    ...defaultState
  };
  
  // Get previous state from store
  let savedState = windowStateStore.get(windowName);
  
  // Initialize state with defaults and saved values
  let state = {
    ...DEFAULT_STATE,
    ...(savedState || {})
  };
  
  // Get visible area for all displays
  const displays = screen.getAllDisplays();
  
  // Check if saved position would be visible on any currently connected display
  const isStateVisible = () => {
    if (!savedState) return false;
    if (typeof savedState.x !== 'number' || typeof savedState.y !== 'number') return false;
    
    return displays.some(display => {
      const bounds = display.bounds;
      // Check if at least part of the window is visible on this display
      return (
        savedState.x < bounds.x + bounds.width &&
        savedState.x + state.width > bounds.x &&
        savedState.y < bounds.y + bounds.height &&
        savedState.y + state.height > bounds.y
      );
    });
  };
  
  // If saved state is not visible, remove position values
  if (!isStateVisible()) {
    delete state.x;
    delete state.y;
  }
  
  // Function to update and save state
  const saveState = (window) => {
    if (!window.isMinimized() && !window.isMaximized()) {
      const bounds = window.getBounds();
      Object.assign(state, bounds);
    }
    
    // Save maximized state
    state.isMaximized = window.isMaximized();
    state.isFullScreen = window.isFullScreen();
    
    // Update the store
    windowStateStore.set(windowName, state);
  };
  
  // Event handler to track state changes with debouncing
  let debounceTimer;
  const stateChangeHandler = (window) => {
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => saveState(window), 500);
  };
  
  /**
   * Start tracking a window's state
   * @param {BrowserWindow} window - The window to track
   */
  const track = (window) => {
    // Restore maximized state
    if (state.isMaximized) {
      window.maximize();
    }
    
    // Restore full screen state
    if (state.isFullScreen) {
      window.setFullScreen(true);
    }
    
    // Track window state changes
    ['resize', 'move'].forEach(event => {
      window.on(event, () => stateChangeHandler(window));
    });
    
    // Track maximize/unmaximize
    window.on('maximize', () => saveState(window));
    window.on('unmaximize', () => saveState(window));
    
    // Track fullscreen changes
    window.on('enter-full-screen', () => saveState(window));
    window.on('leave-full-screen', () => saveState(window));
    
    // Save state when window is closed
    window.on('close', () => saveState(window));
  };
  
  return {
    ...state,
    track
  };
}

/**
 * Clear all saved window states
 */
function clearAll() {
  windowStateStore.clear();
}

/**
 * Delete state for a specific window
 * @param {string} windowName - Name of the window
 */
function deleteState(windowName) {
  windowStateStore.delete(windowName);
}

module.exports = {
  create,
  clearAll,
  deleteState
};
