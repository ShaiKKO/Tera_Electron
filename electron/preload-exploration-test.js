/**
 * TerraFlux - Exploration System Test Preload Script
 * 
 * This preload script provides IPC bridge functionality for the 
 * exploration system test, allowing the renderer to communicate with the main process.
 */

const { contextBridge, ipcRenderer } = require('electron');

// Communication protocol for main <-> renderer
contextBridge.exposeInMainWorld('terraflux', {
  // System utilities
  logMessage: (level, message, data) => {
    ipcRenderer.send('log-message', level, message, data);
  },
  
  // Game utilities
  saveGameData: (key, data) => {
    return ipcRenderer.invoke('save-game-data', key, data);
  },
  loadGameData: (key) => {
    return ipcRenderer.invoke('load-game-data', key);
  },
  
  // Testing utilities
  sendTestResult: (name, result) => {
    ipcRenderer.send('test-result', name, result);
  },
  
  // Version info
  getVersion: () => {
    return ipcRenderer.invoke('get-version');
  },
  
  // Performance metrics
  reportPerformance: (metric) => {
    ipcRenderer.send('performance-metric', metric);
  }
});

// Notify renderer that preload is complete
window.addEventListener('DOMContentLoaded', () => {
  // Signal renderer that Electron APIs are ready
  window.dispatchEvent(new Event('terraflux-api-ready'));
  
  // Pass environment info to renderer (dev/prod)
  const isDev = process.env.NODE_ENV !== 'production';
  document.documentElement.setAttribute('data-environment', isDev ? 'dev' : 'prod');
});
