/**
 * TerraFlux - World Map Test Preload Script
 * 
 * This script exposes APIs for the world map structure test to interact with the Electron main process.
 * It provides functionality for saving and loading serialized world data.
 */

const { contextBridge, ipcRenderer } = require('electron');
const path = require('path');

// Expose terrafluxAPI to the renderer process
contextBridge.exposeInMainWorld('terrafluxAPI', {
  // Save world test data to a file
  saveWorldTest: async (data) => {
    try {
      const result = await ipcRenderer.invoke('world:save-test', data);
      return result;
    } catch (error) {
      console.error('Error saving world test data:', error);
      return {
        success: false,
        error: error.message || 'Unknown error saving world test data'
      };
    }
  },
  
  // Load world test data from a file
  loadWorldTest: async () => {
    try {
      const result = await ipcRenderer.invoke('world:load-test');
      return result;
    } catch (error) {
      console.error('Error loading world test data:', error);
      return {
        success: false,
        error: error.message || 'Unknown error loading world test data'
      };
    }
  },
  
  // Logging functions
  log: async (level, ...args) => {
    return ipcRenderer.invoke('log', level, ...args);
  },
  
  // Event handling
  on: (channel, callback) => {
    const validChannels = ['world:update', 'world:error'];
    
    if (validChannels.includes(channel)) {
      const subscription = (event, ...args) => callback(...args);
      ipcRenderer.on(channel, subscription);
      
      return () => {
        ipcRenderer.removeListener(channel, subscription);
      };
    }
  }
});

// Notify main process that preload has completed
ipcRenderer.send('preload-complete', 'world-test');
