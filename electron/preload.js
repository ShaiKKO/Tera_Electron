/**
 * TerraFlux - Preload Script
 *
 * This script runs in the renderer process before the web content loads,
 * providing a secure bridge between the renderer process and the main process
 * through contextIsolation.
 */

const { contextBridge, ipcRenderer } = require('electron');

/**
 * Expose validated IPC communication methods to the renderer process
 */
contextBridge.exposeInMainWorld('electron', {
  /**
   * Settings API for accessing and managing application settings
   */
  settings: {
    /**
     * Get all application settings
     * @returns {Promise<Record<string, any>>} All settings
     */
    getAll: async () => {
      return await ipcRenderer.invoke('ipc-message', {
        type: 'settings:get',
        payload: null,
        timestamp: Date.now(),
        correlationId: generateId(),
        responseRequired: true
      });
    },
    
    /**
     * Get a specific setting value
     * @param {string} path - Dot notation path to the setting
     * @param {any} [defaultValue] - Default value if setting doesn't exist
     * @returns {Promise<any>} The setting value
     */
    get: async (path, defaultValue) => {
      const response = await ipcRenderer.invoke('ipc-message', {
        type: 'settings:get',
        payload: { path, defaultValue },
        timestamp: Date.now(),
        correlationId: generateId(),
        responseRequired: true
      });
      
      return response.value;
    },
    
    /**
     * Set a setting value
     * @param {string} path - Dot notation path to the setting
     * @param {any} value - Value to set
     * @param {boolean} [saveImmediately=true] - Whether to save immediately
     * @returns {Promise<boolean>} Whether the value was changed
     */
    set: async (path, value, saveImmediately = true) => {
      const response = await ipcRenderer.invoke('ipc-message', {
        type: 'settings:set',
        payload: { path, value, saveImmediately },
        timestamp: Date.now(),
        correlationId: generateId(),
        responseRequired: true
      });
      
      return response.changed;
    },
    
    /**
     * Reset a setting to its default value
     * @param {string} path - Dot notation path to the setting
     * @returns {Promise<any>} The default value
     */
    reset: async (path) => {
      const response = await ipcRenderer.invoke('ipc-message', {
        type: 'settings:reset',
        payload: { path },
        timestamp: Date.now(),
        correlationId: generateId(),
        responseRequired: true
      });
      
      return response;
    },
    
    /**
     * Reset all settings to their default values
     * @returns {Promise<Record<string, any>>} The default settings
     */
    resetAll: async () => {
      const response = await ipcRenderer.invoke('ipc-message', {
        type: 'settings:reset',
        payload: null,
        timestamp: Date.now(),
        correlationId: generateId(),
        responseRequired: true
      });
      
      return response.settings;
    },
    
    /**
     * Export settings to a file
     * @param {string} [filePath] - Optional path to export to
     * @returns {Promise<{exported: boolean, filePath?: string, canceled?: boolean}>} Result of the operation
     */
    export: async (filePath) => {
      return await ipcRenderer.invoke('ipc-message', {
        type: 'settings:export',
        payload: filePath ? { filePath } : null,
        timestamp: Date.now(),
        correlationId: generateId(),
        responseRequired: true
      });
    },
    
    /**
     * Import settings from a file
     * @param {string} [filePath] - Optional path to import from
     * @returns {Promise<{imported: boolean, filePath?: string, settings?: Record<string, any>, canceled?: boolean}>} Result of the operation
     */
    import: async (filePath) => {
      return await ipcRenderer.invoke('ipc-message', {
        type: 'settings:import',
        payload: filePath ? { filePath } : null,
        timestamp: Date.now(),
        correlationId: generateId(),
        responseRequired: true
      });
    },
  },
  
  /**
   * Send a message to the main process via IPC
   * @param {string} type - Message type/channel
   * @param {any} [payload] - Message payload
   * @returns {Promise<any>} Response from the main process
   */
  async sendMessage(type, payload) {
    if (typeof type !== 'string') {
      throw new TypeError('Message type must be a string');
    }

    try {
      // Create a properly structured IPC request
      const request = {
        type,
        payload,
        timestamp: Date.now(),
        correlationId: generateId(),
        responseRequired: true
      };

      // Send to main process and wait for response  
      return await ipcRenderer.invoke('ipc-message', request);
    } catch (error) {
      console.error(`Error sending IPC message (${type}):`, error);
      throw error;
    }
  },

  /**
   * Send a message to the main process without waiting for a response
   * @param {string} type - Message type/channel
   * @param {any} [payload] - Message payload
   */
  sendMessageNoResponse(type, payload) {
    if (typeof type !== 'string') {
      throw new TypeError('Message type must be a string');
    }

    try {
      // Create a properly structured IPC request
      const request = {
        type,
        payload,
        timestamp: Date.now(),
        correlationId: generateId(),
        responseRequired: false
      };

      // Send to main process without waiting
      ipcRenderer.invoke('ipc-message', request).catch(error => {
        console.error(`Error in sendMessageNoResponse (${type}):`, error);
      });
    } catch (error) {
      console.error(`Error sending IPC message (${type}):`, error);
    }
  },

  /**
   * Register a handler for messages/events from the main process
   * @param {string} channel - Channel to listen on
   * @param {Function} callback - Callback function
   * @returns {Function} Function to unregister the handler
   */
  onMessage(channel, callback) {
    if (typeof channel !== 'string') {
      throw new TypeError('Channel must be a string');
    }
    
    if (typeof callback !== 'function') {
      throw new TypeError('Callback must be a function');
    }

    // Wrap the callback to protect against prototype pollution
    const safeCallback = (event, ...args) => callback(...args);
    
    // Add the listener
    ipcRenderer.on(channel, safeCallback);
    
    // Return a function to remove the listener
    return () => {
      ipcRenderer.removeListener(channel, safeCallback);
    };
  },
  
  /**
   * Register a handler for a one-time message from the main process
   * @param {string} channel - Channel to listen on
   * @param {Function} callback - Callback function
   */
  onMessageOnce(channel, callback) {
    if (typeof channel !== 'string') {
      throw new TypeError('Channel must be a string');
    }
    
    if (typeof callback !== 'function') {
      throw new TypeError('Callback must be a function');
    }

    // Wrap the callback to protect against prototype pollution
    const safeCallback = (event, ...args) => callback(...args);
    
    // Add the one-time listener
    ipcRenderer.once(channel, safeCallback);
  },

  /**
   * Get application information
   * @returns {Promise<Object>} Application information
   */
  async getAppInfo() {
    return await ipcRenderer.invoke('ipc-message', {
      type: 'app:get-info',
      timestamp: Date.now(),
      correlationId: generateId(),
      responseRequired: true
    });
  },
  
  /**
   * Return platform information
   * @returns {Object} Platform information
   */
  platform: {
    isMac: process.platform === 'darwin',
    isWindows: process.platform === 'win32',
    isLinux: process.platform === 'linux',
    processType: process.type,
    processVersion: process.versions,
  },
  
  /**
   * Game-specific API for interacting with the Electron main process
   */
  // Send game state updates to main process
  sendGameState: (state) => {
    ipcRenderer.send('game:state', state);
  },
  
  // Send game stats to main process
  sendGameStats: (stats) => {
    ipcRenderer.send('game:stats', stats);
  },
  
  // Send game log messages to main process
  sendGameLog: (message) => {
    ipcRenderer.send('game:log', message);
  },
  
  // Send game errors to main process
  sendGameError: (error) => {
    ipcRenderer.send('game:error', error);
  },
  
  // Register for game initialization events from main process
  onGameInit: (callback) => {
    ipcRenderer.on('game:init', (event, config) => callback(config));
    return () => ipcRenderer.removeListener('game:init', callback);
  }
});

/**
 * Generate a simple unique ID for correlation
 * @returns {string} Generated ID
 */
function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).substr(2, 5);
}

// Log successful preload
console.log('TerraFlux preload script initialized');
