/**
 * TerraFlux - Test Preload Script
 * 
 * Simplified preload script for testing purposes
 */

const { contextBridge, ipcRenderer } = require('electron');

// Log preload script execution
console.log('Preload test script starting...');

// Create custom logger for the renderer process
const rendererLogger = (level, ...args) => {
  console[level]('[Renderer]', ...args);
  // Also send logs to main process
  ipcRenderer.send('log', { level, args });
};

// Inject renderer process console logger
const enhanceConsoleForRenderer = () => {
  // This will be executed in the renderer process
  return `
    console.originalLog = console.log;
    console.originalError = console.error;
    console.originalWarn = console.warn;
    console.originalInfo = console.info;
    
    console.log = (...args) => {
      console.originalLog(...args);
      window.electron.sendLogToMain('log', ...args);
    };
    
    console.error = (...args) => {
      console.originalError(...args);
      window.electron.sendLogToMain('error', ...args);
    };
    
    console.warn = (...args) => {
      console.originalWarn(...args);
      window.electron.sendLogToMain('warn', ...args);
    };
    
    console.info = (...args) => {
      console.originalInfo(...args);
      window.electron.sendLogToMain('info', ...args);
    };
    
    console.originalLog('Enhanced console logging initialized');
  `;
};

// Expose safe APIs to renderer process
contextBridge.exposeInMainWorld('electron', {
  // Send console logs to main process
  sendLogToMain: (level, ...args) => {
    ipcRenderer.send('log', { level, args: args.map(arg => 
      typeof arg === 'object' ? JSON.stringify(arg) : String(arg)
    )});
  },
  
  // Mock settings API for development
  settings: {
    getAll: async () => {
      console.log('Mock settings.getAll called');
      return {
        app: {
          window: {
            rememberSize: true,
            rememberPosition: true,
            startMaximized: false,
          },
          updates: {
            checkOnStartup: true,
            autoDownload: true,
            channel: 'stable'
          }
        },
        game: {
          display: {
            fullscreen: false,
            vsync: true,
            resolution: 'native',
            quality: 'high'
          },
          audio: {
            masterVolume: 0.8,
            musicVolume: 0.7,
            sfxVolume: 0.8
          },
          gameplay: {
            autosave: true,
            autosaveInterval: 5,
            difficultyLevel: 'normal',
            tutorialMode: true
          }
        },
        ui: {
          theme: 'system',
          animations: true,
          notificationLevel: 'all',
          sidebarWidth: 280
        }
      };
    },
    
    get: async (path, defaultValue) => {
      console.log(`Mock settings.get called for path: ${path}, defaultValue:`, defaultValue);
      const pathParts = path.split('.');
      let result;
      
      switch(pathParts[0]) {
        case 'ui':
          if (pathParts[1] === 'theme') result = 'system';
          else if (pathParts[1] === 'animations') result = true;
          break;
        case 'game':
          if (pathParts[1] === 'gameplay') {
            if (pathParts[2] === 'difficultyLevel') result = 'normal';
            else if (pathParts[2] === 'autosave') result = true;
          } else if (pathParts[1] === 'audio') {
            if (pathParts[2] === 'masterVolume') result = 0.8;
            else if (pathParts[2] === 'musicVolume') result = 0.7;
          }
          break;
      }
      
      return result !== undefined ? result : defaultValue;
    },
    
    set: async (path, value) => {
      console.log(`Mock settings.set called for path: ${path}, value:`, value);
      return true; // Pretend it worked
    },
    
    reset: async (path) => {
      console.log(`Mock settings.reset called for path: ${path}`);
      return null; // Return a default value
    },
    
    resetAll: async () => {
      console.log('Mock settings.resetAll called');
      return {}; // Return empty settings
    },
    
    export: async (filePath) => {
      console.log(`Mock settings.export called for filePath:`, filePath);
      return { exported: true, filePath: filePath || 'mock-export-path.json' };
    },
    
    import: async (filePath) => {
      console.log(`Mock settings.import called for filePath:`, filePath);
      return { 
        imported: true, 
        filePath: filePath || 'mock-import-path.json',
        settings: {} 
      };
    }
  },
  
  // Send a message to the main process
  sendMessage: async (channel, data) => {
    try {
      const response = await ipcRenderer.invoke('message', { channel, data });
      console.log(`Response from ${channel}:`, response);
      return response;
    } catch (error) {
      console.error(`Error sending message to ${channel}:`, error);
      throw error;
    }
  },
  
  // Send a message without waiting for a response
  sendMessageNoResponse: (channel, data) => {
    ipcRenderer.send('message-no-response', { channel, data });
  },
  
  // Register a listener for messages from the main process
  onMessage: (channel, callback) => {
    const subscription = (event, ...args) => callback(...args);
    ipcRenderer.on(channel, subscription);
    
    // Return a function to unsubscribe
    return () => {
      ipcRenderer.removeListener(channel, subscription);
    };
  },
  
  // Get app version and info
  getAppInfo: async () => {
    return await ipcRenderer.invoke('get-app-info');
  },
  
  // Basic platform info
  platform: {
    isMac: process.platform === 'darwin',
    isWindows: process.platform === 'win32',
    isLinux: process.platform === 'linux'
  }
});

// Setup renderer log IPC handler
ipcRenderer.on('response', (event, data) => {
  console.log('Received response from main process:', data);
});

// Execute the console enhancement script when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  const script = document.createElement('script');
  script.textContent = enhanceConsoleForRenderer();
  document.head.appendChild(script);
  console.log('Renderer console enhancement script injected');
});

console.log('Preload script initialized');
