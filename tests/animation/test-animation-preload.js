/**
 * TerraFlux - Animation and Visual Effects Test Preload Script
 * 
 * Provides secure IPC communication between renderer and main processes
 */

const { contextBridge, ipcRenderer } = require('electron');

// Expose protected methods that allow the renderer process to use the ipcRenderer
contextBridge.exposeInMainWorld('terraflux', {
  // Get entity configurations for testing
  getEntityConfigs: () => ipcRenderer.invoke('get-entity-configs'),
  
  // Log from renderer to main process console
  log: (...args) => ipcRenderer.invoke('log-renderer', ...args),
  
  // Performance monitoring
  reportPerformance: (stats) => ipcRenderer.invoke('report-performance', stats)
});
