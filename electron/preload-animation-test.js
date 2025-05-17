/**
 * TerraFlux - Animation Test Preload Script
 * 
 * This script provides the interface between the Electron main process
 * and the renderer process for the animation and visual effects test.
 */

const { contextBridge, ipcRenderer } = require('electron');
const path = require('path');

// Default entity configurations for testing
const DEFAULT_ENTITIES = [
  {
    id: 'character1',
    position: { q: 0, r: 0 },
    animations: ['idle', 'walk', 'attack'],
    effects: ['glow', 'damage-text', 'tint']
  },
  {
    id: 'character2',
    position: { q: 1, r: -1 },
    animations: ['walk', 'idle', 'harvest'],
    effects: ['damage-text', 'particles', 'scale']
  },
  {
    id: 'building1',
    position: { q: -1, r: 1 },
    animations: ['construct', 'operate', 'damaged'],
    effects: ['glow', 'tint', 'distortion']
  },
  {
    id: 'resource1',
    position: { q: 2, r: -2 },
    animations: ['default', 'depleting', 'depleted'],
    effects: ['particles', 'text', 'scale']
  }
];

// Expose protected methods that allow the renderer process to use
// Electron APIs and communicate with the main process
contextBridge.exposeInMainWorld('terraflux', {
  // Logging functions
  log: (...args) => {
    console.log('[TerraFlux]', ...args);
    ipcRenderer.send('terraflux:log', args.map(arg => 
      typeof arg === 'object' ? JSON.stringify(arg) : arg
    ).join(' '));
  },
  error: (...args) => {
    console.error('[TerraFlux Error]', ...args);
    ipcRenderer.send('terraflux:error', args.map(arg => 
      typeof arg === 'object' ? JSON.stringify(arg) : arg
    ).join(' '));
  },
  warn: (...args) => {
    console.warn('[TerraFlux Warning]', ...args);
    ipcRenderer.send('terraflux:warn', args.map(arg => 
      typeof arg === 'object' ? JSON.stringify(arg) : arg
    ).join(' '));
  },
  
  // Get version information
  getVersion: () => ipcRenderer.invoke('terraflux:getVersion'),
  
  // Open developer tools
  openDevTools: () => ipcRenderer.invoke('terraflux:openDevTools'),
  
  // Quit application
  quit: () => ipcRenderer.invoke('terraflux:quit'),
  
  // Window management
  minimizeWindow: () => ipcRenderer.invoke('terraflux:minimizeWindow'),
  maximizeWindow: () => ipcRenderer.invoke('terraflux:maximizeWindow'),
  closeWindow: () => ipcRenderer.invoke('terraflux:closeWindow'),
  
  // File system operations
  readFile: (path) => ipcRenderer.invoke('terraflux:readFile', path),
  writeFile: (path, content) => ipcRenderer.invoke('terraflux:writeFile', path, content),
  getAppPath: () => ipcRenderer.invoke('terraflux:getAppPath'),
  
  // Game control
  startGame: () => ipcRenderer.invoke('terraflux:startGame'),
  pauseGame: () => ipcRenderer.invoke('terraflux:pauseGame'),
  resumeGame: () => ipcRenderer.invoke('terraflux:resumeGame'),
  stopGame: () => ipcRenderer.invoke('terraflux:stopGame'),
  
  // Settings
  getSettings: () => ipcRenderer.invoke('terraflux:getSettings'),
  setSetting: (key, value) => ipcRenderer.invoke('terraflux:setSetting', key, value),
  
  // Animation test specific methods
  getEntityConfigs: () => {
    console.log('[TerraFlux] Getting entity configurations');
    return DEFAULT_ENTITIES;
  }
});

console.log('TerraFlux Animation Test preload script loaded');
